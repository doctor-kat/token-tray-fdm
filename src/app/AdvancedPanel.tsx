"use client";

import {Checkbox } from "@mantine/core";
import type { TrayParams } from "@/app/lib/model";
import type { Units } from "@/app/lib/units";
import { Field, FieldGroup, Section } from "@/app/TraySettingsBand";

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

  // The lid type is picked from the menu above the preview; this section only
  // holds the settings for whatever lid is active — so with no lid there's
  // nothing to configure and the section is hidden entirely.
  if (lidType === "none") {
    return null;
  }

  return (
    <Section title="Lid settings">
      {isCover && (
        <Checkbox
          label="Cover lip"
          checked={params.withCoverLip}
          onChange={(e) => {
            onChange({ withCoverLip: e.currentTarget.checked });
          }}
        />
      )}

      <FieldGroup>
        {isCover && (
          <Field
            icon="coverDepth"
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

        <Field
          icon="lidTolerance"
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
      </FieldGroup>
    </Section>
  );
}
