import { useState } from "react";
import { FiLogOut, FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Alert from "./Alert";
import { useFirebase } from "../context/firebase";
import { useUser } from "../context/UserContext";

const Header = ({ subtitle = "", title = "Workspace" }) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { formatFirebaseError, logout } = useFirebase();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState("");

  const handleLogout = async () => {
    setIsSigningOut(true);
    setError("");

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      setError(formatFirebaseError(error));
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
            StaffFlow
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white">
              <FiUser className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-950">{user?.name || "Team member"}</p>
              <p className="text-xs font-semibold uppercase text-slate-500">{user?.role || "employee"}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={isSigningOut}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <FiLogOut className="h-4 w-4" />
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </nav>
      {error && (
        <div className="mx-auto max-w-7xl px-4 pb-4 lg:px-6">
          <Alert message={error} type="error" />
        </div>
      )}
    </header>
  );
};

export default Header;
