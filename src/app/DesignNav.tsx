"use client";

import { ActionIcon, Box, Group, Text, Title, UnstyledButton } from "@mantine/core";
import { CircleHelp, Settings } from "lucide-react";
import { DESIGN_ORDER, DESIGNS, type DesignId } from "@/app/lib/designs";
import { HEADER_SECTION } from "@/app/theme";

// The app-wide top bar: the wordmark, then the design picker, then the account
// affordances. The picker reads the registry rather than a local list so a newly
// registered design shows up here automatically.
export function DesignNav({
  design,
  onChange,
}: {
  design: DesignId;
  onChange: (id: DesignId) => void;
}) {
  return (
    <Group
      component="header"
      justify="space-between"
      px="lg"
      h={64}
      bg="sand.1"
      wrap="nowrap"
      style={{ borderBottom: "1px solid var(--mantine-color-sand-6)", flex: "none" }}
    >
      <Group gap="xl" wrap="nowrap" h="100%" miw={0} style={{ flex: 1 }}>
        <Title order={1} c="rust.6" fw={700} fz={{ base: "20px", sm: "32px" }} style={{ flex: "none" }}>
          Token Tray
        </Title>

        {/* The picker stays on every breakpoint — it is the only way to change
            design — and scrolls sideways rather than wrapping or hiding. */}
        <Group
          component="nav"
          gap="lg"
          wrap="nowrap"
          h="100%"
          miw={0}
          style={{ overflowX: "auto", scrollbarWidth: "none" }}
        >
          {DESIGN_ORDER.map((id) => {
            const active = id === design;
            return (
              <UnstyledButton
                key={id}
                onClick={() => {
                  onChange(id);
                }}
                title={DESIGNS[id].blurb}
                c={active ? "rust.6" : "sand.8"}
                pb={4}
                style={{
                  ...HEADER_SECTION,
                  whiteSpace: "nowrap",
                  borderBottom: active
                    ? "2px solid var(--mantine-color-rust-6)"
                    : "2px solid transparent",
                }}
              >
                {DESIGNS[id].label}
              </UnstyledButton>
            );
          })}
        </Group>
      </Group>

      <Group gap="md" wrap="nowrap" style={{ flex: "none" }}>
        {/* Secondary chrome yields to the design picker on narrow screens. */}
        <ActionIcon variant="subtle" color="sand.8" aria-label="Help" visibleFrom="sm">
          <CircleHelp size={20} />
        </ActionIcon>
        <ActionIcon variant="subtle" color="sand.8" aria-label="Settings" visibleFrom="sm">
          <Settings size={20} />
        </ActionIcon>
        {/* Placeholder account chip — there is no auth in this app yet. */}
        <Box
          w={32}
          h={32}
          bg="sand.4"
          style={{
            borderRadius: "50%",
            border: "1px solid var(--mantine-color-sand-6)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Text style={HEADER_SECTION} c="sand.8">
            TT
          </Text>
        </Box>
      </Group>
    </Group>
  );
}
