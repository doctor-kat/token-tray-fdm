"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Boxes, Download, RotateCcw } from "lucide-react";

import {
  defaultParams,
  defaultStructure,
  type TrayParams,
  type SplitNode,
} from "@/lib/model";
import {
  splitCell,
  removeCell,
  setCustomization,
} from "@/lib/tree-ops";
import { useTrayWorker } from "@/hooks/use-tray-worker";
import { ParamSlider } from "@/components/param-slider";
import { SplitEditor } from "@/components/split-editor";
import {
  CellCustomization,
  findNode,
} from "@/components/cell-customization";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";

const TrayViewer = dynamic(
  () => import("@/components/tray-viewer").then((m) => m.TrayViewer),
  { ssr: false }
);

export function TrayApp() {
  const [params, setParams] = React.useState<TrayParams>(defaultParams);
  const [structure, setStructure] = React.useState<SplitNode>(
    defaultStructure
  );
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState<null | "stl" | "step">(
    null
  );

  const { mesh, loading, error, exportModel } = useTrayWorker(
    params,
    structure
  );

  const setParam = (key: keyof TrayParams) => (v: number) =>
    setParams((p) => ({ ...p, [key]: v }));

  const selectedCell = selectedId ? findNode(structure, selectedId) : null;
  const selectedIsLeaf = selectedCell && selectedCell.children.length === 0;

  const handleExport = async (format: "stl" | "step") => {
    setExporting(format);
    try {
      const blob = await exportModel(format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `token-tray.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-5 py-3">
        <div className="flex items-center gap-2">
          <Boxes className="size-5 text-primary" />
          <div>
            <h1 className="text-sm font-semibold leading-none">
              Token Tray <span className="text-muted-foreground">(FDM)</span>
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Parametric tray generator · replicad + shadcn
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setParams(defaultParams);
              setStructure(defaultStructure());
              setSelectedId(null);
            }}
          >
            <RotateCcw /> Reset
          </Button>
          <Button
            size="sm"
            disabled={exporting !== null}
            onClick={() => handleExport("stl")}
          >
            <Download /> {exporting === "stl" ? "Exporting…" : "STL"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={exporting !== null}
            onClick={() => handleExport("step")}
          >
            <Download /> {exporting === "step" ? "Exporting…" : "STEP"}
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[380px_1fr]">
        {/* Sidebar */}
        <aside className="min-h-0 overflow-y-auto border-r p-4">
          <Tabs defaultValue="layout" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="layout">Layout</TabsTrigger>
              <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
            </TabsList>

            <TabsContent value="layout" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Compartments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SplitEditor
                    structure={structure}
                    params={params}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onSplit={(id, dir) => {
                      setStructure((s) => splitCell(s, id, dir));
                      setSelectedId(null);
                    }}
                    onRemove={(id) => {
                      setStructure((s) => removeCell(s, id));
                      setSelectedId(null);
                    }}
                  />
                  {selectedIsLeaf && selectedCell && (
                    <CellCustomization
                      cell={selectedCell}
                      params={params}
                      onChange={(patch) =>
                        setStructure((s) =>
                          setCustomization(s, selectedCell.id, patch)
                        )
                      }
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dimensions" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Outer size</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ParamSlider
                    label="Width (X)"
                    value={params.width}
                    min={40}
                    max={300}
                    step={1}
                    onChange={setParam("width")}
                  />
                  <ParamSlider
                    label="Height (Y)"
                    value={params.height}
                    min={40}
                    max={300}
                    step={1}
                    onChange={setParam("height")}
                  />
                  <ParamSlider
                    label="Depth (Z)"
                    value={params.depth}
                    min={8}
                    max={80}
                    step={1}
                    onChange={setParam("depth")}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Walls & fillets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ParamSlider
                    label="Outer wall thickness"
                    value={params.outerWallThickness}
                    min={0.8}
                    max={5}
                    step={0.1}
                    onChange={setParam("outerWallThickness")}
                  />
                  <ParamSlider
                    label="Separator wall thickness"
                    value={params.wallThickness}
                    min={0.4}
                    max={4}
                    step={0.1}
                    onChange={setParam("wallThickness")}
                  />
                  <ParamSlider
                    label="Side fillet"
                    value={params.sideFillet}
                    min={0}
                    max={20}
                    step={0.5}
                    onChange={setParam("sideFillet")}
                  />
                  <ParamSlider
                    label="Bottom fillet (scoop)"
                    value={params.bottomFillet}
                    min={0}
                    max={20}
                    step={0.5}
                    onChange={setParam("bottomFillet")}
                  />
                  <ParamSlider
                    label="Rim fillet"
                    value={params.rimFillet}
                    min={0}
                    max={2}
                    step={0.1}
                    onChange={setParam("rimFillet")}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </aside>

        {/* Viewport */}
        <main className="relative min-h-[55vh] bg-gradient-to-b from-muted/30 to-muted/60 lg:min-h-0">
          <TrayViewer mesh={mesh} loading={loading} />
          {error && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground shadow">
              {error}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
