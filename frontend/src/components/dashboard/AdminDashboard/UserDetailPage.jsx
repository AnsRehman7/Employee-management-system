import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiArrowLeft,
  FiBriefcase,
  FiCheckCircle,
  FiLayers,
  FiLock,
  FiMail,
  FiPhone,
  FiRefreshCw,
  FiSave,
  FiShield,
  FiSlash,
  FiUser,
} from "react-icons/fi";
import { Link, useLocation, useParams } from "react-router-dom";
import Alert from "../../Alert";
import AppShell from "../../AppShell";
import CustomFieldsForm from "../../CustomFieldsForm";
import { api, formatApiError } from "../../../context/api";
import { useUser } from "../../../context/UserContext";
import { useRoles } from "../../../hooks/useRoles";
import { initialsFor, labelForValue } from "./workUtils";
import {
  canEditWorkspaceUser,
  USER_STATUS_STYLES,
} from "./userUtils";

const fieldClass =
  "mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const formFromUser = (member) => ({
  avatarUrl: member?.avatarUrl || "",
  contact: member?.contact || "",
  customFields: member?.customFields || {},
  department: member?.department || "",
  designation: member?.designation || "",
  email: member?.email || "",
  fullName: member?.name || "",
  password: "",
  role: member?.role || "employee",
  skills: (member?.skills || []).join(", "),
  weeklyCapacityHours: member?.weeklyCapacityHours || 40,
});

const UserDetailPage = () => {
  const { userId } = useParams();
  const location = useLocation();
  const { user: currentUser } = useUser();
  const { assignableRoles, labelFor } = useRoles();
  const [member, setMember] = useState(null);
  const [formData, setFormData] = useState(formFromUser());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [notice, setNotice] = useState(location.state?.notice || "");
  const [error, setError] = useState("");
  const [moduleDefinition, setModuleDefinition] = useState(null);

  const loadMember = useCallback(async ({ showLoading = false } = {}) => {
    if (showLoading) setLoading(true);
    try {
      const [{ user }, { module }] = await Promise.all([
        api.getUser(userId),
        api.getCustomModule("users"),
      ]);
      setMember(user);
      setModuleDefinition(module);
      setFormData(formFromUser(user));
      setError("");
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadMember({ showLoading: true });
  }, [loadMember]);

  const canEdit = canEditWorkspaceUser(currentUser, member);
  const isSelf = currentUser?.id === member?.id;
  const fieldVisible = (key) => {
    const field = moduleDefinition?.fields.find((item) => item.systemFieldKey === key);
    return !field?.archived && field?.isVisible !== false;
  };
  const fieldRequired = (key) =>
    Boolean(moduleDefinition?.fields.find((field) => field.systemFieldKey === key)?.isRequired);
  const roleOptions = useMemo(() => {
    const options = assignableRoles.map((role) => ({ label: role.name, value: role.key }));
    // Keep the member's current role visible even when the actor cannot assign it,
    // so the select never silently reads as something the member is not.
    if (!formData.role || options.some((option) => option.value === formData.role)) return options;
    return [{ label: labelFor(formData.role), value: formData.role }, ...options];
  }, [assignableRoles, formData.role, labelFor]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        ...formData,
        skills: formData.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
      };
      if (!payload.password) delete payload.password;
      const { user } = await api.updateUser(userId, payload);
      setMember(user);
      setFormData(formFromUser(user));
      setNotice("User details updated successfully.");
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!canEdit || isSelf) return;
    const nextStatus = member.status === "active" ? "suspended" : "active";
    if (nextStatus === "suspended" && !window.confirm("Suspend this account and block future sign-in?")) return;

    setStatusBusy(true);
    setError("");
    setNotice("");
    try {
      const { user } = await api.updateUser(userId, { status: nextStatus });
      setMember(user);
      setFormData(formFromUser(user));
      setNotice(nextStatus === "active" ? "User account reactivated." : "User account suspended.");
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      setStatusBusy(false);
    }
  };

  if (loading) {
    return <AppShell title="User details" subtitle="Loading workspace account information."><div className="py-24 text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-700" /><p className="mt-4 text-sm font-semibold text-slate-500">Loading user...</p></div></AppShell>;
  }

  if (!member) {
    return <AppShell title="User details"><div className="rounded-lg border border-slate-200 bg-white p-6"><Alert message={error || "User not found."} type="error" /><Link className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-emerald-800" to="/users"><FiArrowLeft className="h-4 w-4" />Back to users</Link></div></AppShell>;
  }

  return (
    <AppShell title={member.name} subtitle="Review profile information, workspace access, and account status.">
      <form className="space-y-5" onSubmit={handleSave}>
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <Link className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-emerald-800" to="/users"><FiArrowLeft className="h-4 w-4" />Back to users</Link>
          <div className="flex gap-2">
            <button aria-label="Refresh user" className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50" onClick={() => loadMember({ showLoading: true })} title="Refresh user" type="button"><FiRefreshCw className="h-4 w-4" /></button>
            {canEdit && <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-800 disabled:bg-slate-300" disabled={saving} type="submit"><FiSave className="h-4 w-4" />{saving ? "Saving..." : "Save changes"}</button>}
          </div>
        </div>

        <Alert message={error} type="error" />
        <Alert message={notice} type="success" />
        {!canEdit && <Alert message="You can view this account, but your role cannot modify it." type="info" />}

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 text-teal-800"><FiUser className="h-4 w-4" /></span><div><h2 className="text-base font-bold text-slate-950">Profile information</h2><p className="text-sm text-slate-500">Identity and team details used throughout StaffFlow.</p></div></div></div>
            <div className="space-y-5 p-5">
              <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiUser className="h-4 w-4 text-slate-400" />Full name</span><input className={fieldClass} disabled={!canEdit} maxLength="120" name="fullName" onChange={handleChange} required value={formData.fullName} /></label>
              <label className="block"><span className="text-sm font-bold text-slate-700">Avatar URL</span><input className={fieldClass} disabled={!canEdit} maxLength="2048" name="avatarUrl" onChange={handleChange} placeholder="https://..." type="url" value={formData.avatarUrl} /></label>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiMail className="h-4 w-4 text-slate-400" />Work email</span><input className={fieldClass} disabled={!canEdit} maxLength="255" name="email" onChange={handleChange} required type="email" value={formData.email} /></label>
                {fieldVisible("contact") && <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiPhone className="h-4 w-4 text-slate-400" />Contact number</span><input className={fieldClass} disabled={!canEdit} maxLength="40" name="contact" onChange={handleChange} placeholder="Not provided" required={fieldRequired("contact")} type="tel" value={formData.contact} /></label>}
              </div>
              <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
                <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiActivity className="h-4 w-4 text-slate-400" />Skills</span><input className={fieldClass} disabled={!canEdit} maxLength="1200" name="skills" onChange={handleChange} placeholder="React, PostgreSQL, QA" value={formData.skills} /></label>
                <label className="block"><span className="text-sm font-bold text-slate-700">Weekly capacity</span><div className="relative"><input className={`${fieldClass} pr-16`} disabled={!canEdit} max="168" min="1" name="weeklyCapacityHours" onChange={handleChange} step="0.5" type="number" value={formData.weeklyCapacityHours} /><span className="pointer-events-none absolute bottom-3 right-3 text-xs font-bold text-slate-400">hours</span></div></label>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {fieldVisible("designation") && <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiBriefcase className="h-4 w-4 text-slate-400" />Designation</span><input className={fieldClass} disabled={!canEdit} maxLength="120" name="designation" onChange={handleChange} placeholder="Not assigned" required={fieldRequired("designation")} value={formData.designation} /></label>}
                {fieldVisible("department") && <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiLayers className="h-4 w-4 text-slate-400" />Department</span><input className={fieldClass} disabled={!canEdit} maxLength="120" name="department" onChange={handleChange} placeholder="Not assigned" required={fieldRequired("department")} value={formData.department} /></label>}
              </div>
              {canEdit && <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiLock className="h-4 w-4 text-slate-400" />Set new password</span><input className={fieldClass} maxLength="128" minLength="12" name="password" onChange={handleChange} placeholder="Leave blank to keep the current password" type="password" value={formData.password} /><span className="mt-1.5 block text-xs text-slate-400">Only enter a value when the member needs an administrator-assisted reset.</span></label>}
            </div>
            </section>
            <CustomFieldsForm
              disabled={!canEdit}
              fields={moduleDefinition?.fields}
              onChange={(customFields) => setFormData((current) => ({ ...current, customFields }))}
              values={formData.customFields}
            />
          </div>

          <aside className="space-y-5">
            <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="p-5 text-center">{member.avatarUrl ? <img alt="" className="mx-auto h-16 w-16 rounded-lg object-cover ring-1 ring-slate-200" src={member.avatarUrl} /> : <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-teal-100 text-lg font-bold text-teal-900">{initialsFor(member.name)}</span>}<h2 className="mt-3 text-lg font-bold text-slate-950">{member.name}</h2><p className="mt-1 truncate text-sm text-slate-500">{member.email}</p><div className="mt-3 flex flex-wrap justify-center gap-2"><span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-900">{member.roleName || labelForValue(member.role)}</span><span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${USER_STATUS_STYLES[member.status] || USER_STATUS_STYLES.active}`}>{labelForValue(member.status)}</span>{isSelf && <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-900">Your account</span>}</div></div>
              <div className="border-t border-slate-200 p-5"><label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiShield className="h-4 w-4 text-emerald-700" />Workspace role</span><select className={fieldClass} disabled={!canEdit} name="role" onChange={handleChange} value={formData.role}>{roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label></div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${member.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{member.status === "active" ? <FiCheckCircle className="h-4 w-4" /> : <FiSlash className="h-4 w-4" />}</span><div><h2 className="text-sm font-bold text-slate-950">Account status</h2><p className="mt-1 text-xs leading-5 text-slate-500">{member.status === "active" ? "The member can sign in and access permitted workspace modules." : "Sign-in is blocked until this account is reactivated."}</p></div></div>
              {canEdit && !isSelf && <button className={`mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border px-3 text-sm font-bold transition disabled:opacity-60 ${member.status === "active" ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100" : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`} disabled={statusBusy} onClick={handleStatusToggle} type="button">{member.status === "active" ? <FiSlash className="h-4 w-4" /> : <FiCheckCircle className="h-4 w-4" />}{statusBusy ? "Updating..." : member.status === "active" ? "Suspend account" : "Reactivate account"}</button>}
            </section>
          </aside>
        </div>
      </form>
    </AppShell>
  );
};

export default UserDetailPage;
