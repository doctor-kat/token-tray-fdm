"use client";

import {Badge, Checkbox, Text } from "@mantine/core";
import type { Units } from "@/app/lib/units";
import { draftInset, type WyrmwoodParams } from "@/app/lib/wyrmwood";
import { Field, FieldGroup, Section } from "@/app/TraySettingsBand";

export function WyrmwoodPanel({
  params,
  units,
  onChange,
}: {
  params: WyrmwoodParams;
  units: Units;
  onChange: (patch: Partial<WyrmwoodParams>) => void;
}) {
  const inset = draftInset(params);
  const topW = Math.max(0, params.width - 2 * inset);
  const topL = Math.max(0, params.length - 2 * inset);

  return (
    <>
      <Section title="Accessory">
        <FieldGroup>
          <Field
            label="Base width"
            value={params.width}
            units={units}
            min={30}
            max={400}
            onChange={(mm) => {
              onChange({ width: mm });
            }}
          />
          <Field
            label="Base length"
            value={params.length}
            units={units}
            min={30}
            max={400}
            onChange={(mm) => {
              onChange({ length: mm });
            }}
          />
          <Field
            label="Thickness"
            value={params.thickness}
            units={units}
            min={4}
            max={60}
            onChange={(mm) => {
              onChange({ thickness: mm });
            }}
          />
          <Field
            label="Draft angle"
            value={params.draftAngle}
            units={units}
            rawUnit="°"
            min={0}
            max={45}
            onChange={(deg) => {
              onChange({ draftAngle: deg });
            }}
          />
          <Field
            label="Corner radius"
            value={params.cornerRadius}
            units={units}
            min={0}
            max={40}
            onChange={(mm) => {
              onChange({ cornerRadius: mm });
            }}
          />
          <Field
            label="Wall"
            value={params.wallThickness}
            units={units}
            step={0.2}
            min={0.4}
            max={10}
            onChange={(mm) => {
              onChange({ wallThickness: mm });
            }}
          />
          <Field
            label="Floor"
            value={params.floorThickness}
            units={units}
            step={0.2}
            min={0.4}
            max={10}
            onChange={(mm) => {
              onChange({ floorThickness: mm });
            }}
          />
          <Field
            label="Bottom fillet"
            value={params.bottomFillet}
            units={units}
            min={0}
            max={20}
            onChange={(mm) => {
              onChange({ bottomFillet: mm });
            }}
          />
        </FieldGroup>

        <Text fz="xs" c="dimmed">
          top face {topW.toFixed(1)} × {topL.toFixed(1)} — walls lean in {inset.toFixed(1)} mm per
          side
        </Text>
      </Section>

      <Section
        title="Magnets"
        action={
          <Badge size="xs" variant="light" color="gray">
            long side
          </Badge>
        }
      >
        <Checkbox
          label="Magnet pockets"
          checked={params.magnetsEnabled}
          onChange={(e) => {
            onChange({ magnetsEnabled: e.currentTarget.checked });
          }}
        />
        {params.magnetsEnabled && (
          <FieldGroup>
            <Field
              label="Count"
              value={params.magnetCount}
              units={units}
              rawUnit=""
              min={0}
              max={20}
              onChange={(n) => {
                onChange({ magnetCount: Math.max(0, Math.round(n)) });
              }}
            />
            <Field
              label="Diameter"
              value={params.magnetDiameter}
              units={units}
              step={0.5}
              min={1}
              max={30}
              onChange={(mm) => {
                onChange({ magnetDiameter: mm });
              }}
            />
            <Field
              label="Depth"
              value={params.magnetDepth}
              units={units}
              step={0.5}
              min={0.5}
              max={20}
              onChange={(mm) => {
                onChange({ magnetDepth: mm });
              }}
            />
            <Field
              label="End inset"
              value={params.magnetInset}
              units={units}
              min={0}
              max={100}
              onChange={(mm) => {
                onChange({ magnetInset: mm });
              }}
            />
          </FieldGroup>
        )}
      </Section>

      <Section
        title="Card slot"
        action={
          <Badge size="xs" variant="light" color="gray">
            UI only
          </Badge>
        }
      >
        <Checkbox
          label="Card slot"
          checked={params.cardSlotEnabled}
          onChange={(e) => {
            onChange({ cardSlotEnabled: e.currentTarget.checked });
          }}
        />
        {params.cardSlotEnabled && (
          <FieldGroup>
            <Field
              label="Slot width"
              value={params.cardSlotWidth}
              units={units}
              min={10}
              max={200}
              onChange={(mm) => {
                onChange({ cardSlotWidth: mm });
              }}
            />
            <Field
              label="Slot length"
              value={params.cardSlotLength}
              units={units}
              min={10}
              max={200}
              onChange={(mm) => {
                onChange({ cardSlotLength: mm });
              }}
            />
          </FieldGroup>
        )}
      </Section>
    </>
  );
}
