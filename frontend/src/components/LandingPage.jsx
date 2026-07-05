import { FiArrowRight, FiCheckCircle, FiLayers, FiShield, FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-3 text-left"
          aria-label="StaffFlow home"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/30">
            <FiLayers className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-lg font-bold tracking-tight">StaffFlow</span>
            <span className="block text-xs font-medium text-slate-400">Workforce operations</span>
          </span>
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/login")}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            Login
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-300"
          >
            Sign Up
          </button>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-16 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-16">
        <div className="animate-fade-in">
          <p className="mb-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200">
            StaffFlow
          </p>
          <h1 className="max-w-4xl text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
            Assign work with clarity. Track it without noise.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            A focused task workspace for admins, HR teams, and employees. Assign tasks to the
            right person, keep employee views private, and manage work from one clean dashboard.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => navigate("/signup")}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-400 px-6 py-3 text-sm font-black text-slate-950 shadow-xl shadow-emerald-950/30 transition hover:bg-emerald-300"
            >
              Create workspace
              <FiArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center justify-center rounded-lg border border-white/15 px-6 py-3 text-sm font-bold text-white transition hover:border-white/30 hover:bg-white/10"
            >
              Sign in
            </button>
          </div>

          <div className="mt-10 grid gap-4 text-sm text-slate-300 sm:grid-cols-3">
            {["Role-based access", "Employee-only task views", "Firebase-backed workflow"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <FiCheckCircle className="h-4 w-4 text-emerald-300" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative animate-fade-in-slow">
          <div className="rounded-lg border border-white/10 bg-white p-4 text-slate-950 shadow-2xl shadow-slate-950/40">
            <div className="rounded-lg bg-slate-50 p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-500">Today</p>
                  <h2 className="text-2xl font-black text-slate-950">Operations board</h2>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  Live
                </span>
              </div>

              <div className="grid gap-3">
                {[
                  ["Sarah Khan", "Payroll audit", "Due Friday", "emerald"],
                  ["Hamza Ali", "Client handoff notes", "In progress", "sky"],
                  ["Ayesha Noor", "Onboarding checklist", "New", "amber"],
                ].map(([name, task, meta, tone]) => (
                  <div key={task} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-950">{task}</p>
                        <p className="mt-1 text-sm text-slate-500">{name}</p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          tone === "emerald"
                            ? "bg-emerald-100 text-emerald-700"
                            : tone === "sky"
                              ? "bg-sky-100 text-sky-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {meta}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-950 p-4 text-white">
                  <FiUsers className="mb-3 h-5 w-5 text-emerald-300" />
                  <p className="text-2xl font-black">24</p>
                  <p className="text-xs font-semibold text-slate-400">Team members</p>
                </div>
                <div className="rounded-lg bg-emerald-500 p-4 text-slate-950">
                  <FiShield className="mb-3 h-5 w-5" />
                  <p className="text-2xl font-black">Private</p>
                  <p className="text-xs font-semibold">Employee task scope</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default LandingPage;
