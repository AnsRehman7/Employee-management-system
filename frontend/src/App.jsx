import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Signup from "./components/Signup";
import Login from "./components/Login";
import LandingPage from "./components/LandingPage";
import PricingPage from "./components/PricingPage";
import ForgotPassword from "./components/ForgotPassword";
import LoadingScreen from "./components/LoadingScreen";
import AppErrorBoundary from "./components/AppErrorBoundary";
import NotFoundPage from "./components/NotFoundPage";
import { useUser } from "./context/UserContext";

const AdminDashboard = lazy(() => import("./components/dashboard/AdminDashboard/AdminDashboard"));
const AttendancePortal = lazy(() => import("./components/dashboard/AttendancePortal"));
const AuditLogPage = lazy(() => import("./components/AuditLogPage"));
const CustomizationPage = lazy(() => import("./components/CustomizationPage"));
const CustomModuleRecordPage = lazy(() => import("./components/CustomModuleRecordPage"));
const CustomModuleRecordsPage = lazy(() => import("./components/CustomModuleRecordsPage"));
const Employe = lazy(() => import("./components/dashboard/employe/Employe"));
const ProfilePage = lazy(() => import("./components/ProfilePage"));
const ProjectCreatePage = lazy(() => import("./components/dashboard/AdminDashboard/ProjectCreatePage"));
const ProjectDetailPage = lazy(() => import("./components/dashboard/AdminDashboard/ProjectDetailPage"));
const ProjectPlannerPage = lazy(() => import("./components/dashboard/AdminDashboard/ProjectPlannerPage"));
const ProjectsIndexPage = lazy(() => import("./components/dashboard/AdminDashboard/ProjectsIndexPage"));
const ReportsPage = lazy(() => import("./components/dashboard/AdminDashboard/ReportsPage"));
const TaskCreatePage = lazy(() => import("./components/dashboard/AdminDashboard/TaskCreatePage"));
const TaskDetailPage = lazy(() => import("./components/dashboard/AdminDashboard/TaskDetailPage"));
const TasksPage = lazy(() => import("./components/dashboard/AdminDashboard/TasksPage"));
const UserCreatePage = lazy(() => import("./components/dashboard/AdminDashboard/UserCreatePage"));
const UserDetailPage = lazy(() => import("./components/dashboard/AdminDashboard/UserDetailPage"));
const UsersIndexPage = lazy(() => import("./components/dashboard/AdminDashboard/UsersIndexPage"));
const WorkspaceSettingsPage = lazy(() => import("./components/WorkspaceSettingsPage"));

const workRoles = ["super_admin", "admin", "manager", "hr"];
const authenticatedRoles = [...workRoles, "accounts", "employee"];
const projectRoles = authenticatedRoles;
const attendanceRoles = authenticatedRoles;
const dashboardForUser = (user) => {
  if (user?.permissions?.canViewDashboard) return "/admin";
  if (user?.role === "employee") return "/employee";
  if (user?.role === "accounts") return "/projects";
  return "/tasks";
};

const RequireAuth = ({ allowedRoles, children, permission }) => {
  const { loading, user } = useUser();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    return <Navigate to={dashboardForUser(user)} replace />;
  }
  if (permission && !user.permissions?.assigned?.includes(permission)) {
    return <Navigate to={dashboardForUser(user)} replace />;
  }

  return children;
};

const PublicOnly = ({ children }) => {
  const { loading, user } = useUser();

  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to={dashboardForUser(user)} replace />;

  return children;
};

const DashboardRedirect = () => {
  const { loading, user } = useUser();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to={dashboardForUser(user)} replace />;
};

function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<LoadingScreen />}>
        <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnly>
              <Signup />
            </PublicOnly>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicOnly>
              <ForgotPassword />
            </PublicOnly>
          }
        />
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="/employe" element={<Navigate to="/employee" replace />} />
        <Route
          path="/employee"
          element={
            <RequireAuth allowedRoles={["employee"]}>
              <Employe />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth permission="dashboard.view">
              <AdminDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/tasks/new"
          element={
            <RequireAuth permission="tasks.create">
              <TaskCreatePage />
            </RequireAuth>
          }
        />
        <Route
          path="/tasks/:taskId"
          element={
            <RequireAuth allowedRoles={authenticatedRoles}>
              <TaskDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/tasks"
          element={
            <RequireAuth allowedRoles={authenticatedRoles}>
              <TasksPage />
            </RequireAuth>
          }
        />
        <Route
          path="/projects/new"
          element={
            <RequireAuth permission="projects.create">
              <ProjectCreatePage />
            </RequireAuth>
          }
        />
        <Route
          path="/projects/:projectId/planner"
          element={
            <RequireAuth allowedRoles={projectRoles}>
              <ProjectPlannerPage />
            </RequireAuth>
          }
        />
        <Route
          path="/projects/:projectId"
          element={
            <RequireAuth allowedRoles={projectRoles}>
              <ProjectDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/projects"
          element={
            <RequireAuth allowedRoles={projectRoles}>
              <ProjectsIndexPage />
            </RequireAuth>
          }
        />
        <Route
          path="/attendance"
          element={
            <RequireAuth allowedRoles={attendanceRoles}>
              <AttendancePortal />
            </RequireAuth>
          }
        />
        <Route
          path="/users/new"
          element={
            <RequireAuth permission="users.manage">
              <UserCreatePage />
            </RequireAuth>
          }
        />
        <Route
          path="/users/:userId"
          element={
            <RequireAuth permission="users.view">
              <UserDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/users"
          element={
            <RequireAuth permission="users.view">
              <UsersIndexPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth allowedRoles={authenticatedRoles}>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/reports"
          element={
            <RequireAuth permission="reports.view">
              <ReportsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth allowedRoles={authenticatedRoles}>
              <WorkspaceSettingsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/settings/customization"
          element={
            <RequireAuth permission="customization.manage">
              <CustomizationPage />
            </RequireAuth>
          }
        />
        <Route
          path="/modules/:moduleKey/new"
          element={
            <RequireAuth allowedRoles={authenticatedRoles}>
              <CustomModuleRecordPage create />
            </RequireAuth>
          }
        />
        <Route
          path="/modules/:moduleKey/:recordId"
          element={
            <RequireAuth allowedRoles={authenticatedRoles}>
              <CustomModuleRecordPage />
            </RequireAuth>
          }
        />
        <Route
          path="/modules/:moduleKey"
          element={
            <RequireAuth allowedRoles={authenticatedRoles}>
              <CustomModuleRecordsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/audit"
          element={
            <RequireAuth permission="audit.view">
              <AuditLogPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}

export default App;
