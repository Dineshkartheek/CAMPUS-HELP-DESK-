# VIVA QUESTIONS AND MODEL ANSWERS — CampusCare

**Project:** CampusCare — Smart Campus Help Desk Management System  
**Stack:** Java 21, Spring Boot 3, Spring Data JPA, Spring Security, JWT, MySQL 8, React 18, Vite 5

These are 20 likely viva questions with answers grounded in the implemented code. Code references use
the repository paths so an examiner can inspect the actual implementation.

---

## Q1. Why did you choose Java 21, and which Java features matter in this project?

**Answer:** Java 21 is a long-term-support release, so it provides a stable language and runtime for
an academic and production-style project. The backend targets Java 21 in `backend/pom.xml`
(`<java.version>21</java.version>`), which compiles with `--release 21` semantics.

Relevant language and library features used here:

- **Records** for immutable request/response DTOs such as `TicketDtos.TicketCreateRequest`,
  `AdminDtos.ReportResponse` and `AuthDtos.UserSummary`. Records remove boilerplate and make the API
  contract explicit.
- **`var`** sparingly for local variables where the type is obvious.
- **Text blocks** for the Gemini prompt and in test payloads, which keeps multi-line JSON readable.
- **Enhanced switch/instance patterns** are available on Java 21, although this codebase favours
  simple enum comparisons and maps for workflow rules.
- **`java.time`** (`Instant`, `LocalDate`) for audit timestamps and date-range filters.
- **Try-with-resources and the modern HTTP client** are used where applicable; the Gemini client uses
  Spring's HTTP facilities.

Java 21 also lets the project run on newer JDKs (the build environment used a Java 26 runtime to
compile a Java 21 target), while remaining compatible with standard Java 21 hosting images.

---

## Q2. Why Spring Boot instead of plain Spring or Servlets?

**Answer:** Spring Boot removes a large amount of manual configuration while preserving the Spring
programming model. In this project it provides:

1. **Starters** — `spring-boot-starter-web`, `data-jpa`, `security`, `validation` bring compatible
   dependency sets.
2. **Auto-configuration** — Spring Boot configures the servlet container, Jackson, JPA, security and
   datasource from properties.
3. **Embedded server** — the application runs as a single executable JAR with Tomcat embedded, so
   deployment does not require a separate application server.
4. **Externalised configuration** — `application.properties` maps environment variables such as
   `DB_URL`, `JWT_SECRET` and `PORT`, which suits container and cloud hosting.
5. **Testing support** — `@SpringBootTest`, `MockMvc` and test slices make integration testing
   practical.
6. **Production features** — logging, validation integration, error handling and profile support come
   out of the box.

Plain Servlets would require manual routing, JSON handling, dependency wiring, transaction
management and security filters, increasing boilerplate and risk.

---

## Q3. Explain the layered architecture of your backend.

**Answer:** The backend follows a controller → service → repository → database structure:

| Layer | Responsibility | Project examples |
| --- | --- | --- |
| Controller | HTTP routing, status codes, request binding | `TicketController`, `AdminController`, `MainAdminController` |
| Service | Business rules, authorization, transactions | `TicketService`, `AdminService`, `MainAdminService`, `AuthService` |
| Repository | Persistence and queries | `TicketRepository`, `UserRepository`, `CategoryRepository` |
| Model | JPA entities and enums | `Ticket`, `User`, `TicketStatus`, `Priority` |
| DTO | API contracts and validation | `TicketDtos`, `AdminDtos`, `AuthDtos` |
| Security | Authentication/authorization | `JwtAuthenticationFilter`, `SecurityConfig` |
| Cross-cutting | Errors, mapping, utilities | `GlobalExceptionHandler`, `DtoMapper`, `CsvUtil` |

Benefits:

- Controllers stay thin; business rules are testable without HTTP.
- Persistence changes do not automatically change the API.
- Security and transaction boundaries are explicit.
- Entities are never returned directly, avoiding accidental password-hash exposure.

---

## Q4. What is dependency injection, and how does Spring perform it here?

**Answer:** Dependency injection means a class receives the objects it depends on instead of creating
them with `new`. This reduces coupling and makes testing easier.

In CampusCare, services and controllers declare constructor parameters:

```java
public TicketController(TicketService ticketService) {
    this.ticketService = ticketService;
}
```

Spring scans `@Service`, `@Repository`, `@RestController` and `@Configuration` classes and builds a
singleton bean for each. When it creates `TicketController`, it resolves `TicketService` and its
dependencies recursively. This is **constructor injection**, which is preferred because:

- dependencies are explicit and final;
- the object cannot be constructed in an invalid state;
- tests can pass mocks or fakes directly;
- circular dependencies are easier to detect.

`@Bean` methods in `SecurityConfig` provide framework objects such as `PasswordEncoder`,
`AuthenticationProvider` and `SecurityFilterChain`.

---

## Q5. What is Spring Data JPA, and how does it differ from JDBC?

**Answer:** JDBC is a low-level API where the developer writes SQL, opens connections and maps result
sets manually. Spring Data JPA sits on top of JPA/Hibernate and provides repository interfaces that
generate implementations at runtime.

In this project:

```java
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    long countByStatus(TicketStatus status);
    Page<Ticket> searchStudentTickets(Long studentId, TicketStatus status, ...);
}
```

Spring Data derives queries from method names (`countByStatus`) and supports explicit `@Query`
methods for complex filters. Benefits:

- no manual result-set mapping;
- parameter binding prevents SQL injection;
- pagination and sorting are built in (`Pageable`, `Page`);
- entity relationships are managed by the persistence context;
- transactions integrate with Spring.

Important caveats:

- JPA is not a replacement for understanding SQL; report queries still need indexes.
- Lazy loading outside a transaction can fail; the project sets `spring.jpa.open-in-view=false` and
  maps responses inside transactional service methods.
- Bulk operations and reporting can be more efficient with native queries; the schema includes
  indexes for these filters.

---

## Q6. Why do you use DTOs instead of returning JPA entities from controllers?

**Answer:** Entities represent database state; DTOs represent the API contract. Separating them
provides:

1. **Security** — `User.passwordHash` can never leak because `UserSummary` simply does not contain
   it.
2. **Stability** — adding a database column does not automatically expose it.
3. **Shape control** — the API returns nested `CategoryDto`, `UserSummary`, computed counts and
   formatted timestamps instead of raw object graphs.
4. **Validation** — request DTOs carry Bean Validation annotations such as `@NotBlank`, `@Email` and
   `@Size`.
5. **Serialisation safety** — avoids lazy-loading exceptions and circular references between
   `Ticket`, `User` and `Category`.
6. **Immutability** — Java records make request/response objects concise and effectively immutable.

`DtoMapper` centralises entity-to-DTO conversion so controllers stay clean.

---

## Q7. How does Bean Validation work in your API?

**Answer:** Request records use Jakarta Bean Validation annotations, and controllers annotate request
bodies with `@Valid`. For example:

```java
public record TicketCreateRequest(
        @NotNull(message = "Please select a category") Long categoryId,
        @NotBlank @Size(max = 160) String title,
        @NotBlank @Size(max = 5000) String description,
        @NotBlank @Size(max = 180) String location,
        Priority priority,
        ...
) {}
```

```java
@PostMapping
public ResponseEntity<TicketResponse> create(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody TicketCreateRequest request) { ... }
```

When validation fails, Spring throws `MethodArgumentNotValidException`. The
`GlobalExceptionHandler` converts it into a `400` response with a `fieldErrors` map. Other handlers
cover malformed JSON, type mismatches and business exceptions. This gives the frontend stable field
errors instead of HTML error pages.

Validation is necessary but not sufficient: business rules such as "category must be active" are
checked in the service layer, and the database has check constraints as a final line of defence.

---

## Q8. Explain JWT authentication in your application.

**Answer:** JWT (JSON Web Token) is a signed, self-contained token defined by RFC 7519. The backend
issues it after a successful login and verifies it on each protected request.

Flow:

1. `POST /api/auth/login` receives email and password.
2. `AuthenticationManager` delegates to `DaoAuthenticationProvider`.
3. `CustomUserDetailsService` loads the user; `BCryptPasswordEncoder` verifies the password.
4. `JwtService` creates a token with the user id/subject, role and issue/expiry times, signed with
   `JWT_SECRET` using HMAC.
5. The client sends `Authorization: Bearer <token>`.
6. `JwtAuthenticationFilter` validates the signature and expiry, loads the user and places an
   authenticated principal in the `SecurityContext`.
7. `SecurityConfig` authorizes the URL based on the role.

Why JWT here:

- stateless, so no server session store is needed;
- works naturally with a separately hosted React SPA;
- scales horizontally because any backend instance with the same secret can validate the token.

Limitations:

- a JWT cannot be revoked before expiry without extra state;
- the secret must be strong and rotated carefully;
- tokens must be transmitted only over HTTPS;
- role changes take effect when a new token is issued (or when the filter re-checks the user).

The project uses a 24-hour default expiry, configurable with `JWT_EXPIRATION_MS`.

---

## Q9. Why BCrypt instead of SHA-256 for passwords?

**Answer:** SHA-256 is a fast general-purpose hash. Fast hashes are bad for passwords because an
attacker with a stolen database can test billions of guesses per second using GPUs. BCrypt is
deliberately slow and adaptive:

- it includes a **salt** automatically, so identical passwords produce different hashes;
- it has a **cost factor** that can be increased as hardware improves;
- it is designed for password storage, unlike general-purpose hashes.

In CampusCare, `BCryptPasswordEncoder` hashes passwords during registration, administrator creation,
bootstrap and demo seeding. The hash is stored in `users.password_hash` and is excluded from every
DTO. Login uses `matches(rawPassword, storedHash)`, never string comparison.

BCrypt also has a 72-byte input limit, which is why password validation caps length at 72 characters.
Passwords are never logged or returned by the API.

---

## Q10. How does Spring Security protect your endpoints, and how are roles enforced?

**Answer:** `SecurityConfig` defines a stateless filter chain:

- CSRF is disabled because the API uses bearer tokens, not cookie sessions.
- Sessions are `STATELESS`.
- CORS uses the configured origins.
- `JwtAuthenticationFilter` runs before `UsernamePasswordAuthenticationFilter`.
- Authorization rules are declared by URL:

```java
.requestMatchers("/api/health", "/api/auth/register", "/api/auth/login").permitAll()
.requestMatchers("/api/main-admin/**").hasRole("MAIN_ADMIN")
.requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "MAIN_ADMIN")
.anyRequest().authenticated()
```

`hasRole("ADMIN")` expects an authority named `ROLE_ADMIN`; `UserPrincipal` supplies authorities
derived from the `Role` enum. Custom `AuthenticationEntryPoint` and `AccessDeniedHandler` return JSON
`401`/`403` instead of HTML.

Defence in depth:

- URL rules stop broad unauthorized access;
- service checks enforce ownership (a student can only read their own ticket);
- workflow checks enforce valid transitions;
- assignment checks require an active administrator;
- Main Admin checks prevent self-deactivation and removal of the last active Main Admin.

---

## Q11. How do you prevent a user from registering as an administrator?

**Answer:** The public registration DTO does not contain a `role` field. `AuthService.register`
explicitly assigns `Role.STUDENT`:

```java
User user = new User(
        request.fullName().trim(),
        normalizedEmail,
        passwordEncoder.encode(request.password()),
        Role.STUDENT,
        request.department());
```

Even if a client sends an extra `"role": "MAIN_ADMIN"` property, Jackson does not map it to the
record, and the service ignores it. Administrator accounts can only be created by an authenticated
`MAIN_ADMIN` through `POST /api/main-admin/admins`, whose DTO accepts only `ADMIN` or `MAIN_ADMIN`
and rejects `STUDENT`.

This is an example of **server-side trust boundaries**: the client is never trusted to choose its own
privilege level.

---

## Q12. Explain the ticket status workflow and how invalid transitions are prevented.

**Answer:** The lifecycle is:

| From | Allowed to |
| --- | --- |
| `SUBMITTED` | `ASSIGNED`, `IN_PROGRESS`, `REJECTED` |
| `ASSIGNED` | `IN_PROGRESS`, `RESOLVED`, `REJECTED` |
| `IN_PROGRESS` | `RESOLVED`, `REJECTED` |
| `RESOLVED` | `CLOSED`, `IN_PROGRESS` |
| `CLOSED` | `IN_PROGRESS` |
| `REJECTED` | `ASSIGNED`, `IN_PROGRESS` |

`AdminService.ALLOWED_TRANSITIONS` stores this as a `Map<TicketStatus, Set<TicketStatus>>`.
`updateStatus` loads the ticket, reads the current status, checks the requested status against the
set, and throws a `400` if the transition is not allowed. On success it:

1. updates the ticket status and remarks;
2. sets `resolved_at` when resolving;
3. writes an immutable `ticket_status_history` row with the actor, from/to status and remarks.

The React UI mirrors the same table to show only sensible buttons, but the server remains
authoritative. A user calling the API directly with an invalid transition is rejected. The database
also has a check constraint for the six valid status values.

---

## Q13. What does `@Transactional` do, and where is it important in this project?

**Answer:** `@Transactional` defines a transaction boundary. Spring starts a transaction before the
method, commits on normal return, and rolls back on runtime exceptions by default.

Important uses:

- **Ticket creation** — saving the ticket and the initial status-history row must succeed together.
- **Assignment** — deactivating the previous assignment, inserting the new assignment and updating
  the ticket must be atomic.
- **Status change** — updating the ticket and writing history must be atomic.
- **Administrator creation and deactivation** — validation and persistence must be consistent.
- **Report generation** — marked `readOnly = true` to express intent and allow provider
  optimisations.

Without a transaction, a failure between two writes could leave a ticket without history or two
active assignments. The service layer, not the controller, owns the transaction because that is
where the business operation is defined.

---

## Q14. How do you handle exceptions and produce consistent API errors?

**Answer:** Business code throws `ApiException` with an HTTP status and a safe message, for example:

```java
throw ApiException.badRequest("Please select a valid active category.");
```

`GlobalExceptionHandler` uses `@RestControllerAdvice` to map:

| Exception | Status | Response |
| --- | --- | --- |
| `ApiException` | its status | message and path |
| `MethodArgumentNotValidException` | 400 | message plus `fieldErrors` |
| `HttpMessageNotReadableException` | 400 | malformed request message |
| `MethodArgumentTypeMismatchException` | 400 | invalid parameter message |
| `AccessDeniedException` | 403 | permission message |
| Unexpected `Exception` | 500 | generic message, details logged server-side |

The response shape is stable:

```json
{
  "timestamp": "2026-11-16T10:15:30Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/tickets",
  "fieldErrors": { "title": "Complaint title is required" }
}
```

Stack traces and SQL details are never returned to the client. This protects internals and gives the
React client one error format to display.

---

## Q15. How did you test the backend, and what is still unverified?

**Answer:** Testing uses a Spring Boot integration suite with `MockMvc` and an isolated H2 database
in MySQL compatibility mode (`src/test/resources/application-test.properties`,
`ddl-auto=create-drop`). The six tests cover:

1. health endpoint and database status;
2. student registration, login and profile;
3. password mismatch and validation failures;
4. JWT protection of private endpoints;
5. the complete workflow — create ticket, assign, progress, comment, resolve, history, Main Admin
   user creation, deactivation, reports and CSV export;
6. rejection of an invalid status transition.

Verified result:

```text
Tests run: 6, Failures: 0, Errors: 0, Skipped: 0
```

The frontend production build was also verified with `npm run build`.

What is **not** verified:

- a live MySQL 8 server (not available in the build environment);
- a live Gemini API call (no key);
- a deployed backend and Vercel project;
- browser-level E2E behaviour (no Playwright/Cypress suite yet).

H2 is useful for fast, repeatable tests, but it is not proof of MySQL compatibility. Before release,
the same smoke tests must run against MySQL, as documented in `docs/DEPLOYMENT.md`.

---

## Q16. How does the optional AI feature work, and why is it non-blocking?

**Answer:** The feature is an optional classification aid, not an authority.

1. The student clicks **Get AI suggestion**; the frontend calls `POST /api/ai/suggest` with title and
   description.
2. `AiService` checks whether `GeminiClient` is configured. If not, it returns `available: false`
   with a note.
3. It builds a constrained prompt using only active category names and the four priority values.
4. `GeminiClient` calls Gemini `generateContent` with the server-side API key.
5. The response is parsed as JSON and validated:
   - category must match an active category (case-insensitive);
   - priority must match the `Priority` enum;
   - summary and department are truncated to column limits.
6. Invalid or failed output returns `available: false`; a valid result is clearly labelled
   **“AI suggestion only”**.
7. The student applies or ignores it. The final category and priority are human decisions.
8. If the student keeps suggestion metadata, `TicketService.applyAiSuggestions` re-validates the
   category before storing it; invalid values are discarded rather than failing submission.

AI is non-blocking because complaint submission never calls Gemini. External latency, quota errors or
a missing key cannot prevent a student from submitting a complaint. The API key is backend-only and
never sent to the browser. Since no key was available, only the disabled/fallback path was exercised
in this environment.

---

## Q17. Explain your React architecture and state management.

**Answer:** CampusCare is a single-page React 18 application built with Vite. The main pieces are:

- **Routing** — React Router 6 defines public, student, administrator and Main Administrator routes
  in `App.jsx`.
- **`AuthContext`** — holds the current user, exposes `login`, `logout` and loading state, restores
  the session by calling `/api/auth/me` with the stored token, and listens for the global
  `campuscare:unauthorized` event.
- **`ToastContext`** — provides transient success/error notifications without prop drilling.
- **`Layout`** — one responsive shell that renders navigation based on the authenticated role.
- **Pages** — each page owns its remote data, loading, error and empty states, and calls the central
  `api` service.
- **Shared components** — `UI.jsx` provides cards, badges, buttons, tables, pagination, spinners and
  form fields so the UI stays consistent.

There is no Redux because the shared state is small: the authenticated user and toasts. Server data
is fetched per page rather than duplicated into a global store. This keeps the application simple and
avoids stale global caches. For a larger application, React Query or a store could be introduced for
caching and invalidation.

---

## Q18. How do protected routes and token expiry work on the frontend?

**Answer:** `ProtectedRoute` receives allowed roles. It checks `AuthContext`:

- while the session is being restored, it shows a loading screen;
- if there is no authenticated user, it redirects to the correct login route
  (`/login`, `/admin/login` or `/main-admin/login`);
- if the user has the wrong role, it redirects to that user's own dashboard rather than exposing the
  page;
- otherwise it renders the page inside `Layout`.

The token is stored in `sessionStorage` under `campuscare_token`. On startup, `AuthContext` calls
`/api/auth/me`; an invalid or expired token produces `401`, which clears the session.

The API client centralises `401` handling:

```js
if (response.status === 401 && authenticated) {
  tokenStore.clear();
  window.dispatchEvent(new Event('campuscare:unauthorized'));
}
```

`AuthContext` listens for that event, clears the user and triggers the redirect. This means every
page gets consistent expiry behaviour without duplicating logic. Using `sessionStorage` (rather than
`localStorage`) reduces persistence on shared machines, though any browser storage remains accessible
to JavaScript and must be protected by strong XSS defences.

---

## Q19. Why `VITE_API_URL`, and how does the frontend deployment work?

**Answer:** Vite exposes only environment variables prefixed with `VITE_` to client code via
`import.meta.env`. The original brief mentioned `CAMPUSCARE_BACKEND_URL`, which Vite would not read,
causing production builds to fall back to localhost or an empty base URL.

The fix: `frontend/src/services/api.js` reads:

```js
const configuredUrl = (import.meta.env.VITE_API_URL || '').trim();
export const API_BASE_URL = (
  configuredUrl || (import.meta.env.DEV ? 'http://localhost:8080' : '')
).replace(/\/+$/, '');
```

Key points:

- Local development falls back to `http://localhost:8080`.
- Production deliberately has **no localhost fallback**; a missing variable produces a clear
  configuration error instead of silent failure.
- The value is inlined at **build time**, so changing it requires a new Vercel deployment.
- Only non-secret configuration belongs in `VITE_` variables, because they are visible in the
  browser bundle.

Deployment:

- Root `vercel.json` runs `cd frontend && npm install`, builds `frontend`, and publishes
  `frontend/dist`.
- SPA rewrites send unknown paths to `index.html`.
- The Vercel environment sets `VITE_API_URL` to the public backend URL.
- The backend allows the frontend origin via `FRONTEND_ORIGIN` (CORS), because the SPA and API are on
  different domains. Credentials are not wildcarded.
- CSV downloads use the same bearer token and exposed `Content-Disposition` header.

This preserves the existing Vercel project while making the backend URL explicit and correct.

---

## Q20. Explain your database design, keys, constraints and indexes.

**Answer:** The schema has six required tables:

1. `users` — students, administrators and Main Administrators, distinguished by `role`.
2. `categories` — complaint categories with an `active` flag.
3. `tickets` — complaint records with student, category, priority, status, assignee, remarks, AI
   suggestion metadata and timestamps.
4. `ticket_comments` — messages on a ticket with author and timestamp.
5. `ticket_assignments` — assignment audit trail with assignee, assigning actor, note and active flag.
6. `ticket_status_history` — immutable status-change audit trail with actor and remarks.

Design choices:

- **Primary keys** are auto-increment `BIGINT` surrogate keys.
- **Unique constraints** protect `users.email`, `categories.name` and `tickets.ticket_number`.
- **Foreign keys** preserve referential integrity. Child history/comment/assignment rows cascade on
  ticket deletion; actor references do not cascade.
- **Check constraints** restrict `role`, `status` and `priority` to valid values at the database
  level, in addition to Java enums.
- **Indexes** support the real query patterns:
  - `users(email)` unique for login;
  - `users(role)` for user directory filters;
  - `tickets(student_id)` for student lists;
  - `tickets(status)`, `tickets(priority)`, `tickets(category_id)` for queue filters;
  - `tickets(assigned_admin_id)` for assignee filters;
  - `tickets(created_at)` for ordering and date-range reports;
  - foreign-key columns on comments, assignments and history for joins and lookups.
- **Current assignee denormalisation** on `tickets.assigned_admin_id` makes queue filtering fast,
  while `ticket_assignments` preserves history.
- **utf8mb4/InnoDB** supports full Unicode and transactions.
- **`TIMESTAMP(6)`** provides microsecond precision for audit ordering.

The schema is applied from `database/schema.sql`; production uses `DB_DDL_AUTO=validate` so Hibernate
checks rather than mutates the schema. H2 in MySQL mode is used only for development and tests, and
live MySQL verification remains a deployment-time task.

---

## Quick revision checklist

- Java 21 records, text blocks, `java.time`, LTS rationale.
- Spring Boot starters, auto-configuration, embedded Tomcat, external configuration.
- Controller → service → repository; constructor injection.
- JPA repositories, pagination, transactions, `open-in-view=false`.
- DTOs protect entities and password hashes.
- Bean Validation plus service and database checks.
- JWT is signed and stateless; BCrypt is salted and slow.
- Role rules at URL level, ownership and workflow checks in services.
- Public registration always creates `STUDENT`.
- State machine enforced server-side and mirrored in the UI.
- `@Transactional` keeps ticket + history/assignment writes atomic.
- Central exception handler returns safe JSON with field errors.
- Six backend integration tests pass on H2; MySQL/live AI/Vercel/browser E2E remain unverified.
- React Context for auth/toasts; protected routes; 401 clears session.
- `VITE_API_URL` is build-time and has no production localhost fallback.
- Six normalised MySQL tables with FKs, unique keys, checks and query-oriented indexes.
