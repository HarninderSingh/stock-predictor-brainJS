"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fetchHistoricalData, getMinMaxValues, prepareTrainingData, type DailyStockMetrics } from "@/lib/data"
import { trainModel, predictFuturePrices } from "@/lib/predictor" // Changed import to predictFuturePrices
import StockChart from "@/components/stock-chart"
import { Loader2 } from "lucide-react"

export default function StockPredictionApp() {
  const [symbol, setSymbol] = useState("AAPL") // Default stock symbol
  const [historicalData, setHistoricalData] = useState<DailyStockMetrics[]>([])
  const [predictedFutureData, setPredictedFutureData] = useState<DailyStockMetrics[]>([]) // Changed state
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isPredicting, setIsPredicting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Define the window size for the neural network input
  const WINDOW_SIZE = 5 // Predict next price based on the last 5 days' metrics
  const NUM_DAYS_TO_PREDICT = 5 // Predict prices for the next 5 days

  // fetchDataAndPredict now takes the symbol as an argument
  const fetchDataAndPredict = useCallback(
    async (currentSymbol: string) => {
      setError(null)
      setIsLoadingData(true)
      setPredictedFutureData([]) // Reset predictions
      setHistoricalData([])

      try {
        const data = await fetchHistoricalData(currentSymbol) // Use currentSymbol argument
        if (data.length < WINDOW_SIZE + NUM_DAYS_TO_PREDICT) {
          setError(
            `Not enough historical data (${data.length} points) for ${currentSymbol} with a window size of ${WINDOW_SIZE} and ${NUM_DAYS_TO_PREDICT} future predictions. Need at least ${
              WINDOW_SIZE + NUM_DAYS_TO_PREDICT
            } points.`,
          )
          setIsLoadingData(false)
          return
        }
        setHistoricalData(data)
        setIsLoadingData(false)
        await handlePredict(data)
      } catch (err: any) {
        setError(err.message || "An unknown error occurred while fetching data.")
        setIsLoadingData(false)
      }
    },
    [WINDOW_SIZE, NUM_DAYS_TO_PREDICT],
  )

  const handlePredict = useCallback(
    async (dataToPredict: DailyStockMetrics[]) => {
      if (dataToPredict.length < WINDOW_SIZE + 1) {
        setError(
          `Not enough data points (${dataToPredict.length}) for the given window size (${WINDOW_SIZE}) to train the model.`,
        )
        return
      }

      setIsPredicting(true)
      setPredictedFutureData([]) // Clear previous predictions

      const currentMinMax = getMinMaxValues(dataToPredict)

      const trainingData = prepareTrainingData(dataToPredict, WINDOW_SIZE, currentMinMax)

      await new Promise((resolve) => setTimeout(resolve, 100)) // UI breath

      const net = trainModel(trainingData, { iterations: 5000, log: false })

      const lastHistoricalWindow = dataToPredict.slice(-WINDOW_SIZE)

      const futurePredictions = predictFuturePrices(
        net,
        lastHistoricalWindow,
        currentMinMax,
        WINDOW_SIZE,
        NUM_DAYS_TO_PREDICT,
      )

      setPredictedFutureData(futurePredictions)
      setIsPredicting(false)
    },
    [WINDOW_SIZE, NUM_DAYS_TO_PREDICT],
  )

  // This useEffect now runs ONLY ONCE on component mount for the initial data fetch.
  // It uses the initial 'symbol' state.
  useEffect(() => {
    fetchDataAndPredict(symbol)
  }, []) // Empty dependency array: runs only once on mount

  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSymbol(e.target.value.toUpperCase())
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // This is the ONLY place where fetchDataAndPredict is called after initial mount,
    // ensuring search only happens on explicit submission.
    fetchDataAndPredict(symbol)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Stock Price Predictor</CardTitle>
          <CardDescription>
            Predicting the next {NUM_DAYS_TO_PREDICT} days' stock prices using Brain.js and Twelve Data API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleFormSubmit} className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <Label htmlFor="symbol-input" className="sr-only">
                Stock Symbol
              </Label>
              <Input
                id="symbol-input"
                type="text"
                placeholder="Enter stock symbol (e.g., AAPL)"
                value={symbol}
                onChange={handleSymbolChange}
                className="w-full"
                disabled={isLoadingData || isPredicting}
              />
            </div>
            <Button type="submit" disabled={isLoadingData || isPredicting}>
              {isLoadingData ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching Data...
                </>
              ) : (
                "Fetch & Predict"
              )}
            </Button>
          </form>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
              <p className="font-bold">Error:</p>
              <p>{error}</p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Historical Data</CardTitle>
                <CardDescription>Last few historical prices used for prediction.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <div className="flex items-center justify-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : historicalData.length > 0 ? (
                  <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 max-h-40 overflow-y-auto">
                    {historicalData.slice(-WINDOW_SIZE).map((d, index) => (
                      <li key={index}>
                        {d.date}: Close ${d.close.toFixed(2)} (Vol: {d.volume})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No historical data loaded.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Predicted Prices ({NUM_DAYS_TO_PREDICT} Days)</CardTitle>
                <CardDescription>The predicted close prices for the next trading days.</CardDescription>
              </CardHeader>
              <CardContent>
                {isPredicting ? (
                  <div className="flex items-center justify-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : predictedFutureData.length > 0 ? (
                  <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 max-h-40 overflow-y-auto">
                    {predictedFutureData.map((p, index) => (
                      <li key={index}>
                        {p.date}: ${p.close.toFixed(2)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xl text-gray-500 dark:text-gray-400">
                    {historicalData.length > 0
                      ? 'Click "Fetch & Predict" to see predictions.'
                      : "Enter a symbol and fetch data."}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {historicalData.length > 0 && (
            <StockChart
              data={historicalData}
              predictedFutureData={predictedFutureData} // Pass the array of future data
            />
          )}
        </CardContent>
      </Card>
    </main>
  )
}
