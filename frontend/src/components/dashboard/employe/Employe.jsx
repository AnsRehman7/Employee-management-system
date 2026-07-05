import TaskList from "../../tasklist/TaskList";
import Header from "../../Header";
import TaskNumber from "./TaskNumber";
import { useUser } from "../../../context/UserContext";

const Employe = () => {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-slate-100">
      <Header
        title="My work"
        subtitle={`Welcome back${user?.name ? `, ${user.name}` : ""}. Your assignments are scoped to your account.`}
      />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <section className="mb-8">
          <TaskNumber />
        </section>

        <section>
          <TaskList />
        </section>
      </main>
    </div>
  );
};

export default Employe;
