# Quick Draw parameters

A deck box (tray + optional lid) sized to your cards. Each deck gets its own
pocket; multiple decks are laid out side-by-side with internal walls between
them. Finger scoops let you reach the cards.

## Coordinate system

- **X** — left / right (decks are arranged along X)
- **Y** — front / back (card height direction)
- **Z** — up from the print bed

Finger scoops are cut through the long front wall (the wall facing +Y) so
a thumb can reach the deck. The scoop radius is `fingerHoleSize / 2`.

## Parameter reference

| Parameter | Axis / unit | Description |
|---|---|---|
| `cardType` | enum | Preset card size: `magicCards`, `sleevedMagicCards`, `playingCards`, `tallCards`, `sleevedTallCards`, `smallCards`, `smallCardsUS`, `sleevedSmallCards`, or `custom`. |
| `cardHeight` | Y, mm | Height of a single card (shorter edge for poker-sized). Overridden by preset unless `cardType` is `custom`. |
| `cardWidth` | X, mm | Width of a single card (longer edge for poker-sized). Overridden by preset unless `cardType` is `custom`. |
| `deckHeight` | Z, mm | Stack height of one deck. |
| `deckCount` | int | Number of decks (one pocket each, side by side along X). |
| `lidType` | enum | `"lid"` (telescoping cap), `"cover"`, or `"none"`. |
| `lidCutout` | bool | Whether the lid front wall has a cutout window. |
| `wallThickness` | mm | Thickness of outer walls and deck-to-deck separators. |
| `cardTolerance` | mm | Clearance added to card dimensions (full amount, once per axis — not a per-side value). |
| `innerFilletRadius` | mm | Corner radius on the interior pocket walls. |
| `fingerHoleSize` | mm | Diameter of the thumb scoop (a circle cut through the front wall). |
| `lidTolerance` | mm | Clearance gap between lid and tray. |
| `modelName` | string | Names the exported STL/STEP part(s). |

## Derived dimensions

```
pocketW = cardWidth  + cardTolerance
pocketL = cardHeight + cardTolerance
trayW   = deckCount × pocketW + (deckCount + 1) × wallThickness
trayL   = pocketL + 2 × wallThickness
trayH   = deckHeight + wallThickness
lidW    = trayW + 2 × lidTolerance
lidL    = trayL + 2 × lidTolerance
lidH    = trayH + lidTolerance
```

The `cardTolerance` is applied as the **full** amount to each axis (not as
a per-side value). This matches the reference site's readout: a magic card
(64×89 mm) with wall 1.8 and tolerance 2 gives pocketW = 64 + 2 = 66,
trayW = 66 + 2×1.8 = 69.6.
