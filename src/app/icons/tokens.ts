// The icon palette, as CSS values ready to drop into a `fill`/`stroke` prop.
//
// The custom properties themselves are published by `cssVariablesResolver` in
// `src/app/theme.ts`, derived from the `rust`/`sand` ramps — that file is where
// you change what the icons look like. This module only names the roles for the
// TSX icons, and pairs each with the light-theme literal as a `var()` fallback
// so an icon still renders in isolation (a Storybook-less preview, an <img>, a
// test) if the theme's variables aren't on the page.
//
// The .svg files in this folder are the design sources for the same artwork and
// spell the identical `var(--tt-icon-*, #hex)` pairs inline. Keep them in step.

export const ICON = {
  line: "var(--tt-icon-line, #1d1b18)",
  lineSoft: "var(--tt-icon-line-soft, #89726a)",
  fill: "var(--tt-icon-fill, rgba(153,65,30,.08))",
  fillStrong: "var(--tt-icon-fill-strong, rgba(153,65,30,.14))",
  accent: "var(--tt-icon-accent, #99411e)",
  accentSoft: "var(--tt-icon-accent-soft, rgba(153,65,30,.3))",
  halo: "var(--tt-icon-halo, #ffffff)",
  faceTop: "var(--tt-icon-face-top, #f9f2ed)",
  faceLeft: "var(--tt-icon-face-left, #ede7e2)",
  faceRight: "var(--tt-icon-face-right, #e7e1dc)",
  faceInner: "var(--tt-icon-face-inner, #dcc1b8)",
  closure: "var(--tt-icon-closure, #7b5455)",
  closureFill: "var(--tt-icon-closure-fill, rgba(123,84,85,.1))",
  closureFillStrong: "var(--tt-icon-closure-fill-strong, rgba(123,84,85,.18))",
  motion: "var(--tt-icon-motion, #99411e)",
} as const;
