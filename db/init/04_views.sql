-- =============================================================================
-- Vehicle Service Center Management System (VSCMS)
-- Database Initialization Script 04: Reporting & Analytic Views
-- =============================================================================

USE `vscms_db`;

-- =============================================================================
-- VIEW 1: view_service_history
-- Purpose:
--   Comprehensive denormalized service record showing customer, vehicle,
--   booking status, assigned mechanic, service type, and total task cost.
-- =============================================================================
CREATE OR REPLACE VIEW `view_service_history` AS
SELECT
    b.booking_id,
    b.booking_date,
    b.status AS booking_status,
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    c.phone AS customer_phone,
    v.vehicle_id,
    v.registration_number,
    CONCAT(v.make, ' ', v.model, ' (', v.year, ')') AS vehicle_info,
    sd.service_detail_id,
    st.type_name AS service_type,
    m.name AS mechanic_name,
    m.specialization AS mechanic_specialization,
    sd.labor_cost,
    COALESCE(SUM(pu.quantity * pu.unit_price), 0.00) AS parts_cost,
    (sd.labor_cost + COALESCE(SUM(pu.quantity * pu.unit_price), 0.00)) AS total_detail_cost,
    sd.status AS detail_status,
    sd.service_notes
FROM `Service_Booking` b
JOIN `Vehicle` v ON b.vehicle_id = v.vehicle_id
JOIN `Customer` c ON v.customer_id = c.customer_id
LEFT JOIN `Service_Details` sd ON b.booking_id = sd.booking_id
LEFT JOIN `Service_Type` st ON sd.service_type_id = st.service_type_id
LEFT JOIN `Mechanic` m ON sd.mechanic_id = m.mechanic_id
LEFT JOIN `Parts_Used` pu ON sd.service_detail_id = pu.service_detail_id
GROUP BY
    b.booking_id, b.booking_date, b.status,
    c.customer_id, c.first_name, c.last_name, c.phone,
    v.vehicle_id, v.registration_number, v.make, v.model, v.year,
    sd.service_detail_id, st.type_name, m.name, m.specialization,
    sd.labor_cost, sd.status, sd.service_notes;

-- =============================================================================
-- VIEW 2: view_low_stock_alerts
-- Purpose:
--   Identifies inventory parts where the current stock is at or below the
--   reorder threshold level, calculating the inventory shortage.
-- =============================================================================
CREATE OR REPLACE VIEW `view_low_stock_alerts` AS
SELECT
    part_id,
    part_name,
    part_number,
    unit_price,
    stock_quantity,
    reorder_level,
    (reorder_level - stock_quantity) AS shortage_quantity,
    CASE
        WHEN stock_quantity = 0 THEN 'OUT_OF_STOCK'
        WHEN stock_quantity <= (reorder_level / 2) THEN 'CRITICAL'
        ELSE 'LOW_STOCK'
    END AS alert_severity
FROM `Spare_Parts`
WHERE stock_quantity <= reorder_level
ORDER BY stock_quantity ASC, shortage_quantity DESC;

-- =============================================================================
-- VIEW 3: view_invoice_details
-- Purpose:
--   Complete financial view of each invoice including itemized amounts,
--   cumulative payments received, and the calculated balance due.
-- =============================================================================
CREATE OR REPLACE VIEW `view_invoice_details` AS
SELECT
    i.invoice_id,
    i.booking_id,
    i.invoice_date,
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    c.phone AS customer_phone,
    v.registration_number,
    CONCAT(v.make, ' ', v.model) AS vehicle_model,
    i.labor_amount,
    i.parts_amount,
    i.tax_amount,
    i.total_amount,
    COALESCE(p.total_paid, 0.00) AS total_paid,
    (i.total_amount - COALESCE(p.total_paid, 0.00)) AS balance_due,
    i.status AS payment_status,
    b.status AS booking_status
FROM `Invoice` i
JOIN `Service_Booking` b ON i.booking_id = b.booking_id
JOIN `Vehicle` v ON b.vehicle_id = v.vehicle_id
JOIN `Customer` c ON v.customer_id = c.customer_id
LEFT JOIN (
    SELECT invoice_id, SUM(amount_paid) AS total_paid
    FROM `Payment`
    GROUP BY invoice_id
) p ON i.invoice_id = p.invoice_id;

-- =============================================================================
-- VIEW 4: view_outstanding_balances
-- Purpose:
--   Filters for all invoices with pending customer debts ('Unpaid' or
--   'Partially Paid'), presenting contact details for collection workflows.
-- =============================================================================
CREATE OR REPLACE VIEW `view_outstanding_balances` AS
SELECT
    invoice_id,
    booking_id,
    invoice_date,
    customer_id,
    customer_name,
    customer_phone,
    registration_number,
    vehicle_model,
    total_amount,
    total_paid,
    balance_due,
    payment_status
FROM `view_invoice_details`
WHERE balance_due > 0.00
ORDER BY balance_due DESC, invoice_date ASC;

-- =============================================================================
-- VIEW 5: view_service_summary
-- Purpose:
--   Aggregated operational and financial key performance indicators (KPIs)
--   for dashboard reporting.
-- =============================================================================
CREATE OR REPLACE VIEW `view_service_summary` AS
SELECT
    (SELECT COUNT(*) FROM `Customer`) AS total_customers,
    (SELECT COUNT(*) FROM `Vehicle`) AS total_vehicles,
    (SELECT COUNT(*) FROM `Service_Booking`) AS total_bookings,
    (SELECT COUNT(*) FROM `Service_Booking` WHERE status = 'Pending') AS pending_bookings,
    (SELECT COUNT(*) FROM `Service_Booking` WHERE status = 'In Progress') AS in_progress_bookings,
    (SELECT COUNT(*) FROM `Service_Booking` WHERE status = 'Completed') AS completed_bookings,
    (SELECT COUNT(*) FROM `Spare_Parts`) AS total_parts_catalog,
    (SELECT COUNT(*) FROM `Spare_Parts` WHERE stock_quantity <= reorder_level) AS low_stock_parts_count,
    (SELECT COALESCE(SUM(total_amount), 0.00) FROM `Invoice`) AS total_invoiced_amount,
    (SELECT COALESCE(SUM(amount_paid), 0.00) FROM `Payment`) AS total_revenue_collected,
    (SELECT (COALESCE(SUM(total_amount), 0.00) - COALESCE((SELECT SUM(amount_paid) FROM `Payment`), 0.00)) FROM `Invoice`) AS total_outstanding_balance;
