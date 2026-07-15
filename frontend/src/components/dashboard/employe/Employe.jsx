import { useCallback, useEffect, useState } from "react";
import TaskList from "../../tasklist/TaskList";
import AppShell from "../../AppShell";
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
    <AppShell
        title="My work"
        subtitle={`Welcome back${user?.name ? `, ${user.name}` : ""}. Your assignments are scoped to your account.`}
      >
      <div>
        <section className="mb-8">
          <TaskNumber error={taskError} tasks={tasks} />
        </section>

        <section>
          <TaskList error={taskError} loading={loadingTasks} onTasksChanged={loadTasks} tasks={tasks} />
        </section>
      </div>
    </AppShell>
  );
};

export default Employe;
