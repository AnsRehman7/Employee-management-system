import { FiCheckCircle, FiClock } from "react-icons/fi";
import ThemeToggle from "./ThemeToggle";

const DEFAULT_FEATURES = [
  "Assign work and track delivery in one place",
  "Verified attendance with office geofencing",
  "Role-based access across every module",
];

/**
 * Two-panel shell shared by sign in, sign up, the code step, and password reset so
 * every entry point into the product reads as one screen.
 */
const AuthLayout = ({
  children,
  eyebrow,
  features = DEFAULT_FEATURES,
  featuresTitle = "Work management",
  footer,
  panelEyebrow = "Plan with confidence",
  panelText = "Keep delivery, people, and time organized and make the day easier for your whole team.",
  panelTitle = "Every task, teammate, and update in one clear view.",
  secureNote = "Secure access to your StaffFlow workspace",
  subtitle,
  title,
}) => (
  <main className="relative flex min-h-dvh items-center justify-center bg-slate-100 px-4 py-5 text-slate-950 sm:px-6 sm:py-8">
    <ThemeToggle className="absolute right-4 top-4 shadow-sm sm:right-6 sm:top-6" />

    <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-300/60 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[#0b2b36] p-8 text-white lg:flex xl:p-9">
        {/* Decorative rings, echoing the reference layout. */}
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-40 h-80 w-80 rounded-full border border-white/[0.07]" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-900/40">
              SF
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-bold tracking-tight">StaffFlow</p>
              <p className="mt-0.5 text-xs font-medium text-slate-400">Work intelligence</p>
            </div>
          </div>

          <p className="mt-9 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-400">
            {panelEyebrow}
          </p>
          <h1 className="mt-3.5 max-w-md text-4xl font-bold leading-[1.15] text-white">
            {panelTitle}
          </h1>
          <p className="mt-3.5 max-w-sm text-sm leading-6 text-slate-400">{panelText}</p>

          <div className="mt-7 max-w-sm rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
              {featuresTitle}
            </p>
            <ul className="mt-3.5 space-y-3">
              {features.map((feature) => (
                <li className="flex items-start gap-3" key={feature}>
                  <FiCheckCircle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-emerald-400" />
                  <span className="text-sm font-medium leading-5 text-slate-200">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative mt-8 flex items-center gap-2 text-xs font-medium text-slate-500">
          <FiClock className="h-4 w-4" />
          Built for everyday operations
        </div>
      </section>

      <section className="flex min-w-0 items-center justify-center bg-white px-6 py-8 sm:px-9 sm:py-9">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
              SF
            </span>
            <span className="text-sm font-bold text-slate-950">StaffFlow</span>
          </div>

          {eyebrow && (
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">{eyebrow}</p>
          )}
          <h2 className="mt-1.5 text-2xl font-bold text-slate-950">{title}</h2>
          {subtitle && <p className="mt-1.5 text-sm leading-6 text-slate-500">{subtitle}</p>}

          <div className="mt-6">{children}</div>

          {footer && <div className="mt-5 text-center text-sm text-slate-500">{footer}</div>}

          {secureNote && (
            <p className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-400">
              {secureNote}
            </p>
          )}
        </div>
      </section>
    </div>
  </main>
);

export default AuthLayout;
