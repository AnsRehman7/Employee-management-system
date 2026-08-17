import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiAlertTriangle,
  FiCalendar,
  FiChevronDown,
  FiClock,
  FiDownload,
  FiFilter,
  FiLayers,
  FiLogIn,
  FiLogOut,
  FiRefreshCw,
  FiSearch,
  FiSettings,
  FiShield,
  FiSliders,
  FiUserCheck,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import AppShell from "../AppShell";
import Alert from "../Alert";
import Pagination from "../Pagination";
import { PAGE_SIZE } from "../../hooks/usePagination";
import AttendanceCorrections from "./AttendanceCorrections";
import { api, formatApiError } from "../../context/api";
import { useUser } from "../../context/UserContext";

const toDateInput = (date = new Date()) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);

const shiftDays = (dateKey, days) => {
  const base = new Date(`${dateKey}T00:00:00.000Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
};

const timeFormatter = new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" });
const dayFormatter = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", weekday: "short" });

const formatTime = (value) => (value ? timeFormatter.format(new Date(value)) : "--");

const formatDay = (dateKey) => dayFormatter.format(new Date(`${dateKey}T00:00:00`));

const formatDuration = (minutes) => {
  if (!Number.isFinite(minutes) || minutes <= 0) return "--";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}m`;
  if (!rest) return `${hours}h`;
  return `${hours}h ${rest}m`;
};

const formatDistance = (meters) => {
  const value = Number(meters);
  if (!Number.isFinite(value)) return "";
  return value >= 1000 ? `${(value / 1000).toFixed(2)} km` : `${Math.round(value)} m`;
};

const formatSource = (source = "") =>
  source
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ") || "Device scan";

const STATUS_META = {
  absent: { label: "Absent", tone: "border-rose-200 bg-rose-50 text-rose-800" },
  checked_out: { label: "Checked out", tone: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  holiday: { label: "Holiday", tone: "border-emerald-200 bg-white text-emerald-800" },
  in_office: { label: "In office", tone: "border-teal-200 bg-teal-50 text-teal-900" },
  late: { label: "Late", tone: "border-amber-200 bg-amber-50 text-amber-800" },
  off_day: { label: "Off day", tone: "border-slate-200 bg-slate-100 text-slate-600" },
};

const STATUS_FILTERS = [
  { label: "All statuses", value: "all" },
  { label: "Checked out", value: "checked_out" },
  { label: "In office", value: "in_office" },
  { label: "Late", value: "late" },
  { label: "Absent", value: "absent" },
  { label: "Holiday", value: "holiday" },
  { label: "Off day", value: "off_day" },
];

const RANGE_PRESETS = [
  { days: 0, label: "Today" },
  { days: 6, label: "Last 7 days" },
  { days: 29, label: "Last 30 days" },
];

const controlClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";

const FilterField = ({ children, icon, label }) => (
  <label className="block min-w-0">
    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
      {icon && createElement(icon, { className: "h-3.5 w-3.5 text-slate-400" })}
      {label}
    </span>
    <div className="mt-1.5">{children}</div>
  </label>
);

const emptyFilters = () => ({
  department: "all",
  from: toDateInput(),
  search: "",
  status: "all",
  to: toDateInput(),
  userId: "all",
});

const AttendancePortal = () => {
  const { user } = useUser();
  const canViewAll = Boolean(user?.permissions?.canViewAllAttendance);
  const canManageAttendance = Boolean(user?.permissions?.canManageAttendance);

  const [filters, setFilters] = useState(emptyFilters);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState(null);
  const [roster, setRoster] = useState([]);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingScans, setLoadingScans] = useState(false);
  const [scansExpanded, setScansExpanded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((current) => {
        if (current.search === searchInput) return current;
        setPage(1);
        return { ...current, search: searchInput };
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!canViewAll) return undefined;
    let active = true;
    api
      .getEmployees()
      .then(({ employees = [] }) => {
        if (active) setRoster(employees);
      })
      .catch(() => {
        if (active) setRoster([]);
      });
    return () => {
      active = false;
    };
  }, [canViewAll]);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getAttendanceSummary({
        department: filters.department === "all" ? "" : filters.department,
        from: filters.from,
        page,
        pageSize: PAGE_SIZE,
        search: filters.search.trim(),
        status: filters.status,
        to: filters.to,
        userId: filters.userId === "all" ? "" : filters.userId,
      });
      setSummary(result);
      setError("");
    } catch (requestError) {
      setSummary(null);
      setError(formatApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const loadScans = useCallback(async () => {
    if (!scansExpanded) return;
    setLoadingScans(true);
    try {
      const { scans: result = [] } = await api.getAttendanceScans({
        from: filters.from,
        to: filters.to,
        userId: filters.userId === "all" ? "" : filters.userId,
      });
      setScans(result);
    } catch {
      setScans([]);
    } finally {
      setLoadingScans(false);
    }
  }, [filters.from, filters.to, filters.userId, scansExpanded]);

  useEffect(() => {
    loadScans();
  }, [loadScans]);

  const departments = useMemo(
    () => [...new Set(roster.map((member) => member.department).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [roster],
  );

  const updateFilter = (name, value) => {
    setPage(1);
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const applyPreset = (days) => {
    const today = toDateInput();
    setPage(1);
    setFilters((current) => ({ ...current, from: shiftDays(today, -days), to: today }));
  };

  const clearFilters = () => {
    setPage(1);
    setSearchInput("");
    setFilters(emptyFilters());
  };

  const rules = summary?.rules;
  const totals = summary?.totals;
  const rows = summary?.rows || [];
  const pagination = summary?.pagination;
  const activeFilters = [
    filters.status !== "all",
    filters.userId !== "all",
    filters.department !== "all",
    Boolean(filters.search.trim()),
  ].filter(Boolean).length;

  const exportCsv = () => {
    const header = ["Date", "Staff", "Department", "Check in", "Status", "Check out", "Net minutes", "Late minutes", "Scans"];
    const lines = rows.map((row) =>
      [
        row.date,
        row.user.name,
        row.user.department || "",
        row.checkInAt ? new Date(row.checkInAt).toISOString() : "",
        STATUS_META[row.status]?.label || row.status,
        row.checkOutAt ? new Date(row.checkOutAt).toISOString() : "",
        row.netMinutes,
        row.lateMinutes,
        row.scanCount,
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `attendance-${filters.from}-to-${filters.to}.csv`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const metricTiles = [
    ["Checked in", totals?.checkedIn ?? 0, FiLogIn, "bg-teal-50 text-teal-800"],
    ["Late arrivals", totals?.late ?? 0, FiClock, "bg-amber-50 text-amber-800"],
    ["Checked out", totals?.checkedOut ?? 0, FiLogOut, "bg-emerald-50 text-emerald-800"],
    ["Absent", totals?.absent ?? 0, FiUserCheck, "bg-rose-50 text-rose-700"],
    ["Total office time", formatDuration(totals?.netMinutes ?? 0), FiActivity, "bg-slate-100 text-slate-700"],
  ];

  return (
    <AppShell
      title="Attendance"
      subtitle={
        canViewAll
          ? "Review verified attendance across every member and day, with exceptions and total working time."
          : "Review your verified attendance history and request corrections."
      }
    >
      <div className="space-y-5">
        <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-3 xl:grid-cols-5">
          {metricTiles.map(([label, value, Icon, tone]) => (
            <article className="bg-white px-4 py-4" key={label}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-1.5 truncate text-2xl font-bold text-slate-950">{loading ? "--" : value}</p>
                </div>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>
                  {createElement(Icon, { className: "h-4 w-4" })}
                </span>
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-800 ring-1 ring-emerald-100">
                <FiSliders className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-emerald-950">Attendance rules</p>
                <p className="mt-0.5 text-xs leading-5 text-emerald-900">
                  {rules
                    ? `Office ${rules.officeStart}-${rules.officeEnd} - ${rules.checkInGraceMinutes} min grace - checkout window ${rules.checkoutWindowStart}-${rules.checkoutWindowEnd} - ${rules.timezone}`
                    : "Loading the workspace attendance policy..."}
                </p>
              </div>
            </div>
            {user?.permissions?.canManageSettings && (
              <Link
                className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
                to="/settings#attendance-rules"
              >
                <FiSettings className="h-4 w-4" />
                Edit in settings
              </Link>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-950">Attendance register</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {summary
                  ? `${summary.range.from === summary.range.to ? formatDay(summary.range.from) : `${formatDay(summary.range.from)} to ${formatDay(summary.range.to)}`} - ${pagination?.total ?? 0} records`
                  : "Loading attendance records..."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {RANGE_PRESETS.map((preset) => (
                <button
                  className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                  key={preset.label}
                  onClick={() => applyPreset(preset.days)}
                  type="button"
                >
                  {preset.label}
                </button>
              ))}
              <button
                aria-label="Export current page to CSV"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-40"
                disabled={!rows.length}
                onClick={exportCsv}
                title="Export current page to CSV"
                type="button"
              >
                <FiDownload className="h-4 w-4" />
              </button>
              <button
                aria-label="Refresh attendance"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                onClick={loadSummary}
                title="Refresh attendance"
                type="button"
              >
                <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          <div className="border-b border-slate-200 bg-slate-50/70 p-4">
            <div className="grid gap-x-3 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
              <FilterField icon={FiCalendar} label="From date">
                <input
                  className={controlClass}
                  max={filters.to}
                  onChange={(event) => updateFilter("from", event.target.value)}
                  type="date"
                  value={filters.from}
                />
              </FilterField>
              <FilterField icon={FiCalendar} label="To date">
                <input
                  className={controlClass}
                  max={toDateInput()}
                  min={filters.from}
                  onChange={(event) => updateFilter("to", event.target.value)}
                  type="date"
                  value={filters.to}
                />
              </FilterField>
              <FilterField icon={FiFilter} label="Status">
                <select
                  className={controlClass}
                  onChange={(event) => updateFilter("status", event.target.value)}
                  value={filters.status}
                >
                  {STATUS_FILTERS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FilterField>

              {canViewAll && (
                <>
                  <FilterField icon={FiUsers} label="Employee">
                    <select
                      className={controlClass}
                      onChange={(event) => updateFilter("userId", event.target.value)}
                      value={filters.userId}
                    >
                      <option value="all">All employees</option>
                      {roster.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </FilterField>
                  <FilterField icon={FiLayers} label="Department">
                    <select
                      className={controlClass}
                      onChange={(event) => updateFilter("department", event.target.value)}
                      value={filters.department}
                    >
                      <option value="all">All departments</option>
                      {departments.map((department) => (
                        <option key={department} value={department}>
                          {department}
                        </option>
                      ))}
                    </select>
                  </FilterField>
                </>
              )}
            </div>

            {canViewAll && (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
                  <FiSearch className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search by employee name, email, department, or designation"
                    type="search"
                    value={searchInput}
                  />
                </label>
                {activeFilters > 0 && (
                  <button
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-3 text-xs font-bold text-emerald-800 transition hover:bg-emerald-50"
                    onClick={clearFilters}
                    type="button"
                  >
                    <FiX className="h-4 w-4" />
                    Clear {activeFilters} filter{activeFilters > 1 ? "s" : ""}
                  </button>
                )}
              </div>
            )}
          </div>

          {error && <div className="px-4 pt-4"><Alert message={error} type="error" /></div>}

          {loading ? (
            <div className="py-20 text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-700" />
              <p className="mt-4 text-sm font-semibold text-slate-500">Loading attendance...</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="py-20 text-center">
              <FiShield className="mx-auto h-8 w-8 text-slate-400" />
              <h3 className="mt-4 text-base font-bold text-slate-950">No attendance records in this view</h3>
              <p className="mt-1 text-sm text-slate-500">Widen the date range or clear the filters to see more.</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full table-fixed border-collapse text-left">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500">
                    <tr>
                      <th className="w-[13%] px-4 py-3">Date</th>
                      <th className="w-[24%] px-3 py-3">Staff</th>
                      <th className="w-[11%] px-3 py-3">Check in</th>
                      <th className="w-[14%] px-3 py-3">Status</th>
                      <th className="w-[11%] px-3 py-3">Check out</th>
                      <th className="w-[15%] px-3 py-3">Office time</th>
                      <th className="w-[12%] px-3 py-3">Scans</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row) => {
                      const meta = STATUS_META[row.status] || STATUS_META.off_day;
                      return (
                        <tr className="transition hover:bg-emerald-50/40" key={row.id}>
                          <td className="px-4 py-4 align-top">
                            <p className="text-sm font-bold text-slate-950">{formatDay(row.date)}</p>
                            <p className="mt-0.5 text-xs text-slate-400">{row.date}</p>
                          </td>
                          <td className="px-3 py-4 align-top">
                            <p className="truncate text-sm font-bold text-slate-950">{row.user.name}</p>
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              {row.user.designation || row.user.role} {row.user.department ? `- ${row.user.department}` : ""}
                            </p>
                          </td>
                          <td className="px-3 py-4 align-top text-sm font-semibold text-slate-700">
                            {formatTime(row.checkInAt)}
                          </td>
                          <td className="px-3 py-4 align-top">
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${meta.tone}`}>
                              {meta.label}
                            </span>
                            {row.lateMinutes > 0 && (
                              <p className="mt-1.5 text-xs font-semibold text-amber-700">
                                {formatDuration(row.lateMinutes)} late
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-4 align-top text-sm font-semibold text-slate-700">
                            {formatTime(row.checkOutAt)}
                          </td>
                          <td className="px-3 py-4 align-top">
                            <p className="text-sm font-bold text-slate-950">{formatDuration(row.netMinutes)}</p>
                            {row.grossMinutes > 0 && (
                              <p className="mt-0.5 text-xs text-slate-500">Gross {formatDuration(row.grossMinutes)}</p>
                            )}
                            {row.belowMinimumHours && (
                              <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-amber-700">
                                <FiAlertTriangle className="h-3.5 w-3.5" />
                                Short day
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-4 align-top text-sm font-semibold text-slate-600">{row.scanCount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 lg:hidden">
                {rows.map((row) => {
                  const meta = STATUS_META[row.status] || STATUS_META.off_day;
                  return (
                    <article className="p-4" key={row.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-950">{row.user.name}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{formatDay(row.date)}</p>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${meta.tone}`}>
                          {meta.label}
                        </span>
                      </div>
                      <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <dt className="font-semibold text-slate-400">In</dt>
                          <dd className="mt-0.5 font-bold text-slate-800">{formatTime(row.checkInAt)}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-slate-400">Out</dt>
                          <dd className="mt-0.5 font-bold text-slate-800">{formatTime(row.checkOutAt)}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-slate-400">Office time</dt>
                          <dd className="mt-0.5 font-bold text-slate-800">{formatDuration(row.netMinutes)}</dd>
                        </div>
                      </dl>
                    </article>
                  );
                })}
              </div>
            </>
          )}

          {pagination && (
            <Pagination
              firstItem={pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1}
              itemLabel="attendance records"
              lastItem={Math.min(pagination.page * pagination.pageSize, pagination.total)}
              onPageChange={setPage}
              page={pagination.page}
              total={pagination.total}
              totalPages={pagination.totalPages}
            />
          )}
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <button
            aria-expanded={scansExpanded}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50"
            onClick={() => setScansExpanded((current) => !current)}
            type="button"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <FiShield className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-950">Verified scan timeline</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Every accepted and rejected device scan in the selected range, with its verification source.
                </p>
              </div>
            </div>
            <FiChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${scansExpanded ? "rotate-180" : ""}`} />
          </button>

          {scansExpanded && (
            <div className="border-t border-slate-200">
              {loadingScans ? (
                <div className="py-16 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-700" />
                  <p className="mt-3 text-sm font-semibold text-slate-500">Loading scans...</p>
                </div>
              ) : scans.length === 0 ? (
                <div className="py-16 text-center">
                  <FiShield className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-3 text-sm font-semibold text-slate-500">No scans recorded in this range.</p>
                </div>
              ) : (
                <ScanTimeline scans={scans} />
              )}
            </div>
          )}
        </section>

        <AttendanceCorrections canManage={canManageAttendance} />
      </div>
    </AppShell>
  );
};

const ScanTimeline = ({ scans }) => {
  const [page, setPage] = useState(1);
  const ordered = useMemo(
    () => [...scans].sort((first, second) => new Date(second.scannedAt) - new Date(first.scannedAt)),
    [scans],
  );
  const totalPages = Math.max(1, Math.ceil(ordered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = ordered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      <ul className="divide-y divide-slate-100">
        {visible.map((scan) => (
          <li className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between" key={scan.id}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    scan.direction === "in" ? "bg-teal-100 text-teal-800" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {scan.direction === "in" ? "Entry" : "Exit"}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    scan.accepted === false ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {scan.accepted === false ? "Rejected" : "Accepted"}
                </span>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200">
                  {formatSource(scan.source)}
                </span>
                {formatDistance(scan.distanceMeters) && (
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200">
                    {formatDistance(scan.distanceMeters)} from {scan.office?.name || "office"}
                  </span>
                )}
              </div>
              <p className="mt-2 truncate text-sm font-bold text-slate-950">{scan.user?.name || "Unknown staff"}</p>
              {scan.rejectionReason && (
                <p className="mt-1 text-xs font-semibold text-rose-700">{scan.rejectionReason}</p>
              )}
            </div>
            <div className="shrink-0 text-left sm:text-right">
              <p className="text-sm font-bold text-slate-950">{formatTime(scan.scannedAt)}</p>
              <p className="mt-0.5 text-xs text-slate-500">{formatDay(scan.scannedAt.slice(0, 10))}</p>
            </div>
          </li>
        ))}
      </ul>
      <Pagination
        firstItem={(currentPage - 1) * PAGE_SIZE + 1}
        itemLabel="scans"
        lastItem={Math.min(currentPage * PAGE_SIZE, ordered.length)}
        onPageChange={setPage}
        page={currentPage}
        total={ordered.length}
        totalPages={totalPages}
      />
    </>
  );
};

export default AttendancePortal;
