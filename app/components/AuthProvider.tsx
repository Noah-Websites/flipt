"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { supabase } from "../lib/supabase"
import type { User, Session } from "@supabase/supabase-js"
import { updateProfile } from "../lib/storage"

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  isGuest: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  loading: true,
  isGuest: true,
  signOut: async () => {},
  refreshUser: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const syncProfile = useCallback((u: User | null) => {
    if (u) {
      const meta = u.user_metadata || {}
      updateProfile({
        name: meta.full_name || meta.name || "",
        email: u.email || "",
        joinedAt: u.created_at || new Date().toISOString(),
      })
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      syncProfile(s?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      syncProfile(s?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [syncProfile])

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)
    syncProfile(u)
  }, [syncProfile])

  return (
    <AuthContext value={{
      user,
      session,
      loading,
      isGuest: !user,
      signOut: handleSignOut,
      refreshUser,
    }}>
      {children}
    </AuthContext>
  )
}
