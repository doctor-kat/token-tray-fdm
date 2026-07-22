"use client";

import { Box, Group, Text } from "@mantine/core";
import { NOMINAL_FLOW_MM3_PER_S, PLA_DENSITY_G_CM3 } from "@/app/lib/filaments";
import { DIMENSION_MD, DIMENSION_SM } from "@/app/theme";

function formatDuration(seconds: number) {
  const total = Math.round(seconds / 60);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

/** Material and time estimate for the current solid.
 *
 * Both figures come from the build volume the worker reports, not from a
 * slicer: mass is volume x PLA density, and time divides the same volume by a
 * nominal extrusion rate. Mass is close; the time is a rough order-of-magnitude
 * guide that ignores travel, infill pattern, and layer height, so the card
 * labels itself as an estimate.
 */
export function PrintEstimate({ volume }: { volume: number | null }) {
  if (volume == null || volume <= 0) {
    return null;
  }

  const grams = (volume / 1000) * PLA_DENSITY_G_CM3;
  const duration = formatDuration(volume / NOMINAL_FLOW_MM3_PER_S);

  return (
    <Box p="md" bg="stone.1" style={{ borderRadius: "var(--mantine-radius-sm)" }}>
      <Text c="stone.8" mb="sm" style={DIMENSION_SM}>
        PRINT ESTIMATE
      </Text>
      <Group justify="space-between" align="flex-end" wrap="nowrap">
        <Text c="sand.9" style={DIMENSION_MD}>
          {duration}
        </Text>
        <Text c="sand.9" style={DIMENSION_MD}>
          ~{Math.round(grams)}g PLA
        </Text>
      </Group>
    </Box>
  );
}
