"use client";

import { Button, Group, Menu, Text } from "@mantine/core";
import { Box, ChevronUp, Download, Package, Share2 } from "lucide-react";

const FORMATS = [
  { value: "stl", icon: Box, hint: "FDM printing" },
  { value: "step", icon: Package, hint: "CAD interchange" },
] as const;

// The rail's pinned closing block, all on one line: a split button pairing the
// export action with the format it will write, then Share.
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
      gap="md"
      p="lg"
      mt="auto"
      bg="sand.3"
      wrap="nowrap"
      style={{ borderTop: "1px solid var(--mantine-color-sand-6)", flex: "none" }}
    >
      {/* The format picker rides on the export button rather than standing
          apart, since it only ever qualifies that one action. */}
      <Button.Group style={{ flex: 1 }}>
        <Button
          size="md"
          flex={1}
          loading={exporting}
          onClick={onExport}
          leftSection={<Download size={18} />}
          tt="uppercase"
          fw={600}
          styles={{ label: { letterSpacing: ".06em" } }}
        >
          Export {fmt.toUpperCase()}
        </Button>
        <Menu position="top-end" withinPortal>
          <Menu.Target>
            <Button
              size="md"
              px="sm"
              title="Choose export format"
              aria-label="Choose export format"
              style={{ borderLeft: "1px solid var(--mantine-color-rust-8)" }}
            >
              <ChevronUp size={18} />
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Export format</Menu.Label>
            {FORMATS.map((f) => (
              <Menu.Item
                key={f.value}
                leftSection={<f.icon size={16} />}
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
      </Button.Group>

      <Button
        variant="default"
        size="md"
        flex={1}
        leftSection={<Share2 size={16} />}
        title="Share config link"
      >
        Share
      </Button>
    </Group>
  );
}
