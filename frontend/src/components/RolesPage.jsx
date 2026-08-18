import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiCheck,
  FiLock,
  FiPlus,
  FiRefreshCw,
  FiShield,
  FiTrash2,
  FiUsers,
  FiX,
} from "react-icons/fi";
import Alert from "./Alert";
import { useToast } from "../context/ToastContext";
import AppShell from "./AppShell";
import SettingsNavigation from "./SettingsNavigation";
import { api, formatApiError } from "../context/api";
import { useRoles } from "../hooks/useRoles";
import { useUser } from "../context/UserContext";

const emptyDraft = { description: "", name: "", permissions: [] };

const RolesPage = () => {
  const { user } = useUser();
  const toast = useToast();
  const { error: rolesError, reload, roles } = useRoles();
  const [catalog, setCatalog] = useState({ permissions: [] });
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState(emptyDraft);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState({ message: "", type: "info" });

  const canManageRoles = Boolean(user?.permissions?.canManagePermissions);
  const heldPermissions = useMemo(
    () => new Set(user?.permissions?.assigned || []),
    [user?.permissions?.assigned],
  );

  useEffect(() => {
    api
      .getPermissionCatalog()
      .then(setCatalog)
      .catch(() => setCatalog({ permissions: [] }));
  }, []);

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedId) || null,
    [roles, selectedId],
  );

  const startCreate = () => {
    setCreating(true);
    setSelectedId("");
    setDraft(emptyDraft);
    setNotice({ message: "", type: "info" });
  };

  const startEdit = useCallback((role) => {
    setCreating(false);
    setSelectedId(role.id);
    setDraft({
      description: role.description || "",
      name: role.name,
      permissions: [...role.permissions],
    });
    setNotice({ message: "", type: "info" });
  }, []);

  const cancelEdit = () => {
    setCreating(false);
    setSelectedId("");
    setDraft(emptyDraft);
  };

  const togglePermission = (key) => {
    setDraft((current) => ({
      ...current,
      permissions: current.permissions.includes(key)
        ? current.permissions.filter((permission) => permission !== key)
        : [...current.permissions, key],
    }));
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice({ message: "", type: "info" });

    try {
      if (creating) {
        await api.createRole(draft);
        toast.success("Role created", `${draft.name} is ready to assign.`);
      } else {
        await api.updateRole(selectedId, draft);
        toast.success("Role updated", `${draft.name} permissions saved.`);
      }
      await reload();
      cancelEdit();
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
      toast.error("Could not save role", formatApiError(requestError));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (role) => {
    setSaving(true);
    setNotice({ message: "", type: "info" });
    try {
      await api.deleteRole(role.id);
      toast.success("Role deleted", `${role.name} was removed.`);
      await reload();
      cancelEdit();
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const grouped = useMemo(() => {
    const groups = new Map();
    (catalog.permissions || []).forEach((permission) => {
      if (!groups.has(permission.group)) groups.set(permission.group, []);
      groups.get(permission.group).push(permission);
    });
    return [...groups.entries()];
  }, [catalog.permissions]);

  const editing = creating || Boolean(selectedRole);

  return (
    <AppShell title="Roles and permissions" subtitle="Define the roles your workspace uses and exactly what each one can do.">
      <div className="grid items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <SettingsNavigation />

        <div className="space-y-5">
          <Alert message={notice.message || rolesError} type={notice.message ? notice.type : "error"} />

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                  <FiShield className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-950">Workspace roles</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {roles.length} roles. Built-in roles cannot be edited or removed.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  aria-label="Refresh roles"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                  onClick={reload}
                  type="button"
                >
                  <FiRefreshCw className="h-4 w-4" />
                </button>
                {canManageRoles && (
                  <button
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-700 px-3 text-sm font-bold text-white transition hover:bg-emerald-800"
                    onClick={startCreate}
                    type="button"
                  >
                    <FiPlus className="h-4 w-4" />
                    New role
                  </button>
                )}
              </div>
            </div>

            <ul className="divide-y divide-slate-100">
              {roles.map((role) => (
                <li className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between" key={role.id}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-slate-950">{role.name}</p>
                      {role.isSystem ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                          <FiLock className="h-3 w-3" />
                          Built-in
                        </span>
                      ) : (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                          Custom
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                        <FiUsers className="h-3 w-3" />
                        {role.userCount} {role.userCount === 1 ? "member" : "members"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {role.description || "No description."} - {role.permissions.length} permissions
                    </p>
                  </div>

                  {canManageRoles && role.canManage && (
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                        onClick={() => startEdit(role)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        aria-label={`Delete ${role.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                        disabled={saving}
                        onClick={() => remove(role)}
                        title={`Delete ${role.name}`}
                        type="button"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {editing && (
            <form className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" onSubmit={save}>
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5">
                <h2 className="text-sm font-bold text-slate-950">
                  {creating ? "Create a role" : `Edit ${selectedRole?.name}`}
                </h2>
                <button
                  aria-label="Cancel"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  onClick={cancelEdit}
                  type="button"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-5 p-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Role name</span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    maxLength="60"
                    onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Shift Lead"
                    required
                    value={draft.name}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Description</span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    maxLength="300"
                    onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                    placeholder="What this role is responsible for"
                    value={draft.description}
                  />
                </label>
              </div>

              <div className="border-t border-slate-200 px-4 py-4">
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  <p className="text-xs leading-5 text-amber-900">
                    You can only grant permissions your own account already has, and the new role always sits below
                    yours in the hierarchy. Anything you do not hold is shown disabled.
                  </p>
                </div>

                <div className="mt-4 space-y-5">
                  {grouped.map(([group, permissions]) => (
                    <div key={group}>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{group}</p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {permissions.map((permission) => {
                          const checked = draft.permissions.includes(permission.key);
                          const grantable = heldPermissions.has(permission.key);
                          return (
                            <label
                              className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition ${
                                checked ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"
                              } ${grantable ? "" : "cursor-not-allowed opacity-50"}`}
                              key={permission.key}
                            >
                              <button
                                aria-pressed={checked}
                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                                  checked ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 bg-white"
                                }`}
                                disabled={!grantable}
                                onClick={() => togglePermission(permission.key)}
                                type="button"
                              >
                                {checked && <FiCheck className="h-3.5 w-3.5" />}
                              </button>
                              <span className="min-w-0">
                                <span className="block text-sm font-bold text-slate-900">{permission.label}</span>
                                <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                                  {permission.description}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
                <button
                  className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                  onClick={cancelEdit}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={saving || !draft.name.trim()}
                  type="submit"
                >
                  {saving ? "Saving..." : creating ? "Create role" : "Save changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default RolesPage;
