// Token Tray (FDM) parametric model.
//
// Adapted from the reverse-engineered replicad generator (see token-tray-fdm.js
// at the repo root) into TypeScript, with the split tree promoted to a fully
// editable structure that the UI mutates.

import type { Replicad } from "./replicad-types";

export type SplitType = "vertical" | "horizontal" | null;

export interface CellCustomization {
  depth: number | null;
  bottomFillet: number | null;
}

export interface SplitNode {
  id: string;
  size: number; // fraction of the parent (siblings sum to 1)
  splitType: SplitType;
  children: SplitNode[];
  customization: CellCustomization;
}

export interface TrayParams {
  width: number; // outer X dimension (mm)
  height: number; // outer Y dimension (mm)
  depth: number; // outer Z dimension (mm)
  outerWallThickness: number;
  wallThickness: number; // separator walls
  sideFillet: number; // outer vertical corner radius
  bottomFillet: number; // scoop radius at compartment bottoms
  rimFillet: number; // small rounding of the top rim
}

export const defaultParams: TrayParams = {
  width: 170,
  height: 77,
  depth: 25,
  outerWallThickness: 1.8,
  wallThickness: 1.2,
  sideFillet: 3,
  bottomFillet: 6,
  rimFillet: 0.4,
};

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function leaf(size = 1): SplitNode {
  return {
    id: uid(),
    size,
    splitType: null,
    children: [],
    customization: { depth: null, bottomFillet: null },
  };
}

// Default structure equivalent to what the site ships with.
export function defaultStructure(): SplitNode {
  return {
    id: uid(),
    size: 1,
    splitType: "vertical",
    customization: { depth: null, bottomFillet: null },
    children: [
      {
        id: uid(),
        size: 0.4,
        splitType: "horizontal",
        customization: { depth: null, bottomFillet: null },
        children: [
          { ...leaf(0.3) },
          {
            ...leaf(0.7),
            customization: { depth: 12, bottomFillet: null },
          },
        ],
      },
      {
        id: uid(),
        size: 0.6,
        splitType: "horizontal",
        customization: { depth: null, bottomFillet: null },
        children: [
          { ...leaf(0.25) },
          { ...leaf(0.25), customization: { depth: null, bottomFillet: 3 } },
          { ...leaf(0.5) },
        ],
      },
    ],
  };
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LeafCell {
  id: string;
  rect: Rect;
  customization: CellCustomization;
}

// Recursively turn the split tree into leaf rectangles. rect = { x, y, w, h }
// with x,y the lower-left corner.
export function layoutCells(
  node: SplitNode,
  rect: Rect,
  wall: number
): LeafCell[] {
  const children = node.children ?? [];
  if (!children.length)
    return [{ id: node.id, rect, customization: node.customization }];

  const alongX = node.splitType === "vertical";
  const total = alongX ? rect.w : rect.h;
  const usable = total - (children.length - 1) * wall;

  let cursor = alongX ? rect.x : rect.y;
  const cells: LeafCell[] = [];
  for (const child of children) {
    const size = (child.size ?? 1 / children.length) * usable;
    const childRect: Rect = alongX
      ? { x: cursor, y: rect.y, w: size, h: rect.h }
      : { x: rect.x, y: cursor, w: rect.w, h: size };
    cells.push(...layoutCells(child, childRect, wall));
    cursor += size + wall;
  }
  return cells;
}

// Build the solid. `replicad` is injected so this runs inside the worker where
// the OpenCascade WASM kernel has been initialised.
export function buildTray(
  replicad: Replicad,
  params: TrayParams,
  structure: SplitNode
) {
  const {
    width,
    height,
    depth,
    outerWallThickness,
    wallThickness,
    sideFillet,
    bottomFillet,
    rimFillet,
  } = params;
  const { drawRoundedRectangle } = replicad;

  // replicad's boolean/extrude ops return broad shape unions; treat the
  // running solid as `any` so we can chain fillet/cut without fighting TS.
  let body: any = drawRoundedRectangle(width, height, sideFillet)
    .sketchOnPlane("XY")
    .extrude(depth);

  const inner: Rect = {
    x: -width / 2 + outerWallThickness,
    y: -height / 2 + outerWallThickness,
    w: width - 2 * outerWallThickness,
    h: height - 2 * outerWallThickness,
  };

  const innerCorner = Math.max(sideFillet - outerWallThickness, 0.5);
  const cells = layoutCells(structure, inner, wallThickness);

  for (const { rect, customization } of cells) {
    const custom = customization ?? { depth: null, bottomFillet: null };
    const cellDepth = Math.min(
      custom.depth ?? depth - outerWallThickness,
      depth - outerWallThickness
    );
    const floorZ = depth - cellDepth;

    const scoop = Math.max(
      0,
      Math.min(
        custom.bottomFillet ?? bottomFillet,
        cellDepth - 0.2,
        rect.w / 2 - 0.2,
        rect.h / 2 - 0.2
      )
    );
    const corner = Math.min(innerCorner, rect.w / 2 - 0.1, rect.h / 2 - 0.1);

    let pocket: any = drawRoundedRectangle(rect.w, rect.h, corner)
      .translate(rect.x + rect.w / 2, rect.y + rect.h / 2)
      .sketchOnPlane("XY", floorZ)
      .extrude(depth - floorZ + 1);

    if (scoop > 0.2) {
      pocket = pocket.fillet(scoop, (e: any) => e.inPlane("XY", floorZ));
    }

    body = body.cut(pocket);
  }

  if (rimFillet > 0) {
    body = body.fillet(Math.min(rimFillet, wallThickness / 2.5), (e: any) =>
      e.inPlane("XY", depth)
    );
  }

  return body;
}
