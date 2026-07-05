import { useCallback, useEffect, useState } from "react";
import TaskList from "../../tasklist/TaskList";
import Header from "../../Header";
import TaskNumber from "./TaskNumber";
import { api, formatApiError } from "../../../context/api";
import { useUser } from "../../../context/UserContext";

const Employe = () => {
  const { user } = useUser();
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [taskError, setTaskError] = useState("");

  const loadTasks = useCallback(async ({ showLoading = false } = {}) => {
    if (showLoading) setLoadingTasks(true);

    try {
      const { tasks: assignedTasks } = await api.getTasks();
      setTasks(assignedTasks);
      setTaskError("");
    } catch (error) {
      setTaskError(formatApiError(error));
    } finally {
      if (showLoading) setLoadingTasks(false);
    }
  }, []);

  useEffect(() => {
    loadTasks({ showLoading: true });
  }, [loadTasks]);

  return (
    <div className="min-h-screen bg-slate-100">
      <Header
        title="My work"
        subtitle={`Welcome back${user?.name ? `, ${user.name}` : ""}. Your assignments are scoped to your account.`}
      />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <section className="mb-8">
          <TaskNumber error={taskError} tasks={tasks} />
        </section>

        <section>
          <TaskList error={taskError} loading={loadingTasks} onTasksChanged={loadTasks} tasks={tasks} />
        </section>
      </main>
    </div>
  );
};

export default Employe;
