import { Response } from "express";
import { Prisma, DeliveryStatus, OrderStatus, PaymentStatus } from "@prisma/client";
import prisma from "../config/prisma.js";
import { AuthenticatedRequest } from "../types/auth.js";
import {
  deliveryQuerySchema,
  updateLocationSchema,
  completeDeliverySchema,
} from "../validations/delivery.validation.js";
import { generateOtp, hashOtp, verifyOtp } from "../utils/otp.js";

/**
 * Helper to safely extract string param from Express 5 params
 */
function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || "";
  return param || "";
}

/**
 * GET /api/delivery/profile
 * Return delivery partner's profile and lifetime delivery statistics.
 */
export async function getDeliveryProfile(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const [assignedCount, inTransitCount, completedCount, totalCount] = await Promise.all([
      prisma.delivery.count({
        where: { deliveryPartnerId: user.id, status: { in: [DeliveryStatus.ASSIGNED, DeliveryStatus.ACCEPTED] } },
      }),
      prisma.delivery.count({
        where: { deliveryPartnerId: user.id, status: { in: [DeliveryStatus.PICKED_UP, DeliveryStatus.ARRIVED_AT_LOCATION] } },
      }),
      prisma.delivery.count({
        where: { deliveryPartnerId: user.id, status: DeliveryStatus.DELIVERED },
      }),
      prisma.delivery.count({
        where: { deliveryPartnerId: user.id },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: "Delivery partner profile retrieved",
      data: {
        partner: {
          id: user.id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          email: user.email,
          role: user.role,
        },
        stats: {
          pendingAcceptance: assignedCount,
          activeInTransit: inTransitCount,
          completedDeliveries: completedCount,
          totalAssigned: totalCount,
        },
      },
    });
  } catch (error) {
    console.error("Delivery profile error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching delivery partner profile",
    });
  }
}

/**
 * GET /api/delivery/assignments
 * Return deliveries assigned to the authenticated delivery partner.
 */
export async function getAssignedDeliveries(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const parseResult = deliveryQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: parseResult.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }

    const { page, limit, status } = parseResult.data;
    const skip = (page - 1) * limit;

    const where: Prisma.DeliveryWhereInput = {
      deliveryPartnerId: user.id,
    };

    if (status) {
      where.status = status;
    }

    const [total, deliveries] = await Promise.all([
      prisma.delivery.count({ where }),
      prisma.delivery.findMany({
        where,
        skip,
        take: limit,
        include: {
          order: {
            include: {
              store: { select: { id: true, name: true, address: true, city: true, postalCode: true } },
              address: { select: { id: true, label: true, addressLine1: true, landmark: true, city: true, postalCode: true } },
              user: { select: { id: true, name: true, phoneNumber: true } },
              _count: { select: { items: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      message: "Assigned deliveries retrieved successfully",
      data: {
        deliveries: deliveries.map((d) => ({
          deliveryId: d.id,
          deliveryStatus: d.status,
          pickupTime: d.pickupTime,
          deliveredTime: d.deliveredTime,
          currentLocation: d.currentLatitude && d.currentLongitude ? { lat: d.currentLatitude, lng: d.currentLongitude } : null,
          order: {
            id: d.order.id,
            orderNumber: d.order.orderNumber,
            orderStatus: d.order.orderStatus,
            paymentStatus: d.order.paymentStatus,
            paymentMethod: d.order.paymentMethod,
            totalAmount: Number(d.order.totalAmount),
            deliveryFee: Number(d.order.deliveryFee),
            itemsCount: d.order._count.items,
            pickupStore: d.order.store,
            deliveryAddress: d.order.address,
            customer: {
              name: d.order.user.name,
              phone: d.order.user.phoneNumber,
            },
          },
          createdAt: d.createdAt,
        })),
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
    console.error("Get assignments error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching assigned deliveries",
    });
  }
}

/**
 * PATCH /api/delivery/assignments/:deliveryId/accept
 * Accept an assigned delivery.
 */
export async function acceptDeliveryAssignment(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const deliveryId = getParam(req.params.deliveryId);

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { order: true },
    });

    if (!delivery) {
      res.status(404).json({ success: false, message: `Delivery with ID '${deliveryId}' not found` });
      return;
    }

    if (delivery.deliveryPartnerId !== user.id) {
      res.status(403).json({
        success: false,
        message: "Access denied. You are not the assigned delivery partner for this order.",
      });
      return;
    }

    if (delivery.status !== DeliveryStatus.ASSIGNED) {
      res.status(400).json({
        success: false,
        message: `Cannot accept delivery. Current status is '${delivery.status}'.`,
      });
      return;
    }

    if (delivery.order.orderStatus === OrderStatus.CANCELLED) {
      res.status(400).json({
        success: false,
        message: "Cannot accept delivery. The underlying order was cancelled.",
      });
      return;
    }

    const updated = await prisma.delivery.update({
      where: { id: deliveryId },
      data: { status: DeliveryStatus.ACCEPTED },
    });

    res.status(200).json({
      success: true,
      message: "Delivery assignment accepted successfully",
      data: {
        deliveryId: updated.id,
        status: updated.status,
      },
    });
  } catch (error) {
    console.error("Accept delivery error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while accepting delivery assignment",
    });
  }
}

/**
 * PATCH /api/delivery/assignments/:deliveryId/reject
 * Reject assignment so it can be safely reassigned.
 */
export async function rejectDeliveryAssignment(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const deliveryId = getParam(req.params.deliveryId);

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      res.status(404).json({ success: false, message: `Delivery with ID '${deliveryId}' not found` });
      return;
    }

    if (delivery.deliveryPartnerId !== user.id) {
      res.status(403).json({
        success: false,
        message: "Access denied. You are not the assigned delivery partner for this order.",
      });
      return;
    }

    if (delivery.status === DeliveryStatus.DELIVERED || delivery.status === DeliveryStatus.PICKED_UP) {
      res.status(400).json({
        success: false,
        message: `Cannot reject delivery. Order is already '${delivery.status}'.`,
      });
      return;
    }

    // Release partner assignment and return status to ASSIGNED for next rider
    const updated = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        deliveryPartnerId: null,
        status: DeliveryStatus.ASSIGNED,
      },
    });

    res.status(200).json({
      success: true,
      message: "Delivery assignment rejected and released for reassignment",
      data: {
        deliveryId: updated.id,
        status: updated.status,
        reassigned: true,
      },
    });
  } catch (error) {
    console.error("Reject delivery error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while rejecting delivery assignment",
    });
  }
}

/**
 * PATCH /api/delivery/assignments/:deliveryId/pickup
 * Confirm pickup from dark store counter.
 * Requires Order to be READY_FOR_PICKUP and Delivery to be ACCEPTED.
 */
export async function confirmPickup(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const deliveryId = getParam(req.params.deliveryId);

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        order: {
          select: { id: true, orderNumber: true, orderStatus: true, storeId: true },
        },
      },
    });

    if (!delivery) {
      res.status(404).json({ success: false, message: `Delivery with ID '${deliveryId}' not found` });
      return;
    }

    if (delivery.deliveryPartnerId !== user.id) {
      res.status(403).json({
        success: false,
        message: "Access denied. You are not the assigned delivery partner for this order.",
      });
      return;
    }

    if (delivery.status !== DeliveryStatus.ACCEPTED) {
      res.status(400).json({
        success: false,
        message: `Delivery must be 'ACCEPTED' before pickup. Current delivery status: '${delivery.status}'.`,
      });
      return;
    }

    if (delivery.order.orderStatus !== OrderStatus.READY_FOR_PICKUP) {
      res.status(400).json({
        success: false,
        message: `Dark store has not marked order as 'READY_FOR_PICKUP'. Current order status: '${delivery.order.orderStatus}'. Please wait for store preparation to complete.`,
      });
      return;
    }

    // Generate delivery OTP and securely store its hash
    const rawOtp = generateOtp();
    const hashedOtp = hashOtp(rawOtp);
    const otpExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes validity

    // Atomic transaction: update delivery to PICKED_UP and order to OUT_FOR_DELIVERY
    const result = await prisma.$transaction(async (tx) => {
      const updatedDelivery = await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          status: DeliveryStatus.PICKED_UP,
          pickupTime: new Date(),
          otpHash: hashedOtp,
          otpExpiresAt: otpExpiry,
          otpAttempts: 0,
        },
      });

      const updatedOrder = await tx.order.update({
        where: { id: delivery.order.id },
        data: {
          orderStatus: OrderStatus.OUT_FOR_DELIVERY,
        },
      });

      return { updatedDelivery, updatedOrder };
    });

    res.status(200).json({
      success: true,
      message: "Order picked up from dark store! Now out for delivery. Customer has been issued delivery OTP.",
      data: {
        deliveryId: result.updatedDelivery.id,
        orderId: result.updatedOrder.id,
        orderNumber: result.updatedOrder.orderNumber,
        deliveryStatus: result.updatedDelivery.status,
        orderStatus: result.updatedOrder.orderStatus,
        pickupTime: result.updatedDelivery.pickupTime,
      },
    });
  } catch (error) {
    console.error("Confirm pickup error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while confirming order pickup",
    });
  }
}

/**
 * POST /api/delivery/assignments/:deliveryId/complete
 * Complete delivery with 6-digit OTP verification.
 */
export async function completeDelivery(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const deliveryId = getParam(req.params.deliveryId);

    const parseResult = completeDeliverySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parseResult.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }

    const { otp: candidateOtp } = parseResult.data;

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        order: {
          select: { id: true, orderNumber: true, orderStatus: true, paymentMethod: true, paymentStatus: true },
        },
      },
    });

    if (!delivery) {
      res.status(404).json({ success: false, message: `Delivery with ID '${deliveryId}' not found` });
      return;
    }

    if (delivery.deliveryPartnerId !== user.id) {
      res.status(403).json({
        success: false,
        message: "Access denied. You are not the assigned delivery partner for this order.",
      });
      return;
    }

    if (delivery.status === DeliveryStatus.DELIVERED) {
      res.status(400).json({
        success: false,
        message: "Delivery is already completed.",
      });
      return;
    }

    if (delivery.status !== DeliveryStatus.PICKED_UP && delivery.status !== DeliveryStatus.ARRIVED_AT_LOCATION) {
      res.status(400).json({
        success: false,
        message: `Cannot complete delivery. Order must be picked up first. Current status: '${delivery.status}'.`,
      });
      return;
    }

    // Check OTP existence
    if (!delivery.otpHash) {
      res.status(400).json({
        success: false,
        message: "No active delivery OTP found for this order. Customer must generate OTP.",
      });
      return;
    }

    // Check OTP expiration
    if (delivery.otpExpiresAt && new Date() > delivery.otpExpiresAt) {
      res.status(400).json({
        success: false,
        message: "Delivery OTP has expired. Please ask the customer to refresh OTP from their order screen.",
      });
      return;
    }

    // Check attempt limits (max 5 attempts)
    if (delivery.otpAttempts >= 5) {
      res.status(400).json({
        success: false,
        message: "Maximum OTP attempts exceeded. Please contact customer support for verification.",
      });
      return;
    }

    // Verify OTP securely using timing-safe comparison
    const isOtpValid = verifyOtp(candidateOtp, delivery.otpHash);

    if (!isOtpValid) {
      const remainingAttempts = 4 - delivery.otpAttempts;
      await prisma.delivery.update({
        where: { id: deliveryId },
        data: { otpAttempts: { increment: 1 } },
      });

      res.status(400).json({
        success: false,
        message: `Invalid delivery OTP. ${Math.max(0, remainingAttempts)} attempt(s) remaining.`,
      });
      return;
    }

    // Successful OTP verification: Complete delivery and update order status in an atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedDelivery = await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          status: DeliveryStatus.DELIVERED,
          deliveredTime: new Date(),
          otpHash: null,
          otpExpiresAt: null,
          otpAttempts: 0,
        },
      });

      const updatedOrder = await tx.order.update({
        where: { id: delivery.order.id },
        data: {
          orderStatus: OrderStatus.DELIVERED,
          // If COD order, cash was collected at doorstep, so payment transitions to COMPLETED
          paymentStatus:
            delivery.order.paymentMethod === "COD"
              ? PaymentStatus.COMPLETED
              : delivery.order.paymentStatus,
        },
      });

      return { updatedDelivery, updatedOrder };
    });

    res.status(200).json({
      success: true,
      message: "Order successfully delivered! OTP verified and payment updated.",
      data: {
        deliveryId: result.updatedDelivery.id,
        orderId: result.updatedOrder.id,
        orderNumber: result.updatedOrder.orderNumber,
        deliveryStatus: result.updatedDelivery.status,
        orderStatus: result.updatedOrder.orderStatus,
        paymentStatus: result.updatedOrder.paymentStatus,
        deliveredTime: result.updatedDelivery.deliveredTime,
      },
    });
  } catch (error) {
    console.error("Complete delivery error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while completing delivery",
    });
  }
}

/**
 * PATCH /api/delivery/location
 * Update live GPS coordinates for delivery tracking.
 */
export async function updateLocation(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const parseResult = updateLocationSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parseResult.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }

    const { latitude, longitude, deliveryId } = parseResult.data;

    const where: Prisma.DeliveryWhereInput = {
      deliveryPartnerId: user.id,
      status: {
        in: [DeliveryStatus.ACCEPTED, DeliveryStatus.PICKED_UP, DeliveryStatus.ARRIVED_AT_LOCATION],
      },
    };

    if (deliveryId) {
      where.id = deliveryId;
    }

    const activeDelivery = await prisma.delivery.findFirst({
      where,
      orderBy: { updatedAt: "desc" },
    });

    if (!activeDelivery) {
      res.status(404).json({
        success: false,
        message: "No active in-transit delivery found to update location",
      });
      return;
    }

    const updated = await prisma.delivery.update({
      where: { id: activeDelivery.id },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
      },
    });

    res.status(200).json({
      success: true,
      message: "Delivery location updated successfully",
      data: {
        deliveryId: updated.id,
        latitude: updated.currentLatitude,
        longitude: updated.currentLongitude,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update location error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while updating location",
    });
  }
}
