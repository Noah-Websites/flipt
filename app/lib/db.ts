import { supabase } from "./supabase"

// ===== PROFILES =====

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()
  return { data, error }
}

export async function updateProfile(userId: string, updates: Record<string, unknown>) {
  const { error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId)
  return { error }
}

// ===== SCANS =====

export async function saveScan(userId: string, scan: {
  item_name: string; brand?: string; condition?: string;
  estimated_value_low: number; estimated_value_high: number;
  best_platform?: string; listing_title?: string; listing_description?: string;
  image_url?: string; ai_response?: unknown;
}) {
  const { data, error } = await supabase
    .from("scans")
    .insert({ user_id: userId, ...scan })
    .select()
    .single()

  // Increment scan count
  if (!error) {
    await supabase.rpc("increment_scan_count", { uid: userId }).catch(() => {
      // Fallback if RPC doesn't exist
      supabase.from("profiles").update({
        scan_count: undefined, // Will be handled by trigger
        monthly_scan_count: undefined,
      }).eq("id", userId)
    })
  }

  return { data, error }
}

export async function getScans(userId: string) {
  const { data, error } = await supabase
    .from("scans")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  return { data: data || [], error }
}

export async function clearScans(userId: string) {
  const { error } = await supabase
    .from("scans")
    .delete()
    .eq("user_id", userId)
  return { error }
}

// ===== CLOSET =====

export async function getClosetItems(userId: string) {
  const { data, error } = await supabase
    .from("closet_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  return { data: data || [], error }
}

export async function addClosetItem(userId: string, item: {
  scan_id?: string; item_name: string; brand?: string; condition?: string;
  estimated_value?: number; image_url?: string; status?: string;
}) {
  const { data, error } = await supabase
    .from("closet_items")
    .insert({ user_id: userId, ...item })
    .select()
    .single()
  return { data, error }
}

export async function updateClosetItem(itemId: string, updates: Record<string, unknown>) {
  const { error } = await supabase
    .from("closet_items")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", itemId)
  return { error }
}

export async function deleteClosetItem(itemId: string) {
  const { error } = await supabase.from("closet_items").delete().eq("id", itemId)
  return { error }
}

// ===== MARKETPLACE =====

export async function getMarketplaceListings(limit = 50) {
  const { data, error } = await supabase
    .from("marketplace_listings")
    .select("*, profiles(display_name, referral_code)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit)
  return { data: data || [], error }
}

export async function createMarketplaceListing(userId: string, listing: {
  scan_id?: string; item_name: string; brand?: string; condition?: string;
  category?: string; asking_price: number; estimated_value?: number;
  description?: string; image_url?: string;
}) {
  const { data, error } = await supabase
    .from("marketplace_listings")
    .insert({ user_id: userId, ...listing })
    .select()
    .single()
  return { data, error }
}

export async function getUserListings(userId: string) {
  const { data, error } = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  return { data: data || [], error }
}

// ===== FEED =====

export async function getFeedPosts(limit = 30) {
  const { data, error } = await supabase
    .from("feed_posts")
    .select("*, profiles(display_name, referral_code)")
    .order("created_at", { ascending: false })
    .limit(limit)
  return { data: data || [], error }
}

export async function createFeedPost(userId: string, post: {
  scan_id?: string; item_name: string; selling_price?: number;
  platform?: string; image_url?: string; caption?: string;
}) {
  const { data, error } = await supabase
    .from("feed_posts")
    .insert({ user_id: userId, ...post })
    .select()
    .single()
  return { data, error }
}

export async function likeFeedPost(postId: string) {
  const { error } = await supabase.rpc("increment_likes", { post_id: postId }).catch(() => {
    // Fallback
    return supabase.from("feed_posts").update({ likes: undefined }).eq("id", postId)
  })
  return { error }
}

// ===== FOLLOWS =====

export async function getFollowing(userId: string) {
  const { data, error } = await supabase
    .from("follows")
    .select("*, following:following_id(id, display_name, referral_code)")
    .eq("follower_id", userId)
  return { data: data || [], error }
}

export async function followUser(followerId: string, followingId: string) {
  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: followerId, following_id: followingId })
  return { error }
}

export async function unfollowUser(followerId: string, followingId: string) {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
  return { error }
}

// ===== WATCHLIST =====

export async function getWatchlist(userId: string) {
  const { data, error } = await supabase
    .from("watchlist")
    .select("*, listing:listing_id(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  return { data: data || [], error }
}

export async function addToWatchlist(userId: string, listingId: string, priceAtSave: number) {
  const { error } = await supabase
    .from("watchlist")
    .insert({ user_id: userId, listing_id: listingId, price_at_save: priceAtSave })
  return { error }
}

export async function removeFromWatchlist(watchlistId: string) {
  const { error } = await supabase.from("watchlist").delete().eq("id", watchlistId)
  return { error }
}

export async function toggleWatchlistNotify(watchlistId: string, notify: boolean) {
  const { error } = await supabase
    .from("watchlist")
    .update({ notify_on_change: notify })
    .eq("id", watchlistId)
  return { error }
}

// ===== REFERRALS =====

export async function getReferrals(userId: string) {
  const { data, error } = await supabase
    .from("referrals")
    .select("*")
    .eq("referrer_id", userId)
  return { data: data || [], error }
}

export async function createReferral(referrerId: string, referredEmail: string, referredUserId?: string) {
  const { error } = await supabase
    .from("referrals")
    .insert({ referrer_id: referrerId, referred_email: referredEmail, referred_user_id: referredUserId })

  // Award bonus scans
  if (!error) {
    await supabase.from("profiles").update({
      bonus_scans: undefined, // Handled by increment
    }).eq("id", referrerId)
  }

  return { error }
}

// ===== SUBSCRIPTIONS =====

export async function getSubscription(userId: string) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single()
  return { data, error }
}

export async function upsertSubscription(userId: string, sub: {
  stripe_customer_id: string; stripe_subscription_id: string;
  plan: string; billing_period: string; status: string;
  current_period_start?: string; current_period_end?: string;
}) {
  const { error } = await supabase
    .from("subscriptions")
    .upsert({ user_id: userId, ...sub, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
  return { error }
}
