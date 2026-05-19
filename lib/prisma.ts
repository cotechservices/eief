// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Vérifier si on est dans l'API route (côté serveur)
const isServer = typeof window === 'undefined'

let prisma: PrismaClient

if (isServer) {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL not found in environment variables')
  }
  prisma = globalForPrisma.prisma ?? new PrismaClient()
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
} else {
  // Côté client, on ne peut pas utiliser Prisma
  prisma = {} as PrismaClient
}

export { prisma }