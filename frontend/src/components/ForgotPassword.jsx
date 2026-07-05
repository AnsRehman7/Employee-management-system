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
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <section className="w-full max-w-md rounded-lg border border-white/10 bg-white p-8 text-slate-950 shadow-2xl shadow-slate-950/30">
          <NavLink
            to="/login"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-700"
          >
            <FiArrowLeft className="h-4 w-4" />
            Back to login
          </NavLink>

          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
              StaffFlow
            </p>
            <h1 className="mt-3 text-3xl font-bold text-slate-950">Reset your password</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Enter your account email and Firebase will send a secure reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Alert message={notice.message} type={notice.type} />

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Work email</span>
              <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10">
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
              className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? "Sending reset link..." : "Send reset link"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
};

export default ForgotPassword;
