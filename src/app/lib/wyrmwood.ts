// Wyrmwood accessory — a shallow slab whose plan-view shape is a trapezoid
// with vertical walls and radiused corners.
//
// Compartments are themselves trapezoids that fill the full inner cavity
// (the outer trapezoid offset inwards by wall thickness). The split tree
// subdivides the trapezoid: horizontal splits (along Y) produce narrower
// trapezoid rows; vertical splits (along X) produce columns whose outer
// edges follow the trapezoid angle while inward-facing edges stay vertical.
// This means the first and last column in a row are trapezoidal (angled
// outer wall), while interior columns are rectangular — they fall out of
// the layout function without needing any envelope intersection.
//
// replicad is injected (same as model.ts) so this runs inside the worker where
// the WASM kernel is live.

import { type CellCustomization, type Rect, type SplitNode, type TrayPart } from "./model";
import type { Replicad } from "./replicad-types";

// biome-ignore lint/suspicious/noExplicitAny: replicad boolean/loft chains union to broad types
type Solid = any;

// ---------------------------------------------------------------------------
// Trapezoid layout types & functions
// ---------------------------------------------------------------------------

// A trapezoidal region used for recursive cell layout.
// The left and right edges are each linear in Y
//   leftEdge(y)  = xLeftBack  + (y - yBack) * (xLeftFront  - xLeftBack)  / (yFront - yBack)
//   rightEdge(y) = xRightBack + (y - yBack) * (xRightFront - xRightBack) / (yFront - yBack)
type TrapezoidRect = {
  yBack: number;
  yFront: number;
  xLeftBack: number;
  xRightBack: number;
  xLeftFront: number;
  xRightFront: number;
};

// A leaf cell in the wyrmwood layout. Corners are [x, y] in order:
//   back-left → back-right → front-right → front-left
export type TrapezoidCell = {
  id: string;
  customization: CellCustomization;
  corners: [[number, number], [number, number], [number, number], [number, number]];
};

// The inner envelope as a TrapezoidRect — the full cavity that compartments fill.
function innerEnvelopeRect(p: WyrmwoodParams): TrapezoidRect {
  const w = p.wallThickness;
  const outerBw = backWidth(p);
  const innerFw = Math.max(2, p.width - 2 * w);
  const innerBw = Math.max(2, outerBw - 2 * w);
  const innerL = Math.max(2, p.length - 2 * w);
  const hw = innerL / 2;
  return {
    yBack: -hw,
    yFront: hw,
    xLeftBack: -innerBw / 2,
    xRightBack: innerBw / 2,
    xLeftFront: -innerFw / 2,
    xRightFront: innerFw / 2,
  };
}

// Recursively split a trapezoid region according to the split tree.
//
// For horizontal splits (along Y), children are rows — each is a proper
// trapezoid sharing the same side angle as the parent.
//
// For vertical splits (along X), children are columns.  The first and last
// children inherit the parent's angled outer edges; inward-facing edges
// (between columns) are always vertical (straight).
export function layoutWyrmwoodCells(
  node: SplitNode,
  rect: TrapezoidRect,
  wall: number,
): TrapezoidCell[] {
  const children = node.children ?? [];
  if (children.length === 0) {
    return [
      {
        id: node.id,
        customization: node.customization,
        corners: [
          [rect.xLeftBack, rect.yBack],
          [rect.xRightBack, rect.yBack],
          [rect.xRightFront, rect.yFront],
          [rect.xLeftFront, rect.yFront],
        ],
      },
    ];
  }

  const isAlongX = node.splitType === "vertical";
  const total = isAlongX
    ? rect.xRightBack - rect.xLeftBack
    : rect.yFront - rect.yBack;
  const usable = total - (children.length - 1) * wall;

  let cursor = isAlongX ? rect.xLeftBack : rect.yBack;
  const cells: TrapezoidCell[] = [];

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const size = (child.size ?? 1 / children.length) * usable;
    const isFirst = i === 0;
    const isLast = i === children.length - 1;
    const yLen = rect.yFront - rect.yBack;

    let childRect: TrapezoidRect;

    if (isAlongX) {
      // Vertical split → columns.
      // Column edges at the cursor positions (walls are vertical).
      const xLeft = cursor;
      const xRight = cursor + size;

      childRect = {
        yBack: rect.yBack,
        yFront: rect.yFront,
        xLeftBack: xLeft,
        // Only the first child gets the trapezoid's angled left edge
        xLeftFront: isFirst ? rect.xLeftFront : xLeft,
        xRightBack: xRight,
        // Only the last child gets the trapezoid's angled right edge
        xRightFront: isLast ? rect.xRightFront : xRight,
      };
    } else {
      // Horizontal split → rows.
      // Each row is a smaller trapezoid whose left/right edges interpolate
      // linearly between the parent's back and front.
      const yLow = cursor;
      const yHigh = cursor + size;
      const tLow = (yLow - rect.yBack) / yLen;
      const tHigh = (yHigh - rect.yBack) / yLen;

      childRect = {
        yBack: yLow,
        yFront: yHigh,
        xLeftBack: rect.xLeftBack + tLow * (rect.xLeftFront - rect.xLeftBack),
        xRightBack: rect.xRightBack + tLow * (rect.xRightFront - rect.xRightBack),
        xLeftFront: rect.xLeftBack + tHigh * (rect.xLeftFront - rect.xLeftBack),
        xRightFront: rect.xRightBack + tHigh * (rect.xRightFront - rect.xRightBack),
      };
    }

    cells.push(...layoutWyrmwoodCells(child, childRect, wall));
    cursor += size + wall;
  }

  return cells;
}

export type WyrmwoodParams = {
  width: number; // Front (wider) edge width (mm), along X
  length: number; // Front-to-back depth (mm), along Y
  thickness: number; // Overall height (mm)
  interiorAngle: number; // Interior angle of the trapezoid in plan view (°). 90° = rectangle, lower = more taper
  cornerRadius: number; // Plan-view corner radius
  wallThickness: number;
  floorThickness: number;
  bottomFillet: number; // Scoop radius where the pocket walls meet the floor

  // --- Magnets (UI-only per spec: parameters are wired, pockets are cut, but
  // no retention geometry or tolerance tuning has been designed) ---
  magnetsEnabled: boolean;
  magnetCount: number;
  magnetDiameter: number;
  magnetDepth: number;
  magnetInset: number; // Distance from each end of the long side

  // --- Card slot (UI-only per spec: no geometry is cut) ---
  cardSlotEnabled: boolean;
  cardSlotWidth: number;
  cardSlotLength: number;

  modelName: string;
};

export const defaultWyrmwoodParams: WyrmwoodParams = {
  width: 180,
  length: 90,
  thickness: 12,
  interiorAngle: 80,
  cornerRadius: 6,
  wallThickness: 2,
  floorThickness: 2,
  bottomFillet: 3,
  magnetsEnabled: true,
  magnetCount: 4,
  magnetDiameter: 6,
  magnetDepth: 2,
  magnetInset: 15,
  cardSlotEnabled: false,
  cardSlotWidth: 66,
  cardSlotLength: 92,
  modelName: "",
};

// Width of the back (narrower) end at y = -length/2.
function backWidth(p: WyrmwoodParams): number {
  const rad = (p.interiorAngle * Math.PI) / 180;
  const taper = p.length / Math.tan(rad);
  return Math.max(4, p.width - 2 * taper);
}

// The inscribed rectangle at the narrower back end of the trapezoid cavity.
// Used by PlanView for the 2D cell overlay (the 3D pockets now fill the full
// trapezoid cavity directly).
export function topRect(p: WyrmwoodParams): Rect {
  const innerBw = Math.max(2, backWidth(p) - 2 * p.wallThickness);
  const innerL = Math.max(2, p.length - 2 * p.wallThickness);
  return { x: -innerBw / 2, y: -innerL / 2, w: innerBw, h: innerL };
}

// Metadata for the 2D plan view: the trapezoid's outer dimensions and the
// inscribed rectangle where cells are laid out (origin at 0,0 for PlanView's
// coordinate system).
export function wyrmwoodPlanMeta(p: WyrmwoodParams) {
  const bw = backWidth(p);
  const tr = topRect(p);
  return {
    frontWidth: p.width,
    backWidth: bw,
    length: p.length,
    cornerRadius: p.cornerRadius,
    wallThickness: p.wallThickness,
    // PlanView expects innerRect at (0,0); topRect is centered.
    innerRect: { x: 0, y: 0, w: tr.w, h: tr.h },
  };
}

// Draw a symmetric trapezoid centered at origin. Parallel edges run along X;
// the front (+Y) edge has width `fw`, the back (-Y) edge has width `bw`.
function trapezoidProfile(
  r: Replicad,
  fw: number,
  bw: number,
  len: number,
) {
  const hl = len / 2;
  return r
    .draw()
    .movePointerTo([-fw / 2, hl])
    .hLine(fw)
    .line((bw - fw) / 2, -len)
    .hLine(-bw)
    .close();
}

function buildOuter(r: Replicad, p: WyrmwoodParams): Solid {
  const bw = backWidth(p);
  const shape: Solid = trapezoidProfile(r, p.width, bw, p.length)
    .sketchOnPlane("XY", 0)
    .extrude(p.thickness);
  return shape.fillet(p.cornerRadius, (e: Solid) => e.inDirection("Z"));
}

// Magnet pockets bored into the front face (+Y), evenly spaced in X.
function cutMagnets(r: Replicad, body: Solid, p: WyrmwoodParams): Solid {
  const count = Math.max(0, Math.round(p.magnetCount));
  if (!p.magnetsEnabled || count === 0 || p.magnetDiameter <= 0) {
    return body;
  }

  // Space the pockets across the usable front span, inset from both ends.
  const innerFw = Math.max(0, p.width - 2 * p.wallThickness);
  const span = Math.max(0, innerFw - 2 * p.magnetInset);
  const step = count > 1 ? span / (count - 1) : 0;
  const startX = count > 1 ? -span / 2 : 0;
  const z = Math.min(p.thickness / 2, p.thickness - p.magnetDiameter / 2 - 0.5);

  let out = body;
  for (let i = 0; i < count; i++) {
    const pocket: Solid = r
      .sketchCircle(p.magnetDiameter / 2, { plane: "XZ" })
      .extrude(p.magnetDepth)
      .translate([startX + i * step, p.length / 2, z]);
    out = out.cut(pocket);
  }

  return out;
}

export function buildWyrmwood(
  r: Replicad,
  p: WyrmwoodParams,
  structure: SplitNode | null,
): TrayPart[] {
  let body: Solid = buildOuter(r, p);

  if (structure) {
    const envRect = innerEnvelopeRect(p);
    const cells = layoutWyrmwoodCells(structure, envRect, p.wallThickness);

    for (const { corners, customization } of cells) {
      const [bl, br, fr, fl] = corners;

      // Bottom fillet cap: how much material is above the floor
      const cellDepth = p.thickness - p.floorThickness;

      // Minimum characteristic dimension of this cell (at back, front, height)
      const backW = Math.abs(br[0] - bl[0]);
      const frontW = Math.abs(fr[0] - fl[0]);
      const cellH = Math.abs(fr[1] - br[1]);
      const minDim = Math.min(backW, frontW, cellH);

      const scoop = Math.max(
        0,
        Math.min(
          customization?.bottomFillet ?? p.bottomFillet,
          cellDepth - 0.2,
          minDim * 0.5 - 0.2,
        ),
      );

      const corner = Math.max(0.4, Math.min(2, minDim * 0.5 - 0.1));

      // Draw the trapezoid polygon as a sketch on the XY plane at the
      // floor, then extrude upward through the top of the body.
      let prism: Solid = r
        .draw()
        .movePointerTo(bl)
        .line(br[0] - bl[0], br[1] - bl[1])
        .line(fr[0] - br[0], fr[1] - br[1])
        .line(fl[0] - fr[0], fl[1] - fr[1])
        .close()
        .sketchOnPlane("XY", p.floorThickness)
        .extrude(cellDepth + 1);

      if (scoop > 0.2) {
        prism = prism.fillet(scoop, (e: Solid) => e.inPlane("XY", p.floorThickness));
      }

      if (corner > 0.4) {
        prism = prism.fillet(corner, (e: Solid) => e.inDirection("Z"));
      }

      body = body.cut(prism);
    }
  }

  body = cutMagnets(r, body, p);

  const baseName = p.modelName.trim() || "wyrmwood-accessory";
  return [{ name: `${baseName} - tray`, shape: body }];
}
