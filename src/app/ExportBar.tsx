"use client";

import { Box, ChevronUp, Package, Share2 } from "lucide-react";
import type * as React from "react";

export function ExportBar({
  fmt,
  exportOpen,
  exporting,
  onToggleExportOpen,
  onPickFmt,
  onExport,
}: {
  fmt: "stl" | "step";
  exportOpen: boolean;
  exporting: boolean;
  onToggleExportOpen: () => void;
  onPickFmt: (fmt: "stl" | "step") => void;
  onExport: () => void;
}) {
  return (
    <div
      style={{
        flex: "none",
        padding: "12px 20px 20px",
        display: "flex",
        gap: 10,
      }}
    >
      <div style={{ flex: 1, position: "relative" }}>
        {exportOpen && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 60,
              background: "#fffdf8",
              border: "1px solid #e7e1d6",
              borderRadius: 14,
              padding: 6,
              boxShadow: "0 12px 30px -8px rgba(28,26,23,.3)",
            }}
          >
            <button
              type="button"
              onClick={() => {
                onPickFmt("stl");
              }}
              className="export-fmt-btn"
              style={fmtBtnStyle}
            >
              <Box size={16} color="#8a8377" />
              STL{" "}
              <span style={{ font: "400 11px 'Instrument Sans'", color: "#a89e88" }}>
                — FDM printing
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                onPickFmt("step");
              }}
              className="export-fmt-btn"
              style={fmtBtnStyle}
            >
              <Package size={16} color="#8a8377" />
              STEP{" "}
              <span style={{ font: "400 11px 'Instrument Sans'", color: "#a89e88" }}>
                — CAD interchange
              </span>
            </button>
          </div>
        )}
        <div
          style={{
            display: "flex",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 6px 16px -4px rgba(194,96,58,.6)",
          }}
        >
          <button
            type="button"
            onClick={onExport}
            disabled={exporting}
            style={{
              flex: 1,
              padding: 15,
              border: "none",
              background: "#c2603a",
              color: "#fff",
              font: "700 15px 'Instrument Sans'",
              cursor: exporting ? "default" : "pointer",
              opacity: exporting ? 0.7 : 1,
            }}
          >
            {exporting ? "Exporting…" : `Export ${fmt.toUpperCase()}`}
          </button>
          <button
            type="button"
            onClick={onToggleExportOpen}
            title="Choose format"
            style={{
              width: 48,
              border: "none",
              borderLeft: "1px solid rgba(255,255,255,.25)",
              background: "#c2603a",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ChevronUp size={18} />
          </button>
        </div>
      </div>
      <button
        type="button"
        title="Share config link"
        style={{
          width: 54,
          borderRadius: 16,
          border: "1px solid #d8cfbf",
          background: "#fffdf8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <Share2 size={18} />
      </button>
    </div>
  );
}

const fmtBtnStyle: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  border: "none",
  background: "transparent",
  borderRadius: 10,
  padding: "11px 13px",
  font: "600 14px 'Instrument Sans'",
  color: "#1c1a17",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 9,
};
