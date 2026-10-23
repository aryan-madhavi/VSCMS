# API Reference: VSCMS REST API

Base URL: `http://localhost:8000/api` (or proxied via `http://localhost:5173/api`)  
Interactive Swagger Documentation: `http://localhost:8000/docs`  
ReDoc Documentation: `http://localhost:8000/redoc`

---

## 1. Authentication & Security Headers

All protected endpoints require a valid JSON Web Token (JWT) transmitted via the standard HTTP Authorization header:
```http
Authorization: Bearer <access_token>
```
Alternatively, the backend supports browser sessions via the `access_token` cookie.

### Error Response Schema
```json
{
  "detail": "Descriptive error message string or validation array"
}
```

---

## 2. Authentication Endpoints (`/api/auth`)

### 2.1 User Login
- **Method / Path:** `POST /api/auth/login`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "username_or_email": "admin",
    "password": "Admin@123"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "token_type": "bearer",
    "user_id": 1,
    "username": "admin",
    "full_name": "System Administrator",
    "role": "Administrator"
  }
  ```

### 2.2 User Logout
- **Method / Path:** `POST /api/auth/logout`
- **Access:** Authenticated
- **Response (200 OK):** `{"message": "Logged out successfully."}`

### 2.3 Current User Profile
- **Method / Path:** `GET /api/auth/me`
- **Access:** Authenticated (Staff or Administrator)
- **Response (200 OK):**
  ```json
  {
    "user_id": 1,
    "username": "admin",
    "email": "admin@vscms.local",
    "full_name": "System Administrator",
    "role": "Administrator",
    "is_active": true
  }
  ```

---

## 3. User Management Endpoints (`/api/users`) - Admin Only

### 3.1 List All Users
- **Method / Path:** `GET /api/users`
- **Access:** Administrator only
- **Response (200 OK):** Array of user objects (password hashes omitted).

### 3.2 Create Staff Account
- **Method / Path:** `POST /api/users`
- **Access:** Administrator only
- **Request Body:**
  ```json
  {
    "username": "staff_rahul",
    "email": "rahul@vscms.local",
    "password": "Password@123",
    "full_name": "Rahul Verma",
    "role": "Staff",
    "is_active": true
  }
  ```

### 3.3 Toggle Account Status
- **Method / Path:** `PATCH /api/users/{user_id}/status`
- **Access:** Administrator only (cannot deactivate self)
- **Request Body:** `{"is_active": false}`

---

## 4. Customer Management Endpoints (`/api/customers`)

- `GET /api/customers?search=<query>`: List customers with optional name/phone/email search.
- `POST /api/customers`: Register new customer (`first_name`, `last_name`, `phone`, `email`, `address`).
- `GET /api/customers/{id}`: Single customer profile.
- `PUT /api/customers/{id}`: Update customer profile.
- `DELETE /api/customers/{id}`: Delete customer (rejected with HTTP 400 if vehicles are linked).

---

## 5. Vehicle Registry Endpoints (`/api/vehicles`)

- `GET /api/vehicles?search=<query>&customer_id=<id>`: List vehicles with owner details.
- `POST /api/vehicles`: Register vehicle (`customer_id`, `registration_number`, `make`, `model`, `year`, `color`).
- `GET /api/vehicles/{id}`: Single vehicle record.
- `PUT /api/vehicles/{id}`: Update vehicle record.
- `DELETE /api/vehicles/{id}`: Delete vehicle (rejected if service booking records exist).

---

## 6. Service Operation Endpoints

### 6.1 Bookings (`/api/bookings`)
- `GET /api/bookings?status=<Pending|In Progress|Completed|Cancelled>`: Filter bookings.
- `POST /api/bookings`: Create booking (`vehicle_id`, `booking_date`, `status`, `notes`).
- `PUT /api/bookings/{id}`: Transition booking status.
- `DELETE /api/bookings/{id}`: Delete booking (rejected if invoice already generated).

### 6.2 Service Details (`/api/service-details`)
- `GET /api/service-details?booking_id=<id>`: List line-item service tasks for a booking.
- `POST /api/service-details`: Assign task (`booking_id`, `service_type_id`, `mechanic_id`, `labor_cost`, `service_notes`, `status`). Automatically advances booking from `Pending` to `In Progress`.
- `PUT /api/service-details/{id}`: Update task labor cost, notes, or status.
- `DELETE /api/service-details/{id}`: Cascade delete tasks and parts used.

### 6.3 Mechanics (`/api/mechanics`)
- `GET /api/mechanics?active_only=true`: List active workshop technicians.
- `POST /api/mechanics`: Add mechanic (Admin only).
- `PUT /api/mechanics/{id}`: Update specialization / status (Admin only).
- `DELETE /api/mechanics/{id}`: Delete mechanic (Admin only; blocked if services recorded).

### 6.4 Service Types (`/api/service-types`)
- `GET /api/service-types`: List standard catalog packages.
- `POST /api/service-types`: Add catalog package (Admin only).
- `PUT /api/service-types/{id}`: Update base labor cost (Admin only).
- `DELETE /api/service-types/{id}`: Delete package (Admin only; blocked if referenced).

---

## 7. Inventory & Trigger-Driven Parts Management

### 7.1 Spare Parts Catalog (`/api/spare-parts`)
- `GET /api/spare-parts?search=<query>&low_stock_only=true`: Inventory catalog with low stock flags.
- `POST /api/spare-parts`: Create part (`part_name`, `part_number`, `unit_price`, `stock_quantity`, `reorder_level`).
- `PUT /api/spare-parts/{id}`: Restock inventory or adjust pricing.
- `DELETE /api/spare-parts/{id}`: Delete part (Admin only; blocked if historically installed).

### 7.2 Parts Used (`/api/parts-used`)
- `GET /api/parts-used?service_detail_id=<id>`: Parts installed in a specific service line item.
- `POST /api/parts-used`: Install part (`service_detail_id`, `part_id`, `quantity`, `unit_price`).
  - *Trigger behavior:* Invokes `trg_parts_used_before_insert` to verify inventory availability. If stock is insufficient, returns HTTP 400 with trigger error message. On success, `trg_parts_used_after_insert` atomically deducts stock.
- `DELETE /api/parts-used/{id}`: Remove part.
  - *Trigger behavior:* Invokes `trg_parts_used_after_delete` to restore stock to inventory.

---

## 8. Invoicing & Payment Endpoints

### 8.1 Invoices (`/api/invoices`)
- `GET /api/invoices?status=<Unpaid|Partially Paid|Paid>`: List invoices with total paid and balance due.
- `POST /api/invoices`:
  - Request: `{"booking_id": 1, "tax_rate": 0.18}`
  - Calculates labor sum, parts sum, 18% GST tax, and total amount atomically. Enforces 1:1 Booking to Invoice constraint.
- `GET /api/invoices/{id}`: Full financial breakdown and payment ledger.
- `DELETE /api/invoices/{id}`: Blocked if payment transactions exist.

### 8.2 Payments (`/api/payments`)
- `GET /api/payments?invoice_id=<id>`: List payments.
- `POST /api/payments`:
  - Request: `{"invoice_id": 2, "amount_paid": 500.00, "payment_method": "UPI", "transaction_reference": "TXN-101"}`
  - *Trigger behavior:* `trg_payment_after_insert` recalculates total payments and updates invoice status (`Unpaid` -> `Partially Paid` -> `Paid`).
- `DELETE /api/payments/{id}`: Voids payment; trigger automatically recalculates invoice balance.

---

## 9. Analytical Reports & Views (`/api/reports`)

- `GET /api/reports/service-history`: Queries MySQL view `view_service_history`.
- `GET /api/reports/low-stock`: Queries MySQL view `view_low_stock_alerts`.
- `GET /api/reports/outstanding-balances`: Queries MySQL view `view_outstanding_balances`.
- `GET /api/reports/service-summary`: Queries MySQL view `view_service_summary` for dashboard KPI cards.
- `GET /api/reports/invoices`: Queries MySQL view `view_invoice_details`.
