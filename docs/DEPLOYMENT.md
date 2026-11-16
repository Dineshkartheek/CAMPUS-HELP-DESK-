# CAMPUSCARE — Deployment Guide

This guide deploys the rebuilt stack:

- **Frontend:** React 18 + Vite 5 → Vercel
- **Backend:** Spring Boot 3.5 / Java 21 → any Java host (Render, Railway, Fly.io, Azure, VPS)
- **Database:** MySQL 8 → any managed MySQL provider (Aiven, Railway, Azure Database for MySQL, ...)

The repository root already contains `vercel.json`, so the existing Vercel project continues to
build the frontend from `frontend/`.

---

## 1. Prepare MySQL 8

Create the database and run the schema:

```sql
SOURCE database/schema.sql;
-- optional demo data for a presentation:
SOURCE database/sample_data.sql;
```

Create a least-privilege application user:

```sql
CREATE USER 'campuscare_user'@'%' IDENTIFIED BY 'use-a-strong-password';
GRANT SELECT, INSERT, UPDATE, DELETE ON campuscare_db.* TO 'campuscare_user'@'%';
FLUSH PRIVILEGES;
```

The application performs inserts, updates and reads only — it never runs DDL. Run the schema
yourself (once), and keep the database user away from `CREATE`/`DROP` in production.

If your provider gives you a single `MYSQL_URL` / connection string, convert it to a JDBC URL:

```text
mysql://user:password@host:3306/campuscare_db  →  jdbc:mysql://host:3306/campuscare_db?useSSL=true&serverTimezone=UTC
```

---

## 2. Deploy the backend

### 2.1 Environment variables

| Variable | Required | Example / notes |
| --- | --- | --- |
| `DB_URL` | yes | `jdbc:mysql://host:3306/campuscare_db?useSSL=true&serverTimezone=UTC` |
| `DB_USERNAME` | yes | database user |
| `DB_PASSWORD` | yes | database password |
| `JWT_SECRET` | yes | random ≥ 32 bytes, e.g. `openssl rand -base64 48` |
| `JWT_EXPIRATION_MS` | no | default `86400000` (24 h) |
| `FRONTEND_ORIGIN` | yes | `https://your-app.vercel.app` (comma-separated for previews) |
| `UPLOAD_DIR` | no | default `uploads`; must be a **persistent disk** |
| `MAIN_ADMIN_EMAIL` | first start | bootstraps the first Main Admin |
| `MAIN_ADMIN_PASSWORD` | first start | remove after the first successful start |
| `MAIN_ADMIN_NAME` | no | display name |
| `PORT` | host-dependent | most platforms inject this automatically |

Do **not** set `DEMO_PASSWORD` in production. Never commit real values.

### 2.2 Build

```bash
cd backend
mvn clean package -DskipTests
# artifact: target/campuscare-backend-1.0.0.jar
```

Run locally:

```bash
java -jar target/campuscare-backend-1.0.0.jar
```

### 2.3 Render example

1. New **Web Service** → connect the GitHub repository.
2. Root directory: `backend`.
3. Build command: `mvn clean package -DskipTests`.
4. Start command: `java -jar target/campuscare-backend-1.0.0.jar`.
5. Runtime: Java 21.
6. Add the environment variables above.
7. Add a persistent disk mounted at `/opt/uploads` and set `UPLOAD_DIR=/opt/uploads`.
8. Health check path: `/api/health`.

Railway/Fly.io/Azure use the same environment variables and start command (adapt the port).

> Attachments are written to `UPLOAD_DIR`. On ephemeral filesystems uploads disappear after a
> restart. Use a persistent volume, or replace the local store with S3/Cloud Storage in
> `ComplaintService`.

---

## 3. Deploy the frontend to Vercel

The root `vercel.json` already defines:

```json
{
  "installCommand": "cd frontend && npm install",
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist"
}
```

Steps:

1. Vercel project → **Settings → Environment Variables**.
2. Add `VITE_API_BASE_URL` = your deployed backend origin, e.g.
   `https://campuscare-api.onrender.com` (no trailing slash).
3. Apply it to Production and Preview.
4. Redeploy (Vite variables are baked in at build time).
5. Confirm the SPA rewrite serves `index.html` on direct route loads such as `/student/complaints`.

`VITE_API_BASE_URL` is the only supported frontend variable. `VITE_` is required for Vite to
expose it to browser code. Never put a backend URL directly in source files.

### CORS

Set the backend `FRONTEND_ORIGIN` to the exact Vercel origin(s):

```text
FRONTEND_ORIGIN=https://your-app.vercel.app,https://your-preview.vercel.app
```

No wildcard with credentials is used. Restart/redeploy the backend after changing it.

---

## 4. First-run bootstrap

1. Set `MAIN_ADMIN_EMAIL` + `MAIN_ADMIN_PASSWORD` and start the backend.
2. The initializer creates the Main Admin only if the email does not exist (BCrypt-hashed).
3. Sign in at `/login` → **Main Admin**.
4. Create administrators under **Manage Admins**.
5. Remove `MAIN_ADMIN_PASSWORD` from the environment.

Students register themselves; public registration always creates `STUDENT` accounts.

---

## 5. Smoke-test checklist

After deployment:

- [ ] `GET https://<backend>/api/health` → `status: UP`, `database: UP`
- [ ] Register a student and sign in
- [ ] Submit a complaint (with and without an attachment)
- [ ] Confirm the student sees only their own complaints (and another student gets 404)
- [ ] Admin signs in, assigns the complaint, updates status with remarks
- [ ] Student sees the new status/remarks and history
- [ ] Main Admin sees the confidential support report and updates it
- [ ] Admin receives 403 for `/api/main-admin/**`
- [ ] Main Admin analytics loads and charts render
- [ ] Browser refresh on a deep route works (SPA rewrite)
- [ ] CSV/attachment download works over HTTPS (if used)

---

## 6. Security checklist

- [ ] Rotate `JWT_SECRET` and DB password before launch.
- [ ] HTTPS only; secure cookies are not used (JWT is sent in the `Authorization` header).
- [ ] Restrict MySQL network access; use a least-privilege user.
- [ ] Remove demo accounts (or never run `sample_data.sql` in production).
- [ ] Remove `MAIN_ADMIN_PASSWORD` after bootstrap.
- [ ] Configure backups and persistent attachment storage.
- [ ] Add rate limiting at the reverse proxy if the API is public.
- [ ] Keep dependencies updated (`mvn versions:display-dependency-updates`, `npm audit`).

---

## 7. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Frontend shows "Backend URL is not configured" | `VITE_API_BASE_URL` missing at build | Add it in Vercel and redeploy |
| CORS error in browser | Origin not in `FRONTEND_ORIGIN` | Add exact origin, restart backend |
| 401 immediately after login | `JWT_SECRET` changed/restarted, token expired | Sign in again; keep a stable secret |
| 403 for main-admin pages | Account is `ADMIN`, not `MAIN_ADMIN` | Use a Main Admin account |
| `Communications link failure` | DB unreachable / wrong URL | Check host, port, SSL, firewall |
| Schema errors on startup | Schema not applied | Run `database/schema.sql` manually |
| Uploads vanish after restart | Ephemeral disk | Mount a persistent volume or use object storage |
| Vercel 404 on refresh | Rewrites missing | Keep the root `vercel.json` rewrites |
| `JWT_SECRET is not configured` | Production without secret | Set a long random secret |

---

## 8. Verification status

The repository's automated checks are the backend test suite on H2 (`mvn test`) and the frontend
production build (`npm run build`). A live MySQL connection, the live Vercel deployment, and a
live backend host must be verified with your own accounts/credentials; they are not claimed as
verified by the repository alone.
