# Top 25 DBMS Viva Questions & Model Answers for VSCMS

This reference guide contains the most frequently asked viva and oral examination questions for database management mini-projects, tailored specifically to the **Vehicle Service Center Management System (VSCMS)**.

---

## Category 1: Relational Database Design & Schema

### Q1: What is the difference between DDL, DML, and DCL in your project?
**Model Answer:**
- **DDL (Data Definition Language)**: Statements that define and alter database structure. In VSCMS, examples include `CREATE TABLE Customer (...)`, `ALTER TABLE Vehicle ADD CONSTRAINT ...`, and `CREATE VIEW view_service_history AS ...`.
- **DML (Data Manipulation Language)**: Statements that manage data within existing tables. In VSCMS, examples include `INSERT INTO Service_Booking (...)`, `UPDATE Spare_Parts SET quantity_in_stock = ...`, and `DELETE FROM Parts_Used WHERE ...`.
- **DCL (Data Control Language)**: Statements that manage user privileges and permissions, such as `GRANT SELECT, INSERT ON vscms_db.* TO 'vscms_user'@'%';`.

---

### Q2: Why did you choose MySQL 8.0 with the InnoDB storage engine?
**Model Answer:**
We chose MySQL InnoDB because it is a fully ACID-compliant relational storage engine that supports:
1. **Foreign Key Constraints** with declarative referential actions (`ON DELETE RESTRICT`, `ON UPDATE CASCADE`).
2. **Row-Level Locking** for high concurrency without table lock contention.
3. **CHECK Constraints**: MySQL 8.0 natively enforces `CHECK` constraints (e.g. `price > 0`, `year >= 1980`).
4. **Crash Recovery**: Write-Ahead Logging (WAL) with redo/undo logs ensures data survivability across container or host failures.

---

### Q3: What is the cardinality of the relationships in your ER design?
**Model Answer:**
- **Customer to Vehicle**: One-to-Many ($1:N$). One customer can own multiple vehicles, but each vehicle is registered to exactly one customer.
- **Vehicle to Service_Booking**: One-to-Many ($1:N$). A vehicle can have multiple service bookings over its lifetime.
- **Service_Booking to Service_Details**: One-to-Many ($1:N$). A single booking can include multiple discrete service tasks (e.g., Oil Change + Brake Inspection).
- **Service_Booking to Invoice**: One-to-One ($1:1$). Each completed booking generates exactly one finalized invoice (enforced by a `UNIQUE` constraint on `Invoice.booking_id`).
- **Invoice to Payment**: One-to-Many ($1:N$). An invoice can receive multiple installment payments (e.g., deposit + final settlement).
- **Service_Details to Spare_Parts**: Many-to-Many ($M:N$), decomposed via the associative bridge table `Parts_Used`.

---

## Category 2: Keys, Integrity & Constraints

### Q4: What is the difference between a Candidate Key, Primary Key, and Foreign Key?
**Model Answer:**
- **Candidate Key**: A minimal set of attributes that uniquely identifies a row in a table. In `Customer`, both `customer_id` and `(phone, email)` are candidate keys.
- **Primary Key**: The specific candidate key chosen by the database designer as the primary identifier. In VSCMS, all tables use auto-incremented integers (e.g., `customer_id INT AUTO_INCREMENT PRIMARY KEY`) for predictable join performance.
- **Foreign Key**: An attribute in a child table referencing the primary key of a parent table to maintain referential integrity (e.g., `Vehicle.customer_id` referencing `Customer.customer_id`).

---

### Q5: What referential integrity actions did you configure and why?
**Model Answer:**
- **`ON DELETE RESTRICT`**: Applied to parent entities like `Customer` and `Service_Booking`. If an operator attempts to delete a customer who still has registered vehicles or past service history, MySQL blocks the deletion with an integrity error. This prevents orphaned records and loss of audit trails.
- **`ON DELETE CASCADE`**: Applied to dependent detail items like `Parts_Used`. If a `Service_Details` line item is deleted, its corresponding parts used entries are automatically cleaned up.
- **`ON UPDATE CASCADE`**: If a primary key value changes, child foreign keys are automatically updated.

---

### Q6: How do you enforce business rules at the database level rather than just frontend code?
**Model Answer:**
We enforce business rules in three defense layers:
1. **CHECK Constraints**: Enforce domain restrictions at column creation (e.g., `quantity > 0`, `labor_cost >= 0`, `unit_price >= 0`).
2. **UNIQUE Constraints**: Prevent duplicates on `registration_number`, `customer.email`, `customer.phone`, and `spare_parts.part_number`.
3. **Triggers**: Enforce complex procedural rules, such as verifying that stock is sufficient before allowing an insert into `Parts_Used`.

---

## Category 3: Normalization & Functional Dependencies

### Q7: Explain how your schema adheres to First Normal Form (1NF).
**Model Answer:**
A table is in 1NF if all column values are atomic (no arrays, repeating groups, or comma-separated lists) and each table has a designated primary key.
In VSCMS:
- Instead of storing multiple parts used as a comma-separated string inside `Service_Details`, we created a separate `Parts_Used` table where each row contains an atomic `(service_detail_id, part_id, quantity)` entry.
- Names are split into `first_name` and `last_name`.

---

### Q8: Explain Second Normal Form (2NF) with respect to your associative entity `Parts_Used`.
**Model Answer:**
A table is in 2NF if it is in 1NF and contains no **partial functional dependencies** (where a non-key attribute depends on only a portion of a composite primary key).
In `Parts_Used`:
- We use a surrogate primary key `parts_used_id` alongside a unique composite key `(service_detail_id, part_id)`.
- The non-key attributes `quantity` and `unit_price_at_use` depend on both the specific service task AND the specific part consumed.
- Attributes like `part_name` or `part_description` are NOT stored here; they remain in `Spare_Parts` to prevent partial dependencies.

---

### Q9: Explain Third Normal Form (3NF) in VSCMS.
**Model Answer:**
A table is in 3NF if it is in 2NF and has no **transitive functional dependencies** ($X \rightarrow Y$ and $Y \rightarrow Z$, where $Z$ depends on non-key $Y$).
In VSCMS:
- In `Service_Booking`, we store only `vehicle_id`. We do NOT store `customer_id`, `customer_name`, or `customer_phone` inside `Service_Booking`, because `booking_id -> vehicle_id` and `vehicle_id -> customer_id`. Storing customer info in `Service_Booking` would be a transitive dependency.
- In `Invoice`, we reference `booking_id`. We do not duplicate vehicle or customer data inside `Invoice`.

---

## Category 4: Triggers, Views & Queries

### Q10: What triggers exist in VSCMS and when do they fire?
**Model Answer:**
We implemented four triggers:
1. **`trg_check_stock_before_insert` (BEFORE INSERT on `Parts_Used`)**: Checks if `quantity > Spare_Parts.quantity_in_stock`. If insufficient, raises error code `45000` using `SIGNAL SQLSTATE`.
2. **`trg_deduct_stock_after_insert` (AFTER INSERT on `Parts_Used`)**: Subtracts the used quantity from `Spare_Parts.quantity_in_stock`.
3. **`trg_restore_stock_after_delete` (AFTER DELETE on `Parts_Used`)**: Restores parts back to `Spare_Parts` inventory if a service task or part allocation is removed.
4. **`trg_sync_invoice_payment_status` (AFTER INSERT on `Payment`)**: Computes total sum of payments for the referenced invoice and updates `Invoice.status` to either `'Partially Paid'` or `'Paid'`.

---

### Q11: What is the difference between a Table and a View?
**Model Answer:**
- A **Table** physically stores data on disk (InnoDB pages in `.ibd` files).
- A **View** is a saved virtual query that does not store data redundantly. Whenever a query calls `SELECT * FROM view_service_history`, MySQL runs the underlying multi-table `JOIN` query dynamically.
- **Why use views in VSCMS?**
  1. Simplifies complex queries for reporting.
  2. Enhances security by restricting access to raw tables.
  3. Ensures consistent business logic for metrics like `view_low_stock_alerts`.

---

### Q12: Can you explain how the `view_low_stock_alerts` view works?
**Model Answer:**
The view executes:
```sql
SELECT part_id, part_name, part_number, quantity_in_stock, reorder_level,
       (reorder_level - quantity_in_stock) AS shortage_quantity,
       CASE 
           WHEN quantity_in_stock = 0 THEN 'OUT_OF_STOCK'
           WHEN quantity_in_stock <= (reorder_level / 2) THEN 'CRITICAL'
           ELSE 'LOW_STOCK'
       END AS alert_severity
FROM Spare_Parts
WHERE quantity_in_stock <= reorder_level;
```
It dynamically calculates shortages and classifies severity into `OUT_OF_STOCK`, `CRITICAL`, and `LOW_STOCK` without modifying the underlying table schema.

---

## Category 5: Transactions & ACID Properties

### Q13: What does ACID stand for and how is it demonstrated in VSCMS?
**Model Answer:**
- **Atomicity**: "All or nothing". In `billing_service.py`, creating an invoice involves locking the booking, calculating labor totals, summing parts costs, computing tax, inserting the invoice, and updating the booking status to 'Completed'. If any step fails, the entire transaction rolls back.
- **Consistency**: The database transitions from one valid state to another, obeying all constraints, triggers, and foreign keys.
- **Isolation**: Concurrent users cannot read uncommitted, dirty intermediate states. VSCMS runs under MySQL's default `REPEATABLE READ` isolation level.
- **Durability**: Once a transaction is committed, changes are written to the InnoDB redo log and will survive even an unexpected power outage or container restart.

---

### Q14: What is a transaction rollback? Give an example from your project.
**Model Answer:**
A rollback cancels all uncommitted modifications made within the current transaction block.
In our `03_transaction_demo.sql` test, when an operator attempts to record a payment exceeding the invoice balance, an error condition triggers `ROLLBACK;`. The payment table remains unchanged and the invoice balance is preserved in its original valid state.

---

## Category 6: Application Architecture & Security

### Q15: How does the backend communicate with MySQL?
**Model Answer:**
The FastAPI backend uses **SQLAlchemy 2.0** as an Object Relational Mapper (ORM) paired with the **PyMySQL** DBAPI driver. SQLAlchemy pools database connections, maps Python classes to relational tables, and handles query parameterization to eliminate SQL injection vulnerabilities.

---

### Q16: How is SQL Injection prevented in VSCMS?
**Model Answer:**
1. **Parameterized Queries**: All user inputs in SQLAlchemy are bound using parameterized place holders (`:param_name`), separating the SQL code syntax from user-supplied data.
2. **Pydantic Validation**: Before any request reaches the database query layer, Pydantic models validate data types, formats, string lengths, and regex patterns (e.g. phone numbers and registration formats).

---

### Q17: How is authentication implemented?
**Model Answer:**
1. Passwords are encrypted before storage using **Argon2id** (with PBKDF2-SHA256 fallback), a memory-hard password hashing function.
2. Upon successful authentication, the server generates a cryptographically signed **JSON Web Token (JWT)** using `HS256`.
3. The frontend passes this token in the `Authorization: Bearer <token>` header.
4. FastAPI dependency injection validates the token signature, expiration, and user role (`admin` vs `staff`) on protected endpoints.
