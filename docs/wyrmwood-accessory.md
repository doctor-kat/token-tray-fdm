# Wyrmwood Accessory parameters

A shallow slab whose plan-view shape is a **trapezoid** with vertical walls
and radiused corners. Compartments are laid out on the top face and intersected
with the inner trapezoid cavity, so edge cells inherit the angled walls.

## Coordinate system

- **X** — left / right (parallel to the front/back edges)
- **Y** — front / back (front is the wider opening; back is the narrower end)
- **Z** — up from the print bed (vertical walls, no draft)

The two non-parallel sides (left and right, aligned with Y) converge toward
the back. The parallel edges (front and back, aligned with X) have different
lengths: **width** at the front, **backWidth** at the back.

The cell layout uses the **inscribed rectangle** at the narrower back end
(see `topRect` in `wyrmwood.ts`), so every compartment fits inside the
trapezoid at every Y position. Extra width at the front becomes wall.

Walls are **vertical** — there is no Z-axis draft (unlike a traditional
draft angle measured from vertical). The trapezoid is in plan view only.

## Parameter reference

| Parameter | Axis / unit | Description |
|---|---|---|
| `width` | X, mm | Front (wider) edge width. The widest point of the trapezoid. |
| `length` | Y, mm | Front-to-back depth. Distance between the two parallel edges. |
| `thickness` | Z, mm | Overall height of the slab. |
| `interiorAngle` | α, ° | **Interior angle of the trapezoid in plan view**, measured at the front corners between the front edge and each side wall. 90° = rectangle (sides are perpendicular to the front edge). Lower values = more taper (back gets narrower). |
| `cornerRadius` | mm | Plan-view corner radius, applied to all four vertical edges. |
| `wallThickness` | mm | Thickness of outer walls and internal separators. |
| `floorThickness` | mm | Solid material below the compartment pockets. |
| `bottomFillet` | mm | Scoop radius where pocket walls meet the floor. |
| `magnetsEnabled` | bool | Whether to cut magnet pockets. |
| `magnetCount` | int | Number of magnet pockets along the front edge. |
| `magnetDiameter` | mm | Diameter of each magnet pocket. |
| `magnetDepth` | mm | How deep the magnet pocket is bored into the front wall. |
| `magnetInset` | mm | Distance from each end of the front edge to the first/last magnet. |
| `cardSlotEnabled` | bool | UI-only: card slot parameters are wired but no geometry is cut yet. |
| `cardSlotWidth` | mm | UI-only. |
| `cardSlotLength` | mm | UI-only. |
| `modelName` | string | Names the exported STL/STEP part. |

## Derived dimensions

```
taper (per side) = length ÷ tan(interiorAngle)
backWidth        = width − 2 × taper
inner front W    = width     − 2 × wallThickness
inner back W     = backWidth − 2 × wallThickness
inner length     = length    − 2 × wallThickness
```

The `interiorAngle` α and the taper have this relationship:

- **tan(α) = length / taper_per_side**
- **taper_per_side = length / tan(α)**
- α = 90°: tan(90°) → ∞, taper → 0, backWidth = width (rectangle)
- α = 80°: tan(80°) ≈ 5.67, taper ≈ 15.9 mm, backWidth ≈ 148 mm (at defaults)
- α = 45°: tan(45°) = 1, taper = length (back is a point — degenerate)
