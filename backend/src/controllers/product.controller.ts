import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma.js";
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from "../validations/product.validation.js";

/**
 * Generate a URL-friendly slug from product name.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * List products with search, filtering, and pagination.
 */
export async function listProducts(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = productQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: parseResult.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }

    const { page, limit, search, category, dietaryType, isActive } = parseResult.data;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    } else {
      where.isActive = true;
    }

    if (category) {
      where.category = { equals: category, mode: "insensitive" };
    }

    if (dietaryType) {
      where.dietaryType = dietaryType;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: {
        products,
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
    console.error("List products error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching products",
    });
  }
}

/**
 * Get product details by ID or slug.
 */
export async function getProductByIdOrSlug(req: Request, res: Response): Promise<void> {
  try {
    const rawIdentifier = req.params.identifier;
    const identifier = Array.isArray(rawIdentifier) ? rawIdentifier[0] : rawIdentifier;

    if (!identifier) {
      res.status(400).json({
        success: false,
        message: "Product identifier is required",
      });
      return;
    }

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
      },
      include: {
        inventory: {
          select: {
            storeId: true,
            stockQuantity: true,
            price: true,
            isAvailable: true,
            store: {
              select: {
                id: true,
                name: true,
                city: true,
                postalCode: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: `Product with identifier '${identifier}' not found`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Product retrieved successfully",
      data: { product },
    });
  } catch (error) {
    console.error("Get product error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while retrieving product",
    });
  }
}

/**
 * Create a new product (ADMIN only).
 */
export async function createProduct(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = createProductSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parseResult.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }

    const { name, description, category, unit, basePrice, imageUrl, dietaryType, isActive } =
      parseResult.data;

    let slug = parseResult.data.slug || slugify(name);

    // Ensure unique slug
    const existingSlug = await prisma.product.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: description || null,
        category,
        unit,
        basePrice: new Prisma.Decimal(basePrice),
        imageUrl: imageUrl || null,
        dietaryType,
        isActive,
      },
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: { product },
    });
  } catch (error) {
    console.error("Create product error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while creating product",
    });
  }
}

/**
 * Update an existing product (ADMIN only).
 */
export async function updateProduct(req: Request, res: Response): Promise<void> {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id) {
      res.status(400).json({ success: false, message: "Product ID is required" });
      return;
    }

    const parseResult = updateProductSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parseResult.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        message: `Product with ID '${id}' not found`,
      });
      return;
    }

    const data: Prisma.ProductUpdateInput = {};
    const input = parseResult.data;

    if (input.name !== undefined) data.name = input.name;
    if (input.slug !== undefined) data.slug = input.slug;
    if (input.description !== undefined) data.description = input.description;
    if (input.category !== undefined) data.category = input.category;
    if (input.unit !== undefined) data.unit = input.unit;
    if (input.basePrice !== undefined) data.basePrice = new Prisma.Decimal(input.basePrice);
    if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl || null;
    if (input.dietaryType !== undefined) data.dietaryType = input.dietaryType;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    const updated = await prisma.product.update({
      where: { id },
      data,
    });

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: { product: updated },
    });
  } catch (error) {
    console.error("Update product error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while updating product",
    });
  }
}

/**
 * Delete a product (ADMIN only).
 * If order references exist, performs a soft delete (isActive: false) to maintain data integrity.
 */
export async function deleteProduct(req: Request, res: Response): Promise<void> {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id) {
      res.status(400).json({ success: false, message: "Product ID is required" });
      return;
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        message: `Product with ID '${id}' not found`,
      });
      return;
    }

    const orderCount = await prisma.orderItem.count({ where: { productId: id } });

    // If already ordered in past, soft delete to preserve historical receipts
    if (orderCount > 0) {
      await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });

      res.status(200).json({
        success: true,
        message: "Product marked inactive (soft deleted) as it is linked to past orders",
      });
      return;
    }

    // Otherwise delete product and cascade inventory
    await prisma.product.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while deleting product",
    });
  }
}
