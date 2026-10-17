import { Router } from "express";
import { Role } from "@prisma/client";
import {
  getDeliveryProfile,
  getAssignedDeliveries,
  acceptDeliveryAssignment,
  rejectDeliveryAssignment,
  confirmPickup,
  completeDelivery,
  updateLocation,
} from "../controllers/delivery.controller.js";
import { authenticate, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

// Delivery endpoints require authentication and DELIVERY_PARTNER (or ADMIN) role
router.use(authenticate, requireRole(Role.DELIVERY_PARTNER, Role.ADMIN));

router.get("/profile", getDeliveryProfile);
router.get("/assignments", getAssignedDeliveries);
router.patch("/assignments/:deliveryId/accept", acceptDeliveryAssignment);
router.patch("/assignments/:deliveryId/reject", rejectDeliveryAssignment);
router.patch("/assignments/:deliveryId/pickup", confirmPickup);
router.post("/assignments/:deliveryId/complete", completeDelivery);
router.patch("/location", updateLocation);

export default router;
