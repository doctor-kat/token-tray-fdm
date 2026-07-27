import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from "@mantine/core";
import type { Metadata } from "next";
import { Fira_Sans, Space_Mono } from "next/font/google";
import { cssVariablesResolver, theme } from "./theme";
import "./globals.css";

// Fira Sans carries the prose UI: body, headings, and the small sans labels.
// It is the design's `headlineFont` and `bodyFont`.
const fira = Fira_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fira",
});

// Space Mono is the design's `labelFont`: section rules, the nav, and every
// dimension readout. The digits you dial in read as a monospace instrument
// readout, distinct from the sans labels around them.
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "Token Tray (FDM)",
  description:
    "Parametric FDM-friendly token tray generator — a Next.js + Mantine rebuild of deckinabox's token-tray-fdm, powered by replicad.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps} className={`${fira.variable} ${spaceMono.variable}`}>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body>
        <MantineProvider
          theme={theme}
          cssVariablesResolver={cssVariablesResolver}
          defaultColorScheme="light"
        >
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
