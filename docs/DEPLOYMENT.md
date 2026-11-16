# DEPLOYMENT RUNBOOK — CampusCare

**Application:** CampusCare Smart Campus Help Desk  
**Stack:** Java 21 / Spring Boot 3.5.16 / MySQL 8 / React 18 (Vite 5) / Vercel  
**Audience:** the project owner or a deployment engineer with access to the repository, MySQL and
the hosting accounts.

> This runbook describes the intended production deployment. The backend, MySQL connection and live
> Vercel project were **not** deployed from the build environment because the required accounts,
> database server and credentials were unavailable. Every command below must be executed and verified
> in the target environment; do not treat this document as evidence that a live deployment exists.

---

## 1. Deployment topology

```text
Browser
  │  HTTPS
  ├──────────────► Vercel static site (React SPA, frontend/dist)
  │                     │
  │                     │ fetch(VITE_API_URL + /api/...)
  │                     ▼
  └──────────────► Java 21 backend (Spring Boot JAR/container, HTTPS)
                        │
                        │ JDBC (TLS where available)
                        ▼
                   MySQL 8 database (helpdesk_db)
```

- The frontend is a static single-page application. All data comes from the backend REST API.
- The backend is stateless; JWT authentication means no sticky sessions are required.
- MySQL is the only stateful component.
- The backend can run on Render, Railway, Fly.io, Azure App Service, a Java application host or a
  Linux VM. Provider-specific examples below are illustrative, not verified deployments.

---

## 2. Prerequisites

| Requirement | Notes |
| --- | --- |
| JDK 21+ | The project targets Java 21. A newer JDK can build it; the runtime must support 21. |
| Maven 3.9+ | No Maven wrapper is committed. Install Maven or add `mvnw`. |
| MySQL 8.0 | Production database. H2 is only for the local `dev` profile and tests. |
| Node.js 20+ and npm | Frontend build. Vite 5 requires Node 18+, but Node 20+ is recommended. |
| Git | Push the repository to the hosting provider. |
| Vercel account | Existing project for the frontend. |
| Backend host | Any HTTPS-capable Java 21 host. |

### 2.1 Generate secrets

Generate a JWT secret of at least 32 bytes. Examples:

```bash
openssl rand -base64 48
```

```powershell
# PowerShell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

Generate a separate strong database password. Never reuse the JWT secret as a password.

---

## 3. Database setup (MySQL 8)

### 3.1 Create the schema

From the repository root, with a MySQL administrator account:

```bash
mysql -u root -p < database/schema.sql
```

Or inside the MySQL client:

```sql
SOURCE database/schema.sql;
```

The script:

- creates `helpdesk_db` with `utf8mb4`;
- creates `users`, `categories`, `tickets`, `ticket_comments`, `ticket_assignments` and
  `ticket_status_history`;
- adds foreign keys, indexes and check constraints;
- inserts the eight initial categories with `INSERT IGNORE`;
- never inserts a password or deletes existing rows.

### 3.2 Create a least-privilege application user

For a schema managed only by `database/schema.sql` and `DB_DDL_AUTO=validate`:

```sql
CREATE USER 'campuscare_user'@'%' IDENTIFIED BY 'replace-with-a-strong-password';
GRANT SELECT, INSERT, UPDATE, DELETE ON helpdesk_db.* TO 'campuscare_user'@'%';
FLUSH PRIVILEGES;
```

If you deliberately use Hibernate `ddl-auto=update` in a controlled environment, also grant:

```sql
GRANT CREATE, ALTER, INDEX ON helpdesk_db.* TO 'campuscare_user'@'%';
```

Restrict the host part (`'%'`, `'localhost'` or a private subnet) to the actual backend network.

### 3.3 Production DDL policy

1. Run `database/schema.sql` once.
2. Set `DB_DDL_AUTO=validate` so Hibernate verifies the schema without modifying it.
3. Apply future schema changes through reviewed SQL migrations.

Do not use `create-drop` outside tests.

---

## 4. Backend configuration

All settings are environment variables. The canonical template is
[`backend/.env.example`](../backend/.env.example).

### 4.1 Required variables

| Variable | Example | Purpose |
| --- | --- | --- |
| `DB_URL` | `jdbc:mysql://db-host:3306/helpdesk_db?useSSL=true&serverTimezone=UTC` | JDBC connection |
| `DB_USERNAME` | `campuscare_user` | Database user |
| `DB_PASSWORD` | *(secret)* | Database password |
| `JWT_SECRET` | *(random 32+ byte secret)* | JWT signing key |
| `FRONTEND_ORIGIN` | `https://campuscare.vercel.app` | Allowed browser origin(s) |
| `MAIN_ADMIN_EMAIL` | `mainadmin@yourcollege.edu` | One-time bootstrap email |
| `MAIN_ADMIN_PASSWORD` | *(strong password, 8+ chars)* | One-time bootstrap password |

### 4.2 Recommended variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8080` | HTTP port (most hosts set this automatically) |
| `JWT_EXPIRATION_MS` | `86400000` (24 h) | Token lifetime |
| `DB_DDL_AUTO` | `update` | Set to `validate` in production |
| `MAIN_ADMIN_NAME` | `CampusCare Main Administrator` | Bootstrap display name |
| `GEMINI_ENABLED` | `true` | Set `false` to disable AI entirely |
| `GEMINI_API_KEY` | empty | Enables AI suggestions when present |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model name |

### 4.3 Notes

- `FRONTEND_ORIGIN` is comma-separated. Use exact origins without a trailing slash:
  `https://campuscare.vercel.app,https://campuscare-git-main.vercel.app`.
- Wildcards are supported by `allowedOriginPatterns` (for example `https://*.vercel.app`), but
  prefer explicit production and preview origins. Do not allow `*` with credentials.
- The backend refuses to start in production when `JWT_SECRET` is blank.
- `MAIN_ADMIN_PASSWORD` is only used to create the account if the email does not exist. It never
  resets an existing password.

---

## 5. Build and run the backend

### 5.1 Local production-style run

```bash
cd backend
mvn clean package
java -jar target/campuscare-backend-1.0.0.jar
```

Windows PowerShell:

```powershell
cd backend
mvn clean package
java -jar target\campuscare-backend-1.0.0.jar
```

Before starting, export the variables from section 4 in the shell, IDE run configuration or host
dashboard. Then verify:

```bash
curl https://your-backend-host/api/health
```

Expected healthy response:

```json
{
  "application": "CampusCare",
  "timestamp": "2026-11-16T00:00:00Z",
  "status": "UP",
  "database": "UP"
}
```

A `503` with `database: DOWN` means the JDBC URL, credentials, network access or schema is wrong.

### 5.2 Hosting option A — Java buildpack host

On a host that detects Maven projects:

- **Root directory:** `backend`
- **Build command:** `mvn -B -DskipTests clean package`
- **Start command:** `java -Dserver.port=$PORT -jar target/campuscare-backend-1.0.0.jar`
- **Health check path:** `/api/health`

The repository does not include a Maven wrapper, so either install Maven in the build image or add
`mvnw`/`.mvn` before relying on wrapper-based commands. Run tests in CI separately rather than
skipping them blindly in the deploy pipeline.

### 5.3 Hosting option B — container host

A minimal multi-stage example (not committed or built in this environment):

```dockerfile
# Example only — verify before production use.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/campuscare-backend-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

Set the environment variables in the platform, not in the image. The container must be able to reach
MySQL over the private network or the public internet with TLS.

### 5.4 TLS and proxy

- Terminate HTTPS at the hosting provider or reverse proxy.
- Forward the `Authorization` header unchanged.
- Allow request bodies needed by the API (complaint descriptions up to 5,000 characters).
- If you add rate limiting, protect `/api/auth/login`, `/api/auth/register` and `/api/ai/suggest`
  first.

---

## 6. Vercel frontend deployment

The repository root contains a `vercel.json` that preserves the existing project layout:

```json
{
  "installCommand": "cd frontend && npm install",
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": null,
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### 6.1 Configure the environment variable

1. Open the Vercel project for this repository.
2. Go to **Settings → Environment Variables**.
3. Add:

   | Name | Value | Environments |
   | --- | --- | --- |
   | `VITE_API_URL` | `https://your-backend-host` | Production, Preview, Development |

4. Do **not** use `CAMPUSCARE_BACKEND_URL`. Vite only exposes variables prefixed with `VITE_`.
5. Do not add a trailing slash. The client strips trailing slashes, but a clean URL is clearer.
6. Redeploy. Vite reads `VITE_API_URL` at **build time**; changing it requires a new build.

### 6.2 Root project settings

- **Framework preset:** Other / no framework (the root `vercel.json` overrides build commands).
- **Root directory:** repository root.
- **Build command:** inherited from `vercel.json` (`cd frontend && npm run build`).
- **Output directory:** `frontend/dist`.
- **Install command:** `cd frontend && npm install`.

If instead you create a Vercel project with the root directory set to `frontend`, Vercel uses
`frontend/vercel.json` and `npm run build` from that directory. Use one approach, not both.

### 6.3 Verify the frontend

1. Open the deployed URL.
2. The landing page loads without a build error.
3. The browser console shows no requests to `http://localhost:8080`.
4. Open DevTools → Network and confirm API calls go to the deployed backend URL.
5. Register a test student, log in, and submit a complaint.
6. If calls fail with a CORS error, fix `FRONTEND_ORIGIN` on the backend and redeploy/restart it.

---

## 7. First Main Administrator

No administrator password is committed to the repository.

1. Set `MAIN_ADMIN_EMAIL`, `MAIN_ADMIN_PASSWORD` (8+ characters) and optionally `MAIN_ADMIN_NAME`.
2. Start or restart the backend once.
3. Check the logs for `Created MAIN_ADMIN account: <email>`.
4. Sign in at `https://your-frontend/main-admin/login`.
5. Change the bootstrap secret out of the environment after confirming access:
   - remove `MAIN_ADMIN_PASSWORD` (and optionally `MAIN_ADMIN_EMAIL`) from the host;
   - restart the backend.
6. Create additional administrators from **Main Administrator → User management**.

The initializer only creates the account when the email does not already exist. It never changes an
existing password. If you lose the password, there is currently no self-service reset; recover access
through a controlled database/administrative procedure.

---

## 8. Post-deployment smoke test

Run these against the deployed URLs. Replace hostnames and values.

### 8.1 Health

```bash
curl -sS https://your-backend-host/api/health
```

### 8.2 Register a student

```bash
curl -sS -X POST https://your-backend-host/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Smoke Test Student",
    "email": "smoke.student@example.com",
    "password": "StrongPass123!",
    "confirmPassword": "StrongPass123!",
    "department": "CSE"
  }'
```

### 8.3 Log in and capture the token

PowerShell example:

```powershell
$login = Invoke-RestMethod -Method Post `
  -Uri "https://your-backend-host/api/auth/login" `
  -ContentType "application/json" `
  -Body '{"email":"smoke.student@example.com","password":"StrongPass123!"}'
$token = $login.token
```

Bash example with `jq`:

```bash
TOKEN=$(curl -sS -X POST https://your-backend-host/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke.student@example.com","password":"StrongPass123!"}' | jq -r .token)
```

### 8.4 Create a complaint

```bash
curl -sS -X POST https://your-backend-host/api/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": 1,
    "priority": "MEDIUM",
    "title": "Smoke test complaint",
    "description": "Verifying the deployed complaint workflow end to end.",
    "location": "CSE Block, Room 101"
  }'
```

### 8.5 Verify the administrator workflow in the browser

1. Log in as Main Administrator.
2. Open **Tickets**, find the smoke-test ticket, assign an administrator, move it to
   `IN_PROGRESS`, add a comment, then resolve it.
3. Open **Reports** and confirm the ticket appears.
4. Export the ticket queue CSV and the confidential report CSV.
5. Log in as the student and confirm the status timeline and comment are visible.

### 8.6 Verify token expiry behaviour

- Let a token expire (or shorten `JWT_EXPIRATION_MS` temporarily), then use the app.
- The next API call should return `401`, clear `sessionStorage`, and redirect to the correct login
  page with a message.

---

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Frontend says “CAMPUSCARE API is unavailable” | `VITE_API_URL` missing or wrong; backend down | Set the variable in Vercel and redeploy; check `/api/health` |
| Browser calls `http://localhost:8080` in production | Production build lacked `VITE_API_URL` | Add the variable and rebuild; Vite inlines it at build time |
| CORS error in console | `FRONTEND_ORIGIN` does not match the browser origin | Set the exact HTTPS origin, restart backend, retry |
| `403` for Main Admin pages | Signed in as `ADMIN`, not `MAIN_ADMIN` | Use the Main Admin account; role rules are server-side |
| `401` immediately after login | Wrong portal, expired token, or clock skew | Log in again; check server time and `JWT_EXPIRATION_MS` |
| `503` health with `database: DOWN` | Bad `DB_URL`, credentials, network or schema | Test with the MySQL client from the backend host |
| Backend fails at startup with missing JWT secret | `JWT_SECRET` unset outside dev/test | Set a 32+ byte secret |
| Hibernate schema validation fails | Schema drift between entities and MySQL | Apply `database/schema.sql`/migrations, then restart |
| `Unknown database 'helpdesk_db'` | Schema script not run or wrong host | Run `database/schema.sql` on the target server |
| Categories list is empty | Seed script skipped and initializer could not write | Confirm DB permissions and restart once |
| AI button returns “not configured” | `GEMINI_API_KEY` empty or AI disabled | Set the key and `GEMINI_ENABLED=true`; AI is optional |
| CSV download opens as text | Browser/proxy stripped `Content-Disposition` | Check proxy headers; the endpoint sets the filename |
| Vercel route returns 404 on refresh | SPA rewrite missing | Confirm root `vercel.json` is used and redeploy |
| Main Admin bootstrap did not run | Email exists, password blank/short, or no restart | Use a new email or a password of 8+ characters; restart |

### 9.1 Inspect backend logs

Hosting dashboards usually expose stdout. Look for:

- Flyway/Hibernate schema errors;
- `Communications link failure` (MySQL unreachable);
- `Access denied for user` (credentials/host grant);
- `Created MAIN_ADMIN account` (bootstrap success);
- `No active MAIN_ADMIN account exists` (bootstrap still needed).

---

## 10. Security checklist before public exposure

- [ ] `JWT_SECRET` is random, at least 32 bytes, and unique per environment.
- [ ] Database password is strong and not reused.
- [ ] MySQL is not publicly exposed; the app user has least privilege.
- [ ] Backend is served over HTTPS only.
- [ ] `FRONTEND_ORIGIN` lists only trusted origins.
- [ ] `MAIN_ADMIN_PASSWORD` removed after bootstrap.
- [ ] `DB_DDL_AUTO=validate` in production.
- [ ] H2 console is not enabled outside the `dev` profile.
- [ ] Rate limiting is applied to login, registration and AI endpoints at the proxy.
- [ ] Backups and restore drills are configured for MySQL.
- [ ] Dependency updates and secret rotation have an owner.
- [ ] Server time is synchronised (JWT expiry depends on it).
- [ ] Logs do not contain passwords, tokens or full request bodies with personal data.

---

## 11. Update and rollback procedure

### 11.1 Update the backend

1. Run `mvn test` and `mvn package` locally/CI.
2. Apply any reviewed SQL migration.
3. Deploy the new JAR/container.
4. Verify `/api/health` and a login.
5. Keep the previous artifact available for rollback.

Rollback: redeploy the previous JAR/container. If a migration was applied, follow the migration's
documented down-path or restore from a verified backup. Never reverse a schema change blindly.

### 11.2 Update the frontend

1. Set the required Vercel environment variables.
2. Push to the connected branch.
3. Confirm the deployment uses the intended commit.
4. Verify login, API calls and SPA refresh routes.

Rollback: promote the previous Vercel deployment in the project dashboard.

---

## 12. Deployment evidence template

Record the following after a real deployment:

| Item | Value / result |
| --- | --- |
| Deployment date | |
| Frontend URL | |
| Backend URL | |
| Backend host / region | |
| MySQL host / version | |
| `VITE_API_URL` set | |
| `FRONTEND_ORIGIN` set | |
| Health check result | |
| Student smoke test | |
| Administrator smoke test | |
| Main Admin smoke test | |
| CSV exports | |
| Gemini enabled? | |
| JWT expiry check | |
| Rollback artifact | |

Keep this record with the academic project report so the distinction between “implemented” and
“live-verified” is explicit.
