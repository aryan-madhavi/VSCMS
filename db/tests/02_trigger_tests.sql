-- =============================================================================
-- Vehicle Service Center Management System (VSCMS)
-- Database Test Suite 02: Trigger Verification & Stock Automation Tests
-- =============================================================================

USE `vscms_db`;

SELECT '=== TRIGGER TEST 1: Insufficient Stock Prevention [SHOULD FAIL] ===' AS test_banner;
-- Part 6 (Iridium Spark Plug) has stock = 2.
-- Attempting to request 10 units for Service_Detail 1.
-- Expected: Trigger raises SQLSTATE 45000: 'Insufficient stock for the requested spare part.'
INSERT INTO `Parts_Used` (`service_detail_id`, `part_id`, `quantity`, `unit_price`)
VALUES (1, 6, 10, 1800.00);


SELECT '=== TRIGGER TEST 2: Stock Deduction Verification [SHOULD SUCCEED] ===' AS test_banner;
-- Step 2a: Check initial stock for Part 1 (Engine Oil)
SELECT part_id, part_name, stock_quantity AS initial_oil_stock
  FROM `Spare_Parts`
 WHERE part_id = 1;

-- Step 2b: Install 2 liters of Part 1 in Service_Detail 2
INSERT INTO `Parts_Used` (`service_detail_id`, `part_id`, `quantity`, `unit_price`)
VALUES (2, 1, 2, 850.00);

-- Step 2c: Verify stock is automatically decremented by 2
SELECT part_id, part_name, stock_quantity AS stock_after_2_liters_used
  FROM `Spare_Parts`
 WHERE part_id = 1;


SELECT '=== TRIGGER TEST 3: Stock Restoration on Deletion [SHOULD SUCCEED] ===' AS test_banner;
-- Step 3a: Delete the test usage record created in Test 2
DELETE FROM `Parts_Used`
 WHERE `service_detail_id` = 2 AND `part_id` = 1 AND `quantity` = 2;

-- Step 3b: Verify stock is automatically restored to its original value
SELECT part_id, part_name, stock_quantity AS stock_after_deletion_restored
  FROM `Spare_Parts`
 WHERE part_id = 1;


SELECT '=== TRIGGER TEST 4: Stock Adjustment on Quantity Update [SHOULD SUCCEED] ===' AS test_banner;
-- Step 4a: Create a test usage record for Part 8 (Coolant) with quantity = 2
SELECT part_id, part_name, stock_quantity AS initial_coolant_stock
  FROM `Spare_Parts`
 WHERE part_id = 8;

INSERT INTO `Parts_Used` (`service_detail_id`, `part_id`, `quantity`, `unit_price`)
VALUES (2, 8, 2, 400.00);

SELECT part_id, stock_quantity AS stock_after_insert_2
  FROM `Spare_Parts`
 WHERE part_id = 8;

-- Step 4b: Update the usage quantity from 2 to 5 (increase of 3)
UPDATE `Parts_Used`
   SET `quantity` = 5
 WHERE `service_detail_id` = 2 AND `part_id` = 8;

-- Step 4c: Verify stock was deducted by the additional 3 units
SELECT part_id, stock_quantity AS stock_after_updating_to_5
  FROM `Spare_Parts`
 WHERE part_id = 8;

-- Clean up test record (restores stock by 5)
DELETE FROM `Parts_Used`
 WHERE `service_detail_id` = 2 AND `part_id` = 8;

SELECT part_id, stock_quantity AS stock_after_cleanup
  FROM `Spare_Parts`
 WHERE part_id = 8;


SELECT '=== TRIGGER TEST 5: Automatic Invoice Status Synchronization ===' AS test_banner;
-- Observe Invoice 3 currently has status 'Unpaid' and total_amount = 4720.00
SELECT invoice_id, total_amount, status AS initial_invoice_status
  FROM `Invoice`
 WHERE invoice_id = 3;

-- Make a partial payment of 2000.00
INSERT INTO `Payment` (`invoice_id`, `payment_date`, `amount_paid`, `payment_method`, `transaction_reference`)
VALUES (3, CURDATE(), 2000.00, 'UPI', 'TEST-UPI-PARTIAL-1');

-- Verify trigger automatically transitioned invoice status to 'Partially Paid'
SELECT invoice_id, total_amount, status AS status_after_partial_payment
  FROM `Invoice`
 WHERE invoice_id = 3;

-- Pay the remaining balance of 2720.00
INSERT INTO `Payment` (`invoice_id`, `payment_date`, `amount_paid`, `payment_method`, `transaction_reference`)
VALUES (3, CURDATE(), 2720.00, 'Cash', 'TEST-CASH-FINAL-2');

-- Verify trigger automatically transitioned invoice status to 'Paid'
SELECT invoice_id, total_amount, status AS status_after_full_payment
  FROM `Invoice`
 WHERE invoice_id = 3;

-- Clean up test payments for Invoice 3 so seed state is preserved
DELETE FROM `Payment` WHERE `transaction_reference` IN ('TEST-UPI-PARTIAL-1', 'TEST-CASH-FINAL-2');

-- Verify trigger reverted status back to 'Unpaid'
SELECT invoice_id, total_amount, status AS status_after_rollback_cleanup
  FROM `Invoice`
 WHERE invoice_id = 3;
