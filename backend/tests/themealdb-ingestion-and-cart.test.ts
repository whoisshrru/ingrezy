import { prisma } from "../src/config/prisma.js";
import { importRecipeFromTheMealDb } from "../src/services/themealdb.service.js";
import { matchIngredientToProduct, parseMeasurement } from "../src/services/ingredientMapper.service.js";

async function runTests() {
  console.log("\n==================================================================");
  console.log("  Ingrezy Phase 2-4: TheMealDB Ingestion & Cart Integration Test  ");
  console.log("==================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${testName}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  try {
    // 1. Test measurement parsing
    const m1 = parseMeasurement("1 pound");
    assert(m1.quantity === 1 && m1.unit === "pound", "Parser: parses '1 pound'");

    const m2 = parseMeasurement("2 1/2 cups");
    assert(m2.quantity === 2.5 && m2.unit === "cups", "Parser: parses fraction '2 1/2 cups'");

    const m3 = parseMeasurement("250g");
    assert(m3.quantity === 250 && m3.unit === "g", "Parser: parses '250g'");

    const m4 = parseMeasurement("to taste");
    assert(m4.quantity === 1 && m4.unit === "to taste", "Parser: handles non-numeric 'to taste'");

    // 2. Test Ingredient Matching
    const penneMatch = await matchIngredientToProduct("penne rigate");
    assert(penneMatch.isMatched && penneMatch.productId !== null, "Matcher: 'penne rigate' matches 'Durum Wheat Penne Pasta'");

    const tomatoMatch = await matchIngredientToProduct("chopped tomatoes");
    assert(tomatoMatch.isMatched && tomatoMatch.productId !== null, "Matcher: 'chopped tomatoes' matches 'Fresh Red Tomatoes'");

    const chickenMatch = await matchIngredientToProduct("chicken breast");
    assert(chickenMatch.isMatched && chickenMatch.productId !== null, "Matcher: 'chicken breast' matches 'Fresh Chicken Curry Cut'");

    const cheeseMatch = await matchIngredientToProduct("Parmigiano-Reggiano");
    assert(cheeseMatch.isMatched && cheeseMatch.productId !== null, "Matcher: 'Parmigiano-Reggiano' matches 'Rare Cheese'");

    const gratedCheeseMatch = await matchIngredientToProduct("grated parmesan");
    assert(gratedCheeseMatch.isMatched && gratedCheeseMatch.productId !== null, "Matcher: 'grated parmesan' matches 'Rare Cheese' via qualifier stripping");

    // Test genuine uncataloged items safely return unmatched
    const uncatalogedItems = ["olive oil", "garlic", "red chilli flakes", "Italian seasoning", "fresh basil leaves"];
    for (const item of uncatalogedItems) {
      const match = await matchIngredientToProduct(item);
      assert(!match.isMatched && match.productId === null, `Matcher: uncataloged item '${item}' safely returns unmatched with no fake products`);
    }

    // 3. Test TheMealDB Ingestion of Recipe 52771 (Spicy Arrabiata Penne)
    // Clean up if previous test run exists
    await prisma.recipe.deleteMany({
      where: { externalId: "themealdb:52771" },
    });

    const initialCount = await prisma.recipe.count();

    const res1 = await importRecipeFromTheMealDb("52771");
    assert(!res1.isAlreadyImported, "Ingestion: first import marks isAlreadyImported = false");
    assert(res1.recipe.title.toLowerCase().includes("arrabiata"), "Ingestion: recipe title imported accurately");
    assert(res1.recipe.externalId === "themealdb:52771", "Ingestion: externalId stored as 'themealdb:52771'");
    assert(res1.recipe.source === "THEMEALDB", "Ingestion: source recorded as 'THEMEALDB'");
    assert(res1.stats.totalIngredients === 8, "Ingestion: all 8 ingredients successfully extracted");
    assert(res1.stats.matchedCount === 3, "Ingestion: exactly 3 genuine catalog products matched (Pasta, Tomatoes, Cheese)");
    assert(res1.stats.unmatchedCount === 5, "Ingestion: exactly 5 uncataloged items preserved as unmatched");

    const newCount = await prisma.recipe.count();
    assert(newCount === initialCount + 1, "Ingestion: exactly 1 recipe added to database");

    // Verify ingredients in database
    const dbIngredients = await prisma.recipeIngredient.findMany({
      where: { recipeId: res1.recipe.id },
      include: { product: true },
    });
    assert(dbIngredients.length === 8, "Database: all 8 ingredients persisted to recipe_ingredients table");

    const matchedDb = dbIngredients.filter((i) => i.productId !== null);
    const unmatchedDb = dbIngredients.filter((i) => i.productId === null);
    assert(matchedDb.length === 3, "Database: exactly 3 matched ingredients have valid productId foreign keys");
    assert(unmatchedDb.length === 5, "Database: exactly 5 unmatched ingredients have productId = null");
    assert(unmatchedDb.every((i) => i.ingredientName !== null && i.ingredientName.length > 0), "Database: unmatched ingredients retain raw ingredientName");

    // 4. Test Idempotency: Import same recipe a second time
    const res2 = await importRecipeFromTheMealDb("52771");
    assert(res2.isAlreadyImported, "Idempotency: second import detects existing record and marks isAlreadyImported = true");
    assert(res2.recipe.id === res1.recipe.id, "Idempotency: returns exact same recipe ID");

    const postCount = await prisma.recipe.count();
    assert(postCount === newCount, "Idempotency: duplicate import does NOT increment recipe count");

    console.log("\n==================================================================");
    console.log(`  Tests Completed: ${passed}/${total} Passed (${Math.round((passed / total) * 100)}%)`);
    console.log("==================================================================\n");
  } catch (err) {
    console.error("Test failed with error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
