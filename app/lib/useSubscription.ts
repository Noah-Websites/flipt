"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "./supabase"
import { getPlan, type PlanTier } from "./storage"

// Feature definitions by plan
const PRO_FEATURES = new Set([
  "unlimited_scans", "full_price_comparison", "damage_detector", "authenticity_checker",
  "brand_identifier", "vintage_detector", "demand_meter", "live_prices",
  "price_history", "comparables", "best_time_to_sell", "closet",
  "marketplace_listing", "feed_posting", "watchlist", "follow_sellers",
  "hidden_gems", "share_listing", "pro_badge",
  "full_history", "sellometer",
])

const BUSINESS_FEATURES = new Set([
  "business_mode", "multi_account", "bulk_scan", "pdf_report",
  "cross_platform_manager", "performance_analytics", "health_scores",
  "cross_post", "market_report", "offer_manager", "room_scan",
])

export type Feature = string

export interface SubscriptionState {
  plan: PlanTier
  isLoading: boolean
  canAccess: (feature: Feature) => boolean
  requiredPlan: (feature: Feature) => "pro" | "business"
  scansRemaining: number
  scansUsed: number
  scanLimit: number
  resetDate: string | null
}

let cachedPlan: PlanTier | null = null
let cachedScans: { used: number; resetDate: string | null } | null = null

export function useSubscription(userId?: string): SubscriptionState {
  const [plan, setPlan] = useState<PlanTier>(cachedPlan || "free")
  const [isLoading, setIsLoading] = useState(!cachedPlan)
  const [scansUsed, setScansUsed] = useState(cachedScans?.used || 0)
  const [resetDate, setResetDate] = useState<string | null>(cachedScans?.resetDate || null)

  useEffect(() => {
    async function load() {
      if (cachedPlan) {
        setPlan(cachedPlan)
        setScansUsed(cachedScans?.used || 0)
        setResetDate(cachedScans?.resetDate || null)
        setIsLoading(false)
        return
      }

      // Try Supabase first
      if (userId) {
        try {
          const { data } = await supabase
            .from("profiles")
            .select("plan, monthly_scan_count, scan_reset_date")
            .eq("id", userId)
            .single()

          if (data) {
            const p = (data.plan || "free") as PlanTier
            cachedPlan = p
            cachedScans = { used: data.monthly_scan_count || 0, resetDate: data.scan_reset_date }
            setPlan(p)
            setScansUsed(data.monthly_scan_count || 0)
            setResetDate(data.scan_reset_date)
            setIsLoading(false)
            return
          }
        } catch {
          // Supabase not available, fall through
        }
      }

      // Fallback to localStorage
      const localPlan = getPlan()
      cachedPlan = localPlan
      const scanCount = parseInt(localStorage.getItem("flipt-scan-count") || "0", 10)
      cachedScans = { used: scanCount, resetDate: null }
      setPlan(localPlan)
      setScansUsed(scanCount)
      setIsLoading(false)
    }

    load()
  }, [userId])

  const scanLimit = plan === "free" ? 5 : Infinity
  const scansRemaining = Math.max(0, scanLimit - scansUsed)

  const canAccess = useCallback((feature: Feature): boolean => {
    if (plan === "business") return true
    if (plan === "pro") return !BUSINESS_FEATURES.has(feature)
    // Free plan
    return !PRO_FEATURES.has(feature) && !BUSINESS_FEATURES.has(feature)
  }, [plan])

  const requiredPlan = useCallback((feature: Feature): "pro" | "business" => {
    if (BUSINESS_FEATURES.has(feature)) return "business"
    return "pro"
  }, [])

  return { plan, isLoading, canAccess, requiredPlan, scansRemaining, scansUsed, scanLimit, resetDate }
}

// Clear cache when plan changes (e.g., after upgrade)
export function clearSubscriptionCache() {
  cachedPlan = null
  cachedScans = null
}
