# token-tray-fdm

A parametric generator for 3D-printable token trays. Lay compartments out in 2D, watch the solid
rebuild in 3D, and export STL or STEP — all in the browser, with no server round-trip.

Three designs ship today: the **token tray**, **Quick Draw** (card boxes), and a **Wyrmwood**
accessory.

## Running it

Uses [bun](https://bun.sh):

```sh
bun install
bun run dev
```

`bun run build` / `bun run start` for production, `bun run lint` for biome.

## How it works

Next.js (App Router, React 19) on the front, with the CAD kernel running entirely client-side in a
web worker — the main thread never touches it. See `CLAUDE.md` for the architecture in detail.

## Attribution

Geometry is built with **[replicad](https://replicad.xyz)** (MIT, © 2023 QuaroTech Sàrl), which
wraps the OpenCASCADE kernel compiled to WebAssembly. Full notices, including the caveat that the
underlying OCCT kernel carries its own LGPL terms, are in
[THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md).
