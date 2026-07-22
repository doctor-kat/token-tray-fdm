// Minimal typing surface for the parts of replicad we touch inside the worker.
// The real module is loaded dynamically; we only need `drawRoundedRectangle`.
export type Replicad = typeof import("replicad");
