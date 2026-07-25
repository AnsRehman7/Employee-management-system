import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiArchive,
  FiCheck,
  FiDatabase,
  FiEdit2,
  FiGrid,
  FiLock,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiSliders,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import Alert from "./Alert";
import AppShell from "./AppShell";
import SettingsNavigation from "./SettingsNavigation";
import { api, formatApiError } from "../context/api";

const inputClass =
  "mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-950 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100";
const textareaClass =
  "mt-2 min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm leading-6 text-slate-950 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100";
const ROLES = [
  { label: "Super admin", value: "super_admin" },
  { label: "Admin", value: "admin" },
  { label: "Manager", value: "manager" },
  { label: "HR", value: "hr" },
  { label: "Accounts", value: "accounts" },
  { label: "Employee", value: "employee" },
];
const FIELD_TYPES = [
  ["text", "Short text"],
  ["long_text", "Long text"],
  ["integer", "Integer"],
  ["decimal", "Decimal"],
  ["boolean", "Yes / no"],
  ["date", "Date"],
  ["datetime", "Date and time"],
  ["email", "Email"],
  ["phone", "Phone"],
  ["url", "URL"],
  ["select", "Single select"],
  ["multi_select", "Multi select"],
  ["user", "Team member"],
];
const ICONS = [
  ["database", "Database"],
  ["grid", "Grid"],
  ["layers", "Layers"],
  ["package", "Package"],
  ["clipboard", "Clipboard"],
  ["truck", "Operations"],
  ["dollar-sign", "Finance"],
  ["heart", "People"],
];

const slugify = (value, separator = "_") =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, separator)
    .replace(new RegExp(`^${separator}+|${separator}+$`, "g"), "")
    .slice(0, 48);

const emptyField = {
  description: "",
  isRequired: false,
  isVisible: true,
  key: "",
  label: "",
  max: "",
  maxLength: "",
  min: "",
  minLength: "",
  optionsText: "",
  placeholder: "",
  type: "text",
};
const emptyModule = {
  description: "",
  icon: "database",
  key: "",
  pluralName: "",
  singularName: "",
};

const FieldDialog = ({ field, module, onClose, onSaved }) => {
  const editing = Boolean(field);
  const [form, setForm] = useState(() =>
    field
      ? {
          ...emptyField,
          ...field,
          max: field.validation?.max ?? "",
          maxLength: field.validation?.maxLength ?? "",
          min: field.validation?.min ?? "",
          minLength: field.validation?.minLength ?? "",
          optionsText: (field.options || []).map((option) => option.label).join("\n"),
        }
      : emptyField,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const optionField = ["select", "multi_select"].includes(form.type) && !field?.isSystem;
  const locked = Boolean(field?.isLocked);

  const change = (name, value) => {
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (!editing && name === "label" && (!current.key || current.key === slugify(current.label))) {
        next.key = slugify(value);
      }
      return next;
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const options = optionField
      ? form.optionsText
          .split("\n")
          .map((label) => label.trim())
          .filter(Boolean)
          .map((label) => ({ label, value: slugify(label) }))
      : undefined;
    const validation = Object.fromEntries(
      ["min", "max", "minLength", "maxLength"]
        .filter((key) => form[key] !== "")
        .map((key) => [key, Number(form[key])]),
    );
    const payload = {
      description: form.description,
      isRequired: form.isRequired,
      isVisible: form.isVisible,
      key: form.key,
      label: form.label,
      options,
      placeholder: form.placeholder,
      type: form.type,
      validation,
    };
    try {
      if (editing) await api.updateCustomField(module.id, field.id, payload);
      else await api.createCustomField(module.id, payload);
      await onSaved();
      onClose();
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-6">
      <form className="max-h-[92vh] w-full overflow-y-auto rounded-t-lg bg-white shadow-2xl sm:max-w-2xl sm:rounded-lg" onSubmit={submit}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950">{editing ? `Edit ${field.label}` : "Add field"}</h2>
            <p className="text-sm text-slate-500">{module.pluralName}</p>
          </div>
          <button aria-label="Close field editor" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" onClick={onClose} type="button"><FiX /></button>
        </div>
        <div className="space-y-5 p-5">
          <Alert message={error} type="error" />
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block"><span className="text-sm font-bold text-slate-700">Label</span><input autoFocus className={inputClass} disabled={locked} maxLength="120" onChange={(event) => change("label", event.target.value)} required value={form.label} /></label>
            <label className="block"><span className="text-sm font-bold text-slate-700">Field key</span><input className={`${inputClass} font-mono disabled:cursor-not-allowed disabled:text-slate-500`} disabled={editing} onChange={(event) => change("key", slugify(event.target.value))} pattern="[a-z][a-z0-9_]*" required value={form.key} /></label>
            <label className="block"><span className="text-sm font-bold text-slate-700">Type</span><select className={inputClass} disabled={field?.isSystem || locked} onChange={(event) => change("type", event.target.value)} value={form.type}>{FIELD_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="block"><span className="text-sm font-bold text-slate-700">Placeholder</span><input className={inputClass} disabled={locked} maxLength="160" onChange={(event) => change("placeholder", event.target.value)} value={form.placeholder} /></label>
          </div>
          <label className="block"><span className="text-sm font-bold text-slate-700">Help text</span><textarea className={textareaClass} disabled={locked} maxLength="500" onChange={(event) => change("description", event.target.value)} value={form.description} /></label>
          {optionField && <label className="block"><span className="text-sm font-bold text-slate-700">Options</span><textarea className={`${textareaClass} min-h-36`} onChange={(event) => change("optionsText", event.target.value)} placeholder={"Open\nIn review\nApproved"} required value={form.optionsText} /><span className="mt-1.5 block text-xs text-slate-400">One option per line.</span></label>}
          {["integer", "decimal", "text", "long_text"].includes(form.type) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {["integer", "decimal"].includes(form.type) ? <>
                <label><span className="text-sm font-bold text-slate-700">Minimum value</span><input className={inputClass} onChange={(event) => change("min", event.target.value)} type="number" value={form.min} /></label>
                <label><span className="text-sm font-bold text-slate-700">Maximum value</span><input className={inputClass} onChange={(event) => change("max", event.target.value)} type="number" value={form.max} /></label>
              </> : <>
                <label><span className="text-sm font-bold text-slate-700">Minimum length</span><input className={inputClass} min="0" onChange={(event) => change("minLength", event.target.value)} type="number" value={form.minLength} /></label>
                <label><span className="text-sm font-bold text-slate-700">Maximum length</span><input className={inputClass} min="1" onChange={(event) => change("maxLength", event.target.value)} type="number" value={form.maxLength} /></label>
              </>}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={`flex items-center justify-between rounded-lg border p-4 ${locked ? "cursor-not-allowed bg-slate-100" : "cursor-pointer bg-slate-50"}`}><span><span className="block text-sm font-bold text-slate-800">Mandatory</span><span className="mt-1 block text-xs text-slate-500">Reject records without a value.</span></span><input checked={form.isRequired} className="h-4 w-4 accent-violet-600" disabled={locked} onChange={(event) => change("isRequired", event.target.checked)} type="checkbox" /></label>
            <label className={`flex items-center justify-between rounded-lg border p-4 ${locked ? "cursor-not-allowed bg-slate-100" : "cursor-pointer bg-slate-50"}`}><span><span className="block text-sm font-bold text-slate-800">Visible</span><span className="mt-1 block text-xs text-slate-500">Show this field on record forms.</span></span><input checked={form.isVisible} className="h-4 w-4 accent-violet-600" disabled={locked} onChange={(event) => change("isVisible", event.target.checked)} type="checkbox" /></label>
          </div>
        </div>
        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4">
          <button className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50" onClick={onClose} type="button">Cancel</button>
          <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-bold text-white hover:bg-violet-700 disabled:bg-slate-300" disabled={saving} type="submit"><FiSave />{saving ? "Saving..." : "Save field"}</button>
        </div>
      </form>
    </div>
  );
};

const CreateModuleDialog = ({ onClose, onCreated }) => {
  const [form, setForm] = useState(emptyModule);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const change = (name, value) => {
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "singularName") {
        if (!current.pluralName || current.pluralName === `${current.singularName}s`) next.pluralName = `${value}s`;
        if (!current.key || current.key === slugify(current.pluralName, "-")) next.key = slugify(`${value}s`, "-");
      }
      return next;
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { module } = await api.createCustomModule({
        ...form,
        createRoles: ROLES.map(({ value }) => value),
        deleteRoles: ["super_admin", "admin"],
        editRoles: ROLES.map(({ value }) => value),
        fields: [{ isRequired: true, isVisible: true, key: "name", label: "Name", type: "text" }],
        viewRoles: ROLES.map(({ value }) => value),
      });
      await onCreated(module);
      onClose();
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-6">
      <form className="w-full rounded-t-lg bg-white shadow-2xl sm:max-w-xl sm:rounded-lg" onSubmit={submit}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h2 className="text-lg font-bold text-slate-950">Create module</h2><p className="text-sm text-slate-500">Start with a required Name field.</p></div><button aria-label="Close module creator" className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100" onClick={onClose} type="button"><FiX /></button></div>
        <div className="space-y-5 p-5">
          <Alert message={error} type="error" />
          <div className="grid gap-5 sm:grid-cols-2">
            <label><span className="text-sm font-bold text-slate-700">Singular name</span><input autoFocus className={inputClass} onChange={(event) => change("singularName", event.target.value)} placeholder="Asset" required value={form.singularName} /></label>
            <label><span className="text-sm font-bold text-slate-700">Plural name</span><input className={inputClass} onChange={(event) => change("pluralName", event.target.value)} placeholder="Assets" required value={form.pluralName} /></label>
            <label><span className="text-sm font-bold text-slate-700">Module key</span><input className={`${inputClass} font-mono`} onChange={(event) => change("key", slugify(event.target.value, "-"))} pattern="[a-z][a-z0-9-]*" required value={form.key} /></label>
            <label><span className="text-sm font-bold text-slate-700">Icon</span><select className={inputClass} onChange={(event) => change("icon", event.target.value)} value={form.icon}>{ICONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          </div>
          <label><span className="text-sm font-bold text-slate-700">Description</span><textarea className={textareaClass} maxLength="500" onChange={(event) => change("description", event.target.value)} placeholder="What this module tracks." value={form.description} /></label>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4"><button className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700" onClick={onClose} type="button">Cancel</button><button className="inline-flex h-10 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-bold text-white disabled:bg-slate-300" disabled={saving} type="submit"><FiPlus />{saving ? "Creating..." : "Create module"}</button></div>
      </form>
    </div>
  );
};

const CustomizationPage = () => {
  const [modules, setModules] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState({ message: "", type: "info" });
  const [fieldDialog, setFieldDialog] = useState(null);
  const [creatingModule, setCreatingModule] = useState(false);
  const selected = modules.find((module) => module.id === selectedId) || modules[0];
  const [moduleForm, setModuleForm] = useState(null);

  const loadModules = useCallback(async (preferredId) => {
    setLoading(true);
    try {
      const { modules: result } = await api.getCustomizationModules();
      setModules(result);
      setSelectedId((current) => preferredId || current || result[0]?.id || "");
      setNotice((current) => (current.type === "error" ? { message: "", type: "info" } : current));
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  useEffect(() => {
    if (!selected) return;
    setModuleForm({
      createRoles: selected.createRoles,
      deleteRoles: selected.deleteRoles,
      description: selected.description,
      editRoles: selected.editRoles,
      icon: selected.icon,
      pluralName: selected.pluralName,
      primaryFieldId: selected.primaryFieldId,
      singularName: selected.singularName,
      status: selected.status,
      viewRoles: selected.viewRoles,
    });
  }, [selected]);

  const activeFields = useMemo(
    () => selected?.fields.filter((field) => !field.archived) || [],
    [selected],
  );

  const saveModule = async () => {
    if (!selected || !moduleForm) return;
    setSaving(true);
    setNotice({ message: "", type: "info" });
    try {
      await api.updateCustomModule(selected.id, moduleForm);
      await loadModules(selected.id);
      window.dispatchEvent(new Event("staffflow:modules-changed"));
      setNotice({ message: "Module settings saved.", type: "success" });
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const updateRole = (action, role, checked) => {
    const key = `${action}Roles`;
    setModuleForm((current) => ({
      ...current,
      [key]: checked ? [...new Set([...current[key], role])] : current[key].filter((item) => item !== role),
    }));
  };

  const toggleArchiveField = async (field) => {
    setNotice({ message: "", type: "info" });
    try {
      if (field.archived) await api.updateCustomField(selected.id, field.id, { archived: false });
      else await api.deleteCustomField(selected.id, field.id);
      await loadModules(selected.id);
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
    }
  };

  return (
    <AppShell title="Customization" subtitle="Configure workspace modules, field definitions, validation, and role access.">
      <div className="grid items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <SettingsNavigation />
        <div className="space-y-5">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700"><FiSliders /></span><div><p className="text-sm font-bold text-slate-900">Module designer</p><p className="text-xs text-slate-500">Definitions and values are stored in PostgreSQL.</p></div></div>
            <div className="flex gap-2"><button aria-label="Refresh modules" className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" onClick={() => loadModules(selected?.id)} title="Refresh modules" type="button"><FiRefreshCw className={loading ? "animate-spin" : ""} /></button><button className="inline-flex h-10 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-bold text-white hover:bg-violet-700" onClick={() => setCreatingModule(true)} type="button"><FiPlus />New module</button></div>
          </div>
          <Alert message={notice.message} type={notice.type} />
          <div className="grid min-h-[620px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm xl:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="border-b border-slate-200 bg-slate-50/70 p-3 xl:border-b-0 xl:border-r">
              <p className="px-2 py-2 text-[11px] font-bold uppercase text-slate-400">Modules</p>
              <div className="space-y-1">
                {modules.map((module) => (
                  <button className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition ${selected?.id === module.id ? "bg-white text-violet-700 shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:bg-white"}`} key={module.id} onClick={() => setSelectedId(module.id)} type="button">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${module.kind === "system" ? "bg-cyan-100 text-cyan-700" : "bg-violet-100 text-violet-700"}`}>{module.kind === "system" ? <FiGrid /> : <FiDatabase />}</span>
                    <span className="min-w-0"><span className="block truncate text-sm font-bold">{module.pluralName}</span><span className="mt-0.5 block text-[11px] font-semibold uppercase text-slate-400">{module.status === "archived" ? "Archived" : module.kind}</span></span>
                  </button>
                ))}
              </div>
            </aside>

            {selected && moduleForm ? (
              <div className="min-w-0">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div><div className="flex items-center gap-2"><h2 className="text-xl font-bold text-slate-950">{selected.pluralName}</h2>{selected.kind === "system" && <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-1 text-[11px] font-bold uppercase text-cyan-700"><FiLock />Core</span>}</div><p className="mt-1 text-sm text-slate-500">{activeFields.length} active fields</p></div>
                  <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-800 disabled:bg-slate-300" disabled={saving} onClick={saveModule} type="button"><FiSave />{saving ? "Saving..." : "Save module"}</button>
                </div>

                <div className="space-y-7 p-5">
                  <section>
                    <h3 className="text-sm font-bold text-slate-950">Identity</h3>
                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                      <label><span className="text-sm font-semibold text-slate-600">Singular name</span><input className={inputClass} onChange={(event) => setModuleForm((current) => ({ ...current, singularName: event.target.value }))} value={moduleForm.singularName} /></label>
                      <label><span className="text-sm font-semibold text-slate-600">Plural name</span><input className={inputClass} onChange={(event) => setModuleForm((current) => ({ ...current, pluralName: event.target.value }))} value={moduleForm.pluralName} /></label>
                      <label><span className="text-sm font-semibold text-slate-600">Icon</span><select className={inputClass} onChange={(event) => setModuleForm((current) => ({ ...current, icon: event.target.value }))} value={moduleForm.icon}>{ICONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                      <label><span className="text-sm font-semibold text-slate-600">Primary display field</span><select className={inputClass} onChange={(event) => setModuleForm((current) => ({ ...current, primaryFieldId: event.target.value }))} value={moduleForm.primaryFieldId}>{activeFields.filter((field) => field.isVisible).map((field) => <option key={field.id} value={field.id}>{field.label}</option>)}</select></label>
                      <label className="md:col-span-2"><span className="text-sm font-semibold text-slate-600">Description</span><textarea className={textareaClass} onChange={(event) => setModuleForm((current) => ({ ...current, description: event.target.value }))} value={moduleForm.description} /></label>
                    </div>
                  </section>

                  <section className="border-t border-slate-200 pt-6">
                    <div className="flex items-center justify-between"><div><h3 className="text-sm font-bold text-slate-950">Fields</h3><p className="mt-1 text-xs text-slate-500">Core fields marked with a lock protect system workflows.</p></div><button className="inline-flex h-9 items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 text-sm font-bold text-violet-700 hover:bg-violet-100" onClick={() => setFieldDialog({})} type="button"><FiPlus />Add field</button></div>
                    <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full min-w-[720px] text-left">
                        <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500"><tr><th className="px-4 py-3">Field</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Required</th><th className="px-4 py-3">Visible</th><th className="w-28 px-4 py-3 text-right">Actions</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                          {selected.fields.map((field) => (
                            <tr className={field.archived ? "bg-slate-50 opacity-60" : "bg-white"} key={field.id}>
                              <td className="px-4 py-3"><div className="flex items-center gap-2"><span className="text-sm font-bold text-slate-900">{field.label}</span>{field.isLocked && <FiLock className="h-3.5 w-3.5 text-slate-400" />}</div><span className="mt-0.5 block font-mono text-xs text-slate-400">{field.key}</span></td>
                              <td className="px-4 py-3 text-sm font-semibold capitalize text-slate-600">{field.type.replace("_", " ")}</td>
                              <td className="px-4 py-3">{field.isRequired ? <FiCheck className="text-emerald-600" /> : <span className="text-slate-300">-</span>}</td>
                              <td className="px-4 py-3">{field.isVisible ? <FiCheck className="text-emerald-600" /> : <span className="text-slate-300">-</span>}</td>
                              <td className="px-4 py-3"><div className="flex justify-end gap-1"><button aria-label={`Edit ${field.label}`} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-violet-50 hover:text-violet-700" onClick={() => setFieldDialog({ field })} title={`Edit ${field.label}`} type="button"><FiEdit2 /></button>{!field.isLocked && <button aria-label={`${field.archived ? "Restore" : "Remove"} ${field.label}`} className={`flex h-8 w-8 items-center justify-center rounded-md ${field.archived ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-500 hover:bg-rose-50 hover:text-rose-600"}`} onClick={() => toggleArchiveField(field)} title={`${field.archived ? "Restore" : "Remove"} ${field.label}`} type="button">{field.archived ? <FiRefreshCw /> : <FiTrash2 />}</button>}</div></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section className="border-t border-slate-200 pt-6">
                    <h3 className="text-sm font-bold text-slate-950">Role access</h3>
                    <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full min-w-[640px] text-left"><thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500"><tr><th className="px-4 py-3">Role</th>{["View", "Create", "Edit", "Delete"].map((action) => <th className="px-4 py-3 text-center" key={action}>{action}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{ROLES.map((role) => <tr key={role.value}><td className="px-4 py-3 text-sm font-bold text-slate-800">{role.label}</td>{["view", "create", "edit", "delete"].map((action) => <td className="px-4 py-3 text-center" key={action}><input checked={moduleForm[`${action}Roles`].includes(role.value)} className="h-4 w-4 accent-violet-600" onChange={(event) => updateRole(action, role.value, event.target.checked)} type="checkbox" /></td>)}</tr>)}</tbody></table>
                    </div>
                  </section>

                  {selected.kind === "custom" && (
                    <section className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-sm font-bold text-slate-950">Module lifecycle</h3><p className="mt-1 text-xs text-slate-500">Archived modules retain their records and leave workspace navigation.</p></div><button className={`inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-bold ${moduleForm.status === "archived" ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50" : "border-rose-200 text-rose-700 hover:bg-rose-50"}`} onClick={() => setModuleForm((current) => ({ ...current, status: current.status === "archived" ? "active" : "archived" }))} type="button"><FiArchive />{moduleForm.status === "archived" ? "Restore module" : "Archive module"}</button></section>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center p-10 text-sm font-semibold text-slate-500">{loading ? "Loading modules..." : "No modules found."}</div>
            )}
          </div>
        </div>
      </div>
      {fieldDialog && <FieldDialog field={fieldDialog.field} module={selected} onClose={() => setFieldDialog(null)} onSaved={() => loadModules(selected.id)} />}
      {creatingModule && <CreateModuleDialog onClose={() => setCreatingModule(false)} onCreated={async (module) => { await loadModules(module.id); window.dispatchEvent(new Event("staffflow:modules-changed")); setNotice({ message: `${module.pluralName} is ready.`, type: "success" }); }} />}
    </AppShell>
  );
};

export default CustomizationPage;
