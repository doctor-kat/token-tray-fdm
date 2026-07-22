// Small line-diagram glyphs for the numeric parameter fields. Each SVG in this
// folder is a dimension sketch (the quantity the field edits, drawn with an
// orange measure arrow); this registry maps a stable name to the one variant we
// ship. The icons are self-contained and decorative, so there's nothing to tint
// at runtime the way the lid picker needs (see LidIcon.tsx for that inline
// approach) — they render straight off the bundler-hashed asset URL.

import Image from "next/image";
import bottomFillet from "./bottom-fillet--radius.svg";
import height from "./height--arrows.svg";
import innerCoverDepth from "./inner-cover-depth--section.svg";
import lidTolerance from "./lid-tolerance--clearance.svg";
import outerWall from "./outer-wall-thickness.svg";
import sideFillet from "./side-fillet--corner.svg";
import wallWidth from "./wall-width--between-bins.svg";

export const PARAM_ICONS = {
  height,
  wall: wallWidth,
  outerWall,
  side: sideFillet,
  bottom: bottomFillet,
  coverDepth: innerCoverDepth,
  lidTolerance,
} as const;

export type ParamIconName = keyof typeof PARAM_ICONS;

export function ParamIcon({ name, size = 30 }: { name: ParamIconName; size?: number }) {
  return (
    <Image
      src={PARAM_ICONS[name]}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      style={{ display: "block" }}
    />
  );
}
