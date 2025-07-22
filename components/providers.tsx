"use client"

import type * as React from "react"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

/**
 * Global providers for Session (next-auth), Theme (next-themes) and Toasts.
 * Wraps the entire app in app/layout.tsx
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
        <Toaster />
      </ThemeProvider>
    </SessionProvider>
  )
}
