// Stand-in for the Node builtins (fs/path/crypto) that the replicad emscripten
// glue references but never calls in the browser/worker. See next.config.mjs.
export default {};
