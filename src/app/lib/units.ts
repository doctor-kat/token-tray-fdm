export type Units = "mm" | "inch";

// Display an mm value in the current unit system.
export function dispVal(mm: number, units: Units): string {
  return units === "inch" ? (mm / 25.4).toFixed(2) : (Math.round(mm * 10) / 10).toString();
}

// Convert a raw input value (already in the current unit system) to mm.
export function toMm(v: number, units: Units): number {
  return units === "inch" ? v * 25.4 : v;
}
