import { useEffect, useState } from "react";
import { FiBriefcase, FiCalendar, FiCheckSquare, FiClock, FiFileText, FiPlusCircle, FiTag, FiUserCheck } from "react-icons/fi";
import Alert from "../../Alert";
import { api, formatApiError } from "../../../context/api";
import { useUser } from "../../../context/UserContext";

const CreateTask = ({ onTaskCreated = () => {} }) => {
  const { user } = useUser();
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projects, setProjects] = useState([]);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState({ message: "", type: "info" });
  const [formData, setFormData] = useState({
    assignedToId: "",
    category: "",
    deadline: "",
    description: "",
    estimatedHours: "",
    priority: "normal",
    projectId: "",
    successCriteria: "",
    title: "",
  });

  useEffect(() => {
    let active = true;

    const loadSetup = async () => {
      try {
        const [{ employees: employeeProfiles }, { projects: projectList }] = await Promise.all([
          api.getEmployees(),
          api.getProjects(),
        ]);

        if (active) {
          setEmployees(employeeProfiles);
          setProjects(projectList.filter((project) => project.status !== "archived"));
        }
      } catch (error) {
        if (active) setNotice({ type: "error", message: formatApiError(error) });
      } finally {
        if (active) {
          setLoadingEmployees(false);
          setLoadingProjects(false);
        }
      }
    };

    loadSetup();

    return () => {
      active = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice({ message: "", type: "info" });

    try {
      await api.createTask({
        ...formData,
        createdByName: user?.name,
      });

      setFormData({
        assignedToId: "",
        category: "",
        deadline: "",
        description: "",
        estimatedHours: "",
        priority: "normal",
        projectId: "",
        successCriteria: "",
        title: "",
      });
      setNotice({ type: "success", message: "Task assigned successfully." });
      onTaskCreated();
    } catch (error) {
      setNotice({ type: "error", message: formatApiError(error) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start gap-3 border-b border-slate-200 pb-5">
        <span className="rounded-lg bg-violet-100 p-3 text-violet-700">
          <FiPlusCircle className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Assign a task</h2>
          <p className="mt-1 text-sm text-slate-500">Tasks created here are visible only to the selected assignee.</p>
        </div>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <Alert message={notice.message} type={notice.type} />

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Project</span>
          <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-violet-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
            <FiBriefcase className="h-5 w-5 text-slate-400" />
            <select
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
              disabled={loadingProjects}
              className="w-full bg-transparent text-sm font-semibold text-slate-950 outline-none disabled:text-slate-400"
              required
            >
              <option value="">
                {loadingProjects ? "Loading projects..." : projects.length === 0 ? "Create a project first" : "Choose project"}
              </option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.progress}% complete)
                </option>
              ))}
            </select>
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Task title</span>
          <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-violet-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
            <FiFileText className="h-5 w-5 text-slate-400" />
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Prepare onboarding checklist"
              className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
              required
            />
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Assign to team member</span>
          <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-violet-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
            <FiUserCheck className="h-5 w-5 text-slate-400" />
            <select
              name="assignedToId"
              value={formData.assignedToId}
              onChange={handleChange}
              disabled={loadingEmployees}
              className="w-full bg-transparent text-sm font-semibold text-slate-950 outline-none disabled:text-slate-400"
              required
            >
              <option value="">{loadingEmployees ? "Loading team..." : "Choose team member"}</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} ({employee.email})
                </option>
              ))}
            </select>
          </div>
        </label>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="block sm:col-span-1">
            <span className="text-sm font-semibold text-slate-700">Category</span>
            <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-violet-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
              <FiTag className="h-5 w-5 text-slate-400" />
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Operations"
                className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                required
              />
            </div>
          </label>

          <label className="block sm:col-span-1">
            <span className="text-sm font-semibold text-slate-700">Priority</span>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </label>

          <label className="block sm:col-span-1">
            <span className="text-sm font-semibold text-slate-700">Deadline</span>
            <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-violet-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
              <FiCalendar className="h-5 w-5 text-slate-400" />
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="w-full bg-transparent text-sm font-semibold text-slate-950 outline-none"
              />
            </div>
          </label>

          <label className="block sm:col-span-1">
            <span className="text-sm font-semibold text-slate-700">Estimate</span>
            <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-violet-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
              <FiClock className="h-5 w-5 text-slate-400" />
              <input
                type="number"
                min="0"
                step="0.25"
                name="estimatedHours"
                value={formData.estimatedHours}
                onChange={handleChange}
                placeholder="8"
                className="w-full bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400"
              />
            </div>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Description</span>
          <textarea
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            placeholder="Add details, acceptance criteria, or context for the employee."
            className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Success criteria</span>
          <div className="mt-2 flex gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-violet-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
            <FiCheckSquare className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
            <textarea
              name="successCriteria"
              rows="3"
              value={formData.successCriteria}
              onChange={handleChange}
              placeholder="Define what finished and accepted means for this task."
              className="w-full resize-none bg-transparent text-sm leading-6 text-slate-950 outline-none placeholder:text-slate-400"
            />
          </div>
        </label>

        <button
          type="submit"
          disabled={saving || loadingEmployees || loadingProjects || projects.length === 0}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-900/20 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <FiPlusCircle className="h-4 w-4" />
          {saving ? "Assigning task..." : "Assign task"}
        </button>
      </form>
    </section>
  );
};

export default CreateTask;
