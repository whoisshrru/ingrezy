import { Response } from "express";
import prisma from "../config/prisma.js";
import { AuthenticatedRequest } from "../types/auth.js";
import { createAddressSchema } from "../validations/order.validation.js";

/**
 * POST /api/addresses
 * Create delivery address for authenticated customer.
 */
export async function createAddress(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const parseResult = createAddressSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parseResult.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }

    const address = await prisma.address.create({
      data: {
        userId,
        ...parseResult.data,
      },
    });

    res.status(201).json({
      success: true,
      message: "Address created successfully",
      data: { address },
    });
  } catch (error) {
    console.error("Create address error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while creating address",
    });
  }
}

/**
 * GET /api/addresses
 * List all delivery addresses for authenticated customer.
 */
export async function listAddresses(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      message: "Addresses retrieved successfully",
      data: { addresses },
    });
  } catch (error) {
    console.error("List addresses error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while retrieving addresses",
    });
  }
}
