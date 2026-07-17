"use client";

import * as React from "react";
import {
  AmbientLight,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  LineBasicMaterial,
  LineSegments,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  Box3,
  Vector3,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  syncFaces,
  syncLines,
  syncLinesFromFaces,
} from "replicad-threejs-helper";

export interface MeshData {
  faces: any;
  edges: any;
}

export function TrayViewer({
  mesh,
  loading,
}: {
  mesh: MeshData | null;
  loading: boolean;
}) {
  const mountRef = React.useRef<HTMLDivElement>(null);
  const stateRef = React.useRef<{
    renderer: WebGLRenderer;
    scene: Scene;
    camera: PerspectiveCamera;
    controls: OrbitControls;
    group: Group;
    faceMesh: Mesh;
    lines: LineSegments;
    raf: number;
  } | null>(null);
  const [framedOnce, setFramedOnce] = React.useState(false);

  // Set up the scene once.
  React.useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new Scene();
    scene.background = null;

    const camera = new PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      1,
      2000
    );
    camera.position.set(160, -160, 140);
    camera.up.set(0, 0, 1);

    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new AmbientLight(0xffffff, 0.6));
    const key = new DirectionalLight(0xffffff, 1.6);
    key.position.set(120, -180, 260);
    scene.add(key);
    const fill = new DirectionalLight(0xffffff, 0.6);
    fill.position.set(-160, 120, 80);
    scene.add(fill);

    const group = new Group();
    // replicad works in a Z-up world; keep it and just orient the camera up.
    scene.add(group);

    const faceMaterial = new MeshStandardMaterial({
      color: new Color("#5b8def"),
      metalness: 0.1,
      roughness: 0.6,
      flatShading: false,
    });
    const faceMesh = new Mesh(undefined, faceMaterial);
    group.add(faceMesh);

    const isDark = document.documentElement.classList.contains("dark");
    const lineMaterial = new LineBasicMaterial({
      color: new Color(isDark ? "#cbd5e1" : "#1b2a4a"),
    });
    const lines = new LineSegments(undefined, lineMaterial);
    group.add(lines);

    const animate = () => {
      const st = stateRef.current;
      if (!st) return;
      st.controls.update();
      st.renderer.render(st.scene, st.camera);
      st.raf = requestAnimationFrame(animate);
    };

    stateRef.current = {
      renderer,
      scene,
      camera,
      controls,
      group,
      faceMesh,
      lines,
      raf: 0,
    };
    stateRef.current.raf = requestAnimationFrame(animate);

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(stateRef.current!.raf);
      controls.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      stateRef.current = null;
    };
  }, []);

  // Sync geometry whenever a new mesh arrives.
  React.useEffect(() => {
    const st = stateRef.current;
    if (!st || !mesh) return;

    syncFaces(st.faceMesh.geometry, mesh.faces);
    if (mesh.edges) {
      syncLines(st.lines.geometry, mesh.edges);
    } else {
      syncLinesFromFaces(st.lines.geometry, st.faceMesh.geometry);
    }

    if (!framedOnce) {
      const box = new Box3().setFromObject(st.group);
      const center = box.getCenter(new Vector3());
      const size = box.getSize(new Vector3()).length();
      st.controls.target.copy(center);
      const dir = new Vector3(1, -1, 0.9).normalize();
      st.camera.position.copy(center.clone().add(dir.multiplyScalar(size)));
      st.camera.updateProjectionMatrix();
      setFramedOnce(true);
    }
  }, [mesh, framedOnce]);

  return (
    <div className="relative h-full w-full">
      <div ref={mountRef} className="h-full w-full" />
      {loading && (
        <div className="pointer-events-none absolute right-4 top-4 rounded-md bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow backdrop-blur">
          Rebuilding…
        </div>
      )}
    </div>
  );
}
