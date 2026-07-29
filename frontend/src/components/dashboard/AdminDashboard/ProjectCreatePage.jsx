import { useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCpu,
  FiFolderPlus,
  FiHash,
  FiLayers,
  FiTag,
  FiTarget,
  FiUser,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import Alert from "../../Alert";
import AppShell from "../../AppShell";
import CustomFieldsForm from "../../CustomFieldsForm";
import { api, formatApiError } from "../../../context/api";
import { useUser } from "../../../context/UserContext";

const fieldClass =
  "mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100";
const initialForm = {
  clientName: "",
  code: "",
  customFields: {},
  department: "",
  description: "",
  dueDate: "",
  estimatedHours: "",
  generateTasksWithAi: false,
  name: "",
  objective: "",
  ownerId: "",
  priority: "normal",
  requirementsText: "",
  startDate: "",
  status: "active",
  tags: "",
};

const ProjectCreatePage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [formData, setFormData] = useState(initialForm);
  const [teamMembers, setTeamMembers] = useState([]);
  const [moduleDefinition, setModuleDefinition] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([api.getEmployees(), api.getCustomModule("projects")])
      .then(([{ employees }, { module }]) => {
        if (!active) return;
        setTeamMembers(employees);
        setModuleDefinition(module);
        setFormData((current) => ({ ...current, ownerId: current.ownerId || user?.id || "" }));
      })
      .catch((requestError) => {
        if (active) setError(formatApiError(requestError));
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;
    setFormData((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };
  const fieldVisible = (key) =>
    !moduleDefinition?.fields.find((field) => field.systemFieldKey === key)?.archived &&
    moduleDefinition?.fields.find((field) => field.systemFieldKey === key)?.isVisible !== false;
  const fieldRequired = (key) =>
    Boolean(moduleDefinition?.fields.find((field) => field.systemFieldKey === key)?.isRequired);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const requirements = formData.requirementsText
        .split(/\r?\n/)
        .map((requirement) => requirement.trim())
        .filter(Boolean)
        .map((description, index) => ({
          acceptanceCriteria: "",
          description,
          key: `REQ-${String(index + 1).padStart(3, "0")}`,
          priority: "must",
          title: description.length > 100 ? `${description.slice(0, 97)}...` : description,
        }));
      const { requirementsText: _requirementsText, ...projectFields } = formData;
      const payload = {
        ...projectFields,
        requirements,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };
      const { project } = await api.createProject(payload);
      const notice = formData.generateTasksWithAi
        ? project.planningPlan
          ? `Project created with draft plan v${project.planningPlan.version}. Review and approve it before tasks are created.`
          : project.planningWarning || "Project created. Generate its draft from Planning studio."
        : "Project created successfully.";
      navigate(formData.generateTasksWithAi ? `/projects/${project.id}/planner` : `/projects/${project.id}`, {
        replace: true,
        state: { notice },
      });
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
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-bold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700 disabled:bg-slate-300" disabled={saving} type="submit"><FiFolderPlus className="h-4 w-4" />{saving ? (formData.generateTasksWithAi ? "Building draft plan..." : "Creating...") : "Create project"}</button>
          </div>
        </div>

        <Alert message={error} type="error" />

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="space-y-5">
            <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700"><FiBriefcase className="h-4 w-4" /></span>
                  <div><h2 className="text-base font-bold text-slate-950">Project brief</h2><p className="text-sm text-slate-500">Core identity, outcome, and delivery requirements.</p></div>
                </div>
              </div>
              <div className="space-y-5 p-5">
                <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
                  <label className="block"><span className="text-sm font-bold text-slate-700">Project name</span><input autoFocus className={fieldClass} maxLength="160" name="name" onChange={handleChange} placeholder="Customer onboarding modernization" required value={formData.name} /></label>
                  {fieldVisible("code") && <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiHash className="h-4 w-4 text-slate-400" />Project code</span><input className={fieldClass} maxLength="32" name="code" onChange={handleChange} placeholder="CRM-2026" required={fieldRequired("code")} value={formData.code} /></label>}
                </div>
                {fieldVisible("objective") && <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiTarget className="h-4 w-4 text-emerald-600" />Primary objective</span><textarea className="mt-2 min-h-28 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100" maxLength="5000" name="objective" onChange={handleChange} placeholder="State the measurable business outcome this project must deliver." required={fieldRequired("objective")} value={formData.objective} /></label>}
                {fieldVisible("description") && <label className="block"><span className="text-sm font-bold text-slate-700">Scope and requirements</span><textarea className="mt-2 min-h-64 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100" minLength={formData.generateTasksWithAi ? 40 : undefined} name="description" onChange={handleChange} placeholder="Document deliverables, workflows, constraints, integrations, stakeholders, and acceptance expectations." required={formData.generateTasksWithAi || fieldRequired("description")} value={formData.description} /></label>}
                {formData.generateTasksWithAi && <label className="block"><span className="text-sm font-bold text-slate-700">Atomic requirements</span><textarea className="mt-2 min-h-40 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100" name="requirementsText" onChange={handleChange} placeholder={"Users can reset their password by email.\nManagers can approve attendance corrections.\nReports can be exported as CSV."} value={formData.requirementsText} /><span className="mt-1.5 block text-xs text-slate-400">Enter one testable requirement per line. The planner will trace each requirement to delivery tasks.</span></label>}
                {fieldVisible("tags") && <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiTag className="h-4 w-4 text-slate-400" />Tags</span><input className={fieldClass} name="tags" onChange={handleChange} placeholder="platform, onboarding, q3" required={fieldRequired("tags")} value={formData.tags} /><span className="mt-1.5 block text-xs text-slate-400">Separate up to 12 tags with commas.</span></label>}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-base font-bold text-slate-950">Delivery context</h2><p className="mt-1 text-sm text-slate-500">Ownership and reporting information for the portfolio.</p></div>
              <div className="grid gap-5 p-5 md:grid-cols-2">
                {fieldVisible("clientName") && <label className="block"><span className="text-sm font-bold text-slate-700">Client or stakeholder</span><input className={fieldClass} maxLength="160" name="clientName" onChange={handleChange} placeholder="Internal operations" required={fieldRequired("clientName")} value={formData.clientName} /></label>}
                {fieldVisible("department") && <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiLayers className="h-4 w-4 text-slate-400" />Department</span><input className={fieldClass} maxLength="120" name="department" onChange={handleChange} placeholder="Product and Engineering" required={fieldRequired("department")} value={formData.department} /></label>}
              </div>
            </section>
            <CustomFieldsForm
              fields={moduleDefinition?.fields}
              members={teamMembers}
              onChange={(customFields) => setFormData((current) => ({ ...current, customFields }))}
              values={formData.customFields}
            />
          </div>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm xl:sticky xl:top-28">
            <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-base font-bold text-slate-950">Project setup</h2><p className="mt-1 text-sm text-slate-500">Ownership, priority, lifecycle, and schedule.</p></div>
            <div className="space-y-5 p-5">
              <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiUser className="h-4 w-4 text-slate-400" />Project owner</span><select className={fieldClass} name="ownerId" onChange={handleChange} required value={formData.ownerId}><option value="">Select owner</option>{teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name} / {member.role.replaceAll("_", " ")}</option>)}</select></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-sm font-bold text-slate-700">Priority</span><select className={fieldClass} name="priority" onChange={handleChange} value={formData.priority}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="critical">Critical</option></select></label>
                <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiCheckCircle className="h-4 w-4 text-slate-400" />Status</span><select className={fieldClass} name="status" onChange={handleChange} value={formData.status}><option value="planned">Planned</option><option value="active">Active</option></select></label>
              </div>
              {fieldVisible("estimatedHours") && <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiClock className="h-4 w-4 text-slate-400" />Estimated effort</span><div className="relative"><input className={`${fieldClass} pr-16`} min="0" name="estimatedHours" onChange={handleChange} placeholder="120" required={fieldRequired("estimatedHours")} step="0.25" type="number" value={formData.estimatedHours} /><span className="pointer-events-none absolute bottom-3 right-3 text-xs font-semibold text-slate-400">hours</span></div></label>}
              {(fieldVisible("startDate") || fieldVisible("dueDate")) && <div className="grid grid-cols-2 gap-3">
                {fieldVisible("startDate") && <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiCalendar className="h-4 w-4 text-slate-400" />Start</span><input className={fieldClass} name="startDate" onChange={handleChange} required={fieldRequired("startDate")} type="date" value={formData.startDate} /></label>}
                {fieldVisible("dueDate") && <label className="block"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiCalendar className="h-4 w-4 text-slate-400" />Due</span><input className={fieldClass} min={formData.startDate || undefined} name="dueDate" onChange={handleChange} required={formData.generateTasksWithAi || fieldRequired("dueDate")} type="date" value={formData.dueDate} /></label>}
              </div>}

              {fieldVisible("description") && fieldVisible("dueDate") && <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${formData.generateTasksWithAi ? "border-violet-300 bg-violet-50 ring-2 ring-violet-100" : "border-slate-200 bg-slate-50 hover:border-violet-200"}`}>
                <input checked={formData.generateTasksWithAi} className="mt-1 h-4 w-4 shrink-0 accent-violet-600" name="generateTasksWithAi" onChange={handleChange} type="checkbox" />
                <span className="min-w-0"><span className="flex items-center gap-2 text-sm font-bold text-slate-900"><FiCpu className="h-4 w-4 text-violet-600" />Generate a reviewable delivery plan</span><span className="mt-1 block text-xs leading-5 text-slate-500">Builds traceable tasks, dependencies, milestones, risks, and capacity-aware recommendations. Tasks are created only after management approval.</span></span>
              </label>}

              <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-bold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700 disabled:bg-slate-300" disabled={saving} type="submit"><FiFolderPlus className="h-4 w-4" />{saving ? (formData.generateTasksWithAi ? "Building draft plan..." : "Creating project...") : "Create project"}</button>
            </div>
          </section>
        </div>
      </form>
    </AppShell>
  );
};

export default ProjectCreatePage;
