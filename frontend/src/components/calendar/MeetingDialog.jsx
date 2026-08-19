import { useEffect, useMemo, useState } from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";
import Alert from "../Alert";
import { api, formatApiError } from "../../context/api";
import { useToast } from "../../context/ToastContext";

const fieldClass =
  "mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";

/** `datetime-local` needs a local-clock string, not a UTC ISO string. */
const toLocalInput = (value) => {
  const date = value ? new Date(value) : new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

const addHour = (localInput) => {
  const date = new Date(localInput);
  date.setHours(date.getHours() + 1);
  return toLocalInput(date);
};

const emptyForm = (dateKey) => {
  const base = dateKey ? `${dateKey}T09:00` : toLocalInput();
  return {
    agenda: "",
    attendeeIds: [],
    endsAt: addHour(base),
    location: "",
    meetingUrl: "",
    projectId: "",
    startsAt: base,
    title: "",
  };
};

const MeetingDialog = ({ dateKey, meeting, members, onClose, onSaved, projects }) => {
  const toast = useToast();
  const [form, setForm] = useState(() => emptyForm(dateKey));
  const [conflicts, setConflicts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditing = Boolean(meeting);

  useEffect(() => {
    if (!meeting) {
      setForm(emptyForm(dateKey));
      return;
    }
    setForm({
      agenda: meeting.agenda || "",
      attendeeIds: meeting.attendees.map((attendee) => attendee.id),
      endsAt: toLocalInput(meeting.endsAt),
      location: meeting.location || "",
      meetingUrl: meeting.meetingUrl || "",
      projectId: meeting.project?.id || "",
      startsAt: toLocalInput(meeting.startsAt),
      title: meeting.title,
    });
  }, [dateKey, meeting]);

  const update = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  const toggleAttendee = (userId) => {
    setForm((current) => ({
      ...current,
      attendeeIds: current.attendeeIds.includes(userId)
        ? current.attendeeIds.filter((id) => id !== userId)
        : [...current.attendeeIds, userId],
    }));
  };

  const selectedCount = form.attendeeIds.length;
  const invalidRange = useMemo(
    () => Boolean(form.startsAt && form.endsAt && new Date(form.endsAt) <= new Date(form.startsAt)),
    [form.endsAt, form.startsAt],
  );

  const submit = async (event) => {
    event.preventDefault();
    if (invalidRange) {
      setError("The meeting must end after it starts.");
      return;
    }

    setSaving(true);
    setError("");
    setConflicts([]);

    // The browser gives a local-clock value; the API stores an absolute instant.
    const payload = {
      agenda: form.agenda,
      attendeeIds: form.attendeeIds,
      endsAt: new Date(form.endsAt).toISOString(),
      location: form.location,
      meetingUrl: form.meetingUrl,
      projectId: form.projectId,
      startsAt: new Date(form.startsAt).toISOString(),
      title: form.title,
    };

    try {
      const result = isEditing
        ? await api.updateMeeting(meeting.id, payload)
        : await api.createMeeting(payload);

      // A clash is reported, not blocked: only the organizer knows if it is deliberate.
      if (result.conflicts?.length) {
        toast.info(
          `Scheduled with ${result.conflicts.length} conflict${result.conflicts.length > 1 ? "s" : ""}`,
          result.conflicts.map((conflict) => conflict.name).join(", "),
        );
      } else {
        toast.success(isEditing ? "Meeting updated" : "Meeting scheduled", form.title);
      }

      onSaved();
      onClose();
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-scrim/55 px-4 py-10 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <form
        aria-label={isEditing ? "Edit meeting" : "Schedule meeting"}
        aria-modal="true"
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
        onSubmit={submit}
        role="dialog"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-bold text-slate-950">
            {isEditing ? "Edit meeting" : "Schedule a meeting"}
          </h2>
          <button
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
            type="button"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[65vh] space-y-4 overflow-y-auto p-5">
          <Alert message={error} type="error" />

          {conflicts.length > 0 && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
              <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <p className="text-xs leading-5 text-amber-900">
                {conflicts.map((conflict) => conflict.name).join(", ")} already have something booked then.
              </p>
            </div>
          )}

          <label className="block">
            <span className="text-xs font-bold text-slate-600">Title</span>
            <input
              className={fieldClass}
              maxLength="160"
              onChange={(event) => update("title", event.target.value)}
              placeholder="Sprint review"
              required
              value={form.title}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block min-w-0">
              <span className="text-xs font-bold text-slate-600">Starts</span>
              <input
                className={fieldClass}
                onChange={(event) => {
                  update("startsAt", event.target.value);
                  if (new Date(form.endsAt) <= new Date(event.target.value)) {
                    update("endsAt", addHour(event.target.value));
                  }
                }}
                required
                type="datetime-local"
                value={form.startsAt}
              />
            </label>
            <label className="block min-w-0">
              <span className="text-xs font-bold text-slate-600">Ends</span>
              <input
                className={`${fieldClass} ${invalidRange ? "border-rose-400" : ""}`}
                onChange={(event) => update("endsAt", event.target.value)}
                required
                type="datetime-local"
                value={form.endsAt}
              />
              {invalidRange && <span className="mt-1 block text-xs font-semibold text-rose-600">End must be after start.</span>}
            </label>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-600">
              Attendees {selectedCount > 0 && <span className="text-slate-400">({selectedCount} selected)</span>}
            </span>
            <div className="mt-1.5 max-h-44 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
              {members.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-500">No other members yet.</p>
              ) : (
                members.map((member) => {
                  const checked = form.attendeeIds.includes(member.id);
                  return (
                    <label
                      className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 transition ${
                        checked ? "bg-emerald-50" : "hover:bg-slate-50"
                      }`}
                      key={member.id}
                    >
                      <input
                        checked={checked}
                        className="h-4 w-4 accent-emerald-700"
                        onChange={() => toggleAttendee(member.id)}
                        type="checkbox"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">
                        {member.name}
                      </span>
                      {member.department && (
                        <span className="shrink-0 text-xs text-slate-400">{member.department}</span>
                      )}
                    </label>
                  );
                })
              )}
            </div>
            <p className="mt-1.5 text-xs text-slate-500">You are always included as the organizer.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block min-w-0">
              <span className="text-xs font-bold text-slate-600">Related project</span>
              <select
                className={fieldClass}
                onChange={(event) => update("projectId", event.target.value)}
                value={form.projectId}
              >
                <option value="">None</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block min-w-0">
              <span className="text-xs font-bold text-slate-600">Location</span>
              <input
                className={fieldClass}
                maxLength="200"
                onChange={(event) => update("location", event.target.value)}
                placeholder="Meeting room or office"
                value={form.location}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-bold text-slate-600">Meeting link</span>
            <input
              className={fieldClass}
              onChange={(event) => update("meetingUrl", event.target.value)}
              placeholder="https://meet.example.com/..."
              type="url"
              value={form.meetingUrl}
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold text-slate-600">Agenda</span>
            <textarea
              className="mt-1.5 min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              maxLength="4000"
              onChange={(event) => update("agenda", event.target.value)}
              placeholder="What needs to be decided?"
              value={form.agenda}
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3.5">
          <button
            className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="inline-flex h-10 items-center rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={saving || !form.title.trim() || invalidRange}
            type="submit"
          >
            {saving ? "Saving..." : isEditing ? "Save changes" : "Schedule meeting"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MeetingDialog;
