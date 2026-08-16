-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_shopId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";


-- Allow Order.shopId to become NULL
ALTER TABLE "Order"
ALTER COLUMN "shopId" DROP NOT NULL;


-- Add productName temporarily as nullable
ALTER TABLE "OrderItem"
ADD COLUMN "productName" TEXT;


-- Copy product name from existing Product records
UPDATE "OrderItem" oi
SET "productName" = p."name"
FROM "Product" p
WHERE oi."productId" = p."id";


-- Make sure every existing OrderItem has a productName
UPDATE "OrderItem"
SET "productName" = 'Unknown Product'
WHERE "productName" IS NULL;


-- Now make productName required
ALTER TABLE "OrderItem"
ALTER COLUMN "productName" SET NOT NULL;


-- Allow productId to become NULL
ALTER TABLE "OrderItem"
ALTER COLUMN "productId" DROP NOT NULL;


-- Restore foreign keys with SET NULL
ALTER TABLE "Order"
ADD CONSTRAINT "Order_shopId_fkey"
FOREIGN KEY ("shopId")
REFERENCES "Shop"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;


ALTER TABLE "OrderItem"
ADD CONSTRAINT "OrderItem_productId_fkey"
FOREIGN KEY ("productId")
REFERENCES "Product"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;