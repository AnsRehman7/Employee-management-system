import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FiArrowRight, FiLock, FiMail } from "react-icons/fi";
import { NavLink, useNavigate } from "react-router-dom";
import Alert from "./Alert";
import { useFirebase } from "../context/firebase";
import { useUser } from "../context/UserContext";

const dashboardForUser = (user) => {
  if (user?.permissions?.canViewDashboard) return "/admin";
  if (user?.role === "employee") return "/employee";
  if (user?.role === "accounts") return "/projects";
  return "/tasks";
};

const Login = () => {
  const navigate = useNavigate();
  const { refreshUser } = useUser();
  const { formatFirebaseError, login, logout, signInWithGoogle } = useFirebase();
  const [form, setForm] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState({ message: "", type: "info" });

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const finishLogin = async () => {
    const profile = await refreshUser();
    navigate(dashboardForUser(profile), { replace: true });
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice({ message: "", type: "info" });

    try {
      await login(form.email, form.password);
      await finishLogin();
    } catch (error) {
      setNotice({ type: "error", message: formatFirebaseError(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setNotice({ message: "", type: "info" });

    try {
      await signInWithGoogle();
      await finishLogin();
    } catch (error) {
      if (error?.status === 400 || error?.status === 404) await logout().catch(() => {});
      setNotice({ type: "error", message: formatFirebaseError(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen max-w-full overflow-x-hidden bg-[#f5f7fb] text-slate-950 lg:h-screen lg:overflow-hidden">
      <div className="grid min-h-screen min-w-0 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden flex-col justify-between border-r border-slate-200 bg-white p-10 text-slate-950 lg:flex">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-violet-600">StaffFlow</p>
            <h1 className="mt-5 max-w-xl text-5xl font-bold tracking-tight">
              Get back to the work your team is moving today.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
              Organization-scoped dashboards, managed access, project delivery, and private employee task lists in one workspace.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              ["Projects", "Live delivery"],
              ["Users", "Role access"],
              ["Tasks", "Private work"],
            ].map(([label, helper]) => (
              <div className="rounded-lg border border-slate-200 bg-[#f8f8ff] p-4" key={label}>
                <p className="text-lg font-bold text-slate-950">{label}</p>
                <p className="mt-1 text-xs font-semibold uppercase text-slate-500">{helper}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex min-h-screen min-w-0 items-center justify-center px-4 py-4 sm:px-6">
          <div className="w-[calc(100vw-2rem)] min-w-0 max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-wide text-violet-700">Sign in</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Access StaffFlow</h2>
              <p className="mt-1 text-sm text-slate-500">Use your workspace email and password.</p>
            </div>

          <form onSubmit={handleLogin} className="min-w-0 space-y-4 [&_label]:min-w-0">
            <Alert message={notice.message} type={notice.type} />

            <label className="block">
              <span className="text-xs font-bold uppercase text-slate-600">Email</span>
              <div className="mt-1.5 flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 transition focus-within:border-violet-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
                <FiMail className="h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  required
                  name="email"
                  value={form.email}
                  onChange={updateField}
                  placeholder="you@company.com"
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase text-slate-600">Password</span>
              <div className="mt-1.5 flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 transition focus-within:border-violet-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
                <FiLock className="h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  required
                  name="password"
                  value={form.password}
                  onChange={updateField}
                  placeholder="Enter your password"
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                />
              </div>
            </label>

            <div className="flex items-center justify-end">
              <NavLink
                to="/forgot-password"
                className="text-sm font-semibold text-violet-700 transition hover:text-violet-800"
              >
                Forgot password?
              </NavLink>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
              {!isSubmitting && <FiArrowRight className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FcGoogle className="h-5 w-5" />
              Continue with Google
            </button>

            <p className="text-center text-sm text-slate-500">
              Starting a company workspace?{" "}
              <NavLink to="/signup" className="font-bold text-violet-700 hover:text-violet-800">
                Start a trial
              </NavLink>
            </p>
          </form>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;
