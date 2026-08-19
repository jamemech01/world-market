/*
  Warnings:

  - The values [hold] on the enum `WalletTransactionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "WalletTransactionType_new" AS ENUM ('topup', 'refund', 'sale');
ALTER TABLE "WalletTransaction" ALTER COLUMN "type" TYPE "WalletTransactionType_new" USING ("type"::text::"WalletTransactionType_new");
ALTER TYPE "WalletTransactionType" RENAME TO "WalletTransactionType_old";
ALTER TYPE "WalletTransactionType_new" RENAME TO "WalletTransactionType";
DROP TYPE "public"."WalletTransactionType_old";
COMMIT;

-- AlterTable
ALTER TABLE "WalletTransaction" ADD COLUMN     "orderId" INTEGER;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
