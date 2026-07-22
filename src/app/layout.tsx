import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from "@mantine/core";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans, Space_Mono } from "next/font/google";
import { theme } from "./theme";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-bricolage",
});
const instrument = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-instrument",
});
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
      className={`${bricolage.variable} ${instrument.variable} ${spaceMono.variable}`}
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
