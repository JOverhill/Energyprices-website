// API configuration
const API_CONFIG = {
  securityToken: import.meta.env.VITE_ENTSOE_SECURITY_TOKEN,
  domain: '10YFI-1--------U', // Finland Bidding Zone
  documentType: 'A44', // Price Document
  contractType: 'A01', // A01 = Day-ahead, A07 = Intraday
}

// Validate that the security token is configured
if (!API_CONFIG.securityToken) {
  console.error('VITE_ENTSOE_SECURITY_TOKEN is not configured. Please add it to your .env file.')
}

/**
 * Format a Date object to yyyyMMddHHmm format required by the API
 */
function formatDateTime(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}${month}${day}${hours}${minutes}`
}

/**
 * Get date range for current day in UTC (accounting for Finnish timezone)
 * Finland is UTC+2 (EET) in winter and UTC+3 (EEST) in summer
 * To get prices starting from 00:00 Finnish time, we need to request from 22:00/21:00 UTC the previous day
 */
function getCurrentDayRange(): { periodStart: string; periodEnd: string } {
  const now = new Date()
  
  // Create date at 00:00 local (Finnish) time
  const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  
  // Convert to UTC by getting the timestamp and creating a UTC date string
  // We need to subtract the timezone offset to get the correct UTC time
  const offsetMinutes = localMidnight.getTimezoneOffset()
  const utcStartTime = new Date(localMidnight.getTime() - offsetMinutes * 60 * 1000)
  
  // End: tomorrow at 00:00 local time (in UTC)
  const localMidnightTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 0, 0, 0)
  const utcEndTime = new Date(localMidnightTomorrow.getTime() - offsetMinutes * 60 * 1000)
  
  return {
    periodStart: formatDateTime(utcStartTime),
    periodEnd: formatDateTime(utcEndTime)
  }
}

/**
 * Build the API URL with current date parameters.
 * Note for self: URLSearchParams automatically adds '=' between each key and value, and '&' between pairs.
 */
function buildApiUrl(offset: number = 0): string {
  const { periodStart, periodEnd } = getCurrentDayRange()
  
  const params = new URLSearchParams({
    documentType: API_CONFIG.documentType,
    periodStart,
    periodEnd,
    out_Domain: API_CONFIG.domain,
    in_Domain: API_CONFIG.domain,
    'contract_MarketAgreement.type': API_CONFIG.contractType,
    securityToken: API_CONFIG.securityToken,
  })
  
  if (offset > 0) {
    params.append('offset', offset.toString())
  }
  
  return `/api?${params.toString()}`
}

/**
 * Convert an XML DOM Node into a plain JS object.
 * This is a lightweight recursive converter suitable for small-to-medium responses.
 */
function xmlNodeToObject(node: Node): any {
  // Text node
  if (node.nodeType === Node.TEXT_NODE) {
    return node.nodeValue?.trim() ?? '';
  }

  const obj: any = {};

  // attributes
  if ((node as Element).attributes && (node as Element).attributes.length) {
    obj['@attributes'] = {};
    Array.from((node as Element).attributes).forEach(attr => {
      obj['@attributes'][attr.name] = attr.value;
    });
  }

  // child nodes
  const childNodes = Array.from(node.childNodes).filter(n => {
    // ignore empty text nodes
    return !(n.nodeType === Node.TEXT_NODE && (n.nodeValue ?? '').trim() === '');
  });

  if (childNodes.length === 0) {
    // leaf node
    const text = (node.textContent ?? '').trim();
    if (text) return text;
    return obj;
  }

  childNodes.forEach(child => {
    if (child.nodeType === Node.TEXT_NODE) {
      // text directly inside element
      const text = (child.nodeValue ?? '').trim();
      if (text) obj['#text'] = text;
      return;
    }

    const childName = child.nodeName;
    const childObj = xmlNodeToObject(child);

    if (obj[childName] !== undefined) {
      // already present -> make array
      if (!Array.isArray(obj[childName])) obj[childName] = [obj[childName]];
      obj[childName].push(childObj);
    } else {
      obj[childName] = childObj;
    }
  });

  return obj;
}

// TypeScript types for parsed energy price data
export interface PricePoint {
  position: number
  timestamp: Date
  price: number
}

export interface TimePeriod {
  start: Date
  end: Date
  resolution: string
  prices: PricePoint[]
}

export interface EnergyPriceData {
  currency: string
  unit: string
  periods: TimePeriod[]
}

export interface HourlyPricePoint {
  timestamp: Date
  hour: number
  averagePrice: number
  minPrice: number
  maxPrice: number
  quarterlyPrices: number[] // the 4 15-min prices that make up this hour
}

/**
 * Parse the raw XML response into structured price data
 */
export function parseEnergyPrices(rawData: any): EnergyPriceData {
  const timeSeries = Array.isArray(rawData.TimeSeries) 
    ? rawData.TimeSeries 
    : [rawData.TimeSeries]

  const currency = timeSeries[0]?.currency_Unit?.name?.['#text'] || 'EUR'
  const unit = timeSeries[0]?.price_Measure_Unit?.name?.['#text'] || 'MWH'

  const periods: TimePeriod[] = timeSeries.map((series: any) => {
    const period = series.Period
    const startTime = new Date(period.timeInterval.start['#text'])
    const endTime = new Date(period.timeInterval.end['#text'])
    const resolution = period.resolution['#text']

    const points = Array.isArray(period.Point) ? period.Point : [period.Point]
    
    const prices: PricePoint[] = points.map((point: any) => {
      const position = parseInt(point.position['#text'])
      const price = parseFloat(point['price.amount']['#text'])
      
      // Calculate timestamp based on position (15-min intervals starting from startTime)
      const timestamp = new Date(startTime.getTime() + (position - 1) * 15 * 60 * 1000)
      
      return { position, timestamp, price }
    })

    return {
      start: startTime,
      end: endTime,
      resolution,
      prices
    }
  })

  return { currency, unit, periods }
}

/**
 * Get all 15-minute price points from parsed data, sorted by timestamp
 */
export function get15MinutePrices(data: EnergyPriceData): PricePoint[] {
  const allPrices: PricePoint[] = []
  
  data.periods.forEach(period => {
    allPrices.push(...period.prices)
  })

  // Sort by timestamp and remove duplicates (keep first occurrence)
  const uniquePrices = allPrices
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .filter((price, index, array) => {
      if (index === 0) return true
      return price.timestamp.getTime() !== array[index - 1].timestamp.getTime()
    })

  return uniquePrices
}

/**
 * Convert 15-minute prices to hourly averages
 */
export function getHourlyAveragePrices(data: EnergyPriceData): HourlyPricePoint[] {
  const fifteenMinPrices = get15MinutePrices(data)
  
  // Group prices by hour
  const hourlyGroups = new Map<string, PricePoint[]>()
  
  fifteenMinPrices.forEach(price => {
    // Create hour key (date + hour)
    const hourKey = `${price.timestamp.getFullYear()}-${price.timestamp.getMonth()}-${price.timestamp.getDate()}-${price.timestamp.getHours()}`
    
    if (!hourlyGroups.has(hourKey)) {
      hourlyGroups.set(hourKey, [])
    }
    hourlyGroups.get(hourKey)!.push(price)
  })

  // Calculate hourly averages
  const hourlyPrices: HourlyPricePoint[] = []
  
  hourlyGroups.forEach((prices) => {
    if (prices.length === 0) return
    
    // Use the first timestamp of the hour
    const timestamp = new Date(prices[0].timestamp)
    timestamp.setMinutes(0, 0, 0)
    
    const priceValues = prices.map(p => p.price)
    const averagePrice = priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length
    const minPrice = Math.min(...priceValues)
    const maxPrice = Math.max(...priceValues)
    
    hourlyPrices.push({
      timestamp,
      hour: timestamp.getHours(),
      averagePrice: Math.round(averagePrice * 100) / 100, // round to 2 decimals
      minPrice: Math.round(minPrice * 100) / 100,
      maxPrice: Math.round(maxPrice * 100) / 100,
      quarterlyPrices: priceValues
    })
  })

  return hourlyPrices.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

export const fetchEnergyPrices = async (offset: number = 0): Promise<any> => {
  try {
    const url = buildApiUrl(offset)
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const text = await response.text();

    // parse XML text into a Document
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'application/xml');

    // check for parse errors
    const parserErrors = xmlDoc.getElementsByTagName('parsererror');
    if (parserErrors.length > 0) {
      // include some context in error message
      const errText = parserErrors[0].textContent || 'Unknown XML parse error';
      throw new Error(`Failed to parse XML response: ${errText}`);
    }

    // convert XML document to JS object
    const result = xmlNodeToObject(xmlDoc.documentElement);
    return result;
  } catch (error) {
    console.error('Error fetching energy prices:', error);
    throw error;
  }
}