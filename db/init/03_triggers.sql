-- =============================================================================
-- Vehicle Service Center Management System (VSCMS)
-- Database Initialization Script 03: Automated Triggers
-- =============================================================================

USE `vscms_db`;

DELIMITER $$

-- =============================================================================
-- TRIGGER 1: trg_parts_used_before_insert
-- Purpose:
--   1. Validates that the requested quantity is strictly positive.
--   2. Verifies the spare part exists and has sufficient inventory.
--   3. Automatically snapshots the catalog unit_price if omitted/zero.
-- =============================================================================
DROP TRIGGER IF EXISTS `trg_parts_used_before_insert`$$
CREATE TRIGGER `trg_parts_used_before_insert`
BEFORE INSERT ON `Parts_Used`
FOR EACH ROW
BEGIN
    DECLARE v_stock INT;
    DECLARE v_catalog_price DECIMAL(10, 2);

    IF NEW.quantity <= 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Part quantity must be strictly greater than zero.';
    END IF;

    -- Retrieve current inventory stock and catalog price
    SELECT stock_quantity, unit_price
      INTO v_stock, v_catalog_price
      FROM `Spare_Parts`
     WHERE `part_id` = NEW.part_id;

    IF v_stock IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Referenced spare part does not exist in inventory.';
    END IF;

    IF v_stock < NEW.quantity THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Insufficient stock for the requested spare part.';
    END IF;

    -- Snapshot catalog price if not explicitly provided
    IF NEW.unit_price IS NULL OR NEW.unit_price = 0.00 THEN
        SET NEW.unit_price = v_catalog_price;
    END IF;
END$$

-- =============================================================================
-- TRIGGER 2: trg_parts_used_after_insert
-- Purpose:
--   Atomically deducts the installed part quantity from inventory stock.
-- =============================================================================
DROP TRIGGER IF EXISTS `trg_parts_used_after_insert`$$
CREATE TRIGGER `trg_parts_used_after_insert`
AFTER INSERT ON `Parts_Used`
FOR EACH ROW
BEGIN
    UPDATE `Spare_Parts`
       SET `stock_quantity` = `stock_quantity` - NEW.quantity
     WHERE `part_id` = NEW.part_id;
END$$

-- =============================================================================
-- TRIGGER 3: trg_parts_used_after_delete
-- Purpose:
--   Atomically restores the removed part quantity back to inventory stock.
-- =============================================================================
DROP TRIGGER IF EXISTS `trg_parts_used_after_delete`$$
CREATE TRIGGER `trg_parts_used_after_delete`
AFTER DELETE ON `Parts_Used`
FOR EACH ROW
BEGIN
    UPDATE `Spare_Parts`
       SET `stock_quantity` = `stock_quantity` + OLD.quantity
     WHERE `part_id` = OLD.part_id;
END$$

-- =============================================================================
-- TRIGGER 4: trg_parts_used_before_update
-- Purpose:
--   Validates stock availability when a parts usage record is modified.
-- =============================================================================
DROP TRIGGER IF EXISTS `trg_parts_used_before_update`$$
CREATE TRIGGER `trg_parts_used_before_update`
BEFORE UPDATE ON `Parts_Used`
FOR EACH ROW
BEGIN
    DECLARE v_stock INT;
    DECLARE v_catalog_price DECIMAL(10, 2);

    IF NEW.quantity <= 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Part quantity must be strictly greater than zero.';
    END IF;

    IF NEW.part_id = OLD.part_id THEN
        -- Same part: check additional quantity requested
        IF NEW.quantity > OLD.quantity THEN
            SELECT stock_quantity INTO v_stock
              FROM `Spare_Parts`
             WHERE `part_id` = NEW.part_id;

            IF v_stock < (NEW.quantity - OLD.quantity) THEN
                SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Insufficient additional stock for part quantity update.';
            END IF;
        END IF;
    ELSE
        -- Different part selected: verify full new stock availability
        SELECT stock_quantity, unit_price
          INTO v_stock, v_catalog_price
          FROM `Spare_Parts`
         WHERE `part_id` = NEW.part_id;

        IF v_stock IS NULL THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'New spare part does not exist in inventory.';
        END IF;

        IF v_stock < NEW.quantity THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Insufficient stock for new spare part.';
        END IF;

        IF NEW.unit_price IS NULL OR NEW.unit_price = 0.00 THEN
            SET NEW.unit_price = v_catalog_price;
        END IF;
    END IF;
END$$

-- =============================================================================
-- TRIGGER 5: trg_parts_used_after_update
-- Purpose:
--   Accurately adjusts inventory stock when usage records are modified.
-- =============================================================================
DROP TRIGGER IF EXISTS `trg_parts_used_after_update`$$
CREATE TRIGGER `trg_parts_used_after_update`
AFTER UPDATE ON `Parts_Used`
FOR EACH ROW
BEGIN
    IF NEW.part_id = OLD.part_id THEN
        -- Adjust net difference: (NEW - OLD)
        UPDATE `Spare_Parts`
           SET `stock_quantity` = `stock_quantity` - (NEW.quantity - OLD.quantity)
         WHERE `part_id` = NEW.part_id;
    ELSE
        -- Part was switched: restore old part stock, deduct from new part stock
        UPDATE `Spare_Parts`
           SET `stock_quantity` = `stock_quantity` + OLD.quantity
         WHERE `part_id` = OLD.part_id;

        UPDATE `Spare_Parts`
           SET `stock_quantity` = `stock_quantity` - NEW.quantity
         WHERE `part_id` = NEW.part_id;
    END IF;
END$$

-- =============================================================================
-- TRIGGER 6: trg_payment_after_insert
-- Purpose:
--   Synchronizes the invoice payment status ('Unpaid', 'Partially Paid', 'Paid')
--   automatically whenever a payment is registered.
-- =============================================================================
DROP TRIGGER IF EXISTS `trg_payment_after_insert`$$
CREATE TRIGGER `trg_payment_after_insert`
AFTER INSERT ON `Payment`
FOR EACH ROW
BEGIN
    DECLARE v_total_paid DECIMAL(10, 2);
    DECLARE v_total_amount DECIMAL(10, 2);

    SELECT COALESCE(SUM(amount_paid), 0.00)
      INTO v_total_paid
      FROM `Payment`
     WHERE `invoice_id` = NEW.invoice_id;

    SELECT total_amount
      INTO v_total_amount
      FROM `Invoice`
     WHERE `invoice_id` = NEW.invoice_id;

    IF v_total_paid >= v_total_amount THEN
        UPDATE `Invoice` SET `status` = 'Paid' WHERE `invoice_id` = NEW.invoice_id;
    ELSEIF v_total_paid > 0.00 THEN
        UPDATE `Invoice` SET `status` = 'Partially Paid' WHERE `invoice_id` = NEW.invoice_id;
    ELSE
        UPDATE `Invoice` SET `status` = 'Unpaid' WHERE `invoice_id` = NEW.invoice_id;
    END IF;
END$$

-- =============================================================================
-- TRIGGER 7: trg_payment_after_delete
-- Purpose:
--   Recalculates invoice payment status if a payment record is voided or deleted.
-- =============================================================================
DROP TRIGGER IF EXISTS `trg_payment_after_delete`$$
CREATE TRIGGER `trg_payment_after_delete`
AFTER DELETE ON `Payment`
FOR EACH ROW
BEGIN
    DECLARE v_total_paid DECIMAL(10, 2);
    DECLARE v_total_amount DECIMAL(10, 2);

    SELECT COALESCE(SUM(amount_paid), 0.00)
      INTO v_total_paid
      FROM `Payment`
     WHERE `invoice_id` = OLD.invoice_id;

    SELECT total_amount
      INTO v_total_amount
      FROM `Invoice`
     WHERE `invoice_id` = OLD.invoice_id;

    IF v_total_paid >= v_total_amount THEN
        UPDATE `Invoice` SET `status` = 'Paid' WHERE `invoice_id` = OLD.invoice_id;
    ELSEIF v_total_paid > 0.00 THEN
        UPDATE `Invoice` SET `status` = 'Partially Paid' WHERE `invoice_id` = OLD.invoice_id;
    ELSE
        UPDATE `Invoice` SET `status` = 'Unpaid' WHERE `invoice_id` = OLD.invoice_id;
    END IF;
END$$

DELIMITER ;
