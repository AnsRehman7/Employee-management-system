import { useState } from "react";
import AppShell from "../../AppShell";
import AllTask from "./AllTask";
import CreateTask from "./CreateTask";
import ExecutiveDashboard from "./ExecutiveDashboard";
import { useUser } from "../../../context/UserContext";

const AdminDashboard = () => {
  const { user } = useUser();
  const [taskRefreshKey, setTaskRefreshKey] = useState(0);
  const roleLabel =
    {
      admin: "Admin dashboard",
      hr: "HR dashboard",
      manager: "Manager dashboard",
      super_admin: "Super admin dashboard",
    }[user?.role] || "Operations dashboard";

  return (
    <AppShell
      title={roleLabel}
      subtitle="Monitor delivery, attendance, capacity, and risk before assigning more work."
    >
      <div className="space-y-6">
        <ExecutiveDashboard />
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <AllTask refreshKey={taskRefreshKey} />
          <CreateTask onTaskCreated={() => setTaskRefreshKey((key) => key + 1)} />
        </div>
      </div>
    </AppShell>
  );
};

export default AdminDashboard;
