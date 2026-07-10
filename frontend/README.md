# StaffFlow

StaffFlow is a company workspace for small teams that need projects, tasks, hours, and role-based access. The frontend uses **React**, **Firebase Authentication**, and **Tailwind CSS**. Business data is served by the StaffFlow API and stored in PostgreSQL.

## Features

- **Free trial:** Public signup creates a trial organization and super-admin owner.
- **Authentication:** Firebase email/password sign-in for organization users.
- **Password reset:** Firebase reset email fallback from the login flow.
- **Role-aware routing:** Super admin, admin, manager, HR, accounts, and employee access are separated.
- **User management:** Authorized workspace admins create logins, roles, designations, departments, and account status.
- **Project delivery:** Work managers create projects, then assign tasks under those projects.
- **Employee-specific tasks:** Employees only see tasks assigned to their own backend user profile.
- **AI weightage:** Gemini can analyze project scope and task descriptions to auto-fill each task's project weight.
- **AI progress:** Time-log comments are analyzed against task requirements to update task progress.
- **Project progress:** Progress is calculated from weighted task progress.
- **Hours logging:** Employees can log hours against their own tasks.
- **Responsive UI:** StaffFlow uses a consistent slate/emerald palette, alerts, loading states, and compact action controls.

## Tech Stack

- **Frontend:** React, React Router, Tailwind CSS
- **Authentication:** Firebase Authentication
- **Backend/Database:** Express API, Prisma, PostgreSQL

## Setup Instructions

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the backend API from `../backend`.

3. Start the frontend:

   ```bash
   npm run dev
   ```

Set `VITE_API_URL` when the API is not running at `http://localhost:4000/api`.
