import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Safe Supabase query wrapper.
 * Returns { data, error } — never throws.
 * Handles ad-blocker blocked requests gracefully.
 */
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: { message: string } | null }>
): Promise<{ data: T | null; error: string | null; blocked: boolean }> {
  try {
    const { data, error } = await queryFn()
    if (error) return { data: null, error: error.message, blocked: false }
    return { data, error: null, blocked: false }
  } catch (err) {
    // Detect ad-blocker blocking Supabase
    if (err instanceof TypeError && (
      err.message.includes("Failed to fetch") ||
      err.message.includes("Load failed") ||
      err.message.includes("NetworkError")
    )) {
      return { data: null, error: "Connection blocked — try disabling your ad blocker for this site.", blocked: true }
    }
    return { data: null, error: err instanceof Error ? err.message : "Unknown error", blocked: false }
  }
}
