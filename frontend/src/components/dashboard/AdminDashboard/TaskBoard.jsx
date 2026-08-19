import { useState } from "react";
import { FiAlertCircle, FiCalendar, FiMoreHorizontal } from "react-icons/fi";
import { Link } from "react-router-dom";
import { formatDate, initialsFor, isOverdue, labelForValue, TASK_STATUS_OPTIONS } from "./workUtils";

const COLUMN_ACCENTS = {
  active: "bg-teal-500",
  blocked: "bg-rose-500",
  completed: "bg-emerald-500",
  in_progress: "bg-teal-500",
  open: "bg-amber-400",
};

const PRIORITY_STYLES = {
  high: "border-rose-200 bg-rose-50 text-rose-700",
  low: "border-slate-200 bg-slate-100 text-slate-600",
  normal: "border-teal-200 bg-teal-50 text-teal-800",
};

/**
 * Kanban view over the same filtered task list the table renders, so switching view
 * never changes which tasks are shown.
 *
 * Dragging a card calls the same status endpoint the detail page uses. The move is
 * applied optimistically and rolled back if the server rejects it, which keeps the
 * board responsive without letting it drift from the source of truth.
 */
const TaskBoard = ({ canEdit, onStatusChange, tasks }) => {
  const [draggingId, setDraggingId] = useState("");
  const [activeColumn, setActiveColumn] = useState("");

  const columns = TASK_STATUS_OPTIONS.map((option) => ({
    ...option,
    tasks: tasks.filter((task) => task.status === option.value),
  }));

  const handleDrop = (status) => {
    setActiveColumn("");
    const task = tasks.find((item) => item.id === draggingId);
    setDraggingId("");
    if (!task || task.status === status) return;
    onStatusChange(task, status);
  };

  return (
    <div className="overflow-x-auto p-4">
      <div className="flex min-w-max gap-4">
        {columns.map((column) => (
          <section
            aria-label={`${column.label} column`}
            className={`flex w-72 shrink-0 flex-col rounded-xl border bg-canvas transition ${
              activeColumn === column.value && canEdit
                ? "border-emerald-400 ring-2 ring-emerald-100"
                : "border-slate-200"
            }`}
            key={column.value}
            onDragLeave={() => setActiveColumn((current) => (current === column.value ? "" : current))}
            onDragOver={(event) => {
              if (!canEdit || !draggingId) return;
              event.preventDefault();
              setActiveColumn(column.value);
            }}
            onDrop={(event) => {
              if (!canEdit) return;
              event.preventDefault();
              handleDrop(column.value);
            }}
          >
            <header className="flex items-center gap-2 border-b border-slate-200 px-3.5 py-3">
              <span className={`h-2 w-2 shrink-0 rounded-full ${COLUMN_ACCENTS[column.value] || "bg-slate-400"}`} />
              <h3 className="text-sm font-bold text-slate-900">{column.label}</h3>
              <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                {column.tasks.length}
              </span>
            </header>

            <div className="flex-1 space-y-2.5 p-2.5">
              {column.tasks.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-xs font-semibold text-slate-400">
                  Nothing here
                </p>
              ) : (
                column.tasks.map((task) => {
                  const overdue = isOverdue(task.deadline, task.status);

                  return (
                    <article
                      className={`group rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-emerald-200 hover:shadow-md ${
                        draggingId === task.id ? "opacity-50" : ""
                      } ${canEdit ? "cursor-grab active:cursor-grabbing" : ""}`}
                      draggable={canEdit}
                      key={task.id}
                      onDragEnd={() => {
                        setDraggingId("");
                        setActiveColumn("");
                      }}
                      onDragStart={() => setDraggingId(task.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          className="min-w-0 flex-1 text-sm font-bold leading-5 text-slate-950 transition group-hover:text-emerald-800"
                          to={`/tasks/${task.id}`}
                        >
                          {task.title}
                        </Link>
                        <Link
                          aria-label={`Open ${task.title}`}
                          className="shrink-0 text-slate-300 transition hover:text-emerald-700"
                          to={`/tasks/${task.id}`}
                        >
                          <FiMoreHorizontal className="h-4 w-4" />
                        </Link>
                      </div>

                      {task.projectName && (
                        <p className="mt-1.5 truncate text-xs text-slate-500">{task.projectName}</p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                            PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.normal
                          }`}
                        >
                          {labelForValue(task.priority)}
                        </span>
                        {task.deadline && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                              overdue
                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                : "border-slate-200 bg-slate-50 text-slate-600"
                            }`}
                          >
                            {overdue ? <FiAlertCircle className="h-3 w-3" /> : <FiCalendar className="h-3 w-3" />}
                            {formatDate(task.deadline, "No due date")}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-900">
                          {initialsFor(task.assignedToName)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-600">
                          {task.assignedToName || "Unassigned"}
                        </span>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default TaskBoard;
