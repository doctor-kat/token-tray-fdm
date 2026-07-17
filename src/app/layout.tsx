import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Token Tray (FDM)",
  description:
    "Parametric FDM-friendly token tray generator — a Next.js + shadcn rebuild of deckinabox's token-tray-fdm, powered by replicad.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply the saved / system theme before paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
