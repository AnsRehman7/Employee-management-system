import {
  FiActivity,
  FiCheck,
  FiClock,
  FiEdit2,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import { formatDateTime, initialsFor, labelForValue } from "./workUtils";

const actionIcons = {
  completed: FiCheck,
  created: FiPlus,
  deleted: FiTrash2,
  status_changed: FiActivity,
  time_logged: FiClock,
  updated: FiEdit2,
};

const formatActivityValue = (value) => {
  if (value === null || value === undefined || value === "") return "Not set";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "None";
  if (typeof value === "boolean") return value ? "Yes" : "No";

  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return new Date(`${text}T00:00:00`).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
    const date = new Date(text);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
    }
  }

  if (/^[A-Z][A-Z_]+$/.test(text)) return labelForValue(text.toLowerCase());
  return text;
};

const ChangeValue = ({ value }) => {
  const formatted = formatActivityValue(value);
  const isLong = formatted.length > 140;

  if (!isLong) {
    return <span className="break-words text-xs leading-5 text-slate-700">{formatted}</span>;
  }

  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-xs font-semibold text-emerald-800">
        View text
      </summary>
      <p className="mt-2 max-h-36 overflow-y-auto whitespace-pre-wrap break-words rounded-md bg-slate-50 p-2 text-xs leading-5 text-slate-600">
        {formatted}
      </p>
    </details>
  );
};

const WorkActivityTimeline = ({ activity = [], emptyMessage = "No activity has been recorded yet." }) => (
  <div>
    {activity.length === 0 ? (
      <div className="py-12 text-center">
        <FiActivity className="mx-auto h-7 w-7 text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-500">{emptyMessage}</p>
      </div>
    ) : (
      <ol className="px-5 py-2">
        {activity.map((entry, index) => {
          const Icon = actionIcons[entry.action] || FiActivity;
          const changes = Array.isArray(entry.metadata?.changes) ? entry.metadata.changes : [];
          const timeLogged = entry.action === "time_logged" ? Number(entry.metadata?.hours || 0) : 0;

          return (
            <li className="relative flex gap-4 py-4" key={entry.id}>
              {index < activity.length - 1 && (
                <span className="absolute bottom-0 left-4 top-12 w-px bg-slate-200" />
              )}
              <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-[10px] font-bold text-emerald-900">
                      {initialsFor(entry.actor?.name || "DayMark")}
                    </span>
                    <p className="min-w-0 text-sm text-slate-700">
                      <span className="font-bold text-slate-950">{entry.actor?.name || "DayMark"}</span>
                      <span className="ml-1">{entry.summary}</span>
                    </p>
                  </div>
                  <time className="shrink-0 pl-9 text-xs font-semibold text-slate-400 sm:pl-0">
                    {formatDateTime(entry.createdAt)}
                  </time>
                </div>

                {changes.length > 0 && (
                  <div className="ml-9 mt-3 overflow-hidden rounded-md border border-slate-200">
                    {changes.map((change) => (
                      <div
                        className="grid gap-2 border-b border-slate-100 px-3 py-2.5 last:border-b-0 sm:grid-cols-[130px_minmax(0,1fr)_20px_minmax(0,1fr)]"
                        key={`${entry.id}-${change.field}`}
                      >
                        <span className="text-xs font-bold text-slate-500">{change.label}</span>
                        <ChangeValue value={change.from} />
                        <span className="hidden text-center text-xs text-slate-300 sm:block">to</span>
                        <ChangeValue value={change.to} />
                      </div>
                    ))}
                  </div>
                )}

                {timeLogged > 0 && (
                  <div className="ml-9 mt-2 text-xs leading-5 text-slate-500">
                    <span className="font-bold text-slate-700">{timeLogged.toFixed(2)} hours</span>
                    {entry.metadata?.note ? ` / ${entry.metadata.note}` : ""}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    )}
  </div>
);

export default WorkActivityTimeline;
