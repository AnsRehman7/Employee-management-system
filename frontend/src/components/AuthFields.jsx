import { createElement, useState } from "react";
import { FiArrowRight, FiEye, FiEyeOff } from "react-icons/fi";

const shellClass =
  "flex min-w-0 items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3.5 transition focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-600/10";

export const AuthField = ({ icon, label, ...inputProps }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
    <div className={`${shellClass} h-12`}>
      {icon && createElement(icon, { className: "h-[18px] w-[18px] shrink-0 text-slate-400" })}
      <input
        className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
        {...inputProps}
      />
    </div>
  </label>
);

export const AuthPasswordField = ({ icon, label, ...inputProps }) => {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      <div className={`${shellClass} h-12`}>
        {icon && createElement(icon, { className: "h-[18px] w-[18px] shrink-0 text-slate-400" })}
        <input
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
          type={visible ? "text" : "password"}
          {...inputProps}
        />
        <button
          aria-label={visible ? "Hide password" : "Show password"}
          className="shrink-0 text-slate-400 transition hover:text-slate-700"
          onClick={() => setVisible((current) => !current)}
          tabIndex={-1}
          type="button"
        >
          {visible ? <FiEyeOff className="h-[18px] w-[18px]" /> : <FiEye className="h-[18px] w-[18px]" />}
        </button>
      </div>
    </label>
  );
};

export const AuthSubmitButton = ({ children, loading, loadingLabel, ...buttonProps }) => (
  <button
    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white shadow-sm shadow-emerald-800/20 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
    type="submit"
    {...buttonProps}
  >
    {loading ? loadingLabel : children}
    {!loading && <FiArrowRight className="h-4 w-4" />}
  </button>
);

export const AuthLink = ({ children, className = "", ...linkProps }) => (
  <span className={`font-bold text-emerald-700 transition hover:text-emerald-800 ${className}`} {...linkProps}>
    {children}
  </span>
);
