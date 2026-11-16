# PROJECT AUDIT — CAMPUSCARE v2 (Sky Glass rebuild)

**Audit date:** 16 November 2026  
**Repository:** `CAMPUS-HELP-DESK-`  
**Branch:** `main`  
**Author:** V. Dinesh Kartheek

---

## 1. Starting point

The repository began with only a two-line placeholder `README.md` and one initial commit
(`63d2ebd`). No application source, database script, tests or deployment configuration existed.

A first full-stack version was implemented and committed (`7d830c3`, plus a JWT dev-profile fix
`b4c1479`). That version used Spring Data JPA, a ticket workflow, the `helpdesk_db` schema and an
IBM-inspired light navy/white interface.

A revised brief then specified a different application: **Sky Glass – Dark Edition**, Spring
**JdbcTemplate** (not JPA), a `campuscare_db` schema, complaint/support-report modules, admin
management, analytics, new API paths and the `VITE_API_BASE_URL` convention. This audit documents
the resulting v2 rebuild.

---

## 2. Rebuild strategy

Because the new brief changes the data model, persistence technology, API paths, state machine,
categories, routes and visual language, the application was rebuilt rather than patched:

| Area | v1 (preserved in git history) | v2 (current) |
| --- | --- | --- |
| Persistence | Spring Data JPA / Hibernate | Spring JDBC / JdbcTemplate prepared statements |
| Database | `helpdesk_db` | `campuscare_db` |
| Core entity | tickets + assignments + comments | complaints + complaint_history + support_reports |
| Statuses | SUBMITTED/ASSIGNED/.../CLOSED | PENDING/IN_PROGRESS/RESOLVED/REJECTED |
| Categories | Wi-Fi, Smart Board, ... | Wi-Fi/Network, Electrical, Hardware, Software, Classroom, Library, Hostel, Washroom, Other |
| Confidential module | none | student support reports, Main Admin only |
| Admin management | user directory + role status | create/edit admins, department, categories, activation |
| Analytics | basic reports | monthly/category/status/priority/workload/resolution |
| Frontend | light IBM-inspired | Sky Glass dark glassmorphism |
| API env var | `VITE_API_URL` | `VITE_API_BASE_URL` |
| Routes | mixed ticket/admin paths | role-prefixed student/admin/main-admin routes |

The authoritative contract is [`docs/REBUILD_CONTRACT.md`](docs/REBUILD_CONTRACT.md). It was written
before implementation so the Java and React sides could be built against one source of truth.

---

## 3. Requirement traceability

### 3.1 Technology

| Requirement | Implementation | Status |
| --- | --- | --- |
| Java 17+ / Spring Boot | Java 21 target, Spring Boot 3.5.16 | Done |
| Spring Web REST API | Layered controllers and services | Done |
| Spring JDBC / JdbcTemplate | All repositories use `JdbcTemplate` + `?` parameters | Done |
| Spring Security + BCrypt | JWT filter, URL rules, BCrypt strength 10 | Done |
| Maven | `backend/pom.xml` | Done |
| MySQL 8 relational design | `database/schema.sql` with PKs/FKs/checks/indexes | Done (script); live MySQL pending |
| React + Vite frontend | React 18 / Vite 5 / Router 6 | Done |
| Responsive UI | CSS variables + mobile drawer/breakpoints | Done |
| Lucide icons | `lucide-react` | Done |
| Vercel frontend / Java backend / hosted MySQL | Root `vercel.json` + deployment guide | Config done; live deployment pending |

### 3.2 UI / design

| Requirement | Implementation | Status |
| --- | --- | --- |
| Sky Glass palette and glass panels | CSS variables + `backdrop-filter: blur(18px)` | Done |
| Rounded, glowing, translucent cards | 16–24 px radii, borders, glow shadows | Done |
| Floating light effects / gradient motion | Animated background blobs | Done |
| Hover lift, fade-in, animated buttons/sidebar | CSS animations/transitions | Done |
| Loading skeletons, toasts | Shared UI components + ToastContext | Done |
| Responsive laptop/tablet/mobile | Sidebar drawer + fluid grids + scrollable tables | Done (manual browser check pending) |
| Avoid neon/clutter | Restrained blue/cyan accents | Done |

### 3.3 Authentication

| Requirement | Implementation | Status |
| --- | --- | --- |
| Split-screen premium login | Branding panel + glass card | Done |
| Role selector (Student/Admin/Main Admin) | Tabs; login sends optional expected role; server verifies | Done |
| Show/hide password, remember me | Implemented; storage strategy switches | Done |
| Validation/loading/errors | Client validation + server field errors + toast | Done |
| Registration fields | Name, email, password, confirm, department, student ID | Done |
| Student-only public registration | Role forced server-side | Done |
| BCrypt, no plaintext | Hashes only; credentials never returned | Done |
| Never trust frontend role | Role loaded from DB on each request | Done |

### 3.4 Student module

| Requirement | Implementation | Status |
| --- | --- | --- |
| Sidebar pages | Dashboard, Submit, My Complaints, Campus Support, Profile, Logout | Done |
| Dashboard stats/charts/recent | Real API data | Done |
| Submit fields + optional attachment | Multipart endpoint with validated file | Done |
| Unique ID, timestamp, PENDING | `CC-YYYY-XXXXXXXX`, DB timestamps, initial history row | Done |
| My Complaints columns/status/remarks | List + filters + pagination + detail | Done |
| Own complaints only | Ownership check returns 404 otherwise | Done |
| Confidential support module | Create/list own; remarks hidden | Done |

### 3.5 Admin module

| Requirement | Implementation | Status |
| --- | --- | --- |
| Sidebar pages | Dashboard, All Complaints, Update Status, Profile, Logout | Done |
| Dashboard stats/charts/recent | Real API data | Done |
| Search/filter/sort/pagination | Server-side SQL with whitelisted sort | Done |
| Table columns and detail | Student, category, priority, remarks, action | Done |
| Assign complaints | Validated active admin assignment | Done |
| Status updates + remarks + history | Four statuses, required remarks, immutable history | Done |
| No confidential access | `/api/main-admin/**` blocked for ADMIN | Done |

### 3.6 Main Admin module

| Requirement | Implementation | Status |
| --- | --- | --- |
| Sidebar pages | Dashboard, complaints, status, admins, support, analytics, profile | Done |
| Dashboard totals + activity | Real API data | Done |
| Add/view/edit/activate/deactivate admin | Create/edit/status endpoints; last-main-admin guard | Done |
| Department + assigned categories | Validated category keys | Done |
| Support reports + confidential remarks | Main-Admin-only list/status update | Done |
| Analytics | Monthly trend, categories, statuses, priorities, workload, resolution | Done |

### 3.7 Backend / API / database

| Requirement | Implementation | Status |
| --- | --- | --- |
| Package structure and layering | config/controller/service/repository/model/dto/security/exception | Done |
| DTOs, validation, errors, HTTP codes, logging | Envelope + handler + SLF4J | Done |
| Exact endpoint groups | See contract/README | Done |
| Five required tables | users, complaints, complaint_history, support_reports, notifications | Done |
| schema.sql + sample_data.sql | MySQL 8 scripts with keys/indexes/checks | Done (execution pending) |
| No plaintext passwords | BCrypt hashes only | Done |
| Frontend uses real API | Central client, no mock data | Done |

### 3.8 Security / deployment

| Requirement | Implementation | Status |
| --- | --- | --- |
| JWT, role rules, ownership | Stateless filter + DB-loaded role + service checks | Done |
| SQL injection protection | Prepared statements; whitelisted sort | Done |
| Server-side validation | Bean Validation + enum parsing + file checks | Done |
| CORS + env configuration | `FRONTEND_ORIGIN`, `VITE_API_BASE_URL` | Done |
| Vercel preserved | Root `vercel.json` builds `frontend/` | Done |
| Hosted MySQL / live backend | Requires owner credentials | Pending |

---

## 4. Key implementation decisions

1. **JdbcTemplate over JPA.** The brief required explicit prepared statements. Repositories keep
   SQL visible and map rows manually; `GeneratedKeyHolder` returns insert ids. Sort strings are
   whitelisted to avoid injection through dynamic SQL.
2. **Four workflow statuses.** `PENDING → IN_PROGRESS → RESOLVED`, with `REJECTED` as an outcome.
   Any status change requires remarks and inserts history; assignments do not invent an extra
   status. This mirrors the brief instead of v1's six-status ticket model.
3. **Separate confidential module.** `support_reports` is an independent table. Students can see
   their own status; only MAIN_ADMIN receives confidential remarks. The normal admin role is
   blocked at the URL layer and by tests.
4. **Enum keys + UI labels.** Categories/priorities/statuses are stored as stable keys and exposed
   with human labels, keeping the database clean and the UI friendly.
5. **JWT with database authority.** The token identifies the user, but every request loads the user
   and `active` flag from MySQL. Role changes/deactivation take effect immediately.
6. **Central frontend API client.** All calls use `VITE_API_BASE_URL`; multipart uploads, JSON
   envelopes, pagination, errors and 401 handling live in one module.
7. **Dev/test parity.** H2 in MySQL mode with `schema-h2.sql` for local demos and integration
   tests; production uses MySQL 8 and the root schema script.
8. **Attachments.** Optional PDF/PNG/JPG up to 5 MB, stored under `UPLOAD_DIR` with random names;
   downloads check ownership/role. Production should use object storage.

---

## 5. Security review

| Risk | Mitigation | Result |
| --- | --- | --- |
| SQL injection | Every query uses `?`; sort whitelist | Addressed |
| Plaintext passwords | BCrypt hashing only | Addressed |
| Role spoofing | Role read from DB; JWT signature verified | Addressed |
| Horizontal privilege escalation | Student ownership checks → 404 | Addressed |
| Confidential data leak | MAIN_ADMIN-only support endpoints; DTO hides remarks | Addressed |
| Deactivated accounts | Rejected on login and per request | Addressed |
| XSS | React escapes output; no `dangerouslySetInnerHTML` | Addressed |
| File upload abuse | Type/size validation, random filename, auth download | Addressed |
| Sensitive errors | Generic JSON errors, no SQL/stack traces | Addressed |
| CORS | Explicit configured origins | Addressed |
| Brute force / abuse | Not implemented | Documented limitation; use proxy rate limiting |

---

## 6. Verification matrix

| Check | Method | Status |
| --- | --- | --- |
| Backend compilation | `mvn test` | See `DEVELOPMENT_PROGRESS.md` |
| Backend integration suite | JUnit + MockMvc + H2 | See `DEVELOPMENT_PROGRESS.md` |
| Backend packaging | `mvn package` | See `DEVELOPMENT_PROGRESS.md` |
| Frontend production build | `npm run build` | See `DEVELOPMENT_PROGRESS.md` |
| Local API smoke test | Run backend + frontend, exercise roles | See `DEVELOPMENT_PROGRESS.md` |
| Live MySQL 8 | Not available in build environment | Pending |
| Live backend host | Requires hosting credentials | Pending |
| Live Vercel deployment | Requires Vercel account/env vars | Pending |
| Browser E2E automation | No Playwright/Cypress suite | Not claimed |

The project does **not** claim live MySQL, live deployment or browser E2E verification unless it
was actually performed.

---

## 7. Known limitations

- Attachments use local disk; an ephemeral host loses them on restart.
- The JWT lives in browser storage; HttpOnly cookies/refresh tokens would be stronger.
- Notifications are stored for status/assignment changes but there is no real-time push/email.
- No rate limiting, CAPTCHA, password reset email or multi-factor authentication.
- Analytics use SQL aggregation suitable for a college dataset; very large datasets may need
  materialized summaries.
- UI/browser behaviour was verified by production build and manual API smoke tests, not an
  automated browser suite.

---

## 8. Conclusion

The v2 application matches the revised brief end-to-end at the source level: a JdbcTemplate-based
Spring Boot API, normalised MySQL schema, role-secured modules, confidential reporting, admin
management, analytics, and a complete Sky Glass React UI. Deployment and live database validation
remain environment-dependent and are clearly tracked rather than assumed.
