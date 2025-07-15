import * as brain from "brain.js"
import { denormalizeValue, normalizeValue, type DailyStockMetrics, type MinMaxValues } from "./data"

// Define the type for the trained network
type BrainNetwork = brain.NeuralNetwork<number[], number[]>

interface TrainOptions {
  iterations?: number
  errorThresh?: number
  log?: boolean
  logPeriod?: number
}

/**
 * Trains a Brain.js feedforward neural network.
 * @param trainingData An array of { input: number[], output: number[] } for training.
 * @param options Training options for Brain.js.
 * @returns The trained neural network.
 */
export function trainModel(
  trainingData: { input: number[]; output: number[] }[],
  options?: TrainOptions,
): BrainNetwork {
  const net = new brain.NeuralNetwork()
  net.train(trainingData, {
    iterations: options?.iterations || 20000, // Increase iterations for better training
    errorThresh: options?.errorThresh || 0.005,
    log: options?.log || false,
    logPeriod: options?.logPeriod || 1000,
    // Other options like learningRate, momentum can be added
  })
  return net
}

/**
 * Predicts the next stock price using the trained network.
 * @param net The trained Brain.js neural network.
 * @param lastWindowData The last 'windowSize' historical metrics (normalized and flattened).
 * @param minClose The minimum close price from the original dataset for denormalization.
 * @param maxClose The maximum close price from the original dataset for denormalization.
 * @returns The denormalized predicted close price.
 */
export function predictNextPrice(
  net: BrainNetwork,
  lastWindowData: number[],
  minClose: number,
  maxClose: number,
): number {
  const normalizedPrediction = net.run(lastWindowData)[0]
  return denormalizeValue(normalizedPrediction, minClose, maxClose)
}

/**
 * Predicts future stock prices for multiple days using a rolling forecast.
 * @param net The trained Brain.js neural network.
 * @param initialLastWindow The last 'windowSize' historical DailyStockMetrics objects.
 * @param minMax The min/max values for all metrics from the original dataset.
 * @param windowSize The number of days in the input window for the neural network.
 * @param numDaysToPredict The number of future days to predict.
 * @returns An array of predicted DailyStockMetrics objects for future days.
 */
export function predictFuturePrices(
  net: BrainNetwork,
  initialLastWindow: DailyStockMetrics[],
  minMax: MinMaxValues,
  windowSize: number,
  numDaysToPredict: number,
): DailyStockMetrics[] {
  const predictedData: DailyStockMetrics[] = []
  const currentWindow: DailyStockMetrics[] = [...initialLastWindow]

  for (let i = 0; i < numDaysToPredict; i++) {
    // 1. Prepare the input for the current prediction
    const inputForPrediction: number[] = []
    for (const dayData of currentWindow) {
      inputForPrediction.push(normalizeValue(dayData.open, minMax.open.min, minMax.open.max))
      inputForPrediction.push(normalizeValue(dayData.high, minMax.high.min, minMax.high.max))
      inputForPrediction.push(normalizeValue(dayData.low, minMax.low.min, minMax.low.max))
      inputForPrediction.push(normalizeValue(dayData.close, minMax.close.min, minMax.close.max))
      inputForPrediction.push(normalizeValue(dayData.volume, minMax.volume.min, minMax.volume.max))
    }

    // 2. Get the normalized prediction for the next day's close price
    const normalizedPredictedClose = net.run(inputForPrediction)[0]
    const denormalizedPredictedClose = denormalizeValue(normalizedPredictedClose, minMax.close.min, minMax.close.max)

    // 3. Calculate the date for the predicted day
    const lastDateInWindow = new Date(currentWindow[currentWindow.length - 1].date)
    lastDateInWindow.setDate(lastDateInWindow.getDate() + 1)
    const predictedDate = lastDateInWindow.toISOString().split("T")[0]

    // 4. Create a "simulated" DailyStockMetrics object for the predicted day
    // For simplicity, we'll use the predicted close for open, high, low, and the last known volume.
    // In a real-world scenario, these might be predicted separately or derived more complexly.
    const simulatedPredictedDay: DailyStockMetrics = {
      date: predictedDate,
      open: denormalizedPredictedClose, // Simplified: use predicted close for open
      high: denormalizedPredictedClose * 1.005, // Simplified: slightly higher than close
      low: denormalizedPredictedClose * 0.995, // Simplified: slightly lower than close
      close: denormalizedPredictedClose,
      volume: currentWindow[currentWindow.length - 1].volume, // Simplified: use last known volume
    }

    // 5. Add the predicted day to the results
    predictedData.push(simulatedPredictedDay)

    // 6. Update the current window for the next iteration (rolling forecast)
    currentWindow.shift() // Remove the oldest day
    currentWindow.push(simulatedPredictedDay) // Add the newly predicted day
  }

  return predictedData
}
