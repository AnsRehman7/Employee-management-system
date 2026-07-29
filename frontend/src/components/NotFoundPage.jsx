import { FiArrowLeft, FiHome } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const destinationFor = (user) => {
  if (!user) return "/";
  if (user.permissions?.canViewDashboard) return "/admin";
  if (user.role === "employee") return "/employee";
  return "/tasks";
};

const NotFoundPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5 py-12">
      <section className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-7 shadow-sm">
        <p className="text-xs font-bold uppercase text-violet-700">404 / Page not found</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-950">This page is not available</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The address may be outdated, or your account may not have access to this workspace view.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <FiArrowLeft className="h-4 w-4" />
            Go back
          </button>
          <Link
            to={destinationFor(user)}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-800"
          >
            <FiHome className="h-4 w-4" />
            {user ? "Open workspace" : "Go home"}
          </Link>
        </div>
      </section>
    </main>
  );
};

export default NotFoundPage;
