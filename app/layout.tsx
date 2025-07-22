import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "@/components/providers" // Re-import Providers
import { NavBar } from "@/components/nav-bar"

export const metadata: Metadata = {
  title: "Stock Price Predictor",
  description: "Predict stock prices with AI and manage your portfolio.",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <NavBar />
          {children}
        </Providers>
      </body>
    </html>
  )
}
