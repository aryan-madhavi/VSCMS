# Database Design: VSCMS

## 1. Domain Entities & Roles

The system models the physical operations of a vehicle maintenance workshop across ten core domain tables and one administrative authentication table.

### 1.1 `Customer`
- **Purpose:** Stores demographic and contact profiles for registered vehicle owners.
- **Primary Key:** `customer_id` (INT, AUTO_INCREMENT)
- **Key Fields:** `first_name`, `last_name`, `email` (UNIQUE), `phone` (NOT NULL, Indexed), `address`.

### 1.2 `Vehicle`
- **Purpose:** Stores motor vehicles brought to the service center.
- **Primary Key:** `vehicle_id` (INT, AUTO_INCREMENT)
- **Foreign Key:** `customer_id` REFERENCES `Customer(customer_id)` (ON DELETE RESTRICT, ON UPDATE CASCADE).
- **Key Fields:** `registration_number` (VARCHAR(20), UNIQUE), `make`, `model`, `year` (CHECK 1970..2100), `color`.

### 1.3 `Mechanic`
- **Purpose:** Stores workshop technicians and technical specializations.
- **Primary Key:** `mechanic_id` (INT, AUTO_INCREMENT)
- **Key Fields:** `name`, `phone`, `email`, `specialization`, `is_active` (BOOLEAN).

### 1.4 `Service_Type`
- **Purpose:** Standardized service catalog packages with baseline labor rates.
- **Primary Key:** `service_type_id` (INT, AUTO_INCREMENT)
- **Key Fields:** `type_name` (UNIQUE), `description`, `base_cost` (DECIMAL(10, 2), CHECK >= 0).

### 1.5 `Service_Booking`
- **Purpose:** Tracks service appointments and lifecycle states for a vehicle.
- **Primary Key:** `booking_id` (INT, AUTO_INCREMENT)
- **Foreign Key:** `vehicle_id` REFERENCES `Vehicle(vehicle_id)`.
- **Key Fields:** `booking_date` (DATE), `status` (ENUM: Pending, In Progress, Completed, Cancelled), `notes`.

### 1.6 `Service_Details`
- **Purpose:** Work-order line items assigning specific service catalog tasks and technicians to a booking.
- **Primary Key:** `service_detail_id` (INT, AUTO_INCREMENT)
- **Foreign Keys:**
  - `booking_id` REFERENCES `Service_Booking(booking_id)` (ON DELETE CASCADE).
  - `service_type_id` REFERENCES `Service_Type(service_type_id)` (ON DELETE RESTRICT).
  - `mechanic_id` REFERENCES `Mechanic(mechanic_id)` (ON DELETE RESTRICT).
- **Key Fields:** `labor_cost` (DECIMAL(10, 2), CHECK >= 0), `service_notes`, `status`.

### 1.7 `Spare_Parts`
- **Purpose:** Warehouse inventory catalog tracking parts pricing, current stock, and safety reorder thresholds.
- **Primary Key:** `part_id` (INT, AUTO_INCREMENT)
- **Key Fields:** `part_name`, `part_number` (UNIQUE), `unit_price`, `stock_quantity` (CHECK >= 0), `reorder_level` (CHECK >= 0).

### 1.8 `Parts_Used`
- **Purpose:** Many-to-Many junction table linking service operations (`Service_Details`) with installed inventory items (`Spare_Parts`).
- **Primary Key:** `usage_id` (INT, AUTO_INCREMENT)
- **Foreign Keys:**
  - `service_detail_id` REFERENCES `Service_Details(service_detail_id)` (ON DELETE CASCADE).
  - `part_id` REFERENCES `Spare_Parts(part_id)` (ON DELETE RESTRICT).
- **Key Fields:** `quantity` (CHECK > 0), `unit_price` (historical price snapshot).
- **Triggers:** Automated stock deduction on INSERT and restoration on DELETE.

### 1.9 `Invoice`
- **Purpose:** Commercial billing document created when service work is completed.
- **Primary Key:** `invoice_id` (INT, AUTO_INCREMENT)
- **Foreign Key:** `booking_id` REFERENCES `Service_Booking(booking_id)` (UNIQUE - 1:1 relationship).
- **Key Fields:** `invoice_date`, `labor_amount`, `parts_amount`, `tax_amount` (18% GST), `total_amount`, `status` (ENUM: Unpaid, Partially Paid, Paid).

### 1.10 `Payment`
- **Purpose:** Realized monetary transactions received toward an invoice.
- **Primary Key:** `payment_id` (INT, AUTO_INCREMENT)
- **Foreign Key:** `invoice_id` REFERENCES `Invoice(invoice_id)` (1:N relationship allowing partial installments).
- **Key Fields:** `payment_date`, `amount_paid` (CHECK > 0), `payment_method` (Cash, UPI, Credit Card, Debit Card, Bank Transfer), `transaction_reference`.
- **Triggers:** Automatic calculation and update of invoice status.

### 1.11 `Users`
- **Purpose:** System authentication accounts with role-based access control.
- **Primary Key:** `user_id` (INT, AUTO_INCREMENT)
- **Key Fields:** `username` (UNIQUE), `email` (UNIQUE), `password_hash` (Argon2id), `full_name`, `role` (Administrator, Staff), `is_active`.
- **Design Separation Note:** Stored completely separately from workshop domain entities to maintain clean separation between infrastructure authorization and physical service management.

---

## 2. Cardinality & Relationship Rationale

1. **Customer to Vehicle (1:N):** A single customer can own multiple vehicles (e.g. personal car and family SUV). A vehicle has exactly one primary registered owner.
2. **Vehicle to Service_Booking (1:N):** A vehicle visits the workshop multiple times across its operating life.
3. **Service_Booking to Service_Details (1:N):** A single booking can encompass multiple maintenance operations (e.g. Periodic Maintenance AND Brake Overhaul).
4. **Service_Details to Parts_Used to Spare_Parts (M:N via Junction):** A service task may use multiple parts (e.g., 4L oil and an oil filter), and a given spare part type is installed across countless service operations. The junction table `Parts_Used` captures the quantity and snapshots the unit price at time of installation.
5. **Service_Booking to Invoice (1:1):** Exactly one invoice is issued per service booking visit. The UNIQUE constraint on `Invoice.booking_id` guarantees that clicking "Generate Invoice" multiple times cannot produce duplicate billing records.
6. **Invoice to Payment (1:N):** Customers may pay their bill in installments (e.g. an advance payment and a final balance payment). Multiple payment rows correlate with a single invoice.
