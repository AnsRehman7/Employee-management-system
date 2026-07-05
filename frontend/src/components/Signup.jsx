import { FcGoogle } from "react-icons/fc";
import { FiArrowRight, FiBriefcase, FiLock, FiMail, FiPhone, FiUser } from "react-icons/fi";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Alert from "./Alert";
import { useFirebase } from "../context/firebase";
import { useUser } from "../context/UserContext";

const dashboardForRole = (role) => (["admin", "hr"].includes(role) ? "/admin" : "/employee");

const Signup = () => {
  const { setUser } = useUser();
  const navigate = useNavigate();
  const { formatFirebaseError, getProfile, signup, signupWithGoogle } = useFirebase();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "employee",
    contact: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState({ message: "", type: "info" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const completeSignup = async (firebaseUser) => {
    const profile = await getProfile(firebaseUser.uid);
    setUser(profile);
    navigate(dashboardForRole(profile.role), { replace: true });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotice({ message: "", type: "info" });

    if (formData.password.length < 6) {
      setNotice({ type: "error", message: "Password must be at least 6 characters." });
      setIsSubmitting(false);
      return;
    }

    try {
      const firebaseUser = await signup(formData);
      await completeSignup(firebaseUser);
    } catch (error) {
      setNotice({ type: "error", message: formatFirebaseError(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsSubmitting(true);
    setNotice({ message: "", type: "info" });

    try {
      const firebaseUser = await signupWithGoogle(formData.role);
      await completeSignup(firebaseUser);
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
            Build a workspace that knows who should see what.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
            Create a profile, choose the correct role, and start routing assignments to the right
            employees without cluttering everyone else's dashboard.
          </p>
        </section>

        <section className="mx-auto w-full max-w-xl rounded-lg border border-white/10 bg-white p-8 text-slate-950 shadow-2xl shadow-slate-950/30">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
              Create account
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">Join StaffFlow</h2>
            <p className="mt-2 text-sm text-slate-500">Set up your profile and workspace role.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <Alert message={notice.message} type={notice.type} />

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">Full name</span>
                <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10">
                  <FiUser className="h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Ayesha Noor"
                    className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">Email</span>
                <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10">
                  <FiMail className="h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
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
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Contact</span>
                <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10">
                  <FiPhone className="h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    placeholder="Optional"
                    className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">Workspace role</span>
                <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10">
                  <FiBriefcase className="h-5 w-5 text-slate-400" />
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full bg-transparent text-sm font-semibold text-slate-950 outline-none"
                  >
                    <option value="employee">Employee</option>
                    <option value="hr">HR</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? "Creating account..." : "Create account"}
              {!isSubmitting && <FiArrowRight className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FcGoogle className="h-5 w-5" />
              Continue with Google
            </button>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <NavLink to="/login" className="font-bold text-emerald-700 hover:text-emerald-800">
                Sign in
              </NavLink>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
};

export default Signup;
