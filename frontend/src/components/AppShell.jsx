import { useMemo, useState } from "react";
import {
  FiBriefcase,
  FiBarChart2,
  FiCheckSquare,
  FiClock,
  FiGrid,
  FiLogOut,
  FiPlus,
  FiSearch,
  FiSettings,
  FiShield,
} from "react-icons/fi";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import Alert from "./Alert";
import NotificationCenter from "./NotificationCenter";
import { useFirebase } from "../context/firebase";
import { useUser } from "../context/UserContext";

const dashboardForUser = (user) => {
  if (user?.permissions?.canViewDashboard) return "/admin";
  if (user?.role === "employee") return "/employee";
  if (user?.role === "accounts") return "/projects";
  return "/tasks";
};

const formatRole = (role = "employee") =>
  role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const initialsFor = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "SF";

const AppShell = ({ children, subtitle = "", title = "Workspace" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { formatFirebaseError, logout } = useFirebase();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");

  const navItems = useMemo(
    () =>
      [
        user?.role === "employee" && {
          icon: <FiGrid className="h-4 w-4" />,
          label: "My work",
          section: "Overview",
          to: "/employee",
        },
        user?.permissions?.canViewDashboard && {
          icon: <FiGrid className="h-4 w-4" />,
          label: "Dashboard",
          section: "Overview",
          to: "/admin",
        },
        user?.permissions?.canViewReports && {
          icon: <FiBarChart2 className="h-4 w-4" />,
          label: "Reports",
          section: "Overview",
          to: "/reports",
        },
        user && {
          icon: <FiCheckSquare className="h-4 w-4" />,
          label: "Tasks",
          section: "Work management",
          to: "/tasks",
        },
        user && {
          icon: <FiBriefcase className="h-4 w-4" />,
          label: "Projects",
          section: "Work management",
          to: "/projects",
        },
        user && {
          icon: <FiClock className="h-4 w-4" />,
          label: "Attendance",
          section: "People and time",
          to: "/attendance",
        },
      ].filter(Boolean),
    [user]
  );

  const navGroups = useMemo(
    () => navItems.reduce((groups, item) => ({ ...groups, [item.section]: [...(groups[item.section] || []), item] }), {}),
    [navItems],
  );

  const handleLogout = async () => {
    setIsSigningOut(true);
    setError("");

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      setError(formatFirebaseError(error));
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleGlobalSearch = (event) => {
    event.preventDefault();
    const query = globalSearch.trim();
    navigate(query ? `/tasks?search=${encodeURIComponent(query)}` : "/tasks");
  };

  const workspaceName = user?.organization?.name || "StaffFlow";
  const userName = user?.name || "Team member";
  const homePath = dashboardForUser(user);
  const settingsAreaActive =
    location.pathname === "/settings" ||
    location.pathname === "/audit" ||
    location.pathname === "/users" ||
    location.pathname.startsWith("/users/");

  const renderNavLink = ({ icon, label, to }, compact = false) => (
    <NavLink
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
          isActive
            ? "bg-violet-600 text-white shadow-sm shadow-violet-200"
            : "text-slate-600 hover:bg-violet-50 hover:text-violet-700"
        } ${compact ? "shrink-0" : ""}`
      }
      key={to}
      to={to}
    >
      {icon}
      {label}
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-[#f4f5fb] text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-200 bg-[#fbfbff] lg:flex">
        <div className="border-b border-slate-200 p-5">
          <NavLink className="flex items-center gap-3" to={homePath}>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600 text-sm font-bold text-white shadow-lg shadow-violet-200">
              SF
            </span>
            <div>
              <p className="text-base font-bold tracking-tight text-slate-950">StaffFlow</p>
              <p className="text-xs font-semibold uppercase text-slate-500">Work intelligence</p>
            </div>
          </NavLink>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <nav className="space-y-5">
            {Object.entries(navGroups).map(([section, items]) => (
              <div key={section}>
                <p className="px-3 text-[11px] font-bold uppercase text-slate-400">{section}</p>
                <div className="mt-2 space-y-1">{items.map((item) => renderNavLink(item))}</div>
              </div>
            ))}
          </nav>
        </div>

        <div className="space-y-3 border-t border-slate-200 p-4">
          <div className="rounded-lg border border-violet-100 bg-violet-50 p-4">
            <div className="flex items-start gap-3">
              <span className="rounded-lg bg-white p-2 text-violet-700 ring-1 ring-violet-100">
                <FiShield className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-950">{workspaceName}</p>
                <p className="mt-1 text-xs font-semibold uppercase text-slate-500">
                  {user?.organization?.plan || "Trial"} workspace
                </p>
              </div>
            </div>
          </div>

          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSigningOut}
            onClick={handleLogout}
            type="button"
          >
            <FiLogOut className="h-4 w-4" />
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-xl">
          <div className="mx-auto max-w-[1540px] px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2 lg:hidden">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-xs font-bold text-white">
                    SF
                  </span>
                  <span className="text-sm font-bold text-slate-950">StaffFlow</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-wide text-violet-600">{workspaceName}</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
                {subtitle && <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">{subtitle}</p>}
              </div>

              <div className="flex min-w-0 items-center gap-3">
                <form className="hidden h-10 w-[360px] items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 focus-within:border-violet-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-100 xl:flex" onSubmit={handleGlobalSearch}>
                  <FiSearch className="h-4 w-4 shrink-0" />
                  <input className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" onChange={(event) => setGlobalSearch(event.target.value)} placeholder="Search tasks..." type="search" value={globalSearch} />
                </form>
                {user?.permissions?.canCreateTasks && (
                  <button aria-label="Create task" className="hidden h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-violet-50 hover:text-violet-700 xl:flex" onClick={() => navigate("/tasks/new")} title="Create task" type="button">
                    <FiPlus className="h-4 w-4" />
                  </button>
                )}
                <NavLink
                  aria-label="Settings"
                  className={({ isActive }) =>
                    `flex h-10 w-10 items-center justify-center rounded-lg border transition ${
                      isActive || settingsAreaActive
                        ? "border-violet-200 bg-violet-50 text-violet-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-violet-50 hover:text-violet-700"
                    }`
                  }
                  title="Settings"
                  to="/settings"
                >
                  <FiSettings className="h-4 w-4" />
                </NavLink>
                <NotificationCenter />
                <NavLink
                  aria-label="Profile"
                  className={({ isActive }) =>
                    `flex h-10 w-10 items-center justify-center rounded-lg border text-xs font-bold transition ${
                      isActive
                        ? "border-violet-300 bg-violet-600 text-white"
                        : "border-cyan-200 bg-cyan-50 text-cyan-800 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                    }`
                  }
                  title={`${userName} / ${formatRole(user?.role)}`}
                  to="/profile"
                >
                  {initialsFor(userName)}
                </NavLink>
              </div>
            </div>

            {navItems.length > 0 && (
              <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
                {navItems.map((item) => renderNavLink(item, true))}
              </nav>
            )}

            {error && (
              <div className="mt-4">
                <Alert message={error} type="error" />
              </div>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-[1540px] px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
};

export default AppShell;
