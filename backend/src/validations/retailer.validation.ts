import { z } from "zod";
import { OrderStatus } from "@prisma/client";

export const retailerOrderQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  status: z.nativeEnum(OrderStatus).optional(),
  startDate: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  endDate: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus, {
    message: "Invalid order status. Allowed: CONFIRMED, PREPARING, READY_FOR_PICKUP, CANCELLED",
  }),
  reason: z.string().trim().max(300, "Reason cannot exceed 300 characters").optional(),
});

export type RetailerOrderQueryParams = z.infer<typeof retailerOrderQuerySchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
