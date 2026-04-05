// Types
export interface ScanHistoryItem {
  id: string
  item: string
  valueLow: number
  valueHigh: number
  platform: string
  title: string
  description: string
  imageUrl: string | null
  scannedAt: string // ISO date
}

export type ClosetStatus = "Storing" | "Listed" | "Sold" | "Donated"

export interface ClosetItem {
  id: string
  scanId: string
  item: string
  valueLow: number
  valueHigh: number
  platform: string
  title: string
  description: string
  imageUrl: string | null
  condition: string
  status: ClosetStatus
  soldPrice: number | null
  addedAt: string
}

// Keys
const HISTORY_KEY = "flipt-history"
const CLOSET_KEY = "flipt-closet"

// History
export function getHistory(): ScanHistoryItem[] {
  if (typeof window === "undefined") return []
  const raw = localStorage.getItem(HISTORY_KEY)
  return raw ? JSON.parse(raw) : []
}

export function addToHistory(item: Omit<ScanHistoryItem, "id" | "scannedAt">): ScanHistoryItem {
  const history = getHistory()
  const entry: ScanHistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    scannedAt: new Date().toISOString(),
  }
  history.unshift(entry)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  return entry
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY)
}

// Closet
export function getCloset(): ClosetItem[] {
  if (typeof window === "undefined") return []
  const raw = localStorage.getItem(CLOSET_KEY)
  return raw ? JSON.parse(raw) : []
}

export function addToCloset(scan: ScanHistoryItem): ClosetItem {
  const closet = getCloset()
  const entry: ClosetItem = {
    id: crypto.randomUUID(),
    scanId: scan.id,
    item: scan.item,
    valueLow: scan.valueLow,
    valueHigh: scan.valueHigh,
    platform: scan.platform,
    title: scan.title,
    description: scan.description,
    imageUrl: scan.imageUrl,
    condition: "Good",
    status: "Storing",
    soldPrice: null,
    addedAt: new Date().toISOString(),
  }
  closet.unshift(entry)
  localStorage.setItem(CLOSET_KEY, JSON.stringify(closet))
  return entry
}

export function updateClosetItem(id: string, updates: Partial<ClosetItem>): void {
  const closet = getCloset()
  const idx = closet.findIndex(c => c.id === id)
  if (idx !== -1) {
    closet[idx] = { ...closet[idx], ...updates }
    localStorage.setItem(CLOSET_KEY, JSON.stringify(closet))
  }
}

export function removeFromCloset(id: string): void {
  const closet = getCloset().filter(c => c.id !== id)
  localStorage.setItem(CLOSET_KEY, JSON.stringify(closet))
}

export function isInCloset(scanId: string): boolean {
  return getCloset().some(c => c.scanId === scanId)
}

// Listings (shareable)
const LISTINGS_KEY = "flipt-listings"

export interface ListingItem {
  id: string
  scanId: string
  item: string
  valueLow: number
  valueHigh: number
  platform: string
  title: string
  description: string
  imageUrl: string | null
  condition: string
  createdAt: string
}

export function getListings(): ListingItem[] {
  if (typeof window === "undefined") return []
  const raw = localStorage.getItem(LISTINGS_KEY)
  return raw ? JSON.parse(raw) : []
}

export function createListing(scan: ScanHistoryItem, condition: string): ListingItem {
  const listings = getListings()
  const entry: ListingItem = {
    id: crypto.randomUUID().slice(0, 8),
    scanId: scan.id,
    item: scan.item,
    valueLow: scan.valueLow,
    valueHigh: scan.valueHigh,
    platform: scan.platform,
    title: scan.title,
    description: scan.description,
    imageUrl: scan.imageUrl,
    condition,
    createdAt: new Date().toISOString(),
  }
  listings.unshift(entry)
  localStorage.setItem(LISTINGS_KEY, JSON.stringify(listings))
  return entry
}

export function getListing(id: string): ListingItem | undefined {
  return getListings().find(l => l.id === id)
}

// Bulk report
const REPORT_KEY = "flipt-bulk-report"

export interface BulkReportItem {
  item: string
  valueLow: number
  valueHigh: number
  platform: string
  title: string
  description: string
  imageUrl: string | null
  condition: string
}

export function saveBulkReport(items: BulkReportItem[]): void {
  sessionStorage.setItem(REPORT_KEY, JSON.stringify(items))
}

export function getBulkReport(): BulkReportItem[] {
  if (typeof window === "undefined") return []
  const raw = sessionStorage.getItem(REPORT_KEY)
  return raw ? JSON.parse(raw) : []
}

// Referral system
const REFERRAL_CODE_KEY = "flipt-referral-code"
const REFERRAL_COUNT_KEY = "flipt-referral-count"
const BONUS_SCANS_KEY = "flipt-bonus-scans"

export function getReferralCode(): string {
  if (typeof window === "undefined") return ""
  let code = localStorage.getItem(REFERRAL_CODE_KEY)
  if (!code) {
    code = crypto.randomUUID().slice(0, 8)
    localStorage.setItem(REFERRAL_CODE_KEY, code)
  }
  return code
}

export function getReferralCount(): number {
  if (typeof window === "undefined") return 0
  return parseInt(localStorage.getItem(REFERRAL_COUNT_KEY) || "0", 10)
}

export function addReferral(): void {
  const count = getReferralCount() + 1
  localStorage.setItem(REFERRAL_COUNT_KEY, String(count))
  const bonus = getBonusScans() + 3
  localStorage.setItem(BONUS_SCANS_KEY, String(bonus))
}

export function getBonusScans(): number {
  if (typeof window === "undefined") return 0
  return parseInt(localStorage.getItem(BONUS_SCANS_KEY) || "0", 10)
}

// Subscription & Plan
const PLAN_KEY = "flipt-plan"
const PRO_KEY = "flipt-pro"

export type PlanTier = "free" | "pro" | "business"

export function getPlan(): PlanTier {
  if (typeof window === "undefined") return "free"
  return (localStorage.getItem(PLAN_KEY) as PlanTier) || "free"
}

export function setPlan(plan: PlanTier): void {
  localStorage.setItem(PLAN_KEY, plan)
  localStorage.setItem(PRO_KEY, plan !== "free" ? "true" : "false")
}

export function isPro(): boolean {
  if (typeof window === "undefined") return false
  const plan = getPlan()
  return plan === "pro" || plan === "business"
}

export function setPro(value: boolean): void {
  localStorage.setItem(PRO_KEY, value ? "true" : "false")
  if (!value) localStorage.setItem(PLAN_KEY, "free")
}

export function isBusiness(): boolean {
  return getPlan() === "business"
}

// User profile
const PROFILE_KEY = "flipt-profile"

export interface UserProfile {
  name: string
  email: string
  joinedAt: string
}

export function getProfile(): UserProfile {
  if (typeof window === "undefined") return { name: "", email: "", joinedAt: new Date().toISOString() }
  const raw = localStorage.getItem(PROFILE_KEY)
  if (raw) return JSON.parse(raw)
  const email = localStorage.getItem("flipt-user-email") || ""
  const p: UserProfile = { name: "", email, joinedAt: new Date().toISOString() }
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p))
  return p
}

export function updateProfile(updates: Partial<UserProfile>): void {
  const p = getProfile()
  const updated = { ...p, ...updates }
  localStorage.setItem(PROFILE_KEY, JSON.stringify(updated))
  if (updates.email) localStorage.setItem("flipt-user-email", updates.email)
}

// Notification prefs
const NOTIF_KEY = "flipt-notifications"

export interface NotifPrefs {
  push: boolean
  weeklyReport: boolean
  priceDrops: boolean
  newListings: boolean
  promo: boolean
}

export function getNotifPrefs(): NotifPrefs {
  if (typeof window === "undefined") return { push: true, weeklyReport: false, priceDrops: true, newListings: true, promo: false }
  const raw = localStorage.getItem(NOTIF_KEY)
  return raw ? JSON.parse(raw) : { push: true, weeklyReport: false, priceDrops: true, newListings: true, promo: false }
}

export function setNotifPrefs(prefs: NotifPrefs): void {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(prefs))
}

// Sign out
export function signOut(): void {
  localStorage.clear()
  sessionStorage.clear()
}

// Market email
const MARKET_EMAIL_KEY = "flipt-market-email"

export function getMarketEmail(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(MARKET_EMAIL_KEY)
}

export function setMarketEmail(email: string): void {
  localStorage.setItem(MARKET_EMAIL_KEY, email)
}

// Business mode
const BIZ_ITEMS_KEY = "flipt-biz-items"
const BIZ_EXPENSES_KEY = "flipt-biz-expenses"

export interface BizItem {
  id: string
  name: string
  purchasePrice: number
  salePrice: number | null
  date: string
  sold: boolean
}

export interface BizExpense {
  id: string
  description: string
  amount: number
  date: string
}

export function getBizItems(): BizItem[] {
  if (typeof window === "undefined") return []
  const raw = localStorage.getItem(BIZ_ITEMS_KEY)
  return raw ? JSON.parse(raw) : []
}

export function addBizItem(item: Omit<BizItem, "id">): void {
  const items = getBizItems()
  items.unshift({ ...item, id: crypto.randomUUID() })
  localStorage.setItem(BIZ_ITEMS_KEY, JSON.stringify(items))
}

export function updateBizItem(id: string, updates: Partial<BizItem>): void {
  const items = getBizItems()
  const idx = items.findIndex(i => i.id === id)
  if (idx !== -1) {
    items[idx] = { ...items[idx], ...updates }
    localStorage.setItem(BIZ_ITEMS_KEY, JSON.stringify(items))
  }
}

export function removeBizItem(id: string): void {
  localStorage.setItem(BIZ_ITEMS_KEY, JSON.stringify(getBizItems().filter(i => i.id !== id)))
}

export function getBizExpenses(): BizExpense[] {
  if (typeof window === "undefined") return []
  const raw = localStorage.getItem(BIZ_EXPENSES_KEY)
  return raw ? JSON.parse(raw) : []
}

export function addBizExpense(expense: Omit<BizExpense, "id">): void {
  const items = getBizExpenses()
  items.unshift({ ...expense, id: crypto.randomUUID() })
  localStorage.setItem(BIZ_EXPENSES_KEY, JSON.stringify(items))
}

export function removeBizExpense(id: string): void {
  localStorage.setItem(BIZ_EXPENSES_KEY, JSON.stringify(getBizExpenses().filter(e => e.id !== id)))
}

export function bulkAddToCloset(items: BulkReportItem[]): void {
  const closet = getCloset()
  for (const item of items) {
    const historyEntry = addToHistory({
      item: item.item,
      valueLow: item.valueLow,
      valueHigh: item.valueHigh,
      platform: item.platform,
      title: item.title,
      description: item.description,
      imageUrl: item.imageUrl,
    })
    closet.unshift({
      id: crypto.randomUUID(),
      scanId: historyEntry.id,
      item: item.item,
      valueLow: item.valueLow,
      valueHigh: item.valueHigh,
      platform: item.platform,
      title: item.title,
      description: item.description,
      imageUrl: item.imageUrl,
      condition: item.condition,
      status: "Storing",
      soldPrice: null,
      addedAt: new Date().toISOString(),
    })
  }
  localStorage.setItem(CLOSET_KEY, JSON.stringify(closet))
}

// Marketplace
const MARKETPLACE_KEY = "flipt-marketplace"
export type MarketCategory = "Electronics" | "Clothing" | "Furniture" | "Sports" | "Books" | "Other"
export interface MarketplaceListing { id: string; item: string; title: string; description: string; imageUrl: string | null; condition: string; askingPrice: number; aiValueLow: number; aiValueHigh: number; platform: string; category: MarketCategory; sellerCode: string; postedAt: string }

export function getMarketplaceListings(): MarketplaceListing[] {
  if (typeof window === "undefined") return []
  const raw = localStorage.getItem(MARKETPLACE_KEY)
  if (!raw) { const s = seedMarketplace(); localStorage.setItem(MARKETPLACE_KEY, JSON.stringify(s)); return s }
  return JSON.parse(raw)
}

export function addMarketplaceListing(listing: Omit<MarketplaceListing, "id" | "sellerCode" | "postedAt">): MarketplaceListing {
  const items = getMarketplaceListings()
  const entry: MarketplaceListing = { ...listing, id: crypto.randomUUID().slice(0, 8), sellerCode: getReferralCode(), postedAt: new Date().toISOString() }
  items.unshift(entry)
  localStorage.setItem(MARKETPLACE_KEY, JSON.stringify(items))
  return entry
}

function seedMarketplace(): MarketplaceListing[] {
  const d = (n: number) => new Date(Date.now() - n * 86400000).toISOString()
  return [
    {id:"s01",item:"Apple AirPods Pro 2",title:"AirPods Pro 2 - Like New",description:"Used 2 months. Perfect.",imageUrl:null,condition:"Excellent",askingPrice:155,aiValueLow:130,aiValueHigh:170,platform:"eBay",category:"Electronics",sellerCode:"demo01",postedAt:d(0)},
    {id:"s02",item:"Lululemon Align Size 6",title:"Lululemon Align 25\" Black",description:"No pilling, like new.",imageUrl:null,condition:"Excellent",askingPrice:58,aiValueLow:50,aiValueHigh:75,platform:"Poshmark",category:"Clothing",sellerCode:"demo02",postedAt:d(1)},
    {id:"s03",item:"IKEA KALLAX 4x4",title:"IKEA Kallax 4x4 White",description:"Moving sale!",imageUrl:null,condition:"Good",askingPrice:45,aiValueLow:40,aiValueHigh:70,platform:"Facebook Marketplace",category:"Furniture",sellerCode:"demo03",postedAt:d(1)},
    {id:"s04",item:"Nintendo Switch OLED",title:"Switch OLED White Mint",description:"Includes everything.",imageUrl:null,condition:"Excellent",askingPrice:280,aiValueLow:250,aiValueHigh:300,platform:"Kijiji",category:"Electronics",sellerCode:"demo04",postedAt:d(2)},
    {id:"s05",item:"Canada Goose Parka XL",title:"Canada Goose Expedition Black XL",description:"Authentic, great shape.",imageUrl:null,condition:"Good",askingPrice:450,aiValueLow:380,aiValueHigh:520,platform:"Kijiji",category:"Clothing",sellerCode:"demo05",postedAt:d(2)},
    {id:"s06",item:"Dyson V15 Detect",title:"Dyson V15 Full Kit",description:"All attachments.",imageUrl:null,condition:"Good",askingPrice:350,aiValueLow:340,aiValueHigh:420,platform:"Facebook Marketplace",category:"Electronics",sellerCode:"demo06",postedAt:d(3)},
    {id:"s07",item:"Peloton Bike",title:"Peloton Bike + Shoes 42",description:"Works perfectly.",imageUrl:null,condition:"Fair",askingPrice:600,aiValueLow:550,aiValueHigh:800,platform:"Facebook Marketplace",category:"Sports",sellerCode:"demo07",postedAt:d(3)},
    {id:"s08",item:"Herman Miller Aeron B",title:"Herman Miller Aeron Loaded",description:"All adjustments work.",imageUrl:null,condition:"Good",askingPrice:550,aiValueLow:450,aiValueHigh:650,platform:"Kijiji",category:"Furniture",sellerCode:"demo08",postedAt:d(4)},
    {id:"s09",item:"MacBook Air M2",title:"MacBook Air M2 Midnight",description:"47 battery cycles.",imageUrl:null,condition:"Excellent",askingPrice:820,aiValueLow:750,aiValueHigh:900,platform:"eBay",category:"Electronics",sellerCode:"demo09",postedAt:d(4)},
    {id:"s10",item:"KitchenAid Artisan",title:"KitchenAid 5qt Empire Red",description:"Used maybe 10 times.",imageUrl:null,condition:"Excellent",askingPrice:185,aiValueLow:150,aiValueHigh:220,platform:"Facebook Marketplace",category:"Electronics",sellerCode:"demo10",postedAt:d(5)},
    {id:"s11",item:"Yeti Tundra 45",title:"Yeti Tundra 45 Tan",description:"Cosmetic scratches only.",imageUrl:null,condition:"Good",askingPrice:175,aiValueLow:160,aiValueHigh:210,platform:"Kijiji",category:"Sports",sellerCode:"demo11",postedAt:d(5)},
    {id:"s12",item:"Patagonia Fleece M",title:"Patagonia Better Sweater Navy",description:"Barely worn.",imageUrl:null,condition:"Excellent",askingPrice:65,aiValueLow:55,aiValueHigh:80,platform:"Poshmark",category:"Clothing",sellerCode:"demo12",postedAt:d(6)},
    {id:"s13",item:"Sony XM5",title:"Sony XM5 Silver w/ Case",description:"Incredible ANC.",imageUrl:null,condition:"Good",askingPrice:210,aiValueLow:190,aiValueHigh:250,platform:"eBay",category:"Electronics",sellerCode:"demo13",postedAt:d(6)},
    {id:"s14",item:"West Elm Nightstand",title:"West Elm Mid-Century Acorn",description:"Small water ring.",imageUrl:null,condition:"Fair",askingPrice:90,aiValueLow:80,aiValueHigh:140,platform:"Facebook Marketplace",category:"Furniture",sellerCode:"demo14",postedAt:d(7)},
    {id:"s15",item:"Harry Potter Box Set",title:"HP 1-7 Hardcover Set",description:"Great condition jackets.",imageUrl:null,condition:"Good",askingPrice:65,aiValueLow:50,aiValueHigh:80,platform:"eBay",category:"Books",sellerCode:"demo15",postedAt:d(7)},
    {id:"s16",item:"Bose Revolve+ II",title:"Bose Revolve+ II Speaker",description:"Amazing battery.",imageUrl:null,condition:"Excellent",askingPrice:145,aiValueLow:120,aiValueHigh:165,platform:"eBay",category:"Electronics",sellerCode:"demo16",postedAt:d(8)},
    {id:"s17",item:"Arc'teryx Atom LT",title:"Arc'teryx Atom LT Black L",description:"Minor cuff wear.",imageUrl:null,condition:"Good",askingPrice:140,aiValueLow:120,aiValueHigh:170,platform:"Poshmark",category:"Clothing",sellerCode:"demo17",postedAt:d(9)},
    {id:"s18",item:"Vitamix 5200",title:"Vitamix 5200 Black",description:"Runs perfectly.",imageUrl:null,condition:"Good",askingPrice:200,aiValueLow:180,aiValueHigh:250,platform:"Facebook Marketplace",category:"Electronics",sellerCode:"demo18",postedAt:d(10)},
    {id:"s19",item:"Osprey Atmos 65L",title:"Osprey Atmos AG 65L Blue",description:"One trip only.",imageUrl:null,condition:"Excellent",askingPrice:165,aiValueLow:140,aiValueHigh:190,platform:"Kijiji",category:"Sports",sellerCode:"demo19",postedAt:d(11)},
    {id:"s20",item:"Atomic Habits",title:"Atomic Habits Hardcover",description:"Read once.",imageUrl:null,condition:"Good",askingPrice:12,aiValueLow:8,aiValueHigh:15,platform:"Kijiji",category:"Books",sellerCode:"demo20",postedAt:d(12)},
  ]
}

// Feed
const FEED_KEY = "flipt-feed"
export type FeedCategory = "Electronics" | "Clothing" | "Furniture" | "Sports" | "Collectibles" | "Other"
export interface FeedPost { id: string; userCode: string; userName: string; item: string; title: string; imageUrl: string | null; value: number; platform: string; category: FeedCategory; postedAt: string; likes: number; liked: boolean }

export function getFeed(): FeedPost[] {
  if (typeof window === "undefined") return []
  const raw = localStorage.getItem(FEED_KEY)
  if (!raw) { const s = seedFeed(); localStorage.setItem(FEED_KEY, JSON.stringify(s)); return s }
  return JSON.parse(raw)
}

export function addFeedPost(post: Omit<FeedPost, "id" | "userCode" | "userName" | "postedAt" | "likes" | "liked">): void {
  const feed = getFeed()
  const code = getReferralCode()
  feed.unshift({ ...post, id: crypto.randomUUID().slice(0, 8), userCode: code, userName: code.slice(0, 2).toUpperCase() + code.slice(2, 5), postedAt: new Date().toISOString(), likes: 0, liked: false })
  localStorage.setItem(FEED_KEY, JSON.stringify(feed))
}

export function toggleFeedLike(id: string): void {
  const feed = getFeed()
  const p = feed.find(f => f.id === id)
  if (p) { p.liked = !p.liked; p.likes += p.liked ? 1 : -1; localStorage.setItem(FEED_KEY, JSON.stringify(feed)) }
}

function seedFeed(): FeedPost[] {
  const d = (min: number) => new Date(Date.now() - min * 60000).toISOString()
  const names = ["Sarah M","Mike R","Emma K","Jason T","Lisa C","David P","Nina S","Alex B","Rachel W","Omar H","Jade L","Chris F","Maya D","Tom G","Zoe N","Sam V","Priya J","Jordan Q","Aiden X","Kelly U","Marcus I","Lauren E","Ben O","Chloe A","Ryan Z","Tina Y","Nate W","Sofia P","Ethan H","Olivia K"]
  const items: Omit<FeedPost, "id" | "postedAt" | "likes" | "liked">[] = [
    {userCode:"usr01",userName:names[0],item:"Sony WH-1000XM5",title:"Sony XM5 - Barely Used",imageUrl:null,value:215,platform:"Kijiji",category:"Electronics"},
    {userCode:"usr02",userName:names[1],item:"Giant Defy Road Bike",title:"Giant Defy Advanced - Carbon Frame",imageUrl:null,value:1200,platform:"Kijiji",category:"Sports"},
    {userCode:"usr03",userName:names[2],item:"Aritzia Super Puff",title:"Aritzia Super Puff Long - Black S",imageUrl:null,value:185,platform:"Poshmark",category:"Clothing"},
    {userCode:"usr04",userName:names[3],item:"PS5 Disc Edition",title:"PS5 Disc + 2 Controllers",imageUrl:null,value:420,platform:"Facebook Marketplace",category:"Electronics"},
    {userCode:"usr05",userName:names[4],item:"West Elm Sofa",title:"West Elm Hamilton Sofa - Teal",imageUrl:null,value:650,platform:"Facebook Marketplace",category:"Furniture"},
    {userCode:"usr06",userName:names[5],item:"Pokemon Cards Lot",title:"Base Set Holo Collection 1999",imageUrl:null,value:340,platform:"eBay",category:"Collectibles"},
    {userCode:"usr07",userName:names[6],item:"Fjallraven Kanken",title:"Kanken Classic - Ochre",imageUrl:null,value:55,platform:"Poshmark",category:"Clothing"},
    {userCode:"usr08",userName:names[7],item:"iPad Air M1",title:"iPad Air 5th Gen 256GB",imageUrl:null,value:480,platform:"Kijiji",category:"Electronics"},
    {userCode:"usr09",userName:names[8],item:"Pottery Barn Rug",title:"PB Chunky Wool Jute Rug 8x10",imageUrl:null,value:220,platform:"Facebook Marketplace",category:"Furniture"},
    {userCode:"usr10",userName:names[9],item:"Vintage Levis 501",title:"Levis 501 Made in USA - 32x30",imageUrl:null,value:95,platform:"eBay",category:"Clothing"},
    {userCode:"usr11",userName:names[10],item:"DJI Mini 3 Pro",title:"DJI Mini 3 Pro Fly More Combo",imageUrl:null,value:580,platform:"Kijiji",category:"Electronics"},
    {userCode:"usr12",userName:names[11],item:"Yeezy 350 V2",title:"Yeezy Boost 350 V2 Beluga Size 10",imageUrl:null,value:220,platform:"eBay",category:"Clothing"},
    {userCode:"usr13",userName:names[12],item:"Breville Barista Express",title:"Breville Barista Express - Silver",imageUrl:null,value:320,platform:"Kijiji",category:"Electronics"},
    {userCode:"usr14",userName:names[13],item:"Burton Snowboard",title:"Burton Custom 156cm + Bindings",imageUrl:null,value:280,platform:"Kijiji",category:"Sports"},
    {userCode:"usr15",userName:names[14],item:"MCM Backpack",title:"MCM Stark Backpack - Cognac",imageUrl:null,value:350,platform:"Poshmark",category:"Clothing"},
    {userCode:"usr16",userName:names[15],item:"Standing Desk",title:"Uplift V2 Standing Desk 60x30",imageUrl:null,value:400,platform:"Facebook Marketplace",category:"Furniture"},
    {userCode:"usr17",userName:names[16],item:"Vinyl Record Collection",title:"Classic Rock Vinyl Lot - 40 Records",imageUrl:null,value:160,platform:"eBay",category:"Collectibles"},
    {userCode:"usr18",userName:names[17],item:"Apple Watch Ultra",title:"Apple Watch Ultra 1 - Titanium",imageUrl:null,value:450,platform:"Kijiji",category:"Electronics"},
    {userCode:"usr19",userName:names[18],item:"Peloton Bike",title:"Peloton Bike+ Complete Setup",imageUrl:null,value:900,platform:"Facebook Marketplace",category:"Sports"},
    {userCode:"usr20",userName:names[19],item:"Restoration Hardware Chair",title:"RH Cloud Chair - Sand Linen",imageUrl:null,value:750,platform:"Facebook Marketplace",category:"Furniture"},
    {userCode:"usr21",userName:names[20],item:"Magic The Gathering Lot",title:"MTG Commander Deck Collection x4",imageUrl:null,value:180,platform:"eBay",category:"Collectibles"},
    {userCode:"usr22",userName:names[21],item:"Dyson Airwrap",title:"Dyson Airwrap Complete - Long",imageUrl:null,value:340,platform:"Poshmark",category:"Electronics"},
    {userCode:"usr23",userName:names[22],item:"Herman Miller Embody",title:"Herman Miller Embody - Graphite",imageUrl:null,value:800,platform:"Kijiji",category:"Furniture"},
    {userCode:"usr24",userName:names[23],item:"Lululemon Belt Bag",title:"Lulu Everywhere Belt Bag - Pastel",imageUrl:null,value:42,platform:"Poshmark",category:"Clothing"},
    {userCode:"usr25",userName:names[24],item:"Canon R6 Mark II",title:"Canon EOS R6 II Body Only",imageUrl:null,value:1800,platform:"eBay",category:"Electronics"},
    {userCode:"usr26",userName:names[25],item:"Thule Roof Rack",title:"Thule SquareBar Evo Kit",imageUrl:null,value:175,platform:"Kijiji",category:"Sports"},
    {userCode:"usr27",userName:names[26],item:"Eames Shell Chair",title:"Vintage Eames Shell Chair - Fiberglass",imageUrl:null,value:450,platform:"eBay",category:"Collectibles"},
    {userCode:"usr28",userName:names[27],item:"North Face Nuptse",title:"TNF 1996 Nuptse - Black M",imageUrl:null,value:180,platform:"Poshmark",category:"Clothing"},
    {userCode:"usr29",userName:names[28],item:"Weber Spirit Grill",title:"Weber Spirit E-310 LP Gas Grill",imageUrl:null,value:250,platform:"Facebook Marketplace",category:"Other"},
    {userCode:"usr30",userName:names[29],item:"Le Creuset Dutch Oven",title:"Le Creuset 5.5qt - Flame Orange",imageUrl:null,value:165,platform:"Facebook Marketplace",category:"Other"},
  ]
  const times = [3,8,15,22,35,48,75,95,140,180,240,320,420,500,600,720,960,1200,1500,1800,2400,3000,3600,4200,5400,7200,8640,10080,12000,14400]
  return items.map((it, i) => ({ ...it, id: `fp${String(i+1).padStart(2,"0")}`, postedAt: d(times[i]), likes: Math.floor(Math.random()*24)+1, liked: false }))
}

// Following
const FOLLOWING_KEY = "flipt-following"
export interface FollowedSeller { code: string; name: string; followedAt: string }

export function getFollowing(): FollowedSeller[] {
  if (typeof window === "undefined") return []
  const raw = localStorage.getItem(FOLLOWING_KEY)
  return raw ? JSON.parse(raw) : []
}

export function followSeller(code: string, name: string): void {
  const list = getFollowing()
  if (!list.find(s => s.code === code)) { list.push({ code, name, followedAt: new Date().toISOString() }); localStorage.setItem(FOLLOWING_KEY, JSON.stringify(list)) }
}

export function unfollowSeller(code: string): void {
  localStorage.setItem(FOLLOWING_KEY, JSON.stringify(getFollowing().filter(s => s.code !== code)))
}

export function isFollowing(code: string): boolean {
  return getFollowing().some(s => s.code === code)
}

// Watchlist
const WATCHLIST_KEY = "flipt-watchlist"
export interface WatchlistItem { id: string; itemId: string; title: string; imageUrl: string | null; price: number; savedPrice: number; platform: string; savedAt: string; notify: boolean }

export function getWatchlist(): WatchlistItem[] {
  if (typeof window === "undefined") return []
  const raw = localStorage.getItem(WATCHLIST_KEY)
  return raw ? JSON.parse(raw) : []
}

export function addToWatchlist(item: Omit<WatchlistItem, "id" | "savedPrice" | "savedAt" | "notify">): void {
  const list = getWatchlist()
  if (list.find(w => w.itemId === item.itemId)) return
  list.unshift({ ...item, id: crypto.randomUUID().slice(0, 8), savedPrice: item.price, savedAt: new Date().toISOString(), notify: false })
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list))
}

export function removeFromWatchlist(id: string): void {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(getWatchlist().filter(w => w.id !== id)))
}

export function toggleWatchlistNotify(id: string): void {
  const list = getWatchlist()
  const w = list.find(i => i.id === id)
  if (w) { w.notify = !w.notify; localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list)) }
}

export function isWatchlisted(itemId: string): boolean {
  return getWatchlist().some(w => w.itemId === itemId)
}

export function getWatchlistCount(): number {
  return getWatchlist().length
}

// Multi Account Manager
const ACCOUNTS_KEY = "flipt-accounts"
const ACCOUNT_LISTINGS_KEY = "flipt-account-listings"

export type PlatformName = "Kijiji" | "Facebook Marketplace" | "eBay" | "Poshmark" | "Craigslist"

export interface ConnectedAccount {
  platform: PlatformName
  connected: boolean
  connectedAt: string | null
  healthScore: number
  stats: { activeListings: number; viewsThisWeek: number; messagesThisWeek: number; totalValue: number }
}

export interface AccountListing {
  id: string
  platform: PlatformName
  item: string
  imageUrl: string | null
  price: number
  views: number
  daysListed: number
  status: "Active" | "Sold" | "Expired"
}

export function getConnectedAccounts(): ConnectedAccount[] {
  if (typeof window === "undefined") return []
  const raw = localStorage.getItem(ACCOUNTS_KEY)
  if (!raw) {
    const defaults: ConnectedAccount[] = [
      { platform: "Kijiji", connected: false, connectedAt: null, healthScore: 0, stats: { activeListings: 0, viewsThisWeek: 0, messagesThisWeek: 0, totalValue: 0 } },
      { platform: "Facebook Marketplace", connected: false, connectedAt: null, healthScore: 0, stats: { activeListings: 0, viewsThisWeek: 0, messagesThisWeek: 0, totalValue: 0 } },
      { platform: "eBay", connected: false, connectedAt: null, healthScore: 0, stats: { activeListings: 0, viewsThisWeek: 0, messagesThisWeek: 0, totalValue: 0 } },
      { platform: "Poshmark", connected: false, connectedAt: null, healthScore: 0, stats: { activeListings: 0, viewsThisWeek: 0, messagesThisWeek: 0, totalValue: 0 } },
      { platform: "Craigslist", connected: false, connectedAt: null, healthScore: 0, stats: { activeListings: 0, viewsThisWeek: 0, messagesThisWeek: 0, totalValue: 0 } },
    ]
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(defaults))
    return defaults
  }
  return JSON.parse(raw)
}

export function connectAccount(platform: PlatformName): void {
  const accts = getConnectedAccounts()
  const a = accts.find(x => x.platform === platform)
  if (a) {
    a.connected = true
    a.connectedAt = new Date().toISOString()
    a.healthScore = 60 + Math.floor(Math.random() * 30)
    a.stats = {
      activeListings: 3 + Math.floor(Math.random() * 12),
      viewsThisWeek: 40 + Math.floor(Math.random() * 200),
      messagesThisWeek: 2 + Math.floor(Math.random() * 15),
      totalValue: 200 + Math.floor(Math.random() * 2000),
    }
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accts))
    seedAccountListings(platform)
  }
}

export function disconnectAccount(platform: PlatformName): void {
  const accts = getConnectedAccounts()
  const a = accts.find(x => x.platform === platform)
  if (a) {
    a.connected = false; a.connectedAt = null; a.healthScore = 0
    a.stats = { activeListings: 0, viewsThisWeek: 0, messagesThisWeek: 0, totalValue: 0 }
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accts))
    const listings = getAccountListings().filter(l => l.platform !== platform)
    localStorage.setItem(ACCOUNT_LISTINGS_KEY, JSON.stringify(listings))
  }
}

export function getAccountListings(): AccountListing[] {
  if (typeof window === "undefined") return []
  const raw = localStorage.getItem(ACCOUNT_LISTINGS_KEY)
  return raw ? JSON.parse(raw) : []
}

export function updateAccountListing(id: string, updates: Partial<AccountListing>): void {
  const list = getAccountListings()
  const idx = list.findIndex(l => l.id === id)
  if (idx !== -1) { list[idx] = { ...list[idx], ...updates }; localStorage.setItem(ACCOUNT_LISTINGS_KEY, JSON.stringify(list)) }
}

export function removeAccountListings(ids: string[]): void {
  localStorage.setItem(ACCOUNT_LISTINGS_KEY, JSON.stringify(getAccountListings().filter(l => !ids.includes(l.id))))
}

export function crossPostListing(id: string, targets: PlatformName[]): void {
  const listings = getAccountListings()
  const src = listings.find(l => l.id === id)
  if (!src) return
  for (const p of targets) {
    listings.push({ ...src, id: crypto.randomUUID().slice(0, 8), platform: p, views: 0, daysListed: 0 })
  }
  localStorage.setItem(ACCOUNT_LISTINGS_KEY, JSON.stringify(listings))
}

function seedAccountListings(platform: PlatformName): void {
  const existing = getAccountListings()
  const items = [
    { item: "Sony WH-1000XM5", price: 215, views: 45, daysListed: 3, status: "Active" as const },
    { item: "Lululemon Belt Bag", price: 42, views: 28, daysListed: 5, status: "Active" as const },
    { item: "Nintendo Switch Pro Controller", price: 45, views: 62, daysListed: 7, status: "Active" as const },
    { item: "IKEA Kallax Shelf", price: 55, views: 18, daysListed: 2, status: "Active" as const },
    { item: "Vintage Vinyl Records Lot", price: 85, views: 34, daysListed: 10, status: "Active" as const },
    { item: "KitchenAid Mixer", price: 165, views: 89, daysListed: 14, status: "Sold" as const },
    { item: "Canada Goose Vest", price: 280, views: 112, daysListed: 21, status: "Expired" as const },
  ]
  const count = 3 + Math.floor(Math.random() * 4)
  const selected = items.sort(() => Math.random() - 0.5).slice(0, count)
  const newListings: AccountListing[] = selected.map(s => ({
    id: crypto.randomUUID().slice(0, 8), platform, imageUrl: null,
    item: s.item, price: s.price, views: s.views + Math.floor(Math.random() * 20),
    daysListed: s.daysListed + Math.floor(Math.random() * 5), status: s.status,
  }))
  localStorage.setItem(ACCOUNT_LISTINGS_KEY, JSON.stringify([...existing, ...newListings]))
}
