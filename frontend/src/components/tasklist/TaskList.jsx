import { useMemo, useState } from "react";
import { FiBriefcase, FiCalendar, FiCheckCircle, FiClock, FiRotateCcw } from "react-icons/fi";
import Alert from "../Alert";
import { api, formatApiError } from "../../context/api";

const formatDate = (date) => {
  if (!date) return "No deadline";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

const statusStyles = {
  active: "bg-cyan-100 text-cyan-800",
  completed: "bg-emerald-100 text-emerald-800",
  in_progress: "bg-indigo-100 text-indigo-800",
  open: "bg-amber-100 text-amber-800",
  pending: "bg-slate-100 text-slate-700",
};

const TaskList = ({ error = "", loading = false, onTasksChanged = async () => {}, tasks = [] }) => {
  const [localError, setLocalError] = useState("");
  const [localNotice, setLocalNotice] = useState({ message: "", type: "info" });
  const [activeFilter, setActiveFilter] = useState("active");
  const [loggingId, setLoggingId] = useState("");
  const [timeLogForms, setTimeLogForms] = useState({});
  const [updatingId, setUpdatingId] = useState("");

  const filteredTasks = useMemo(() => {
    if (activeFilter === "completed") return tasks.filter((task) => task.status === "completed");
    if (activeFilter === "all") return tasks;
    return tasks.filter((task) => task.status !== "completed");
  }, [activeFilter, tasks]);

  const handleStatusChange = async (taskId, status) => {
    setUpdatingId(taskId);
    setLocalError("");
    setLocalNotice({ message: "", type: "info" });
    try {
      await api.updateTaskStatus(taskId, status);
      await onTasksChanged();
    } catch (error) {
      setLocalError(formatApiError(error));
    } finally {
      setUpdatingId("");
    }
  };

  const handleTimeLogChange = (taskId, field, value) => {
    setTimeLogForms((prev) => ({
      ...prev,
      [taskId]: {
        hours: "",
        note: "",
        ...(prev[taskId] || {}),
        [field]: value,
      },
    }));
  };

  const handleTimeLogSubmit = async (event, taskId) => {
    event.preventDefault();
    const form = timeLogForms[taskId] || {};

    setLoggingId(taskId);
    setLocalError("");
    setLocalNotice({ message: "", type: "info" });

    try {
      await api.createTimeLog(taskId, {
        hours: form.hours,
        note: form.note,
      });
      setTimeLogForms((prev) => ({
        ...prev,
        [taskId]: { hours: "", note: "" },
      }));
      setLocalNotice({ message: "Hours logged successfully.", type: "success" });
      await onTasksChanged();
    } catch (error) {
      setLocalError(formatApiError(error));
    } finally {
      setLoggingId("");
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500" />
        <p className="mt-4 text-sm font-semibold text-slate-500">Loading your assignments...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Assigned tasks</h2>
          <p className="mt-1 text-sm text-slate-500">Only tasks assigned to your account appear here.</p>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          {[
            ["active", "Active"],
            ["completed", "Completed"],
            ["all", "All"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveFilter(value)}
              className={`rounded-md px-3 py-2 text-sm font-bold transition ${
                activeFilter === value ? "bg-violet-600 text-white shadow-sm shadow-violet-200" : "text-slate-500 hover:text-slate-950"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Alert
        message={localError || error || localNotice.message}
        type={localError || error ? "error" : localNotice.type}
      />

      {filteredTasks.length === 0 ? (
        <div className="py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <FiCheckCircle className="h-7 w-7" />
          </div>
          <h3 className="mt-5 text-lg font-bold text-slate-950">No tasks in this view</h3>
          <p className="mt-2 text-sm text-slate-500">When work is assigned to you, it will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredTasks.map((task) => (
            <article
              key={task.id}
              className="rounded-lg border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    statusStyles[task.status] || statusStyles.pending
                  }`}
                >
                  {task.status || "pending"}
                </span>
                <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
                  <FiCalendar className="h-4 w-4" />
                  {formatDate(task.deadline)}
                </span>
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-950">{task.title}</h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
                {task.description || "No description provided."}
              </p>
              {task.successCriteria && (
                <p className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-600">
                  <span className="font-bold text-slate-800">Success: </span>
                  {task.successCriteria}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                  <FiBriefcase className="h-4 w-4" />
                  {task.projectName}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                  {task.category}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                  {task.priority || "normal"} priority
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                  {(task.totalLoggedHours || 0).toFixed(1)}h logged
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                  {task.estimatedHours ? `${task.estimatedHours}h estimate` : "No estimate"}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                  {Number(task.projectWeight || 0).toFixed(1)}% project weight
                </span>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
                  <span>Task progress</span>
                  <span>{task.aiProgress || 0}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all duration-500"
                    style={{ width: `${task.aiProgress || 0}%` }}
                  />
                </div>
                {task.aiSummary && <p className="mt-2 text-xs leading-5 text-slate-500">{task.aiSummary}</p>}
              </div>

              <form className="mt-5 space-y-3" onSubmit={(event) => handleTimeLogSubmit(event, task.id)}>
                <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                  <label className="block">
                    <span className="text-xs font-bold uppercase text-slate-500">Hours</span>
                    <input
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-950 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                      min="0.25"
                      onChange={(event) => handleTimeLogChange(task.id, "hours", event.target.value)}
                      placeholder="1.5"
                      required
                      step="0.25"
                      type="number"
                      value={(timeLogForms[task.id] || {}).hours || ""}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase text-slate-500">Work note</span>
                    <input
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                      onChange={(event) => handleTimeLogChange(task.id, "note", event.target.value)}
                      placeholder="What moved forward?"
                      type="text"
                      value={(timeLogForms[task.id] || {}).note || ""}
                    />
                  </label>
                </div>
                <button
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loggingId === task.id}
                  type="submit"
                >
                  <FiClock className="h-4 w-4" />
                  {loggingId === task.id ? "Logging hours..." : "Log hours"}
                </button>
              </form>

              <div className="mt-5">
                {task.status === "completed" ? (
                  <button
                    onClick={() => handleStatusChange(task.id, "open")}
                    disabled={updatingId === task.id}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FiRotateCcw className="h-4 w-4" />
                    Reopen task
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange(task.id, "completed")}
                    disabled={updatingId === task.id}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <FiClock className="h-4 w-4" />
                    {updatingId === task.id ? "Updating..." : "Mark complete"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;
