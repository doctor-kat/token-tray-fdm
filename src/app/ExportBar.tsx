"use client";

import { ActionIcon, Button, Group, Menu, Stack, Text } from "@mantine/core";
import { Box, Download, MoreHorizontal, Package, Share2 } from "lucide-react";

const FORMATS = [
  { value: "stl", icon: Box, hint: "FDM printing" },
  { value: "step", icon: Package, hint: "CAD interchange" },
] as const;

// The rail's pinned closing block: the primary export action, with the
// secondary share/format affordances demoted to a row beneath it.
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
    <Stack
      gap="md"
      p="lg"
      mt="auto"
      bg="sand.3"
      style={{ borderTop: "1px solid var(--mantine-color-sand-6)", flex: "none" }}
    >
      <Button
        size="md"
        fullWidth
        loading={exporting}
        onClick={onExport}
        leftSection={<Download size={36} />}
        tt="uppercase"
        fw={600}
        styles={{ label: { letterSpacing: ".06em" } }}
      >
        Export {fmt.toUpperCase()}
      </Button>

      <Group gap="md" wrap="nowrap">
        <Button
          variant="default"
          size="md"
          flex={1}
          leftSection={<Share2 size={32} />}
          title="Share config link"
        >
          Share
        </Button>
        <Menu position="top-end" withinPortal>
          <Menu.Target>
            <ActionIcon variant="default" size={42} w={56} title="Choose export format">
              <MoreHorizontal size={36} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Export format</Menu.Label>
            {FORMATS.map((f) => (
              <Menu.Item
                key={f.value}
                leftSection={<f.icon size={32} />}
                onClick={() => {
                  onPickFmt(f.value);
                }}
              >
                {f.value.toUpperCase()}{" "}
                <Text span size="sm" c="dimmed">
                  — {f.hint}
                </Text>
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Stack>
  );
}
