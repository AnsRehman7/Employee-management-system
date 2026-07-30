import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiEdit2,
  FiFlag,
  FiGitBranch,
  FiRefreshCw,
  FiSave,
  FiTrash2,
  FiUser,
  FiX,
} from "react-icons/fi";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Alert from "../../Alert";
import AppShell from "../../AppShell";
import CustomFieldsForm from "../../CustomFieldsForm";
import { api, formatApiError } from "../../../context/api";
import { useUser } from "../../../context/UserContext";
import WorkActivityTimeline from "./WorkActivityTimeline";
import TaskCollaborationPanel from "./TaskCollaborationPanel";
import {
  formatDate,
  formatDateTime,
  initialsFor,
  labelForValue,
  TASK_STATUS_OPTIONS,
  TASK_STATUS_STYLES,
} from "./workUtils";

const fieldClass =
  "mt-2 h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100";
const textareaClass =
  "mt-2 w-full resize-y rounded-md border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm leading-6 text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100";

const taskToForm = (task) => ({
  assignedToId: task.assignedToId || "",
  category: task.category || "",
  customFields: task.customFields || {},
  deadline: task.deadline || "",
  dependencyIds: task.dependencyIds || [],
  description: task.description || "",
  estimatedHours: task.estimatedHours ?? "",
  priority: task.priority || "normal",
  projectId: task.projectId || "",
  requiredSkills: (task.requiredSkills || []).join(", "),
  riskLevel: task.riskLevel || "low",
  status: task.status || "open",
  successCriteria: task.successCriteria || "",
  title: task.title || "",
});

const TaskDetailPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const [task, setTask] = useState(null);
  const [activity, setActivity] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [moduleDefinition, setModuleDefinition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [timeForm, setTimeForm] = useState({ hours: "", loggedAt: "", note: "" });
  const [notice, setNotice] = useState(
    location.state?.notice
      ? { message: location.state.notice, type: "success" }
      : { message: "", type: "info" },
  );

  const canDeleteTasks = Boolean(user?.permissions?.canDeleteTasks);
  const canEditTasks = Boolean(user?.permissions?.canEditTasks);
  const canUpdateWork = canEditTasks || task?.assignedToId === user?.id;
  const canLogWork = Boolean(task?.assignedToId) && canUpdateWork;
  const isCompleted = task?.status === "completed";
  const fieldVisible = (key) => {
    const field = moduleDefinition?.fields.find((item) => item.systemFieldKey === key);
    return !field?.archived && field?.isVisible !== false;
  };
  const fieldRequired = (key) =>
    Boolean(moduleDefinition?.fields.find((field) => field.systemFieldKey === key)?.isRequired);
  const effortProgress = useMemo(() => {
    if (!task?.estimatedHours) return 0;
    return Math.min(100, Math.round(((task.totalLoggedHours || 0) / task.estimatedHours) * 100));
  }, [task]);

  const loadTask = useCallback(
    async ({ showLoading = false } = {}) => {
      if (showLoading) setLoading(true);
      try {
        const [{ task: taskDetail }, { activity: taskActivity }, { module }] = await Promise.all([
          api.getTask(taskId),
          api.getTaskActivity(taskId),
          api.getCustomModule("tasks"),
        ]);
        setTask(taskDetail);
        setModuleDefinition(module);
        setActivity(taskActivity || []);
        setEditForm(taskToForm(taskDetail));
        setNotice((current) =>
          current.type === "error" ? { message: "", type: "info" } : current,
        );
      } catch (requestError) {
        setNotice({ message: formatApiError(requestError), type: "error" });
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [taskId],
  );

  useEffect(() => {
    loadTask({ showLoading: true });
  }, [loadTask]);

  useEffect(() => {
    if (!canEditTasks) return undefined;
    let active = true;

    Promise.all([api.getEmployees(), api.getProjects(), api.getTasks({ limit: 100, projectId: task?.projectId })])
      .then(([{ employees: employeeList }, { projects: projectList }, { tasks: taskList }]) => {
        if (!active) return;
        setEmployees(employeeList);
        setProjects(projectList.filter((project) => project.status !== "archived"));
        setAvailableTasks(taskList.filter((item) => item.id !== taskId));
      })
      .catch((requestError) => {
        if (active) setNotice({ message: formatApiError(requestError), type: "error" });
      });

    return () => {
      active = false;
    };
  }, [canEditTasks, task?.projectId, taskId]);

  const changeStatus = async (status) => {
    if (!task || status === task.status) return;
    setBusy(true);
    setNotice({ message: "", type: "info" });
    try {
      await api.updateTaskStatus(task.id, status, task.version);
      await loadTask();
      setNotice({ message: `Task moved to ${labelForValue(status)}.`, type: "success" });
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setBusy(true);
    setNotice({ message: "", type: "info" });
    try {
      await api.updateTask(task.id, {
        ...editForm,
        expectedVersion: task.version,
        requiredSkills: editForm.requiredSkills.split(",").map((skill) => skill.trim()).filter(Boolean),
      });
      await loadTask();
      setEditing(false);
      setNotice({ message: "Task details updated.", type: "success" });
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const handleTimeLog = async (event) => {
    event.preventDefault();
    setBusy(true);
    setNotice({ message: "", type: "info" });
    try {
      await api.createTimeLog(task.id, timeForm);
      setTimeForm({ hours: "", loggedAt: "", note: "" });
      await loadTask();
      setNotice({ message: "Work log added and progress recalculated.", type: "success" });
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${task.title}"? This also removes its work logs.`)) return;
    setBusy(true);
    try {
      await api.deleteTask(task.id);
      navigate("/tasks", { replace: true });
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Task detail" subtitle="Loading assignment information.">
        <div className="py-24 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-700" />
          <p className="mt-4 text-sm font-semibold text-slate-500">Loading task...</p>
        </div>
      </AppShell>
    );
  }

  if (!task) {
    return (
      <AppShell title="Task detail">
        <div className="rounded-lg border border-slate-200 bg-white p-10 text-center">
          <Alert message={notice.message || "Task not found."} type="error" />
          <Link className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-800" to="/tasks">
            <FiArrowLeft className="h-4 w-4" />
            Back to tasks
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Task" subtitle="Plan the work, keep ownership clear, and record delivery decisions.">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <Link className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-emerald-800" to="/tasks">
            <FiArrowLeft className="h-4 w-4" />
            All tasks
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {canUpdateWork && (
              <button
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold transition disabled:opacity-60 ${
                  isCompleted
                    ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    : "bg-emerald-600 text-white shadow-sm shadow-emerald-200 hover:bg-emerald-700"
                }`}
                disabled={busy}
                onClick={() => changeStatus(isCompleted ? "active" : "completed")}
                type="button"
              >
                {isCompleted ? <FiRefreshCw className="h-4 w-4" /> : <FiCheck className="h-4 w-4" />}
                {isCompleted ? "Reopen task" : "Mark complete"}
              </button>
            )}
            {canEditTasks && (
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                onClick={() => setEditing((current) => !current)}
                type="button"
              >
                {editing ? <FiX className="h-4 w-4" /> : <FiEdit2 className="h-4 w-4" />}
                {editing ? "Cancel" : "Edit"}
              </button>
            )}
            {canDeleteTasks && (
              <button
                aria-label="Delete task"
                className="flex h-10 w-10 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                disabled={busy}
                onClick={handleDelete}
                title="Delete task"
                type="button"
              >
                <FiTrash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <Alert message={notice.message} type={notice.type} />

        {editing && canEditTasks ? (
          <form className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" onSubmit={handleSave}>
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-950">Edit task</h2>
                <p className="mt-1 text-sm text-slate-500">Every saved change is added to the task timeline.</p>
              </div>
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-bold text-white disabled:bg-slate-300" disabled={busy} type="submit">
                <FiSave className="h-4 w-4" />
                {busy ? "Saving..." : "Save changes"}
              </button>
            </div>
            <div className="grid gap-5 p-5 lg:grid-cols-2 xl:grid-cols-3">
              <label className="block xl:col-span-2">
                <span className="text-sm font-bold text-slate-700">Task title</span>
                <input className={fieldClass} onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))} required value={editForm.title} />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Project</span>
                <select className={fieldClass} onChange={(event) => setEditForm((current) => ({ ...current, projectId: event.target.value }))} required value={editForm.projectId}>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Assignee</span>
                <select className={fieldClass} onChange={(event) => setEditForm((current) => ({ ...current, assignedToId: event.target.value }))} value={editForm.assignedToId}>
                  <option value="">Unassigned</option>
                  {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Status</span>
                <select className={fieldClass} onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value }))} value={editForm.status}>
                  {TASK_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Priority</span>
                <select className={fieldClass} onChange={(event) => setEditForm((current) => ({ ...current, priority: event.target.value }))} value={editForm.priority}>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Delivery risk</span>
                <select className={fieldClass} onChange={(event) => setEditForm((current) => ({ ...current, riskLevel: event.target.value }))} value={editForm.riskLevel}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Category</span>
                <input className={fieldClass} onChange={(event) => setEditForm((current) => ({ ...current, category: event.target.value }))} required value={editForm.category} />
              </label>
              {fieldVisible("deadline") && <label className="block">
                <span className="text-sm font-bold text-slate-700">Due date</span>
                <input className={fieldClass} onChange={(event) => setEditForm((current) => ({ ...current, deadline: event.target.value }))} required={fieldRequired("deadline")} type="date" value={editForm.deadline} />
              </label>}
              {fieldVisible("estimatedHours") && <label className="block">
                <span className="text-sm font-bold text-slate-700">Estimated effort (hours)</span>
                <input className={fieldClass} min="0" onChange={(event) => setEditForm((current) => ({ ...current, estimatedHours: event.target.value }))} required={fieldRequired("estimatedHours")} step="0.25" type="number" value={editForm.estimatedHours} />
              </label>}
              <label className="block lg:col-span-2">
                <span className="text-sm font-bold text-slate-700">Required skills</span>
                <input className={fieldClass} maxLength="1200" onChange={(event) => setEditForm((current) => ({ ...current, requiredSkills: event.target.value }))} placeholder="React, QA, PostgreSQL" value={editForm.requiredSkills} />
              </label>
              <fieldset className="lg:col-span-2 xl:col-span-3">
                <legend className="text-sm font-bold text-slate-700">Prerequisite tasks</legend>
                <div className="mt-2 grid max-h-48 gap-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-2">
                  {availableTasks.length ? availableTasks.map((candidate) => <label className="flex cursor-pointer items-start gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200" key={candidate.id}><input checked={editForm.dependencyIds.includes(candidate.id)} className="mt-0.5 h-4 w-4 accent-emerald-700" onChange={(event) => setEditForm((current) => ({ ...current, dependencyIds: event.target.checked ? [...current.dependencyIds, candidate.id] : current.dependencyIds.filter((id) => id !== candidate.id) }))} type="checkbox" /><span className="min-w-0"><span className="block truncate text-xs font-bold text-slate-800">{candidate.title}</span><span className="block text-[11px] text-slate-400">{labelForValue(candidate.status)}</span></span></label>) : <p className="col-span-full py-3 text-center text-xs text-slate-400">No other project tasks are available.</p>}
                </div>
              </fieldset>
              <label className="block lg:col-span-2 xl:col-span-3">
                <span className="text-sm font-bold text-slate-700">Description</span>
                <textarea className={textareaClass} onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))} required rows="7" value={editForm.description} />
              </label>
              {fieldVisible("successCriteria") && <label className="block lg:col-span-2 xl:col-span-3">
                <span className="text-sm font-bold text-slate-700">Success criteria</span>
                <textarea className={textareaClass} onChange={(event) => setEditForm((current) => ({ ...current, successCriteria: event.target.value }))} required={fieldRequired("successCriteria")} rows="5" value={editForm.successCriteria} />
              </label>}
              <CustomFieldsForm
                embedded
                fields={moduleDefinition?.fields}
                members={employees}
                onChange={(customFields) => setEditForm((current) => ({ ...current, customFields }))}
                values={editForm.customFields}
              />
            </div>
          </form>
        ) : (
          <>
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="p-5 sm:p-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 max-w-4xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${TASK_STATUS_STYLES[task.status] || TASK_STATUS_STYLES.open}`}>
                        {labelForValue(task.status)}
                      </span>
                      <span className="text-xs font-bold text-slate-500">{labelForValue(task.priority)} priority</span>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${task.riskLevel === "critical" || task.riskLevel === "high" ? "border-rose-200 bg-rose-50 text-rose-700" : task.riskLevel === "medium" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{labelForValue(task.riskLevel)} risk</span>
                      {task.source === "ai_plan" && <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">Approved AI plan / {task.confidence || 0}% confidence</span>}
                      <span className="text-xs font-semibold text-slate-400">Updated {formatDateTime(task.updatedAt)}</span>
                    </div>
                    <h2 className={`mt-4 text-2xl font-bold sm:text-3xl ${isCompleted ? "text-slate-500 line-through decoration-slate-300" : "text-slate-950"}`}>
                      {task.title}
                    </h2>
                    <p className="mt-3 text-sm font-semibold text-slate-500">{task.projectName} / {task.category}</p>
                  </div>
                  <div className="w-full max-w-sm lg:border-l lg:border-slate-200 lg:pl-6">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-400">Delivery progress</p>
                        <p className="mt-1 text-3xl font-bold text-slate-950">{task.aiProgress || 0}%</p>
                      </div>
                      {isCompleted ? <FiCheckCircle className="h-7 w-7 text-emerald-500" /> : <FiClock className="h-6 w-6 text-emerald-700" />}
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${isCompleted ? "bg-emerald-500" : "bg-emerald-700"}`} style={{ width: `${task.aiProgress || 0}%` }} />
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      {task.aiSummary || `${task.totalLoggedHours.toFixed(2)} of ${task.estimatedHours || "unestimated"} hours logged.`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-px border-t border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  ["Assignee", task.assignedToName, FiUser],
                  ["Project", task.projectName, FiBriefcase],
                  ["Due date", formatDate(task.deadline, "Not set"), FiCalendar],
                  ["Estimated", task.estimatedHours ? `${task.estimatedHours}h` : "Not set", FiFlag],
                  ["Logged", `${task.totalLoggedHours.toFixed(2)}h`, FiClock],
                ].map(([label, value, icon]) => (
                  <div className="min-w-0 bg-slate-50 px-4 py-3" key={label}>
                    <p className="flex items-center gap-2 text-[11px] font-bold uppercase text-slate-400">
                      {createElement(icon, { className: "h-3.5 w-3.5" })}
                      {label}
                    </p>
                    <p className="mt-1 truncate text-sm font-bold text-slate-800">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-5">
                <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="text-base font-bold text-slate-950">Work definition</h2>
                    <p className="mt-1 text-sm text-slate-500">Scope and acceptance criteria for this assignment.</p>
                  </div>
                  <div className="grid gap-6 p-5 lg:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">Description</p>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{task.description}</p>
                    </div>
                    <div className="border-t border-slate-200 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                      <p className="text-xs font-bold uppercase text-slate-400">Success criteria</p>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{task.successCriteria || "No acceptance criteria have been defined."}</p>
                    </div>
                  </div>
                </section>

                <CustomFieldsForm
                  disabled
                  fields={moduleDefinition?.fields}
                  onChange={() => {}}
                  title="Additional information"
                  values={task.customFields || {}}
                />

                {task.dependencies?.length > 0 && <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700"><FiGitBranch /></span><div><h2 className="text-base font-bold text-slate-950">Dependencies</h2><p className="text-sm text-slate-500">Prerequisites that must finish before this task can be completed.</p></div></div><div className="divide-y divide-slate-100">{task.dependencies.map((dependency) => <Link className="flex items-center justify-between gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-emerald-800" key={dependency.id} to={`/tasks/${dependency.id}`}><span>{dependency.title}</span><span className={`rounded-full border px-2.5 py-1 text-xs ${TASK_STATUS_STYLES[dependency.status] || TASK_STATUS_STYLES.open}`}>{labelForValue(dependency.status)}</span></Link>)}</div></section>}

                <TaskCollaborationPanel canContribute={canUpdateWork} currentUserId={user?.id} members={employees} task={task} />

                <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="text-base font-bold text-slate-950">Activity timeline</h2>
                    <p className="mt-1 text-sm text-slate-500">Status, ownership, scope, and work-log changes in one record.</p>
                  </div>
                  <WorkActivityTimeline activity={activity} emptyMessage="No task activity has been recorded yet." />
                </section>
              </div>

              <aside className="space-y-5 xl:sticky xl:top-28">
                {canUpdateWork && (
                  <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-bold text-slate-950">Workflow</h2>
                    <label className="mt-4 block">
                      <span className="text-xs font-bold uppercase text-slate-400">Current status</span>
                      <select className={fieldClass} disabled={busy} onChange={(event) => changeStatus(event.target.value)} value={task.status}>
                        {TASK_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                  </section>
                )}

                {canLogWork && (
                  <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-5 py-4">
                      <h2 className="text-sm font-bold text-slate-950">Log work</h2>
                      <p className="mt-1 text-xs leading-5 text-slate-500">Record effort and a delivery note.</p>
                    </div>
                    <form className="space-y-4 p-5" onSubmit={handleTimeLog}>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                          <span className="text-xs font-bold text-slate-500">Hours</span>
                          <input className={fieldClass} min="0.25" onChange={(event) => setTimeForm((current) => ({ ...current, hours: event.target.value }))} required step="0.25" type="number" value={timeForm.hours} />
                        </label>
                        <label className="block">
                          <span className="text-xs font-bold text-slate-500">Work date</span>
                          <input className={fieldClass} onChange={(event) => setTimeForm((current) => ({ ...current, loggedAt: event.target.value }))} type="date" value={timeForm.loggedAt} />
                        </label>
                      </div>
                      <label className="block">
                        <span className="text-xs font-bold text-slate-500">Update note</span>
                        <textarea className={textareaClass} onChange={(event) => setTimeForm((current) => ({ ...current, note: event.target.value }))} placeholder="What changed, and what remains?" rows="4" value={timeForm.note} />
                      </label>
                      <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:bg-slate-300" disabled={busy} type="submit">
                        <FiClock className="h-4 w-4" />
                        Add work log
                      </button>
                    </form>
                  </section>
                )}

                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-bold text-slate-950">Task information</h2>
                  <dl className="mt-4 divide-y divide-slate-100">
                    <div className="py-3">
                      <dt className="text-xs font-bold text-slate-400">Assignee</dt>
                      <dd className="mt-2 flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-100 text-[10px] font-bold text-teal-900">{initialsFor(task.assignedToName)}</span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-slate-800">{task.assignedToName}</span>
                          <span className="block truncate text-xs text-slate-500">{task.assignedToEmail || "Awaiting assignment"}</span>
                        </span>
                      </dd>
                    </div>
                    <div className="grid grid-cols-2 gap-3 py-3">
                      <div>
                        <dt className="text-xs font-bold text-slate-400">Created by</dt>
                        <dd className="mt-1 text-sm font-semibold text-slate-700">{task.createdByName}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-bold text-slate-400">Created</dt>
                        <dd className="mt-1 text-sm font-semibold text-slate-700">{formatDate(task.createdAt)}</dd>
                      </div>
                    </div>
                    <div className="py-3">
                      <dt className="text-xs font-bold text-slate-400">Effort used</dt>
                      <dd className="mt-2">
                        <div className="flex justify-between text-xs font-bold text-slate-600">
                          <span>{task.totalLoggedHours.toFixed(2)}h logged</span>
                          <span>{effortProgress}%</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-teal-600" style={{ width: `${effortProgress}%` }} />
                        </div>
                      </dd>
                    </div>
                    {task.completedAt && (
                      <div className="py-3">
                        <dt className="text-xs font-bold text-slate-400">Completed</dt>
                        <dd className="mt-1 text-sm font-semibold text-emerald-700">{formatDateTime(task.completedAt)}</dd>
                      </div>
                    )}
                  </dl>
                </section>
              </aside>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
};

export default TaskDetailPage;
