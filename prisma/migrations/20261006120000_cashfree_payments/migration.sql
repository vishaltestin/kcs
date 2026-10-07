-- ---------------------------------------------------------------------------
-- Cashfree online payments (online-only checkout).
--
-- Orders are now created UNPAID: stock is reserved and the invoice number
-- allocated only when the order flips to PAID (see confirmOrderPayment in
-- src/lib/order-payments.ts). Pre-existing rows keep working with
-- paymentStatus PENDING (historical/demo orders predate the gateway).
-- ---------------------------------------------------------------------------

ALTER TABLE `Order` ADD COLUMN `paymentMethod` VARCHAR(20) NOT NULL DEFAULT 'ONLINE';
ALTER TABLE `Order` ADD COLUMN `paymentStatus` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING';
ALTER TABLE `Order` ADD COLUMN `cashfreeOrderId` VARCHAR(64) NULL;
ALTER TABLE `Order` ADD COLUMN `cfPaymentId` VARCHAR(64) NULL;
ALTER TABLE `Order` ADD COLUMN `paidAt` DATETIME(3) NULL;
CREATE UNIQUE INDEX `Order_cashfreeOrderId_key` ON `Order`(`cashfreeOrderId`);
CREATE INDEX `Order_paymentStatus_idx` ON `Order`(`paymentStatus`);
