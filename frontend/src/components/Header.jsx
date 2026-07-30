import { useState } from "react";
import { FiBriefcase, FiClock, FiGrid, FiLogOut, FiUser, FiUsers } from "react-icons/fi";
import { NavLink, useNavigate } from "react-router-dom";
import Alert from "./Alert";
import { useFirebase } from "../context/firebase";
import { useUser } from "../context/UserContext";
import { unregisterPushDevice } from "../utils/pushNotifications";

const Header = ({ subtitle = "", title = "Workspace" }) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { formatFirebaseError, logout } = useFirebase();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState("");

  const handleLogout = async () => {
    setIsSigningOut(true);
    setError("");

    try {
      await unregisterPushDevice();
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      setError(formatFirebaseError(error));
    } finally {
      setIsSigningOut(false);
    }
  };

  const navItems = [
    user?.permissions?.canManageWork && ["/admin", "Dashboard", <FiGrid className="h-4 w-4" />],
    user?.permissions?.canViewOrganizationWork && ["/projects", "Projects", <FiBriefcase className="h-4 w-4" />],
    user?.permissions?.canViewOrganizationWork && ["/attendance", "Attendance", <FiClock className="h-4 w-4" />],
    user?.permissions?.canManageUsers && ["/users", "Users", <FiUsers className="h-4 w-4" />],
  ].filter(Boolean);

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">
            StaffFlow
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-normal text-slate-950">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {navItems.length > 0 && (
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              {navItems.map(([to, label, icon]) => (
                <NavLink
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-bold transition ${
                      isActive ? "bg-emerald-700 text-white shadow-sm shadow-emerald-200" : "text-slate-500 hover:text-slate-950"
                    }`
                  }
                  key={to}
                  to={to}
                >
                  {icon}
                  {label}
                </NavLink>
              ))}
            </div>
          )}

          <div className="hidden items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white">
              <FiUser className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-950">{user?.name || "Team member"}</p>
              <p className="text-xs font-semibold uppercase text-slate-500">{user?.role || "employee"}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={isSigningOut}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <FiLogOut className="h-4 w-4" />
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </nav>
      {error && (
        <div className="mx-auto max-w-7xl px-4 pb-4 lg:px-6">
          <Alert message={error} type="error" />
        </div>
      )}
    </header>
  );
};

export default Header;
