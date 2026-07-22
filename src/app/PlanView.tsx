"use client";

import { Columns2, Plus, Rows2, WandSparkles } from "lucide-react";
import type * as React from "react";
import { layoutCells, type Rect, type SplitNode, type TrayParams } from "@/app/lib/model";
import { dispVal, type Units } from "@/app/lib/units";

type Side = "left" | "right" | "top" | "bottom";

function pct(v: number) {
  return `${(v * 100).toFixed(3)}%`;
}

export function PlanView({
  params,
  structure,
  units,
  selectedId,
  onSelect,
  onDeselect,
  onSplit,
  onAddNeighbor,
  lockW,
  lockL,
  onToggleLockW,
  onToggleLockL,
  fill = false,
}: {
  params: TrayParams;
  structure: SplitNode;
  units: Units;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDeselect: () => void;
  onSplit: (dir: "vertical" | "horizontal") => void;
  onAddNeighbor: (side: Side) => void;
  lockW: boolean;
  lockL: boolean;
  onToggleLockW: () => void;
  onToggleLockL: () => void;
  // When true, the plan grows to fill its parent panel (desktop/tablet
  // side-by-side layout) instead of the fixed mobile card height.
  fill?: boolean;
}) {
  const innerRect: Rect = {
    x: 0,
    y: 0,
    w: Math.max(1, params.width - 2 * params.outerWallThickness),
    h: Math.max(1, params.height - 2 * params.outerWallThickness),
  };
  const cells = layoutCells(structure, innerRect, params.wallThickness);

  let selRect: Rect | null = null;
  const leaves = cells.map((c) => {
    const isSel = c.id === selectedId;
    if (isSel) {
      selRect = c.rect;
    }

    const isCustom =
      c.customization.depth != null ||
      c.customization.bottomFillet != null ||
      !c.customization.autoW ||
      !c.customization.autoL;
    const isScoop = (c.customization.bottomFillet ?? params.bottomFillet) > 0;
    const bg = isSel ? "var(--mantine-color-rust-1)" : isCustom ? "var(--mantine-color-sand-2)" : "var(--mantine-color-sand-1)";
    const bd = isSel ? "2px solid var(--mantine-color-rust-6)" : isCustom ? "2px solid var(--mantine-color-rust-3)" : "2px solid var(--mantine-color-sand-6)";
    return {
      cell: c,
      sel: isSel,
      custom: isCustom,
      scoop: isScoop,
      bg,
      bd,
    };
  });

  const radiusPx = Math.round((params.sideFillet * 300) / Math.max(params.width, params.height));

  const ar = (params.width / params.height).toFixed(4);

  // Screen-space Y grows downward, but the model's Y axis (shared with the
  // 3D view) grows upward, so every Y coordinate here must be flipped to
  // keep the plan view's top/bottom aligned with the actual 3D output.
  let splitPos: { left: string; top: string } | null = null;
  const inserts: Array<{ key: string; left: string; top: string; onClick: () => void }> = [];
  if (selRect) {
    const r = selRect as Rect;
    const cx = (r.x + r.w / 2) / innerRect.w;
    const cy = 1 - (r.y + r.h / 2) / innerRect.h;
    const x0 = r.x / innerRect.w;
    const x1 = (r.x + r.w) / innerRect.w;
    const yTop = 1 - (r.y + r.h) / innerRect.h;
    const yBottom = 1 - r.y / innerRect.h;
    inserts.push({
      key: "L",
      left: `calc(${pct(x0)} - 11px)`,
      top: `calc(${pct(cy)} - 11px)`,
      onClick() {
        onAddNeighbor("left");
      },
    });
    inserts.push({
      key: "R",
      left: `calc(${pct(x1)} - 11px)`,
      top: `calc(${pct(cy)} - 11px)`,
      onClick() {
        onAddNeighbor("right");
      },
    });
    inserts.push({
      key: "T",
      left: `calc(${pct(cx)} - 11px)`,
      top: `calc(${pct(yTop)} - 11px)`,
      onClick() {
        onAddNeighbor("top");
      },
    });
    inserts.push({
      key: "B",
      left: `calc(${pct(cx)} - 11px)`,
      top: `calc(${pct(yBottom)} - 11px)`,
      onClick() {
        onAddNeighbor("bottom");
      },
    });
    splitPos = { left: `calc(${pct(cx)} - 39px)`, top: `calc(${pct(cy)} - 17px)` };
  }

  return (
    <div
      style={
        fill
          ? {
              flex: "1 1 0",
              minHeight: 0,
              height: "100%",
              padding: "36px 16px 12px 46px",
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }
          : {
              flex: "none",
              height: 252,
              margin: "16px 20px 0",
              padding: "34px 8px 6px 42px",
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }
      }
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: click-to-deselect backdrop, not a control */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: deselection is reachable via Tab/Escape on the cells themselves */}
      <div
        onClick={onDeselect}
        style={{
          position: "relative",
          // Fill panels are tall, so bind the tray box to the panel width and
          // let height follow the aspect ratio (capped so it never overflows);
          // the mobile card is short, so it binds to height instead.
          ...(fill ? { width: "100%", maxHeight: "100%" } : { height: "100%", maxWidth: "100%" }),
          aspectRatio: ar,
          background: "var(--mantine-color-sand-3)",
          border: "1.5px solid var(--mantine-color-sand-7)",
          borderRadius: `${radiusPx}px`,
        }}
      >
        {/* Width dimension */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: -30,
            height: 18,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 2,
              right: 2,
              top: "50%",
              borderTop: "1px solid var(--mantine-color-sand-6)",
            }}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLockW();
            }}
            title="Tray width — tap the wand to auto-fit"
            style={{
              pointerEvents: "auto",
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%,-50%)",
              display: "flex",
              alignItems: "center",
              gap: 5,
              whiteSpace: "nowrap",
              background: "var(--mantine-color-sand-0)",
              border: "1px solid var(--mantine-color-sand-6)",
              borderRadius: 999,
              padding: "2px 9px",
              cursor: "pointer",
              font: "700 11px var(--font-space-mono), monospace",
              color: "var(--mantine-color-sand-9)",
            }}
          >
            <WandSparkles size={24} color={lockW ? "var(--mantine-color-sand-7)" : "var(--mantine-color-rust-6)"} />
            {dispVal(params.width, units)} {units}
          </button>
        </div>

        {/* Length dimension */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: -32,
            width: 18,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 2,
              bottom: 2,
              left: "50%",
              borderLeft: "1px solid var(--mantine-color-sand-6)",
            }}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLockL();
            }}
            title="Tray length — tap the wand to auto-fit"
            style={{
              pointerEvents: "auto",
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%,-50%) rotate(-90deg)",
              display: "flex",
              alignItems: "center",
              gap: 5,
              whiteSpace: "nowrap",
              background: "var(--mantine-color-sand-0)",
              border: "1px solid var(--mantine-color-sand-6)",
              borderRadius: 999,
              padding: "2px 9px",
              cursor: "pointer",
              font: "700 11px var(--font-space-mono), monospace",
              color: "var(--mantine-color-sand-9)",
            }}
          >
            <WandSparkles size={24} color={lockL ? "var(--mantine-color-sand-7)" : "var(--mantine-color-rust-6)"} />
            {dispVal(params.height, units)} {units}
          </button>
        </div>

        {leaves.map(({ cell, bg, bd, scoop }) => (
          <button
            key={cell.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(cell.id);
            }}
            className="plan-bin"
            style={{
              position: "absolute",
              left: `calc(${pct(cell.rect.x / innerRect.w)} + 2px)`,
              top: `calc(${pct(1 - (cell.rect.y + cell.rect.h) / innerRect.h)} + 2px)`,
              width: `calc(${pct(cell.rect.w / innerRect.w)} - 4px)`,
              height: `calc(${pct(cell.rect.h / innerRect.h)} - 4px)`,
              boxSizing: "border-box",
              borderRadius: `${radiusPx}px`,
              cursor: "pointer",
              padding: "5px 6px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              overflow: "hidden",
              border: bd,
              background: bg,
            }}
          >
            {scoop && (
              <>
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(194,96,58,.16) 3px,rgba(194,96,58,.16) 4px)",
                    pointerEvents: "none",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    left: "20%",
                    right: "20%",
                    top: "24%",
                    bottom: "24%",
                    borderRadius: "50%/70%",
                    background: bg,
                    boxShadow: "inset 0 0 0 1.5px var(--mantine-color-rust-3)",
                    pointerEvents: "none",
                  }}
                />
              </>
            )}
            <div style={{ textAlign: "left", position: "relative" }}>
              <span style={{ font: "600 11px var(--font-space-mono), monospace", color: "var(--mantine-color-sand-9)" }}>
                {Math.round(cell.rect.w)} × {Math.round(cell.rect.h)}
              </span>
            </div>
          </button>
        ))}

        {selRect && splitPos && (
          <>
            <div
              style={{
                position: "absolute",
                left: splitPos.left,
                top: splitPos.top,
                display: "flex",
                gap: 4,
                zIndex: 6,
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSplit("vertical");
                }}
                title="Split left / right"
                className="plan-split-btn"
                style={splitBtnStyle}
              >
                <Columns2 size={17} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSplit("horizontal");
                }}
                title="Split top / bottom"
                className="plan-split-btn"
                style={splitBtnStyle}
              >
                <Rows2 size={17} />
              </button>
            </div>
            {inserts.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  p.onClick();
                }}
                title="Add compartment here"
                aria-label="Add compartment here"
                style={{
                  position: "absolute",
                  left: p.left,
                  top: p.top,
                  width: 22,
                  height: 22,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  zIndex: 5,
                  border: "none",
                  background: "transparent",
                  padding: 0,
                }}
              >
                <div className="plan-add-btn" style={addBtnStyle}>
                  <Plus size={14} />
                </div>
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

const splitBtnStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: "50%",
  border: "none",
  background: "var(--mantine-color-sand-9)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "0 2px 6px rgba(0,0,0,.4)",
};

const addBtnStyle: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: "50%",
  background: "var(--mantine-color-rust-6)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 2px 6px rgba(120,80,40,.45)",
};
