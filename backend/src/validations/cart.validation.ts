import { z } from "zod";

export const addCartItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID format"),
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .positive("Quantity must be at least 1")
    .max(100, "Maximum 100 units allowed per item")
    .default(1),
  storeId: z.string().uuid("Invalid store ID format"),
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
  storeId: z.string().uuid("Invalid store ID format"),
  servings: z.number().int().positive("Servings must be at least 1").optional(),
  clearPrevious: z.boolean().optional().default(false),
  excludeProductIds: z.array(z.string().uuid("Invalid product ID format in exclusions")).optional().default([]),
  excludeIngredientIds: z.array(z.string().uuid("Invalid ingredient ID format in exclusions")).optional().default([]),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type AddRecipeToCartInput = z.infer<typeof addRecipeToCartSchema>;
