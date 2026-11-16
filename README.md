# CampusCare — Smart Campus Help Desk Management System

CampusCare is a full-stack campus complaint management system for Centurion University of
Technology and Management, Vizianagaram. Students raise complaints, administrators resolve
them through a controlled workflow, and the Main Administrator governs users, categories and
confidential reports.

The application is built with **Java 21 + Spring Boot 3 + MySQL 8** on the backend and
**React 18 + Vite 5** on the frontend, using JWT authentication and BCrypt password hashing.

---

## 1. Feature summary

### Student portal

- Public student registration (public registration can only create `STUDENT` accounts).
- Secure login with JWT session handling and automatic expiry handling.
- Dashboard with personal complaint statistics.
- Submit a complaint with category, priority, title, description and campus location.
- Optional, backend-only Gemini AI suggestion (category, priority, department, summary) that is
  clearly labelled as a suggestion and never blocks submission.
- Search and filter personal complaints by status, category, priority and text.
- Ticket detail view with description, administrator remarks, status timeline and comments.

### Administrator portal

- Dashboard with queue statistics, recent activity and attention indicators.
- Search and filter all tickets by status, category, priority, assigned administrator, date and text.
- Assign active administrators with an assignment note.
- Enforce valid status transitions server-side and mirror them in the UI:
  `SUBMITTED → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED`, with `REJECTED` and reopen paths.
- Post comments visible to the student.
- Export the filtered ticket queue as CSV.
- Profile view with role and account details.

### Main Administrator portal

- Institution-wide dashboard (tickets, students, administrators, categories).
- Full user directory with role and text filters.
- Provision `ADMIN` and `MAIN_ADMIN` accounts; students must use public registration.
- Activate/deactivate accounts. Self-deactivation and removing the last active Main Administrator
  are blocked by the backend.
- Create, edit, activate and deactivate complaint categories.
- Confidential reports by date range: status, category and priority distributions plus
  administrator performance.
- Export confidential reports as CSV.
- View and manage every ticket using the administrator workflow.

### Engineering

- Responsive IBM-inspired navy/white interface with loading, empty and error states.
- Centralised API service (`frontend/src/services/api.js`) using `VITE_API_URL`.
- Role-protected React routes and role-aware navigation.
- Bean validation on every request DTO and consistent JSON error responses.
- Six end-to-end backend integration tests (MockMvc + H2).
- Production MySQL schema in `database/schema.sql`.
- Existing Vercel deployment configuration preserved at the repository root.

---

## 2. Technology stack

| Layer | Technology |
| --- | --- |
| Backend language | Java 21 |
| Backend framework | Spring Boot 3.5.16 (Web, Data JPA, Security, Validation) |
| Authentication | JWT (JJWT 0.12.6), BCrypt password hashing |
| Production database | MySQL 8.0 (`helpdesk_db`) |
| Dev/test database | H2 (MySQL compatibility mode) |
| Build tool | Maven |
| Frontend | React 18.3, Vite 5.4, React Router 6.30 |
| Styling | Hand-written responsive CSS, IBM Plex Sans |
| Optional AI | Google Gemini `generateContent` API, backend only |
| Deployment | Vercel (frontend), any Java 21 host (backend), MySQL 8 |

---

## 3. Repository structure

```text
CAMPUS-HELP-DESK-/
├── backend/
│   ├── pom.xml
│   ├── .env.example
│   ├── application.properties.example
│   └── src/
│       ├── main/java/com/campuscare/
│       │   ├── config/          # Category/bootstrap initialisation
│       │   ├── controller/      # REST controllers
│       │   ├── dto/             # Request/response records + mapper
│       │   ├── exception/       # API exceptions + global handler
│       │   ├── model/           # JPA entities and enums
│       │   ├── repository/      # Spring Data repositories
│       │   ├── security/        # JWT filter, service, security rules
│       │   ├── service/         # Business logic + optional Gemini client
│       │   └── util/            # Ticket number + CSV helpers
│       ├── main/resources/      # application.properties, dev profile
│       └── test/                # Integration tests + test profile
├── frontend/
│   ├── src/
│   │   ├── components/          # Layout, UI primitives, icons, routes
│   │   ├── context/             # Auth and toast providers
│   │   ├── pages/               # All 15 application pages
│   │   ├── services/api.js      # Central API client
│   │   ├── utils/format.js      # Formatting helpers
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json
├── database/schema.sql          # MySQL 8 schema + category seeds
├── docs/
│   ├── DEPLOYMENT.md
│   ├── ACADEMIC_DOCUMENTATION.md
│   └── VIVA_QUESTIONS.md
├── PROJECT_AUDIT.md
├── DEVELOPMENT_PROGRESS.md
├── .env.example
├── vercel.json                  # Root Vercel build for frontend/
└── README.md
```

---

## 4. Local setup

### Prerequisites

- JDK 21+
- Maven 3.9+ (or use the Maven wrapper if you add one)
- Node.js 20+ and npm
- MySQL 8.0 for the normal/production profile (optional for the demo profile)

### 4.1 Database (MySQL)

```sql
-- Run as a MySQL administrator
SOURCE database/schema.sql;
```

Create a dedicated application user and grant only what it needs:

```sql
CREATE USER 'campuscare_user'@'localhost' IDENTIFIED BY 'your-strong-password';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX
  ON helpdesk_db.* TO 'campuscare_user'@'localhost';
FLUSH PRIVILEGES;
```

The script creates all six required tables, foreign keys, indexes, check constraints and the
eight initial categories. It never deletes existing rows.

### 4.2 Backend environment

Copy `.env.example` values into your IDE run configuration, shell or hosting provider dashboard.
Do **not** commit a real `.env` file.

Required in production:

| Variable | Purpose |
| --- | --- |
| `DB_URL` | JDBC URL for MySQL |
| `DB_USERNAME` / `DB_PASSWORD` | Database credentials |
| `JWT_SECRET` | Random secret of at least 32 bytes |
| `FRONTEND_ORIGIN` | Comma-separated allowed frontend origins |
| `MAIN_ADMIN_EMAIL` / `MAIN_ADMIN_PASSWORD` | One-time bootstrap for the first Main Administrator |

Optional:

| Variable | Purpose |
| --- | --- |
| `JWT_EXPIRATION_MS` | Token lifetime (default 24 hours) |
| `DB_DDL_AUTO` | Hibernate DDL mode (default `update`; use `validate` after schema is stable) |
| `MAIN_ADMIN_NAME` | Display name for the bootstrapped Main Administrator |
| `GEMINI_API_KEY` | Enables optional AI suggestions when present |
| `GEMINI_MODEL` / `GEMINI_ENABLED` | Gemini model and kill switch |
| `DEMO_PASSWORD` | Dev-profile demo accounts only |

The backend refuses to start in production if `JWT_SECRET` is missing. In the `dev` and `test`
profiles a temporary random secret is generated for convenience.

Start the backend:

```bash
cd backend
mvn spring-boot:run
```

Health check: <http://localhost:8080/api/health>

### 4.3 Optional local demo profile (no MySQL)

```bash
cd backend
# PowerShell
$env:DEMO_PASSWORD = "choose-a-strong-password"
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

This uses H2 in MySQL compatibility mode and creates `student@campuscare.local`,
`admin@campuscare.local` and `mainadmin@campuscare.local` only when `DEMO_PASSWORD` is set.
H2 console: <http://localhost:8080/h2-console> (JDBC URL printed in the logs).

### 4.4 Frontend

```bash
cd frontend
cp .env.example .env      # Windows: copy .env.example .env
npm install
npm run dev
```

Open <http://localhost:5173>.

`VITE_API_URL` must point at the backend root, for example `http://localhost:8080`. Only variables
prefixed with `VITE_` are exposed to browser code by Vite.

---

## 5. Main Administrator bootstrap

No administrator password is hardcoded in this repository.

1. Set `MAIN_ADMIN_EMAIL` and `MAIN_ADMIN_PASSWORD` (minimum 8 characters) in the backend
   environment.
2. Start the backend once. The initializer hashes the password with BCrypt and creates the account
   if the email does not already exist.
3. Sign in at `/main-admin/login`.
4. Remove `MAIN_ADMIN_PASSWORD` from the environment if you do not want the bootstrap check to run
   again. `DataInitializer` only creates the account when it is missing; it never resets a password.

Administrators are then created from **Main Administrator → User management**. Public registration
is restricted to students at the API level.

---

## 6. API overview

All responses are JSON except CSV exports. Protected endpoints require
`Authorization: Bearer <jwt>`.

### Public

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/health` | Application + database health |
| POST | `/api/auth/register` | Register a student |
| POST | `/api/auth/login` | Authenticate and receive a JWT |

### Authenticated

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/auth/me` | Current user profile |
| GET | `/api/categories` | Active complaint categories |
| POST | `/api/tickets` | Create a complaint |
| GET | `/api/tickets/my-tickets` | Paginated personal tickets |
| GET | `/api/tickets/stats` | Personal ticket statistics |
| GET | `/api/tickets/{id}` | Ticket detail (owner or administrator) |
| GET | `/api/tickets/{id}/history` | Status history |
| GET | `/api/tickets/{id}/comments` | Comments |
| POST | `/api/ai/suggest` | Optional AI suggestion (authenticated) |

### Administrator (`ADMIN` or `MAIN_ADMIN`)

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/admin/dashboard` | Queue statistics |
| GET | `/api/admin/tickets` | Paginated/filterable ticket queue |
| GET | `/api/admin/tickets/{id}` | Manage ticket detail |
| PUT | `/api/admin/tickets/{id}/status` | Validated status transition |
| PUT | `/api/admin/tickets/{id}/assign` | Assign an active administrator |
| POST | `/api/admin/tickets/{id}/comments` | Add a comment |
| GET | `/api/admin/tickets/export` | CSV of filtered tickets |
| GET | `/api/admin/admins` | Active administrators |
| GET | `/api/admin/categories` | All categories |

### Main Administrator only

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/main-admin/dashboard` | Institution statistics |
| GET | `/api/main-admin/users` | User directory (`role`, `search`) |
| POST | `/api/main-admin/admins` | Create `ADMIN` or `MAIN_ADMIN` |
| PUT | `/api/main-admin/users/{id}/status` | Activate/deactivate an account |
| GET | `/api/main-admin/reports` | Date-filtered confidential report |
| GET | `/api/main-admin/reports/export` | Confidential CSV report |
| GET | `/api/main-admin/categories` | All categories |
| POST | `/api/main-admin/categories` | Create a category |
| PUT | `/api/main-admin/categories/{id}` | Edit/activate/deactivate a category |

Ticket filters: `status`, `categoryId`, `priority`, `assignedAdminId`, `from`, `to`, `search`,
`page`, `size`.

---

## 7. Ticket workflow

```text
SUBMITTED ──assign──► ASSIGNED ──► IN_PROGRESS ──► RESOLVED ──► CLOSED
     │                    │              │              │
     ├──► IN_PROGRESS ────┘              │              └──► IN_PROGRESS (reopen)
     └──► REJECTED ◄──────┴──────────────┘
              └──► ASSIGNED / IN_PROGRESS (reopen)
```

Rules are enforced by `AdminService` on the server, not only in the browser. Every status change
creates an immutable `ticket_status_history` row with the actor, timestamp and remarks. Every
assignment creates a `ticket_assignments` audit row; the previous active assignment is deactivated.

---

## 8. Database

Six required tables: `users`, `categories`, `tickets`, `ticket_comments`, `ticket_assignments`,
`ticket_status_history`.

The authoritative MySQL script is [`database/schema.sql`](database/schema.sql). It includes:

- utf8mb4 encoding and InnoDB engine;
- foreign keys between users, categories and tickets;
- indexes for email, role, ticket status, priority, category, dates and assignment lookups;
- check constraints for role, status and priority values;
- the eight initial categories: Wi-Fi, Smart Board, Electrical, Computer Lab, Network, Classroom,
  Internet, Other.

Hibernate `ddl-auto` defaults to `update` so the application can start against a new database. For
controlled production deployments, run `schema.sql` first and set `DB_DDL_AUTO=validate`.

---

## 9. Optional Gemini AI

- The API key is used only by the Spring Boot backend; it is never sent to the browser.
- The frontend calls `POST /api/ai/suggest` only when the student clicks **Get AI suggestion**.
- The backend validates the returned category against active categories and the priority against
  the `Priority` enum, truncates long text, and returns `available: false` with a helpful note when
  AI is disabled or fails.
- Suggestions are labelled **“AI suggestion — for review only”**. The student must apply or ignore
  them; the final category and priority are always a human decision.
- AI failure never blocks complaint submission.
- A live Gemini key is not included in this repository, so the live AI path is configurable but was
  not exercised against Google in the build environment.

---

## 10. Testing and verification

### Backend

```bash
cd backend
mvn test
```

Verified result in the build environment:

```text
Tests run: 6, Failures: 0, Errors: 0, Skipped: 0
```

The integration suite covers health/database status, student registration/login/profile, validation
failures, JWT protection, the complete ticket workflow (create → assign → progress → comment →
resolve → history), role restrictions, Main Admin admin creation, account deactivation, reports and
CSV export.

`mvn package` also succeeds and produces the executable
`backend/target/campuscare-backend-1.0.0.jar` (62.8 MB) with the same six tests passing. On a
Windows/OneDrive path, a transient file lock can prevent `clean` from deleting `target/classes`; close
any process holding the directory and retry.

The suite runs on H2 in MySQL compatibility mode. **A live MySQL 8 connection was not available in
the build environment**, so the MySQL schema and runtime connection must be verified on a machine
with MySQL installed.

### Frontend

```bash
cd frontend
npm ci        # or npm install
npm run build
```

The production build completes successfully and outputs `frontend/dist`.

### Deployment status

The Vercel project is preserved and configured by the root `vercel.json`. The frontend build is
verified locally. **The live Vercel deployment and the live backend URL were not updated in this
environment because they require the repository owner’s Vercel/Render/MySQL credentials.** Follow
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## 11. Security notes

- Public registration always creates `STUDENT`; role cannot be supplied by the client.
- Passwords are BCrypt-hashed and never serialised to the frontend.
- JWT is signed with `JWT_SECRET` and stored in `sessionStorage` (cleared on tab close).
- A `401` clears the session and dispatches an event that returns the user to the correct login page.
- Method-level role rules protect `/api/admin/**` (ADMIN/MAIN_ADMIN) and `/api/main-admin/**`
  (MAIN_ADMIN only).
- Students can only read their own tickets; another student’s ticket returns `404`.
- Status transitions, assignment targets, account deactivation and category changes are validated
  server-side.
- Error responses never include stack traces or SQL details.
- CORS origins come from `FRONTEND_ORIGIN`; wildcard credentials are not used.

Before production, also:

- rotate the JWT secret and database password;
- restrict MySQL network access and use a least-privilege database user;
- serve the backend over HTTPS;
- keep `MAIN_ADMIN_PASSWORD` out of long-lived environments after bootstrap;
- add rate limiting at the reverse proxy if the API is publicly exposed.

---

## 12. Documentation

| Document | Contents |
| --- | --- |
| [`PROJECT_AUDIT.md`](PROJECT_AUDIT.md) | Initial repository audit, defects found, rebuild decisions, requirement traceability, verified vs unverified |
| [`DEVELOPMENT_PROGRESS.md`](DEVELOPMENT_PROGRESS.md) | Phase-by-phase implementation log and current verification status |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | MySQL, backend and Vercel deployment runbook with troubleshooting |
| [`docs/ACADEMIC_DOCUMENTATION.md`](docs/ACADEMIC_DOCUMENTATION.md) | Abstract, objectives, scope, architecture, ER model, modules, testing and future scope |
| [`docs/VIVA_QUESTIONS.md`](docs/VIVA_QUESTIONS.md) | 20 Java/Spring Boot/React viva questions with model answers |

---

## 13. Author

**V. Dinesh Kartheek**  
Centurion University of Technology and Management, Vizianagaram

Academic project — CampusCare Smart Campus Help Desk Management System.
