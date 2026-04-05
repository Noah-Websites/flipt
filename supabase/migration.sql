-- Flipt Database Schema
-- Run this in your Supabase SQL Editor

-- 1. Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  currency TEXT DEFAULT 'CAD',
  plan TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  scan_count INTEGER DEFAULT 0,
  monthly_scan_count INTEGER DEFAULT 0,
  scan_reset_date TIMESTAMP DEFAULT NOW(),
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  bonus_scans INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Scans
CREATE TABLE IF NOT EXISTS scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  item_name TEXT,
  brand TEXT,
  condition TEXT,
  estimated_value_low DECIMAL,
  estimated_value_high DECIMAL,
  currency TEXT DEFAULT 'CAD',
  best_platform TEXT,
  listing_title TEXT,
  listing_description TEXT,
  image_url TEXT,
  ai_response JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Closet Items
CREATE TABLE IF NOT EXISTS closet_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  scan_id UUID REFERENCES scans(id),
  item_name TEXT,
  brand TEXT,
  condition TEXT,
  estimated_value DECIMAL,
  currency TEXT DEFAULT 'CAD',
  status TEXT DEFAULT 'storing',
  asking_price DECIMAL,
  sold_price DECIMAL,
  sold_at TIMESTAMP,
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Marketplace Listings
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  scan_id UUID REFERENCES scans(id),
  item_name TEXT NOT NULL,
  brand TEXT,
  condition TEXT,
  category TEXT,
  asking_price DECIMAL NOT NULL,
  currency TEXT DEFAULT 'CAD',
  estimated_value DECIMAL,
  description TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'active',
  views INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Feed Posts
CREATE TABLE IF NOT EXISTS feed_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  scan_id UUID REFERENCES scans(id),
  item_name TEXT,
  selling_price DECIMAL,
  platform TEXT,
  image_url TEXT,
  caption TEXT,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Follows
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id),
  following_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- 7. Watchlist
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  listing_id UUID REFERENCES marketplace_listings(id),
  price_at_save DECIMAL,
  notify_on_change BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Referrals
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id),
  referred_email TEXT,
  referred_user_id UUID REFERENCES profiles(id),
  bonus_scans_awarded INTEGER DEFAULT 3,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT,
  billing_period TEXT,
  status TEXT,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 10. Agent Proposals
CREATE TABLE IF NOT EXISTS agent_proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name TEXT,
  proposal_type TEXT,
  title TEXT,
  description TEXT,
  impact_rating TEXT,
  complexity TEXT,
  status TEXT DEFAULT 'pending',
  content JSONB,
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 11. Agent Activity
CREATE TABLE IF NOT EXISTS agent_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name TEXT,
  action TEXT,
  details TEXT,
  status TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ===== ROW LEVEL SECURITY =====

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Scans
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own scans" ON scans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scans" ON scans FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Closet
ALTER TABLE closet_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own closet" ON closet_items FOR ALL USING (auth.uid() = user_id);

-- Marketplace
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active listings" ON marketplace_listings FOR SELECT USING (status = 'active');
CREATE POLICY "Users can manage own listings" ON marketplace_listings FOR ALL USING (auth.uid() = user_id);

-- Feed
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view feed" ON feed_posts FOR SELECT USING (true);
CREATE POLICY "Users can insert own posts" ON feed_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Follows
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own follows" ON follows FOR ALL USING (auth.uid() = follower_id);
CREATE POLICY "Anyone can view follows" ON follows FOR SELECT USING (true);

-- Watchlist
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own watchlist" ON watchlist FOR ALL USING (auth.uid() = user_id);

-- Referrals (read-only for users)
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id);

-- Subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Agent tables (no RLS - internal only)

-- ===== AUTO-CREATE PROFILE ON SIGNUP =====

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, referral_code)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    upper(substring(md5(random()::text) from 1 for 8))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
