import { FiCalendar, FiChevronDown } from "react-icons/fi";

const controlClass =
  "h-11 w-full rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-800 shadow-sm outline-none transition hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-100";

export const FilterSelect = ({ children, icon: Icon, label, onChange, value }) => (
  <label className="block min-w-0">
    <span className="mb-2 block text-xs font-bold text-slate-600">{label}</span>
    <span className="group relative block">
      {Icon && (
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400 transition group-focus-within:text-violet-600">
          <Icon className="h-4 w-4" />
        </span>
      )}
      <select
        className={`${controlClass} appearance-none ${Icon ? "pl-10" : "pl-3.5"} cursor-pointer pr-10`}
        onChange={onChange}
        value={value}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400 transition group-focus-within:text-violet-600">
        <FiChevronDown className="h-4 w-4" />
      </span>
    </span>
  </label>
);

export const FilterDate = ({ label, onChange, value }) => (
  <label className="block min-w-0">
    <span className="mb-2 block text-xs font-bold text-slate-600">{label}</span>
    <span className="group relative block">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400 transition group-focus-within:text-violet-600">
        <FiCalendar className="h-4 w-4" />
      </span>
      <input className={`${controlClass} px-3.5 pl-10`} onChange={onChange} type="date" value={value} />
    </span>
  </label>
);
