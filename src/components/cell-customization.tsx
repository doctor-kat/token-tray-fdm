"use client";

import * as React from "react";
import type { SplitNode, TrayParams } from "@/lib/model";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

export function findNode(node: SplitNode, id: string): SplitNode | null {
  if (node.id === id) return node;
  for (const c of node.children) {
    const found = findNode(c, id);
    if (found) return found;
  }
  return null;
}

// Per-leaf overrides for compartment depth and bottom scoop fillet.
export function CellCustomization({
  cell,
  params,
  onChange,
}: {
  cell: SplitNode;
  params: TrayParams;
  onChange: (patch: Partial<SplitNode["customization"]>) => void;
}) {
  const maxDepth = params.depth - params.outerWallThickness;
  const depthOverridden = cell.customization.depth != null;
  const filletOverridden = cell.customization.bottomFillet != null;

  return (
    <div className="space-y-5 rounded-lg border bg-muted/30 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Selected compartment
      </p>

      {/* Depth override */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-medium">
          <input
            type="checkbox"
            checked={depthOverridden}
            onChange={(e) =>
              onChange({
                depth: e.target.checked
                  ? Math.round(maxDepth * 0.6)
                  : null,
              })
            }
          />
          Custom depth
        </label>
        {depthOverridden && (
          <div className="flex items-center gap-3">
            <Slider
              value={[cell.customization.depth ?? maxDepth]}
              min={2}
              max={Math.floor(maxDepth)}
              step={0.5}
              onValueChange={([v]) => onChange({ depth: v })}
            />
            <span className="w-14 shrink-0 text-right tabular-nums text-xs">
              {(cell.customization.depth ?? maxDepth).toFixed(1)} mm
            </span>
          </div>
        )}
      </div>

      {/* Bottom fillet override */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-medium">
          <input
            type="checkbox"
            checked={filletOverridden}
            onChange={(e) =>
              onChange({ bottomFillet: e.target.checked ? 3 : null })
            }
          />
          Custom bottom fillet
        </label>
        {filletOverridden && (
          <div className="flex items-center gap-3">
            <Slider
              value={[cell.customization.bottomFillet ?? params.bottomFillet]}
              min={0}
              max={20}
              step={0.5}
              onValueChange={([v]) => onChange({ bottomFillet: v })}
            />
            <span className="w-14 shrink-0 text-right tabular-nums text-xs">
              {(cell.customization.bottomFillet ?? params.bottomFillet).toFixed(
                1
              )}{" "}
              mm
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
