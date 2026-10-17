import { Router } from "express";
import { Role } from "@prisma/client";
import {
  createStore,
  listStores,
  getStoreById,
  getStoreInventory,
  setInventoryItem,
  updateInventoryItem,
  batchUpdateInventory,
  deleteStoreInventoryItem,
} from "../controllers/store.controller.js";
import { authenticate, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

// Store routes
router.get("/", listStores);
router.get("/:id", getStoreById);
router.post("/", authenticate, requireRole(Role.ADMIN), createStore);

// Store Inventory routes
router.get("/:storeId/inventory", getStoreInventory);
router.post(
  "/:storeId/inventory",
  authenticate,
  requireRole(Role.ADMIN, Role.RETAILER),
  setInventoryItem
);
router.patch(
  "/:storeId/inventory/:productId",
  authenticate,
  requireRole(Role.ADMIN, Role.RETAILER),
  updateInventoryItem
);
router.post(
  "/:storeId/inventory/batch",
  authenticate,
  requireRole(Role.ADMIN, Role.RETAILER),
  batchUpdateInventory
);
router.delete(
  "/:storeId/inventory/:productId",
  authenticate,
  requireRole(Role.ADMIN, Role.RETAILER),
  deleteStoreInventoryItem
);

export default router;
