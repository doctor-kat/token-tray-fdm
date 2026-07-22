import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from "@mantine/core";
import type { Metadata } from "next";
import { Instrument_Sans, Space_Mono } from "next/font/google";
import { theme } from "./theme";
import "./globals.css";

// Instrument Sans carries the prose UI: body, headings, and the uppercase
// control labels + units (which lean on letter-spacing, not a separate face).
const instrument = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-instrument",
});

// Space Mono is reserved for the editable numeric *values* in the parameter
// fields — the digits you dial in read as a monospace instrument readout,
// distinct from the sans labels around them.
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
    <html
      lang="en"
      {...mantineHtmlProps}
      className={`${instrument.variable} ${spaceMono.variable}`}
    >
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="light">
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
