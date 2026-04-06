"use client"

import { useEffect, useRef, useState } from "react"
import Lenis from "lenis"

export default function SmoothScroll() {
  const [progress, setProgress] = useState(0)
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    // Respect reduced motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    })
    lenisRef.current = lenis

    function onScroll() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? scrollTop / docHeight : 0)
    }

    function raf(time: number) {
      lenis.raf(time)
      onScroll()
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    return () => { lenis.destroy() }
  }, [])

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, height: "3px", zIndex: 9999,
      pointerEvents: "none",
    }}>
      <div style={{
        height: "100%", background: "var(--green-accent)",
        width: `${progress * 100}%`,
        transition: "width 0.1s linear",
        willChange: "width",
      }} />
    </div>
  )
}
