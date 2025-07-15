"use client"

import { Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { DailyStockMetrics } from "@/lib/data"
import { Loader2 } from "lucide-react"

interface StockChartProps {
  data: DailyStockMetrics[]
  predictedFutureData?: DailyStockMetrics[]
  isLoading?: boolean // Added isLoading prop
}

export default function StockChart({ data, predictedFutureData, isLoading }: StockChartProps) {
  const chartData = [...data]

  // Append predicted data to chartData, marking them as predictions
  if (predictedFutureData && predictedFutureData.length > 0) {
    predictedFutureData.forEach((p) => {
      chartData.push({
        ...p,
        isPrediction: true, // Custom flag to identify prediction points
      } as DailyStockMetrics & { isPrediction: boolean })
    })
  }

  const chartConfig = {
    close: {
      label: "Price",
      color: "hsl(0 0% 9%)", // Direct HSL for --primary (light mode)
    },
    predicted: {
      label: "Predicted Price",
      color: "hsl(0 84.2% 60.2%)", // Direct HSL for --destructive (light mode)
    },
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4 flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-gray-500">Loading chart data...</p>
        </CardContent>
      </Card>
    )
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-4 flex items-center justify-center min-h-[300px]">
          <p className="text-xl text-gray-500 dark:text-gray-400">No data to display for the chart.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value, index) => {
                  if (chartData.length > 20) {
                    return index % 5 === 0 ? value : ""
                  }
                  return value
                }}
              />
              <YAxis domain={["dataMin - 10", "dataMax + 10"]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="close"
                stroke="var(--color-close)"
                name="Historical Price"
                dot={({ index, payload }) => {
                  if (payload.isPrediction && index === data.length) {
                    return (
                      <circle
                        cx={payload.cx}
                        cy={payload.cy}
                        r={6}
                        fill="var(--color-predicted)"
                        stroke="var(--color-predicted)"
                        strokeWidth={2}
                      />
                    )
                  }
                  return null
                }}
              />
              {predictedFutureData && predictedFutureData.length > 0 && (
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="var(--color-predicted)"
                  name="Predicted Price"
                  dot={false}
                  activeDot={false}
                  data={chartData.filter((d, index) => index >= data.length - 1)}
                  strokeDasharray="5 5"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
