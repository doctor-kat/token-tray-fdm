/// <reference lib="webworker" />
//
// Web worker that runs the OpenCascade WASM kernel. The main thread posts
// { params, structure } and gets back a meshed representation (faces + edges)
// ready to feed replicad-threejs-helper, or an exported STL/STEP blob.

import * as replicad from "replicad";
import opencascade from "replicad-opencascadejs/src/replicad_single.js";
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
        // Wasm is copied to /public by the postinstall step.
        locateFile: () => "/replicad_single.wasm",
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
    const shape = buildTray(replicad, message.params, message.structure);

    if (message.type === "build") {
      const faces = shape.mesh({ tolerance: 0.1, angularTolerance: 30 });
      const edges = shape.meshEdges();
      globalThis.postMessage({
        type: "built",
        id: message.id,
        faces,
        edges,
      });
      return;
    }

    if (message.type === "export") {
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
