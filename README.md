# CAMPUSCARE — Smart Campus Help Desk

CAMPUSCARE is a full-stack campus help-desk system for Centurion University of Technology and
Management, Vizianagaram. Students submit complaints and confidential support concerns,
administrators assign and resolve complaints through an audited workflow, and the Main
Administrator manages staff, reads confidential reports and monitors analytics.

The interface uses the **Sky Glass – Dark Edition** design: navy glassmorphism panels, blue/cyan
accents, floating light effects, responsive layouts and accessible loading/error states.

- **Frontend:** React 18 + Vite 5 + React Router 6 + Lucide + Recharts
- **Backend:** Java 21 + Spring Boot 3.5 + Spring Security + Spring JDBC (JdbcTemplate)
- **Database:** MySQL 8 (`campuscare_db`), H2 for development/tests
- **Auth:** JWT + BCrypt

---

## 1. Features

### Student

- Public registration (always creates `STUDENT`; never admin roles).
- Role-aware login with remember-me, password visibility and validation.
- Dashboard: complaint totals, pending/in-progress/resolved counts, recent complaints, charts.
- Submit a complaint: title, category, description, location/block, room number, priority and an
  optional attachment (PDF/PNG/JPG, max 5 MB).
- Unique complaint code, `PENDING` initial status, submission history.
- My Complaints: search/filter/pagination, status, remarks, updates and detail timeline.
- Campus Support: confidential concern category + description, tracked status.
- Profile and logout.

### Administrator

- Dashboard with queue statistics, recent complaints and status/category charts.
- All Complaints: search, category/status/priority filters, date sort, pagination.
- View complaint details with student information and full history.
- Assign to an active administrator.
- Update status (`PENDING`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`) with mandatory remarks.
- Every update creates an immutable history row and a student notification.
- Admins cannot access confidential support reports.

### Main Administrator

- Institution dashboard with complaint, student and admin counts and recent activity.
- Full complaint management via the shared admin endpoints.
- Manage Admins: create, edit, department, assigned categories, activate/deactivate, password reset.
- Support Reports: confidential descriptions, status and confidential remarks (Main Admin only).
- Analytics: monthly trend, category/status/priority distribution, resolution rate and admin load.
- Profile and logout.

### Engineering

- Layered Java architecture: controller → service → repository → MySQL.
- Prepared statements everywhere; whitelisted sort columns; no string-concatenated SQL.
- Standard `{success, message, data, timestamp}` API envelope and consistent error responses.
- Bean validation, strict enums, ownership checks and server-side role verification.
- Central React API client using `VITE_API_BASE_URL`; no fake production data.
- Loading skeletons, empty states, retry panels and toast notifications.
- Backend integration tests + frontend production build.
- Vercel configuration and deployment runbook.

---

## 2. Technology

| Layer | Technology |
| --- | --- |
| Language | Java 21 |
| Backend | Spring Boot 3.5.16 (Web, Security, Validation, JDBC) |
| Authentication | JWT (JJWT 0.12.6), BCrypt |
| Database | MySQL 8 (`campuscare_db`) |
| Dev/test database | H2 in MySQL compatibility mode |
| Build | Maven |
| Frontend | React 18.3, Vite 5.4, React Router 6.30 |
| Icons / charts | Lucide React, Recharts |
| Styling | Hand-written CSS, Sky Glass design system |
| Deployment | Vercel (frontend), Java 21 host (backend), managed MySQL 8 |

---

## 3. Repository structure

```text
CAMPUS-HELP-DESK-/
├── backend/
│   ├── pom.xml
│   ├── src/main/java/com/campuscare/
│   │   ├── config/          # Security, CORS, bootstrap/demo data
│   │   ├── controller/      # REST controllers
│   │   ├── dto/             # Request/response records + envelope
│   │   ├── exception/       # ApiException + global handler
│   │   ├── model/           # Enums and data classes
│   │   ├── repository/      # JdbcTemplate repositories
│   │   ├── security/        # JWT filter/service, principal
│   │   ├── service/         # Business rules
│   │   └── util/            # Code generator/helpers
│   ├── src/main/resources/  # application.properties, H2 schema
│   ├── src/test/            # Integration tests + test profile
│   ├── .env.example
│   └── application.properties.example
├── frontend/
│   ├── src/
│   │   ├── api/             # Central API client + endpoint helpers
│   │   ├── components/      # Layout, UI primitives, charts, routes
│   │   ├── context/         # Auth and toast providers
│   │   ├── pages/           # Student / admin / main-admin pages
│   │   ├── utils/           # Formatting helpers
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json
├── database/
│   ├── schema.sql           # MySQL 8 schema
│   └── sample_data.sql      # Optional demo data
├── docs/
│   ├── DEPLOYMENT.md
│   ├── ACADEMIC_DOCUMENTATION.md
│   ├── VIVA_QUESTIONS.md
│   └── REBUILD_CONTRACT.md  # API/DB/design source of truth
├── PROJECT_AUDIT.md
├── DEVELOPMENT_PROGRESS.md
├── .env.example
├── vercel.json              # Vercel build rooted at frontend/
└── README.md
```

---

## 4. Local setup

### Prerequisites

- JDK 21+ and Maven 3.9+
- Node.js 20+ and npm
- MySQL 8 (optional for the H2 demo profile)

### 4.1 Database

```sql
SOURCE database/schema.sql;
-- optional demo rows:
SOURCE database/sample_data.sql;
```

Create a least-privilege application user:

```sql
CREATE USER 'campuscare_user'@'localhost' IDENTIFIED BY 'your-strong-password';
GRANT SELECT, INSERT, UPDATE, DELETE ON campuscare_db.* TO 'campuscare_user'@'localhost';
FLUSH PRIVILEGES;
```

The schema creates `users`, `complaints`, `complaint_history`, `support_reports` and
`notifications` with primary keys, foreign keys, checks and indexes. It never drops data.

### 4.2 Backend

Copy the variables from `.env.example` into your shell/IDE:

| Variable | Purpose |
| --- | --- |
| `DB_URL` | `jdbc:mysql://localhost:3306/campuscare_db?...` |
| `DB_USERNAME` / `DB_PASSWORD` | Database credentials |
| `JWT_SECRET` | Random secret ≥ 32 bytes (required in production) |
| `FRONTEND_ORIGIN` | Allowed frontend origin(s), comma-separated |
| `UPLOAD_DIR` | Attachment directory (default `uploads`) |
| `MAIN_ADMIN_EMAIL` / `MAIN_ADMIN_PASSWORD` | One-time first Main Admin bootstrap |

Start:

```bash
cd backend
mvn spring-boot:run
```

Health: <http://localhost:8080/api/health>

### 4.3 Demo profile (H2, no MySQL)

```bash
cd backend
# PowerShell
$env:DEMO_PASSWORD = "CampusCare@123"
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

The dev profile creates an H2 file database and demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Student | `student@campuscare.local` | value of `DEMO_PASSWORD` |
| Admin | `admin@campuscare.local` | value of `DEMO_PASSWORD` |
| Main Admin | `mainadmin@campuscare.local` | value of `DEMO_PASSWORD` |

Demo complaints and support reports are added only in this profile. H2 console:
<http://localhost:8080/h2-console> (JDBC URL in the startup logs).

### 4.4 Frontend

```bash
cd frontend
copy .env.example .env     # Windows
npm install
npm run dev
```

Open <http://localhost:5173>.

`VITE_API_BASE_URL` must point at the backend root, e.g. `http://localhost:8080`. Only
`VITE_`-prefixed variables reach browser code. The app shows a clear configuration error if the
variable is missing — it never silently uses fake data.

---

## 5. Main Administrator bootstrap

No administrator password is committed.

1. Set `MAIN_ADMIN_EMAIL` and `MAIN_ADMIN_PASSWORD` (strong, ≥ 8 characters).
2. Start the backend once. If the email does not exist, the initializer creates a `MAIN_ADMIN`
   with a BCrypt hash.
3. Sign in at `/login` → **Main Admin**.
4. Create administrators under **Manage Admins**.
5. Remove `MAIN_ADMIN_PASSWORD` from the environment. The initializer never resets an existing
   password.

Public registration can only create students; the role is forced server-side.

---

## 6. API overview

All JSON responses use `{success, message, data, timestamp}`. Protected routes require
`Authorization: Bearer <jwt>`.

### Public

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/health` | Application + database health |
| POST | `/api/auth/register` | Register a student |
| POST | `/api/auth/login` | Login and receive a JWT |

### Authenticated

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/auth/me` | Current profile |

### Student (`STUDENT`)

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/student/dashboard` | Personal statistics and charts |
| GET | `/api/student/complaints` | Own complaints (filters + pagination) |
| POST | `/api/student/complaints` | Create complaint (multipart, optional attachment) |
| GET | `/api/student/complaints/{id}` | Own complaint detail + history |
| GET | `/api/student/complaints/{id}/attachment` | Download own attachment |
| GET | `/api/student/support-reports` | Own confidential reports |
| POST | `/api/student/support-reports` | Create confidential report |

### Admin (`ADMIN` or `MAIN_ADMIN`)

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/admin/dashboard` | Queue statistics and charts |
| GET | `/api/admin/complaints` | Search/filter/sort/paginate complaints |
| GET | `/api/admin/complaints/{id}` | Complaint detail + history |
| GET | `/api/admin/complaints/{id}/attachment` | Download attachment |
| PUT | `/api/admin/complaints/{id}/status` | Status update with required remarks |
| PUT | `/api/admin/complaints/{id}/assign` | Assign an active administrator |
| GET | `/api/admin/admins` | Active administrators |

### Main Admin (`MAIN_ADMIN` only)

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/main-admin/dashboard` | Institution dashboard |
| GET | `/api/main-admin/admins` | All admins (including inactive) |
| POST | `/api/main-admin/admins` | Create an administrator |
| PUT | `/api/main-admin/admins/{id}` | Edit/activate/deactivate an administrator |
| GET | `/api/main-admin/support-reports` | Confidential reports with remarks |
| PUT | `/api/main-admin/support-reports/{id}/status` | Update report status + remarks |
| GET | `/api/main-admin/analytics` | Monthly/category/status/workload analytics |

See [`docs/REBUILD_CONTRACT.md`](docs/REBUILD_CONTRACT.md) for exact request/response JSON.

---

## 7. Workflow

```text
PENDING ──► IN_PROGRESS ──► RESOLVED
   │              │
   └──────────────┴────────► REJECTED

Admins may set any of the four statuses, but every change requires remarks,
must differ from the current status, and creates a complaint_history row.
```

Assigning a complaint stores `assigned_admin_id` without changing the workflow status. The student
receives an in-app notification row for assignment and status changes.

### Confidential support reports

Students create a report (`SR-YYYY-XXXXXXXX`). The student can see its status; only the Main
Administrator can read the full confidential details/remarks or update it. Normal admins receive
HTTP 403.

---

## 8. Security

- Public registration always creates `STUDENT`.
- Passwords are BCrypt-hashed; never serialised or logged.
- JWT signed with `JWT_SECRET`; expiry enforced; deactivated users rejected per request.
- Server loads the user's current role from MySQL — client-supplied roles are never trusted.
- URL rules: `/api/student/**` = STUDENT, `/api/admin/**` = ADMIN/MAIN_ADMIN,
  `/api/main-admin/**` = MAIN_ADMIN.
- Students get 404 for another student's complaint.
- JdbcTemplate prepared statements prevent SQL injection; sort fields are whitelisted.
- Bean validation on every request; consistent error contract; no stack traces/SQL leaked.
- Attachments validated by type/size; random stored filenames; authenticated downloads.
- CORS restricted to configured origins.

Before production: rotate secrets, use HTTPS, restrict MySQL access, remove demo data, keep
`MAIN_ADMIN_PASSWORD` out of long-lived environments and add reverse-proxy rate limiting.

---

## 9. Testing and verification

```bash
cd backend
mvn test

cd ../frontend
npm run build
```

The backend suite runs on H2 in MySQL mode and covers authentication, role restrictions, complaint
creation/isolation, admin assignment/status/history, support-report confidentiality, admin
management and analytics. The frontend production build must complete without errors.

> MySQL runtime connectivity, a live backend host, live Vercel deployment and browser E2E
> automation require your own credentials/session and are not claimed as verified by the source
> alone. See [`DEVELOPMENT_PROGRESS.md`](DEVELOPMENT_PROGRESS.md) for the current verification
> ledger.

---

## 10. Documentation

| Document | Contents |
| --- | --- |
| [`PROJECT_AUDIT.md`](PROJECT_AUDIT.md) | Original state, rebuild decisions, requirement traceability |
| [`DEVELOPMENT_PROGRESS.md`](DEVELOPMENT_PROGRESS.md) | Phase log, verification ledger, remaining work |
| [`docs/REBUILD_CONTRACT.md`](docs/REBUILD_CONTRACT.md) | Authoritative API, database and design contract |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | MySQL, backend host, Vercel, CORS, smoke tests |
| [`docs/ACADEMIC_DOCUMENTATION.md`](docs/ACADEMIC_DOCUMENTATION.md) | Abstract, architecture, ER model, modules, testing |
| [`docs/VIVA_QUESTIONS.md`](docs/VIVA_QUESTIONS.md) | 20 viva questions with model answers |

---

## 11. Author

**V. Dinesh Kartheek**  
Centurion University of Technology and Management, Vizianagaram

Academic project — CAMPUSCARE Smart Campus Help Desk.
