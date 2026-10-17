import { Router, Response } from "express";
import { Role } from "@prisma/client";
import { register, login, getProfile } from "../controllers/auth.controller.js";
import { authenticate, requireRole } from "../middlewares/auth.middleware.js";
import { AuthenticatedRequest } from "../types/auth.js";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes (Any authenticated user)
router.get("/me", authenticate, getProfile);

// RBAC Protected routes for role verification
router.get("/admin-check", authenticate, requireRole(Role.ADMIN), (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Admin access granted",
    role: req.user?.role,
  });
});

router.get("/retailer-check", authenticate, requireRole(Role.RETAILER), (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Retailer access granted",
    role: req.user?.role,
  });
});

router.get("/delivery-check", authenticate, requireRole(Role.DELIVERY_PARTNER), (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Delivery partner access granted",
    role: req.user?.role,
  });
});

export default router;
