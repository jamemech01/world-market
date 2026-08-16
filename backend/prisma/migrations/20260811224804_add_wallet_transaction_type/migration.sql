-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM (
  'topup',
  'hold',
  'refund',
  'sale'
);

-- AlterTable
ALTER TABLE "WalletTransaction"
DROP COLUMN "type",
ADD COLUMN "type" "WalletTransactionType" NOT NULL;