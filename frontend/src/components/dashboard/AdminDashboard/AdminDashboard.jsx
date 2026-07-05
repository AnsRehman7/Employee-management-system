import Header from "../../Header";
import AllTask from "./AllTask";
import CreateTask from "./CreateTask";
import { useUser } from "../../../context/UserContext";

const AdminDashboard = () => {
  const { user } = useUser();
  const roleLabel = user?.role === "hr" ? "HR dashboard" : "Admin dashboard";

  return (
    <div className="min-h-screen bg-slate-100">
      <Header
        title={roleLabel}
        subtitle="Assign employee-specific tasks, monitor progress, and keep work visible to the right people."
      />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-6">
        <CreateTask />
        <AllTask />
      </main>
    </div>
  );
};

export default AdminDashboard;
