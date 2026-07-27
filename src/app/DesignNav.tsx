"use client";

import Link from "next/link";
import { ActionIcon, Group, Tooltip, UnstyledButton } from "@mantine/core";
import { Github } from "lucide-react";
import { DESIGN_ORDER, DESIGNS, type DesignId } from "@/app/lib/designs";
import { HEADER_SECTION } from "@/app/theme";

const REPO_URL = "https://github.com/doctor-kat/token-tray-fdm";

// Map design IDs to route paths
const DESIGN_ROUTES: Record<DesignId, string> = {
  "token-tray": "/token-tray",
  "quick-draw": "/quick-draw",
  wyrmwood: "/wyrmwood-accessory",
};

// The app-wide top bar: the design picker, then the source link. The picker
// reads the registry rather than a local list so a newly registered design
// shows up here automatically.
export function DesignNav({
  design,
  onChange,
}: {
  design: DesignId;
  onChange?: (id: DesignId) => void;
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
            const href = DESIGN_ROUTES[id];
            return (
              <UnstyledButton
                key={id}
                component={Link}
                href={href}
                onClick={() => {
                  onChange?.(id);
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

      <Tooltip label="Source on GitHub" withArrow openDelay={400}>
        <ActionIcon
          component="a"
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          variant="subtle"
          color="sand.8"
          size="xl"
          aria-label="Source on GitHub"
          style={{ flex: "none" }}
        >
          <Github size={40} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}
