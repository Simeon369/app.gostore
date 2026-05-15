"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="p-2 hover:bg-white/5 dark:hover:bg-white/5 rounded-xl transition-all flex items-center justify-center relative w-10 h-10"
      aria-label="Toggle theme"
    >
      <Sun className="w-5 h-5 absolute transition-all scale-100 rotate-0 dark:-rotate-90 dark:scale-0 text-zinc-600 dark:text-zinc-400" />
      <Moon className="w-5 h-5 absolute transition-all scale-0 rotate-90 dark:rotate-0 dark:scale-100 text-zinc-400" />
    </button>
  );
}
