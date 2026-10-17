import { Prisma } from "@prisma/client";
export * from "@prisma/client";
export const Decimal = Prisma.Decimal;
export type Decimal = InstanceType<typeof Prisma.Decimal>;
