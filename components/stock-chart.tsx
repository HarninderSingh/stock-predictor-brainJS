"use client"

import { Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { DailyStockMetrics } from "@/lib/data"

interface StockChartProps {
  data: DailyStockMetrics[]
  predictedFutureData?: DailyStockMetrics[] // Changed to an array of DailyStockMetrics
}

export default function StockChart({ data, predictedFutureData }: StockChartProps) {
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
      color: "hsl(var(--primary))",
    },
    predicted: {
      label: "Predicted Price",
      color: "hsl(var(--destructive))",
    },
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
                  // Show fewer labels for readability if many data points
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
                  // Only show dots for historical data, or special dot for first prediction
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
                  dot={false} // No dots for the predicted line itself
                  activeDot={false}
                  // Filter data to only include the last historical point and all predicted points
                  data={chartData.filter((d, index) => index >= data.length - 1)}
                  strokeDasharray="5 5" // Dashed line for prediction
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
