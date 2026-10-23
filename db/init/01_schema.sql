-- =============================================================================
-- Vehicle Service Center Management System (VSCMS)
-- Database Initialization Script 01: Core Schema Definition
-- Engine: MySQL 8.x InnoDB
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `vscms_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `vscms_db`;

-- Drop existing tables in reverse dependency order for safe re-runs
DROP TABLE IF EXISTS `Payment`;
DROP TABLE IF EXISTS `Invoice`;
DROP TABLE IF EXISTS `Parts_Used`;
DROP TABLE IF EXISTS `Spare_Parts`;
DROP TABLE IF EXISTS `Service_Details`;
DROP TABLE IF EXISTS `Service_Type`;
DROP TABLE IF EXISTS `Mechanic`;
DROP TABLE IF EXISTS `Service_Booking`;
DROP TABLE IF EXISTS `Vehicle`;
DROP TABLE IF EXISTS `Customer`;
DROP TABLE IF EXISTS `Users`;

-- =============================================================================
-- 1. Authentication Table: Users
-- Stored separately from domain entities as per project architectural spec.
-- Roles: 'Administrator', 'Staff'
-- =============================================================================
CREATE TABLE `Users` (
    `user_id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `role` ENUM('Administrator', 'Staff') NOT NULL DEFAULT 'Staff',
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_username` (`username`),
    INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 2. Domain Entity: Customer
-- Stores vehicle owner demographic and contact information.
-- =============================================================================
CREATE TABLE `Customer` (
    `customer_id` INT AUTO_INCREMENT PRIMARY KEY,
    `first_name` VARCHAR(50) NOT NULL,
    `last_name` VARCHAR(50) NOT NULL,
    `email` VARCHAR(100) UNIQUE,
    `phone` VARCHAR(20) NOT NULL,
    `address` VARCHAR(255),
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_customer_phone` (`phone`),
    INDEX `idx_customer_name` (`last_name`, `first_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. Domain Entity: Vehicle
-- Vehicles owned by customers. Relationship: Customer -> Vehicle (1:N)
-- =============================================================================
CREATE TABLE `Vehicle` (
    `vehicle_id` INT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` INT NOT NULL,
    `registration_number` VARCHAR(20) NOT NULL UNIQUE,
    `make` VARCHAR(50) NOT NULL,
    `model` VARCHAR(50) NOT NULL,
    `year` INT NOT NULL,
    `color` VARCHAR(30),
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_vehicle_reg` (`registration_number`),
    INDEX `idx_vehicle_customer` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. Domain Entity: Mechanic
-- Service center technician details and primary technical specialization.
-- =============================================================================
CREATE TABLE `Mechanic` (
    `mechanic_id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(100),
    `specialization` VARCHAR(100) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_mechanic_active` (`is_active`),
    INDEX `idx_mechanic_spec` (`specialization`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 5. Domain Entity: Service_Type
-- Standard service catalog items with default base labor costs.
-- =============================================================================
CREATE TABLE `Service_Type` (
    `service_type_id` INT AUTO_INCREMENT PRIMARY KEY,
    `type_name` VARCHAR(100) NOT NULL UNIQUE,
    `description` TEXT,
    `base_cost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_service_type_name` (`type_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 6. Domain Entity: Service_Booking
-- Customer service appointments for a vehicle. Relationship: Vehicle -> Service_Booking (1:N)
-- Status transitions: 'Pending' -> 'In Progress' -> 'Completed' (or 'Cancelled')
-- =============================================================================
CREATE TABLE `Service_Booking` (
    `booking_id` INT AUTO_INCREMENT PRIMARY KEY,
    `vehicle_id` INT NOT NULL,
    `booking_date` DATE NOT NULL,
    `status` ENUM('Pending', 'In Progress', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending',
    `notes` TEXT,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_booking_vehicle` (`vehicle_id`),
    INDEX `idx_booking_date` (`booking_date`),
    INDEX `idx_booking_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 7. Domain Entity: Service_Details
-- Specific service operations assigned to a booking.
-- Links Booking, Service_Type, and Mechanic (1:N from each).
-- =============================================================================
CREATE TABLE `Service_Details` (
    `service_detail_id` INT AUTO_INCREMENT PRIMARY KEY,
    `booking_id` INT NOT NULL,
    `service_type_id` INT NOT NULL,
    `mechanic_id` INT NOT NULL,
    `labor_cost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `service_notes` TEXT,
    `status` ENUM('Pending', 'In Progress', 'Completed') NOT NULL DEFAULT 'Pending',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_sd_booking` (`booking_id`),
    INDEX `idx_sd_service_type` (`service_type_id`),
    INDEX `idx_sd_mechanic` (`mechanic_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 8. Domain Entity: Spare_Parts
-- Inventory catalog of replacement parts with current stock levels.
-- =============================================================================
CREATE TABLE `Spare_Parts` (
    `part_id` INT AUTO_INCREMENT PRIMARY KEY,
    `part_name` VARCHAR(100) NOT NULL,
    `part_number` VARCHAR(50) NOT NULL UNIQUE,
    `unit_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `stock_quantity` INT NOT NULL DEFAULT 0,
    `reorder_level` INT NOT NULL DEFAULT 5,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_part_number` (`part_number`),
    INDEX `idx_part_stock` (`stock_quantity`, `reorder_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 9. Junction Entity: Parts_Used
-- Many-to-Many junction between Service_Details and Spare_Parts.
-- Captures the quantity used and unit price at time of installation.
-- =============================================================================
CREATE TABLE `Parts_Used` (
    `usage_id` INT AUTO_INCREMENT PRIMARY KEY,
    `service_detail_id` INT NOT NULL,
    `part_id` INT NOT NULL,
    `quantity` INT NOT NULL DEFAULT 1,
    `unit_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_pu_detail` (`service_detail_id`),
    INDEX `idx_pu_part` (`part_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 10. Billing Entity: Invoice
-- Generated upon service completion. Relationship: Service_Booking -> Invoice (1:1)
-- Stores calculated labor, parts, tax, and grand total.
-- =============================================================================
CREATE TABLE `Invoice` (
    `invoice_id` INT AUTO_INCREMENT PRIMARY KEY,
    `booking_id` INT NOT NULL UNIQUE,
    `invoice_date` DATE NOT NULL,
    `labor_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `parts_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `tax_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `total_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `status` ENUM('Unpaid', 'Partially Paid', 'Paid') NOT NULL DEFAULT 'Unpaid',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_invoice_booking` (`booking_id`),
    INDEX `idx_invoice_status` (`status`),
    INDEX `idx_invoice_date` (`invoice_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 11. Billing Entity: Payment
-- Payment transactions recorded against an invoice.
-- Relationship: Invoice -> Payment (1:N) allowing multiple partial payments.
-- =============================================================================
CREATE TABLE `Payment` (
    `payment_id` INT AUTO_INCREMENT PRIMARY KEY,
    `invoice_id` INT NOT NULL,
    `payment_date` DATE NOT NULL,
    `amount_paid` DECIMAL(10, 2) NOT NULL,
    `payment_method` ENUM('Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer') NOT NULL DEFAULT 'Cash',
    `transaction_reference` VARCHAR(100),
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_payment_invoice` (`invoice_id`),
    INDEX `idx_payment_date` (`payment_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
