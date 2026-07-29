# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Use **bun** (not npm) for all package and script commands.

- `bun install` — installs deps (no postinstall step; the WASM kernel is resolved by the bundler — see below)
- `bun run dev` — Next.js dev server
- `bun run build` / `bun run start` — production build / serve
- `bun run lint` — `biome check .` (lint + format check); `bun run lint:fix` applies safe fixes; `bun run format` formats only. Config in `biome.json` (filename convention allows `kebab-case`, `camelCase`, and `PascalCase` — see Conventions below). The `noExplicitAny` warnings on the replicad boolean/fillet chains are deliberate (see below) — leave them.

There is no test suite.

## Architecture

A single-page Next.js (App Router, React 19) parametric CAD app that generates a 3D-printable token tray. The geometry kernel is **replicad** (OpenCascade compiled to WASM), which runs entirely client-side inside a **web worker** — the main thread never touches the kernel.

### Project layout (App Router colocation)

The repo follows Next.js's [App Router colocation](https://nextjs.org/docs/app/getting-started/project-structure#colocation) strategy, organized **by feature** and kept flat: files live directly in `src/app/`, and a folder is introduced only when a feature has more than one file. A folder becomes a route only when it contains a `page`/`route` file, so this colocation never leaks URLs. Shared domain code lives in `src/app/lib/`.

Single-file features (directly in `src/app/`):
- `TraySettingsBand.tsx` — edits global `TrayParams`
- `CompartmentDock.tsx` — per-cell customization + presets
- `PlanView.tsx` — 2D compartment layout / split editing
- `TrayViewer.tsx` — three.js render (`dynamic(..., { ssr: false })`)
- `ExportBar.tsx` — STL/STEP export UI
- `TrayApp.tsx` — the app shell / composition root that wires the features together

Multi-file folders:
- `src/app/builder/` — `useTrayWorker.ts` + `tray.worker.ts` (the geometry build pipeline)
- `src/app/lib/` — shared domain: `model.ts` (types + geometry), `tree-ops.ts` (tree mutations), `mesh.ts` (`MeshData` worker↔viewer contract), `units.ts`, `replicad-types.ts`

The routable/framework files also sit directly in `src/app/`: `layout.tsx`, `page.tsx`, `globals.css`, plus the App Router boundary files `loading.tsx` (Suspense fallback while the client-only viewer/WASM boots), `error.tsx` (error boundary — client component), and `not-found.tsx`. `@/` aliases `src/`, so modules are imported as `@/app/<file>` and shared code as `@/app/lib/...`. No barrel/`index.ts` files.

**Dependency rule:** features import only from shared `lib/` (never from another feature); the app shell (`TrayApp.tsx`) composes the features. This is a documented convention — biome has no import-path-zone rule to machine-enforce it.

### Data flow

1. **State** lives in `TrayApp` (`src/app/TrayApp.tsx`): a `TrayParams` object (outer dimensions, wall thickness, fillets) and a `SplitNode` tree (`structure`) describing the compartment layout.
2. **`useTrayWorker`** (`src/app/builder/useTrayWorker.ts`) owns the worker. On any `params`/`structure` change it debounces (180ms) and posts a `build` message; it discards stale responses by comparing an incrementing `id`. `exportModel(format)` posts an `export` message and resolves a promise with the resulting Blob.
3. **The worker** (`src/app/builder/tray.worker.ts`) lazy-inits the WASM kernel once, calls `buildTray`, and posts back either a meshed representation (`faces` + `edges` for three.js) or an STL/STEP Blob.
4. **`TrayViewer`** (`src/app/TrayViewer.tsx`, loaded via `dynamic(..., { ssr: false })`) renders the mesh with three.js + `replicad-threejs-helper`.

### The split tree (core model)

`src/app/lib/model.ts` defines the domain. A `SplitNode` is either a leaf (a compartment) or a node split `vertical`/`horizontal` into children whose `size` fractions sum to 1. Key functions:

- `layoutCells(node, rect, wall)` — recursively flattens the tree into leaf rectangles, accounting for separator wall thickness.
- `buildTray(replicad, params, structure)` — builds the solid: extrudes the rounded outer box, then for each leaf cell cuts a pocket (with per-cell `depth`/`bottomFillet` overrides falling back to global params). `replicad` is **injected** so this pure function can run inside the worker where the kernel is initialized. Chained boolean/fillet results are typed `any` deliberately.

`src/app/lib/tree-ops.ts` holds the **immutable** tree mutations the UI dispatches (`splitCell`, `removeCell`, `setSizeBalanced`, `setCustomization`, …). Every op returns a new tree so React state updates cleanly; sibling sizes are re-normalized to sum to 1. Note `splitCell` appends a sibling when splitting in the same direction but wraps-and-nests when splitting across directions, and `removeCell` collapses a node into its single remaining child.

### WASM/worker build config

Next 16 builds with **Turbopack** by default, which handles async WASM natively. `next.config.mjs` aliases the Node builtins the emscripten glue references (`fs`/`path`/`crypto`) to `stubs/empty.mjs`, since Turbopack has no `resolve.fallback` equivalent. The old `webpack()` block is kept so `next build --webpack` still works as an escape hatch — **change both if you touch either**. The kernel `.wasm` is resolved by the bundler: `tray.worker.ts` hands emscripten's `locateFile` a `new URL("replicad-opencascadejs/src/replicad_single.wasm", import.meta.url).href`. Turbopack statically analyses that exact expression, emits the file to `/_next/static/media/` with a content hash, and rewrites the URL — so there is **no `public/` copy and no postinstall step**, and the kernel re-syncs automatically when `replicad-opencascadejs` is upgraded. Keep the specifier a literal inside `new URL(...)`; hoisting it to a variable defeats the static analysis and the asset silently stops being emitted.

## Conventions

- **File naming** (biome allows `kebab-case`, `camelCase`, `PascalCase`):
  - React component files → **PascalCase** (`TrayViewer.tsx`, `ExportBar.tsx`).
  - Custom hooks → **camelCase** with `use` prefix (`useTrayWorker.ts`).
  - Utilities / domain logic / config → **lowercase** kebab-case (`model.ts`, `tree-ops.ts`, `tray.worker.ts`).
  - Next.js App Router files stay their framework-mandated lowercase (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`).
  - The disk filename must exactly match the case used in imports — Windows/macOS are case-insensitive but git and Linux CI are not.
- UI is **Mantine** (`@mantine/core` + `@mantine/hooks`). `@/` aliases `src/`.
  - **Prefer stock Mantine components and props over hand-rolled markup or inline styles.** Reach for `Stack`/`Group`/`SimpleGrid` for layout and the style props (`p`, `bg`, `c`, `fw`) rather than `style={{}}`.
  - The palette and fonts live in `src/app/theme.ts` — two custom color tuples (`rust`, the primary accent, and `sand`, the warm paper surfaces). Use theme colors (`bg="sand.4"`, `c="rust.6"`) instead of hex literals.
  - `PlanView.tsx` deliberately does **not** use Mantine: it hand-draws the 2D compartment layout, so its hover styles stay in `globals.css`.
- `token-tray-fdm.js` at the repo root is the original reverse-engineered generator that `src/app/lib/model.ts` was adapted from — reference only, not part of the build.
- `docs/` — per-design parameter reference with ASCII art for each design, so there's no ambiguity about what each parameter controls or how axes are oriented. Read the relevant file before changing or discussing a design's geometry:
  - [`docs/wyrmwood-accessory.md`](docs/wyrmwood-accessory.md) — trapezoid plan shape, interior angle, magnets
  - [`docs/token-tray.md`](docs/token-tray.md) — rectangular tray, compartment layout, lid types
  - [`docs/quick-draw.md`](docs/quick-draw.md) — card deck box, derived dimensions, finger scoops
