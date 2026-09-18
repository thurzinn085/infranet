import { PrismaClient } from "@prisma/client";

// Evita criar multiplas instancias do Prisma Client durante hot-reload em dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
