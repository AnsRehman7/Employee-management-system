import AppShell from "../../AppShell";
import ExecutiveDashboard from "./ExecutiveDashboard";
import { useUser } from "../../../context/UserContext";

const AdminDashboard = () => {
  const { user } = useUser();
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
      <ExecutiveDashboard />
    </AppShell>
  );
};

export default AdminDashboard;
