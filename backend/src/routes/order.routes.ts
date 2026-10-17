import { Router } from "express";
import { Role } from "@prisma/client";
import {
  checkout,
  listOrders,
  getOrderById,
  getCustomerDeliveryOtp,
} from "../controllers/order.controller.js";
import { authenticate, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

// Checkout requires Customer role
router.post("/checkout", authenticate, requireRole(Role.CUSTOMER), checkout);

// Order viewing requires authentication
router.get("/", authenticate, listOrders);
router.get("/:id", authenticate, getOrderById);

// Customer delivery OTP retrieval
router.get("/:id/delivery-otp", authenticate, requireRole(Role.CUSTOMER, Role.ADMIN), getCustomerDeliveryOtp);

export default router;
