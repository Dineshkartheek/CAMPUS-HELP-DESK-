# ACADEMIC DOCUMENTATION — CampusCare Smart Campus Help Desk Management System

**Project title:** CampusCare — Smart Campus Help Desk Management System  
**Submitted by:** V. Dinesh Kartheek  
**Institution:** Centurion University of Technology and Management, Vizianagaram  
**Technology:** Java 21, Spring Boot 3, MySQL 8, React 18, Vite 5  
**Academic year:** 2026–27  
**Document date:** 16 November 2026

---

## Abstract

Campus service requests — Wi-Fi failures, smart-board faults, electrical problems, computer-lab
issues and classroom maintenance — are often reported through phone calls, messaging groups or
informal conversations. Such channels lack a stable record, clear ownership and measurable
resolution times. CampusCare is a web-based Smart Campus Help Desk that replaces these informal
channels with a structured complaint lifecycle.

The system provides three role-specific portals. Students register, raise complaints with a
category, priority, description and campus location, and track progress through a status timeline
and comments. Administrators receive a filterable queue, assign complaints to active staff, enforce
valid status transitions, add remarks and export data. The Main Administrator governs
administrator accounts and complaint categories, and generates confidential institutional reports.

The backend is implemented with Java 21 and Spring Boot 3 using a layered controller–service–
repository architecture, Spring Data JPA, Bean Validation, BCrypt password hashing and stateless JWT
authentication. MySQL 8 stores six normalised tables with foreign keys, indexes and check
constraints. The frontend is a responsive React 18 single-page application with a centralised API
client, role-protected routes and an IBM-inspired navy/white design. An optional backend-only Gemini
integration suggests a category and priority but never blocks submission, and every suggestion is
clearly labelled for human review.

The backend compiles and six end-to-end integration tests pass on an H2 database in MySQL
compatibility mode. The frontend production build succeeds. Live MySQL connectivity, the live Gemini
call and the public Vercel deployment were not verified in the build environment and are documented
as deployment-time checks.

**Keywords:** campus help desk, complaint management, Spring Boot, Java 21, React, MySQL, JWT,
role-based access control, REST API, workflow automation.

---

## 1. Introduction

### 1.1 Background

Universities operate many shared facilities: wireless networks, smart classrooms, computer
laboratories, electrical systems and classroom infrastructure. When a facility fails, students need
a predictable way to report it and staff need a predictable way to resolve it. In many institutions,
reporting remains informal. A student may tell a faculty member, post in a messaging group or visit
an office. The resulting request is difficult to prioritise, assign and audit.

A campus help desk addresses this gap by treating each complaint as a ticket with an owner, a
status, a history and a resolution record. The system in this project, **CampusCare**, is designed
for Centurion University of Technology and Management, Vizianagaram, and can be adapted to similar
institutions.

### 1.2 Problem statement

The existing informal process has five recurring problems:

1. **No single channel** — complaints are scattered across calls, chats and paper.
2. **No accountability** — it is unclear who is responsible for a complaint.
3. **No visibility** — students cannot see whether a complaint is being worked on.
4. **No audit trail** — there is no reliable record of status changes and remarks.
5. **No management information** — administrators cannot measure volumes, categories or resolution
   performance.

### 1.3 Proposed solution

CampusCare provides a single web application with:

- secure student registration and login;
- structured complaint submission;
- a controlled administrator workflow;
- an audit trail for assignments and status changes;
- comments visible to the student;
- category and user administration;
- confidential reports and CSV exports;
- an optional AI classification assistant that supports, but never replaces, human decisions.

---

## 2. Objectives

### 2.1 Primary objectives

1. Provide a single, reliable channel for campus complaints.
2. Give students real-time visibility of complaint status and administrator remarks.
3. Give administrators a prioritised, searchable and assignable work queue.
4. Enforce a consistent lifecycle for every complaint.
5. Maintain an auditable history of status changes and assignments.
6. Provide institution-level reporting for service improvement.
7. Protect data with authentication, role-based authorization and secure password storage.

### 2.2 Secondary objectives

1. Deliver a responsive interface usable on phones, tablets and desktops.
2. Keep the frontend and backend independently deployable.
3. Support an optional AI classification aid without creating a dependency on an external service.
4. Provide automated backend tests and a reproducible production build.
5. Document setup, deployment, security and academic aspects of the system.

---

## 3. Scope

### 3.1 In scope

- Student self-registration and login.
- Student complaint creation with category, priority, title, description and location.
- Student complaint list, filters, statistics, detail, comments and status history.
- Administrator queue, assignment, status transitions, remarks, comments and CSV export.
- Main Administrator dashboard, user management, category management,
  confidential date-range reports and CSV export.
- JWT authentication and role-based authorization.
- MySQL 8 schema and seed categories.
- Optional Gemini suggestion endpoint.
- Responsive React frontend and Vercel deployment configuration.
- Backend integration tests and documentation.

### 3.2 Out of scope

- Email or SMS notifications (no mail/SMS provider is integrated).
- Email ownership verification.
- Password reset or self-service password change.
- File or image attachments.
- Real-time chat or WebSocket updates.
- Mobile-native applications.
- Multi-tenant operation for several institutions.
- Automated scheduled report delivery or archival.
- Payment, inventory or asset-management integration.

These exclusions keep the academic scope achievable and are listed again as future work.

---

## 4. Technology review and justification

### 4.1 Backend: Java 21 and Spring Boot 3

Java is strongly typed, platform-independent and widely used in enterprise information systems.
Java 21 is a long-term-support release with modern language features. Spring Boot reduces
configuration effort through starters, auto-configuration and embedded servers. Spring Web provides
REST controllers, Spring Data JPA provides repository abstractions over JPA/Hibernate, Spring
Security provides authentication and authorization, and Bean Validation enforces request
constraints.

The layered structure keeps HTTP concerns, business rules and persistence separate, which improves
testability. The application can be packaged as a single executable JAR, simplifying deployment.

### 4.2 Database: MySQL 8

MySQL is a mature open-source relational database. The domain is naturally relational: users own
tickets, tickets reference categories and assigned administrators, and tickets have comments,
assignments and status-history rows. Foreign keys protect referential integrity; indexes support
filtering and reporting; check constraints prevent invalid enum values at the database level.

### 4.3 Frontend: React 18 and Vite 5

React supports a component-based user interface with predictable state updates. React Router
provides client-side routing and role-protected routes. Vite provides a fast development server and
an optimised production build. The project uses hand-written CSS instead of a component framework to
demonstrate layout, responsive design and design-system skills and to avoid unnecessary runtime
weight.

### 4.4 Authentication: JWT and BCrypt

JSON Web Tokens (RFC 7519) provide a stateless authentication mechanism suitable for a REST API.
The client sends `Authorization: Bearer <token>` on each request. Passwords are hashed with BCrypt,
a deliberately slow adaptive hashing function with a per-password salt. Plain-text passwords are
never stored or returned.

### 4.5 Optional AI: Google Gemini

The Gemini integration is optional and backend-only. It is used to suggest a category, priority,
short summary and department. Because language models can be wrong, the output is validated against
the active category list and the `Priority` enum, and the student must confirm the values. If the
service is disabled or unavailable, complaint submission continues normally.

---

## 5. System analysis

### 5.1 Limitations of the informal system

| Area | Informal process | Effect |
| --- | --- | --- |
| Reporting | Calls, chats, walk-ins | Requests are lost or duplicated |
| Ownership | Informal verbal assignment | No accountability |
| Prioritisation | Ad hoc | Urgent issues may be delayed |
| Tracking | Student asks repeatedly | Staff time is wasted |
| Audit | None | Disputes cannot be investigated |
| Reporting | Manual guesswork | No evidence for planning |
| Security | Personal data in chats | Privacy risk |

### 5.2 Requirements of the proposed system

**Functional requirements**

| ID | Requirement |
| --- | --- |
| FR-01 | A visitor can register only as a student. |
| FR-02 | A registered user can log in and receive a JWT. |
| FR-03 | A student can create a complaint with category, priority, title, description and location. |
| FR-04 | A student can list and filter only their own complaints. |
| FR-05 | A student can view status, remarks, comments and history for their own complaint. |
| FR-06 | An administrator can view and filter all complaints. |
| FR-07 | An administrator can assign a complaint to an active administrator. |
| FR-08 | An administrator can change status only through allowed transitions. |
| FR-09 | An administrator can add remarks and comments. |
| FR-10 | An administrator can export filtered complaints as CSV. |
| FR-11 | A Main Administrator can create and deactivate administrator accounts. |
| FR-12 | A Main Administrator can create, edit and deactivate categories. |
| FR-13 | A Main Administrator can generate confidential reports by date range. |
| FR-14 | The system can suggest a category and priority through optional AI. |
| FR-15 | Every status change and assignment is recorded in history. |

**Non-functional requirements**

| ID | Requirement |
| --- | --- |
| NFR-01 | Passwords must be hashed and never returned by the API. |
| NFR-02 | Role restrictions must be enforced on the server. |
| NFR-03 | Invalid input must produce a clear, consistent JSON error. |
| NFR-04 | The interface must be responsive from 360 px upwards. |
| NFR-05 | API failures must show a user-facing message, not a blank screen. |
| NFR-06 | Expired tokens must return the user to the correct login page. |
| NFR-07 | The database must enforce referential integrity and valid enum values. |
| NFR-08 | Configuration and secrets must come from environment variables. |
| NFR-09 | The application must remain usable when optional AI is unavailable. |
| NFR-10 | The production frontend build must succeed without development-only variables. |

### 5.3 Actors and responsibilities

| Actor | Responsibilities |
| --- | --- |
| Visitor | View the landing page, register as a student, log in |
| Student | Submit and track personal complaints, view comments and history |
| Administrator (`ADMIN`) | Manage the queue, assign, update status, comment, export |
| Main Administrator (`MAIN_ADMIN`) | All administrator functions plus user, category and report governance |
| Optional AI service | Suggest classification values for human review, never decide |

---

## 6. System architecture

### 6.1 Three-tier architecture

```text
┌──────────────────────────────────────────────────────────────┐
│ Presentation tier                                            │
│ React 18 SPA (Vite)                                          │
│  • Landing/auth pages        • Student portal                │
│  • Administrator portal      • Main Administrator portal     │
│  • Central API client        • Route guards and layout       │
└───────────────────────────────┬──────────────────────────────┘
                                │ HTTPS / JSON + JWT
┌───────────────────────────────▼──────────────────────────────┐
│ Application tier                                             │
│ Spring Boot 3 (Java 21)                                      │
│  Controllers → Services → Repositories                       │
│  Security filter chain, validation, exception handling       │
│  Optional Gemini client                                      │
└───────────────────────────────┬──────────────────────────────┘
                                │ JDBC
┌───────────────────────────────▼──────────────────────────────┐
│ Data tier                                                    │
│ MySQL 8 — users, categories, tickets, comments,              │
│ assignments, status history                                  │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Backend layering

| Layer | Responsibility | Examples |
| --- | --- | --- |
| Controller | HTTP mapping, request validation entry, response codes | `TicketController`, `AdminController` |
| Service | Business rules, transactions, authorization checks | `TicketService`, `AdminService`, `MainAdminService` |
| Repository | Data access and queries | `TicketRepository`, `UserRepository` |
| Model | JPA entities and enums | `Ticket`, `User`, `TicketStatus` |
| DTO | Stable API contracts, validation annotations | `TicketDtos`, `AdminDtos` |
| Security | JWT parsing, authentication, route rules | `JwtService`, `SecurityConfig` |
| Exception | Uniform error responses | `GlobalExceptionHandler` |
| Config | Startup seeds and bootstrap | `DataInitializer` |

Entities are never serialised directly. DTO records prevent accidental exposure of password hashes
and decouple the database model from the API contract.

### 6.3 Frontend architecture

```text
src/
├── App.jsx                 Route table and providers
├── components/
│   ├── Layout.jsx          Role-aware shell and navigation
│   ├── ProtectedRoute.jsx  Role guard and login redirect
│   ├── UI.jsx              Cards, badges, tables, forms, states
│   ├── TicketParts.jsx     Shared ticket timeline/comment UI
│   └── Icons.jsx           Inline SVG icon set
├── context/
│   ├── AuthContext.jsx     Session restore, login, logout, expiry
│   └── ToastContext.jsx    Transient notifications
├── pages/                  Public, student, admin and main-admin pages
├── services/api.js         Single API client and token store
├── utils/format.js         Date, label and formatting helpers
└── styles.css              Design system and responsive layout
```

Key frontend decisions:

- **One API client** centralises base URL, headers, errors, CSV downloads and `401` handling.
- **Role-aware shell** renders navigation based on the authenticated user rather than duplicating
  layouts.
- **Server as source of truth** — the UI mirrors allowed transitions but the backend rejects invalid
  requests.
- **Build-time environment** — `VITE_API_URL` is read by Vite at build time; production builds have
  no localhost fallback.

### 6.4 Request lifecycle: login

```text
User submits email/password
        │
        ▼
POST /api/auth/login
        │
        ▼
AuthenticationManager → DaoAuthenticationProvider
        │
        ├── CustomUserDetailsService loads the user
        ├── BCrypt verifies the password
        └── inactive accounts are rejected
        │
        ▼
JwtService issues a signed token (subject, role, expiry)
        │
        ▼
Frontend stores the token in sessionStorage and loads /api/auth/me
        │
        ▼
Role-specific redirect: /student, /admin or /main-admin
```

### 6.5 Request lifecycle: complaint submission

```text
Student fills the complaint form
        │
        ├── optional POST /api/ai/suggest → suggestion shown for review
        ▼
POST /api/tickets (JWT)
        │
        ▼
JwtAuthenticationFilter authenticates the request
        │
        ▼
Bean Validation checks the DTO
        │
        ▼
TicketService verifies the category is active
        │
        ├── generates CC-YYYY-XXXXXXXX ticket number
        ├── saves the ticket (status SUBMITTED)
        └── writes the first status-history row
        │
        ▼
201 Created with the ticket response
```

---

## 7. Database design

### 7.1 Entity-relationship model

```text
users 1 ──────── * tickets            (student_id)
users 1 ──────── * tickets            (assigned_admin_id, nullable)
categories 1 ─── * tickets            (category_id)

tickets 1 ────── * ticket_comments    (ticket_id, cascade delete)
users 1 ──────── * ticket_comments    (author_id)

tickets 1 ────── * ticket_assignments (ticket_id, cascade delete)
users 1 ──────── * ticket_assignments (admin_id)
users 1 ──────── * ticket_assignments (assigned_by)

tickets 1 ────── * ticket_status_history (ticket_id, cascade delete)
users 1 ──────── * ticket_status_history (changed_by)
```

The current assignee is denormalised on `tickets.assigned_admin_id` for fast queue filtering, while
`ticket_assignments` preserves the full assignment history and which administrator made each
assignment.

### 7.2 Table: `users`

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | BIGINT | PK, auto-increment | Surrogate key |
| `full_name` | VARCHAR(120) | NOT NULL | Display name |
| `email` | VARCHAR(180) | NOT NULL, unique | Login identifier |
| `password_hash` | VARCHAR(100) | NOT NULL | BCrypt hash |
| `role` | VARCHAR(20) | NOT NULL, check | `STUDENT`, `ADMIN`, `MAIN_ADMIN` |
| `department` | VARCHAR(120) | nullable | Department or unit |
| `active` | TINYINT(1) | NOT NULL, default 1 | Account status |
| `created_at` | TIMESTAMP(6) | NOT NULL | Creation time |
| `updated_at` | TIMESTAMP(6) | NOT NULL | Last update time |

Indexes: unique email, role.

### 7.3 Table: `categories`

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | BIGINT | PK | Surrogate key |
| `name` | VARCHAR(80) | NOT NULL, unique | Category name |
| `description` | VARCHAR(255) | nullable | Explanation |
| `active` | TINYINT(1) | NOT NULL, default 1 | Selectable for new tickets |
| `created_at` | TIMESTAMP(6) | NOT NULL | Creation time |

Seeded values: Wi-Fi, Smart Board, Electrical, Computer Lab, Network, Classroom, Internet, Other.

### 7.4 Table: `tickets`

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | BIGINT | PK | Surrogate key |
| `ticket_number` | VARCHAR(32) | NOT NULL, unique | Human-readable reference |
| `student_id` | BIGINT | FK → users | Complainant |
| `category_id` | BIGINT | FK → categories | Complaint category |
| `title` | VARCHAR(160) | NOT NULL | Short summary |
| `description` | TEXT | NOT NULL | Full complaint |
| `location` | VARCHAR(180) | NOT NULL | Campus location |
| `priority` | VARCHAR(20) | NOT NULL, check | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| `status` | VARCHAR(20) | NOT NULL, check | Workflow status |
| `assigned_admin_id` | BIGINT | FK → users, nullable | Current assignee |
| `admin_remarks` | VARCHAR(2000) | nullable | Latest administrator remark |
| `ai_suggested_category` | VARCHAR(80) | nullable | Stored AI suggestion |
| `ai_suggested_priority` | VARCHAR(20) | nullable | Stored AI suggestion |
| `ai_summary` | VARCHAR(500) | nullable | Stored AI summary |
| `ai_suggested_department` | VARCHAR(120) | nullable | Stored AI department |
| `created_at` | TIMESTAMP(6) | NOT NULL | Creation time |
| `updated_at` | TIMESTAMP(6) | NOT NULL | Last update time |
| `resolved_at` | TIMESTAMP(6) | nullable | Resolution time |

Indexes: student, category, status, priority, created date, assigned administrator.

### 7.5 Table: `ticket_comments`

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | BIGINT | PK | Surrogate key |
| `ticket_id` | BIGINT | FK → tickets, cascade | Parent ticket |
| `author_id` | BIGINT | FK → users | Comment author |
| `message` | VARCHAR(2000) | NOT NULL | Comment text |
| `created_at` | TIMESTAMP(6) | NOT NULL | Creation time |

### 7.6 Table: `ticket_assignments`

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | BIGINT | PK | Surrogate key |
| `ticket_id` | BIGINT | FK → tickets, cascade | Parent ticket |
| `admin_id` | BIGINT | FK → users | Assignee |
| `assigned_by` | BIGINT | FK → users | Actor |
| `note` | VARCHAR(255) | nullable | Assignment note |
| `active` | TINYINT(1) | NOT NULL, default 1 | Current assignment flag |
| `assigned_at` | TIMESTAMP(6) | NOT NULL | Assignment time |

### 7.7 Table: `ticket_status_history`

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | BIGINT | PK | Surrogate key |
| `ticket_id` | BIGINT | FK → tickets, cascade | Parent ticket |
| `from_status` | VARCHAR(20) | nullable | Previous status |
| `to_status` | VARCHAR(20) | NOT NULL | New status |
| `changed_by` | BIGINT | FK → users | Actor |
| `remarks` | VARCHAR(1000) | nullable | Reason/remark |
| `changed_at` | TIMESTAMP(6) | NOT NULL | Timestamp |

### 7.8 Normalisation

The design is in third normal form for the core records:

- user, category and ticket attributes depend on their own primary keys;
- assignment history and status history are separated from the ticket row;
- the current assignee and latest remark are deliberate denormalisations for read performance;
- every history row references the actor, preserving accountability.

---

## 8. Module design

### 8.1 Authentication module

- Student registration with name, email, password, confirmation and department.
- Public registration forces the `STUDENT` role; role is not accepted from the client.
- Login verifies BCrypt hashes and rejects inactive accounts.
- JWT contains the user identity and role, with a configurable expiry.
- `/api/auth/me` restores the session after a page reload.
- A `401` clears the client session and returns the user to the correct portal login.

### 8.2 Student module

- Dashboard statistics: total, submitted, assigned, in-progress, resolved, closed, rejected and open
  complaint counts.
- Complaint form with category, priority, title, description and location.
- Optional AI suggestion preview: category, priority, summary and department.
- Personal ticket list with text search and filters.
- Ticket detail with status timeline, remarks and comments.
- Profile with account details.

### 8.3 Administrator module

- Dashboard counts by status, unassigned and urgent tickets.
- Queue with server-side pagination and filters (status, category, priority, assignee, date range,
  text).
- Assignment to active administrators, with an assignment note.
- Status transition control restricted to allowed transitions.
- Administrator remarks and comments.
- CSV export of the filtered queue.

### 8.4 Main Administrator module

- Institution dashboard: tickets plus student, administrator and category counts.
- User directory filtered by role and text.
- Create `ADMIN` and `MAIN_ADMIN` accounts; students must self-register.
- Activate/deactivate accounts, with self-deactivation and last-Main-Admin protection.
- Category create/edit/activate/deactivate with duplicate-name protection.
- Confidential report: totals, status/category/priority distributions and administrator performance.
- Confidential CSV export.
- Access to the full administrator ticket workflow.

### 8.5 Reporting module

Reports accept an optional `from` and `to` date. Output includes:

- generation timestamp and range;
- total ticket count;
- counts by status, category and priority;
- per-administrator assigned, resolved and active assignment counts.

Reports are generated on demand. No report is stored, so the reported range is always explicit.

### 8.6 Optional AI module

```text
Student clicks “Get AI suggestion”
        │
        ▼
POST /api/ai/suggest {title, description}
        │
        ▼
AiService builds a constrained prompt from active categories + priorities
        │
        ▼
GeminiClient calls Google generateContent (server-side key)
        │
        ▼
Validate category and priority; truncate free text
        │
        ├── valid → available=true, labelled suggestion
        └── invalid/unavailable/disabled → available=false with a note
        │
        ▼
Student may apply or ignore; submission does not depend on AI
```

---

## 9. API design

The API is REST-style and returns JSON except for CSV exports. Protected endpoints require a bearer
token.

| Group | Main endpoints |
| --- | --- |
| Public | `GET /api/health`, `POST /api/auth/register`, `POST /api/auth/login` |
| Session | `GET /api/auth/me` |
| Categories | `GET /api/categories` |
| Student tickets | `POST /api/tickets`, `GET /api/tickets/my-tickets`, `GET /api/tickets/stats`, `GET /api/tickets/{id}`, `GET /api/tickets/{id}/history`, `GET /api/tickets/{id}/comments` |
| AI | `POST /api/ai/suggest` |
| Administrator | `GET /api/admin/dashboard`, `GET /api/admin/tickets`, `GET /api/admin/tickets/{id}`, `PUT /api/admin/tickets/{id}/status`, `PUT /api/admin/tickets/{id}/assign`, `POST /api/admin/tickets/{id}/comments`, `GET /api/admin/tickets/export`, `GET /api/admin/admins`, `GET /api/admin/categories` |
| Main Administrator | `GET /api/main-admin/dashboard`, `GET /api/main-admin/users`, `POST /api/main-admin/admins`, `PUT /api/main-admin/users/{id}/status`, `GET /api/main-admin/reports`, `GET /api/main-admin/reports/export`, `GET/POST /api/main-admin/categories`, `PUT /api/main-admin/categories/{id}` |

### 9.1 Error contract

```json
{
  "timestamp": "2026-11-16T10:15:30Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/tickets",
  "fieldErrors": {
    "title": "Title is required"
  }
}
```

Error responses never include stack traces or SQL details. `401` and `403` are also rendered as JSON
by the security layer.

---

## 10. Security design

| Threat | Control |
| --- | --- |
| Password disclosure | BCrypt hashing; hashes never serialised |
| Privilege escalation at registration | Role is fixed server-side to `STUDENT` |
| Session theft / CSRF | Stateless bearer token; no cookie session; CSRF disabled appropriately for token auth |
| Unauthorized route access | URL rules plus service-level checks |
| Cross-student data access | Ownership check returns `404` for another student’s ticket |
| Invalid workflow changes | Server-side transition table |
| Assigning arbitrary users | Assignee must be an active `ADMIN` or `MAIN_ADMIN` |
| Account lockout | Self-deactivation and last active Main Admin removal blocked |
| SQL injection | Parameter binding through Spring Data JPA |
| XSS | React escaping; no `dangerouslySetInnerHTML` |
| Secret leakage | Environment variables; no real keys committed |
| CORS abuse | Explicit origins from `FRONTEND_ORIGIN` |
| AI key exposure | Backend-only call |
| Error leakage | Generic error bodies; no stack traces |

### 10.1 Residual risks

- No rate limiting is built into the application; a reverse proxy should protect login and AI
  endpoints.
- No email verification, password reset or multi-factor authentication.
- CSV cells derived from user input may be interpreted as formulas by some spreadsheet clients.
  Production hardening should neutralise leading `=`, `+`, `-` and `@`.
- JWT revocation is not implemented; a token remains valid until expiry. A short expiry or a token
  version claim would improve this.

---

## 11. Ticket lifecycle

### 11.1 State machine

```text
                    ┌──────────────┐
                    │  SUBMITTED   │
                    └──┬────┬───┬──┘
            assign     │    │   │ reject
                       ▼    │   ▼
                 ┌─────────┐│ ┌──────────┐
                 │ASSIGNED ││ │ REJECTED │
                 └──┬───┬──┘│ └──┬───┬───┘
        in progress │   │resolve  │   │ reopen
                    ▼   ▼      assign/in progress
              ┌────────────┐  └───────┘
              │ IN_PROGRESS│
              └──┬──────┬──┘
          resolve│      │reject
                 ▼      ▼
             ┌─────────┐
             │ RESOLVED│──────────────┐
             └──┬───┬──┘   reopen     │
          close │   └──────────────► IN_PROGRESS
                ▼
            ┌────────┐
            │ CLOSED │──── reopen ───► IN_PROGRESS
            └────────┘
```

The exact server-side table is:

| From | Allowed to |
| --- | --- |
| `SUBMITTED` | `ASSIGNED`, `IN_PROGRESS`, `REJECTED` |
| `ASSIGNED` | `IN_PROGRESS`, `RESOLVED`, `REJECTED` |
| `IN_PROGRESS` | `RESOLVED`, `REJECTED` |
| `RESOLVED` | `CLOSED`, `IN_PROGRESS` |
| `CLOSED` | `IN_PROGRESS` |
| `REJECTED` | `ASSIGNED`, `IN_PROGRESS` |

### 11.2 Audit behaviour

- Creating a ticket writes an initial history entry.
- Every status change writes `from_status`, `to_status`, actor, remarks and timestamp.
- Every assignment writes an assignment row with the actor and note, and deactivates the previous
  active assignment.
- Comments are immutable records with author and timestamp.
- Resolution sets `resolved_at`.

---

## 12. User interface design

### 12.1 Design language

- Institutional navy and white palette with clear status colours.
- IBM Plex Sans typography.
- Consistent cards, tables, badges, buttons, form fields and empty states.
- Responsive navigation with a mobile drawer.
- Accessible labels, visible focus states and semantic buttons.

### 12.2 Page inventory

| Area | Pages |
| --- | --- |
| Public | Landing, student login, administrator login, Main Administrator login, registration, 404 |
| Student | Dashboard, submit complaint, my tickets, ticket detail, profile |
| Administrator | Dashboard, ticket queue, ticket detail, profile |
| Main Administrator | Dashboard, ticket queue, ticket detail, users, categories, reports, profile |

### 12.3 UX states

Every data-driven page handles:

- **loading** — spinner or skeleton state;
- **error** — readable banner with retry where appropriate;
- **empty** — explanatory empty state rather than a blank table;
- **success** — toast confirmation for mutations;
- **unauthorized** — redirect to the correct login with a message.

---

## 13. Testing and validation

### 13.1 Strategy

| Level | Approach |
| --- | --- |
| Compilation | Maven compile with Java 21 target |
| Backend integration | Spring Boot + MockMvc + H2 in MySQL mode |
| Security | Unauthenticated and role-restricted requests |
| Workflow | Full ticket lifecycle and invalid transition |
| Frontend build | `npm run build` production bundle |
| Manual/browser | Recommended after deployment; not automated in this repository |
| MySQL | Deployment-time verification; unavailable in the build environment |

### 13.2 Automated test cases

| # | Test | What it verifies |
| --- | --- | --- |
| 1 | `healthEndpointReportsDatabaseUp` | Public health endpoint and database connectivity |
| 2 | `studentRegistrationLoginAndProfileWork` | Registration, login, token use, `/api/auth/me` |
| 3 | `passwordMismatchAndValidationAreRejected` | DTO validation and password confirmation |
| 4 | `protectedEndpointsRequireValidToken` | JWT protection for private endpoints |
| 5 | `completeTicketWorkflowWithAdminAndMainAdmin` | Create → assign → progress → comment → resolve → history → reports → CSV → user admin |
| 6 | `invalidStatusTransitionIsRejected` | Server-side state machine enforcement |

### 13.3 Verified results

```text
Tests run: 6, Failures: 0, Errors: 0, Skipped: 0
```

Frontend:

```text
npm run build
✓ built in ... 
59 modules transformed
```

The build produces `frontend/dist` with hashed CSS and JavaScript assets.

### 13.4 What the tests do not prove

- They do not exercise a live MySQL 8 server.
- They do not call the live Gemini API.
- They do not render the React UI in a browser.
- They do not test the deployed Vercel/backend network path or CORS.

These are deployment-time verification items, not claims of completed testing.

---

## 14. Results and discussion

### 14.1 Achieved outcomes

1. A single structured channel for campus complaints.
2. Three role-specific experiences with server-enforced authorization.
3. A deterministic ticket lifecycle with a complete audit trail.
4. Searchable, filterable and exportable operational data.
5. Institution-level reporting for planning.
6. A responsive, consistent interface with explicit loading and error states.
7. A configurable optional AI assistant that cannot block core operations.
8. Reproducible backend tests and a production frontend build.

### 14.2 Discussion

The most important design choice is that **the server owns the workflow**. The UI shows only allowed
actions, but every transition, assignment, account change and category change is validated again in
the service layer. This prevents a user from bypassing the interface with direct HTTP calls.

Separating DTOs from entities also proved valuable: password hashes cannot leak through a careless
controller return, and API fields can evolve independently of the database.

The H2 test profile made the project verifiable without a database server. However, H2 is not a
substitute for MySQL verification. Differences in DDL, collation, timestamp precision and query
behaviour must be checked in the target environment.

The optional AI feature was deliberately scoped as a suggestion. Treating model output as
authoritative would introduce unpredictable classification and an external availability dependency.
Validating the output and labelling it for review keeps the human in control.

---

## 15. Limitations

1. Public registration does not verify email ownership.
2. No password reset/change flow.
3. No attachments or images.
4. No notifications (email/SMS/in-app real-time).
5. No refresh tokens or token revocation list.
6. No built-in rate limiting.
7. No automated browser end-to-end tests.
8. The user directory is returned as one list, not paginated.
9. Reports are on demand; no archive or scheduled delivery.
10. Live MySQL, live Gemini and live Vercel deployment were not verified in this environment.

---

## 16. Future scope

1. Email verification and password reset with a transactional mail provider.
2. File attachments with malware scanning and object storage.
3. Email/SMS notifications on assignment, status change and resolution.
4. SLA timers, escalation rules and breach reporting.
5. Refresh tokens, token revocation and optional multi-factor authentication.
6. Rate limiting and audit logging at the API gateway.
7. Paginated user directory and bulk account operations.
8. Scheduled reports, archived snapshots and dashboard visualisations.
9. Playwright/Cypress end-to-end tests and CI/CD pipelines.
10. Containerisation, infrastructure-as-code and automated MySQL migrations.
11. Fine-grained permissions (for example, category-specific administrators).
12. Student feedback and satisfaction ratings after closure.
13. Multi-department routing and department-level dashboards.
14. Accessibility audit against WCAG 2.2 AA.

---

## 17. Conclusion

CampusCare demonstrates a complete, secure and maintainable approach to campus complaint
management. It replaces informal reporting with a structured ticket lifecycle, gives students
visibility, gives administrators an accountable queue and gives leadership reliable institutional
data. The architecture separates presentation, business logic and persistence, and enforces
authorization and workflow rules on the server.

The delivered system compiles, passes six end-to-end backend integration tests and produces a
production frontend build. The remaining work is environment-specific: verifying MySQL 8, deploying
the backend over HTTPS, configuring the Vercel environment and exercising the browser flows. The
deployment runbook and verification ledger make those steps explicit and avoid overstating what has
already been proven.

---

## 18. References

1. Spring Boot Reference Documentation, VMware/Broadcom.
2. Spring Security Reference Documentation.
3. Jakarta Bean Validation 3.0 Specification.
4. MySQL 8.0 Reference Manual, Oracle Corporation.
5. React Documentation, Meta Open Source.
6. Vite Documentation.
7. RFC 7519 — JSON Web Token (JWT).
8. OWASP Application Security Verification Standard and Password Storage Cheat Sheet.
9. Google Gemini API documentation.
10. Fielding, R. T., *Architectural Styles and the Design of Network-based Software Architectures*,
    doctoral dissertation, University of California, Irvine, 2000.

---

## Appendix A — Configuration summary

| Variable | Required | Purpose |
| --- | --- | --- |
| `DB_URL` | Production | JDBC URL |
| `DB_USERNAME` / `DB_PASSWORD` | Production | Database credentials |
| `JWT_SECRET` | Production | Token signing secret |
| `JWT_EXPIRATION_MS` | Optional | Token lifetime |
| `FRONTEND_ORIGIN` | Production | Allowed CORS origins |
| `MAIN_ADMIN_EMAIL` / `MAIN_ADMIN_PASSWORD` | First run only | Bootstrap Main Administrator |
| `DB_DDL_AUTO` | Recommended | `validate` in production |
| `GEMINI_API_KEY` | Optional | Enables AI suggestions |
| `GEMINI_ENABLED` / `GEMINI_MODEL` | Optional | AI kill switch and model |
| `DEMO_PASSWORD` | Dev only | Local demo accounts |
| `VITE_API_URL` | Frontend | Backend base URL (build-time) |

## Appendix B — Sample complaint payload

```json
{
  "categoryId": 1,
  "priority": "HIGH",
  "title": "Wi-Fi unavailable in CSE Block",
  "description": "The wireless network in the second-floor CSE corridor has been unavailable since 09:00. Around 40 students cannot access the lab resources.",
  "location": "CSE Block, Second Floor"
}
```

## Appendix C — Sample status update payload

```json
{
  "status": "IN_PROGRESS",
  "remarks": "Network team assigned and investigating the access point."
}
```

## Appendix D — Academic demonstration script

1. Open the landing page and explain the three portals.
2. Register a new student.
3. Submit a complaint, optionally requesting an AI suggestion.
4. Show the student dashboard, filters and ticket history.
5. Log in as an administrator and show the queue filters.
6. Assign the complaint, move it to `IN_PROGRESS`, add a comment and resolve it.
7. Log in as the student and show the updated timeline and comment.
8. Log in as Main Administrator and show users, categories and reports.
9. Export both CSV files.
10. Explain the security checks and the verified test results, and explicitly list the
    deployment-time checks that remain.
