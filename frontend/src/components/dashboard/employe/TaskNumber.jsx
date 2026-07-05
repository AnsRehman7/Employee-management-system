import { useMemo } from "react";
import { FiCheckCircle, FiClock, FiList, FiZap } from "react-icons/fi";
import Alert from "../../Alert";

const TaskNumber = ({ error = "", tasks = [] }) => {
  const taskStats = useMemo(() => {
    const completed = tasks.filter((task) => task.status === "completed").length;
    const active = tasks.length - completed;
    const newTasks = tasks.filter((task) => task.status === "new").length;
    const overdue = tasks.filter((task) => {
      if (!task.deadline || task.status === "completed") return false;
      return new Date(task.deadline).setHours(23, 59, 59, 999) < Date.now();
    }).length;

    return { active, completed, newTasks, overdue, total: tasks.length };
  }, [tasks]);

  const stats = [
    {
      label: "Total assigned",
      value: taskStats.total,
      helper: "All tasks linked to you",
      icon: <FiList className="h-5 w-5" />,
      tone: "bg-slate-950 text-white",
    },
    {
      label: "Active",
      value: taskStats.active,
      helper: "Ready for action",
      icon: <FiClock className="h-5 w-5" />,
      tone: "bg-white text-slate-950",
    },
    {
      label: "New",
      value: taskStats.newTasks,
      helper: "Recently assigned",
      icon: <FiZap className="h-5 w-5" />,
      tone: "bg-emerald-500 text-slate-950",
    },
    {
      label: "Completed",
      value: taskStats.completed,
      helper: `${taskStats.overdue} overdue active`,
      icon: <FiCheckCircle className="h-5 w-5" />,
      tone: "bg-white text-slate-950",
    },
  ];

  return (
    <div className="space-y-4">
      <Alert message={error} type="error" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ helper, icon, label, tone, value }) => (
          <article
            key={label}
            className={`rounded-lg border border-slate-200 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${tone}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold opacity-70">{label}</p>
                <p className="mt-3 text-4xl font-black">{value}</p>
                <p className="mt-2 text-sm font-medium opacity-70">{helper}</p>
              </div>
              <span className="rounded-lg bg-black/10 p-3">
                {icon}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default TaskNumber;
