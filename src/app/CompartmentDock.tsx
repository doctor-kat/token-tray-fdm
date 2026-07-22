"use client";

import { ChevronDown, Shapes, Trash2, WandSparkles } from "lucide-react";
import * as React from "react";
import { dispVal, toMm, type Units } from "@/app/lib/units";

export const COMPARTMENT_PRESETS = [
  { name: "Standard meeple", w: 20, l: 20 },
  { name: "Large meeple", w: 25, l: 25 },
  { name: "D6 die", w: 18, l: 18 },
  { name: "Coin / chip", w: 32, l: 32 },
  { name: "Mini card", w: 46, l: 66 },
  { name: "Poker card", w: 66, l: 92 },
];

function DimInput({
  value,
  units,
  disabled,
  onChange,
}: {
  value: number;
  units: Units;
  disabled: boolean;
  onChange: (mm: number) => void;
}) {
  return (
    <input
      type="number"
      aria-label="Compartment dimension"
      value={dispVal(value, units)}
      disabled={disabled}
      onChange={(e) => {
        const v = Number.parseFloat(e.target.value);
        if (!Number.isNaN(v) && v > 0) {
          onChange(toMm(v, units));
        }
      }}
      style={{
        flex: 1,
        minWidth: 0,
        height: 34,
        border: "none",
        background: "transparent",
        textAlign: "center",
        font: "700 15px 'Space Mono', monospace",
        color: disabled ? "#5c574f" : "#fff",
      }}
    />
  );
}

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
  const [presetsOpen, setPresetsOpen] = React.useState(false);

  return (
    <div
      style={{
        flex: "none",
        marginTop: "auto",
        background: "#1c1a17",
        borderRadius: "20px 20px 0 0",
        padding: "14px 20px 10px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            font: "700 10px 'Space Mono', monospace",
            color: "#8a8377",
            letterSpacing: ".1em",
          }}
        >
          COMPARTMENT {index}
        </span>
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => {
              setPresetsOpen((v) => !v);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: "1px solid #3a3630",
              background: "#2e2a25",
              color: "#e8e4db",
              borderRadius: 999,
              padding: "6px 12px",
              font: "600 12px 'Instrument Sans'",
              cursor: "pointer",
            }}
          >
            <Shapes size={14} />
            Presets
            <ChevronDown size={13} color="#8a8377" />
          </button>
          {presetsOpen && (
            <div
              style={{
                position: "absolute",
                bottom: 42,
                right: 0,
                zIndex: 5,
                width: 190,
                background: "#2e2a25",
                border: "1px solid #3a3630",
                borderRadius: 12,
                padding: 6,
                boxShadow: "0 -14px 30px -8px rgba(0,0,0,.5)",
              }}
            >
              {COMPARTMENT_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    onApplyPreset(p.w, p.l);
                    setPresetsOpen(false);
                  }}
                  className="preset-item"
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: "none",
                    background: "transparent",
                    borderRadius: 8,
                    padding: "9px 10px",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ font: "600 13px 'Instrument Sans'", color: "#e8e4db" }}>
                    {p.name}
                  </span>
                  <span style={{ font: "400 10px 'Space Mono', monospace", color: "#8a8377" }}>
                    {p.w}×{p.l}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "#211f1c",
          border: "1px solid #3a3630",
          borderRadius: 12,
          padding: 6,
        }}
      >
        {dims.map((d, i) => (
          <React.Fragment key={d.label}>
            {i > 0 && (
              <span style={{ font: "700 12px 'Space Mono', monospace", color: "#5c574f" }}>×</span>
            )}
            <DimInput value={d.value} units={units} disabled={d.auto} onChange={d.onChange} />
          </React.Fragment>
        ))}
        <span style={{ font: "600 11px 'Instrument Sans'", color: "#8a8377", padding: "0 8px" }}>
          {units}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 9,
          padding: "0 2px",
        }}
      >
        {dims.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={f.onToggleAuto}
            title={`Auto-fit ${f.label.toLowerCase()}`}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              font: "600 9px 'Space Mono', monospace",
              letterSpacing: ".06em",
              color: f.auto ? "#e08a5f" : "#5c574f",
            }}
          >
            <WandSparkles size={12} color={f.auto ? "#e08a5f" : "#5c574f"} />
            {f.label}
          </button>
        ))}
        <span style={{ width: 24 }} />
      </div>

      <div
        style={{
          display: "flex",
          marginTop: 12,
          paddingTop: 12,
          borderTop: "1px solid #2e2a25",
        }}
      >
        <button
          type="button"
          onClick={onDelete}
          title="Delete compartment"
          className="delete-comp-btn"
          style={{
            flex: 1,
            height: 40,
            border: "1px solid #5a2e24",
            background: "transparent",
            color: "#e79b84",
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer",
            font: "600 13px 'Instrument Sans'",
          }}
        >
          <Trash2 size={16} />
          Delete compartment
        </button>
      </div>
    </div>
  );
}
