// Isometric tray + closure icons for the lid picker. Inlined as JSX (rather
// than <img src="/…svg">) so they render server-side with no extra requests
// and no paint-in, and so the arrow halo can be tinted to match whatever
// surface the icon sits on. The .svg files alongside this one are the design
// source (open preview.html to see them); this component is what ships.

import type { LidType } from "@/app/lib/model";

const OUTLINE = "#1c1a17";
const CLOSURE = "#176b8a"; // teal — the lid/cover/panel
const MOTION = "#d1451f"; // orange — the motion arrow

// The open tray, common to every icon.
const TRAY = [
  { d: "M18 43.1 L32 50.1 L32 60 L18 53 Z", fill: "#e2dbc9", w: 1.3 },
  { d: "M46 43.1 L32 50.1 L32 60 L46 53 Z", fill: "#d7ceba", w: 1.3 },
  { d: "M32 36.1 L46 43.1 L32 50.1 L18 43.1 Z", fill: "#efe9dc", w: 1.3 },
  { d: "M32 38.9 L40.4 43.1 L32 47.3 L23.6 43.1 Z", fill: "#d5ccb6", w: 1.1 },
];

// Per-type closure faces (two sides + top) and the motion arrow (shaft + head).
const CLOSURES: Record<Exclude<LidType, "none">, { faces: string[]; arrow: string[] }> = {
  lid: {
    faces: [
      "M50.2 16.7 L32 25.8 L32 35.7 L50.2 26.6 Z",
      "M13.8 16.7 L32 25.8 L32 35.7 L13.8 26.6 Z",
      "M32 7.6 L50.2 16.7 L32 25.8 L13.8 16.7 Z",
    ],
    arrow: ["M32 21.65 L32 43.1", "M29 38.6 L32 43.1 L35 38.6"],
  },
  "sliding-lid": {
    faces: [
      "M61.4 50.47 L47.4 57.47 L47.4 55.71 L61.4 48.71 Z",
      "M33.4 50.47 L47.4 57.47 L47.4 55.71 L33.4 48.71 Z",
      "M47.4 41.71 L61.4 48.71 L47.4 55.71 L33.4 48.71 Z",
    ],
    arrow: ["M58.88 43.85 L35.78 32.3", "M41.15 31.63 L35.78 32.3 L38.46 37"],
  },
  cover: {
    faces: [
      "M46 25.72 L32 32.72 L32 34.7 L46 27.7 Z",
      "M18 25.72 L32 32.72 L32 34.7 L18 27.7 Z",
      "M32 18.72 L46 25.72 L32 32.72 L18 25.72 Z",
    ],
    arrow: ["M32 26.71 L32 43.1", "M29 38.6 L32 43.1 L35 38.6"],
  },
};

// The drawn extent of each icon within the 64×66 design frame. The frame has
// slack that differs per type (the bare tray sits low, the sliding lid sits
// right), so we frame each icon to its own content instead — see below.
const CONTENT: Record<LidType, { x0: number; y0: number; x1: number; y1: number }> = {
  none: { x0: 18, y0: 36, x1: 46, y1: 60 },
  lid: { x0: 13.8, y0: 7.6, x1: 50.2, y1: 60 },
  cover: { x0: 18, y0: 18.72, x1: 46, y1: 60 },
  "sliding-lid": { x0: 18, y0: 31.63, x1: 61.4, y1: 60 },
};

export function LidIcon({
  type,
  size = 46,
  halo = "#f4f1ea",
}: {
  type: LidType;
  size?: number;
  /** Behind-the-arrow knockout — set to the surface the icon sits on. */
  halo?: string;
}) {
  const closure = type === "none" ? null : CLOSURES[type];

  // Frame each icon to its own content, centered in a square viewBox: take the
  // content's center and size the box to its longest side plus a uniform margin.
  // This drops the per-type slack in the design frame, so every icon sits
  // centered and fills the space to a comparable degree (no bottom-heavy tray,
  // no right-heavy sliding lid).
  const b = CONTENT[type];
  const cx = (b.x0 + b.x1) / 2;
  const cy = (b.y0 + b.y1) / 2;
  const side = Math.max(b.x1 - b.x0, b.y1 - b.y0) + 12;

  return (
    <svg
      viewBox={`${cx - side / 2} ${cy - side / 2} ${side} ${side}`}
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      style={{ display: "block" }}
    >
      <g strokeLinejoin="round" strokeLinecap="round">
        {TRAY.map((p) => (
          <path key={p.d} d={p.d} fill={p.fill} stroke={OUTLINE} strokeWidth={p.w} />
        ))}

        {closure?.faces.map((d, i) => (
          <path
            key={d}
            d={d}
            // The top face reads slightly denser than the two side faces.
            fill={`rgba(23,107,138,${i === 2 ? 0.18 : 0.1})`}
            stroke={CLOSURE}
            strokeWidth={1.5}
          />
        ))}

        {/* Halo first so the arrow stays legible over the geometry. */}
        {closure?.arrow.map((d) => (
          <path key={`halo-${d}`} d={d} fill="none" stroke={halo} strokeWidth={4.4} />
        ))}
        {closure?.arrow.map((d) => (
          <path key={`arrow-${d}`} d={d} fill="none" stroke={MOTION} strokeWidth={1.9} />
        ))}
      </g>
    </svg>
  );
}
