"use client"

import { useState, useRef, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Home, ScanLine, ShoppingBag, Rss, MoreHorizontal, Clock, Archive, Bookmark, Users, Gift, BarChart3, Briefcase, Gem, LayoutGrid, Settings, Bell, User, Search } from "lucide-react"
import { getWatchlistCount, getPlan } from "../lib/storage"

const NAV_ITEMS = [
  { label: "Home", path: "/", Icon: Home },
  { label: "Scan", path: "/scan", Icon: ScanLine },
  { label: "Market", path: "/marketplace", Icon: ShoppingBag },
  { label: "Feed", path: "/feed", Icon: Rss },
]

const MORE_ITEMS: { label: string; path: string; Icon: typeof Home; badge?: boolean; planBadge?: "pro" | "business" }[] = [
  { label: "Profile", path: "/profile", Icon: User },
  { label: "History", path: "/history", Icon: Clock },
  { label: "My Closet", path: "/closet", Icon: Archive },
  { label: "Watchlist", path: "/watchlist", Icon: Bookmark, badge: true },
  { label: "Search", path: "/search", Icon: Search },
  { label: "Following", path: "/following", Icon: Users },
  { label: "Notifications", path: "/notifications", Icon: Bell },
  { label: "Referrals", path: "/referral", Icon: Gift },
  { label: "Market Report", path: "/market", Icon: BarChart3, planBadge: "business" },
  { label: "Business", path: "/business", Icon: Briefcase, planBadge: "business" },
  { label: "Hidden Gems", path: "/gems", Icon: Gem },
  { label: "Accounts", path: "/accounts", Icon: LayoutGrid },
  { label: "Settings", path: "/settings", Icon: Settings },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [showMore, setShowMore] = useState(false)
  const [watchCount, setWatchCount] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  const isMoreActive = MORE_ITEMS.some(m => pathname === m.path)

  useEffect(() => { setWatchCount(getWatchlistCount()) }, [pathname])

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
        <div ref={menuRef} className="more-menu" style={{ maxHeight: "400px", overflowY: "auto" }}>
          {MORE_ITEMS.map(({ label, path, Icon, badge, planBadge }) => (
            <button key={path} onClick={() => { router.push(path); setShowMore(false) }} className="more-menu-item">
              <span style={{ position: "relative", display: "flex" }}>
                <Icon size={18} />
                {badge && watchCount > 0 && <span className="nav-badge" style={{ top: "-4px", right: "-6px", position: "absolute" }}>{watchCount}</span>}
              </span>
              {label}
              {planBadge === "business" && (
                <span style={{ marginLeft: "auto", padding: "1px 6px", fontSize: "9px", fontWeight: 700, borderRadius: "50px", background: "rgba(201,168,76,0.12)", color: "#c9a84c", textTransform: "uppercase", letterSpacing: "0.04em" }}>Business</span>
              )}
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
          {watchCount > 0 && <span className="nav-badge">{watchCount > 9 ? "9+" : watchCount}</span>}
          <span>More</span>
        </button>
      </nav>
    </>
  )
}
