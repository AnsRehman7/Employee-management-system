import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiBriefcase,
  FiCheckCircle,
  FiChevronRight,
  FiFolderPlus,
  FiHeart,
  FiRefreshCw,
  FiSliders,
  FiTrendingUp,
  FiUser,
  FiX,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import Alert from "../../Alert";
import AppShell from "../../AppShell";
import Pagination from "../../Pagination";
import { usePagination } from "../../../hooks/usePagination";
import { api, formatApiError } from "../../../context/api";
import { useUser } from "../../../context/UserContext";
import { FilterDate, FilterSelect } from "./FilterControls";
import {
  formatDate,
  initialsFor,
  labelForValue,
  PROJECT_HEALTH_STYLES,
  PROJECT_STATUS_OPTIONS,
  PROJECT_STATUS_STYLES,
} from "./workUtils";

const emptyFilters = {
  dueFrom: "",
  dueTo: "",
  health: "all",
  owner: "all",
  sort: "updated_desc",
  status: "all",
};

const ProjectsIndexPage = () => {
  const { user } = useUser();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(emptyFilters);
  const canCreateProjects = Boolean(user?.permissions?.canCreateProjects);

  const loadProjects = useCallback(async ({ showLoading = false } = {}) => {
    if (showLoading) setLoading(true);
    try {
      const { projects: projectList } = await api.getProjects();
      setProjects(projectList);
      setError("");
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects({ showLoading: true });
  }, [loadProjects]);

  const owners = useMemo(
    () =>
      Array.from(
        new Map(
          projects.map((project) => [project.ownerId || project.createdById, { id: project.ownerId || project.createdById, name: project.ownerName || project.createdByName }])
        ).values()
      ).sort((a, b) => a.name.localeCompare(b.name)),
    [projects]
  );

  const metrics = useMemo(
    () => ({
      active: projects.filter((project) => project.status === "active").length,
      atRisk: projects.filter((project) => ["overdue", "due-soon"].includes(project.health)).length,
      completed: projects.filter((project) => project.status === "completed").length,
      total: projects.length,
    }),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    const result = projects.filter((project) => {
      if (filters.status !== "all" && project.status !== filters.status) return false;
      if (filters.health !== "all" && project.health !== filters.health) return false;
      if (filters.owner !== "all" && (project.ownerId || project.createdById) !== filters.owner) return false;
      if (filters.dueFrom && (!project.dueDate || project.dueDate < filters.dueFrom)) return false;
      if (filters.dueTo && (!project.dueDate || project.dueDate > filters.dueTo)) return false;
      return true;
    });

    return [...result].sort((a, b) => {
      if (filters.sort === "due_asc") return (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31");
      if (filters.sort === "progress_desc") return b.progress - a.progress;
      if (filters.sort === "name") return a.name.localeCompare(b.name);
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }, [filters, projects]);

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => key !== "sort" && value && value !== "all"
  ).length;

  const { firstItem, lastItem, page, pageItems, resetPage, setPage, total, totalPages } =
    usePagination(filteredProjects);

  const updateFilter = (name, value) => {
    resetPage();
    setFilters((current) => ({ ...current, [name]: value }));
  };
  const clearFilters = () => {
    resetPage();
    setFilters(emptyFilters);
  };

  return (
    <AppShell title="Projects" subtitle="Track portfolio health, delivery progress, ownership, and dates across every work stream.">
      <div className="space-y-5">
        <section className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid flex-1 grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 lg:grid-cols-4">
            {[
              ["All projects", metrics.total, FiBriefcase, "text-slate-700"],
              ["Active", metrics.active, FiTrendingUp, "text-teal-800"],
              ["Need attention", metrics.atRisk, FiAlertTriangle, "text-amber-700"],
              ["Completed", metrics.completed, FiCheckCircle, "text-emerald-700"],
            ].map(([label, value, Icon, tone]) => (
              <div className="flex min-h-20 items-center gap-3 bg-white px-4 py-3" key={label}>
                {createElement(Icon, { className: `h-5 w-5 shrink-0 ${tone}` })}
                <div><p className="text-2xl font-bold text-slate-950">{value}</p><p className="text-xs font-semibold text-slate-500">{label}</p></div>
              </div>
            ))}
          </div>
          {canCreateProjects && <Link className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-800" to="/projects/new"><FiFolderPlus className="h-4 w-4" />Create project</Link>}
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-950">Project portfolio</h2>
              <p className="mt-0.5 text-xs text-slate-500">{filteredProjects.length} of {projects.length} projects in this view</p>
            </div>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && <button className="inline-flex h-9 items-center gap-2 rounded-lg px-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-50" onClick={clearFilters} type="button"><FiX className="h-4 w-4" />Clear filters</button>}
              <button aria-label="Refresh projects" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50" onClick={() => loadProjects({ showLoading: true })} title="Refresh projects" type="button"><FiRefreshCw className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="border-b border-slate-200 bg-slate-50/70 p-4">
            <div className="grid gap-x-3 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
              <FilterSelect icon={FiBriefcase} label="Status" onChange={(event) => updateFilter("status", event.target.value)} value={filters.status}><option value="all">All statuses</option>{PROJECT_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</FilterSelect>
              <FilterSelect icon={FiHeart} label="Health" onChange={(event) => updateFilter("health", event.target.value)} value={filters.health}><option value="all">All health</option><option value="on-track">On track</option><option value="due-soon">Due soon</option><option value="overdue">Overdue</option><option value="complete">Complete</option><option value="archived">Archived</option></FilterSelect>
              <FilterSelect icon={FiUser} label="Owner" onChange={(event) => updateFilter("owner", event.target.value)} value={filters.owner}><option value="all">All owners</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}</FilterSelect>
              <FilterDate label="Due from" onChange={(event) => updateFilter("dueFrom", event.target.value)} value={filters.dueFrom} />
              <FilterDate label="Due to" onChange={(event) => updateFilter("dueTo", event.target.value)} value={filters.dueTo} />
              <FilterSelect icon={FiSliders} label="Sort" onChange={(event) => updateFilter("sort", event.target.value)} value={filters.sort}><option value="updated_desc">Recently updated</option><option value="due_asc">Due date</option><option value="progress_desc">Progress</option><option value="name">Name</option></FilterSelect>
            </div>
          </div>

          <div className="px-4 pt-4"><Alert message={error} type="error" /></div>

          {loading ? (
            <div className="py-20 text-center"><div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-700" /><p className="mt-4 text-sm font-semibold text-slate-500">Loading projects...</p></div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-20 text-center"><FiSliders className="mx-auto h-8 w-8 text-slate-400" /><h2 className="mt-4 text-base font-bold text-slate-950">No projects match this view</h2><p className="mt-1 text-sm text-slate-500">Change or clear the filters to see more projects.</p></div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full table-fixed border-collapse text-left">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500"><tr><th className="w-[29%] px-4 py-3">Project</th><th className="w-[11%] px-3 py-3">Status</th><th className="w-[12%] px-3 py-3">Health</th><th className="w-[15%] px-3 py-3">Owner</th><th className="w-[12%] px-3 py-3">Due</th><th className="w-[19%] px-3 py-3">Progress</th><th className="w-[2%] px-2 py-3"><span className="sr-only">Open</span></th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {pageItems.map((project) => (
                      <tr className="group transition hover:bg-emerald-50/40" key={project.id}>
                        <td className="px-4 py-4 align-top"><Link className="block min-w-0" to={`/projects/${project.id}`}><div className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-900">{project.name.slice(0, 2).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-950 group-hover:text-emerald-800">{project.name}</p><p className="mt-1 truncate text-xs text-slate-500">{project.taskCount} tasks / {project.totalLoggedHours.toFixed(1)}h logged</p></div></div></Link></td>
                        <td className="px-3 py-4 align-top"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${PROJECT_STATUS_STYLES[project.status] || PROJECT_STATUS_STYLES.active}`}>{labelForValue(project.status)}</span></td>
                        <td className={`px-3 py-4 text-sm font-bold align-top ${PROJECT_HEALTH_STYLES[project.health] || "text-slate-600"}`}>{labelForValue(project.health)}</td>
                        <td className="px-3 py-4 align-top"><div className="flex min-w-0 items-center gap-2"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-900">{initialsFor(project.ownerName)}</span><span className="truncate text-sm font-semibold text-slate-700">{project.ownerName}</span></div></td>
                        <td className="px-3 py-4 text-sm font-semibold text-slate-600 align-top">{formatDate(project.dueDate, "No due date")}</td>
                        <td className="px-3 py-4 align-top"><div className="flex items-center gap-3"><div className="h-2 min-w-20 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-700" style={{ width: `${project.progress}%` }} /></div><span className="w-9 text-right text-xs font-bold text-slate-700">{project.progress}%</span></div><p className="mt-2 text-xs text-slate-400">{project.completedTaskCount}/{project.taskCount} complete</p></td>
                        <td className="px-2 py-4 align-top"><Link aria-label={`Open ${project.name}`} className="text-slate-400 group-hover:text-emerald-800" to={`/projects/${project.id}`}><FiChevronRight className="h-4 w-4" /></Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 lg:hidden">{pageItems.map((project) => <Link className="block p-4 transition hover:bg-emerald-50/40" key={project.id} to={`/projects/${project.id}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-bold text-slate-950">{project.name}</p><p className="mt-1 text-xs text-slate-500">{project.taskCount} tasks / Due {formatDate(project.dueDate, "not set")}</p></div><FiChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" /></div><div className="mt-3 flex items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${PROJECT_STATUS_STYLES[project.status] || PROJECT_STATUS_STYLES.active}`}>{labelForValue(project.status)}</span><span className={`text-xs font-bold ${PROJECT_HEALTH_STYLES[project.health]}`}>{labelForValue(project.health)}</span><span className="ml-auto text-xs font-bold text-slate-600">{project.progress}%</span></div></Link>)}</div>
            </>
          )}

          {!loading && (
            <Pagination
              firstItem={firstItem}
              itemLabel="projects"
              lastItem={lastItem}
              onPageChange={setPage}
              page={page}
              total={total}
              totalPages={totalPages}
            />
          )}
        </section>
      </div>
    </AppShell>
  );
};

export default ProjectsIndexPage;
