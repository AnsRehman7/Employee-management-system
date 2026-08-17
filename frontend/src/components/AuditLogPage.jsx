import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiCheckCircle,
  FiClock,
  FiEdit3,
  FiFileText,
  FiPlusCircle,
  FiRefreshCw,
  FiShield,
  FiSlash,
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import Alert from "./Alert";
import AppShell from "./AppShell";
import Pagination from "./Pagination";
import { usePagination } from "../hooks/usePagination";
import { api, formatApiError } from "../context/api";

const ENTITY_OPTIONS = ["", "workspace", "user", "project", "task", "attendance"];
const ACTION_OPTIONS = ["", "created", "updated", "completed", "status_changed", "permissions_changed", "time_logged", "recorded", "rejected", "archived", "suspended", "deleted"];
const dateTimeFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

const labelFor = (value = "") =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const actionAppearance = (action) => {
  const appearances = {
    archived: { icon: FiSlash, tone: "bg-slate-100 text-slate-600" },
    completed: { icon: FiCheckCircle, tone: "bg-emerald-100 text-emerald-700" },
    created: { icon: FiPlusCircle, tone: "bg-teal-100 text-teal-800" },
    deleted: { icon: FiTrash2, tone: "bg-rose-100 text-rose-700" },
    permissions_changed: { icon: FiShield, tone: "bg-emerald-100 text-emerald-800" },
    recorded: { icon: FiClock, tone: "bg-emerald-100 text-emerald-700" },
    rejected: { icon: FiSlash, tone: "bg-rose-100 text-rose-700" },
    suspended: { icon: FiSlash, tone: "bg-amber-100 text-amber-700" },
    time_logged: { icon: FiClock, tone: "bg-teal-100 text-teal-800" },
    updated: { icon: FiEdit3, tone: "bg-emerald-100 text-emerald-800" },
  };
  return appearances[action] || { icon: FiActivity, tone: "bg-slate-100 text-slate-600" };
};

const entityUrl = (entry) => {
  if (!entry.entityId) return "";
  if (entry.entityType === "task") return `/tasks/${entry.entityId}`;
  if (entry.entityType === "project") return `/projects/${entry.entityId}`;
  if (entry.entityType === "user") return `/users/${entry.entityId}`;
  return "";
};

const AuditLogPage = () => {
  const [filters, setFilters] = useState({ action: "", entityType: "" });
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { auditLogs } = await api.getAuditLogs({ ...filters, limit: 100 });
      setEntries(auditLogs);
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const actors = useMemo(() => new Set(entries.map((entry) => entry.actor?.id).filter(Boolean)).size, [entries]);

  const { firstItem, lastItem, page, pageItems, resetPage, setPage, total, totalPages } =
    usePagination(entries);

  const updateFilter = (name, value) => {
    resetPage();
    setFilters((current) => ({ ...current, [name]: value }));
  };

  return (
    <AppShell title="Audit log" subtitle="Review important workspace, access, project, task, and attendance changes.">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase text-slate-400">Visible events</p><p className="mt-2 text-2xl font-bold text-slate-950">{entries.length}</p></section>
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase text-slate-400">Active actors</p><p className="mt-2 text-2xl font-bold text-slate-950">{actors}</p></section>
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase text-slate-400">Retention view</p><p className="mt-2 text-2xl font-bold text-slate-950">Latest 100</p></section>
        </div>

        <Alert message={error} type="error" />

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800"><FiFileText className="h-4 w-4" /></span><div><h2 className="text-base font-bold text-slate-950">Workspace history</h2><p className="text-sm text-slate-500">Server-recorded changes scoped to this organization.</p></div></div>
            <div className="grid gap-3 sm:grid-cols-[180px_180px_40px]">
              <label><span className="text-xs font-bold uppercase text-slate-500">Entity</span><select className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" onChange={(event) => updateFilter("entityType", event.target.value)} value={filters.entityType}>{ENTITY_OPTIONS.map((value) => <option key={value || "all"} value={value}>{value ? labelFor(value) : "All entities"}</option>)}</select></label>
              <label><span className="text-xs font-bold uppercase text-slate-500">Action</span><select className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" onChange={(event) => updateFilter("action", event.target.value)} value={filters.action}>{ACTION_OPTIONS.map((value) => <option key={value || "all"} value={value}>{value ? labelFor(value) : "All actions"}</option>)}</select></label>
              <button aria-label="Refresh audit log" className="mt-auto flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50" onClick={loadEntries} title="Refresh audit log" type="button"><FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
            </div>
          </div>

          {loading && !entries.length ? (
            <div className="py-24 text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-700" /><p className="mt-4 text-sm font-semibold text-slate-500">Loading audit events...</p></div>
          ) : entries.length ? (
            <div className="divide-y divide-slate-100">
              {pageItems.map((entry) => {
                const appearance = actionAppearance(entry.action);
                const ActionIcon = appearance.icon;
                const url = entityUrl(entry);
                const content = (
                  <div className="flex gap-4 px-5 py-4">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${appearance.tone}`}><ActionIcon className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-bold text-slate-950">{entry.summary}</p><p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><FiUser className="h-3.5 w-3.5" />{entry.actor?.name || "System"}</span><span>{entry.actor?.role ? labelFor(entry.actor.role) : "Automated"}</span><span>{labelFor(entry.entityType)}</span><span>{labelFor(entry.action)}</span></p></div><time className="shrink-0 text-xs font-semibold text-slate-400" dateTime={entry.createdAt}>{dateTimeFormatter.format(new Date(entry.createdAt))}</time></div></div>
                  </div>
                );
                return url ? <Link className="block transition hover:bg-slate-50" key={entry.id} to={url}>{content}</Link> : <div key={entry.id}>{content}</div>;
              })}
            </div>
          ) : (
            <div className="py-20 text-center"><FiCheckCircle className="mx-auto h-8 w-8 text-emerald-500" /><p className="mt-3 text-sm font-bold text-slate-700">No events match these filters</p><p className="mt-1 text-xs text-slate-500">New important changes will appear automatically.</p></div>
          )}

          <Pagination
            firstItem={firstItem}
            itemLabel="events"
            lastItem={lastItem}
            onPageChange={setPage}
            page={page}
            total={total}
            totalPages={totalPages}
          />
        </section>
      </div>
    </AppShell>
  );
};

export default AuditLogPage;
