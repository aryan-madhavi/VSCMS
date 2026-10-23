-- =============================================================================
-- Vehicle Service Center Management System (VSCMS)
-- Database Initialization Script 05: Seed Data
-- =============================================================================

USE `vscms_db`;

-- Disable foreign key checks during batch initial population
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE `Payment`;
TRUNCATE TABLE `Invoice`;
TRUNCATE TABLE `Parts_Used`;
TRUNCATE TABLE `Spare_Parts`;
TRUNCATE TABLE `Service_Details`;
TRUNCATE TABLE `Service_Type`;
TRUNCATE TABLE `Mechanic`;
TRUNCATE TABLE `Service_Booking`;
TRUNCATE TABLE `Vehicle`;
TRUNCATE TABLE `Customer`;
TRUNCATE TABLE `Users`;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 1. Seed Users (Argon2id Hashes)
-- Passwords:
--   admin  -> Admin@123
--   staff1 -> Staff@123
--   staff2 -> Staff@123
-- =============================================================================
INSERT INTO `Users` (`user_id`, `username`, `email`, `password_hash`, `full_name`, `role`, `is_active`) VALUES
(1, 'admin', 'admin@vscms.local', '$argon2id$v=19$m=65536,t=3,p=4$Jq/W9OapymyB4R4Ov0Ru5Q$YEjKcR9JOGu/s3E+5nBGQCktvCfe0bppQ7pLW3JLni0', 'System Administrator', 'Administrator', TRUE),
(2, 'staff1', 'staff1@vscms.local', '$argon2id$v=19$m=65536,t=3,p=4$1iDNzaE6gDcRcQLGqodW9g$jVB7QbyM86U4JIKj2e1K+jKfhQVFoxrdXe+LLkW1foE', 'Rajesh Mehta (Service Advisor)', 'Staff', TRUE),
(3, 'staff2', 'staff2@vscms.local', '$argon2id$v=19$m=65536,t=3,p=4$1iDNzaE6gDcRcQLGqodW9g$jVB7QbyM86U4JIKj2e1K+jKfhQVFoxrdXe+LLkW1foE', 'Sunita Rao (Front Desk)', 'Staff', TRUE);

-- =============================================================================
-- 2. Seed Customers
-- =============================================================================
INSERT INTO `Customer` (`customer_id`, `first_name`, `last_name`, `email`, `phone`, `address`) VALUES
(1, 'Vikram', 'Sharma', 'vikram.sharma@gmail.com', '+91-9820112233', '402 Palm Heights, Andheri West, Mumbai'),
(2, 'Ananya', 'Deshmukh', 'ananya.d@yahoo.com', '+91-9820223344', '15 Lake View Apts, Powai, Mumbai'),
(3, 'Rohan', 'Gupta', 'rohan.gupta@outlook.com', '+91-9820334455', '7B Green Park, Bandra West, Mumbai'),
(4, 'Meera', 'Iyer', 'meera.iyer@gmail.com', '+91-9820445566', '104 Shanti Nagar, Vile Parle, Mumbai'),
(5, 'Sameer', 'Kulkarni', 'sameer.k@rediffmail.com', '+91-9820556677', '88 Shivaji Park, Dadar, Mumbai'),
(6, 'Neha', 'Kapoor', 'neha.kapoor@gmail.com', '+91-9820667788', '203 Sea Breeze, Worli, Mumbai');

-- =============================================================================
-- 3. Seed Vehicles
-- =============================================================================
INSERT INTO `Vehicle` (`vehicle_id`, `customer_id`, `registration_number`, `make`, `model`, `year`, `color`) VALUES
(1, 1, 'MH-02-AB-1234', 'Honda', 'Civic', 2021, 'Metallic Silver'),
(2, 1, 'MH-02-CD-5678', 'Hyundai', 'Creta', 2023, 'Polar White'),
(3, 2, 'MH-03-EF-9012', 'Maruti Suzuki', 'Swift', 2020, 'Fire Red'),
(4, 3, 'MH-01-GH-3456', 'Toyota', 'Corolla Altis', 2019, 'Phantom Black'),
(5, 4, 'MH-04-IJ-7890', 'Tata', 'Nexon EV', 2022, 'Tropical Mist'),
(6, 5, 'MH-02-KL-2345', 'Mahindra', 'XUV700', 2023, 'Midnight Blue'),
(7, 6, 'MH-01-MN-6789', 'Kia', 'Seltos', 2021, 'Gravity Grey'),
(8, 3, 'MH-03-OP-4321', 'Volkswagen', 'Virtus', 2022, 'Wild Cherry Red');

-- =============================================================================
-- 4. Seed Mechanics
-- =============================================================================
INSERT INTO `Mechanic` (`mechanic_id`, `name`, `phone`, `email`, `specialization`, `is_active`) VALUES
(1, 'Arun Kumar', '+91-9811122233', 'arun.k@vscms.local', 'Engine Specialist & Powertrain', TRUE),
(2, 'Rajesh Sharma', '+91-9811133344', 'rajesh.s@vscms.local', 'Brake Systems & Hydraulics', TRUE),
(3, 'Priya Verma', '+91-9811144455', 'priya.v@vscms.local', 'Electrical Systems & Diagnostics', TRUE),
(4, 'Suresh Nair', '+91-9811155566', 'suresh.n@vscms.local', 'Suspension & Wheel Alignment', TRUE),
(5, 'Deepa Patil', '+91-9811166677', 'deepa.p@vscms.local', 'Transmission & AC Systems', TRUE);

-- =============================================================================
-- 5. Seed Service Types
-- =============================================================================
INSERT INTO `Service_Type` (`service_type_id`, `type_name`, `description`, `base_cost`) VALUES
(1, 'Periodic Maintenance Service', 'Comprehensive multi-point inspection, synthetic oil change, filter replacements', 1500.00),
(2, 'Brake Overhaul & Pad Replacement', 'Inspection of calipers, front and rear pad replacement, rotor skimming', 1800.00),
(3, 'Engine Diagnostics & Tune-up', 'OBD-II electronic sensor scan, spark plug inspection, throttle body cleaning', 2200.00),
(4, 'AC System Service & Gas Recharge', 'Compressor health check, evaporator coil chemical wash, R134a refrigerant recharge', 2500.00),
(5, 'Suspension & Steering Overhaul', 'Lower arm bushing replacement, strut check, computerized 3D wheel alignment', 2000.00),
(6, 'Transmission Fluid Flush', 'Complete automatic transmission fluid flush using synthetic ATF and gasket renewal', 1600.00);

-- =============================================================================
-- 6. Seed Spare Parts
-- Note: Initial stock values account for trigger deductions during seed execution.
-- Low stock and zero stock items are intentionally populated for alert demonstrations.
-- =============================================================================
INSERT INTO `Spare_Parts` (`part_id`, `part_name`, `part_number`, `unit_price`, `stock_quantity`, `reorder_level`) VALUES
(1, 'Synthetic Engine Oil 5W-30 (1L)', 'OIL-5W30', 850.00, 64, 20),
(2, 'Premium Spin-on Oil Filter', 'OF-101', 450.00, 26, 10),
(3, 'Ceramic Front Brake Pad Set', 'BP-FR-202', 2200.00, 19, 8),
(4, 'High-Flow Engine Air Filter', 'AF-303', 650.00, 16, 8),
(5, 'Cabin AC Pollen Filter', 'CF-404', 750.00, 3, 5),     -- Low Stock Alert (3 <= 5)
(6, 'Iridium Spark Plug (Set of 4)', 'SP-505', 1800.00, 2, 6),  -- Critical Alert (2 <= 6)
(7, 'Brake Fluid DOT 4 (500ml)', 'BF-DOT4', 320.00, 0, 5),      -- Out of Stock (0 <= 5)
(8, 'Long-Life Coolant Premix (1L)', 'CL-606', 400.00, 30, 10);

-- =============================================================================
-- 7. Seed Service Bookings
-- Varied lifecycle states: Completed, In Progress, Pending
-- =============================================================================
INSERT INTO `Service_Booking` (`booking_id`, `vehicle_id`, `booking_date`, `status`, `notes`) VALUES
(1, 1, '2026-10-10', 'Completed', '30,000 km regular service schedule and brake inspection requested'),
(2, 3, '2026-10-12', 'Completed', 'AC cooling insufficient on warm afternoons; check cabin blower'),
(3, 4, '2026-10-14', 'Completed', 'Squeaking metallic noise during braking at low speeds'),
(4, 2, '2026-10-18', 'In Progress', 'Check engine warning lamp illuminated; engine feels hesitant'),
(5, 5, '2026-10-19', 'In Progress', 'High speed steering wheel wobble at 80-90 km/h; check alignment'),
(6, 6, '2026-10-21', 'Pending', '10,000 km first major paid periodic maintenance appointment'),
(7, 7, '2026-10-22', 'Pending', 'Brake pedal travel feels spongy; inspect master cylinder fluid level');

-- =============================================================================
-- 8. Seed Service Details
-- Line items under bookings assigned to mechanics
-- =============================================================================
INSERT INTO `Service_Details` (`service_detail_id`, `booking_id`, `service_type_id`, `mechanic_id`, `labor_cost`, `service_notes`, `status`) VALUES
-- Booking 1 (Completed)
(1, 1, 1, 1, 1500.00, 'Periodic maintenance completed: oil drained, new filter installed, 40-point checklist clear', 'Completed'),
(2, 1, 2, 2, 1800.00, 'Front brake calipers cleaned and pins greased; pads cleaned and reinstalled', 'Completed'),
-- Booking 2 (Completed)
(3, 2, 4, 5, 2500.00, 'AC system evacuated and recharged with 450g R134a refrigerant; vent temp down to 6C', 'Completed'),
-- Booking 3 (Completed)
(4, 3, 2, 2, 1800.00, 'Replaced severely worn front brake pad set with new ceramic pads; rotors skimmed', 'Completed'),
-- Booking 4 (In Progress)
(5, 4, 3, 1, 2200.00, 'DTC code P0301 cylinder 1 misfire diagnosed; checking ignition coil and spark plugs', 'In Progress'),
-- Booking 5 (In Progress)
(6, 5, 5, 4, 2000.00, 'Front left lower arm tie rod end play identified; currently replacing bushings', 'In Progress');

-- =============================================================================
-- 9. Seed Parts Used
-- Insertion automatically invokes `trg_parts_used_after_insert` to decrement stock!
-- =============================================================================
INSERT INTO `Parts_Used` (`usage_id`, `service_detail_id`, `part_id`, `quantity`, `unit_price`) VALUES
-- Booking 1 PMS line item (Detail 1): uses 4L oil, 1 oil filter, 1 air filter
(1, 1, 1, 4, 850.00),  -- Stock 64 -> 60
(2, 1, 2, 1, 450.00),  -- Stock 26 -> 25
(3, 1, 4, 1, 650.00),  -- Stock 16 -> 15
-- Booking 3 Brake line item (Detail 4): uses 1 set front brake pads
(4, 4, 3, 1, 2200.00); -- Stock 19 -> 18

-- =============================================================================
-- 10. Seed Invoices
-- Invoices generated for completed bookings with explicit line item totals
-- =============================================================================
INSERT INTO `Invoice` (`invoice_id`, `booking_id`, `invoice_date`, `labor_amount`, `parts_amount`, `tax_amount`, `total_amount`, `status`) VALUES
-- Booking 1: Labor (1500 + 1800 = 3300) + Parts (3400 + 450 + 650 = 4500) = 7800. Tax 18% = 1404. Total = 9204
(1, 1, '2026-10-10', 3300.00, 4500.00, 1404.00, 9204.00, 'Unpaid'),
-- Booking 2: Labor 2500 + Parts 0 = 2500. Tax 18% = 450. Total = 2950
(2, 2, '2026-10-12', 2500.00, 0.00, 450.00, 2950.00, 'Unpaid'),
-- Booking 3: Labor 1800 + Parts 2200 = 4000. Tax 18% = 720. Total = 4720
(3, 3, '2026-10-14', 1800.00, 2200.00, 720.00, 4720.00, 'Unpaid');

-- =============================================================================
-- 11. Seed Payments
-- Insertion invokes `trg_payment_after_insert` to synchronize invoice statuses!
-- =============================================================================
-- Invoice 1: Full single payment -> becomes 'Paid'
INSERT INTO `Payment` (`payment_id`, `invoice_id`, `payment_date`, `amount_paid`, `payment_method`, `transaction_reference`) VALUES
(1, 1, '2026-10-11', 9204.00, 'UPI', 'UPI/261011/982011492');

-- Invoice 2: Two partial payments (1000 + 500 = 1500 of 2950) -> becomes 'Partially Paid'
INSERT INTO `Payment` (`payment_id`, `invoice_id`, `payment_date`, `amount_paid`, `payment_method`, `transaction_reference`) VALUES
(2, 2, '2026-10-13', 1000.00, 'Cash', 'RCPT-2026-0042'),
(3, 2, '2026-10-15', 500.00, 'Debit Card', 'POS-TXN-88129-A');

-- Invoice 3: No payments made -> remains 'Unpaid' (Full balance 4720.00 due)
