# Haihuwa Lafiya Initiative — Production Deployment Guide
## Hosting Stack: Neon PostgreSQL + Render Blueprint

This step-by-step guide walks you through setting up **Neon PostgreSQL** and deploying both the backend (FastAPI) and frontend (Next.js) on **Render** using the provided `render.yaml` Blueprint.

---

## Part 1: Neon PostgreSQL Setup

Neon provides a serverless PostgreSQL instance with integrated PgBouncer connection pooling.

### Step 1.1: Create a Neon Account & Project
1. Go to [https://neon.tech](https://neon.tech) and sign up / sign in.
2. Click **Create Project**.
3. Name your project (e.g., `haihuwa-lafiya-prod`).
4. Select the region closest to your users or Render services (recommended: **Europe (Frankfurt) `eu-central-1`** or **US East (Ohio) `us-east-2`**).
5. Click **Create Project**.

### Step 1.2: Retrieve Both Connection Strings
Neon gives you two distinct connection strings:
1. **Pooled Connection** (uses PgBouncer, contains `-pooler` in host):
   - In Neon Dashboard > **Connection Details**, toggle **Connection pooling** to **ON**.
   - Copy the string. It will look like:
     ```
     postgresql://alex:AbCdEf123456@ep-cool-butterfly-123456-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
     ```
   - **Prefix transformation for Python async driver:** Change `postgresql://` to `postgresql+asyncpg://`:
     ```
     postgresql+asyncpg://alex:AbCdEf123456@ep-cool-butterfly-123456-pooler.eu-central-1.aws.neon.tech/neondb?ssl=require
     ```
   - *This will be your `DATABASE_URL`.*

2. **Direct Connection** (bypasses pooler, used for Alembic DDL migrations):
   - In Neon Dashboard > **Connection Details**, toggle **Connection pooling** to **OFF**.
   - Copy the string. It will look like:
     ```
     postgresql://alex:AbCdEf123456@ep-cool-butterfly-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require
     ```
   - **Prefix transformation:**
     ```
     postgresql+psycopg://alex:AbCdEf123456@ep-cool-butterfly-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require
     ```
   - *This will be your `DATABASE_URL_DIRECT`.*

---

## Part 2: Render Deployment via Blueprint (`render.yaml`)

Your repository already contains a valid `render.yaml` configured with monorepo separation (`backend/` and `frontend/`).

### Step 2.1: Connect Your GitHub Repository to Render
1. Go to [https://dashboard.render.com](https://dashboard.render.com).
2. Click **New +** in the top navigation and select **Blueprint**.
3. Connect your GitHub account and select the repository: `Al-Ahotanee/HAIHUWA-LAFIYA`.
4. Render will detect `render.yaml` at the root and parse two services:
   - `haihuwa-backend` (Web Service, Python)
   - `haihuwa-frontend` (Static Site, Node/Next.js export)

### Step 2.2: Supply Secret Environment Variables
Render will ask you to fill in the environment variables marked with `sync: false`:

1. **`DATABASE_URL`**:
   Paste the **Pooled** connection string from Step 1.2:
   ```
   postgresql+asyncpg://alex:password@ep-xxxx-pooler.eu-central-1.aws.neon.tech/neondb?ssl=require
   ```
2. **`DATABASE_URL_DIRECT`**:
   Paste the **Direct** connection string from Step 1.2:
   ```
   postgresql+psycopg://alex:password@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
3. **`SECRET_KEY`**:
   Render automatically generates a cryptographically secure 256-bit random string via `generateValue: true`.

Click **Apply**.

---

## Part 3: Automated Build & Migration Process

Once you click **Apply**, Render executes the deployment pipeline automatically:

### Backend Deployment Sequence:
1. Installs Python 3.12 dependencies (`pip install -r requirements.txt`).
2. Runs the `preDeployCommand`:
   ```bash
   alembic upgrade head
   ```
   *(Alembic connects directly via `DATABASE_URL_DIRECT` with `NullPool` to safely execute DDL).*
3. Starts the ASGI server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
4. Render checks the health endpoint `/health` before routing live internet traffic.

### Frontend Deployment Sequence:
1. Installs Node.js dependencies (`npm install`).
2. Builds the static production export (`npm run build`).
3. Publishes assets from `./out` directly to Render's global CDN edge network.
4. Rewrites client routes (`/*` -> `/index.html`) to support Next.js App Router navigation.

---

## Part 4: Seeding Initial Reference Data & Admin User

After the backend deploys successfully for the first time, you must run the initial database seed to create the state, sample LGAs, health facilities, and the default Super Admin account:

1. In the Render Dashboard, open the **`haihuwa-backend`** service.
2. Click the **Shell** tab on the left menu to open an SSH terminal session inside the container.
3. Run the seed script:
   ```bash
   python -m app.seeds
   ```
4. You will see:
   ```
   Seeding reference data...
   Reference data successfully seeded! Admin: admin@haihuwalafiya.org
   ```

---

## Part 5: Verifying Production Access

1. Open your frontend Render URL:
   ```
   https://haihuwa-frontend.onrender.com/login
   ```
2. Log in using the default seeded administrator credentials:
   - **Email:** `admin@haihuwalafiya.org`
   - **Password:** `dev-admin-2024!`
3. You will be redirected to the live dashboard at `https://haihuwa-frontend.onrender.com/`.

> ⚠️ **Post-Deployment Security Action:**
> Immediately navigate to user settings or use the API to update the default `admin@haihuwalafiya.org` password.

---

## Part 6: Troubleshooting & Common Issues

| Issue | Cause | Solution |
|---|---|---|
| `alembic: connection timeout` | Compute suspended on Neon | Ensure `DATABASE_URL_DIRECT` has `connect_timeout=15` or click on Neon dashboard to wake compute. |
| `DuplicatePreparedStatementError` | asyncpg connected to PgBouncer without statement cache disabled | Already handled: `app/database.py` has `statement_cache_size=0`. |
| `CORS Error on login` | Frontend origin does not match `CORS_ORIGINS` | Verify `CORS_ORIGINS` in Render backend settings matches your exact frontend URL (e.g. `https://haihuwa-frontend.onrender.com`). |
| `401 Unauthorized on API requests` | Expired access token | The frontend API client automatically rotates tokens using `/api/v1/auth/refresh`. |
