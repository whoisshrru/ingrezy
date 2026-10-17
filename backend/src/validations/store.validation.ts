import { z } from "zod";

export const createStoreSchema = z.object({
  name: z.string().trim().min(2, "Store name must be at least 2 characters long"),
  managerId: z.string().uuid("Invalid manager ID format").optional(),
  address: z.string().trim().min(5, "Address must be at least 5 characters long"),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(2, "State is required"),
  postalCode: z.string().trim().regex(/^[0-9]{5,6}$/, "Postal code must be 5-6 digits"),
  latitude: z.number().min(-90).max(90, "Latitude must be between -90 and 90"),
  longitude: z.number().min(-180).max(180, "Longitude must be between -180 and 180"),
  serviceRadiusKm: z.number().positive("Service radius must be positive").optional().default(5.0),
  isActive: z.boolean().optional().default(true),
});

export const updateStoreSchema = createStoreSchema.partial();

export const setInventoryItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID format"),
  stockQuantity: z
    .number()
    .int("Stock quantity must be an integer")
    .nonnegative("Stock quantity cannot be negative"),
  price: z.number().positive("Price must be greater than zero"),
  isAvailable: z.boolean().optional().default(true),
});

export const updateInventoryItemSchema = z.object({
  stockQuantity: z
    .number()
    .int("Stock quantity must be an integer")
    .nonnegative("Stock quantity cannot be negative")
    .optional(),
  price: z.number().positive("Price must be greater than zero").optional(),
  isAvailable: z.boolean().optional(),
});

export const batchInventorySchema = z.object({
  items: z
    .array(setInventoryItemSchema)
    .min(1, "At least one inventory item is required for batch update")
    .max(100, "Maximum 100 items can be updated in a single batch"),
});

export const storeInventoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  availableOnly: z.enum(["true", "false"]).optional().default("true"),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
export type SetInventoryItemInput = z.infer<typeof setInventoryItemSchema>;
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;
export type BatchInventoryInput = z.infer<typeof batchInventorySchema>;
export type StoreInventoryQueryParams = z.infer<typeof storeInventoryQuerySchema>;
