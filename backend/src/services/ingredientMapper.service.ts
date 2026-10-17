import prisma from "../config/prisma.js";

export interface MatchResult {
  productId: string | null;
  productName: string | null;
  isMatched: boolean;
  confidence: number;
}

/**
 * Normalized alias dictionary mapping ingredient keywords/stems to Ingrezy catalog product slugs.
 */
const ALIAS_TO_SLUG_MAP: Record<string, string> = {
  // Pasta & Noodles
  "penne": "durum-wheat-penne-pasta-500g",
  "penne rigate": "durum-wheat-penne-pasta-500g",
  "pasta": "durum-wheat-penne-pasta-500g",
  "durum wheat pasta": "durum-wheat-penne-pasta-500g",
  "rigatoni": "durum-wheat-penne-pasta-500g",
  "macaroni": "durum-wheat-penne-pasta-500g",
  "noodles": "hakka-noodles-300g",
  "hakka noodles": "hakka-noodles-300g",
  "egg noodles": "hakka-noodles-300g",
  "chow mein": "hakka-noodles-300g",

  // Meat
  "chicken": "fresh-chicken-curry-cut-500g",
  "chicken breast": "fresh-chicken-curry-cut-500g",
  "chicken breasts": "fresh-chicken-curry-cut-500g",
  "chicken thighs": "fresh-chicken-curry-cut-500g",
  "chicken curry cut": "fresh-chicken-curry-cut-500g",
  "boneless chicken": "fresh-chicken-curry-cut-500g",
  "chicken pieces": "fresh-chicken-curry-cut-500g",

  // Vegetables
  "onion": "farm-fresh-onions-1kg",
  "onions": "farm-fresh-onions-1kg",
  "red onion": "farm-fresh-onions-1kg",
  "red onions": "farm-fresh-onions-1kg",
  "yellow onion": "farm-fresh-onions-1kg",
  "chopped onion": "farm-fresh-onions-1kg",
  "chopped onions": "farm-fresh-onions-1kg",
  "shallots": "farm-fresh-onions-1kg",

  "tomato": "fresh-red-tomatoes-500g",
  "tomatoes": "fresh-red-tomatoes-500g",
  "red tomato": "fresh-red-tomatoes-500g",
  "red tomatoes": "fresh-red-tomatoes-500g",
  "chopped tomatoes": "fresh-red-tomatoes-500g",
  "plum tomatoes": "fresh-red-tomatoes-500g",
  "diced tomatoes": "fresh-red-tomatoes-500g",
  "cherry tomatoes": "fresh-red-tomatoes-500g",

  // Dairy & Cheese
  "butter": "amul-table-butter-100g",
  "table butter": "amul-table-butter-100g",
  "unsalted butter": "amul-table-butter-100g",
  "salted butter": "amul-table-butter-100g",
  "amul butter": "amul-table-butter-100g",

  "cheese": "rare-cheese-047709",
  "rare cheese": "rare-cheese-047709",
  "parmigiano": "rare-cheese-047709",
  "parmigiano reggiano": "rare-cheese-047709",
  "parmesan": "rare-cheese-047709",
  "parmesan cheese": "rare-cheese-047709",
  "grated parmesan": "rare-cheese-047709",
  "grated cheese": "rare-cheese-047709",
  "cheddar": "rare-cheese-047709",
  "cheddar cheese": "rare-cheese-047709",

  "milk": "cow-milk-500ml",
  "cow milk": "cow-milk-500ml",
  "whole milk": "cow-milk-500ml",
  "fresh milk": "cow-milk-500ml",

  "paneer": "fresh-malai-paneer-200g",
  "malai paneer": "fresh-malai-paneer-200g",
  "cottage cheese": "fresh-malai-paneer-200g",

  // Bakery & Grains
  "pav": "pav-bread-pack-of-6",
  "ladi pav": "pav-bread-pack-of-6",
  "pav bread": "pav-bread-pack-of-6",
  "bread rolls": "pav-bread-pack-of-6",
  "dinner rolls": "pav-bread-pack-of-6",
  "buns": "pav-bread-pack-of-6",

  "brown bread": "brown-bread-047709",
  "wheat bread": "brown-bread-047709",

  "rice": "sona-masoori-rice-1kg",
  "sona masoori": "sona-masoori-rice-1kg",
  "sona masoori rice": "sona-masoori-rice-1kg",
  "white rice": "sona-masoori-rice-1kg",
  "basmati rice": "sona-masoori-rice-1kg",

  // Fruits
  "apple": "shimla-apples-859510",
  "apples": "shimla-apples-859510",
  "mango": "organic-mangoes-416380",
  "mangoes": "organic-mangoes-416380",
};

/**
 * Common culinary preparation descriptors stripped during secondary normalization.
 */
const COOKING_QUALIFIERS = new Set([
  "fresh",
  "dried",
  "dry",
  "grated",
  "shredded",
  "chopped",
  "diced",
  "minced",
  "crushed",
  "sliced",
  "leaves",
  "leaf",
  "clove",
  "cloves",
  "pinch",
  "extra",
  "virgin",
]);

/**
 * Normalizes an ingredient string by lowercasing, stripping punctuation, and trimming extra spaces.
 */
export function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Strips common preparation adjectives to isolate the core ingredient stem.
 */
export function stripCookingQualifiers(normalized: string): string {
  return normalized
    .split(" ")
    .filter((word) => !COOKING_QUALIFIERS.has(word))
    .join(" ")
    .trim();
}

/**
 * Parses numeric quantity and unit from a raw measurement string (e.g. "1 pound", "250g", "2 tbsp").
 * Fallback returns quantity 1 and original string as unit.
 */
export function parseMeasurement(rawMeasure?: string | null): { quantity: number; unit: string } {
  if (!rawMeasure || !rawMeasure.trim() || rawMeasure.trim().toLowerCase() === "null") {
    return { quantity: 1, unit: "as required" };
  }

  const clean = rawMeasure.trim();
  // Regex to extract initial number or fraction (e.g. "1/2", "1.5", "2", "2 1/2")
  const numMatch = clean.match(/^(\d+(?:\s+\d+\/\d+|\/\d+|\.\d+)?)\s*(.*)$/);

  if (numMatch) {
    let numStr = numMatch[1].trim();
    const unitStr = numMatch[2].trim();

    let qty = 1;
    if (numStr.includes(" ")) {
      const parts = numStr.split(/\s+/);
      const whole = parseFloat(parts[0]);
      if (parts[1].includes("/")) {
        const frac = parts[1].split("/");
        qty = whole + (parseFloat(frac[0]) / parseFloat(frac[1]));
      } else {
        qty = whole;
      }
    } else if (numStr.includes("/")) {
      const frac = numStr.split("/");
      qty = parseFloat(frac[0]) / parseFloat(frac[1]);
    } else {
      qty = parseFloat(numStr) || 1;
    }

    return {
      quantity: Math.round(qty * 100) / 100,
      unit: unitStr || "unit",
    };
  }

  return { quantity: 1, unit: clean };
}

/**
 * Attempts to match a raw ingredient name to an existing active grocery product in the database.
 * Confident matches are linked; unmatched ingredients safely return isMatched: false without fake data.
 */
export async function matchIngredientToProduct(rawName: string): Promise<MatchResult> {
  const normalized = normalizeIngredientName(rawName);

  if (!normalized) {
    return { productId: null, productName: null, isMatched: false, confidence: 0 };
  }

  // 1. Direct alias match
  const directSlug = ALIAS_TO_SLUG_MAP[normalized];
  if (directSlug) {
    const product = await prisma.product.findUnique({
      where: { slug: directSlug },
      select: { id: true, name: true, isActive: true },
    });
    if (product && product.isActive) {
      return { productId: product.id, productName: product.name, isMatched: true, confidence: 1.0 };
    }
  }

  // 2. Stripped qualifier stem match (e.g. "grated parmigiano reggiano" -> "parmigiano reggiano")
  const stem = stripCookingQualifiers(normalized);
  if (stem && stem !== normalized) {
    const stemSlug = ALIAS_TO_SLUG_MAP[stem];
    if (stemSlug) {
      const product = await prisma.product.findUnique({
        where: { slug: stemSlug },
        select: { id: true, name: true, isActive: true },
      });
      if (product && product.isActive) {
        return { productId: product.id, productName: product.name, isMatched: true, confidence: 0.95 };
      }
    }
  }

  // 3. Substring / Word-stem matching against alias map
  for (const [alias, slug] of Object.entries(ALIAS_TO_SLUG_MAP)) {
    if (normalized.includes(alias) || (stem && stem.includes(alias))) {
      const product = await prisma.product.findUnique({
        where: { slug },
        select: { id: true, name: true, isActive: true },
      });
      if (product && product.isActive) {
        return { productId: product.id, productName: product.name, isMatched: true, confidence: 0.85 };
      }
    }
  }

  // 4. Database direct product name search
  const directProduct = await prisma.product.findFirst({
    where: {
      isActive: true,
      OR: [
        { name: { equals: rawName.trim(), mode: "insensitive" } },
        { name: { contains: normalized, mode: "insensitive" } },
        ...(stem ? [{ name: { contains: stem, mode: "insensitive" as const } }] : []),
      ],
    },
    select: { id: true, name: true },
  });

  if (directProduct) {
    return {
      productId: directProduct.id,
      productName: directProduct.name,
      isMatched: true,
      confidence: 0.8,
    };
  }

  // Unmatched: returns null productId safely. No fake products created.
  return {
    productId: null,
    productName: null,
    isMatched: false,
    confidence: 0,
  };
}
