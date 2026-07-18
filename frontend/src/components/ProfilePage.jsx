import { useEffect, useMemo, useState } from "react";
import {
  FiBriefcase,
  FiCheck,
  FiChevronRight,
  FiMail,
  FiPhone,
  FiRefreshCw,
  FiSave,
  FiShield,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import Alert from "./Alert";
import AppShell from "./AppShell";
import { api, formatApiError } from "../context/api";
import { useUser } from "../context/UserContext";

const fieldClass =
  "mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:text-slate-400";

const formatRole = (role = "employee") =>
  role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const initialsFor = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "SF";

const ProfilePage = () => {
  const { setUser, user } = useUser();
  const [profileForm, setProfileForm] = useState({
    contact: user?.contact || "",
    department: user?.department || "",
    designation: user?.designation || "",
    fullName: user?.name || "",
  });
  const [members, setMembers] = useState([]);
  const [catalog, setCatalog] = useState({ permissions: [], roleDefaults: {} });
  const [selectedId, setSelectedId] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [useRoleDefaults, setUseRoleDefaults] = useState(true);
  const [profileBusy, setProfileBusy] = useState(false);
  const [accessBusy, setAccessBusy] = useState(false);
  const [loadingAccess, setLoadingAccess] = useState(Boolean(user?.permissions?.canManagePermissions));
  const [notice, setNotice] = useState({ message: "", type: "info" });

  const selectedMember = members.find((member) => member.id === selectedId) || null;
  const canManageAccess = Boolean(user?.permissions?.canManagePermissions);
  const hierarchyBlocked =
    selectedMember?.role === "super_admin" && user?.role !== "super_admin";
  const editingSelf = selectedMember?.id === user?.id;
  const canCustomizeSelected = canManageAccess && !hierarchyBlocked && !editingSelf;

  const groupedPermissions = useMemo(
    () =>
      catalog.permissions.reduce((groups, permission) => {
        groups[permission.group] = [...(groups[permission.group] || []), permission];
        return groups;
      }, {}),
    [catalog.permissions],
  );

  const chooseMember = (member) => {
    setSelectedId(member.id);
    setSelectedPermissions(member.permissions?.assigned || []);
    setUseRoleDefaults(Boolean(member.permissions?.usesRoleDefaults));
    setNotice({ message: "", type: "info" });
  };

  const loadAccessControl = async () => {
    if (!canManageAccess) return;
    setLoadingAccess(true);
    try {
      const [{ users }, permissionCatalog] = await Promise.all([api.getUsers(), api.getPermissionCatalog()]);
      setMembers(users);
      setCatalog(permissionCatalog);
      const selected = users.find((member) => member.id === selectedId) || users[0];
      if (selected) chooseMember(selected);
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
    } finally {
      setLoadingAccess(false);
    }
  };

  useEffect(() => {
    loadAccessControl();
    // The selected account is preserved manually after refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManageAccess]);

  const handleProfileChange = (event) => {
    setProfileForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setProfileBusy(true);
    setNotice({ message: "", type: "info" });
    try {
      const { user: updatedUser } = await api.updateCurrentProfile(profileForm);
      setUser(updatedUser);
      setNotice({ message: "Profile updated successfully.", type: "success" });
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
    } finally {
      setProfileBusy(false);
    }
  };

  const togglePermission = (permissionKey) => {
    if (!canCustomizeSelected) return;
    setUseRoleDefaults(false);
    setSelectedPermissions((current) =>
      current.includes(permissionKey)
        ? current.filter((permission) => permission !== permissionKey)
        : [...current, permissionKey],
    );
  };

  const restoreRoleDefaults = () => {
    if (!selectedMember || hierarchyBlocked) return;
    setUseRoleDefaults(true);
    setSelectedPermissions(catalog.roleDefaults[selectedMember.role] || []);
  };

  const savePermissions = async () => {
    if (!selectedMember || hierarchyBlocked) return;
    setAccessBusy(true);
    setNotice({ message: "", type: "info" });
    try {
      const { user: updatedMember } = await api.updateUserPermissions(selectedMember.id, {
        permissions: selectedPermissions,
        useRoleDefaults,
      });
      setMembers((current) => current.map((member) => (member.id === updatedMember.id ? updatedMember : member)));
      chooseMember(updatedMember);
      if (updatedMember.id === user.id) setUser(updatedMember);
      setNotice({ message: `${updatedMember.name}'s permissions were updated.`, type: "success" });
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
    } finally {
      setAccessBusy(false);
    }
  };

  return (
    <AppShell title="Profile and access" subtitle="Manage your account details and workspace authorization.">
      <div className="space-y-6">
        <Alert message={notice.message} type={notice.type} />

        <div className="grid items-start gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-violet-100 text-xl font-bold text-violet-700">
              {initialsFor(user?.name)}
            </span>
            <h2 className="mt-4 text-xl font-bold text-slate-950">{user?.name}</h2>
            <p className="mt-1 break-all text-sm text-slate-500">{user?.email}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">{formatRole(user?.role)}</span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">{formatRole(user?.status)}</span>
            </div>
            <dl className="mt-5 space-y-4 border-t border-slate-200 pt-5">
              <div><dt className="text-xs font-bold uppercase text-slate-400">Workspace</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{user?.organization?.name}</dd></div>
              <div><dt className="text-xs font-bold uppercase text-slate-400">Access policy</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{user?.permissions?.usesRoleDefaults ? "Role defaults" : "Custom permissions"}</dd></div>
            </dl>
          </aside>

          <form className="rounded-lg border border-slate-200 bg-white shadow-sm" onSubmit={handleProfileSave}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700"><FiUser className="h-4 w-4" /></span><div><h2 className="text-base font-bold text-slate-950">Personal information</h2><p className="text-sm text-slate-500">Details displayed across projects, tasks, and attendance.</p></div></div>
              <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-bold text-white transition hover:bg-violet-700 disabled:bg-slate-300" disabled={profileBusy} type="submit"><FiSave className="h-4 w-4" />{profileBusy ? "Saving..." : "Save profile"}</button>
            </div>
            <div className="grid gap-5 p-5 md:grid-cols-2">
              <label className="block md:col-span-2"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiUser className="h-4 w-4 text-slate-400" />Full name</span><input className={fieldClass} maxLength="120" name="fullName" onChange={handleProfileChange} required value={profileForm.fullName} /></label>
              <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiBriefcase className="h-4 w-4 text-slate-400" />Designation</span><input className={fieldClass} maxLength="120" name="designation" onChange={handleProfileChange} placeholder="Role title" value={profileForm.designation} /></label>
              <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiUsers className="h-4 w-4 text-slate-400" />Department</span><input className={fieldClass} maxLength="120" name="department" onChange={handleProfileChange} placeholder="Department" value={profileForm.department} /></label>
              <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiPhone className="h-4 w-4 text-slate-400" />Contact</span><input className={fieldClass} maxLength="40" name="contact" onChange={handleProfileChange} placeholder="Contact number" type="tel" value={profileForm.contact} /></label>
              <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiMail className="h-4 w-4 text-slate-400" />Email</span><input className={fieldClass} disabled value={user?.email || ""} /></label>
            </div>
          </form>
        </div>

        {canManageAccess && (
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700"><FiShield className="h-4 w-4" /></span><div><h2 className="text-base font-bold text-slate-950">Access control</h2><p className="text-sm text-slate-500">Role defaults with account-specific overrides.</p></div></div>
              <button aria-label="Refresh access control" className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50" onClick={loadAccessControl} title="Refresh access control" type="button"><FiRefreshCw className={`h-4 w-4 ${loadingAccess ? "animate-spin" : ""}`} /></button>
            </div>

            {loadingAccess ? (
              <div className="py-16 text-center text-sm font-semibold text-slate-500">Loading workspace permissions...</div>
            ) : (
              <div className="grid min-h-[520px] lg:grid-cols-[320px_minmax(0,1fr)]">
                <div className="border-b border-slate-200 bg-slate-50/70 lg:border-b-0 lg:border-r">
                  <div className="border-b border-slate-200 px-4 py-3 text-xs font-bold uppercase text-slate-400">Workspace accounts</div>
                  <div className="max-h-[620px] overflow-y-auto p-2">
                    {members.map((member) => (
                      <button className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition ${selectedId === member.id ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:bg-white"}`} key={member.id} onClick={() => chooseMember(member)} type="button">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-100 text-xs font-bold text-cyan-800">{initialsFor(member.name)}</span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{member.name}</span><span className="mt-0.5 block text-xs text-slate-500">{formatRole(member.role)} / {member.permissions?.usesRoleDefaults ? "Default" : "Custom"}</span></span>
                        <FiChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>

                {selectedMember && (
                  <div>
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-bold text-slate-950">{selectedMember.name}</h3><span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">{formatRole(selectedMember.role)}</span><span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${useRoleDefaults ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-violet-200 bg-violet-50 text-violet-700"}`}>{useRoleDefaults ? "Role defaults" : "Custom access"}</span></div><p className="mt-1 text-sm text-slate-500">{selectedMember.email}</p></div>
                      <div className="flex gap-2"><button className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50" disabled={hierarchyBlocked} onClick={restoreRoleDefaults} type="button"><FiRefreshCw className="h-4 w-4" />Use role defaults</button><button className="inline-flex h-10 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-bold text-white transition hover:bg-violet-700 disabled:bg-slate-300" disabled={accessBusy || hierarchyBlocked || (editingSelf && !useRoleDefaults)} onClick={savePermissions} type="button"><FiSave className="h-4 w-4" />{accessBusy ? "Saving..." : "Save access"}</button></div>
                    </div>

                    {(hierarchyBlocked || editingSelf) && <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800">{hierarchyBlocked ? "Only a super admin can modify this account." : "Your own account can use role defaults; custom self-editing is locked to prevent accidental loss of access."}</div>}

                    <div className="grid gap-5 p-5 xl:grid-cols-2">
                      {Object.entries(groupedPermissions).map(([group, permissions]) => (
                        <div className="border-t border-slate-200 pt-4" key={group}>
                          <h4 className="text-xs font-bold uppercase text-slate-400">{group}</h4>
                          <div className="mt-2 divide-y divide-slate-100">
                            {permissions.map((permission) => {
                              const checked = selectedPermissions.includes(permission.key);
                              return (
                                <label className={`flex items-start gap-3 py-3 ${canCustomizeSelected ? "cursor-pointer" : "cursor-not-allowed"}`} key={permission.key}>
                                  <button aria-pressed={checked} className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${checked ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300 bg-white"}`} disabled={!canCustomizeSelected} onClick={() => togglePermission(permission.key)} type="button">{checked && <FiCheck className="h-3.5 w-3.5" />}</button>
                                  <span><span className="block text-sm font-bold text-slate-800">{permission.label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{permission.description}</span></span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </AppShell>
  );
};

export default ProfilePage;
