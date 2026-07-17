"use client";

import * as React from "react";
import type { TrayParams, SplitNode } from "@/lib/model";
import type { MeshData } from "@/components/tray-viewer";

// Debounced worker client: rebuilds the mesh when params/structure change and
// exposes an `exportModel` for downloads.
export function useTrayWorker(params: TrayParams, structure: SplitNode) {
  const workerRef = React.useRef<Worker | null>(null);
  const idRef = React.useRef(0);
  const [mesh, setMesh] = React.useState<MeshData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const exportResolvers = React.useRef<
    Map<number, (blob: Blob) => void>
  >(new Map());

  React.useEffect(() => {
    const worker = new Worker(
      new URL("../worker/tray.worker.ts", import.meta.url)
    );
    workerRef.current = worker;
    worker.onmessage = (e: MessageEvent) => {
      const data = e.data;
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
      } else if (data.type === "error") {
        if (data.id === idRef.current) {
          setError(data.message);
          setLoading(false);
        }
      }
    };
    return () => worker.terminate();
  }, []);

  // Debounced rebuild.
  React.useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;
    setLoading(true);
    const handle = setTimeout(() => {
      const id = ++idRef.current;
      worker.postMessage({ type: "build", id, params, structure });
    }, 180);
    return () => clearTimeout(handle);
  }, [params, structure]);

  const exportModel = React.useCallback(
    (format: "stl" | "step") => {
      const worker = workerRef.current;
      if (!worker) return Promise.reject(new Error("worker not ready"));
      const id = ++idRef.current;
      return new Promise<Blob>((resolve) => {
        exportResolvers.current.set(id, resolve);
        worker.postMessage({ type: "export", id, format, params, structure });
      });
    },
    [params, structure]
  );

  return { mesh, loading, error, exportModel };
}
