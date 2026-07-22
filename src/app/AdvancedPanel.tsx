"use client";

import type * as React from "react";
import type { LidType, TrayParams } from "@/app/lib/model";
import type { Units } from "@/app/lib/units";
import { LidIcon } from "@/app/lid-icons/LidIcon";
import { Field } from "@/app/TraySettingsBand";

const LID_OPTIONS: Array<{ value: LidType; label: string; hint: string }> = [
  { value: "none", label: "None", hint: "Open tray" },
  { value: "lid", label: "Lid", hint: "Wraps around the tray" },
  { value: "sliding-lid", label: "Sliding Lid", hint: "Slides in from the front" },
  { value: "cover", label: "Cover", hint: "Press-fit onto the opening" },
];

// Card fill — also passed to the icon so its arrow halo blends into the card.
const CARD_SURFACE = "#f4f1ea";

// Each lid type ships with its own sensible clearance (matches the reference).
const LID_TOLERANCE_DEFAULT: Record<LidType, number> = {
  none: 0.6,
  lid: 0.6,
  "sliding-lid": 0.1,
  cover: 0.2,
};

const LABEL_STYLE: React.CSSProperties = {
  font: "600 10px 'Space Mono', monospace",
  color: "#8a8377",
  letterSpacing: ".08em",
  marginBottom: 6,
  display: "block",
};

const INPUT_WRAP: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  background: "transparent",
  border: "1px solid #d8cfbf",
  borderRadius: 10,
  padding: "0 4px 0 6px",
  height: 34,
};

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

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
  const showTolerance = lidType !== "none";
  const isCover = lidType === "cover";

  return (
    <div style={{ flex: "none", background: "#e7ded0", padding: "12px 20px 4px" }}>
      <div
        style={{
          padding: "2px 0 10px",
          font: "700 10px 'Space Mono', monospace",
          color: "#8a8377",
          letterSpacing: ".14em",
        }}
      >
        ADVANCED
      </div>

      <div style={{ paddingBottom: 10 }}>
        <fieldset style={{ border: 0, margin: "0 0 14px", padding: 0 }}>
          <legend style={LABEL_STYLE}>LID TYPE</legend>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
              gap: 8,
            }}
          >
            {LID_OPTIONS.map((o) => {
              const selected = lidType === o.value;
              return (
                <label
                  key={o.value}
                  title={o.hint}
                  style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    padding: "10px 6px 9px",
                    borderRadius: 12,
                    cursor: "pointer",
                    background: CARD_SURFACE,
                    border: selected ? "2px solid #c2603a" : "1px solid #d8cfbf",
                    // Keep the inner box the same size whichever border shows.
                    margin: selected ? 0 : 1,
                    boxShadow: selected ? "0 4px 12px -4px rgba(194,96,58,.45)" : "none",
                    transition: "border-color .12s, box-shadow .12s",
                  }}
                >
                  <input
                    type="radio"
                    name="lid-type"
                    value={o.value}
                    checked={selected}
                    onChange={() => {
                      onChange({
                        lidType: o.value,
                        lidTolerance: LID_TOLERANCE_DEFAULT[o.value],
                      });
                    }}
                    style={{
                      position: "absolute",
                      width: 1,
                      height: 1,
                      opacity: 0,
                      pointerEvents: "none",
                    }}
                  />
                  <LidIcon type={o.value} size={46} halo={CARD_SURFACE} />
                  <span
                    style={{
                      font: "700 9px 'Space Mono', monospace",
                      letterSpacing: ".06em",
                      color: selected ? "#c2603a" : "#1c1a17",
                      textAlign: "center",
                    }}
                  >
                    {o.label.toUpperCase()}
                  </span>
                  <span
                    style={{
                      font: "400 9px/1.3 'Instrument Sans'",
                      color: "#8a8377",
                      textAlign: "center",
                    }}
                  >
                    {o.hint}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {isCover && (
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
              cursor: "pointer",
              font: "600 13px 'Instrument Sans'",
              color: "#1c1a17",
            }}
          >
            <input
              type="checkbox"
              checked={params.withCoverLip}
              onChange={(e) => {
                onChange({ withCoverLip: e.target.checked });
              }}
            />
            Cover lip
          </label>
        )}

        <div
          style={{
            display: "grid",
            // Single row once there's width for it; wraps on narrow screens.
            gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
            gap: "14px 10px",
            alignItems: "end",
            marginBottom: 12,
          }}
        >
          {isCover && (
            <Field
              label="COVER DEPTH"
              value={params.lidInnerHeight}
              units={units}
              onChange={(mm) => {
                onChange({ lidInnerHeight: clamp(mm, 1, 40) });
              }}
            />
          )}

          {showTolerance && (
            <Field
              label="LID TOLERANCE"
              value={params.lidTolerance}
              units={units}
              step={0.05}
              onChange={(mm) => {
                onChange({ lidTolerance: clamp(mm, 0, 3) });
              }}
            />
          )}

          <div>
            <div style={INPUT_WRAP}>
              <input
                type="text"
                aria-label="Model name"
                value={params.modelName}
                placeholder="token-tray"
                onChange={(e) => {
                  onChange({ modelName: e.target.value });
                }}
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: 32,
                  border: "none",
                  background: "transparent",
                  textAlign: "center",
                  font: "600 14px 'Instrument Sans'",
                  color: "#1c1a17",
                }}
              />
            </div>
            <div
              style={{
                marginTop: 7,
                textAlign: "center",
                font: "600 9px 'Instrument Sans'",
                color: "#8a8377",
                letterSpacing: ".06em",
              }}
            >
              MODEL NAME
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
