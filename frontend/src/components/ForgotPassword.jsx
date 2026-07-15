import { useState } from "react";
import { FiArrowLeft, FiMail } from "react-icons/fi";
import { NavLink } from "react-router-dom";
import Alert from "./Alert";
import { useFirebase } from "../context/firebase";

const ForgotPassword = () => {
  const { formatFirebaseError, sendResetPassword } = useFirebase();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState({ message: "", type: "info" });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice({ message: "", type: "info" });

    try {
      await sendResetPassword(email);
      setNotice({
        type: "success",
        message: "Password reset instructions have been sent to your email.",
      });
    } catch (error) {
      setNotice({ type: "error", message: formatFirebaseError(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-4 py-4 text-slate-950">
        <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
          <NavLink
            to="/login"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-violet-700"
          >
            <FiArrowLeft className="h-4 w-4" />
            Back to login
          </NavLink>

          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wide text-violet-700">StaffFlow</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Reset your password</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Enter your account email and Firebase will send a secure reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Alert message={notice.message} type={notice.type} />

            <label className="block">
              <span className="text-xs font-bold uppercase text-slate-600">Work email</span>
              <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 transition focus-within:border-violet-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
                <FiMail className="h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? "Sending reset link..." : "Send reset link"}
            </button>
          </form>
        </section>
    </main>
  );
};

export default ForgotPassword;
