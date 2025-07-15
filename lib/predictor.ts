"use client"

import type { NeuralNetwork } from "brain.js"
import { normalizeValue, denormalizeValue, type DailyStockMetrics, type MinMaxValues } from "./data"

/**
 * Dynamically load brain.js on the client and train the network.
 * This keeps brain.js out of the SSR / build pipeline so the native
 * GPU bindings are never required on the server.
 */
let brain: typeof import("brain.js") | null = null

async function getBrainJs() {
  if (!brain) {
    brain = await import("brain.js")
  }
  return brain
}

export async function trainModel(
  trainingData: { input: number[]; output: number[] }[],
  options?: { iterations?: number; log?: boolean },
): Promise<NeuralNetwork> {
  const brainJs = await getBrainJs()
  const net = new brainJs.NeuralNetwork()

  net.train(trainingData, {
    iterations: options?.iterations || 2000,
    log: options?.log || false,
    logPeriod: 100,
    errorThresh: 0.005,
  })

  return net
}

export function predictNextPrice(
  net: NeuralNetwork,
  inputWindow: number[],
  minClose: number,
  maxClose: number,
): number {
  const output = net.run(inputWindow)
  return denormalizeValue(output[0], minClose, maxClose)
}

export function predictFuturePrices(
  net: NeuralNetwork,
  lastHistoricalWindow: DailyStockMetrics[], // Last N historical days (actual data)
  minMax: MinMaxValues,
  windowSize: number,
  numDaysToPredict: number,
): DailyStockMetrics[] {
  const futurePredictions: DailyStockMetrics[] = []
  const currentWindow = [...lastHistoricalWindow] // Start with the last historical window

  for (let i = 0; i < numDaysToPredict; i++) {
    // 1. Prepare input for the current prediction
    const inputForPrediction: number[] = []
    for (const day of currentWindow) {
      inputForPrediction.push(normalizeValue(day.open, minMax.open.min, minMax.open.max))
      inputForPrediction.push(normalizeValue(day.high, minMax.high.min, minMax.high.max))
      inputForPrediction.push(normalizeValue(day.low, minMax.low.min, minMax.low.max))
      inputForPrediction.push(normalizeValue(day.close, minMax.close.min, minMax.close.max))
      inputForPrediction.push(normalizeValue(day.volume, minMax.volume.min, minMax.volume.max))
    }

    // 2. Get the prediction
    const normalizedPrediction = net.run(inputForPrediction)[0]
    const predictedClose = denormalizeValue(normalizedPrediction, minMax.close.min, minMax.close.max)

    // 3. Determine the date for the predicted day
    const lastDateInWindow = new Date(currentWindow[currentWindow.length - 1].date)
    lastDateInWindow.setDate(lastDateInWindow.getDate() + 1)
    const predictedDate = lastDateInWindow.toISOString().split("T")[0]

    // 4. Create a simulated DailyStockMetrics object for the predicted day
    // For simplicity, we'll use the predicted close for open, high, low,
    // and the volume from the last actual historical day.
    const lastActualHistoricalDay = lastHistoricalWindow[lastHistoricalWindow.length - 1]
    const simulatedPredictedDay: DailyStockMetrics = {
      date: predictedDate,
      open: predictedClose, // Simplified: use predicted close for open
      high: predictedClose * 1.005, // Simplified: slightly higher than close
      low: predictedClose * 0.995, // Simplified: slightly lower than close
      close: predictedClose,
      volume: lastActualHistoricalDay ? lastActualHistoricalDay.volume : 0, // Use last historical volume
    }

    futurePredictions.push(simulatedPredictedDay)

    // 5. Update the currentWindow for the next iteration (rolling forecast)
    currentWindow.shift() // Remove the oldest day
    currentWindow.push(simulatedPredictedDay) // Add the newly predicted day
  }

  return futurePredictions
}
