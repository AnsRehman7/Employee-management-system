import { useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiBriefcase,
  FiCalendar,
  FiCheckSquare,
  FiClock,
  FiFileText,
  FiFlag,
  FiPlus,
  FiTag,
  FiUser,
} from "react-icons/fi";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Alert from "../../Alert";
import AppShell from "../../AppShell";
import { api, formatApiError } from "../../../context/api";
import { TASK_STATUS_OPTIONS } from "./workUtils";

const initialForm = {
  assignedToId: "",
  category: "",
  deadline: "",
  description: "",
  estimatedHours: "",
  priority: "normal",
  projectId: "",
  status: "open",
  successCriteria: "",
  title: "",
};

const fieldClass =
  "mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100";
const textareaClass =
  "mt-2 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100";

const TaskCreatePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingSetup, setLoadingSetup] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    let active = true;

    const loadSetup = async () => {
      try {
        const [{ employees: employeeList }, { projects: projectList }] = await Promise.all([
          api.getEmployees(),
          api.getProjects(),
        ]);
        if (!active) return;

        const availableProjects = projectList.filter((project) => project.status !== "archived");
        const requestedProject = searchParams.get("project");
        setEmployees(employeeList);
        setProjects(availableProjects);
        setFormData((current) => ({
          ...current,
          projectId: availableProjects.some((project) => project.id === requestedProject)
            ? requestedProject
            : current.projectId,
        }));
      } catch (requestError) {
        if (active) setNotice(formatApiError(requestError));
      } finally {
        if (active) setLoadingSetup(false);
      }
    };

    loadSetup();
    return () => {
      active = false;
    };
  }, [searchParams]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice("");

    try {
      const { task } = await api.createTask(formData);
      navigate(`/tasks/${task.id}`, { replace: true, state: { notice: "Task created successfully." } });
    } catch (requestError) {
      setNotice(formatApiError(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Create task" subtitle="Define the outcome, ownership, schedule, and delivery expectations in one place.">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <Link className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-violet-700" to="/tasks">
            <FiArrowLeft className="h-4 w-4" />
            Back to tasks
          </Link>
          <div className="flex gap-2">
            <Link className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50" to="/tasks">Cancel</Link>
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-bold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={saving || loadingSetup || projects.length === 0} type="submit">
              <FiPlus className="h-4 w-4" />
              {saving ? "Creating..." : "Create task"}
            </button>
          </div>
        </div>

        <Alert message={notice} type="error" />

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700"><FiFileText className="h-4 w-4" /></span>
                <div><h2 className="text-base font-bold text-slate-950">Task brief</h2><p className="text-sm text-slate-500">Write a clear assignment that can be reviewed without extra context.</p></div>
              </div>
            </div>

            <div className="space-y-5 p-5">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Task title</span>
                <input autoFocus className={fieldClass} maxLength="160" name="title" onChange={handleChange} placeholder="Prepare the Q3 customer onboarding workflow" required type="text" value={formData.title} />
                <span className="mt-1.5 block text-xs text-slate-400">Use a specific action and deliverable.</span>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Description</span>
                <textarea className={textareaClass} name="description" onChange={handleChange} placeholder="Add the background, scope, dependencies, and expected output." required rows="8" value={formData.description} />
              </label>

              <label className="block">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiCheckSquare className="h-4 w-4 text-emerald-600" />Success criteria</span>
                <textarea className={textareaClass} name="successCriteria" onChange={handleChange} placeholder="List the conditions that must be true before this task can be marked complete." rows="5" value={formData.successCriteria} />
                <span className="mt-1.5 block text-xs text-slate-400">Optional, but recommended for reviewable work.</span>
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-base font-bold text-slate-950">Planning</h2><p className="mt-1 text-sm text-slate-500">Set ownership and delivery controls.</p></div>

            <div className="space-y-5 p-5">
              <label className="block">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiBriefcase className="h-4 w-4 text-slate-400" />Project</span>
                <select className={fieldClass} disabled={loadingSetup} name="projectId" onChange={handleChange} required value={formData.projectId}>
                  <option value="">{loadingSetup ? "Loading projects..." : "Select project"}</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
                {!loadingSetup && projects.length === 0 && <Link className="mt-2 inline-flex text-xs font-bold text-violet-700" to="/projects/new">Create a project first</Link>}
              </label>

              <label className="block">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiUser className="h-4 w-4 text-slate-400" />Assigned to</span>
                <select className={fieldClass} disabled={loadingSetup} name="assignedToId" onChange={handleChange} required value={formData.assignedToId}>
                  <option value="">{loadingSetup ? "Loading team..." : "Select team member"}</option>
                  {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} / {employee.role.replace("_", " ")}</option>)}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiFlag className="h-4 w-4 text-slate-400" />Status</span>
                  <select className={fieldClass} name="status" onChange={handleChange} value={formData.status}>
                    {TASK_STATUS_OPTIONS.filter((option) => option.value !== "completed").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="block"><span className="text-sm font-bold text-slate-700">Priority</span><select className={fieldClass} name="priority" onChange={handleChange} value={formData.priority}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></label>
              </div>

              <label className="block">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiTag className="h-4 w-4 text-slate-400" />Category</span>
                <input className={fieldClass} list="task-categories" name="category" onChange={handleChange} placeholder="Operations" required type="text" value={formData.category} />
                <datalist id="task-categories"><option value="Design" /><option value="Development" /><option value="Finance" /><option value="HR" /><option value="Operations" /><option value="Sales" /></datalist>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiCalendar className="h-4 w-4 text-slate-400" />Due date</span><input className={fieldClass} name="deadline" onChange={handleChange} type="date" value={formData.deadline} /></label>
                <label className="block">
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiClock className="h-4 w-4 text-slate-400" />Estimate</span>
                  <div className="relative"><input className={`${fieldClass} pr-14`} min="0" name="estimatedHours" onChange={handleChange} placeholder="8" step="0.25" type="number" value={formData.estimatedHours} /><span className="pointer-events-none absolute bottom-3 right-3 text-xs font-bold text-slate-400">hours</span></div>
                </label>
              </div>

              <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-bold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={saving || loadingSetup || projects.length === 0} type="submit"><FiPlus className="h-4 w-4" />{saving ? "Creating task..." : "Create task"}</button>
            </div>
          </section>
        </div>
      </form>
    </AppShell>
  );
};

export default TaskCreatePage;
