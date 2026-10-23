# Database Normalization Analysis: VSCMS

Database normalization is the systematic technique of organizing data in a relational database to minimize data redundancy and eliminate insert, update, and delete anomalies.

The VSCMS database schema strictly complies with **Third Normal Form (3NF)**. Below is an academic breakdown suitable for semester DBMS presentations and viva examinations.

---

## 1. First Normal Form (1NF)

### 1NF Requirements:
1. Each column contains only **atomic** (indivisible) values.
2. There are **no repeating groups** or multi-valued attributes (such as comma-separated lists of parts or phone numbers).
3. Each table has a defined **Primary Key** that uniquely identifies each row.

### How VSCMS Achieves 1NF:
- **Atomicity:** Instead of storing customer names in a single unstructured column, we store `first_name` and `last_name` as distinct atomic fields.
- **Elimination of Repeating Groups:** A repair job frequently requires multiple spare parts (e.g. 4 liters of oil, 1 oil filter, 1 air filter). Storing these as a comma-separated string inside `Service_Details` (e.g., `parts = "Oil, Filter, Gasket"`) would violate 1NF. Instead, we created the junction table `Parts_Used`, where each installed part occupies its own discrete, atomic row.
- **Unique Primary Keys:** Every entity (`Customer`, `Vehicle`, `Invoice`, etc.) possesses a surrogate primary key column (e.g. `customer_id`, `vehicle_id`, `invoice_id`).

---

## 2. Second Normal Form (2NF)

### 2NF Requirements:
1. The table must already satisfy **First Normal Form (1NF)**.
2. There must be **no partial functional dependencies**: every non-prime attribute must be fully functionally dependent on the *entire* primary key, not on a proper subset of a composite primary key.

### How VSCMS Achieves 2NF:
- Most tables in VSCMS use single-column surrogate primary keys (`customer_id`, `booking_id`, `part_id`), which inherently satisfy 2NF because a partial dependency can only exist when a primary key is composite.
- Consider the junction table `Parts_Used`:
  - If `Parts_Used` had a composite primary key `(service_detail_id, part_id)` and also stored `part_name` or `reorder_level`:
    - Functional dependency: `part_id -> part_name`.
    - `part_name` would depend solely on `part_id` (a subset of the primary key), representing a **partial dependency** that violates 2NF!
    - If a part's name changed, multiple rows would require updating, causing an **update anomaly**.
  - **Resolution:** `part_name` and `reorder_level` are stored exclusively in `Spare_Parts`. `Parts_Used` stores only attributes dependent on the specific installation instance: `quantity` and `unit_price` (price at time of installation).

---

## 3. Third Normal Form (3NF)

### 3NF Requirements:
1. The table must already satisfy **Second Normal Form (2NF)**.
2. There must be **no transitive dependencies**: non-prime attributes must not depend on other non-prime attributes ($X \rightarrow Y$ and $Y \rightarrow Z$ where $X$ is the primary key). All non-prime attributes must depend *directly* on the primary key ("nothing but the key, so help me Codd").

### How VSCMS Achieves 3NF:

#### Example 1: `Vehicle` and `Customer` Separation
- **Unnormalized / Violating 3NF Design:**
  - Suppose `Vehicle` contained: `(vehicle_id, registration_number, make, model, customer_id, customer_phone, customer_address)`.
  - Dependencies:
    - `vehicle_id -> customer_id`
    - `customer_id -> customer_address`
  - Here, `customer_address` is transitively dependent on `vehicle_id` through `customer_id`!
  - **Anomalies Prevented:**
    - *Update Anomaly:* If a customer changes address, we would have to update every vehicle row they own.
    - *Deletion Anomaly:* If a customer sells their car and the vehicle is deleted, their contact address would be wiped out.
  - **3NF Resolution:** Customer demographic details are isolated in `Customer`. `Vehicle` retains only the foreign key `customer_id`.

#### Example 2: `Service_Details` and `Mechanic` / `Service_Type`
- `Service_Details` stores `mechanic_id` and `service_type_id`.
- It does **not** store `mechanic_phone` or `specialization`. Storing them in `Service_Details` would create a transitive dependency: `service_detail_id -> mechanic_id -> specialization`.
- Similarly, catalog base rates and descriptions belong strictly in `Service_Type`.

#### Example 3: Payments and Invoices
- `Payment` records each transaction with `payment_id`, `invoice_id`, `payment_date`, `amount_paid`, and `payment_method`.
- It does not duplicate invoice totals or customer names. All financial rollups are computed via relational JOINs and pre-compiled views.

---

## 4. Summary Table of Normalization Compliance

| Table | 1NF Compliance | 2NF Compliance | 3NF Compliance | Justification |
| :--- | :---: | :---: | :---: | :--- |
| `Customer` | Yes | Yes | Yes | All attributes depend solely on `customer_id`. |
| `Vehicle` | Yes | Yes | Yes | Customer details removed; depends on `vehicle_id`. |
| `Mechanic` | Yes | Yes | Yes | Technician skills and contact details isolated. |
| `Service_Type` | Yes | Yes | Yes | Standard catalog descriptions and base fees isolated. |
| `Service_Booking` | Yes | Yes | Yes | Appointment metadata tied strictly to `booking_id`. |
| `Service_Details` | Yes | Yes | Yes | Line-item assignments; mechanic & service type isolated. |
| `Spare_Parts` | Yes | Yes | Yes | Inventory catalog; part specifications tied to `part_id`. |
| `Parts_Used` | Yes | Yes | Yes | Resolves M:N; stores only usage quantity and rate snapshot. |
| `Invoice` | Yes | Yes | Yes | 1:1 billing record; no duplicate customer contact fields. |
| `Payment` | Yes | Yes | Yes | 1:N installment transactions; no transitive billing fields. |
| `Users` | Yes | Yes | Yes | Authentication credentials isolated from business data. |
