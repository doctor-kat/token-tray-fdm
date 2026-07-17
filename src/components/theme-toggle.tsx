"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem("theme", theme);
  } catch {
    /* ignore */
  }
}

// Minimal theme toggle: reads the class set by the pre-hydration script, then
// flips it (and persists) on click. No dependency on next-themes.
export function ThemeToggle() {
  const [theme, setTheme] = React.useState<Theme>("light");

  React.useEffect(() => {
    setTheme(
      document.documentElement.classList.contains("dark") ? "dark" : "light"
    );
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    apply(next);
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggle}
      aria-label="Toggle theme"
      title="Toggle light / dark"
    >
      <Sun className="hidden dark:block" />
      <Moon className="block dark:hidden" />
    </Button>
  );
}
