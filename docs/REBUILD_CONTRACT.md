# CAMPUSCARE — REBUILD CONTRACT v3 (SUNSET GLASS)

Single source of truth for the current rebuild. Supersedes v2 (Sky Glass). Backend and frontend
must implement exactly these paths, statuses, categories and JSON shapes.

## 1. Product

CAMPUSCARE — Smart Campus Help Desk Management System. Roles: `STUDENT`, `ADMIN`, `MAIN_ADMIN`.

- Students register, raise complaints, track progress and submit confidential support reports.
- Admins assign complaints, update status, add remarks and view student records.
- Main Admin manages admins/students, confidential reports, analytics, system settings and audit logs.

## 2. Technology (mandatory)

- Frontend: **Vanilla HTML5/CSS3/JavaScript**, Fetch API, Chart.js (CDN), responsive glassmorphism,
  **light + dark mode with toggle** (persisted in `localStorage`, defaults to system preference).
  No React/Vite. Static multi-page app in `frontend/`.
- Backend: Java 21, Spring Boot 3.5.x, Spring Web, **Spring Data JPA + Hibernate**, Spring
  Security, Bean Validation, JWT (JJWT), Maven. Layered: config/controller/service/repository/
  **entity**/dto/security/exception under `com.campuscare`.
- Database: **MySQL 8, `helpdesk_db`** (H2 in MySQL mode for dev/tests only).

## 3. Frontend structure

```text
frontend/
  index.html          # landing: branding, tagline, Login / Register buttons
  login.html          # split screen: left branding, right glass card
  register.html       # student registration
  dashboard.html      # post-login router -> redirects by role
  student.html        # student workspace (sidebar sections)
  admin.html          # admin workspace
  main-admin.html     # main admin workspace
  404.html
  css/styles.css      # design system (tokens, components, themes, responsive)
  js/config.js        # window.CAMPUSCARE_API_URL = window.CAMPUSCARE_API_URL || "http://localhost:8080/api";
  js/api.js           # central fetch wrapper: JWT header, envelope unwrap, 401 handling, errors
  js/auth.js          # login/register/logout/session, role guards
  js/ui.js            # theme toggle, toasts, modals, skeletons, counters, dropdowns
  js/charts.js        # Chart.js helpers (destroy/recreate on theme switch)
  js/student.js       # student sections
  js/admin.js         # admin sections
  js/main-admin.js    # main admin sections
  assets/             # logo/illustration SVGs
```

- Backend base URL comes from `window.CAMPUSCARE_API_URL` (set in `js/config.js`; production
  overrides it there or by injecting a script before it). Never hardcode deployed URLs elsewhere.
- JWT stored in `localStorage` (Remember me) or `sessionStorage`; 401 clears session → login.html.
- Role pages self-guard: verify token + role via `GET /api/auth/me`; wrong role → correct page.
- Backend down → red banner "Cannot reach the CampusCare server" + Retry button; never fake data.

### Pages, sidebars and navigation (final)

- `index.html` — landing: branding, graduation-cap illustration, tagline
  "One platform. Every campus problem. Smarter solutions.", Login / Register buttons, theme toggle.
- `login.html` — split screen. Right card: "Welcome Back", role buttons (Student/Admin/Main Admin),
  email, password + show/hide, "Login to CAMPUSCARE", "Create student account".
  **No forgot-password link** (the backend has no email service — never render dead links).
- `register.html` — student registration keeps the full field set from the brief: Full name,
  Email, Registration Number, Department, Year, Section, Password, Confirm password
  (superset of the four required fields; server checks duplicate email + registration number).
- `dashboard.html` — post-login router by role.
- `student.html` — sidebar: **Dashboard, Submit Complaint, My Complaints, Campus Support, Profile,
  Logout**. Tracking lives inside My Complaints: search by complaint ID, filters, detail modal with
  status history timeline and progress tracker. Students can never change complaint status.
- `admin.html` — sidebar: **Dashboard, All Complaints, Update Status, Profile, Logout**.
  All Complaints: search/filters/sort/pagination, view detail, update status (confirm dialog),
  add remarks. "Assigned to me" is a quick filter chip, not a separate item.
- `main-admin.html` — sidebar: **Dashboard, All Complaints, Update Status, Manage Admins,
  Support Reports, Activity Logs, Profile, Logout**. Dashboard stat cards: Total Complaints,
  Pending, In Progress, Resolved, Total Students, Total Admins, with Chart.js charts embedded
  (monthly/category/status) — there is no separate Analytics page. Support Reports: table, detail
  modal, status update with required confidential remarks, report history. Manage Admins:
  view/add/edit/activate/deactivate/search, department + support category.
  Activity Logs: user, action, entity/record ID, timestamp (searchable, paginated).
- Top navigation on all role pages: page title, notification icon (list + mark read/read-all),
  theme switcher, profile avatar/menu with name and role.
- Every sidebar item navigates (section switch with active highlighting); no `href="#"`,
  no dead buttons. Confirmation dialogs before destructive/important updates.

## 4. Sunset Glass design tokens (final palette)

CSS variables for every token; `data-theme="dark|light"` on `<html>`.

Dark: bg `#11111F` (midnight), surface `#19192B`, glass `rgba(255,255,255,0.07)`,
glass-border `rgba(255,255,255,0.16)`, sunset-orange `#FF7849`, coral `#FF5F6D`,
peach `#FFB38A`, rose `#F472B6`, violet `#A78BFA`, text `#FFFFFF`,
muted (lavender) `#ABA3C9`.
Light: bg `#FFF8F2` (warm ivory), surface `#FFFFFF`, glass `rgba(255,255,255,0.65)`,
glass-border `rgba(255,120,73,0.20)`, sunset-orange `#F0643B`, coral `#E8506A`,
peach `#FFB38A`, rose `#D63384`, violet `#7C5CD6`, text `#2B2430`,
muted `#7A6E80`.
Primary button gradient: `linear-gradient(135deg, #FF7849, #FF5F6D, #F472B6)`.
Background lighting: dark = subtle orange-pink radial glows; light = soft peach-pink glows.

**No theme flash:** every page sets `data-theme` with a tiny inline script in `<head>` (before the
stylesheet renders) from `localStorage('campuscare-theme')`, falling back to the system
`prefers-color-scheme`. The toggle updates the attribute + localStorage and re-renders chart colors.

Implement: frosted cards (`backdrop-filter: blur(18px–24px)`), 18–24px radii, thin translucent
borders, soft shadows, gradient highlights, glass sidebar/topbar/tables/modals/dropdowns/badges/
toasts, animated counters, fade-in cards, hover elevation, smooth theme switch, modal fade+scale,
200–300ms transitions. Restrained, performance-friendly animation. Theme toggle in the top
navigation of every page; charts re-render colors on switch.

## 5. Enums

- Role: `STUDENT`, `ADMIN`, `MAIN_ADMIN`
- ComplaintStatus: `PENDING`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `REOPENED`
  (workflow: PENDING → ASSIGNED → IN_PROGRESS → RESOLVED; REOPENED only from RESOLVED, by
  admin/main-admin; students can never change status)
- Priority: `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- ComplaintCategory (key / label): `WIFI`/Wi-Fi / Internet, `ELECTRICAL`/Electrical,
  `HARDWARE`/Computer / Hardware, `SOFTWARE`/Software, `CLASSROOM`/Classroom Facilities,
  `LABORATORY`/Laboratory, `WATER`/Water Supply, `WASHROOM`/Washroom / Hygiene, `OTHER`/Other
- SupportCategory (key / label): `HARASSMENT`/Harassment, `RAGGING`/Ragging, `SAFETY`/Campus Safety,
  `DISCRIMINATION`/Discrimination, `ACADEMIC`/Academic Misconduct, `FINANCIAL`/Financial Concern,
  `OTHER`/Other
- SupportStatus: `PENDING`, `IN_REVIEW`, `RESOLVED`, `REJECTED`

## 6. Database — MySQL 8 `helpdesk_db` (10 tables)

All tables: InnoDB, utf8mb4, `id BIGINT AUTO_INCREMENT PK`, created_at/updated_at where relevant.

1. `users` — full_name, email UNIQUE, password_hash, role, registration_number UNIQUE NULL,
   department, year (TINYINT NULL), section VARCHAR(10) NULL, active BOOL default TRUE.
2. `complaints` — complaint_code UNIQUE, student_id FK users, category, subject VARCHAR(160),
   description TEXT, location VARCHAR(160), room_number VARCHAR(40), priority, status default
   PENDING, current_admin_id FK users NULL, attachment_name, attachment_path.
3. `complaint_assignments` — complaint_id FK (cascade), admin_id FK, assigned_by FK, note
   VARCHAR(500), active BOOL; previous assignment deactivated on reassign.
4. `complaint_status_history` — complaint_id FK (cascade), updated_by FK, old_status NULL,
   new_status, remarks VARCHAR(1000), created_at.
5. `complaint_remarks` — complaint_id FK (cascade), admin_id FK, remark VARCHAR(1000), created_at.
6. `confidential_reports` — report_code UNIQUE, student_id FK, category, description TEXT,
   location VARCHAR(160), status default PENDING.
7. `confidential_report_history` — report_id FK (cascade), updated_by FK, old_status NULL,
   new_status, remarks VARCHAR(1000), created_at.
8. `admin_departments` — admin_id FK (cascade), department VARCHAR(120), support_category
   VARCHAR(40) NULL, created_at.
9. `notifications` — user_id FK (cascade), title VARCHAR(120), message VARCHAR(500), is_read BOOL.
10. `audit_logs` — actor_id FK users NULL, actor_email VARCHAR(190), action VARCHAR(60),
    entity_type VARCHAR(40), entity_id BIGINT NULL, details VARCHAR(500), created_at.

Indexes: users(email/role/registration_number/active), complaints(student_id/status/category/
priority/created_at/current_admin_id), assignments(complaint_id/admin_id), history(complaint_id),
remarks(complaint_id), reports(student_id/status), report_history(report_id),
admin_departments(admin_id), notifications(user_id/is_read), audit_logs(created_at/actor_id/action).

`database/schema.sql` = MySQL script (CREATE DATABASE helpdesk_db; …).
`database/sample_data.sql` = optional demo rows (BCrypt hash for `CampusCare@123`).

## 7. API contract

Envelope for every JSON response:
`{ "success": true, "message": "...", "data": ..., "timestamp": "..." }`
Errors: same with `success:false`, optional `errors:{field:msg}`; HTTP 400/401/403/404/409/500.
Pagination data: `{content:[],page,size,totalElements,totalPages}`.
Optional multipart upload: pdf/png/jpg/jpeg ≤ 5 MB stored under `UPLOAD_DIR`; download endpoints
check owner/admin. Codes: `CC-YYYY-XXXXXXXX`, `SR-YYYY-XXXXXXXX` (SecureRandom).

### Auth (public)
- `POST /api/auth/register` `{fullName,email,registrationNumber,department,year,section,password,confirmPassword}`
  → creates STUDENT only, validates duplicates (email + registration number), returns AuthResponse.
- `POST /api/auth/login` `{email,password,role?}` → role must match DB role; inactive → 403.
  → `{token,tokenType:"Bearer",expiresIn,user:UserDto}`.
- `GET /api/auth/me` → UserDto.
- `POST /api/auth/change-password` `{currentPassword,newPassword}` (authenticated).

`UserDto`: `{id,fullName,email,role,registrationNumber,department,year,section,active,createdAt}`.

### Student (STUDENT)
- `GET /api/student/dashboard` → `{stats:{total,pending,assigned,inProgress,resolved,reopened,rejected?}, recentComplaints:[ComplaintSummary], statusDistribution:[{label,value}], categoryDistribution:[{label,value}], unreadNotifications}`
- `GET /api/student/complaints?status=&category=&priority=&search=&page=&size=`
- `POST /api/student/complaints` multipart: subject, category, description, location, roomNumber, priority, optional attachment → ComplaintDetail (status PENDING + first history row).
- `GET /api/student/complaints/{id}` → detail (owner else 404) with `history`, `remarks`, `assignments`.
- `GET /api/student/complaints/{id}/history` → history list.
- `GET /api/student/complaints/{id}/attachment` → file (owner).
- `GET /api/student/support-reports` → own confidential reports (status only, no admin notes beyond status).
- `POST /api/student/support-reports` `{category,description,location?}` → report.

`ComplaintSummary`: `{id,complaintCode,category,categoryLabel,subject,description,location,roomNumber,priority,status,assignedAdminName,attachmentName,createdAt,updatedAt}`.
`ComplaintDetail` = summary + `studentName,studentEmail,registrationNumber,department,year,section,currentAdminName,history:[{oldStatus,newStatus,remarks,updatedByName,createdAt}],remarks:[{remark,adminName,createdAt}],assignments:[{adminName,assignedByName,note,active,createdAt}]`.

### Admin (ADMIN or MAIN_ADMIN)
- `GET /api/admin/dashboard` → stats incl assigned count, recent, distributions.
- `GET /api/admin/complaints?status=&category=&priority=&assignedAdminId=&search=&sort=newest|oldest|priority&page=&size=` (+ student fields in rows)
- `GET /api/admin/complaints/{id}` → detail.
- `GET /api/admin/complaints/{id}/attachment` → file.
- `PUT /api/admin/complaints/{id}/status` `{status,remarks}` — remarks required, status must differ;
  writes history, sets current_admin_id, notification, audit log.
- `POST /api/admin/complaints/{id}/remarks` `{remark}` → adds remark row + notification.
- `PUT /api/admin/complaints/{id}/assign` `{adminId,note?}` → active assignment row (previous deactivated), status → ASSIGNED if currently PENDING, notification, audit log.
- `GET /api/admin/admins` → active admins for the assignment dropdown.
- `GET /api/admin/students?search=&page=&size=` → student records (no password hashes).

### Main Admin (MAIN_ADMIN only)
- `GET /api/main-admin/dashboard` → `{stats:{totalStudents,totalAdmins,total,pending,inProgress,resolved,reopened}, recentComplaints, statusDistribution, categoryDistribution, recentActivity:[{action,actorName,entityLabel,createdAt}]}`
- `GET /api/main-admin/admins?search=` (all admins incl inactive, with department/category assignments)
- `POST /api/main-admin/admins` `{fullName,email,password,department,supportCategory?}` → ADMIN
- `PUT /api/main-admin/admins/{id}` `{fullName?,department?,supportCategory?,active?,password?}` (ADMIN rows only; cannot deactivate self/last active MAIN_ADMIN — admins table only holds ADMIN rows so this is inherent)
- `GET /api/main-admin/students?search=&page=&size=` and `PUT /api/main-admin/students/{id}/status` `{active}`
- `GET /api/main-admin/reports?status=&search=&page=&size=` → confidential reports incl description/location/status
- `POST /api/main-admin/reports` `{studentEmail,category,description,location?}` → main admin may log an offline report on behalf of a student
- `PUT /api/main-admin/reports/{id}/status` `{status,remarks}` → status + history + audit log (remarks required)
- `GET /api/main-admin/analytics` → `{monthly:[{month,label,complaints,resolved}], categories:[{label,value}], statuses:[{label,value}], departments:[{label,value}], adminPerformance:[{adminId,adminName,assigned,resolved}], resolution:{total,resolved,pending,resolutionRate,avgResolutionHours}}`
- `GET /api/main-admin/audit-logs?page=&size=&action=&search=` → audit log page
- `GET /api/main-admin/settings` → `{applicationName, jwtExpirationHours, uploadMaxMb, categories, supportCategories, totals…}` (read-only system info)

### Other
- `GET /api/notifications` (authenticated) + `PUT /api/notifications/{id}/read` + `PUT /api/notifications/read-all`
- `GET /api/health` public → `{status:"UP",database:"UP",timestamp}`

## 8. Security rules

- Public: `/api/health`, `/api/auth/register`, `/api/auth/login`.
- `/api/student/**` → STUDENT. `/api/admin/**` → ADMIN or MAIN_ADMIN. `/api/main-admin/**` → MAIN_ADMIN.
- Everything else authenticated. Stateless JWT; JSON 401/403; CORS from `FRONTEND_ORIGIN`.
- Role/active loaded from DB per request; client role never trusted.
- JPA derived/`@Query` parameterized operations only. Bean Validation on every DTO.
- BCrypt strength 10. `JWT_SECRET` required in production (dev/test may generate temp secret using
  `Profiles.of("dev","test")`).
- Audit logs record: register/login, complaint create, assignment, status change, remark, admin
  create/update, student (de)activation, confidential report access (main admin views), report
  status change. Never log passwords/tokens.

## 9. Backend config

`application.properties` per spec: `spring.datasource.*` from `DB_URL`/`DB_USERNAME`/`DB_PASSWORD`
(default URL `jdbc:mysql://localhost:3306/helpdesk_db`), `spring.jpa.hibernate.ddl-auto=update`,
`server.port=${PORT:8080}`, `JWT_SECRET` via `app.jwt.secret=${JWT_SECRET:}`.
Profiles: `dev` (H2 file DB + demo data when `DEMO_PASSWORD` set), `test` (H2 memory).
Bootstrap MAIN_ADMIN from `MAIN_ADMIN_EMAIL`/`MAIN_ADMIN_PASSWORD` when absent.

## 10. Verification bar

- `mvn test` green: auth, registration validation/duplicates, role rules, complaint lifecycle
  (create → assign → progress → resolve → reopen), remarks, history, notifications, audit logs,
  confidential access control, student/admin management, analytics.
- Frontend: valid HTML, all links/pages resolve, no missing assets (served statically; no build).
- Live smoke test: run backend + static server, exercise all three roles.
- Do not claim live MySQL/Vercel/browser-E2E verification unless actually performed.
