# Token Tray parameters

A compartmented rectangular tray for tokens, dice, and bits. The outer form
is a rounded box; inner compartments are cut as vertical pockets with a
bottom fillet (scoop) at each cell floor.

## Coordinate system

- **X** — width (left / right)
- **Y** — height (front / back)
- **Z** — depth (up from the print bed)

The 2D plan view flips Y so screen-top matches the 3D view's +Y (front).

The outer rectangle has rounded corners (`sideFillet`). Cells are laid out
by recursively splitting the inner rectangle (width − 2×outerWallThickness
by height − 2×outerWallThickness) with `wallThickness` separators.

The rim at the top opening receives a small `rimFillet` rounding.
Each compartment floor gets a `bottomFillet` scoop radius.

## Parameter reference

| Parameter | Axis / unit | Description |
|---|---|
| `width` | X, mm | Outer X dimension of the tray. |
| `height` | Y, mm | Outer Y dimension of the tray. |
| `depth` | Z, mm | Outer Z dimension (floor to rim). |
| `outerWallThickness` | mm | Thickness of the four perimeter walls. |
| `wallThickness` | mm | Thickness of internal separator walls between compartments. |
| `sideFillet` | mm | Outer vertical corner radius (plan view). |
| `bottomFillet` | mm | Scoop radius where compartment bottoms meet the walls. |
| `rimFillet` | mm | Small rounding applied to the top rim edge. |
| `lidType` | enum | `"none"`, `"lid"` (telescoping cap), `"sliding-lid"` (panel in rails), or `"cover"` (flush cover with compartment plugs). |
| `lidTolerance` | mm | Clearance gap between lid and tray. |
| `lidInnerHeight` | mm | Depth of the cover's compartment plugs (cover type only). |
| `withCoverLip` | bool | Whether the cover includes a pull tab (cover type only). |
| `modelName` | string | Names the exported STL/STEP part(s). |

## Derived dimensions

```
inner width  = width  − 2 × outerWallThickness
inner height = height − 2 × outerWallThickness
```

The inner rectangle is recursively split into cells by the split tree.
Each leaf cell is cut as a vertical pocket with `bottomFillet` at its floor.
