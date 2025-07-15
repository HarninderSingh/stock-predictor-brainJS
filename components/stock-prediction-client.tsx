"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchHistoricalData, getMinMaxValues, prepareTrainingData, type DailyStockMetrics } from "@/lib/data"
import { trainModel, predictFuturePrices } from "@/lib/predictor"
import StockChart from "@/components/stock-chart"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export default function StockPredictionClient() {
  const [symbol, setSymbol] = useState("AAPL")
  const [historicalData, setHistoricalData] = useState<DailyStockMetrics[]>([])
  const [predictedFutureData, setPredictedFutureData] = useState<DailyStockMetrics[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isPredicting, setIsPredicting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const WINDOW_SIZE = 5
  const NUM_DAYS_TO_PREDICT = 5

  const fetchDataAndPredict = useCallback(
    async (currentSymbol: string) => {
      setError(null)
      setIsLoadingData(true)
      setPredictedFutureData([])
      setHistoricalData([])

      try {
        const data = await fetchHistoricalData(currentSymbol)
        if (data.length < WINDOW_SIZE + NUM_DAYS_TO_PREDICT) {
          setError(`Need at least ${WINDOW_SIZE + NUM_DAYS_TO_PREDICT} data points, received ${data.length}.`)
          setIsLoadingData(false)
          return
        }
        setHistoricalData(data)
        setIsLoadingData(false)
        await handlePredict(data)
      } catch (err: any) {
        setError(err.message || "Unknown error while fetching data")
        setIsLoadingData(false)
      }
    },
    [WINDOW_SIZE, NUM_DAYS_TO_PREDICT],
  )

  const handlePredict = useCallback(
    async (dataToPredict: DailyStockMetrics[]) => {
      if (dataToPredict.length < WINDOW_SIZE + 1) {
        setError(`Not enough data points (${dataToPredict.length}) for window size (${WINDOW_SIZE}).`)
        return
      }

      setIsPredicting(true)
      setPredictedFutureData([])

      const minMax = getMinMaxValues(dataToPredict)
      const trainingData = prepareTrainingData(dataToPredict, WINDOW_SIZE, minMax)
      const net = await trainModel(trainingData)

      const lastWindow = dataToPredict.slice(-WINDOW_SIZE)
      const future = predictFuturePrices(net, lastWindow, minMax, WINDOW_SIZE, NUM_DAYS_TO_PREDICT)

      setPredictedFutureData(future)
      setIsPredicting(false)
    },
    [WINDOW_SIZE, NUM_DAYS_TO_PREDICT],
  )

  useEffect(() => {
    fetchDataAndPredict(symbol)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Stock Price Predictor</CardTitle>
          <CardDescription>Predict the next {NUM_DAYS_TO_PREDICT} days using Brain.js & Twelve Data.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              fetchDataAndPredict(symbol)
            }}
            className="flex flex-col md:flex-row items-center gap-4"
          >
            <div className="flex-1 w-full">
              <Label htmlFor="symbol-input" className="sr-only">
                Stock Symbol
              </Label>
              <Input
                id="symbol-input"
                placeholder="e.g., AAPL"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                disabled={isLoadingData || isPredicting}
              />
            </div>
            <Button type="submit" disabled={isLoadingData || isPredicting}>
              {isLoadingData ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching…
                </>
              ) : (
                "Fetch & Predict"
              )}
            </Button>
          </form>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {/* Historical Data */}
            <Card>
              <CardHeader>
                <CardTitle>Historical Data</CardTitle>
                <CardDescription>Last {WINDOW_SIZE} closes.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <div className="flex items-center justify-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <ul className="list-disc pl-5 text-sm max-h-40 overflow-y-auto">
                    {historicalData.slice(-WINDOW_SIZE).map(({ date, close, volume }) => (
                      <li key={date}>
                        {date}: ${close.toFixed(2)} (Vol: {volume})
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Predicted Data */}
            <Card>
              <CardHeader>
                <CardTitle>Predicted Prices</CardTitle>
                <CardDescription>Next {NUM_DAYS_TO_PREDICT} trading days.</CardDescription>
              </CardHeader>
              <CardContent>
                {isPredicting ? (
                  <div className="flex items-center justify-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <ul className="list-disc pl-5 text-sm max-h-40 overflow-y-auto">
                    {predictedFutureData.map(({ date, close }) => (
                      <li key={date}>
                        {date}: ${close.toFixed(2)}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <StockChart
            data={historicalData}
            predictedFutureData={predictedFutureData}
            isLoading={isLoadingData || isPredicting}
          />
        </CardContent>
      </Card>
    </main>
  )
}
