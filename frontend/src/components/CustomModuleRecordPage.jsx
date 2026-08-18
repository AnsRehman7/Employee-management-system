import { useCallback, useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiDatabase,
  FiSave,
  FiTrash2,
} from "react-icons/fi";
import { Link, useNavigate, useParams } from "react-router-dom";
import Alert from "./Alert";
import AppShell from "./AppShell";
import { CardSkeleton } from "./Skeleton";
import CustomFieldsForm from "./CustomFieldsForm";
import { api, formatApiError } from "../context/api";

const defaultsFor = (fields = []) =>
  Object.fromEntries(
    fields
      .filter((field) => !field.archived && field.isVisible && field.defaultValue !== null)
      .map((field) => [field.key, field.defaultValue]),
  );

const CustomModuleRecordPage = ({ create = false }) => {
  const { moduleKey, recordId } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [record, setRecord] = useState(null);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState({ message: "", type: "info" });

  const load = useCallback(async () => {
    setLoading(true);
    setNotice({ message: "", type: "info" });
    try {
      if (create) {
        const { module: result } = await api.getCustomModule(moduleKey);
        setModule(result);
        setValues(defaultsFor(result.fields));
      } else {
        const result = await api.getCustomRecord(moduleKey, recordId);
        setModule(result.module);
        setRecord(result.record);
        setValues(result.record.values || {});
      }
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
    } finally {
      setLoading(false);
    }
  }, [create, moduleKey, recordId]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice({ message: "", type: "info" });
    try {
      if (create) {
        const { record: createdRecord } = await api.createCustomRecord(moduleKey, values);
        navigate(`/modules/${moduleKey}/${createdRecord.id}`, {
          replace: true,
          state: { notice: `${module.singularName} created.` },
        });
      } else {
        const { record: updatedRecord } = await api.updateCustomRecord(moduleKey, recordId, values);
        setRecord(updatedRecord);
        setValues(updatedRecord.values);
        setNotice({ message: "Record saved.", type: "success" });
      }
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete this ${module.singularName.toLowerCase()} record? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.deleteCustomRecord(moduleKey, recordId);
      navigate(`/modules/${moduleKey}`, { replace: true });
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
      setDeleting(false);
    }
  };

  const canEdit = create ? module?.access.canCreate : module?.access.canEdit;
  const title = create
    ? `New ${module?.singularName || "record"}`
    : record?.displayName || module?.singularName || "Record";

  return (
    <AppShell title={title} subtitle={module?.description || "Workspace module record."}>
      <form className="space-y-5" onSubmit={save}>
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <Link className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-800" to={`/modules/${moduleKey}`}><FiArrowLeft />Back to {module?.pluralName?.toLowerCase() || "module"}</Link>
          <div className="flex gap-2">
            {!create && module?.access.canDelete && <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-rose-200 px-4 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50" disabled={deleting} onClick={remove} type="button"><FiTrash2 />{deleting ? "Deleting..." : "Delete"}</button>}
            {canEdit && <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:bg-slate-300" disabled={saving || loading} type="submit"><FiSave />{saving ? "Saving..." : create ? `Create ${module?.singularName || "record"}` : "Save changes"}</button>}
          </div>
        </div>
        <Alert message={notice.message} type={notice.type} />
        {loading ? (
          <CardSkeleton label="Loading record" lines={5} />
        ) : module ? (
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <CustomFieldsForm disabled={!canEdit} fields={module.fields} onChange={setValues} title={`${module.singularName} details`} values={values} />
            <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-28">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800"><FiDatabase /></span>
              <h2 className="mt-4 text-base font-bold text-slate-950">{module.pluralName}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{module.description || "Custom workspace module."}</p>
              {!create && record && <div className="mt-5 divide-y divide-slate-100 border-y border-slate-100 text-sm"><div className="flex justify-between gap-3 py-3"><span className="text-slate-500">Created</span><span className="font-semibold text-slate-700">{new Date(record.createdAt).toLocaleDateString()}</span></div><div className="flex justify-between gap-3 py-3"><span className="text-slate-500">Updated by</span><span className="truncate font-semibold text-slate-700">{record.updatedBy?.name || "Workspace member"}</span></div></div>}
            </aside>
          </div>
        ) : null}
      </form>
    </AppShell>
  );
};

export default CustomModuleRecordPage;
