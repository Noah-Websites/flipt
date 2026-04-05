"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { getSavedCurrency, saveCurrency, getCurrency, formatPrice as fmt, type Currency } from "../lib/currency"

interface CurrencyContextType {
  currency: Currency
  currencyCode: string
  setCurrencyCode: (code: string) => void
  formatPrice: (cadAmount: number) => string
  symbol: string
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: getCurrency("CAD"),
  currencyCode: "CAD",
  setCurrencyCode: () => {},
  formatPrice: (n) => `$${n}`,
  symbol: "$",
})

export function useCurrency() {
  return useContext(CurrencyContext)
}

export default function CurrencyProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState("CAD")

  useEffect(() => {
    setCode(getSavedCurrency())
  }, [])

  const setCurrencyCode = useCallback((newCode: string) => {
    setCode(newCode)
    saveCurrency(newCode)
  }, [])

  const currency = getCurrency(code)

  const formatPriceFn = useCallback((cadAmount: number) => {
    return fmt(cadAmount, code)
  }, [code])

  return (
    <CurrencyContext value={{
      currency,
      currencyCode: code,
      setCurrencyCode,
      formatPrice: formatPriceFn,
      symbol: currency.symbol,
    }}>
      {children}
    </CurrencyContext>
  )
}
