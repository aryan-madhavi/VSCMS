-- =============================================================================
-- Vehicle Service Center Management System (VSCMS)
-- Database Test Suite 01: Referential Integrity & Constraint Tests
-- Instructions: Run each block in a MySQL client or script runner.
-- Statements marked [SHOULD FAIL] are expected to produce error codes.
-- Statements marked [SHOULD SUCCEED] must complete cleanly.
-- =============================================================================

USE `vscms_db`;

SELECT '=== TEST 1: Unique Constraint on Vehicle Registration Number ===' AS test_banner;
-- [SHOULD FAIL: Error 1062 - Duplicate entry 'MH-02-AB-1234' for key 'registration_number']
-- Description: Attempting to insert a second vehicle with an already registered license plate.
-- Reason: Registration numbers must uniquely identify physical motor vehicles.
INSERT INTO `Vehicle` (`customer_id`, `registration_number`, `make`, `model`, `year`, `color`)
VALUES (2, 'MH-02-AB-1234', 'Hyundai', 'i20', 2022, 'Black');

SELECT '=== TEST 2: Foreign Key Constraint on Vehicle -> Customer ===' AS test_banner;
-- [SHOULD FAIL: Error 1452 - Cannot add or update a child row: a foreign key constraint fails]
-- Description: Registering a vehicle linked to non-existent customer_id = 99999.
-- Reason: Referential integrity prevents orphaned vehicle records without an owner.
INSERT INTO `Vehicle` (`customer_id`, `registration_number`, `make`, `model`, `year`, `color`)
VALUES (99999, 'MH-04-ZZ-9999', 'Skoda', 'Slavia', 2023, 'White');

SELECT '=== TEST 3: Foreign Key Restrict on Customer Deletion ===' AS test_banner;
-- [SHOULD FAIL: Error 1451 - Cannot delete or update a parent row: a foreign key constraint fails]
-- Description: Attempting to delete Customer 1 who currently has registered vehicles.
-- Reason: ON DELETE RESTRICT prevents accidental deletion of active customer profiles.
DELETE FROM `Customer` WHERE `customer_id` = 1;

SELECT '=== TEST 4: Check Constraint on Vehicle Manufacturing Year ===' AS test_banner;
-- [SHOULD FAIL: Error 3819 - Check constraint 'chk_vehicle_year' is violated]
-- Description: Registering a vehicle with year 1850 (before modern automobile standards).
INSERT INTO `Vehicle` (`customer_id`, `registration_number`, `make`, `model`, `year`, `color`)
VALUES (1, 'MH-02-XX-0001', 'Ford', 'Model T', 1850, 'Black');

SELECT '=== TEST 5: Check Constraint on Parts Used Quantity ===' AS test_banner;
-- [SHOULD FAIL: Error 3819 or Trigger Error 45000 - Quantity must be strictly positive]
-- Description: Attempting to log 0 quantity of parts used in a service.
INSERT INTO `Parts_Used` (`service_detail_id`, `part_id`, `quantity`, `unit_price`)
VALUES (1, 1, 0, 850.00);

SELECT '=== TEST 6: Check Constraint on Payment Amount ===' AS test_banner;
-- [SHOULD FAIL: Error 3819 - Check constraint 'chk_payment_amount' is violated]
-- Description: Attempting to record a negative payment amount of -500.00.
INSERT INTO `Payment` (`invoice_id`, `payment_date`, `amount_paid`, `payment_method`)
VALUES (1, CURDATE(), -500.00, 'Cash');

SELECT '=== TEST 7: 1:1 Unique Constraint on Invoice Booking ID ===' AS test_banner;
-- [SHOULD FAIL: Error 1062 - Duplicate entry '1' for key 'booking_id']
-- Description: Attempting to generate a second invoice for Booking 1 which already has Invoice 1.
-- Reason: Prevents duplicate billing for a single service visit.
INSERT INTO `Invoice` (`booking_id`, `invoice_date`, `labor_amount`, `parts_amount`, `tax_amount`, `total_amount`, `status`)
VALUES (1, CURDATE(), 1000.00, 500.00, 270.00, 1770.00, 'Unpaid');

SELECT '=== TEST 8: Valid Child Insert [SHOULD SUCCEED] ===' AS test_banner;
-- Registering a new valid vehicle for Customer 2 with unique registration plate.
INSERT INTO `Vehicle` (`customer_id`, `registration_number`, `make`, `model`, `year`, `color`)
VALUES (2, 'MH-03-TEST-77', 'Honda', 'Elevate', 2024, 'Pearl White');

-- Verify record was successfully added
SELECT * FROM `Vehicle` WHERE `registration_number` = 'MH-03-TEST-77';

-- Clean up test record to maintain clean test state
DELETE FROM `Vehicle` WHERE `registration_number` = 'MH-03-TEST-77';
