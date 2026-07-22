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

// The app's one control-label treatment: small uppercase, matching the labels
// under the lid-type icons. The uppercase + tracking does the work — no separate
// typeface. Defined once here and pushed onto Input.Wrapper so every NumberInput
// / TextInput / Select / Radio.Group agrees, rather than each call site restating it.
const CONTROL_LABEL = {
  fontSize: "var(--mantine-font-size-xs)",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: ".06em",
  color: "var(--mantine-color-sand-8)",
  lineHeight: 1.3,
} as const;

export const theme = createTheme({
  colors: { rust, sand },
  primaryColor: "rust",
  primaryShade: 6,
  fontFamily: "var(--font-instrument), system-ui, sans-serif",
  fontFamilyMonospace: "var(--font-instrument), system-ui, sans-serif",
  headings: { fontFamily: "var(--font-instrument), sans-serif" },
  defaultRadius: "md",
  // The ink-on-paper body color used throughout the card.
  black: "#1c1a17",
  components: {
    // Covers the label of every wrapped input, including Radio.Group's.
    InputWrapper: { styles: { label: CONTROL_LABEL } },
    // Checkbox's inline label reads as a sentence, not a field name, so it
    // stays body text — but at the same size as the other control text.
    Checkbox: { styles: { label: { fontSize: "var(--mantine-font-size-sm)" } } },
  },
});
