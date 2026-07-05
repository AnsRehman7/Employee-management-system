import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FiArrowRight, FiLock, FiMail } from "react-icons/fi";
import { NavLink, useNavigate } from "react-router-dom";
import Alert from "./Alert";
import { useFirebase } from "../context/firebase";
import { useUser } from "../context/UserContext";

const dashboardForRole = (role) => (["admin", "hr"].includes(role) ? "/admin" : "/employee");

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const { formatFirebaseError, getProfile, login, signupWithGoogle } = useFirebase();
  const [form, setForm] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState({ message: "", type: "info" });

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const finishLogin = async (firebaseUser) => {
    const profile = await getProfile(firebaseUser.uid);
    setUser(profile);
    navigate(dashboardForRole(profile.role), { replace: true });
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice({ message: "", type: "info" });

    try {
      const firebaseUser = await login(form.email, form.password);
      await finishLogin(firebaseUser);
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
      const firebaseUser = await signupWithGoogle();
      await finishLogin(firebaseUser);
    } catch (error) {
      setNotice({ type: "error", message: formatFirebaseError(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden lg:block">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
            StaffFlow
          </p>
          <h1 className="mt-4 text-5xl font-black tracking-tight text-white">
            Welcome back to your team workspace.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
            Keep assignments moving with role-aware dashboards, private employee task lists, and
            Firebase-backed updates.
          </p>
        </section>

        <section className="mx-auto w-full max-w-md rounded-lg border border-white/10 bg-white p-8 text-slate-950 shadow-2xl shadow-slate-950/30">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
              Sign in
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">Access StaffFlow</h2>
            <p className="mt-2 text-sm text-slate-500">Use your workspace email and password.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <Alert message={notice.message} type={notice.type} />

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Email</span>
              <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10">
                <FiMail className="h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  required
                  name="email"
                  value={form.email}
                  onChange={updateField}
                  placeholder="you@company.com"
                  className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Password</span>
              <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10">
                <FiLock className="h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  required
                  name="password"
                  value={form.password}
                  onChange={updateField}
                  placeholder="Enter your password"
                  className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                />
              </div>
            </label>

            <div className="flex items-center justify-end">
              <NavLink
                to="/forgot-password"
                className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
              >
                Forgot password?
              </NavLink>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
              {!isSubmitting && <FiArrowRight className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FcGoogle className="h-5 w-5" />
              Continue with Google
            </button>

            <p className="text-center text-sm text-slate-500">
              Do not have an account?{" "}
              <NavLink to="/signup" className="font-bold text-emerald-700 hover:text-emerald-800">
                Create one
              </NavLink>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
};

export default Login;
