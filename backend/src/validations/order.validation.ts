import { z } from "zod";

export const checkoutItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID format"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
});

export const checkoutSchema = z.object({
  addressId: z.string().uuid("Invalid address ID format"),
  paymentMethod: z.enum(["COD", "ONLINE"]).optional().default("COD"),
  specialInstructions: z.string().trim().max(500, "Special instructions cannot exceed 500 characters").optional(),
  idempotencyKey: z.string().trim().min(1).max(255).optional(),
  items: z.array(checkoutItemSchema).min(1, "Checkout requires at least one item").optional(),
});

export const createAddressSchema = z.object({
  label: z.string().trim().min(1, "Label is required (e.g. Home, Work)").default("Home"),
  addressLine1: z.string().trim().min(5, "Address line 1 must be at least 5 characters long"),
  addressLine2: z.string().trim().optional(),
  landmark: z.string().trim().optional(),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(2, "State is required"),
  postalCode: z.string().trim().regex(/^[0-9]{5,6}$/, "Postal code must be 5-6 digits"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isDefault: z.boolean().optional().default(false),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
