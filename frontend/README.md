# StaffFlow

StaffFlow is a company workspace for small teams that need projects, tasks, hours, and role-based access. The frontend uses **React**, **Firebase Authentication**, and **Tailwind CSS**. Business data is served by the StaffFlow API and stored in PostgreSQL.

## Features

- **Free trial:** Public signup creates a trial organization and super-admin owner.
- **Authentication:** Firebase email/password and Google sign-in for organization users.
- **Password reset:** Firebase reset email fallback from the login flow.
- **Account permissions:** Role defaults can be customized per workspace account and are enforced by the API.
- **User management:** Authorized workspace admins create logins, roles, designations, departments, and account status.
- **Project delivery:** Projects include ownership, priority, objective, department, stakeholder, estimates, tags, and delivery dates.
- **Notifications:** Assignments and task/project activity appear in-app and can be shown as browser/Windows alerts.
- **Employee-specific tasks:** Employees only see tasks assigned to their own backend user profile.
- **AI planning and weightage:** Groq can turn project requirements into tasks and analyze project scope to assign task weights.
- **AI progress:** Time-log comments are analyzed against task requirements to update task progress.
- **Project progress:** Progress is calculated from weighted task progress.
- **Hours logging:** Employees can log hours against their own tasks.
- **Responsive UI:** StaffFlow uses a consistent operational dashboard, alerts, loading states, and compact action controls.

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

## Firebase and Netlify

1. Enable **Google** under Firebase Authentication > Sign-in method.
2. Add the production Netlify hostname under Firebase Authentication > Settings > Authorized domains.
3. Set every `VITE_FIREBASE_*` variable in Netlify and trigger a fresh deploy.
4. Netlify SPA refresh routing is supplied by `public/_redirects` and is copied into the production build.

Browser notifications require HTTPS and explicit permission from the user. The current implementation displays desktop alerts while StaffFlow is open; background push would additionally require a push service and service worker.
