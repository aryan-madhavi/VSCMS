# Project Overview: Vehicle Service Center Management System (VSCMS)

## 1. Problem Statement

Traditional automotive service centers frequently rely on manual physical logbooks, paper job cards, and disconnected desktop spreadsheets. This manual workflow introduces significant operational friction:
- **Data Redundancy & Errors:** Customer and vehicle details must be transcribed repeatedly across booking registers, job cards, and bill books.
- **Inventory Discrepancies:** Spare parts are consumed during repairs without automatic stock ledger updates, leading to unrecorded part usage or sudden stockouts.
- **Inaccurate Billing:** Calculating total repair bills (labor charges, part costs, and GST taxes) manually leads to arithmetic errors and lost revenue.
- **Lack of Audit Trails:** Multiple partial payments and outstanding customer debts cannot be easily tracked or correlated with specific service appointments.

The **Vehicle Service Center Management System (VSCMS)** solves these problems by providing a centralized relational database and web-based management portal.

---

## 2. Project Objectives

- **Relational Integrity:** Implement an accurate, normalized relational database model representing all core service center entities.
- **Automated Inventory Control:** Maintain real-time spare part quantities via database triggers, automatically deducting stock on installation and restoring stock on deletion.
- **Financial Synchronization:** Support atomic billing calculations and track multi-payment installments with automatic invoice status updates (`Unpaid` -> `Partially Paid` -> `Paid`).
- **Role-Based Access Control (RBAC):** Provide distinct operational access for workshop **Staff** while reserving administrative governance and account management for the **Administrator**.
- **Demonstration Readiness:** Offer a clean containerized architecture executable via a single Podman Compose command with realistic seed data and reproducible SQL test scripts for semester DBMS viva examinations.

---

## 3. Scope and Limitations

### Included in Scope
- Management of Customers and registered Customer Vehicles (1:N relationship).
- Mechanic directory with technical specialization tracking and active status.
- Standardized Service Catalog packages with base labor rates.
- Appointment Bookings and detailed task allocation (`Service_Details`).
- Spare part inventory tracking with low-stock alerts and automated quantity triggers.
- Billing workflow: atomic invoice creation, 18% tax calculation, and multi-installment payments.
- Pre-compiled SQL views for analytical reporting and KPI dashboards.
- JWT-based authentication and role-based route protection.

### Excluded / Limitations (Academic Mini-Project Boundaries)
- No third-party OAuth, SMS gateways, or external bank payment gateway integrations.
- Local HTTP communication for container demonstration (no commercial SSL/TLS certificates).
- Simplified single-branch workshop operation (multi-tenant franchise support omitted).

---

## 4. Main System Modules

| Module Name | Key Functionality | Primary Database Tables |
| :--- | :--- | :--- |
| **Authentication & Users** | User login, Argon2 password verification, role management, account status toggling. | `Users` |
| **Customer & Vehicle Registry** | Customer profiles, vehicle ownership, registration plate uniqueness. | `Customer`, `Vehicle` |
| **Service Workflow** | Service bookings, scheduling, task assignment, labor cost tracking. | `Service_Booking`, `Service_Details`, `Mechanic`, `Service_Type` |
| **Inventory Management** | Spare part catalog, reorder level alerts, trigger-driven usage allocation. | `Spare_Parts`, `Parts_Used` |
| **Invoicing & Payments** | Atomic billing generation, tax calculation, multi-payment ledger, status sync. | `Invoice`, `Payment` |
| **Reports & Views** | Service history, low stock monitoring, accounts receivable, executive KPIs. | `view_service_history`, `view_low_stock_alerts`, `view_invoice_details`, `view_outstanding_balances`, `view_service_summary` |

---

## 5. Typical Service Center Lifecycle

1. **Customer & Vehicle Intake:** The customer brings their vehicle to the workshop. Staff check if the vehicle is registered; if not, customer demographic details and vehicle information are registered.
2. **Booking Creation:** An appointment booking is created in `Pending` status describing the primary complaint or routine service requested.
3. **Task Assignment:** Staff assign one or more catalog service items to specific specialized mechanics under `Service_Details`. The booking status transitions to `In Progress`.
4. **Parts Installation & Stock Deduction:** During repairs, replacement spare parts are assigned to the service task. A database trigger immediately verifies stock availability and decrements inventory.
5. **Service Completion:** The mechanic completes the work, notes observations, and marks tasks `Completed`.
6. **Invoice Generation:** An invoice is created with one click. The system calculates labor totals, parts totals, 18% GST, and grand total.
7. **Payment Collection:** The customer settles their bill via Cash, UPI, Card, or installment payments. A database trigger synchronizes invoice payment status automatically.
