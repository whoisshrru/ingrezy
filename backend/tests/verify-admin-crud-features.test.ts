import prisma from "../src/config/prisma.js";
import { signAccessToken } from "../src/utils/jwt.js";

const BASE_URL = "http://localhost:5000";

async function runAdminVerification() {
  console.log("\n==================================================================");
  console.log("  Ingrezy: Admin Product, Stock & Recipe CRUD Verification Suite");
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

  // Find Admin User and Store
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!adminUser) throw new Error("No ADMIN user found in database!");

  const activeStore = await prisma.store.findFirst({ where: { isActive: true } });
  if (!activeStore) throw new Error("No active Store found in database!");

  const adminToken = signAccessToken({
    userId: adminUser.id,
    role: adminUser.role,
    phoneNumber: adminUser.phoneNumber,
  });

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminToken}`,
  };

  let testProductId: string | null = null;
  let testRecipeId: string | null = null;

  try {
    // -------------------------------------------------------------
    // 1. PRODUCT CRUD & POSTGRESQL PERSISTENCE
    // -------------------------------------------------------------
    console.log("--- 1. Testing Product Management (POST /api/products) ---");
    const uniqueSuffix = Date.now().toString().slice(-6);
    const productPayload = {
      name: `Test Organic Alphonso Mangoes ${uniqueSuffix}`,
      category: "Fruits",
      description: "Hand-picked organic Ratnagiri Alphonso mangoes",
      unit: "1kg",
      basePrice: 199.5,
      imageUrl: "https://images.unsplash.com/photo-1553279768-865429fa0078",
      dietaryType: "VEG",
      isActive: true,
    };

    const createProdRes = await fetch(`${BASE_URL}/api/products`, {
      method: "POST",
      headers,
      body: JSON.stringify(productPayload),
    });
    const createProdJson = (await createProdRes.json()) as any;
    assert(createProdRes.status === 201, "API: Product created with status 201");
    assert(Boolean(createProdJson.data?.product?.id), "API: Product returns valid generated ID");

    testProductId = createProdJson.data.product.id;

    // Verify directly in PostgreSQL via Prisma
    const dbProduct = await prisma.product.findUnique({ where: { id: testProductId! } });
    assert(Boolean(dbProduct), "PostgreSQL: Product record persisted in database");
    assert(dbProduct?.name === productPayload.name, "PostgreSQL: Product name matches");
    assert(Number(dbProduct?.basePrice) === 199.5, "PostgreSQL: Product base price matches 199.50");
    assert(dbProduct?.unit === "1kg", "PostgreSQL: Product packaging unit matches '1kg'");

    // Test Product Update (PUT /api/products/:id)
    const updateProdRes = await fetch(`${BASE_URL}/api/products/${testProductId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        basePrice: 220.0,
        description: "Updated premium hand-picked Alphonso mangoes",
      }),
    });
    const updateProdJson = (await updateProdRes.json()) as any;
    assert(updateProdRes.status === 200, "API: Product updated with status 200");
    assert(Number(updateProdJson.data?.product?.basePrice) === 220.0, "API: Updated price returned");

    // -------------------------------------------------------------
    // 2. STOCK MANAGEMENT & INVENTORY UPSERT
    // -------------------------------------------------------------
    console.log("\n--- 2. Testing Stock Management (POST/PATCH /api/stores/:id/inventory) ---");
    const stockPayload = {
      productId: testProductId,
      stockQuantity: 35,
      price: 215.0,
      isAvailable: true,
    };

    const addStockRes = await fetch(`${BASE_URL}/api/stores/${activeStore.id}/inventory`, {
      method: "POST",
      headers,
      body: JSON.stringify(stockPayload),
    });
    const addStockJson = (await addStockRes.json()) as any;
    assert(addStockRes.status === 200, "API: Stock created/upserted with status 200");
    assert(addStockJson.data?.inventoryItem?.stockQuantity === 35, "API: Stock quantity is 35");

    // Verify in PostgreSQL
    const dbInventory = await prisma.inventory.findUnique({
      where: {
        storeId_productId: {
          storeId: activeStore.id,
          productId: testProductId!,
        },
      },
    });
    assert(Boolean(dbInventory), "PostgreSQL: Inventory record exists with composite unique key");
    assert(dbInventory?.stockQuantity === 35, "PostgreSQL: Inventory stockQuantity is 35");
    assert(Number(dbInventory?.price) === 215.0, "PostgreSQL: Inventory store price is 215.00");

    // Test Update Stock (PATCH /api/stores/:id/inventory/:productId)
    const updateStockRes = await fetch(
      `${BASE_URL}/api/stores/${activeStore.id}/inventory/${testProductId}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          stockQuantity: 4, // low stock test
          price: 210.0,
        }),
      }
    );
    const updateStockJson = (await updateStockRes.json()) as any;
    assert(updateStockRes.status === 200, "API: Inventory patched with status 200");
    assert(updateStockJson.data?.inventoryItem?.stockQuantity === 4, "API: Patched stock is 4");

    // Negative stock prevention test
    const negStockRes = await fetch(
      `${BASE_URL}/api/stores/${activeStore.id}/inventory/${testProductId}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ stockQuantity: -10 }),
      }
    );
    assert(negStockRes.status === 400, "API: Negative stock rejected with 400 Validation Error");

    // -------------------------------------------------------------
    // 3. ADMIN INVENTORY WITH CUSTOM THRESHOLD
    // -------------------------------------------------------------
    console.log("\n--- 3. Testing Admin Inventory & Threshold (GET /api/admin/inventory) ---");
    const thresholdRes = await fetch(
      `${BASE_URL}/api/admin/inventory?threshold=5&storeId=${activeStore.id}`,
      { headers }
    );
    const thresholdJson = (await thresholdRes.json()) as any;
    assert(thresholdRes.status === 200, "API: Admin inventory retrieved with status 200");
    assert(thresholdJson.data?.threshold === 5, "API: Response reflects custom threshold (5)");

    const foundTestInv = thresholdJson.data?.inventories?.find(
      (inv: any) => inv.productId === testProductId
    );
    assert(Boolean(foundTestInv), "API: Test product present in admin inventory overview");
    assert(foundTestInv?.isLowStock === true, "API: Item with qty 4 flagged isLowStock: true when threshold=5");

    // -------------------------------------------------------------
    // 4. RECIPE CRUD & MULTILINGUAL INGREDIENTS
    // -------------------------------------------------------------
    console.log("\n--- 4. Testing Recipe CRUD (POST /api/recipes) ---");
    const recipePayload = {
      title: `Mango Kheer Royale ${uniqueSuffix}`,
      description: "[English]\nRich cardamom scented rice pudding with fresh mangoes\n\n[मराठी - Marathi]\nतांदळाची स्वादिष्ट आंबा खीर",
      cuisine: "Indian",
      prepTimeMinutes: 10,
      cookTimeMinutes: 20,
      servings: 4,
      difficulty: "EASY",
      dietaryType: "VEG",
      instructions: "[English]\n1. Simmer milk with fragrant basmati rice until creamy.\n2. Fold in fresh mango pulp and cardamom powder.\n\n[मराठी - Marathi]\n१. दुधात तांदूळ मऊ शिजवून घ्या.\n२. त्यात आंब्याचा गर आणि वेलची पूड घाला.",
      imageUrl: "https://images.unsplash.com/photo-1546548970-71785318a17b",
      isActive: true,
      ingredients: [
        {
          productId: testProductId, // Mapped to catalog product
          quantity: 2,
          unit: "piece",
          isMandatory: true,
          notes: "Ripe sweet mangoes",
        },
        {
          ingredientName: "Cardamom Pods (वेलची)", // Custom unmapped ingredient
          quantity: 4,
          unit: "piece",
          isMandatory: false,
          notes: "Freshly crushed",
        },
      ],
    };

    const createRecipeRes = await fetch(`${BASE_URL}/api/recipes`, {
      method: "POST",
      headers,
      body: JSON.stringify(recipePayload),
    });
    const createRecipeJson = (await createRecipeRes.json()) as any;
    assert(createRecipeRes.status === 201, "API: Recipe created with status 201");
    assert(Boolean(createRecipeJson.data?.recipe?.id), "API: Recipe returns valid generated ID");

    testRecipeId = createRecipeJson.data.recipe.id;

    // Verify in PostgreSQL
    const dbRecipe = await prisma.recipe.findUnique({
      where: { id: testRecipeId! },
      include: { ingredients: true },
    });
    assert(Boolean(dbRecipe), "PostgreSQL: Recipe persisted in database");
    assert(dbRecipe?.ingredients.length === 2, "PostgreSQL: Exactly 2 ingredients persisted");

    const mappedIng = dbRecipe?.ingredients.find((i) => i.productId === testProductId);
    const unmappedIng = dbRecipe?.ingredients.find((i) => i.productId === null);
    assert(Boolean(mappedIng), "PostgreSQL: Catalog mapped ingredient linked correctly");
    assert(Boolean(unmappedIng), "PostgreSQL: Custom unmapped ingredient saved safely without bad linkage");
    assert(
      unmappedIng?.ingredientName?.includes("Cardamom"),
      "PostgreSQL: Custom ingredient name preserved accurately"
    );

    // -------------------------------------------------------------
    // 5. THEMEALDB SEARCH & IMPORT
    // -------------------------------------------------------------
    console.log("\n--- 5. Testing TheMealDB Live Search & Import ---");
    const searchRes = await fetch(
      `${BASE_URL}/api/recipes/import/themealdb/search?q=chicken`,
      { headers }
    );
    const searchJson = (await searchRes.json()) as any;
    assert(searchRes.status === 200, "API: TheMealDB search returns status 200");
    assert(searchJson.data?.count > 0, `API: TheMealDB search found ${searchJson.data?.count} recipes`);

    // Test Import
    const importRes = await fetch(`${BASE_URL}/api/recipes/import/themealdb/52772`, {
      method: "POST",
      headers,
    });
    const importJson = (await importRes.json()) as any;
    assert(
      importRes.status === 200 || importRes.status === 201,
      "API: TheMealDB recipe import succeeds with 200/201"
    );
    assert(
      Boolean(importJson.data?.recipe?.id),
      `API: Imported meal 52772 exists with ID: ${importJson.data?.recipe?.id}`
    );

    // Test Idempotent Duplicate Import
    const dupImportRes = await fetch(`${BASE_URL}/api/recipes/import/themealdb/52772`, {
      method: "POST",
      headers,
    });
    const dupImportJson = (await dupImportRes.json()) as any;
    assert(dupImportRes.status === 200, "API: Duplicate import returned 200 without creating new duplicate");
    assert(dupImportJson.data?.isAlreadyImported === true, "API: Flagged as isAlreadyImported: true");

    // -------------------------------------------------------------
    // 6. CUSTOMER BROWSING & CART BUNDLING VERIFICATION
    // -------------------------------------------------------------
    console.log("\n--- 6. Testing Customer Catalog & Recipe Cart Bundling ---");
    // Verify customer product catalog visibility
    const custProdRes = await fetch(`${BASE_URL}/api/products/${testProductId}`);
    const custProdJson = (await custProdRes.json()) as any;
    assert(custProdRes.status === 200, "Customer API: Product is accessible by customer");
    assert(
      custProdJson.data?.product?.inventory?.some((inv: any) => inv.storeId === activeStore.id),
      "Customer API: Store inventory attached to customer product detail"
    );

    // Verify recipe detail & scaling preview
    const custRecipeRes = await fetch(
      `${BASE_URL}/api/recipes/${testRecipeId}/preview?servings=8&storeId=${activeStore.id}`
    );
    const custRecipeJson = (await custRecipeRes.json()) as any;
    assert(custRecipeRes.status === 200, "Customer API: Recipe preview generated with status 200");
    assert(custRecipeJson.data?.targetServings === 8, "Customer API: Servings dynamically scaled to 8");
    assert(
      custRecipeJson.data?.cartBundleReady?.bundleItems?.length === 1,
      "Customer API: Mapped catalog ingredient included in 1-click grocery cart bundle"
    );

    console.log("\n==================================================================");
    console.log(`  All Admin & Customer Integration Tests Passed (${passed}/${total})`);
    console.log("==================================================================\n");
  } finally {
    // Clean up test records safely to preserve database cleanliness
    if (testRecipeId) {
      await prisma.recipe.delete({ where: { id: testRecipeId } }).catch(() => {});
    }
    if (testProductId) {
      await prisma.inventory
        .deleteMany({ where: { productId: testProductId } })
        .catch(() => {});
      await prisma.product.delete({ where: { id: testProductId } }).catch(() => {});
    }
  }
}

runAdminVerification().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
