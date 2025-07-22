import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { NavBar } from "@/components/nav-bar"
import AuthProvider from "@/components/auth-provider" // Import the new AuthProvider

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
        <AuthProvider>
          {" "}
          {/* Wrap children with AuthProvider */}
          <NavBar />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
