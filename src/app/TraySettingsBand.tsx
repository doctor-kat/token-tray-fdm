"use client";

import { Group, NumberInput, SimpleGrid, Stack, Text, UnstyledButton } from "@mantine/core";
import { WandSparkles } from "lucide-react";
import * as React from "react";
import { ParamIcon, type ParamIconName } from "@/app/icons/ParamIcon";
import type { TrayParams } from "@/app/lib/model";
import { DIMENSION_MD, DIMENSION_SM, HEADER_SECTION, LABEL_XS } from "@/app/theme";
import { dispVal, toMm, type Units } from "@/app/lib/units";

// The parameter capsules are outlined rather than filled: a warm hairline over
// the lightest paper surface, which brightens to white on hover.
const FIELD_BORDER = "1px solid var(--mantine-color-sand-6)";

/** How parameter fields present themselves.
 *
 * `row` is the narrow control rail: the label sits on the left and only the
 * value is capsuled, so a 400px column stays legible. `tile` is the wide
 * band under the previews, where fields sit three-up in a grid and each
 * capsule has to carry its own label.
 *
 * It's context rather than a prop because five separate panels render fields
 * and none of them care which shape is in use — only the shell does.
 */
export type FieldVariant = "row" | "tile";

const FieldVariantContext = React.createContext<FieldVariant>("row");

export function FieldVariantProvider({
  variant,
  children,
}: {
  variant: FieldVariant;
  children: React.ReactNode;
}) {
  return <FieldVariantContext value={variant}>{children}</FieldVariantContext>;
}

/** Wraps a run of `Field`s: a stack in the rail, a three-up grid in the band.
 * Panels use this instead of a bare `Stack` so the arrangement follows the
 * variant without every panel restating it. */
export function FieldGroup({ children }: { children: React.ReactNode }) {
  const variant = React.useContext(FieldVariantContext);
  return variant === "tile" ? (
    <SimpleGrid cols={{ base: 2, md: 3 }} spacing="md" verticalSpacing="md">
      {children}
    </SimpleGrid>
  ) : (
    <Stack gap="md">{children}</Stack>
  );
}

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

/** Numeric field in display units, rendered as the design's parameter row: the
 * label (with an optional dimension glyph) on the left, and a pill capsule on
 * the right holding the editable value and its unit. When `onToggleAuto` is
 * given, a wand toggle rides inside the capsule as a trailing icon. */
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
  // 14px advances ~8.4px per glyph.
  const inputW = Math.ceil(Math.max(1, String(shown).length) * 8.4) + 2;
  const variant = React.useContext(FieldVariantContext);
  const tile = variant === "tile";

  // The dimension sketches are the app's own artwork and carry real information
  // (which quantity the field edits), so they keep a size where the measure
  // arrows still read rather than shrinking to a generic 16px glyph.
  const glyph = icon ? <ParamIcon name={icon} size={tile ? 48 : 64} /> : null;

  const capsule = (
    <Group
      gap={6}
      wrap="nowrap"
      px="md"
      py={6}
      bg="sand.0"
      className="parameter-capsule"
      style={{
        border: FIELD_BORDER,
        borderRadius: 9999,
        // In the rail the capsule hugs its digits beside the label; as a tile
        // it *is* the field, so it spans the grid cell.
        flex: tile ? "1 1 auto" : "none",
      }}
    >
      {tile && glyph}
      {tile && (
        <Text
          component="span"
          c="sand.8"
          tt="uppercase"
          style={{ ...LABEL_XS, whiteSpace: "nowrap", flex: 1 }}
        >
          {label}
        </Text>
      )}
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
              ...DIMENSION_MD,
              minHeight: 0,
              height: "auto",
              width: "100%",
              padding: 0,
              textAlign: "right",
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
          <Text component="span" c="sand.8" style={{ ...DIMENSION_SM, whiteSpace: "nowrap" }}>
            {unit.toUpperCase()}
          </Text>
        )}
        {onToggleAuto && (
          <UnstyledButton
            component="span"
            onClick={onToggleAuto}
            title={`Auto ${label.toLowerCase()}`}
            style={{ display: "flex", alignItems: "center" }}
          >
            <WandSparkles
              size={28}
              color={`var(--mantine-color-${auto ? "rust-6" : "stone-8"})`}
              fill={auto ? "var(--mantine-color-rust-6)" : "none"}
            />
          </UnstyledButton>
        )}
    </Group>
  );

  if (tile) {
    return capsule;
  }

  return (
    <Group justify="space-between" wrap="nowrap" gap="sm">
      <Group gap="sm" wrap="nowrap" miw={0}>
        {glyph}
        <Text component="span" fz="md" c="sand.8" style={{ whiteSpace: "nowrap" }}>
          {label}
        </Text>
      </Group>
      {capsule}
    </Group>
  );
}

/** Shared section shell for the control rail: every panel gets the same
 * padding and an uppercase monospace heading underlined by a hairline rule. */
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
    <Stack gap="md" px="lg" pt="lg" {...rest}>
      {(title || action) && (
        <Group
          justify="space-between"
          mih={22}
          pb="xs"
          style={{ borderBottom: FIELD_BORDER }}
          wrap="nowrap"
        >
          <Text component="h3" c="sand.9" style={HEADER_SECTION} m={0}>
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
      <FieldGroup>
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
      </FieldGroup>
    </Section>
  );
}
