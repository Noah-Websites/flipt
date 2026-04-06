"use client"

import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion"
import { type ReactNode, useRef, useEffect, useState } from "react"

// Respect reduced motion
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => { setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches) }, [])
  return reduced
}

// Page fade in
export function PageTransition({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion()
  if (reduced) return <>{children}</>
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, ease: "easeOut" }}>
      {children}
    </motion.div>
  )
}

// Fade up on scroll (uses intersection observer)
export function FadeUp({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-50px" })
  const reduced = usePrefersReducedMotion()

  return (
    <motion.div
      ref={ref}
      initial={reduced ? {} : { opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  )
}

// Stagger container
export function StaggerContainer({ children, stagger = 0.08 }: { children: ReactNode; stagger?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-30px" })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  )
}

// Stagger child
export function StaggerItem({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
      }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  )
}

// Slide in from side
export function SlideIn({ children, direction = "right", delay = 0 }: { children: ReactNode; direction?: "left" | "right"; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-50px" })
  const x = direction === "right" ? 40 : -40

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  )
}

// Scale in
export function ScaleIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  )
}

// Counting number animation
export function CountUp({ value, prefix = "", suffix = "", duration = 2 }: { value: number; prefix?: string; suffix?: string; duration?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const motionVal = useMotionValue(0)
  const rounded = useTransform(motionVal, (v: number) => {
    if (value >= 1000) return `${prefix}${Math.round(v).toLocaleString()}${suffix}`
    if (value % 1 !== 0) return `${prefix}${v.toFixed(2)}${suffix}`
    return `${prefix}${Math.round(v)}${suffix}`
  })

  useEffect(() => {
    if (inView) {
      const controls = animate(motionVal, value, { duration, ease: [0.25, 0.1, 0.25, 1] })
      return () => controls.stop()
    }
  }, [inView, value, motionVal, duration])

  return <motion.span ref={ref}>{rounded}</motion.span>
}

// Word-by-word reveal
export function WordReveal({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const words = text.split(" ")

  return (
    <span ref={ref} className={className} style={style}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: i * 0.1, duration: 0.4, ease: "easeOut" }}
          style={{ display: "inline-block", marginRight: "0.3em", willChange: "transform, opacity" }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}

// Typewriter effect
export function Typewriter({ text, speed = 50 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("")
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let i = 0
    const interval = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, i + 1)); i++ }
      else clearInterval(interval)
    }, speed)
    return () => clearInterval(interval)
  }, [inView, text, speed])

  return <span ref={ref}>{displayed}<span style={{ opacity: displayed.length < text.length ? 1 : 0, transition: "opacity 0.3s" }}>|</span></span>
}

// Parallax wrapper
export function Parallax({ children, speed = 0.5 }: { children: ReactNode; speed?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [y, setY] = useState(0)

  useEffect(() => {
    function onScroll() {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const center = rect.top + rect.height / 2 - window.innerHeight / 2
      setY(center * speed * -0.1)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [speed])

  return (
    <div ref={ref} style={{ transform: `translateY(${y}px)`, willChange: "transform" }}>
      {children}
    </div>
  )
}
