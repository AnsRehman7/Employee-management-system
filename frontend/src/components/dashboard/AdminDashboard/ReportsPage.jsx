import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiAlertTriangle,
  FiBarChart2,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiGitBranch,
  FiRefreshCw,
  FiTarget,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import Alert from "../../Alert";
import AppShell from "../../AppShell";
import { api, formatApiError } from "../../../context/api";
import { labelForValue } from "./workUtils";

const PERIODS = [7, 30, 90];
const STATUS_COLORS = {
  active: "#06b6d4",
  completed: "#10b981",
  in_progress: "#8b5cf6",
  open: "#94a3b8",
};
const HEALTH_COLORS = {
  archived: "#94a3b8",
  at_risk: "#f43f5e",
  completed: "#10b981",
  on_track: "#06b6d4",
};

const numberFormatter = new Intl.NumberFormat("en", { maximumFractionDigits: 1 });
const dateTimeFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

const plannerMetric = (value, suffix = "") =>
  value === null || value === undefined ? "-" : `${numberFormatter.format(value)}${suffix}`;

const exportPlanningEvaluations = (research) => {
  const columns = [
    ["evaluated_at", (row) => row.evaluatedAt],
    ["project", (row) => row.projectName],
    ["plan_version", (row) => row.planVersion],
    ["requirement_coverage_percent", (row) => row.metrics.requirementCoverage],
    ["schedule_violations", (row) => row.metrics.scheduleViolations],
    ["dependency_violations", (row) => row.metrics.dependencyViolations],
    ["effort_mae_hours", (row) => row.metrics.effortMeanAbsoluteError],
    ["manager_override_percent", (row) => row.metrics.managerOverrideRate],
    ["generation_seconds", (row) => row.metrics.generationSeconds],
    ["review_minutes", (row) => row.metrics.planningReviewMinutes],
    ["planning_time_saved_minutes", (row) => row.metrics.planningTimeSavedMinutes],
  ];
  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [
    columns.map(([header]) => escape(header)).join(","),
    ...(research.evaluations || []).map((row) =>
      columns.map(([, read]) => escape(read(row))).join(","),
    ),
  ].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `staffflow-planner-evaluation-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const Panel = ({ children, className = "" }) => (
  <section className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>{children}</section>
);

const Metric = ({ helper, icon, label, tone, value }) => (
  <Panel className="p-4">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
        <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
      </div>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>{icon}</span>
    </div>
  </Panel>
);

const TrendChart = ({ points }) => {
  const chartPoints = points || [];
  const maxValue = Math.max(...chartPoints.flatMap((point) => [point.created, point.completed]), 1);
  const xFor = (index) => (chartPoints.length <= 1 ? 50 : 5 + (index / (chartPoints.length - 1)) * 90);
  const yFor = (value) => 84 - (value / maxValue) * 66;
  const pathFor = (key) =>
    chartPoints
      .map((point, index) => `${index ? "L" : "M"} ${xFor(index)} ${yFor(point[key])}`)
      .join(" ");
  const labelStep = Math.max(1, Math.ceil(chartPoints.length / 7));

  if (!chartPoints.length) return <p className="py-20 text-center text-sm text-slate-500">No trend data yet.</p>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-4 text-xs font-bold text-slate-600">
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-violet-600" />Created</span>
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Completed</span>
      </div>
      <svg aria-label="Tasks created and completed over time" className="h-64 w-full" preserveAspectRatio="none" role="img" viewBox="0 0 100 100">
        {[18, 40, 62, 84].map((y) => <line key={y} stroke="#e2e8f0" strokeWidth="0.5" x1="5" x2="95" y1={y} y2={y} />)}
        <path d={pathFor("created")} fill="none" stroke="#7c3aed" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
        <path d={pathFor("completed")} fill="none" stroke="#10b981" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
      </svg>
      <div className="flex justify-between gap-2 text-[11px] font-semibold text-slate-400">
        {chartPoints.map((point, index) => (
          index % labelStep === 0 || index === chartPoints.length - 1
            ? <span key={point.date}>{point.label}</span>
            : null
        ))}
      </div>
    </div>
  );
};

const Donut = ({ items, label }) => {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let offset = 0;

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="relative mx-auto h-36 w-36 shrink-0 sm:mx-0">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" fill="none" r="38" stroke="#e2e8f0" strokeWidth="12" />
          {items.map((item) => {
            const size = total ? (item.value / total) * 100 : 0;
            const dashOffset = -offset;
            offset += size;
            return <circle cx="50" cy="50" fill="none" key={item.key} pathLength="100" r="38" stroke={item.color} strokeDasharray={`${size} ${100 - size}`} strokeDashoffset={dashOffset} strokeWidth="12" />;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-950">{total}</span>
          <span className="text-[11px] font-bold uppercase text-slate-400">{label}</span>
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-2.5">
        {items.map((item) => (
          <div className="flex items-center justify-between gap-3 text-sm" key={item.key}>
            <span className="flex min-w-0 items-center gap-2 font-semibold text-slate-600"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} /><span className="truncate">{labelForValue(item.key)}</span></span>
            <span className="font-bold text-slate-950">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ReportsPage = () => {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { report: nextReport } = await api.getOverviewReport(days);
      setReport(nextReport);
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const taskStatuses = useMemo(
    () => (report?.taskStatuses || []).map((item) => ({ ...item, color: STATUS_COLORS[item.key] || "#94a3b8" })),
    [report],
  );
  const projectHealth = useMemo(
    () => (report?.projectHealth || []).map((item) => ({ ...item, color: HEALTH_COLORS[item.key] || "#94a3b8" })),
    [report],
  );
  const planningResearch = useMemo(
    () => ({ evaluations: [], ...(report?.planningResearch || {}) }),
    [report],
  );

  return (
    <AppShell title="Reports" subtitle="Organization delivery, capacity, attendance, and operational risk in one view.">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex w-fit rounded-lg border border-slate-200 bg-white p-1">
            {PERIODS.map((period) => (
              <button className={`h-8 rounded-md px-3 text-xs font-bold transition ${days === period ? "bg-violet-600 text-white" : "text-slate-600 hover:bg-slate-100"}`} key={period} onClick={() => setDays(period)} type="button">{period} days</button>
            ))}
          </div>
          <button aria-label="Refresh report" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50" onClick={loadReport} title="Refresh report" type="button"><FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</button>
        </div>

        <Alert message={error} type="error" />

        {loading && !report ? (
          <Panel className="py-24 text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-violet-600" /><p className="mt-4 text-sm font-semibold text-slate-500">Preparing organization report...</p></Panel>
        ) : report ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric helper={`${report.summary.completedTasks} completed overall`} icon={<FiCheckCircle className="h-5 w-5" />} label="Task completion" tone="bg-emerald-100 text-emerald-700" value={`${report.summary.completionRate}%`} />
              <Metric helper={`${report.summary.projectsAtRisk} projects need attention`} icon={<FiBriefcase className="h-5 w-5" />} label="Active projects" tone="bg-violet-100 text-violet-700" value={report.summary.activeProjects} />
              <Metric helper={`${report.summary.overdueTasks} overdue tasks`} icon={<FiClock className="h-5 w-5" />} label="Open workload" tone="bg-rose-100 text-rose-700" value={report.summary.activeTasks} />
              <Metric helper={`${report.summary.activeMembers} active members`} icon={<FiUsers className="h-5 w-5" />} label="Attendance today" tone="bg-cyan-100 text-cyan-700" value={`${report.summary.attendanceToday}%`} />
            </div>

            <Panel className="overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-violet-700">Explainable planner evaluation</p>
                  <h2 className="mt-1 text-lg font-bold text-slate-950">Research evidence</h2>
                  <p className="mt-1 text-sm text-slate-500">Measured outcomes from manager-reviewed project plans.</p>
                </div>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!planningResearch.evaluations.length}
                  onClick={() => exportPlanningEvaluations(planningResearch)}
                  type="button"
                >
                  <FiDownload className="h-4 w-4" />Export CSV
                </button>
              </div>
              <div className="grid divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
                {[
                  { icon: <FiTarget className="h-4 w-4 text-violet-600" />, label: "Requirement coverage", value: plannerMetric(planningResearch.averageRequirementCoverage, "%") },
                  { icon: <FiClock className="h-4 w-4 text-violet-600" />, label: "Planning time saved", value: plannerMetric(planningResearch.averagePlanningTimeSavedMinutes, " min") },
                  { icon: <FiGitBranch className="h-4 w-4 text-violet-600" />, label: "Dependency violations", value: plannerMetric(planningResearch.averageDependencyViolations) },
                  { icon: <FiActivity className="h-4 w-4 text-violet-600" />, label: "Manager override rate", value: plannerMetric(planningResearch.averageManagerOverrideRate, "%") },
                ].map(({ icon, label, value }) => (
                  <div className="px-5 py-4" key={label}>
                    {icon}
                    <p className="mt-3 text-xs font-bold uppercase text-slate-500">{label}</p>
                    <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
                  </div>
                ))}
              </div>
              {planningResearch.evaluations.length ? (
                <div className="overflow-x-auto border-t border-slate-200">
                  <table className="w-full min-w-[850px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500"><tr><th className="px-5 py-3">Project / plan</th><th className="px-4 py-3">Coverage</th><th className="px-4 py-3">Schedule</th><th className="px-4 py-3">Dependencies</th><th className="px-4 py-3">Effort MAE</th><th className="px-4 py-3">Overrides</th><th className="px-5 py-3">Time saved</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {planningResearch.evaluations.map((evaluation) => (
                        <tr key={evaluation.id}>
                          <td className="px-5 py-3"><Link className="font-bold text-slate-900 hover:text-violet-700" to={`/projects/${evaluation.projectId}/planner`}>{evaluation.projectName}</Link><p className="mt-0.5 text-xs text-slate-500">Plan v{evaluation.planVersion}</p></td>
                          <td className="px-4 py-3 font-bold text-slate-700">{plannerMetric(evaluation.metrics.requirementCoverage, "%")}</td>
                          <td className="px-4 py-3 font-semibold text-slate-700">{plannerMetric(evaluation.metrics.scheduleViolations)}</td>
                          <td className="px-4 py-3 font-semibold text-slate-700">{plannerMetric(evaluation.metrics.dependencyViolations)}</td>
                          <td className="px-4 py-3 font-semibold text-slate-700">{plannerMetric(evaluation.metrics.effortMeanAbsoluteError, "h")}</td>
                          <td className="px-4 py-3 font-semibold text-slate-700">{plannerMetric(evaluation.metrics.managerOverrideRate, "%")}</td>
                          <td className="px-5 py-3 font-semibold text-slate-700">{plannerMetric(evaluation.metrics.planningTimeSavedMinutes, " min")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="border-t border-slate-200 px-5 py-8 text-center text-sm text-slate-500">Evaluate an approved plan to build the research dataset.</p>
              )}
            </Panel>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.55fr)]">
              <Panel className="p-5">
                <div className="mb-5 flex items-start justify-between gap-3 border-b border-slate-200 pb-4"><div><p className="text-xs font-bold uppercase text-slate-400">Delivery velocity</p><h2 className="mt-1 text-lg font-bold text-slate-950">Task movement</h2></div><FiTrendingUp className="h-5 w-5 text-violet-600" /></div>
                <TrendChart points={report.timeline} />
              </Panel>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
                <Panel className="p-5"><div className="mb-5"><p className="text-xs font-bold uppercase text-slate-400">Work state</p><h2 className="mt-1 text-lg font-bold text-slate-950">Task distribution</h2></div><Donut items={taskStatuses} label="tasks" /></Panel>
                <Panel className="p-5"><div className="mb-5"><p className="text-xs font-bold uppercase text-slate-400">Portfolio</p><h2 className="mt-1 text-lg font-bold text-slate-950">Project health</h2></div><Donut items={projectHealth} label="projects" /></Panel>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)]">
              <Panel className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><p className="text-xs font-bold uppercase text-slate-400">Capacity</p><h2 className="mt-1 text-lg font-bold text-slate-950">Team workload</h2></div><FiBarChart2 className="h-5 w-5 text-cyan-600" /></div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500"><tr><th className="px-5 py-3">Member</th><th className="px-4 py-3">Active</th><th className="px-4 py-3">Overdue</th><th className="px-4 py-3">Planned</th><th className="px-5 py-3">Load</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.workload.map((member) => (
                        <tr key={member.id}><td className="px-5 py-3"><p className="font-bold text-slate-900">{member.name}</p><p className="mt-0.5 text-xs text-slate-500">{member.department}</p></td><td className="px-4 py-3 font-semibold text-slate-700">{member.activeTasks}</td><td className={`px-4 py-3 font-bold ${member.overdueTasks ? "text-rose-600" : "text-slate-500"}`}>{member.overdueTasks}</td><td className="px-4 py-3 font-semibold text-slate-700">{numberFormatter.format(member.plannedHours)}h</td><td className="min-w-40 px-5 py-3"><div className="mb-1 flex justify-between text-xs font-bold text-slate-500"><span>Weekly</span><span>{member.utilization}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${member.utilization >= 90 ? "bg-rose-500" : member.utilization >= 70 ? "bg-amber-500" : "bg-cyan-500"}`} style={{ width: `${member.utilization}%` }} /></div></td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!report.workload.length && <p className="px-5 py-12 text-center text-sm text-slate-500">No assigned workload yet.</p>}
              </Panel>

              <Panel className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><p className="text-xs font-bold uppercase text-slate-400">Attention</p><h2 className="mt-1 text-lg font-bold text-slate-950">Operational risk</h2></div><FiAlertTriangle className="h-5 w-5 text-amber-500" /></div>
                <div className="divide-y divide-slate-100">
                  {report.attention.overdueTasks.map((task) => <Link className="block px-5 py-3 transition hover:bg-slate-50" key={task.id} to={`/tasks/${task.id}`}><p className="truncate text-sm font-bold text-slate-900">{task.title}</p><p className="mt-1 text-xs text-slate-500">{task.assigneeName} / Due {new Date(task.deadline).toLocaleDateString()}</p></Link>)}
                  {report.attention.projects.map((project) => <Link className="block px-5 py-3 transition hover:bg-slate-50" key={project.id} to={`/projects/${project.id}`}><p className="truncate text-sm font-bold text-slate-900">{project.name}</p><p className="mt-1 text-xs text-slate-500">{project.ownerName} / {project.progress}% complete</p></Link>)}
                  {!report.attention.overdueTasks.length && !report.attention.projects.length && <div className="px-5 py-12 text-center"><FiCheckCircle className="mx-auto h-7 w-7 text-emerald-500" /><p className="mt-3 text-sm font-bold text-slate-700">No urgent delivery risks</p></div>}
                </div>
              </Panel>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <Panel className="overflow-hidden"><div className="border-b border-slate-200 px-5 py-4"><p className="text-xs font-bold uppercase text-slate-400">Organization</p><h2 className="mt-1 text-lg font-bold text-slate-950">Department performance</h2></div><div className="divide-y divide-slate-100">{report.departments.map((department) => <div className="grid grid-cols-[minmax(0,1fr)_80px_100px] items-center gap-3 px-5 py-3" key={department.name}><div><p className="font-bold text-slate-900">{department.name}</p><p className="mt-0.5 text-xs text-slate-500">{department.members} members / {department.activeTasks} active tasks</p></div><span className="text-right text-sm font-bold text-slate-700">{department.completionRate}%</span><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-600" style={{ width: `${department.completionRate}%` }} /></div></div>)}</div></Panel>
              <Panel className="overflow-hidden"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><p className="text-xs font-bold uppercase text-slate-400">Governance</p><h2 className="mt-1 text-lg font-bold text-slate-950">Recent activity</h2></div><FiActivity className="h-5 w-5 text-violet-600" /></div><div className="divide-y divide-slate-100">{report.recentActivity.map((entry) => <div className="px-5 py-3" key={entry.id}><div className="flex items-start justify-between gap-4"><p className="text-sm font-bold text-slate-900">{entry.summary}</p><span className="shrink-0 text-[11px] font-semibold text-slate-400">{dateTimeFormatter.format(new Date(entry.createdAt))}</span></div><p className="mt-1 text-xs text-slate-500">{entry.actor?.name || "System"} / {labelForValue(entry.action)}</p></div>)}</div></Panel>
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
};

export default ReportsPage;
