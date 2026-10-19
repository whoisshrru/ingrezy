import { z } from "zod";
import { DeliveryStatus } from "@prisma/client";

export const deliveryQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  status: z.nativeEnum(DeliveryStatus).optional(),
});

export const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90, "Latitude must be between -90 and 90"),
  longitude: z.number().min(-180).max(180, "Longitude must be between -180 and 180"),
  deliveryId: z.string().min(1, "Invalid delivery ID format").optional(),
});

export const completeDeliverySchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Delivery OTP must be exactly 6 digits"),
});

export type DeliveryQueryParams = z.infer<typeof deliveryQuerySchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type CompleteDeliveryInput = z.infer<typeof completeDeliverySchema>;
