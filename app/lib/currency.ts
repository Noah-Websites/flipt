export interface Currency {
  code: string
  name: string
  symbol: string
  flag: string
  rate: number // from CAD
  decimals: number
}

export const CURRENCIES: Currency[] = [
  { code: "CAD", name: "Canadian Dollar", symbol: "$", flag: "🇨🇦", rate: 1, decimals: 2 },
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸", rate: 0.74, decimals: 2 },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧", rate: 0.58, decimals: 2 },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺", rate: 0.68, decimals: 2 },
  { code: "AUD", name: "Australian Dollar", symbol: "$", flag: "🇦🇺", rate: 1.13, decimals: 2 },
  { code: "NZD", name: "New Zealand Dollar", symbol: "$", flag: "🇳🇿", rate: 1.22, decimals: 2 },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵", rate: 108, decimals: 0 },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳", rate: 5.36, decimals: 2 },
  { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳", rate: 61.5, decimals: 0 },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", flag: "🇧🇷", rate: 3.70, decimals: 2 },
  { code: "MXN", name: "Mexican Peso", symbol: "$", flag: "🇲🇽", rate: 12.8, decimals: 2 },
  { code: "KRW", name: "South Korean Won", symbol: "₩", flag: "🇰🇷", rate: 985, decimals: 0 },
  { code: "SGD", name: "Singapore Dollar", symbol: "$", flag: "🇸🇬", rate: 0.99, decimals: 2 },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "$", flag: "🇭🇰", rate: 5.78, decimals: 2 },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", flag: "🇸🇪", rate: 7.88, decimals: 2 },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", flag: "🇳🇴", rate: 8.12, decimals: 2 },
  { code: "DKK", name: "Danish Krone", symbol: "kr", flag: "🇩🇰", rate: 5.07, decimals: 2 },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr", flag: "🇨🇭", rate: 0.65, decimals: 2 },
  { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦", rate: 13.6, decimals: 2 },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", flag: "🇦🇪", rate: 2.72, decimals: 2 },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼", flag: "🇸🇦", rate: 2.78, decimals: 2 },
  { code: "THB", name: "Thai Baht", symbol: "฿", flag: "🇹🇭", rate: 25.6, decimals: 0 },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", flag: "🇲🇾", rate: 3.28, decimals: 2 },
  { code: "PHP", name: "Philippine Peso", symbol: "₱", flag: "🇵🇭", rate: 41.2, decimals: 0 },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", flag: "🇮🇩", rate: 11520, decimals: 0 },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫", flag: "🇻🇳", rate: 18400, decimals: 0 },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", flag: "🇹🇷", rate: 23.8, decimals: 2 },
  { code: "PLN", name: "Polish Zloty", symbol: "zł", flag: "🇵🇱", rate: 2.94, decimals: 2 },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč", flag: "🇨🇿", rate: 16.8, decimals: 0 },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft", flag: "🇭🇺", rate: 268, decimals: 0 },
  { code: "RON", name: "Romanian Leu", symbol: "lei", flag: "🇷🇴", rate: 3.38, decimals: 2 },
  { code: "BGN", name: "Bulgarian Lev", symbol: "лв", flag: "🇧🇬", rate: 1.33, decimals: 2 },
  { code: "HRK", name: "Croatian Kuna", symbol: "kn", flag: "🇭🇷", rate: 5.12, decimals: 2 },
  { code: "RSD", name: "Serbian Dinar", symbol: "din", flag: "🇷🇸", rate: 79.5, decimals: 0 },
  { code: "UAH", name: "Ukrainian Hryvnia", symbol: "₴", flag: "🇺🇦", rate: 27.2, decimals: 2 },
  { code: "ILS", name: "Israeli Shekel", symbol: "₪", flag: "🇮🇱", rate: 2.72, decimals: 2 },
  { code: "EGP", name: "Egyptian Pound", symbol: "£", flag: "🇪🇬", rate: 35.2, decimals: 2 },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", flag: "🇳🇬", rate: 1120, decimals: 0 },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", flag: "🇰🇪", rate: 112, decimals: 0 },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "₵", flag: "🇬🇭", rate: 11.2, decimals: 2 },
  { code: "MAD", name: "Moroccan Dirham", symbol: "MAD", flag: "🇲🇦", rate: 7.32, decimals: 2 },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨", flag: "🇵🇰", rate: 206, decimals: 0 },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", flag: "🇧🇩", rate: 81, decimals: 0 },
  { code: "LKR", name: "Sri Lankan Rupee", symbol: "₨", flag: "🇱🇰", rate: 225, decimals: 0 },
  { code: "NPR", name: "Nepalese Rupee", symbol: "₨", flag: "🇳🇵", rate: 98, decimals: 0 },
  { code: "CLP", name: "Chilean Peso", symbol: "$", flag: "🇨🇱", rate: 668, decimals: 0 },
  { code: "COP", name: "Colombian Peso", symbol: "$", flag: "🇨🇴", rate: 2920, decimals: 0 },
  { code: "PEN", name: "Peruvian Sol", symbol: "S/", flag: "🇵🇪", rate: 2.76, decimals: 2 },
  { code: "ARS", name: "Argentine Peso", symbol: "$", flag: "🇦🇷", rate: 645, decimals: 0 },
  { code: "UYU", name: "Uruguayan Peso", symbol: "$U", flag: "🇺🇾", rate: 28.8, decimals: 0 },
  { code: "PYG", name: "Paraguayan Guaraní", symbol: "₲", flag: "🇵🇾", rate: 5380, decimals: 0 },
  { code: "BOB", name: "Bolivian Boliviano", symbol: "Bs", flag: "🇧🇴", rate: 5.12, decimals: 2 },
  { code: "VEF", name: "Venezuelan Bolívar", symbol: "Bs.F", flag: "🇻🇪", rate: 26.8, decimals: 2 },
  { code: "DZD", name: "Algerian Dinar", symbol: "دج", flag: "🇩🇿", rate: 99.5, decimals: 0 },
  { code: "TND", name: "Tunisian Dinar", symbol: "DT", flag: "🇹🇳", rate: 2.30, decimals: 2 },
  { code: "LYD", name: "Libyan Dinar", symbol: "LD", flag: "🇱🇾", rate: 3.56, decimals: 2 },
  { code: "QAR", name: "Qatari Riyal", symbol: "﷼", flag: "🇶🇦", rate: 2.70, decimals: 2 },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك", flag: "🇰🇼", rate: 0.23, decimals: 3 },
  { code: "BHD", name: "Bahraini Dinar", symbol: ".د.ب", flag: "🇧🇭", rate: 0.28, decimals: 3 },
  { code: "OMR", name: "Omani Rial", symbol: "﷼", flag: "🇴🇲", rate: 0.28, decimals: 3 },
  { code: "JOD", name: "Jordanian Dinar", symbol: "JD", flag: "🇯🇴", rate: 0.52, decimals: 3 },
  { code: "LBP", name: "Lebanese Pound", symbol: "£", flag: "🇱🇧", rate: 66200, decimals: 0 },
  { code: "SYP", name: "Syrian Pound", symbol: "£", flag: "🇸🇾", rate: 9340, decimals: 0 },
]

export const POPULAR_CODES = ["CAD", "USD", "GBP", "EUR", "AUD", "JPY"]

const CURRENCY_KEY = "flipt-currency"

export function getSavedCurrency(): string {
  if (typeof window === "undefined") return "CAD"
  return localStorage.getItem(CURRENCY_KEY) || "CAD"
}

export function saveCurrency(code: string): void {
  localStorage.setItem(CURRENCY_KEY, code)
}

export function getCurrency(code: string): Currency {
  return CURRENCIES.find(c => c.code === code) || CURRENCIES[0]
}

/** Convert a CAD amount to target currency */
export function convert(cadAmount: number, targetCode: string): number {
  const c = getCurrency(targetCode)
  return cadAmount * c.rate
}

/** Format a price in the given currency (input is CAD) */
export function formatPrice(cadAmount: number, currencyCode: string): string {
  const c = getCurrency(currencyCode)
  const converted = cadAmount * c.rate
  if (c.decimals === 0) {
    return `${c.symbol}${Math.round(converted).toLocaleString()}`
  }
  return `${c.symbol}${converted.toFixed(c.decimals)}`
}
