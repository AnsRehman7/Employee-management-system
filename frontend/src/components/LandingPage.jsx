import { createElement } from "react";
import {
  FiActivity,
  FiArrowRight,
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiCpu,
  FiDatabase,
  FiLayers,
  FiShield,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import {
  AttendanceMock,
  BoardMock,
  DashboardMock,
  InsightStrip,
  ReportsMock,
  RolesMock,
} from "./landing/ProductMocks";

const PROBLEMS = [
  {
    body: "Delivery status lives in one tool, attendance in another, and headcount in a spreadsheet. Nobody sees the whole picture.",
    title: "The answer is in four places",
  },
  {
    body: "Admin panels expose everything to everyone, so access gets managed by trust instead of by policy.",
    title: "Access is all-or-nothing",
  },
  {
    body: "By the time a project is visibly late, the capacity to fix it was already spent somewhere else.",
    title: "Problems surface too late",
  },
];

const CAPABILITIES = [
  {
    body: "Delivery health, workload, and attendance on one screen, scoped to what each role is allowed to see.",
    icon: FiBarChart2,
    title: "Executive dashboard",
  },
  {
    body: "List and Kanban views over the same data, with filters for assignee, project, priority, and due date.",
    icon: FiLayers,
    title: "Tasks and projects",
  },
  {
    body: "Verified device check-in inside an office geofence, with an auditable correction flow for exceptions.",
    icon: FiClock,
    title: "Attendance that holds up",
  },
  {
    body: "Six built-in roles plus any role you define, where a role can never grant more access than its author has.",
    icon: FiShield,
    title: "Roles you control",
  },
  {
    body: "Turn a brief into a staffed plan with dependencies and capacity checks, then approve before anything is created.",
    icon: FiCpu,
    title: "AI-assisted planning",
  },
  {
    body: "Add the fields and modules your operation actually uses, without waiting on a release.",
    icon: FiDatabase,
    title: "Custom modules",
  },
];

const SHOWCASE = [
  {
    body: "Delivery velocity, team workload, and department performance in one place, so you can see where capacity is going before you commit it somewhere else.",
    eyebrow: "Know before you commit",
    points: [
      "Task movement and delivery velocity over time",
      "Workload per person, with overload flagged early",
      "Department performance and at-risk projects surfaced",
    ],
    title: "Reports that answer the next question",
    visual: <ReportsMock />,
  },
  {
    body: "Move work the way your team thinks about it. The board and the list read the same data and the same filters, so switching view never changes the truth.",
    eyebrow: "Work the way you plan",
    points: ["Drag between columns to update status", "Filter by assignee, project, priority, due date", "Every change written to the audit log"],
    reverse: true,
    title: "List when you are scanning, board when you are planning",
    visual: <BoardMock />,
  },
  {
    body: "Attendance is recorded by a verified device scan inside your office geofence. Corrections go through review, so the register stays defensible.",
    eyebrow: "Time you can trust",
    points: ["Geofenced, single-use verified scans", "Late, short-day, and absence flags", "Reviewed corrections instead of silent edits"],
    title: "An attendance record that survives an audit",
    visual: <AttendanceMock />,
  },
];

const STEPS = [
  { body: "Create the workspace, set your calendar and offices, and invite your team.", title: "Set up in minutes" },
  { body: "Give each person a built-in or custom role. Access follows policy, not trust.", title: "Assign real roles" },
  { body: "Run delivery and attendance together, and see problems while they are still fixable.", title: "Operate with one view" },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-dvh bg-canvas text-slate-950">
      <nav className="sticky top-0 z-40 border-b border-slate-200/70 bg-canvas/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <button
            aria-label="DayMark home"
            className="flex items-center gap-3 text-left"
            onClick={() => navigate("/")}
            type="button"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-lg shadow-emerald-200">
              <FiLayers className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-lg font-bold">DayMark</span>
              <span className="block text-xs font-semibold uppercase text-slate-500">Work intelligence</span>
            </span>
          </button>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              className="hidden rounded-lg px-4 py-2 text-sm font-bold text-slate-600 transition hover:text-emerald-800 sm:block"
              onClick={() => navigate("/pricing")}
              type="button"
            >
              Pricing
            </button>
            <button
              className="rounded-lg px-4 py-2 text-sm font-bold text-slate-600 transition hover:text-emerald-800"
              onClick={() => navigate("/login")}
              type="button"
            >
              Login
            </button>
            <button
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-800"
              onClick={() => navigate("/signup")}
              type="button"
            >
              Free Trial
            </button>
          </div>
        </div>
      </nav>

      {/* Hero. Both columns are naturally short, so the fold needs no inner scrolling. */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 pb-16 pt-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:pb-20 lg:pt-14">
        <div className="animate-fade-in">
          <p className="inline-flex rounded-full border border-emerald-200 bg-white px-3.5 py-1.5 text-xs font-bold text-emerald-800 shadow-sm">
            AI-powered project and workforce management
          </p>
          <h1 className="mt-5 max-w-xl text-4xl font-bold leading-[1.1] tracking-tight text-slate-950 sm:text-5xl">
            Run projects, people, and attendance from one workspace.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">
            DayMark puts delivery health, team workload, and verified attendance on a single operating
            dashboard, scoped to what each role should see.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-800"
              onClick={() => navigate("/signup")}
              type="button"
            >
              Start free trial
              <FiArrowRight className="h-4 w-4" />
            </button>
            <button
              className="inline-flex h-12 items-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              onClick={() => navigate("/pricing")}
              type="button"
            >
              View pricing
            </button>
          </div>

          <p className="mt-4 text-xs font-semibold text-slate-500">
            14-day trial &middot; No credit card &middot; Passwordless sign-in
          </p>

          <div className="mt-8 max-w-md">
            <InsightStrip />
          </div>
        </div>

        <div className="animate-fade-in-slow lg:pl-4">
          <DashboardMock />
        </div>
      </section>

      {/* Outcome strip */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-8 lg:grid-cols-4">
          {[
            ["4 tools", "replaced by one workspace"],
            ["92%", "attendance visibility"],
            ["Minutes", "to staff a new project"],
            ["Every change", "written to the audit log"],
          ].map(([value, label]) => (
            <div key={label}>
              <p className="text-2xl font-bold text-slate-950">{value}</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Problem */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">The problem</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Running an operation should not need four tools and a spreadsheet.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PROBLEMS.map((problem) => (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" key={problem.title}>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
                <FiActivity className="h-4 w-4" />
              </span>
              <h3 className="mt-4 text-base font-bold text-slate-950">{problem.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{problem.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">What you get</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Everything the operation runs on, in one place.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((capability) => (
              <div
                className="rounded-xl border border-slate-200 bg-canvas p-6 transition hover:border-emerald-200 hover:shadow-md"
                key={capability.title}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                  {createElement(capability.icon, { className: "h-5 w-5" })}
                </span>
                <h3 className="mt-4 text-base font-bold text-slate-950">{capability.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{capability.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product showcase */}
      <section className="mx-auto max-w-7xl space-y-16 px-6 py-16 lg:space-y-24 lg:py-24">
        {SHOWCASE.map((item) => (
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14" key={item.title}>
            <div className={item.reverse ? "lg:order-2" : ""}>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{item.eyebrow}</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{item.title}</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">{item.body}</p>
              <ul className="mt-6 space-y-3">
                {item.points.map((point) => (
                  <li className="flex items-start gap-3" key={point}>
                    <FiCheckCircle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-emerald-600" />
                    <span className="text-sm font-medium leading-6 text-slate-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={item.reverse ? "lg:order-1" : ""}>{item.visual}</div>
          </div>
        ))}
      </section>

      {/* Governance */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:gap-14 lg:py-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Built for governance</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Access follows policy, not trust.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Define any role your operation needs. A role can never carry a permission its author does not
              already hold, and it always sits below its creator in the hierarchy, so delegation cannot become
              escalation.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ["Passwordless sign-in", FiShield],
                ["3-day session limit", FiClock],
                ["Full audit trail", FiTrendingUp],
                ["Per-account overrides", FiUsers],
              ].map(([label, Icon]) => (
                <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-canvas px-3 py-2.5" key={label}>
                  {createElement(Icon, { className: "h-4 w-4 shrink-0 text-emerald-700" })}
                  <span className="text-sm font-semibold text-slate-700">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <RolesMock />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">How it works</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Live on day one, not next quarter.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <div className="relative rounded-xl border border-slate-200 bg-white p-6 shadow-sm" key={step.title}>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-sm font-bold text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 text-base font-bold text-slate-950">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-16 lg:pb-24">
        <div className="overflow-hidden rounded-2xl bg-[#0b2b36] px-6 py-14 text-center shadow-2xl sm:px-12">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Put delivery, people, and time on one screen.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-300">
            Start a 14-day trial, become the workspace super admin, and invite your team into scoped dashboards.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-emerald-600 px-6 text-sm font-bold text-white transition hover:bg-emerald-500"
              onClick={() => navigate("/signup")}
              type="button"
            >
              Start free trial
              <FiArrowRight className="h-4 w-4" />
            </button>
            <button
              className="inline-flex h-12 items-center rounded-lg border border-white/20 px-6 text-sm font-bold text-white transition hover:bg-white/10"
              onClick={() => navigate("/pricing")}
              type="button"
            >
              Compare plans
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-white">
              <FiLayers className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold text-slate-950">DayMark</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-semibold text-slate-500">
            <button className="transition hover:text-emerald-800" onClick={() => navigate("/pricing")} type="button">
              Pricing
            </button>
            <button className="transition hover:text-emerald-800" onClick={() => navigate("/login")} type="button">
              Login
            </button>
            <button className="transition hover:text-emerald-800" onClick={() => navigate("/signup")} type="button">
              Start trial
            </button>
          </div>
          <p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} DayMark</p>
        </div>
      </footer>
    </main>
  );
};

export default LandingPage;
