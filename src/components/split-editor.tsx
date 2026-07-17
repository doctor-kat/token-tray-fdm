"use client";

import * as React from "react";
import {
  SplitSquareHorizontal,
  SplitSquareVertical,
  Trash2,
} from "lucide-react";
import {
  layoutCells,
  type SplitNode,
  type TrayParams,
  type Rect,
} from "@/lib/model";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Top-down 2D representation of the tray interior. Each leaf is clickable; the
// selected leaf can be split, deleted, or customized (handled by the parent).
export function SplitEditor({
  structure,
  params,
  selectedId,
  onSelect,
  onSplit,
  onRemove,
}: {
  structure: SplitNode;
  params: TrayParams;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSplit: (id: string, dir: "vertical" | "horizontal") => void;
  onRemove: (id: string) => void;
}) {
  const inner: Rect = {
    x: 0,
    y: 0,
    w: params.width - 2 * params.outerWallThickness,
    h: params.height - 2 * params.outerWallThickness,
  };
  const cells = layoutCells(structure, inner, params.wallThickness);

  // Normalize to a 0..100 viewbox keeping aspect ratio.
  const vbW = 100;
  const vbH = (inner.h / inner.w) * 100;

  return (
    <div className="space-y-3">
      <div
        className="relative w-full overflow-hidden rounded-lg border bg-muted/40"
        style={{ aspectRatio: `${inner.w} / ${inner.h}` }}
      >
        <svg
          viewBox={`0 0 ${vbW} ${vbH}`}
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
        >
          {cells.map((cell) => {
            const x = (cell.rect.x / inner.w) * vbW;
            // SVG y grows downward; tray y grows up -> flip.
            const y =
              vbH - ((cell.rect.y + cell.rect.h) / inner.h) * vbH;
            const w = (cell.rect.w / inner.w) * vbW;
            const h = (cell.rect.h / inner.h) * vbH;
            const selected = cell.id === selectedId;
            const custom =
              cell.customization.depth != null ||
              cell.customization.bottomFillet != null;
            return (
              <g key={cell.id} onClick={() => onSelect(cell.id)}>
                <rect
                  x={x + 0.4}
                  y={y + 0.4}
                  width={Math.max(0, w - 0.8)}
                  height={Math.max(0, h - 0.8)}
                  rx={1.5}
                  className={cn(
                    "cursor-pointer transition-colors",
                    selected
                      ? "fill-primary/80 stroke-primary"
                      : custom
                        ? "fill-accent stroke-border hover:fill-accent/70"
                        : "fill-background stroke-border hover:fill-accent/50"
                  )}
                  strokeWidth={0.4}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {selectedId && (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSplit(selectedId, "vertical")}
          >
            <SplitSquareVertical /> Split ↔
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSplit(selectedId, "horizontal")}
          >
            <SplitSquareHorizontal /> Split ↕
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => onRemove(selectedId)}
          >
            <Trash2 /> Delete
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Click a compartment to select it, then split or delete. Splitting ↔
        adds a divider left-to-right; ↕ adds one top-to-bottom.
      </p>
    </div>
  );
}
