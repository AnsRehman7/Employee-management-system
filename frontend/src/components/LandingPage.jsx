import { FiArrowRight, FiBarChart2, FiCheckCircle, FiLayers, FiShield, FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8f5] text-slate-950">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-3 text-left"
          aria-label="StaffFlow home"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-lg shadow-emerald-200">
            <FiLayers className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-lg font-bold tracking-normal">StaffFlow</span>
            <span className="block text-xs font-semibold uppercase text-slate-500">Work intelligence</span>
          </span>
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/pricing")}
            className="rounded-lg px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-white hover:text-emerald-800"
          >
            Pricing
          </button>
          <button
            onClick={() => navigate("/login")}
            className="rounded-lg px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-white hover:text-emerald-800"
          >
            Login
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-800"
          >
            Free Trial
          </button>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-16 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-16">
        <div className="animate-fade-in">
          <p className="mb-5 inline-flex rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-emerald-800 shadow-sm">
            AI-powered project and workforce management
          </p>
          <h1 className="max-w-4xl text-5xl font-bold tracking-normal text-slate-950 sm:text-6xl lg:text-7xl">
            Run projects, people, and attendance from one executive workspace.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            StaffFlow gives leadership an operating dashboard first: delivery health, team workload,
            attendance, and role-scoped work views without the admin-panel clutter.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => navigate("/pricing")}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-emerald-200 transition hover:bg-emerald-800"
            >
              View pricing
              <FiArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-800"
            >
              Sign in
            </button>
          </div>

          <div className="mt-10 grid gap-4 text-sm text-slate-600 sm:grid-cols-3">
            {["Executive dashboard", "Role-based access", "Attendance intelligence"].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <FiCheckCircle className="h-4 w-4 text-emerald-700" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative animate-fade-in-slow">
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-slate-950 shadow-2xl shadow-slate-200/80">
            <div className="rounded-lg bg-[#f4f7f4] p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-emerald-700">Executive dashboard</p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-950">Nexora workspace</h2>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  Live
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["12", "Active projects", <FiLayers className="h-4 w-4" />],
                  ["48", "Team members", <FiUsers className="h-4 w-4" />],
                  ["92%", "Attendance", <FiShield className="h-4 w-4" />],
                ].map(([value, label, icon]) => (
                  <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                      {icon}
                    </span>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="mt-1 text-xs font-bold uppercase text-slate-500">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">Work completion</p>
                    <p className="mt-1 text-xl font-bold">1,248 tasks</p>
                  </div>
                  <FiBarChart2 className="h-5 w-5 text-teal-600" />
                </div>
                <div className="flex h-28 items-end gap-2">
                  {[32, 42, 38, 56, 51, 70, 78].map((height, index) => (
                    <div className="flex flex-1 flex-col justify-end" key={index}>
                      <div className="rounded-t-md bg-emerald-600/80" style={{ height: `${height}%` }} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {[
                  ["Campus ERP modernization", "Project workspace", "78% progress", "emerald"],
                  ["Attendance export validation", "Operations report", "Review", "teal"],
                  ["Dashboard responsive states", "Frontend polish", "Medium", "amber"],
                ].map(([name, task, meta, tone]) => (
                  <div key={task} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-950">{name}</p>
                        <p className="mt-1 text-sm text-slate-500">{task}</p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          tone === "emerald"
                            ? "bg-emerald-100 text-emerald-800"
                            : tone === "teal"
                              ? "bg-teal-100 text-teal-800"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {meta}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default LandingPage;
