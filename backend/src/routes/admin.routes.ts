import { Router } from "express";
import { Role } from "@prisma/client";
import {
  getDashboardMetrics,
  listUsers,
  updateUserStatus,
  assignStoreManager,
  getEligibleStoreManagers,
  getAdminInventory,
  getAdminOrderDetails,
  getEligibleDeliveryPartners,
  assignDeliveryPartner,
} from "../controllers/admin.controller.js";
import { listStores } from "../controllers/store.controller.js";
import { authenticate, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

// All admin endpoints require authentication and ADMIN role
router.use(authenticate, requireRole(Role.ADMIN));

router.get("/metrics", getDashboardMetrics);
router.get("/users", listUsers);
router.patch("/users/:id/status", updateUserStatus);
router.get("/stores", listStores);
router.get("/stores/:id/eligible-managers", getEligibleStoreManagers);
router.patch("/stores/:id/manager", assignStoreManager);
router.get("/inventory", getAdminInventory);
router.get("/orders/:id", getAdminOrderDetails);
router.get("/orders/:id/eligible-delivery-partners", getEligibleDeliveryPartners);
router.patch("/orders/:id/delivery-partner", assignDeliveryPartner);

export default router;
