-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "cuisine" TEXT NOT NULL DEFAULT 'Indian';

-- CreateIndex
CREATE INDEX "recipes_cuisine_idx" ON "recipes"("cuisine");
