# Podman & Podman Compose Deployment Guide

This guide covers running the **Vehicle Service Center Management System (VSCMS)** using **Podman** and **Podman Compose** in a rootless, daemonless containerized environment.

---

## 1. Prerequisites

Verify that Podman and Podman Compose are installed:

```bash
# Check Podman version (Podman 4.x or 5.x recommended)
podman --version

# Check Podman Compose
podman compose version
# Or standalone podman-compose:
podman-compose --version
```

---

## 2. Directory Structure for Containers

```
VSCMS/
├── compose.yaml              # Multi-container orchestration definition
├── .env                      # Environment variables for containers
├── db/
│   ├── Dockerfile            # MySQL 8.0 image with auto-init scripts
│   └── init/                 # Executed on first startup in alphabetical order
│       ├── 01_schema.sql
│       ├── 02_constraints.sql
│       ├── 03_triggers.sql
│       ├── 04_views.sql
│       └── 05_seed_data.sql
├── backend/
│   └── Dockerfile            # Python 3.11-slim FastAPI container
└── frontend/
    └── Dockerfile            # Node.js 20-alpine container running Vite preview
```

---

## 3. Quick Start (Single-Command Stack)

To launch all three services (`db`, `backend`, `frontend`) in background detached mode:

```bash
# From the project root:
podman compose up --build -d
```

### Checking Container Status:
```bash
podman compose ps
# or
podman ps
```

Expected output:
```
CONTAINER ID  IMAGE                             COMMAND               CREATED         STATUS         PORTS                   NAMES
...           localhost/vscms_db:latest         mysqld                ... ago         Up ...         0.0.0.0:3306->3306/tcp  vscms-db
...           localhost/vscms_backend:latest    uvicorn app.main:...  ... ago         Up ...         0.0.0.0:8000->8000/tcp  vscms-backend
...           localhost/vscms_frontend:latest   npm run preview ...   ... ago         Up ...         0.0.0.0:5173->5173/tcp  vscms-frontend
```

---

## 4. Viewing Logs

Stream logs from all services or a specific container:

```bash
# Follow logs for all services
podman compose logs -f

# Follow database initialization logs
podman compose logs -f db

# Follow backend logs
podman compose logs -f backend

# Follow frontend logs
podman compose logs -f frontend
```

---

## 5. Accessing Running Services

| Service | Host Port | In-Container Port | URL / Health Check |
| :--- | :---: | :---: | :--- |
| **Frontend Web App** | `5173` | `5173` | [http://localhost:5173](http://localhost:5173) |
| **Backend API** | `8000` | `8000` | [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI) |
| **Backend Health** | `8000` | `8000` | [http://localhost:8000/health](http://localhost:8000/health) |
| **MySQL Database** | `3306` | `3306` | `localhost:3306` |

---

## 6. Accessing Containers via Interactive Shell

### Access MySQL Database CLI:
```bash
podman exec -it vscms-db mysql -uvscms_user -pvscms_secure_pass_2026 vscms_db
```

### Access Backend Container Shell:
```bash
podman exec -it vscms-backend /bin/bash
```

### Access Frontend Container Shell:
```bash
podman exec -it vscms-frontend /bin/sh
```

---

## 7. Running Database Test Scripts in Podman

Run SQL integrity and trigger tests directly inside the running database container:

```bash
# 1. Foreign key & domain integrity tests
podman exec -i vscms-db mysql -uvscms_user -pvscms_secure_pass_2026 vscms_db < db/tests/01_integrity_tests.sql

# 2. Trigger validation (low-stock warning & stock deduction)
podman exec -i vscms-db mysql -uvscms_user -pvscms_secure_pass_2026 vscms_db < db/tests/02_trigger_tests.sql

# 3. ACID Transaction demonstration (invoice generation & payment)
podman exec -i vscms-db mysql -uvscms_user -pvscms_secure_pass_2026 vscms_db < db/tests/03_transaction_demo.sql

# 4. View & analytical reporting queries
podman exec -i vscms-db mysql -uvscms_user -pvscms_secure_pass_2026 vscms_db < db/tests/04_report_queries.sql
```

---

## 8. Stopping and Resetting the Environment

### Stop all containers (preserves database data volume):
```bash
podman compose down
```

### Complete Reset (Wipe Database Volume and Re-initialize from Scratch):
```bash
# Stop containers and remove named volume
podman compose down -v

# Start again with clean database initialization
podman compose up --build -d
```

---

## 9. Podman-Specific Best Practices & Gotchas

1. **Rootless Port Mapping**: Podman runs rootless by default; host ports above 1024 (`3306`, `8000`, `5173`) require no special root permissions.
2. **Container Host Resolution**: Containers communicate over the user-defined bridge network `vscms-network` using service DNS names (`db`, `backend`, `frontend`).
3. **Database Initialization Time**: On the very first run, MySQL takes 15-25 seconds to initialize data files and execute the 5 SQL scripts in `/docker-entrypoint-initdb.d/`. The backend service includes an automatic retry loop in `app/main.py` that reconnects until MySQL becomes healthy.
