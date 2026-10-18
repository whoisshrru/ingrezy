import { Router } from "express";
import { Role } from "@prisma/client";
import {
  listProducts,
  getProductByIdOrSlug,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";
import { authenticate, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

// Public catalog routes
router.get("/", listProducts);
router.get("/:identifier", getProductByIdOrSlug);

// Admin-only product management routes
router.post("/", authenticate, requireRole(Role.ADMIN), createProduct);
router.put("/:id", authenticate, requireRole(Role.ADMIN), updateProduct);
router.patch("/:id", authenticate, requireRole(Role.ADMIN), updateProduct);
router.delete("/:id", authenticate, requireRole(Role.ADMIN), deleteProduct);

export default router;
