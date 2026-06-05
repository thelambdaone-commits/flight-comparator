import { FastifyInstance } from 'fastify'
import { prisma } from '../database.js'

export async function predictionRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/predict/:origin/:destination', async (request, reply) => {
    const { origin, destination } = request.params as {
      origin: string
      destination: string
    }

    const route = await prisma.route.findFirst({
      where: { origin: origin.toUpperCase(), destination: destination.toUpperCase() },
      include: {
        priceHistory: {
          orderBy: { timestamp: 'desc' },
          take: 30,
        },
        mlPredictions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!route || route.priceHistory.length === 0) {
      return reply.send({
        route: `${origin}→${destination}`,
        prediction: null,
        message: 'Pas assez de données pour une prédiction',
      })
    }

    const prices = route.priceHistory
    const avg = prices.reduce((s, p) => s + p.price, 0) / prices.length
    const min = Math.min(...prices.map((p) => p.price))
    const max = Math.max(...prices.map((p) => p.price))
    const lastPrice = prices[0]?.price || 0
    const priceDrop = lastPrice < avg

    const latestML = route.mlPredictions[0]

    return reply.send({
      route: `${origin}→${destination}`,
      currentPrice: lastPrice,
      stats: { min, max, avg, count: prices.length },
      trend: lastPrice < avg * 0.95 ? '📉 Baisse' : lastPrice > avg * 1.05 ? '📈 Hausse' : '➡️ Stable',
      prediction: latestML
        ? {
            predictedPrice: latestML.predictedPrice,
            bestTimeToBuy: latestML.bestTimeToBuy,
            confidence: latestML.confidence,
          }
        : null,
      tip: priceDrop
        ? '💰 C\'est un bon moment pour acheter !'
        : '⏳ Surveille encore un peu, le prix peut baisser',
    })
  })
}
