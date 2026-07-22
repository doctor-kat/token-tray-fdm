// Wyrmwood accessory — a shallow slab whose walls draft inwards, so its
// cross-section is a trapezoid, with radiused corners in plan.
//
// The defining trick is how the compartments meet the sloping wall. Cells are
// laid out on the TOP face, then each pocket is cut as a plain vertical prism
// intersected with the inner draft envelope. Interior pockets are unaffected
// and stay prismatic; pockets on the outside edge get their outer face sloped
// away by the envelope, so the first and last pocket in a row genuinely differ
// in area and volume from their neighbours. That falls out of the intersection
// rather than needing per-cell special-casing.
//
// replicad is injected (same as model.ts) so this runs inside the worker where
// the WASM kernel is live.

import { layoutCells, type Rect, type SplitNode, type TrayPart } from "./model";
import type { Replicad } from "./replicad-types";

// biome-ignore lint/suspicious/noExplicitAny: replicad boolean/loft chains union to broad types
type Solid = any;

export type WyrmwoodParams = {
  width: number; // Base footprint X (mm), the widest face
  length: number; // Base footprint Y (mm)
  thickness: number; // Overall height (mm)
  draftAngle: number; // Degrees the walls lean inwards, measured from vertical
  cornerRadius: number; // Plan-view corner radius at the base
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
  draftAngle: 10,
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

// How far each wall leans in over the full height.
export function draftInset(p: WyrmwoodParams): number {
  return p.thickness * Math.tan((p.draftAngle * Math.PI) / 180);
}

// The top face is the base inset by the draft on every side. Compartments are
// laid out here, since it's the opening the user actually reaches into.
export function topRect(p: WyrmwoodParams): Rect {
  const inset = draftInset(p);
  const w = Math.max(4, p.width - 2 * inset);
  const l = Math.max(4, p.length - 2 * inset);
  return { x: -w / 2, y: -l / 2, w, h: l };
}

// A rounded-rect prism lofted between two plan sizes — the trapezoid section.
function draftedSlab(
  r: Replicad,
  {
    bottomW,
    bottomL,
    topW,
    topL,
    bottomR,
    topR,
    z0,
    z1,
  }: {
    bottomW: number;
    bottomL: number;
    topW: number;
    topL: number;
    bottomR: number;
    topR: number;
    z0: number;
    z1: number;
  },
): Solid {
  const lower: Solid = r
    .drawRoundedRectangle(
      bottomW,
      bottomL,
      Math.max(0, Math.min(bottomR, bottomW / 2, bottomL / 2)),
    )
    .sketchOnPlane("XY", z0);
  const upper: Solid = r
    .drawRoundedRectangle(topW, topL, Math.max(0, Math.min(topR, topW / 2, topL / 2)))
    .sketchOnPlane("XY", z1);
  return lower.loftWith(upper);
}

function buildOuter(r: Replicad, p: WyrmwoodParams): Solid {
  const inset = draftInset(p);
  return draftedSlab(r, {
    bottomW: p.width,
    bottomL: p.length,
    topW: p.width - 2 * inset,
    topL: p.length - 2 * inset,
    bottomR: p.cornerRadius,
    // The corner radius shrinks with the footprint as the wall leans in.
    topR: Math.max(0.5, p.cornerRadius - inset),
    z0: 0,
    z1: p.thickness,
  });
}

// The cavity the pockets are allowed to occupy: the outer form pulled in by the
// wall thickness, and lifted to sit on the floor. Overshoots the top so pockets
// break through cleanly.
function buildInnerEnvelope(r: Replicad, p: WyrmwoodParams): Solid {
  const inset = draftInset(p);
  const w = p.wallThickness;
  const bottomW = Math.max(2, p.width - 2 * w);
  const bottomL = Math.max(2, p.length - 2 * w);
  return draftedSlab(r, {
    bottomW,
    bottomL,
    topW: Math.max(1, bottomW - 2 * inset),
    topL: Math.max(1, bottomL - 2 * inset),
    bottomR: Math.max(0.5, p.cornerRadius - w),
    topR: Math.max(0.5, p.cornerRadius - w - inset),
    z0: p.floorThickness,
    z1: p.thickness + 1,
  });
}

// Magnet pockets bored into the single long side (+Y), evenly spaced in X.
function cutMagnets(r: Replicad, body: Solid, p: WyrmwoodParams): Solid {
  const count = Math.max(0, Math.round(p.magnetCount));
  if (!p.magnetsEnabled || count === 0 || p.magnetDiameter <= 0) {
    return body;
  }

  const top = topRect(p);
  // Space the pockets across the usable span, inset from both ends.
  const span = Math.max(0, top.w - 2 * p.magnetInset);
  const step = count > 1 ? span / (count - 1) : 0;
  const startX = count > 1 ? -span / 2 : 0;
  const z = Math.min(p.thickness / 2, p.thickness - p.magnetDiameter / 2 - 0.5);

  let out = body;
  for (let i = 0; i < count; i++) {
    // Cylinder axis along Y, drilled inwards from the long side.
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
    const envelope = buildInnerEnvelope(r, p);
    const cells = layoutCells(structure, topRect(p), p.wallThickness);

    for (const { rect } of cells) {
      const corner = Math.max(0.4, Math.min(2, rect.w / 2 - 0.1, rect.h / 2 - 0.1));
      // A plain vertical prism...
      let prism: Solid = r
        .drawRoundedRectangle(rect.w, rect.h, corner)
        .translate(rect.x + rect.w / 2, rect.y + rect.h / 2)
        .sketchOnPlane("XY", p.floorThickness)
        .extrude(p.thickness - p.floorThickness + 1);

      // Round where the pocket walls meet its floor. Done before the clip, so
      // it acts on the prism's own simple edge loop rather than the trimmed
      // solid's. Capped against the cell and the depth available above it.
      const scoop = Math.max(
        0,
        Math.min(
          p.bottomFillet,
          p.thickness - p.floorThickness - 0.2,
          rect.w / 2 - 0.2,
          rect.h / 2 - 0.2,
        ),
      );
      if (scoop > 0.2) {
        prism = prism.fillet(scoop, (e: Solid) => e.inPlane("XY", p.floorThickness));
      }

      // ...clipped to the drafted cavity, which is what bevels the edge cells.
      body = body.cut(prism.intersect(envelope.clone()));
    }
  }

  body = cutMagnets(r, body, p);

  const baseName = p.modelName.trim() || "wyrmwood-accessory";
  return [{ name: `${baseName} - tray`, shape: body }];
}
