/**
 * Ingrezy Phase 5.1A — Real PostgreSQL Integration Test Suite
 * Checkout Concurrency, Idempotency, and Security
 *
 * SAFETY RULES:
 * 1. Preflight enforces TEST_DATABASE_URL targeting ONLY 'ingrezy_test_db'.
 * 2. Rejects any missing, malformed, or development database URL before importing app or Prisma.
 * 3. Never logs credentials or connection strings.
 * 4. Cleanup deletes strictly by recorded entity IDs in reverse relational dependency order.
 * 5. NO TRUNCATE, NO DROP DATABASE, NO DB RESET, NO GLOBAL DELETE.
 */

// ---------------------------------------------------------------------------
// 1. FAIL-CLOSED PREFLIGHT VALIDATION (Line 1 Enforcement)
// ---------------------------------------------------------------------------
function validateAndEnforceTestDatabase(): string {
  const rawUrl = process.env.TEST_DATABASE_URL;
  if (!rawUrl || typeof rawUrl !== "string" || !rawUrl.trim()) {
    console.error("\n❌ [PREFLIGHT FAILED] TEST_DATABASE_URL environment variable is missing or empty.");
    console.error("   Refusing to run integration tests. No fallback to DATABASE_URL is allowed.\n");
    process.exit(1);
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    console.error("\n❌ [PREFLIGHT FAILED] TEST_DATABASE_URL is a malformed URL.\n");
    process.exit(1);
  }

  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    console.error(`\n❌ [PREFLIGHT FAILED] Protocol must be 'postgresql:' or 'postgres:', got '${parsed.protocol}'.\n`);
    process.exit(1);
  }

  const dbName = parsed.pathname.replace(/^\//, "");
  if (dbName !== "ingrezy_test_db") {
    console.error(`\n❌ [PREFLIGHT FAILED] Target database must be exactly 'ingrezy_test_db'. Got: '${dbName || "(none)"}'.`);
    console.error("   Under no circumstances will integration tests run against any other database.\n");
    process.exit(1);
  }

  if (process.env.DATABASE_URL) {
    try {
      const devParsed = new URL(process.env.DATABASE_URL);
      const devDbName = devParsed.pathname.replace(/^\//, "");
      if (devDbName === "ingrezy_db" && ((dbName as string) === "ingrezy_db" || parsed.href === devParsed.href)) {
        console.error("\n❌ [PREFLIGHT FAILED] TEST_DATABASE_URL points to development database 'ingrezy_db'!\n");
        process.exit(1);
      }
    } catch {
      // Ignore URL parsing errors for dev url
    }
  }

  const sanitizedHost = parsed.hostname;
  const sanitizedPort = parsed.port || "5432";
  console.log(`\n🔒 [PREFLIGHT PASS] Validated isolated test target: host='${sanitizedHost}', port='${sanitizedPort}', database='${dbName}'\n`);

  return rawUrl;
}

// Execute preflight synchronously before any imports or bootstrap
const validatedTestUrl = validateAndEnforceTestDatabase();

// Lock process environment to test database target
process.env.DATABASE_URL = validatedTestUrl;
process.env.NODE_ENV = "test";
process.env.PORT = "0"; // Ephemeral port to avoid collision with running dev server
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "test_jwt_secret_concurrency_phase_5_1a";
}

// ---------------------------------------------------------------------------
// 2. ASSERTION UTILITIES
// ---------------------------------------------------------------------------
const assert = {
  equal: (actual: any, expected: any, msg?: string): void => {
    if (actual !== expected) {
      throw new Error(msg || `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
    }
  },
  ok: (value: any, msg?: string): void => {
    if (!value) {
      throw new Error(msg || `Expected truthy value but got ${JSON.stringify(value)}`);
    }
  },
  deepEqual: (actual: any, expected: any, msg?: string): void => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(msg || `Expected deep equality: ${JSON.stringify(expected)} vs ${JSON.stringify(actual)}`);
    }
  },
};

// ---------------------------------------------------------------------------
// 3. SCOPED FIXTURE TRACKER & NON-DESTRUCTIVE CLEANUP
// ---------------------------------------------------------------------------
class TestFixtureTracker {
  public deliveryAssignmentIds: string[] = [];
  public orderItemIds: string[] = [];
  public orderIds: string[] = [];
  public idempotencyRecordIds: string[] = [];
  public cartItemIds: string[] = [];
  public cartIds: string[] = [];
  public inventoryIds: string[] = [];
  public productIds: string[] = [];
  public addressIds: string[] = [];
  public storeIds: string[] = [];
  public deliveryPartnerIds: string[] = [];
  public userIds: string[] = [];

  /**
   * Cleans up strictly recorded IDs in reverse relational dependency order.
   * Never uses TRUNCATE, global DELETE, or database resets.
   */
  public async cleanup(client: any): Promise<void> {
    try {
      if (this.deliveryAssignmentIds.length > 0) {
        await client.deliveryAssignment.deleteMany({ where: { id: { in: this.deliveryAssignmentIds } } });
      }
      if (this.orderItemIds.length > 0) {
        await client.orderItem.deleteMany({ where: { id: { in: this.orderItemIds } } });
      }
      if (this.orderIds.length > 0) {
        await client.order.deleteMany({ where: { id: { in: this.orderIds } } });
      }
      if (this.idempotencyRecordIds.length > 0) {
        await client.$executeRaw`
          DELETE FROM "idempotency_records"
          WHERE "id" = ANY(${this.idempotencyRecordIds})
        `;
      }
      if (this.cartItemIds.length > 0) {
        await client.cartItem.deleteMany({ where: { id: { in: this.cartItemIds } } });
      }
      if (this.cartIds.length > 0) {
        await client.cart.deleteMany({ where: { id: { in: this.cartIds } } });
      }
      if (this.inventoryIds.length > 0) {
        await client.inventory.deleteMany({ where: { id: { in: this.inventoryIds } } });
      }
      if (this.productIds.length > 0) {
        await client.product.deleteMany({ where: { id: { in: this.productIds } } });
      }
      if (this.addressIds.length > 0) {
        await client.address.deleteMany({ where: { id: { in: this.addressIds } } });
      }
      if (this.storeIds.length > 0) {
        await client.store.deleteMany({ where: { id: { in: this.storeIds } } });
      }
      if (this.deliveryPartnerIds.length > 0) {
        await client.deliveryPartner.deleteMany({ where: { id: { in: this.deliveryPartnerIds } } });
      }
      if (this.userIds.length > 0) {
        await client.user.deleteMany({ where: { id: { in: this.userIds } } });
      }
    } catch (err: any) {
      console.error("  ⚠️ [CLEANUP WARNING] Fixture cleanup encountered an error:", err?.message || err);
    }
  }
}

// ---------------------------------------------------------------------------
// 4. TEST SUITE BOOTSTRAPPER & RUNNER
// ---------------------------------------------------------------------------
async function bootstrapSuite() {
  // Dynamically load application and database client AFTER preflight has passed
  const jwt = (await import("jsonwebtoken")).default;
  const { app } = await import("../src/app.js");
  const { prisma } = await import("../src/config/prisma.js");

  // Post-import security check: ensure dotenv or app didn't mutate DATABASE_URL
  if (process.env.DATABASE_URL !== validatedTestUrl) {
    console.error("❌ [SECURITY VIOLATION] DATABASE_URL was mutated after preflight validation!");
    process.exit(1);
  }

  console.log("==================================================================");
  console.log("  Ingrezy Phase 5.1A — PostgreSQL Checkout Integration Tests     ");
  console.log("==================================================================\n");

  // Start HTTP server on ephemeral port 0 (completely isolated from port 5000)
  const server = await new Promise<any>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  let passedTests = 0;
  let totalTests = 0;

  async function apiRequest(path: string, options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  }) {
    const url = `${baseUrl}${path}`;
    const res = await fetch(url, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const json = await res.json().catch(() => null);
    return {
      status: res.status,
      headers: res.headers,
      body: json,
    };
  }

  function signTestToken(userId: string): string {
    return jwt.sign(
      { userId, role: "CUSTOMER" },
      process.env.JWT_SECRET || "test_jwt_secret_concurrency_phase_5_1a",
      { expiresIn: "1h" }
    );
  }

  async function runTestCase(name: string, fn: (tracker: TestFixtureTracker) => Promise<void>) {
    totalTests++;
    const tracker = new TestFixtureTracker();
    let testError: any = null;
    try {
      await fn(tracker);
      console.log(`  ✓ [PASS] ${name}`);
      passedTests++;
    } catch (err: any) {
      console.error(`  ✗ [FAIL] ${name}`);
      console.error(`    ${err?.message || err}`);
      if (err.stack) console.error(err.stack);
      testError = err;
      process.exitCode = 1;
    } finally {
      // Scoped cleanup of fixture records
      await tracker.cleanup(prisma);
      // Ensure test assertion failure is not masked
      if (testError) {
        // preserve failure
      }
    }
  }

  // Helper to create standard user, store, product, inventory, address, and cart
  async function seedStandardCustomerCart(
    tracker: TestFixtureTracker,
    tag: string,
    initialStock = 10,
    cartQuantity = 2
  ) {
    const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;

    const user = await prisma.user.create({
      data: {
        name: `Test User ${tag}`,
        email: `test_user_${tag}_${uniqueSuffix}@example.com`,
        phoneNumber: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        password: "hashed_dummy_password",
        role: "CUSTOMER",
        isActive: true,
      },
    });
    tracker.userIds.push(user.id);

    const store = await prisma.store.create({
      data: {
        name: `Dark Store ${tag} ${uniqueSuffix}`,
        address: "123 Store St",
        city: "Test City",
        state: "Test State",
        postalCode: "123456",
        latitude: 19.076,
        longitude: 72.8777,
        isActive: true,
      },
    });
    tracker.storeIds.push(store.id);

    const product = await prisma.product.create({
      data: {
        name: `Product ${tag} ${uniqueSuffix}`,
        slug: `prod-${tag}-${uniqueSuffix}`,
        category: `Category ${tag}`,
        basePrice: 100,
        unit: "piece",
        isActive: true,
      },
    });
    tracker.productIds.push(product.id);

    const inventory = await prisma.inventory.create({
      data: {
        storeId: store.id,
        productId: product.id,
        stockQuantity: initialStock,
        price: 100,
        isAvailable: true,
      },
    });
    tracker.inventoryIds.push(inventory.id);

    const address = await prisma.address.create({
      data: {
        userId: user.id,
        label: "Home",
        addressLine1: "456 Customer Ave",
        city: "Test City",
        state: "Test State",
        postalCode: "123456",
        isDefault: true,
      },
    });
    tracker.addressIds.push(address.id);

    const cart = await prisma.cart.create({
      data: {
        userId: user.id,
        storeId: store.id,
      },
    });
    tracker.cartIds.push(cart.id);

    const cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        quantity: cartQuantity,
      },
    });
    tracker.cartItemIds.push(cartItem.id);

    const token = signTestToken(user.id);

    return {
      user,
      store,
      product,
      inventory,
      address,
      cart,
      cartItem,
      token,
    };
  }

  // --------------------------------------------------------------------------
  // TEST 1: Concurrent Duplicate Checkout Requests (Race Condition & Single Order)
  // --------------------------------------------------------------------------
  await runTestCase(
    "Concurrent Duplicate Checkouts: 5 simultaneous requests create exactly 1 order in PostgreSQL",
    async (tracker) => {
      const fixture = await seedStandardCustomerCart(tracker, "conc", 10, 2);
      const idempotencyKey = `test-idemp-conc-${Date.now()}`;

      const checkoutPayload = {
        addressId: fixture.address.id,
        paymentMethod: "COD",
        specialInstructions: "Leave at door",
        items: [{ productId: fixture.product.id, quantity: 2 }],
      };

      // Send 5 requests at the exact same instant
      const requests = Array.from({ length: 5 }, () =>
        apiRequest("/api/orders/checkout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${fixture.token}`,
            "Idempotency-Key": idempotencyKey,
          },
          body: checkoutPayload,
        })
      );

      const responses = await Promise.all(requests);

      // Verify all responses returned 201
      for (const res of responses) {
        assert.equal(res.status, 201, `Expected status 201, got ${res.status}: ${JSON.stringify(res.body)}`);
        assert.equal(res.body.success, true);
      }

      // Check replayed headers: at least one was original and rest were replayed
      const orderIds = responses.map((r) => r.body.data.order.id);
      const firstOrderId = orderIds[0];
      for (const id of orderIds) {
        assert.equal(id, firstOrderId, "All responses must reference the exact same order ID");
      }
      tracker.orderIds.push(firstOrderId);

      // Verify in PostgreSQL: exactly 1 order row exists
      const dbOrders = await prisma.order.findMany({
        where: { userId: fixture.user.id },
      });
      assert.equal(dbOrders.length, 1, `Expected exactly 1 order in database, found ${dbOrders.length}`);

      // Verify stock was decremented strictly once: 10 - 2 = 8
      const dbInventory = await prisma.inventory.findUnique({
        where: { id: fixture.inventory.id },
      });
      assert.equal(dbInventory?.stockQuantity, 8, `Stock should be decremented once to 8, got ${dbInventory?.stockQuantity}`);

      // Verify cart is cleared
      const dbCartItems = await prisma.cartItem.findMany({
        where: { cartId: fixture.cart.id },
      });
      assert.equal(dbCartItems.length, 0, "Cart items should be cleared after checkout");

      // Track created order items & idempotency records for scoped cleanup
      const dbOrderItems = await prisma.orderItem.findMany({ where: { orderId: firstOrderId } });
      tracker.orderItemIds.push(...dbOrderItems.map((i) => i.id));

      const rawRecords = await (prisma as any).$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "idempotency_records" WHERE "userId" = ${fixture.user.id}
      `;
      tracker.idempotencyRecordIds.push(...rawRecords.map((r: { id: string }) => r.id));
    }
  );

  // --------------------------------------------------------------------------
  // TEST 2: Payload Mismatch Detection (Idempotency Violation -> HTTP 409)
  // --------------------------------------------------------------------------
  await runTestCase(
    "Payload Mismatch: Reusing idempotency key with different items returns HTTP 409 Conflict",
    async (tracker) => {
      const fixture = await seedStandardCustomerCart(tracker, "mismatch", 10, 1);
      const idempotencyKey = `test-idemp-mismatch-${Date.now()}`;

      // Request 1: Valid checkout
      const initialRes = await apiRequest("/api/orders/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${fixture.token}`,
          "Idempotency-Key": idempotencyKey,
        },
        body: {
          addressId: fixture.address.id,
          paymentMethod: "COD",
          items: [{ productId: fixture.product.id, quantity: 1 }],
        },
      });

      assert.equal(initialRes.status, 201);
      const orderId = initialRes.body.data.order.id;
      tracker.orderIds.push(orderId);

      const dbOrderItems = await prisma.orderItem.findMany({ where: { orderId } });
      tracker.orderItemIds.push(...dbOrderItems.map((i) => i.id));

      const rawRecords = await (prisma as any).$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "idempotency_records" WHERE "userId" = ${fixture.user.id}
      `;
      tracker.idempotencyRecordIds.push(...rawRecords.map((r: { id: string }) => r.id));

      // Request 2: Reusing SAME key with DIFFERENT quantity (2 instead of 1)
      const mismatchRes = await apiRequest("/api/orders/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${fixture.token}`,
          "Idempotency-Key": idempotencyKey,
        },
        body: {
          addressId: fixture.address.id,
          paymentMethod: "COD",
          items: [{ productId: fixture.product.id, quantity: 2 }], // different!
        },
      });

      assert.equal(mismatchRes.status, 409, `Expected HTTP 409 Conflict, got ${mismatchRes.status}`);
      assert.equal(mismatchRes.body.success, false);

      // Verify database still has exactly 1 order
      const dbOrders = await prisma.order.findMany({ where: { userId: fixture.user.id } });
      assert.equal(dbOrders.length, 1);
    }
  );

  // --------------------------------------------------------------------------
  // TEST 3: Inventory Consistency & Insufficient Stock Rejection
  // --------------------------------------------------------------------------
  await runTestCase(
    "Inventory Protection: Insufficient stock returns HTTP 400 and does not decrement stock",
    async (tracker) => {
      // Seed product with stock = 2, but cart has quantity = 5
      const fixture = await seedStandardCustomerCart(tracker, "inv", 2, 5);
      const idempotencyKey = `test-idemp-inv-${Date.now()}`;

      const res = await apiRequest("/api/orders/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${fixture.token}`,
          "Idempotency-Key": idempotencyKey,
        },
        body: {
          addressId: fixture.address.id,
          paymentMethod: "COD",
          items: [{ productId: fixture.product.id, quantity: 5 }],
        },
      });

      assert.equal(res.status, 400, `Expected 400 for insufficient stock, got ${res.status}`);
      assert.equal(res.body.success, false);

      // Verify stock was not decremented
      const inv = await prisma.inventory.findUnique({ where: { id: fixture.inventory.id } });
      assert.equal(inv?.stockQuantity, 2, "Stock must remain 2");

      // Verify no order was created
      const orders = await prisma.order.findMany({ where: { userId: fixture.user.id } });
      assert.equal(orders.length, 0, "No order should be created on stock failure");
    }
  );

  // --------------------------------------------------------------------------
  // TEST 4: Non-Destructive Transactional Rollback on Intermediate Failure
  // --------------------------------------------------------------------------
  await runTestCase(
    "Transactional Rollback: Intermediate failure rolls back all mutations atomically",
    async (tracker) => {
      const fixture = await seedStandardCustomerCart(tracker, "rollback", 10, 1);

      // Create a second product in the same store that is INACTIVE
      const inactiveProd = await prisma.product.create({
        data: {
          name: "Inactive Product",
          slug: `inactive-${Date.now()}`,
          category: "Dairy",
          basePrice: 50,
          unit: "piece",
          isActive: false, // Inactive!
        },
      });
      tracker.productIds.push(inactiveProd.id);

      const inv2 = await prisma.inventory.create({
        data: {
          storeId: fixture.store.id,
          productId: inactiveProd.id,
          stockQuantity: 10,
          price: 50,
          isAvailable: true,
        },
      });
      tracker.inventoryIds.push(inv2.id);

      // Add inactive product to cart
      const cartItem2 = await prisma.cartItem.create({
        data: {
          cartId: fixture.cart.id,
          productId: inactiveProd.id,
          quantity: 1,
        },
      });
      tracker.cartItemIds.push(cartItem2.id);

      const res = await apiRequest("/api/orders/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${fixture.token}`,
          "Idempotency-Key": `test-idemp-rollback-${Date.now()}`,
        },
        body: {
          addressId: fixture.address.id,
          paymentMethod: "COD",
        },
      });

      assert.equal(res.status, 400);

      // Verify valid product's stock was NOT decremented
      const inv1 = await prisma.inventory.findUnique({ where: { id: fixture.inventory.id } });
      assert.equal(inv1?.stockQuantity, 10, "Product 1 stock must remain unchanged at 10");

      // Verify no order was created
      const orders = await prisma.order.findMany({ where: { userId: fixture.user.id } });
      assert.equal(orders.length, 0);
    }
  );

  // --------------------------------------------------------------------------
  // TEST 5: Decoupled Post-Expiry Replay against Permanent Order Snapshot
  // --------------------------------------------------------------------------
  await runTestCase(
    "Post-Expiry Replay: Replays from Order snapshot after temporary idempotency record is pruned",
    async (tracker) => {
      const fixture = await seedStandardCustomerCart(tracker, "expiry", 10, 1);
      const idempotencyKey = `test-idemp-expiry-${Date.now()}`;

      const items = [{ productId: fixture.product.id, quantity: 1 }];

      // Initial checkout
      const initialRes = await apiRequest("/api/orders/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${fixture.token}`,
          "Idempotency-Key": idempotencyKey,
        },
        body: {
          addressId: fixture.address.id,
          paymentMethod: "COD",
          items,
        },
      });

      assert.equal(initialRes.status, 201);
      const orderId = initialRes.body.data.order.id;
      tracker.orderIds.push(orderId);

      const dbOrderItems = await prisma.orderItem.findMany({ where: { orderId } });
      tracker.orderItemIds.push(...dbOrderItems.map((i) => i.id));

      // Simulate 24-hour expiration by deleting the temporary idempotency_records row
      await (prisma as any).$executeRaw`
        DELETE FROM "idempotency_records"
        WHERE "userId" = ${fixture.user.id} AND "key" = ${idempotencyKey}
      `;

      // Replay with explicit identical items payload
      const replayRes = await apiRequest("/api/orders/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${fixture.token}`,
          "Idempotency-Key": idempotencyKey,
        },
        body: {
          addressId: fixture.address.id,
          paymentMethod: "COD",
          items,
        },
      });

      assert.equal(replayRes.status, 201, `Expected 201 replay from Order snapshot, got ${replayRes.status}`);
      assert.equal(replayRes.headers.get("x-idempotent-replayed"), "true");
      assert.equal(replayRes.body.data.order.id, orderId);

      // Replay legacy request WITHOUT items after record expiry -> must return 409
      const legacyRes = await apiRequest("/api/orders/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${fixture.token}`,
          "Idempotency-Key": idempotencyKey,
        },
        body: {
          addressId: fixture.address.id,
          paymentMethod: "COD",
          // omitted items!
        },
      });

      assert.equal(legacyRes.status, 409, "Legacy retry without items after record expiry must return 409");
    }
  );

  // --------------------------------------------------------------------------
  // TEST 6: Replay Status and Header Preservation
  // --------------------------------------------------------------------------
  await runTestCase(
    "Replay Fidelity: Replays preserve original HTTP status (201) and include X-Idempotent-Replayed header",
    async (tracker) => {
      const fixture = await seedStandardCustomerCart(tracker, "fidelity", 10, 1);
      const idempotencyKey = `test-idemp-fidelity-${Date.now()}`;
      const payload = {
        addressId: fixture.address.id,
        paymentMethod: "COD",
        items: [{ productId: fixture.product.id, quantity: 1 }],
      };

      const initialRes = await apiRequest("/api/orders/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${fixture.token}`,
          "Idempotency-Key": idempotencyKey,
        },
        body: payload,
      });

      assert.equal(initialRes.status, 201);
      const orderId = initialRes.body.data.order.id;
      tracker.orderIds.push(orderId);

      const dbOrderItems = await prisma.orderItem.findMany({ where: { orderId } });
      tracker.orderItemIds.push(...dbOrderItems.map((i) => i.id));

      const rawRecords = await (prisma as any).$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "idempotency_records" WHERE "userId" = ${fixture.user.id}
      `;
      tracker.idempotencyRecordIds.push(...rawRecords.map((r: { id: string }) => r.id));

      const replayRes = await apiRequest("/api/orders/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${fixture.token}`,
          "Idempotency-Key": idempotencyKey,
        },
        body: payload,
      });

      assert.equal(replayRes.status, 201, "Replayed response must preserve HTTP 201");
      assert.equal(replayRes.headers.get("x-idempotent-replayed"), "true", "Must contain X-Idempotent-Replayed header");
      assert.equal(replayRes.body.data.order.id, orderId);
    }
  );

  // --------------------------------------------------------------------------
  // TEST 7: Sensitive Response Field Exclusion
  // --------------------------------------------------------------------------
  await runTestCase(
    "Security: Checkout and replay responses strictly exclude OTP hashes, secrets, and internal fields",
    async (tracker) => {
      const fixture = await seedStandardCustomerCart(tracker, "sec", 10, 1);
      const idempotencyKey = `test-idemp-sec-${Date.now()}`;
      const payload = {
        addressId: fixture.address.id,
        paymentMethod: "COD",
        items: [{ productId: fixture.product.id, quantity: 1 }],
      };

      const initialRes = await apiRequest("/api/orders/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${fixture.token}`,
          "Idempotency-Key": idempotencyKey,
        },
        body: payload,
      });

      assert.equal(initialRes.status, 201);
      const orderId = initialRes.body.data.order.id;
      tracker.orderIds.push(orderId);

      const dbOrderItems = await prisma.orderItem.findMany({ where: { orderId } });
      tracker.orderItemIds.push(...dbOrderItems.map((i) => i.id));

      const rawRecords = await (prisma as any).$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "idempotency_records" WHERE "userId" = ${fixture.user.id}
      `;
      tracker.idempotencyRecordIds.push(...rawRecords.map((r: { id: string }) => r.id));

      const replayRes = await apiRequest("/api/orders/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${fixture.token}`,
          "Idempotency-Key": idempotencyKey,
        },
        body: payload,
      });

      // Verify neither response exposes secrets
      for (const res of [initialRes, replayRes]) {
        const bodyStr = JSON.stringify(res.body);
        assert.ok(!bodyStr.includes("otpHash"), "Response must not contain otpHash");
        assert.ok(!bodyStr.includes("otpAttempts"), "Response must not contain otpAttempts");
        assert.ok(!bodyStr.includes("otpExpiresAt"), "Response must not contain otpExpiresAt");
        assert.ok(!bodyStr.includes("password"), "Response must not contain password hashes");
      }
    }
  );

  // Close HTTP server and Prisma client
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await prisma.$disconnect();

  console.log("\n==================================================================");
  console.log(`  Integration Tests Completed: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log("==================================================================\n");
}

bootstrapSuite().catch(async (e) => {
  console.error("Test suite execution failed:", e);
  process.exit(1);
});
