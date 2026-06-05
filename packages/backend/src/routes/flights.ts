import { FastifyInstance } from 'fastify'
import { prisma } from '../database.js'

export async function flightRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/flights/search', async (request, reply) => {
    const { origin, destination, date } = request.query as {
      origin?: string
      destination?: string
      date?: string
    }

    if (!origin || !destination) {
      return reply.status(400).send({ error: 'origin and destination required' })
    }

    const route = await prisma.route.findFirst({
      where: {
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
      },
      include: {
        priceHistory: {
          orderBy: { timestamp: 'desc' },
          take: 50,
        },
        alerts: {
          where: { isActive: true },
        },
      },
    })

    if (!route) {
      return reply.send({ route: `${origin}→${destination}`, flights: [], priceHistory: [] })
    }

    return reply.send({
      route: `${route.origin}→${route.destination}`,
      flights: route.priceHistory.slice(0, 10),
      priceHistory: route.priceHistory,
      activeAlerts: route.alerts.length,
    })
  })

  app.get('/api/flights/history/:origin/:destination', async (request, reply) => {
    const { origin, destination } = request.params as {
      origin: string
      destination: string
    }

    const route = await prisma.route.findFirst({
      where: {
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
      },
      include: {
        priceHistory: {
          orderBy: { timestamp: 'desc' },
          take: 500,
        },
        mlPredictions: {
          orderBy: { createdAt: 'desc' },
          take: 7,
        },
      },
    })

    if (!route) {
      return reply.status(404).send({ error: 'Route not found' })
    }

    const prices = route.priceHistory
    const min = prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : 0
    const max = prices.length > 0 ? Math.max(...prices.map((p) => p.price)) : 0
    const avg = prices.length > 0 ? prices.reduce((s, p) => s + p.price, 0) / prices.length : 0

    return reply.send({
      route: `${route.origin}→${route.destination}`,
      stats: { min, max, avg, count: prices.length },
      priceHistory: prices,
      predictions: route.mlPredictions,
    })
  })
}
