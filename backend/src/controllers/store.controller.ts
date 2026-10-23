import { Request, Response } from "express";
import { Prisma, Role } from "@prisma/client";
import prisma from "../config/prisma.js";
import { AuthenticatedRequest, AuthUser } from "../types/auth.js";
import {
  createStoreSchema,
  setInventoryItemSchema,
  updateInventoryItemSchema,
  batchInventorySchema,
  storeInventoryQuerySchema,
} from "../validations/store.validation.js";

/**
 * Helper to safely extract string param from Express 5 params
 */
function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || "";
  return param || "";
}

/**
 * Check if the authenticated user has rights to manage this store.
 * ADMIN has universal access; RETAILER must be the assigned store manager.
 */
async function checkStoreAccess(
  user: AuthUser,
  storeId: string
): Promise<{ allowed: boolean; status: number; message: string }> {
  if (user.role === Role.ADMIN) {
    return { allowed: true, status: 200, message: "Authorized as Admin" };
  }

  if (user.role === Role.RETAILER) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, managerId: true },
    });

    if (!store) {
      return { allowed: false, status: 404, message: `Store with ID '${storeId}' not found` };
    }

    if (store.managerId === user.id) {
      return { allowed: true, status: 200, message: "Authorized as Store Manager" };
    }

    return {
      allowed: false,
      status: 403,
      message: "Access denied. You are not the assigned manager for this store.",
    };
  }

  return {
    allowed: false,
    status: 403,
    message: "Access denied. Only Admins and assigned Retailers can manage store inventory.",
  };
}

/**
 * Create a new store (ADMIN only).
 */
export async function createStore(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = createStoreSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parseResult.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }

    const { managerId, ...storeData } = parseResult.data;

    if (managerId) {
      const manager = await prisma.user.findUnique({ where: { id: managerId } });
      if (!manager) {
        res.status(404).json({
          success: false,
          message: `Manager user with ID '${managerId}' not found`,
        });
        return;
      }
      if (manager.role !== Role.RETAILER && manager.role !== Role.ADMIN) {
        res.status(400).json({
          success: false,
          message: `Store manager must have RETAILER or ADMIN role. Current role: ${manager.role}`,
        });
        return;
      }
    }

    const store = await prisma.store.create({
      data: {
        ...storeData,
        managerId: managerId || null,
      },
      include: {
        manager: {
          select: { id: true, name: true, phoneNumber: true, email: true, role: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Store created successfully",
      data: { store },
    });
  } catch (error) {
    console.error("Create store error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while creating store",
    });
  }
}

/**
 * List all active stores (Public / Customer / Retailer).
 */
export async function listStores(req: Request, res: Response): Promise<void> {
  try {
    const stores = await prisma.store.findMany({
      where: { isActive: true },
      include: {
        manager: {
          select: { id: true, name: true, phoneNumber: true },
        },
        _count: {
          select: { inventory: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      message: "Stores retrieved successfully",
      data: { stores },
    });
  } catch (error) {
    console.error("List stores error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching stores",
    });
  }
}

/**
 * Get store details by ID.
 */
export async function getStoreById(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);

    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        manager: {
          select: { id: true, name: true, phoneNumber: true, email: true },
        },
        _count: {
          select: { inventory: true },
        },
      },
    });

    if (!store) {
      res.status(404).json({
        success: false,
        message: `Store with ID '${id}' not found`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Store details retrieved successfully",
      data: { store },
    });
  } catch (error) {
    console.error("Get store error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while retrieving store",
    });
  }
}

/**
 * Get store inventory with pagination, search, and category filtering.
 */
export async function getStoreInventory(req: Request, res: Response): Promise<void> {
  try {
    const storeId = getParam(req.params.storeId);

    const parseResult = storeInventoryQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: parseResult.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }

    const { page, limit, search, category, availableOnly } = parseResult.data;
    const skip = (page - 1) * limit;

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      res.status(404).json({
        success: false,
        message: `Store with ID '${storeId}' not found`,
      });
      return;
    }

    const where: Prisma.InventoryWhereInput = {
      storeId,
    };

    if (availableOnly === "true") {
      where.isAvailable = true;
      where.stockQuantity = { gt: 0 };
    }

    if (category || search) {
      where.product = {};
      if (category) {
        where.product.category = { equals: category, mode: "insensitive" };
      }
      if (search) {
        where.product.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }
    }

    const [total, items] = await Promise.all([
      prisma.inventory.count({ where }),
      prisma.inventory.findMany({
        where,
        skip,
        take: limit,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              category: true,
              unit: true,
              basePrice: true,
              imageUrl: true,
              dietaryType: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      message: "Store inventory retrieved successfully",
      data: {
        storeId,
        storeName: store.name,
        inventory: items,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get inventory error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching store inventory",
    });
  }
}

/**
 * Set/Upsert inventory item for a store (ADMIN or store's RETAILER).
 */
export async function setInventoryItem(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const storeId = getParam(req.params.storeId);

    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const access = await checkStoreAccess(req.user, storeId);
    if (!access.allowed) {
      res.status(access.status).json({ success: false, message: access.message });
      return;
    }

    const parseResult = setInventoryItemSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parseResult.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }

    const { productId, stockQuantity, price, isAvailable } = parseResult.data;

    // Verify product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      res.status(404).json({
        success: false,
        message: `Product with ID '${productId}' not found`,
      });
      return;
    }

    const inventoryItem = await prisma.inventory.upsert({
      where: {
        storeId_productId: {
          storeId,
          productId,
        },
      },
      create: {
        storeId,
        productId,
        stockQuantity,
        price,
        isAvailable: isAvailable ?? true,
      },
      update: {
        stockQuantity,
        price,
        isAvailable: isAvailable ?? true,
      },
      include: {
        product: {
          select: { id: true, name: true, unit: true, category: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Store inventory updated successfully",
      data: { inventoryItem },
    });
  } catch (error) {
    console.error("Set inventory error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while updating inventory",
    });
  }
}

/**
 * Patch an inventory item (ADMIN or store's RETAILER).
 */
export async function updateInventoryItem(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const storeId = getParam(req.params.storeId);
    const productId = getParam(req.params.productId);

    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const access = await checkStoreAccess(req.user, storeId);
    if (!access.allowed) {
      res.status(access.status).json({ success: false, message: access.message });
      return;
    }

    const parseResult = updateInventoryItemSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parseResult.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }

    const existing = await prisma.inventory.findUnique({
      where: {
        storeId_productId: {
          storeId,
          productId,
        },
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: `Inventory record for product '${productId}' not found in store '${storeId}'`,
      });
      return;
    }

    const data: Prisma.InventoryUpdateInput = {};
    const input = parseResult.data;

    if (input.stockQuantity !== undefined) data.stockQuantity = input.stockQuantity;
    if (input.price !== undefined) data.price = input.price;
    if (input.isAvailable !== undefined) data.isAvailable = input.isAvailable;

    const updated = await prisma.inventory.update({
      where: {
        storeId_productId: {
          storeId,
          productId,
        },
      },
      data,
      include: {
        product: {
          select: { id: true, name: true, unit: true, category: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Inventory item updated successfully",
      data: { inventoryItem: updated },
    });
  } catch (error) {
    console.error("Update inventory error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while updating inventory item",
    });
  }
}

/**
 * Batch update inventory items using an atomic Prisma Transaction.
 * If any product is missing or fails, the whole transaction rolls back.
 */
export async function batchUpdateInventory(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const storeId = getParam(req.params.storeId);

    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const access = await checkStoreAccess(req.user, storeId);
    if (!access.allowed) {
      res.status(access.status).json({ success: false, message: access.message });
      return;
    }

    const parseResult = batchInventorySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parseResult.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }

    const { items } = parseResult.data;
    const productIds = items.map((item) => item.productId);

    // Verify all products exist before starting transaction
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });

    const foundIds = new Set(existingProducts.map((p) => p.id));
    const missingIds = productIds.filter((id) => !foundIds.has(id));

    if (missingIds.length > 0) {
      res.status(404).json({
        success: false,
        message: `Batch update aborted: Products not found: [${missingIds.join(", ")}]`,
      });
      return;
    }

    // Execute atomic Prisma transaction
    const results = await prisma.$transaction(
      items.map((item) =>
        prisma.inventory.upsert({
          where: {
            storeId_productId: {
              storeId,
              productId: item.productId,
            },
          },
          create: {
            storeId,
            productId: item.productId,
            stockQuantity: item.stockQuantity,
            price: item.price,
            isAvailable: item.isAvailable ?? true,
          },
          update: {
            stockQuantity: item.stockQuantity,
            price: item.price,
            isAvailable: item.isAvailable ?? true,
          },
        })
      )
    );

    res.status(200).json({
      success: true,
      message: `Batch inventory updated successfully for ${results.length} items`,
      data: {
        updatedCount: results.length,
      },
    });
  } catch (error) {
    console.error("Batch inventory error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error during batch inventory transaction",
    });
  }
}

/**
 * Remove product from store inventory (ADMIN or store's RETAILER).
 */
export async function deleteStoreInventoryItem(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const storeId = getParam(req.params.storeId);
    const productId = getParam(req.params.productId);

    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const access = await checkStoreAccess(req.user, storeId);
    if (!access.allowed) {
      res.status(access.status).json({ success: false, message: access.message });
      return;
    }

    const existing = await prisma.inventory.findUnique({
      where: {
        storeId_productId: {
          storeId,
          productId,
        },
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: `Product '${productId}' is not listed in store '${storeId}' inventory`,
      });
      return;
    }

    await prisma.inventory.delete({
      where: {
        storeId_productId: {
          storeId,
          productId,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Product removed from store inventory successfully",
    });
  } catch (error) {
    console.error("Delete inventory item error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while deleting inventory item",
    });
  }
}
