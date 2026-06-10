"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2 hover:bg-muted rounded-xl transition-all flex items-center justify-center relative w-10 h-10"
      aria-label="Toggle theme"
    >
      <Sun
        className={`w-5 h-5 absolute transition-all text-muted-foreground ${
          isDark ? "scale-0 rotate-90" : "scale-100 rotate-0"
        }`}
      />
      <Moon
        className={`w-5 h-5 absolute transition-all text-muted-foreground ${
          isDark ? "scale-100 rotate-0" : "scale-0 -rotate-90"
        }`}
      />
    </button>
  );
}
