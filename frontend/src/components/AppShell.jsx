import { useEffect, useMemo, useState } from "react";
import {
  FiBriefcase,
  FiBarChart2,
  FiCheckSquare,
  FiChevronsLeft,
  FiChevronsRight,
  FiClock,
  FiDatabase,
  FiGrid,
  FiLogOut,
  FiPlus,
  FiSearch,
  FiCommand,
  FiMoon,
  FiSettings,
  FiShield,
  FiSun,
} from "react-icons/fi";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import Alert from "./Alert";
import CommandPalette from "./CommandPalette";
import ThemeToggle from "./ThemeToggle";
import NotificationCenter from "./NotificationCenter";
import { api } from "../context/api";
import { useFirebase } from "../context/firebase";
import { useUser } from "../context/UserContext";
import { unregisterPushDevice } from "../utils/pushNotifications";

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
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [customModules, setCustomModules] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("staffflow.sidebar-collapsed") === "true";
  });

  useEffect(() => {
    window.localStorage.setItem("staffflow.sidebar-collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setCustomModules([]);
      return;
    }
    let active = true;
    const loadModules = () =>
      api
        .getAvailableModules()
        .then(({ modules }) => {
          if (active) setCustomModules(modules.filter((module) => module.kind === "custom"));
        })
        .catch(() => {
          if (active) setCustomModules([]);
        });
    loadModules();
    window.addEventListener("staffflow:modules-changed", loadModules);
    return () => {
      active = false;
      window.removeEventListener("staffflow:modules-changed", loadModules);
    };
  }, [user?.id]);

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
        ...customModules.map((module) => ({
          icon: <FiDatabase className="h-4 w-4" />,
          label: module.pluralName,
          section: "Custom modules",
          to: `/modules/${module.key}`,
        })),
      ].filter(Boolean),
    [customModules, user]
  );

  const navGroups = useMemo(
    () => navItems.reduce((groups, item) => ({ ...groups, [item.section]: [...(groups[item.section] || []), item] }), {}),
    [navItems],
  );

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

  const handleGlobalSearch = (event) => {
    event.preventDefault();
    const query = globalSearch.trim();
    navigate(query ? `/tasks?search=${encodeURIComponent(query)}` : "/tasks");
  };

  const workspaceName = user?.organization?.name || "StaffFlow";
  const userName = user?.name || "Team member";
  const homePath = dashboardForUser(user);
  const settingsAreaActive =
    location.pathname.startsWith("/settings") ||
    location.pathname === "/audit" ||
    location.pathname === "/users" ||
    location.pathname.startsWith("/users/");

  const renderNavLink = ({ icon, label, to }, iconOnly = false) => (
    <NavLink
      aria-label={iconOnly ? label : undefined}
      className={({ isActive }) =>
        `flex items-center rounded-md py-2.5 text-sm font-semibold transition ${
          isActive
            ? "bg-emerald-700 text-white shadow-sm shadow-emerald-200"
            : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
        } ${iconOnly ? "justify-center px-2" : "gap-3 px-3"}`
      }
      key={to}
      title={iconOnly ? label : undefined}
      to={to}
    >
      {icon}
      {!iconOnly && <span className="truncate">{label}</span>}
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-canvas text-slate-950">
      <aside className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-slate-200 bg-surface transition-[width] duration-200 lg:flex ${sidebarCollapsed ? "w-20" : "w-72"}`}>
        <div className={`border-b border-slate-200 ${sidebarCollapsed ? "p-2" : "p-4"}`}>
          <div className="flex items-center justify-between">
            <NavLink className={`flex min-w-0 items-center ${sidebarCollapsed ? "" : "gap-3"}`} title={sidebarCollapsed ? "StaffFlow" : undefined} to={homePath}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-700 text-sm font-bold text-white shadow-sm shadow-emerald-200">
                SF
              </span>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-950">StaffFlow</p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase text-slate-500">Work intelligence</p>
                </div>
              )}
            </NavLink>
            <button
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-800"
              onClick={() => setSidebarCollapsed((current) => !current)}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              type="button"
            >
              {sidebarCollapsed ? <FiChevronsRight className="h-4 w-4" /> : <FiChevronsLeft className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto ${sidebarCollapsed ? "px-2 py-3" : "px-3 py-4"}`}>
          <nav className={sidebarCollapsed ? "space-y-2" : "space-y-5"}>
            {Object.entries(navGroups).map(([section, items]) => (
              <div key={section}>
                {!sidebarCollapsed && <p className="px-3 text-[10px] font-bold uppercase text-slate-400">{section}</p>}
                <div className={`${sidebarCollapsed ? "space-y-1" : "mt-2 space-y-1"}`}>{items.map((item) => renderNavLink(item, sidebarCollapsed))}</div>
              </div>
            ))}
          </nav>
        </div>

        <div className={`${sidebarCollapsed ? "space-y-2 p-2" : "space-y-3 p-4"} border-t border-slate-200`}>
          {!sidebarCollapsed && <div className="rounded-md border border-emerald-100 bg-emerald-50 p-3">
            <div className="flex items-start gap-3">
              <span className="rounded-md bg-white p-2 text-emerald-800 ring-1 ring-emerald-100">
                <FiShield className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-950">{workspaceName}</p>
                <p className="mt-1 text-xs font-semibold uppercase text-slate-500">
                  {user?.organization?.plan || "Trial"} workspace
                </p>
              </div>
            </div>
          </div>}

          <button
            aria-label="Sign out"
            className={`inline-flex w-full items-center justify-center rounded-md border border-slate-200 bg-white text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 ${sidebarCollapsed ? "h-10" : "gap-2 px-4 py-3"}`}
            disabled={isSigningOut}
            onClick={handleLogout}
            title={sidebarCollapsed ? "Sign out" : undefined}
            type="button"
          >
            <FiLogOut className="h-4 w-4" />
            {!sidebarCollapsed && (isSigningOut ? "Signing out..." : "Sign out")}
          </button>
        </div>
      </aside>

      <div className={`transition-[padding] duration-200 ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-72"}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-surface/95 backdrop-blur-xl">
          <div className="mx-auto max-w-[1540px] px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2 lg:hidden">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-700 text-xs font-bold text-white">
                    SF
                  </span>
                  <span className="text-sm font-bold text-slate-950">StaffFlow</span>
                </div>
                <p className="text-xs font-bold uppercase text-emerald-700">{workspaceName}</p>
                <h1 className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">{title}</h1>
                {subtitle && <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">{subtitle}</p>}
              </div>

              <div className="flex min-w-0 items-center gap-3">
                <form className="hidden h-10 w-[280px] items-center gap-3 rounded-md border border-slate-200 bg-canvas px-3 text-sm text-slate-500 focus-within:border-emerald-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100 xl:flex" onSubmit={handleGlobalSearch}>
                  <FiSearch className="h-4 w-4 shrink-0" />
                  <input className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" onChange={(event) => setGlobalSearch(event.target.value)} placeholder="Search tasks..." type="search" value={globalSearch} />
                </form>

                <button
                  aria-label="Open command palette"
                  className="hidden h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-800 xl:flex"
                  onClick={() => setPaletteOpen(true)}
                  title="Command palette"
                  type="button"
                >
                  <FiCommand className="h-3.5 w-3.5" />
                  <kbd className="text-[10px] font-bold">K</kbd>
                </button>

                <ThemeToggle />
                {user?.permissions?.canCreateTasks && (
                  <button aria-label="Create task" className="hidden h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800 xl:flex" onClick={() => navigate("/tasks/new")} title="Create task" type="button">
                    <FiPlus className="h-4 w-4" />
                  </button>
                )}
                <NavLink
                  aria-label="Settings"
                  className={({ isActive }) =>
                    `flex h-10 w-10 items-center justify-center rounded-md border transition ${
                      isActive || settingsAreaActive
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
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
                    `flex h-10 w-10 items-center justify-center rounded-full border text-xs font-bold transition ${
                      isActive
                        ? "border-emerald-300 bg-emerald-700 text-white"
                        : "border-teal-200 bg-teal-50 text-teal-900 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
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
                {navItems.map((item) => renderNavLink(item))}
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

      <CommandPalette customModules={customModules} onClose={() => setPaletteOpen(false)} open={paletteOpen} />
    </div>
  );
};

export default AppShell;
