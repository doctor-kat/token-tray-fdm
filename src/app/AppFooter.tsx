"use client";

import { Anchor, Group, Text } from "@mantine/core";
import { DIMENSION_SM } from "@/app/theme";

const LINKS = ["Privacy", "Terms", "API Docs"];

// The design's closing rule. The links are placeholders — this app has no such
// routes — but the bar itself is what stops the control rail and the workspace
// from running off the bottom edge of the viewport.
export function AppFooter() {
  return (
    <Group
      component="footer"
      justify="space-between"
      px="lg"
      h={40}
      bg="sand.0"
      wrap="nowrap"
      style={{ borderTop: "1px solid var(--mantine-color-sand-6)", flex: "none" }}
    >
      <Text c="sand.8" style={DIMENSION_SM}>
        © {new Date().getFullYear()} Token Tray — parametric FDM trays
      </Text>
      <Group gap="lg" wrap="nowrap">
        {LINKS.map((l) => (
          <Anchor key={l} href="#" c="sand.8" underline="hover" style={DIMENSION_SM}>
            {l}
          </Anchor>
        ))}
      </Group>
    </Group>
  );
}
