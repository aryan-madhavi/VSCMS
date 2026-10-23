# 8–10 Minute Viva & College Presentation Demo Guide

This presentation script is structured specifically for an **8 to 10 minute college presentation or external viva examination**. It guides you through the live demonstration while explaining DBMS concepts to the evaluator.

---

## Presentation Breakdown at a Glance

| Time | Slide / Action | Focus Concept |
| :---: | :--- | :--- |
| **00:00 - 01:30** | Introduction & Problem Statement | Manual registers vs Centralized Relational DBMS |
| **01:30 - 03:00** | Architecture, ER Diagram & Normalization | 10 Relational entities, 3NF compliance, Keys |
| **03:00 - 05:00** | Live System Walkthrough: Login & Operations | Customer -> Vehicle -> Booking -> Service Flow |
| **05:00 - 07:00** | Live Trigger & Stock Demonstration | Triggers in MySQL, Inventory integrity |
| **07:00 - 08:30** | Invoicing, Payments & Transactions | ACID Transactions, Status synchronization trigger |
| **08:30 - 10:00** | Analytical Views, Reports & Q&A | SQL Views, Aggregations, Viva closing |

---

## Step-by-Step Viva Script

### 1. Introduction (0:00 - 1:30)
> **What to Say:**
> *"Good morning respected evaluators. Today I am presenting the **Vehicle Service Center Management System (VSCMS)**. 
> Most local automotive service workshops still maintain paper registers or disconnected spreadsheets to record customer visits, mechanic assignments, spare part consumption, and customer payments. This creates severe problems: stock discrepancies, lost billing records, and lack of historical service records.
> VSCMS solves this by providing a centralized, relational database system built on MySQL 8.0 InnoDB, coupled with a FastAPI backend and a clean Bootstrap-based React frontend. The primary academic focus of this project is demonstrating database integrity, constraints, triggers, views, and ACID transactions."*

---

### 2. Database Design & Normalization (1:30 - 3:00)
> **What to Open:** `docs/ER_DIAGRAM.md` or the database schema diagram.
>
> **What to Say:**
> *"Our database consists of 10 domain entities plus an administrative Users table:
> 1. Customer and Vehicle (1:N relationship)
> 2. Vehicle and Service_Booking (1:N relationship)
> 3. Service_Booking and Service_Details (1:N relationship)
> 4. Service_Type and Mechanic assigned to each service task
> 5. Spare_Parts and Parts_Used (M:N junction between Service_Details and Spare_Parts)
> 6. Invoice and Service_Booking (1:1 strict relationship)
> 7. Invoice and Payment (1:N relationship allowing partial settlements)
>
> All tables are in **Third Normal Form (3NF)**:
> - **1NF**: Every column holds atomic values, with clear primary keys.
> - **2NF**: No partial functional dependencies; all non-key columns depend on the full candidate key.
> - **3NF**: No transitive dependencies. For example, vehicle details are not stored inside bookings, and customer phone numbers are not duplicated inside invoices."*

---

### 3. Live Walkthrough: Core Operations (3:00 - 5:00)
> **What to Do:**
> 1. Open `http://localhost:5173`.
> 2. Click the quick **Demo Admin** button. Mention: *"Notice the password is authenticated using modern Argon2id password hashing."*
> 3. Click **Sign In**.
> 4. Point to the **Dashboard KPIs**: Total Bookings, Active Services, Pending Invoices, Low Stock Alerts.
> 5. Navigate to **Customers**: Show search filter.
> 6. Navigate to **Bookings**: Show appointment schedule with status badges (Pending, In Progress, Completed, Cancelled).

---

### 4. Demonstrating Business Triggers & Stock Protection (5:00 - 7:00) — *Key Viva Moment!*
> **What to Do:**
> 1. Go to **Spare Parts**: Point to *Synthetic Engine Oil 5W-30 (1L)* (Stock: 60) and *Brake Fluid DOT 4* (Stock: 0 - Out of stock).
> 2. Go to **Service Details**: Open the active service for Booking #1.
> 3. Click **Manage Parts** -> Click **Add Part to Service**.
> 4. Select *Brake Fluid DOT 4* (quantity: 1) and click **Record Part**.
> 5. **Observe Error Modal**: *"Insufficient stock for the requested spare part."*
>
> **What to Say to Evaluator:**
> *"Notice that this error did not come from frontend validation or Python code. It was raised directly by our MySQL BEFORE INSERT trigger `trg_check_stock_before_insert` using `SIGNAL SQLSTATE '45000'`. Even if someone connects directly to MySQL via CLI or an external tool, the database will never allow negative inventory."*
>
> 6. Now select *Synthetic Engine Oil 5W-30*, enter quantity `2`, and submit.
> 7. Return to **Spare Parts**: Show that stock dropped from 60 to 58 automatically via `trg_deduct_stock_after_insert`.

---

### 5. Invoicing, Payments & ACID Transactions (7:00 - 8:30)
> **What to Do:**
> 1. Go to **Invoices**: Show Invoice #3 (Status: *Unpaid*, Total: ₹4,720.00).
> 2. Go to **Payments** -> Click **Record Payment**.
> 3. Select Invoice #3, enter Amount: ₹2,000.00, Payment Method: *UPI*, submit.
> 4. Return to **Invoices**: Show that Invoice #3 has automatically switched to **Partially Paid** and balance due is ₹2,720.00.
> 5. Record another payment of ₹2,720.00.
> 6. Show that Invoice #3 status has automatically transitioned to **Paid**.
>
> **What to Say:**
> *"This synchronization is handled by the `trg_sync_invoice_payment_status` trigger on the Payment table. Invoicing and payments are executed inside database transactions. If any part of the payment recording fails, the transaction rolls back, preserving database consistency."*

---

### 6. Analytical Views & Reports (8:30 - 10:00)
> **What to Do:**
> 1. Navigate to **Reports**.
> 2. Click through the 4 tabs:
>    - **Service History**: Multi-table join showing customer, vehicle, mechanic, and parts.
>    - **Low Stock Alerts**: SQL view querying `quantity_in_stock <= reorder_level`.
>    - **Outstanding Balances**: Unpaid and partially paid invoices.
>    - **Mechanic Summary**: Aggregation showing labor revenue and job completion rates.
>
> **Concluding Statement:**
> *"To conclude, VSCMS successfully replaces manual workshop tracking with an ACID-compliant relational system. It demonstrates relational modeling, primary and foreign keys with cascading actions, check constraints, database triggers for business rules, pre-compiled views for reporting, and secure JWT authentication. I am now open to any viva questions."*
