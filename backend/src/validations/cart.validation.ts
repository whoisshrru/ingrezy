import { z } from "zod";

export const addCartItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .positive("Quantity must be at least 1")
    .max(100, "Maximum 100 units allowed per item")
    .default(1),
  storeId: z.string().min(1, "Store ID is required"),
  clearPrevious: z.boolean().optional().default(false),
});

export const updateCartItemSchema = z.object({
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .positive("Quantity must be at least 1. To remove an item, use delete.")
    .max(100, "Maximum 100 units allowed per item"),
});

export const addRecipeToCartSchema = z.object({
  storeId: z.string().min(1, "Store ID is required"),
  servings: z.number().int().positive("Servings must be at least 1").optional(),
  clearPrevious: z.boolean().optional().default(false),
  excludeProductIds: z.array(z.string().min(1, "Invalid product ID in exclusions")).optional().default([]),
  excludeIngredientIds: z.array(z.string().min(1, "Invalid ingredient ID in exclusions")).optional().default([]),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type AddRecipeToCartInput = z.infer<typeof addRecipeToCartSchema>;
