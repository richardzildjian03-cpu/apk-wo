import { PrismaClient } from "@prisma/client";

// Singleton guard — mencegah kebocoran koneksi saat hot-reload di dev.
// Tanpa ini, setiap perubahan file membuat PrismaClient baru dan koneksi SQLite menumpuk.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaShutdown?: boolean;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Tutup koneksi rapi saat proses dev di-restart (Ctrl+C / hot-reload penuh).
if (!globalForPrisma.prismaShutdown) {
  globalForPrisma.prismaShutdown = true;
  const shutdown = () => {
    void prisma.$disconnect().catch(() => {
      /* abaikan */
    });
  };
  process.once("beforeExit", shutdown);
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}
