import cron from 'node-cron'
import { GoogleFlightsScraper } from './providers/google-flights.js'
import { ProxyManager } from './stealth/proxy-manager.js'
import { HumanBehavior } from './stealth/human-behavior.js'
import { FlightSearchParams } from './models.js'

export class Scheduler {
  private tasks: cron.ScheduledTask[] = []

  constructor(
    private scraper: GoogleFlightsScraper,
    private proxyManager: ProxyManager,
    private human: HumanBehavior
  ) {}

  start(): void {
    this.schedulePriceCheck('0 */6 * * *', 'CDG', 'TUN', 'Paris', 'Tunis') // every 6h
    this.schedulePriceCheck('0 */6 * * *', 'ORY', 'TUN', 'Paris', 'Tunis')
    this.schedulePriceCheck('30 */6 * * *', 'CDG', 'NCE', 'Paris', 'Nice')
    this.schedulePriceCheck('30 */6 * * *', 'CDG', 'BKK', 'Paris', 'Bangkok')
    this.schedulePriceCheck('0 */8 * * *', 'LHR', 'JFK', 'London', 'New York')

    console.log('⏰ Price check scheduler started (every 6h for known routes)')
  }

  stop(): void {
    for (const task of this.tasks) {
      task.stop()
    }
  }

  private schedulePriceCheck(
    cronExpr: string,
    origin: string,
    destination: string,
    originName: string,
    destName: string
  ): void {
    const task = cron.schedule(cronExpr, async () => {
      console.log(`🔍 Checking prices: ${originName} (${origin}) → ${destName} (${destination})`)

      const params: FlightSearchParams = {
        origin,
        destination,
        date: this.getDateString(0),
        returnDate: this.getDateString(3),
        adults: 1,
        cabinClass: 'economy',
      }

      const posCodes = this.proxyManager.getMultiPOSList()
      const sessions = posCodes.map((code) => this.proxyManager.buildPOSSession(code, code))
      const results = await this.scraper.search(params, sessions)

      for (const result of results) {
        if (result.flights.length > 0) {
          const bestPrice = Math.min(...result.flights.map((f) => f.price))
          const airline = result.flights.find((f) => f.price === bestPrice)?.airline
          console.log(`  🇪🇺 ${result.pos}: ${bestPrice}${result.flights[0]?.currency || '€'} (${airline})`)
        } else {
          console.log(`  ${result.pos}: No flights found${result.error ? ` (${result.error})` : ''}`)
        }
      }
    })

    this.tasks.push(task)
  }

  private getDateString(daysFromNow: number): string {
    const date = new Date()
    date.setDate(date.getDate() + daysFromNow)
    return date.toISOString().split('T')[0]
  }
}
