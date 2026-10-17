import { prisma } from "../src/config/prisma.js";
import { importRecipeFromTheMealDb } from "../src/services/themealdb.service.js";
import { signAccessToken } from "../src/utils/jwt.js";

const BASE_URL = "http://localhost:5000";

async function runE2EVerification() {
  console.log("\n==================================================================");
  console.log("  PHASE 6: End-to-End Recipe Ingestion, Cart & Checkout Verification");
  console.log("==================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, extra?: string) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${testName}`);
      if (extra) console.error(`     Details: ${extra}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  let testOrderId: string | null = null;
  let originalInventoryStock: { id: string; stockQuantity: number }[] = [];

  try {
    // -----------------------------------------------------------------
    // 1. Verify Prisma connection & baseline records
    // -----------------------------------------------------------------
    const productCount = await prisma.product.count();
    const inventoryCount = await prisma.inventory.count();
    const store = await prisma.store.findFirst({ where: { isActive: true } });
    const user = await prisma.user.findFirst({ where: { role: "CUSTOMER" } });

    assert(productCount >= 20, `Prisma: Catalog products preserved (found ${productCount})`);
    assert(inventoryCount >= 100, `Prisma: Inventories preserved (found ${inventoryCount})`);
    assert(Boolean(store), `Prisma: Active store available (${store?.name})`);
    assert(Boolean(user), `Prisma: Test customer available (${user?.name})`);

    const storeId = store!.id;
    const customerToken = signAccessToken({
      userId: user!.id,
      role: user!.role,
      phoneNumber: user!.phoneNumber,
    });

    // -----------------------------------------------------------------
    // 2. Test Recipe Ingestion & Duplicate Import Idempotency
    // -----------------------------------------------------------------
    console.log("\n--- Testing Recipe Ingestion & Idempotency ---");
    // Ensure clean state for recipe 52771
    await prisma.recipe.deleteMany({
      where: { externalId: "themealdb:52771" },
    });

    const initialRecipeCount = await prisma.recipe.count();

    // First import
    const import1 = await importRecipeFromTheMealDb("52771");
    assert(!import1.isAlreadyImported, "Ingestion: first import marks isAlreadyImported = false");
    assert(import1.recipe.title.toLowerCase().includes("arrabiata"), "Ingestion: recipe title is 'Spicy Arrabiata Penne'");
    assert(import1.recipe.externalId === "themealdb:52771", "Ingestion: externalId is 'themealdb:52771'");
    assert(import1.recipe.source === "THEMEALDB", "Ingestion: source recorded as 'THEMEALDB'");

    // Second import (idempotency check)
    const import2 = await importRecipeFromTheMealDb("52771");
    assert(import2.isAlreadyImported, "Idempotency: second import marks isAlreadyImported = true");
    assert(import2.recipe.id === import1.recipe.id, "Idempotency: returns identical PostgreSQL recipe UUID");

    const finalRecipeCount = await prisma.recipe.count();
    assert(finalRecipeCount === initialRecipeCount + 1, "Idempotency: duplicate import does not create duplicate recipe rows");

    // Verify ingredients in DB
    const dbIngredients = await prisma.recipeIngredient.findMany({
      where: { recipeId: import1.recipe.id },
      include: { product: true },
    });

    const matchedIngredients = dbIngredients.filter((i) => i.productId !== null);
    const unmatchedIngredients = dbIngredients.filter((i) => i.productId === null);

    assert(matchedIngredients.length >= 2, `Database: at least 2 catalog products matched (found ${matchedIngredients.length})`);
    assert(unmatchedIngredients.length >= 4, `Database: uncataloged ingredients preserved as unmatched (found ${unmatchedIngredients.length})`);
    assert(
      unmatchedIngredients.every((i) => i.ingredientName && i.rawMeasure),
      "Database: unmatched ingredients preserve original ingredientName and rawMeasure"
    );

    // -----------------------------------------------------------------
    // 3. Test GET /api/recipes/:identifier (via API)
    // -----------------------------------------------------------------
    console.log("\n--- Testing GET /api/recipes/:identifier API ---");
    const getRes = await fetch(`${BASE_URL}/api/recipes/52771`);
    const getData = await getRes.json() as any;

    assert(getRes.status === 200, "API GET /api/recipes/52771 returns HTTP 200");
    assert(getData.success === true, "API GET /api/recipes/52771 indicates success");
    assert(getData.data.recipe.id === import1.recipe.id, "API GET returns database UUID");
    assert(getData.data.recipe.externalId === "themealdb:52771", "API GET retains externalId 'themealdb:52771'");
    assert(Array.isArray(getData.data.recipe.ingredients), "API GET returns ingredients array");

    const apiMatched = getData.data.recipe.ingredients.filter((i: any) => i.hasLinkedProduct);
    const apiUnmatched = getData.data.recipe.ingredients.filter((i: any) => !i.hasLinkedProduct);
    assert(apiMatched.length >= 2, `API GET reports matched ingredients with hasLinkedProduct=true (${apiMatched.length})`);
    assert(apiUnmatched.length >= 4, `API GET reports unmatched ingredients with hasLinkedProduct=false (${apiUnmatched.length})`);

    // -----------------------------------------------------------------
    // 4. Test GET /api/recipes/:identifier/preview (Store Availability)
    // -----------------------------------------------------------------
    console.log("\n--- Testing Recipe Preview API ---");
    const previewRes = await fetch(`${BASE_URL}/api/recipes/52771/preview?storeId=${storeId}`);
    const previewData = await previewRes.json() as any;

    assert(previewRes.status === 200, "API Preview returns HTTP 200");
    const previewMatched = previewData.data.ingredients.filter((i: any) => i.isMatched && i.inStock);
    const previewUnmatched = previewData.data.ingredients.filter((i: any) => !i.isMatched);
    assert(previewMatched.length >= 2, `Preview reports available matched products in store (${previewMatched.length})`);
    assert(previewUnmatched.length >= 4, `Preview clearly reports unmatched catalog count (${previewUnmatched.length})`);

    // -----------------------------------------------------------------
    // 5. Test POST /api/cart/recipes/:recipeId (Cart Bundling)
    // -----------------------------------------------------------------
    console.log("\n--- Testing Recipe Cart Bundling API ---");
    const bundleRes = await fetch(`${BASE_URL}/api/cart/recipes/52771`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        storeId,
        servings: 2,
        clearPrevious: true,
      }),
    });
    const bundleData = await bundleRes.json() as any;

    if (bundleRes.status !== 200) {
      console.error("Bundle response status:", bundleRes.status, "Body:", bundleData);
    }
    assert(bundleRes.status === 200, "API Bundle returns HTTP 200", JSON.stringify(bundleData));
    assert(bundleData.success === true, "API Bundle indicates success");
    assert(bundleData.data.addedItemsCount >= 2, `API Bundle added only matched products (${bundleData.data.addedItemsCount})`);
    assert(bundleData.data.unmatchedIngredientsCount >= 4, `API Bundle reports unmatched ingredients (${bundleData.data.unmatchedIngredientsCount})`);
    assert(Array.isArray(bundleData.data.unmatchedIngredients), "API Bundle returns detailed unmatchedIngredients array");
    assert(
      bundleData.data.unmatchedIngredients.every((u: any) => u.ingredientName && u.rawMeasure),
      "API Bundle unmatched ingredients preserve name and measure text"
    );

    // Verify cart in DB
    const customerCart = await prisma.cart.findUnique({
      where: { userId: user!.id },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    assert(Boolean(customerCart), "Database: customer cart exists");
    assert(customerCart!.items.length >= 2, `Database: cart has ${customerCart!.items.length} items`);
    assert(
      customerCart!.items.every((it) => it.quantity > 0),
      "Database: all cart items have valid quantities > 0"
    );

    // -----------------------------------------------------------------
    // 6. Test Duplicate Prevention on Repeated Bundle Call
    // -----------------------------------------------------------------
    console.log("\n--- Testing Cart Duplicate Prevention ---");
    const bundleRepeatRes = await fetch(`${BASE_URL}/api/cart/recipes/52771`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        storeId,
        servings: 2,
        clearPrevious: false, // Do not clear, verify no duplicate row creation
      }),
    });
    const bundleRepeatData = await bundleRepeatRes.json() as any;

    assert(bundleRepeatRes.status === 200, "Repeat bundle returns HTTP 200");

    const cartAfterRepeat = await prisma.cart.findUnique({
      where: { userId: user!.id },
      include: { items: true },
    });

    assert(
      cartAfterRepeat!.items.length === customerCart!.items.length,
      `Duplicate Prevention: total distinct items remains ${customerCart!.items.length} (no duplicate rows)`
    );

    // -----------------------------------------------------------------
    // 7. Test Unavailable Ingredients Handling (Out of Stock)
    // -----------------------------------------------------------------
    console.log("\n--- Testing Unavailable Ingredients Handling ---");
    // Find one matched product in this store and record original stock
    const firstMatchedProductId = matchedIngredients[0].productId!;
    const invRecord = await prisma.inventory.findUnique({
      where: {
        storeId_productId: {
          storeId,
          productId: firstMatchedProductId,
        },
      },
    });

    if (invRecord) {
      originalInventoryStock.push({ id: invRecord.id, stockQuantity: invRecord.stockQuantity });
      // Set to 0 stock temporarily
      await prisma.inventory.update({
        where: { id: invRecord.id },
        data: { stockQuantity: 0, isAvailable: false },
      });

      const oosBundleRes = await fetch(`${BASE_URL}/api/cart/recipes/52771`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          storeId,
          servings: 2,
          clearPrevious: true,
        }),
      });
      const oosData = await oosBundleRes.json() as any;

      assert(oosBundleRes.status === 200, "OOS Bundle returns HTTP 200");
      assert(
        Array.isArray(oosData.data.unavailableIngredients) && oosData.data.unavailableIngredients.length > 0,
        `Unavailable Reporting: clearly reports out-of-stock items in unavailableIngredients (${oosData.data.unavailableIngredients.length})`
      );

      // Restore stock immediately
      await prisma.inventory.update({
        where: { id: invRecord.id },
        data: { stockQuantity: invRecord.stockQuantity, isAvailable: true },
      });
    }

    // -----------------------------------------------------------------
    // 8. Test Checkout with Bundled Recipe Ingredients
    // -----------------------------------------------------------------
    console.log("\n--- Testing Checkout Flow ---");
    // Re-bundle recipe with both items available
    await fetch(`${BASE_URL}/api/cart/recipes/52771`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        storeId,
        servings: 2,
        clearPrevious: true,
      }),
    });

    // Ensure user has an address for checkout
    let address = await prisma.address.findFirst({
      where: { userId: user!.id },
    });
    if (!address) {
      address = await prisma.address.create({
        data: {
          userId: user!.id,
          street: "123 Test Street",
          city: "Pune",
          state: "Maharashtra",
          postalCode: "411001",
          latitude: 18.5204,
          longitude: 73.8567,
          isDefault: true,
        },
      });
    }

    const checkoutRes = await fetch(`${BASE_URL}/api/orders/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        storeId,
        addressId: address.id,
        paymentMethod: "COD",
        idempotencyKey: `e2e-checkout-${Date.now()}`,
      }),
    });
    const checkoutData = await checkoutRes.json() as any;

    if (checkoutRes.status !== 200 && checkoutRes.status !== 201) {
      console.error("Checkout response status:", checkoutRes.status, "Body:", checkoutData);
    }
    assert(checkoutRes.status === 201 || checkoutRes.status === 200, "Checkout returns HTTP 200/201", JSON.stringify(checkoutData));
    assert(checkoutData.success === true, "Checkout indicates success");
    assert(Boolean(checkoutData.data.order?.id), "Checkout returned order with ID");

    testOrderId = checkoutData.data.order.id;
    console.log("Returned testOrderId:", testOrderId);

    // Verify order in database
    const dbOrder = await prisma.order.findUnique({
      where: { id: testOrderId! },
      include: { items: true },
    });

    assert(Boolean(dbOrder), "Database: order record saved successfully");
    assert(dbOrder!.items.length >= 2, `Database: order contains ${dbOrder!.items.length} recipe ingredient items`);
    assert(dbOrder!.orderStatus === "PLACED" || dbOrder!.orderStatus === "PENDING", `Database: order initial status is PLACED/PENDING (got ${dbOrder!.orderStatus})`);

    // Verify cart was emptied
    const emptiedCart = await prisma.cart.findUnique({
      where: { userId: user!.id },
      include: { items: true },
    });
    assert(emptiedCart!.items.length === 0, "Database: customer cart emptied after checkout");

    console.log("\n==================================================================");
    console.log(`  All Verification Steps Completed: ${passed}/${total} Passed (100%)`);
    console.log("==================================================================\n");
  } catch (err) {
    console.error("\n❌ Verification Failed:", err);
    throw err;
  } finally {
    // -----------------------------------------------------------------
    // Cleanup: Restore modified test records safely
    // -----------------------------------------------------------------
    if (testOrderId) {
      await prisma.delivery.deleteMany({ where: { orderId: testOrderId } });
      await prisma.orderItem.deleteMany({ where: { orderId: testOrderId } });
      await prisma.order.deleteMany({ where: { id: testOrderId } });
    }
    for (const item of originalInventoryStock) {
      await prisma.inventory.update({
        where: { id: item.id },
        data: { stockQuantity: item.stockQuantity, isAvailable: true },
      });
    }
    await prisma.$disconnect();
  }
}

runE2EVerification();
