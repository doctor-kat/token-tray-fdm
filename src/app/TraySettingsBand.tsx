"use client";

import { Box, Group, NumberInput, Stack, Text, UnstyledButton } from "@mantine/core";
import { WandSparkles } from "lucide-react";
import { ParamIcon, type ParamIconName } from "@/app/icons/ParamIcon";
import type { TrayParams } from "@/app/lib/model";
import { dispVal, toMm, type Units } from "@/app/lib/units";

// The parameter pills are outlined rather than filled: a warm hairline that
// picks up the tan of the recolored dimension icons, over the card surface.
const FIELD_BORDER = "1px solid var(--mantine-color-sand-6)";

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
  icon: ParamIconName;
}> = [
  { flag: "height", key: "depth", label: "Height", min: 6, max: 120, icon: "height" },
  {
    flag: "wall",
    key: "wallThickness",
    label: "Wall width",
    min: 0.4,
    max: 6,
    step: 0.2,
    icon: "wall",
  }, // prettier-ignore
  {
    key: "outerWallThickness",
    label: "Outer wall",
    min: 0.4,
    max: 6,
    step: 0.2,
    icon: "outerWall",
  },
  { flag: "side", key: "sideFillet", label: "Side fillet", min: 0, max: 20, icon: "side" },
  { flag: "bottom", key: "bottomFillet", label: "Bottom fillet", min: 0, max: 20, icon: "bottom" },
];

/** Numeric field in display units, rendered as a compact filled pill: an
 * optional dimension glyph on a left rail, then a stacked label + editable
 * value (with a trailing unit) on the right. When `onToggleAuto` is given the
 * label doubles as the auto-mode toggle. */
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
  icon,
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
  /** Optional dimension glyph shown on the pill's left rail. */
  icon?: ParamIconName;
}) {
  // Lengths are stored in mm and displayed in the user's units; everything
  // else passes through untouched.
  const isLength = rawUnit === undefined;
  const shown = isLength ? dispVal(value, units) : value;
  const unit = isLength ? (units === "inch" ? "in" : units) : rawUnit;

  // Size the input to its digits so the value + unit read as one tight token,
  // rather than a fixed box that leaves a gap before the unit. Space Mono at
  // 20px advances ~12px per glyph.
  const inputW = Math.max(1, String(shown).length) * 12 + 2;

  // The label, optionally wrapped in the auto-mode toggle (wand + accent).
  const labelText = (
    <Text
      component="span"
      fz={9}
      fw={600}
      lts=".06em"
      tt="uppercase"
      c={auto ? "rust.6" : "sand.8"}
      style={{ whiteSpace: "nowrap" }}
    >
      {label}
    </Text>
  );

  return (
    <Group
      gap={0}
      wrap="nowrap"
      align="stretch"
      w="fit-content"
      style={{ border: FIELD_BORDER, borderRadius: 14, overflow: "hidden" }}
    >
      {icon && (
        <Box
          w={58}
          style={{ flex: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <ParamIcon name={icon} size={46} />
        </Box>
      )}
      <Stack gap={2} justify="center" miw={0} py={10} pr={16} pl={icon ? 4 : 16}>
        {onToggleAuto ? (
          <UnstyledButton
            component="span"
            onClick={onToggleAuto}
            title={`Auto ${label.toLowerCase()}`}
          >
            <Group gap={4} wrap="nowrap">
              <WandSparkles size={11} color={`var(--mantine-color-${auto ? "rust" : "sand"}-6)`} />
              {labelText}
            </Group>
          </UnstyledButton>
        ) : (
          labelText
        )}
        <Group gap={4} wrap="nowrap" align="baseline">
          <NumberInput
            aria-label={label}
            variant="unstyled"
            size="xs"
            w={inputW}
            value={shown}
            disabled={auto}
            step={step ?? 1}
            min={min}
            max={max}
            clampBehavior="blur"
            hideControls
            styles={{
              input: {
                minHeight: 0,
                height: "auto",
                width: "100%",
                padding: 0,
                lineHeight: 1.1,
                textAlign: "left",
                fontFamily: "var(--font-space-mono), monospace",
                fontWeight: 700,
                fontSize: 20,
                color: "var(--mantine-color-black)",
                // Auto mode disables editing, but the value must stay just as
                // legible as an active one — keep full ink contrast and only
                // let the cursor signal that it's locked.
                "&:disabled": {
                  color: "var(--mantine-color-black)",
                  opacity: 1,
                  cursor: "not-allowed",
                  background: "transparent",
                },
              },
            }}
            onChange={(v) => {
              if (typeof v === "number") {
                onChange(isLength ? toMm(v, units) : v);
              }
            }}
          />
          {unit && (
            <Text component="span" fz={10} fw={600} c="sand.8" style={{ whiteSpace: "nowrap" }}>
              {unit}
            </Text>
          )}
        </Group>
      </Stack>
    </Group>
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
  /** Omit (or pass empty) to drop the header row entirely. */
  title?: string;
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
      {(title || action) && (
        <Group justify="space-between" mih={26}>
          <Text size="xs" ff="monospace" fw={700} c="sand.8" tt="uppercase" lts=".14em">
            {title}
          </Text>
          {action}
        </Group>
      )}
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
      <Group gap="xs">
        {FIELDS.map((f) => (
          <Field
            key={f.key}
            icon={f.icon}
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
      </Group>
    </Section>
  );
}
