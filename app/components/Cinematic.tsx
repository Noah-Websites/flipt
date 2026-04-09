"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"

/* ===== PRICE FLIP — Airport departure board style ===== */
export function PriceFlip({ value, prefix = "$", duration = 1.2 }: { value: number; prefix?: string; duration?: number }) {
  const [display, setDisplay] = useState("0")
  const [cycling, setCycling] = useState(true)
  const target = String(Math.round(value))

  useEffect(() => {
    setCycling(true)
    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / (duration * 1000), 1)
      if (progress >= 1) {
        setDisplay(target)
        setCycling(false)
        clearInterval(interval)
        return
      }
      // Show partially resolved digits left to right
      const resolved = Math.floor(progress * target.length)
      let s = ""
      for (let i = 0; i < target.length; i++) {
        if (i < resolved) s += target[i]
        else s += String(Math.floor(Math.random() * 10))
      }
      setDisplay(s)
    }, 50)
    return () => clearInterval(interval)
  }, [value, target, duration])

  return (
    <span style={{ fontVariantNumeric: "tabular-nums", willChange: "transform" }}>
      {prefix}{display}
    </span>
  )
}

/* ===== TYPEWRITER — Character by character with gold flash ===== */
export function TypeWriter({ text, speed = 40, className, style }: { text: string; speed?: number; className?: string; style?: React.CSSProperties }) {
  const [displayed, setDisplayed] = useState("")
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    setDisplayed("")
    setShowCursor(true)
    let i = 0
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1))
        i++
      } else {
        clearInterval(interval)
        setTimeout(() => setShowCursor(false), 500)
      }
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed])

  return (
    <span className={className} style={style}>
      {displayed}
      {showCursor && <span style={{ color: "var(--gold)", animation: "typeCursor 0.8s step-end infinite" }}>|</span>}
    </span>
  )
}

/* ===== SCROLL FADE IN — Intersection Observer powered ===== */
export function ScrollFadeIn({ children, delay = 0, direction = "up", className }: {
  children: React.ReactNode; delay?: number; direction?: "up" | "right" | "left"; className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  const initial = direction === "up" ? { y: 20 } : direction === "right" ? { x: 40 } : { x: -40 }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, ...initial }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  )
}

/* ===== STAGGER CHILDREN — Cascading entrance ===== */
export function StaggerIn({ children, stagger = 0.06, className, style }: {
  children: React.ReactNode; stagger?: number; className?: string; style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-30px" })

  return (
    <motion.div ref={ref} className={className} style={style}>
      {Array.isArray(children) ? children.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 40 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.4, delay: i * stagger, ease: "easeOut" }}
          style={{ willChange: "transform, opacity" }}
        >
          {child}
        </motion.div>
      )) : children}
    </motion.div>
  )
}

/* ===== PARTICLE BURST — Gold particles on action ===== */
export function ParticleBurst({ trigger, x = 0, y = 0 }: { trigger: boolean; x?: number; y?: number }) {
  if (!trigger) return null
  return (
    <div style={{ position: "absolute", left: x, top: y, pointerEvents: "none", zIndex: 10 }}>
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2
        const dist = 20 + Math.random() * 20
        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, opacity: 0.8, scale: 1 }}
            animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ position: "absolute", width: "4px", height: "4px", borderRadius: "50%", background: "var(--gold)", willChange: "transform, opacity" }}
          />
        )
      })}
    </div>
  )
}

/* ===== COUNT UP — Animated number counter ===== */
export function AnimatedCounter({ value, duration = 1, prefix = "", suffix = "" }: {
  value: number; duration?: number; prefix?: string; suffix?: string
}) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    const start = Date.now()
    const tick = () => {
      const elapsed = (Date.now() - start) / 1000
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplay(Math.round(eased * value))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [isInView, value, duration])

  return <span ref={ref}>{prefix}{display.toLocaleString()}{suffix}</span>
}
