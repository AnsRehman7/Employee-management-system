import { useEffect, useState } from "react";
import { FiCalendar, FiFileText, FiPlusCircle, FiTag, FiUserCheck } from "react-icons/fi";
import Alert from "../../Alert";
import { useFirebase } from "../../../context/firebase";
import { useUser } from "../../../context/UserContext";

const CreateTask = () => {
  const { user } = useUser();
  const firebase = useFirebase();
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState({ message: "", type: "info" });
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    deadline: "",
    assignedToUid: "",
    category: "",
    priority: "normal",
  });

  useEffect(() => {
    let active = true;

    const loadEmployees = async () => {
      try {
        const employeeProfiles = await firebase.getEmployees();
        if (active) setEmployees(employeeProfiles);
      } catch (error) {
        if (active) setNotice({ type: "error", message: firebase.formatFirebaseError(error) });
      } finally {
        if (active) setLoadingEmployees(false);
      }
    };

    loadEmployees();

    return () => {
      active = false;
    };
  }, [firebase]);

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

    const assignee = employees.find((employee) => employee.uid === formData.assignedToUid);

    try {
      await firebase.createTask({
        ...formData,
        assignedToEmail: assignee?.email,
        assignedToName: assignee?.name,
        createdByName: user?.name,
      });

      setFormData({
        title: "",
        description: "",
        deadline: "",
        assignedToUid: "",
        category: "",
        priority: "normal",
      });
      setNotice({ type: "success", message: "Task assigned successfully." });
    } catch (error) {
      setNotice({ type: "error", message: firebase.formatFirebaseError(error) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start gap-3 border-b border-slate-200 pb-5">
        <span className="rounded-lg bg-emerald-100 p-3 text-emerald-700">
          <FiPlusCircle className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-2xl font-black text-slate-950">Assign a task</h2>
          <p className="mt-1 text-sm text-slate-500">Tasks created here are visible only to the selected employee.</p>
        </div>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <Alert message={notice.message} type={notice.type} />

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Task title</span>
          <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10">
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
          <span className="text-sm font-semibold text-slate-700">Assign to employee</span>
          <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10">
            <FiUserCheck className="h-5 w-5 text-slate-400" />
            <select
              name="assignedToUid"
              value={formData.assignedToUid}
              onChange={handleChange}
              disabled={loadingEmployees}
              className="w-full bg-transparent text-sm font-semibold text-slate-950 outline-none disabled:text-slate-400"
              required
            >
              <option value="">{loadingEmployees ? "Loading employees..." : "Choose employee"}</option>
              {employees.map((employee) => (
                <option key={employee.uid} value={employee.uid}>
                  {employee.name} ({employee.email})
                </option>
              ))}
            </select>
          </div>
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block sm:col-span-1">
            <span className="text-sm font-semibold text-slate-700">Category</span>
            <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10">
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
              className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </label>

          <label className="block sm:col-span-1">
            <span className="text-sm font-semibold text-slate-700">Deadline</span>
            <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10">
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
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Description</span>
          <textarea
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            placeholder="Add details, acceptance criteria, or context for the employee."
            className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            required
          />
        </label>

        <button
          type="submit"
          disabled={saving || loadingEmployees}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <FiPlusCircle className="h-4 w-4" />
          {saving ? "Assigning task..." : "Assign task"}
        </button>
      </form>
    </section>
  );
};

export default CreateTask;
