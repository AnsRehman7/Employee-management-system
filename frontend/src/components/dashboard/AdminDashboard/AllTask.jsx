import { useCallback, useEffect, useMemo, useState } from "react";
import { FiBriefcase, FiCalendar, FiCheckCircle, FiClock, FiRefreshCw, FiTrash2, FiUsers } from "react-icons/fi";
import Alert from "../../Alert";
import { api, formatApiError } from "../../../context/api";

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

const AllTask = ({ refreshKey = 0 }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [busyId, setBusyId] = useState("");

  const loadTasks = useCallback(async ({ showLoading = false } = {}) => {
    if (showLoading) setLoading(true);

    try {
      const { tasks: taskList } = await api.getTasks();
      setTasks(taskList);
      setError("");
    } catch (error) {
      setError(formatApiError(error));
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks({ showLoading: true });
  }, [loadTasks, refreshKey]);

  const filteredTasks = useMemo(() => {
    if (activeFilter === "completed") return tasks.filter((task) => task.status === "completed");
    if (activeFilter === "active") return tasks.filter((task) => task.status !== "completed");
    return tasks;
  }, [activeFilter, tasks]);

  const totals = useMemo(() => {
    const completed = tasks.filter((task) => task.status === "completed").length;
    return {
      active: tasks.length - completed,
      all: tasks.length,
      completed,
    };
  }, [tasks]);

  const handleDelete = async (taskId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this task?");
    if (!confirmDelete) return;

    setBusyId(taskId);
    setError("");
    try {
      await api.deleteTask(taskId);
      await loadTasks();
    } catch (error) {
      setError(formatApiError(error));
    } finally {
      setBusyId("");
    }
  };

  const handleStatusChange = async (taskId, status) => {
    setBusyId(taskId);
    setError("");

    try {
      await api.updateTaskStatus(taskId, status);
      await loadTasks();
    } catch (error) {
      setError(formatApiError(error));
    } finally {
      setBusyId("");
    }
  };

  if (loading) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
        <p className="mt-4 text-sm font-semibold text-slate-500">Loading task board...</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-slate-950 p-3 text-white">
            <FiUsers className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-2xl font-black text-slate-950">Task board</h2>
            <p className="mt-1 text-sm text-slate-500">
              {totals.all} total, {totals.active} active, {totals.completed} completed.
            </p>
          </div>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          {[
            ["all", "All"],
            ["active", "Active"],
            ["completed", "Completed"],
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

      <Alert message={error} type="error" />

      {filteredTasks.length === 0 ? (
        <div className="py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <FiCheckCircle className="h-7 w-7" />
          </div>
          <h3 className="mt-5 text-lg font-black text-slate-950">No tasks found</h3>
          <p className="mt-2 text-sm text-slate-500">Created tasks will appear in this board.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <article
              key={task.id}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white hover:shadow-md"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        statusStyles[task.status] || statusStyles.pending
                      }`}
                    >
                      {task.status || "pending"}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                      <FiCalendar className="h-4 w-4" />
                      {formatDate(task.deadline)}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                      {task.category}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                      <FiBriefcase className="h-4 w-4" />
                      {task.projectName}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-black text-slate-950">{task.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Assigned to {task.assignedToName}
                    {task.assignedToEmail ? ` (${task.assignedToEmail})` : ""}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {task.description || "No description provided."}
                  </p>
                  {task.successCriteria && (
                    <p className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-600">
                      <span className="font-bold text-slate-800">Success: </span>
                      {task.successCriteria}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                      <FiClock className="h-4 w-4" />
                      {(task.totalLoggedHours || 0).toFixed(1)}h logged
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                      {task.estimatedHours ? `${task.estimatedHours}h estimate` : "No estimate"}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
                  {task.status === "completed" ? (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(task.id, "new")}
                      disabled={busyId === task.id}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FiRefreshCw className="h-4 w-4" />
                      Reopen
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(task.id, "completed")}
                      disabled={busyId === task.id}
                      className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FiCheckCircle className="h-4 w-4" />
                      Complete
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(task.id)}
                    disabled={busyId === task.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FiTrash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default AllTask;
