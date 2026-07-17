// Copies the OpenCascade WASM kernel into /public so the web worker can fetch
// it at runtime (locateFile -> /replicad_single.wasm). Runs on postinstall.
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(
  root,
  "node_modules",
  "replicad-opencascadejs",
  "src",
  "replicad_single.wasm"
);
const destDir = join(root, "public");
const dest = join(destDir, "replicad_single.wasm");

if (!existsSync(src)) {
  console.warn("[copy-wasm] source not found, skipping:", src);
  process.exit(0);
}
mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log("[copy-wasm] copied kernel to public/replicad_single.wasm");
