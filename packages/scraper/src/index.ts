import 'dotenv/config'
import { StealthBrowserFactory } from './stealth/browser-factory.js'
import { HumanBehavior } from './stealth/human-behavior.js'
import { ProxyManager } from './stealth/proxy-manager.js'
import { GoogleFlightsScraper } from './providers/google-flights.js'
import { Scheduler } from './scheduler.js'

class FlightScraperApp {
  private browserFactory: StealthBrowserFactory
  private human: HumanBehavior
  private proxyManager: ProxyManager
  private scraper: GoogleFlightsScraper
  private scheduler: Scheduler

  constructor() {
    this.browserFactory = new StealthBrowserFactory()
    this.human = new HumanBehavior()
    this.proxyManager = new ProxyManager()
    this.scraper = new GoogleFlightsScraper(this.browserFactory, this.human)
    this.scheduler = new Scheduler(this.scraper, this.proxyManager, this.human)
  }

  async start(): Promise<void> {
    console.log('🚀 Flight Comparator Scraper starting...')
    console.log('📡 Proxy pool:', this.proxyManager.getMultiPOSList().length, 'free POS locations')
    console.log('🛡️ Anti-detection: Playwright + Chrome stealth patches')

    await this.browserFactory.init()
    this.scheduler.start()

    console.log('✅ Scraper ready. Waiting for jobs...')
  }

  async stop(): Promise<void> {
    this.scheduler.stop()
    await this.browserFactory.close()
    console.log('👋 Scraper stopped.')
  }
}

const app = new FlightScraperApp()

process.on('SIGINT', async () => {
  await app.stop()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await app.stop()
  process.exit(0)
})

app.start().catch(console.error)
