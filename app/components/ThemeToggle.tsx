"use client"

import { Sun, Moon } from "lucide-react"
import { useTheme } from "./ThemeProvider"

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button onClick={toggle} aria-label="Toggle theme" className="theme-toggle">
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
