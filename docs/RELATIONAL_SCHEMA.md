# Relational Schema Specification: VSCMS

Database Name: `vscms_db`  
Storage Engine: MySQL 8.x InnoDB  
Character Set: `utf8mb4`  
Collation: `utf8mb4_unicode_ci`

---

## 1. Table Definitions

### 1.1 `Customer`
Stores individual vehicle owner demographics.
```sql
Customer (
    customer_id  INT AUTO_INCREMENT PRIMARY KEY,
    first_name   VARCHAR(50) NOT NULL,
    last_name    VARCHAR(50) NOT NULL,
    email        VARCHAR(100) UNIQUE NULL,
    phone        VARCHAR(20) NOT NULL,
    address      VARCHAR(255) NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 1.2 `Vehicle`
Stores customer motor vehicles.
```sql
Vehicle (
    vehicle_id          INT AUTO_INCREMENT PRIMARY KEY,
    customer_id         INT NOT NULL,
    registration_number VARCHAR(20) NOT NULL UNIQUE,
    make                VARCHAR(50) NOT NULL,
    model               VARCHAR(50) NOT NULL,
    year                INT NOT NULL,
    color               VARCHAR(30) NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_customer FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
      ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_vehicle_year CHECK (year >= 1970 AND year <= 2100)
);
```

### 1.3 `Mechanic`
Stores service center technical staff.
```sql
Mechanic (
    mechanic_id    INT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(100) NOT NULL,
    phone          VARCHAR(20) NOT NULL,
    email          VARCHAR(100) NULL,
    specialization VARCHAR(100) NOT NULL,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 1.4 `Service_Type`
Standard catalog of workshop service operations.
```sql
Service_Type (
    service_type_id INT AUTO_INCREMENT PRIMARY KEY,
    type_name       VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT NULL,
    base_cost       DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_service_type_base_cost CHECK (base_cost >= 0.00)
);
```

### 1.5 `Service_Booking`
Customer service appointments.
```sql
Service_Booking (
    booking_id   INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id   INT NOT NULL,
    booking_date DATE NOT NULL,
    status       ENUM('Pending', 'In Progress', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending',
    notes        TEXT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_vehicle FOREIGN KEY (vehicle_id) REFERENCES Vehicle(vehicle_id)
      ON DELETE RESTRICT ON UPDATE CASCADE
);
```

### 1.6 `Service_Details`
Work order line items under a booking.
```sql
Service_Details (
    service_detail_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id        INT NOT NULL,
    service_type_id   INT NOT NULL,
    mechanic_id       INT NOT NULL,
    labor_cost        DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    service_notes     TEXT NULL,
    status            ENUM('Pending', 'In Progress', 'Completed') NOT NULL DEFAULT 'Pending',
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_service_details_booking FOREIGN KEY (booking_id) REFERENCES Service_Booking(booking_id)
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_service_details_type FOREIGN KEY (service_type_id) REFERENCES Service_Type(service_type_id)
      ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_service_details_mechanic FOREIGN KEY (mechanic_id) REFERENCES Mechanic(mechanic_id)
      ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_service_details_labor_cost CHECK (labor_cost >= 0.00)
);
```

### 1.7 `Spare_Parts`
Warehouse spare parts catalog and inventory counts.
```sql
Spare_Parts (
    part_id        INT AUTO_INCREMENT PRIMARY KEY,
    part_name      VARCHAR(100) NOT NULL,
    part_number    VARCHAR(50) NOT NULL UNIQUE,
    unit_price     DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    stock_quantity INT NOT NULL DEFAULT 0,
    reorder_level  INT NOT NULL DEFAULT 5,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_spare_parts_price CHECK (unit_price >= 0.00),
    CONSTRAINT chk_spare_parts_stock CHECK (stock_quantity >= 0),
    CONSTRAINT chk_spare_parts_reorder CHECK (reorder_level >= 0)
);
```

### 1.8 `Parts_Used`
Many-to-many junction recording spare parts installed in a service task.
```sql
Parts_Used (
    usage_id          INT AUTO_INCREMENT PRIMARY KEY,
    service_detail_id INT NOT NULL,
    part_id           INT NOT NULL,
    quantity          INT NOT NULL DEFAULT 1,
    unit_price        DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_parts_used_service_detail FOREIGN KEY (service_detail_id) REFERENCES Service_Details(service_detail_id)
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_parts_used_part FOREIGN KEY (part_id) REFERENCES Spare_Parts(part_id)
      ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_parts_used_quantity CHECK (quantity > 0),
    CONSTRAINT chk_parts_used_price CHECK (unit_price >= 0.00)
);
```

### 1.9 `Invoice`
Final billing document issued for a completed booking.
```sql
Invoice (
    invoice_id   INT AUTO_INCREMENT PRIMARY KEY,
    booking_id   INT NOT NULL UNIQUE,
    invoice_date DATE NOT NULL,
    labor_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    parts_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tax_amount   DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status       ENUM('Unpaid', 'Partially Paid', 'Paid') NOT NULL DEFAULT 'Unpaid',
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoice_booking FOREIGN KEY (booking_id) REFERENCES Service_Booking(booking_id)
      ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_invoice_labor CHECK (labor_amount >= 0.00),
    CONSTRAINT chk_invoice_parts CHECK (parts_amount >= 0.00),
    CONSTRAINT chk_invoice_tax CHECK (tax_amount >= 0.00),
    CONSTRAINT chk_invoice_total CHECK (total_amount >= 0.00)
);
```

### 1.10 `Payment`
Payment installment transactions recorded against an invoice.
```sql
Payment (
    payment_id            INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id            INT NOT NULL,
    payment_date          DATE NOT NULL,
    amount_paid           DECIMAL(10, 2) NOT NULL,
    payment_method        ENUM('Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer') NOT NULL DEFAULT 'Cash',
    transaction_reference VARCHAR(100) NULL,
    created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_invoice FOREIGN KEY (invoice_id) REFERENCES Invoice(invoice_id)
      ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_payment_amount CHECK (amount_paid > 0.00)
);
```

### 1.11 `Users`
Authentication credentials and access roles.
```sql
Users (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50) NOT NULL UNIQUE,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(100) NOT NULL,
    role          ENUM('Administrator', 'Staff') NOT NULL DEFAULT 'Staff',
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```
