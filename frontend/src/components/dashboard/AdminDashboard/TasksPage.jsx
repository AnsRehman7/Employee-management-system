import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiBriefcase,
  FiCheckCircle,
  FiCheckSquare,
  FiChevronRight,
  FiClock,
  FiFlag,
  FiPlus,
  FiRefreshCw,
  FiSliders,
  FiUser,
  FiUserCheck,
  FiUserX,
  FiX,
} from "react-icons/fi";
import { Link, useSearchParams } from "react-router-dom";
import Alert from "../../Alert";
import { TableSkeleton } from "../../Skeleton";
import AppShell from "../../AppShell";
import Pagination from "../../Pagination";
import { usePagination } from "../../../hooks/usePagination";
import { api, formatApiError } from "../../../context/api";
import { useUser } from "../../../context/UserContext";
import { FilterDate, FilterSelect } from "./FilterControls";
import {
  formatDate,
  initialsFor,
  isOverdue,
  labelForValue,
  TASK_STATUS_OPTIONS,
  TASK_STATUS_STYLES,
} from "./workUtils";

const emptyFilters = {
  assignee: "all",
  assigner: "all",
  dueFrom: "",
  dueTo: "",
  priority: "all",
  project: "all",
  search: "",
  sort: "updated_desc",
  status: "all",
};

const priorityOrder = { high: 0, normal: 1, low: 2 };

const TasksPage = () => {
  const { user } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(() => ({
    ...emptyFilters,
    search: searchParams.get("search") || "",
    status: searchParams.get("status") || "all",
  }));

  const canCreateTasks = Boolean(user?.permissions?.canCreateTasks);
  const canViewOrganizationWork = Boolean(user?.permissions?.canViewOrganizationWork);

  const loadTasks = useCallback(async ({ showLoading = false } = {}) => {
    if (showLoading) setLoading(true);
    try {
      const { tasks: taskList } = await api.getTasks();
      setTasks(taskList);
      setError("");
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks({ showLoading: true });
  }, [loadTasks]);

  useEffect(() => {
    const query = searchParams.get("search") || "";
    setFilters((current) => (current.search === query ? current : { ...current, search: query }));
  }, [searchParams]);

  const filterOptions = useMemo(() => {
    const uniqueById = (idKey, nameKey) =>
      Array.from(
        new Map(
          tasks
            .filter((task) => task[idKey])
            .map((task) => [task[idKey], { id: task[idKey], name: task[nameKey] }])
        ).values()
      ).sort((a, b) => a.name.localeCompare(b.name));

    return {
      assignees: uniqueById("assignedToId", "assignedToName"),
      assigners: uniqueById("createdById", "createdByName"),
      projects: Array.from(
        new Map(
          tasks.filter((task) => task.projectId).map((task) => [task.projectId, task.projectName])
        ).entries()
      )
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const result = tasks.filter((task) => {
      const searchable = [
        task.title,
        task.description,
        task.category,
        task.projectName,
        task.assignedToName,
        task.createdByName,
      ]
        .join(" ")
        .toLowerCase();

      if (query && !searchable.includes(query)) return false;
      if (filters.status !== "all" && task.status !== filters.status) return false;
      if (filters.priority !== "all" && task.priority !== filters.priority) return false;
      if (filters.project !== "all" && task.projectId !== filters.project) return false;
      if (filters.assignee === "unassigned" && task.assignedToId) return false;
      if (!["all", "unassigned"].includes(filters.assignee) && task.assignedToId !== filters.assignee) return false;
      if (filters.assigner !== "all" && task.createdById !== filters.assigner) return false;
      if (filters.dueFrom && (!task.deadline || task.deadline < filters.dueFrom)) return false;
      if (filters.dueTo && (!task.deadline || task.deadline > filters.dueTo)) return false;
      return true;
    });

    return [...result].sort((a, b) => {
      if (filters.sort === "due_asc") return (a.deadline || "9999-12-31").localeCompare(b.deadline || "9999-12-31");
      if (filters.sort === "created_desc") return new Date(b.createdAt) - new Date(a.createdAt);
      if (filters.sort === "priority") return priorityOrder[a.priority] - priorityOrder[b.priority];
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }, [filters, tasks]);

  const metrics = useMemo(
    () => ({
      active: tasks.filter((task) => ["active", "in_progress"].includes(task.status)).length,
      completed: tasks.filter((task) => task.status === "completed").length,
      open: tasks.filter((task) => task.status === "open").length,
      overdue: tasks.filter((task) => isOverdue(task.deadline, task.status)).length,
      unassigned: tasks.filter((task) => !task.assignedToId).length,
    }),
    [tasks]
  );

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => key !== "sort" && value && value !== "all"
  ).length;

  const { firstItem, lastItem, page, pageItems, resetPage, setPage, total, totalPages } =
    usePagination(filteredTasks);

  const updateFilter = (name, value) => {
    resetPage();
    setFilters((current) => ({ ...current, [name]: value }));
  };
  const clearFilters = () => {
    resetPage();
    setFilters(emptyFilters);
    setSearchParams({}, { replace: true });
  };
  const clearSearch = () => {
    updateFilter("search", "");
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("search");
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <AppShell
      title="Tasks"
      subtitle={canViewOrganizationWork ? "Plan, assign, and monitor work across the workspace." : "Review the work assigned to you and keep delivery status current."}
    >
      <div className="space-y-5">
        <section className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid flex-1 grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 lg:grid-cols-5">
            {[
              ["Open", metrics.open, FiCheckSquare, "text-amber-700"],
              ["In motion", metrics.active, FiClock, "text-teal-800"],
              ["Unassigned", metrics.unassigned, FiUserX, "text-emerald-800"],
              ["Overdue", metrics.overdue, FiAlertCircle, "text-rose-700"],
              ["Completed", metrics.completed, FiCheckCircle, "text-emerald-700"],
            ].map(([label, value, Icon, tone]) => (
              <div className="flex min-h-20 items-center gap-3 bg-white px-4 py-3" key={label}>
                {createElement(Icon, { className: `h-5 w-5 shrink-0 ${tone}` })}
                <div>
                  <p className="text-2xl font-bold text-slate-950">{value}</p>
                  <p className="text-xs font-semibold text-slate-500">{label}</p>
                </div>
              </div>
            ))}
          </div>
          {canCreateTasks && (
            <Link className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-800" to="/tasks/new">
              <FiPlus className="h-4 w-4" />
              Create task
            </Link>
          )}
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-950">Task register</h2>
              <p className="mt-0.5 text-xs text-slate-500">{filteredTasks.length} of {tasks.length} tasks in this view</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {filters.search && (
                <span className="inline-flex h-9 max-w-full items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-800">
                  <span className="max-w-56 truncate">Search: {filters.search}</span>
                  <button aria-label="Clear task search" className="text-emerald-600 hover:text-emerald-950" onClick={clearSearch} title="Clear search" type="button"><FiX className="h-3.5 w-3.5" /></button>
                </span>
              )}
              {activeFilterCount > 0 && (
                <button className="inline-flex h-9 items-center gap-2 rounded-lg px-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-50" onClick={clearFilters} type="button">
                  <FiX className="h-4 w-4" />
                  Clear filters
                </button>
              )}
              <button aria-label="Refresh tasks" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50" onClick={() => loadTasks({ showLoading: true })} title="Refresh tasks" type="button">
                <FiRefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="border-b border-slate-200 bg-slate-50/70 p-4">
            <div className="grid gap-x-3 gap-y-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
              <FilterSelect icon={FiCheckSquare} label="Status" onChange={(event) => updateFilter("status", event.target.value)} value={filters.status}>
                <option value="all">All statuses</option>
                {TASK_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </FilterSelect>
              <FilterSelect icon={FiFlag} label="Priority" onChange={(event) => updateFilter("priority", event.target.value)} value={filters.priority}>
                <option value="all">All priorities</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </FilterSelect>
              <FilterSelect icon={FiBriefcase} label="Project" onChange={(event) => updateFilter("project", event.target.value)} value={filters.project}>
                <option value="all">All projects</option>
                {filterOptions.projects.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
              </FilterSelect>
              <FilterSelect icon={FiUserCheck} label="Assigned to" onChange={(event) => updateFilter("assignee", event.target.value)} value={filters.assignee}>
                <option value="all">All assignees</option>
                <option value="unassigned">Unassigned</option>
                {filterOptions.assignees.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
              </FilterSelect>
              <FilterSelect icon={FiUser} label="Assigned by" onChange={(event) => updateFilter("assigner", event.target.value)} value={filters.assigner}>
                <option value="all">All assigners</option>
                {filterOptions.assigners.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
              </FilterSelect>
              <FilterDate label="Due from" onChange={(event) => updateFilter("dueFrom", event.target.value)} value={filters.dueFrom} />
              <FilterDate label="Due to" onChange={(event) => updateFilter("dueTo", event.target.value)} value={filters.dueTo} />
              <FilterSelect icon={FiSliders} label="Sort" onChange={(event) => updateFilter("sort", event.target.value)} value={filters.sort}>
                <option value="updated_desc">Recently updated</option>
                <option value="due_asc">Due date</option>
                <option value="created_desc">Recently created</option>
                <option value="priority">Priority</option>
              </FilterSelect>
            </div>
          </div>

          <div className="px-4 pt-4"><Alert message={error} type="error" /></div>

          {loading ? (
            <TableSkeleton label="Loading tasks" rows={6} />
          ) : filteredTasks.length === 0 ? (
            <div className="py-20 text-center">
              <FiSliders className="mx-auto h-8 w-8 text-slate-400" />
              <h2 className="mt-4 text-base font-bold text-slate-950">No tasks match this view</h2>
              <p className="mt-1 text-sm text-slate-500">Change or clear the filters to see more work.</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full table-fixed border-collapse text-left">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500">
                    <tr>
                      <th className="w-[32%] px-4 py-3">Task</th>
                      <th className="w-[12%] px-3 py-3">Status</th>
                      <th className="w-[15%] px-3 py-3">Assigned to</th>
                      <th className="w-[14%] px-3 py-3">Assigned by</th>
                      <th className="w-[12%] px-3 py-3">Due</th>
                      <th className="w-[13%] px-3 py-3">Project</th>
                      <th className="w-[2%] px-2 py-3"><span className="sr-only">Open</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pageItems.map((task) => (
                      <tr className="group transition hover:bg-emerald-50/40" key={task.id}>
                        <td className="px-4 py-4 align-top">
                          <Link className="block min-w-0" to={`/tasks/${task.id}`}>
                            <div className="flex items-start gap-3">
                              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">{task.category?.slice(0, 2).toUpperCase() || "TS"}</span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-950 group-hover:text-emerald-800">{task.title}</p>
                                <p className="mt-1 truncate text-xs text-slate-500">{task.category} / {labelForValue(task.priority)} priority</p>
                              </div>
                            </div>
                          </Link>
                        </td>
                        <td className="px-3 py-4 align-top"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${TASK_STATUS_STYLES[task.status] || TASK_STATUS_STYLES.open}`}>{labelForValue(task.status)}</span></td>
                        <td className="px-3 py-4 align-top">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-900">{initialsFor(task.assignedToName)}</span>
                            <span className="truncate text-sm font-semibold text-slate-700">{task.assignedToName}</span>
                          </div>
                        </td>
                        <td className="truncate px-3 py-4 text-sm text-slate-600 align-top">{task.createdByName}</td>
                        <td className={`px-3 py-4 text-sm font-semibold align-top ${isOverdue(task.deadline, task.status) ? "text-rose-700" : "text-slate-600"}`}>{formatDate(task.deadline, "No due date")}</td>
                        <td className="truncate px-3 py-4 text-sm text-slate-600 align-top">{task.projectName}</td>
                        <td className="px-2 py-4 align-top"><Link aria-label={`Open ${task.title}`} className="text-slate-400 group-hover:text-emerald-800" to={`/tasks/${task.id}`}><FiChevronRight className="h-4 w-4" /></Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 lg:hidden">
                {pageItems.map((task) => (
                  <Link className="block p-4 transition hover:bg-emerald-50/40" key={task.id} to={`/tasks/${task.id}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><p className="text-sm font-bold text-slate-950">{task.title}</p><p className="mt-1 truncate text-xs text-slate-500">{task.projectName} / {task.category}</p></div>
                      <FiChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${TASK_STATUS_STYLES[task.status] || TASK_STATUS_STYLES.open}`}>{labelForValue(task.status)}</span>
                      <span className="text-xs font-semibold text-slate-500">{task.assignedToName}</span>
                      <span className={isOverdue(task.deadline, task.status) ? "text-xs font-bold text-rose-700" : "text-xs font-semibold text-slate-500"}>{formatDate(task.deadline, "No due date")}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {!loading && (
            <Pagination
              firstItem={firstItem}
              itemLabel="tasks"
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

export default TasksPage;
