import { useEffect, useMemo, useRef, useState } from "react";
import { FiArrowLeft, FiLock, FiMail, FiShield } from "react-icons/fi";
import { NavLink, useNavigate } from "react-router-dom";
import Alert from "./Alert";
import AuthLayout from "./AuthLayout";
import { AuthField, AuthPasswordField, AuthSubmitButton } from "./AuthFields";
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
        message: `If an account exists for that address, a 6-digit code is on its way. It expires in ${Math.round((result.expiresInSeconds || 600) / 60)} minutes.`,
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

  const copy = {
    code: {
      eyebrow: "Check your inbox",
      subtitle: `We sent a 6-digit code to ${maskedEmail}.`,
      title: "Enter your code",
    },
    email: {
      eyebrow: "Welcome back",
      subtitle: "Enter your workspace email and we will send you a one-time code.",
      title: "Sign in to StaffFlow",
    },
    password: {
      eyebrow: "Break-glass access",
      subtitle: "Super admin sign-in with a password, for when email is unavailable.",
      title: "Sign in with password",
    },
  }[step === "code" ? "code" : usePassword ? "password" : "email"];

  return (
    <AuthLayout
      eyebrow={copy.eyebrow}
      footer={
        step === "email" && !usePassword ? (
          <>
            Starting a company workspace?{" "}
            <NavLink className="font-bold text-emerald-700 transition hover:text-emerald-800" to="/signup">
              Start a trial
            </NavLink>
          </>
        ) : null
      }
      panelEyebrow="Plan with confidence"
      panelText="Keep delivery, people, and time organized and make the day easier for your whole team."
      panelTitle="Every task, teammate, and update in one clear view."
      subtitle={copy.subtitle}
      title={copy.title}
    >
      {step === "email" && !usePassword && (
        <form className="space-y-5" onSubmit={sendCode}>
          <Alert message={notice.message} type={notice.type} />

          <AuthField
            autoComplete="email"
            icon={FiMail}
            label="Email address"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@company.com"
            required
            type="email"
            value={email}
          />

          <AuthSubmitButton disabled={isSubmitting} loading={isSubmitting} loadingLabel="Sending code...">
            Send code
          </AuthSubmitButton>

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
        <form className="space-y-5" onSubmit={signInWithPassword}>
          <Alert message={notice.message} type={notice.type} />

          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <FiShield className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <p className="text-xs leading-5 text-amber-900">
              Password sign-in is reserved for the workspace super admin. Everyone else signs in with an email code.
            </p>
          </div>

          <AuthField
            autoComplete="email"
            icon={FiMail}
            label="Email address"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@company.com"
            required
            type="email"
            value={email}
          />

          <AuthPasswordField
            autoComplete="current-password"
            icon={FiLock}
            label="Password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            required
            value={password}
          />

          <div className="flex justify-end">
            <NavLink
              className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
              to="/forgot-password"
            >
              Forgot password?
            </NavLink>
          </div>

          <AuthSubmitButton disabled={isSubmitting} loading={isSubmitting} loadingLabel="Signing in...">
            Sign in
          </AuthSubmitButton>

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
        <form className="space-y-5" onSubmit={verifyCode}>
          <Alert message={notice.message} type={notice.type} />

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">6-digit code</span>
            <input
              autoComplete="one-time-code"
              className="h-14 w-full rounded-lg border border-slate-200 bg-white text-center font-mono text-2xl font-bold tracking-[0.45em] text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
              inputMode="numeric"
              maxLength={CODE_LENGTH}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
              placeholder="000000"
              ref={codeInputRef}
              required
              value={code}
            />
          </label>

          <AuthSubmitButton
            disabled={isSubmitting || code.length !== CODE_LENGTH}
            loading={isSubmitting}
            loadingLabel="Verifying..."
          >
            Verify and sign in
          </AuthSubmitButton>

          <div className="flex items-center justify-between gap-3">
            <button
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-800"
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
              className="text-xs font-bold text-emerald-700 transition hover:text-emerald-800 disabled:cursor-not-allowed disabled:text-slate-400"
              disabled={isSubmitting || resendIn > 0}
              onClick={sendCode}
              type="button"
            >
              {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

export default Login;
