const LoadingScreen = ({ label = "Loading StaffFlow" }) => (
  <div className="flex min-h-screen items-center justify-center bg-[#f7f8f5] text-slate-950">
    <div className="flex flex-col items-center gap-4 rounded-lg border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/70">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-100 border-t-emerald-700" />
      <p className="text-sm font-semibold text-slate-600">{label}</p>
    </div>
  </div>
);

export default LoadingScreen;
