"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function NotificationsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/settings#notifications")
  }, [router])

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span className="spinner" />
    </main>
  )
}
