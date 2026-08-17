import { useEffect, useState } from "react";
import {
  FiActivity,
  FiArrowLeft,
  FiBriefcase,
  FiLayers,
  FiMail,
  FiPhone,
  FiPlus,
  FiShield,
  FiUser,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import Alert from "../../Alert";
import AppShell from "../../AppShell";
import CustomFieldsForm from "../../CustomFieldsForm";
import { api, formatApiError } from "../../../context/api";
import { useRoles } from "../../../hooks/useRoles";

const initialForm = {
  avatarUrl: "",
  contact: "",
  customFields: {},
  department: "",
  designation: "",
  email: "",
  fullName: "",
  role: "employee",
  skills: "",
  weeklyCapacityHours: 40,
};

const fieldClass =
  "mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100";

const UserCreatePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [moduleDefinition, setModuleDefinition] = useState(null);
  const { assignableRoles } = useRoles();

  useEffect(() => {
    let active = true;
    api
      .getCustomModule("users")
      .then(({ module }) => {
        if (active) setModuleDefinition(module);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };
  const fieldVisible = (key) =>
    !moduleDefinition?.fields.find((field) => field.systemFieldKey === key)?.archived &&
    moduleDefinition?.fields.find((field) => field.systemFieldKey === key)?.isVisible !== false;
  const fieldRequired = (key) =>
    Boolean(moduleDefinition?.fields.find((field) => field.systemFieldKey === key)?.isRequired);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...formData,
        skills: formData.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
      };
      const { user } = await api.createUser(payload);
      navigate(`/users/${user.id}`, {
        replace: true,
        state: {
          notice: `User account created. ${formData.email} can sign in right away by requesting a one-time code on the login page.`,
        },
      });
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Add user" subtitle="Create a workspace login and set the member's initial access level and team profile.">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <Link className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-emerald-800" to="/users"><FiArrowLeft className="h-4 w-4" />Back to users</Link>
          <div className="flex gap-2">
            <Link className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50" to="/users">Cancel</Link>
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-800 disabled:bg-slate-300" disabled={saving} type="submit"><FiPlus className="h-4 w-4" />{saving ? "Creating..." : "Create user"}</button>
          </div>
        </div>

        <Alert message={error} type="error" />

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 text-teal-800"><FiUser className="h-4 w-4" /></span><div><h2 className="text-base font-bold text-slate-950">Identity and profile</h2><p className="text-sm text-slate-500">The information shown across assignments, attendance, and reports.</p></div></div>
            </div>
            <div className="space-y-5 p-5">
              <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiUser className="h-4 w-4 text-slate-400" />Full name</span><input autoFocus className={fieldClass} maxLength="120" name="fullName" onChange={handleChange} placeholder="Ayesha Noor" required value={formData.fullName} /></label>
              <label className="block"><span className="text-sm font-bold text-slate-700">Avatar URL</span><input className={fieldClass} maxLength="2048" name="avatarUrl" onChange={handleChange} placeholder="https://..." type="url" value={formData.avatarUrl} /></label>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiMail className="h-4 w-4 text-slate-400" />Work email</span><input className={fieldClass} maxLength="255" name="email" onChange={handleChange} placeholder="ayesha@company.com" required type="email" value={formData.email} /></label>
                <label className="block"><span className="text-sm font-bold text-slate-700">Weekly capacity</span><div className="relative"><input className={`${fieldClass} pr-16`} max="168" min="1" name="weeklyCapacityHours" onChange={handleChange} step="0.5" type="number" value={formData.weeklyCapacityHours} /><span className="pointer-events-none absolute bottom-3 right-3 text-xs font-bold text-slate-400">hours</span></div></label>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {fieldVisible("designation") && <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiBriefcase className="h-4 w-4 text-slate-400" />Designation</span><input className={fieldClass} maxLength="120" name="designation" onChange={handleChange} placeholder="Operations Manager" required={fieldRequired("designation")} value={formData.designation} /></label>}
                {fieldVisible("department") && <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiLayers className="h-4 w-4 text-slate-400" />Department</span><input className={fieldClass} maxLength="120" name="department" onChange={handleChange} placeholder="Operations" required={fieldRequired("department")} value={formData.department} /></label>}
              </div>
              {fieldVisible("contact") && <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiPhone className="h-4 w-4 text-slate-400" />Contact number</span><input className={fieldClass} maxLength="40" name="contact" onChange={handleChange} placeholder="+92 300 1234567" required={fieldRequired("contact")} type="tel" value={formData.contact} /></label>}
              <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiActivity className="h-4 w-4 text-slate-400" />Skills</span><input className={fieldClass} maxLength="1200" name="skills" onChange={handleChange} placeholder="React, PostgreSQL, QA" value={formData.skills} /><span className="mt-1.5 block text-xs text-slate-400">Separate skills with commas for capacity-aware planning.</span></label>
            </div>
            </section>
            <CustomFieldsForm
              fields={moduleDefinition?.fields}
              onChange={(customFields) => setFormData((current) => ({ ...current, customFields }))}
              values={formData.customFields}
            />
          </div>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800"><FiShield className="h-4 w-4" /></span><div><h2 className="text-base font-bold text-slate-950">Access</h2><p className="text-sm text-slate-500">Choose the member's workspace permissions.</p></div></div></div>
            <div className="space-y-5 p-5">
              <label className="block"><span className="text-sm font-bold text-slate-700">Role</span><select className={fieldClass} name="role" onChange={handleChange} value={formData.role}>{assignableRoles.map((role) => <option key={role.id} value={role.key}>{role.name}</option>)}</select></label>
              <div className="border-y border-slate-200 py-4"><div className="flex items-start gap-3"><FiShield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /><div><p className="text-sm font-bold text-slate-900">Active on creation</p><p className="mt-1 text-xs leading-5 text-slate-500">The account can sign in immediately after Firebase and the workspace profile are created.</p></div></div></div>
              <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-800 disabled:bg-slate-300" disabled={saving} type="submit"><FiPlus className="h-4 w-4" />{saving ? "Creating user..." : "Create user"}</button>
            </div>
          </section>
        </div>
      </form>
    </AppShell>
  );
};

export default UserCreatePage;
