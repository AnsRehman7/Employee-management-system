import { useCallback, useEffect, useState } from "react";
import {
  FiActivity,
  FiArrowLeft,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiEdit2,
  FiFlag,
  FiSave,
  FiTrash2,
  FiUser,
  FiX,
} from "react-icons/fi";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Alert from "../../Alert";
import AppShell from "../../AppShell";
import { api, formatApiError } from "../../../context/api";
import { useUser } from "../../../context/UserContext";
import {
  formatDate,
  formatDateTime,
  initialsFor,
  isOverdue,
  labelForValue,
  TASK_STATUS_OPTIONS,
  TASK_STATUS_STYLES,
} from "./workUtils";

const fieldClass =
  "mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-950 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100";
const textareaClass =
  "mt-2 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm leading-6 text-slate-950 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100";

const taskToForm = (task) => ({
  assignedToId: task.assignedToId || "",
  category: task.category || "",
  deadline: task.deadline || "",
  description: task.description || "",
  estimatedHours: task.estimatedHours ?? "",
  priority: task.priority || "normal",
  projectId: task.projectId || "",
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
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [timeForm, setTimeForm] = useState({ hours: "", loggedAt: "", note: "" });
  const [notice, setNotice] = useState(
    location.state?.notice ? { message: location.state.notice, type: "success" } : { message: "", type: "info" }
  );

  const canDeleteTasks = Boolean(user?.permissions?.canDeleteTasks);
  const canEditTasks = Boolean(user?.permissions?.canEditTasks);
  const canUpdateWork = canEditTasks || task?.assignedToId === user?.id;
  const canLogWork = Boolean(task?.assignedToId) && canUpdateWork;

  const loadTask = useCallback(async ({ showLoading = false } = {}) => {
    if (showLoading) setLoading(true);
    try {
      const { task: taskDetail } = await api.getTask(taskId);
      setTask(taskDetail);
      setEditForm(taskToForm(taskDetail));
      setNotice((current) => (current.type === "error" ? { message: "", type: "info" } : current));
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    loadTask({ showLoading: true });
  }, [loadTask]);

  useEffect(() => {
    if (!canEditTasks) return undefined;
    let active = true;

    Promise.all([api.getEmployees(), api.getProjects()])
      .then(([{ employees: employeeList }, { projects: projectList }]) => {
        if (!active) return;
        setEmployees(employeeList);
        setProjects(projectList.filter((project) => project.status !== "archived"));
      })
      .catch((requestError) => {
        if (active) setNotice({ message: formatApiError(requestError), type: "error" });
      });

    return () => {
      active = false;
    };
  }, [canEditTasks]);

  const handleStatusChange = async (status) => {
    if (!task || status === task.status) return;
    setBusy(true);
    setNotice({ message: "", type: "info" });
    try {
      const { task: updatedTask } = await api.updateTaskStatus(task.id, status);
      setTask(updatedTask);
      setEditForm(taskToForm(updatedTask));
      setNotice({ message: `Task moved to ${labelForValue(status)}.`, type: "success" });
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setBusy(true);
    setNotice({ message: "", type: "info" });
    try {
      const { task: updatedTask } = await api.updateTask(task.id, editForm);
      setTask(updatedTask);
      setEditForm(taskToForm(updatedTask));
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
        <div className="py-24 text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-violet-600" /><p className="mt-4 text-sm font-semibold text-slate-500">Loading task...</p></div>
      </AppShell>
    );
  }

  if (!task) {
    return (
      <AppShell title="Task detail">
        <div className="rounded-lg border border-slate-200 bg-white p-10 text-center"><Alert message={notice.message || "Task not found."} type="error" /><Link className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-violet-700" to="/tasks"><FiArrowLeft className="h-4 w-4" />Back to tasks</Link></div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Task detail" subtitle="Review ownership, delivery requirements, progress, and work history.">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <Link className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-violet-700" to="/tasks"><FiArrowLeft className="h-4 w-4" />Back to tasks</Link>
          {(canEditTasks || canDeleteTasks) && (
            <div className="flex gap-2">
              {canEditTasks && <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50" onClick={() => setEditing((current) => !current)} type="button">{editing ? <FiX className="h-4 w-4" /> : <FiEdit2 className="h-4 w-4" />}{editing ? "Cancel edit" : "Edit task"}</button>}
              {canDeleteTasks && <button aria-label="Delete task" className="flex h-10 w-10 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100" disabled={busy} onClick={handleDelete} title="Delete task" type="button"><FiTrash2 className="h-4 w-4" /></button>}
            </div>
          )}
        </div>

        <Alert message={notice.message} type={notice.type} />

        {editing && canEditTasks ? (
          <form className="rounded-lg border border-slate-200 bg-white shadow-sm" onSubmit={handleSave}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h2 className="text-base font-bold text-slate-950">Edit task</h2><p className="mt-1 text-sm text-slate-500">Update the assignment without losing its activity history.</p></div><button className="inline-flex h-10 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-bold text-white disabled:bg-slate-300" disabled={busy} type="submit"><FiSave className="h-4 w-4" />{busy ? "Saving..." : "Save changes"}</button></div>
            <div className="grid gap-5 p-5 lg:grid-cols-2 xl:grid-cols-3">
              <label className="block xl:col-span-2"><span className="text-sm font-bold text-slate-700">Task title</span><input className={fieldClass} name="title" onChange={handleEditChange} required value={editForm.title} /></label>
              <label className="block"><span className="text-sm font-bold text-slate-700">Project</span><select className={fieldClass} name="projectId" onChange={handleEditChange} required value={editForm.projectId}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
              <label className="block"><span className="text-sm font-bold text-slate-700">Assigned to</span><select className={fieldClass} name="assignedToId" onChange={handleEditChange} value={editForm.assignedToId}><option value="">Unassigned</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></label>
              <label className="block"><span className="text-sm font-bold text-slate-700">Category</span><input className={fieldClass} name="category" onChange={handleEditChange} required value={editForm.category} /></label>
              <label className="block"><span className="text-sm font-bold text-slate-700">Status</span><select className={fieldClass} name="status" onChange={handleEditChange} value={editForm.status}>{TASK_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
              <label className="block"><span className="text-sm font-bold text-slate-700">Priority</span><select className={fieldClass} name="priority" onChange={handleEditChange} value={editForm.priority}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></label>
              <label className="block"><span className="text-sm font-bold text-slate-700">Due date</span><input className={fieldClass} name="deadline" onChange={handleEditChange} type="date" value={editForm.deadline} /></label>
              <label className="block"><span className="text-sm font-bold text-slate-700">Estimate (hours)</span><input className={fieldClass} min="0" name="estimatedHours" onChange={handleEditChange} step="0.25" type="number" value={editForm.estimatedHours} /></label>
              <label className="block lg:col-span-2 xl:col-span-3"><span className="text-sm font-bold text-slate-700">Description</span><textarea className={textareaClass} name="description" onChange={handleEditChange} required rows="5" value={editForm.description} /></label>
              <label className="block lg:col-span-2 xl:col-span-3"><span className="text-sm font-bold text-slate-700">Success criteria</span><textarea className={textareaClass} name="successCriteria" onChange={handleEditChange} rows="4" value={editForm.successCriteria} /></label>
            </div>
          </form>
        ) : (
          <>
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="p-5 sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 max-w-4xl">
                    <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${TASK_STATUS_STYLES[task.status] || TASK_STATUS_STYLES.open}`}>{labelForValue(task.status)}</span><span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">{labelForValue(task.priority)} priority</span><span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">{task.category}</span></div>
                    <h2 className="mt-4 text-2xl font-bold text-slate-950 sm:text-3xl">{task.title}</h2>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{task.description}</p>
                  </div>
                  <div className="grid min-w-64 grid-cols-2 lg:border-l lg:border-slate-200 lg:pl-6">
                    <div className="pr-4"><p className="text-xs font-bold text-slate-500">Progress</p><p className="mt-1 text-2xl font-bold text-slate-950">{task.aiProgress || 0}%</p></div>
                    <div className="border-l border-slate-200 pl-4"><p className="text-xs font-bold text-slate-500">Logged</p><p className="mt-1 text-2xl font-bold text-slate-950">{(task.totalLoggedHours || 0).toFixed(1)}h</p></div>
                  </div>
                </div>
              </div>

              {canUpdateWork && (
                <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center"><span className="text-xs font-bold text-slate-500">Move task</span><div className="flex flex-wrap gap-2">{TASK_STATUS_OPTIONS.map((option) => <button className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${task.status === option.value ? `${TASK_STATUS_STYLES[option.value]} ring-2 ring-offset-1` : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-700"}`} disabled={busy || task.status === option.value} key={option.value} onClick={() => handleStatusChange(option.value)} type="button">{option.label}</button>)}</div></div>
                </div>
              )}
            </section>

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-5">
                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-base font-bold text-slate-950">Delivery definition</h2>
                  <div className="mt-4 border-l-2 border-emerald-400 pl-4"><p className="text-xs font-bold text-emerald-700">Success criteria</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{task.successCriteria || "No success criteria were added."}</p></div>
                  <div className="mt-6"><div className="flex items-center justify-between text-xs font-bold text-slate-500"><span>Analyzed progress</span><span>{task.aiProgress || 0}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-600" style={{ width: `${task.aiProgress || 0}%` }} /></div>{task.aiSummary && <p className="mt-3 text-xs leading-5 text-slate-500">{task.aiSummary}</p>}</div>
                </section>

                {canLogWork && (
                  <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-base font-bold text-slate-950">Log work</h2><p className="mt-1 text-sm text-slate-500">Record time and a concise delivery update.</p></div>
                    <form className="grid gap-4 p-5 lg:grid-cols-[140px_180px_minmax(0,1fr)_auto] lg:items-end" onSubmit={handleTimeLog}>
                      <label className="block"><span className="text-xs font-bold text-slate-500">Hours</span><input className={fieldClass} min="0.25" onChange={(event) => setTimeForm((current) => ({ ...current, hours: event.target.value }))} required step="0.25" type="number" value={timeForm.hours} /></label>
                      <label className="block"><span className="text-xs font-bold text-slate-500">Work date</span><input className={fieldClass} onChange={(event) => setTimeForm((current) => ({ ...current, loggedAt: event.target.value }))} type="date" value={timeForm.loggedAt} /></label>
                      <label className="block"><span className="text-xs font-bold text-slate-500">Update</span><input className={fieldClass} onChange={(event) => setTimeForm((current) => ({ ...current, note: event.target.value }))} placeholder="What moved forward, and what remains?" value={timeForm.note} /></label>
                      <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:bg-slate-300" disabled={busy} type="submit"><FiClock className="h-4 w-4" />Log work</button>
                    </form>
                  </section>
                )}

                <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-base font-bold text-slate-950">Activity</h2><p className="mt-1 text-sm text-slate-500">Time entries and progress notes for this task.</p></div>
                  {task.timeLogs.length === 0 ? <div className="py-12 text-center"><FiActivity className="mx-auto h-7 w-7 text-slate-400" /><p className="mt-3 text-sm font-semibold text-slate-500">No work has been logged yet.</p></div> : <div className="divide-y divide-slate-100">{task.timeLogs.map((log) => <article className="flex gap-3 px-5 py-4" key={log.id}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-800">{initialsFor(log.userName)}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold text-slate-900">{log.userName} <span className="font-semibold text-slate-500">logged {log.hours.toFixed(2)}h</span></p><time className="text-xs font-semibold text-slate-400">{formatDateTime(log.loggedAt)}</time></div><p className="mt-1 text-sm leading-6 text-slate-600">{log.note || "No work note added."}</p>{log.analysisSummary && <p className="mt-2 text-xs leading-5 text-slate-400">Progress after entry: {log.aiProgressAfter ?? task.aiProgress}% / {log.analysisSummary}</p>}</div></article>)}</div>}
                </section>
              </div>

              <aside className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-base font-bold text-slate-950">Task information</h2></div>
                <dl className="divide-y divide-slate-100 px-5">
                  <div className="py-4"><dt className="flex items-center gap-2 text-xs font-bold text-slate-500"><FiUser className="h-4 w-4" />Assigned to</dt><dd className="mt-2 flex items-center gap-2"><span className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold ${task.assignedToId ? "bg-cyan-100 text-cyan-800" : "bg-slate-100 text-slate-600"}`}>{initialsFor(task.assignedToName)}</span><div><p className="text-sm font-bold text-slate-900">{task.assignedToName}</p><p className="text-xs text-slate-500">{task.assignedToEmail || "Awaiting assignment"}</p></div></dd></div>
                  <div className="py-4"><dt className="text-xs font-bold text-slate-500">Assigned by</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{task.createdByName}</dd></div>
                  <div className="py-4"><dt className="flex items-center gap-2 text-xs font-bold text-slate-500"><FiBriefcase className="h-4 w-4" />Project</dt><dd className="mt-1"><Link className="text-sm font-bold text-violet-700 hover:text-violet-900" to={`/projects/${task.projectId}`}>{task.projectName}</Link></dd></div>
                  <div className="py-4"><dt className="flex items-center gap-2 text-xs font-bold text-slate-500"><FiCalendar className="h-4 w-4" />Due date</dt><dd className={`mt-1 text-sm font-bold ${isOverdue(task.deadline, task.status) ? "text-rose-700" : "text-slate-800"}`}>{formatDate(task.deadline, "No due date")}</dd></div>
                  <div className="grid grid-cols-2 gap-3 py-4"><div><dt className="text-xs font-bold text-slate-500">Estimate</dt><dd className="mt-1 text-sm font-bold text-slate-800">{task.estimatedHours ? `${task.estimatedHours}h` : "Not set"}</dd></div><div><dt className="text-xs font-bold text-slate-500">Weight</dt><dd className="mt-1 text-sm font-bold text-slate-800">{Number(task.projectWeight || 0).toFixed(1)}%</dd></div></div>
                  <div className="py-4"><dt className="flex items-center gap-2 text-xs font-bold text-slate-500"><FiFlag className="h-4 w-4" />Created</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{formatDateTime(task.createdAt)}</dd></div>
                </dl>
              </aside>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
};

export default TaskDetailPage;
