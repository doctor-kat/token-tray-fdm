/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // replicad-opencascadejs ships a .wasm file loaded at runtime; make sure
    // webpack leaves the async wasm loading to the worker.
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    // The emscripten glue references Node builtins that don't exist in the
    // browser/worker; stub them out.
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
