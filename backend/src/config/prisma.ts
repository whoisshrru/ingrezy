import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

export default prisma;
