# DEVELOPMENT PROGRESS — CAMPUSCARE v2 (Sky Glass)

**Project:** CAMPUSCARE — Smart Campus Help Desk  
**Repository:** `CAMPUS-HELP-DESK-`  
**Branch:** `main`  
**Author:** V. Dinesh Kartheek — Centurion University of Technology and Management, Vizianagaram  
**Last updated:** 16 November 2026

---

## 1. Current status

| Area | Status | Evidence |
| --- | --- | --- |
| API/database/design contract | Complete | `docs/REBUILD_CONTRACT.md` |
| MySQL 8 schema | Complete | `database/schema.sql` (5 tables, FKs, checks, indexes) |
| MySQL demo data | Complete | `database/sample_data.sql` |
| Backend source | Complete | Spring Boot 3.5 / Java 21 / JdbcTemplate under `backend/` |
| Frontend source | Complete | React 18 / Vite 5 / Sky Glass under `frontend/` |
| Backend automated tests | See ledger | `mvn test` on H2 |
| Backend packaging | See ledger | `mvn package` |
| Frontend production build | See ledger | `npm run build` |
| Local smoke test | See ledger | Backend + frontend running |
| Live MySQL verification | Pending | MySQL server/client unavailable in this environment |
| Live backend deployment | Pending | Requires hosting credentials |
| Live Vercel deployment | Pending | Requires Vercel access + backend URL |
| Browser E2E regression | Pending | No Playwright/Cypress suite |

---

## 2. Phase log

### Phase 0 — Revised brief and contract

- Re-read the new Sky Glass/JdbcTemplate/MySQL brief.
- Audited the v1 implementation (JPA, tickets, `helpdesk_db`, light UI) and identified every
  required change: persistence, schema, statuses, categories, routes, windows, confidential
  reports, admin management, analytics, design system and env variable.
- Wrote `docs/REBUILD_CONTRACT.md` first so both application halves implement identical paths,
  JSON shapes, enums, security rules and design tokens.
- Stopped the running v1 servers; v1 remains recoverable from git history.

### Phase 1 — Database design

- Designed `campuscare_db` with `users`, `complaints`, `complaint_history`, `support_reports` and
  `notifications`.
- Added primary keys, foreign keys, unique email/codes/student id, check constraints, indexes and
  cascade rules.
- Added `database/sample_data.sql` with demo users (BCrypt hash), complaints, histories, support
  reports and notifications. Demo password: `CampusCare@123`.
- Added `backend/uploads/` to `.gitignore`.

### Phase 2 — Backend rebuild (JdbcTemplate)

- Removed the JPA/Hibernate design (entities, Spring Data repositories, ticket model).
- Implemented `JdbcTemplate` repositories with prepared statements, row mappers and
  `GeneratedKeyHolder` inserts.
- Added complaint/history/support-report/notification models and enums with display labels.
- Added layered services for auth, students, complaints, admins, main admin, support reports,
  analytics and notifications.
- Added JWT security, BCrypt, CORS, JSON 401/403 handlers, ownership checks and role rules.
- Added multipart attachment upload/download with type/size validation.
- Added H2 development schema, demo bootstrap and H2 integration-test schema.
- Added integration tests covering auth, roles, complaints, workflow, confidentiality, admin
  management, analytics and validation.

### Phase 3 — Frontend rebuild (Sky Glass)

- Replaced the v1 React source with the role-prefixed SPA.
- Added `lucide-react` and `recharts`.
- Built the split-screen login, registration and all student/admin/main-admin pages.
- Added reusable glass UI components: layout, sidebar, stat cards, tables, modals, badges,
  skeletons, empty/error states, toasts and charts.
- Centralised API access in `src/api/client.js` using `VITE_API_BASE_URL`; no fake production data.
- Implemented token storage (session/local), `/api/auth/me` session restore, 401 handling,
  protected routes and responsive navigation.
- Rewrote `styles.css` with the full Sky Glass palette, blur, glow, gradient background animation,
  hover lift and responsive breakpoints.

### Phase 4 — Deployment and documentation

- Kept the Vercel root configuration building `frontend/`.
- Updated `.env.example` for MySQL/JWT/CORS/uploads/bootstrap/demo and `VITE_API_BASE_URL`.
- Rewrote deployment, academic, viva, README and audit documentation.
- Removed obsolete Gemini/ticket/JPA instructions from the current documentation.

### Phase 5 — Verification

- Backend test suite, packaging, frontend build and local smoke test results are recorded below.
- MySQL, live hosts and browser E2E remain environment-dependent.

---

## 3. Files and conventions

- Backend package root: `com.campuscare`.
- API envelope: `{success, message, data, timestamp}`.
- Enums: `Role`, `ComplaintStatus`, `Priority`, `ComplaintCategory`, `SupportCategory`,
  `SupportStatus`.
- IDs: `CC-YYYY-XXXXXXXX` (complaints), `SR-YYYY-XXXXXXXX` (support reports).
- Auth: JWT in `Authorization: Bearer`, BCrypt hashes, active flag checked per request.
- Frontend API base: `VITE_API_BASE_URL`; no hardcoded backend URLs.
- Frontend storage: `sessionStorage` by default, `localStorage` with Remember me.

---

## 4. Verification ledger

> Updated only with commands actually run. Environment: Windows/PowerShell, Java 26 runtime
> targeting Java 21, downloaded Maven 3.9.16, Node 24, H2 for tests.

| # | Check | Command | Result |
| --- | --- | --- | --- |
| 1 | Backend tests | `mvn test` | **PENDING — recorded after run** |
| 2 | Backend package | `mvn package -DskipTests` | **PENDING — recorded after run** |
| 3 | Frontend install/build | `npm install` / `npm run build` | **PENDING — recorded after run** |
| 4 | Health endpoint | `GET /api/health` | **PENDING — recorded after run** |
| 5 | Role logins | student/admin/main-admin | **PENDING — recorded after run** |
| 6 | Student complaint flow | create/list/detail | **PENDING — recorded after run** |
| 7 | Admin workflow | assign/status/history | **PENDING — recorded after run** |
| 8 | Main admin flow | support report/analytics | **PENDING — recorded after run** |

---

## 5. Remaining credential-dependent work

1. Run `database/schema.sql` and `sample_data.sql` against a real MySQL 8 instance and start the
   backend with `DB_URL`/`DB_USERNAME`/`DB_PASSWORD`.
2. Deploy the backend JAR to a Java 21 host with a persistent upload disk and the environment
   variables in `docs/DEPLOYMENT.md`.
3. Set `VITE_API_BASE_URL` in Vercel and redeploy; verify CORS with the real origin.
4. Perform browser E2E/manual regression on desktop and mobile.
5. Remove demo accounts and rotate all secrets before a real launch.

These are not claimed as verified in this repository.
