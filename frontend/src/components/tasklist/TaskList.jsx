import { useMemo, useState } from "react";
import { FiCalendar, FiCheckCircle, FiClock, FiRotateCcw } from "react-icons/fi";
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
  completed: "bg-emerald-100 text-emerald-700",
  new: "bg-sky-100 text-sky-700",
  pending: "bg-amber-100 text-amber-700",
};

const TaskList = ({ error = "", loading = false, onTasksChanged = async () => {}, tasks = [] }) => {
  const [localError, setLocalError] = useState("");
  const [activeFilter, setActiveFilter] = useState("active");
  const [updatingId, setUpdatingId] = useState("");

  const filteredTasks = useMemo(() => {
    if (activeFilter === "completed") return tasks.filter((task) => task.status === "completed");
    if (activeFilter === "all") return tasks;
    return tasks.filter((task) => task.status !== "completed");
  }, [activeFilter, tasks]);

  const handleStatusChange = async (taskId, status) => {
    setUpdatingId(taskId);
    setLocalError("");
    try {
      await api.updateTaskStatus(taskId, status);
      await onTasksChanged();
    } catch (error) {
      setLocalError(formatApiError(error));
    } finally {
      setUpdatingId("");
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
        <p className="mt-4 text-sm font-semibold text-slate-500">Loading your assignments...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-950">Assigned tasks</h2>
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
                activeFilter === value ? "bg-slate-950 text-white shadow-sm" : "text-slate-500 hover:text-slate-950"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Alert message={localError || error} type="error" />

      {filteredTasks.length === 0 ? (
        <div className="py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <FiCheckCircle className="h-7 w-7" />
          </div>
          <h3 className="mt-5 text-lg font-black text-slate-950">No tasks in this view</h3>
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

              <h3 className="mt-4 text-lg font-black text-slate-950">{task.title}</h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
                {task.description || "No description provided."}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                  {task.category}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                  {task.priority || "normal"} priority
                </span>
              </div>

              <div className="mt-5">
                {task.status === "completed" ? (
                  <button
                    onClick={() => handleStatusChange(task.id, "new")}
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
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
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
