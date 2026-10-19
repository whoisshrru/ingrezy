declare const process: any;

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

import { addRecipeToCartSchema } from "../src/validations/cart.validation.js";

async function runRecipePantryUnitTests() {
  console.log("==================================================================");
  console.log("  Ingrezy — Recipe Pantry Exclusions Unit Test Suite             ");
  console.log("==================================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    totalTests++;
    try {
      await fn();
      console.log(`  ✓ [PASS] ${name}`);
      passedTests++;
    } catch (err: any) {
      console.error(`  ✗ [FAIL] ${name}`);
      console.error(`    ${err?.message || err}`);
      if (err.stack) console.error(err.stack);
      process.exitCode = 1;
    }
  }

  // Sample UUIDs
  const validStoreId = "c2a9a7a0-0000-4000-8000-000000000001";
  const validProdId1 = "d1a9a7a0-0000-4000-8000-000000000001";
  const validProdId2 = "d2a9a7a0-0000-4000-8000-000000000002";
  const validProdId3 = "d3a9a7a0-0000-4000-8000-000000000003";
  const validIngId1 = "e1a9a7a0-0000-4000-8000-000000000001";
  const validIngId2 = "e2a9a7a0-0000-4000-8000-000000000002";
  const foreignProdId = "f9a9a7a0-0000-4000-8000-000000000099";

  // --------------------------------------------------------------------------
  // 1. ZOD SCHEMA VALIDATION TESTS
  // --------------------------------------------------------------------------
  await test("Schema: Validates payload with no exclusions (defaults to empty arrays)", () => {
    const result = addRecipeToCartSchema.safeParse({
      storeId: validStoreId,
      servings: 4,
    });
    assert.ok(result.success, "Should succeed with valid storeId and servings");
    if (result.success) {
      assert.deepEqual(result.data.excludeProductIds, []);
      assert.deepEqual(result.data.excludeIngredientIds, []);
      assert.equal(result.data.servings, 4);
    }
  });

  await test("Schema: Validates payload with valid excludeProductIds array", () => {
    const result = addRecipeToCartSchema.safeParse({
      storeId: validStoreId,
      excludeProductIds: [validProdId1, validProdId2],
    });
    assert.ok(result.success, "Should succeed with valid product UUIDs");
    if (result.success) {
      assert.equal(result.data.excludeProductIds.length, 2);
      assert.equal(result.data.excludeProductIds[0], validProdId1);
    }
  });

  await test("Schema: Validates payload with valid excludeIngredientIds array", () => {
    const result = addRecipeToCartSchema.safeParse({
      storeId: validStoreId,
      excludeIngredientIds: [validIngId1, validIngId2],
    });
    assert.ok(result.success, "Should succeed with valid ingredient UUIDs");
    if (result.success) {
      assert.equal(result.data.excludeIngredientIds.length, 2);
      assert.equal(result.data.excludeIngredientIds[0], validIngId1);
    }
  });

  await test("Schema: Rejects empty strings in excludeProductIds", () => {
    const result = addRecipeToCartSchema.safeParse({
      storeId: validStoreId,
      excludeProductIds: ["", validProdId1],
    });
    assert.equal(result.success, false, "Should reject empty product ID");
  });

  await test("Schema: Rejects empty strings in excludeIngredientIds", () => {
    const result = addRecipeToCartSchema.safeParse({
      storeId: validStoreId,
      excludeIngredientIds: [""],
    });
    assert.equal(result.success, false, "Should reject empty ingredient ID");
  });

  await test("Schema: Rejects negative or zero servings", () => {
    const resZero = addRecipeToCartSchema.safeParse({ storeId: validStoreId, servings: 0 });
    const resNeg = addRecipeToCartSchema.safeParse({ storeId: validStoreId, servings: -2 });
    assert.equal(resZero.success, false, "Should reject servings = 0");
    assert.equal(resNeg.success, false, "Should reject negative servings");
  });

  await test("Schema: Rejects invalid storeId format", () => {
    const result = addRecipeToCartSchema.safeParse({ storeId: "" });
    assert.equal(result.success, false, "Should reject empty storeId");
  });

  // --------------------------------------------------------------------------
  // 2. RECIPE EXCLUSION & INGREDIENT MATCHING LOGIC TESTS
  // --------------------------------------------------------------------------
  const mockRecipe = {
    id: "recipe-001",
    title: "Paneer Butter Masala",
    servings: 2,
    isActive: true,
    ingredients: [
      { id: validIngId1, productId: validProdId1, product: { id: validProdId1, name: "Paneer 200g", isActive: true } },
      { id: validIngId2, productId: validProdId2, product: { id: validProdId2, name: "Butter 100g", isActive: true } },
      { id: "e3a9a7a0-0000-4000-8000-000000000003", productId: validProdId3, product: { id: validProdId3, name: "Tomato Puree 500g", isActive: true } },
    ],
  };

  // Helper function mimicking the controller's exclusion validation
  function validateExclusions(recipe: typeof mockRecipe, excludeProductIds: string[], excludeIngredientIds: string[] = []) {
    const recipeIngredientMap = new Map(recipe.ingredients.map((ing) => [ing.id, ing]));
    const recipeProductMap = new Map(recipe.ingredients.map((ing) => [ing.productId, ing]));

    const excludedProductIdsSet = new Set<string>();

    for (const prodId of excludeProductIds) {
      if (!recipeProductMap.has(prodId)) {
        throw new Error(`Invalid exclusion: Product with ID '${prodId}' does not belong to recipe '${recipe.title}'`);
      }
      excludedProductIdsSet.add(prodId);
    }

    for (const ingId of excludeIngredientIds) {
      const ing = recipeIngredientMap.get(ingId);
      if (!ing) {
        throw new Error(`Invalid exclusion: Ingredient with ID '${ingId}' does not belong to recipe '${recipe.title}'`);
      }
      excludedProductIdsSet.add(ing.productId);
    }

    const isAllExcluded =
      recipe.ingredients.length > 0 &&
      recipe.ingredients.every((ing) => excludedProductIdsSet.has(ing.productId));

    const requiredIngredients = recipe.ingredients.filter(
      (ing) => !excludedProductIdsSet.has(ing.productId)
    );

    return { excludedProductIdsSet, isAllExcluded, requiredIngredients };
  }

  await test("Logic: Successfully excludes marked pantry product IDs and keeps remaining ingredients", () => {
    // Exclude Butter (validProdId2)
    const { excludedProductIdsSet, isAllExcluded, requiredIngredients } = validateExclusions(
      mockRecipe,
      [validProdId2]
    );

    assert.equal(excludedProductIdsSet.size, 1);
    assert.ok(excludedProductIdsSet.has(validProdId2));
    assert.equal(isAllExcluded, false);
    assert.equal(requiredIngredients.length, 2);
    assert.equal(requiredIngredients[0].productId, validProdId1); // Paneer
    assert.equal(requiredIngredients[1].productId, validProdId3); // Tomato Puree
  });

  await test("Logic: Successfully excludes via ingredient IDs and keeps remaining ingredients", () => {
    // Exclude Paneer by its RecipeIngredient ID (validIngId1)
    const { excludedProductIdsSet, isAllExcluded, requiredIngredients } = validateExclusions(
      mockRecipe,
      [],
      [validIngId1]
    );

    assert.equal(excludedProductIdsSet.size, 1);
    assert.ok(excludedProductIdsSet.has(validProdId1));
    assert.equal(isAllExcluded, false);
    assert.equal(requiredIngredients.length, 2);
  });

  await test("Logic: Rejects foreign/unrelated product exclusion IDs with descriptive error", () => {
    let errorThrown = false;
    try {
      validateExclusions(mockRecipe, [foreignProdId]);
    } catch (err: any) {
      errorThrown = true;
      assert.ok(err.message.includes(`Product with ID '${foreignProdId}' does not belong to recipe 'Paneer Butter Masala'`));
    }
    assert.ok(errorThrown, "Should throw error for unrelated product ID");
  });

  await test("Logic: Detects 100% pantry exclusion state without requiring database mutations", () => {
    // Customer has Paneer, Butter, and Tomato Puree already
    const { isAllExcluded, requiredIngredients, excludedProductIdsSet } = validateExclusions(
      mockRecipe,
      [validProdId1, validProdId2, validProdId3]
    );

    assert.equal(isAllExcluded, true);
    assert.equal(requiredIngredients.length, 0);
    assert.equal(excludedProductIdsSet.size, 3);
  });

  // --------------------------------------------------------------------------
  // 3. SERVING SIZE SCALING & INVENTORY BOUNDING LOGIC TESTS
  // --------------------------------------------------------------------------
  function calculateIngredientQuantity(
    recipeBaseServings: number,
    targetServings: number,
    currentInCart: number,
    storeStockQuantity: number
  ) {
    const scaleFactor = targetServings / recipeBaseServings;
    const neededPacks = Math.max(1, Math.ceil(scaleFactor));
    const targetQuantity = currentInCart > 0 ? Math.max(currentInCart, neededPacks) : neededPacks;
    const finalQuantity = Math.min(targetQuantity, storeStockQuantity);
    return { scaleFactor, neededPacks, finalQuantity };
  }

  await test("Scaling: Correctly scales ingredient pack quantities for remaining items", () => {
    // Base 2 servings -> 2 target servings = 1 pack
    const s1 = calculateIngredientQuantity(2, 2, 0, 10);
    assert.equal(s1.neededPacks, 1);
    assert.equal(s1.finalQuantity, 1);

    // Base 2 servings -> 4 target servings = 2 packs
    const s2 = calculateIngredientQuantity(2, 4, 0, 10);
    assert.equal(s2.neededPacks, 2);
    assert.equal(s2.finalQuantity, 2);

    // Base 2 servings -> 5 target servings = 3 packs (ceil(2.5) = 3)
    const s3 = calculateIngredientQuantity(2, 5, 0, 10);
    assert.equal(s3.neededPacks, 3);
    assert.equal(s3.finalQuantity, 3);

    // Base 4 servings -> 1 target serving = 1 pack minimum
    const s4 = calculateIngredientQuantity(4, 1, 0, 10);
    assert.equal(s4.neededPacks, 1);
    assert.equal(s4.finalQuantity, 1);
  });

  await test("Stock Bounding: Caps scaled pack quantity if it exceeds store inventory stock", () => {
    // Needed 5 packs, but store has only 3 units in stock
    const bounded = calculateIngredientQuantity(2, 10, 0, 3);
    assert.equal(bounded.neededPacks, 5);
    assert.equal(bounded.finalQuantity, 3, "Quantity must be capped at store stock (3)");
  });

  await test("Normal Bundling: When exclusions are empty, all 3 ingredients are bundled", () => {
    const { excludedProductIdsSet, isAllExcluded, requiredIngredients } = validateExclusions(
      mockRecipe,
      []
    );
    assert.equal(excludedProductIdsSet.size, 0);
    assert.equal(isAllExcluded, false);
    assert.equal(requiredIngredients.length, 3);
  });

  console.log("\n==================================================================");
  console.log(`  Tests Passed: ${passedTests} / ${totalTests}`);
  console.log("==================================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runRecipePantryUnitTests().catch((err) => {
  console.error("Unhandled test runner error:", err);
  process.exit(1);
});
