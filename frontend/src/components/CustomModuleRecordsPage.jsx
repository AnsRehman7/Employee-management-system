import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiArrowRight,
  FiDatabase,
  FiPlus,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";
import { Link, useParams } from "react-router-dom";
import Alert from "./Alert";
import AppShell from "./AppShell";
import Pagination from "./Pagination";
import { usePagination } from "../hooks/usePagination";
import { api, formatApiError } from "../context/api";

const valueForDisplay = (field, value, membersById) => {
  if (value === null || value === undefined || value === "") return "-";
  if (field.type === "boolean") return value ? "Yes" : "No";
  if (field.type === "user") return membersById.get(value)?.name || "Former team member";
  if (Array.isArray(value)) {
    const labels = new Map((field.options || []).map((option) => [option.value, option.label]));
    return value.map((item) => labels.get(item) || item).join(", ");
  }
  if (field.type === "select") {
    return field.options?.find((option) => option.value === value)?.label || value;
  }
  if (field.type === "datetime") return new Date(value).toLocaleString();
  if (field.type === "date") return new Date(`${value}T00:00:00`).toLocaleDateString();
  return String(value);
};

const CustomModuleRecordsPage = () => {
  const { moduleKey } = useParams();
  const [module, setModule] = useState(null);
  const [records, setRecords] = useState([]);
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [result, employeeResult] = await Promise.all([
        api.getCustomRecords(moduleKey),
        api.getEmployees().catch(() => ({ employees: [] })),
      ]);
      setModule(result.module);
      setRecords(result.records);
      setMembers(employeeResult.employees);
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, [moduleKey]);

  useEffect(() => {
    load();
  }, [load]);

  const fields = useMemo(
    () => module?.fields.filter((field) => !field.archived && field.isVisible).slice(0, 6) || [],
    [module],
  );
  const membersById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return records;
    return records.filter((record) =>
      [record.displayName, ...Object.values(record.values || {})]
        .flat()
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [records, search]);

  const { firstItem, lastItem, page, pageItems, resetPage, setPage, total, totalPages } =
    usePagination(filteredRecords);

  return (
    <AppShell
      title={module?.pluralName || "Module"}
      subtitle={module?.description || "Workspace records and operational data."}
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <FiDatabase />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">{records.length} records</p>
              <p className="text-xs text-slate-500">Updated from your workspace module definition.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button aria-label="Refresh records" className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" onClick={load} title="Refresh records" type="button"><FiRefreshCw className={loading ? "animate-spin" : ""} /></button>
            {module?.access.canCreate && (
              <Link className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800" to={`/modules/${moduleKey}/new`}>
                <FiPlus />
                New {module.singularName}
              </Link>
            )}
          </div>
        </div>
        <Alert message={error} type="error" />
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <label className="flex h-11 max-w-xl items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 focus-within:border-emerald-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
              <FiSearch className="shrink-0 text-slate-400" />
              <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" onChange={(event) => { resetPage(); setSearch(event.target.value); }} placeholder={`Search ${module?.pluralName?.toLowerCase() || "records"}`} type="search" value={search} />
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                <tr>
                  {fields.map((field) => <th className="px-5 py-3" key={field.id}>{field.label}</th>)}
                  <th className="px-5 py-3">Updated</th>
                  <th className="w-14 px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageItems.map((record) => (
                  <tr className="group hover:bg-slate-50" key={record.id}>
                    {fields.map((field, index) => (
                      <td className={`max-w-[300px] truncate px-5 py-4 text-sm ${index === 0 ? "font-bold text-slate-950" : "font-medium text-slate-600"}`} key={field.id}>
                        {valueForDisplay(field, record.values[field.key], membersById)}
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">{new Date(record.updatedAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4"><Link aria-label={`Open ${record.displayName}`} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition group-hover:bg-white group-hover:text-emerald-800" title={`Open ${record.displayName}`} to={`/modules/${moduleKey}/${record.id}`}><FiArrowRight /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && filteredRecords.length === 0 && (
            <div className="border-t border-slate-100 px-5 py-16 text-center">
              <FiDatabase className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-700">{search ? "No matching records" : `No ${module?.pluralName?.toLowerCase() || "records"} yet`}</p>
            </div>
          )}
          {!loading && (
            <Pagination
              firstItem={firstItem}
              itemLabel="records"
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

export default CustomModuleRecordsPage;
