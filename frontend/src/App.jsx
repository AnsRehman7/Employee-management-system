import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Signup from "./components/Signup";
import Login from "./components/Login";
import LandingPage from "./components/LandingPage";
import Employe from "./components/dashboard/employe/Employe";
import AdminDashboard from "./components/dashboard/AdminDashboard/AdminDashboard";
import ForgotPassword from "./components/ForgotPassword";
import LoadingScreen from "./components/LoadingScreen";
import { useUser } from "./context/UserContext";

const dashboardForRole = (role) => (["admin", "hr"].includes(role) ? "/admin" : "/employee");

const RequireAuth = ({ allowedRoles, children }) => {
  const { loading, user } = useUser();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    return <Navigate to={dashboardForRole(user.role)} replace />;
  }

  return children;
};

const PublicOnly = ({ children }) => {
  const { loading, user } = useUser();

  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to={dashboardForRole(user.role)} replace />;

  return children;
};

const DashboardRedirect = () => {
  const { loading, user } = useUser();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to={dashboardForRole(user.role)} replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
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
            <RequireAuth allowedRoles={["admin", "hr"]}>
              <AdminDashboard />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
