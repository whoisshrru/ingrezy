import { Response } from "express";
import prisma from "../config/prisma.js";
import { AuthenticatedRequest } from "../types/auth.js";
import {
  addCartItemSchema,
  updateCartItemSchema,
  addRecipeToCartSchema,
} from "../validations/cart.validation.js";
import { importRecipeFromTheMealDb } from "../services/themealdb.service.js";

/**
 * Helper to safely extract string param from Express 5 params
 */
function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || "";
  return param || "";
}

/**
 * Helper to find or create customer's cart
 */
async function getOrCreateCart(userId: string) {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              category: true,
              unit: true,
              basePrice: true,
              imageUrl: true,
              dietaryType: true,
              isActive: true,
            },
          },
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                category: true,
                unit: true,
                basePrice: true,
                imageUrl: true,
                dietaryType: true,
                isActive: true,
              },
            },
          },
        },
      },
    });
  }

  return cart;
}

/**
 * GET /api/cart
 * Return authenticated customer's cart with server-calculated prices, subtotals, and stock status.
 */
export async function getCart(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const cart = await getOrCreateCart(userId);

    // If storeId is set, fetch store inventory for accurate pricing and stock
    let storeInfo = null;
    let inventoryMap = new Map<string, { price: number; stockQuantity: number; isAvailable: boolean }>();

    if (cart.storeId) {
      const store = await prisma.store.findUnique({
        where: { id: cart.storeId },
        select: { id: true, name: true, city: true, postalCode: true, isActive: true },
      });
      storeInfo = store;

      const productIds = cart.items.map((i) => i.productId);
      const inventoryRecords = await prisma.inventory.findMany({
        where: {
          storeId: cart.storeId,
          productId: { in: productIds },
        },
      });

      for (const inv of inventoryRecords) {
        inventoryMap.set(inv.productId, {
          price: Number(inv.price),
          stockQuantity: inv.stockQuantity,
          isAvailable: inv.isAvailable,
        });
      }
    }

    let subtotal = 0;
    const unavailableItems: Array<{ productId: string; productName: string; reason: string }> = [];

    const items = cart.items.map((item) => {
      const inv = inventoryMap.get(item.productId);
      const unitPrice = inv ? inv.price : Number(item.product.basePrice);
      const inStock = inv ? inv.isAvailable && inv.stockQuantity >= item.quantity : item.product.isActive;
      const availableStock = inv ? inv.stockQuantity : 999;
      const itemSubtotal = Math.round(unitPrice * item.quantity * 100) / 100;

      if (!inStock) {
        unavailableItems.push({
          productId: item.productId,
          productName: item.product.name,
          reason: inv && inv.stockQuantity < item.quantity
            ? `Only ${inv.stockQuantity} units available in stock`
            : "Product is currently unavailable at selected store",
        });
      } else {
        subtotal += itemSubtotal;
      }

      return {
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        slug: item.product.slug,
        category: item.product.category,
        unit: item.product.unit,
        imageUrl: item.product.imageUrl,
        dietaryType: item.product.dietaryType,
        quantity: item.quantity,
        unitPrice,
        subtotal: itemSubtotal,
        inStock,
        availableStock,
      };
    });

    subtotal = Math.round(subtotal * 100) / 100;
    const deliveryFee = items.length > 0 ? (subtotal >= 500 ? 0 : 30.0) : 0;
    const totalAmount = Math.round((subtotal + deliveryFee) * 100) / 100;

    res.status(200).json({
      success: true,
      message: "Cart retrieved successfully",
      data: {
        cartId: cart.id,
        store: storeInfo,
        itemCount: items.length,
        items,
        unavailableItems,
        pricing: {
          subtotal,
          deliveryFee,
          totalAmount,
        },
      },
    });
  } catch (error) {
    console.error("Get cart error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching cart",
    });
  }
}

/**
 * POST /api/cart/items
 * Add a product to the cart with server-derived pricing and stock validation.
 */
export async function addCartItem(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const parseResult = addCartItemSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parseResult.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }

    const { productId, quantity, storeId, clearPrevious } = parseResult.data;

    // Verify product exists and is active
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) {
      res.status(404).json({
        success: false,
        message: `Product with ID '${productId}' is not available`,
      });
      return;
    }

    // Verify store exists and is active
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store || !store.isActive) {
      res.status(404).json({
        success: false,
        message: `Dark Store with ID '${storeId}' is not active or not found`,
      });
      return;
    }

    const cart = await getOrCreateCart(userId);

    // Check if cart already has items from a different store
    if (cart.storeId && cart.storeId !== storeId && cart.items.length > 0) {
      if (!clearPrevious) {
        res.status(409).json({
          success: false,
          message: `Your cart already contains items from another store. Provide clearPrevious=true to switch to ${store.name}.`,
          currentStoreId: cart.storeId,
          requestedStoreId: storeId,
        });
        return;
      }

      // Customer opted to switch stores: clear old items
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }

    // Check store inventory and stock
    const inventory = await prisma.inventory.findUnique({
      where: {
        storeId_productId: {
          storeId,
          productId,
        },
      },
    });

    if (!inventory || !inventory.isAvailable || inventory.stockQuantity <= 0) {
      res.status(400).json({
        success: false,
        message: `Product '${product.name}' is out of stock at ${store.name}`,
      });
      return;
    }

    // Check existing item in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    const currentQtyInCart = existingItem ? existingItem.quantity : 0;
    const newTotalQuantity = currentQtyInCart + quantity;

    if (newTotalQuantity > inventory.stockQuantity) {
      res.status(400).json({
        success: false,
        message: `Cannot add ${quantity} units. Current stock at store is ${inventory.stockQuantity}, and you already have ${currentQtyInCart} in your cart.`,
        availableStock: inventory.stockQuantity,
        currentInCart: currentQtyInCart,
      });
      return;
    }

    // Upsert cart item and update cart's storeId
    const [updatedItem] = await prisma.$transaction([
      prisma.cartItem.upsert({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
        create: {
          cartId: cart.id,
          productId,
          quantity,
        },
        update: {
          quantity: newTotalQuantity,
        },
        include: {
          product: {
            select: { id: true, name: true, unit: true, category: true },
          },
        },
      }),
      prisma.cart.update({
        where: { id: cart.id },
        data: { storeId },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: `Added ${product.name} to cart`,
      data: {
        cartItem: {
          id: updatedItem.id,
          productId: updatedItem.productId,
          productName: updatedItem.product.name,
          quantity: updatedItem.quantity,
          unitPrice: Number(inventory.price),
          subtotal: Math.round(Number(inventory.price) * updatedItem.quantity * 100) / 100,
        },
      },
    });
  } catch (error) {
    console.error("Add cart item error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while adding item to cart",
    });
  }
}

/**
 * PATCH /api/cart/items/:itemId
 * Update quantity of an item in the customer's cart.
 */
export async function updateCartItem(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const itemId = getParam(req.params.itemId);

    const parseResult = updateCartItemSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parseResult.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }

    const { quantity } = parseResult.data;

    // Verify item belongs to customer's cart
    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
        product: true,
      },
    });

    if (!item || item.cart.userId !== userId) {
      res.status(404).json({
        success: false,
        message: `Cart item with ID '${itemId}' not found in your cart`,
      });
      return;
    }

    // Verify stock at selected store if store is set
    if (item.cart.storeId) {
      const inventory = await prisma.inventory.findUnique({
        where: {
          storeId_productId: {
            storeId: item.cart.storeId,
            productId: item.productId,
          },
        },
      });

      if (!inventory || !inventory.isAvailable || inventory.stockQuantity < quantity) {
        const available = inventory ? inventory.stockQuantity : 0;
        res.status(400).json({
          success: false,
          message: `Requested quantity (${quantity}) exceeds available stock (${available}) at this store.`,
          availableStock: available,
        });
        return;
      }
    }

    const updated = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: {
        product: { select: { id: true, name: true, unit: true } },
      },
    });

    res.status(200).json({
      success: true,
      message: "Cart item quantity updated",
      data: {
        cartItem: {
          id: updated.id,
          productId: updated.productId,
          productName: updated.product.name,
          quantity: updated.quantity,
        },
      },
    });
  } catch (error) {
    console.error("Update cart item error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while updating cart item",
    });
  }
}

/**
 * DELETE /api/cart/items/:itemId
 * Remove an item from the customer's cart.
 */
export async function deleteCartItem(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const itemId = getParam(req.params.itemId);

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item || item.cart.userId !== userId) {
      res.status(404).json({
        success: false,
        message: `Cart item with ID '${itemId}' not found in your cart`,
      });
      return;
    }

    await prisma.cartItem.delete({ where: { id: itemId } });

    // Check if cart is now empty, if so clear storeId
    const remainingCount = await prisma.cartItem.count({ where: { cartId: item.cartId } });
    if (remainingCount === 0) {
      await prisma.cart.update({
        where: { id: item.cartId },
        data: { storeId: null },
      });
    }

    res.status(200).json({
      success: true,
      message: "Item removed from cart successfully",
    });
  } catch (error) {
    console.error("Delete cart item error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while removing cart item",
    });
  }
}

/**
 * DELETE /api/cart
 * Clear customer's cart completely.
 */
export async function clearCart(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await prisma.$transaction([
        prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
        prisma.cart.update({
          where: { id: cart.id },
          data: { storeId: null },
        }),
      ]);
    }

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    console.error("Clear cart error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while clearing cart",
    });
  }
}

/**
 * POST /api/cart/recipes/:recipeId
 * Add all available recipe ingredients to customer's cart for a selected serving size.
 */
export async function addRecipeToCart(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const recipeId = getParam(req.params.recipeId);

    const parseResult = addRecipeToCartSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parseResult.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }

    const {
      storeId,
      servings: targetServings,
      clearPrevious,
      excludeProductIds,
      excludeIngredientIds,
    } = parseResult.data;

    // Verify recipe exists (by ID, slug, externalId, or auto-ingest TheMealDB numeric ID)
    let recipe = await prisma.recipe.findFirst({
      where: {
        OR: [
          { id: recipeId },
          { slug: recipeId },
          { externalId: recipeId },
          { externalId: `themealdb:${recipeId}` },
        ],
      },
      include: {
        ingredients: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!recipe) {
      const cleanNumeric = recipeId.replace(/^meal-|^themealdb:/, "").trim();
      if (/^\d+$/.test(cleanNumeric)) {
        try {
          const importResult = await importRecipeFromTheMealDb(cleanNumeric);
          recipe = importResult.recipe as any;
        } catch (_) {}
      }
    }

    if (!recipe || !recipe.isActive) {
      res.status(404).json({
        success: false,
        message: `Recipe with ID '${recipeId}' not found or inactive`,
      });
      return;
    }

    // Separate matched ingredients (with linked grocery product) from unmatched ingredients
    const matchedIngredients = recipe.ingredients.filter(
      (ing): ing is typeof ing & { productId: string; product: NonNullable<typeof ing.product> } =>
        Boolean(ing.productId && ing.product)
    );

    const unmatchedIngredients = recipe.ingredients
      .filter((ing) => !ing.productId || !ing.product)
      .map((ing) => ({
        id: ing.id,
        ingredientName: ing.ingredientName || "Ingredient",
        rawMeasure: ing.rawMeasure || `${ing.quantity} ${ing.unit}`.trim(),
        reason: "Item not carried in store catalog; purchase separately",
      }));

    // Map recipe ingredients for strict exclusion validation
    const recipeIngredientMap = new Map(recipe.ingredients.map((ing) => [ing.id, ing]));
    const recipeProductMap = new Map(matchedIngredients.map((ing) => [ing.productId, ing]));

    const excludedProductIdsSet = new Set<string>();

    for (const prodId of excludeProductIds) {
      if (!recipeProductMap.has(prodId)) {
        res.status(400).json({
          success: false,
          message: `Invalid exclusion: Product with ID '${prodId}' does not belong to recipe '${recipe.title}'`,
        });
        return;
      }
      excludedProductIdsSet.add(prodId);
    }

    for (const ingId of excludeIngredientIds) {
      const ing = recipeIngredientMap.get(ingId);
      if (!ing) {
        res.status(400).json({
          success: false,
          message: `Invalid exclusion: Ingredient with ID '${ingId}' does not belong to recipe '${recipe.title}'`,
        });
        return;
      }
      if (ing.productId) {
        excludedProductIdsSet.add(ing.productId);
      }
    }

    // Calculate scaling
    const effectiveServings = targetServings || recipe.servings;

    // Check if all purchasable ingredients are already available in customer's pantry
    const isAllExcluded =
      matchedIngredients.length > 0 &&
      matchedIngredients.every((ing) => excludedProductIdsSet.has(ing.productId));

    if (isAllExcluded) {
      res.status(200).json({
        success: true,
        message: "All recipe ingredients are already in your pantry. No items added to cart.",
        data: {
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          targetServings: effectiveServings,
          addedItemsCount: 0,
          addedItems: [],
          excludedIngredientsCount: matchedIngredients.length,
          unavailableIngredientsCount: 0,
          unavailableIngredients: [],
          unmatchedIngredientsCount: unmatchedIngredients.length,
          unmatchedIngredients,
          allExcluded: true,
        },
      });
      return;
    }

    // Verify store exists
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store || !store.isActive) {
      res.status(404).json({
        success: false,
        message: `Dark Store with ID '${storeId}' not found or inactive`,
      });
      return;
    }

    const cart = await getOrCreateCart(userId);

    // Handle store switching if cart has items from another store
    if (cart.storeId && cart.storeId !== storeId && cart.items.length > 0) {
      if (!clearPrevious) {
        res.status(409).json({
          success: false,
          message: `Your cart already contains items from another store. Provide clearPrevious=true to switch to ${store.name}.`,
          currentStoreId: cart.storeId,
          requestedStoreId: storeId,
        });
        return;
      }
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }

    // Filter for matched ingredients to purchase (excluding those already in customer pantry)
    const requiredIngredients = matchedIngredients.filter(
      (ing) => !excludedProductIdsSet.has(ing.productId)
    );

    // Fetch store inventory for required recipe ingredients
    const productIds = requiredIngredients.map((ing) => ing.productId);
    const inventories = await prisma.inventory.findMany({
      where: {
        storeId,
        productId: { in: productIds },
      },
    });

    const inventoryMap = new Map(inventories.map((inv) => [inv.productId, inv]));

    const scaleFactor = effectiveServings / recipe.servings;

    const addedItems: Array<{ productId: string; productName: string; quantity: number; unitPrice: number }> = [];
    const unavailableIngredients: Array<{ productId: string; productName: string; reason: string }> = [];

    // Existing cart items map
    const existingItems = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
    const existingMap = new Map(existingItems.map((i) => [i.productId, i.quantity]));

    const upsertOperations: any[] = [];

    for (const ing of requiredIngredients) {
      const product = ing.product;
      const inv = inventoryMap.get(ing.productId);

      if (!product.isActive || !inv || !inv.isAvailable || inv.stockQuantity <= 0) {
        unavailableIngredients.push({
          productId: product.id,
          productName: product.name,
          reason: !product.isActive
            ? "Product is discontinued"
            : !inv
            ? "Product is not carried at this store"
            : "Product is out of stock",
        });
        continue;
      }

      // Scaling logic: default pack quantity (at least 1 package of the grocery product)
      const currentInCart = existingMap.get(product.id) || 0;
      const neededPacks = Math.max(1, Math.ceil(scaleFactor));
      const targetQuantity = currentInCart > 0 ? Math.max(currentInCart, neededPacks) : neededPacks;

      // Ensure we don't exceed available stock
      const finalQuantity = Math.min(targetQuantity, inv.stockQuantity);

      if (finalQuantity <= 0) {
        unavailableIngredients.push({
          productId: product.id,
          productName: product.name,
          reason: "Insufficient stock to fulfill recipe ingredient",
        });
        continue;
      }

      upsertOperations.push(
        prisma.cartItem.upsert({
          where: {
            cartId_productId: {
              cartId: cart.id,
              productId: product.id,
            },
          },
          create: {
            cartId: cart.id,
            productId: product.id,
            quantity: finalQuantity,
          },
          update: {
            quantity: finalQuantity,
          },
        })
      );

      addedItems.push({
        productId: product.id,
        productName: product.name,
        quantity: finalQuantity,
        unitPrice: Number(inv.price),
      });
    }

    if (upsertOperations.length > 0) {
      await prisma.$transaction([
        ...upsertOperations,
        prisma.cart.update({
          where: { id: cart.id },
          data: { storeId },
        }),
      ]);
    }

    res.status(200).json({
      success: true,
      message:
        addedItems.length > 0
          ? `Added ${addedItems.length} recipe ingredients to your cart`
          : unavailableIngredients.length > 0
          ? "No eligible items could be added to your cart because required ingredients are out of stock"
          : "No items were added to your cart",
      data: {
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        targetServings: effectiveServings,
        addedItemsCount: addedItems.length,
        addedItems,
        excludedIngredientsCount: excludedProductIdsSet.size,
        unavailableIngredientsCount: unavailableIngredients.length,
        unavailableIngredients,
        unmatchedIngredientsCount: unmatchedIngredients.length,
        unmatchedIngredients,
        allExcluded: false,
      },
    });
  } catch (error) {
    console.error("Add recipe to cart error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error while adding recipe to cart",
    });
  }
}
