# StaffFlow

StaffFlow is a role-based project and task workspace for small companies. The frontend uses **React**, **Firebase Authentication**, and **Tailwind CSS**. Business data is served by the StaffFlow API and stored in PostgreSQL.

## Features

- **Authentication:** Firebase email/password and Google sign-in.
- **Password reset:** Firebase reset email fallback from the login flow.
- **Role-aware routing:** Admin/HR and employee dashboards are protected.
- **Project delivery:** Admin/HR users create projects, then assign tasks under those projects.
- **Employee-specific tasks:** Employees only see tasks assigned to their own backend user profile.
- **Project progress:** Progress is calculated from completed tasks.
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
