import { Component } from "react";
import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";

class AppErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, details) {
    console.error("DayMark screen error", error, details);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-5 py-12">
        <section className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-7 shadow-sm">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-rose-50 text-rose-600">
            <FiAlertTriangle className="h-5 w-5" />
          </span>
          <p className="mt-5 text-xs font-bold uppercase text-emerald-800">Unable to open this view</p>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-950">DayMark hit an unexpected error</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Reload the application. Your saved workspace data is not affected.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-900"
          >
            <FiRefreshCw className="h-4 w-4" />
            Reload DayMark
          </button>
        </section>
      </main>
    );
  }
}

export default AppErrorBoundary;
