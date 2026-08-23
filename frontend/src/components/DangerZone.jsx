import { useState } from "react";
import { FiAlertTriangle, FiTrash2 } from "react-icons/fi";
import Alert from "./Alert";
import { api, formatApiError } from "../context/api";
import { useFirebase } from "../context/firebase";
import { useUser } from "../context/UserContext";

/**
 * Workspace deletion. Irreversible, so it is gated three ways: super admin only,
 * hidden behind an explicit reveal, and requires typing the workspace name exactly.
 * The server enforces all three again.
 */
const DangerZone = ({ organization }) => {
  const { user } = useUser();
  const { logout } = useFirebase();
  const [revealed, setRevealed] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  if (user?.role !== "super_admin" || !organization) return null;

  const matches = confirmation.trim() === organization.name;

  const remove = async (event) => {
    event.preventDefault();
    setDeleting(true);
    setError("");

    try {
      await api.deleteWorkspace(confirmation.trim());
      // The account no longer exists, so the session must end here rather than
      // leaving the app holding a token for a deleted workspace.
      await logout().catch(() => {});
      window.location.assign("/signup");
    } catch (requestError) {
      setError(formatApiError(requestError));
      setDeleting(false);
    }
  };

  return (
    <section className="scroll-mt-28 overflow-hidden rounded-lg border border-rose-200 bg-white shadow-sm" id="danger-zone">
      <div className="border-b border-rose-200 bg-rose-50 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
            <FiAlertTriangle className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-bold text-rose-900">Danger zone</h2>
            <p className="text-sm text-rose-800">Actions here cannot be undone.</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-sm font-bold text-slate-950">Delete this workspace</h3>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">
          Permanently removes {organization.name} and everything in it: every member account, project, task,
          meeting, attendance record, and the audit log. Members lose their sign-in immediately and their email
          addresses are freed, so they can start their own workspace afterwards. This cannot be reversed.
        </p>

        {!revealed ? (
          <button
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-rose-300 bg-white px-4 text-sm font-bold text-rose-700 transition hover:bg-rose-50"
            onClick={() => setRevealed(true)}
            type="button"
          >
            <FiTrash2 className="h-4 w-4" />
            Delete workspace
          </button>
        ) : (
          <form className="mt-4 max-w-md space-y-3" onSubmit={remove}>
            <Alert message={error} type="error" />

            <label className="block">
              <span className="text-xs font-bold text-slate-600">
                Type <span className="font-mono text-rose-700">{organization.name}</span> to confirm
              </span>
              <input
                autoComplete="off"
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder={organization.name}
                value={confirmation}
              />
            </label>

            <div className="flex gap-2">
              <button
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={!matches || deleting}
                type="submit"
              >
                <FiTrash2 className="h-4 w-4" />
                {deleting ? "Deleting..." : "Permanently delete"}
              </button>
              <button
                className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                onClick={() => {
                  setRevealed(false);
                  setConfirmation("");
                  setError("");
                }}
                type="button"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};

export default DangerZone;
