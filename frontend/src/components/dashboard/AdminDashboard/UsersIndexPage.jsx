import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import {
  FiBriefcase,
  FiCheckCircle,
  FiChevronRight,
  FiLayers,
  FiPlus,
  FiRefreshCw,
  FiShield,
  FiSlash,
  FiSliders,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import Alert from "../../Alert";
import { TableSkeleton } from "../../Skeleton";
import AppShell from "../../AppShell";
import Pagination from "../../Pagination";
import { usePagination } from "../../../hooks/usePagination";
import { api, formatApiError } from "../../../context/api";
import { useUser } from "../../../context/UserContext";
import { FilterSelect } from "./FilterControls";
import { initialsFor, labelForValue } from "./workUtils";
import { USER_STATUS_STYLES } from "./userUtils";
import { useRoles } from "../../../hooks/useRoles";

const emptyFilters = {
  department: "all",
  role: "all",
  sort: "name",
  status: "all",
};

const leadershipRoles = ["super_admin", "admin", "manager", "hr"];

const UsersIndexPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useUser();
  const { labelFor, roles } = useRoles();
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async ({ showLoading = false } = {}) => {
    if (showLoading) setLoading(true);
    try {
      const { users: userList } = await api.getUsers();
      setUsers(userList);
      setError("");
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers({ showLoading: true });
  }, [loadUsers]);

  const departments = useMemo(
    () => Array.from(new Set(users.map((member) => member.department).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [users]
  );

  const metrics = useMemo(() => {
    const active = users.filter((member) => member.status === "active").length;
    return {
      active,
      leadership: users.filter((member) => leadershipRoles.includes(member.role)).length,
      suspended: users.length - active,
      total: users.length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const result = users.filter((member) => {
      if (filters.status !== "all" && member.status !== filters.status) return false;
      if (filters.role !== "all" && member.role !== filters.role) return false;
      if (filters.department === "unassigned" && member.department) return false;
      if (!["all", "unassigned"].includes(filters.department) && member.department !== filters.department) return false;
      return true;
    });

    return [...result].sort((a, b) => {
      if (filters.sort === "role") return a.role.localeCompare(b.role) || a.name.localeCompare(b.name);
      if (filters.sort === "department") return (a.department || "zzzz").localeCompare(b.department || "zzzz") || a.name.localeCompare(b.name);
      if (filters.sort === "status") return a.status.localeCompare(b.status) || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
  }, [filters, users]);

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => key !== "sort" && value !== "all"
  ).length;

  const { firstItem, lastItem, page, pageItems, resetPage, setPage, total, totalPages } =
    usePagination(filteredUsers);

  const updateFilter = (name, value) => {
    resetPage();
    setFilters((current) => ({ ...current, [name]: value }));
  };
  const clearFilters = () => {
    resetPage();
    setFilters(emptyFilters);
  };
  const openMember = (memberId) => navigate(`/users/${memberId}`);

  return (
    <AppShell title="Users" subtitle="Manage workspace membership, access levels, and account status from a single directory.">
      <div className="space-y-5">
        <section className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid flex-1 grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 lg:grid-cols-4">
            {[
              ["All users", metrics.total, FiUsers, "text-slate-700"],
              ["Active", metrics.active, FiCheckCircle, "text-emerald-700"],
              ["Leadership", metrics.leadership, FiShield, "text-emerald-800"],
              ["Suspended", metrics.suspended, FiSlash, "text-rose-700"],
            ].map(([label, value, Icon, tone]) => (
              <div className="flex min-h-20 items-center gap-3 bg-white px-4 py-3" key={label}>
                {createElement(Icon, { className: `h-5 w-5 shrink-0 ${tone}` })}
                <div><p className="text-2xl font-bold text-slate-950">{value}</p><p className="text-xs font-semibold text-slate-500">{label}</p></div>
              </div>
            ))}
          </div>
          <Link className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-800" to="/users/new">
            <FiPlus className="h-4 w-4" />Add user
          </Link>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-950">User directory</h2>
              <p className="mt-0.5 text-xs text-slate-500">{filteredUsers.length} of {users.length} accounts in this view</p>
            </div>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && <button className="inline-flex h-9 items-center gap-2 rounded-lg px-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-50" onClick={clearFilters} type="button"><FiX className="h-4 w-4" />Clear filters</button>}
              <button aria-label="Refresh users" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50" onClick={() => loadUsers({ showLoading: true })} title="Refresh users" type="button"><FiRefreshCw className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="border-b border-slate-200 bg-slate-50/70 p-4">
            <div className="grid gap-x-3 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
              <FilterSelect icon={FiCheckCircle} label="Status" onChange={(event) => updateFilter("status", event.target.value)} value={filters.status}>
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </FilterSelect>
              <FilterSelect icon={FiShield} label="Role" onChange={(event) => updateFilter("role", event.target.value)} value={filters.role}>
                <option value="all">All roles</option>
                {roles.map((role) => <option key={role.id} value={role.key}>{role.name}</option>)}
              </FilterSelect>
              <FilterSelect icon={FiLayers} label="Department" onChange={(event) => updateFilter("department", event.target.value)} value={filters.department}>
                <option value="all">All departments</option>
                <option value="unassigned">Not assigned</option>
                {departments.map((department) => <option key={department} value={department}>{department}</option>)}
              </FilterSelect>
              <FilterSelect icon={FiSliders} label="Sort" onChange={(event) => updateFilter("sort", event.target.value)} value={filters.sort}>
                <option value="name">Name</option>
                <option value="role">Role</option>
                <option value="department">Department</option>
                <option value="status">Status</option>
              </FilterSelect>
            </div>
          </div>

          <div className="px-4 pt-4"><Alert message={error} type="error" /></div>

          {loading ? (
            <TableSkeleton label="Loading users" rows={6} />
          ) : filteredUsers.length === 0 ? (
            <div className="py-20 text-center"><FiUser className="mx-auto h-8 w-8 text-slate-400" /><h2 className="mt-4 text-base font-bold text-slate-950">No users match this view</h2><p className="mt-1 text-sm text-slate-500">Change or clear the filters to see more accounts.</p></div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full table-fixed border-collapse text-left">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500">
                    <tr><th className="w-[28%] px-4 py-3">Member</th><th className="w-[14%] px-3 py-3">Role</th><th className="w-[15%] px-3 py-3">Department</th><th className="w-[16%] px-3 py-3">Designation</th><th className="w-[12%] px-3 py-3">Status</th><th className="w-[13%] px-3 py-3">Contact</th><th className="w-[2%] px-2 py-3"><span className="sr-only">Open</span></th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pageItems.map((member) => (
                      <tr
                        className="group cursor-pointer transition hover:bg-emerald-50/40 focus-within:bg-emerald-50/40"
                        key={member.id}
                        onClick={() => openMember(member.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") openMember(member.id);
                        }}
                        role="link"
                        tabIndex="0"
                      >
                        <td className="px-4 py-4 align-top"><div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-xs font-bold text-teal-900">{initialsFor(member.name)}</span><div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate text-sm font-bold text-slate-950 group-hover:text-emerald-800">{member.name}</p>{currentUser?.id === member.id && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">You</span>}</div><p className="mt-1 truncate text-xs text-slate-500">{member.email}</p></div></div></td>
                        <td className="px-3 py-4 text-sm font-semibold text-slate-700 align-top">{member.roleName || labelFor(member.role)}</td>
                        <td className="truncate px-3 py-4 text-sm text-slate-600 align-top">{member.department || "Not assigned"}</td>
                        <td className="truncate px-3 py-4 text-sm text-slate-600 align-top">{member.designation || "Not assigned"}</td>
                        <td className="px-3 py-4 align-top"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${USER_STATUS_STYLES[member.status] || USER_STATUS_STYLES.active}`}>{labelForValue(member.status)}</span></td>
                        <td className="truncate px-3 py-4 text-sm text-slate-600 align-top">{member.contact || "Not provided"}</td>
                        <td className="px-2 py-4 align-top"><FiChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-800" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 lg:hidden">
                {pageItems.map((member) => (
                  <Link className="block p-4 transition hover:bg-emerald-50/40" key={member.id} to={`/users/${member.id}`}>
                    <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-xs font-bold text-teal-900">{initialsFor(member.name)}</span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-950">{member.name}</p><p className="mt-1 truncate text-xs text-slate-500">{member.email}</p></div><FiChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" /></div><div className="mt-3 flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${USER_STATUS_STYLES[member.status] || USER_STATUS_STYLES.active}`}>{labelForValue(member.status)}</span><span className="text-xs font-semibold text-slate-500">{member.roleName || labelFor(member.role)}</span><span className="text-xs text-slate-400">{member.department || "No department"}</span></div></div></div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {!loading && (
            <Pagination
              firstItem={firstItem}
              itemLabel="users"
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

export default UsersIndexPage;
