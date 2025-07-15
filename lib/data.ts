export interface DailyStockMetrics {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface MinMaxValues {
  open: { min: number; max: number }
  high: { min: number; max: number }
  low: { min: number; max: number }
  close: { min: number; max: number }
  volume: { min: number; max: number }
}

// Calculate min and max for each metric
export function getMinMaxValues(data: DailyStockMetrics[]): MinMaxValues {
  if (data.length === 0) {
    return {
      open: { min: 0, max: 1 },
      high: { min: 0, max: 1 },
      low: { min: 0, max: 1 },
      close: { min: 0, max: 1 },
      volume: { min: 0, max: 1 },
    }
  }

  const opens = data.map((d) => d.open)
  const highs = data.map((d) => d.high)
  const lows = data.map((d) => d.low)
  const closes = data.map((d) => d.close)
  const volumes = data.map((d) => d.volume)

  return {
    open: { min: Math.min(...opens), max: Math.max(...opens) },
    high: { min: Math.min(...highs), max: Math.max(...highs) },
    low: { min: Math.min(...lows), max: Math.max(...lows) },
    close: { min: Math.min(...closes), max: Math.max(...closes) },
    volume: { min: Math.min(...volumes), max: Math.max(...volumes) },
  }
}

// Normalize a value to a 0-1 range
export function normalizeValue(value: number, min: number, max: number): number {
  if (max === min) return 0.5 // Avoid division by zero
  return (value - min) / (max - min)
}

// Denormalize a value from a 0-1 range back to its original scale
export function denormalizeValue(normalizedValue: number, min: number, max: number): number {
  return normalizedValue * (max - min) + min
}

// Prepare data for Brain.js training
// Input: windowSize previous days' metrics (flattened array)
// Output: the next day's normalized close price
export function prepareTrainingData(
  data: DailyStockMetrics[],
  windowSize: number,
  minMax: MinMaxValues,
): { input: number[]; output: number[] }[] {
  const trainingData: { input: number[]; output: number[] }[] = []

  if (data.length < windowSize + 1) {
    console.warn("Not enough data points for the given window size to prepare training data.")
    return []
  }

  for (let i = 0; i <= data.length - windowSize - 1; i++) {
    const inputWindow: number[] = []
    for (let j = 0; j < windowSize; j++) {
      const dayData = data[i + j]
      inputWindow.push(normalizeValue(dayData.open, minMax.open.min, minMax.open.max))
      inputWindow.push(normalizeValue(dayData.high, minMax.high.min, minMax.high.max))
      inputWindow.push(normalizeValue(dayData.low, minMax.low.min, minMax.low.max))
      inputWindow.push(normalizeValue(dayData.close, minMax.close.min, minMax.close.max))
      inputWindow.push(normalizeValue(dayData.volume, minMax.volume.min, minMax.volume.max))
    }

    const outputClosePrice = normalizeValue(data[i + windowSize].close, minMax.close.min, minMax.close.max)
    trainingData.push({
      input: inputWindow,
      output: [outputClosePrice], // Output is an array for Brain.js
    })
  }
  return trainingData
}

/**
 * Fetches historical stock data from Twelve Data API.
 * @param symbol The stock symbol (e.g., "AAPL").
 * @param interval The time interval (e.g., "1day", "1hour").
 * @param outputsize The number of data points to retrieve.
 * @returns A promise that resolves to an array of DailyStockMetrics.
 */
export async function fetchHistoricalData(
  symbol: string,
  interval = "1day",
  outputsize = 100,
): Promise<DailyStockMetrics[]> {
  // 🔒 1)  <<<  PUT YOUR REAL TWELVE DATA API KEY BETWEEN THE QUOTES  >>>
  const apiKey = "6761a943dc1b49fc9fcfe031f4f1ad78"

  if (!apiKey) {
    throw new Error("A valid Twelve Data API key is required. Edit lib/data.ts and set the apiKey constant.")
  }

  const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(
    symbol,
  )}&interval=${interval}&outputsize=${outputsize}&apikey=${apiKey}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(
        `Failed to fetch data: ${response.status} ${response.statusText} - ${errorData.message || "Unknown error"}`,
      )
    }
    const data = await response.json()

    if (!data || !data.values || data.status === "error") {
      throw new Error(data.message || "Invalid data received from Twelve Data API.")
    }

    // Twelve Data returns data in reverse chronological order, so reverse it
    const historicalData = data.values.reverse().map((item: any) => ({
      date: item.datetime,
      open: Number.parseFloat(item.open),
      high: Number.parseFloat(item.high),
      low: Number.parseFloat(item.low),
      close: Number.parseFloat(item.close),
      volume: Number.parseFloat(item.volume),
    }))

    return historicalData
  } catch (error) {
    console.error("Error fetching historical data:", error)
    throw error // Re-throw to be caught by the component
  }
}
