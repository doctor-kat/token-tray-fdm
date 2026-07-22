"use client";

import * as React from "react";
import type { MeshData } from "@/app/lib/mesh";
import type { SplitNode, TrayParams } from "@/app/lib/model";

// Debounced worker client: rebuilds the mesh when params/structure change and
// exposes an `exportModel` for downloads.
export function useTrayWorker(parameters: TrayParams, structure: SplitNode) {
  const workerRef = React.useRef<Worker | null>(null);
  const idRef = React.useRef(0);
  const [mesh, setMesh] = React.useState<MeshData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const exportResolvers = React.useRef<Map<number, (blob: Blob) => void>>(new Map());

  React.useEffect(() => {
    const worker = new Worker(new URL("./tray.worker.ts", import.meta.url));
    workerRef.current = worker;
    worker.onmessage = (e: MessageEvent) => {
      const { data } = e;
      if (data.type === "built") {
        // Only accept the most recent build.
        if (data.id === idRef.current) {
          setMesh({ faces: data.faces, edges: data.edges });
          setLoading(false);
          setError(null);
        }
      } else if (data.type === "exported") {
        const resolve = exportResolvers.current.get(data.id);
        if (resolve) {
          resolve(data.blob);
          exportResolvers.current.delete(data.id);
        }
      } else if (data.type === "error" && data.id === idRef.current) {
        setError(data.message);
        setLoading(false);
      }
    };

    return () => {
      worker.terminate();
    };
  }, []);

  // Debounced rebuild.
  React.useEffect(() => {
    const worker = workerRef.current;
    if (!worker) {
      return;
    }

    setLoading(true);
    const handle = setTimeout(() => {
      const id = ++idRef.current;
      worker.postMessage({
        type: "build",
        id,
        params: parameters,
        structure,
      });
    }, 180);
    return () => {
      clearTimeout(handle);
    };
  }, [parameters, structure]);

  const exportModel = React.useCallback(
    async (format: "stl" | "step") => {
      const worker = workerRef.current;
      if (!worker) {
        throw new Error("worker not ready");
      }

      const id = ++idRef.current;
      return new Promise<Blob>((resolve) => {
        exportResolvers.current.set(id, resolve);
        worker.postMessage({
          type: "export",
          id,
          format,
          params: parameters,
          structure,
        });
      });
    },
    [parameters, structure],
  );

  return {
    mesh,
    loading,
    error,
    exportModel,
  };
}
