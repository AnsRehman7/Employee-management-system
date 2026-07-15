import { FcGoogle } from "react-icons/fc";
import { FiArrowRight, FiBriefcase, FiLock, FiMail, FiPhone, FiUser } from "react-icons/fi";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Alert from "./Alert";
import { useFirebase } from "../context/firebase";
import { useUser } from "../context/UserContext";

const dashboardForRole = (role) => {
  if (["super_admin", "admin", "manager", "hr"].includes(role)) return "/admin";
  if (role === "accounts") return "/projects";
  return "/employee";
};

const Signup = () => {
  const { refreshUser } = useUser();
  const navigate = useNavigate();
  const { formatFirebaseError, signup, signupWithGoogle } = useFirebase();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    contact: "",
    designation: "",
    organizationName: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState({ message: "", type: "info" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const completeSignup = async () => {
    const profile = await refreshUser({
      contact: formData.contact,
      designation: formData.designation,
      fullName: formData.fullName,
      organizationName: formData.organizationName,
    });
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
      await signup(formData);
      await completeSignup();
    } catch (error) {
      setNotice({ type: "error", message: formatFirebaseError(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateGoogleSignup = () => {
    if (!formData.organizationName.trim() || !formData.fullName.trim()) {
      setNotice({
        type: "error",
        message: "Add the company name and your full name before continuing with Google.",
      });
      return false;
    }

    return true;
  };

  const handleGoogleSignup = async () => {
    if (!validateGoogleSignup()) return;

    setIsSubmitting(true);
    setNotice({ message: "", type: "info" });

    try {
      await signupWithGoogle();
      await completeSignup();
    } catch (error) {
      setNotice({ type: "error", message: formatFirebaseError(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950 lg:h-screen lg:overflow-hidden">
      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden flex-col justify-between border-r border-slate-200 bg-white p-10 text-slate-950 lg:flex">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-violet-600">StaffFlow</p>
            <h1 className="mt-5 max-w-xl text-5xl font-bold tracking-tight">
              Start a workspace that already knows who can do what.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
              Create the company, become the super admin, then invite managers, HR, accounts, and employees into scoped dashboards.
            </p>
          </div>

          <div className="grid gap-3">
            {[
              ["Role control", "Super admin, admin, manager, HR, accounts, and employee access."],
              ["Private work", "Employees only see assignments connected to their account."],
              ["Operations view", "Projects, attendance, and task progress stay in one workspace."],
            ].map(([title, text]) => (
              <div className="rounded-lg border border-slate-200 bg-[#f8f8ff] p-4" key={title}>
                <p className="text-sm font-bold text-slate-950">{title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-4 sm:px-6">
          <div className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 sm:p-6">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-wide text-violet-700">Free trial</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Create workspace</h2>
              <p className="mt-1 text-sm text-slate-500">Start a 14-day trial and become the workspace super admin.</p>
            </div>

          <form onSubmit={handleSignup} className="space-y-3">
            <Alert message={notice.message} type={notice.type} />

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold uppercase text-slate-600">Company name</span>
                <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 transition focus-within:border-violet-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
                  <FiBriefcase className="h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    name="organizationName"
                    required
                    value={formData.organizationName}
                    onChange={handleChange}
                    placeholder="Prime Dumpster LLC"
                    className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase text-slate-600">Full name</span>
                <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 transition focus-within:border-violet-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
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

              <label className="block">
                <span className="text-xs font-bold uppercase text-slate-600">Email</span>
                <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 transition focus-within:border-violet-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
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
                <span className="text-xs font-bold uppercase text-slate-600">Password</span>
                <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 transition focus-within:border-violet-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
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
                <span className="text-xs font-bold uppercase text-slate-600">Contact</span>
                <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 transition focus-within:border-violet-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
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

              <label className="block">
                <span className="text-xs font-bold uppercase text-slate-600">Designation</span>
                <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 transition focus-within:border-violet-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
                  <FiBriefcase className="h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    placeholder="Founder / Operations Lead"
                    className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? "Creating workspace..." : "Start free trial"}
              {!isSubmitting && <FiArrowRight className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FcGoogle className="h-5 w-5" />
              Continue with Google
            </button>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <NavLink to="/login" className="font-bold text-violet-700 hover:text-violet-800">
                Sign in
              </NavLink>
            </p>
          </form>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Signup;
