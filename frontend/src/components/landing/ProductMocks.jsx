import { createElement } from "react";
import {
  FiActivity,
  FiAlertCircle,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiShield,
  FiUsers,
} from "react-icons/fi";

/**
 * Miniature renderings of real DayMark screens, drawn in markup rather than shipped
 * as screenshots. They stay sharp at any size, follow the active theme, and cost
 * nothing to download. Every one is fixed-height so a hero can never overflow.
 */

const panel = "rounded-xl border border-slate-200 bg-white p-4 shadow-sm";

const Bar = ({ className = "", width }) => (
  <span className={`block rounded-full bg-slate-200 ${className}`} style={{ width }} />
);

/** Executive dashboard: KPI tiles plus a trend line. */
export const DashboardMock = () => {
  const trend = [26, 30, 28, 44, 40, 62, 58, 74];
  const max = Math.max(...trend);
  const points = trend
    .map((value, index) => `${(index / (trend.length - 1)) * 260},${70 - (value / max) * 56}`)
    .join(" ");

  return (
    <div className={`${panel} space-y-3`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Executive dashboard</p>
          <p className="mt-0.5 text-base font-bold text-slate-950">Nexora workspace</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Live</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          ["12", "Projects", FiBriefcase],
          ["48", "People", FiUsers],
          ["92%", "Attendance", FiShield],
        ].map(([value, label, Icon]) => (
          <div className="rounded-lg border border-slate-200 bg-canvas p-2.5" key={label}>
            {createElement(Icon, { className: "h-3.5 w-3.5 text-emerald-700" })}
            <p className="mt-1.5 text-lg font-bold leading-none text-slate-950">{value}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-canvas p-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Work completion</p>
          <p className="text-[10px] font-bold text-emerald-700">+18%</p>
        </div>
        <p className="mt-0.5 text-sm font-bold text-slate-950">1,248 tasks</p>
        <svg className="mt-2 h-16 w-full text-emerald-600" preserveAspectRatio="none" viewBox="0 0 260 76">
          <defs>
            <linearGradient id="mockTrend" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon fill="url(#mockTrend)" points={`0,76 ${points} 260,76`} />
          <polyline
            fill="none"
            points={points}
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
};

/** Attendance register: the daily rows leadership actually reads. */
export const AttendanceMock = () => (
  <div className={`${panel} space-y-2.5`}>
    <div className="flex items-center justify-between">
      <p className="text-sm font-bold text-slate-950">Attendance register</p>
      <span className="rounded-md border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-500">
        Last 7 days
      </span>
    </div>

    <div className="grid grid-cols-4 gap-2">
      {[
        ["Checked in", "42", "text-teal-800"],
        ["Late", "3", "text-amber-700"],
        ["Absent", "2", "text-rose-700"],
        ["Net hours", "318h", "text-slate-950"],
      ].map(([label, value, tone]) => (
        <div className="rounded-lg bg-canvas p-2" key={label}>
          <p className="text-[9px] font-bold uppercase text-slate-500">{label}</p>
          <p className={`mt-0.5 text-sm font-bold ${tone}`}>{value}</p>
        </div>
      ))}
    </div>

    <div className="overflow-hidden rounded-lg border border-slate-200">
      {[
        ["Ayesha Noor", "08:54", "Checked out", "border-emerald-200 bg-emerald-50 text-emerald-800"],
        ["Hamid Javed", "09:41", "Late", "border-amber-200 bg-amber-50 text-amber-800"],
        ["Sara Khan", "08:47", "In office", "border-teal-200 bg-teal-50 text-teal-900"],
      ].map(([name, time, status, tone], index) => (
        <div
          className={`flex items-center gap-2 px-2.5 py-2 ${index ? "border-t border-slate-100" : ""}`}
          key={name}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[9px] font-bold text-teal-900">
            {name.split(" ").map((part) => part[0]).join("")}
          </span>
          <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-slate-800">{name}</span>
          <span className="text-[11px] font-semibold text-slate-500">{time}</span>
          <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${tone}`}>{status}</span>
        </div>
      ))}
    </div>
  </div>
);

/** Task board: the Kanban view, shown as three compact columns. */
export const BoardMock = () => (
  <div className={`${panel}`}>
    <div className="mb-3 flex items-center justify-between">
      <p className="text-sm font-bold text-slate-950">Delivery board</p>
      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Board view</span>
    </div>
    <div className="grid grid-cols-3 gap-2">
      {[
        ["Open", 3, "bg-amber-400"],
        ["In progress", 2, "bg-teal-500"],
        ["Done", 4, "bg-emerald-500"],
      ].map(([label, count, dot], columnIndex) => (
        <div className="rounded-lg bg-canvas p-2" key={label}>
          <div className="mb-2 flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            <p className="text-[10px] font-bold text-slate-600">{label}</p>
            <span className="ml-auto text-[10px] font-bold text-slate-400">{count}</span>
          </div>
          <div className="space-y-1.5">
            {Array.from({ length: columnIndex === 2 ? 3 : 2 }).map((_, cardIndex) => (
              <div className="rounded-md border border-slate-200 bg-white p-2 shadow-sm" key={cardIndex}>
                <Bar className="h-1.5" width={cardIndex % 2 ? "70%" : "88%"} />
                <Bar className="mt-1.5 h-1.5" width="52%" />
                <div className="mt-2 flex items-center gap-1">
                  <span className="h-3.5 w-3.5 rounded-full bg-teal-100" />
                  <Bar className="h-1" width="34%" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/** Roles matrix: permissions as the product's control surface. */
export const RolesMock = () => (
  <div className={`${panel} space-y-2`}>
    <p className="text-sm font-bold text-slate-950">Roles and permissions</p>
    {[
      ["Super Admin", "Built-in", true, true, true],
      ["Manager", "Built-in", true, true, false],
      ["Shift Lead", "Custom", true, false, false],
    ].map(([role, kind, a, b, c]) => (
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-canvas px-2.5 py-2" key={role}>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-bold text-slate-900">{role}</p>
          <p className="text-[9px] font-semibold text-slate-500">{kind}</p>
        </div>
        {[a, b, c].map((granted, index) => (
          <span
            className={`flex h-4 w-4 items-center justify-center rounded ${
              granted ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-300"
            }`}
            key={index}
          >
            <FiCheckCircle className="h-2.5 w-2.5" />
          </span>
        ))}
      </div>
    ))}
  </div>
);

/** Compact status strip used under the hero. */
export const InsightStrip = () => (
  <div className="grid grid-cols-3 gap-2">
    {[
      ["At risk", "2 projects", FiAlertCircle, "text-rose-700"],
      ["On track", "9 projects", FiActivity, "text-emerald-700"],
      ["Logged", "137h", FiClock, "text-teal-800"],
    ].map(([label, value, Icon, tone]) => (
      <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-sm" key={label}>
        {createElement(Icon, { className: `h-3.5 w-3.5 ${tone}` })}
        <p className="mt-1 text-[11px] font-bold text-slate-950">{value}</p>
        <p className="text-[9px] font-semibold uppercase text-slate-500">{label}</p>
      </div>
    ))}
  </div>
);

/** Reports: delivery velocity, workload, and department performance side by side. */
export const ReportsMock = () => {
  const velocity = [34, 52, 41, 68, 57, 78];

  return (
    <div className={`${panel} space-y-3`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Reports</p>
          <p className="mt-0.5 text-base font-bold text-slate-950">Delivery velocity</p>
        </div>
        <span className="rounded-md border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-500">
          Last 30 days
        </span>
      </div>

      {/* Task movement, as a compact bar series. */}
      <div className="rounded-lg border border-slate-200 bg-canvas p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Task movement</p>
        <div className="mt-2.5 flex h-20 items-end gap-1.5">
          {velocity.map((value, index) => (
            <div className="flex flex-1 flex-col items-center gap-1" key={index}>
              <span
                className={`w-full rounded-t ${index === velocity.length - 1 ? "bg-emerald-600" : "bg-emerald-200"}`}
                style={{ height: `${(value / Math.max(...velocity)) * 100}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Team workload as utilisation meters. */}
        <div className="rounded-lg border border-slate-200 bg-canvas p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Team workload</p>
          <div className="mt-2 space-y-2">
            {[
              ["Ayesha", 86, "bg-amber-500"],
              ["Hamid", 62, "bg-emerald-500"],
              ["Sara", 41, "bg-teal-500"],
            ].map(([name, load, tone]) => (
              <div key={name}>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-semibold text-slate-600">{name}</span>
                  <span className="text-[9px] font-bold text-slate-500">{load}%</span>
                </div>
                <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <span className={`block h-full rounded-full ${tone}`} style={{ width: `${load}%` }} />
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Department performance. */}
        <div className="rounded-lg border border-slate-200 bg-canvas p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Departments</p>
          <div className="mt-2 space-y-1.5">
            {[
              ["Engineering", "92%", "text-emerald-700"],
              ["Operations", "78%", "text-teal-800"],
              ["Support", "64%", "text-amber-700"],
            ].map(([name, value, tone]) => (
              <div className="flex items-center justify-between" key={name}>
                <span className="truncate text-[10px] font-semibold text-slate-600">{name}</span>
                <span className={`text-[10px] font-bold ${tone}`}>{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 rounded-md bg-rose-50 px-2 py-1.5">
            <FiAlertCircle className="h-3 w-3 shrink-0 text-rose-700" />
            <span className="text-[9px] font-bold text-rose-700">2 projects at risk</span>
          </div>
        </div>
      </div>
    </div>
  );
};
