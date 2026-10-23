import { Response } from "express";
import { Prisma, OrderStatus, DeliveryStatus, Role } from "@prisma/client";
import prisma from "../config/prisma.js";
import { AuthenticatedRequest } from "../types/auth.js";
import {
  retailerOrderQuerySchema,
  updateOrderStatusSchema,
} from "../validations/retailer.validation.js";

/**
 * Helper to safely extract string param from Express 5 params
 */
function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || "";
  return param || "";
}

/**
 * Helper to find the dark store managed by the retailer
 */
async function getManagedStore(userId: string) {
  let store = await prisma.store.findUnique({
    where: { managerId: userId },
    select: {
      id: true,
      name: true,
      city: true,
      address: true,
      postalCode: true,
      isActive: true,
    },
  });

  if (store) return store;

  // Auto-assign an unmanaged active dark store so the retailer can immediately operate their portal
  const unmanaged = await prisma.store.findFirst({
    where: { managerId: null, isActive: true },
    select: {
      id: true,
      name: true,
      city: true,
      address: true,
      postalCode: true,
      isActive: true,
    },
  });

  if (unmanaged) {
    await prisma.store.update({
      where: { id: unmanaged.id },
      data: { managerId: userId },
    }).catch(() => {});
    return unmanaged;
  }

  // Create a dedicated dark store for this retailer if all existing stores have managers
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  const newStore = await prisma.store.create({
    data: {
      name: `${user?.name || "Retailer"} Central Dark Store`,
      managerId: userId,
      address: "Shop 12, Koregaon Park Road",
      city: "Pune",
      state: "Maharashtra",
      postalCode: "411001",
      latitude: 18.5362,
      longitude: 73.8940,
      serviceRadiusKm: 10.0,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      city: true,
      address: true,
      postalCode: true,
      isActive: true,
    },
  });

  // Populate catalog inventory
  const products = await prisma.product.findMany({ select: { id: true, basePrice: true } });
  if (products.length > 0) {
    const existing = await prisma.inventory.findMany({
      where: {
        storeId: newStore.id,
        productId: { in: products.map((p) => p.id) },
      },
      select: { productId: true },
    });
    const existingProductIds = new Set(existing.map((e) => e.productId));
    const toInsert = products
      .filter((p) => !existingProductIds.has(p.id))
      .map((p) => ({
        storeId: newStore.id,
        productId: p.id,
        stockQuantity: 100,
        price: p.basePrice,
        isAvailable: true,
      }));

    if (toInsert.length > 0) {
      await prisma.inventory.createMany({
        data: toInsert,
      }).catch(() => {});
    }
  }

  return newStore;
}

/**
 * GET /api/retailer/store
 * View retailer's assigned dark store profile and current order statistics.
 */
export async function getRetailerStoreProfile(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const store = await getManagedStore(user.id);
    if (!store) {
      res.status(404).json({
        success: false,
        message: "No dark store is assigned to your retailer account. Please contact admin.",
      });
      return;
    }

    const [placedCount, preparingCount, readyCount, totalOrders] = await Promise.all([
      prisma.order.count({ where: { storeId: store.id, orderStatus: OrderStatus.PLACED } }),
      prisma.order.count({ where: { storeId: store.id, orderStatus: OrderStatus.PREPARING } }),
      prisma.order.count({ where: { storeId: store.id, orderStatus: OrderStatus.READY_FOR_PICKUP } }),
      prisma.order.count({ where: { storeId: store.id } }),
    ]);

    res.status(200).json({
      success: true,
      message: "Retailer store profile retrieved",
      data: {
        store,
        stats: {
          pendingAcceptance: placedCount,
          inPreparation: preparingCount,
          readyForPickup: readyCount,
          lifetimeOrders: totalOrders,
        },
      },
    });
  } catch (error) {
    console.error("Retailer store profile error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching store profile",
    });
  }
}

/**
 * GET /api/retailer/orders
 * List orders belonging to the retailer's assigned store with status, date filtering, and pagination.
 */
export async function listRetailerOrders(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const store = await getManagedStore(user.id);
    if (!store) {
      res.status(404).json({
        success: false,
        message: "No dark store is assigned to your retailer account. Please contact admin.",
      });
      return;
    }

    const parseResult = retailerOrderQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: parseResult.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }

    const { page, limit, status, startDate, endDate } = parseResult.data;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      storeId: store.id,
    };

    if (status) {
      where.orderStatus = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, phoneNumber: true } },
          address: { select: { label: true, city: true, addressLine1: true } },
          delivery: { select: { status: true, deliveryPartnerId: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      message: "Store orders retrieved successfully",
      data: {
        storeId: store.id,
        storeName: store.name,
        orders: orders.map((o) => {
          const isUnassigned =
            !o.delivery?.deliveryPartnerId && o.delivery?.status === DeliveryStatus.ASSIGNED;
          return {
            id: o.id,
            orderNumber: o.orderNumber,
            customerName: o.user.name,
            customerPhone: o.user.phoneNumber,
            deliveryCity: o.address.city,
            orderStatus: o.orderStatus,
            paymentStatus: o.paymentStatus,
            paymentMethod: o.paymentMethod,
            totalAmount: Number(o.totalAmount),
            itemsCount: o._count.items,
            deliveryStatus: isUnassigned ? "UNASSIGNED" : (o.delivery?.status || "UNASSIGNED"),
            deliveryPartnerId: o.delivery?.deliveryPartnerId || null,
            createdAt: o.createdAt,
          };
        }),
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
    console.error("List retailer orders error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching store orders",
    });
  }
}

/**
 * GET /api/retailer/orders/:orderId
 * Get comprehensive order details for the retailer (products, quantities, address, customer contact).
 */
export async function getRetailerOrderById(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const orderId = getParam(req.params.orderId);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: { select: { id: true, name: true, managerId: true } },
        user: { select: { id: true, name: true, phoneNumber: true, email: true } },
        address: true,
        items: true,
        delivery: {
          include: {
            deliveryPartner: { select: { id: true, name: true, phoneNumber: true } },
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

    // Authorization check: Retailer must manage the store that received this order
    if (user.role !== Role.ADMIN && order.store.managerId !== user.id) {
      res.status(403).json({
        success: false,
        message: "Access denied. This order belongs to a different dark store.",
      });
      return;
    }

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
          totalAmount: Number(order.totalAmount),
          deliveryFee: Number(order.deliveryFee),
          specialInstructions: order.specialInstructions,
          store: {
            id: order.store.id,
            name: order.store.name,
          },
          customer: {
            id: order.user.id,
            name: order.user.name,
            phoneNumber: order.user.phoneNumber,
            email: order.user.email,
          },
          deliveryAddress: {
            id: order.address.id,
            label: order.address.label,
            addressLine1: order.address.addressLine1,
            addressLine2: order.address.addressLine2,
            landmark: order.address.landmark,
            city: order.address.city,
            state: order.address.state,
            postalCode: order.address.postalCode,
          },
          items: order.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            unitPrice: Number(item.unitPrice),
            quantity: item.quantity,
            subtotal: Number(item.subtotal),
          })),
          delivery: order.delivery
            ? {
                id: order.delivery.id,
                status: order.delivery.status,
                deliveryPartner: order.delivery.deliveryPartner
                  ? {
                      id: order.delivery.deliveryPartner.id,
                      name: order.delivery.deliveryPartner.name,
                      phone: order.delivery.deliveryPartner.phoneNumber,
                    }
                  : null,
                pickupTime: order.delivery.pickupTime,
                deliveredTime: order.delivery.deliveredTime,
              }
            : null,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("Get retailer order error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while retrieving order details",
    });
  }
}

/**
 * PATCH /api/retailer/orders/:orderId/status
 * Handle valid retailer order transitions:
 * - PLACED -> CONFIRMED (Accept) or CANCELLED (Reject)
 * - CONFIRMED -> PREPARING (Start Packing) or CANCELLED
 * - PREPARING -> READY_FOR_PICKUP (Packing Complete, ready for driver) or CANCELLED
 */
export async function updateRetailerOrderStatus(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const orderId = getParam(req.params.orderId);

    const parseResult = updateOrderStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parseResult.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }

    const { status: targetStatus, reason } = parseResult.data;

    // Load order with store and items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: { select: { id: true, managerId: true, name: true } },
        items: true,
        delivery: true,
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        message: `Order with ID '${orderId}' not found`,
      });
      return;
    }

    // Authorization: Store manager check
    if (user.role !== Role.ADMIN && order.store.managerId !== user.id) {
      res.status(403).json({
        success: false,
        message: "Access denied. You cannot modify orders for another dark store.",
      });
      return;
    }

    const currentStatus = order.orderStatus;

    // 1. Disallow delivery-partner-specific statuses by retailer
    if (
      targetStatus === OrderStatus.OUT_FOR_DELIVERY ||
      targetStatus === OrderStatus.DELIVERED
    ) {
      res.status(400).json({
        success: false,
        message: `Retailers cannot transition orders to '${targetStatus}'. That status is managed exclusively by the delivery partner.`,
      });
      return;
    }

    // 2. Disallow resetting to initial PLACED state
    if (targetStatus === OrderStatus.PLACED) {
      res.status(400).json({
        success: false,
        message: "Cannot reset an order back to 'PLACED' status.",
      });
      return;
    }

    // 3. Disallow modifications if already finalized or picked up
    if (currentStatus === OrderStatus.CANCELLED) {
      res.status(400).json({
        success: false,
        message: "Cannot update a cancelled order.",
      });
      return;
    }

    if (
      currentStatus === OrderStatus.OUT_FOR_DELIVERY ||
      currentStatus === OrderStatus.DELIVERED
    ) {
      res.status(400).json({
        success: false,
        message: `Order is already '${currentStatus}' and has left the dark store. It cannot be updated by the retailer.`,
      });
      return;
    }

    if (currentStatus === OrderStatus.READY_FOR_PICKUP && targetStatus !== OrderStatus.CANCELLED) {
      res.status(400).json({
        success: false,
        message: "Order is already packed and staged as 'READY_FOR_PICKUP'. Awaiting delivery partner pickup.",
      });
      return;
    }

    // 4. Validate allowed sequential transitions
    // Allowed paths:
    // PLACED -> CONFIRMED or CANCELLED
    // CONFIRMED -> PREPARING or CANCELLED
    // PREPARING -> READY_FOR_PICKUP or CANCELLED
    let isTransitionValid = false;

    if (targetStatus === OrderStatus.CANCELLED) {
      isTransitionValid = true; // Can reject/cancel during store preparation phase
    } else if (currentStatus === OrderStatus.PLACED && targetStatus === OrderStatus.CONFIRMED) {
      isTransitionValid = true;
    } else if (currentStatus === OrderStatus.CONFIRMED && targetStatus === OrderStatus.PREPARING) {
      isTransitionValid = true;
    } else if (currentStatus === OrderStatus.PREPARING && targetStatus === OrderStatus.READY_FOR_PICKUP) {
      isTransitionValid = true;
    }

    if (!isTransitionValid) {
      res.status(400).json({
        success: false,
        message: `Invalid order status transition from '${currentStatus}' to '${targetStatus}'. Allowed flow: PLACED -> CONFIRMED -> PREPARING -> READY_FOR_PICKUP (or CANCELLED).`,
      });
      return;
    }

    // 5. Execute state transition using an atomic Prisma Transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // If cancelled by retailer, replenish inventory stock
      if (targetStatus === OrderStatus.CANCELLED) {
        for (const item of order.items) {
          await tx.inventory.update({
            where: {
              storeId_productId: {
                storeId: order.storeId,
                productId: item.productId,
              },
            },
            data: {
              stockQuantity: { increment: item.quantity },
              isAvailable: true,
            },
          });
        }

        // If delivery record exists, mark delivery as FAILED/CANCELLED
        if (order.delivery) {
          await tx.delivery.update({
            where: { orderId: order.id },
            data: { status: DeliveryStatus.FAILED },
          });
        }
      }

      // Update Order record
      return tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: targetStatus,
          specialInstructions: reason
            ? `${order.specialInstructions ? `${order.specialInstructions} | ` : ""}Retailer note: ${reason}`
            : order.specialInstructions,
        },
        include: {
          delivery: true,
        },
      });
    });

    res.status(200).json({
      success: true,
      message: `Order status successfully transitioned from '${currentStatus}' to '${targetStatus}'`,
      data: {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        previousStatus: currentStatus,
        currentStatus: updatedOrder.orderStatus,
        deliveryStatus: updatedOrder.delivery?.status,
        updatedAt: updatedOrder.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update retailer order status error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while updating order status",
    });
  }
}
