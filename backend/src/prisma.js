const { PrismaClient } = require('@prisma/client')

// Singleton para reutilizar la misma instancia de Prisma en desarrollo.
// Evita crear múltiples conexiones cuando hay hot-reload.
const globalForPrisma = globalThis

const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

module.exports = prisma
