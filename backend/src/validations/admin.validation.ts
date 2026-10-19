import { z } from "zod";
import { Role } from "@prisma/client";

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const assignStoreManagerSchema = z.object({
  managerId: z.string().min(1, "Invalid manager user ID format").nullable(),
});

export const userQuerySchema = z.object({
  role: z.nativeEnum(Role).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const assignDeliveryPartnerSchema = z.object({
  deliveryPartnerId: z.string().min(1, "Invalid delivery partner user ID format").nullable(),
  confirmReassign: z.boolean().optional().default(false),
});

