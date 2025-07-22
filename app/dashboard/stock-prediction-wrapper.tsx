"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// Dynamically import the StockPredictionClient component with ssr: false
const StockPredictionClient = dynamic(() => import("@/components/stock-prediction-client"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-4 text-lg text-gray-500">Loading stock prediction app...</p>
    </div>
  ),
})

export default function StockPredictionWrapper() {
  return <StockPredictionClient />
}
