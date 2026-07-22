"use client";

import { Group } from "@mantine/core";
import { DESIGN_ORDER, DESIGNS, type DesignId } from "@/app/lib/designs";

// The app-wide top nav: picks which parametric model is being edited. Reads the
// registry rather than a local list so a newly registered design shows up here
// automatically. Rendered as a full-width bar above every layout.
export function DesignNav({
  design,
  onChange,
}: {
  design: DesignId;
  onChange: (id: DesignId) => void;
}) {
  return (
    <Group
      component="nav"
      gap={4}
      px="lg"
      h={48}
      bg="sand.1"
      wrap="nowrap"
      style={{ borderBottom: "1px solid var(--mantine-color-sand-5)" }}
    >
      {DESIGN_ORDER.map((id) => {
        const active = id === design;
        return (
          <button
            key={id}
            type="button"
            onClick={() => {
              onChange(id);
            }}
            title={DESIGNS[id].blurb}
            style={{
              appearance: "none",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              height: "100%",
              padding: "0 var(--mantine-spacing-sm)",
              fontSize: "var(--mantine-font-size-sm)",
              fontWeight: active ? 700 : 500,
              color: active ? "var(--mantine-color-rust-7)" : "var(--mantine-color-sand-9)",
              borderBottom: active
                ? "2px solid var(--mantine-color-rust-6)"
                : "2px solid transparent",
            }}
          >
            {DESIGNS[id].label}
          </button>
        );
      })}
    </Group>
  );
}
