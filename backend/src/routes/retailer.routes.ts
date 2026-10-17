import { Router } from "express";
import { Role } from "@prisma/client";
import {
  listRetailerOrders,
  getRetailerOrderById,
  updateRetailerOrderStatus,
  getRetailerStoreProfile,
} from "../controllers/retailer.controller.js";
import { authenticate, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

// Retailer endpoints require authentication and RETAILER (or ADMIN) role
router.use(authenticate, requireRole(Role.RETAILER, Role.ADMIN));

router.get("/store", getRetailerStoreProfile);
router.get("/orders", listRetailerOrders);
router.get("/orders/:orderId", getRetailerOrderById);
router.patch("/orders/:orderId/status", updateRetailerOrderStatus);

export default router;
