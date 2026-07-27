"use client";

import { ActionIcon, Box, Button, Group, Menu, Stack, Text, UnstyledButton } from "@mantine/core";
import { ChevronDown, Shapes, Trash2 } from "lucide-react";
import { dispVal, type Units } from "@/app/lib/units";
import { Field, FieldGroup, Section } from "@/app/TraySettingsBand";
import { DIMENSION_SM } from "@/app/theme";

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

/** One row of the compartment roster: what to call it and how big it is. */
export type CompartmentEntry = {
  id: string;
  name: string;
  w: number;
  l: number;
};

/** The compartment column.
 *
 * The roster is always on show, so the tray's bins can be read (and picked)
 * without going to the plan view. Below it sits the editor: a dotted
 * placeholder until a bin is selected, then that bin's controls in the same
 * slot — so selecting swaps the box's contents rather than growing the column.
 */
export function CompartmentDock({
  units,
  entries,
  selectedId,
  dims,
  onSelect,
  onDelete,
  onApplyPreset,
}: {
  units: Units;
  entries: CompartmentEntry[];
  selectedId: string | null;
  /** The selected bin's dimension controls; empty when nothing is picked. */
  dims: DimControl[];
  onSelect: (id: string) => void;
  onDelete: () => void;
  onApplyPreset: (w: number, l: number) => void;
}) {
  const selected = selectedId !== null && dims.length > 0;

  return (
    <Section
      title="Compartments"
      bg="sand.1"
      action={
        selected ? (
          <Menu position="bottom-end" withinPortal>
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
        ) : null
      }
    >
      <Stack gap={0}>
        {entries.map((e) => {
          const active = e.id === selectedId;
          return (
            <Group
              key={e.id}
              gap="xs"
              wrap="nowrap"
              pr="xs"
              bg={active ? "sand.3" : undefined}
              className="compartment-row"
              style={{
                borderLeft: `3px solid ${active ? "var(--mantine-color-rust-6)" : "transparent"}`,
              }}
            >
              <UnstyledButton
                onClick={() => {
                  onSelect(e.id);
                }}
                px="sm"
                py={6}
                flex={1}
                miw={0}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "var(--mantine-spacing-sm)",
                }}
              >
                <Text component="span" fz="md" c={active ? "black" : "sand.9"} truncate>
                  {e.name}
                </Text>
                <Text component="span" c="sand.8" style={{ ...DIMENSION_SM, whiteSpace: "nowrap" }}>
                  {dispVal(e.w, units)}×{dispVal(e.l, units)}
                </Text>
              </UnstyledButton>
              {/* Delete rides on the selected row rather than sitting under the
                  editor, so the target of the action is unambiguous. */}
              {active && (
                <ActionIcon
                  variant="subtle"
                  color="red"
                  aria-label={`Delete ${e.name}`}
                  title={`Delete ${e.name}`}
                  onClick={onDelete}
                >
                  <Trash2 size={26} />
                </ActionIcon>
              )}
            </Group>
          );
        })}
      </Stack>

      {selected ? (
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
      ) : (
        // The empty slot keeps the column's shape while telling the user what
        // to do to fill it — the dotted rule reads as "something goes here".
        <Box
          p="xl"
          style={{
            border: "2px dashed var(--mantine-color-sand-6)",
            borderRadius: "var(--mantine-radius-md)",
            textAlign: "center",
          }}
        >
          <Text c="sand.8" fz="md">
            Select a compartment
          </Text>
        </Box>
      )}
    </Section>
  );
}
