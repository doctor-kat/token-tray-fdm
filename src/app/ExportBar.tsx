"use client";

import { ActionIcon, Button, Group, Menu, Text } from "@mantine/core";
import { Box, ChevronUp, Package, Share2 } from "lucide-react";

const FORMATS = [
  { value: "stl", icon: Box, hint: "FDM printing" },
  { value: "step", icon: Package, hint: "CAD interchange" },
] as const;

export function ExportBar({
  fmt,
  exporting,
  onPickFmt,
  onExport,
}: {
  fmt: "stl" | "step";
  exporting: boolean;
  onPickFmt: (fmt: "stl" | "step") => void;
  onExport: () => void;
}) {
  return (
    <Group
      gap="sm"
      px="lg"
      py="md"
      mt="auto"
      wrap="nowrap"
      style={{ borderTop: "1px solid var(--mantine-color-sand-5)" }}
    >
      <Button.Group style={{ flex: 1 }}>
        <Button size="md" flex={1} loading={exporting} onClick={onExport}>
          Export {fmt.toUpperCase()}
        </Button>
        <Menu position="top-end" withinPortal>
          <Menu.Target>
            <Button size="md" px="sm" title="Choose format">
              <ChevronUp size={18} />
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            {FORMATS.map((f) => (
              <Menu.Item
                key={f.value}
                leftSection={<f.icon size={16} />}
                onClick={() => {
                  onPickFmt(f.value);
                }}
              >
                {f.value.toUpperCase()}{" "}
                <Text span size="xs" c="dimmed">
                  — {f.hint}
                </Text>
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      </Button.Group>
      <ActionIcon variant="default" size="lg" title="Share config link">
        <Share2 size={18} />
      </ActionIcon>
    </Group>
  );
}
