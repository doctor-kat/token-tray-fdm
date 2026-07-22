"use client";

import { WandSparkles } from "lucide-react";
import type { TrayParams } from "@/app/lib/model";
import { dispVal, toMm, type Units } from "@/app/lib/units";

export type SettingsFlag = "height" | "wall" | "side" | "bottom";

// Each field maps a flag to the TrayParams key it edits, plus its clamp range.
const FIELDS: Array<{
  flag: SettingsFlag;
  key: keyof TrayParams;
  label: string;
  min: number;
  max: number;
  step?: number;
}> = [
  { flag: "height", key: "depth", label: "HEIGHT", min: 6, max: 120 },
  { flag: "wall", key: "wallThickness", label: "WALL WIDTH", min: 0.4, max: 6, step: 0.2 },
  { flag: "side", key: "sideFillet", label: "SIDE FILLET", min: 0, max: 20 },
  { flag: "bottom", key: "bottomFillet", label: "BOTTOM FILLET", min: 0, max: 20 },
];

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function Field({
  value,
  units,
  auto,
  step,
  onChange,
  onToggleAuto,
  label,
}: {
  value: number;
  units: Units;
  auto: boolean;
  step?: number;
  onChange: (mm: number) => void;
  onToggleAuto: () => void;
  label: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "transparent",
          border: "1px solid #d8cfbf",
          borderRadius: 10,
          padding: "0 4px 0 6px",
          height: 34,
        }}
      >
        <input
          type="number"
          aria-label={label}
          step={step ?? 1}
          value={dispVal(value, units)}
          disabled={auto}
          onChange={(e) => {
            const v = Number.parseFloat(e.target.value);
            if (!Number.isNaN(v)) {
              onChange(toMm(v, units));
            }
          }}
          style={{
            flex: 1,
            minWidth: 0,
            height: 32,
            border: "none",
            background: "transparent",
            textAlign: "center",
            font: "700 15px 'Space Mono', monospace",
            color: auto ? "#a89e88" : "#1c1a17",
          }}
        />
        <span style={{ font: "600 9px 'Instrument Sans'", color: "#8a8377", paddingRight: 4 }}>
          {units}
        </span>
      </div>
      <button
        type="button"
        onClick={onToggleAuto}
        title={`Auto ${label.toLowerCase()}`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          marginTop: 7,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <WandSparkles size={12} color={auto ? "#c2603a" : "#8a8377"} />
        <span
          style={{ font: "600 9px 'Instrument Sans'", color: "#8a8377", letterSpacing: ".06em" }}
        >
          {label}
        </span>
      </button>
    </div>
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
    <div
      style={{
        flex: "none",
        margin: "14px 0 0",
        background: "#e7ded0",
        padding: "14px 20px 15px",
      }}
    >
      <div
        style={{
          font: "700 10px 'Space Mono', monospace",
          color: "#8a8377",
          letterSpacing: ".14em",
          marginBottom: 12,
        }}
      >
        TRAY SETTINGS
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
          gap: "14px 10px",
        }}
      >
        {FIELDS.map((f) => (
          <Field
            key={f.flag}
            label={f.label}
            value={params[f.key]}
            units={units}
            auto={auto[f.flag]}
            step={f.step}
            onChange={(mm) => {
              onChange({ [f.key]: clamp(mm, f.min, f.max) });
            }}
            onToggleAuto={() => {
              onToggleAuto(f.flag);
            }}
          />
        ))}
      </div>
    </div>
  );
}
