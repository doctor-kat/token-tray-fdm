"use client";

import { Checkbox, Group, Select, Text } from "@mantine/core";
import {
  CARD_PRESETS,
  type CardPresetId,
  type QuickDrawLidType,
  type QuickDrawParams,
  quickDrawDims,
} from "@/app/lib/quick-draw";
import type { Units } from "@/app/lib/units";
import { Field, Section } from "@/app/TraySettingsBand";

// Controls for the Quick Draw deck box. Mirrors the reference site's ordering
// so the two are easy to compare.
export function QuickDrawPanel({
  params,
  units,
  onChange,
}: {
  params: QuickDrawParams;
  units: Units;
  onChange: (patch: Partial<QuickDrawParams>) => void;
}) {
  const dims = quickDrawDims(params);
  const isCustom = params.cardType === "custom";

  // Picking a preset stamps its dimensions in, so the (disabled) card fields
  // always show what's actually being built.
  const pickCardType = (id: CardPresetId) => {
    const preset = CARD_PRESETS.find((c) => c.id === id);
    if (!preset) {
      return;
    }

    onChange({ cardType: id, cardHeight: preset.cardHeight, cardWidth: preset.cardWidth });
  };

  return (
    <>
      <Section title="Card box">
        <Select
          label="Card type"
          value={params.cardType}
          onChange={(v) => {
            if (v) {
              pickCardType(v as CardPresetId);
            }
          }}
          data={CARD_PRESETS.map((c) => ({ value: c.id, label: c.label }))}
          allowDeselect={false}
        />

        <Group gap="xs">
          <Field
            label="Card height"
            value={params.cardHeight}
            units={units}
            auto={!isCustom}
            min={20}
            max={200}
            onChange={(mm) => {
              onChange({ cardHeight: mm });
            }}
          />
          <Field
            label="Card width"
            value={params.cardWidth}
            units={units}
            auto={!isCustom}
            min={20}
            max={200}
            onChange={(mm) => {
              onChange({ cardWidth: mm });
            }}
          />
          <Field
            label="Deck height"
            value={params.deckHeight}
            units={units}
            min={3}
            max={150}
            onChange={(mm) => {
              onChange({ deckHeight: mm });
            }}
          />
          <Field
            label="Deck count"
            value={params.deckCount}
            units={units}
            rawUnit=""
            min={1}
            max={6}
            onChange={(n) => {
              onChange({ deckCount: Math.max(1, Math.round(n)) });
            }}
          />
        </Group>

        <Group gap={6}>
          <Text fz="xs" c="dimmed">
            tray {dims.trayW.toFixed(1)} × {dims.trayL.toFixed(1)} × {dims.trayH.toFixed(1)}
          </Text>
          {params.lidType !== "none" && (
            <Text fz="xs" c="dimmed">
              · lid {dims.lidW.toFixed(1)} × {dims.lidL.toFixed(1)} × {dims.lidH.toFixed(1)}
            </Text>
          )}
        </Group>

        <Select
          label="Lid type"
          value={params.lidType}
          onChange={(v) => {
            if (v) {
              onChange({ lidType: v as QuickDrawLidType });
            }
          }}
          data={[
            { value: "lid", label: "Lid" },
            { value: "cover", label: "Cover" },
            { value: "none", label: "None" },
          ]}
          allowDeselect={false}
        />

        <Checkbox
          label="Lid cutout"
          checked={params.lidCutout}
          onChange={(e) => {
            onChange({ lidCutout: e.currentTarget.checked });
          }}
        />
      </Section>

      <Section title="Fit">
        <Group gap="xs">
          <Field
            label="Wall thickness"
            value={params.wallThickness}
            units={units}
            step={0.2}
            min={0.4}
            max={6}
            onChange={(mm) => {
              onChange({ wallThickness: mm });
            }}
          />
          <Field
            label="Card tolerance"
            value={params.cardTolerance}
            units={units}
            step={0.2}
            min={0}
            max={10}
            onChange={(mm) => {
              onChange({ cardTolerance: mm });
            }}
          />
          <Field
            label="Inner fillet"
            value={params.innerFilletRadius}
            units={units}
            min={0}
            max={20}
            onChange={(mm) => {
              onChange({ innerFilletRadius: mm });
            }}
          />
          <Field
            label="Finger hole"
            value={params.fingerHoleSize}
            units={units}
            min={0}
            max={60}
            onChange={(mm) => {
              onChange({ fingerHoleSize: mm });
            }}
          />
          <Field
            label="Lid tolerance"
            value={params.lidTolerance}
            units={units}
            step={0.1}
            min={0}
            max={3}
            onChange={(mm) => {
              onChange({ lidTolerance: mm });
            }}
          />
        </Group>
      </Section>
    </>
  );
}
