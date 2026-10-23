-- =============================================================================
-- Vehicle Service Center Management System (VSCMS)
-- Database Initialization Script 02: Foreign Keys & Integrity Constraints
-- =============================================================================

USE `vscms_db`;

-- =============================================================================
-- Foreign Key Constraints
-- Enforce referential integrity across the 10 domain entities.
-- =============================================================================

-- 1. Vehicle -> Customer
-- Prevents registering vehicles without a valid customer, and blocks
-- deletion of a customer while vehicles are registered to them.
ALTER TABLE `Vehicle`
  ADD CONSTRAINT `fk_vehicle_customer`
  FOREIGN KEY (`customer_id`) REFERENCES `Customer` (`customer_id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 2. Service_Booking -> Vehicle
-- Prevents booking a service for a non-existent vehicle, and prevents
-- deleting a vehicle that has existing service booking records.
ALTER TABLE `Service_Booking`
  ADD CONSTRAINT `fk_booking_vehicle`
  FOREIGN KEY (`vehicle_id`) REFERENCES `Vehicle` (`vehicle_id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3. Service_Details -> Service_Booking
-- Links service tasks directly to the parent booking.
-- Cascades on delete so removing a cancelled draft booking cleans up its line items.
ALTER TABLE `Service_Details`
  ADD CONSTRAINT `fk_service_details_booking`
  FOREIGN KEY (`booking_id`) REFERENCES `Service_Booking` (`booking_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Service_Details -> Service_Type
-- Prevents assigning a non-existent service type or deleting a catalog item
-- that has historical service records.
ALTER TABLE `Service_Details`
  ADD CONSTRAINT `fk_service_details_type`
  FOREIGN KEY (`service_type_id`) REFERENCES `Service_Type` (`service_type_id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5. Service_Details -> Mechanic
-- Prevents assigning an invalid mechanic ID or deleting a mechanic record
-- who has performed services in the center.
ALTER TABLE `Service_Details`
  ADD CONSTRAINT `fk_service_details_mechanic`
  FOREIGN KEY (`mechanic_id`) REFERENCES `Mechanic` (`mechanic_id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 6. Parts_Used -> Service_Details
-- Links parts installed during a specific service line item.
-- Cascades on delete so removing a service detail line removes associated part usage.
ALTER TABLE `Parts_Used`
  ADD CONSTRAINT `fk_parts_used_service_detail`
  FOREIGN KEY (`service_detail_id`) REFERENCES `Service_Details` (`service_detail_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 7. Parts_Used -> Spare_Parts
-- Prevents recording usage of a non-existent part or deleting a spare part
-- that appears in service history.
ALTER TABLE `Parts_Used`
  ADD CONSTRAINT `fk_parts_used_part`
  FOREIGN KEY (`part_id`) REFERENCES `Spare_Parts` (`part_id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 8. Invoice -> Service_Booking (1:1 Relationship)
-- Guarantees each booking can have at most one invoice (`booking_id` is UNIQUE).
-- Prevents orphan invoices without an authentic booking.
ALTER TABLE `Invoice`
  ADD CONSTRAINT `fk_invoice_booking`
  FOREIGN KEY (`booking_id`) REFERENCES `Service_Booking` (`booking_id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 9. Payment -> Invoice
-- Links customer payments directly to a verified invoice.
-- Prevents payments toward non-existent invoices and prevents deleting invoices
-- that have payment records attached.
ALTER TABLE `Payment`
  ADD CONSTRAINT `fk_payment_invoice`
  FOREIGN KEY (`invoice_id`) REFERENCES `Invoice` (`invoice_id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;


-- =============================================================================
-- Check Constraints (Business Rules & Domain Integrity)
-- Enforced natively in MySQL 8.0.16+
-- =============================================================================

-- Vehicle manufacturing year must be within realistic automobile boundaries
ALTER TABLE `Vehicle`
  ADD CONSTRAINT `chk_vehicle_year`
  CHECK (`year` >= 1970 AND `year` <= 2100);

-- Service Type base cost cannot be negative
ALTER TABLE `Service_Type`
  ADD CONSTRAINT `chk_service_type_base_cost`
  CHECK (`base_cost` >= 0.00);

-- Labor cost assigned to a service task cannot be negative
ALTER TABLE `Service_Details`
  ADD CONSTRAINT `chk_service_details_labor_cost`
  CHECK (`labor_cost` >= 0.00);

-- Spare parts prices and stock levels must be non-negative
ALTER TABLE `Spare_Parts`
  ADD CONSTRAINT `chk_spare_parts_price`
  CHECK (`unit_price` >= 0.00),
  ADD CONSTRAINT `chk_spare_parts_stock`
  CHECK (`stock_quantity` >= 0),
  ADD CONSTRAINT `chk_spare_parts_reorder`
  CHECK (`reorder_level` >= 0);

-- Parts used quantity must be strictly positive (> 0)
ALTER TABLE `Parts_Used`
  ADD CONSTRAINT `chk_parts_used_quantity`
  CHECK (`quantity` > 0),
  ADD CONSTRAINT `chk_parts_used_price`
  CHECK (`unit_price` >= 0.00);

-- Invoice monetary values cannot be negative
ALTER TABLE `Invoice`
  ADD CONSTRAINT `chk_invoice_labor`
  CHECK (`labor_amount` >= 0.00),
  ADD CONSTRAINT `chk_invoice_parts`
  CHECK (`parts_amount` >= 0.00),
  ADD CONSTRAINT `chk_invoice_tax`
  CHECK (`tax_amount` >= 0.00),
  ADD CONSTRAINT `chk_invoice_total`
  CHECK (`total_amount` >= 0.00);

-- Payments must be strictly positive amounts (> 0.00)
ALTER TABLE `Payment`
  ADD CONSTRAINT `chk_payment_amount`
  CHECK (`amount_paid` > 0.00);
