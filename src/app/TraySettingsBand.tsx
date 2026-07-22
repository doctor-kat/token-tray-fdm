"use client";

import { Group, NumberInput, SimpleGrid, Stack, Text, UnstyledButton } from "@mantine/core";
import { WandSparkles } from "lucide-react";
import type { TrayParams } from "@/app/lib/model";
import { dispVal, toMm, type Units } from "@/app/lib/units";

export type SettingsFlag = "height" | "wall" | "side" | "bottom";

// Each field maps a flag to the TrayParams key it edits, plus its clamp range.
// Only the numeric TrayParams keys are editable here.
type NumericParamKey = {
  [K in keyof TrayParams]: TrayParams[K] extends number ? K : never;
}[keyof TrayParams];

// `flag` is omitted for fields that have no auto mode.
const FIELDS: Array<{
  flag?: SettingsFlag;
  key: NumericParamKey;
  label: string;
  min: number;
  max: number;
  step?: number;
}> = [
  { flag: "height", key: "depth", label: "Height", min: 6, max: 120 },
  { flag: "wall", key: "wallThickness", label: "Wall width", min: 0.4, max: 6, step: 0.2 },
  { key: "outerWallThickness", label: "Outer wall", min: 0.4, max: 6, step: 0.2 },
  { flag: "side", key: "sideFillet", label: "Side fillet", min: 0, max: 20 },
  { flag: "bottom", key: "bottomFillet", label: "Bottom fillet", min: 0, max: 20 },
];

/** Numeric field in display units. When `onToggleAuto` is given the label
 * doubles as the auto-mode toggle. */
export function Field({
  value,
  units,
  auto = false,
  step,
  min,
  max,
  onChange,
  onToggleAuto,
  label,
  rawUnit,
}: {
  value: number;
  units: Units;
  auto?: boolean;
  step?: number;
  min?: number;
  max?: number;
  onChange: (mm: number) => void;
  onToggleAuto?: () => void;
  label: string;
  /** Set for quantities that aren't lengths (angles, counts). Suppresses the
   * mm/inch conversion and shows this suffix instead — "" for a bare number. */
  rawUnit?: string;
}) {
  // Lengths are stored in mm and displayed in the user's units; everything
  // else passes through untouched.
  const isLength = rawUnit === undefined;
  const shown = isLength ? dispVal(value, units) : value;
  const suffix = isLength ? units : rawUnit;

  return (
    <NumberInput
      // Label sits *below* the box and doubles as the auto-mode toggle.
      inputWrapperOrder={["input", "label"]}
      labelProps={{ mt: 7, fz: 9, fw: 600 }}
      label={
        <Group gap={5} wrap="nowrap" justify="center">
          {onToggleAuto ? (
            <UnstyledButton
              component="span"
              onClick={onToggleAuto}
              title={`Auto ${label.toLowerCase()}`}
            >
              <Group gap={5} wrap="nowrap">
                <WandSparkles
                  size={12}
                  color={`var(--mantine-color-${auto ? "rust" : "sand"}-6)`}
                />
                <Text inherit tt="uppercase" lts=".06em" c={auto ? "rust.6" : "sand.8"}>
                  {label}
                </Text>
              </Group>
            </UnstyledButton>
          ) : (
            <Text inherit tt="uppercase" lts=".06em" c="sand.8">
              {label}
            </Text>
          )}
        </Group>
      }
      value={shown}
      disabled={auto}
      step={step ?? 1}
      min={min}
      max={max}
      clampBehavior="blur"
      radius="md"
      styles={{
        input: {
          textAlign: "center",
          fontFamily: "var(--mantine-font-family-monospace)",
          fontWeight: 700,
        },
      }}
      rightSection={
        suffix ? (
          <Text fz={9} fw={600} c="sand.8">
            {suffix}
          </Text>
        ) : null
      }
      rightSectionWidth={suffix ? 26 : 0}
      rightSectionPointerEvents="none"
      hideControls
      onChange={(v) => {
        if (typeof v === "number") {
          onChange(isLength ? toMm(v, units) : v);
        }
      }}
    />
  );
}

/** Shared section shell for the control rail: every panel gets the same
 * padding, hairline top rule, and uppercase monospace heading. */
export function Section({
  title,
  action,
  children,
  ...rest
}: {
  title: string;
  /** Optional control rendered inline, right-aligned against the heading. */
  action?: React.ReactNode;
  children: React.ReactNode;
} & Omit<React.ComponentProps<typeof Stack>, "title">) {
  return (
    <Stack
      gap="sm"
      px="lg"
      py="md"
      style={{ borderTop: "1px solid var(--mantine-color-sand-5)" }}
      {...rest}
    >
      <Group justify="space-between" mih={26}>
        <Text size="xs" ff="monospace" fw={700} c="sand.8" tt="uppercase" lts=".14em">
          {title}
        </Text>
        {action}
      </Group>
      {children}
    </Stack>
  );
}

export function TraySettingsBand({
  params,
  units,
  auto,
  onChange,
  onToggleAuto,
}: {
  params: TrayParams;
  units: Units;
  auto: Record<SettingsFlag, boolean>;
  onChange: (patch: Partial<TrayParams>) => void;
  onToggleAuto: (flag: SettingsFlag) => void;
}) {
  return (
    <Section title="Tray settings">
      <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="xs" verticalSpacing="sm">
        {FIELDS.map((f) => (
          <Field
            key={f.key}
            label={f.label}
            value={params[f.key]}
            units={units}
            auto={f.flag ? auto[f.flag] : false}
            step={f.step}
            min={f.min}
            max={f.max}
            onChange={(mm) => {
              onChange({ [f.key]: mm });
            }}
            onToggleAuto={
              f.flag
                ? () => {
                    onToggleAuto(f.flag as SettingsFlag);
                  }
                : undefined
            }
          />
        ))}
      </SimpleGrid>
    </Section>
  );
}
