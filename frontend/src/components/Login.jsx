import { useEffect, useMemo, useRef, useState } from "react";
import { FiArrowLeft, FiArrowRight, FiLock, FiMail, FiShield } from "react-icons/fi";
import { NavLink, useNavigate } from "react-router-dom";
import Alert from "./Alert";
import { api, formatApiError } from "../context/api";
import { useFirebase } from "../context/firebase";
import { useUser } from "../context/UserContext";

const CODE_LENGTH = 6;

const dashboardForUser = (user) => {
  if (user?.permissions?.canViewDashboard) return "/admin";
  if (user?.role === "employee") return "/employee";
  if (user?.role === "accounts") return "/projects";
  return "/tasks";
};

const Login = () => {
  const navigate = useNavigate();
  const { refreshUser } = useUser();
  const { formatFirebaseError, login, loginWithCustomToken } = useFirebase();

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [notice, setNotice] = useState({ message: "", type: "info" });
  const codeInputRef = useRef(null);

  useEffect(() => {
    if (step === "code") codeInputRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = window.setInterval(() => setResendIn((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  const finishLogin = async () => {
    const profile = await refreshUser();
    navigate(dashboardForUser(profile), { replace: true });
  };

  const sendCode = async (event) => {
    event?.preventDefault();
    setIsSubmitting(true);
    setNotice({ message: "", type: "info" });

    try {
      const result = await api.requestSignInCode(email.trim().toLowerCase());
      setStep("code");
      setCode("");
      setResendIn(result.resendAfterSeconds || 60);
      setNotice({
        message: `If an account exists for ${email.trim().toLowerCase()}, a 6-digit code is on its way. It expires in ${Math.round((result.expiresInSeconds || 600) / 60)} minutes.`,
        type: "success",
      });
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyCode = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice({ message: "", type: "info" });

    try {
      const { customToken } = await api.verifySignInCode({ code, email: email.trim().toLowerCase() });
      await loginWithCustomToken(customToken);
      await finishLogin();
    } catch (requestError) {
      setNotice({
        message: requestError?.code ? formatFirebaseError(requestError) : formatApiError(requestError),
        type: "error",
      });
      setCode("");
      codeInputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const signInWithPassword = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice({ message: "", type: "info" });

    try {
      await login(email, password);
      await finishLogin();
    } catch (requestError) {
      setNotice({
        message: requestError?.code ? formatFirebaseError(requestError) : formatApiError(requestError),
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const maskedEmail = useMemo(() => {
    const [name = "", domain = ""] = email.trim().toLowerCase().split("@");
    if (!domain) return email;
    const visible = name.slice(0, Math.min(2, name.length));
    return `${visible}${"*".repeat(Math.max(1, name.length - visible.length))}@${domain}`;
  }, [email]);

  const fieldWrapClass =
    "mt-1.5 flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 transition focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-600/10";
  const primaryButtonClass =
    "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300";

  return (
    <main className="min-h-screen max-w-full overflow-x-hidden bg-[#f7f8f5] text-slate-950 lg:h-screen lg:overflow-hidden">
      <div className="grid min-h-screen min-w-0 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden flex-col justify-between border-r border-slate-200 bg-white p-10 text-slate-950 lg:flex">
          <div>
            <p className="text-sm font-bold uppercase tracking-normal text-emerald-700">StaffFlow</p>
            <h1 className="mt-5 max-w-xl text-5xl font-bold tracking-normal">
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
              <div className="rounded-lg border border-slate-200 bg-[#f4f7f4] p-4" key={label}>
                <p className="text-lg font-bold text-slate-950">{label}</p>
                <p className="mt-1 text-xs font-semibold uppercase text-slate-500">{helper}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex min-h-screen min-w-0 items-center justify-center px-4 py-4 sm:px-6">
          <div className="w-full min-w-0 max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-normal text-emerald-800">Sign in</p>
              <h2 className="mt-2 text-3xl font-bold tracking-normal text-slate-950">
                {step === "code" ? "Enter your code" : "Access StaffFlow"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {step === "code"
                  ? `We sent a 6-digit code to ${maskedEmail}.`
                  : usePassword
                    ? "Super admin break-glass access with your password."
                    : "Enter your workspace email and we will send you a one-time code."}
              </p>
            </div>

            {step === "email" && !usePassword && (
              <form className="min-w-0 space-y-4" onSubmit={sendCode}>
                <Alert message={notice.message} type={notice.type} />

                <label className="block">
                  <span className="text-xs font-bold uppercase text-slate-600">Email</span>
                  <div className={fieldWrapClass}>
                    <FiMail className="h-5 w-5 text-slate-400" />
                    <input
                      autoComplete="email"
                      className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                      name="email"
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@company.com"
                      required
                      type="email"
                      value={email}
                    />
                  </div>
                </label>

                <button className={primaryButtonClass} disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Sending code..." : "Send code"}
                  {!isSubmitting && <FiArrowRight className="h-4 w-4" />}
                </button>

                <p className="text-center text-sm text-slate-500">
                  Starting a company workspace?{" "}
                  <NavLink className="font-bold text-emerald-800 hover:text-emerald-900" to="/signup">
                    Start a trial
                  </NavLink>
                </p>

                <button
                  className="w-full text-center text-xs font-semibold text-slate-400 transition hover:text-slate-600"
                  onClick={() => {
                    setUsePassword(true);
                    setNotice({ message: "", type: "info" });
                  }}
                  type="button"
                >
                  Super admin? Sign in with a password
                </button>
              </form>
            )}

            {step === "email" && usePassword && (
              <form className="min-w-0 space-y-4" onSubmit={signInWithPassword}>
                <Alert message={notice.message} type={notice.type} />

                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <FiShield className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  <p className="text-xs leading-5 text-amber-900">
                    Password sign-in is reserved for the workspace super admin. Every other member signs in with an email code.
                  </p>
                </div>

                <label className="block">
                  <span className="text-xs font-bold uppercase text-slate-600">Email</span>
                  <div className={fieldWrapClass}>
                    <FiMail className="h-5 w-5 text-slate-400" />
                    <input
                      autoComplete="email"
                      className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                      name="email"
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@company.com"
                      required
                      type="email"
                      value={email}
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase text-slate-600">Password</span>
                  <div className={fieldWrapClass}>
                    <FiLock className="h-5 w-5 text-slate-400" />
                    <input
                      autoComplete="current-password"
                      className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                      name="password"
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      required
                      type="password"
                      value={password}
                    />
                  </div>
                </label>

                <div className="flex items-center justify-end">
                  <NavLink className="text-sm font-semibold text-emerald-800 transition hover:text-emerald-900" to="/forgot-password">
                    Forgot password?
                  </NavLink>
                </div>

                <button className={primaryButtonClass} disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Signing in..." : "Sign in"}
                  {!isSubmitting && <FiArrowRight className="h-4 w-4" />}
                </button>

                <button
                  className="inline-flex w-full items-center justify-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-slate-800"
                  onClick={() => {
                    setUsePassword(false);
                    setPassword("");
                    setNotice({ message: "", type: "info" });
                  }}
                  type="button"
                >
                  <FiArrowLeft className="h-3.5 w-3.5" />
                  Back to email code sign-in
                </button>
              </form>
            )}

            {step === "code" && (
              <form className="min-w-0 space-y-4" onSubmit={verifyCode}>
                <Alert message={notice.message} type={notice.type} />

                <label className="block">
                  <span className="text-xs font-bold uppercase text-slate-600">6-digit code</span>
                  <input
                    autoComplete="one-time-code"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-center font-mono text-2xl font-bold tracking-[0.5em] text-slate-950 outline-none transition placeholder:tracking-[0.4em] placeholder:text-slate-300 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                    inputMode="numeric"
                    maxLength={CODE_LENGTH}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
                    placeholder="000000"
                    ref={codeInputRef}
                    required
                    value={code}
                  />
                </label>

                <button className={primaryButtonClass} disabled={isSubmitting || code.length !== CODE_LENGTH} type="submit">
                  {isSubmitting ? "Verifying..." : "Verify and sign in"}
                  {!isSubmitting && <FiArrowRight className="h-4 w-4" />}
                </button>

                <div className="flex items-center justify-between gap-3">
                  <button
                    className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-slate-800"
                    onClick={() => {
                      setStep("email");
                      setCode("");
                      setNotice({ message: "", type: "info" });
                    }}
                    type="button"
                  >
                    <FiArrowLeft className="h-3.5 w-3.5" />
                    Use a different email
                  </button>

                  <button
                    className="text-xs font-bold text-emerald-800 transition hover:text-emerald-900 disabled:cursor-not-allowed disabled:text-slate-400"
                    disabled={isSubmitting || resendIn > 0}
                    onClick={sendCode}
                    type="button"
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;
