import { prisma } from "../src/config/prisma.js";
import { matchIngredientToProduct, normalizeIngredientName, stripCookingQualifiers } from "../src/services/ingredientMapper.service.js";

async function runIngredientMatchingTests() {
  console.log("\n==================================================================");
  console.log("  Ingrezy: Ingredient Matching, Unmatched Catalog & Inventory Test");
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

  try {
    // -------------------------------------------------------------
    // 1. Normalization & Qualifier Stripping Tests
    // -------------------------------------------------------------
    console.log("--- 1. Normalization & Stem Stripping ---");
    assert(normalizeIngredientName("Parmigiano-Reggiano") === "parmigiano reggiano", "Normalize: lowercases and strips hyphens from 'Parmigiano-Reggiano'");
    assert(normalizeIngredientName("Fresh Basil Leaves!") === "fresh basil leaves", "Normalize: lowercases and removes punctuation");
    assert(stripCookingQualifiers("grated parmigiano reggiano") === "parmigiano reggiano", "Stemming: strips 'grated' qualifier");
    assert(stripCookingQualifiers("fresh red tomatoes") === "red tomatoes", "Stemming: strips 'fresh' qualifier");
    assert(stripCookingQualifiers("extra virgin olive oil") === "olive oil", "Stemming: strips 'extra' and 'virgin' qualifiers");

    // -------------------------------------------------------------
    // 2. Genuine Equivalent Matching (Recipe 52771 Matched Items)
    // -------------------------------------------------------------
    console.log("\n--- 2. Genuine Equivalent Matching ---");
    const penne = await matchIngredientToProduct("penne rigate");
    assert(penne.isMatched && penne.productName === "Durum Wheat Penne Pasta", "Match: 'penne rigate' matches 'Durum Wheat Penne Pasta'");

    const tomato = await matchIngredientToProduct("chopped tomatoes");
    assert(tomato.isMatched && tomato.productName === "Fresh Red Tomatoes", "Match: 'chopped tomatoes' matches 'Fresh Red Tomatoes'");

    const parm = await matchIngredientToProduct("Parmigiano-Reggiano");
    assert(parm.isMatched && parm.productName?.includes("Rare Cheese"), "Match: 'Parmigiano-Reggiano' matches catalog cheese product");

    const gratedParm = await matchIngredientToProduct("grated parmesan");
    assert(gratedParm.isMatched && gratedParm.productName?.includes("Rare Cheese"), "Match: 'grated parmesan' matches catalog cheese via qualifier stripping");

    const parmesan = await matchIngredientToProduct("parmesan");
    assert(parmesan.isMatched && parmesan.productName?.includes("Rare Cheese"), "Match: 'parmesan' alias matches catalog cheese");

    // -------------------------------------------------------------
    // 3. Safe Rejection of Missing Catalog Items (Unmatched)
    // -------------------------------------------------------------
    console.log("\n--- 3. Missing Catalog Items Safely Unmatched ---");
    const missingItems = [
      { name: "olive oil", category: "Cooking Oils" },
      { name: "garlic", category: "Alliums (non-onion)" },
      { name: "red chilli flakes", category: "Spices & Seasonings" },
      { name: "Italian seasoning", category: "Dried Herbs" },
      { name: "basil", category: "Fresh Herbs" },
    ];

    for (const item of missingItems) {
      const match = await matchIngredientToProduct(item.name);
      assert(
        !match.isMatched && match.productId === null && match.productName === null,
        `Unmatched: '${item.name}' (${item.category}) returns isMatched=false, productId=null (no false positive)`
      );
    }

    // -------------------------------------------------------------
    // 4. Prevention of False-Positive Matches to Unrelated Products
    // -------------------------------------------------------------
    console.log("\n--- 4. Prevention of False-Positive Matches ---");
    const garlicMatch = await matchIngredientToProduct("garlic");
    assert(garlicMatch.productName !== "Farm Fresh Onions", "Integrity: 'garlic' is NOT falsely mapped to 'Farm Fresh Onions'");

    const oilMatch = await matchIngredientToProduct("olive oil");
    assert(oilMatch.productName !== "Amul Table Butter", "Integrity: 'olive oil' is NOT falsely mapped to 'Amul Table Butter'");

    const basilMatch = await matchIngredientToProduct("basil");
    assert(basilMatch.productName !== "Fresh Red Tomatoes", "Integrity: 'basil' is NOT falsely mapped to 'Fresh Red Tomatoes'");

    // -------------------------------------------------------------
    // 5. Store Inventory & Stock Availability Verification
    // -------------------------------------------------------------
    console.log("\n--- 5. Store Inventory Availability for Matched Items ---");
    const store = await prisma.store.findFirst({ where: { isActive: true } });
    assert(Boolean(store), `Store: active dark store found (${store?.name})`);

    const matchedProductIds = [penne.productId!, tomato.productId!, parm.productId!];
    for (const prodId of matchedProductIds) {
      const product = await prisma.product.findUnique({ where: { id: prodId } });
      const inventory = await prisma.inventory.findUnique({
        where: {
          storeId_productId: {
            storeId: store!.id,
            productId: prodId,
          },
        },
      });

      assert(Boolean(inventory), `Inventory: product '${product?.name}' exists in store '${store?.name}'`);
      assert(
        Boolean(inventory && inventory.stockQuantity > 0 && inventory.isAvailable),
        `Inventory: product '${product?.name}' is in stock (qty: ${inventory?.stockQuantity}, available: ${inventory?.isAvailable})`
      );
    }

    // -------------------------------------------------------------
    // 6. Verify Recipe 52771 Ingested Database Record Integrity
    // -------------------------------------------------------------
    console.log("\n--- 6. Recipe 52771 Database Ingredient Breakdown ---");
    const recipe = await prisma.recipe.findFirst({
      where: { externalId: "themealdb:52771" },
      include: {
        ingredients: {
          include: { product: true },
        },
      },
    });

    assert(Boolean(recipe), "Database: Recipe 52771 exists in PostgreSQL");
    assert(recipe!.ingredients.length === 8, `Database: exactly 8 ingredients recorded (found ${recipe!.ingredients.length})`);

    const matchedDb = recipe!.ingredients.filter((i) => i.productId !== null);
    const unmatchedDb = recipe!.ingredients.filter((i) => i.productId === null);

    assert(matchedDb.length === 3, `Database: exactly 3 matched ingredients (found ${matchedDb.length})`);
    assert(unmatchedDb.length === 5, `Database: exactly 5 unmatched ingredients (found ${unmatchedDb.length})`);

    const matchedNames = matchedDb.map((i) => i.product?.name).sort();
    assert(
      matchedNames.some((n) => n?.includes("Penne")) &&
      matchedNames.some((n) => n?.includes("Tomatoes")) &&
      matchedNames.some((n) => n?.includes("Cheese")),
      "Database: matched products are Penne, Tomatoes, and Cheese"
    );

    const unmatchedNames = unmatchedDb.map((i) => i.ingredientName.toLowerCase()).sort();
    assert(
      unmatchedNames.includes("olive oil") &&
      unmatchedNames.includes("garlic") &&
      unmatchedNames.includes("red chilli flakes") &&
      unmatchedNames.includes("italian seasoning") &&
      unmatchedNames.includes("basil"),
      "Database: unmatched ingredients preserve exact raw names for missing catalog items"
    );

    console.log("\n==================================================================");
    console.log(`  Ingredient Matching & Inventory Suite: ${passed}/${total} Passed (100%)`);
    console.log("==================================================================\n");
  } catch (err) {
    console.error("\n❌ Test Suite Failed:", err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

runIngredientMatchingTests();
