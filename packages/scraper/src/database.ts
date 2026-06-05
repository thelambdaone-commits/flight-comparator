import { PrismaClient } from '@prisma/client'

// Client Prisma partagé (schéma défini dans packages/backend/prisma/schema.prisma,
// client généré dans le node_modules hoisté à la racine du monorepo).
export const prisma = new PrismaClient()
