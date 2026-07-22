"use client";

import { SegmentedControl, Stack, Text } from "@mantine/core";
import { DESIGN_ORDER, DESIGNS, type DesignId } from "@/app/lib/designs";

// Picks which parametric model the app is editing. Reads the registry rather
// than a local list so a newly registered design shows up here automatically.
export function DesignSwitcher({
  design,
  onChange,
}: {
  design: DesignId;
  onChange: (id: DesignId) => void;
}) {
  return (
    <Stack gap={6} px="lg" pt="md" pb="sm">
      <Text fz={9} fw={600} tt="uppercase" lts=".06em" c="sand.8">
        Design
      </Text>
      <SegmentedControl
        fullWidth
        value={design}
        onChange={(v) => {
          onChange(v as DesignId);
        }}
        data={DESIGN_ORDER.map((id) => ({ value: id, label: DESIGNS[id].shortLabel }))}
      />
      <Text fz="xs" c="dimmed">
        <Text span inherit fw={600} c="sand.9">
          {DESIGNS[design].label}
        </Text>{" "}
        — {DESIGNS[design].blurb}
      </Text>
    </Stack>
  );
}
