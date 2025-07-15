import dynamic from "next/dynamic"

// Import the heavy client component **only in the browser**
const StockPredictionClient = dynamic(() => import("@/components/stock-prediction-client"), { ssr: false })

export default function Page() {
  return <StockPredictionClient />
}
