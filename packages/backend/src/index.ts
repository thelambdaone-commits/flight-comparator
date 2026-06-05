import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import Fastify from 'fastify'

// Le .env vit à la racine du monorepo. En dev (tsx, cwd=packages/backend) comme
// en prod (node dist/, même cwd), dotenv/config ne le trouverait pas. On charge
// d'abord un éventuel .env local, puis celui de la racine en repli.
dotenv.config()
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env') })

import cors from '@fastify/cors'
import { connectDB } from './database.js'
import { flightRoutes, alertRoutes, predictionRoutes } from './routes/index.js'
import { TelegramBot } from './bot/telegram.js'
import { AlertWorker } from './alert-worker.js'

async function main() {
  await connectDB()

  const app = Fastify({ logger: true })
  await app.register(cors, { origin: '*' })

  await app.register(flightRoutes)
  await app.register(alertRoutes)
  await app.register(predictionRoutes)

  app.get('/api/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  }))

  const token = process.env.TELEGRAM_BOT_TOKEN
  if (token) {
    const bot = new TelegramBot(token)
    bot.start().catch(console.error)
    const intervalMs = process.env.ALERT_CHECK_INTERVAL_MS
      ? parseInt(process.env.ALERT_CHECK_INTERVAL_MS)
      : undefined
    new AlertWorker(bot, intervalMs).start()
  } else {
    console.log('⚠️ TELEGRAM_BOT_TOKEN not set, bot disabled')
    console.log('   Get one from https://t.me/BotFather')
  }

  const port = parseInt(process.env.PORT || '4000')
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`⚡ Backend API running on http://localhost:${port}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
