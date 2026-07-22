// Lid geometry for the Advanced options — ported from the reference site's real
// replicad generator (see docs/lid-geometry.md). Three printable lid types plus
// the tray-side rail groove the sliding lid needs.
//
// replicad is injected (same as model.ts) so these run inside the worker where
// the WASM kernel is live. Chained boolean/fillet results are typed `any`
// deliberately — the running solids union to broad shape types.

import type { LeafCell, TrayParams } from "./model";
import type { Replicad } from "./replicad-types";

// biome-ignore lint/suspicious/noExplicitAny: replicad boolean/fillet chains union to broad types
type Solid = any;

// A centered rectangular prism sitting on XY (bottom at z=0).
function box(r: Replicad, w: number, h: number, d: number): Solid {
  return r.sketchRectangle(w, h).extrude(d);
}

// Rounded box, hollowed to a wall of `wallThickness` when the footprint is big
// enough (Bo in the reference). Used for the cover's compartment plugs.
function roundedBox(
  r: Replicad,
  {
    width,
    height,
    depth,
    sideFillet,
    wallThickness,
  }: {
    width: number;
    height: number;
    depth: number;
    sideFillet: number;
    wallThickness: number;
  },
): Solid {
  const corner = Math.max(Math.min(sideFillet, height / 3, width / 3), 0);
  let outer: Solid = box(r, width, height, depth);
  if (corner > 0.5) {
    outer = outer.fillet(corner, (e: Solid) => e.inDirection("Z"));
  }
  if (width < 3 * wallThickness || height < 3 * wallThickness) {
    return outer;
  }
  let inner: Solid = box(r, width - 2 * wallThickness, height - 2 * wallThickness, depth);
  if (corner > wallThickness) {
    inner = inner.fillet(corner - wallThickness, (e: Solid) => e.inDirection("Z"));
  }
  return outer.cut(inner);
}

// Half-round (sagitta) prism — the thumb-scoop cutter for the telescoping lid.
function sagittaScoop(r: Replicad, radius: number, length: number): Solid {
  return new r.Sketcher("ZX")
    .movePointerTo([0, -radius])
    .vSagittaArc(radius * 2, radius)
    .close()
    .extrude(length);
}

// Undercut T-slot rail cross-section, swept along Y. Cut into the tray to form
// the runners, and intersected with the panel to form its matching tongue.
function railProfile(
  r: Replicad,
  { width, height, wallThickness }: { width: number; height: number; wallThickness: number },
): Solid {
  const w = wallThickness;
  const inner = width - 2 * w;
  return r
    .draw()
    .hLine(inner / 2 + w / 3)
    .vLine(w / 3)
    .line(-w / 3, w / 3)
    .vLine(w / 3)
    .hLineTo(0)
    .closeWithMirror()
    .sketchOnPlane("XZ", -height / 2 + w)
    .extrude(height - w);
}

// A lofted finger-grip hole cut into the sliding panel.
function fingerHole(
  r: Replicad,
  { wallThickness, holeWidth }: { wallThickness: number; holeWidth: number },
): Solid {
  const w = wallThickness;
  const outline: Solid = r
    .draw()
    .hLine(holeWidth / 2)
    .bulgeArc(0, w, 1)
    .hLine(-holeWidth / 2)
    .closeWithMirror();
  const inner: Solid = outline.offset(-w / 3);
  return outline.sketchOnPlane("XY", w).loftWith(inner.sketchOnPlane("XY", (2 * w) / 3));
}

// Smooth-spline pull tab fused to the front of a cover (the "cover lip").
function pullTab(
  r: Replicad,
  { wallThickness, maxLength }: { wallThickness: number; maxLength: number },
): Solid {
  const len = Math.min(maxLength, 50);
  const n = 2;
  return new r.Sketcher()
    .hLine(-len / 2)
    .smoothSpline(n, n / 2, { startTangent: 0, endTangent: 35, endFactor: 0.5 })
    .smoothSpline(n, n / 2, { endTangent: 0, endFactor: 2 })
    .hLine(len / 2 - 2 * n)
    .closeWithMirror()
    .extrude(wallThickness);
}

// Telescoping cap that fits over the whole tray (jv). W == outerWallThickness.
function buildLid(r: Replicad, p: TrayParams): Solid {
  const W = p.outerWallThickness;
  const tol = p.lidTolerance;
  const cornerR = p.sideFillet + p.outerWallThickness;
  const s = p.width + tol + 2 * W;
  const l = p.height + tol + 2 * W;
  const c = p.depth + tol + W;
  const fillet = cornerR + tol + W;

  const lid: Solid = box(r, s, l, c)
    .fillet(fillet, (e: Solid) => e.inDirection("Z"))
    .shell(W, (f: Solid) => f.inPlane("XY", c))
    .chamfer(W / 2, (e: Solid) => e.containsPoint([s / 2 - W, 0, c]));

  const y = Math.min(8, c - 2 * W);
  const scoop = sagittaScoop(r, y, W)
    .mirror("XY")
    .translate([0, -l / 2, c]);
  return lid.cut(scoop.clone()).cut(scoop.mirror("XZ"));
}

// Flat panel that slides into the tray's rails (Jv). tolerance default 0.1.
function buildSlidingLid(r: Replicad, p: TrayParams): Solid {
  const W = p.outerWallThickness;
  const tol = p.lidTolerance;
  const rail = railProfile(r, { width: p.width - tol, height: p.height, wallThickness: W - tol });
  const plateSketch: Solid = r
    .drawRoundedRectangle(p.width, p.height, p.sideFillet)
    .sketchOnPlane();
  const plate: Solid = plateSketch
    .extrude(W)
    .chamfer(W / 3, (e: Solid) => e.inPlane("XY", W).inPlane("XZ", p.height / 2));
  const hole = fingerHole(r, { wallThickness: W, holeWidth: Math.min(30, p.width / 3) });

  return rail
    .intersect(plate)
    .cut(hole.clone().translateY(-p.height / 2 + 3 * W))
    .cut(hole.clone().translateY(-p.height / 2 + 4.5 * W))
    .cut(hole.clone().translateY(-p.height / 2 + 6 * W));
}

// Flush cover with a downward hollow plug per compartment (Kv).
function buildCover(r: Replicad, p: TrayParams, cells: LeafCell[]): Solid {
  const tol = p.lidTolerance;
  const cornerR = Math.max(
    0.4,
    Math.min(p.sideFillet + p.outerWallThickness, p.width / 2 - 1, p.height / 2 - 1),
  );

  let plate: Solid = box(r, p.width, p.height, p.wallThickness).fillet(cornerR, (e: Solid) =>
    e.inDirection("Z"),
  );

  if (p.withCoverLip) {
    const tab = pullTab(r, {
      wallThickness: p.wallThickness,
      maxLength: p.width - 2 * (cornerR + p.outerWallThickness),
    })
      .mirror("XZ")
      .translateY(-p.height / 2);
    plate = plate.fuse(tab);
  }

  for (const { rect } of cells) {
    const plug = roundedBox(r, {
      width: rect.w - tol,
      height: rect.h - tol,
      depth: p.lidInnerHeight,
      sideFillet: p.sideFillet - tol,
      wallThickness: p.wallThickness,
    }).translate([rect.x + rect.w / 2, rect.y + rect.h / 2, p.wallThickness]);
    plate = plate.fuse(plug);
  }

  return plate.chamfer(p.wallThickness / 2, (e: Solid) => e.inPlane("XY"));
}

// Cut the sliding-lid runners into the top of the tray walls (no-op for other
// lid types). Called from buildTray with the assembled body.
export function cutLidRail(r: Replicad, body: Solid, p: TrayParams): Solid {
  if (p.lidType !== "sliding-lid") {
    return body;
  }
  const rail = railProfile(r, {
    width: p.width,
    height: p.height,
    wallThickness: p.outerWallThickness,
  }).translateZ(p.depth - p.outerWallThickness);
  return body.cut(rail);
}

// Build the chosen lid as a separate part, placed on the plate beside the tray.
// Returns null when there is no lid. `cells` are the tray's leaf compartments
// (needed for the cover's plugs).
export function buildLidPart(r: Replicad, p: TrayParams, cells: LeafCell[]): Solid | null {
  let lid: Solid | null = null;
  if (p.lidType === "lid") {
    lid = buildLid(r, p);
  } else if (p.lidType === "sliding-lid") {
    lid = buildSlidingLid(r, p);
  } else if (p.lidType === "cover") {
    lid = buildCover(r, p, cells);
  }
  if (!lid) {
    return null;
  }
  // Sit the part on the print bed next to the tray, clear of it.
  return lid.translate([0, p.height + 15, 0]);
}
