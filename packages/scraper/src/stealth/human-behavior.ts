import { Page } from 'playwright'

export class HumanBehavior {
  async simulateRealUser(page: Page): Promise<void> {
    await this.randomMouseMovements(page)
    await this.randomScroll(page)
    await this.randomPause()
  }

  private async randomMouseMovements(page: Page): Promise<void> {
    const viewport = page.viewportSize() || { width: 1920, height: 1080 }
    const points = [
      { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      { x: 300 + Math.random() * 300, y: 200 + Math.random() * 300 },
      { x: viewport.width / 2 + (Math.random() - 0.5) * 100, y: viewport.height / 2 + (Math.random() - 0.5) * 100 },
    ]
    for (const point of points) {
      await page.mouse.move(point.x, point.y, { steps: 5 + Math.floor(Math.random() * 15) })
      await this.randomPause(50, 200)
    }
  }

  private async randomScroll(page: Page): Promise<void> {
    const scrollHeight = await page.evaluate(() => document.body.scrollHeight)
    const scrollTarget = scrollHeight * (0.2 + Math.random() * 0.4)
    const steps = 3 + Math.floor(Math.random() * 5)
    for (let i = 0; i < steps; i++) {
      await page.evaluate((y: number) => window.scrollBy(0, y), 80 + Math.random() * 150)
      await this.randomPause(30, 120)
    }
    const remaining = scrollTarget - steps * 115
    if (remaining > 0) {
      await page.evaluate((y: number) => window.scrollBy(0, y), remaining)
    }
  }

  private async randomPause(min = 100, max = 1000): Promise<void> {
    const gammaDelay = Math.pow(Math.random(), 1.5) * (max - min) + min
    await new Promise((r) => setTimeout(r, gammaDelay))
  }

  async humanType(page: Page, selector: string, text: string): Promise<void> {
    await page.click(selector)
    await this.randomPause(200, 500)
    for (const char of text) {
      await page.keyboard.type(char)
      await this.randomPause(30, 120)
    }
  }

  async waitForPageLoad(page: Page): Promise<void> {
    try {
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 })
      await this.randomPause(500, 1500)
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
    } catch {}
  }
}
