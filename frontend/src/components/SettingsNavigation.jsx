import { createElement } from "react";
import {
  FiBell,
  FiClock,
  FiFileText,
  FiMapPin,
  FiPlus,
  FiSettings,
  FiShield,
  FiSliders,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";

const SettingsNavigation = () => {
  const location = useLocation();
  const { user } = useUser();
  const currentLocation = `${location.pathname}${location.hash}`;
  const groups = [
    {
      items: [
        { icon: FiUser, label: "Personal profile", to: "/profile" },
        { icon: FiBell, label: "Notifications", to: "/settings#notifications" },
      ],
      label: "Account",
    },
    (user?.permissions?.canManageSettings || user?.permissions?.canManageCustomization) && {
      items: [
        user?.permissions?.canManageSettings && {
          icon: FiSettings,
          label: "Workspace",
          to: "/settings#workspace",
        },
        user?.permissions?.canManageSettings && {
          icon: FiClock,
          label: "Attendance rules",
          to: "/settings#attendance-rules",
        },
        user?.permissions?.canManageSettings && {
          icon: FiMapPin,
          label: "Attendance offices",
          to: "/settings#attendance-offices",
        },
        user?.permissions?.canManageCustomization && {
          icon: FiSliders,
          label: "Customization",
          to: "/settings/customization",
        },
      ].filter(Boolean),
      label: "Workspace",
    },
    (user?.permissions?.canViewUsers || user?.permissions?.canManagePermissions) && {
      items: [
        user?.permissions?.canViewUsers && { icon: FiUsers, label: "Team members", to: "/users" },
        user?.permissions?.canManageUsers && { icon: FiPlus, label: "Add member", to: "/users/new" },
        user?.permissions?.canViewUsers && {
          icon: FiShield,
          label: "Roles and permissions",
          to: "/settings/roles",
        },
      ].filter(Boolean),
      label: "People and access",
    },
    user?.permissions?.canViewAudit && {
      items: [{ icon: FiFileText, label: "Audit log", to: "/audit" }],
      label: "Governance",
    },
  ].filter(Boolean);

  return (
    <aside className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:sticky lg:top-28">
      <div className="border-b border-slate-200 px-4 py-3">
        <p className="text-sm font-bold text-slate-950">Settings</p>
      </div>
      <nav className="space-y-5 p-3">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-2 text-[11px] font-bold uppercase text-slate-400">{group.label}</p>
            <div className="mt-1.5 space-y-1">
              {group.items.map(({ icon, label, to }) => {
                const active =
                  currentLocation === to ||
                  (to === "/settings#workspace" &&
                    location.pathname === "/settings" &&
                    !location.hash) ||
                  (to === "/settings#notifications" &&
                    location.pathname === "/settings" &&
                    !location.hash &&
                    !user?.permissions?.canManageSettings);
                return (
                  <Link
                    className={`flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-semibold transition ${
                      active
                        ? "bg-emerald-50 text-emerald-800"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                    }`}
                    key={to}
                    to={to}
                  >
                    {createElement(icon, { className: "h-4 w-4 shrink-0" })}
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default SettingsNavigation;
