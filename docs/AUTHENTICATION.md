# Authentication and Authorization Guide

The **Vehicle Service Center Management System (VSCMS)** implements a stateless, token-based authentication mechanism using JSON Web Tokens (JWT) and secure password hashing.

---

## 1. Authentication Architecture

```
+---------------+              +----------------------------+              +-------------------------+
| Client        |              | FastAPI Backend            |              | MySQL Database          |
| (React 18)    |              | (app/routes/auth.py)       |              | (Users table)           |
+---------------+              +----------------------------+              +-------------------------+
        |                                     |                                         |
        |  1. POST /api/v1/auth/login         |                                         |
        |  {username, password}               |                                         |
        |------------------------------------>|                                         |
        |                                     |  2. SELECT * FROM Users                 |
        |                                     |     WHERE username = :u                 |
        |                                     |---------------------------------------->|
        |                                     |<----------------------------------------|
        |                                     |                                         |
        |                                     |  3. Verify Argon2id / PBKDF2 hash       |
        |                                     |     Check is_active == 1                |
        |                                     |                                         |
        |                                     |  4. Generate JWT Access Token           |
        |                                     |     (sub, role, exp: 480m)              |
        |                                     |                                         |
        |  5. 200 OK                          |                                         |
        |  {access_token, token_type, role}   |                                         |
        |<------------------------------------|                                         |
        |                                     |                                         |
        |  6. Subsequent requests with:       |                                         |
        |  Authorization: Bearer <token>      |                                         |
        |------------------------------------>|  7. Verify token signature              |
        |                                     |     Enforce role dependencies           |
```

---

## 2. Password Hashing

Passwords stored in the `Users` table are never stored in plaintext. VSCMS supports modern password hashing standards:

### Primary Algorithm: Argon2id
- **Algorithm Identifier**: `$argon2id$v=19$m=65536,t=3,p=4$...`
- **Memory Cost**: 64 MB (`m=65536`)
- **Time Cost**: 3 iterations (`t=3`)
- **Parallelism**: 4 threads (`p=4`)
- **Standard**: Password Hashing Competition (PHC) winner, resistant to GPU/ASIC cracking.

### Fallback Algorithm: PBKDF2-SHA256
- **Algorithm Identifier**: `pbkdf2_sha256$260000$...`
- **Iterations**: 260,000 rounds
- **Compatibility**: Built-in standard library fallback when native Argon2 C-extensions are not compiled.

---

## 3. Pre-Seeded Default Accounts

For evaluation, college grading, and viva demonstration, two standard accounts are provisioned via `db/init/05_seed_data.sql`:

| Role | Username | Password | Purpose / Privileges |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `Admin@123` | Full system access: User management, all CRUD, financial reports, system configuration. |
| **Staff** | `staff1` | `Staff@123` | Operational access: Customers, vehicles, bookings, service entries, parts recording, invoicing. Cannot delete users or alter core administrative configs. |

---

## 4. JWT Token Specification

- **Algorithm**: `HS256` (HMAC with SHA-256)
- **Token Type**: Bearer Token
- **Default Lifetime**: 480 minutes (8 hours)
- **Secret Key**: Configurable in `.env` via `JWT_SECRET_KEY`

### Payload Structure:
```json
{
  "sub": "admin",
  "role": "admin",
  "exp": 1774210000
}
```

---

## 5. Role-Based Access Control (RBAC)

FastAPI endpoints enforce RBAC through dependency injection (`app/api/dependencies.py`):

1. **`get_current_user`**:
   - Parses the `Authorization: Bearer <token>` header.
   - Validates signature and expiration timestamp.
   - Queries database to ensure user exists and `is_active == 1`.
2. **`require_admin`**:
   - Calls `get_current_user`.
   - Rejects with `HTTP 403 Forbidden` if `current_user.role != 'admin'`.
3. **`require_staff_or_admin`**:
   - Calls `get_current_user`.
   - Allows access if `current_user.role in ['admin', 'staff']`.

### Protected Resources Matrix:

| Endpoint Resource | Public | Staff | Admin |
| :--- | :---: | :---: | :---: |
| `POST /api/v1/auth/login` | Yes | Yes | Yes |
| `GET /api/v1/auth/me` | No | Yes | Yes |
| `GET /api/v1/users/` | No | No | **Yes** |
| `POST /api/v1/users/` | No | No | **Yes** |
| `PUT /api/v1/users/{id}` | No | No | **Yes** |
| `DELETE /api/v1/users/{id}` | No | No | **Yes** |
| `GET /api/v1/customers/` | No | Yes | Yes |
| `POST /api/v1/customers/` | No | Yes | Yes |
| `GET /api/v1/bookings/` | No | Yes | Yes |
| `POST /api/v1/service-details/{id}/parts` | No | Yes | Yes |
| `POST /api/v1/invoices/generate` | No | Yes | Yes |
| `POST /api/v1/payments/` | No | Yes | Yes |
| `GET /api/v1/reports/*` | No | Yes | Yes |

---

## 6. Frontend Token Management

- The React frontend stores the JWT in browser `sessionStorage` under the key `vscms_token`.
- Using `sessionStorage` ensures:
  1. The session is automatically invalidated when the browser tab is closed.
  2. The token is never persisted unencrypted on disk.
  3. No cross-tab token collision during multi-role testing.
- The HTTP fetch wrapper (`src/api/client.js`) intercepts all outgoing API calls and injects the header:
  ```http
  Authorization: Bearer <token>
  ```
- If any request returns `401 Unauthorized`, the client automatically clears `sessionStorage` and redirects the user to `/login`.
