// The design registry.
//
// The app ships several independent parametric models. Each one owns its
// parameter type, its defaults, and a pure `build` that turns those parameters
// into named solids. The registry is the single place that knows the full set.
//
// It lives in `lib/` rather than beside the UI because the *worker* is the
// primary consumer: functions can't cross `postMessage`, so the main thread
// sends a `DesignId` and the worker looks the builder up here.

import { buildTray, defaultParams, defaultStructure, type SplitNode, type TrayPart } from "./model";
import { buildQuickDraw, defaultQuickDrawParams, type QuickDrawParams } from "./quick-draw";
import type { Replicad } from "./replicad-types";
import { buildWyrmwood, defaultWyrmwoodParams, type WyrmwoodParams } from "./wyrmwood";

export type DesignId = "token-tray" | "quick-draw" | "wyrmwood";

// A design's full editable state. Designs that lay out compartments carry a
// split tree; the rest set `structure` to null and ignore it in `build`.
export type DesignDefinition<P> = {
  id: DesignId;
  label: string;
  // Fits the narrow control rail, where the full label clips.
  shortLabel: string;
  blurb: string;
  defaultParams: P;
  makeDefaultStructure: (() => SplitNode) | null;
  // `replicad` is injected so this stays pure and runs inside the worker,
  // where the OpenCascade WASM kernel has been initialised.
  build: (replicad: Replicad, params: P, structure: SplitNode | null) => TrayPart[];
};

export const tokenTrayDesign: DesignDefinition<typeof defaultParams> = {
  id: "token-tray",
  label: "Token Tray",
  shortLabel: "Tray",
  blurb: "A compartmented tray for tokens, dice, and bits.",
  defaultParams,
  makeDefaultStructure: defaultStructure,
  build: (replicad, params, structure) => {
    if (!structure) {
      throw new Error("token-tray requires a split tree");
    }

    return buildTray(replicad, params, structure);
  },
};

export const quickDrawDesign: DesignDefinition<QuickDrawParams> = {
  id: "quick-draw",
  label: "Quick Draw",
  shortLabel: "Cards",
  blurb: "A deck box sized to your cards, with a lid and thumb scoops.",
  defaultParams: defaultQuickDrawParams,
  // No compartment tree: the deck pockets follow from the card size and count.
  makeDefaultStructure: null,
  build: (replicad, params) => buildQuickDraw(replicad, params),
};

export const wyrmwoodDesign: DesignDefinition<WyrmwoodParams> = {
  id: "wyrmwood",
  label: "Wyrmwood Accessory",
  shortLabel: "Wyrmwood",
  blurb: "A drafted trapezoid slab with magnets along its long side.",
  defaultParams: defaultWyrmwoodParams,
  // Shares the token tray's compartment tree; pockets follow the draft.
  makeDefaultStructure: defaultStructure,
  build: (replicad, params, structure) => buildWyrmwood(replicad, params, structure),
};

// Each design pins its own parameter type, so the registry that holds all of
// them can only be typed at the widest common shape. Callers immediately narrow
// via `DESIGNS[id]`, and the worker treats params as opaque transport anyway.
// biome-ignore lint/suspicious/noExplicitAny: heterogeneous param types across designs
export type AnyDesign = DesignDefinition<any>;

export const DESIGNS = {
  "token-tray": tokenTrayDesign,
  "quick-draw": quickDrawDesign,
  wyrmwood: wyrmwoodDesign,
} satisfies Record<DesignId, AnyDesign>;

export const DESIGN_ORDER: DesignId[] = ["token-tray", "quick-draw", "wyrmwood"];

export function getDesign(id: DesignId): AnyDesign {
  const design = DESIGNS[id];
  if (!design) {
    throw new Error(`unknown design: ${id}`);
  }

  return design;
}
