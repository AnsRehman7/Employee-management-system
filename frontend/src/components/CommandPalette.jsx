import { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiBarChart2,
  FiBriefcase,
  FiCalendar,
  FiCheckSquare,
  FiClock,
  FiCornerDownLeft,
  FiDatabase,
  FiFileText,
  FiGrid,
  FiMoon,
  FiPlus,
  FiSearch,
  FiSettings,
  FiShield,
  FiSun,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";

/** Simple subsequence match, so "atn" still finds "Attendance". */
const matches = (haystack, query) => {
  const target = haystack.toLowerCase();
  const term = query.toLowerCase().trim();
  if (!term) return true;
  if (target.includes(term)) return true;

  let index = 0;
  for (const character of term) {
    index = target.indexOf(character, index);
    if (index === -1) return false;
    index += 1;
  }
  return true;
};

const CommandPalette = ({ customModules = [], onClose, open }) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { isDark, toggleTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const commands = useMemo(() => {
    const permissions = user?.permissions || {};

    return [
      { group: "Go to", icon: FiGrid, label: "Dashboard", to: "/admin", when: permissions.canViewDashboard },
      { group: "Go to", icon: FiBarChart2, label: "Reports", to: "/reports", when: permissions.canViewReports },
      { group: "Go to", icon: FiCheckSquare, label: "Tasks", to: "/tasks", when: true },
      { group: "Go to", icon: FiBriefcase, label: "Projects", to: "/projects", when: true },
      { group: "Go to", icon: FiClock, label: "Attendance", to: "/attendance", when: true },
      { group: "Go to", icon: FiCalendar, label: "Calendar", to: "/calendar", when: true },
      { group: "Go to", icon: FiUsers, label: "Team members", to: "/users", when: permissions.canViewUsers },
      { group: "Go to", icon: FiFileText, label: "Audit log", to: "/audit", when: permissions.canViewAudit },
      ...customModules.map((module) => ({
        group: "Go to",
        icon: FiDatabase,
        label: module.pluralName,
        to: `/modules/${module.key}`,
        when: true,
      })),

      { group: "Create", icon: FiPlus, label: "New task", to: "/tasks/new", when: permissions.canCreateTasks },
      { group: "Create", icon: FiPlus, label: "New project", to: "/projects/new", when: permissions.canCreateProjects },
      { group: "Create", icon: FiPlus, label: "New team member", to: "/users/new", when: permissions.canManageUsers },
      { group: "Create", icon: FiCalendar, label: "New meeting", to: "/calendar", when: true },

      { group: "Settings", icon: FiUser, label: "Profile", to: "/profile", when: true },
      { group: "Settings", icon: FiSettings, label: "Workspace settings", to: "/settings", when: true },
      { group: "Settings", icon: FiShield, label: "Roles and permissions", to: "/settings/roles", when: permissions.canViewUsers },
      {
        action: toggleTheme,
        group: "Settings",
        icon: isDark ? FiSun : FiMoon,
        label: isDark ? "Switch to light theme" : "Switch to dark theme",
        when: true,
      },
    ].filter((command) => command.when);
  }, [customModules, isDark, toggleTheme, user?.permissions]);

  const results = useMemo(
    () => commands.filter((command) => matches(`${command.group} ${command.label}`, query)),
    [commands, query],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      // Wait a frame so the dialog is mounted before focusing.
      const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
      return () => window.cancelAnimationFrame(frame);
    }
    return undefined;
  }, [open]);

  // The list can scroll, so keep the highlighted row in view when arrowing.
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const run = useCallback(
    (command) => {
      if (!command) return;
      onClose();
      if (command.action) command.action();
      else navigate(command.to);
    },
    [navigate, onClose],
  );

  const onKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (results.length ? (current + 1) % results.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (results.length ? (current - 1 + results.length) % results.length : 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      run(results[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };

  if (!open) return null;

  let renderedGroup = null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-scrim/50 px-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        aria-label="Command palette"
        aria-modal="true"
        className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/25"
        role="dialog"
      >
        <div className="flex items-center gap-3 border-b border-slate-200 px-4">
          <FiSearch className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            aria-activedescendant={results[activeIndex] ? `command-${activeIndex}` : undefined}
            aria-autocomplete="list"
            aria-controls="command-results"
            className="h-13 min-w-0 flex-1 bg-transparent py-4 text-sm text-slate-950 outline-none placeholder:text-slate-400"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search pages and actions..."
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            value={query}
          />
          <kbd className="hidden shrink-0 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 sm:block">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2" id="command-results" ref={listRef} role="listbox">
          {results.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-slate-500">No matching commands.</p>
          ) : (
            results.map((command, index) => {
              const showGroup = command.group !== renderedGroup;
              renderedGroup = command.group;
              const active = index === activeIndex;

              return (
                <div key={`${command.group}-${command.label}`}>
                  {showGroup && (
                    <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      {command.group}
                    </p>
                  )}
                  <button
                    aria-selected={active}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                      active ? "bg-emerald-50 text-emerald-900" : "text-slate-700 hover:bg-slate-50"
                    }`}
                    data-active={active}
                    id={`command-${index}`}
                    onClick={() => run(command)}
                    onMouseMove={() => setActiveIndex(index)}
                    role="option"
                    type="button"
                  >
                    {createElement(command.icon, {
                      className: `h-4 w-4 shrink-0 ${active ? "text-emerald-700" : "text-slate-400"}`,
                    })}
                    <span className="min-w-0 flex-1 truncate font-semibold">{command.label}</span>
                    {active && <FiCornerDownLeft className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] font-semibold text-slate-500">
          <span>Navigate with arrow keys</span>
          <span>Enter to open</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
