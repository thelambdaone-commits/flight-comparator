export interface FlightSearchParams {
  origin: string
  destination: string
  date: string
  returnDate?: string
  adults: number
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first'
}

export interface FlightItinerary {
  id: string
  price: number
  currency: string
  airline: string
  flightNumber: string
  departureTime: string
  arrivalTime: string
  duration: string
  stops: number
  origin: string
  destination: string
  date: string
  cabinClass: string
  bookingLink?: string
}

export interface PricePoint {
  price: number
  currency: string
  timestamp: Date
  pointOfSale: string
  source: string
}

export interface PriceHistory {
  route: string
  prices: PricePoint[]
  min: number
  max: number
  avg: number
  trend: 'up' | 'down' | 'stable'
}

export interface POSSession {
  country: string
  countryCode: string
  currency: string
  proxyUrl: string
  fingerprint: FingerprintProfile
}

export interface FingerprintProfile {
  userAgent: string
  viewport: { width: number; height: number }
  locale: string
  timezoneId: string
  geolocation: { latitude: number; longitude: number }
  webglVendor: string
  webglRenderer: string
  hardwareConcurrency: number
  deviceMemory: number
}

export interface ScrapeResult {
  pos: string
  flights: FlightItinerary[]
  error?: string
}

export interface ProxyConfig {
  name: string
  type: 'vpn' | 'residential' | 'datacenter'
  url: string
  country: string
  countryCode: string
  isFree: boolean
  bandwidthLimit?: number
  bandwidthUsed: number
}
