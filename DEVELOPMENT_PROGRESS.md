# DEVELOPMENT PROGRESS — CampusCare Smart Campus Help Desk

**Project:** CampusCare — Smart Campus Help Desk Management System  
**Repository:** `CAMPUS-HELP-DESK-`  
**Branch:** `main`  
**Author:** V. Dinesh Kartheek — Centurion University of Technology and Management, Vizianagaram  
**Last updated:** 16 November 2026

---

## 1. Current status

| Area | Status | Evidence |
| --- | --- | --- |
| Backend source | Complete | Java 21 / Spring Boot 3.5.16 application under `backend/` |
| Database schema | Complete | MySQL 8 script with six tables, FKs, indexes, checks and category seeds |
| Frontend source | Complete | React 18 / Vite 5 application under `frontend/` |
| Backend automated tests | Passing | `Tests run: 6, Failures: 0, Errors: 0` on H2 |
| Backend packaging | Passing | `mvn package` → `target/campuscare-backend-1.0.0.jar` |
| Frontend production build | Passing | `npm run build` → `frontend/dist` |
| Documentation | Complete | README, audit, progress, deployment, academic and viva documents |
| Live MySQL verification | Pending | MySQL server/client unavailable in this environment |
| Live backend deployment | Pending | Requires hosting credentials |
| Live Vercel deployment | Pending | Requires Vercel account access and backend URL |
| Live Gemini verification | Pending | No Gemini API key available |
| Browser E2E regression | Pending | Build verified; no Playwright/Cypress suite installed |

The implementation is structurally complete and demonstrable with the H2 `dev` profile. The items
marked **Pending** depend on external accounts, a database server or a browser session and are
therefore not claimed as verified.

---

## 2. Starting point

The repository contained:

- a two-line placeholder `README.md`;
- a single initial commit (`63d2ebd`);
- no backend, frontend, database script, tests or deployment configuration.

Because there was no application code to preserve, the system was implemented from scratch at the
repository root. The only pre-existing deployment expectation — a Vercel project rooted at the
repository — was preserved through the root `vercel.json`.

---

## 3. Phase-by-phase log

### Phase 0 — Audit and environment check

- Inspected the repository, Git history and available toolchain.
- Confirmed Java 26 runtime is installed (project targets Java 21), Node.js 24 and npm are available.
- Downloaded Apache Maven 3.9.16 to a temporary tools directory because Maven is not installed
  system-wide.
- Confirmed MySQL, the MySQL CLI and Docker are unavailable, which determined the H2-based
  verification strategy.
- Identified the `CAMPUSCARE_BACKEND_URL` defect: Vite only exposes `VITE_`-prefixed variables to
  browser code. The frontend convention was standardised on `VITE_API_URL`.

### Phase 1 — Backend foundation

- Created the Maven project with Spring Boot 3.5.16, Java 21 target, Web, JPA, Security, Validation,
  MySQL, H2, JJWT 0.12.6 and test dependencies.
- Implemented entities: `User`, `Category`, `Ticket`, `TicketComment`, `TicketAssignment`,
  `TicketStatusHistory`; enums: `Role`, `TicketStatus`, `Priority`.
- Added repositories with paginated search, status counts, assignment lookups and report queries.
- Added request/response DTO records and a mapper so entities are never exposed over HTTP.
- Added a consistent error contract through `ApiException` and `GlobalExceptionHandler`.

### Phase 2 — Security and authentication

- Implemented stateless JWT authentication: `JwtService`, `JwtAuthenticationFilter`,
  `CustomUserDetailsService`, `UserPrincipal`.
- Added BCrypt password hashing and a `DaoAuthenticationProvider`.
- Added URL-level authorization:
  - public: health, register, login;
  - authenticated: student endpoints and categories;
  - `ADMIN` or `MAIN_ADMIN`: `/api/admin/**`;
  - `MAIN_ADMIN` only: `/api/main-admin/**`.
- Added JSON `401`/`403` handlers instead of HTML error pages.
- Public registration ignores any client role and always creates `STUDENT` accounts.
- Production fails fast when `JWT_SECRET` is missing; `dev` and `test` profiles generate an
  ephemeral secret.

### Phase 3 — Ticket workflow

- Implemented student complaint creation with category, priority, title, description and location.
- Added collision-safe ticket numbers in the form `CC-YYYY-XXXXXXXX`.
- Implemented personal ticket listing, statistics, detail, history and comments.
- Implemented administrator queue filtering by status, category, priority, assignee, date and text.
- Implemented validated status transitions:

  ```text
  SUBMITTED   → ASSIGNED | IN_PROGRESS | REJECTED
  ASSIGNED    → IN_PROGRESS | RESOLVED | REJECTED
  IN_PROGRESS → RESOLVED | REJECTED
  RESOLVED    → CLOSED | IN_PROGRESS
  CLOSED      → IN_PROGRESS
  REJECTED    → ASSIGNED | IN_PROGRESS
  ```

- Every transition writes `ticket_status_history`; every assignment writes `ticket_assignments`
  and deactivates the previous active assignment.
- Added comments and CSV export for the filtered queue.

### Phase 4 — Main Administrator module

- Added institution dashboard statistics (ticket counts plus students, administrators and
  categories).
- Added user directory filtered by role and text.
- Added secure creation of `ADMIN` and `MAIN_ADMIN` accounts; students remain restricted to public
  registration.
- Added account activation/deactivation with protection against self-deactivation and removing the
  last active Main Administrator.
- Added category create/edit/activate/deactivate with duplicate-name protection.
- Added confidential date-range reporting: totals, status/category/priority distributions and
  administrator performance, plus CSV export.

### Phase 5 — Optional Gemini integration

- AI is backend-only; the key never reaches the browser.
- `POST /api/ai/suggest` builds a constrained prompt from active categories and the `Priority` enum.
- Responses are validated against active categories and allowed priorities, and free text is
  truncated.
- Failures return `available: false` with a note; ticket submission never depends on AI.
- The UI labels every result as an AI suggestion requiring human confirmation.
- Because no API key was available, only the disabled/fallback path is exercised in this environment.

### Phase 6 — Frontend implementation

- Built a React 18 + Vite 5 application with React Router 6.
- Centralised all HTTP access in `frontend/src/services/api.js`:
  - `VITE_API_URL` base URL resolution;
  - JWT header injection;
  - JSON parsing and normalised errors;
  - protected CSV downloads;
  - `401` session clearing and a global unauthorized event.
- Added `AuthContext` (session restore via `/api/auth/me`) and `ToastContext`.
- Added role-aware `Layout`, `ProtectedRoute`, shared UI primitives and a custom navy/white design
  system with IBM Plex Sans.
- Implemented all student, administrator and Main Administrator pages, including loading, empty and
  error states.
- Added a student-facing complaint form with optional AI suggestions and a role-mirrored status
  transition control for administrators.

### Phase 7 — Database and deployment configuration

- Wrote `database/schema.sql` for MySQL 8:
  - `users`, `categories`, `tickets`, `ticket_comments`, `ticket_assignments`,
    `ticket_status_history`;
  - utf8mb4, InnoDB, unique keys, foreign keys, indexes and check constraints;
  - the eight initial categories.
- Added root `vercel.json` that installs and builds `frontend/`, publishes `frontend/dist`, rewrites
  SPA routes and adds security headers.
- Added `frontend/vercel.json` for directory-level deployment.
- Added root, backend and frontend `.env.example` files and a `.gitignore` that excludes secrets,
  build output, H2 data and IDE files.

### Phase 8 — Verification and documentation

- Ran backend tests and captured the passing result.
- Ran the frontend production build and captured the bundle output.
- Wrote `README.md`, `PROJECT_AUDIT.md`, this progress log, the deployment runbook, academic
  documentation and 20 viva questions.

---

## 4. Verification ledger

| Check | Command | Result |
| --- | --- | --- |
| Backend test suite | `mvn test` (Java 21 target) | **Pass** — 6 tests, 0 failures, 0 errors |
| Backend packaging | `mvn package` | **Pass** — executable JAR produced; 6 tests passed |
| Frontend install | `npm install` | **Pass** |
| Frontend production build | `npm run build` | **Pass** — 59 modules, `dist/` produced |
| H2 health endpoint | Integration test | **Pass** — application and database `UP` |
| Registration/login/profile | Integration test | **Pass** |
| Validation/password mismatch | Integration test | **Pass** |
| JWT protection | Integration test | **Pass** |
| Full ticket workflow | Integration test | **Pass** |
| Invalid status transition | Integration test | **Pass** |
| Role restrictions | Integration test | **Pass** |
| Main Admin user creation/deactivation | Integration test | **Pass** |
| Reports and CSV export | Integration test | **Pass** |

### Test coverage themes

`backend/src/test/java/com/campuscare/CampusCareIntegrationTest.java` covers:

1. `healthEndpointReportsDatabaseUp`
2. `studentRegistrationLoginAndProfileWork`
3. `passwordMismatchAndValidationAreRejected`
4. `protectedEndpointsRequireValidToken`
5. `completeTicketWorkflowWithAdminAndMainAdmin`
6. `invalidStatusTransitionIsRejected`

The fifth test exercises registration, login, ticket creation, administrator assignment, progress,
comments, resolution, history, Main Admin account creation, account deactivation, reports and CSV
export in a single end-to-end flow.

> **Environment note:** the first `mvn clean package` attempt on this Windows/OneDrive path hit a
> transient file lock while deleting `target/classes`. An immediate `mvn package` succeeded, ran all
> six tests and produced `target/campuscare-backend-1.0.0.jar`. This was an environment file-lock
> issue, not a compilation or test failure. Close any process holding `backend/target` before
> cleaning on a similar setup.

---

## 5. Decisions and deviations

| Decision | Reason |
| --- | --- |
| Rebuilt at repository root instead of a subdirectory | The repository was empty apart from the README and the Vercel project is rooted there |
| Spring Boot 3.5.16 | Current stable 3.x line compatible with Java 21 |
| H2 for dev/test, MySQL for production | MySQL/Docker were unavailable; H2 keeps the project demonstrable and tests isolated |
| `VITE_API_URL` instead of `CAMPUSCARE_BACKEND_URL` | Vite only exposes `VITE_` variables to browser code |
| Root `vercel.json` builds `frontend/` | Preserves the existing Vercel project structure |
| Students-only public registration | Prevents privilege escalation through the public API |
| Env-based Main Admin bootstrap instead of a seed password | No hardcoded credentials in the repository |
| AI suggestions are preview-only | Keeps classification under human control and avoids blocking submissions |
| Custom CSS instead of a UI framework | Full control over the IBM-inspired design with no extra runtime dependency |
| `sessionStorage` for the JWT | Token clears when the tab closes; reduces persistence on shared machines |
| No localhost fallback in production builds | Prevents a silently broken production deployment |

---

## 6. Environment-dependent work still open

These items cannot be completed truthfully without the relevant external services:

1. **MySQL 8 verification** — run `database/schema.sql`, start the backend against
   `helpdesk_db`, and confirm `/api/health`, registration, ticket creation and reports.
2. **Backend hosting** — deploy the JAR (or a container) over HTTPS and record the public URL.
3. **Vercel environment** — set `VITE_API_URL` to the deployed backend and redeploy.
4. **CORS** — set `FRONTEND_ORIGIN` to the exact Vercel production origin (and preview origins if
   required).
5. **Main Admin bootstrap** — set the bootstrap variables once, sign in, then remove the password.
6. **Gemini** — set `GEMINI_API_KEY` and exercise the suggestion endpoint.
7. **Browser regression** — walk through student, administrator and Main Administrator flows on a
   workstation or add Playwright/Cypress smoke tests.
8. **Hardening** — add rate limiting and CSV formula escaping before public exposure.

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the step-by-step runbook.

---

## 7. Recommended release checklist

- [ ] `cd backend && mvn clean package` succeeds; JAR starts against MySQL.
- [ ] `database/schema.sql` applied; `DB_DDL_AUTO=validate` works.
- [ ] `/api/health` returns `status=UP` and `database=UP` on the host.
- [ ] `FRONTEND_ORIGIN` matches the deployed frontend exactly.
- [ ] `VITE_API_URL` is set in Vercel and the redeploy succeeded.
- [ ] Student registration, login and complaint submission work in the browser.
- [ ] Administrator assignment, status changes, comments and CSV export work.
- [ ] Main Administrator user/category management and reports work.
- [ ] Main Admin bootstrap password removed from the environment.
- [ ] JWT secret and database password rotated for production.
- [ ] 401 expiry returns the user to the correct login page.
- [ ] Mobile layout checked at 360 px, 768 px and desktop widths.
- [ ] No secrets committed (`git status`, `.gitignore` review).

---

## 8. Repository deliverable summary

| Path | Purpose |
| --- | --- |
| `backend/` | Spring Boot REST API, security, services, tests, profiles |
| `frontend/` | React SPA, API client, role-based routes, design system |
| `database/schema.sql` | MySQL 8 production schema and seeds |
| `README.md` | Project overview, setup, API, security and verification status |
| `PROJECT_AUDIT.md` | Initial audit, defects, traceability and verification matrix |
| `DEVELOPMENT_PROGRESS.md` | This implementation log |
| `docs/DEPLOYMENT.md` | MySQL, backend and Vercel deployment runbook |
| `docs/ACADEMIC_DOCUMENTATION.md` | Academic report content |
| `docs/VIVA_QUESTIONS.md` | 20 Java/Spring Boot/React viva questions and answers |
| `.env.example` files | Environment variable templates |
| `vercel.json` | Root Vercel build configuration |
