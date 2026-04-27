# MBA of BC — Deployment Guide

## Overview

| Component         | URL                         | Hosting             |
| ----------------- | --------------------------- | ------------------- |
| Forms (React SPA) | `https://forms.mbaofbc.com` | cPanel static files |
| API (Node.js)     | `https://api.mbaofbc.com`   | cPanel Node.js App  |
| Database          | localhost (cPanel server)   | cPanel PostgreSQL   |

---

## Pre-Deployment Checklist

- [ ] cPanel has **PostgreSQL Databases** (not just MySQL)
- [ ] cPanel has **Setup Node.js App** (under Software)
- [ ] You have the production API key: `4c6295c0376e8f81fe6da138fac82c808652c05af8040b7b0aea466226e46253`

---

## Part 1 — PostgreSQL Database

1. cPanel → **PostgreSQL Databases**
2. Create a new database, e.g. `mbaofbc_app`
   - cPanel will prefix it with your username: `yourusername_mbaofbc_app`
3. Create a new user, e.g. `mbaofbc_api`
   - Full name will be: `yourusername_mbaofbc_api`
4. **Add the user to the database** with all privileges
5. Note down:
   - Full database name
   - Full username
   - Password

---

## Part 2 — Create Two Subdomains

cPanel → **Subdomains**, create:

| Subdomain | Document Root       |
| --------- | ------------------- |
| `forms`   | `public_html/forms` |
| `api`     | `nodeapps/mba_api`  |

---

## Part 3 — Deploy the Forms App

**3a. Build for production (run locally)**

```bash
cd mba/mba_forms
npm run build
```

This produces the `dist/` folder with `VITE_API_URL` baked in as `https://api.mbaofbc.com`.

**3b. Upload via cPanel File Manager**

1. cPanel → **File Manager** → navigate to `public_html/forms/`
2. Upload all files from `mba/mba_forms/dist/`:
   - `index.html`
   - `.htaccess` ← required for React Router to work
   - `assets/` folder
   - `vite.svg`

> If you update `.env.production`, re-run `npm run build` and re-upload the `dist/` contents.

---

## Part 4 — Deploy the API

**4a. Upload files via cPanel File Manager**

1. cPanel → **File Manager** → navigate to `nodeapps/mba_api/`
2. Upload all files from `mba/mba_api/` — **exclude** these:
   - `node_modules/`
   - `.env` (you'll create this on the server)
   - `stderr.log`, `tmp/`

**4b. Create `.env` on the server**

In File Manager, create a new file at `nodeapps/mba_api/.env` with these contents.
**Fill in your actual database credentials from Part 1:**

```dotenv
NODE_ENV=production
PORT=3000
API_KEY=4c6295c0376e8f81fe6da138fac82c808652c05af8040b7b0aea466226e46253
CORS_ORIGIN=https://forms.mbaofbc.com

DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=yourusername_mbaofbc_app
DB_USER=yourusername_mbaofbc_api
DB_PASSWORD=your_db_password_here
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=false

FROM_EMAIL=forms@mbaofbc.com
ADMIN_EMAIL=MBAofBC.shirts@gmail.com
```

Use `DB_HOST=127.0.0.1` (not `localhost`) to avoid IPv6 `::1` pg_hba errors on shared hosting.
If your host requires encrypted PostgreSQL connections, set `DB_SSL=true`.

**4c. Create the Node.js app in cPanel**

cPanel → **Setup Node.js App** → **Create Application**:

| Field                    | Value                 |
| ------------------------ | --------------------- |
| Node.js version          | Latest LTS (20 or 22) |
| Application mode         | **Production**        |
| Application root         | `nodeapps/mba_api`    |
| Application URL          | `api.mbaofbc.com`     |
| Application startup file | `index.js`            |

**4d. Install dependencies**

In the Node.js App panel, click **"Run NPM Install"**

**4e. Run database migrations**

In the Node.js App terminal (or cPanel terminal), run:

```bash
cd nodeapps/mba_api
node_modules/.bin/sequelize-cli db:migrate
```

**4f. Start the app**

Click **Start** in the Node.js App panel.

---

## Part 5 — Verify

- `https://api.mbaofbc.com` → should return:
  ```json
  { "status": "ok", "message": "MBA API running", "environment": "production" }
  ```
- `https://forms.mbaofbc.com` → should show the form selector page
- `https://forms.mbaofbc.com/forms/shirt-order` → should load the shirt order form
- Submit a test order and confirm:
  - Customer receives a confirmation email
  - Admin notification sent to `MBAofBC.shirts@gmail.com`

---

## Redeployment (after code changes)

### Forms only (UI changes)

```bash
cd mba/mba_forms
npm run build
# Re-upload dist/ contents to public_html/forms/
```

### API only (logic changes)

1. Upload changed files to `nodeapps/mba_api/` (not `node_modules/`)
2. cPanel → Setup Node.js App → **Restart**

### Database migrations (new migrations added)

In the Node.js App terminal:

```bash
node_modules/.bin/sequelize-cli db:migrate
```

---

## API Key

The same key is used in both:

- `mba/mba_forms/.env.production` → `VITE_API_KEY`
- Server `nodeapps/mba_api/.env` → `API_KEY`

If you rotate the key, you must update both, rebuild the forms app, and re-upload `dist/`.

```
Current key: 4c6295c0376e8f81fe6da138fac82c808652c05af8040b7b0aea466226e46253
```
