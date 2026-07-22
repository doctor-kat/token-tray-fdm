"use client";

import {
  ActionIcon,
  Badge,
  Box,
  ColorSwatch,
  Group as MGroup,
  Popover,
  Text,
  Tooltip,
} from "@mantine/core";
import * as React from "react";
import { syncFaces, syncLines, syncLinesFromFaces } from "replicad-threejs-helper";
import {
  ACESFilmicToneMapping,
  AmbientLight,
  Box3,
  BufferGeometry,
  Color,
  DirectionalLight,
  GridHelper,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Sphere,
  Timer,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ViewHelper } from "three/examples/jsm/helpers/ViewHelper.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { bambuMattePLA, defaultFilament } from "@/app/lib/filaments";
import type { MeshData } from "@/app/lib/mesh";

export type { MeshData };

export function TrayViewer({ mesh, loading }: { mesh: MeshData | null; loading: boolean }) {
  const mountRef = React.useRef<HTMLDivElement>(null);
  const [color, setColor] = React.useState(defaultFilament.hex);
  const stateRef = React.useRef<
    | {
        renderer: WebGLRenderer;
        scene: Scene;
        camera: PerspectiveCamera;
        controls: OrbitControls;
        viewHelper: ViewHelper;
        timer: Timer;
        grid: GridHelper;
        group: Group;
        faceMesh: Mesh;
        edgeSrc: BufferGeometry;
        lineGeom: LineSegmentsGeometry;
        lines: LineSegments2;
        lineMaterial: LineMaterial;
        raf: number;
      }
    | undefined
  >(null);
  const framedOnceRef = React.useRef(false);

  // Set up the scene once.
  React.useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    const scene = new Scene();
    scene.background = null;

    const camera = new PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 1, 4000);
    camera.position.set(160, -160, 140);
    camera.up.set(0, 0, 1);

    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    // Match the reference viewer's filmic look — nicer highlight roll-off so
    // edges read crisply against the shaded faces.
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    // ViewHelper draws as an overlay, so we clear manually in the loop.
    renderer.autoClear = false;
    mount.append(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const viewHelper = new ViewHelper(camera, renderer.domElement);
    viewHelper.setLabels("X", "Y", "Z");

    scene.add(new AmbientLight(0xff_ff_ff, 0.6));
    const key = new DirectionalLight(0xff_ff_ff, 1.8);
    key.position.set(120, -180, 260);
    scene.add(key);
    const fill = new DirectionalLight(0xff_ff_ff, 0.7);
    fill.position.set(-160, 120, 80);
    scene.add(fill);

    const isDark = document.documentElement.classList.contains("dark");

    // Ground grid in the XY plane (replicad is Z-up, so rotate the default
    // XZ grid a quarter turn). Sized/positioned to the model on first frame.
    const grid = new GridHelper(
      400,
      40,
      new Color(isDark ? "#64748b" : "#94a3b8"),
      new Color(isDark ? "#334155" : "#cbd5e1"),
    );
    grid.rotation.x = Math.PI / 2;
    scene.add(grid);

    const group = new Group();
    scene.add(group);

    const faceMaterial = new MeshStandardMaterial({
      color: new Color(defaultFilament.hex),
      // Matte PLA reads as a near-diffuse surface — no metal, high roughness.
      metalness: 0,
      roughness: 0.85,
      flatShading: false,
    });

    const faceMesh = new Mesh(undefined, faceMaterial);
    group.add(faceMesh);

    // Fat, screen-space-antialiased edge lines (LineSegments2) — the visible
    // "line quality" upgrade over 1px LineBasicMaterial.
    const lineMaterial = new LineMaterial({
      color: new Color(isDark ? "#cbd5e1" : "#1b2a4a").getHex(),
      linewidth: 1.6,
      // Let MSAA feather the fat-line quad borders — without this the edges
      // render hard/aliased no matter the pixel ratio.
      alphaToCoverage: true,
    });
    lineMaterial.resolution.set(mount.clientWidth, mount.clientHeight);
    const edgeSrc = new BufferGeometry();
    const lineGeom = new LineSegmentsGeometry();
    const lines = new LineSegments2(lineGeom, lineMaterial);
    group.add(lines);

    const timer = new Timer();

    const animate = () => {
      const st = stateRef.current;
      if (!st) {
        return;
      }

      // Timer (unlike the deprecated Clock) needs an explicit tick each frame
      // before the delta is valid.
      st.timer.update();
      const delta = st.timer.getDelta();
      if (st.viewHelper.animating) {
        st.viewHelper.update(delta);
      }
      st.controls.update();
      st.renderer.clear();
      st.renderer.render(st.scene, st.camera);
      st.viewHelper.render(st.renderer);
      st.raf = requestAnimationFrame(animate);
    };

    stateRef.current = {
      renderer,
      scene,
      camera,
      controls,
      viewHelper,
      timer,
      grid,
      group,
      faceMesh,
      edgeSrc,
      lineGeom,
      lines,
      lineMaterial,
      raf: 0,
    };
    stateRef.current.raf = requestAnimationFrame(animate);

    // Click on the gizmo to snap the camera to an axis.
    const onPointerUp = (event: PointerEvent) => {
      viewHelper.handleClick(event);
    };
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    const onResize = () => {
      if (!mount) {
        return;
      }

      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      lineMaterial.resolution.set(mount.clientWidth, mount.clientHeight);
    };

    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    return () => {
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      if (stateRef.current) {
        cancelAnimationFrame(stateRef.current.raf);
      }
      viewHelper.dispose();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      stateRef.current = null;
    };
  }, []);

  // Sync geometry whenever a new mesh arrives.
  React.useEffect(() => {
    const st = stateRef.current;
    if (!st || !mesh) {
      return;
    }

    syncFaces(st.faceMesh.geometry, mesh.faces);
    if (mesh.edges) {
      syncLines(st.edgeSrc, mesh.edges);
    } else {
      syncLinesFromFaces(st.edgeSrc, st.faceMesh.geometry);
    }
    // Feed the synced positions into the fat-line geometry.
    const position = st.edgeSrc.getAttribute("position");
    if (position) {
      st.lineGeom.setPositions(position.array as Float32Array);
    }

    const box = new Box3().setFromObject(st.faceMesh);
    const center = box.getCenter(new Vector3());

    // Sit the grid on the model's base, centered under it.
    st.grid.position.set(center.x, center.y, box.min.z);

    if (!framedOnceRef.current) {
      const sphere = box.getBoundingSphere(new Sphere());
      const fov = (st.camera.fov * Math.PI) / 180;
      // Distance that fits the bounding sphere, plus a small margin.
      const distance = (sphere.radius / Math.sin(fov / 2)) * 1.1;
      st.controls.target.copy(sphere.center);
      const dir = new Vector3(1, -1, 0.9).normalize();
      st.camera.position.copy(sphere.center.clone().add(dir.multiplyScalar(distance)));
      st.camera.updateProjectionMatrix();
      framedOnceRef.current = true;
    }
  }, [mesh]);

  // Recolor the model material when a filament is picked.
  React.useEffect(() => {
    const material = stateRef.current?.faceMesh.material;
    if (material instanceof MeshStandardMaterial) {
      material.color.set(color);
    }
  }, [color]);

  return (
    <Box pos="relative" h="100%" w="100%">
      <Box ref={mountRef} h="100%" w="100%" />
      {/* Collapsed to a single swatch so the preview panel stays a clean
          window onto the model; the full palette opens on demand. The top-left
          corner belongs to the panel's own "3D Preview" badge. */}
      <Popover position="top-start" withArrow shadow="md">
        <Popover.Target>
          <Tooltip label="Filament colour" withArrow openDelay={400}>
            <ActionIcon
              pos="absolute"
              bottom={16}
              left={16}
              size={36}
              variant="default"
              aria-label="Filament colour"
            >
              <ColorSwatch color={color} size={18} withShadow={false} />
            </ActionIcon>
          </Tooltip>
        </Popover.Target>
        <Popover.Dropdown p="xs">
          <Text size="sm" c="dimmed" mb={6}>
            Filament
          </Text>
          <MGroup gap={6} style={{ width: 200 }}>
            {bambuMattePLA.map((f) => (
              <Tooltip key={f.hex} label={f.name} withArrow openDelay={200}>
                <ColorSwatch
                  component="button"
                  color={f.hex}
                  size={18}
                  onClick={() => {
                    setColor(f.hex);
                  }}
                  style={{
                    cursor: "pointer",
                    outline: color === f.hex ? "2px solid var(--mantine-color-rust-6)" : undefined,
                    outlineOffset: 2,
                  }}
                />
              </Tooltip>
            ))}
          </MGroup>
        </Popover.Dropdown>
      </Popover>
      {loading && (
        <Badge
          variant="default"
          pos="absolute"
          top={16}
          right={16}
          style={{ pointerEvents: "none" }}
        >
          Rebuilding…
        </Badge>
      )}
    </Box>
  );
}
