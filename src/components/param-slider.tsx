"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export function ParamSlider({
  label,
  value,
  min,
  max,
  step = 0.1,
  unit = "mm",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-muted-foreground">
          {label}
        </Label>
        <span className="tabular-nums text-xs font-medium">
          {Number.isInteger(step) ? value.toFixed(0) : value.toFixed(1)}
          <span className="ml-0.5 text-muted-foreground">{unit}</span>
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}
