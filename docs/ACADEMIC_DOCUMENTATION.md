# CAMPUSCARE — Academic Project Documentation

**Title:** CAMPUSCARE — Smart Campus Help Desk  
**Student:** V. Dinesh Kartheek  
**Institution:** Centurion University of Technology and Management, Vizianagaram  
**Stack:** Java 21, Spring Boot 3, Spring JDBC, Spring Security, MySQL 8, React 18, Vite 5

---

## 1. Abstract

Campus problems are usually reported through phone calls, paper registers or informal messages.
Complaints get lost, nobody knows who is responsible, and students cannot see progress. CAMPUSCARE
digitises the complete lifecycle: a student submits a complaint with a category, priority and
location; an administrator assigns it and updates its status with remarks; every change is stored
in an immutable history; and a Main Administrator supervises staff, confidential support reports
and institution-wide analytics.

The system uses a stateless JWT-secured Spring Boot REST API, a normalised MySQL 8 schema accessed
through JdbcTemplate prepared statements, and a responsive React single-page application with a
premium "Sky Glass" dark interface. It demonstrates authentication, authorization, CRUD, workflow
design, analytics, input validation, error handling and deployment configuration in one complete
college-level project.

---

## 2. Objectives

1. Provide one authenticated portal for students, administrators and the Main Administrator.
2. Allow students to register, raise complaints, track status/history and file confidential
   support reports.
3. Give administrators a searchable queue, assignment and a remark-driven status workflow.
4. Give the Main Administrator admin management, confidential report access and analytics.
5. Store all data in a properly normalised MySQL database with keys, constraints and indexes.
6. Prevent SQL injection, unauthorised access, role spoofing and plaintext passwords.
7. Deliver a responsive, accessible and visually polished UI connected to real APIs.
8. Produce documentation, tests and deployment configuration suitable for evaluation.

---

## 3. Scope

### Included

- Student registration and role-based login.
- Student dashboard, complaint submission (optional attachment), complaint list/detail/history,
  confidential campus-support reporting and profile.
- Admin dashboard, complaint queue with search/filter/sort/pagination, assignment, status updates
  with mandatory remarks, detail view and profile.
- Main Admin dashboard, complaint management, admin management, confidential support reports,
  analytics and profile.
- MySQL schema, sample data, backend integration tests and frontend production build.
- Vercel frontend configuration and Java/MySQL deployment guide.

### Not included

- Email/SMS delivery, payment, biometric login.
- Real-time WebSocket updates.
- Mobile native apps.
- Cloud file storage (attachments use a local upload directory in this version).
- Live production deployment (requires the owner's credentials).

---

## 4. Technology stack

| Layer | Technology | Why |
| --- | --- | --- |
| Language | Java 21 | Modern LTS features, records, switch expressions |
| Backend | Spring Boot 3.5 | Embedded server, DI, configuration, production readiness |
| Web | Spring Web MVC | REST controllers, JSON, multipart uploads |
| Persistence | Spring JDBC / JdbcTemplate | Explicit SQL, prepared statements, teaching value |
| Security | Spring Security + JWT (JJWT) + BCrypt | Stateless auth, role rules, password hashing |
| Validation | Jakarta Bean Validation | Server-side request validation |
| Database | MySQL 8 | Relational design, constraints, indexes, managed hosting |
| Dev/test DB | H2 (MySQL mode) | Fast tests without a local MySQL server |
| Frontend | React 18 + Vite 5 | Component model, fast dev server, static build |
| Routing | React Router 6 | Role-protected SPA routes |
| Icons/charts | Lucide React, Recharts | Consistent icons and accessible charts |
| Deployment | Vercel + Java host + managed MySQL | Matches the required deployment targets |

---

## 5. System architecture

```text
Browser (React SPA, Vercel)
   │  HTTPS + JSON / multipart, Authorization: Bearer <JWT>
   ▼
Spring Boot REST API
   ├── Security filter chain (JWT, CORS, role rules)
   ├── Controllers  → validation + HTTP status
   ├── Services     → business rules, ownership, transactions
   ├── Repositories → JdbcTemplate + prepared statements
   └── Exception handler → consistent JSON errors
   ▼
MySQL 8 (users, complaints, complaint_history, support_reports, notifications)
```

### Backend packages

```text
com.campuscare
├── config        Security, CORS, bootstrap/demo data, upload config
├── controller    Auth, Student, Complaint, Admin, MainAdmin, SupportReport, Analytics
├── service       Auth, Student, Complaint, Admin, MainAdmin, SupportReport, Analytics, Notification
├── repository    User, Complaint, ComplaintHistory, SupportReport, Notification (JdbcTemplate)
├── model         Enums + data classes
├── dto           Request/response records + ApiResponse/PageResponse
├── security      JWT service/filter, principal, user details
├── exception     ApiException + GlobalExceptionHandler
└── util          Code generator, mapping helpers
```

---

## 6. Database design

### Entity–relationship summary

- One **user (student)** → many **complaints** (`complaints.student_id`).
- One **user (admin)** → many assigned **complaints** (`complaints.assigned_admin_id`).
- One **complaint** → many **complaint_history** rows (cascade delete).
- One **user (student)** → many **support_reports**.
- One **user** → many **notifications**.

### Tables

| Table | Purpose | Key columns |
| --- | --- | --- |
| `users` | All accounts and roles | `email` unique, `role`, `student_id` unique, `active`, `assigned_categories` |
| `complaints` | Complaint records | `complaint_code` unique, `student_id` FK, `category`, `priority`, `status`, `assigned_admin_id` FK |
| `complaint_history` | Immutable workflow audit | `complaint_id` FK, `updated_by` FK, `old_status`, `new_status`, `remarks` |
| `support_reports` | Confidential concerns | `report_code` unique, `student_id` FK, `category`, `status`, `confidential_remarks` |
| `notifications` | In-app notices | `user_id` FK, `message`, `is_read` |

Indexes cover email, role, student, status, category, priority, created date, assigned admin,
history lookup and unread notifications. Foreign keys protect referential integrity, and check
constraints restrict roles, statuses, priorities and categories.

The complete MySQL 8 script is [`../database/schema.sql`](../database/schema.sql); optional demo
rows are in [`../database/sample_data.sql`](../database/sample_data.sql).

---

## 7. Modules

### 7.1 Authentication

- Public student registration (server forces `STUDENT`).
- Login with optional expected role; the server compares it with the database role.
- BCrypt hashing and JWT issuing.
- `GET /api/auth/me` restores the session.
- Deactivated accounts are rejected on login and on every authenticated request.

### 7.2 Student module

- Dashboard statistics, recent complaints and chart data.
- Complaint submission with category, priority, location, room, description and optional file.
- Unique complaint code (`CC-YYYY-XXXXXXXX`), initial `PENDING` status and history row.
- Own-complaint list/detail with search/filter/pagination and history timeline.
- Confidential support report creation and status tracking.
- Profile.

### 7.3 Admin module

- Dashboard with status/category distributions and recent complaints.
- Searchable, filterable, sortable, paginated queue.
- Complaint detail with student information and history.
- Assignment to an active administrator.
- Status update (`PENDING`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`) with mandatory remarks.
- Automatic student notification and immutable history.

### 7.4 Main Admin module

- Institution dashboard including student/admin counts and recent activity.
- Admin management: create, edit, department, assigned categories, activate/deactivate, optional
  password reset. The last active Main Admin cannot be deactivated.
- Confidential support reports: full description, status, confidential remarks; inaccessible to
  normal admins.
- Analytics: monthly trend, category/status/priority distributions, resolution rate and admin
  workload.
- Full complaint management via the shared admin endpoints.

---

## 8. API design

Base path `/api`. Every response uses the envelope
`{success, message, data, timestamp}`. Protected routes require a bearer token.

| Group | Main endpoints |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Student | `GET /student/dashboard`, `GET/POST /student/complaints`, `GET /student/complaints/{id}`, `GET/POST /student/support-reports` |
| Admin | `GET /admin/dashboard`, `GET /admin/complaints`, `GET /admin/complaints/{id}`, `PUT /admin/complaints/{id}/status`, `PUT /admin/complaints/{id}/assign`, `GET /admin/admins` |
| Main Admin | `GET /main-admin/dashboard`, `GET/POST /main-admin/admins`, `PUT /main-admin/admins/{id}`, `GET /main-admin/support-reports`, `PUT /main-admin/support-reports/{id}/status`, `GET /main-admin/analytics` |
| Public | `GET /health` |

See [`REBUILD_CONTRACT.md`](REBUILD_CONTRACT.md) for exact JSON shapes.

---

## 9. Security design

1. **Password storage:** BCrypt, strength 10; hashes never returned.
2. **Authentication:** signed JWT with expiry; token identifies, database authorises.
3. **Authorisation:** URL-level role rules + service-level ownership checks.
4. **SQL injection:** JdbcTemplate `?` parameters everywhere; whitelisted sort columns.
5. **Validation:** Bean Validation on every DTO; enum parsing; multipart size/type checks.
6. **Confidentiality:** support reports are restricted to the owner and Main Admin; admin role is
   blocked server-side, not merely hidden in the UI.
7. **Error hygiene:** no stack traces, SQL or internal messages in responses.
8. **CORS:** explicit allowed origins from configuration.
9. **Uploads:** random stored filenames, type/size validation, authenticated download.

---

## 10. Testing

### Automated backend tests (H2, MySQL mode)

The integration suite uses `@SpringBootTest` + MockMvc and covers:

- health and database status;
- student registration, forced role, duplicate email and validation errors;
- login success, wrong password and role mismatch;
- 401/403 protection for student, admin and main-admin routes;
- complaint creation, initial status/history, own-list isolation and 404 for another student;
- admin list/detail/assignment/status update and history;
- admin forbidden from confidential main-admin routes;
- main-admin admin creation, edit and deactivation;
- support report creation, confidentiality and status update;
- analytics response structure.

Run:

```bash
cd backend
mvn test
```

### Frontend verification

```bash
cd frontend
npm run build
```

The build must complete with no errors. Browser E2E automation is not included.

### Manual smoke test

Register/sign in → submit complaint → admin assigns/updates → student sees history → main admin
reads a support report and analytics. Verify role restrictions and error states.

---

## 11. Limitations and future scope

- Attachments use a local directory; production should use object storage with signed URLs.
- JWT is stored in browser storage; HttpOnly cookies + refresh tokens would harden this.
- Notifications are stored but not pushed in real time; email/SMS/WebSocket delivery is future work.
- No rate limiting or CAPTCHA on authentication yet.
- MySQL and live hosting require deployment-time verification.
- Future: SLA timers, escalation rules, duplicate detection, multilingual UI, mobile app,
  audit export, accessibility audit and load testing.

---

## 12. Conclusion

CAMPUSCARE demonstrates an end-to-end software engineering workflow: requirement analysis,
relational design, layered Java API, token security, a modern React interface, automated tests and
deployment preparation. It is intentionally understandable for a student while following patterns
used in real help-desk systems.
