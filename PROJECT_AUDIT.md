# PROJECT AUDIT — CampusCare Smart Campus Help Desk

**Repository:** `CAMPUS-HELP-DESK-`  
**Branch audited:** `main`  
**Audit date:** 16 November 2026  
**Auditor:** Implementation pass performed directly in the repository  
**Author:** V. Dinesh Kartheek — Centurion University of Technology and Management, Vizianagaram

---

## 1. Executive summary

The repository was a near-empty academic placeholder: a two-line `README.md` and an initial commit,
with no backend, frontend, database script, tests or deployment configuration. There was no existing
application behaviour to repair, so the system was rebuilt from scratch at the repository root.

The delivered system is a complete Java 21 / Spring Boot 3.5.16 / MySQL 8 / React 18 application
covering student, administrator and Main Administrator portals, JWT security, a validated ticket
workflow, audit history, comments, assignments, category management, user management, confidential
reports and CSV exports.

The backend compiles, packages into an executable JAR and its six end-to-end integration tests pass on
H2. The frontend production build succeeds. Live MySQL connectivity, the live Gemini call and the
public Vercel backend URL could not be exercised in this environment because MySQL, a Gemini key and
hosting credentials were not available. These items are explicitly listed as unverified and are
covered by the deployment runbook.

---

## 2. Initial state

| Area | Finding | Severity |
| --- | --- | --- |
| Source code | No backend or frontend source existed | Blocker |
| Build files | No `pom.xml`, `package.json` or lockfile | Blocker |
| Database | No schema, seed data or migration script | Blocker |
| Authentication | No authentication or authorization implementation | Blocker |
| API | No REST endpoints | Blocker |
| Tests | No automated tests | High |
| Environment documentation | No `.env.example` or configuration guidance | High |
| Deployment | No checked-in Vercel configuration in the repository | High |
| Documentation | Two-line README only | Medium |
| Git history | One initial commit; all delivered work is new | Informational |

### 2.1 Environment convention defect

The task brief referred to a backend URL variable named `CAMPUSCARE_BACKEND_URL`. Vite only exposes
environment variables prefixed with `VITE_` to browser code. A variable without that prefix is
therefore silently unavailable at build time, and any frontend that relies on it would fall back to
localhost or an empty URL in production.

**Resolution:** the frontend now uses `VITE_API_URL` exclusively, centralised in
`frontend/src/services/api.js` and documented in `frontend/.env.example`, the root `.env.example`,
the README and the deployment guide. Production deliberately has no localhost fallback.

---

## 3. Requirements traceability

| Requirement | Implementation | Status |
| --- | --- | --- |
| Java 21 target, Spring Boot 3, Maven | `backend/pom.xml` (`java.version=21`, Spring Boot 3.5.16) | Implemented, compiled |
| Spring Web, JPA, Security, Validation | Starters in `pom.xml`; layered controllers/services/repositories | Implemented |
| JWT authentication + BCrypt | `JwtService`, `JwtAuthenticationFilter`, `SecurityConfig`, `BCryptPasswordEncoder` | Implemented, tested |
| MySQL 8 database `helpdesk_db` | `database/schema.sql`, MySQL JDBC configuration | Script delivered; live MySQL unverified |
| Roles `STUDENT`, `ADMIN`, `MAIN_ADMIN` | `Role` enum, DB check constraint, route rules | Implemented, tested |
| Public registration creates only students | `AuthService.register` forces `STUDENT`; role not accepted from the client | Implemented, tested |
| Admins provisioned securely | Main Admin can create ADMIN/MAIN_ADMIN; optional env bootstrap; no hardcoded passwords | Implemented, tested |
| Six required tables | `users`, `categories`, `tickets`, `ticket_comments`, `ticket_assignments`, `ticket_status_history` | Implemented |
| Six required statuses | `TicketStatus` enum + DB check constraint | Implemented, tested |
| Eight initial categories | `DataInitializer` + `schema.sql` seed inserts | Implemented |
| Health, auth, ticket, admin and main-admin APIs | Controllers listed in README/API overview | Implemented, tested where applicable |
| Responsive navy/white IBM-inspired design | `frontend/src/styles.css`, IBM Plex Sans, responsive breakpoints | Implemented, built |
| All required pages | 17 routes/components covering landing, auth, student, admin and main-admin flows | Implemented |
| Functional buttons, real API data | Every page calls the central API client; no static mock records | Implemented |
| Loading/error handling | Shared `Spinner`, `LoadingScreen`, `ErrorBanner`, `EmptyState`, toasts | Implemented |
| Token expiry handling | `401` clears session and dispatches `campuscare:unauthorized` | Implemented |
| Central API service with `VITE_API_URL` | `frontend/src/services/api.js` | Implemented |
| Optional Gemini AI, backend only, validated, non-blocking | `AiService`, `GeminiClient`, `/api/ai/suggest` | Implemented; live Gemini unverified |
| Preserve existing Vercel deployment | Root `vercel.json` builds `frontend/` and outputs `frontend/dist` | Implemented; live deploy requires credentials |
| Correct backend URL/environment convention | `VITE_API_URL` replaces unusable non-prefixed naming | Implemented |
| `PROJECT_AUDIT.md`, `DEVELOPMENT_PROGRESS.md`, `README.md` | This file, progress log and README | Implemented |
| `.env.example` | Root, backend and frontend example files | Implemented |
| `database/schema.sql` | Full MySQL 8 schema with constraints and seeds | Implemented |
| Deployment and academic documentation | `docs/DEPLOYMENT.md`, `docs/ACADEMIC_DOCUMENTATION.md` | Implemented |
| 20 Java viva Q&A | `docs/VIVA_QUESTIONS.md` | Implemented |
| Run backend tests and frontend build | 6/6 tests pass; production build succeeds | Verified locally |
| Never claim untested features work | Verification matrix below separates verified and unverified | Honoured |

---

## 4. Architecture decisions

### 4.1 Backend

- **Layered architecture:** controller → service → repository → entity, with DTO records at the API
  boundary. Entities are never returned directly.
- **Stateless security:** JWT in the `Authorization` header; no server session. `401` and `403` are
  rendered as JSON by custom entry point/access-denied handlers.
- **Role rules in one place:** URL-pattern rules in `SecurityConfig`, reinforced by service-level
  ownership and workflow checks.
- **Workflow integrity:** valid status transitions are defined and enforced in `AdminService`.
  Every transition and assignment writes an audit row.
- **Ticket numbers:** `CC-YYYY-XXXXXXXX` using `SecureRandom` and a collision retry loop.
- **Error contract:** `GlobalExceptionHandler` returns consistent `timestamp/status/error/message/path`
  bodies with optional `fieldErrors`, and never exposes stack traces.
- **Startup safety:** production fails fast if `JWT_SECRET` is missing; demo accounts require an
  explicit `DEMO_PASSWORD`; bootstrap Main Admin requires explicit email and password.
- **Profile separation:** MySQL is the normal profile. A `dev` H2 profile supports demos without a
  database server. Tests use an isolated H2 profile.

### 4.2 Frontend

- **Central API client:** one module owns base URL resolution, headers, JSON parsing, CSV downloads,
  error normalisation and 401 handling.
- **Session model:** token in `sessionStorage`; `AuthContext` restores the user via `/api/auth/me`;
  protected routes redirect to the correct role-specific login page.
- **Role-aware shell:** one `Layout` renders navigation based on the authenticated role, with a
  mobile drawer and accessible controls.
- **Server as source of truth:** the UI mirrors allowed status transitions but the backend remains
  authoritative. The UI never invents ticket or user records.
- **Shared primitives:** `UI.jsx` centralises headers, cards, badges, spinners, empty/error states,
  pagination and form fields to keep all pages visually consistent.
- **No CSS framework dependency:** hand-written CSS gives a distinctive IBM-inspired navy/white
  system without adding runtime weight.

### 4.3 Deployment

- The root `vercel.json` installs and builds `frontend/`, publishes `frontend/dist`, rewrites all
  routes to `index.html` and adds security headers. This preserves the existing Vercel project
  structure where the repository root is the deployment root.
- `frontend/vercel.json` supports deploying the frontend directory directly as an alternative.
- The backend is deployment-provider agnostic (Render, Railway, Fly.io, Azure, a Java host or a VM).
  `DATABASE_URL`-style providers may need the JDBC URL adapted; see `docs/DEPLOYMENT.md`.

---

## 5. Security review

| Control | Assessment |
| --- | --- |
| Password storage | BCrypt; password hash excluded from every DTO |
| Public registration privilege escalation | Prevented: role is not part of the public request |
| JWT secret handling | Environment variable; production startup fails without it |
| JWT expiry | Configurable; expired/invalid tokens produce `401` |
| Route authorization | `/api/admin/**` ADMIN/MAIN_ADMIN; `/api/main-admin/**` MAIN_ADMIN |
| Ticket object authorization | Students receive `404` for another student’s ticket |
| Status transition abuse | Rejected server-side |
| Assignment abuse | Only active ADMIN/MAIN_ADMIN accounts can be assigned |
| Account lockout | Self-deactivation and last-Main-Admin deactivation blocked |
| SQL injection | Spring Data JPA parameter binding; no string-concatenated SQL |
| XSS | React escapes rendered values; no `dangerouslySetInnerHTML` |
| CORS | Explicit origins from `FRONTEND_ORIGIN`, credentials allowed only for listed origins |
| Secret leakage | No real keys, passwords or database credentials committed |
| Error leakage | No stack traces or SQL details returned |
| AI key exposure | Backend-only; browser never receives the Gemini key |
| CSV injection | Values are written with standard quoting; see residual risk below |

### Residual security risks

1. **CSV formula injection:** a student-controlled title beginning with `=`, `+`, `-` or `@` may be
   interpreted as a formula when opened in some spreadsheet clients. This is a low-severity residual
   risk for an academic deployment; production hardening should prefix such cells with an apostrophe.
2. **No rate limiting:** login and AI endpoints rely on the reverse proxy for brute-force protection.
3. **No password reset/change flow:** the brief did not require it; deactivated accounts and password
   resets are currently administrative actions.
4. **No refresh tokens:** a 24-hour JWT is used; expiry forces a new login.
5. **No automated frontend tests:** the build is verified, but browser E2E tests are a future task.

---

## 6. Verification matrix

### Verified in this environment

| Check | Command / evidence | Result |
| --- | --- | --- |
| Backend compiles | `mvn test` (Java 21 target) | Pass |
| Backend integration tests | `Tests run: 6, Failures: 0, Errors: 0, Skipped: 0` | Pass |
| Backend JAR packaged | `mvn package` → `target/campuscare-backend-1.0.0.jar` | Pass |
| Health endpoint | Integration test asserts `status=UP`, `database=UP` | Pass (H2) |
| Registration/login/profile | Integration test | Pass |
| Validation and password mismatch | Integration test | Pass |
| JWT protection | Integration test | Pass |
| Full ticket workflow, assignment, history, comments | Integration test | Pass |
| Role restrictions | Integration test | Pass |
| Main Admin user creation and deactivation | Integration test | Pass |
| Reports and CSV export | Integration test | Pass |
| Frontend dependency install | `npm install` | Pass |
| Frontend production build | `npm run build` → `dist/` | Pass |

### Not verified in this environment

| Item | Reason | Required action |
| --- | --- | --- |
| Live MySQL 8 connection | MySQL server/client and Docker unavailable | Run `schema.sql` and start the backend against MySQL; verify `/api/health` |
| Live Vercel deployment | Requires repository owner’s Vercel account | Configure `VITE_API_URL` and redeploy |
| Live backend hosting | Requires hosting account | Deploy the JAR/container and set environment variables |
| Live Gemini suggestion | No API key | Set `GEMINI_API_KEY` and exercise **Get AI suggestion** |
| Browser visual/E2E regression | No browser automation dependency in the project | Run the app and walk through each role on a workstation |
| Production HTTPS/CORS combination | Depends on deployed origins | Set `FRONTEND_ORIGIN` to the exact Vercel URL |

---

## 7. Page inventory

| # | Route | Component | Role |
| --- | --- | --- | --- |
| 1 | `/` | `LandingPage` | Public |
| 2 | `/login` | `LoginPage` (student variant) | Public |
| 3 | `/admin/login` | `LoginPage` (admin variant) | Public |
| 4 | `/main-admin/login` | `LoginPage` (main-admin variant) | Public |
| 5 | `/register` | `RegisterPage` | Public |
| 6 | `/student` | `StudentDashboard` | Student |
| 7 | `/student/submit` | `SubmitComplaintPage` | Student |
| 8 | `/student/tickets` | `MyTicketsPage` | Student |
| 9 | `/student/tickets/:id` | `TicketDetailPage` | Student |
| 10 | `/student/profile` | `ProfilePage` | Student |
| 11 | `/admin` | `AdminDashboard` | Administrator |
| 12 | `/admin/tickets` | `AdminTicketsPage` | Administrator |
| 13 | `/admin/tickets/:id` | `AdminTicketDetailPage` | Administrator |
| 14 | `/main-admin` | `MainAdminDashboard` | Main Administrator |
| 15 | `/main-admin/tickets` | `AdminTicketsPage` | Main Administrator |
| 16 | `/main-admin/tickets/:id` | `AdminTicketDetailPage` | Main Administrator |
| 17 | `/main-admin/users` | `MainAdminUsersPage` | Main Administrator |
| 18 | `/main-admin/categories` | `MainAdminCategoriesPage` | Main Administrator |
| 19 | `/main-admin/reports` | `ReportsPage` | Main Administrator |
| 20 | `/main-admin/profile`, `/admin/profile` | `ProfilePage` | Administrator roles |
| 21 | `*` | `NotFoundPage` | Public |

The three role-specific login routes share one component with different portal copy, which keeps the
auth implementation consistent while still presenting distinct entry points.

---

## 8. Known limitations

- Public registration is open to anyone with a valid email format; email ownership is not verified
  (no mail service in scope).
- There is no password reset, password change or profile editing flow.
- The user directory is returned as a single list rather than paginated. This is acceptable for a
  campus-scale dataset but should be paginated if accounts grow into the thousands.
- The Main Admin dashboard reuses the administrator statistics endpoint plus user/category counts.
- Reports are generated on demand; there is no scheduled report archive.
- CSV exports are streamed on demand and not persisted.
- Dark mode is not offered; the design is intentionally a light navy/white institutional system.

---

## 9. Recommendation

The project is structurally complete and demonstrable on the H2 dev profile. Before presenting it as
a production deployment:

1. Run the full workflow against MySQL 8 using `database/schema.sql`.
2. Deploy the backend over HTTPS and set `FRONTEND_ORIGIN` to the Vercel URL.
3. Set `VITE_API_URL` in Vercel and redeploy the frontend.
4. Bootstrap the first Main Administrator, then remove the bootstrap password.
5. Add rate limiting and CSV formula escaping at the proxy/service layer.
6. Add Playwright/Cypress smoke tests for the three portals.
