# Vehicle Service Center Management System (VSCMS)

[![Database: MySQL 8.0](https://img.shields.io/badge/Database-MySQL%208.0%20InnoDB-00758F.svg)](https://www.mysql.com/)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![Frontend: React 18](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Bootstrap%205-61DAFB.svg)](https://react.dev/)
[![Containers: Podman](https://img.shields.io/badge/Containers-Podman%20Compose-892CA0.svg)](https://podman.io/)
[![Architecture: 3NF Relational](https://img.shields.io/badge/Architecture-3NF%20Relational-4CAF50.svg)](docs/NORMALIZATION.md)

A complete, centralized, relational database management mini-project designed for automotive service centers. VSCMS replaces manual registers, paper work orders, and fragmented spreadsheets with an ACID-compliant MySQL database, a high-performance Python FastAPI REST backend, and a clean, responsive React 18 Bootstrap interface.

Built specifically for college DBMS demonstrations, viva presentations, and relational database evaluations.

---

## 1. System Overview & Problem Statement

Traditional automotive service centers face severe operational challenges:
- **Disjointed Records**: Customer information, vehicle history, and mechanic assignments are stored in separate paper logbooks.
- **Inventory Discrepancies**: Spare parts are consumed without atomic stock deduction, resulting in negative inventory or unbilled parts.
- **Financial Inconsistencies**: Manual calculations lead to arithmetic errors in labor, spare parts, taxes, and customer balance tracking.
- **Lack of Auditing**: No historical tracking of who performed a service, what parts were installed, or when payments were received.

**VSCMS solves this** by centralizing operations into an ACID-compliant MySQL 8.0 schema with automated database triggers, referential foreign keys with cascading actions, pre-compiled analytical views, and role-based access control.

---

## 2. Technology Stack

| Layer | Technology | Key Libraries / Modules |
| :--- | :--- | :--- |
| **Database** | MySQL 8.0 (InnoDB) | Relational Schema, Triggers, Views, Constraints, Foreign Keys |
| **Backend API** | Python 3.11 / FastAPI | SQLAlchemy 2.0 ORM, PyMySQL, Pydantic v2, PyJWT, Argon2-cffi |
| **Frontend UI** | React 18 / Vite | Bootstrap 5.3, Bootstrap Icons, React Router v6, Fetch API |
| **Orchestration** | Podman / Podman Compose | Multi-container stack (`compose.yaml`), Rootless & Daemonless |

> **Academic Design Note**: This project intentionally adheres to pure Bootstrap 5.3 and standard CSS. It strictly avoids Tailwind CSS, heavy component libraries (like shadcn/ui), Kubernetes, or external cloud dependencies to ensure lightweight local execution, high reliability, and clear academic explainability during viva examinations.

---

## 3. Quick Start (Single-Command Run)

### Prerequisites
- [Podman](https://podman.io/) & [Podman Compose](https://github.com/containers/podman-compose) (or Docker & Docker Compose)
- Git

### Launch the Entire Stack
```bash
# 1. Clone or navigate to the repository
cd /home/aryan/Projects/SPIT/VSCMS

# 2. Copy the environment configuration
cp .env.example .env

# 3. Start all services in the background
podman compose up --build -d
```

### Access URLs
| Application Layer | URL | Credentials |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:5173](http://localhost:5173) | Click *Demo Admin* or *Demo Staff* on login |
| **FastAPI Swagger Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive OpenAPI documentation |
| **Backend Health Check** | [http://localhost:8000/health](http://localhost:8000/health) | Live container readiness probe |
| **MySQL Database Port** | `localhost:3307` (or `3306`) | User: `vscms_user` / Pass: `vscms_secure_pass_2026` |

---

## 4. Default Seed Accounts

The database comes pre-populated with realistic demonstration data and secure Argon2id-hashed credentials:

| Role | Username | Password | Purpose & Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `Admin@123` | Full access: User management, all CRUD, financial analytics, system settings. |
| **Staff Member** | `staff1` | `Staff@123` | Operational access: Customers, vehicles, bookings, parts tracking, invoicing. |

*(The login page features convenient one-click demo buttons that instantly fill these credentials for rapid viva demonstration).*

---

## 5. Relational Database Architecture

The database model consists of **10 domain entities** plus 1 authentication entity, fully normalized into **Third Normal Form (3NF)**:

```
  +------------------+         +------------------+         +----------------------+
  |     Customer     | 1     * |     Vehicle      | 1     * |   Service_Booking    |
  |------------------|<------->|------------------|<------->|----------------------|
  | PK  customer_id  |         | PK  vehicle_id   |         | PK  booking_id       |
  |     first_name   |         | FK  customer_id  |         | FK  vehicle_id       |
  |     last_name    |         |     reg_number   |         |     booking_date     |
  |     phone (UQ)   |         |     make, model  |         |     status (ENUM)    |
  |     email (UQ)   |         |     year         |         |     problem_desc     |
  +------------------+         +------------------+         +----------------------+
                                                               | 1                | 1
                                                               |                  |
                                                               | *                | 1 (UQ)
                                                    +---------------------+   +---------------------+
                                                    |   Service_Details   |   |       Invoice       |
                                                    |---------------------|   |---------------------|
                                                    | PK  service_det_id  |   | PK  invoice_id      |
                                                    | FK  booking_id      |   | FK  booking_id (UQ) |
                                                    | FK  service_type_id |   |     labor_total     |
                                                    | FK  mechanic_id     |   |     parts_total     |
                                                    |     labor_cost      |   |     tax_amount      |
                                                    +---------------------+   |     total_amount    |
                                                               | 1            |     status (ENUM)   |
                                                               |              +---------------------+
                                                               | *                       | 1
                                                    +---------------------+              |
                                                    |     Parts_Used      |              | *
                                                    |---------------------|   +---------------------+
                                                    | PK  parts_used_id   |   |       Payment       |
                                                    | FK  service_det_id  |   |---------------------|
                                                    | FK  part_id         |   | PK  payment_id      |
                                                    |     quantity        |   | FK  invoice_id      |
                                                    |     unit_price      |   |     amount          |
                                                    +---------------------+   |     payment_date    |
                                                               | *            |     payment_method  |
                                                               |              +---------------------+
                                                               | 1
                                                    +---------------------+
                                                    |     Spare_Parts     |
                                                    |---------------------|
                                                    | PK  part_id         |
                                                    |     part_name       |
                                                    |     part_number(UQ) |
                                                    |     unit_price      |
                                                    |     stock_quantity  |
                                                    |     reorder_level   |
                                                    +---------------------+
```

---

## 6. Key DBMS Concepts Demonstrated

### 1. Automated Database Triggers (`db/init/03_triggers.sql`)
- **`trg_check_stock_before_insert`**: Blocks adding a spare part to a service task if requested quantity exceeds current inventory using `SIGNAL SQLSTATE '45000'`.
- **`trg_deduct_stock_after_insert`**: Automatically reduces `quantity_in_stock` in `Spare_Parts` when a part is recorded.
- **`trg_restore_stock_after_delete`**: Automatically restores inventory when a part line is deleted.
- **`trg_sync_invoice_payment_status`**: Recomputes the sum of payments for an invoice and transitions status between `'Unpaid'`, `'Partially Paid'`, and `'Paid'`.

### 2. Pre-Compiled Analytical Views (`db/init/04_views.sql`)
- **`view_service_history`**: Multi-table join across customer, vehicle, booking, service tasks, mechanics, and parts used.
- **`view_low_stock_alerts`**: Dynamically filters parts where `quantity_in_stock <= reorder_level` and computes shortage severity (`OUT_OF_STOCK`, `CRITICAL`, `LOW_STOCK`).
- **`view_invoice_details`**: Itemized billing breakdown showing labor subtotals, parts subtotals, tax (18% GST), and total invoice cost.
- **`view_outstanding_balances`**: Invoices with balance due $> 0$ with customer contact information for follow-up.
- **`view_service_summary`**: Mechanic productivity report showing completed jobs, labor revenue generated, and average earnings.

### 3. ACID Transactions & Atomic Operations
- Invoicing and payments execute inside atomic transactions (`db/tests/03_transaction_demo.sql` and `app/services/billing_service.py`). If an overpayment or calculation fails, the entire transaction rolls back, preventing partial or corrupted billing states.

---

## 7. Running Database Test Suites

Execute the four automated SQL test scripts directly in the database container:

```bash
# 1. Foreign keys, unique constraints & CHECK constraints
podman exec -i vscms-db mysql -f -uvscms_user -pvscms_secure_pass_2026 vscms_db < db/tests/01_integrity_tests.sql

# 2. Trigger validation (stock deduction & payment sync)
podman exec -i vscms-db mysql -f -uvscms_user -pvscms_secure_pass_2026 vscms_db < db/tests/02_trigger_tests.sql

# 3. Transaction demonstration (atomic commit & rollback)
podman exec -i vscms-db mysql -f -uvscms_user -pvscms_secure_pass_2026 vscms_db < db/tests/03_transaction_demo.sql

# 4. Multi-table JOINs, GROUP BY, HAVING, and Views
podman exec -i vscms-db mysql -f -uvscms_user -pvscms_secure_pass_2026 vscms_db < db/tests/04_report_queries.sql
```

---

## 8. Project Directory Structure

```
VSCMS/
├── compose.yaml                  # Podman/Docker multi-service stack definition
├── .env.example                  # Environment template
├── .env                          # Local configuration (secrets, ports, DB credentials)
├── .gitignore                    # Version control exclusions
├── README.md                     # Master project documentation
│
├── db/                           # Database Layer
│   ├── Dockerfile                # MySQL 8.0 custom image definition
│   ├── init/                     # Executed on database creation
│   │   ├── 01_schema.sql         # 10 domain tables + Users table
│   │   ├── 02_constraints.sql    # Foreign keys and CHECK constraints
│   │   ├── 03_triggers.sql       # Stock deduction and payment status triggers
│   │   ├── 04_views.sql          # 5 pre-compiled SQL reporting views
│   │   └── 05_seed_data.sql      # Realistic seed records and admin users
│   └── tests/                    # SQL verification scripts
│       ├── 01_integrity_tests.sql
│       ├── 02_trigger_tests.sql
│       ├── 03_transaction_demo.sql
│       └── 04_report_queries.sql
│
├── backend/                      # Python FastAPI REST API Layer
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py               # Application entrypoint, CORS, startup retries
│       ├── core/                 # Config, settings, and JWT/Argon2 security
│       ├── database/             # SQLAlchemy connection engine and session factory
│       ├── models/               # 11 SQLAlchemy 2.0 ORM models
│       ├── schemas/              # Pydantic v2 validation models
│       ├── services/             # Atomic billing and business logic
│       └── routes/               # 12 Modular REST endpoint routers
│
├── frontend/                     # React 18 + Bootstrap 5 Frontend Layer
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx              # React DOM entrypoint
│       ├── App.jsx               # Application routing and providers
│       ├── api/client.js         # Fetch client with Bearer auth injection
│       ├── auth/AuthContext.jsx  # Authentication state and role management
│       ├── components/           # Reusable UI widgets (Navbar, Sidebar, Modals, Cards)
│       ├── layouts/              # Main dashboard responsive layout
│       └── pages/                # 13 Complete view pages
│
└── docs/                         # Comprehensive Documentation Suite
    ├── PROJECT_OVERVIEW.md       # High-level architecture and scope
    ├── ARCHITECTURE.md           # System data flow and Mermaid architecture diagram
    ├── DATABASE_DESIGN.md        # Comprehensive DB technical specification
    ├── ER_DIAGRAM.md             # Mermaid Entity-Relationship diagram & cardinalities
    ├── RELATIONAL_SCHEMA.md      # Formal relational schemas and functional dependencies
    ├── NORMALIZATION.md          # 1NF, 2NF, 3NF detailed formal proofs
    ├── SQL_REFERENCE.md          # DDL, DML, Triggers, Views, and Queries reference
    ├── API_REFERENCE.md          # Comprehensive REST API endpoint catalog
    ├── AUTHENTICATION.md         # JWT authentication and Argon2id security guide
    ├── PODMAN_GUIDE.md           # Container management and deployment manual
    ├── TESTING_GUIDE.md          # Multi-layer testing and verification steps
    ├── DEMO_GUIDE.md             # 8-10 minute presentation sequence and script
    ├── VIVA_QUESTIONS.md         # Top 25 DBMS viva questions with model answers
    ├── TROUBLESHOOTING.md        # Diagnostics, common pitfalls, and resolution steps
    └── CHANGELOG.md              # Project history and release milestones
```

---

## 9. Comprehensive Documentation Index

For detailed academic study, grading, and viva preparation, refer to the documents in the [`docs/`](docs/) directory:

1. [**Project Overview**](docs/PROJECT_OVERVIEW.md) - Context, objectives, and feature scope.
2. [**System Architecture**](docs/ARCHITECTURE.md) - Container architecture and data flows.
3. [**Database Design**](docs/DATABASE_DESIGN.md) - In-depth relational specification.
4. [**ER Diagram**](docs/ER_DIAGRAM.md) - Full Mermaid diagram and relationship mappings.
5. [**Relational Schema**](docs/RELATIONAL_SCHEMA.md) - Formal relations and functional dependencies.
6. [**Normalization Analysis**](docs/NORMALIZATION.md) - Mathematical proofs for 1NF, 2NF, and 3NF.
7. [**SQL Reference Manual**](docs/SQL_REFERENCE.md) - Complete DDL, DML, triggers, and views.
8. [**REST API Reference**](docs/API_REFERENCE.md) - Endpoint catalog with request/response schemas.
9. [**Authentication Guide**](docs/AUTHENTICATION.md) - JWT token lifecycle and RBAC policies.
10. [**Podman Deployment Guide**](docs/PODMAN_GUIDE.md) - Container operations and commands.
11. [**Testing Guide**](docs/TESTING_GUIDE.md) - Verification scripts and expected outputs.
12. [**Viva Demo Guide**](docs/DEMO_GUIDE.md) - 8–10 minute live presentation script.
13. [**Top 25 Viva Questions**](docs/VIVA_QUESTIONS.md) - Examiner questions with model answers.
14. [**Troubleshooting Guide**](docs/TROUBLESHOOTING.md) - Diagnostics for common errors.
15. [**Changelog**](docs/CHANGELOG.md) - Release history.

---

## 10. License & Academic Integrity

This project is developed for educational and academic evaluation purposes. It is open for demonstration, study, and learning. All database scripts and application logic are written from first principles to reflect standard relational database best practices.
