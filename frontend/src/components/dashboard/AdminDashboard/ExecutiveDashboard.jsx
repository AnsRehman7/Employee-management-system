import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiArrowUpRight,
  FiBarChart2,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import { NavLink } from "react-router-dom";
import Alert from "../../Alert";
import { api, formatApiError } from "../../../context/api";
import { useUser } from "../../../context/UserContext";
import { labelForValue } from "./workUtils";

const monthFormatter = new Intl.DateTimeFormat("en", { month: "short" });
const dayFormatter = new Intl.DateTimeFormat("en", {
  day: "2-digit",
  month: "short",
});

const toLocalDateInput = (date = new Date()) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const clampPercent = (value) => Math.max(0, Math.min(100, Math.round(value || 0)));

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const Card = ({ children, className = "" }) => (
  <section className={`rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-200/60 ${className}`}>
    {children}
  </section>
);

const StatCard = ({ accent = "bg-violet-500", helper, icon, label, value }) => (
  <Card className="p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
        <p className="mt-1 text-sm font-semibold text-slate-500">{helper}</p>
      </div>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white ${accent}`}>
        {icon}
      </span>
    </div>
  </Card>
);

const DonutChart = ({ centerLabel, centerValue, segments }) => {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-36 w-36 shrink-0">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" fill="none" r="38" stroke="#e5e7eb" strokeWidth="12" />
          {segments.map((segment) => {
            const size = (segment.value / total) * 100;
            const dashOffset = -offset;
            offset += size;

            return (
              <circle
                cx="50"
                cy="50"
                fill="none"
                key={segment.label}
                pathLength="100"
                r="38"
                stroke={segment.color}
                strokeDasharray={`${size} ${100 - size}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                strokeWidth="12"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-2xl font-bold text-slate-950">{centerValue}</p>
          <p className="text-xs font-bold uppercase text-slate-500">{centerLabel}</p>
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        {segments.map((segment) => (
          <div className="flex items-center justify-between gap-3 text-sm" key={segment.label}>
            <span className="flex min-w-0 items-center gap-2 font-semibold text-slate-600">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: segment.color }} />
              <span className="truncate">{segment.label}</span>
            </span>
            <span className="font-bold text-slate-950">{segment.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const TrendChart = ({ points }) => {
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const coordinates = points.map((point, index) => {
    const x = points.length === 1 ? 10 : 10 + (index / (points.length - 1)) * 80;
    const y = 82 - (point.value / maxValue) * 58;
    return { ...point, x, y };
  });
  const path = coordinates.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const fillPath = `${path} L ${coordinates[coordinates.length - 1]?.x || 90} 86 L ${coordinates[0]?.x || 10} 86 Z`;

  return (
    <div>
      <svg className="h-64 w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fillPath} fill="url(#trendFill)" />
        <path d={path} fill="none" stroke="#7c3aed" strokeLinecap="round" strokeWidth="2.5" />
        {coordinates.map((point) => (
          <circle cx={point.x} cy={point.y} fill="#fff" key={point.label} r="2.6" stroke="#7c3aed" strokeWidth="2" />
        ))}
      </svg>
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400">
        {points.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </div>
  );
};

const WorkloadBars = ({ items }) => (
  <div className="space-y-4">
    {items.length === 0 ? (
      <p className="py-8 text-center text-sm font-semibold text-slate-500">No active workload yet.</p>
    ) : (
      items.map((item) => (
        <div key={item.name}>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-bold text-slate-700">{item.name}</span>
            <span className="font-bold text-slate-950">{item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-cyan-500" style={{ width: `${item.percent}%` }} />
          </div>
        </div>
      ))
    )}
  </div>
);

const ExecutiveDashboard = () => {
  const { user } = useUser();
  const [data, setData] = useState({
    attendance: [],
    employees: [],
    projects: [],
    tasks: [],
    users: [],
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => toLocalDateInput(), []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    const requests = {
      attendance: api.getAttendanceScans(today),
      employees: api.getEmployees(),
      projects: api.getProjects(),
      tasks: api.getTasks(),
      users: user?.permissions?.canManageUsers ? api.getUsers() : Promise.resolve({ users: [] }),
    };

    const entries = await Promise.all(
      Object.entries(requests).map(async ([key, request]) => {
        try {
          return [key, await request, null];
        } catch (error) {
          return [key, null, error];
        }
      })
    );

    const nextData = {};
    const errors = [];

    const responseKeys = {
      attendance: "scans",
      employees: "employees",
      projects: "projects",
      tasks: "tasks",
      users: "users",
    };

    entries.forEach(([key, payload, requestError]) => {
      if (requestError) {
        errors.push(formatApiError(requestError));
        nextData[key] = [];
        return;
      }

      nextData[key] = payload?.[responseKeys[key]] || [];
    });

    setData((current) => ({ ...current, ...nextData }));
    setError([...new Set(errors)].join(" "));
    setLoading(false);
  }, [today, user?.permissions?.canManageUsers]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const dashboard = useMemo(() => {
    const activeUsers = (data.users.length ? data.users : data.employees).filter((member) => member.status !== "suspended");
    const activeTasks = data.tasks.filter((task) => task.status !== "completed");
    const completedTasks = data.tasks.filter((task) => task.status === "completed");
    const overdueTasks = activeTasks.filter((task) => {
      if (!task.deadline) return false;
      return new Date(task.deadline).setHours(23, 59, 59, 999) < Date.now();
    });
    const activeProjects = data.projects.filter((project) => !["archived", "completed"].includes(project.status));
    const projectAtRisk = data.projects.filter((project) => ["due-soon", "overdue"].includes(project.health));
    const completionRate = data.tasks.length ? clampPercent((completedTasks.length / data.tasks.length) * 100) : 0;
    const attendanceUsers = new Set(
      data.attendance
        .filter((scan) => scan.accepted !== false && scan.direction === "in")
        .map((scan) => scan.userId)
    );
    const attendanceRate = activeUsers.length ? clampPercent((attendanceUsers.size / activeUsers.length) * 100) : 0;
    const totalLoggedHours = data.tasks.reduce((total, task) => total + (task.totalLoggedHours || 0), 0);

    const monthKeys = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (6 - index), 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: monthFormatter.format(date),
        value: 0,
      };
    });

    completedTasks.forEach((task) => {
      const date = task.completedAt ? new Date(task.completedAt) : task.updatedAt ? new Date(task.updatedAt) : null;
      if (!date) return;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const bucket = monthKeys.find((month) => month.key === key);
      if (bucket) bucket.value += 1;
    });

    const workloadMap = activeTasks.reduce((acc, task) => {
      const name = task.assignedToName || "Unassigned";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});
    const maxWorkload = Math.max(...Object.values(workloadMap), 1);
    const workload = Object.entries(workloadMap)
      .map(([name, value]) => ({ name, percent: clampPercent((value / maxWorkload) * 100), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const healthSegments = [
      { color: "#06b6d4", label: "On track", value: data.projects.filter((project) => project.health === "on-track").length },
      { color: "#f59e0b", label: "Due soon", value: data.projects.filter((project) => project.health === "due-soon").length },
      { color: "#f43f5e", label: "Overdue", value: data.projects.filter((project) => project.health === "overdue").length },
      { color: "#7c3aed", label: "Complete", value: data.projects.filter((project) => project.health === "complete").length },
    ];

    const recentTasks = [...data.tasks]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 5);

    return {
      activeProjects,
      activeTasks,
      activeUsers,
      attendanceRate,
      attendanceUsers,
      completionRate,
      completedTasks,
      healthSegments,
      monthKeys,
      overdueTasks,
      projectAtRisk,
      recentTasks,
      totalLoggedHours,
      workload,
    };
  }, [data]);

  if (loading) {
    return (
      <Card className="p-10 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500" />
        <p className="mt-4 text-sm font-semibold text-slate-500">Loading executive dashboard...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Alert message={error} type="error" />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
            {dayFormatter.format(new Date())} / Workforce intelligence
          </p>
          <h2 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
            {getGreeting()}, {user?.name?.split(" ")[0] || "there"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Here is the organization-wide picture before you create or assign more work.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            onClick={loadDashboard}
            type="button"
          >
            <FiRefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <NavLink
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
            to="/projects"
          >
            <FiArrowUpRight className="h-4 w-4" />
            Project workspace
          </NavLink>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          accent="bg-violet-600"
          helper={`${dashboard.projectAtRisk.length} need attention`}
          icon={<FiBriefcase className="h-5 w-5" />}
          label="Active projects"
          value={dashboard.activeProjects.length}
        />
        <StatCard
          accent="bg-cyan-500"
          helper={`${dashboard.completedTasks.length} completed`}
          icon={<FiCheckCircle className="h-5 w-5" />}
          label="Completion rate"
          value={`${dashboard.completionRate}%`}
        />
        <StatCard
          accent="bg-rose-500"
          helper={`${dashboard.overdueTasks.length} overdue active`}
          icon={<FiClock className="h-5 w-5" />}
          label="Active tasks"
          value={dashboard.activeTasks.length}
        />
        <StatCard
          accent="bg-violet-500"
          helper={`${dashboard.attendanceUsers.size} checked in today`}
          icon={<FiUsers className="h-5 w-5" />}
          label="Attendance today"
          value={`${dashboard.attendanceRate}%`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="p-5">
          <div className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Performance</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-950">Work completion trend</h3>
              <p className="mt-1 text-sm text-slate-500">Completed task movement across the last seven months.</p>
            </div>
            <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
              {dashboard.completedTasks.length} completed
            </span>
          </div>
          <TrendChart points={dashboard.monthKeys} />
        </Card>

        <Card className="overflow-hidden">
          <div className="bg-violet-600 p-5 text-white">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-lg bg-white/15 p-3">
                <FiActivity className="h-5 w-5" />
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">Live</span>
            </div>
            <h3 className="mt-6 text-2xl font-bold">Executive insight</h3>
            <p className="mt-2 text-sm leading-6 text-violet-100">
              {dashboard.completionRate >= 75
                ? "Delivery is healthy. Keep an eye on workload balance and overdue tasks."
                : "Delivery needs attention. Prioritize at-risk projects and remove blockers before adding new tasks."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 p-5">
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Logged</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{dashboard.totalLoggedHours.toFixed(1)}h</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Members</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{dashboard.activeUsers.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-5">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Portfolio</p>
            <h3 className="mt-1 text-xl font-bold text-slate-950">Project health</h3>
          </div>
          <DonutChart
            centerLabel="projects"
            centerValue={data.projects.length}
            segments={dashboard.healthSegments}
          />
        </Card>

        <Card className="p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Capacity</p>
              <h3 className="mt-1 text-xl font-bold text-slate-950">Team workload</h3>
            </div>
            <FiBarChart2 className="h-5 w-5 text-cyan-500" />
          </div>
          <WorkloadBars items={dashboard.workload} />
        </Card>

        <Card className="p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Live feed</p>
              <h3 className="mt-1 text-xl font-bold text-slate-950">Recent activity</h3>
            </div>
            <FiTrendingUp className="h-5 w-5 text-violet-500" />
          </div>
          <div className="space-y-3">
            {dashboard.recentTasks.length === 0 ? (
              <p className="py-8 text-center text-sm font-semibold text-slate-500">No task activity yet.</p>
            ) : (
              dashboard.recentTasks.map((task) => (
                <div className="flex gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0" key={task.id}>
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <FiCalendar className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-950">{task.title}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {task.assignedToName} / {labelForValue(task.status)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
