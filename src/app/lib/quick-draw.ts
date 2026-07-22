// Quick Draw — a card deck box (tray + optional lid) with finger scoops.
//
// Ported from https://deckinabox.sgenoud.com/quick-draw. The dimension
// formulas below were verified against that site's own dimensions readout for
// the default preset (tray 69.6 x 94.6 x 21.8, lid 70.2 x 95.2 x 22.1).
//
// Note `cardTolerance` is applied ONCE per axis, not per side — the reference
// adds the full value to the inner width, which is what makes 64 + 2 + 2*1.8
// come out at 69.6.
//
// replicad is injected (same as model.ts) so this runs inside the worker where
// the WASM kernel is live.

import type { TrayPart } from "./model";
import type { Replicad } from "./replicad-types";

// biome-ignore lint/suspicious/noExplicitAny: replicad boolean/fillet chains union to broad types
type Solid = any;

export type CardPresetId =
  | "magicCards"
  | "sleevedMagicCards"
  | "playingCards"
  | "tallCards"
  | "sleevedTallCards"
  | "smallCards"
  | "smallCardsUS"
  | "sleevedSmallCards"
  | "custom";

export type CardPreset = {
  id: CardPresetId;
  label: string;
  cardHeight: number;
  cardWidth: number;
};

// Read off the reference site by cycling its card-type select.
export const CARD_PRESETS: CardPreset[] = [
  { id: "magicCards", label: "Standard poker cards", cardHeight: 89, cardWidth: 64 },
  { id: "sleevedMagicCards", label: "Standard sleeved cards", cardHeight: 96, cardWidth: 67 },
  { id: "playingCards", label: "European playing cards", cardHeight: 92, cardWidth: 59 },
  { id: "tallCards", label: "Tall cards", cardHeight: 100, cardWidth: 65 },
  { id: "sleevedTallCards", label: "Tall sleeved cards", cardHeight: 104, cardWidth: 69 },
  { id: "smallCards", label: "Mini euro cards", cardHeight: 68, cardWidth: 45 },
  { id: "smallCardsUS", label: "Mini US cards", cardHeight: 63, cardWidth: 41 },
  { id: "sleevedSmallCards", label: "Mini sleeved cards", cardHeight: 73, cardWidth: 47 },
  { id: "custom", label: "Custom", cardHeight: 73, cardWidth: 47 },
];

export type QuickDrawLidType = "lid" | "cover" | "none";

export type QuickDrawParams = {
  cardType: CardPresetId;
  cardHeight: number;
  cardWidth: number;
  deckHeight: number;
  deckCount: number;
  lidType: QuickDrawLidType;
  lidCutout: boolean;
  wallThickness: number;
  cardTolerance: number;
  innerFilletRadius: number;
  fingerHoleSize: number;
  lidTolerance: number;
  modelName: string;
};

export const defaultQuickDrawParams: QuickDrawParams = {
  cardType: "magicCards",
  cardHeight: 89,
  cardWidth: 64,
  deckHeight: 20,
  deckCount: 1,
  lidType: "lid",
  lidCutout: false,
  wallThickness: 1.8,
  cardTolerance: 2,
  innerFilletRadius: 3,
  fingerHoleSize: 15,
  lidTolerance: 0.3,
  modelName: "",
};

// The derived box envelope. Split out from build() so the UI can show the same
// dimensions readout the reference site does without touching the kernel.
export type QuickDrawDims = {
  pocketW: number;
  pocketL: number;
  trayW: number;
  trayL: number;
  trayH: number;
  lidW: number;
  lidL: number;
  lidH: number;
};

export function quickDrawDims(p: QuickDrawParams): QuickDrawDims {
  const wall = p.wallThickness;
  const count = Math.max(1, Math.round(p.deckCount));

  // One pocket per deck, separated (and bounded) by walls.
  const pocketW = p.cardWidth + p.cardTolerance;
  const pocketL = p.cardHeight + p.cardTolerance;
  const trayW = count * pocketW + (count + 1) * wall;
  const trayL = pocketL + 2 * wall;
  const trayH = p.deckHeight + wall;

  const tol = p.lidTolerance;
  return {
    pocketW,
    pocketL,
    trayW,
    trayL,
    trayH,
    // The lid slips over the tray: a tolerance gap on each side, and the same
    // gap again in Z for the wall it closes over.
    lidW: trayW + 2 * tol,
    lidL: trayL + 2 * tol,
    lidH: trayH + tol,
  };
}

// X centre of each deck pocket, left to right, about the tray centre.
function pocketCentres(p: QuickDrawParams, d: QuickDrawDims): number[] {
  const count = Math.max(1, Math.round(p.deckCount));
  const wall = p.wallThickness;
  const centres: number[] = [];
  let cursor = -d.trayW / 2 + wall;
  for (let i = 0; i < count; i++) {
    centres.push(cursor + d.pocketW / 2);
    cursor += d.pocketW + wall;
  }

  return centres;
}

// A vertical round scoop cut through a long wall so a thumb can reach the deck.
// Modelled as a full cylinder straddling the wall line; only the half inside
// the wall removes material.
function fingerScoop(r: Replicad, radius: number, height: number): Solid {
  return r.sketchCircle(radius).extrude(height);
}

function buildBody(r: Replicad, p: QuickDrawParams, d: QuickDrawDims): Solid {
  const wall = p.wallThickness;

  let body: Solid = r
    .drawRoundedRectangle(d.trayW, d.trayL, p.innerFilletRadius + wall)
    .sketchOnPlane("XY")
    .extrude(d.trayH);

  const centres = pocketCentres(p, d);
  const corner = Math.max(
    0.4,
    Math.min(p.innerFilletRadius, d.pocketW / 2 - 0.1, d.pocketL / 2 - 0.1),
  );

  for (const cx of centres) {
    // Cut past the top so the pocket opens cleanly.
    const pocket: Solid = r
      .drawRoundedRectangle(d.pocketW, d.pocketL, corner)
      .translate(cx, 0)
      .sketchOnPlane("XY", wall)
      .extrude(d.trayH - wall + 1);
    body = body.cut(pocket);
  }

  if (p.fingerHoleSize > 0.5) {
    // Scoops go in the two long walls, centred on the deck's length, so a
    // thumb reaches the middle of the stack. Radius is capped against the
    // pocket length so the scoop can't run past the tray's corners.
    const radius = Math.min(p.fingerHoleSize / 2, d.pocketL / 2 - 0.5);
    // Start above the floor so the scoop never breaches the base.
    const z = wall + Math.min(2, p.deckHeight / 4);
    for (const sign of [-1, 1]) {
      const scoop = fingerScoop(r, radius, d.trayH - z + 1).translate([(sign * d.trayW) / 2, 0, z]);
      body = body.cut(scoop);
    }
  }

  return body;
}

// Telescoping cap that slips over the whole tray, closed at the top.
function buildQuickDrawLid(r: Replicad, p: QuickDrawParams, d: QuickDrawDims): Solid {
  const wall = p.wallThickness;
  const outerW = d.lidW + 2 * wall;
  const outerL = d.lidL + 2 * wall;
  const outerH = d.lidH + wall;

  const blank: Solid = r
    .drawRoundedRectangle(outerW, outerL, p.innerFilletRadius + 2 * wall)
    .sketchOnPlane("XY")
    .extrude(outerH);
  // Hollow it from below, leaving the top face as the closed end.
  let lid: Solid = blank.shell(wall, (f: Solid) => f.inPlane("XY", 0));

  if (p.lidCutout && p.fingerHoleSize > 0.5) {
    // Match the tray's scoops so the two line up when the lid is on.
    const radius = Math.min(p.fingerHoleSize / 2, d.pocketL / 2 - 0.5);
    for (const sign of [-1, 1]) {
      const scoop = fingerScoop(r, radius, outerH).translate([(sign * outerW) / 2, 0, 0]);
      lid = lid.cut(scoop);
    }
  }

  return lid;
}

// Flat press-fit cover that plugs the tray opening rather than wrapping it.
function buildQuickDrawCover(r: Replicad, p: QuickDrawParams, d: QuickDrawDims): Solid {
  const wall = p.wallThickness;
  const tol = p.lidTolerance;

  let cover: Solid = r
    .drawRoundedRectangle(d.trayW, d.trayL, p.innerFilletRadius + wall)
    .sketchOnPlane("XY")
    .extrude(wall);

  // A shallow plug per deck so the cover locates in the pockets.
  for (const cx of pocketCentres(p, d)) {
    const corner = Math.max(
      0.4,
      Math.min(p.innerFilletRadius, (d.pocketW - tol) / 2 - 0.1, (d.pocketL - tol) / 2 - 0.1),
    );
    const plug: Solid = r
      .drawRoundedRectangle(d.pocketW - 2 * tol, d.pocketL - 2 * tol, corner)
      .translate(cx, 0)
      .sketchOnPlane("XY", wall)
      .extrude(Math.min(3, p.deckHeight / 3));
    cover = cover.fuse(plug);
  }

  return cover;
}

export function buildQuickDraw(r: Replicad, p: QuickDrawParams): TrayPart[] {
  const d = quickDrawDims(p);
  const baseName = p.modelName.trim() || "quick-draw";

  const parts: TrayPart[] = [{ name: `${baseName} - tray`, shape: buildBody(r, p, d) }];

  if (p.lidType !== "none") {
    const lid = p.lidType === "lid" ? buildQuickDrawLid(r, p, d) : buildQuickDrawCover(r, p, d);
    // Sit the lid on the bed beside the tray, clear of it.
    parts.push({
      name: `${baseName} - ${p.lidType}`,
      shape: lid.translate([0, d.trayL + 15, 0]),
    });
  }

  return parts;
}
