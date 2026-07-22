/// <reference lib="webworker" />
//
// Web worker that runs the OpenCascade WASM kernel. The main thread posts
// { params, structure } and gets back a meshed representation (faces + edges)
// ready to feed replicad-threejs-helper, or an exported STL/STEP blob.

import * as replicad from "replicad";
import opencascade from "replicad-opencascadejs/src/replicad_single.js";
import { combineMeshes } from "@/app/lib/mesh";
import { buildTray, type SplitNode, type TrayParams } from "@/app/lib/model";

let ocReady: Promise<void> | null = null;

async function initOC() {
  if (!ocReady) {
    ocReady = (async () => {
      // The generated typings declare init() with no args, but the emscripten
      // factory accepts a module-overrides object at runtime.
      const init = opencascade as unknown as (options: {
        locateFile: () => string;
      }) => Promise<unknown>;
      const OC = await init({
        // Let the bundler resolve and fingerprint the kernel next to this
        // chunk, rather than relying on a copy in /public.
        locateFile: () =>
          new URL("replicad-opencascadejs/src/replicad_single.wasm", import.meta.url).href,
      });
      replicad.setOC(OC as any);
    })();
  }

  return ocReady;
}

type BuildMessage = {
  type: "build";
  id: number;
  params: TrayParams;
  structure: SplitNode;
};

type ExportMessage = {
  type: "export";
  id: number;
  format: "stl" | "step";
  params: TrayParams;
  structure: SplitNode;
};

type InMessage = BuildMessage | ExportMessage;

globalThis.onmessage = async (e: MessageEvent<InMessage>) => {
  const message = e.data;
  try {
    await initOC();
    const parts = buildTray(replicad, message.params, message.structure);

    if (message.type === "build") {
      // Mesh each part on its own so its normals stay correct, then merge the
      // buffers into one geometry for the viewer.
      const meshed = parts.map((part) => ({
        faces: part.shape.mesh({ tolerance: 0.05, angularTolerance: 30 }),
        edges: part.shape.meshEdges({ keepMesh: true }),
      }));
      const { faces, edges } = combineMeshes(meshed);
      globalThis.postMessage({
        type: "built",
        id: message.id,
        faces,
        edges,
      });
      return;
    }

    if (message.type === "export") {
      // One downloadable file: fuse the parts into a compound (export doesn't
      // depend on the shading normals that the compound would disturb).
      const shape =
        parts.length === 1
          ? parts[0].shape
          : replicad.makeCompound(parts.map((part) => part.shape));
      const blob = message.format === "stl" ? shape.blobSTL() : shape.blobSTEP();

      globalThis.postMessage({
        type: "exported",
        id: message.id,
        blob,
        format: message.format,
      });
    }
  } catch (error) {
    globalThis.postMessage({
      type: "error",
      id: message.id,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
