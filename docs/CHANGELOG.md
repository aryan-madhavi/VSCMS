# Changelog & Version History

All notable changes and milestones for the **Vehicle Service Center Management System (VSCMS)** are documented in this file.

---

## [1.0.0] - 2026-10-22

### Initial Complete Academic Release

#### Database (MySQL 8.0 InnoDB)
- Designed and normalized 10 domain entities + 1 authentication entity into Third Normal Form (3NF).
- Created initialization scripts (`db/init/`):
  - `01_schema.sql`: Table definitions with explicit data types, primary keys, and indexes.
  - `02_constraints.sql`: Foreign keys with referential actions (`RESTRICT`, `CASCADE`) and domain `CHECK` constraints.
  - `03_triggers.sql`: Automated business logic triggers (`trg_check_stock_before_insert`, `trg_deduct_stock_after_insert`, `trg_restore_stock_after_delete`, `trg_sync_invoice_payment_status`).
  - `04_views.sql`: Pre-compiled analytical views (`view_service_history`, `view_low_stock_alerts`, `view_invoice_details`, `view_outstanding_balances`, `view_service_summary`).
  - `05_seed_data.sql`: Realistic seed data with Argon2id-hashed credentials for admin and staff accounts.
- Authored 4 automated SQL test suites (`db/tests/`) covering constraints, triggers, ACID transactions, and analytical queries.

#### Backend (FastAPI + SQLAlchemy 2.0)
- Modular service architecture with clean separation of core configuration, database session handling, models, schemas, and routes.
- Security module featuring dual-engine password hashing (Argon2id + PBKDF2 fallback) and HS256 JWT generation/verification.
- Role-Based Access Control (RBAC) via dependency injection (`require_admin`, `require_staff_or_admin`).
- Atomic billing service calculating labor costs, parts subtotals, tax computation, and invoice balance tracking.
- Health check endpoint (`/health`) and automatic database connection retry loop on container startup.

#### Frontend (React 18 + Vite + Bootstrap 5)
- Responsive Single-Page Application (SPA) adhering strictly to standard Bootstrap 5.3 and Bootstrap Icons without Tailwind CSS or heavy component frameworks.
- Centralized HTTP client wrapper with automatic authorization header injection and 401 interceptor.
- Session-based authentication context preserving login state across page refreshes.
- 13 comprehensive views:
  - Login page with one-click demo credentials.
  - KPI Dashboard with live count cards, view-driven low stock alerts, and quick action shortcuts.
  - Full CRUD pages for Customers, Vehicles, Bookings, Mechanics, Service Types, Spare Parts, Invoices, and Payments.
  - Interactive Service Details view with inline part consumption modal and real-time database trigger error handling.
  - Tabbed Reports dashboard visualizing all 4 analytical database views.
  - Admin-only User Management view.

#### Orchestration & Documentation
- Multi-container Podman and Docker compose specification (`compose.yaml`) enabling single-command deployment.
- Complete 14-part documentation suite covering architecture, database design, ER diagrams, relational schema, normalization, SQL reference, API reference, authentication, Podman deployment, testing, viva presentation guide, and troubleshooting.
