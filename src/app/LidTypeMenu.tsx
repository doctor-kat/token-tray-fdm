"use client";

import { Box, Group, Menu, Text, UnstyledButton } from "@mantine/core";
import { ChevronDown } from "lucide-react";
import { LidIcon } from "@/app/icons/LidIcon";
import type { LidType, TrayParams } from "@/app/lib/model";

export const LID_OPTIONS: Array<{ value: LidType; label: string; hint: string }> = [
  { value: "none", label: "None", hint: "Open tray" },
  { value: "lid", label: "Lid", hint: "Wraps around the tray" },
  { value: "sliding-lid", label: "Sliding Lid", hint: "Slides in from the front" },
  { value: "cover", label: "Cover", hint: "Press-fit onto the opening" },
];

// Each lid type ships with its own sensible clearance (matches the reference).
export const LID_TOLERANCE_DEFAULT: Record<LidType, number> = {
  none: 0.6,
  lid: 0.6,
  "sliding-lid": 0.1,
  cover: 0.2,
};

// Surfaces behind the lid-icon arrow halo, kept as literal hexes because the
// halo is an SVG stroke attribute (`var(...)` wouldn't resolve there). The
// trigger sits on the rail (`sand.1`); the dropdown items sit on white.
const TRIGGER_SURFACE = "#f4f1ea";
const MENU_SURFACE = "#ffffff";

/** Compact dropdown for choosing the lid type. Lives above the 2D preview; the
 * per-lid settings live in their own "Lid settings" section. */
export function LidTypeMenu({
  value,
  onChange,
}: {
  value: LidType;
  onChange: (patch: Partial<TrayParams>) => void;
}) {
  const current = LID_OPTIONS.find((o) => o.value === value) ?? LID_OPTIONS[0];

  return (
    <Menu position="bottom-start" shadow="md" withinPortal>
      <Menu.Target>
        <UnstyledButton>
          <Group
            gap={8}
            wrap="nowrap"
            bg={TRIGGER_SURFACE}
            pl={8}
            pr={10}
            py={5}
            style={{
              border: "1px solid var(--mantine-color-sand-6)",
              borderRadius: 999,
            }}
          >
            <LidIcon type={current.value} size={22} halo={TRIGGER_SURFACE} />
            <Text size="xs" fw={700} ff="monospace" c="black">
              {current.label}
            </Text>
            <ChevronDown size={14} color="var(--mantine-color-sand-8)" />
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        {LID_OPTIONS.map((o) => (
          <Menu.Item
            key={o.value}
            onClick={() => {
              onChange({ lidType: o.value, lidTolerance: LID_TOLERANCE_DEFAULT[o.value] });
            }}
            leftSection={<LidIcon type={o.value} size={30} halo={MENU_SURFACE} />}
          >
            <Box>
              <Text size="sm" fw={700} ff="monospace">
                {o.label}
              </Text>
              <Text size="xs" c="dimmed">
                {o.hint}
              </Text>
            </Box>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
