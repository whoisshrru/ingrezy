/**
 * Ingrezy — Real PostgreSQL Integration Test Suite
 * Recipe Pantry Ingredient Exclusions & Bundling
 *
 * SAFETY RULES:
 * 1. Preflight enforces TEST_DATABASE_URL targeting ONLY 'ingrezy_test_db'.
 * 2. Rejects any missing, malformed, or development database URL before importing app or Prisma.
 * 3. Never logs credentials or connection strings.
 * 4. Cleanup deletes strictly by recorded entity IDs in reverse relational dependency order.
 * 5. NO TRUNCATE, NO DROP DATABASE, NO DB RESET, NO GLOBAL DELETE.
 */

// ---------------------------------------------------------------------------
// 1. FAIL-CLOSED PREFLIGHT VALIDATION
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
      if (devDbName === "ingrezy_db" && (dbName === "ingrezy_db" || parsed.href === devParsed.href)) {
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
process.env.PORT = "0"; // Ephemeral port
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "test_jwt_secret_recipe_pantry_exclusions";
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
// 3. SCOPED FIXTURE TRACKER
// ---------------------------------------------------------------------------
class TestFixtureTracker {
  public recipeIngredientIds: string[] = [];
  public recipeIds: string[] = [];
  public cartItemIds: string[] = [];
  public cartIds: string[] = [];
  public inventoryIds: string[] = [];
  public productIds: string[] = [];
  public categoryIds: string[] = [];
  public storeIds: string[] = [];
  public userIds: string[] = [];

  public async cleanup(client: any): Promise<void> {
    try {
      if (this.recipeIngredientIds.length > 0) {
        await client.recipeIngredient.deleteMany({ where: { id: { in: this.recipeIngredientIds } } });
      }
      if (this.recipeIds.length > 0) {
        await client.recipe.deleteMany({ where: { id: { in: this.recipeIds } } });
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
      if (this.storeIds.length > 0) {
        await client.store.deleteMany({ where: { id: { in: this.storeIds } } });
      }
      if (this.userIds.length > 0) {
        await client.user.deleteMany({ where: { id: { in: this.userIds } } });
      }
    } catch (err: any) {
      console.error("  ⚠️ [CLEANUP WARNING] Fixture cleanup encountered error:", err?.message || err);
    }
  }
}

// ---------------------------------------------------------------------------
// 4. TEST SUITE BOOTSTRAPPER & RUNNER
// ---------------------------------------------------------------------------
async function bootstrapSuite() {
  const jwt = (await import("jsonwebtoken")).default;
  const { app } = await import("../src/app.js");
  const { prisma } = await import("../src/config/prisma.js");

  if (process.env.DATABASE_URL !== validatedTestUrl) {
    console.error("❌ [SECURITY VIOLATION] DATABASE_URL was mutated after preflight validation!");
    process.exit(1);
  }

  console.log("==================================================================");
  console.log("  Ingrezy — PostgreSQL Recipe Pantry Exclusions Integration Tests ");
  console.log("==================================================================\n");

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
      process.env.JWT_SECRET || "test_jwt_secret_recipe_pantry_exclusions",
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
      await tracker.cleanup(prisma);
      if (testError) {
        // preserve failure
      }
    }
  }

  // Fixture helper: seeds a customer, store, category, products, inventory, and a 3-ingredient recipe
  async function seedRecipeFixtures(tracker: TestFixtureTracker, suffix: string) {
    const user = await prisma.user.create({
      data: {
        email: `pantry-test-${suffix}@ingrezy.test`,
        phoneNumber: `+91987${Math.floor(1000000 + Math.random() * 9000000)}`,
        password: "hashed_dummy_test_password",
        name: `Pantry Test Customer ${suffix}`,
        role: "CUSTOMER",
      },
    });
    tracker.userIds.push(user.id);

    const store = await prisma.store.create({
      data: {
        name: `Dark Store ${suffix}`,
        address: "100 Test St, Sector 5",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
        latitude: 19.0760,
        longitude: 72.8777,
        isActive: true,
      },
    });
    tracker.storeIds.push(store.id);

    // Create 3 Products
    const prodA = await prisma.product.create({
      data: {
        name: `Basmati Rice ${suffix}`,
        slug: `rice-${suffix}`,
        category: "GRAINS",
        unit: "kg",
        basePrice: 90.0,
        isActive: true,
      },
    });
    tracker.productIds.push(prodA.id);

    const prodB = await prisma.product.create({
      data: {
        name: `Ghee 500ml ${suffix}`,
        slug: `ghee-${suffix}`,
        category: "DAIRY",
        unit: "pack",
        basePrice: 320.0,
        isActive: true,
      },
    });
    tracker.productIds.push(prodB.id);

    const prodC = await prisma.product.create({
      data: {
        name: `Cumin Seeds 100g ${suffix}`,
        slug: `jeera-${suffix}`,
        category: "SPICES",
        unit: "pack",
        basePrice: 45.0,
        isActive: true,
      },
    });
    tracker.productIds.push(prodC.id);

    // Create Store Inventory for all 3 products
    const invA = await prisma.inventory.create({
      data: {
        storeId: store.id,
        productId: prodA.id,
        price: 90.0,
        stockQuantity: 20,
        isAvailable: true,
      },
    });
    tracker.inventoryIds.push(invA.id);

    const invB = await prisma.inventory.create({
      data: {
        storeId: store.id,
        productId: prodB.id,
        price: 320.0,
        stockQuantity: 15,
        isAvailable: true,
      },
    });
    tracker.inventoryIds.push(invB.id);

    const invC = await prisma.inventory.create({
      data: {
        storeId: store.id,
        productId: prodC.id,
        price: 45.0,
        stockQuantity: 25,
        isAvailable: true,
      },
    });
    tracker.inventoryIds.push(invC.id);

    // Create Recipe (Base servings = 2)
    const recipe = await prisma.recipe.create({
      data: {
        title: `Jeera Rice ${suffix}`,
        slug: `jeera-rice-${suffix}`,
        servings: 2,
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        difficulty: "EASY",
        dietaryType: "VEG",
        cuisine: "Indian",
        instructions: "Cook rice with ghee and cumin seeds.",
        isActive: true,
      },
    });
    tracker.recipeIds.push(recipe.id);

    // Add 3 Recipe Ingredients
    const ingA = await prisma.recipeIngredient.create({
      data: {
        recipeId: recipe.id,
        productId: prodA.id,
        quantity: 200,
        unit: "g",
      },
    });
    tracker.recipeIngredientIds.push(ingA.id);

    const ingB = await prisma.recipeIngredient.create({
      data: {
        recipeId: recipe.id,
        productId: prodB.id,
        quantity: 30,
        unit: "ml",
      },
    });
    tracker.recipeIngredientIds.push(ingB.id);

    const ingC = await prisma.recipeIngredient.create({
      data: {
        recipeId: recipe.id,
        productId: prodC.id,
        quantity: 10,
        unit: "g",
      },
    });
    tracker.recipeIngredientIds.push(ingC.id);

    const token = signTestToken(user.id);

    return {
      user,
      store,
      products: [prodA, prodB, prodC],
      recipe,
      ingredients: [ingA, ingB, ingC],
      token,
    };
  }

  // --------------------------------------------------------------------------
  // TEST 1: Normal Add-to-Cart without Exclusions
  // --------------------------------------------------------------------------
  await runTestCase("Add-to-cart: Bundles all 3 recipe ingredients when exclusions is empty", async (tracker) => {
    const ctx = await seedRecipeFixtures(tracker, "normal-1");

    const res = await apiRequest(`/api/cart/recipes/${ctx.recipe.id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ctx.token}` },
      body: {
        storeId: ctx.store.id,
        servings: 2,
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.addedItemsCount, 3);
    assert.equal(res.body.data.excludedIngredientsCount, 0);
    assert.equal(res.body.data.allExcluded, false);

    // Verify cart items in database
    const cart = await prisma.cart.findUnique({
      where: { userId: ctx.user.id },
      include: { items: true },
    });
    assert.ok(cart);
    if (cart) {
      tracker.cartIds.push(cart.id);
      cart.items.forEach((item) => tracker.cartItemIds.push(item.id));
      assert.equal(cart.items.length, 3);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 2: Partial Pantry Exclusions (Exclude 1 out of 3 ingredients)
  // --------------------------------------------------------------------------
  await runTestCase("Exclusions: Excludes marked pantry product (Ghee) and adds remaining 2 to cart", async (tracker) => {
    const ctx = await seedRecipeFixtures(tracker, "pantry-part-1");
    const gheeProdId = ctx.products[1].id; // prodB

    const res = await apiRequest(`/api/cart/recipes/${ctx.recipe.id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ctx.token}` },
      body: {
        storeId: ctx.store.id,
        servings: 2,
        excludeProductIds: [gheeProdId],
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.addedItemsCount, 2);
    assert.equal(res.body.data.excludedIngredientsCount, 1);
    assert.equal(res.body.data.allExcluded, false);

    // Verify added items do NOT contain Ghee
    const addedProductIds = res.body.data.addedItems.map((i: any) => i.productId);
    assert.ok(!addedProductIds.includes(gheeProdId), "Ghee must be excluded from added items");
    assert.ok(addedProductIds.includes(ctx.products[0].id), "Rice must be included");
    assert.ok(addedProductIds.includes(ctx.products[2].id), "Jeera must be included");

    // Verify in database
    const cart = await prisma.cart.findUnique({
      where: { userId: ctx.user.id },
      include: { items: true },
    });
    assert.ok(cart);
    if (cart) {
      tracker.cartIds.push(cart.id);
      cart.items.forEach((item) => tracker.cartItemIds.push(item.id));
      assert.equal(cart.items.length, 2);
      const cartProdIds = cart.items.map((i) => i.productId);
      assert.ok(!cartProdIds.includes(gheeProdId), "Cart in database must NOT have Ghee");
    }
  });

  // --------------------------------------------------------------------------
  // TEST 3: 100% Pantry Exclusion (All ingredients already in pantry)
  // --------------------------------------------------------------------------
  await runTestCase("All-in-pantry: When all ingredients are excluded, returns 200 with allExcluded=true and 0 items added", async (tracker) => {
    const ctx = await seedRecipeFixtures(tracker, "all-pantry-1");
    const allProdIds = ctx.products.map((p) => p.id);

    const res = await apiRequest(`/api/cart/recipes/${ctx.recipe.id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ctx.token}` },
      body: {
        storeId: ctx.store.id,
        servings: 2,
        excludeProductIds: allProdIds,
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.allExcluded, true);
    assert.equal(res.body.data.addedItemsCount, 0);
    assert.equal(res.body.data.excludedIngredientsCount, 3);
    assert.ok(res.body.message.includes("All recipe ingredients are already in your pantry"));

    // Verify database has 0 cart items
    const cart = await prisma.cart.findUnique({
      where: { userId: ctx.user.id },
      include: { items: true },
    });
    if (cart) {
      tracker.cartIds.push(cart.id);
      assert.equal(cart.items.length, 0, "No cart items should be inserted");
    }
  });

  // --------------------------------------------------------------------------
  // TEST 4: Rejects Invalid or Unrelated Product IDs in Exclusions
  // --------------------------------------------------------------------------
  await runTestCase("Validation: Rejects exclusion ID that does not belong to the recipe with HTTP 400", async (tracker) => {
    const ctx = await seedRecipeFixtures(tracker, "invalid-excl-1");
    const unrelatedProdId = "a0a9a7a0-0000-4000-8000-000000000999";

    const res = await apiRequest(`/api/cart/recipes/${ctx.recipe.id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ctx.token}` },
      body: {
        storeId: ctx.store.id,
        servings: 2,
        excludeProductIds: [unrelatedProdId],
      },
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.message.includes("does not belong to recipe"), "Error message must state product does not belong to recipe");
  });

  // --------------------------------------------------------------------------
  // TEST 5: Serving Size Scaling with Exclusions
  // --------------------------------------------------------------------------
  await runTestCase("Scaling: Correctly scales remaining unexcluded items when servings is scaled (2 to 4 servings)", async (tracker) => {
    const ctx = await seedRecipeFixtures(tracker, "scaling-excl-1");
    const riceProdId = ctx.products[0].id; // Exclude Rice

    const res = await apiRequest(`/api/cart/recipes/${ctx.recipe.id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ctx.token}` },
      body: {
        storeId: ctx.store.id,
        servings: 4, // 2x base servings (base = 2)
        excludeProductIds: [riceProdId],
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.targetServings, 4);
    assert.equal(res.body.data.addedItemsCount, 2);

    // Remaining items should have scaled quantity = 2 packs
    for (const item of res.body.data.addedItems) {
      assert.equal(item.quantity, 2, `Item ${item.productName} quantity should scale to 2 packs`);
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: ctx.user.id },
      include: { items: true },
    });
    assert.ok(cart);
    if (cart) {
      tracker.cartIds.push(cart.id);
      cart.items.forEach((item) => tracker.cartItemIds.push(item.id));
      assert.equal(cart.items.length, 2);
      for (const item of cart.items) {
        assert.equal(item.quantity, 2);
      }
    }
  });

  // --------------------------------------------------------------------------
  // CLEANUP & SERVER SHUTDOWN
  // --------------------------------------------------------------------------
  await new Promise<void>((resolve) => server.close(() => resolve()));

  console.log("\n==================================================================");
  console.log(`  Integration Tests Passed: ${passedTests} / ${totalTests}`);
  console.log("==================================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

bootstrapSuite().catch((err) => {
  console.error("Unhandled integration test error:", err);
  process.exit(1);
});
