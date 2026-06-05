import { POSSession, FlightItinerary, ScrapeResult, FlightSearchParams } from '../models.js'
import { StealthBrowserFactory } from '../stealth/browser-factory.js'
import { HumanBehavior } from '../stealth/human-behavior.js'

export class GoogleFlightsScraper {
  constructor(
    private browserFactory: StealthBrowserFactory,
    private human: HumanBehavior
  ) {}

  async search(params: FlightSearchParams, posSessions: POSSession[]): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = []

    for (const session of posSessions) {
      try {
        const flights = await this.searchSinglePOS(params, session)
        results.push({ pos: session.countryCode, flights })
      } catch (error) {
        results.push({ pos: session.countryCode, flights: [], error: String(error) })
      }
    }

    return results
  }

  private async searchSinglePOS(params: FlightSearchParams, session: POSSession): Promise<FlightItinerary[]> {
    const { context, page } = await this.browserFactory.createStealthContext(session)

    try {
      const url = this.buildGoogleFlightsURL(params, session.countryCode)
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await this.human.waitForPageLoad(page)

      const hasConsent = await page.$('[aria-label*="Accept all"]')
      if (hasConsent) {
        await hasConsent.click()
        await this.human.simulateRealUser(page)
      }

      await page.waitForTimeout(2000)

      const flights = await this.extractFlights(page, params, session)
      return flights
    } finally {
      await context.close()
    }
  }

  private buildGoogleFlightsURL(params: FlightSearchParams, countryCode: string): string {
    const tld = COUNTRY_TLD[countryCode] || 'com'
    const base = `https://www.google.${tld}/travel/flights`

    const searchParams = new URLSearchParams({
      q: `Flights+to+${params.destination}+from+${params.origin}+on+${params.date}`,
    })

    if (params.returnDate) {
      searchParams.set('q', `Flights+to+${params.destination}+from+${params.origin}+on+${params.date}+return+${params.returnDate}`)
    }

    return `${base}?${searchParams.toString()}`
  }

  private async extractFlights(
    page: any,
    params: FlightSearchParams,
    session: POSSession
  ): Promise<FlightItinerary[]> {
    const flights: FlightItinerary[] = []

    try {
      const flightCards = await page.$$('[role="listitem"]')

      for (const card of flightCards.slice(0, 15)) {
        try {
          const priceEl = await card.$('[class*="price"], [class*="Fare"]')
          const priceText = priceEl ? await priceEl.textContent() : ''
          const price = this.parsePrice(priceText)

          const airlineEl = await card.$('[class*="airline"], [class*="carrier"]')
          const airline = airlineEl ? await airlineEl.textContent() : 'Unknown'

          const timeEl = await card.$('span[class*="time"]')
          const times = timeEl ? await timeEl.textContent() : ''

          const durationEl = await card.$('[class*="duration"]')
          const duration = durationEl ? await durationEl.textContent() : ''

          const stopsEl = await card.$('[class*="stops"]')
          const stopsText = stopsEl ? await stopsEl.textContent() : '0 stop'
          const stops = this.parseStops(stopsText)

          if (price > 0) {
            flights.push({
              id: `${params.origin}-${params.destination}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              price,
              currency: session.currency || 'EUR',
              airline: airline?.trim() || 'Unknown',
              flightNumber: '',
              departureTime: times?.split('–')[0]?.trim() || '',
              arrivalTime: times?.split('–')[1]?.trim() || '',
              duration,
              stops,
              origin: params.origin,
              destination: params.destination,
              date: params.date,
              cabinClass: params.cabinClass,
            })
          }
        } catch {}
      }
    } catch {}

    return flights
  }

  private parsePrice(text: string): number {
    const cleaned = text?.replace(/[^0-9.,]/g, '').replace(',', '.') || ''
    const match = cleaned.match(/(\d+(?:\.\d+)?)/)
    return match ? parseFloat(match[1]) : 0
  }

  private parseStops(text: string): number {
    if (!text) return 0
    if (text.toLowerCase().includes('nonstop') || text.toLowerCase().includes('direct') || text.includes('0')) return 0
    if (text.includes('1')) return 1
    if (text.includes('2')) return 2
    if (text.includes('3+') || text.includes('multi')) return 3
    return 0
  }
}

const COUNTRY_TLD: Record<string, string> = {
  FR: 'fr',
  DE: 'de',
  NL: 'nl',
  AR: 'com.ar',
  TR: 'com.tr',
  US: 'com',
  IN: 'co.in',
  HK: 'com.hk',
  CA: 'ca',
  JP: 'co.jp',
  GB: 'co.uk',
  IT: 'it',
  ES: 'es',
}
