import { Response } from "express";
import { Prisma, Role, OrderStatus, DeliveryStatus } from "@prisma/client";
import prisma from "../config/prisma.js";
import { AuthenticatedRequest } from "../types/auth.js";
import {
  updateUserStatusSchema,
  assignStoreManagerSchema,
  userQuerySchema,
  assignDeliveryPartnerSchema,
} from "../validations/admin.validation.js";

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || "";
  return param || "";
}

/**
 * GET /api/admin/metrics
 * Retrieve high-level KPIs, store metrics, customer counts, and recent activity.
 */
export async function getDashboardMetrics(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const [
      totalOrders,
      placedOrders,
      deliveredOrders,
      totalCustomers,
      totalRetailers,
      totalDeliveryPartners,
      activeStores,
      totalProducts,
      totalRecipes,
      lowStockCount,
      revenueResult,
      recentOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { orderStatus: OrderStatus.PLACED } }),
      prisma.order.count({ where: { orderStatus: OrderStatus.DELIVERED } }),
      prisma.user.count({ where: { role: Role.CUSTOMER } }),
      prisma.user.count({ where: { role: Role.RETAILER } }),
      prisma.user.count({ where: { role: Role.DELIVERY_PARTNER } }),
      prisma.store.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.recipe.count({ where: { isActive: true } }),
      prisma.inventory.count({ where: { stockQuantity: { lte: 10 } } }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { orderStatus: { not: OrderStatus.CANCELLED } },
      }),
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, phoneNumber: true } },
          store: { select: { id: true, name: true, city: true } },
          delivery: { select: { status: true } },
        },
      }),
    ]);

    const totalRevenue = Number(revenueResult._sum.totalAmount || 0);

    res.status(200).json({
      success: true,
      message: "Dashboard metrics retrieved successfully",
      data: {
        kpis: {
          totalRevenue,
          totalOrders,
          placedOrders,
          deliveredOrders,
          totalCustomers,
          totalRetailers,
          totalDeliveryPartners,
          activeStores,
          totalProducts,
          totalRecipes,
          lowStockAlerts: lowStockCount,
        },
        recentOrders: recentOrders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.user.name,
          customerPhone: o.user.phoneNumber,
          storeName: o.store.name,
          storeCity: o.store.city,
          totalAmount: Number(o.totalAmount),
          orderStatus: o.orderStatus,
          paymentStatus: o.paymentStatus,
          deliveryStatus: o.delivery?.status,
          createdAt: o.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching dashboard metrics",
    });
  }
}

/**
 * GET /api/admin/users
 * List users with role filter, search, and pagination.
 */
export async function listUsers(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const parseResult = userQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: parseResult.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }

    const { role, search, page, limit } = parseResult.data;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(role ? { role } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { phoneNumber: { contains: search } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          role: true,
          isActive: true,
          createdAt: true,
          managedStore: {
            select: { id: true, name: true, city: true },
          },
          _count: {
            select: {
              orders: true,
              deliveries: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        users,
      },
    });
  } catch (error) {
    console.error("List users error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching users",
    });
  }
}

/**
 * PATCH /api/admin/users/:id/status
 * Activate or deactivate a user account (e.g. approve partner or suspend account).
 */
export async function updateUserStatus(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const id = getParam(req.params.id);
    const parseResult = updateUserStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parseResult.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }

    const { isActive } = parseResult.data;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      res.status(404).json({ success: false, message: `User with ID '${id}' not found` });
      return;
    }

    // Prevent deactivating own account
    if (req.user?.id === id && !isActive) {
      res.status(400).json({ success: false, message: "You cannot deactivate your own admin account" });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: `User '${updated.name}' account ${isActive ? "activated/approved" : "deactivated"} successfully`,
      data: { user: updated },
    });
  } catch (error) {
    console.error("Update user status error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while updating user status",
    });
  }
}

/**
 * PATCH /api/admin/stores/:id/manager
 * Assign or remove the dark store manager (must have Role.RETAILER).
 */
export async function assignStoreManager(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const storeId = getParam(req.params.id);
    const parseResult = assignStoreManagerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parseResult.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }

    const { managerId } = parseResult.data;

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      res.status(404).json({ success: false, message: `Store with ID '${storeId}' not found` });
      return;
    }

    if (managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: managerId },
        include: { managedStore: { select: { id: true, name: true } } },
      });

      if (!manager) {
        res.status(404).json({ success: false, message: `Manager user with ID '${managerId}' not found` });
        return;
      }

      // Role check: Only RETAILER or ADMIN
      if (manager.role !== Role.RETAILER && manager.role !== Role.ADMIN) {
        res.status(400).json({
          success: false,
          message: `User must have role RETAILER or ADMIN to be assigned as store manager. Current role: ${manager.role}`,
        });
        return;
      }

      // Account status check: Cannot assign inactive/suspended retailer
      if (!manager.isActive) {
        res.status(400).json({
          success: false,
          message: `Cannot assign inactive or suspended retailer '${manager.name}' as store manager. Please approve and activate their account first.`,
        });
        return;
      }

      // Duplicate assignment check: 1-to-1 relationship enforced
      if (manager.managedStore && manager.managedStore.id !== storeId) {
        res.status(400).json({
          success: false,
          message: `Retailer '${manager.name}' is already managing '${manager.managedStore.name}'. Each retailer can manage at most one dark store.`,
        });
        return;
      }
    }

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: { managerId },
      include: {
        manager: {
          select: { id: true, name: true, phoneNumber: true, email: true, isActive: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: managerId
        ? `Store manager assigned successfully to ${updatedStore.manager?.name}`
        : "Store manager unassigned successfully",
      data: { store: updatedStore },
    });
  } catch (error) {
    console.error("Assign store manager error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while assigning store manager",
    });
  }
}

/**
 * GET /api/admin/stores/:id/eligible-managers
 * Return active retailers that are either unassigned or currently assigned to this store.
 */
export async function getEligibleStoreManagers(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const storeId = getParam(req.params.id);

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, name: true, managerId: true },
    });

    if (!store) {
      res.status(404).json({ success: false, message: `Store with ID '${storeId}' not found` });
      return;
    }

    // Find active retailers not assigned to other stores
    const eligibleRetailers = await prisma.user.findMany({
      where: {
        role: Role.RETAILER,
        isActive: true,
        OR: [
          { managedStore: null },
          { managedStore: { id: storeId } },
        ],
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        email: true,
        isActive: true,
        managedStore: {
          select: { id: true, name: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Eligible store managers retrieved successfully",
      data: {
        currentManagerId: store.managerId,
        eligibleManagers: eligibleRetailers.map((r) => ({
          id: r.id,
          name: r.name,
          phoneNumber: r.phoneNumber,
          email: r.email,
          isCurrentManager: r.id === store.managerId,
        })),
      },
    });
  } catch (error) {
    console.error("Get eligible store managers error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching eligible store managers",
    });
  }
}

/**
 * GET /api/admin/inventory
 * Comprehensive inventory overview across stores with low stock and product details.
 */
export async function getAdminInventory(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const storeId = typeof req.query.storeId === "string" ? req.query.storeId : undefined;
    const lowStockOnly = req.query.lowStock === "true";

    const where: Prisma.InventoryWhereInput = {
      ...(storeId ? { storeId } : {}),
      ...(lowStockOnly ? { stockQuantity: { lte: 10 } } : {}),
    };

    const inventories = await prisma.inventory.findMany({
      where,
      orderBy: [{ stockQuantity: "asc" }, { updatedAt: "desc" }],
      include: {
        product: {
          select: { id: true, name: true, category: true, unit: true, basePrice: true, imageUrl: true },
        },
        store: {
          select: { id: true, name: true, city: true },
        },
      },
      take: 100,
    });

    res.status(200).json({
      success: true,
      message: "Admin inventory retrieved successfully",
      data: {
        count: inventories.length,
        inventories: inventories.map((inv) => ({
          id: inv.id,
          storeId: inv.storeId,
          storeName: inv.store.name,
          storeCity: inv.store.city,
          productId: inv.productId,
          productName: inv.product.name,
          productCategory: inv.product.category,
          productUnit: inv.product.unit,
          productImageUrl: inv.product.imageUrl,
          basePrice: Number(inv.product.basePrice),
          storePrice: Number(inv.price),
          stockQuantity: inv.stockQuantity,
          isAvailable: inv.isAvailable,
          isLowStock: inv.stockQuantity <= 10,
          updatedAt: inv.updatedAt,
        })),
      },
    });
  } catch (error) {
    console.error("Admin inventory error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching inventory",
    });
  }
}

/**
 * GET /api/admin/orders/:id
 * Retrieve comprehensive order details including customer, delivery partner, address, and item snapshot.
 * Accessible only to authenticated ADMINs.
 */
export async function getAdminOrderDetails(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const orderId = getParam(req.params.id);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
        address: {
          select: {
            id: true,
            label: true,
            addressLine1: true,
            addressLine2: true,
            landmark: true,
            city: true,
            state: true,
            postalCode: true,
            latitude: true,
            longitude: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            postalCode: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                unit: true,
                imageUrl: true,
                dietaryType: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        delivery: {
          select: {
            id: true,
            status: true,
            pickupTime: true,
            deliveredTime: true,
            currentLatitude: true,
            currentLongitude: true,
            deliveryPartner: {
              select: {
                id: true,
                name: true,
                phoneNumber: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        message: `Order with ID '${orderId}' not found`,
      });
      return;
    }

    const subtotal = order.items.reduce(
      (acc, item) => acc + Number(item.subtotal),
      0
    );

    res.status(200).json({
      success: true,
      message: "Order details retrieved successfully",
      data: {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          specialInstructions: order.specialInstructions,
          subtotal: Math.round(subtotal * 100) / 100,
          deliveryFee: Number(order.deliveryFee),
          totalAmount: Number(order.totalAmount),
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          customer: order.user
            ? {
                id: order.user.id,
                name: order.user.name,
                email: order.user.email,
                phoneNumber: order.user.phoneNumber,
              }
            : null,
          deliveryAddress: order.address
            ? {
                id: order.address.id,
                label: order.address.label,
                addressLine1: order.address.addressLine1,
                addressLine2: order.address.addressLine2,
                landmark: order.address.landmark,
                city: order.address.city,
                state: order.address.state,
                postalCode: order.address.postalCode,
                latitude: order.address.latitude,
                longitude: order.address.longitude,
              }
            : null,
          store: order.store
            ? {
                id: order.store.id,
                name: order.store.name,
                address: order.store.address,
                city: order.store.city,
                state: order.store.state,
                postalCode: order.store.postalCode,
              }
            : null,
          items: order.items.map((i) => ({
            id: i.id,
            productId: i.productId,
            productName: i.productName,
            unitPrice: Number(i.unitPrice),
            quantity: i.quantity,
            subtotal: Number(i.subtotal),
            unit: i.product?.unit || null,
            imageUrl: i.product?.imageUrl || null,
            dietaryType: i.product?.dietaryType || null,
          })),
          delivery: order.delivery
            ? {
                id: order.delivery.id,
                status:
                  !order.delivery.deliveryPartner &&
                  order.delivery.status === DeliveryStatus.ASSIGNED
                    ? "UNASSIGNED"
                    : order.delivery.status,
                rawStatus: order.delivery.status,
                pickupTime: order.delivery.pickupTime,
                deliveredTime: order.delivery.deliveredTime,
                currentLatitude: order.delivery.currentLatitude,
                currentLongitude: order.delivery.currentLongitude,
                deliveryPartner: order.delivery.deliveryPartner
                  ? {
                      id: order.delivery.deliveryPartner.id,
                      name: order.delivery.deliveryPartner.name,
                      phoneNumber: order.delivery.deliveryPartner.phoneNumber,
                      email: order.delivery.deliveryPartner.email,
                    }
                  : null,
              }
            : null,
        },
      },
    });
  } catch (error) {
    console.error("Admin get order details error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while retrieving order details",
    });
  }
}

/**
 * GET /api/admin/orders/:id/eligible-delivery-partners
 * Return list of active delivery partners with their active delivery counts, availability, and assignment eligibility.
 */
export async function getEligibleDeliveryPartners(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const orderId = getParam(req.params.id);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        delivery: {
          include: {
            deliveryPartner: {
              select: { id: true, name: true, phoneNumber: true, email: true },
            },
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({ success: false, message: `Order with ID '${orderId}' not found` });
      return;
    }

    if (!order.delivery) {
      res.status(404).json({ success: false, message: `No delivery record found for order '${orderId}'` });
      return;
    }

    // Determine if order lifecycle allows assignment/reassignment
    let canAssign = true;
    let restrictionReason: string | null = null;

    if (order.orderStatus === OrderStatus.CANCELLED) {
      canAssign = false;
      restrictionReason = "Order has been cancelled.";
    } else if (order.orderStatus === OrderStatus.DELIVERED || order.delivery.status === DeliveryStatus.DELIVERED) {
      canAssign = false;
      restrictionReason = "Order has already been delivered.";
    } else if (
      order.delivery.status === DeliveryStatus.PICKED_UP ||
      order.delivery.status === DeliveryStatus.ARRIVED_AT_LOCATION
    ) {
      canAssign = false;
      restrictionReason = `Order is currently '${order.delivery.status}' and cannot be reassigned after store pickup.`;
    }

    // Fetch all active delivery partners
    const partners = await prisma.user.findMany({
      where: {
        role: Role.DELIVERY_PARTNER,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        email: true,
        isActive: true,
        deliveries: {
          where: {
            status: {
              in: [
                DeliveryStatus.ASSIGNED,
                DeliveryStatus.ACCEPTED,
                DeliveryStatus.PICKED_UP,
                DeliveryStatus.ARRIVED_AT_LOCATION,
              ],
            },
          },
          select: {
            id: true,
            status: true,
            orderId: true,
            order: {
              select: {
                orderNumber: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const currentPartnerId = order.delivery.deliveryPartnerId;

    const formattedPartners = partners.map((p) => {
      // Other active deliveries excluding this specific order
      const otherActiveDeliveries = p.deliveries.filter((d) => d.id !== order.delivery?.id);
      const activeDeliveriesCount = otherActiveDeliveries.length;
      const isCurrentPartner = p.id === currentPartnerId;
      const isAvailable = activeDeliveriesCount === 0;

      let availabilityStatus = "Available";
      if (activeDeliveriesCount > 0) {
        const activeOrderNumbers = otherActiveDeliveries
          .map((d) => d.order?.orderNumber)
          .filter(Boolean)
          .join(", ");
        availabilityStatus = `Busy (${activeDeliveriesCount} active ${
          activeDeliveriesCount === 1 ? "order" : "orders"
        }: ${activeOrderNumbers})`;
      }

      return {
        id: p.id,
        name: p.name,
        phoneNumber: p.phoneNumber,
        email: p.email,
        isActive: p.isActive,
        activeDeliveriesCount,
        isAvailable,
        isCurrentPartner,
        availabilityStatus,
      };
    });

    // Sort: current partner first, then available partners, then busy
    formattedPartners.sort((a, b) => {
      if (a.isCurrentPartner) return -1;
      if (b.isCurrentPartner) return 1;
      if (a.isAvailable && !b.isAvailable) return -1;
      if (!a.isAvailable && b.isAvailable) return 1;
      return a.name.localeCompare(b.name);
    });

    const isUnassigned =
      !order.delivery.deliveryPartnerId &&
      order.delivery.status === DeliveryStatus.ASSIGNED;

    res.status(200).json({
      success: true,
      message: "Eligible delivery partners retrieved successfully",
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        deliveryId: order.delivery.id,
        deliveryStatus: isUnassigned ? "UNASSIGNED" : order.delivery.status,
        rawDeliveryStatus: order.delivery.status,
        canAssign,
        restrictionReason,
        currentPartner: order.delivery.deliveryPartner || null,
        partners: formattedPartners,
      },
    });
  } catch (error) {
    console.error("Get eligible delivery partners error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching eligible delivery partners",
    });
  }
}

/**
 * PATCH /api/admin/orders/:id/delivery-partner
 * Assign, reassign, or unassign delivery partner with atomic lifecycle checks and concurrency safeguards.
 */
export async function assignDeliveryPartner(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const orderId = getParam(req.params.id);

    const parseResult = assignDeliveryPartnerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parseResult.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }

    const { deliveryPartnerId, confirmReassign } = parseResult.data;

    // Execute atomic transaction for checking state, verifying partner concurrency, and assigning
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          delivery: {
            include: {
              deliveryPartner: {
                select: { id: true, name: true, phoneNumber: true },
              },
            },
          },
        },
      });

      if (!order) {
        throw { statusCode: 404, message: `Order with ID '${orderId}' not found` };
      }

      if (!order.delivery) {
        throw { statusCode: 404, message: `No delivery record found for order '${orderId}'` };
      }

      const delivery = order.delivery;

      // 1. Lifecycle Status Checks
      if (order.orderStatus === OrderStatus.CANCELLED) {
        throw { statusCode: 400, message: "Cannot assign delivery partner to a cancelled order." };
      }

      if (order.orderStatus === OrderStatus.DELIVERED || delivery.status === DeliveryStatus.DELIVERED) {
        throw { statusCode: 400, message: "Cannot assign delivery partner to an already delivered order." };
      }

      if (
        delivery.status === DeliveryStatus.PICKED_UP ||
        delivery.status === DeliveryStatus.ARRIVED_AT_LOCATION
      ) {
        throw {
          statusCode: 400,
          message: `Cannot reassign delivery partner. Order has already been picked up (current status: '${delivery.status}').`,
        };
      }

      // 2. Unassigning Partner
      if (deliveryPartnerId === null) {
        const updatedDelivery = await tx.delivery.update({
          where: { id: delivery.id },
          data: {
            deliveryPartnerId: null,
            status: DeliveryStatus.ASSIGNED,
          },
          include: {
            deliveryPartner: {
              select: { id: true, name: true, phoneNumber: true, email: true },
            },
          },
        });

        return {
          message: "Delivery partner unassigned successfully. Order is now unassigned.",
          delivery: updatedDelivery,
        };
      }

      // 3. Assigning New Partner: Validate user exists, role is DELIVERY_PARTNER, and is active
      const partnerUser = await tx.user.findUnique({
        where: { id: deliveryPartnerId },
        select: { id: true, name: true, phoneNumber: true, email: true, role: true, isActive: true },
      });

      if (!partnerUser) {
        throw { statusCode: 404, message: `Delivery partner user with ID '${deliveryPartnerId}' not found` };
      }

      if (partnerUser.role !== Role.DELIVERY_PARTNER) {
        throw {
          statusCode: 400,
          message: `User '${partnerUser.name}' does not have the DELIVERY_PARTNER role. Current role: ${partnerUser.role}`,
        };
      }

      if (!partnerUser.isActive) {
        throw {
          statusCode: 400,
          message: `Delivery partner '${partnerUser.name}' is currently suspended or inactive.`,
        };
      }

      // 4. Concurrency Guard: Check if rider is already handling another active delivery
      const activePartnerDeliveries = await tx.delivery.findMany({
        where: {
          deliveryPartnerId,
          id: { not: delivery.id },
          status: {
            in: [
              DeliveryStatus.ASSIGNED,
              DeliveryStatus.ACCEPTED,
              DeliveryStatus.PICKED_UP,
              DeliveryStatus.ARRIVED_AT_LOCATION,
            ],
          },
        },
        include: {
          order: {
            select: { orderNumber: true },
          },
        },
      });

      if (activePartnerDeliveries.length > 0) {
        const activeOrderNumbers = activePartnerDeliveries.map((d) => d.order?.orderNumber).join(", ");
        throw {
          statusCode: 409,
          message: `Delivery partner '${partnerUser.name}' already has an active delivery in progress (Order: ${activeOrderNumbers}). Each rider may only handle one active delivery at a time.`,
        };
      }

      // 5. Existing Assignment Overwrite Safeguard
      if (
        delivery.deliveryPartnerId &&
        delivery.deliveryPartnerId !== deliveryPartnerId &&
        !confirmReassign
      ) {
        const currentName = delivery.deliveryPartner?.name || "another partner";
        throw {
          statusCode: 409,
          message: `Order is currently assigned to ${currentName}. Please confirm reassignment to proceed.`,
          requiresConfirmation: true,
        };
      }

      // 6. Perform Assignment
      const updatedDelivery = await tx.delivery.update({
        where: { id: delivery.id },
        data: {
          deliveryPartnerId,
          status: DeliveryStatus.ASSIGNED, // Freshly assigned; rider must accept
        },
        include: {
          deliveryPartner: {
            select: { id: true, name: true, phoneNumber: true, email: true },
          },
        },
      });

      return {
        message: delivery.deliveryPartnerId
          ? `Order successfully reassigned to ${partnerUser.name}`
          : `Order successfully assigned to ${partnerUser.name}`,
        delivery: updatedDelivery,
      };
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        delivery: {
          id: result.delivery.id,
          status: result.delivery.deliveryPartner ? result.delivery.status : "UNASSIGNED",
          rawStatus: result.delivery.status,
          deliveryPartner: result.delivery.deliveryPartner,
        },
      },
    });
  } catch (error: any) {
    if (error && error.statusCode) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        requiresConfirmation: !!error.requiresConfirmation,
      });
      return;
    }

    console.error("Assign delivery partner error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while assigning delivery partner",
    });
  }
}


