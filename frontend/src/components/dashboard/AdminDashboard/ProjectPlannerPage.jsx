import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCheck,
  FiClock,
  FiCpu,
  FiGitBranch,
  FiLayers,
  FiPlus,
  FiRefreshCw,
  FiTarget,
  FiTrendingUp,
  FiTrash2,
  FiUserCheck,
  FiX,
} from "react-icons/fi";
import { Link, useParams } from "react-router-dom";
import Alert from "../../Alert";
import AppShell from "../../AppShell";
import LoadingScreen from "../../LoadingScreen";
import { api, formatApiError } from "../../../context/api";
import { useUser } from "../../../context/UserContext";

const fieldClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
const emptyRequirement = () => ({ acceptanceCriteria: "", description: "", priority: "must", title: "" });
const labelize = (value = "") => value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
const tone = {
  critical: "border-rose-200 bg-rose-50 text-rose-700",
  high: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  medium: "border-teal-200 bg-teal-50 text-teal-800",
};

const Metric = ({ label, suffix = "", value }) => (
  <div className="min-w-0 border-r border-slate-200 px-4 py-3 last:border-r-0">
    <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
    <p className="mt-1 text-xl font-bold text-slate-950">{value ?? 0}{suffix}</p>
  </div>
);

const ProjectPlannerPage = () => {
  const { projectId } = useParams();
  const { user } = useUser();
  const [project, setProject] = useState(null);
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [requirements, setRequirements] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [activeView, setActiveView] = useState("schedule");
  const [manualBaselineMinutes, setManualBaselineMinutes] = useState(120);
  const [reviewDurationSeconds, setReviewDurationSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [{ project: nextProject }, { plans: nextPlans }, { employees }] = await Promise.all([
        api.getProject(projectId),
        api.getProjectPlans(projectId),
        api.getEmployees(),
      ]);
      setProject(nextProject);
      setPlans(nextPlans);
      setMembers(employees);
      setRequirements(
        nextProject.requirements?.length
          ? nextProject.requirements.map(({ acceptanceCriteria, description, key, priority, title }) => ({
              acceptanceCriteria,
              description,
              key,
              priority,
              title,
            }))
          : [emptyRequirement()],
      );
      setSelectedPlanId((current) =>
        nextPlans.some((plan) => plan.id === current) ? current : nextPlans[0]?.id || "",
      );
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const plan = useMemo(
    () => plans.find((candidate) => candidate.id === selectedPlanId) || plans[0] || null,
    [plans, selectedPlanId],
  );
  const canManage = Boolean(user?.permissions?.canEditProjects);
  const planRequirements = useMemo(
    () => plan?.requirementsSnapshot?.length ? plan.requirementsSnapshot : requirements,
    [plan, requirements],
  );

  useEffect(() => {
    setReviewDurationSeconds(0);
    if (plan?.status !== "draft") return undefined;
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setReviewDurationSeconds((current) => current + 1);
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [plan?.id, plan?.status]);

  const changeRequirement = (index, key, value) => {
    setRequirements((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  };

  const generate = async () => {
    const usable = requirements.filter((requirement) => requirement.title.trim() && requirement.description.trim());
    if (!usable.length) return setError("Add at least one complete project requirement.");
    setBusy("generate");
    setError("");
    setNotice("");
    try {
      const { plan: generated } = await api.createProjectPlan(projectId, {
        manualBaselineMinutes,
        requirements: usable,
      });
      setPlans((current) => [generated, ...current.map((item) => item.status === "draft" ? { ...item, status: "superseded" } : item)]);
      setSelectedPlanId(generated.id);
      setAssignments({});
      setNotice(`Plan v${generated.version} is ready for review.`);
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      setBusy("");
    }
  };

  const applyRecommendations = () => {
    setAssignments(Object.fromEntries((plan?.tasks || []).map((task) => [task.key, task.suggestedAssignee?.id || ""])));
  };

  const approve = async () => {
    setBusy("approve");
    setError("");
    try {
      const { plan: approved } = await api.approveProjectPlan(projectId, plan.id, {
        assignmentOverrides: assignments,
        reviewDurationSeconds: Math.max(1, reviewDurationSeconds),
        useRecommendations: false,
      });
      setPlans((current) => current.map((item) => item.id === approved.id ? approved : item));
      setNotice(`${approved.tasks.length} planned tasks were created with approved assignments.`);
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      setBusy("");
    }
  };

  const reject = async () => {
    setBusy("reject");
    setError("");
    try {
      const { plan: rejected } = await api.rejectProjectPlan(projectId, plan.id, { reason: "Plan rejected during management review." });
      setPlans((current) => current.map((item) => item.id === rejected.id ? rejected : item));
      setNotice(`Plan v${rejected.version} was rejected.`);
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      setBusy("");
    }
  };

  const evaluate = async () => {
    setBusy("evaluate");
    setError("");
    try {
      const { evaluation } = await api.evaluateProjectPlan(projectId, plan.id);
      setPlans((current) => current.map((item) => item.id === plan.id ? { ...item, evaluations: [evaluation, ...(item.evaluations || [])] } : item));
      setNotice("Delivery accuracy metrics were refreshed.");
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      setBusy("");
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <AppShell title="Planning studio" subtitle={project ? `${project.name} / explainable delivery planning` : "Project planning"}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
          <Link className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-800" to={`/projects/${projectId}`}>
            <FiArrowLeft /> Project
          </Link>
          <div className="flex items-center gap-2">
            {plans.length > 0 && (
              <select aria-label="Plan version" className={`${fieldClass} w-auto min-w-40`} onChange={(event) => setSelectedPlanId(event.target.value)} value={plan?.id || ""}>
                {plans.map((item) => <option key={item.id} value={item.id}>Plan v{item.version} / {labelize(item.status)}</option>)}
              </select>
            )}
            <button aria-label="Refresh planning data" className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" onClick={load} title="Refresh" type="button"><FiRefreshCw /></button>
          </div>
        </div>

        {error && <Alert message={error} type="error" />}
        {notice && <Alert message={notice} type="success" />}

        {canManage && (
          <section className="border-y border-slate-200 bg-white py-5">
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
              <div><h2 className="text-base font-bold text-slate-950">Requirements baseline</h2><p className="mt-1 text-sm text-slate-500">{requirements.length} traceable requirements</p></div>
              <div className="flex flex-wrap items-end gap-2">
                <label className="block">
                  <span className="block text-[11px] font-bold uppercase text-slate-500">Manual estimate</span>
                  <div className="relative mt-1">
                    <input aria-label="Estimated manual planning time in minutes" className={`${fieldClass} w-40 pr-12`} max="10080" min="1" onChange={(event) => setManualBaselineMinutes(Number(event.target.value))} type="number" value={manualBaselineMinutes} />
                    <span className="pointer-events-none absolute bottom-2.5 right-3 text-xs text-slate-400">min</span>
                  </div>
                </label>
                <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50" onClick={() => setRequirements((current) => [...current, emptyRequirement()])} type="button"><FiPlus /> Requirement</button>
                <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-60" disabled={Boolean(busy)} onClick={generate} type="button"><FiCpu /> {busy === "generate" ? "Generating..." : "Generate plan"}</button>
              </div>
            </div>
            <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
              {requirements.map((requirement, index) => (
                <div className="grid gap-3 py-4 lg:grid-cols-[120px_1fr_1.5fr_1.2fr_40px]" key={requirement.key || index}>
                  <select aria-label={`Requirement ${index + 1} priority`} className={fieldClass} onChange={(event) => changeRequirement(index, "priority", event.target.value)} value={requirement.priority}>
                    <option value="must">Must</option><option value="should">Should</option><option value="could">Could</option><option value="wont">Won&apos;t now</option>
                  </select>
                  <input aria-label={`Requirement ${index + 1} title`} className={fieldClass} onChange={(event) => changeRequirement(index, "title", event.target.value)} placeholder="Requirement title" value={requirement.title} />
                  <input aria-label={`Requirement ${index + 1} description`} className={fieldClass} onChange={(event) => changeRequirement(index, "description", event.target.value)} placeholder="Requirement statement" value={requirement.description} />
                  <input aria-label={`Requirement ${index + 1} acceptance criteria`} className={fieldClass} onChange={(event) => changeRequirement(index, "acceptanceCriteria", event.target.value)} placeholder="Acceptance criteria" value={requirement.acceptanceCriteria} />
                  <button aria-label="Remove requirement" className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600" disabled={requirements.length === 1} onClick={() => setRequirements((current) => current.filter((_, itemIndex) => itemIndex !== index))} title="Remove" type="button"><FiTrash2 /></button>
                </div>
              ))}
            </div>
          </section>
        )}

        {!plan ? (
          <div className="border-y border-slate-200 bg-white py-16 text-center"><FiCpu className="mx-auto h-7 w-7 text-emerald-600" /><h2 className="mt-3 text-lg font-bold text-slate-950">No delivery plan yet</h2></div>
        ) : (
          <>
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-4xl"><div className="flex items-center gap-2"><span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">PLAN V{plan.version}</span><span className="text-xs font-bold uppercase text-slate-500">{labelize(plan.status)} / {plan.model}</span></div><p className="mt-3 text-sm leading-6 text-slate-700">{plan.summary}</p></div>
                {plan.status === "draft" && canManage && <div className="flex shrink-0 flex-wrap items-end gap-2"><button className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50" onClick={applyRecommendations} type="button"><FiUserCheck /> Apply recommendations</button><button className="inline-flex h-10 items-center gap-2 rounded-lg border border-rose-200 px-3 text-sm font-bold text-rose-700 hover:bg-rose-50" disabled={Boolean(busy)} onClick={reject} type="button"><FiX /> Reject</button><button className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800" disabled={Boolean(busy)} onClick={approve} type="button"><FiCheck /> Approve plan</button></div>}
                {plan.status === "approved" && <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50" disabled={Boolean(busy)} onClick={evaluate} type="button"><FiTarget /> Evaluate delivery</button>}
              </div>
              <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 md:grid-cols-3 xl:grid-cols-6 xl:divide-y-0">
                <Metric label="Coverage" suffix="%" value={plan.metrics.requirementCoverage} /><Metric label="Confidence" suffix="%" value={plan.metrics.averageConfidence} /><Metric label="Effort" suffix="h" value={plan.metrics.totalEstimatedHours} /><Metric label="Capacity" suffix="h" value={plan.metrics.availableCapacityHours} /><Metric label="Dependencies" value={plan.metrics.dependencyCount} /><Metric label="High risk" value={plan.metrics.highRiskTaskCount} />
              </div>
            </section>

            {plan.warnings?.length > 0 && <section className="rounded-lg border border-amber-200 bg-amber-50"><div className="flex items-center gap-2 border-b border-amber-200 px-4 py-3 text-sm font-bold text-amber-900"><FiAlertTriangle /> Plan review</div><div className="divide-y divide-amber-200">{plan.warnings.map((warning) => <p className="px-4 py-2.5 text-sm text-amber-900" key={warning}>{warning}</p>)}</div></section>}

            <div className="flex gap-1 border-b border-slate-200" role="tablist">
              {[["schedule", FiClock], ["milestones", FiTrendingUp], ["traceability", FiTarget], ["dependencies", FiGitBranch]].map(([view, Icon]) => <button aria-selected={activeView === view} className={`inline-flex h-11 items-center gap-2 border-b-2 px-4 text-sm font-bold ${activeView === view ? "border-emerald-700 text-emerald-800" : "border-transparent text-slate-500 hover:text-slate-800"}`} key={view} onClick={() => setActiveView(view)} role="tab" type="button">{createElement(Icon)}{labelize(view)}</button>)}
            </div>

            {activeView === "schedule" && <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white"><div className="min-w-[1080px]"><div className="grid grid-cols-[90px_minmax(240px,1.5fr)_120px_150px_180px_270px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500"><span>Key</span><span>Task</span><span>Risk</span><span>Window</span><span>Effort</span><span>Approved assignee</span></div><div className="divide-y divide-slate-200">{plan.tasks.map((task) => <div className="grid grid-cols-[90px_minmax(240px,1.5fr)_120px_150px_180px_270px] items-center gap-4 px-4 py-4 text-sm" key={task.id}><span className="font-mono font-bold text-emerald-800">{task.key}</span><div className="min-w-0"><p className="font-bold text-slate-950">{task.title}</p><p className="mt-1 truncate text-xs text-slate-500">{task.requiredSkills.join(" / ") || task.category}</p></div><span className={`w-fit rounded border px-2 py-1 text-xs font-bold ${tone[task.riskLevel] || tone.low}`}>{labelize(task.riskLevel)}</span><span className="text-xs font-semibold text-slate-600">{task.scheduledStart}<br />{task.scheduledEnd}</span><span className="text-slate-700">{task.estimatedHours}h / {task.confidence}%</span>{plan.status === "draft" && canManage ? <div><select aria-label={`Assignee for ${task.title}`} className={fieldClass} onChange={(event) => setAssignments((current) => ({ ...current, [task.key]: event.target.value }))} value={assignments[task.key] || ""}><option value="">Unassigned</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select><p className="mt-1.5 text-xs leading-5 text-slate-500"><span className="font-bold text-emerald-800">Suggested: {task.suggestedAssignee?.name || "none"}.</span> {task.suggestionReason}</p></div> : <span className="font-semibold text-slate-700">{task.approvedAssignee?.name || "Unassigned"}</span>}</div>)}</div></div></section>}

            {activeView === "milestones" && <section className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="divide-y divide-slate-200">{plan.milestones.map((milestone, index) => <article className="grid gap-4 px-5 py-4 sm:grid-cols-[56px_160px_minmax(0,1fr)]" key={milestone.id}><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-sm font-bold text-emerald-800">{index + 1}</span><div><p className="font-mono text-xs font-bold text-emerald-800">{milestone.key}</p><p className="mt-1 text-xs font-semibold text-slate-500">Target {milestone.targetDate}</p></div><div><h3 className="text-sm font-bold text-slate-950">{milestone.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{milestone.outcome}</p></div></article>)}</div></section>}

            {activeView === "traceability" && <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white"><div className="min-w-[720px]"><div className="grid grid-cols-[120px_1fr_1fr] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500"><span>Requirement</span><span>Requirement title</span><span>Covered by</span></div><div className="divide-y divide-slate-200">{planRequirements.map((requirement, index) => { const key = requirement.key || `REQ-${String(index + 1).padStart(3, "0")}`; const coverage = plan.tasks.filter((task) => task.requirementKeys.includes(key)); return <div className="grid grid-cols-[120px_1fr_1fr] gap-4 px-4 py-4 text-sm" key={key}><span className="font-mono font-bold text-emerald-800">{key}</span><span><span className="block font-semibold text-slate-800">{requirement.title}</span><span className="mt-1 block text-xs text-slate-500">{requirement.description}</span></span><div className="flex flex-wrap gap-1.5">{coverage.length ? coverage.map((task) => <span className="rounded border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-bold text-teal-900" key={task.key}>{task.key}</span>) : <span className="text-rose-600">Uncovered</span>}</div></div>; })}</div></div></section>}

            {activeView === "dependencies" && <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{plan.tasks.map((task) => <article className="rounded-lg border border-slate-200 bg-white p-4" key={task.id}><div className="flex items-center justify-between"><span className="font-mono text-xs font-bold text-emerald-800">{task.key}</span><FiGitBranch className="text-slate-400" /></div><h3 className="mt-2 text-sm font-bold text-slate-950">{task.title}</h3><div className="mt-3 flex flex-wrap gap-1.5">{task.dependencyKeys.length ? task.dependencyKeys.map((key) => <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-600" key={key}>{key}</span>) : <span className="text-xs text-emerald-700">Ready to start</span>}</div></article>)}</section>}

            {plan.evaluations?.[0] && <section className="rounded-lg border border-slate-200 bg-white p-5"><div className="flex items-center gap-2"><FiLayers className="text-emerald-700" /><h2 className="text-base font-bold text-slate-950">Latest evaluation</h2></div><div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 md:grid-cols-3 xl:grid-cols-6"><Metric label="Completion" suffix="%" value={plan.evaluations[0].metrics.completionRate} /><Metric label="Override rate" suffix="%" value={plan.evaluations[0].metrics.managerOverrideRate} /><Metric label="Schedule violations" value={plan.evaluations[0].metrics.scheduleViolations} /><Metric label="Dependency violations" value={plan.evaluations[0].metrics.dependencyViolations} /><Metric label="Effort MAE" suffix={plan.evaluations[0].metrics.effortMeanAbsoluteError == null ? "" : "h"} value={plan.evaluations[0].metrics.effortMeanAbsoluteError ?? "N/A"} /><Metric label="Planning time saved" suffix={plan.evaluations[0].metrics.planningTimeSavedMinutes == null ? "" : "m"} value={plan.evaluations[0].metrics.planningTimeSavedMinutes ?? "N/A"} /></div></section>}
          </>
        )}
      </div>
    </AppShell>
  );
};

export default ProjectPlannerPage;
