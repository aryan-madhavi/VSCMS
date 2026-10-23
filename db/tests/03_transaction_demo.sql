-- =============================================================================
-- Vehicle Service Center Management System (VSCMS)
-- Database Test Suite 03: ACID Transactions & Concurrency Demonstration
-- =============================================================================

USE `vscms_db`;

-- Note on MySQL InnoDB Transactions:
-- InnoDB provides full ACID compliance (Atomicity, Consistency, Isolation, Durability).
-- Autocommit is disabled during explicit START TRANSACTION / BEGIN blocks.
-- Important Viva Point: MySQL DDL commands (e.g. CREATE TABLE, ALTER TABLE) execute
-- implicit commits! Therefore, rollback tests must use DML operations (INSERT/UPDATE/DELETE).

SELECT '=== SCENARIO 1: Successful Multi-table Atomic Transaction [COMMIT] ===' AS test_banner;

START TRANSACTION;

-- 1. Create a new service booking for Vehicle 8 (Virtus)
INSERT INTO `Service_Booking` (`vehicle_id`, `booking_date`, `status`, `notes`)
VALUES (8, CURDATE(), 'In Progress', 'Brake inspection and engine oil top-up service package');

SET @new_booking_id = LAST_INSERT_ID();

-- 2. Add Service Detail line item under this booking
INSERT INTO `Service_Details` (`booking_id`, `service_type_id`, `mechanic_id`, `labor_cost`, `service_notes`, `status`)
VALUES (@new_booking_id, 1, 1, 1500.00, 'PMS oil change and safety inspection', 'In Progress');

SET @new_detail_id = LAST_INSERT_ID();

-- 3. Install 1 unit of Part 4 (Air Filter)
INSERT INTO `Parts_Used` (`service_detail_id`, `part_id`, `quantity`, `unit_price`)
VALUES (@new_detail_id, 4, 1, 650.00);

-- All operations succeeded with complete data integrity. Commit the transaction.
COMMIT;

-- Verification: The booking, detail, and parts usage records are permanently saved.
SELECT b.booking_id, b.status, sd.service_detail_id, sd.labor_cost, pu.part_id, pu.quantity
  FROM `Service_Booking` b
  JOIN `Service_Details` sd ON b.booking_id = sd.booking_id
  JOIN `Parts_Used` pu ON sd.service_detail_id = pu.service_detail_id
 WHERE b.booking_id = @new_booking_id;


SELECT '=== SCENARIO 2: Aborted Transaction Deliberate Rollback [ROLLBACK] ===' AS test_banner;

-- Step 2a: Check pre-transaction payment count for Invoice 3
SELECT COUNT(*) AS payments_before_transaction FROM `Payment` WHERE `invoice_id` = 3;

START TRANSACTION;

-- Record a payment attempt of 3000.00
INSERT INTO `Payment` (`invoice_id`, `payment_date`, `amount_paid`, `payment_method`, `transaction_reference`)
VALUES (3, CURDATE(), 3000.00, 'UPI', 'TXN-ROLLBACK-TEST-999');

-- Update invoice note / status temporarily
UPDATE `Invoice` SET `status` = 'Partially Paid' WHERE `invoice_id` = 3;

-- Simulate application-level business failure:
-- (e.g., Payment gateway reports customer card declined or user cancels transaction)
-- Explicitly ROLLBACK all pending changes in this transaction
ROLLBACK;

-- Verification: The payment was never committed, and invoice state is unchanged!
SELECT COUNT(*) AS payments_after_rollback FROM `Payment` WHERE `invoice_id` = 3;
SELECT invoice_id, status AS invoice_status_preserved FROM `Invoice` WHERE `invoice_id` = 3;


SELECT '=== SCENARIO 3: Cleanup of Demo Booking 8 ===' AS test_banner;
-- Cascade delete will remove the test booking and its child details and parts
DELETE FROM `Service_Booking` WHERE `booking_id` = @new_booking_id;
SELECT 'Cleanup completed successfully.' AS status;
