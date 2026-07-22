// The meshed geometry the worker posts back for three.js to render — the
// contract shared between the builder (producer) and the viewer (consumer).
// biome-ignore lint/suspicious/noExplicitAny: replicad mesh buffers are broadly typed
export type MeshData = { faces: any; edges: any };
