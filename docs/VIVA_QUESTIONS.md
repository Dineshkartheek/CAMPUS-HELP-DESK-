# CAMPUSCARE — Viva Questions and Model Answers

Twenty questions a examiner is likely to ask about this project, with concise answers you can
explain in your own words.

---

### 1. What problem does CampusCare solve?

It gives a college one place to report and resolve campus issues. Students raise complaints or
confidential support concerns, administrators assign and resolve complaints with an audit trail,
and the Main Administrator manages staff, reads confidential reports and monitors analytics.

### 2. Why did you use Spring Boot?

Spring Boot provides an embedded Tomcat server, dependency management, auto-configuration and
production features (validation, security, health checks) with little boilerplate. It lets a small
team build a layered REST API quickly while remaining standard Java/Spring.

### 3. What is the layered architecture of your backend?

`controller` handles HTTP and validation; `service` contains business rules and transactions;
`repository` contains SQL/JdbcTemplate access; `model` contains enums and data classes; `dto`
defines request/response shapes; `security` handles JWT and authorization; `exception` produces a
consistent error contract. Each layer only talks to the layer below it.

### 4. Why JdbcTemplate instead of JPA/Hibernate?

The requirement was explicit SQL control with prepared statements. JdbcTemplate keeps the SQL
visible in repositories, avoids ORM magic and makes it easy to show that every value is bound with
`?` placeholders, which prevents SQL injection. The trade-off is more manual mapping/query code.

### 5. How does JdbcTemplate prevent SQL injection?

Values are passed as parameters (`jdbcTemplate.update("... WHERE email = ?", email)`), so the JDBC
driver sends them separately from the SQL text. User input is never concatenated into SQL.
Dynamic sort options are whitelisted instead of inserted directly.

### 6. How are passwords stored?

Only a BCrypt hash is stored (`password_hash`). Registration and password resets use
`BCryptPasswordEncoder` (strength 10). Login compares the submitted password with the hash.
Plaintext passwords are never stored, logged or returned to the client.

### 7. How does JWT authentication work here?

`POST /api/auth/login` verifies the password and returns a signed JWT containing the user id,
email and role. The React client sends it as `Authorization: Bearer <token>`. A Spring Security
filter validates the signature/expiry, loads the current user from the database, checks `active`,
and puts the authenticated principal in the security context.

### 8. Why load the user from the database on every request?

Roles and activation can change after a token is issued. Loading the user each request means a
deactivated admin loses access immediately, and the server never trusts the role claim supplied by
the client. The token identifies the user; the database decides the current role/status.

### 9. How is role-based access control implemented?

`SecurityConfig` restricts URL groups: `/api/student/**` requires `STUDENT`, `/api/admin/**`
requires `ADMIN` or `MAIN_ADMIN`, `/api/main-admin/**` requires `MAIN_ADMIN`. Services also check
ownership (a student can only read their own complaint, otherwise 404). Controller annotations and
URL rules work together with the database-loaded role.

### 10. What are the complaint statuses and how is history recorded?

`PENDING → IN_PROGRESS → RESOLVED`, with `REJECTED` as an alternative outcome. Every status change
requires remarks, updates `complaints.status`/`admin_remarks`/`updated_at`, and inserts an
immutable row into `complaint_history` with the actor, old status, new status and timestamp.

### 11. How is assignment handled without an `ASSIGNED` status?

The complaint keeps its workflow status (`PENDING`, etc.) while `assigned_admin_id` records the
responsible administrator. The admin dashboard shows assigned/unassigned counts. This avoids
mixing "who owns it" with "where is it in the workflow".

### 12. How are confidential support reports protected?

Only students can create them, and only `MAIN_ADMIN` can list details, read confidential remarks
or update their status. The admin role is denied at the URL layer, and the student DTO hides the
confidential remarks. This is a separate table/module from normal complaints.

### 13. How do you validate input on the server?

Every request DTO uses Jakarta Bean Validation (`@NotBlank`, `@Email`, `@Size`, etc.). Enums are
parsed strictly. `GlobalExceptionHandler` converts validation failures into a JSON response with
field-level messages and HTTP 400, so the server is safe even if the browser is bypassed.

### 14. What is the standard API response shape?

`{ "success": true, "message": "...", "data": ..., "timestamp": "..." }`. Errors use the same
shape with `success:false`, a message and optional field errors. Pagination returns
`content`, `page`, `size`, `totalElements`, `totalPages`. A single envelope keeps the React client
simple and consistent.

### 15. Why do pagination and filtering happen in SQL?

Loading every row into Java wastes memory and gets slower as data grows. `LIMIT/OFFSET` plus a
`COUNT(*)` query returns one page and the total. Search and filters use bound parameters; sort
columns are whitelisted. Indexes on status, category, student and date keep these queries fast.

### 16. How is the React application structured?

`src/api/client.js` is the only place that talks to the backend (base URL from
`VITE_API_BASE_URL`, token, errors, downloads). `AuthContext` manages login/session/role.
`ProtectedRoute` guards routes. Reusable components provide the glass layout, cards, tables,
charts, modals and toasts. Pages call API functions and render loading, empty, error and success
states with real data.

### 17. How does the frontend handle token expiry?

The API client detects HTTP 401, clears the stored token, and notifies the auth context. The user
is redirected to the correct login page and sees a session-expired message. Expired tokens can
never be used because the backend validates the signature and expiry on every request.

### 18. Why store the token in sessionStorage/localStorage?

The token is kept in `sessionStorage` normally (cleared when the tab closes) and in `localStorage`
when "Remember me" is chosen. This is a simple stateless approach for an academic project. For a
higher-security production system, an HttpOnly secure cookie with CSRF protection is often
preferable because JavaScript cannot read it.

### 19. What is the Sky Glass design system?

A dark glassmorphism theme: navy background (`#07111F`/`#0B192B`), translucent panels with
`backdrop-filter: blur(18px)`, thin light borders, blue/cyan accents, soft glow, rounded 16–24 px
cards, floating gradient blobs, hover lift and fade-in animations. CSS variables keep the palette
consistent, and media queries make the layout responsive.

### 20. What would you improve next?

- Move attachments to S3/Cloud Storage instead of a local disk.
- Add refresh tokens/HttpOnly cookies and rate limiting.
- Add browser E2E tests (Playwright) and CI/CD pipelines.
- Add email notifications and real-time updates (WebSocket/SSE).
- Add audit views for the Main Admin and soft-delete/archival policies.
- Load-test the API and add database backup/restore automation.

---

## Quick demo script

1. Register a new student or sign in as `student@campuscare.local`.
2. Submit a complaint → show the generated `CC-...` code and `PENDING` status.
3. Sign in as `admin@campuscare.local`, assign the complaint, update it to `IN_PROGRESS` with remarks.
4. Return to the student and show the status, remarks and history timeline.
5. Sign in as `mainadmin@campuscare.local`, open **Support Reports**, update a confidential report,
   then open **Analytics** and **Manage Admins**.
6. Show that an admin receives 403 on a main-admin URL, and that another student cannot read the
   first student's complaint.
