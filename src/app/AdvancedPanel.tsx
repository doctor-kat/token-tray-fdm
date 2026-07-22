"use client";

import { Checkbox, Group, Radio, SimpleGrid, Stack, Text, TextInput } from "@mantine/core";
import type { LidType, TrayParams } from "@/app/lib/model";
import type { Units } from "@/app/lib/units";
import { LidIcon } from "@/app/lid-icons/LidIcon";
import { Field, Section } from "@/app/TraySettingsBand";

const LID_OPTIONS: Array<{ value: LidType; label: string; hint: string }> = [
  { value: "none", label: "None", hint: "Open tray" },
  { value: "lid", label: "Lid", hint: "Wraps around the tray" },
  { value: "sliding-lid", label: "Sliding Lid", hint: "Slides in from the front" },
  { value: "cover", label: "Cover", hint: "Press-fit onto the opening" },
];

// Card fill — the literal value of `sand.1`. Kept as a hex because the icon's
// arrow halo needs a concrete color to blend into the card.
const CARD_SURFACE = "#f4f1ea";

// Each lid type ships with its own sensible clearance (matches the reference).
const LID_TOLERANCE_DEFAULT: Record<LidType, number> = {
  none: 0.6,
  lid: 0.6,
  "sliding-lid": 0.1,
  cover: 0.2,
};

export function AdvancedPanel({
  params,
  units,
  onChange,
}: {
  params: TrayParams;
  units: Units;
  onChange: (patch: Partial<TrayParams>) => void;
}) {
  const { lidType } = params;
  const isCover = lidType === "cover";

  return (
    <Section title="Advanced">
      <Radio.Group
        label="Lid type"
        value={lidType}
        onChange={(v) => {
          onChange({ lidType: v as LidType, lidTolerance: LID_TOLERANCE_DEFAULT[v as LidType] });
        }}
      >
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs" mt="xs">
          {LID_OPTIONS.map((o) => (
            <Radio.Card key={o.value} value={o.value} p="xs" bg={CARD_SURFACE}>
              <Stack gap={4} align="center">
                <LidIcon type={o.value} size={46} halo={CARD_SURFACE} />
                <Text size="xs" fw={700} ff="monospace" ta="center">
                  {o.label}
                </Text>
                <Text size="xs" c="dimmed" ta="center" lh={1.3}>
                  {o.hint}
                </Text>
              </Stack>
            </Radio.Card>
          ))}
        </SimpleGrid>
      </Radio.Group>

      {isCover && (
        <Checkbox
          label="Cover lip"
          checked={params.withCoverLip}
          onChange={(e) => {
            onChange({ withCoverLip: e.currentTarget.checked });
          }}
        />
      )}

      <Group grow align="flex-end" gap="xs">
        {isCover && (
          <Field
            label="Cover depth"
            value={params.lidInnerHeight}
            units={units}
            min={1}
            max={40}
            onChange={(mm) => {
              onChange({ lidInnerHeight: mm });
            }}
          />
        )}

        {lidType !== "none" && (
          <Field
            label="Lid tolerance"
            value={params.lidTolerance}
            units={units}
            step={0.05}
            min={0}
            max={3}
            onChange={(mm) => {
              onChange({ lidTolerance: mm });
            }}
          />
        )}

        <TextInput
          label="Model name"
          value={params.modelName}
          placeholder="token-tray"
          onChange={(e) => {
            onChange({ modelName: e.currentTarget.value });
          }}
        />
      </Group>
    </Section>
  );
}
