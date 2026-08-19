import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiEdit2,
  FiExternalLink,
  FiMapPin,
  FiPlus,
  FiSlash,
  FiTrash2,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";
import Alert from "./Alert";
import AppShell from "./AppShell";
import { CardSkeleton } from "./Skeleton";
import MeetingDialog from "./calendar/MeetingDialog";
import { api, formatApiError } from "../context/api";
import { useToast } from "../context/ToastContext";
import { useUser } from "../context/UserContext";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const timeFormatter = new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" });
const monthFormatter = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });
const dayFormatter = new Intl.DateTimeFormat("en", { day: "numeric", month: "long", weekday: "long" });

const toDateKey = (date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);

/** First and last day of the month that `dateKey` falls in. */
const monthBounds = (dateKey) => {
  const base = new Date(`${dateKey}T00:00:00`);
  const first = new Date(base.getFullYear(), base.getMonth(), 1);
  const last = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  return { first: toDateKey(first), last: toDateKey(last) };
};

const shiftMonth = (dateKey, delta) => {
  const base = new Date(`${dateKey}T00:00:00`);
  return toDateKey(new Date(base.getFullYear(), base.getMonth() + delta, 1));
};

/** Blank cells so the first of the month lands under the right weekday (Mon-first). */
const leadingBlanks = (dateKey) => {
  const weekday = new Date(`${dateKey}T00:00:00`).getDay();
  return (weekday + 6) % 7;
};

const RESPONSE_STYLES = {
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-800",
  declined: "border-rose-200 bg-rose-50 text-rose-700",
  invited: "border-slate-200 bg-slate-100 text-slate-600",
  tentative: "border-amber-200 bg-amber-50 text-amber-800",
};

const CalendarPage = () => {
  const { user } = useUser();
  const toast = useToast();

  const [anchor, setAnchor] = useState(() => toDateKey(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [calendar, setCalendar] = useState(null);
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [personFilter, setPersonFilter] = useState("all");
  const [dialog, setDialog] = useState({ meeting: null, open: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canSeeEveryone = Boolean(user?.permissions?.canViewAllAttendance);
  const bounds = useMemo(() => monthBounds(anchor), [anchor]);

  const loadCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getCalendar({
        from: bounds.first,
        to: bounds.last,
        userId: personFilter === "all" ? "" : personFilter,
      });
      setCalendar(result);
      setError("");
    } catch (requestError) {
      setCalendar(null);
      setError(formatApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, [bounds.first, bounds.last, personFilter]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  useEffect(() => {
    Promise.all([
      api.getEmployees().catch(() => ({ employees: [] })),
      api.getProjects().catch(() => ({ projects: [] })),
    ]).then(([employeeResult, projectResult]) => {
      setMembers((employeeResult.employees || []).filter((member) => member.id !== user?.id));
      setProjects(projectResult.projects || []);
    });
  }, [user?.id]);

  const daysByDate = useMemo(
    () => new Map((calendar?.days || []).map((day) => [day.date, day])),
    [calendar],
  );
  const selectedDay = daysByDate.get(selectedDate);

  const monthTotals = useMemo(() => {
    const days = calendar?.days || [];
    return {
      meetings: days.reduce((total, day) => total + day.meetingCount, 0),
      workingDays: days.filter((day) => day.isWorkingDay && !day.isHoliday).length,
    };
  }, [calendar]);

  const respond = async (meeting, response) => {
    try {
      await api.respondToMeeting(meeting.id, response);
      toast.success(`Marked as ${response}`, meeting.title);
      await loadCalendar();
    } catch (requestError) {
      toast.error("Could not send your response", formatApiError(requestError));
    }
  };

  const cancel = async (meeting) => {
    try {
      await api.cancelMeeting(meeting.id);
      toast.success("Meeting cancelled", meeting.title);
      await loadCalendar();
    } catch (requestError) {
      toast.error("Could not cancel meeting", formatApiError(requestError));
    }
  };

  return (
    <AppShell
      title="Calendar"
      subtitle="Meetings laid over your working calendar and attendance, so scheduled time can be read against who was actually in."
    >
      <div className="space-y-5">
        <Alert message={error} type="error" />

        <section className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3.5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <button
              aria-label="Previous month"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
              onClick={() => setAnchor((current) => shiftMonth(current, -1))}
              type="button"
            >
              <FiChevronLeft className="h-4 w-4" />
            </button>
            <button
              aria-label="Next month"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
              onClick={() => setAnchor((current) => shiftMonth(current, 1))}
              type="button"
            >
              <FiChevronRight className="h-4 w-4" />
            </button>
            <h2 className="ml-1 text-base font-bold text-slate-950">
              {monthFormatter.format(new Date(`${bounds.first}T00:00:00`))}
            </h2>
            <button
              className="ml-2 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
              onClick={() => {
                const today = toDateKey(new Date());
                setAnchor(today);
                setSelectedDate(today);
              }}
              type="button"
            >
              Today
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              {monthTotals.meetings} meetings &middot; {monthTotals.workingDays} working days
            </span>

            {canSeeEveryone && (
              <select
                aria-label="Filter by person"
                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                onChange={(event) => setPersonFilter(event.target.value)}
                value={personFilter}
              >
                <option value="all">Everyone</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            )}

            <button
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-700 px-3 text-sm font-bold text-white transition hover:bg-emerald-800"
              onClick={() => setDialog({ meeting: null, open: true })}
              type="button"
            >
              <FiPlus className="h-4 w-4" />
              New meeting
            </button>
          </div>
        </section>

        {loading ? (
          <CardSkeleton label="Loading calendar" lines={6} />
        ) : (
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                {WEEKDAYS.map((weekday) => (
                  <div className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500" key={weekday}>
                    {weekday}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {Array.from({ length: leadingBlanks(bounds.first) }).map((_, index) => (
                  <div className="min-h-24 border-b border-r border-slate-100 bg-slate-50/40" key={`blank-${index}`} />
                ))}

                {(calendar?.days || []).map((day) => {
                  const isSelected = day.date === selectedDate;
                  // Non-working days and holidays are visibly set back, so scheduling
                  // onto them is an obvious, deliberate act.
                  const offDay = !day.isWorkingDay || day.isHoliday;

                  return (
                    <button
                      aria-current={day.isToday ? "date" : undefined}
                      aria-label={`${dayFormatter.format(new Date(`${day.date}T00:00:00`))}, ${day.meetingCount} meetings`}
                      className={`min-h-24 border-b border-r border-slate-100 p-1.5 text-left align-top transition ${
                        offDay ? "bg-slate-50/70" : "bg-white hover:bg-emerald-50/40"
                      } ${isSelected ? "ring-2 ring-inset ring-emerald-500" : ""}`}
                      key={day.date}
                      onClick={() => setSelectedDate(day.date)}
                      type="button"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            day.isToday
                              ? "bg-emerald-700 text-white"
                              : offDay
                                ? "text-slate-400"
                                : "text-slate-800"
                          }`}
                        >
                          {Number(day.date.slice(8))}
                        </span>
                        {day.presentCount > 0 && (
                          <span
                            className="inline-flex items-center gap-0.5 rounded-full bg-teal-50 px-1.5 text-[10px] font-bold text-teal-800"
                            title={`${day.presentCount} present`}
                          >
                            <FiUserCheck className="h-2.5 w-2.5" />
                            {day.presentCount}
                          </span>
                        )}
                      </div>

                      {day.isHoliday && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-700">
                          <FiSlash className="h-2.5 w-2.5" />
                          Holiday
                        </span>
                      )}

                      <div className="mt-1 space-y-1">
                        {day.meetings.slice(0, 2).map((meeting) => (
                          <span
                            className={`block truncate rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                              meeting.status === "cancelled"
                                ? "bg-slate-100 text-slate-400 line-through"
                                : "bg-emerald-100 text-emerald-900"
                            }`}
                            key={meeting.id}
                          >
                            {timeFormatter.format(new Date(meeting.startsAt))} {meeting.title}
                          </span>
                        ))}
                        {day.meetingCount > 2 && (
                          <span className="block px-1.5 text-[10px] font-bold text-slate-500">
                            +{day.meetingCount - 2} more
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] font-semibold text-slate-500">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-emerald-100" />Meeting</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-slate-200" />Non-working day</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-violet-200" />Holiday</span>
                <span className="flex items-center gap-1.5"><FiUserCheck className="h-3 w-3 text-teal-700" />Checked in</span>
              </div>
            </section>

            {/* Day detail */}
            <aside className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm xl:sticky xl:top-24">
              <div className="border-b border-slate-200 px-4 py-3.5">
                <h2 className="text-sm font-bold text-slate-950">
                  {dayFormatter.format(new Date(`${selectedDate}T00:00:00`))}
                </h2>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span>{selectedDay?.meetingCount || 0} meetings</span>
                  {selectedDay?.presentCount > 0 && (
                    <span className="inline-flex items-center gap-1 font-semibold text-teal-700">
                      <FiUsers className="h-3 w-3" />
                      {selectedDay.presentCount} checked in
                    </span>
                  )}
                  {selectedDay && !selectedDay.isWorkingDay && <span className="font-semibold text-slate-400">Non-working day</span>}
                  {selectedDay?.isHoliday && <span className="font-semibold text-violet-700">Holiday</span>}
                </p>
              </div>

              <div className="max-h-[32rem] divide-y divide-slate-100 overflow-y-auto">
                {!selectedDay || selectedDay.meetings.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <FiCalendar className="mx-auto h-7 w-7 text-slate-300" />
                    <p className="mt-3 text-sm font-semibold text-slate-500">Nothing scheduled.</p>
                    <button
                      className="mt-3 text-xs font-bold text-emerald-700 transition hover:text-emerald-800"
                      onClick={() => setDialog({ meeting: null, open: true })}
                      type="button"
                    >
                      Schedule a meeting
                    </button>
                  </div>
                ) : (
                  selectedDay.meetings.map((meeting) => (
                    <article className="px-4 py-3.5" key={meeting.id}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className={`text-sm font-bold ${meeting.status === "cancelled" ? "text-slate-400 line-through" : "text-slate-950"}`}>
                            {meeting.title}
                          </p>
                          <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                            <FiClock className="h-3 w-3" />
                            {timeFormatter.format(new Date(meeting.startsAt))} - {timeFormatter.format(new Date(meeting.endsAt))}
                          </p>
                        </div>
                        {meeting.canManage && meeting.status !== "cancelled" && (
                          <div className="flex shrink-0 gap-1">
                            <button
                              aria-label="Edit meeting"
                              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-emerald-700"
                              onClick={() => setDialog({ meeting, open: true })}
                              type="button"
                            >
                              <FiEdit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              aria-label="Cancel meeting"
                              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-rose-50 hover:text-rose-700"
                              onClick={() => cancel(meeting)}
                              type="button"
                            >
                              <FiTrash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {meeting.agenda && <p className="mt-2 text-xs leading-5 text-slate-600">{meeting.agenda}</p>}

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {meeting.project && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            {meeting.project.name}
                          </span>
                        )}
                        {meeting.location && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                            <FiMapPin className="h-2.5 w-2.5" />
                            {meeting.location}
                          </span>
                        )}
                        {meeting.meetingUrl && (
                          <a
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-800"
                            href={meeting.meetingUrl}
                            rel="noreferrer noopener"
                            target="_blank"
                          >
                            <FiExternalLink className="h-2.5 w-2.5" />
                            Join
                          </a>
                        )}
                      </div>

                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {meeting.attendees.map((attendee) => (
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                              RESPONSE_STYLES[attendee.response] || RESPONSE_STYLES.invited
                            }`}
                            key={attendee.id}
                            title={`${attendee.name}: ${attendee.response}`}
                          >
                            {attendee.name}
                          </span>
                        ))}
                      </div>

                      {meeting.myResponse && meeting.status !== "cancelled" && (
                        <div className="mt-3 flex gap-1.5 border-t border-slate-100 pt-2.5">
                          {["accepted", "tentative", "declined"].map((response) => (
                            <button
                              className={`flex-1 rounded-md border px-2 py-1 text-[11px] font-bold transition ${
                                meeting.myResponse === response
                                  ? RESPONSE_STYLES[response]
                                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
                              }`}
                              key={response}
                              onClick={() => respond(meeting, response)}
                              type="button"
                            >
                              {response === "accepted" ? "Going" : response === "tentative" ? "Maybe" : "Decline"}
                            </button>
                          ))}
                        </div>
                      )}
                    </article>
                  ))
                )}
              </div>
            </aside>
          </div>
        )}
      </div>

      {dialog.open && (
        <MeetingDialog
          dateKey={selectedDate}
          meeting={dialog.meeting}
          members={members}
          onClose={() => setDialog({ meeting: null, open: false })}
          onSaved={loadCalendar}
          projects={projects}
        />
      )}
    </AppShell>
  );
};

export default CalendarPage;
