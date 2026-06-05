import { chromium, Browser, BrowserContext, Page } from 'playwright'
import { POSSession } from '../models.js'

export class StealthBrowserFactory {
  private browser: Browser | null = null

  async init(): Promise<Browser> {
    if (this.browser) return this.browser

    const headless = process.env.HEADLESS !== 'false'
    this.browser = await chromium.launch({
      headless,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-infobars',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-field-trial-config',
        '--disable-ipc-flooding-protection',
        '--window-size=1920,1080',
      ],
    })
    return this.browser
  }

  async createStealthContext(session: POSSession): Promise<{ context: BrowserContext; page: Page }> {
    const browser = await this.init()
    const fp = session.fingerprint

    const context = await browser.newContext({
      userAgent: fp.userAgent,
      viewport: fp.viewport,
      locale: fp.locale,
      timezoneId: fp.timezoneId,
      geolocation: fp.geolocation,
      colorScheme: 'light',
      reducedMotion: 'no-preference',
      forcedColors: 'none',
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      permissions: ['geolocation'],
    })

    if (session.proxyUrl) {
      // Proxy is set at browser launch level in production
      // For dev, we use the context proxy
    }

    await context.addInitScript(() => {
      // Patch navigator.webdriver
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined })

      // Patch plugins array
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
          { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
          { name: 'Native Client', filename: 'internal-nacl-plugin' },
        ] as any,
      })

      // Patch languages
      Object.defineProperty(navigator, 'languages', { get: () => ['fr-FR', 'fr', 'en-US', 'en'] })

      // Patch chrome.runtime
      const chrome = (window as any).chrome || {}
      if (!chrome.runtime) {
        chrome.runtime = {
          id: 'abc123',
          connect: () => ({ onMessage: { addListener: () => {} }, onDisconnect: { addListener: () => {} } }),
          sendMessage: () => {},
          onMessage: { addListener: () => {} },
          onConnect: { addListener: () => {} },
        }
        ;(window as any).chrome = chrome
      }

      // Patch permissions
      const originalQuery = navigator.permissions.query.bind(navigator.permissions)
      navigator.permissions.query = (desc: any) => {
        if (desc.name === 'notifications') {
          return Promise.resolve({ state: 'denied' } as PermissionStatus)
        }
        return originalQuery(desc)
      }

      // Patch hardwareConcurrency
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })

      // Patch webdriver remove
      const originalDefineProperty = Object.defineProperty
      try {
        originalDefineProperty(navigator, 'webdriver', { get: () => undefined })
      } catch {}
    })

    const page = await context.newPage()

    // Set extra headers to match real browser
    await page.setExtraHTTPHeaders({
      'Accept-Language': fp.locale.replace('_', '-'),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Sec-CH-UA': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
      'Sec-CH-UA-Mobile': '?0',
      'Sec-CH-UA-Platform': '"Windows"',
    })

    return { context, page }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}
