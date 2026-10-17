import { z } from "zod";
import { DietaryType } from "@prisma/client";

export const recipeIngredientInputSchema = z.object({
  productId: z.string().uuid("Invalid product ID format"),
  quantity: z.number().positive("Ingredient quantity must be greater than zero"),
  unit: z.string().trim().min(1, "Ingredient unit is required (e.g. g, ml, piece, tsp, cup)"),
  isMandatory: z.boolean().optional().default(true),
  notes: z.string().trim().max(200, "Notes cannot exceed 200 characters").optional(),
});

export const createRecipeSchema = z.object({
  title: z.string().trim().min(2, "Recipe title must be at least 2 characters long"),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .optional(),
  description: z.string().trim().max(1000, "Description cannot exceed 1000 characters").optional(),
  prepTimeMinutes: z
    .number()
    .int("Prep time must be an integer")
    .nonnegative("Prep time cannot be negative"),
  cookTimeMinutes: z
    .number()
    .int("Cook time must be an integer")
    .nonnegative("Cook time cannot be negative"),
  servings: z
    .number()
    .int("Servings must be an integer")
    .positive("Servings must be at least 1")
    .default(2),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional().default("EASY"),
  dietaryType: z.nativeEnum(DietaryType).optional().default(DietaryType.VEG),
  cuisine: z.string().trim().optional().default("Indian"),
  instructions: z.string().trim().min(10, "Instructions must be at least 10 characters long"),
  imageUrl: z.string().trim().url("Image URL must be a valid URL").optional().or(z.literal("")),
  isActive: z.boolean().optional().default(true),
  ingredients: z
    .array(recipeIngredientInputSchema)
    .min(1, "A recipe must contain at least one ingredient"),
});

export const updateRecipeSchema = z.object({
  title: z.string().trim().min(2, "Recipe title must be at least 2 characters long").optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .optional(),
  description: z.string().trim().max(1000, "Description cannot exceed 1000 characters").optional(),
  prepTimeMinutes: z.number().int().nonnegative().optional(),
  cookTimeMinutes: z.number().int().nonnegative().optional(),
  servings: z.number().int().positive().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  dietaryType: z.nativeEnum(DietaryType).optional(),
  cuisine: z.string().trim().optional(),
  instructions: z.string().trim().min(10).optional(),
  imageUrl: z.string().trim().url().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  ingredients: z.array(recipeIngredientInputSchema).min(1).optional(),
});

export const recipeQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  search: z.string().trim().optional(),
  dietaryType: z.nativeEnum(DietaryType).optional(),
  cuisine: z.string().trim().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  maxPrepTime: z.coerce.number().int().positive().optional(),
  maxCookTime: z.coerce.number().int().positive().optional(),
});

export const recipePreviewQuerySchema = z.object({
  servings: z.coerce
    .number()
    .int("Servings must be an integer")
    .positive("Target servings must be at least 1")
    .optional(),
  storeId: z.string().uuid("Invalid store ID format").optional(),
});

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;
export type RecipeQueryParams = z.infer<typeof recipeQuerySchema>;
export type RecipePreviewQueryParams = z.infer<typeof recipePreviewQuerySchema>;
