# Testing and Verification Guide

This guide details how to verify the **Vehicle Service Center Management System (VSCMS)** across all layers: Database integrity, Triggers, Views, Backend APIs, and Frontend User Flows.

---

## 1. Overview of Test Suites

VSCMS provides 4 categories of test suites:
1. **SQL Database Test Scripts** (`db/tests/`): Verify relational constraints, foreign keys, triggers, transactions, and views directly against MySQL.
2. **Backend API Automated Tests**: Verify REST endpoints, authentication tokens, status codes, and JSON response models.
3. **Frontend Integration Tests**: Verify end-to-end user workflows, reactive updates, form validations, and error messages.
4. **Performance & Concurrency Checks**: Verify transaction isolation and stock consistency under concurrent service bookings.

---

## 2. Running SQL Database Test Scripts

All database test scripts can be executed directly inside the running database container (`vscms-db`) or against a local MySQL instance:

### Test 1: Relational Integrity & Constraints (`db/tests/01_integrity_tests.sql`)
Tests foreign key enforcement, unique constraints, and check constraints (e.g. negative prices, invalid phone numbers, invalid status enum values).

```bash
# Execute via Podman:
podman exec -i vscms-db mysql -uvscms_user -pvscms_secure_pass_2026 vscms_db < db/tests/01_integrity_tests.sql

# Or if connecting directly via host port 3307:
mysql -h 127.0.0.1 -P 3307 -u vscms_user -pvscms_secure_pass_2026 vscms_db < db/tests/01_integrity_tests.sql
```

**Expected Verifications:**
- Duplicate customer phone or email is rejected (`ERROR 1062 / Duplicate entry`).
- Invalid vehicle registration format is prevented.
- Negative spare part unit price or quantity is blocked by CHECK constraint.
- Deleting a customer with active vehicles is blocked by `RESTRICT`.

---

### Test 2: Trigger Validation (`db/tests/02_trigger_tests.sql`)
Tests all 4 automated business logic triggers:
1. `trg_check_stock_before_insert`: Aborts insert into `Parts_Used` if requested quantity > current stock.
2. `trg_deduct_stock_after_insert`: Automatically reduces `quantity_in_stock` in `Spare_Parts`.
3. `trg_restore_stock_after_delete`: Restores inventory when a part line is removed.
4. `trg_sync_invoice_payment_status`: Updates invoice `status` ('Paid', 'Partially Paid') and `paid_amount` when a payment row is inserted.

```bash
podman exec -i vscms-db mysql -uvscms_user -pvscms_secure_pass_2026 vscms_db < db/tests/02_trigger_tests.sql
```

**Expected Verifications:**
- Attempting to record 999 units of a part with 5 in stock fails with: `SIGNAL SQLSTATE '45000' MESSAGE_TEXT = 'Insufficient stock for requested spare part'`.
- Valid insert of 2 units reduces stock from 10 to 8.
- Invoice with total $150.00 changes from 'Unpaid' to 'Partially Paid' on $50 payment, and 'Paid' on full payment.

---

### Test 3: ACID Transaction Demonstration (`db/tests/03_transaction_demo.sql`)
Demonstrates database transaction safety:
- Commits atomic billing operations (service completion, parts summation, invoice creation, and initial deposit).
- Demonstrates intentional rollback on invalid payment exceeding invoice amount.

```bash
podman exec -i vscms-db mysql -uvscms_user -pvscms_secure_pass_2026 vscms_db < db/tests/03_transaction_demo.sql
```

---

### Test 4: Analytical Reporting Views (`db/tests/04_report_queries.sql`)
Validates that the 5 pre-compiled SQL views return expected aggregations:
1. `view_service_history`: Complete history per vehicle with customer and mechanic names.
2. `view_low_stock_alerts`: Items where `quantity_in_stock <= reorder_level`.
3. `view_invoice_details`: Line-by-line itemization including labor and parts totals.
4. `view_outstanding_balances`: Invoices with pending balance > 0 and customer contact details.
5. `view_service_summary`: Mechanic performance, count of completed services, and total revenue generated.

```bash
podman exec -i vscms-db mysql -uvscms_user -pvscms_secure_pass_2026 vscms_db < db/tests/04_report_queries.sql
```

---

## 3. Backend API Verification

### Health Check Endpoint
```bash
curl -s http://localhost:8000/health | jq .
```
Expected output:
```json
{
  "status": "healthy",
  "database": "connected",
  "app": "VSCMS",
  "version": "1.0.0"
}
```

### Authentication Test
```bash
# Obtain JWT access token
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}' | jq -r .access_token)

echo "Received Token: $TOKEN"

# Query current user profile
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/auth/me | jq .
```

### Invoicing Test Flow via API
```bash
# Fetch outstanding invoices
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/reports/outstanding-balances | jq .
```

---

## 4. Frontend Interactive Verification

1. Navigate to `http://localhost:5173` in a web browser.
2. Click **Demo Admin** button on the login screen (pre-fills `admin` / `Admin@123`).
3. Click **Sign In**. Verify redirection to Dashboard.
4. **Dashboard checks**:
   - 4 KPI cards display live counts (Total Bookings, Active Services, Pending Invoices, Low Stock Parts).
   - "Low Stock Alerts" table displays items under reorder thresholds with alert badges.
5. **Customer & Vehicle flow**:
   - Go to `/customers`, click **Add Customer**, enter a valid customer.
   - Go to `/vehicles`, click **Add Vehicle**, link to newly created customer.
6. **Booking & Service flow**:
   - Go to `/bookings`, create a new appointment.
   - Change status to **In Progress** to create a linked `Service_Details` record.
   - In `/service-details`, open **Manage Parts** and allocate a spare part. Verify that stock drops in `/spare-parts`.
7. **Invoice & Payment flow**:
   - Generate an invoice for the completed service.
   - Record a partial payment and verify status switches to `Partially Paid`.
   - Record the remainder and verify status updates to `Paid`.
