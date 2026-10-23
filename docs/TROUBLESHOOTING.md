# Troubleshooting and Common Issues Guide

This document lists common development, environment, and deployment issues encountered when running the **Vehicle Service Center Management System (VSCMS)**, along with step-by-step diagnostic and resolution procedures.

---

## 1. Port Conflicts

### Issue: `bind: address already in use` for Port 3306
- **Symptom**: Podman fails to start container `vscms-db` with an error message: `rootlessport listen tcp 0.0.0.0:3306: bind: address already in use`.
- **Cause**: The host machine already has a local MySQL or MariaDB daemon (`mysqld`) running on port 3306.
- **Resolution**:
  1. Open `.env`.
  2. Set `HOST_MYSQL_PORT=3307`.
  3. Restart the stack:
     ```bash
     podman compose down
     podman compose up -d
     ```
  4. Note that internal container communication between `backend` and `db` remains on port 3306 over the bridge network `vscms-network` and is unaffected.

---

### Issue: Port 8000 or 5173 Already in Use
- **Symptom**: `address already in use` when starting backend or frontend containers.
- **Resolution**:
  1. Find the conflicting process on the host:
     ```bash
     ss -tulpn | grep :8000
     ss -tulpn | grep :5173
     ```
  2. Stop the conflicting process or change `BACKEND_PORT` or `FRONTEND_PORT` in `.env` and `compose.yaml`.

---

## 2. Database Connection Issues

### Issue: Backend Container Cannot Connect to Database (`Can't connect to MySQL server on 'db'`)
- **Symptom**: Backend logs show `OperationalError: (2003, "Can't connect to MySQL server on 'db'")`.
- **Cause**: MySQL takes 15–25 seconds to initialize database files and run initialization scripts on first boot.
- **Resolution**:
  - The VSCMS backend has an automatic startup retry loop (up to 30 attempts, 2-second delay). Wait 30 seconds for MySQL to complete initialization.
  - Check database logs:
    ```bash
    podman compose logs -f db
    ```
  - Verify container status with `podman ps`.

---

### Issue: Corrupted or Incomplete Database Volume
- **Symptom**: MySQL fails to start due to a damaged volume or missing tables after an interrupted startup.
- **Resolution**:
  Perform a complete clean reset:
  ```bash
  # Stop containers and destroy the named volume
  podman compose down -v

  # Relaunch the stack and re-run all initialization scripts
  podman compose up --build -d
  ```

---

## 3. Authentication & Login Failures

### Issue: `401 Unauthorized` or `Invalid username or password`
- **Resolution**:
  1. Verify pre-seeded credentials:
     - Admin: `admin` / `Admin@123`
     - Staff: `staff1` / `Staff@123`
  2. Ensure passwords match the case-sensitive string.
  3. If passwords were changed or corrupted in testing, reset the database with `podman compose down -v` followed by `podman compose up -d`.

---

### Issue: Frontend Automatically Redirects to `/login`
- **Cause**: The JWT token has expired (default lifetime: 480 minutes) or `sessionStorage` was cleared.
- **Resolution**: Log in again using the **Demo Admin** or **Demo Staff** one-click buttons on the login page.

---

## 4. Trigger Errors in the Web Application

### Issue: `Insufficient stock for the requested spare part` Error Modal
- **Explanation**: This is expected system behavior, not a bug. The MySQL `BEFORE INSERT` trigger `trg_check_stock_before_insert` prevents adding a spare part to a service task if the requested quantity exceeds available stock.
- **Resolution**: Check the stock level in `/spare-parts`. Restock the part or request an in-stock quantity.

---

### Issue: `Duplicate entry for key 'registration_number'`
- **Explanation**: The `Vehicle` table enforces a unique constraint on registration numbers. A vehicle with that registration plate already exists in the system.

---

## 5. Diagnostic Commands Summary

| Task | Command |
| :--- | :--- |
| **Check All Containers** | `podman ps -a` |
| **Check Backend Health** | `curl -s http://localhost:8000/health \| jq .` |
| **Tail DB Logs** | `podman compose logs -f db` |
| **Tail Backend Logs** | `podman compose logs -f backend` |
| **Tail Frontend Logs** | `podman compose logs -f frontend` |
| **Direct MySQL CLI Access** | `podman exec -it vscms-db mysql -uvscms_user -pvscms_secure_pass_2026 vscms_db` |
| **Reset Database Volume** | `podman compose down -v && podman compose up -d` |
