import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma.js";
import { AuthenticatedRequest } from "../types/auth.js";
import {
  createRecipeSchema,
  updateRecipeSchema,
  recipeQuerySchema,
  recipePreviewQuerySchema,
} from "../validations/recipe.validation.js";
import { importRecipeFromTheMealDb } from "../services/themealdb.service.js";

/**
 * Helper to safely extract string param from Express 5 params
 */
function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || "";
  return param || "";
}

/**
 * Generate a URL-friendly slug from recipe title.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * List recipes with search, filtering, and pagination.
 */
export async function listRecipes(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = recipeQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: parseResult.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }

    const { page, limit, search, dietaryType, cuisine, difficulty, maxPrepTime, maxCookTime } =
      parseResult.data;
    const skip = (page - 1) * limit;

    const where: Prisma.RecipeWhereInput = {
      isActive: true,
    };

    if (dietaryType) where.dietaryType = dietaryType;
    if (cuisine && cuisine.trim().toLowerCase() !== "all") {
      where.cuisine = { equals: cuisine.trim(), mode: "insensitive" };
    }
    if (difficulty) where.difficulty = difficulty;
    if (maxPrepTime) where.prepTimeMinutes = { lte: maxPrepTime };
    if (maxCookTime) where.cookTimeMinutes = { lte: maxCookTime };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { instructions: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, recipes] = await Promise.all([
      prisma.recipe.count({ where }),
      prisma.recipe.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          prepTimeMinutes: true,
          cookTimeMinutes: true,
          servings: true,
          difficulty: true,
          dietaryType: true,
          cuisine: true,
          imageUrl: true,
          createdAt: true,
          _count: {
            select: { ingredients: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      message: "Recipes retrieved successfully",
      data: {
        recipes,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("List recipes error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching recipes",
    });
  }
}

/**
 * Get recipe details with ingredients and products.
 * Supports optional ?servings=N to dynamically scale ingredient quantities.
 */
export async function getRecipeByIdOrSlug(req: Request, res: Response): Promise<void> {
  try {
    const identifier = getParam(req.params.identifier);

    if (!identifier) {
      res.status(400).json({
        success: false,
        message: "Recipe identifier is required",
      });
      return;
    }

    let recipe = await prisma.recipe.findFirst({
      where: {
        OR: [
          { id: identifier },
          { slug: identifier },
          { externalId: identifier },
          { externalId: `themealdb:${identifier}` },
        ],
      },
      include: {
        author: {
          select: { id: true, name: true },
        },
        ingredients: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                category: true,
                unit: true,
                basePrice: true,
                imageUrl: true,
                dietaryType: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    // Auto-ingest if requested identifier is a TheMealDB ID and not yet in database
    if (!recipe) {
      const cleanNumeric = identifier.trim().replace(/^(themealdb:|meal-|ext-)/i, "");
      if (/^\d+$/.test(cleanNumeric)) {
        try {
          const importRes = await importRecipeFromTheMealDb(cleanNumeric);
          recipe = importRes.recipe as any;
        } catch (_) {
          // Proceed to 404 handler
        }
      }
    }

    if (!recipe) {
      res.status(404).json({
        success: false,
        message: `Recipe with identifier '${identifier}' not found`,
      });
      return;
    }

    // Check if dynamic servings requested
    const targetServings = req.query.servings ? Number(req.query.servings) : null;
    const baseServings = recipe.servings;
    const scaleFactor = targetServings && targetServings > 0 ? targetServings / baseServings : 1;

    const scaledIngredients = recipe.ingredients.map((ing) => ({
      id: ing.id,
      productId: ing.productId || "",
      name: ing.product?.name || ing.ingredientName || "Ingredient",
      ingredientName: ing.ingredientName || ing.product?.name || null,
      rawMeasure: ing.rawMeasure || null,
      baseQuantity: ing.quantity,
      scaledQuantity: Math.round(ing.quantity * scaleFactor * 100) / 100,
      unit: ing.unit || ing.product?.unit || "",
      isMandatory: ing.isMandatory,
      notes: ing.notes,
      product: ing.product || null,
      hasLinkedProduct: Boolean(ing.productId && ing.product),
    }));

    res.status(200).json({
      success: true,
      message: "Recipe retrieved successfully",
      data: {
        recipe: {
          ...recipe,
          activeServings: targetServings || baseServings,
          baseServings,
          scaleFactor,
          ingredients: scaledIngredients,
        },
      },
    });
  } catch (error) {
    console.error("Get recipe error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while retrieving recipe",
    });
  }
}

/**
 * Create a new recipe with ingredients (ADMIN only).
 */
export async function createRecipe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parseResult = createRecipeSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parseResult.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }

    const {
      title,
      description,
      prepTimeMinutes,
      cookTimeMinutes,
      servings,
      difficulty,
      dietaryType,
      cuisine,
      instructions,
      imageUrl,
      isActive,
      ingredients,
    } = parseResult.data;

    // Validate that all referenced product IDs exist in database
    const productIds = ingredients.map((ing) => ing.productId);
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });

    const foundIds = new Set(existingProducts.map((p) => p.id));
    const missingIds = productIds.filter((id) => !foundIds.has(id));

    if (missingIds.length > 0) {
      res.status(404).json({
        success: false,
        message: `Validation error: Referenced products not found: [${missingIds.join(", ")}]`,
      });
      return;
    }

    let slug = parseResult.data.slug || slugify(title);
    const existingSlug = await prisma.recipe.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // Atomic transaction: Create recipe and its ingredients together
    const recipe = await prisma.recipe.create({
      data: {
        title,
        slug,
        description: description || null,
        prepTimeMinutes,
        cookTimeMinutes,
        servings,
        difficulty,
        dietaryType,
        cuisine: cuisine || "Indian",
        instructions,
        imageUrl: imageUrl || null,
        isActive,
        authorId: req.user?.id || null,
        ingredients: {
          create: ingredients.map((ing) => ({
            productId: ing.productId,
            quantity: ing.quantity,
            unit: ing.unit,
            isMandatory: ing.isMandatory ?? true,
            notes: ing.notes || null,
          })),
        },
      },
      include: {
        ingredients: {
          include: {
            product: {
              select: { id: true, name: true, category: true, basePrice: true, unit: true },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Recipe created successfully",
      data: { recipe },
    });
  } catch (error) {
    console.error("Create recipe error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while creating recipe",
    });
  }
}

/**
 * Update a recipe (ADMIN only).
 */
export async function updateRecipe(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);

    const parseResult = updateRecipeSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parseResult.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }

    const existing = await prisma.recipe.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        message: `Recipe with ID '${id}' not found`,
      });
      return;
    }

    const input = parseResult.data;

    // If ingredients are being updated, verify product existence
    if (input.ingredients) {
      const productIds = input.ingredients.map((ing) => ing.productId);
      const existingProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true },
      });
      const foundIds = new Set(existingProducts.map((p) => p.id));
      const missingIds = productIds.filter((pId) => !foundIds.has(pId));

      if (missingIds.length > 0) {
        res.status(404).json({
          success: false,
          message: `Update aborted: Products not found: [${missingIds.join(", ")}]`,
        });
        return;
      }
    }

    // Atomic transaction for recipe update
    const updated = await prisma.$transaction(async (tx) => {
      // If ingredients provided, remove existing and re-create
      if (input.ingredients) {
        await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
        await tx.recipeIngredient.createMany({
          data: input.ingredients.map((ing) => ({
            recipeId: id,
            productId: ing.productId,
            quantity: ing.quantity,
            unit: ing.unit,
            isMandatory: ing.isMandatory ?? true,
            notes: ing.notes || null,
          })),
        });
      }

      return tx.recipe.update({
        where: { id },
        data: {
          title: input.title,
          slug: input.slug,
          description: input.description,
          prepTimeMinutes: input.prepTimeMinutes,
          cookTimeMinutes: input.cookTimeMinutes,
          servings: input.servings,
          difficulty: input.difficulty,
          dietaryType: input.dietaryType,
          cuisine: input.cuisine,
          instructions: input.instructions,
          imageUrl: input.imageUrl,
          isActive: input.isActive,
        },
        include: {
          ingredients: {
            include: {
              product: {
                select: { id: true, name: true, unit: true, basePrice: true },
              },
            },
          },
        },
      });
    });

    res.status(200).json({
      success: true,
      message: "Recipe updated successfully",
      data: { recipe: updated },
    });
  } catch (error) {
    console.error("Update recipe error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while updating recipe",
    });
  }
}

/**
 * Delete a recipe (ADMIN only).
 */
export async function deleteRecipe(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);

    const existing = await prisma.recipe.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        message: `Recipe with ID '${id}' not found`,
      });
      return;
    }

    await prisma.recipe.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: "Recipe deleted successfully",
    });
  } catch (error) {
    console.error("Delete recipe error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while deleting recipe",
    });
  }
}

/**
 * Preview recipe ingredients for a target serving size and optional dark store.
 * Prepares the grocery bundle calculation for the upcoming 1-click Cart phase.
 */
export async function previewRecipeIngredients(req: Request, res: Response): Promise<void> {
  try {
    const identifier = getParam(req.params.identifier);

    const queryResult = recipePreviewQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      res.status(400).json({
        success: false,
        message: "Invalid preview query parameters",
        errors: queryResult.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }

    const { servings: targetServings, storeId } = queryResult.data;

    let recipe = await prisma.recipe.findFirst({
      where: {
        OR: [
          { id: identifier },
          { slug: identifier },
          { externalId: identifier },
          { externalId: `themealdb:${identifier}` },
        ],
      },
      include: {
        ingredients: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                category: true,
                unit: true,
                basePrice: true,
                imageUrl: true,
                dietaryType: true,
                isActive: true,
                inventory: storeId
                  ? {
                      where: { storeId },
                      select: {
                        stockQuantity: true,
                        price: true,
                        isAvailable: true,
                      },
                    }
                  : false,
              },
            },
          },
        },
      },
    });

    if (!recipe) {
      const cleanNumeric = identifier.trim().replace(/^(themealdb:|meal-|ext-)/i, "");
      if (/^\d+$/.test(cleanNumeric)) {
        try {
          const importRes = await importRecipeFromTheMealDb(cleanNumeric);
          recipe = await prisma.recipe.findFirst({
            where: { id: importRes.recipe.id },
            include: {
              ingredients: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      category: true,
                      unit: true,
                      basePrice: true,
                      imageUrl: true,
                      dietaryType: true,
                      isActive: true,
                      inventory: storeId
                        ? {
                            where: { storeId },
                            select: {
                              stockQuantity: true,
                              price: true,
                              isAvailable: true,
                            },
                          }
                        : false,
                    },
                  },
                },
              },
            },
          });
        } catch (_) {}
      }
    }

    if (!recipe) {
      res.status(404).json({
        success: false,
        message: `Recipe with identifier '${identifier}' not found`,
      });
      return;
    }

    const effectiveServings = targetServings || recipe.servings;
    const scaleFactor = effectiveServings / recipe.servings;

    let totalEstimatedCost = 0;
    let allItemsAvailable = true;

    const previewIngredients = recipe.ingredients.map((item) => {
      const scaledQuantity = Math.round(item.quantity * scaleFactor * 100) / 100;
      const product = item.product;

      if (!product) {
        return {
          productId: null,
          productName: item.ingredientName || "Ingredient",
          category: "Other",
          recipeUnit: item.unit,
          baseRecipeQuantity: item.quantity,
          scaledQuantity,
          isMandatory: item.isMandatory,
          notes: item.notes || "Not carried in store catalog; purchase separately",
          groceryPackageUnit: null,
          unitPrice: 0,
          inStock: false,
          availableStock: 0,
          estimatedCost: 0,
          isMatched: false,
        };
      }

      // Determine price (store price if available, else basePrice)
      let unitPrice = Number(product.basePrice);
      let inStock = true;
      let stockQuantity = 999;

      if (storeId && Array.isArray(product.inventory) && product.inventory.length > 0) {
        const inv = product.inventory[0];
        unitPrice = Number(inv.price);
        inStock = inv.isAvailable && inv.stockQuantity > 0;
        stockQuantity = inv.stockQuantity;
        if (!inStock) allItemsAvailable = false;
      }

      // Default unit pack size assumption for bundle preparation
      const estimatedItemCost = unitPrice;
      totalEstimatedCost += estimatedItemCost;

      return {
        productId: product.id,
        productName: product.name,
        category: product.category,
        recipeUnit: item.unit,
        baseRecipeQuantity: item.quantity,
        scaledQuantity,
        isMandatory: item.isMandatory,
        notes: item.notes,
        groceryPackageUnit: product.unit,
        unitPrice,
        inStock,
        availableStock: stockQuantity,
        estimatedCost: estimatedItemCost,
        isMatched: true,
      };
    });

    // Structure prepared payload for matched items in 1-click cart addition
    const cartBundlePayload = previewIngredients
      .filter((item) => item.productId !== null && item.inStock)
      .map((item) => ({
        productId: item.productId!,
        productName: item.productName,
        quantity: 1, // 1 grocery pack of the required ingredient
        unitPrice: item.unitPrice,
        isMandatory: item.isMandatory,
        inStock: item.inStock,
      }));

    res.status(200).json({
      success: true,
      message: "Recipe ingredients preview and scaling calculated successfully",
      data: {
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        baseServings: recipe.servings,
        targetServings: effectiveServings,
        scaleFactor,
        storeId: storeId || null,
        allItemsAvailable: storeId ? allItemsAvailable : null,
        totalEstimatedCost: Math.round(totalEstimatedCost * 100) / 100,
        ingredients: previewIngredients,
        cartBundleReady: {
          itemCount: cartBundlePayload.length,
          bundleItems: cartBundlePayload,
        },
      },
    });
  } catch (error) {
    console.error("Preview recipe error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while previewing recipe ingredients",
    });
  }
}

/**
 * Import a recipe from TheMealDB by its numeric ID.
 */
export async function importMealDbRecipe(req: Request, res: Response): Promise<void> {
  try {
    const mealId = getParam(req.params.mealId);
    if (!mealId || !/^\d+$/.test(mealId.trim())) {
      res.status(400).json({
        success: false,
        message: "Invalid TheMealDB ID. Must be numeric (e.g. 52771).",
      });
      return;
    }

    const result = await importRecipeFromTheMealDb(mealId.trim());

    res.status(result.isAlreadyImported ? 200 : 201).json({
      success: true,
      message: result.isAlreadyImported
        ? "Recipe already exists in database."
        : "Recipe imported successfully from TheMealDB.",
      data: result,
    });
  } catch (error: any) {
    console.error("TheMealDB import error:", error?.message || error);
    res.status(error?.message?.includes("not found") ? 404 : 500).json({
      success: false,
      message: error?.message || "Failed to import recipe from TheMealDB.",
    });
  }
}
