import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()

export async function connectDB(): Promise<void> {
  try {
    await prisma.$connect()
    console.log('📦 PostgreSQL connected')
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error)
    throw error
  }
}
