import crypto from "node:crypto";

export interface CanonicalCheckoutPayload {
  addressId: string;
  paymentMethod: string;
  specialInstructions: string | null;
  items: Array<{ productId: string; quantity: number }>;
}

export function buildCanonicalPayload(
  addressId: string,
  paymentMethod: string | undefined,
  specialInstructions: string | null | undefined,
  items: Array<{ productId: string; quantity: number }>
): CanonicalCheckoutPayload {
  return {
    addressId,
    paymentMethod: paymentMethod || "COD",
    specialInstructions: specialInstructions || null,
    items: [...items]
      .map((i) => ({ productId: i.productId, quantity: i.quantity }))
      .sort((a, b) => a.productId.localeCompare(b.productId)),
  };
}

export function hashCanonicalPayload(payload: CanonicalCheckoutPayload): string {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

/**
 * In-Memory Checkout Idempotency & Concurrency Coordinator
 *
 * Prevents:
 * 1. Concurrent double-click checkouts from creating duplicate orders or stock deductions.
 * 2. Unnecessary database load by sharing in-flight checkout promises across identical requests.
 * 3. Inconsistent retry states by caching completed checkout responses with a TTL.
 */

export interface CheckoutResponsePayload {
  statusCode: number;
  body: {
    success: boolean;
    message: string;
    data?: any;
    errors?: any[];
    isIdempotentReplay?: boolean;
  };
}

interface CompletedEntry {
  response: CheckoutResponsePayload;
  expiresAt: number;
  userId: string;
  requestHash?: string;
}

export class CheckoutIdempotencyManager {
  private inFlightByKey = new Map<string, Promise<CheckoutResponsePayload>>();
  private inFlightByUser = new Map<string, Promise<CheckoutResponsePayload>>();
  private completedByKey = new Map<string, CompletedEntry>();
  private lastCompletedByUser = new Map<string, { key: string; response: CheckoutResponsePayload; timestamp: number }>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly ttlMs: number;

  constructor(ttlMs = 10 * 60 * 1000) {
    // 10 minutes default retention for completed idempotency keys
    this.ttlMs = ttlMs;
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => this.prune(), 60 * 1000);
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  /**
   * Derive a deterministic idempotency key if the client didn't supply an explicit Idempotency-Key.
   */
  public deriveKey(
    userId: string,
    cartId: string,
    addressId: string,
    items: Array<{ productId: string; quantity: number }>,
    explicitKey?: string
  ): string {
    if (explicitKey && explicitKey.trim().length > 0) {
      return `explicit:${userId}:${explicitKey.trim()}`;
    }
    const itemSignature = items
      .map((i) => `${i.productId}:${i.quantity}`)
      .sort()
      .join("|");
    return `auto:${userId}:${cartId}:${addressId}:${itemSignature}`;
  }

  /**
   * Check if a completed result already exists for this idempotency key.
   * If candidateHash is supplied, strictly validates that the cached entry has a matching requestHash.
   */
  public getCompleted(key: string, candidateHash?: string): CheckoutResponsePayload | null {
    const entry = this.completedByKey.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.completedByKey.delete(key);
      return null;
    }
    if (candidateHash && entry.requestHash && entry.requestHash !== candidateHash) {
      return null;
    }
    return {
      statusCode: entry.response.statusCode,
      body: {
        ...entry.response.body,
        isIdempotentReplay: true,
      },
    };
  }

  /**
   * Check if a user recently completed a checkout within a small grace window (e.g. 15 seconds)
   * used when an immediate double-click hits an already-emptied cart.
   */
  public getRecentUserCompleted(userId: string, maxAgeMs = 15000): CheckoutResponsePayload | null {
    const record = this.lastCompletedByUser.get(userId);
    if (!record) return null;
    if (Date.now() - record.timestamp > maxAgeMs) {
      this.lastCompletedByUser.delete(userId);
      return null;
    }
    return {
      statusCode: record.response.statusCode,
      body: {
        ...record.response.body,
        isIdempotentReplay: true,
      },
    };
  }

  /**
   * Check if there is an in-flight checkout for this idempotency key or this user.
   */
  public getInFlight(key: string, userId?: string): Promise<CheckoutResponsePayload> | null {
    const byKey = this.inFlightByKey.get(key);
    if (byKey) return byKey;
    if (userId) {
      const byUser = this.inFlightByUser.get(userId);
      if (byUser) return byUser;
    }
    return null;
  }

  /**
   * Register an in-flight promise for this idempotency key and user.
   */
  public registerInFlight(key: string, userId: string, promise: Promise<CheckoutResponsePayload>): void {
    this.inFlightByKey.set(key, promise);
    this.inFlightByUser.set(userId, promise);
  }

  /**
   * Record a completed checkout response.
   */
  public markCompleted(
    key: string,
    userId: string,
    response: CheckoutResponsePayload,
    customTtlMs?: number,
    requestHash?: string
  ): void {
    this.inFlightByKey.delete(key);
    this.inFlightByUser.delete(userId);
    this.completedByKey.set(key, {
      response,
      expiresAt: Date.now() + (customTtlMs || this.ttlMs),
      userId,
      requestHash,
    });
    this.lastCompletedByUser.set(userId, {
      key,
      response,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear an in-flight entry on failure so a user may retry if desired.
   */
  public clearInFlight(key: string, userId: string): void {
    this.inFlightByKey.delete(key);
    this.inFlightByUser.delete(userId);
  }

  /**
   * Prune expired entries.
   */
  public prune(): void {
    const now = Date.now();
    for (const [key, entry] of this.completedByKey.entries()) {
      if (now > entry.expiresAt) {
        this.completedByKey.delete(key);
      }
    }
    for (const [userId, record] of this.lastCompletedByUser.entries()) {
      if (now - record.timestamp > 60000) {
        this.lastCompletedByUser.delete(userId);
      }
    }
  }

  /**
   * Reset store (useful for isolated unit tests).
   */
  public reset(): void {
    this.inFlightByKey.clear();
    this.inFlightByUser.clear();
    this.completedByKey.clear();
    this.lastCompletedByUser.clear();
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.reset();
  }
}

export const checkoutIdempotency = new CheckoutIdempotencyManager();
