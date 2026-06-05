import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { connectDB } from './database.js'
import { flightRoutes, alertRoutes, predictionRoutes } from './routes/index.js'
import { TelegramBot } from './bot/telegram.js'

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
