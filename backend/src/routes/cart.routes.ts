import { Router } from "express";
import { Role } from "@prisma/client";
import {
  getCart,
  addCartItem,
  updateCartItem,
  deleteCartItem,
  clearCart,
  addRecipeToCart,
} from "../controllers/cart.controller.js";
import { authenticate, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

// All cart endpoints are customer-only
router.use(authenticate, requireRole(Role.CUSTOMER));

router.get("/", getCart);
router.post("/items", addCartItem);
router.patch("/items/:itemId", updateCartItem);
router.delete("/items/:itemId", deleteCartItem);
router.delete("/", clearCart);
router.post("/recipes/:recipeId", addRecipeToCart);

export default router;
