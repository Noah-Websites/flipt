import type { Metadata } from "next"
import "./globals.css"
import ThemeProvider from "./components/ThemeProvider"
import AuthProvider from "./components/AuthProvider"
import AppShell from "./components/AppShell"
import BottomNav from "./components/BottomNav"
import Footer from "./components/Footer"
import CurrencyProvider from "./components/CurrencyProvider"
import SmoothScroll from "./components/SmoothScroll"

export const metadata: Metadata = {
  title: "Flipt — Turn Clutter into Cash",
  description: "Snap a photo, get instant pricing, and a ready-to-post listing.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
          <CurrencyProvider>
          <AppShell>
            <SmoothScroll />
            {children}
            <Footer />
            <BottomNav />
          </AppShell>
          </CurrencyProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
