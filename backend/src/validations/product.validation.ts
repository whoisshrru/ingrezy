import { z } from "zod";
import { DietaryType } from "@prisma/client";

export const createProductSchema = z.object({
  name: z.string().trim().min(2, "Product name must be at least 2 characters long"),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .optional(),
  description: z.string().trim().max(1000, "Description cannot exceed 1000 characters").optional(),
  category: z.string().trim().min(2, "Category is required"),
  unit: z.string().trim().min(1, "Unit is required (e.g. 1kg, 500g, 1 piece, 1 pack)"),
  basePrice: z.number().positive("Base price must be greater than zero"),
  imageUrl: z.string().trim().url("Image URL must be a valid URL").optional().or(z.literal("")),
  dietaryType: z.nativeEnum(DietaryType).optional().default(DietaryType.VEG),
  isActive: z.boolean().optional().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  dietaryType: z.nativeEnum(DietaryType).optional(),
  isActive: z.enum(["true", "false"]).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryParams = z.infer<typeof productQuerySchema>;
