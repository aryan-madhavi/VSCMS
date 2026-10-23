-- =============================================================================
-- Vehicle Service Center Management System (VSCMS)
-- Database Test Suite 04: Report Queries, Complex JOINs & Aggregations
-- =============================================================================

USE `vscms_db`;

SELECT '=== REPORT 1: Multi-Table JOIN - Complete Vehicle Service Log ===' AS report_name;
-- Joins Customer, Vehicle, Booking, Service Details, Mechanic, Service Type, and Parts Used
SELECT
    b.booking_id,
    b.booking_date,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    c.phone AS customer_phone,
    v.registration_number,
    CONCAT(v.make, ' ', v.model) AS vehicle,
    st.type_name AS service_performed,
    m.name AS technician,
    sd.labor_cost,
    COALESCE(sp.part_name, 'None Installed') AS spare_part,
    COALESCE(pu.quantity, 0) AS part_qty,
    COALESCE(pu.unit_price, 0.00) AS part_price,
    (COALESCE(pu.quantity, 0) * COALESCE(pu.unit_price, 0.00)) AS total_part_cost
FROM `Service_Booking` b
JOIN `Vehicle` v ON b.vehicle_id = v.vehicle_id
JOIN `Customer` c ON v.customer_id = c.customer_id
JOIN `Service_Details` sd ON b.booking_id = sd.booking_id
JOIN `Service_Type` st ON sd.service_type_id = st.service_type_id
JOIN `Mechanic` m ON sd.mechanic_id = m.mechanic_id
LEFT JOIN `Parts_Used` pu ON sd.service_detail_id = pu.service_detail_id
LEFT JOIN `Spare_Parts` sp ON pu.part_id = sp.part_id
ORDER BY b.booking_id ASC, sd.service_detail_id ASC;


SELECT '=== REPORT 2: Mechanic Productivity & Labor Revenue Aggregation ===' AS report_name;
-- Demonstrates COUNT(), SUM(), AVG(), and GROUP BY across relations
SELECT
    m.mechanic_id,
    m.name AS mechanic_name,
    m.specialization,
    COUNT(sd.service_detail_id) AS total_tasks_assigned,
    SUM(CASE WHEN sd.status = 'Completed' THEN 1 ELSE 0 END) AS tasks_completed,
    COALESCE(SUM(sd.labor_cost), 0.00) AS total_labor_revenue_generated,
    COALESCE(ROUND(AVG(sd.labor_cost), 2), 0.00) AS average_labor_per_task
FROM `Mechanic` m
LEFT JOIN `Service_Details` sd ON m.mechanic_id = sd.mechanic_id
GROUP BY m.mechanic_id, m.name, m.specialization
ORDER BY total_labor_revenue_generated DESC;


SELECT '=== REPORT 3: Spare Parts Consumption & Inventory Valuation ===' AS report_name;
-- Aggregates total units sold vs current stock value
SELECT
    sp.part_id,
    sp.part_name,
    sp.part_number,
    sp.unit_price,
    sp.stock_quantity AS current_stock,
    (sp.stock_quantity * sp.unit_price) AS inventory_asset_value,
    COALESCE(SUM(pu.quantity), 0) AS total_units_consumed,
    COALESCE(SUM(pu.quantity * pu.unit_price), 0.00) AS total_parts_revenue
FROM `Spare_Parts` sp
LEFT JOIN `Parts_Used` pu ON sp.part_id = pu.part_id
GROUP BY sp.part_id, sp.part_name, sp.part_number, sp.unit_price, sp.stock_quantity
ORDER BY total_parts_revenue DESC;


SELECT '=== REPORT 4: HAVING Clause - Customers with Multiple Bookings ===' AS report_name;
-- Demonstrates HAVING clause filter on aggregate metric
SELECT
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    c.phone,
    COUNT(v.vehicle_id) AS registered_vehicles,
    COUNT(b.booking_id) AS total_service_visits
FROM `Customer` c
JOIN `Vehicle` v ON c.customer_id = v.customer_id
LEFT JOIN `Service_Booking` b ON v.vehicle_id = b.vehicle_id
GROUP BY c.customer_id, c.first_name, c.last_name, c.phone
HAVING COUNT(b.booking_id) >= 1
ORDER BY total_service_visits DESC;


SELECT '=== REPORT 5: Correlated Subquery - High Value Bookings Above Average ===' AS report_name;
-- Demonstrates subquery in WHERE clause comparing against dataset average
SELECT
    i.invoice_id,
    i.booking_id,
    c.first_name,
    c.last_name,
    v.registration_number,
    i.total_amount,
    i.status
FROM `Invoice` i
JOIN `Service_Booking` b ON i.booking_id = b.booking_id
JOIN `Vehicle` v ON b.vehicle_id = v.vehicle_id
JOIN `Customer` c ON v.customer_id = c.customer_id
WHERE i.total_amount > (SELECT AVG(total_amount) FROM `Invoice`)
ORDER BY i.total_amount DESC;


SELECT '=== REPORT 6: Pre-compiled Views Verification ===' AS report_name;
-- View: Low Stock Alerts
SELECT * FROM `view_low_stock_alerts`;

-- View: Outstanding Accounts Receivable
SELECT * FROM `view_outstanding_balances`;

-- View: Executive KPI Summary
SELECT * FROM `view_service_summary`;
