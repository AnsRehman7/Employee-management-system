# StaffFlow API

Node/Express API for StaffFlow. Firebase is used only to authenticate users; application data is stored in PostgreSQL through Prisma.

## Local Setup

1. Copy `.env.example` to `.env`.
2. Confirm `DATABASE_URL` points to your local database:

   ```bash
   postgresql://postgres:postgre@localhost:5432/postgres?schema=public
   ```

3. Configure Firebase Admin credentials with one of:
   - `FIREBASE_SERVICE_ACCOUNT_JSON`
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`
   - `GOOGLE_APPLICATION_CREDENTIALS`

4. Apply migrations:

   ```bash
   npm run prisma:migrate
   ```

5. Start the API:

   ```bash
   npm run dev
   ```

The first synced user becomes `ADMIN` by default. Later users become `EMPLOYEE` unless `BOOTSTRAP_ADMIN_EMAILS` or `ALLOW_CLIENT_ROLE_SELECTION` is configured.

## Core Data Flow

- Firebase verifies identity; PostgreSQL stores users, projects, tasks, and time logs.
- Admin/HR users create projects before assigning tasks.
- Tasks belong to a project and a single employee assignee.
- Project progress is derived from completed tasks, so `1` completed task out of `10` returns `10%`.
- Employees only receive tasks and project details connected to their own assignments.
