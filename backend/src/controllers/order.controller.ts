import crypto from "node:crypto";
import { Response } from "express";
import { Prisma, OrderStatus, PaymentStatus, DeliveryStatus, Role } from "@prisma/client";
import prisma from "../config/prisma.js";
import { AuthenticatedRequest } from "../types/auth.js";
import { checkoutSchema } from "../validations/order.validation.js";
import { generateOtp, hashOtp } from "../utils/otp.js";
import {
  checkoutIdempotency,
  CheckoutResponsePayload,
  buildCanonicalPayload,
  hashCanonicalPayload,
} from "../utils/checkoutIdempotency.js";

export type CheckoutTxHook = (tx: Prisma.TransactionClient, correlationId: string) => Promise<void>;
let activeTestTxHook: CheckoutTxHook | null = null;

export function __setTestTxHook(hook: CheckoutTxHook | null): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Security violation: Test hooks are only permitted in test environment");
  }
  activeTestTxHook = hook;
}

/**
 * Helper to safely extract string param from Express 5 params
 */
function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || "";
  return param || "";
}

/**
 * POST /api/orders/checkout
 * Checkout customer's cart using an atomic Prisma transaction.
 * Revalidates stock, decrements inventory safely, creates order snapshots, and clears cart.
 */
export async function checkout(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  const parseResult = checkoutSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parseResult.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
    });
    return;
  }

  const { addressId, paymentMethod, specialInstructions, idempotencyKey: bodyIdempotencyKey } = parseResult.data;

  // Support standard HTTP Idempotency-Key headers or body key
  const rawIdempotencyKey =
    (req.headers["idempotency-key"] as string | undefined) ||
    (req.headers["x-idempotency-key"] as string | undefined) ||
    bodyIdempotencyKey;
  const sanitizedIdempotencyKey = rawIdempotencyKey?.trim() || null;

  try {
    // 1. Persistent Idempotency Check (Checked before touching or relying on active cart)
    if (sanitizedIdempotencyKey) {
      // Step A: Check active/completed IdempotencyRecord first
      const record = await (prisma as any).idempotencyRecord.findUnique({
        where: {
          userId_key: {
            userId,
            key: sanitizedIdempotencyKey,
          },
        },
      });

      if (record) {
        if (record.status === "COMPLETED") {
          // If items were explicitly supplied in incoming request, verify canonical hash
          if (parseResult.data.items && parseResult.data.items.length > 0) {
            const incomingCanonical = buildCanonicalPayload(
              addressId,
              paymentMethod,
              specialInstructions,
              parseResult.data.items
            );
            const incomingHash = hashCanonicalPayload(incomingCanonical);
            if (incomingHash === record.requestHash) {
              res.setHeader("X-Idempotent-Replayed", "true");
              res.status(record.statusCode || 201).json(record.response);
              return;
            }
            res.status(409).json({
              success: false,
              message: "Idempotency key reused with different checkout parameters or items",
            });
            return;
          }

          // Legacy retry without items while temporary record is active
          // Verify immutable fields against the order's requestPayloadSnapshot
          if (record.orderId) {
            const linkedOrder = await (prisma.order as any).findUnique({
              where: { id: record.orderId },
            });
            const snapshot = linkedOrder?.requestPayloadSnapshot as any;
            if (
              snapshot &&
              (snapshot.addressId !== addressId ||
                snapshot.paymentMethod !== (paymentMethod || "COD") ||
                snapshot.specialInstructions !== (specialInstructions || null))
            ) {
              res.status(409).json({
                success: false,
                message: "Idempotency key reused with different checkout parameters or items",
              });
              return;
            }
          }

          res.setHeader("X-Idempotent-Replayed", "true");
          res.status(record.statusCode || 201).json(record.response);
          return;
        }
        // If status === 'IN_PROGRESS', proceed to transaction so PostgreSQL row locks coordinate safely
      } else {
        // Step B: Record does NOT exist in idempotency_records (absent or expired/pruned after 24h)
        // Fall back to permanent Order lookup
        const existingOrder = await (prisma.order as any).findFirst({
          where: {
            userId,
            idempotencyKey: sanitizedIdempotencyKey,
          },
        });

        if (existingOrder && existingOrder.responseSnapshot) {
          if (parseResult.data.items && parseResult.data.items.length > 0) {
            const incomingCanonical = buildCanonicalPayload(
              addressId,
              paymentMethod,
              specialInstructions,
              parseResult.data.items
            );
            const incomingHash = hashCanonicalPayload(incomingCanonical);
            if (incomingHash === existingOrder.idempotencyHash) {
              res.setHeader("X-Idempotent-Replayed", "true");
              res.status(existingOrder.responseStatus || 201).json(existingOrder.responseSnapshot);
              return;
            }
            res.status(409).json({
              success: false,
              message: "Idempotency key reused with different checkout parameters or items",
            });
            return;
          }

          // Legacy request without items attempting replay after record expiry
          res.status(409).json({
            success: false,
            message: "Idempotency record has expired. Replay verification requires explicit item payload.",
          });
          return;
        }
      }
    }

    // 3. Verify address exists and belongs to this customer
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address || address.userId !== userId) {
      res.status(404).json({
        success: false,
        message: "Delivery address not found or does not belong to your account",
      });
      return;
    }

    // 4. Read customer's current cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
          orderBy: { productId: "asc" },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      const recentCompleted = checkoutIdempotency.getRecentUserCompleted(userId);
      if (recentCompleted) {
        res.setHeader("X-Idempotent-Replayed", "true");
        res.status(recentCompleted.statusCode).json(recentCompleted.body);
        return;
      }

      res.status(400).json({
        success: false,
        message: "Your cart is empty. Please add items before checking out.",
      });
      return;
    }

    if (!cart.storeId) {
      res.status(400).json({
        success: false,
        message: "Cart is not associated with any dark store. Please re-add items.",
      });
      return;
    }

    // 5. Build candidate canonical payload and derived key
    const candidateItems =
      parseResult.data.items && parseResult.data.items.length > 0
        ? parseResult.data.items
        : cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity }));

    const candidatePayload = buildCanonicalPayload(
      addressId,
      paymentMethod,
      specialInstructions,
      candidateItems
    );
    const candidateHash = hashCanonicalPayload(candidatePayload);

    const derivedKey = checkoutIdempotency.deriveKey(
      userId,
      cart.id,
      addressId,
      cart.items,
      sanitizedIdempotencyKey || undefined
    );

    if (!sanitizedIdempotencyKey) {
      const cachedResponse = checkoutIdempotency.getCompleted(derivedKey, candidateHash);
      if (cachedResponse) {
        res.setHeader("X-Idempotent-Replayed", "true");
        res.status(cachedResponse.statusCode).json(cachedResponse.body);
        return;
      }

      const activeInFlight = checkoutIdempotency.getInFlight(derivedKey, userId);
      if (activeInFlight) {
        const sharedResult = await activeInFlight;
        res.setHeader("X-Idempotent-Replayed", "true");
        res.status(sharedResult.statusCode).json(sharedResult.body);
        return;
      }
    }

    const storeId = cart.storeId;

    // Define the atomic transaction execution wrapped for concurrency coordination
    const checkoutExecution = (async (): Promise<CheckoutResponsePayload> => {
      const result = await prisma.$transaction<CheckoutResponsePayload>(
        async (tx): Promise<CheckoutResponsePayload> => {
          // 1. If idempotency key provided, coordinate via IdempotencyRecord
          if (sanitizedIdempotencyKey) {
            try {
              await tx.idempotencyRecord.create({
                data: {
                  userId,
                  key: sanitizedIdempotencyKey,
                  requestHash: candidateHash,
                  status: "IN_PROGRESS",
                },
              });
            } catch {
              // Speculative insertion: ignore duplicate key error
            }

            // Read the record
            const lockedRecord = await tx.idempotencyRecord.findUnique({
              where: {
                userId_key: {
                  userId,
                  key: sanitizedIdempotencyKey,
                },
              },
            });

            if (lockedRecord && lockedRecord.status === "COMPLETED") {
              if (lockedRecord.requestHash === candidateHash) {
                return {
                  statusCode: lockedRecord.statusCode || 201,
                  body: {
                    ...(lockedRecord.response as any),
                    isIdempotentReplay: true,
                  },
                };
              }
              const conflictErr = new Error("Idempotency key reused with different checkout parameters or items");
              (conflictErr as any).statusCode = 409;
              throw conflictErr;
            }
          }

          // 2. Acquire lock on customer's cart row for concurrency coordination
          await tx.cart.update({
            where: { id: cart.id },
            data: { updatedAt: new Date() },
          });

          // 3. Re-read cart inside transaction with active lock to ensure items were not already processed
          const lockedCart = await tx.cart.findUnique({
            where: { id: cart.id },
            include: {
              items: {
                include: { product: true },
                orderBy: { productId: "asc" },
              },
            },
          });

          if (!lockedCart || lockedCart.items.length === 0) {
            throw new Error("Your cart is empty or has already been checked out.");
          }

          const lockedStoreId = lockedCart.storeId;
          if (!lockedStoreId) {
            throw new Error("Cart is not associated with any dark store. Please re-add items.");
          }

          // If client supplied items in request body, verify exact match with authoritative cart items
          if (parseResult.data.items && parseResult.data.items.length > 0) {
            const clientItems = parseResult.data.items;
            if (clientItems.length !== lockedCart.items.length) {
              throw new Error("Cart items have changed since checkout was initiated. Please review your cart.");
            }
            const cartItemMap = new Map(lockedCart.items.map((i) => [i.productId, i.quantity]));
            for (const ci of clientItems) {
              if (cartItemMap.get(ci.productId) !== ci.quantity) {
                throw new Error("Cart items have changed since checkout was initiated. Please review your cart.");
              }
            }
          }

          // Compute finalized canonical payload and hash from locked cart items
          const finalCanonicalPayload = buildCanonicalPayload(
            addressId,
            paymentMethod,
            specialInstructions,
            lockedCart.items
          );
          const finalCanonicalHash = hashCanonicalPayload(finalCanonicalPayload);

          if (sanitizedIdempotencyKey && finalCanonicalHash !== candidateHash) {
            await tx.idempotencyRecord.update({
              where: { userId_key: { userId, key: sanitizedIdempotencyKey } },
              data: { requestHash: finalCanonicalHash },
            });
          }

          // 4. Verify store exists and is active
          const store = await tx.store.findUnique({ where: { id: lockedStoreId } });
          if (!store || !store.isActive) {
            throw new Error("Dark Store is no longer active. Please choose another store.");
          }

          let subtotal = 0;
          const orderItemsData: Array<{
            productId: string;
            productName: string;
            unitPrice: number;
            quantity: number;
            subtotal: number;
          }> = [];

          // 5. Validate every cart item against current store inventory and decrement stock conditionally
          for (const item of lockedCart.items) {
            if (!item.product.isActive) {
              throw new Error(`Product '${item.product.name}' is no longer active.`);
            }

            const decrementResult = await tx.inventory.updateMany({
              where: {
                storeId: lockedStoreId,
                productId: item.productId,
                stockQuantity: { gte: item.quantity },
                isAvailable: true,
              },
              data: {
                stockQuantity: { decrement: item.quantity },
              },
            });

            if (decrementResult.count === 0) {
              const currentInv = await tx.inventory.findUnique({
                where: {
                  storeId_productId: {
                    storeId: lockedStoreId,
                    productId: item.productId,
                  },
                },
              });
              const available = currentInv ? currentInv.stockQuantity : 0;
              throw new Error(
                `Insufficient stock for '${item.product.name}'. Requested: ${item.quantity}, Available: ${available}`
              );
            }

            const updatedInventory = await tx.inventory.findUnique({
              where: {
                storeId_productId: {
                  storeId: lockedStoreId,
                  productId: item.productId,
                },
              },
            });

            if (updatedInventory && updatedInventory.stockQuantity === 0) {
              await tx.inventory.update({
                where: {
                  storeId_productId: {
                    storeId: lockedStoreId,
                    productId: item.productId,
                  },
                },
                data: { isAvailable: false },
              });
            }

            const itemPrice = updatedInventory?.price || item.product.basePrice;
            const itemSubtotal = Math.round(Number(itemPrice) * item.quantity * 100) / 100;
            subtotal += itemSubtotal;

            orderItemsData.push({
              productId: item.productId,
              productName: item.product.name,
              unitPrice: itemPrice,
              quantity: item.quantity,
              subtotal: itemSubtotal,
            });
          }

          subtotal = Math.round(subtotal * 100) / 100;
          const deliveryFee = subtotal >= 500 ? 0 : 30.0;
          const totalAmount = Math.round((subtotal + deliveryFee) * 100) / 100;

          // 6. Generate unique order number
          const orderNumber = `ING-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

          // Construct sanitized customer response payload (strips all OTP/secret data)
          const sanitizedResponseBody: any = {
            success: true,
            message: "Order placed successfully! Delivery partner assigned.",
            data: {
              order: {
                id: "",
                orderNumber,
                orderStatus: OrderStatus.PLACED,
                paymentStatus: PaymentStatus.PENDING,
                paymentMethod: paymentMethod || "COD",
                totalAmount,
                deliveryFee,
                store: { id: store.id, name: store.name, city: store.city },
                address: { id: address.id, label: address.label, addressLine1: address.addressLine1, city: address.city, postalCode: address.postalCode },
                deliveryAddress: { id: address.id, label: address.label, addressLine1: address.addressLine1, city: address.city, postalCode: address.postalCode },
                itemsCount: orderItemsData.length,
                items: orderItemsData.map((i) => ({
                  id: "",
                  productId: i.productId,
                  productName: i.productName,
                  unitPrice: Number(i.unitPrice),
                  quantity: i.quantity,
                  subtotal: Number(i.subtotal),
                })),
                deliveryStatus: "UNASSIGNED",
                delivery: {
                  id: "",
                  status: "UNASSIGNED",
                  deliveryPartner: null,
                },
                createdAt: new Date().toISOString(),
              },
            },
          };

          // 7. Create Order with persistent idempotency and snapshot data
          const createdOrder = await tx.order.create({
            data: {
              orderNumber,
              userId,
              storeId: lockedStoreId,
              addressId,
              totalAmount,
              deliveryFee,
              orderStatus: OrderStatus.PLACED,
              paymentStatus: PaymentStatus.PENDING,
              paymentMethod: paymentMethod || "COD",
              specialInstructions: specialInstructions || null,
              idempotencyKey: sanitizedIdempotencyKey,
              idempotencyHash: sanitizedIdempotencyKey ? finalCanonicalHash : null,
              requestPayloadSnapshot: (sanitizedIdempotencyKey
                ? (finalCanonicalPayload as unknown as Prisma.InputJsonValue)
                : null),
              responseStatus: 201,
              responseSnapshot: sanitizedResponseBody as unknown as Prisma.InputJsonValue,
              items: {
                create: orderItemsData,
              },
              delivery: {
                create: {
                  status: DeliveryStatus.ASSIGNED,
                },
              },
            },
            include: {
              items: true,
              delivery: {
                select: {
                  id: true,
                  status: true,
                },
              },
              store: {
                select: { id: true, name: true, city: true },
              },
              address: {
                select: { id: true, label: true, addressLine1: true, city: true, postalCode: true },
              },
            },
          });

          sanitizedResponseBody.data.order.id = createdOrder.id;
          if (createdOrder.delivery) {
            sanitizedResponseBody.data.order.delivery.id = createdOrder.delivery.id;
          }
          sanitizedResponseBody.data.order.createdAt = createdOrder.createdAt.toISOString();
          sanitizedResponseBody.data.order.items = createdOrder.items.map((i: any) => ({
            id: i.id,
            productId: i.productId,
            productName: i.productName,
            unitPrice: Number(i.unitPrice),
            quantity: i.quantity,
            subtotal: Number(i.subtotal),
          }));

          if (sanitizedIdempotencyKey) {
            await tx.order.update({
              where: { id: createdOrder.id },
              data: { responseSnapshot: sanitizedResponseBody },
            });
          }

          // 8. Test hook for isolated crash recovery simulation
          if (activeTestTxHook && process.env.NODE_ENV === "test") {
            const correlationId = (req.headers["x-test-crash-correlation-id"] as string) || "default";
            await activeTestTxHook(tx, correlationId);
          }

          // 9. Update IdempotencyRecord to COMPLETED with response and orderId
          if (sanitizedIdempotencyKey) {
            await tx.idempotencyRecord.update({
              where: { userId_key: { userId, key: sanitizedIdempotencyKey } },
              data: {
                status: "COMPLETED",
                statusCode: 201,
                response: sanitizedResponseBody,
                orderId: createdOrder.id,
              },
            });
          }

          // 10. Clear customer's cart
          await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
          await tx.cart.update({
            where: { id: cart.id },
            data: { storeId: null },
          });

          return {
            statusCode: 201,
            body: sanitizedResponseBody,
          };
        },
        {
          maxWait: 5000,
          timeout: 10000,
        }
      );

      return result;
    })();

    if (!sanitizedIdempotencyKey) {
      checkoutIdempotency.registerInFlight(derivedKey, userId, checkoutExecution);
    }

    try {
      const responsePayload = await checkoutExecution;
      if (!sanitizedIdempotencyKey) {
        checkoutIdempotency.markCompleted(derivedKey, userId, responsePayload, undefined, candidateHash);
      }
      if (responsePayload.body.isIdempotentReplay) {
        res.setHeader("X-Idempotent-Replayed", "true");
      }
      res.status(responsePayload.statusCode).json(responsePayload.body);
    } catch (err) {
      if (!sanitizedIdempotencyKey) {
        checkoutIdempotency.clearInFlight(derivedKey, userId);
      }
      throw err;
    }
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : "Checkout transaction failed";
    console.error("Checkout error:", errorMsg);

    if (error.statusCode === 409 || errorMsg.includes("Idempotency key reused")) {
      res.status(409).json({
        success: false,
        message: errorMsg,
      });
      return;
    }

    // Handle concurrent unique constraint race on orders(userId, idempotencyKey)
    if (error.code === "P2002") {
      // Transaction has already rolled back.
      if (sanitizedIdempotencyKey) {
        const existing = await (prisma.order as any).findFirst({
          where: { userId, idempotencyKey: sanitizedIdempotencyKey },
        });
        if (existing && existing.responseSnapshot) {
          if (parseResult.data.items && parseResult.data.items.length > 0) {
            const incomingCanonical = buildCanonicalPayload(
              addressId,
              paymentMethod,
              specialInstructions,
              parseResult.data.items
            );
            const incomingHash = hashCanonicalPayload(incomingCanonical);
            if (incomingHash === existing.idempotencyHash) {
              res.setHeader("X-Idempotent-Replayed", "true");
              res.status(existing.responseStatus || 201).json(existing.responseSnapshot);
              return;
            }
            res.status(409).json({
              success: false,
              message: "Idempotency key reused with different checkout parameters or items",
            });
            return;
          }

          // Legacy request without items attempting P2002 recovery
          const snapshot = existing.requestPayloadSnapshot as any;
          if (
            snapshot &&
            snapshot.addressId === addressId &&
            snapshot.paymentMethod === (paymentMethod || "COD") &&
            snapshot.specialInstructions === (specialInstructions || null)
          ) {
            res.setHeader("X-Idempotent-Replayed", "true");
            res.status(existing.responseStatus || 201).json(existing.responseSnapshot);
            return;
          }

          res.status(409).json({
            success: false,
            message: "Idempotency key reused with different checkout parameters or items",
          });
          return;
        }
      }
      res.status(409).json({
        success: false,
        message: "A concurrent checkout with this idempotency key has already committed.",
      });
      return;
    }

    if (
      errorMsg.includes("Insufficient stock") ||
      errorMsg.includes("is no longer active") ||
      errorMsg.includes("not found") ||
      errorMsg.includes("already been checked out") ||
      errorMsg.includes("cart is empty") ||
      errorMsg.includes("Cart items have changed")
    ) {
      res.status(400).json({
        success: false,
        message: errorMsg,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Internal server error during checkout transaction",
    });
  }
}

/**
 * GET /api/orders
 * List orders for authenticated customer (or all orders for ADMIN).
 */
export async function listOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const where: Prisma.OrderWhereInput = user.role === Role.ADMIN ? {} : { userId: user.id };

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
        store: { select: { id: true, name: true, city: true } },
        delivery: { select: { status: true, deliveryPartnerId: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      message: "Orders retrieved successfully",
      data: {
        ordersCount: orders.length,
        orders: orders.map((o) => {
          const isUnassigned =
            !o.delivery?.deliveryPartnerId && o.delivery?.status === DeliveryStatus.ASSIGNED;
          return {
            id: o.id,
            orderNumber: o.orderNumber,
            orderStatus: o.orderStatus,
            paymentStatus: o.paymentStatus,
            paymentMethod: o.paymentMethod,
            totalAmount: Number(o.totalAmount),
            deliveryFee: Number(o.deliveryFee),
            storeName: o.store.name,
            itemsCount: o.items.length,
            deliveryStatus: isUnassigned ? "UNASSIGNED" : (o.delivery?.status || "UNASSIGNED"),
            deliveryPartnerId: o.delivery?.deliveryPartnerId || null,
            createdAt: o.createdAt,
          };
        }),
      },
    });
  } catch (error) {
    console.error("List orders error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching orders",
    });
  }
}

/**
 * GET /api/orders/:id
 * Get order details by ID.
 */
export async function getOrderById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const id = getParam(req.params.id);

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        store: { select: { id: true, name: true, city: true, address: true } },
        address: true,
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
              },
            },
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        message: `Order with ID '${id}' not found`,
      });
      return;
    }

    // Role check: Only the buyer or an ADMIN may view this order
    if (user.role !== Role.ADMIN && order.userId !== user.id) {
      res.status(403).json({
        success: false,
        message: "Access denied. You cannot view orders placed by other users.",
      });
      return;
    }

    const isUnassigned =
      !order.delivery?.deliveryPartner && order.delivery?.status === DeliveryStatus.ASSIGNED;

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
          store: order.store,
          address: order.address,
          deliveryAddress: order.address,
          delivery: order.delivery
            ? {
                id: order.delivery.id,
                status: isUnassigned ? "UNASSIGNED" : order.delivery.status,
                pickupTime: order.delivery.pickupTime,
                deliveredTime: order.delivery.deliveredTime,
                currentLatitude: order.delivery.currentLatitude,
                currentLongitude: order.delivery.currentLongitude,
                deliveryPartner: order.delivery.deliveryPartner
                  ? {
                      id: order.delivery.deliveryPartner.id,
                      name: order.delivery.deliveryPartner.name,
                      phone: order.delivery.deliveryPartner.phoneNumber,
                      phoneNumber: order.delivery.deliveryPartner.phoneNumber,
                    }
                  : null,
              }
            : null,
          itemsCount: order.items.length,
          items: order.items.map((i) => ({
            id: i.id,
            productId: i.productId,
            productName: i.productName,
            unitPrice: Number(i.unitPrice),
            quantity: i.quantity,
            subtotal: Number(i.subtotal),
          })),
          createdAt: order.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Get order error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while retrieving order",
    });
  }
}

/**
 * GET /api/orders/:id/delivery-otp
 * Retrieve single-use delivery OTP for the authenticated customer who placed the order.
 * This is the safe mechanism for customer to provide verification code to the rider at doorstep.
 */
export async function getCustomerDeliveryOtp(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const orderId = getParam(req.params.id);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        delivery: true,
      },
    });

    if (!order) {
      res.status(404).json({ success: false, message: `Order with ID '${orderId}' not found` });
      return;
    }

    if (user.role !== Role.ADMIN && order.userId !== user.id) {
      res.status(403).json({
        success: false,
        message: "Access denied. You can only view delivery OTP for your own orders.",
      });
      return;
    }

    if (!order.delivery) {
      res.status(400).json({
        success: false,
        message: "No delivery record exists for this order.",
      });
      return;
    }

    // Only applicable once order has been dispatched or is ready
    if (order.orderStatus === OrderStatus.DELIVERED) {
      res.status(400).json({
        success: false,
        message: "This order has already been delivered. OTP is no longer active.",
      });
      return;
    }

    if (order.orderStatus === OrderStatus.CANCELLED) {
      res.status(400).json({
        success: false,
        message: "This order was cancelled. No OTP available.",
      });
      return;
    }

    // Generate a fresh OTP for the customer and store its secure hash
    const rawOtp = generateOtp();
    const hashedOtp = hashOtp(rawOtp);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.delivery.update({
      where: { id: order.delivery.id },
      data: {
        otpHash: hashedOtp,
        otpExpiresAt: expiresAt,
        otpAttempts: 0,
      },
    });

    res.status(200).json({
      success: true,
      message: "Delivery OTP generated. Share this code with the delivery partner upon arrival.",
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        otp: rawOtp,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Get customer delivery OTP error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while retrieving delivery OTP",
    });
  }
}

