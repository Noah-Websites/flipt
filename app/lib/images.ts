// Curated product images from Unsplash CDN (reliable direct URLs)
// Each category has multiple images to provide variety

const PRODUCT_IMAGES: Record<string, string[]> = {
  airpods: [
    "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=400&fit=crop",
  ],
  headphones: [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop",
  ],
  iphone: [
    "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400&h=400&fit=crop",
  ],
  macbook: [
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop",
  ],
  laptop: [
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=400&fit=crop",
  ],
  switch: [
    "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=400&h=400&fit=crop",
  ],
  ps5: [
    "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=400&fit=crop",
  ],
  gaming: [
    "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=400&fit=crop",
  ],
  sneakers: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop",
  ],
  shoes: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop",
  ],
  clothing: [
    "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1434389677669-e08b4cda3a30?w=400&h=400&fit=crop",
  ],
  jacket: [
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1548883354-94bcfe321cbb?w=400&h=400&fit=crop",
  ],
  parka: [
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop",
  ],
  leggings: [
    "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&h=400&fit=crop",
  ],
  sweater: [
    "https://images.unsplash.com/photo-1434389677669-e08b4cda3a30?w=400&h=400&fit=crop",
  ],
  furniture: [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=400&fit=crop",
  ],
  chair: [
    "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1503602642458-232111445657?w=400&h=400&fit=crop",
  ],
  shelf: [
    "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=400&h=400&fit=crop",
  ],
  desk: [
    "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&h=400&fit=crop",
  ],
  sofa: [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop",
  ],
  watch: [
    "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=400&h=400&fit=crop",
  ],
  camera: [
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=400&fit=crop",
  ],
  books: [
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=400&fit=crop",
  ],
  sports: [
    "https://images.unsplash.com/photo-1461896836934-bd45ba7e4cac?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=400&fit=crop",
  ],
  bike: [
    "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&h=400&fit=crop",
  ],
  backpack: [
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
  ],
  vintage: [
    "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&h=400&fit=crop",
  ],
  vinyl: [
    "https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=400&h=400&fit=crop",
  ],
  handbag: [
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop",
  ],
  jewelry: [
    "https://images.unsplash.com/photo-1515562141589-67f0d569b6f5?w=400&h=400&fit=crop",
  ],
  speaker: [
    "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop",
  ],
  vacuum: [
    "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&h=400&fit=crop",
  ],
  mixer: [
    "https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?w=400&h=400&fit=crop",
  ],
  blender: [
    "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400&h=400&fit=crop",
  ],
  cooler: [
    "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&h=400&fit=crop",
  ],
  grill: [
    "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=400&fit=crop",
  ],
  drone: [
    "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=400&fit=crop",
  ],
  ipad: [
    "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop",
  ],
  electronics: [
    "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=400&fit=crop",
  ],
  default: [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=400&fit=crop",
  ],
}

// Match keywords from item name to find the best image
const KEYWORD_MAP: [string[], string][] = [
  [["airpod"], "airpods"],
  [["headphone", "xm5", "xm4", "bose"], "headphones"],
  [["iphone"], "iphone"],
  [["macbook", "mac book"], "macbook"],
  [["laptop", "chromebook", "thinkpad"], "laptop"],
  [["switch", "nintendo"], "switch"],
  [["ps5", "playstation"], "ps5"],
  [["xbox", "controller", "gaming"], "gaming"],
  [["sneaker", "nike", "jordan", "yeezy", "shoe", "air max"], "sneakers"],
  [["legging", "lululemon", "align"], "leggings"],
  [["jacket", "coat", "north face", "nuptse", "arc'teryx", "atom"], "jacket"],
  [["parka", "goose", "expedition"], "parka"],
  [["sweater", "fleece", "patagonia", "hoodie"], "sweater"],
  [["dress", "shirt", "clothing", "poshmark"], "clothing"],
  [["chair", "aeron", "herman miller", "embody"], "chair"],
  [["shelf", "kallax", "bookshelf"], "shelf"],
  [["desk", "standing desk", "uplift"], "desk"],
  [["sofa", "couch", "loveseat"], "sofa"],
  [["nightstand", "dresser", "table", "furniture"], "furniture"],
  [["watch", "apple watch"], "watch"],
  [["camera", "canon", "sony", "nikon", "fuji"], "camera"],
  [["drone", "dji", "mini"], "drone"],
  [["book", "harry potter", "atomic habits"], "books"],
  [["bike", "bicycle", "cycling"], "bike"],
  [["backpack", "osprey", "kanken", "fjallraven"], "backpack"],
  [["snowboard", "ski", "burton", "sport", "peloton", "yeti"], "sports"],
  [["vinyl", "record"], "vinyl"],
  [["vintage", "retro", "antique", "eames"], "vintage"],
  [["bag", "mcm", "purse", "handbag", "belt bag"], "handbag"],
  [["jewelry", "necklace", "ring", "bracelet"], "jewelry"],
  [["speaker", "revolve", "soundlink"], "speaker"],
  [["vacuum", "dyson"], "vacuum"],
  [["mixer", "kitchenaid"], "mixer"],
  [["blender", "vitamix"], "blender"],
  [["cooler", "yeti tundra"], "cooler"],
  [["grill", "weber"], "grill"],
  [["ipad", "tablet"], "ipad"],
  [["airwrap", "electronics", "tech"], "electronics"],
]

export function getProductImage(itemName: string, index: number = 0): string {
  const lower = itemName.toLowerCase()

  // Find best matching category
  for (const [keywords, category] of KEYWORD_MAP) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        const images = PRODUCT_IMAGES[category]
        return images[index % images.length]
      }
    }
  }

  // Fallback
  const fallback = PRODUCT_IMAGES.default
  return fallback[index % fallback.length]
}
