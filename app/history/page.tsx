"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HistoryRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace("/profile?tab=history") }, [router])
  return <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><span className="spinner" /></main>
}
