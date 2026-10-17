-- DropForeignKey
ALTER TABLE "recipe_ingredients" DROP CONSTRAINT "recipe_ingredients_productId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "recipe_ingredients_recipeId_productId_key";

-- AlterTable
ALTER TABLE "recipe_ingredients" ADD COLUMN IF NOT EXISTS "ingredientName" TEXT,
ADD COLUMN IF NOT EXISTS "rawMeasure" TEXT,
ALTER COLUMN "productId" DROP NOT NULL,
ALTER COLUMN "quantity" SET DEFAULT 0,
ALTER COLUMN "unit" SET DEFAULT '';

-- AlterTable
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "externalId" TEXT,
ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'SYSTEM';

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "recipes_externalId_key" ON "recipes"("externalId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "recipes_externalId_idx" ON "recipes"("externalId");

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill existing recipe ingredients with the product name as ingredientName
UPDATE "recipe_ingredients" ri
SET "ingredientName" = p."name"
FROM "products" p
WHERE ri."productId" = p."id" AND ri."ingredientName" IS NULL;
