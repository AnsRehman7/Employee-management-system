import { FiArrowRight, FiCheckCircle, FiLayers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Trial",
    price: "$0",
    description: "For companies setting up StaffFlow for the first time.",
    features: ["14-day workspace trial", "Super admin account", "Projects, tasks, and user roles", "Hours logging"],
    cta: "Start free trial",
    featured: true,
  },
  {
    name: "Growth",
    price: "$29",
    description: "For small teams running recurring client or internal work.",
    features: ["Role-based access", "Manager and HR modules", "Project progress tracking", "Accounts read-only access"],
    cta: "Choose Growth",
    featured: false,
  },
  {
    name: "Company",
    price: "Custom",
    description: "For teams that need stricter controls and operational reporting.",
    features: ["Advanced permissions", "Audit-ready activity", "Priority support", "Future billing controls"],
    cta: "Talk to sales",
    featured: false,
  },
];

const PricingPage = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <button className="flex items-center gap-3 text-left" onClick={() => navigate("/")} type="button">
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
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            onClick={() => navigate("/login")}
            type="button"
          >
            Login
          </button>
          <button
            className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-300"
            onClick={() => navigate("/signup")}
            type="button"
          >
            Free Trial
          </button>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-6 pb-20 pt-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Pricing</p>
          <h1 className="mt-4 text-5xl font-black tracking-tight text-white sm:text-6xl">
            Start lean. Add structure as the company grows.
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            StaffFlow starts with a free trial workspace and scales into role-based operations for managers, HR,
            accounts, and employees.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              className={`rounded-lg border p-6 shadow-2xl shadow-slate-950/30 ${
                plan.featured ? "border-emerald-300 bg-white text-slate-950" : "border-white/10 bg-white/5 text-white"
              }`}
              key={plan.name}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black">{plan.name}</h2>
                  <p className={`mt-2 text-sm leading-6 ${plan.featured ? "text-slate-600" : "text-slate-300"}`}>
                    {plan.description}
                  </p>
                </div>
                {plan.featured && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                    Best start
                  </span>
                )}
              </div>

              <div className="mt-8 flex items-end gap-2">
                <span className="text-5xl font-black">{plan.price}</span>
                {plan.price !== "Custom" && <span className="pb-2 text-sm font-semibold opacity-70">/mo</span>}
              </div>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li className="flex gap-3 text-sm font-semibold" key={feature}>
                    <FiCheckCircle className={plan.featured ? "mt-0.5 h-4 w-4 text-emerald-600" : "mt-0.5 h-4 w-4 text-emerald-300"} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-black transition ${
                  plan.featured
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 hover:bg-emerald-700"
                    : "border border-white/15 text-white hover:border-white/30 hover:bg-white/10"
                }`}
                onClick={() => navigate("/signup")}
                type="button"
              >
                {plan.cta}
                <FiArrowRight className="h-4 w-4" />
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default PricingPage;
