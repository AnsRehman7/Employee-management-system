const LoadingScreen = ({ label = "Loading StaffFlow" }) => (
  <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
    <div className="flex flex-col items-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
      <p className="text-sm font-medium text-slate-300">{label}</p>
    </div>
  </div>
);

export default LoadingScreen;
