// Safe fetch wrapper that detects ad-blocker interference
// and provides graceful fallbacks

export class BlockedError extends Error {
  constructor() {
    super("Request may have been blocked by an ad blocker or browser shield.")
    this.name = "BlockedError"
  }
}

/**
 * Fetch wrapper that detects when requests are blocked by ad blockers
 * and provides a clear error message instead of a cryptic failure.
 */
export async function fetchSafe(url: string, options?: RequestInit): Promise<Response> {
  try {
    const res = await fetch(url, options)
    return res
  } catch (err) {
    // Network errors from ad blockers typically throw TypeError with specific messages
    if (err instanceof TypeError) {
      const msg = err.message.toLowerCase()
      if (
        msg.includes("failed to fetch") ||
        msg.includes("networkerror") ||
        msg.includes("network request failed") ||
        msg.includes("load failed") ||
        msg.includes("cancelled")
      ) {
        throw new BlockedError()
      }
    }
    throw err
  }
}

/**
 * Check if Supabase is reachable. Some aggressive ad blockers
 * block *.supabase.co domains entirely.
 */
export async function isSupabaseReachable(): Promise<boolean> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url) return false
    const res = await fetch(`${url}/rest/v1/`, {
      method: "HEAD",
      headers: { "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "" },
    })
    return res.ok || res.status === 400 // 400 means reachable but no table specified
  } catch {
    return false
  }
}

/**
 * Generate a user-friendly message for blocked requests
 */
export function getBlockedMessage(): string {
  return "Some features may not work with ad blockers enabled. Please whitelist this site for the best experience."
}
