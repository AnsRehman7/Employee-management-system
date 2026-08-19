import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiGlobe,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiSettings,
  FiSliders,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { useLocation } from "react-router-dom";
import Alert from "./Alert";
import { useToast } from "../context/ToastContext";
import AppShell from "./AppShell";
import { CardSkeleton } from "./Skeleton";
import BrowserNotificationSettings from "./BrowserNotificationSettings";
import SettingsNavigation from "./SettingsNavigation";
import WorkspaceOfficesSettings from "./WorkspaceOfficesSettings";
import { api, formatApiError } from "../context/api";
import { useUser } from "../context/UserContext";

const fieldClass =
  "mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100";
const TIMEZONES = [
  "Asia/Karachi",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "UTC",
];
const WEEKDAYS = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
];

const initialForm = {
  checkInGraceMinutes: 60,
  checkoutWindowEnd: "18:00",
  checkoutWindowStart: "16:00",
  departments: [],
  holidays: [],
  minimumOfficeMinutes: 360,
  name: "",
  timezone: "Asia/Karachi",
  weekStartsOn: 1,
  workingDays: [1, 2, 3, 4, 5],
  workdayEnd: "18:00",
  workdayStart: "09:00",
};

const WorkspaceSettingsPage = () => {
  const location = useLocation();
  const { setUser, user } = useUser();
  const toast = useToast();
  const canManageWorkspace = Boolean(user?.permissions?.canManageSettings);
  const [form, setForm] = useState(initialForm);
  const [organization, setOrganization] = useState(null);
  const [usage, setUsage] = useState(null);
  const [offices, setOffices] = useState([]);
  const [department, setDepartment] = useState("");
  const [holiday, setHoliday] = useState("");
  const [loading, setLoading] = useState(canManageWorkspace);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState({ message: "", type: "info" });

  const timezoneOptions = useMemo(
    () => [...new Set([form.timezone, ...TIMEZONES].filter(Boolean))],
    [form.timezone],
  );

  const applySettings = ({ offices: nextOffices = [], organization: nextOrganization, usage: nextUsage }) => {
    setOrganization(nextOrganization);
    setUsage(nextUsage);
    setOffices(nextOffices);
    setForm({
      checkInGraceMinutes: nextOrganization.checkInGraceMinutes ?? 60,
      checkoutWindowEnd: nextOrganization.checkoutWindowEnd || "18:00",
      checkoutWindowStart: nextOrganization.checkoutWindowStart || "16:00",
      departments: nextOrganization.departments || [],
      holidays: nextOrganization.holidays || [],
      minimumOfficeMinutes: nextOrganization.minimumOfficeMinutes ?? 360,
      name: nextOrganization.name || "",
      timezone: nextOrganization.timezone || "Asia/Karachi",
      weekStartsOn: nextOrganization.weekStartsOn ?? 1,
      workingDays: nextOrganization.workingDays?.length ? nextOrganization.workingDays : [1, 2, 3, 4, 5],
      workdayEnd: nextOrganization.workdayEnd || "18:00",
      workdayStart: nextOrganization.workdayStart || "09:00",
    });
  };

  const loadSettings = useCallback(async () => {
    if (!canManageWorkspace) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotice({ message: "", type: "info" });
    try {
      applySettings(await api.getWorkspaceSettings());
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
    } finally {
      setLoading(false);
    }
  }, [canManageWorkspace]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (!location.hash) return;
    const target = window.setTimeout(() => {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
    return () => window.clearTimeout(target);
  }, [loading, location.hash]);

  const numericFields = ["checkInGraceMinutes", "minimumOfficeMinutes", "weekStartsOn"];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: numericFields.includes(name) ? Number(value) : value,
    }));
  };

  const addDepartment = () => {
    const nextDepartment = department.trim();
    if (!nextDepartment) return;
    setForm((current) => ({
      ...current,
      departments: current.departments.some((item) => item.toLowerCase() === nextDepartment.toLowerCase())
        ? current.departments
        : [...current.departments, nextDepartment].sort((a, b) => a.localeCompare(b)),
    }));
    setDepartment("");
  };

  const addHoliday = () => {
    if (!holiday) return;
    setForm((current) => ({ ...current, holidays: [...new Set([...current.holidays, holiday])].sort() }));
    setHoliday("");
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    if (!form.workingDays.length) {
      setNotice({ message: "Choose at least one working day.", type: "error" });
      return;
    }
    if (form.workdayStart >= form.workdayEnd) {
      setNotice({ message: "Workday end must be later than workday start.", type: "error" });
      return;
    }
    if (form.checkoutWindowStart >= form.checkoutWindowEnd) {
      setNotice({ message: "The checkout window must end later than it starts.", type: "error" });
      return;
    }

    setSaving(true);
    setNotice({ message: "", type: "info" });
    try {
      const result = await api.updateWorkspaceSettings(form);
      applySettings(result);
      setUser((current) => current ? { ...current, organization: { ...current.organization, ...result.organization } } : current);
      setNotice({ message: "Workspace settings updated successfully.", type: "success" });
      toast.success("Workspace settings saved");
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
      toast.error("Could not save settings", formatApiError(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Settings" subtitle="Manage your account preferences, workspace configuration, people, and governance.">
      <div className="grid items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <SettingsNavigation />
        <div className="space-y-6">
          {canManageWorkspace && (
            <form className="space-y-6 scroll-mt-28" id="workspace" onSubmit={saveSettings}>
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800"><FiSettings className="h-5 w-5" /></span><div><p className="text-sm font-bold text-slate-900">Administration</p><p className="text-xs text-slate-500">Changes apply across reports, attendance, projects, and users.</p></div></div>
          <div className="flex gap-2"><button aria-label="Reload workspace settings" className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50" onClick={loadSettings} title="Reload settings" type="button"><FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button><button className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:bg-slate-300" disabled={loading || saving} type="submit"><FiSave className="h-4 w-4" />{saving ? "Saving..." : "Save settings"}</button></div>
        </div>

        <Alert message={notice.message} type={notice.type} />

        {loading && !organization ? (
          <section className="rounded-lg border border-slate-200 bg-white py-24 text-center shadow-sm"><CardSkeleton label="Loading workspace settings" lines={4} /></section>
        ) : organization ? (
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 text-teal-800"><FiBriefcase className="h-4 w-4" /></span><div><h2 className="text-base font-bold text-slate-950">Workspace identity</h2><p className="text-sm text-slate-500">The organization name displayed throughout DayMark.</p></div></div></div>
                <div className="grid gap-5 p-5 md:grid-cols-2"><label className="block"><span className="text-sm font-bold text-slate-700">Workspace name</span><input className={fieldClass} maxLength="160" name="name" onChange={handleChange} required value={form.name} /></label><label className="block"><span className="text-sm font-bold text-slate-700">Workspace slug</span><input className={`${fieldClass} cursor-not-allowed text-slate-500`} disabled value={organization.slug} /></label></div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800"><FiClock className="h-4 w-4" /></span><div><h2 className="text-base font-bold text-slate-950">Working calendar</h2><p className="text-sm text-slate-500">Used for capacity, attendance, and delivery reporting.</p></div></div></div>
                <div className="grid gap-5 p-5 md:grid-cols-2">
                  <label className="block md:col-span-2"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiGlobe className="h-4 w-4 text-slate-400" />Timezone</span><select className={fieldClass} name="timezone" onChange={handleChange} value={form.timezone}>{timezoneOptions.map((timezone) => <option key={timezone} value={timezone}>{timezone}</option>)}</select></label>
                  <label className="block"><span className="text-sm font-bold text-slate-700">Workday starts</span><input className={fieldClass} name="workdayStart" onChange={handleChange} required type="time" value={form.workdayStart} /></label>
                  <label className="block"><span className="text-sm font-bold text-slate-700">Workday ends</span><input className={fieldClass} name="workdayEnd" onChange={handleChange} required type="time" value={form.workdayEnd} /></label>
                  <label className="block md:col-span-2"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiCalendar className="h-4 w-4 text-slate-400" />Week starts on</span><select className={fieldClass} name="weekStartsOn" onChange={handleChange} value={form.weekStartsOn}>{WEEKDAYS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}</select></label>
                  <fieldset className="md:col-span-2"><legend className="text-sm font-bold text-slate-700">Working days</legend><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{WEEKDAYS.map((day) => { const checked = form.workingDays.includes(day.value); return <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold ${checked ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-500"}`} key={day.value}><input checked={checked} className="h-4 w-4 accent-emerald-700" onChange={(event) => setForm((current) => ({ ...current, workingDays: event.target.checked ? [...current.workingDays, day.value].sort() : current.workingDays.filter((value) => value !== day.value) }))} type="checkbox" />{day.label.slice(0, 3)}</label>; })}</div></fieldset>
                  <div className="md:col-span-2"><span className="text-sm font-bold text-slate-700">Company holidays</span><div className="mt-2 flex gap-2"><input className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" onChange={(event) => setHoliday(event.target.value)} type="date" value={holiday} /><button aria-label="Add holiday" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white hover:bg-slate-800" onClick={addHoliday} title="Add holiday" type="button"><FiPlus /></button></div><div className="mt-3 flex flex-wrap gap-2">{form.holidays.map((date) => <span className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-600" key={date}>{new Date(`${date}T00:00:00`).toLocaleDateString()}<button aria-label={`Remove holiday ${date}`} className="text-slate-400 hover:text-rose-600" onClick={() => setForm((current) => ({ ...current, holidays: current.holidays.filter((item) => item !== date) }))} title="Remove holiday" type="button"><FiX /></button></span>)}</div></div>
                </div>
              </section>

              <section className="scroll-mt-28 rounded-lg border border-slate-200 bg-white shadow-sm" id="attendance-rules">
                <div className="border-b border-slate-200 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800"><FiSliders className="h-4 w-4" /></span>
                    <div>
                      <h2 className="text-base font-bold text-slate-950">Attendance rules</h2>
                      <p className="text-sm text-slate-500">The first scan of the day is the check-in. The latest exit scan inside the checkout window is the checkout.</p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-5 p-5 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">Check-in grace period</span>
                    <div className="relative">
                      <input className={`${fieldClass} pr-20`} max="720" min="0" name="checkInGraceMinutes" onChange={handleChange} required step="5" type="number" value={form.checkInGraceMinutes} />
                      <span className="pointer-events-none absolute bottom-0 right-3.5 flex h-11 items-center text-xs font-bold text-slate-400">minutes</span>
                    </div>
                    <span className="mt-1.5 block text-xs text-slate-500">Arrivals after {form.workdayStart} plus this grace period are marked late.</span>
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">Minimum office time</span>
                    <div className="relative">
                      <input className={`${fieldClass} pr-20`} max="1440" min="0" name="minimumOfficeMinutes" onChange={handleChange} required step="15" type="number" value={form.minimumOfficeMinutes} />
                      <span className="pointer-events-none absolute bottom-0 right-3.5 flex h-11 items-center text-xs font-bold text-slate-400">minutes</span>
                    </div>
                    <span className="mt-1.5 block text-xs text-slate-500">Completed days below this total are flagged as a short day.</span>
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">Checkout window opens</span>
                    <input className={fieldClass} name="checkoutWindowStart" onChange={handleChange} required type="time" value={form.checkoutWindowStart} />
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">Checkout window closes</span>
                    <input className={fieldClass} name="checkoutWindowEnd" onChange={handleChange} required type="time" value={form.checkoutWindowEnd} />
                  </label>
                  <p className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-900 md:col-span-2">
                    These rules drive the attendance register for every member. Attendance itself is recorded only by verified device scans inside a configured office geofence; adjustments go through attendance corrections so every change stays auditable.
                  </p>
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700"><FiUsers className="h-4 w-4" /></span><div><h2 className="text-base font-bold text-slate-950">Departments</h2><p className="text-sm text-slate-500">Reusable organization structure for users, projects, and reports.</p></div></div></div>
                <div className="p-5"><div className="flex gap-2"><input className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" maxLength="80" onChange={(event) => setDepartment(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addDepartment(); } }} placeholder="Add a department" value={department} /><button aria-label="Add department" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white transition hover:bg-slate-800" onClick={addDepartment} title="Add department" type="button"><FiPlus className="h-4 w-4" /></button></div><div className="mt-4 flex flex-wrap gap-2">{form.departments.map((item) => <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700" key={item}>{item}<button aria-label={`Remove ${item}`} className="text-slate-400 transition hover:text-rose-600" onClick={() => setForm((current) => ({ ...current, departments: current.departments.filter((value) => value !== item) }))} title={`Remove ${item}`} type="button"><FiX className="h-4 w-4" /></button></span>)}{!form.departments.length && <p className="py-4 text-sm text-slate-500">No departments configured yet.</p>}</div></div>
              </section>
            </div>

            <aside className="space-y-5 xl:sticky xl:top-28">
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase text-slate-400">Workspace usage</p><div className="mt-4 divide-y divide-slate-100"><div className="flex items-center justify-between py-3"><span className="flex items-center gap-2 text-sm font-semibold text-slate-600"><FiUsers className="h-4 w-4" />Active members</span><span className="font-bold text-slate-950">{usage?.activeMembers || 0}</span></div><div className="flex items-center justify-between py-3"><span className="flex items-center gap-2 text-sm font-semibold text-slate-600"><FiBriefcase className="h-4 w-4" />Active projects</span><span className="font-bold text-slate-950">{usage?.activeProjects || 0}</span></div><div className="flex items-center justify-between py-3"><span className="flex items-center gap-2 text-sm font-semibold text-slate-600"><FiCheckCircle className="h-4 w-4" />Open tasks</span><span className="font-bold text-slate-950">{usage?.openTasks || 0}</span></div></div></section>
              <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5"><p className="text-xs font-bold uppercase text-emerald-700">{organization.plan.replaceAll("_", " ")}</p><h2 className="mt-2 text-lg font-bold text-emerald-950">{organization.status === "trial" ? "Trial workspace" : "Active workspace"}</h2><p className="mt-2 text-sm leading-6 text-emerald-900">{organization.trialEndsAt ? `Trial period ends ${new Date(organization.trialEndsAt).toLocaleDateString()}.` : "Workspace billing is managed by the super admin."}</p></section>
            </aside>
          </div>
        ) : null}
            </form>
          )}
          {canManageWorkspace && <WorkspaceOfficesSettings initialOffices={offices} />}
          <BrowserNotificationSettings />
        </div>
      </div>
    </AppShell>
  );
};

export default WorkspaceSettingsPage;
