import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiArchive,
  FiArrowLeft,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiEdit2,
  FiPlus,
  FiSave,
  FiSearch,
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
  labelForValue,
  PROJECT_HEALTH_STYLES,
  PROJECT_STATUS_OPTIONS,
  PROJECT_STATUS_STYLES,
  TASK_STATUS_OPTIONS,
  TASK_STATUS_STYLES,
} from "./workUtils";

const fieldClass =
  "mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-950 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100";

const projectToForm = (project) => ({
  description: project.description || "",
  dueDate: project.dueDate || "",
  name: project.name || "",
  startDate: project.startDate || "",
  status: project.status || "active",
});

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [taskSearch, setTaskSearch] = useState("");
  const [taskStatus, setTaskStatus] = useState("all");
  const [notice, setNotice] = useState(
    location.state?.notice ? { message: location.state.notice, type: "success" } : { message: "", type: "info" }
  );
  const canManageWork = Boolean(user?.permissions?.canManageWork);

  const loadProject = useCallback(async ({ showLoading = false } = {}) => {
    if (showLoading) setLoading(true);
    try {
      const { project: projectDetail } = await api.getProject(projectId);
      setProject(projectDetail);
      setEditForm(projectToForm(projectDetail));
      setNotice((current) => (current.type === "error" ? { message: "", type: "info" } : current));
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject({ showLoading: true });
  }, [loadProject]);

  const filteredTasks = useMemo(() => {
    if (!project) return [];
    const query = taskSearch.trim().toLowerCase();
    return project.tasks.filter((task) => {
      if (taskStatus !== "all" && task.status !== taskStatus) return false;
      if (!query) return true;
      return [task.title, task.category, task.assignedToName, task.description].join(" ").toLowerCase().includes(query);
    });
  }, [project, taskSearch, taskStatus]);

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setBusy(true);
    setNotice({ message: "", type: "info" });
    try {
      await api.updateProject(project.id, editForm);
      await loadProject();
      setEditing(false);
      setNotice({ message: "Project details updated.", type: "success" });
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const handleStatusChange = async (status) => {
    if (status === project.status) return;
    setBusy(true);
    setNotice({ message: "", type: "info" });
    try {
      await api.updateProject(project.id, { status });
      await loadProject();
      setNotice({ message: `Project moved to ${labelForValue(status)}.`, type: "success" });
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    const message = project.taskCount
      ? `Archive "${project.name}"? Its ${project.taskCount} tasks will remain available.`
      : `Delete "${project.name}"?`;
    if (!window.confirm(message)) return;

    setBusy(true);
    try {
      const result = await api.deleteProject(project.id);
      if (result?.archived) {
        await loadProject();
        setNotice({ message: "Project archived. Existing tasks were preserved.", type: "success" });
        setBusy(false);
        return;
      }
      navigate("/projects", { replace: true });
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
      setBusy(false);
    }
  };

  if (loading) {
    return <AppShell title="Project detail" subtitle="Loading portfolio information."><div className="py-24 text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-violet-600" /><p className="mt-4 text-sm font-semibold text-slate-500">Loading project...</p></div></AppShell>;
  }

  if (!project) {
    return <AppShell title="Project detail"><div className="rounded-lg border border-slate-200 bg-white p-10 text-center"><Alert message={notice.message || "Project not found."} type="error" /><Link className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-violet-700" to="/projects"><FiArrowLeft className="h-4 w-4" />Back to projects</Link></div></AppShell>;
  }

  return (
    <AppShell title="Project detail" subtitle="Review scope, delivery health, progress, and every task in this work stream.">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <Link className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-violet-700" to="/projects"><FiArrowLeft className="h-4 w-4" />Back to projects</Link>
          {canManageWork && <div className="flex flex-wrap gap-2"><Link className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-600 px-3 text-sm font-bold text-white transition hover:bg-violet-700" to={`/tasks/new?project=${project.id}`}><FiPlus className="h-4 w-4" />Add task</Link><button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50" onClick={() => setEditing((current) => !current)} type="button">{editing ? <FiX className="h-4 w-4" /> : <FiEdit2 className="h-4 w-4" />}{editing ? "Cancel edit" : "Edit project"}</button><button aria-label={project.taskCount ? "Archive project" : "Delete project"} className="flex h-10 w-10 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100" disabled={busy} onClick={handleDelete} title={project.taskCount ? "Archive project" : "Delete project"} type="button">{project.taskCount ? <FiArchive className="h-4 w-4" /> : <FiTrash2 className="h-4 w-4" />}</button></div>}
        </div>

        <Alert message={notice.message} type={notice.type} />

        {editing ? (
          <form className="rounded-lg border border-slate-200 bg-white shadow-sm" onSubmit={handleSave}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h2 className="text-base font-bold text-slate-950">Edit project</h2><p className="mt-1 text-sm text-slate-500">Update scope, schedule, or lifecycle.</p></div><button className="inline-flex h-10 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-bold text-white disabled:bg-slate-300" disabled={busy} type="submit"><FiSave className="h-4 w-4" />{busy ? "Saving..." : "Save changes"}</button></div>
            <div className="grid gap-5 p-5 lg:grid-cols-2 xl:grid-cols-4">
              <label className="block lg:col-span-2"><span className="text-sm font-bold text-slate-700">Project name</span><input className={fieldClass} name="name" onChange={handleEditChange} required value={editForm.name} /></label>
              <label className="block"><span className="text-sm font-bold text-slate-700">Status</span><select className={fieldClass} name="status" onChange={handleEditChange} value={editForm.status}>{PROJECT_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
              <div />
              <label className="block"><span className="text-sm font-bold text-slate-700">Start date</span><input className={fieldClass} name="startDate" onChange={handleEditChange} type="date" value={editForm.startDate} /></label>
              <label className="block"><span className="text-sm font-bold text-slate-700">Due date</span><input className={fieldClass} min={editForm.startDate || undefined} name="dueDate" onChange={handleEditChange} type="date" value={editForm.dueDate} /></label>
              <label className="block lg:col-span-2 xl:col-span-4"><span className="text-sm font-bold text-slate-700">Purpose and scope</span><textarea className="mt-2 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm leading-6 text-slate-950 outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100" name="description" onChange={handleEditChange} rows="7" value={editForm.description} /></label>
            </div>
          </form>
        ) : (
          <>
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="p-5 sm:p-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 max-w-4xl">
                    <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${PROJECT_STATUS_STYLES[project.status] || PROJECT_STATUS_STYLES.active}`}>{labelForValue(project.status)}</span><span className={`text-xs font-bold ${PROJECT_HEALTH_STYLES[project.health] || "text-slate-600"}`}>{labelForValue(project.health)}</span></div>
                    <h2 className="mt-4 text-2xl font-bold text-slate-950 sm:text-3xl">{project.name}</h2>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{project.description || "No project description has been added."}</p>
                  </div>
                  <div className="min-w-64 lg:border-l lg:border-slate-200 lg:pl-6"><div className="flex items-end justify-between"><div><p className="text-xs font-bold text-slate-500">Overall progress</p><p className="mt-1 text-3xl font-bold text-slate-950">{project.progress}%</p></div><FiActivity className="h-5 w-5 text-violet-600" /></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-violet-600" style={{ width: `${project.progress}%` }} /></div><p className="mt-3 text-xs font-semibold text-slate-500">{project.completedTaskCount} of {project.taskCount} tasks complete</p></div>
                </div>
              </div>
              {canManageWork && <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6"><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><span className="text-xs font-bold text-slate-500">Project status</span><div className="flex flex-wrap gap-2">{PROJECT_STATUS_OPTIONS.map((option) => <button className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${project.status === option.value ? `${PROJECT_STATUS_STYLES[option.value]} ring-2 ring-offset-1` : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-700"}`} disabled={busy || project.status === option.value} key={option.value} onClick={() => handleStatusChange(option.value)} type="button">{option.label}</button>)}</div></div></div>}
            </section>

            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 lg:grid-cols-4">
              {[["Tasks", project.taskCount, FiBriefcase], ["Completed", project.completedTaskCount, FiCheckCircle], ["Logged hours", project.totalLoggedHours.toFixed(1), FiClock], ["Due date", formatDate(project.dueDate, "Not set"), FiCalendar]].map(([label, value, Icon]) => <div className="flex min-h-20 items-center gap-3 bg-white px-4 py-3" key={label}>{createElement(Icon, { className: "h-5 w-5 shrink-0 text-violet-600" })}<div><p className="text-xl font-bold text-slate-950">{value}</p><p className="text-xs font-semibold text-slate-500">{label}</p></div></div>)}
            </div>

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
              <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-base font-bold text-slate-950">Project tasks</h2><p className="mt-1 text-sm text-slate-500">{filteredTasks.length} tasks in this view</p></div><div className="flex flex-col gap-2 sm:flex-row"><label className="flex h-10 min-w-64 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-violet-400 focus-within:bg-white"><FiSearch className="h-4 w-4 text-slate-400" /><input className="w-full bg-transparent text-sm outline-none" onChange={(event) => setTaskSearch(event.target.value)} placeholder="Search tasks" value={taskSearch} /></label><select className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none" onChange={(event) => setTaskStatus(event.target.value)} value={taskStatus}><option value="all">All statuses</option>{TASK_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div></div>
                {filteredTasks.length === 0 ? <div className="py-14 text-center"><FiBriefcase className="mx-auto h-8 w-8 text-slate-400" /><p className="mt-3 text-sm font-semibold text-slate-500">No tasks match this view.</p>{canManageWork && project.taskCount === 0 && <Link className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-violet-700" to={`/tasks/new?project=${project.id}`}><FiPlus className="h-4 w-4" />Create the first task</Link>}</div> : <div className="divide-y divide-slate-100">{filteredTasks.map((task) => <Link className="group block px-4 py-4 transition hover:bg-violet-50/40" key={task.id} to={`/tasks/${task.id}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${TASK_STATUS_STYLES[task.status] || TASK_STATUS_STYLES.open}`}>{labelForValue(task.status)}</span><span className="text-xs font-semibold text-slate-500">{task.category}</span></div><h3 className="mt-2 text-sm font-bold text-slate-950 group-hover:text-violet-700">{task.title}</h3><p className="mt-1 text-xs text-slate-500">{task.assignedToName} / Due {formatDate(task.deadline, "not set")}</p></div><div className="min-w-32"><div className="flex items-center justify-between text-xs font-bold text-slate-500"><span>Progress</span><span>{task.aiProgress || 0}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-600" style={{ width: `${task.aiProgress || 0}%` }} /></div></div></div></Link>)}</div>}
              </section>

              <aside className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-base font-bold text-slate-950">Project information</h2></div>
                <dl className="divide-y divide-slate-100 px-5">
                  <div className="py-4"><dt className="flex items-center gap-2 text-xs font-bold text-slate-500"><FiUser className="h-4 w-4" />Owner</dt><dd className="mt-2 flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-[10px] font-bold text-cyan-800">{initialsFor(project.createdByName)}</span><span className="text-sm font-bold text-slate-900">{project.createdByName}</span></dd></div>
                  <div className="grid grid-cols-2 gap-3 py-4"><div><dt className="text-xs font-bold text-slate-500">Starts</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{formatDate(project.startDate)}</dd></div><div><dt className="text-xs font-bold text-slate-500">Due</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{formatDate(project.dueDate)}</dd></div></div>
                  <div className="py-4"><dt className="text-xs font-bold text-slate-500">Health</dt><dd className={`mt-1 text-sm font-bold ${PROJECT_HEALTH_STYLES[project.health] || "text-slate-700"}`}>{labelForValue(project.health)}</dd></div>
                  <div className="py-4"><dt className="text-xs font-bold text-slate-500">Created</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{formatDateTime(project.createdAt)}</dd></div>
                  {project.aiSummary && <div className="py-4"><dt className="text-xs font-bold text-slate-500">AI project insight</dt><dd className="mt-2 text-xs leading-5 text-slate-500">{project.aiSummary}</dd></div>}
                </dl>
              </aside>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
};

export default ProjectDetailPage;
