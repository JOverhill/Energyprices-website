import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { useEffect, useState } from 'react'
import { 
  fetchEnergyPrices, 
  parseEnergyPrices, 
  get15MinutePrices, 
  getHourlyAveragePrices,
  type PricePoint,
  type HourlyPricePoint 
} from "../services/api"
import { Button } from './Button'
import { useAuth } from '../context/AuthContext'
import './MainSection.css'

type ViewMode = '15min' | 'hourly'

export const MainSection = () => {
  const [rawData, setRawData] = useState<unknown>(null)
  const [fifteenMinData, setFifteenMinData] = useState<PricePoint[]>([])
  const [hourlyData, setHourlyData] = useState<HourlyPricePoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('hourly')
  const [priceMetadata, setPriceMetadata] = useState<{ currency: string; unit: string } | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const result = await fetchEnergyPrices()
        setRawData(result)
        
        // Parse and transform the data
        const parsed = parseEnergyPrices(result)
        const fifteenMin = get15MinutePrices(parsed)
        const hourly = getHourlyAveragePrices(parsed)
        
        setFifteenMinData(fifteenMin)
        setHourlyData(hourly)
        setPriceMetadata({ currency: parsed.currency, unit: parsed.unit })
        setExportError(null)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
        setRawData(null)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleString('fi-FI', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    })
  }

  // Convert EUR/MWh to cents/kWh
  // 1 EUR/MWh = 0.1 cents/kWh (divide by 10)
  // Always includes 25.5% VAT (Finland)
  const convertToCentsPerKwh = (eurPerMwh: number) => {
    const centsPerKwh = eurPerMwh / 10
    const withVAT = centsPerKwh * 1.255
    return withVAT.toFixed(2)
  }

  const formatDateTimeForCsv = (date: Date) => {
    return date.toLocaleString('fi-FI', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const canExport = viewMode === 'hourly'
    ? hourlyData.length > 0
    : fifteenMinData.length > 0

  const handleExport = async () => {
    // Check authentication first
    if (!user) {
      setExportError('Kirjaudu sisään ladataksesi tiedot')
      setTimeout(() => setExportError(null), 5000) // Reset error popup after 5 seconds
      return
    }

    if (!canExport) {
      return
    }

    try {
      setExportError(null)
      setExporting(true)

      const metadata = priceMetadata ?? { currency: 'EUR', unit: 'MWH' }
      const timestampSuffix = new Date().toISOString().slice(0, 10)

      const rows = viewMode === 'hourly'
        ? hourlyData.map(point => ({
            timestampISO: point.timestamp.toISOString(),
            timestampLocal: formatDateTimeForCsv(point.timestamp),
            hour: point.hour,
            averagePriceEurPerMwh: point.averagePrice.toFixed(2),
            averagePriceCentsPerKwhVAT: convertToCentsPerKwh(point.averagePrice),
            minPriceEurPerMwh: point.minPrice.toFixed(2),
            minPriceCentsPerKwhVAT: convertToCentsPerKwh(point.minPrice),
            maxPriceEurPerMwh: point.maxPrice.toFixed(2),
            maxPriceCentsPerKwhVAT: convertToCentsPerKwh(point.maxPrice),
            quarterlyPricesEurPerMwh: point.quarterlyPrices.map(price => price.toFixed(2)).join('|'),
            currency: metadata.currency,
            unit: metadata.unit
          }))
        : fifteenMinData.map(point => ({
            timestampISO: point.timestamp.toISOString(),
            timestampLocal: formatDateTimeForCsv(point.timestamp),
            priceEurPerMwh: point.price.toFixed(2),
            priceCentsPerKwhVAT: convertToCentsPerKwh(point.price),
            currency: metadata.currency,
            unit: metadata.unit
          }))

      const headers = viewMode === 'hourly'
        ? [
            'timestampISO',
            'timestampLocal',
            'hour',
            'averagePriceEurPerMwh',
            'averagePriceCentsPerKwhVAT',
            'minPriceEurPerMwh',
            'minPriceCentsPerKwhVAT',
            'maxPriceEurPerMwh',
            'maxPriceCentsPerKwhVAT',
            'quarterlyPricesEurPerMwh',
            'currency',
            'unit'
          ]
        : [
            'timestampISO',
            'timestampLocal',
            'priceEurPerMwh',
            'priceCentsPerKwhVAT',
            'currency',
            'unit'
          ]

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          viewMode,
          headers,
          rows,
          filename: `energy-prices-${viewMode}-${timestampSuffix}.csv`
        })
      })

      if (!response.ok) {
        throw new Error(`Export failed (${response.status})`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `energy-prices-${viewMode}-${timestampSuffix}.csv`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(url)
    } catch (exportErr) {
      setExportError(exportErr instanceof Error ? exportErr.message : 'CSV export failed')
    } finally {
      setExporting(false)
    }
  }

  // Get the current price based on view mode
  const getCurrentPrice = () => {
    const now = new Date()
    
    if (viewMode === 'hourly') {
      if (hourlyData.length === 0) return null
      
      // Find the price for the current hour
      const currentHour = new Date(now)
      currentHour.setMinutes(0, 0, 0)
      
      // Find the hourly price point that starts at or before this hour
      let activePoint = hourlyData[0]
      
      for (const point of hourlyData) {
        if (point.timestamp <= currentHour) {
          activePoint = point
        } else {
          break
        }
      }
      
      return { price: activePoint.averagePrice, timestamp: activePoint.timestamp }
    } else {
      if (fifteenMinData.length === 0) return null
      
      // Find the price for the current 15-minute interval
      // Round down current time to the nearest 15-minute mark
      const currentMinutes = now.getMinutes()
      const roundedMinutes = Math.floor(currentMinutes / 15) * 15
      const currentInterval = new Date(now)
      currentInterval.setMinutes(roundedMinutes, 0, 0)
      
      // Find the price point that starts at or before this interval
      let activePoint = fifteenMinData[0]
      
      for (const point of fifteenMinData) {
        if (point.timestamp <= currentInterval) {
          activePoint = point
        } else {
          break
        }
      }
      
      return activePoint
    }
  }

  const currentPrice = getCurrentPrice()

  // Prepare chart data
  const getChartData = () => {
    const data = viewMode === 'hourly' ? hourlyData : fifteenMinData
    
    // Check if data spans multiple days
    const hasMultipleDays = data.length > 0 && (() => {
      const firstDate = data[0].timestamp.toDateString()
      return data.some(point => point.timestamp.toDateString() !== firstDate)
    })()

    if (viewMode === 'hourly') {
      return hourlyData.map(point => {
        const price = point.averagePrice / 10 * 1.255
        const timeFormat = hasMultipleDays
          ? point.timestamp.toLocaleString('fi-FI', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
          : point.timestamp.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit', hour12: false })
        return {
          time: timeFormat,
          price: parseFloat(price.toFixed(2)),
          timestamp: point.timestamp
        }
      })
    } else {
      return fifteenMinData.map(point => {
        const price = point.price / 10 * 1.255
        const timeFormat = hasMultipleDays
          ? point.timestamp.toLocaleString('fi-FI', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
          : point.timestamp.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit', hour12: false })
        return {
          time: timeFormat,
          price: parseFloat(price.toFixed(2)),
          timestamp: point.timestamp
        }
      })
    }
  }

  const chartData = getChartData()

  // Check if a timestamp is the current active period
  const isCurrentPeriod = (timestamp: Date): boolean => {
    const now = new Date()
    
    if (viewMode === 'hourly') {
      const currentHour = new Date(now)
      currentHour.setMinutes(0, 0, 0)
      
      return timestamp.getTime() === currentHour.getTime()
    } else {
      const currentMinutes = now.getMinutes()
      const roundedMinutes = Math.floor(currentMinutes / 15) * 15
      const currentInterval = new Date(now)
      currentInterval.setMinutes(roundedMinutes, 0, 0)
      
      return timestamp.getTime() === currentInterval.getTime()
    }
  }

  // Get color based on price (green for low, yellow for medium, red for high)
  const getBarColor = (price: number) => {
    const prices = chartData.map(d => d.price)
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
    
    if (price < avgPrice * 0.8) return '#4ade80' // green
    if (price < avgPrice * 1.2) return '#fbbf24' // yellow
    return '#f87171' // red
  }

  return (
    <main className="main-section">
      <h2>Sähkön hinta tänään {new Date().toLocaleDateString('fi-FI')}</h2>
      
      {loading && <p className="loading-text">Loading...</p>}
      {error && <p className="error-text">Error: {error}</p>}
      
      {!loading && !error && (
        <>
          <div className="controls">
            <div className="view-toggle">
              <Button
                variant="outline"
                active={viewMode === 'hourly'}
                onClick={() => setViewMode('hourly')}
                aria-pressed={viewMode === 'hourly'}
              >
                Tuntihinta
              </Button>
              <Button
                variant="outline"
                active={viewMode === '15min'}
                onClick={() => setViewMode('15min')}
                aria-pressed={viewMode === '15min'}
              >
                Varttihinta
              </Button>
            </div>

            <Button
              onClick={handleExport}
              disabled={!canExport || exporting}
              title="Lataa näkyvä hintadata CSV-muodossa"
            >
              {exporting ? 'Luodaan CSV…' : 'Lataa CSV'}
            </Button>

            {currentPrice && (
              <div className="current-price-badge">
                💡 Sähkön hinta nyt: {convertToCentsPerKwh(currentPrice.price)} snt/kWh{' '}
                <span className="current-price-vat">(sis. ALV 25.5%)</span>
              </div>
            )}
          </div>

          {exportError && (
            <div className="export-error">
              <span className="export-error-icon">⚠️</span>
              {exportError}
            </div>
          )}

          {/* Bar Chart */}
          <div className="chart-container">
            <h3 className="chart-title">
              {viewMode === 'hourly' ? 'Sähkön tuntihinta' : 'Sähkön varttihinta'}
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="time" 
                  stroke="#aaa"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval="preserveStartEnd"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="#aaa"
                  label={{ value: 'Hinta (snt/kWh)', angle: -90, position: 'insideLeft', style: { fill: '#aaa' } }}
                  domain={['auto', 'auto']}
                />
                <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                <Tooltip 
                  contentStyle={{ 
                    background: '#2a2a2a', 
                    border: '1px solid #444', 
                    borderRadius: '4px',
                    color: '#fff'
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)} snt/kWh`, 'Hinta']}
                  labelFormatter={(label: string, payload: readonly any[]) => {
                    if (payload && payload.length > 0) {
                      const timestamp = payload[0].payload.timestamp as Date
                      const dateStr = timestamp.toLocaleDateString('fi-FI', { day: 'numeric', month: 'short' })
                      const startTime = timestamp.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit', hour12: false })
                      
                      // Calculate end time based on view mode
                      const endTimestamp = new Date(timestamp)
                      if (viewMode === 'hourly') {
                        endTimestamp.setHours(endTimestamp.getHours() + 1)
                      } else {
                        endTimestamp.setMinutes(endTimestamp.getMinutes() + 15)
                      }
                      const endTime = endTimestamp.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit', hour12: false })
                      
                      return `${dateStr} ${startTime} - ${endTime}`
                    }
                    return label
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => {
                    const isCurrent = isCurrentPeriod(entry.timestamp)
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getBarColor(entry.price)}
                        stroke={isCurrent ? '#ffffffff' : 'none'}
                        strokeWidth={isCurrent ? 3 : 0}
                        opacity={isCurrent ? 1 : 0.85}
                      />
                    )
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Data Table */}
          <details open className="data-table-details">
            <summary className="data-table-summary">
              Yksityiskohtainen hintadata
            </summary>
            <div className="data-table-container">
            {viewMode === 'hourly' && (
              <table className="price-table">
                <thead>
                  <tr>
                    <th className="align-left">Aika</th>
                    <th className="align-right">Keskihinta (snt/kWh)</th>
                    <th className="align-right">Min</th>
                    <th className="align-right">Max</th>
                  </tr>
                </thead>
                <tbody>
                  {hourlyData.map((point, idx) => (
                    <tr key={idx}>
                      <td>{formatTime(point.timestamp)}</td>
                      <td className="align-right bold">
                        {convertToCentsPerKwh(point.averagePrice)}
                      </td>
                      <td className="align-right secondary">
                        {convertToCentsPerKwh(point.minPrice)}
                      </td>
                      <td className="align-right secondary">
                        {convertToCentsPerKwh(point.maxPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {viewMode === '15min' && (
              <table className="price-table">
                <thead>
                  <tr>
                    <th className="align-left">Aika</th>
                    <th className="align-right">Hinta (snt/kWh)</th>
                  </tr>
                </thead>
                <tbody>
                  {fifteenMinData.map((point, idx) => (
                    <tr key={idx}>
                      <td>{formatTime(point.timestamp)}</td>
                      <td className="align-right bold">
                        {convertToCentsPerKwh(point.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          </details>

          {/* Debug: Show raw data */}
          <details className="debug-details">
            <summary className="debug-summary">Data APIsta JSON-muodossa</summary>
            <pre className="debug-pre">
              {JSON.stringify(rawData, null, 2)}
            </pre>
          </details>
        </>
      )}
    </main>
  )
}