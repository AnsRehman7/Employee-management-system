import { useCallback, useEffect, useMemo, useState } from "react";
import { FiBriefcase, FiLock, FiMail, FiPlusCircle, FiRefreshCw, FiSave, FiShield, FiSlash, FiUser } from "react-icons/fi";
import AppShell from "../../AppShell";
import Alert from "../../Alert";
import { api, formatApiError } from "../../../context/api";
import { useUser } from "../../../context/UserContext";

const initialForm = {
  contact: "",
  department: "",
  designation: "",
  email: "",
  fullName: "",
  password: "",
  role: "employee",
};

const allRoleOptions = [
  ["employee", "Employee"],
  ["manager", "Manager"],
  ["hr", "HR"],
  ["accounts", "Accounts"],
  ["admin", "Admin"],
  ["super_admin", "Super Admin"],
];

const statusStyles = {
  active: "bg-emerald-100 text-emerald-800",
  suspended: "bg-slate-200 text-slate-700",
};

const formatRole = (role = "") =>
  role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const UsersPage = () => {
  const { user: currentUser } = useUser();
  const [busyId, setBusyId] = useState("");
  const [creating, setCreating] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState({ message: "", type: "info" });
  const [users, setUsers] = useState([]);

  const roleOptions = useMemo(() => {
    if (currentUser?.role === "hr") {
      return allRoleOptions.filter(([value]) => value === "employee");
    }

    if (currentUser?.role === "admin") {
      return allRoleOptions.filter(([value]) => value !== "super_admin");
    }

    return allRoleOptions;
  }, [currentUser?.role]);

  const loadUsers = useCallback(async ({ showLoading = false } = {}) => {
    if (showLoading) setLoading(true);

    try {
      const { users: userList } = await api.getUsers();
      setUsers(userList);
      setDrafts(
        userList.reduce((acc, teamMember) => {
          acc[teamMember.id] = {
            contact: teamMember.contact || "",
            department: teamMember.department || "",
            designation: teamMember.designation || "",
            email: teamMember.email || "",
            fullName: teamMember.name || "",
            role: teamMember.role || "employee",
            status: teamMember.status || "active",
          };
          return acc;
        }, {})
      );
      setNotice({ message: "", type: "info" });
    } catch (error) {
      setNotice({ message: formatApiError(error), type: "error" });
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers({ showLoading: true });
  }, [loadUsers]);

  const totals = useMemo(() => {
    const active = users.filter((teamMember) => teamMember.status === "active").length;
    const suspended = users.length - active;
    const managers = users.filter((teamMember) => ["admin", "manager", "hr"].includes(teamMember.role)).length;

    return { active, managers, suspended, total: users.length };
  }, [users]);

  const handleCreateChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDraftChange = (userId, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || {}),
        [field]: value,
      },
    }));
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setCreating(true);
    setNotice({ message: "", type: "info" });

    try {
      await api.createUser(formData);
      setFormData(initialForm);
      setNotice({ message: "User account created successfully.", type: "success" });
      await loadUsers();
    } catch (error) {
      setNotice({ message: formatApiError(error), type: "error" });
    } finally {
      setCreating(false);
    }
  };

  const handleSaveUser = async (userId) => {
    setBusyId(userId);
    setNotice({ message: "", type: "info" });

    try {
      await api.updateUser(userId, drafts[userId]);
      setNotice({ message: "User updated successfully.", type: "success" });
      await loadUsers();
    } catch (error) {
      setNotice({ message: formatApiError(error), type: "error" });
    } finally {
      setBusyId("");
    }
  };

  const handleSuspendUser = async (userId) => {
    const confirmed = window.confirm("Suspend this account and block future login?");
    if (!confirmed) return;

    setBusyId(userId);
    setNotice({ message: "", type: "info" });

    try {
      await api.deleteUser(userId);
      setNotice({ message: "User account suspended.", type: "success" });
      await loadUsers();
    } catch (error) {
      setNotice({ message: formatApiError(error), type: "error" });
    } finally {
      setBusyId("");
    }
  };

  return (
    <AppShell
        title="Users"
        subtitle="Create team logins, assign access, and keep workspace permissions under company control."
      >
      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <section className="space-y-6">
          <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleCreateUser}>
            <div className="mb-5 flex items-start gap-3 border-b border-slate-200 pb-5">
              <span className="rounded-lg bg-emerald-100 p-3 text-emerald-800">
                <FiPlusCircle className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Add user</h2>
                <p className="mt-1 text-sm text-slate-500">Create a login under {currentUser?.organization?.name || "this workspace"}.</p>
              </div>
            </div>

            <div className="space-y-4">
              <Alert message={notice.message} type={notice.type} />

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Full name</span>
                <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-600/10">
                  <FiUser className="h-5 w-5 text-slate-400" />
                  <input
                    className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                    name="fullName"
                    onChange={handleCreateChange}
                    placeholder="Ayesha Noor"
                    required
                    type="text"
                    value={formData.fullName}
                  />
                </div>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Email</span>
                  <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-600/10">
                    <FiMail className="h-5 w-5 text-slate-400" />
                    <input
                      className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                      name="email"
                      onChange={handleCreateChange}
                      placeholder="person@company.com"
                      required
                      type="email"
                      value={formData.email}
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Password</span>
                  <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-600/10">
                    <FiLock className="h-5 w-5 text-slate-400" />
                    <input
                      className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                      minLength={12}
                      name="password"
                      onChange={handleCreateChange}
                      placeholder="Minimum 12 characters"
                      required
                      type="password"
                      value={formData.password}
                    />
                  </div>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Role</span>
                  <select
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                    name="role"
                    onChange={handleCreateChange}
                    value={formData.role}
                  >
                    {roleOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Designation</span>
                  <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-600/10">
                    <FiBriefcase className="h-5 w-5 text-slate-400" />
                    <input
                      className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                      name="designation"
                      onChange={handleCreateChange}
                      placeholder="Operations Manager"
                      type="text"
                      value={formData.designation}
                    />
                  </div>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                  name="department"
                  onChange={handleCreateChange}
                  placeholder="Department"
                  type="text"
                  value={formData.department}
                />
                <input
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                  name="contact"
                  onChange={handleCreateChange}
                  placeholder="Contact"
                  type="text"
                  value={formData.contact}
                />
              </div>

              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={creating}
                type="submit"
              >
                <FiPlusCircle className="h-4 w-4" />
                {creating ? "Creating user..." : "Create user"}
              </button>
            </div>
          </form>

          <section className="grid grid-cols-2 gap-3">
            {[
              ["Users", totals.total, <FiUser className="h-5 w-5" />],
              ["Active", totals.active, <FiShield className="h-5 w-5" />],
              ["Leads", totals.managers, <FiBriefcase className="h-5 w-5" />],
              ["Suspended", totals.suspended, <FiSlash className="h-5 w-5" />],
            ].map(([label, value, icon]) => (
              <article key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
                  </div>
                  <span className="rounded-lg bg-slate-100 p-3 text-slate-700">{icon}</span>
                </div>
              </article>
            ))}
          </section>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">Workspace users</h2>
              <p className="mt-1 text-sm text-slate-500">{totals.active} active accounts.</p>
            </div>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              onClick={() => loadUsers({ showLoading: true })}
              type="button"
            >
              <FiRefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-14 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
              <p className="mt-4 text-sm font-semibold text-slate-500">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-14 text-center">
              <FiUser className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-3 text-sm font-semibold text-slate-500">No users found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((teamMember) => {
                const draft = drafts[teamMember.id] || {};
                const isSelf = currentUser?.id === teamMember.id;
                const canEditRow = currentUser?.role !== "hr" || teamMember.role === "employee";
                const memberRoleOptions = roleOptions.some(([value]) => value === draft.role)
                  ? roleOptions
                  : [[draft.role, formatRole(draft.role)], ...roleOptions];

                return (
                  <article className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={teamMember.id}>
                    <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              statusStyles[teamMember.status] || statusStyles.active
                            }`}
                          >
                            {teamMember.status}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                            {formatRole(teamMember.role)}
                          </span>
                          {isSelf && (
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                              You
                            </span>
                          )}
                        </div>
                        <input
                          className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                          onChange={(event) => handleDraftChange(teamMember.id, "fullName", event.target.value)}
                          value={draft.fullName || ""}
                        />
                        <input
                          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                          onChange={(event) => handleDraftChange(teamMember.id, "email", event.target.value)}
                          type="email"
                          value={draft.email || ""}
                        />
                      </div>

                      <div className="grid gap-2">
                        <select
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                          disabled={!canEditRow}
                          onChange={(event) => handleDraftChange(teamMember.id, "role", event.target.value)}
                          value={draft.role || "employee"}
                        >
                          {memberRoleOptions.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <select
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                          disabled={!canEditRow || isSelf}
                          onChange={(event) => handleDraftChange(teamMember.id, "status", event.target.value)}
                          value={draft.status || "active"}
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </div>

                      <div className="grid gap-2">
                        <input
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                          onChange={(event) => handleDraftChange(teamMember.id, "designation", event.target.value)}
                          placeholder="Designation"
                          value={draft.designation || ""}
                        />
                        <input
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                          onChange={(event) => handleDraftChange(teamMember.id, "department", event.target.value)}
                          placeholder="Department"
                          value={draft.department || ""}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                      <button
                        className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={busyId === teamMember.id || !canEditRow}
                        onClick={() => handleSaveUser(teamMember.id)}
                        type="button"
                      >
                        <FiSave className="h-4 w-4" />
                        Save
                      </button>
                      <button
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={busyId === teamMember.id || isSelf || !canEditRow || teamMember.status === "suspended"}
                        onClick={() => handleSuspendUser(teamMember.id)}
                        type="button"
                      >
                        <FiSlash className="h-4 w-4" />
                        Suspend
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
};

export default UsersPage;
