import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Signup from "./components/Signup";
import Login from "./components/Login";
import LandingPage from "./components/LandingPage";
import PricingPage from "./components/PricingPage";
import Employe from "./components/dashboard/employe/Employe";
import AdminDashboard from "./components/dashboard/AdminDashboard/AdminDashboard";
import AttendancePortal from "./components/dashboard/AttendancePortal";
import ProjectsIndexPage from "./components/dashboard/AdminDashboard/ProjectsIndexPage";
import ProjectCreatePage from "./components/dashboard/AdminDashboard/ProjectCreatePage";
import ProjectDetailPage from "./components/dashboard/AdminDashboard/ProjectDetailPage";
import TasksPage from "./components/dashboard/AdminDashboard/TasksPage";
import TaskCreatePage from "./components/dashboard/AdminDashboard/TaskCreatePage";
import TaskDetailPage from "./components/dashboard/AdminDashboard/TaskDetailPage";
import UserCreatePage from "./components/dashboard/AdminDashboard/UserCreatePage";
import UserDetailPage from "./components/dashboard/AdminDashboard/UserDetailPage";
import UsersIndexPage from "./components/dashboard/AdminDashboard/UsersIndexPage";
import ForgotPassword from "./components/ForgotPassword";
import LoadingScreen from "./components/LoadingScreen";
import ProfilePage from "./components/ProfilePage";
import { useUser } from "./context/UserContext";

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
    <BrowserRouter>
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
