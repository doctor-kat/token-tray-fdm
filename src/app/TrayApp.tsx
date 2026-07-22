"use client";

import {
  Badge,
  Box,
  Group,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Title,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import dynamic from "next/dynamic";
import * as React from "react";
import { AdvancedPanel } from "@/app/AdvancedPanel";
import { useTrayWorker } from "@/app/builder/useTrayWorker";
import { CompartmentDock } from "@/app/CompartmentDock";
import { ExportBar } from "@/app/ExportBar";
import {
  defaultParams,
  defaultStructure,
  layoutCells,
  type Rect,
  type SplitNode,
  type TrayParams,
} from "@/app/lib/model";
import {
  addNeighbor,
  findNode,
  findParent,
  removeCell,
  setCustomization,
  setLeafDimMm,
  splitCell,
} from "@/app/lib/tree-ops";
import { dispVal, type Units } from "@/app/lib/units";
import { PlanView } from "@/app/PlanView";
import { TraySettingsBand } from "@/app/TraySettingsBand";

const TrayViewer = dynamic(async () => import("@/app/TrayViewer").then((m) => m.TrayViewer), {
  ssr: false,
});

const AXIS_STEP = 30; // Mm added/removed per structural edit when a tray axis is in "auto"
const MIN_TRAY = 40;
const MAX_TRAY = 300;

// The two tray-axis locks plus the four TraySettingsBand auto-fit flags,
// collapsed into one record so the UI toggles them through a single reducer.
type Flags = {
  lockW: boolean;
  lockL: boolean;
  height: boolean;
  wall: boolean;
  side: boolean;
  bottom: boolean;
};

const defaultFlags: Flags = {
  lockW: true,
  lockL: true,
  height: true,
  wall: false,
  side: false,
  bottom: true,
};

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function leafCount(node: SplitNode): number {
  return node.children.length > 0 ? node.children.reduce((a, c) => a + leafCount(c), 0) : 1;
}

type Side = "left" | "right" | "top" | "bottom";

// The tray's coupled domain state. `params`, `structure`, and `selectedId`
// move together on every structural edit, so they live in one reducer rather
// than three independent useState slices.
type TrayState = {
  params: TrayParams;
  structure: SplitNode;
  selectedId: string | null;
};

// Axis auto-grow reads the current tray-axis locks; since the reducer is pure
// it can't close over `flags`, so structural actions carry the lock snapshot.
type Locks = { w: boolean; l: boolean };

type TrayAction =
  | { type: "select"; id: string }
  | { type: "deselect" }
  | { type: "patchParams"; patch: Partial<TrayParams> }
  | { type: "editStructure"; edit: (s: SplitNode) => SplitNode }
  | { type: "split"; dir: "vertical" | "horizontal"; locks: Locks }
  | { type: "addNeighbor"; side: Side; locks: Locks }
  | { type: "deleteSelected"; locks: Locks };

// Grow (or shrink) a tray axis by `delta` mm when that axis isn't locked.
function growAxis(params: TrayParams, axis: "w" | "l", delta: number, locks: Locks): TrayParams {
  if (axis === "w" && !locks.w) {
    return { ...params, width: clamp(params.width + delta, MIN_TRAY, MAX_TRAY) };
  }

  if (axis === "l" && !locks.l) {
    return { ...params, height: clamp(params.height + delta, MIN_TRAY, MAX_TRAY) };
  }

  return params;
}

function trayReducer(state: TrayState, action: TrayAction): TrayState {
  switch (action.type) {
    case "select":
      return { ...state, selectedId: state.selectedId === action.id ? null : action.id };
    case "deselect":
      return { ...state, selectedId: null };
    case "patchParams":
      return { ...state, params: { ...state.params, ...action.patch } };
    case "editStructure":
      return { ...state, structure: action.edit(state.structure) };
    case "split": {
      if (!state.selectedId) {
        return state;
      }

      const structure = splitCell(state.structure, state.selectedId, action.dir);
      const node = findNode(structure, state.selectedId);
      return {
        params: growAxis(
          state.params,
          action.dir === "vertical" ? "w" : "l",
          AXIS_STEP,
          action.locks,
        ),
        structure,
        selectedId: node && node.children.length > 0 ? node.children[0].id : state.selectedId,
      };
    }
    case "addNeighbor": {
      if (!state.selectedId) {
        return state;
      }

      const { tree, newId } = addNeighbor(state.structure, state.selectedId, action.side);
      const axis = action.side === "left" || action.side === "right" ? "w" : "l";
      return {
        params: growAxis(state.params, axis, AXIS_STEP, action.locks),
        structure: tree,
        selectedId: newId,
      };
    }
    case "deleteSelected": {
      if (!state.selectedId) {
        return state;
      }

      const parent = findParent(state.structure, state.selectedId);
      const axis =
        parent?.splitType === "vertical" ? "w" : parent?.splitType === "horizontal" ? "l" : null;
      return {
        params: axis ? growAxis(state.params, axis, -AXIS_STEP, action.locks) : state.params,
        structure: removeCell(state.structure, state.selectedId),
        selectedId: null,
      };
    }
    default:
      return state;
  }
}

type Layout = "mobile" | "tablet" | "desktop";

export function TrayApp() {
  const [units, setUnits] = React.useState<Units>("mm");
  const [view, setView] = React.useState<"plan" | "3d">("plan");

  // Mobile keeps the single-column card with a plan/3D toggle; tablet and
  // desktop show the plan and 3D previews side by side at once. Both queries
  // start false during SSR (the viewer is client-only anyway) and settle on mount.
  const tablet = useMediaQuery("(min-width: 768px)", false);
  const desktop = useMediaQuery("(min-width: 1080px)", false);
  const layout: Layout = desktop ? "desktop" : tablet ? "tablet" : "mobile";
  const wide = layout !== "mobile";

  const [{ params: parameters, structure, selectedId }, dispatch] = React.useReducer(trayReducer, {
    params: defaultParams,
    structure: defaultStructure(),
    selectedId: null,
  });

  const [flags, toggleFlag] = React.useReducer(
    (s: Flags, key: keyof Flags) => ({ ...s, [key]: !s[key] }),
    defaultFlags,
  );
  const locks: Locks = { w: flags.lockW, l: flags.lockL };

  const [fmt, setFmt] = React.useState<"stl" | "step">("stl");
  const [exporting, setExporting] = React.useState(false);

  const innerRect: Rect = React.useMemo(
    () => ({
      x: 0,
      y: 0,
      w: Math.max(1, parameters.width - 2 * parameters.outerWallThickness),
      h: Math.max(1, parameters.height - 2 * parameters.outerWallThickness),
    }),
    [parameters.width, parameters.height, parameters.outerWallThickness],
  );

  // Effective params fed to the geometry worker — auto height fits the
  // tallest customized compartment depth.
  const effectiveParameters: TrayParams = React.useMemo(() => {
    if (!flags.height) {
      return parameters;
    }

    const cells = layoutCells(structure, innerRect, parameters.wallThickness);
    let maxDepth = 0;

    for (const c of cells) {
      maxDepth = Math.max(maxDepth, c.customization.depth ?? 0);
    }

    if (maxDepth <= 0) {
      return parameters;
    }

    return { ...parameters, depth: Math.max(6, maxDepth + parameters.outerWallThickness) };
  }, [parameters, structure, innerRect, flags.height]);

  const { mesh, loading, error, exportModel } = useTrayWorker(effectiveParameters, structure);

  const cells = React.useMemo(
    () => layoutCells(structure, innerRect, parameters.wallThickness),
    [structure, innerRect, parameters.wallThickness],
  );
  const count = leafCount(structure);

  const selectedIndex = selectedId ? cells.findIndex((c) => c.id === selectedId) + 1 : 0;
  const selectedCell = selectedId ? cells.find((c) => c.id === selectedId) : null;
  const selectedNode = selectedId ? findNode(structure, selectedId) : null;

  const handleDelete = () => {
    dispatch({ type: "deleteSelected", locks });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportModel(fmt);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const name = parameters.modelName.trim() || "token-tray";
      a.download = `${name}.${fmt}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const effectiveDepth = parameters.depth - parameters.outerWallThickness;

  const titleBlock = (
    <Group gap="xs">
      <Title order={1} size="h4">
        {count} bins · {dispVal(parameters.width, units)}×{dispVal(parameters.height, units)}×
        {dispVal(effectiveParameters.depth, units)}
      </Title>
      <Badge
        variant="default"
        ff="monospace"
        style={{ cursor: "pointer" }}
        title="Switch units"
        onClick={() => {
          setUnits((u) => (u === "mm" ? "inch" : "mm"));
        }}
      >
        {units}
      </Badge>
    </Group>
  );

  const viewToggle = (
    <SegmentedControl
      value={view}
      onChange={(v) => {
        setView(v as "plan" | "3d");
      }}
      data={[
        { value: "plan", label: "Plan" },
        { value: "3d", label: "3D" },
      ]}
    />
  );

  const planEl = (
    <PlanView
      params={parameters}
      structure={structure}
      units={units}
      selectedId={selectedId}
      onSelect={(id) => {
        dispatch({ type: "select", id });
      }}
      onDeselect={() => {
        dispatch({ type: "deselect" });
      }}
      onSplit={(dir) => {
        dispatch({ type: "split", dir, locks });
      }}
      onAddNeighbor={(side) => {
        dispatch({ type: "addNeighbor", side, locks });
      }}
      lockW={flags.lockW}
      lockL={flags.lockL}
      onToggleLockW={() => {
        toggleFlag("lockW");
      }}
      onToggleLockL={() => {
        toggleFlag("lockL");
      }}
      fill={wide}
    />
  );

  const viewerEl = (
    <Box
      pos="relative"
      bg="sand.2"
      style={{ borderRadius: "var(--mantine-radius-md)", overflow: "hidden" }}
      h={wide ? "100%" : 252}
      mx={wide ? 0 : "lg"}
      mt={wide ? 0 : "md"}
    >
      <TrayViewer mesh={mesh} loading={loading} />
      {error && (
        <Badge color="red" pos="absolute" bottom={8} left="50%" style={{ translate: "-50%" }}>
          {error}
        </Badge>
      )}
    </Box>
  );

  const settingsBand = (
    <TraySettingsBand
      params={effectiveParameters}
      units={units}
      auto={flags}
      onChange={(patch) => {
        dispatch({ type: "patchParams", patch });
      }}
      onToggleAuto={toggleFlag}
    />
  );

  const advancedPanel = (
    <AdvancedPanel
      params={parameters}
      units={units}
      onChange={(patch) => {
        dispatch({ type: "patchParams", patch });
      }}
    />
  );

  const compartmentDock =
    selectedId && selectedCell && selectedNode ? (
      <CompartmentDock
        index={selectedIndex}
        units={units}
        dims={[
          {
            label: "WIDTH",
            value: selectedCell.rect.w,
            auto: selectedNode.customization.autoW,
            onChange: (mm) => {
              dispatch({
                type: "editStructure",
                edit: (s) =>
                  setLeafDimMm(s, selectedId, "w", mm, innerRect, parameters.wallThickness),
              });
            },
            onToggleAuto: () => {
              dispatch({
                type: "editStructure",
                edit: (s) =>
                  setCustomization(s, selectedId, { autoW: !selectedNode.customization.autoW }),
              });
            },
          },
          {
            label: "LENGTH",
            value: selectedCell.rect.h,
            auto: selectedNode.customization.autoL,
            onChange: (mm) => {
              dispatch({
                type: "editStructure",
                edit: (s) =>
                  setLeafDimMm(s, selectedId, "l", mm, innerRect, parameters.wallThickness),
              });
            },
            onToggleAuto: () => {
              dispatch({
                type: "editStructure",
                edit: (s) =>
                  setCustomization(s, selectedId, { autoL: !selectedNode.customization.autoL }),
              });
            },
          },
          {
            label: "DEPTH",
            value: selectedNode.customization.depth ?? effectiveDepth,
            auto: selectedNode.customization.depth == null,
            onChange: (mm) => {
              dispatch({
                type: "editStructure",
                edit: (s) =>
                  setCustomization(s, selectedId, { depth: clamp(mm, 2, effectiveDepth) }),
              });
            },
            onToggleAuto: () => {
              dispatch({
                type: "editStructure",
                edit: (s) =>
                  setCustomization(s, selectedId, {
                    depth: selectedNode.customization.depth == null ? effectiveDepth : null,
                  }),
              });
            },
          },
        ]}
        onDelete={handleDelete}
        onApplyPreset={(w, l) => {
          dispatch({
            type: "editStructure",
            edit: (s) => {
              let t = setLeafDimMm(s, selectedId, "w", w, innerRect, parameters.wallThickness);
              t = setLeafDimMm(t, selectedId, "l", l, innerRect, parameters.wallThickness);
              return t;
            },
          });
        }}
      />
    ) : null;

  const exportBar = (
    <ExportBar fmt={fmt} exporting={exporting} onPickFmt={setFmt} onExport={handleExport} />
  );

  const controls = (
    <>
      {settingsBand}
      {advancedPanel}
      {compartmentDock}
      {exportBar}
    </>
  );

  // Desktop: the app fills the viewport — previews in a left column, controls
  // in a fixed right rail that scrolls independently.
  if (layout === "desktop") {
    return (
      <Group h="100dvh" gap={0} align="stretch" wrap="nowrap">
        <Stack flex={1} miw={0} gap={0}>
          <Box px="lg" pt="md">
            {titleBlock}
          </Box>
          <SimpleGrid cols={2} spacing="md" flex={1} mih={0} px="lg" pb="md">
            {planEl}
            {viewerEl}
          </SimpleGrid>
        </Stack>
        <Stack
          w={400}
          gap={0}
          bg="sand.1"
          style={{ overflowY: "auto", borderLeft: "1px solid var(--mantine-color-sand-5)" }}
        >
          {controls}
        </Stack>
      </Group>
    );
  }

  // Tablet: previews side by side across the top, controls stacked below.
  if (layout === "tablet") {
    return (
      <Stack gap={0} mih="100dvh">
        <Box px="lg" pt="md">
          {titleBlock}
        </Box>
        <SimpleGrid cols={2} spacing="md" h={340} px="lg" pb="sm">
          {planEl}
          {viewerEl}
        </SimpleGrid>
        {controls}
      </Stack>
    );
  }

  // Mobile: single column with a plan/3D toggle.
  return (
    <Stack gap={0} mih="100dvh">
      <Group justify="space-between" px="lg" pt="md" pb={6}>
        {titleBlock}
        {viewToggle}
      </Group>
      {view === "plan" ? planEl : viewerEl}
      {controls}
    </Stack>
  );
}
