import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiArchive,
  FiBarChart2,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiFlag,
  FiPlusCircle,
  FiRefreshCw,
} from "react-icons/fi";
import AppShell from "../../AppShell";
import Alert from "../../Alert";
import { api, formatApiError } from "../../../context/api";
import { useUser } from "../../../context/UserContext";

const initialForm = {
  description: "",
  dueDate: "",
  name: "",
  startDate: "",
};

const formatDate = (date) => {
  if (!date) return "Not set";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

const healthStyles = {
  archived: "bg-slate-200 text-slate-700",
  complete: "bg-emerald-100 text-emerald-800",
  "due-soon": "bg-amber-100 text-amber-800",
  "on-track": "bg-sky-100 text-sky-700",
  overdue: "bg-rose-100 text-rose-700",
};

const statusStyles = {
  active: "bg-sky-100 text-sky-700",
  archived: "bg-slate-200 text-slate-700",
  completed: "bg-emerald-100 text-emerald-800",
  planned: "bg-emerald-100 text-emerald-800",
};

const taskStatusStyles = {
  completed: "bg-emerald-100 text-emerald-800",
  new: "bg-sky-100 text-sky-700",
};

const statusOptions = [
  ["planned", "Planned"],
  ["active", "Active"],
  ["completed", "Completed"],
  ["archived", "Archived"],
];

const ProjectsPage = () => {
  const { user } = useUser();
  const canManageWork = Boolean(user?.permissions?.canManageWork);
  const [busyId, setBusyId] = useState("");
  const [creating, setCreating] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState(initialForm);
  const [notice, setNotice] = useState({ message: "", type: "info" });
  const [projectDetail, setProjectDetail] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loading, setLoading] = useState(true);

  const loadProjects = useCallback(async ({ selectId = "", showLoading = false } = {}) => {
    if (showLoading) setLoading(true);

    try {
      const { projects: projectList } = await api.getProjects();
      setProjects(projectList);
      setError("");

      if (projectList.length > 0) {
        setSelectedProjectId((currentSelected) => {
          const preferredId = selectId || currentSelected;
          return projectList.some((project) => project.id === preferredId) ? preferredId : projectList[0].id;
        });
      } else {
        setSelectedProjectId("");
        setProjectDetail(null);
      }
    } catch (error) {
      setError(formatApiError(error));
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const loadProjectDetail = useCallback(async (projectId) => {
    if (!projectId) return;

    setDetailLoading(true);
    try {
      const { project } = await api.getProject(projectId);
      setProjectDetail(project);
      setError("");
    } catch (error) {
      setError(formatApiError(error));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects({ showLoading: true });
  }, [loadProjects]);

  useEffect(() => {
    loadProjectDetail(selectedProjectId);
  }, [loadProjectDetail, selectedProjectId]);

  const totals = useMemo(() => {
    const active = projects.filter((project) => project.status !== "archived" && project.status !== "completed").length;
    const completedTasks = projects.reduce((total, project) => total + project.completedTaskCount, 0);
    const totalTasks = projects.reduce((total, project) => total + project.taskCount, 0);
    const loggedHours = projects.reduce((total, project) => total + (project.totalLoggedHours || 0), 0);

    return { active, completedTasks, loggedHours, totalProjects: projects.length, totalTasks };
  }, [projects]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateProject = async (event) => {
    event.preventDefault();
    setCreating(true);
    setNotice({ message: "", type: "info" });

    try {
      const { project } = await api.createProject(formData);
      setFormData(initialForm);
      setNotice({ message: "Project created successfully.", type: "success" });
      await loadProjects({ selectId: project.id });
    } catch (error) {
      setNotice({ message: formatApiError(error), type: "error" });
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (projectId, status) => {
    setBusyId(projectId);
    setNotice({ message: "", type: "info" });

    try {
      await api.updateProject(projectId, { status });
      await loadProjects({ selectId: projectId });
      setNotice({ message: "Project status updated.", type: "success" });
    } catch (error) {
      setNotice({ message: formatApiError(error), type: "error" });
    } finally {
      setBusyId("");
    }
  };

  return (
    <AppShell
        title="Projects"
        subtitle="Create client or internal projects, organize task delivery, and track progress from completed work."
      >
      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <section className="space-y-6">
          {canManageWork && (
            <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleCreateProject}>
              <div className="mb-5 flex items-start gap-3 border-b border-slate-200 pb-5">
                <span className="rounded-lg bg-emerald-100 p-3 text-emerald-800">
                  <FiPlusCircle className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-2xl font-bold text-slate-950">Create project</h2>
                  <p className="mt-1 text-sm text-slate-500">Projects group tasks, due dates, and hours.</p>
                </div>
              </div>

              <div className="space-y-5">
                <Alert message={notice.message} type={notice.type} />

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Project name</span>
                <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-600/10">
                  <FiBriefcase className="h-5 w-5 text-slate-400" />
                  <input
                    className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                    name="name"
                    onChange={handleChange}
                    placeholder="Prime Dumpster"
                    required
                    type="text"
                    value={formData.name}
                  />
                </div>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Start date</span>
                  <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-600/10">
                    <FiCalendar className="h-5 w-5 text-slate-400" />
                    <input
                      className="w-full bg-transparent text-sm font-semibold text-slate-950 outline-none"
                      name="startDate"
                      onChange={handleChange}
                      type="date"
                      value={formData.startDate}
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Due date</span>
                  <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-600/10">
                    <FiFlag className="h-5 w-5 text-slate-400" />
                    <input
                      className="w-full bg-transparent text-sm font-semibold text-slate-950 outline-none"
                      name="dueDate"
                      onChange={handleChange}
                      type="date"
                      value={formData.dueDate}
                    />
                  </div>
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Description</span>
                <textarea
                  className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                  name="description"
                  onChange={handleChange}
                  placeholder="Scope, client context, delivery notes, or internal objective."
                  rows="4"
                  value={formData.description}
                />
              </label>

              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={creating}
                type="submit"
              >
                <FiPlusCircle className="h-4 w-4" />
                {creating ? "Creating project..." : "Create project"}
              </button>
              </div>
            </form>
          )}

          <section className="grid grid-cols-2 gap-3">
            {[
              ["Projects", totals.totalProjects, <FiBriefcase className="h-5 w-5" />],
              ["Active", totals.active, <FiClock className="h-5 w-5" />],
              ["Tasks", totals.totalTasks, <FiBarChart2 className="h-5 w-5" />],
              ["Hours", totals.loggedHours.toFixed(1), <FiCheckCircle className="h-5 w-5" />],
            ].map(([label, value, icon]) => (
              <article key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
                  </div>
                  <span className="rounded-lg bg-slate-100 p-3 text-slate-700">{icon}</span>
                </div>
              </article>
            ))}
          </section>
        </section>

        <section className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Project portfolio</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {totals.completedTasks} of {totals.totalTasks} tasks completed.
                </p>
              </div>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                onClick={() => loadProjects({ selectId: selectedProjectId, showLoading: true })}
                type="button"
              >
                <FiRefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>

            <Alert message={error} type="error" />

            {loading ? (
              <div className="py-14 text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
                <p className="mt-4 text-sm font-semibold text-slate-500">Loading projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <FiBriefcase className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-950">No projects yet</h3>
                <p className="mt-2 text-sm text-slate-500">Create a project before assigning tasks.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <article
                    className={`rounded-lg border p-4 transition hover:shadow-md ${
                      selectedProjectId === project.id
                        ? "border-emerald-300 bg-emerald-50/40"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                    }`}
                    key={project.id}
                  >
                    <button
                      className="w-full text-left"
                      onClick={() => setSelectedProjectId(project.id)}
                      type="button"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                statusStyles[project.status] || statusStyles.active
                              }`}
                            >
                              {project.status}
                            </span>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                healthStyles[project.health] || healthStyles["on-track"]
                              }`}
                            >
                              {project.health.replace("-", " ")}
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                              <FiFlag className="h-4 w-4" />
                              {formatDate(project.dueDate)}
                            </span>
                          </div>
                          <h3 className="mt-3 text-lg font-bold text-slate-950">{project.name}</h3>
                          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
                            {project.description || "No description provided."}
                          </p>
                        </div>
                        <div className="min-w-32">
                          <p className="text-right text-sm font-bold text-slate-950">{project.progress}%</p>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                          <p className="mt-2 text-right text-xs font-semibold text-slate-500">
                            {project.completedTaskCount}/{project.taskCount} tasks
                          </p>
                        </div>
                      </div>
                    </button>

                    {canManageWork && (
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                        {statusOptions.map(([value, label]) => (
                          <button
                            className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                              project.status === value
                                ? "bg-emerald-700 text-white shadow-sm shadow-emerald-200"
                                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-slate-950"
                            }`}
                            disabled={busyId === project.id}
                            key={value}
                            onClick={() => handleStatusChange(project.id, value)}
                            type="button"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            {detailLoading ? (
              <div className="py-12 text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
                <p className="mt-4 text-sm font-semibold text-slate-500">Loading project detail...</p>
              </div>
            ) : projectDetail ? (
              <>
                <div className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-normal text-emerald-700">Selected project</p>
                    <h2 className="mt-1 text-2xl font-bold text-slate-950">{projectDetail.name}</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                      {projectDetail.description || "No description provided."}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-right">
                    <p className="text-3xl font-bold text-slate-950">{projectDetail.progress}%</p>
                    <p className="mt-1 text-xs font-bold uppercase text-slate-500">Complete</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">Start</p>
                    <p className="mt-2 text-sm font-bold text-slate-950">{formatDate(projectDetail.startDate)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">Due</p>
                    <p className="mt-2 text-sm font-bold text-slate-950">{formatDate(projectDetail.dueDate)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">Logged</p>
                    <p className="mt-2 text-sm font-bold text-slate-950">
                      {(projectDetail.totalLoggedHours || 0).toFixed(1)} hours
                    </p>
                  </div>
                </div>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                    style={{ width: `${projectDetail.progress}%` }}
                  />
                </div>

                <div className="mt-6 space-y-3">
                  {projectDetail.tasks.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                      <FiArchive className="mx-auto h-8 w-8 text-slate-400" />
                      <p className="mt-3 text-sm font-semibold text-slate-500">No tasks under this project yet.</p>
                    </div>
                  ) : (
                    projectDetail.tasks.map((task) => (
                      <article className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={task.id}>
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold ${
                                  taskStatusStyles[task.status] || taskStatusStyles.new
                                }`}
                              >
                                {task.status}
                              </span>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                                {task.category}
                              </span>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                                {task.totalLoggedHours.toFixed(1)}h logged
                              </span>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                                {Number(task.projectWeight || 0).toFixed(1)}% weight
                              </span>
                            </div>
                            <h3 className="mt-3 text-base font-bold text-slate-950">{task.title}</h3>
                            <p className="mt-1 text-sm text-slate-500">
                              Assigned to {task.assignedToName}
                              {task.deadline ? ` - Due ${formatDate(task.deadline)}` : ""}
                            </p>
                            {task.successCriteria && (
                              <p className="mt-3 text-sm leading-6 text-slate-600">
                                <span className="font-bold text-slate-800">Success: </span>
                                {task.successCriteria}
                              </p>
                            )}
                            <div className="mt-4">
                              <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
                                <span>Task progress</span>
                                <span>{task.aiProgress || 0}%</span>
                              </div>
                              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                                  style={{ width: `${task.aiProgress || 0}%` }}
                                />
                              </div>
                              {task.aiSummary && <p className="mt-2 text-xs leading-5 text-slate-500">{task.aiSummary}</p>}
                            </div>
                          </div>
                          <span className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                            {task.estimatedHours ? `${task.estimatedHours}h estimate` : "No estimate"}
                          </span>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <FiBriefcase className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-3 text-sm font-semibold text-slate-500">Select a project to view delivery detail.</p>
              </div>
            )}
          </section>
        </section>
      </div>
    </AppShell>
  );
};

export default ProjectsPage;
