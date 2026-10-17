import { DietaryType, Prisma } from "@prisma/client";
import prisma from "../config/prisma.js";
import { matchIngredientToProduct, parseMeasurement } from "./ingredientMapper.service.js";

export interface RawExtractedIngredient {
  rawName: string;
  rawMeasure: string;
}

export interface MealDbMealResponse {
  idMeal: string;
  strMeal: string;
  strCategory?: string;
  strArea?: string;
  strInstructions?: string;
  strMealThumb?: string;
  [key: string]: any;
}

/**
 * Infer dietary type from TheMealDB category and meal title keywords.
 */
function inferDietaryType(category?: string, title?: string): DietaryType {
  const cat = (category || "").toLowerCase();
  const t = (title || "").toLowerCase();

  if (cat.includes("vegan") || t.includes("vegan")) return DietaryType.VEGAN;
  if (cat.includes("vegetarian") || t.includes("veg") || cat.includes("pasta") || cat.includes("side")) {
    // If title has meat keywords, keep NON_VEG
    if (t.includes("chicken") || t.includes("beef") || t.includes("pork") || t.includes("fish") || t.includes("mutton")) {
      return DietaryType.NON_VEG;
    }
    return DietaryType.VEG;
  }
  if (cat.includes("chicken") || cat.includes("beef") || cat.includes("pork") || cat.includes("seafood") || cat.includes("meat")) {
    return DietaryType.NON_VEG;
  }
  return DietaryType.VEG;
}

/**
 * Generate a clean unique slug for the imported recipe.
 */
function generateSlug(title: string, externalId: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base}-${externalId}`.slice(0, 80);
}

/**
 * Fetches raw meal data from TheMealDB API.
 */
export async function fetchFromMealDb(mealId: string, retries = 2): Promise<MealDbMealResponse | null> {
  const cleanId = mealId.trim();
  const url = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(cleanId)}`;

  let lastError: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        throw new Error(`TheMealDB API returned HTTP ${response.status}`);
      }

      const json = (await response.json()) as any;
      if (!json || !json.meals || !Array.isArray(json.meals) || json.meals.length === 0) {
        return null;
      }

      return json.meals[0] as MealDbMealResponse;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  throw lastError;
}

/**
 * Extracts all non-empty ingredients and measures from TheMealDB meal payload.
 */
export function extractIngredientsFromMeal(meal: MealDbMealResponse): RawExtractedIngredient[] {
  const list: RawExtractedIngredient[] = [];

  for (let i = 1; i <= 20; i++) {
    const rawIng = meal[`strIngredient${i}`];
    const rawMeas = meal[`strMeasure${i}`];

    if (!rawIng || typeof rawIng !== "string") continue;
    const cleanIng = rawIng.trim();
    if (!cleanIng || cleanIng.toLowerCase() === "null") continue;

    const cleanMeas = (rawMeas && typeof rawMeas === "string" && rawMeas.trim().toLowerCase() !== "null")
      ? rawMeas.trim()
      : "";

    list.push({
      rawName: cleanIng,
      rawMeasure: cleanMeas,
    });
  }

  return list;
}

/**
 * Imports a recipe from TheMealDB into PostgreSQL.
 * If the recipe is already imported, returns the existing record idempotently without creating duplicates.
 */
export async function importRecipeFromTheMealDb(mealId: string) {
  const cleanId = mealId.trim();
  const externalKey = `themealdb:${cleanId}`;

  // 1. Check if already imported
  const existing = await prisma.recipe.findUnique({
    where: { externalId: externalKey },
    include: {
      ingredients: {
        include: {
          product: {
            select: { id: true, name: true, unit: true, basePrice: true, category: true, imageUrl: true },
          },
        },
      },
    },
  });

  if (existing) {
    const matchedCount = existing.ingredients.filter((i) => i.productId !== null).length;
    return {
      recipe: existing,
      isAlreadyImported: true,
      stats: {
        totalIngredients: existing.ingredients.length,
        matchedCount,
        unmatchedCount: existing.ingredients.length - matchedCount,
      },
    };
  }

  // 2. Fetch fresh from TheMealDB
  const meal = await fetchFromMealDb(cleanId);
  if (!meal) {
    throw new Error(`Recipe with TheMealDB ID '${cleanId}' was not found in TheMealDB.`);
  }

  const title = (meal.strMeal || "Imported Recipe").trim();
  const cuisine = (meal.strArea || "International").trim();
  const dietaryType = inferDietaryType(meal.strCategory, title);
  const instructions = (meal.strInstructions || "No instructions provided.").trim();
  const imageUrl = meal.strMealThumb ? meal.strMealThumb.trim() : null;
  const slug = generateSlug(title, cleanId);

  // 3. Extract and match ingredients
  const extractedIngredients = extractIngredientsFromMeal(meal);

  const mappedIngredientsData: Array<Prisma.RecipeIngredientCreateWithoutRecipeInput> = [];
  let matchedCount = 0;

  for (const item of extractedIngredients) {
    const match = await matchIngredientToProduct(item.rawName);
    const parsed = parseMeasurement(item.rawMeasure);

    if (match.isMatched && match.productId) {
      matchedCount++;
    }

    mappedIngredientsData.push({
      product: match.isMatched && match.productId ? { connect: { id: match.productId } } : undefined,
      ingredientName: item.rawName,
      rawMeasure: item.rawMeasure || null,
      quantity: parsed.quantity,
      unit: parsed.unit,
      isMandatory: true,
      notes: match.isMatched ? `Matched to ${match.productName}` : "Unmatched catalog ingredient",
    });
  }

  // 4. Save to PostgreSQL in an atomic transaction
  const newRecipe = await prisma.$transaction(async (tx) => {
    const created = await tx.recipe.create({
      data: {
        externalId: externalKey,
        source: "THEMEALDB",
        title,
        slug,
        description: `Imported from TheMealDB (${meal.strCategory || "Recipe"})`,
        prepTimeMinutes: 15,
        cookTimeMinutes: 30,
        servings: 2,
        difficulty: "MEDIUM",
        dietaryType,
        cuisine,
        instructions,
        imageUrl,
        isActive: true,
        ingredients: {
          create: mappedIngredientsData,
        },
      },
      include: {
        ingredients: {
          include: {
            product: {
              select: { id: true, name: true, unit: true, basePrice: true, category: true, imageUrl: true },
            },
          },
        },
      },
    });

    return created;
  });

  return {
    recipe: newRecipe,
    isAlreadyImported: false,
    stats: {
      totalIngredients: mappedIngredientsData.length,
      matchedCount,
      unmatchedCount: mappedIngredientsData.length - matchedCount,
    },
  };
}
