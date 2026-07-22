"use client";

import {
  ActionIcon,
  Badge,
  Box,
  Group,
  Menu,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { ChevronDown, Pencil } from "lucide-react";
import dynamic from "next/dynamic";
import * as React from "react";
import { AdvancedPanel } from "@/app/AdvancedPanel";
import { useTrayWorker } from "@/app/builder/useTrayWorker";
import { CompartmentDock } from "@/app/CompartmentDock";
import { DesignNav } from "@/app/DesignNav";
import { ExportBar } from "@/app/ExportBar";
import { LidTypeMenu } from "@/app/LidTypeMenu";
import { DESIGNS, type DesignId } from "@/app/lib/designs";
import {
  defaultParams,
  defaultStructure,
  layoutCells,
  type Rect,
  type SplitNode,
  type TrayParams,
} from "@/app/lib/model";
import { defaultQuickDrawParams, type QuickDrawParams } from "@/app/lib/quick-draw";
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
import { defaultWyrmwoodParams, topRect, type WyrmwoodParams } from "@/app/lib/wyrmwood";
import { PlanView } from "@/app/PlanView";
import { QuickDrawPanel } from "@/app/QuickDrawPanel";
import { TraySettingsBand } from "@/app/TraySettingsBand";
import { ViewerBoundary } from "@/app/ViewerBoundary";
import { WyrmwoodPanel } from "@/app/WyrmwoodPanel";

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

// The two designs that lay out compartments. Quick Draw derives its pockets
// from the card size, so it has no tree and never appears here.
type StructuralDesign = "token-tray" | "wyrmwood";

function structuralDesign(design: DesignId): StructuralDesign {
  return design === "wyrmwood" ? "wyrmwood" : "token-tray";
}

// The tray's coupled domain state. `params`, `structure`, and `selectedId`
// move together on every structural edit, so they live in one reducer rather
// than three independent useState slices.
//
// Each structural design keeps its OWN tree and selection: the tray and the
// accessory have different footprints, so sharing one tree made an edit to one
// silently reshape the other. `design` lives here too, since every structural
// action needs to know which tree it is editing.
type TrayState = {
  params: TrayParams;
  design: DesignId;
  structures: Record<StructuralDesign, SplitNode>;
  selectedIds: Record<StructuralDesign, string | null>;
};

// Axis auto-grow reads the current tray-axis locks; since the reducer is pure
// it can't close over `flags`, so structural actions carry the lock snapshot.
type Locks = { w: boolean; l: boolean };

type TrayAction =
  | { type: "setDesign"; id: DesignId }
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
  // Every structural action edits the active design's tree in place.
  const key = structuralDesign(state.design);
  const structure = state.structures[key];
  const selectedId = state.selectedIds[key];

  const withTree = (tree: SplitNode, id: string | null, params = state.params): TrayState => ({
    ...state,
    params,
    structures: { ...state.structures, [key]: tree },
    selectedIds: { ...state.selectedIds, [key]: id },
  });

  // Axis auto-grow only makes sense for the token tray: the accessory's
  // footprint is driven by its own params, which this reducer doesn't own.
  const grow = (axis: "w" | "l", delta: number, locks: Locks) =>
    key === "token-tray" ? growAxis(state.params, axis, delta, locks) : state.params;

  switch (action.type) {
    case "setDesign":
      return { ...state, design: action.id };
    case "select":
      return withTree(structure, selectedId === action.id ? null : action.id);
    case "deselect":
      return withTree(structure, null);
    case "patchParams":
      return { ...state, params: { ...state.params, ...action.patch } };
    case "editStructure":
      return withTree(action.edit(structure), selectedId);
    case "split": {
      if (!selectedId) {
        return state;
      }

      const next = splitCell(structure, selectedId, action.dir);
      const node = findNode(next, selectedId);
      return withTree(
        next,
        node && node.children.length > 0 ? node.children[0].id : selectedId,
        grow(action.dir === "vertical" ? "w" : "l", AXIS_STEP, action.locks),
      );
    }
    case "addNeighbor": {
      if (!selectedId) {
        return state;
      }

      const { tree, newId } = addNeighbor(structure, selectedId, action.side);
      const axis = action.side === "left" || action.side === "right" ? "w" : "l";
      return withTree(tree, newId, grow(axis, AXIS_STEP, action.locks));
    }
    case "deleteSelected": {
      if (!selectedId) {
        return state;
      }

      const parent = findParent(structure, selectedId);
      const axis =
        parent?.splitType === "vertical" ? "w" : parent?.splitType === "horizontal" ? "l" : null;
      return withTree(
        removeCell(structure, selectedId),
        null,
        axis ? grow(axis, -AXIS_STEP, action.locks) : state.params,
      );
    }
    default:
      return state;
  }
}

type Layout = "mobile" | "tablet" | "desktop";

export function TrayApp() {
  const [units, setUnits] = React.useState<Units>("mm");
  const [view, setView] = React.useState<"plan" | "3d">("plan");
  const [editingName, setEditingName] = React.useState(false);

  // Mobile keeps the single-column card with a plan/3D toggle; tablet and
  // desktop show the plan and 3D previews side by side at once. Both queries
  // start false during SSR (the viewer is client-only anyway) and settle on mount.
  const tablet = useMediaQuery("(min-width: 768px)", false);
  const desktop = useMediaQuery("(min-width: 1080px)", false);
  const layout: Layout = desktop ? "desktop" : tablet ? "tablet" : "mobile";
  const wide = layout !== "mobile";

  const [state, dispatch] = React.useReducer(trayReducer, {
    params: defaultParams,
    design: "token-tray" as DesignId,
    structures: { "token-tray": defaultStructure(), wyrmwood: defaultStructure() },
    selectedIds: { "token-tray": null, wyrmwood: null },
  });
  const { params: parameters, design } = state;
  // The active design's tree and selection.
  const structure = state.structures[structuralDesign(design)];
  const selectedId = state.selectedIds[structuralDesign(design)];

  const [flags, toggleFlag] = React.useReducer(
    (s: Flags, key: keyof Flags) => ({ ...s, [key]: !s[key] }),
    defaultFlags,
  );
  const locks: Locks = { w: flags.lockW, l: flags.lockL };

  // The other two designs carry their own parameter objects. They're kept in
  // plain state beside the tray reducer rather than folded into it: only the
  // token tray has the coupled params/structure/selection edits the reducer
  // exists to coordinate.
  const [quickDraw, setQuickDraw] = React.useState<QuickDrawParams>(defaultQuickDrawParams);
  const [wyrmwood, setWyrmwood] = React.useState<WyrmwoodParams>(defaultWyrmwoodParams);

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

  // Quick Draw derives its pockets from the card size, so it has no tree; the
  // other two lay out compartments and share the split tree.
  const workerParams =
    design === "token-tray" ? effectiveParameters : design === "quick-draw" ? quickDraw : wyrmwood;
  const workerStructure = design === "quick-draw" ? null : structure;

  const { mesh, loading, error, exportModel } = useTrayWorker(
    design,
    workerParams,
    workerStructure,
  );

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
      a.download = `${(workerParams.modelName as string).trim() || design}.${fmt}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const effectiveDepth = parameters.depth - parameters.outerWallThickness;

  // Quick Draw has no editable compartment tree, so it shows the 3D view alone.
  const hasPlan = design !== "quick-draw";

  // The plan view speaks TrayParams. For the accessory that means its *top*
  // face, since that's the opening the compartments are laid out on.
  const planParams: TrayParams = React.useMemo(() => {
    if (design !== "wyrmwood") {
      return parameters;
    }

    const top = topRect(wyrmwood);
    return {
      ...parameters,
      width: top.w,
      height: top.h,
      depth: wyrmwood.thickness,
      outerWallThickness: wyrmwood.wallThickness,
      wallThickness: wyrmwood.wallThickness,
    };
  }, [design, parameters, wyrmwood]);

  const summary =
    design === "quick-draw"
      ? `${quickDraw.deckCount} deck${quickDraw.deckCount === 1 ? "" : "s"}`
      : `${count} bins · ${dispVal(planParams.width, units)}×${dispVal(planParams.height, units)}×${dispVal(
          design === "wyrmwood" ? wyrmwood.thickness : effectiveParameters.depth,
          units,
        )}`;

  // The model name lives in each design's own params. Editing it moves through
  // the same channel the rest of that design's params use.
  const setModelName = (name: string) => {
    if (design === "quick-draw") {
      setQuickDraw((p) => ({ ...p, modelName: name }));
    } else if (design === "wyrmwood") {
      setWyrmwood((p) => ({ ...p, modelName: name }));
    } else {
      dispatch({ type: "patchParams", patch: { modelName: name } });
    }
  };

  const modelName = (workerParams.modelName as string).trim() || DESIGNS[design].label;

  const titleBlock = (
    <Stack gap={2}>
      {editingName ? (
        <TextInput
          variant="unstyled"
          aria-label="Model name"
          autoFocus
          value={workerParams.modelName as string}
          placeholder={DESIGNS[design].label}
          onChange={(e) => {
            setModelName(e.currentTarget.value);
          }}
          onBlur={() => {
            setEditingName(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") {
              setEditingName(false);
            }
          }}
          styles={{
            input: {
              fontSize: "var(--mantine-h4-font-size)",
              fontWeight: 700,
              lineHeight: 1.2,
              height: "auto",
              minHeight: 0,
              color: "var(--mantine-color-black)",
            },
          }}
        />
      ) : (
        <Group gap={6} wrap="nowrap">
          <Title order={1} size="h4">
            {modelName}
          </Title>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            aria-label="Rename"
            onClick={() => {
              setEditingName(true);
            }}
          >
            <Pencil size={15} />
          </ActionIcon>
        </Group>
      )}
      <Group gap="xs">
        <Text fz="sm" c="dimmed">
          {summary}
        </Text>
        <Menu shadow="md" position="bottom-start" withArrow>
          <Menu.Target>
            <Badge
              variant="default"
              ff="monospace"
              rightSection={<ChevronDown size={12} />}
              style={{ cursor: "pointer" }}
              title="Units"
            >
              {units}
            </Badge>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              onClick={() => {
                setUnits("mm");
              }}
            >
              mm
            </Menu.Item>
            <Menu.Item
              onClick={() => {
                setUnits("inch");
              }}
            >
              inch
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Stack>
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
      params={planParams}
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

  // The 2D preview, with the lid-type menu docked at its top (token tray only —
  // the accessory has no lid). The plan itself still flex-grows to fill.
  const planSection = hasPlan ? (
    <Stack gap={0} h={wide ? "100%" : undefined} miw={0} mih={0}>
      {design === "token-tray" && (
        <Box px={wide ? 0 : "lg"} pt="xs" style={{ alignSelf: "flex-start" }}>
          <LidTypeMenu
            value={parameters.lidType}
            onChange={(patch) => {
              dispatch({ type: "patchParams", patch });
            }}
          />
        </Box>
      )}
      {planEl}
    </Stack>
  ) : null;

  const viewerEl = (
    <Box
      pos="relative"
      bg="sand.2"
      style={{ borderRadius: "var(--mantine-radius-md)", overflow: "hidden" }}
      h={wide ? "100%" : 252}
      mx={wide ? 0 : "lg"}
      mt={wide ? 0 : "md"}
    >
      <ViewerBoundary>
        <TrayViewer mesh={mesh} loading={loading} />
      </ViewerBoundary>
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

  const designNav = (
    <DesignNav
      design={design}
      onChange={(id) => {
        dispatch({ type: "setDesign", id });
      }}
    />
  );

  const controls = (
    <>
      {design === "token-tray" && (
        <>
          {settingsBand}
          {advancedPanel}
          {compartmentDock}
        </>
      )}
      {design === "quick-draw" && (
        <QuickDrawPanel
          params={quickDraw}
          units={units}
          onChange={(patch) => {
            setQuickDraw((p) => ({ ...p, ...patch }));
          }}
        />
      )}
      {design === "wyrmwood" && (
        <>
          <WyrmwoodPanel
            params={wyrmwood}
            units={units}
            onChange={(patch) => {
              setWyrmwood((p) => ({ ...p, ...patch }));
            }}
          />
          {compartmentDock}
        </>
      )}
      {exportBar}
    </>
  );

  // Desktop: the app fills the viewport — previews in a left column, controls
  // in a fixed right rail that scrolls independently.
  if (layout === "desktop") {
    return (
      <Stack h="100dvh" gap={0}>
        {designNav}
        <Group flex={1} mih={0} gap={0} align="stretch" wrap="nowrap">
          <Stack flex={1} miw={0} gap={0}>
            <Box px="lg" pt="md">
              {titleBlock}
            </Box>
            <SimpleGrid cols={hasPlan ? 2 : 1} spacing="md" flex={1} mih={0} px="lg" pb="md">
              {planSection}
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
      </Stack>
    );
  }

  // Tablet: previews side by side across the top, controls stacked below.
  if (layout === "tablet") {
    return (
      <Stack gap={0} mih="100dvh">
        {designNav}
        <Box px="lg" pt="md">
          {titleBlock}
        </Box>
        <SimpleGrid cols={hasPlan ? 2 : 1} spacing="md" h={340} px="lg" pb="sm">
          {planSection}
          {viewerEl}
        </SimpleGrid>
        {controls}
      </Stack>
    );
  }

  // Mobile: single column with a plan/3D toggle.
  return (
    <Stack gap={0} mih="100dvh">
      {designNav}
      <Group justify="space-between" px="lg" pt="md" pb={6}>
        {titleBlock}
        {hasPlan && viewToggle}
      </Group>
      {hasPlan && view === "plan" ? planSection : viewerEl}
      {controls}
    </Stack>
  );
}
