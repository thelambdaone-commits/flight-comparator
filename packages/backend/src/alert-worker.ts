import { prisma } from './database.js'
import type { TelegramBot } from './bot/telegram.js'

// Anti-spam : on ne re-notifie pas une même alerte avant ce délai.
export const NOTIFY_COOLDOWN_MS = 6 * 60 * 60 * 1000 // 6h

// Décision pure (testable sans DB) : faut-il déclencher la notification ?
export function shouldFire(
  targetPrice: number,
  latestPrice: number,
  lastNotifiedAt: Date | null,
  now: number,
  cooldownMs: number = NOTIFY_COOLDOWN_MS
): boolean {
  if (latestPrice > targetPrice) return false
  if (lastNotifiedAt && now - lastNotifiedAt.getTime() < cooldownMs) return false
  return true
}

// Vérifie périodiquement les alertes actives et notifie via Telegram quand le
// dernier prix connu d'une route passe sous le seuil cible.
export class AlertWorker {
  private timer: NodeJS.Timeout | null = null

  constructor(
    private bot: TelegramBot,
    private intervalMs: number = 5 * 60 * 1000 // 5 min
  ) {}

  start(): void {
    void this.runOnce()
    this.timer = setInterval(() => void this.runOnce(), this.intervalMs)
    console.log(`🔔 Alert worker started (vérification toutes les ${Math.round(this.intervalMs / 1000)}s)`)
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  private async runOnce(): Promise<void> {
    try {
      const fired = await this.check()
      if (fired > 0) console.log(`🔔 ${fired} alerte(s) déclenchée(s)`)
    } catch (error) {
      console.error('alert-worker error:', error)
    }
  }

  // Exposée pour les tests / déclenchement manuel. Retourne le nb d'alertes notifiées.
  async check(now: number = Date.now()): Promise<number> {
    const alerts = await prisma.alert.findMany({
      where: { isActive: true },
      include: {
        route: {
          include: {
            priceHistory: { orderBy: { timestamp: 'desc' }, take: 1 },
          },
        },
      },
    })

    let fired = 0
    for (const alert of alerts) {
      const latest = alert.route.priceHistory[0]
      if (!latest) continue
      if (!shouldFire(alert.targetPrice, latest.price, alert.lastNotifiedAt, now)) continue

      const message =
        `🔥 *Alerte prix !*\n` +
        `✈️ ${alert.route.origin}→${alert.route.destination} est à *${latest.price}€* ` +
        `(ton seuil : ${alert.targetPrice}€)\n` +
        `📍 POS : ${latest.pointOfSale}${latest.airline ? ` · ${latest.airline}` : ''}`

      await this.bot.sendAlert(alert.chatId, message)
      await prisma.alert.update({
        where: { id: alert.id },
        data: { lastNotifiedAt: new Date(now) },
      })
      fired++
    }

    return fired
  }
}
