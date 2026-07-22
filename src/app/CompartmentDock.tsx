"use client";

import {Button, Menu, Text } from "@mantine/core";
import { ChevronDown, Shapes, Trash2 } from "lucide-react";
import type { Units } from "@/app/lib/units";
import { Field, FieldGroup, Section } from "@/app/TraySettingsBand";

export const COMPARTMENT_PRESETS = [
  { name: "Standard meeple", w: 20, l: 20 },
  { name: "Large meeple", w: 25, l: 25 },
  { name: "D6 die", w: 18, l: 18 },
  { name: "Coin / chip", w: 32, l: 32 },
  { name: "Mini card", w: 46, l: 66 },
  { name: "Poker card", w: 66, l: 92 },
];

// One editable compartment dimension (width / length / depth).
export type DimControl = {
  label: string;
  value: number;
  auto: boolean;
  onChange: (mm: number) => void;
  onToggleAuto: () => void;
};

export function CompartmentDock({
  index,
  units,
  dims,
  onDelete,
  onApplyPreset,
}: {
  index: number;
  units: Units;
  dims: DimControl[];
  onDelete: () => void;
  onApplyPreset: (w: number, l: number) => void;
}) {
  return (
    <Section
      title={`Compartment ${index}`}
      bg="sand.1"
      action={
        <Menu position="top-end" withinPortal>
          <Menu.Target>
            <Button
              variant="default"
              size="xs"
              radius="xl"
              leftSection={<Shapes size={28} />}
              rightSection={<ChevronDown size={26} />}
            >
              Presets
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            {COMPARTMENT_PRESETS.map((p) => (
              <Menu.Item
                key={p.name}
                onClick={() => {
                  onApplyPreset(p.w, p.l);
                }}
                rightSection={
                  <Text size="xs" ff="monospace" c="dimmed">
                    {p.w}×{p.l}
                  </Text>
                }
              >
                {p.name}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      }
    >
      <FieldGroup>
        {dims.map((d) => (
          <Field
            key={d.label}
            label={d.label}
            value={d.value}
            units={units}
            auto={d.auto}
            min={1}
            onChange={d.onChange}
            onToggleAuto={d.onToggleAuto}
          />
        ))}
      </FieldGroup>

      <Button
        variant="light"
        color="red"
        radius="xl"
        leftSection={<Trash2 size={32} />}
        onClick={onDelete}
      >
        Delete compartment
      </Button>
    </Section>
  );
}
