import { Router } from "express";
import { Role } from "@prisma/client";
import {
  listRecipes,
  getRecipeByIdOrSlug,
  previewRecipeIngredients,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  importMealDbRecipe,
} from "../controllers/recipe.controller.js";
import { authenticate, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

// Public recipe browsing & ingestion routes
router.get("/", listRecipes);
router.post("/import/themealdb/:mealId", importMealDbRecipe);
router.post("/import-mealdb/:mealId", importMealDbRecipe);
router.get("/:identifier/preview", previewRecipeIngredients);
router.get("/:identifier", getRecipeByIdOrSlug);

// Admin-only recipe management routes
router.post("/", authenticate, requireRole(Role.ADMIN), createRecipe);
router.put("/:id", authenticate, requireRole(Role.ADMIN), updateRecipe);
router.delete("/:id", authenticate, requireRole(Role.ADMIN), deleteRecipe);

export default router;
