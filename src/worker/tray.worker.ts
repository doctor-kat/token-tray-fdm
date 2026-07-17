/// <reference lib="webworker" />
//
// Web worker that runs the OpenCascade WASM kernel. The main thread posts
// { params, structure } and gets back a meshed representation (faces + edges)
// ready to feed replicad-threejs-helper, or an exported STL/STEP blob.

import opencascade from "replicad-opencascadejs/src/replicad_single.js";
import * as replicad from "replicad";
import { buildTray, type TrayParams, type SplitNode } from "@/lib/model";

let ocReady: Promise<void> | null = null;

async function initOC() {
  if (!ocReady) {
    ocReady = (async () => {
      // The generated typings declare init() with no args, but the emscripten
      // factory accepts a module-overrides object at runtime.
      const init = opencascade as unknown as (opts: {
        locateFile: () => string;
      }) => Promise<unknown>;
      const OC = await init({
        // wasm is copied to /public by the postinstall step.
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

self.onmessage = async (e: MessageEvent<InMessage>) => {
  const msg = e.data;
  try {
    await initOC();
    const shape = buildTray(replicad, msg.params, msg.structure);

    if (msg.type === "build") {
      const faces = shape.mesh({ tolerance: 0.1, angularTolerance: 30 });
      const edges = shape.meshEdges();
      self.postMessage({ type: "built", id: msg.id, faces, edges });
      return;
    }

    if (msg.type === "export") {
      let blob: Blob;
      if (msg.format === "stl") {
        blob = shape.blobSTL();
      } else {
        blob = shape.blobSTEP();
      }
      self.postMessage({ type: "exported", id: msg.id, blob, format: msg.format });
      return;
    }
  } catch (err) {
    self.postMessage({
      type: "error",
      id: msg.id,
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
