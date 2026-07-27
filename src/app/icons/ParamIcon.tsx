// Small line-diagram glyphs for the numeric parameter fields. Each is a
// dimension sketch: the part in outline, the quantity the field edits drawn
// across it with a measure arrow.
//
// Inlined as JSX (rather than <img src="/…svg">) for the same reason as
// LidIcon.tsx — an <img> is an opaque document, so the page's custom properties
// can't reach inside it and the artwork would be stuck on its baked-in colours.
// Inline, every colour resolves through the `ICON` roles in tokens.ts and the
// sketches re-tint with the theme. The .svg files alongside this one are the
// design source (they carry the identical markup with the same tokens); this
// component is what ships.

import * as React from "react";
import { ICON } from "@/app/icons/tokens";

// The measure arrowhead, shared by every sketch. `id` is per-instance: several
// icons render at once and a duplicated marker id would make them fight.
function Arrowhead({ id }: { id: string }) {
  return (
    <defs>
      <marker
        id={id}
        markerWidth="7"
        markerHeight="7"
        refX="5.5"
        refY="3"
        orient="auto-start-reverse"
      >
        <path d="M0.5 0.5 L6 3 L0.5 5.5" fill="none" stroke={ICON.accent} strokeWidth={1.2} />
      </marker>
    </defs>
  );
}

// Each entry draws into a 0 0 64 64 box and receives `m`, the url(#…) reference
// to its own arrowhead marker.
const SKETCHES = {
  /** Height — the depth of the tray, measured between two extension lines. */
  height: (m: string) => (
    <>
      <line x1="26" y1="14" x2="26" y2="50" stroke={ICON.lineSoft} strokeWidth={1.4} />
      <line x1="40" y1="14" x2="40" y2="50" stroke={ICON.lineSoft} strokeWidth={1.4} />
      <line
        x1="33"
        y1="14"
        x2="33"
        y2="50"
        stroke={ICON.accent}
        strokeWidth={1.4}
        markerStart={m}
        markerEnd={m}
      />
    </>
  ),

  /** Wall width — the separator between two neighbouring compartments, in plan. */
  wall: (m: string) => (
    <>
      <rect
        x="6"
        y="12"
        width="52"
        height="40"
        rx="3"
        fill="none"
        stroke={ICON.line}
        strokeWidth={2}
      />
      <rect
        x="12"
        y="18"
        width="16"
        height="28"
        rx="1.5"
        fill="none"
        stroke={ICON.lineSoft}
        strokeWidth={1.4}
      />
      <rect
        x="36"
        y="18"
        width="16"
        height="28"
        rx="1.5"
        fill="none"
        stroke={ICON.lineSoft}
        strokeWidth={1.4}
      />
      <rect x="28" y="18" width="8" height="28" fill={ICON.fillStrong} />
      <line x1="16" y1="32" x2="28" y2="32" stroke={ICON.accent} strokeWidth={1.4} markerEnd={m} />
      <line x1="48" y1="32" x2="36" y2="32" stroke={ICON.accent} strokeWidth={1.4} markerEnd={m} />
    </>
  ),

  /** Outer wall — the thickness of the tray's own shell, in plan. */
  outerWall: (m: string) => (
    <>
      <rect
        x="12"
        y="14"
        width="40"
        height="36"
        rx="3"
        fill="none"
        stroke={ICON.line}
        strokeWidth={2}
      />
      <rect
        x="18"
        y="20"
        width="28"
        height="24"
        rx="1.5"
        fill="none"
        stroke={ICON.lineSoft}
        strokeWidth={1.4}
      />
      <path
        d="M12 14 H52 V50 H12 Z M18 20 V44 H46 V20 Z"
        fill={ICON.fill}
        fillRule="evenodd"
        stroke="none"
      />
      <line x1="0" y1="32" x2="12" y2="32" stroke={ICON.accent} strokeWidth={1.4} markerEnd={m} />
      <line x1="30" y1="32" x2="18" y2="32" stroke={ICON.accent} strokeWidth={1.4} markerEnd={m} />
    </>
  ),

  /** Side fillet — the rounded vertical corner, highlighted on the corner itself. */
  side: () => (
    <>
      <path
        d="M14 50 V26 A12 12 0 0 1 26 14 H50"
        fill={ICON.fill}
        stroke={ICON.line}
        strokeWidth={2}
      />
      <path d="M14 50 V26 A12 12 0 0 1 26 14" fill="none" stroke={ICON.accent} strokeWidth={2.2} />
    </>
  ),

  /** Bottom fillet — the floor-to-wall radius, dimensioned from its centre. */
  bottom: (m: string) => (
    <>
      <path d="M16 14 V38 A10 10 0 0 0 26 48 H50" fill="none" stroke={ICON.line} strokeWidth={2} />
      <circle cx="26" cy="38" r="1.6" fill={ICON.accent} />
      <line
        x1="27.4"
        y1="36.58"
        x2="18.93"
        y2="45.07"
        stroke={ICON.accent}
        strokeWidth={1.4}
        markerEnd={m}
      />
    </>
  ),

  /** Inner cover depth — how far the cover sinks into the opening, in section. */
  coverDepth: (m: string) => (
    <>
      <path
        d="M12 20 H52 V24 H16 V44 H12 Z"
        fill={ICON.fillStrong}
        stroke={ICON.line}
        strokeWidth={2}
      />
      <path d="M18 26 H50" stroke={ICON.lineSoft} strokeWidth={1.2} strokeDasharray="3 3" />
      <line
        x1="44"
        y1="20"
        x2="44"
        y2="44"
        stroke={ICON.accent}
        strokeWidth={1.4}
        markerStart={m}
        markerEnd={m}
      />
      <line x1="40" y1="20" x2="52" y2="20" stroke={ICON.lineSoft} strokeWidth={1} />
      <line x1="40" y1="44" x2="52" y2="44" stroke={ICON.lineSoft} strokeWidth={1} />
    </>
  ),

  /** Lid tolerance — the clearance gap between the lid wall and the tray wall. */
  lidTolerance: (m: string) => (
    <>
      <path d="M12 20 V52 H26 V26 H22 V52" fill={ICON.fill} stroke={ICON.line} strokeWidth={2} />
      <path d="M52 12 V44 H30 V18 H48 V44" fill="none" stroke={ICON.line} strokeWidth={2} />
      <line x1="14" y1="30" x2="26" y2="30" stroke={ICON.accent} strokeWidth={1.4} markerEnd={m} />
      <line x1="42" y1="30" x2="30" y2="30" stroke={ICON.accent} strokeWidth={1.4} markerEnd={m} />
      <line x1="26" y1="26" x2="26" y2="34" stroke={ICON.lineSoft} strokeWidth={1} />
      <line x1="30" y1="18" x2="30" y2="34" stroke={ICON.lineSoft} strokeWidth={1} />
    </>
  ),
  // Quick Draw & Wyrmwood icons extracted from SVG definitions
  cardHeight: (m: string) => (
    <>
      <rect x="19" y="10" width="26" height="44" rx="3.6" fill="none" stroke={ICON.line} strokeWidth="2" />
      <line x1="45" y1="10" x2="54" y2="10" stroke={ICON.lineSoft} strokeWidth="1" />
      <line x1="45" y1="54" x2="54" y2="54" stroke={ICON.lineSoft} strokeWidth="1" />
      <line x1="51" y1="10" x2="51" y2="54" stroke={ICON.accent} strokeWidth="1.4" markerStart={m} markerEnd={m} />
    </>
  ),
  cardWidth: (m: string) => (
    <>
      <rect x="17" y="11" width="30" height="42" rx="4.2" fill="none" stroke={ICON.line} strokeWidth="2" />
      <line x1="17" y1="53" x2="17" y2="62" stroke={ICON.lineSoft} strokeWidth="1" />
      <line x1="47" y1="53" x2="47" y2="62" stroke={ICON.lineSoft} strokeWidth="1" />
      <line x1="17" y1="59" x2="47" y2="59" stroke={ICON.accent} strokeWidth="1.4" markerStart={m} markerEnd={m} />
    </>
  ),
  deckHeight: (m: string) => (
    <>
      <rect x="16" y="16" width="32" height="3.2" rx="1" fill="none" stroke={ICON.line} strokeWidth="1.4" />
      <rect x="16" y="19.2" width="32" height="3.2" rx="1" fill={ICON.fill} stroke={ICON.line} strokeWidth="1.4" />
      <rect x="16" y="22.4" width="32" height="3.2" rx="1" fill="none" stroke={ICON.line} strokeWidth="1.4" />
      <rect x="16" y="25.6" width="32" height="3.2" rx="1" fill={ICON.fill} stroke={ICON.line} strokeWidth="1.4" />
      <rect x="16" y="28.8" width="32" height="3.2" rx="1" fill="none" stroke={ICON.line} strokeWidth="1.4" />
      <rect x="16" y="32" width="32" height="3.2" rx="1" fill={ICON.fill} stroke={ICON.line} strokeWidth="1.4" />
      <rect x="16" y="35.2" width="32" height="3.2" rx="1" fill="none" stroke={ICON.line} strokeWidth="1.4" />
      <rect x="16" y="38.4" width="32" height="3.2" rx="1" fill={ICON.fill} stroke={ICON.line} strokeWidth="1.4" />
      <rect x="16" y="41.6" width="32" height="3.2" rx="1" fill="none" stroke={ICON.line} strokeWidth="1.4" />
      <line x1="48" y1="19.2" x2="58" y2="19.2" stroke={ICON.lineSoft} strokeWidth="1" />
      <line x1="48" y1="48" x2="58" y2="48" stroke={ICON.lineSoft} strokeWidth="1" />
      <line x1="55" y1="19.2" x2="55" y2="48" stroke={ICON.accent} strokeWidth="1.4" markerStart={m} markerEnd={m} />
    </>
  ),
  deckCount: (m: string) => (
    <>
      <rect x="14" y="18.8" width="26" height="3.4" rx="1" fill="none" stroke={ICON.line} strokeWidth="1.4" />
      <rect x="14" y="22.2" width="26" height="3.4" rx="1" fill={ICON.fill} stroke={ICON.line} strokeWidth="1.4" />
      <rect x="14" y="25.6" width="26" height="3.4" rx="1" fill="none" stroke={ICON.line} strokeWidth="1.4" />
      <rect x="14" y="29" width="26" height="3.4" rx="1" fill={ICON.fill} stroke={ICON.line} strokeWidth="1.4" />
      <rect x="14" y="32.4" width="26" height="3.4" rx="1" fill="none" stroke={ICON.line} strokeWidth="1.4" />
      <rect x="14" y="35.8" width="26" height="3.4" rx="1" fill={ICON.fill} stroke={ICON.line} strokeWidth="1.4" />
      <rect x="14" y="39.2" width="26" height="3.4" rx="1" fill="none" stroke={ICON.line} strokeWidth="1.4" />
      <rect x="14" y="42.6" width="26" height="3.4" rx="1" fill={ICON.fill} stroke={ICON.line} strokeWidth="1.4" />
      <text x="44" y="40" fontFamily="Inter,sans-serif" fontSize="13" fontWeight="600" fill={ICON.accent}>×N</text>
    </>
  ),
  draftAngle: (m: string) => (
    <>
      <line x1="22" y1="14" x2="22" y2="50" stroke={ICON.lineSoft} strokeWidth="1.2" strokeDasharray="3 3" />
      <path d="M32 14 L22 50 H40" stroke={ICON.line} strokeWidth="2" fill="none" />
      <path d="M22 34 A16 16 0 0 1 26.6 26" stroke={ICON.accent} strokeWidth="1.4" fill="none" markerEnd={m} />
      <text x="24" y="24" fontFamily="Inter,sans-serif" fontSize="10" fontWeight="600" fill={ICON.accent}>θ</text>
    </>
  ),
  magnetDiameter: (m: string) => (
    <>
      <circle cx="32" cy="32" r="15" fill="none" stroke={ICON.line} strokeWidth="2" />
      <line x1="17" y1="32" x2="17" y2="50" stroke={ICON.lineSoft} strokeWidth="1" />
      <line x1="47" y1="32" x2="47" y2="50" stroke={ICON.lineSoft} strokeWidth="1" />
      <line x1="17" y1="47" x2="47" y2="47" stroke={ICON.accent} strokeWidth="1.4" markerStart={m} markerEnd={m} />
      <text x="20" y="20" fontFamily="Inter,sans-serif" fontSize="11" fontWeight="600" fill={ICON.accent}>∅</text>
    </>
  ),
  magnetCount: (m: string) => (
    <>
      <circle cx="16" cy="32" r="7" fill={ICON.fill} stroke={ICON.line} strokeWidth="2" />
      <circle cx="32" cy="32" r="7" fill={ICON.fill} stroke={ICON.line} strokeWidth="2" />
      <circle cx="48" cy="32" r="7" fill={ICON.fill} stroke={ICON.line} strokeWidth="2" />
      <text x="24" y="54" fontFamily="Inter,sans-serif" fontSize="11" fontWeight="600" fill={ICON.accent}>×N</text>
    </>
  ),
  magnetOffset: (m: string) => (
    <>
      <line x1="14" y1="12" x2="14" y2="52" stroke={ICON.line} strokeWidth="2" />
      <circle cx="38" cy="32" r="9" fill={ICON.fill} stroke={ICON.line} strokeWidth="2" />
      <line x1="32" y1="32" x2="44" y2="32" stroke={ICON.lineSoft} strokeWidth="1" />
      <line x1="38" y1="26" x2="38" y2="38" stroke={ICON.lineSoft} strokeWidth="1" />
      <line x1="14" y1="46" x2="14" y2="56" stroke={ICON.lineSoft} strokeWidth="1" />
      <line x1="38" y1="32" x2="38" y2="56" stroke={ICON.lineSoft} strokeWidth="1" />
      <line x1="14" y1="53" x2="38" y2="53" stroke={ICON.accent} strokeWidth="1.4" markerStart={m} markerEnd={m} />
    </>
  ),
  lidCutout: (m: string) => (
    <>
      <path d="M14 20 H27 A5 5 0 0 0 37 20 H50 V48 H14 Z" fill={ICON.fill} stroke={ICON.line} strokeWidth="2" />
    </>
  ),
} as const;

export type ParamIconName = keyof typeof SKETCHES;

export function ParamIcon({ name, size = 30 }: { name: ParamIconName; size?: number }) {
  // useId's value contains colons, which url(#…) would read as a selector —
  // strip them rather than escaping at every reference site.
  const id = `ah${React.useId().replace(/:/g, "")}`;
  const marker = `url(#${id})`;

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      focusable="false"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block" }}
    >
      <Arrowhead id={id} />
      {SKETCHES[name](marker)}
    </svg>
  );
}
