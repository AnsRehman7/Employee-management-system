import { useEffect, useState } from "react";
import { FiMapPin, FiPlus, FiSave, FiTrash2, FiX } from "react-icons/fi";
import Alert from "./Alert";
import { api, formatApiError } from "../context/api";

const fieldClass =
  "mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-950 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100";
const emptyOffice = {
  address: "",
  isActive: true,
  latitude: "",
  longitude: "",
  maxAccuracyMeters: 100,
  name: "",
  radiusMeters: 100,
};

const WorkspaceOfficesSettings = ({ initialOffices = [] }) => {
  const [offices, setOffices] = useState(initialOffices);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyOffice);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ message: "", type: "info" });

  useEffect(() => setOffices(initialOffices), [initialOffices]);

  const change = (event) => {
    const { checked, name, type, value } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const edit = (office) => {
    setEditingId(office.id);
    setForm({ ...emptyOffice, ...office });
    setNotice({ message: "", type: "info" });
  };

  const reset = () => {
    setEditingId("");
    setForm(emptyOffice);
  };

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setNotice({ message: "", type: "info" });
    try {
      const payload = {
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        maxAccuracyMeters: Number(form.maxAccuracyMeters),
        radiusMeters: Number(form.radiusMeters),
      };
      const { office } = editingId
        ? await api.updateWorkspaceOffice(editingId, payload)
        : await api.createWorkspaceOffice(payload);
      setOffices((current) => editingId
        ? current.map((item) => item.id === office.id ? office : item)
        : [...current, office].sort((a, b) => a.name.localeCompare(b.name)));
      setNotice({ message: editingId ? "Office updated." : "Office added.", type: "success" });
      reset();
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (office) => {
    if (!window.confirm(`Delete ${office.name}? Existing attendance records will be preserved.`)) return;
    setBusy(true);
    try {
      await api.deleteWorkspaceOffice(office.id);
      setOffices((current) => current.filter((item) => item.id !== office.id));
      if (editingId === office.id) reset();
      setNotice({ message: "Office deleted.", type: "success" });
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="scroll-mt-28 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" id="attendance-offices">
      <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-700"><FiMapPin /></span>
        <div><h2 className="text-base font-bold text-slate-950">Attendance offices</h2><p className="text-sm text-slate-500">Trusted locations and GPS accuracy rules for verified check-ins.</p></div>
      </div>
      <div className="grid items-start lg:grid-cols-[minmax(0,1fr)_390px]">
        <div className="divide-y divide-slate-100 border-b border-slate-200 lg:border-b-0 lg:border-r">
          {offices.length ? offices.map((office) => (
            <div className="flex items-start gap-3 px-5 py-4" key={office.id}>
              <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${office.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
              <div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-900">{office.name}</p><p className="mt-1 text-xs leading-5 text-slate-500">{office.address || `${office.latitude}, ${office.longitude}`} / {office.radiusMeters}m radius / {office.maxAccuracyMeters}m max accuracy</p></div>
              <button className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50" onClick={() => edit(office)} type="button">Edit</button>
              <button aria-label={`Delete ${office.name}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600" disabled={busy} onClick={() => remove(office)} title="Delete office" type="button"><FiTrash2 /></button>
            </div>
          )) : <div className="px-5 py-12 text-center"><FiMapPin className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-500">No attendance office configured.</p></div>}
        </div>
        <form className="space-y-4 p-5" onSubmit={save}>
          <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-slate-950">{editingId ? "Edit office" : "Add office"}</h3>{editingId && <button aria-label="Cancel edit" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100" onClick={reset} title="Cancel edit" type="button"><FiX /></button>}</div>
          <Alert message={notice.message} type={notice.type} />
          <label className="block"><span className="text-xs font-bold text-slate-600">Office name</span><input className={fieldClass} maxLength="120" name="name" onChange={change} required value={form.name} /></label>
          <label className="block"><span className="text-xs font-bold text-slate-600">Address</span><input className={fieldClass} maxLength="240" name="address" onChange={change} value={form.address} /></label>
          <div className="grid grid-cols-2 gap-3"><label><span className="text-xs font-bold text-slate-600">Latitude</span><input className={fieldClass} max="90" min="-90" name="latitude" onChange={change} required step="any" type="number" value={form.latitude} /></label><label><span className="text-xs font-bold text-slate-600">Longitude</span><input className={fieldClass} max="180" min="-180" name="longitude" onChange={change} required step="any" type="number" value={form.longitude} /></label></div>
          <div className="grid grid-cols-2 gap-3"><label><span className="text-xs font-bold text-slate-600">Radius (m)</span><input className={fieldClass} max="10000" min="20" name="radiusMeters" onChange={change} required type="number" value={form.radiusMeters} /></label><label><span className="text-xs font-bold text-slate-600">Max accuracy (m)</span><input className={fieldClass} max="5000" min="10" name="maxAccuracyMeters" onChange={change} required type="number" value={form.maxAccuracyMeters} /></label></div>
          <label className="flex cursor-pointer items-center gap-3 border-y border-slate-200 py-3"><input checked={form.isActive} className="h-4 w-4 accent-violet-600" name="isActive" onChange={change} type="checkbox" /><span className="text-sm font-bold text-slate-700">Active check-in location</span></label>
          <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50" disabled={busy} type="submit">{editingId ? <FiSave /> : <FiPlus />}{busy ? "Saving..." : editingId ? "Save office" : "Add office"}</button>
        </form>
      </div>
    </section>
  );
};

export default WorkspaceOfficesSettings;
