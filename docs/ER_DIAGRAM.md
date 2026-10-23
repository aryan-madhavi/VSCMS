# Entity-Relationship (ER) Diagram: VSCMS

## 1. Complete Mermaid ER Diagram

```mermaid
erDiagram
    Customer ||--o{ Vehicle : "owns (1:N)"
    Vehicle ||--o{ Service_Booking : "booked_for (1:N)"
    Service_Booking ||--o{ Service_Details : "contains (1:N)"
    Service_Type ||--o{ Service_Details : "categorizes (1:N)"
    Mechanic ||--o{ Service_Details : "performed_by (1:N)"
    Service_Details ||--o{ Parts_Used : "consumes (1:N)"
    Spare_Parts ||--o{ Parts_Used : "supplied_as (1:N)"
    Service_Booking ||--o| Invoice : "billed_by (1:1)"
    Invoice ||--o{ Payment : "settled_via (1:N)"

    Customer {
        int customer_id PK
        string first_name
        string last_name
        string email UK
        string phone
        string address
        timestamp created_at
    }

    Vehicle {
        int vehicle_id PK
        int customer_id FK
        string registration_number UK
        string make
        string model
        int year
        string color
        timestamp created_at
    }

    Mechanic {
        int mechanic_id PK
        string name
        string phone
        string email
        string specialization
        boolean is_active
        timestamp created_at
    }

    Service_Type {
        int service_type_id PK
        string type_name UK
        text description
        decimal base_cost
        timestamp created_at
    }

    Service_Booking {
        int booking_id PK
        int vehicle_id FK
        date booking_date
        enum status
        text notes
        timestamp created_at
    }

    Service_Details {
        int service_detail_id PK
        int booking_id FK
        int service_type_id FK
        int mechanic_id FK
        decimal labor_cost
        text service_notes
        enum status
        timestamp created_at
    }

    Spare_Parts {
        int part_id PK
        string part_name
        string part_number UK
        decimal unit_price
        int stock_quantity
        int reorder_level
        timestamp created_at
    }

    Parts_Used {
        int usage_id PK
        int service_detail_id FK
        int part_id FK
        int quantity
        decimal unit_price
        timestamp created_at
    }

    Invoice {
        int invoice_id PK
        int booking_id FK,UK
        date invoice_date
        decimal labor_amount
        decimal parts_amount
        decimal tax_amount
        decimal total_amount
        enum status
        timestamp created_at
    }

    Payment {
        int payment_id PK
        int invoice_id FK
        date payment_date
        decimal amount_paid
        enum payment_method
        string transaction_reference
        timestamp created_at
    }

    Users {
        int user_id PK
        string username UK
        string email UK
        string password_hash
        string full_name
        enum role
        boolean is_active
        timestamp created_at
    }
```

---

## 2. Cardinality & Relationship Breakdown

### 2.1 One-to-Many Relationships (1:N)
- **`Customer (1)` to `Vehicle (N)`:** Each customer may register zero, one, or multiple vehicles. Each vehicle record strictly references one owner (`Vehicle.customer_id`).
- **`Vehicle (1)` to `Service_Booking (N)`:** A vehicle can have multiple service visit bookings over time.
- **`Service_Booking (1)` to `Service_Details (N)`:** A booking appointment can comprise multiple distinct repair/maintenance tasks.
- **`Service_Type (1)` to `Service_Details (N)`:** A catalog service package (e.g., Brake Overhaul) can be assigned to multiple work order tasks.
- **`Mechanic (1)` to `Service_Details (N)`:** A mechanic is assigned to multiple repair jobs across appointments.
- **`Invoice (1)` to `Payment (N)`:** An invoice can receive multiple installment payments over time until the balance is fully settled.

### 2.2 Many-to-Many Relationship (M:N via Junction Table)
- **`Service_Details` to `Spare_Parts` via `Parts_Used`:**
  - One service line item may require multiple parts (e.g. 4 liters of Engine Oil + 1 Oil Filter).
  - One spare part catalog item is installed in multiple service operations.
  - The junction table `Parts_Used` resolves this M:N relationship into two 1:N relationships (`Service_Details (1)` -> `Parts_Used (N)` and `Spare_Parts (1)` -> `Parts_Used (N)`), additionally recording the installed `quantity` and snapshotting the `unit_price`.

### 2.3 One-to-One Relationship (1:1)
- **`Service_Booking` to `Invoice`:**
  - An invoice is created for exactly one service booking.
  - Enforced by the `UNIQUE` constraint on `Invoice.booking_id`.
  - Cardinality is `0..1` to `1` because newly booked services do not have an invoice until repairs are completed and billed.
