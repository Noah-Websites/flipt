"use client"

import { useState, useRef, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Home, ScanLine, ShoppingBag, Rss, MoreHorizontal, Archive, Settings, User, Search, Calendar, Briefcase } from "lucide-react"

const NAV_ITEMS = [
  { label: "Home", path: "/", Icon: Home },
  { label: "Scan", path: "/scan", Icon: ScanLine },
  { label: "Market", path: "/marketplace", Icon: ShoppingBag },
  { label: "Feed", path: "/feed", Icon: Rss },
]

const MORE_ITEMS = [
  { label: "Search", path: "/search", Icon: Search },
  { label: "Settings", path: "/settings", Icon: Settings },
  { label: "Profile", path: "/profile", Icon: User },
  { label: "My Closet", path: "/closet", Icon: Archive },
  { label: "Sell-O-Meter", path: "/sellometer", Icon: Calendar },
  { label: "Business Tools", path: "/business-tools", Icon: Briefcase },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [showMore, setShowMore] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isMoreActive = MORE_ITEMS.some(m => pathname === m.path)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMore(false)
    }
    if (showMore) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showMore])

  return (
    <>
      {showMore && (
        <div ref={menuRef} className="more-menu">
          {MORE_ITEMS.map(({ label, path, Icon }) => (
            <button key={path} onClick={() => { router.push(path); setShowMore(false) }} className="more-menu-item">
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      )}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ label, path, Icon }) => {
          const active = pathname === path
          return (
            <button key={path} onClick={() => router.push(path)} className={`bottom-nav-item ${active ? "active" : ""}`}>
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
            </button>
          )
        })}
        <button onClick={() => setShowMore(!showMore)} className={`bottom-nav-item ${isMoreActive || showMore ? "active" : ""}`} style={{ position: "relative" }}>
          <MoreHorizontal size={22} strokeWidth={isMoreActive ? 2.5 : 2} />
          <span>More</span>
        </button>
      </nav>
    </>
  )
}
