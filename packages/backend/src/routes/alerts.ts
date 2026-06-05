import { FastifyInstance } from 'fastify'
import { prisma } from '../database.js'

export async function alertRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/alerts', async (request, reply) => {
    const { origin, destination, targetPrice, chatId } = request.body as {
      origin: string
      destination: string
      targetPrice: number
      chatId: string
    }

    if (!origin || !destination || !targetPrice || !chatId) {
      return reply.status(400).send({ error: 'origin, destination, targetPrice, chatId required' })
    }

    let route = await prisma.route.findFirst({
      where: { origin: origin.toUpperCase(), destination: destination.toUpperCase() },
    })

    if (!route) {
      route = await prisma.route.create({
        data: { origin: origin.toUpperCase(), destination: destination.toUpperCase() },
      })
    }

    const alert = await prisma.alert.create({
      data: {
        routeId: route.id,
        targetPrice,
        chatId,
        isActive: true,
      },
    })

    return reply.status(201).send({
      id: alert.id,
      route: `${origin}→${destination}`,
      targetPrice,
      message: `✅ Alerte créée ! Tu seras notifié quand Paris→${destination} passera sous ${targetPrice}€`,
    })
  })

  app.delete('/api/alerts/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    await prisma.alert.update({
      where: { id },
      data: { isActive: false },
    })

    return reply.send({ message: 'Alerte désactivée' })
  })

  app.get('/api/alerts/:chatId', async (request, reply) => {
    const { chatId } = request.params as { chatId: string }

    const alerts = await prisma.alert.findMany({
      where: { chatId, isActive: true },
      include: { route: true },
      orderBy: { createdAt: 'desc' },
    })

    return reply.send({ alerts })
  })
}
