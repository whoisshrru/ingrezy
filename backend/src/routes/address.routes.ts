import { Router } from "express";
import { Role } from "@prisma/client";
import { createAddress, listAddresses } from "../controllers/address.controller.js";
import { authenticate, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate, requireRole(Role.CUSTOMER));

router.post("/", createAddress);
router.get("/", listAddresses);

export default router;
