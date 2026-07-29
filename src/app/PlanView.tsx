"use client";

import { Columns2, Plus, Rows2, WandSparkles } from "lucide-react";
import { useMemo, type CSSProperties } from "react";
import { layoutCells, type Rect, type SplitNode, type TrayParams } from "@/app/lib/model";
import { layoutWyrmwoodCells, type TrapezoidCell } from "@/app/lib/wyrmwood";
import { dispVal, type Units } from "@/app/lib/units";

type Side = "left" | "right" | "top" | "bottom";

function pct(v: number) {
  return `${(v * 100).toFixed(3)}%`;
}

// Build an SVG path string for a convex polygon with rounded corners.
// `pts` is the polygon vertices in order (clockwise or counter-clockwise),
// `r` is the corner radius in the same coordinate space. The radius is
// clamped to half the shortest edge to avoid degenerate arcs. Returns a
// simple polygon (no rounding) when the radius is negligible.
function roundedPolygonPath(pts: Array<[number, number]>, r: number): string {
  const n = pts.length;
  if (n < 3) return "";

  // Clamp radius to half the shortest edge so arcs never overlap.
  let minHalf = Infinity;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const dx = pts[j][0] - pts[i][0];
    const dy = pts[j][1] - pts[i][1];
    minHalf = Math.min(minHalf, Math.sqrt(dx * dx + dy * dy) / 2);
  }
  const cr = Math.min(r, minHalf);
  if (cr < 0.01) {
    // Degenerate case — plain polygon path.
    return `M ${pts.map((p) => `${p[0]} ${p[1]}`).join(" L ")} Z`;
  }

  // Signed area → orientation. Positive area (SVG math convention) means
  // the polygon is visually clockwise on screen → sweep-flag = 1 (same as
  // the canonical SVG rounded-rect path).
  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1];
  }
  const sweep = area > 0 ? 1 : 0;

  // Tangent points for each vertex: tp1 is where the incoming edge meets
  // the arc, tp2 is where the arc meets the outgoing edge.
  const tp1: Array<[number, number]> = [];
  const tp2: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const curr = pts[i];
    const next = pts[(i + 1) % n];
    const ax = curr[0] - prev[0];
    const ay = curr[1] - prev[1];
    const aLen = Math.sqrt(ax * ax + ay * ay);
    const bx = next[0] - curr[0];
    const by = next[1] - curr[1];
    const bLen = Math.sqrt(bx * bx + by * by);
    tp1.push([curr[0] - (cr * ax) / aLen, curr[1] - (cr * ay) / aLen]);
    tp2.push([curr[0] + (cr * bx) / bLen, curr[1] + (cr * by) / bLen]);
  }

  // Assemble the path: M → arc → line → arc → … → Z
  const fmt = (x: number, y: number) => `${x.toFixed(2)} ${y.toFixed(2)}`;
  const parts = [`M ${fmt(tp1[0][0], tp1[0][1])}`];
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    parts.push(`A ${fmt(cr, cr)} 0 0 ${sweep} ${fmt(tp2[i][0], tp2[i][1])}`);
    parts.push(`L ${fmt(tp1[next][0], tp1[next][1])}`);
  }
  parts.push("Z");
  return parts.join(" ");
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
  trapezoid,
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
  // Trapezoid plan shape for the wyrmwood accessory. When provided the
  // outer shape is a trapezoid instead of a rounded rectangle.
  trapezoid?: {
    frontWidth: number;
    backWidth: number;
    length: number;
    cornerRadius: number;
    wallThickness: number;
    innerRect: Rect;
  };
}) {
  const innerRect: Rect = trapezoid
    ? trapezoid.innerRect
    : {
        x: 0,
        y: 0,
        w: Math.max(1, params.width - 2 * params.outerWallThickness),
        h: Math.max(1, params.height - 2 * params.outerWallThickness),
      };

  // For the trapezoid design, lay cells out as trapezoid polygons.
  const trapCells: TrapezoidCell[] | null = useMemo(() => {
    if (!trapezoid) return null;
    const { frontWidth, backWidth, length: trapLen, wallThickness: wall } = trapezoid;
    const innerFw = Math.max(2, frontWidth - 2 * wall);
    const innerBw = Math.max(2, backWidth - 2 * wall);
    const innerL = Math.max(2, trapLen - 2 * wall);
    const hw = innerL / 2;
    return layoutWyrmwoodCells(structure, {
      yBack: -hw,
      yFront: hw,
      xLeftBack: -innerBw / 2,
      xRightBack: innerBw / 2,
      xLeftFront: -innerFw / 2,
      xRightFront: innerFw / 2,
    }, wall);
  }, [trapezoid, structure]);

  // Rectangular cells (used for non-trapezoid plan views and also for the
  // split/insert button positioning in both modes).
  const cells = layoutCells(structure, innerRect, params.wallThickness);

  // Build a bounding Rect from trapezoid cell corners (in SVG viewBox coords).
  const trapSelRect: Rect | null = useMemo(() => {
    if (!trapCells || !trapezoid || !selectedId) return null;
    const cell = trapCells.find((c) => c.id === selectedId);
    if (!cell) return null;
    const { frontWidth, length } = trapezoid;
    const svgCorners = cell.corners.map(([x, y]) => [x + frontWidth / 2, y + length / 2] as const);
    const xs = svgCorners.map((c) => c[0]);
    const ys = svgCorners.map((c) => c[1]);
    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      w: Math.max(...xs) - Math.min(...xs),
      h: Math.max(...ys) - Math.min(...ys),
    };
  }, [trapCells, trapezoid, selectedId]);

  // Rectangular selRect for non-trapezoid mode (using LeafCell.rect positions).
  let selRect: Rect | null = null;
  const leaves = cells.map((c) => {
    const isSel = c.id === selectedId;
    if (isSel && !trapezoid) {
      selRect = c.rect;
    }

    const isCustom =
      c.customization.depth != null ||
      c.customization.bottomFillet != null ||
      !c.customization.autoW ||
      !c.customization.autoL;
    const isScoop = (c.customization.bottomFillet ?? params.bottomFillet) > 0;
    const bg = isSel
      ? "var(--mantine-color-rust-1)"
      : isCustom
        ? "var(--mantine-color-sand-2)"
        : "var(--mantine-color-sand-1)";
    const bd = isSel
      ? "2px solid var(--mantine-color-rust-6)"
      : isCustom
        ? "2px solid var(--mantine-color-rust-3)"
        : "2px solid var(--mantine-color-sand-6)";
    return {
      cell: c,
      sel: isSel,
      custom: isCustom,
      scoop: isScoop,
      bg,
      bd,
    };
  });

  // Effective selRect: use trapSelRect in trapezoid mode, selRect otherwise.
  const effectiveSelRect = trapezoid ? trapSelRect : selRect;

  const radiusPx = trapezoid
    ? Math.round((trapezoid.cornerRadius * 300) / Math.max(trapezoid.frontWidth, trapezoid.length))
    : Math.round((params.sideFillet * 300) / Math.max(params.width, params.height));

  const ar = (params.width / params.height).toFixed(4);

  // For trapezoid, cells are laid out in the inscribed rectangle but the outer
  // container is wider (frontWidth). Offset cell positions so they're centered.
  const cellBaseW = trapezoid ? trapezoid.frontWidth : innerRect.w;
  const cellBaseH = trapezoid ? trapezoid.length : innerRect.h;
  const cellOffsetX = (cellBaseW - innerRect.w) / 2;
  const cellOffsetY = (cellBaseH - innerRect.h) / 2;

  // Trapezoid SVG path with rounded corners.
  const roundedTrapPath = useMemo(() => {
    if (!trapezoid) return undefined;
    const { frontWidth, backWidth, length: trapLen, cornerRadius } = trapezoid;
    const inset = (frontWidth - backWidth) / 2;
    // Clockwise order: back-left → back-right → front-right → front-left
    const pts: Array<[number, number]> = [
      [inset, 0],
      [frontWidth - inset, 0],
      [frontWidth, trapLen],
      [0, trapLen],
    ];
    return roundedPolygonPath(pts, cornerRadius);
  }, [trapezoid]);

  // Screen-space Y grows downward, but the model's Y axis (shared with the
  // 3D view) grows upward, so every Y coordinate here must be flipped to
  // keep the plan view's top/bottom aligned with the actual 3D output.
  // For the trapezoid case, coordinates are already in SVG viewBox space
  // (Y-down, with Y=0 at the back edge), so no flip is needed.
  let splitPos: { left: string; top: string } | null = null;
  const inserts: Array<{ key: string; left: string; top: string; onClick: () => void }> = [];
  if (effectiveSelRect) {
    const r = effectiveSelRect as Rect;
    if (trapezoid) {
      // Trapezoid: coordinates are in SVG viewBox space (Y-down), viewBox
      // is 0 0 frontWidth length — divide by these for percentages.  No Y flip.
      const fw = trapezoid.frontWidth;
      const tl = trapezoid.length;
      const cx = (r.x + r.w / 2) / fw;
      const cy = (r.y + r.h / 2) / tl;
      const x0 = r.x / fw;
      const x1 = (r.x + r.w) / fw;
      const yTop = r.y / tl;
      const yBottom = (r.y + r.h) / tl;
      inserts.push(
        { key: "L", left: `calc(${pct(x0)} - 11px)`, top: `calc(${pct(cy)} - 11px)`, onClick: () => onAddNeighbor("left") },
        { key: "R", left: `calc(${pct(x1)} - 11px)`, top: `calc(${pct(cy)} - 11px)`, onClick: () => onAddNeighbor("right") },
        { key: "T", left: `calc(${pct(cx)} - 11px)`, top: `calc(${pct(yTop)} - 11px)`, onClick: () => onAddNeighbor("top") },
        { key: "B", left: `calc(${pct(cx)} - 11px)`, top: `calc(${pct(yBottom)} - 11px)`, onClick: () => onAddNeighbor("bottom") },
      );
      splitPos = { left: `calc(${pct(cx)} - 39px)`, top: `calc(${pct(cy)} - 17px)` };
    } else {
      const cx = (r.x + r.w / 2 + cellOffsetX) / cellBaseW;
      const cy = 1 - (r.y + r.h / 2 + cellOffsetY) / cellBaseH;
      const x0 = (r.x + cellOffsetX) / cellBaseW;
      const x1 = (r.x + r.w + cellOffsetX) / cellBaseW;
      const yTop = 1 - (r.y + r.h + cellOffsetY) / cellBaseH;
      const yBottom = 1 - (r.y + cellOffsetY) / cellBaseH;
      inserts.push(
        { key: "L", left: `calc(${pct(x0)} - 11px)`, top: `calc(${pct(cy)} - 11px)`, onClick: () => onAddNeighbor("left") },
        { key: "R", left: `calc(${pct(x1)} - 11px)`, top: `calc(${pct(cy)} - 11px)`, onClick: () => onAddNeighbor("right") },
        { key: "T", left: `calc(${pct(cx)} - 11px)`, top: `calc(${pct(yTop)} - 11px)`, onClick: () => onAddNeighbor("top") },
        { key: "B", left: `calc(${pct(cx)} - 11px)`, top: `calc(${pct(yBottom)} - 11px)`, onClick: () => onAddNeighbor("bottom") },
      );
      splitPos = { left: `calc(${pct(cx)} - 39px)`, top: `calc(${pct(cy)} - 17px)` };
    }
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
          ...(trapezoid
            ? { background: "transparent" }
            : {
                background: "var(--mantine-color-sand-3)",
                border: "1.5px solid var(--mantine-color-sand-7)",
                borderRadius: `${radiusPx}px`,
              }),
        }}
      >
        {/* Trapezoid background + cell polygons drawn via SVG so the border,
            corner rounding, and compartment shapes follow the trapezoid correctly. */}
        {trapezoid && roundedTrapPath && (
          <svg
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "auto",
              zIndex: 1,
            }}
            viewBox={`0 0 ${trapezoid.frontWidth} ${trapezoid.length}`}
            preserveAspectRatio="none"
          >
            {/* Outer trapezoid — click to deselect */}
            <path
              d={roundedTrapPath}
              fill="var(--mantine-color-sand-3)"
              stroke="var(--mantine-color-sand-7)"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              style={{ pointerEvents: "auto", cursor: "pointer" }}
              onClick={onDeselect}
            />
            {/* Shared scoop-hatch pattern */}
            <defs>
              <pattern id="sc-h" patternUnits="userSpaceOnUse" width={4} height={4} patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="4" stroke="rgba(194,96,58,.16)" strokeWidth={1} />
              </pattern>
            </defs>
            {/* Cell polygons with rounded corners */}
            {trapCells?.map((tCell) => {
              const isSel = tCell.id === selectedId;
              const isCustom =
                tCell.customization.depth != null ||
                tCell.customization.bottomFillet != null ||
                !tCell.customization.autoW ||
                !tCell.customization.autoL;
              const isScoop = (tCell.customization.bottomFillet ?? params.bottomFillet) > 0;
              const fill = isSel
                ? "var(--mantine-color-rust-1)"
                : isCustom
                  ? "var(--mantine-color-sand-2)"
                  : "var(--mantine-color-sand-1)";
              const stroke = isSel
                ? "var(--mantine-color-rust-6)"
                : isCustom
                  ? "var(--mantine-color-rust-3)"
                  : "var(--mantine-color-sand-6)";
              const { frontWidth, length } = trapezoid;

              // Corners in SVG viewBox coords (model coords shifted to top-left origin)
              const svgPts: Array<[number, number]> = tCell.corners.map(
                ([x, y]) => [x + frontWidth / 2, y + length / 2],
              );

              // Rounded polygon path matching the outer trapezoid's corner radius
              const cellCorner = Math.min(4, trapezoid.cornerRadius);
              const cellPath = roundedPolygonPath(svgPts, cellCorner);

              // Dimensions: show the smaller (back) edge width — the limiting fit
              const backW = Math.abs(tCell.corners[1][0] - tCell.corners[0][0]);
              const cellH = Math.abs(tCell.corners[2][1] - tCell.corners[0][1]);

              // Centroid for text / ellipse positioning
              const cx = svgPts.reduce((s, p) => s + p[0], 0) / svgPts.length;
              const cy = svgPts.reduce((s, p) => s + p[1], 0) / svgPts.length;

              return (
                <g key={tCell.id}>
                  <path
                    d={cellPath}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={1.5}
                    vectorEffect="non-scaling-stroke"
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(tCell.id);
                    }}
                  />
                  {isScoop && (
                    <>
                      <path
                        d={cellPath}
                        fill="url(#sc-h)"
                        style={{ pointerEvents: "none" }}
                      />
                      <ellipse
                        cx={cx.toFixed(2)}
                        cy={cy.toFixed(2)}
                        rx={(backW * 0.3).toFixed(2)}
                        ry={(cellH * 0.26).toFixed(2)}
                        fill={fill}
                        stroke="var(--mantine-color-rust-3)"
                        strokeWidth={1.5}
                        style={{ pointerEvents: "none" }}
                      />
                    </>
                  )}
                  <text
                    x={cx.toFixed(2)}
                    y={(cy + 4).toFixed(2)}
                    textAnchor="middle"
                    fill="var(--mantine-color-sand-9)"
                    style={{
                      fontFamily: "var(--font-space-mono), monospace",
                      fontSize: "11px",
                      fontWeight: 600,
                      pointerEvents: "none",
                    }}
                  >
                    {Math.round(backW)} × {Math.round(cellH)}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
        {/* Width dimension — for trapezoid the wider end is at the bottom (plan bottom = tray front). */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            ...(trapezoid ? { bottom: -30 } : { top: -30 }),
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
            title={trapezoid ? "Front width (wider end)" : "Tray width — tap the wand to auto-fit"}
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
            <WandSparkles
              size={24}
              color={lockW ? "var(--mantine-color-sand-7)" : "var(--mantine-color-rust-6)"}
            />
            {dispVal(trapezoid ? trapezoid.frontWidth : params.width, units)} {units}
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
            <WandSparkles
              size={24}
              color={lockL ? "var(--mantine-color-sand-7)" : "var(--mantine-color-rust-6)"}
            />
            {dispVal(params.height, units)} {units}
          </button>
        </div>

        {!trapezoid && leaves.map(({ cell, bg, bd, scoop }) => (
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
              left: `calc(${pct((cell.rect.x + cellOffsetX) / cellBaseW)} + 2px)`,
              top: `calc(${pct(1 - (cell.rect.y + cell.rect.h + cellOffsetY) / cellBaseH)} + 2px)`,
              width: `calc(${pct(cell.rect.w / cellBaseW)} - 4px)`,
              height: `calc(${pct(cell.rect.h / cellBaseH)} - 4px)`,
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
              <span
                style={{
                  font: "600 11px var(--font-space-mono), monospace",
                  color: "var(--mantine-color-sand-9)",
                }}
              >
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

const splitBtnStyle: CSSProperties = {
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

const addBtnStyle: CSSProperties = {
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
