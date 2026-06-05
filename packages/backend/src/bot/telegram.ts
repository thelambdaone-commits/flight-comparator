import { Bot, Context, Keyboard } from 'grammy'
import { prisma } from '../database.js'

export class TelegramBot {
  private bot: Bot

  constructor(token: string) {
    this.bot = new Bot(token)
    this.bot.catch((err) => {
      console.error('❌ Bot error:', err.error)
    })
    this.registerHandlers()
  }

  private registerHandlers(): void {
    this.bot.command('start', async (ctx: Context) => {
      const keyboard = new Keyboard()
        .text('🔍 Rechercher un vol')
        .text('📊 Mes alertes')
        .row()
        .text('💰 Meilleurs deals')
        .text('❓ Aide')
        .resized()

      await ctx.reply(
        `✈️ *Flight Comparator Bot* 🚀\n\n` +
        `Je cherche les meilleurs prix de vols avec anti-détection multi-POS !\n\n` +
        `Commandes :\n` +
        `/search Paris Bogota — cherche un vol\n` +
        `/alert Paris Bogota 600 — alerte si prix < 600€\n` +
        `/alerts — voir mes alertes\n` +
        `/predict Paris Bogota — prédiction ML\n` +
        `/help — aide`,
        { reply_markup: keyboard, parse_mode: 'Markdown' }
      )
    })

    this.bot.command('search', async (ctx: Context) => {
      try {
        const args = ctx.message?.text?.split(' ').slice(1)
        if (!args || args.length < 2) {
          await ctx.reply('Usage: /search <origin> <destination>\nEx: /search Paris Bogota')
          return
        }

        const [origin, destination] = args
        await ctx.reply(`🔍 Recherche des meilleurs prix ${origin}→${destination}...\n` +
          `(multi-POS: France, Allemagne, Inde, Argentine...)`)

        const route = await prisma.route.findFirst({
          where: {
            origin: origin.toUpperCase().substring(0, 3),
            destination: destination.toUpperCase().substring(0, 3),
          },
          include: {
            priceHistory: {
              orderBy: { timestamp: 'desc' },
              take: 10,
            },
          },
        })

        if (!route || route.priceHistory.length === 0) {
          await ctx.reply(`⚠️ Aucun prix trouvé pour ${origin}→${destination}.\n` +
            `Le scraper vérifie toutes les 6h, réessaie plus tard.`)
          return
        }

        const prices = route.priceHistory
        const min = Math.min(...prices.map((p) => p.price))
        const best = prices.find((p) => p.price === min)

        let message = `✈️ *${origin} → ${destination}*\n\n`
        message += `🏆 *Meilleur prix : ${min}€* (${best?.airline || ''})\n`
        message += `📊 Derniers prix : ${prices.slice(0, 5).map((p) => `${p.price}€`).join(' · ')}\n`
        message += `📍 POS le moins cher : ${[...prices].sort((a, b) => a.price - b.price)[0]?.pointOfSale || 'FR'}\n\n`
        message += `💡 *Astuce* : Utilise /alert ${origin} ${destination} ${Math.round(min * 0.9)} pour être notifié`

        await ctx.reply(message, { parse_mode: 'Markdown' })
      } catch (error) {
        console.error('search error:', error)
        await ctx.reply('❌ Erreur lors de la recherche. Réessaie plus tard.')
      }
    })

    this.bot.command('alert', async (ctx: Context) => {
      try {
        const args = ctx.message?.text?.split(' ').slice(1)
        if (!args || args.length < 3) {
          await ctx.reply('Usage: /alert <origin> <destination> <max_price>\nEx: /alert Paris Bogota 600')
          return
        }

        const [origin, destination, priceStr] = args
        const targetPrice = parseFloat(priceStr)

        if (isNaN(targetPrice) || targetPrice <= 0) {
          await ctx.reply('Prix invalide. Utilise un nombre positif.')
          return
        }

        const chatId = String(ctx.chat?.id)

        let route = await prisma.route.findFirst({
          where: { origin: origin.toUpperCase().substring(0, 3), destination: destination.toUpperCase().substring(0, 3) },
        })

        if (!route) {
          route = await prisma.route.create({
            data: { origin: origin.toUpperCase().substring(0, 3), destination: destination.toUpperCase().substring(0, 3) },
          })
        }

        await prisma.alert.create({
          data: { routeId: route.id, targetPrice, chatId },
        })

        await ctx.reply(
          `✅ Alerte créée !\n` +
          `Je te notifierai quand ${origin}→${destination} passera sous ${targetPrice}€`
        )
      } catch (error) {
        console.error('alert error:', error)
        await ctx.reply(`❌ Erreur lors de la création de l'alerte. Réessaie plus tard.`)
      }
    })

    this.bot.command('alerts', async (ctx: Context) => {
      try {
        const chatId = String(ctx.chat?.id)
        const alerts = await prisma.alert.findMany({
          where: { chatId, isActive: true },
          include: { route: true },
        })

        if (alerts.length === 0) {
          await ctx.reply('📭 Aucune alerte active. Crée-en une avec /alert')
          return
        }

        let message = '📊 *Tes alertes actives :*\n\n'
        for (const a of alerts) {
          message += `✈️ ${a.route.origin}→${a.route.destination} : alerte sous ${a.targetPrice}€\n`
        }

        await ctx.reply(message, { parse_mode: 'Markdown' })
      } catch (error) {
        console.error('alerts error:', error)
        await ctx.reply('❌ Erreur lors de la récupération des alertes.')
      }
    })

    this.bot.command('predict', async (ctx: Context) => {
      try {
        const args = ctx.message?.text?.split(' ').slice(1)
        if (!args || args.length < 2) {
          await ctx.reply('Usage: /predict <origin> <destination>\nEx: /predict Paris Bogota')
          return
        }

        const [origin, destination] = args
        const route = await prisma.route.findFirst({
          where: { origin: origin.toUpperCase().substring(0, 3), destination: destination.toUpperCase().substring(0, 3) },
          include: {
            priceHistory: { orderBy: { timestamp: 'desc' }, take: 30 },
            mlPredictions: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        })

        if (!route || route.priceHistory.length < 5) {
          await ctx.reply('⚠️ Pas assez de données pour une prédiction fiable (besoin de 5+ points)')
          return
        }

        const prices = route.priceHistory
        const avg = prices.reduce((s, p) => s + p.price, 0) / prices.length
        const lastPrice = prices[0]?.price || 0
        const ml = route.mlPredictions[0]

        let message = `🧠 *Prédiction ML ${origin}→${destination}*\n\n`
        message += `💰 Prix actuel : ${lastPrice}€\n`
        message += `📊 Prix moyen : ${Math.round(avg)}€\n`

        if (ml) {
          message += `🔮 Prédiction : ${Math.round(ml.predictedPrice)}€\n`
          message += `🎯 Meilleur moment : ${ml.bestTimeToBuy || 'Non déterminé'}\n`
          message += `📈 Confiance : ${Math.round(ml.confidence * 100)}%\n`
        } else {
          message += `🔮 Pas encore de prédiction ML\n`
        }

        message += `\n💡 ${lastPrice < avg * 0.9 ? 'Achète maintenant, le prix est bas !' : 'Surveille encore'}`

        await ctx.reply(message, { parse_mode: 'Markdown' })
      } catch (error) {
        console.error('predict error:', error)
        await ctx.reply('❌ Erreur lors de la prédiction. Réessaie plus tard.')
      }
    })

    this.bot.hears('🔍 Rechercher un vol', async (ctx: Context) => {
      await ctx.reply('Utilise /search <origine> <destination>\nEx: /search Paris Bogota')
    })
    this.bot.hears('📊 Mes alertes', async (ctx: Context) => {
      await ctx.reply('Utilise /alerts pour voir tes alertes actives.')
    })
    this.bot.hears('💰 Meilleurs deals', async (ctx: Context) => {
      await ctx.reply('Utilise /deals pour voir les meilleurs deals.')
    })
    this.bot.hears('❓ Aide', async (ctx: Context) => {
      await ctx.reply("Utilise /help pour voir l'aide.")
    })

    this.bot.command('help', async (ctx: Context) => {
      await ctx.reply(
        `✈️ *Flight Comparator Bot*\n\n` +
        `Commandes :\n` +
        `/search Paris Bogota — cherche les meilleurs prix\n` +
        `/alert Paris Bogota 600 — alerte si prix < 600€\n` +
        `/alerts — liste tes alertes\n` +
        `/predict Paris Bogota — prédiction IA\n` +
        `/deals — meilleurs deals du moment\n` +
        `/help — cette aide\n\n` +
        `💡 *Astuce* : Le bot compare les prix depuis plusieurs pays ` +
        `(France, Allemagne, Inde, Argentine...) pour trouver le meilleur deal !\n\n` +
        `🌐 *VPN gratuits utilisés* : ProtonVPN, Windscribe, X-VPN, Webshare`
      )
    })

    this.bot.command('deals', async (ctx: Context) => {
      try {
        const routes = await prisma.route.findMany({
          include: {
            priceHistory: {
              orderBy: { timestamp: 'desc' },
              take: 5,
            },
          },
        })

        if (routes.length === 0) {
          await ctx.reply('📭 Aucun deal pour le moment. Reviens plus tard !')
          return
        }

        const withPrices = routes.filter((r) => r.priceHistory.length > 0)
        if (withPrices.length === 0) {
          await ctx.reply('📭 Aucun deal pour le moment. Reviens plus tard !')
          return
        }

        let message = '💰 *Meilleurs deals du moment :*\n\n'
        for (const route of withPrices) {
          const min = Math.min(...route.priceHistory.map((p) => p.price))
          const last = route.priceHistory[0]?.price || 0
          message += `✈️ ${route.origin}→${route.destination} : ` +
            `${last}€ (mini: ${min}€) ${last <= min * 1.05 ? '🔥' : ''}\n`
        }

        await ctx.reply(message, { parse_mode: 'Markdown' })
      } catch (error) {
        console.error('deals error:', error)
        await ctx.reply('❌ Erreur lors de la récupération des deals.')
      }
    })
  }

  async start(): Promise<void> {
    await this.bot.start({
      onStart: (botInfo) => {
        console.log(`🤖 Telegram bot @${botInfo.username} started`)
      },
    })
  }

  async sendAlert(chatId: string, message: string): Promise<void> {
    try {
      await this.bot.api.sendMessage(chatId, message, { parse_mode: 'Markdown' })
    } catch (error) {
      console.error('Failed to send Telegram alert:', error)
    }
  }
}
