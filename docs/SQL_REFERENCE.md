# SQL Reference Guide: VSCMS

This document provides a complete guide to all SQL scripts implemented in VSCMS, including initialization sequence, database triggers, analytical views, ACID transactions, complex queries, and test verification procedures.

---

## 1. Database Initialization Scripts (`db/init/`)

The official MySQL container automatically executes all `.sql` scripts located in `/docker-entrypoint-initdb.d/` in strict alphabetical order upon first initialization of an empty data directory.

| Order | Script File | Functional Purpose |
| :---: | :--- | :--- |
| **1** | `01_schema.sql` | Drops existing objects; creates database `vscms_db`; creates all 10 domain tables plus `Users` with primary keys, indexes, and initial constraints under InnoDB. |
| **2** | `02_constraints.sql` | Establishes remaining foreign key relationships with referential actions (`ON DELETE RESTRICT/CASCADE`) and domain `CHECK` constraints. |
| **3** | `03_triggers.sql` | Implements automated business logic: stock availability check and inventory deduction (`Parts_Used`) and payment status synchronization (`Invoice`). |
| **4** | `04_views.sql` | Creates 5 pre-compiled reporting views (`view_service_history`, `view_low_stock_alerts`, `view_invoice_details`, `view_outstanding_balances`, `view_service_summary`). |
| **5** | `05_seed_data.sql` | Inserts realistic demo datasets with Argon2id-hashed credentials, active appointments, and multi-payment records. |

---

## 2. Trigger Explanations

### 2.1 `trg_parts_used_before_insert` (Stock Validation)
- **Timing:** `BEFORE INSERT ON Parts_Used`
- **Logic:**
  1. Validates `NEW.quantity > 0`.
  2. Queries `Spare_Parts` for `stock_quantity` of `NEW.part_id`.
  3. If available stock `< NEW.quantity`, executes:
     ```sql
     SIGNAL SQLSTATE '45000'
         SET MESSAGE_TEXT = 'Insufficient stock for the requested spare part.';
     ```
  4. Automatically snapshots the catalog `unit_price` if omitted.

### 2.2 `trg_parts_used_after_insert` (Automatic Deduction)
- **Timing:** `AFTER INSERT ON Parts_Used`
- **Logic:**
  ```sql
  UPDATE Spare_Parts
     SET stock_quantity = stock_quantity - NEW.quantity
   WHERE part_id = NEW.part_id;
  ```

### 2.3 `trg_parts_used_after_delete` (Stock Restoration)
- **Timing:** `AFTER DELETE ON Parts_Used`
- **Logic:** Restores inventory stock when a line item is removed or refunded:
  ```sql
  UPDATE Spare_Parts
     SET stock_quantity = stock_quantity + OLD.quantity
   WHERE part_id = OLD.part_id;
  ```

### 2.4 `trg_payment_after_insert` (Invoice Status Synchronization)
- **Timing:** `AFTER INSERT ON Payment`
- **Logic:**
  1. Computes `SUM(amount_paid)` for `NEW.invoice_id`.
  2. Compares sum against `Invoice.total_amount`.
  3. Updates `Invoice.status`:
     - If `total_paid >= total_amount`: status becomes `'Paid'`.
     - Else if `total_paid > 0`: status becomes `'Partially Paid'`.
     - Else: status remains `'Unpaid'`.

---

## 3. Pre-Compiled Views (`04_views.sql`)

### 3.1 `view_service_history`
- **Purpose:** Denormalized multi-table view combining customer contact information, vehicle details, assigned mechanic, service type, labor cost, and total parts cost.
- **SQL Snippet:**
  ```sql
  SELECT
      b.booking_id, b.booking_date, b.status AS booking_status,
      CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
      v.registration_number,
      st.type_name AS service_type,
      m.name AS mechanic_name,
      sd.labor_cost,
      COALESCE(SUM(pu.quantity * pu.unit_price), 0.00) AS parts_cost,
      (sd.labor_cost + COALESCE(SUM(pu.quantity * pu.unit_price), 0.00)) AS total_detail_cost
  FROM Service_Booking b
  JOIN Vehicle v ON b.vehicle_id = v.vehicle_id
  JOIN Customer c ON v.customer_id = c.customer_id
  LEFT JOIN Service_Details sd ON b.booking_id = sd.booking_id
  LEFT JOIN Service_Type st ON sd.service_type_id = st.service_type_id
  LEFT JOIN Mechanic m ON sd.mechanic_id = m.mechanic_id
  LEFT JOIN Parts_Used pu ON sd.service_detail_id = pu.service_detail_id
  GROUP BY b.booking_id, sd.service_detail_id, ...;
  ```

### 3.2 `view_low_stock_alerts`
- **Purpose:** Surfaces inventory parts where `stock_quantity <= reorder_level` and computes `shortage_quantity`. Categorizes severity into `OUT_OF_STOCK`, `CRITICAL`, or `LOW_STOCK`.

### 3.3 `view_invoice_details` & `view_outstanding_balances`
- **Purpose:** Itemizes labor, parts, and GST tax alongside cumulative payments received and calculated `balance_due`. Filters for customers with pending balances.

---

## 4. Test & Demonstration Scripts (`db/tests/`)

These scripts are strictly separated from initialization scripts and are designed for classroom demonstrations:

### 4.1 `01_integrity_tests.sql`
Demonstrates engine enforcement of relational constraints:
- **Test 1:** Attempting duplicate vehicle license plate (Violates `UNIQUE (registration_number)`).
- **Test 2:** Registering vehicle with non-existent `customer_id = 99999` (Violates Foreign Key).
- **Test 3:** Attempting to delete a customer who owns registered vehicles (Violates `ON DELETE RESTRICT`).
- **Test 4:** Registering vehicle with manufacturing year `1850` (Violates `CHECK (year >= 1970)`).
- **Test 5:** Inserting negative payment `-500.00` (Violates `CHECK (amount_paid > 0)`).
- **Test 6:** Generating a second invoice for the same booking (Violates `UNIQUE (booking_id)`).

### 4.2 `02_trigger_tests.sql`
Demonstrates inventory triggers in action:
- **Test 1:** Requesting 10 spark plugs when only 2 are in stock (Trigger rejects with Error 45000).
- **Test 2:** Installing 2 liters of oil (Verifies stock decrements immediately).
- **Test 3:** Deleting the installed oil line item (Verifies stock increments back to original count).
- **Test 4:** Invoice payment status transitions from `Unpaid` to `Partially Paid` to `Paid`.

### 4.3 `03_transaction_demo.sql`
Demonstrates ACID properties:
- **Scenario 1 (COMMIT):** Atomically inserts Booking + Service Details + Parts Used within a single `START TRANSACTION ... COMMIT;`.
- **Scenario 2 (ROLLBACK):** Simulates an abandoned payment transaction; runs `START TRANSACTION ... ROLLBACK;` and verifies no data was written.

### 4.4 `04_report_queries.sql`
Contains advanced analytical SQL queries demonstrating:
- Multi-table 7-table JOINs across the entire business model.
- Aggregations (`SUM`, `AVG`, `COUNT`, `GROUP BY`) for mechanic productivity and parts valuation.
- `HAVING` clause filtering customers by booking volume.
- Correlated subqueries finding invoices exceeding the center's historical average.
