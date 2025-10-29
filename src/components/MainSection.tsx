import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useEffect, useState } from 'react'
import { 
  fetchEnergyPrices, 
  parseEnergyPrices, 
  get15MinutePrices, 
  getHourlyAveragePrices,
  type PricePoint,
  type HourlyPricePoint 
} from "../services/api"

type ViewMode = '15min' | 'hourly'

export const MainSection = () => {
  const [rawData, setRawData] = useState<any>(null)
  const [fifteenMinData, setFifteenMinData] = useState<PricePoint[]>([])
  const [hourlyData, setHourlyData] = useState<HourlyPricePoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('hourly')

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
    if (viewMode === 'hourly') {
      return hourlyData.map(point => {
        const price = point.averagePrice / 10 * 1.255
        return {
          time: point.timestamp.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit', hour12: false }),
          price: parseFloat(price.toFixed(2)),
          timestamp: point.timestamp
        }
      })
    } else {
      return fifteenMinData.map(point => {
        const price = point.price / 10 * 1.255
        return {
          time: point.timestamp.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit', hour12: false }),
          price: parseFloat(price.toFixed(2)),
          timestamp: point.timestamp
        }
      })
    }
  }

  const chartData = getChartData()

  // Get color based on price (green for low, yellow for medium, red for high)
  const getBarColor = (price: number) => {
    const prices = chartData.map(d => d.price)
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
    
    if (price < avgPrice * 0.8) return '#4ade80' // green
    if (price < avgPrice * 1.2) return '#fbbf24' // yellow
    return '#f87171' // red
  }

  return (
    <main>
      <h2>Sähkön hinta tänään {new Date().toLocaleDateString('fi-FI')}</h2>
      
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      {!loading && !error && (
        <>
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => setViewMode('hourly')}
                style={{
                  padding: '0.5rem 1rem',
                  background: viewMode === 'hourly' ? '#102a43' : '#f5f5f5',
                  color: viewMode === 'hourly' ? '#fff' : '#000',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Tuntihinta
              </button>
              <button 
                onClick={() => setViewMode('15min')}
                style={{
                  padding: '0.5rem 1rem',
                  background: viewMode === '15min' ? '#102a43' : '#f5f5f5',
                  color: viewMode === '15min' ? '#fff' : '#000',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Varttihinta
              </button>
            </div>
            
            {currentPrice && (
              <div style={{
                padding: '0.5rem 1rem',
                background: '#102a43',
                color: '#fff',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '1rem'
              }}>
                💡 Sähkön hinta nyt: {convertToCentsPerKwh(currentPrice.price)} snt/kWh <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>(sis. ALV 25.5%)</span>
              </div>
            )}
          </div>

          {/* Bar Chart */}
          <div style={{ 
            padding: '1.5rem', 
            background: '#1a1a1a', 
            color: '#ffffff',
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.2rem' }}>
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
                />
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
                      const startTime = timestamp.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit', hour12: false })
                      
                      // Calculate end time based on view mode
                      const endTimestamp = new Date(timestamp)
                      if (viewMode === 'hourly') {
                        endTimestamp.setHours(endTimestamp.getHours() + 1)
                      } else {
                        endTimestamp.setMinutes(endTimestamp.getMinutes() + 15)
                      }
                      const endTime = endTimestamp.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit', hour12: false })
                      
                      return `${startTime} - ${endTime}`
                    }
                    return label
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.price)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Data Table */}
          <details open>
            <summary style={{ 
              cursor: 'pointer', 
              padding: '0.5rem', 
              marginBottom: '1rem',
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}>
              Yksityiskohtainen hintadata
            </summary>
            <div style={{ 
              padding: '1rem', 
              background: '#1a1a1a', 
              color: '#ffffff',
              borderRadius: '8px',
              maxHeight: '500px',
              overflow: 'auto'
            }}>
            {viewMode === 'hourly' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ffffff' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #444' }}>
                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Aika</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>Keskihinta (snt/kWh)</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>Min</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>Max</th>
                  </tr>
                </thead>
                <tbody>
                  {hourlyData.map((point, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #333' }}>
                      <td style={{ padding: '0.5rem' }}>{formatTime(point.timestamp)}</td>
                      <td style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 'bold' }}>
                        {convertToCentsPerKwh(point.averagePrice)}
                      </td>
                      <td style={{ textAlign: 'right', padding: '0.5rem', color: '#aaa' }}>
                        {convertToCentsPerKwh(point.minPrice)}
                      </td>
                      <td style={{ textAlign: 'right', padding: '0.5rem', color: '#aaa' }}>
                        {convertToCentsPerKwh(point.maxPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {viewMode === '15min' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ffffff' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #444' }}>
                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Aika</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>Hinta (snt/kWh)</th>
                  </tr>
                </thead>
                <tbody>
                  {fifteenMinData.map((point, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #333' }}>
                      <td style={{ padding: '0.5rem' }}>{formatTime(point.timestamp)}</td>
                      <td style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 'bold' }}>
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
          <details style={{ marginTop: '1rem' }}>
            <summary style={{ cursor: 'pointer', padding: '0.5rem', color: '#fff', background: '#1a1a1a', borderRadius: '4px' }}>Data APIsta JSON-muodossa</summary>
            <pre style={{ 
              margin: '1rem 0 0 0',
              padding: '1rem',
              background: '#1a1a1a',
              color: '#ffffff',
              borderRadius: '8px',
              fontSize: '0.75rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: '400px',
              overflow: 'auto'
            }}>
              {JSON.stringify(rawData, null, 2)}
            </pre>
          </details>
        </>
      )}
    </main>
  )
}