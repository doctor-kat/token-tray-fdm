---
name: verify
description: Project-specific recipe for driving OCCAD (this app) in a real browser to verify a change, instead of just running tests.
model: claude-haiku-4-5-20251001
---

# Verifying OCCAD in the browser

## Launch

```bash
bun run dev
```

Vite auto-increments the port if 8080/8081 are taken (other sessions may already be running); read the actual
`Local: http://localhost:PORT/` line from the command output.

## Driving the app

Use the Chrome extension (`mcp__claude-in-chrome__*`). Load the tools via ToolSearch first (they're
deferred). If the extension reports "not connected", ask the user to reconnect it rather than reaching
for another browser stack.

The CAD viewport is a single `<canvas>` — react-three-fiber's scene graph isn't addressable through the
accessibility tree, so element refs/CSS selectors can't target a specific canvas pixel. To click/drag at
a specific canvas pixel, dispatch synthetic `PointerEvent`s via `mcp__claude-in-chrome__javascript_tool`:

```js
() => {
  const canvas = document.querySelector('canvas');
  const rect = canvas.getBoundingClientRect();
  function fire(type, x, y, buttons = 0) {
    canvas.dispatchEvent(new PointerEvent(type, {
      clientX: rect.left + x, clientY: rect.top + y,
      bubbles: true, cancelable: true, pointerId: 1,
      pointerType: 'mouse', button: 0, buttons, composed: true,
    }));
  }
  fire('pointermove', x1, y1, 0);
  fire('pointerdown', x1, y1, 1);
  fire('pointermove', x2, y2, 1); // drag path
  fire('pointerup', x2, y2, 0);
}
```

This reliably drives sketch tools (rectangle drag, line clicks, etc.) since they're bound to pointer events
on the canvas. Camera-orbit drags (left/right mouse drag on empty canvas) did **not** respond to synthetic
pointer events in testing — the ViewCube and orbit controls may need real OS-level input or a different
event sequence. Don't rely on rotating the view to confirm 3D geometry.

## Confirming real 3D geometry (not a flat/degenerate result)

Don't trust the camera angle — the default view looks straight down some axes and a flat, zero-volume
prism can look identical to a real box from the front. Instead:

1. Open the **Entities** panel (right sidebar tab next to Feature Tree) after building/extruding.
2. Check the **Faces** and **Edges** counts. A real box from an extruded rectangle is **6 faces / 12
   edges**. A degenerate/flat prism (the historical bug this rule guards against — see ROADMAP.md's
   "createWorkplane... left-handed basis" entry) produces something less than that, or the rebuild
   errors out with a notification instead of "Rebuild complete".
3. For extra confidence, use **Evaluate → Measure**, select an edge, Apply — it adds a `MeasureN` feature
   to the tree (the numeric value isn't rendered inline in the tree label in the current UI; this is mostly
   useful as an existence/no-crash check).

## Typical flow for a sketch/extrude change

1. `bun run dev`, navigate to the port.
2. Wait for "Loading OpenCascade WASM…" to clear.
3. Click a plane in the Feature Tree (Front/Top/Right Plane) to select it as the selected plane — it becomes
   "Selected: <Plane>" at the bottom bar.
4. Sketch tab → "Sketch" button to enter sketch mode on that plane.
5. Pick a tool (e.g. "Corner Rectangle"), drive two pointer-event drag/click pairs on the canvas.
6. "Finish Sketch".
7. Select the new sketch in the Feature Tree, switch to the **Advanced** tab (not Modifications —
   `EXTRUDE_BOSS`/`REVOLVED_BOSS` live under Advanced; `Extrude Cut`/`Revolve Cut` live under
   Modifications), click "Extrude Boss", Apply.
8. Check Entities panel face/edge counts as above.
