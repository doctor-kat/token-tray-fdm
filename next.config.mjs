/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack (the Next 16 default) handles async WASM natively, so the kernel
  // needs no experiment flag here. The emscripten glue still references Node
  // builtins that don't exist in the browser/worker — alias them to an empty
  // module (Turbopack has no `resolve.fallback` equivalent).
  turbopack: {
    resolveAlias: {
      fs: "./stubs/empty.mjs",
      path: "./stubs/empty.mjs",
      crypto: "./stubs/empty.mjs",
    },
  },
  // Kept so `next build --webpack` still works as an escape hatch.
  webpack(config) {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    return config;
  },
};

export default nextConfig;
