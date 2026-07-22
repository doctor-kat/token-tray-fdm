"use client";

import { createTheme, type MantineColorsTuple } from "@mantine/core";

// The tray UI's warm paper palette. `rust` is the primary accent (export button,
// selected states); `sand` carries the cream surfaces the card is built from.
const rust: MantineColorsTuple = [
  "#fdf3ef",
  "#f6e2d9",
  "#eec2b0",
  "#e5a084",
  "#dd845f",
  "#d87247",
  "#c2603a", // 6 — primary shade
  "#a54e2d",
  "#8c4225",
  "#71341c",
];

const sand: MantineColorsTuple = [
  "#fffdf8",
  "#f4f1ea",
  "#efe9dc",
  "#e8e4db",
  "#e7ded0",
  "#ddd5c6",
  "#d8cfbf",
  "#a89e88",
  "#8a8377",
  "#5c574f",
];

export const theme = createTheme({
  colors: { rust, sand },
  primaryColor: "rust",
  primaryShade: 6,
  fontFamily: "var(--font-instrument), system-ui, sans-serif",
  fontFamilyMonospace: "var(--font-space-mono), monospace",
  headings: { fontFamily: "var(--font-bricolage), sans-serif" },
  defaultRadius: "md",
  // The ink-on-paper body color used throughout the card.
  black: "#1c1a17",
});
