import { useState } from "react";
import { FiArrowLeft, FiBriefcase, FiCalendar, FiCheckCircle, FiCpu, FiFolderPlus, FiTarget } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import Alert from "../../Alert";
import AppShell from "../../AppShell";
import { api, formatApiError } from "../../../context/api";

const fieldClass =
  "mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100";
const initialForm = {
  description: "",
  dueDate: "",
  generateTasksWithAi: false,
  name: "",
  startDate: "",
  status: "active",
};

const ProjectCreatePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;
    setFormData((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { project } = await api.createProject(formData);
      const notice = formData.generateTasksWithAi
        ? `Project created with ${project.taskCount} unassigned AI-planned tasks.`
        : "Project created successfully.";
      navigate(`/projects/${project.id}`, { replace: true, state: { notice } });
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Create project" subtitle="Set the project purpose, lifecycle, and delivery window before work is assigned.">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <Link className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-violet-700" to="/projects"><FiArrowLeft className="h-4 w-4" />Back to projects</Link>
          <div className="flex gap-2">
            <Link className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50" to="/projects">Cancel</Link>
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-bold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700 disabled:bg-slate-300" disabled={saving} type="submit"><FiFolderPlus className="h-4 w-4" />{saving ? (formData.generateTasksWithAi ? "Planning tasks..." : "Creating...") : "Create project"}</button>
          </div>
        </div>

        <Alert message={error} type="error" />

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700"><FiBriefcase className="h-4 w-4" /></span><div><h2 className="text-base font-bold text-slate-950">Project brief</h2><p className="text-sm text-slate-500">Give the team a stable source of context for the work.</p></div></div></div>
            <div className="space-y-5 p-5">
              <label className="block"><span className="text-sm font-bold text-slate-700">Project name</span><input autoFocus className={fieldClass} maxLength="160" name="name" onChange={handleChange} placeholder="Customer onboarding modernization" required value={formData.name} /><span className="mt-1.5 block text-xs text-slate-400">Use the product, client, or initiative name.</span></label>
              <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiTarget className="h-4 w-4 text-emerald-600" />Purpose, scope, and requirements</span><textarea className="mt-2 min-h-72 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100" minLength={formData.generateTasksWithAi ? 40 : undefined} name="description" onChange={handleChange} placeholder="Describe the objective, deliverables, workflows, constraints, integrations, stakeholders, and acceptance expectations." required={formData.generateTasksWithAi} value={formData.description} />{formData.generateTasksWithAi && <span className="mt-1.5 block text-xs font-semibold text-violet-700">Gemini will use these requirements as the source for the task plan.</span>}</label>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-base font-bold text-slate-950">Project setup</h2><p className="mt-1 text-sm text-slate-500">Choose the initial lifecycle and schedule.</p></div>
            <div className="space-y-5 p-5">
              <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiCheckCircle className="h-4 w-4 text-slate-400" />Initial status</span><select className={fieldClass} name="status" onChange={handleChange} value={formData.status}><option value="planned">Planned</option><option value="active">Active</option></select><span className="mt-1.5 block text-xs text-slate-400">Planned projects can be prepared before delivery begins.</span></label>
              <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiCalendar className="h-4 w-4 text-slate-400" />Start date</span><input className={fieldClass} name="startDate" onChange={handleChange} type="date" value={formData.startDate} /></label>
              <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiCalendar className="h-4 w-4 text-slate-400" />Target due date</span><input className={fieldClass} min={formData.startDate || undefined} name="dueDate" onChange={handleChange} required={formData.generateTasksWithAi} type="date" value={formData.dueDate} /></label>

              <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${formData.generateTasksWithAi ? "border-violet-300 bg-violet-50 ring-2 ring-violet-100" : "border-slate-200 bg-slate-50 hover:border-violet-200"}`}>
                <input checked={formData.generateTasksWithAi} className="mt-1 h-4 w-4 shrink-0 accent-violet-600" name="generateTasksWithAi" onChange={handleChange} type="checkbox" />
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-900"><FiCpu className="h-4 w-4 text-violet-600" />Generate task plan with Gemini</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">Creates scoped tasks with due dates, estimates, priorities, and success criteria. Tasks remain unassigned.</span>
                </span>
              </label>

              <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4"><p className="text-xs font-bold text-cyan-800">After creation</p><p className="mt-1 text-xs leading-5 text-cyan-700">{formData.generateTasksWithAi ? "Review the generated plan from the project page, then open each task to assign an employee." : "You can add tasks manually from the project page."}</p></div>
              <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-bold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700 disabled:bg-slate-300" disabled={saving} type="submit"><FiFolderPlus className="h-4 w-4" />{saving ? (formData.generateTasksWithAi ? "Gemini is planning tasks..." : "Creating project...") : "Create project"}</button>
            </div>
          </section>
        </div>
      </form>
    </AppShell>
  );
};

export default ProjectCreatePage;
