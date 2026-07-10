import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiClock,
  FiLogIn,
  FiLogOut,
  FiRefreshCw,
  FiShield,
  FiSliders,
  FiTrash2,
  FiUserCheck,
} from "react-icons/fi";
import Header from "../Header";
import Alert from "../Alert";
import { api, formatApiError } from "../../context/api";

const toLocalDateInput = (date = new Date()) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const minutesFromTime = (time = "00:00") => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const combineDateTime = (date, time) => `${date}T${time}:00`;

const formatTime = (timestamp) => {
  if (!timestamp) return "-";

  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
};

const formatDuration = (minutes) => {
  if (!Number.isFinite(minutes) || minutes <= 0) return "-";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (!hours) return `${remainingMinutes}m`;
  if (!remainingMinutes) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
};

const getScanMinutes = (scan) => {
  const date = new Date(scan.timestamp);
  return date.getHours() * 60 + date.getMinutes();
};

const getScanDay = (scan) => toLocalDateInput(new Date(scan.timestamp));

const sampleRoster = [
  {
    department: "Operations",
    designation: "Operations Manager",
    fingerprintId: "FP-1001",
    id: "sample-ayesha",
    name: "Ayesha Noor",
    role: "manager",
  },
  {
    department: "Sales",
    designation: "Client Coordinator",
    fingerprintId: "FP-1002",
    id: "sample-hamza",
    name: "Hamza Ali",
    role: "employee",
  },
  {
    department: "HR",
    designation: "HR Executive",
    fingerprintId: "FP-1003",
    id: "sample-sara",
    name: "Sara Khan",
    role: "hr",
  },
  {
    department: "Finance",
    designation: "Accounts Officer",
    fingerprintId: "FP-1004",
    id: "sample-bilal",
    name: "Bilal Ahmed",
    role: "accounts",
  },
];

const createSampleScans = (date) => [
  { direction: "in", id: "scan-1", source: "Door fingerprint", timestamp: combineDateTime(date, "08:12"), userId: "sample-ayesha" },
  { direction: "out", id: "scan-2", source: "Door fingerprint", timestamp: combineDateTime(date, "12:45"), userId: "sample-ayesha" },
  { direction: "in", id: "scan-3", source: "Door fingerprint", timestamp: combineDateTime(date, "13:24"), userId: "sample-ayesha" },
  { direction: "out", id: "scan-4", source: "Door fingerprint", timestamp: combineDateTime(date, "16:20"), userId: "sample-ayesha" },
  { direction: "out", id: "scan-5", source: "Door fingerprint", timestamp: combineDateTime(date, "17:18"), userId: "sample-ayesha" },
  { direction: "in", id: "scan-6", source: "Door fingerprint", timestamp: combineDateTime(date, "09:32"), userId: "sample-hamza" },
  { direction: "out", id: "scan-7", source: "Door fingerprint", timestamp: combineDateTime(date, "13:05"), userId: "sample-hamza" },
  { direction: "in", id: "scan-8", source: "Door fingerprint", timestamp: combineDateTime(date, "14:02"), userId: "sample-hamza" },
  { direction: "out", id: "scan-9", source: "Door fingerprint", timestamp: combineDateTime(date, "17:47"), userId: "sample-hamza" },
  { direction: "in", id: "scan-10", source: "Mobile fingerprint", timestamp: combineDateTime(date, "08:55"), userId: "sample-sara" },
  { direction: "out", id: "scan-11", source: "Door fingerprint", timestamp: combineDateTime(date, "12:30"), userId: "sample-sara" },
  { direction: "in", id: "scan-12", source: "Door fingerprint", timestamp: combineDateTime(date, "13:05"), userId: "sample-sara" },
];

const statusStyles = {
  absent: "bg-slate-200 text-slate-700",
  checked_out: "bg-emerald-100 text-emerald-700",
  in_office: "bg-sky-100 text-sky-700",
  late: "bg-amber-100 text-amber-800",
};

const directionStyles = {
  in: "bg-emerald-100 text-emerald-700",
  out: "bg-slate-200 text-slate-700",
};

const buildIntervals = (scans) => {
  const intervals = [];
  let activeIn = null;

  scans.forEach((scan) => {
    if (scan.direction === "in" && !activeIn) {
      activeIn = scan;
      return;
    }

    if (scan.direction === "out" && activeIn) {
      const start = new Date(activeIn.timestamp);
      const end = new Date(scan.timestamp);
      if (end > start) {
        intervals.push({ end: scan.timestamp, start: activeIn.timestamp });
      }
      activeIn = null;
    }
  });

  return intervals;
};

const buildAttendanceRow = (member, scans, schedule) => {
  const sortedScans = scans
    .filter((scan) => scan.userId === member.id)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const checkIn = sortedScans[0] || null;
  const checkInEnd = minutesFromTime(schedule.officeStart) + Number(schedule.checkInGraceMinutes);
  const checkoutStart = minutesFromTime(schedule.checkoutStart);
  const checkoutEnd = minutesFromTime(schedule.checkoutEnd);
  const checkoutCandidates = sortedScans.filter((scan) => {
    const scanMinutes = getScanMinutes(scan);
    return scan.direction === "out" && scanMinutes >= checkoutStart && scanMinutes <= checkoutEnd;
  });
  const checkOut = checkoutCandidates[checkoutCandidates.length - 1] || null;
  const intervals = buildIntervals(sortedScans);
  const netMinutes = intervals.reduce((total, interval) => {
    const start = new Date(interval.start);
    const end = new Date(interval.end);
    return total + Math.max(0, Math.round((end - start) / 60000));
  }, 0);
  const grossMinutes =
    checkIn && checkOut ? Math.max(0, Math.round((new Date(checkOut.timestamp) - new Date(checkIn.timestamp)) / 60000)) : 0;

  if (!checkIn) {
    return {
      checkIn: null,
      checkOut: null,
      grossMinutes: 0,
      intervals,
      member,
      netMinutes: 0,
      scanCount: 0,
      status: "absent",
      statusLabel: "Absent",
    };
  }

  const isLate = getScanMinutes(checkIn) > checkInEnd;
  const status = checkOut ? "checked_out" : isLate ? "late" : "in_office";

  return {
    checkIn,
    checkOut,
    grossMinutes,
    intervals,
    member,
    netMinutes,
    scanCount: sortedScans.length,
    status,
    statusLabel: checkOut ? "Checked out" : isLate ? "Late coming" : "In office",
  };
};

const AttendancePortal = () => {
  const today = useMemo(() => toLocalDateInput(), []);
  const [date, setDate] = useState(today);
  const [loadingRoster, setLoadingRoster] = useState(true);
  const [notice, setNotice] = useState({ message: "", type: "info" });
  const [roster, setRoster] = useState(sampleRoster);
  const [scans, setScans] = useState(() => createSampleScans(today));
  const [schedule, setSchedule] = useState({
    checkInGraceMinutes: 60,
    checkoutEnd: "18:00",
    checkoutStart: "16:00",
    officeEnd: "17:00",
    officeStart: "08:00",
  });
  const [scanForm, setScanForm] = useState({
    direction: "in",
    scanTime: "08:10",
    source: "Door fingerprint",
    userId: sampleRoster[0].id,
  });

  const loadRoster = useCallback(async () => {
    setLoadingRoster(true);

    try {
      const { employees = [] } = await api.getEmployees();

      if (employees.length) {
        const mappedRoster = employees.map((employee, index) => ({
          department: employee.department || "Team",
          designation: employee.designation || employee.role,
          fingerprintId: `FP-${String(index + 1).padStart(4, "0")}`,
          id: employee.id,
          name: employee.name,
          role: employee.role,
        }));
        setRoster(mappedRoster);
        setScanForm((current) => ({ ...current, userId: mappedRoster[0].id }));
        setScans([]);
      }
      setNotice({ message: "", type: "info" });
    } catch (error) {
      setNotice({
        message: `Using sample roster until backend attendance users are connected. ${formatApiError(error)}`,
        type: "info",
      });
    } finally {
      setLoadingRoster(false);
    }
  }, []);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  const dayScans = useMemo(
    () => scans.filter((scan) => getScanDay(scan) === date).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
    [date, scans]
  );

  const attendanceRows = useMemo(
    () => roster.map((member) => buildAttendanceRow(member, dayScans, schedule)),
    [dayScans, roster, schedule]
  );

  const summary = useMemo(() => {
    const checkedIn = attendanceRows.filter((row) => row.checkIn).length;
    const checkedOut = attendanceRows.filter((row) => row.checkOut).length;
    const late = attendanceRows.filter((row) => row.status === "late").length;
    const absent = attendanceRows.filter((row) => row.status === "absent").length;
    const totalNetMinutes = attendanceRows.reduce((total, row) => total + row.netMinutes, 0);

    return { absent, checkedIn, checkedOut, late, totalNetMinutes };
  }, [attendanceRows]);

  const handleScheduleChange = (event) => {
    const { name, value } = event.target;
    setSchedule((current) => ({ ...current, [name]: value }));
  };

  const handleScanFormChange = (event) => {
    const { name, value } = event.target;
    setScanForm((current) => ({ ...current, [name]: value }));
  };

  const handleAddScan = (event) => {
    event.preventDefault();
    const member = roster.find((item) => item.id === scanForm.userId);
    if (!member) return;

    const timestamp = combineDateTime(date, scanForm.scanTime);
    setScans((current) => [
      ...current,
      {
        direction: scanForm.direction,
        id: `scan-${Date.now()}`,
        source: scanForm.source,
        timestamp,
        userId: scanForm.userId,
      },
    ]);
    setNotice({
      message: `${member.name} ${scanForm.direction === "in" ? "entry" : "exit"} scan recorded at ${scanForm.scanTime}.`,
      type: "success",
    });
  };

  const loadSampleDay = () => {
    setRoster(sampleRoster);
    setScanForm((current) => ({ ...current, userId: sampleRoster[0].id }));
    setScans(createSampleScans(date));
    setNotice({ message: "Sample fingerprint scans loaded for the selected day.", type: "success" });
  };

  const clearDayScans = () => {
    setScans((current) => current.filter((scan) => getScanDay(scan) !== date));
    setNotice({ message: "Selected day scans cleared.", type: "success" });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Header
        title="Attendance portal"
        subtitle="Track first check-in, late coming, latest checkout, and total office time from fingerprint scan events."
      />

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 xl:grid-cols-[0.82fr_1.18fr] lg:px-6">
        <section className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start gap-3 border-b border-slate-200 pb-5">
              <span className="rounded-lg bg-emerald-100 p-3 text-emerald-700">
                <FiSliders className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-2xl font-black text-slate-950">Attendance rules</h2>
                <p className="mt-1 text-sm text-slate-500">
                  First scan is check-in. Latest exit scan inside checkout window is checkout.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Alert message={notice.message} type={notice.type} />

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Attendance date</span>
                <input
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  onChange={(event) => setDate(event.target.value)}
                  type="date"
                  value={date}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Office start</span>
                  <input
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    name="officeStart"
                    onChange={handleScheduleChange}
                    type="time"
                    value={schedule.officeStart}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Grace minutes</span>
                  <input
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    min="0"
                    name="checkInGraceMinutes"
                    onChange={handleScheduleChange}
                    type="number"
                    value={schedule.checkInGraceMinutes}
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Office end</span>
                  <input
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    name="officeEnd"
                    onChange={handleScheduleChange}
                    type="time"
                    value={schedule.officeEnd}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Checkout from</span>
                  <input
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    name="checkoutStart"
                    onChange={handleScheduleChange}
                    type="time"
                    value={schedule.checkoutStart}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Checkout until</span>
                  <input
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    name="checkoutEnd"
                    onChange={handleScheduleChange}
                    type="time"
                    value={schedule.checkoutEnd}
                  />
                </label>
              </div>
            </div>
          </section>

          <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleAddScan}>
            <div className="mb-5 flex items-start gap-3 border-b border-slate-200 pb-5">
              <span className="rounded-lg bg-slate-950 p-3 text-white">
                <FiShield className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-2xl font-black text-slate-950">Fingerprint scan</h2>
                <p className="mt-1 text-sm text-slate-500">Simulates the door device or future mobile fingerprint event.</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Team member</span>
                <select
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  disabled={loadingRoster}
                  name="userId"
                  onChange={handleScanFormChange}
                  value={scanForm.userId}
                >
                  {roster.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} - {member.fingerprintId}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Scan time</span>
                  <input
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    name="scanTime"
                    onChange={handleScanFormChange}
                    required
                    type="time"
                    value={scanForm.scanTime}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Scan direction</span>
                  <select
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    name="direction"
                    onChange={handleScanFormChange}
                    value={scanForm.direction}
                  >
                    <option value="in">Entry scan</option>
                    <option value="out">Exit scan</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Source</span>
                <select
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  name="source"
                  onChange={handleScanFormChange}
                  value={scanForm.source}
                >
                  <option value="Door fingerprint">Door fingerprint</option>
                  <option value="Mobile fingerprint">Mobile fingerprint</option>
                  <option value="Manual admin correction">Manual admin correction</option>
                </select>
              </label>

              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={loadingRoster}
                type="submit"
              >
                {scanForm.direction === "in" ? <FiLogIn className="h-4 w-4" /> : <FiLogOut className="h-4 w-4" />}
                Record scan
              </button>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                  onClick={loadSampleDay}
                  type="button"
                >
                  <FiRefreshCw className="h-4 w-4" />
                  Load sample
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                  onClick={clearDayScans}
                  type="button"
                >
                  <FiTrash2 className="h-4 w-4" />
                  Clear day
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="space-y-6">
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
            {[
              ["Checked in", summary.checkedIn, <FiLogIn className="h-5 w-5" />],
              ["Late", summary.late, <FiClock className="h-5 w-5" />],
              ["Checked out", summary.checkedOut, <FiLogOut className="h-5 w-5" />],
              ["Absent", summary.absent, <FiUserCheck className="h-5 w-5" />],
              ["Net hours", formatDuration(summary.totalNetMinutes), <FiActivity className="h-5 w-5" />],
            ].map(([label, value, icon]) => (
              <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={label}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
                    <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
                  </div>
                  <span className="rounded-lg bg-slate-100 p-3 text-slate-700">{icon}</span>
                </div>
              </article>
            ))}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 border-b border-slate-200 pb-5">
              <h2 className="text-2xl font-black text-slate-950">Daily attendance</h2>
              <p className="mt-1 text-sm text-slate-500">
                Check-in window: {schedule.officeStart} to{" "}
                {formatTime(combineDateTime(date, `${String(Math.floor((minutesFromTime(schedule.officeStart) + Number(schedule.checkInGraceMinutes)) / 60)).padStart(2, "0")}:${String((minutesFromTime(schedule.officeStart) + Number(schedule.checkInGraceMinutes)) % 60).padStart(2, "0")}`))}.
                Checkout window: {schedule.checkoutStart} to {schedule.checkoutEnd}.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead>
                  <tr className="text-xs font-bold uppercase text-slate-500">
                    <th className="px-3 py-3">Staff</th>
                    <th className="px-3 py-3">Check-in</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Check-out</th>
                    <th className="px-3 py-3">Office time</th>
                    <th className="px-3 py-3">Scans</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceRows.map((row) => (
                    <tr className="align-top" key={row.member.id}>
                      <td className="px-3 py-4">
                        <p className="font-black text-slate-950">{row.member.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {row.member.designation} - {row.member.fingerprintId}
                        </p>
                      </td>
                      <td className="px-3 py-4 font-semibold text-slate-700">{formatTime(row.checkIn?.timestamp)}</td>
                      <td className="px-3 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyles[row.status]}`}>
                          {row.statusLabel}
                        </span>
                      </td>
                      <td className="px-3 py-4 font-semibold text-slate-700">{formatTime(row.checkOut?.timestamp)}</td>
                      <td className="px-3 py-4">
                        <p className="font-black text-slate-950">{formatDuration(row.netMinutes)}</p>
                        {row.grossMinutes > 0 && (
                          <p className="mt-1 text-xs text-slate-500">Gross {formatDuration(row.grossMinutes)}</p>
                        )}
                      </td>
                      <td className="px-3 py-4 font-semibold text-slate-700">{row.scanCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 border-b border-slate-200 pb-5">
              <h2 className="text-2xl font-black text-slate-950">Scan timeline</h2>
              <p className="mt-1 text-sm text-slate-500">Every fingerprint event is preserved for audit and later device integration.</p>
            </div>

            {dayScans.length === 0 ? (
              <div className="py-12 text-center">
                <FiShield className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-3 text-sm font-semibold text-slate-500">No scans recorded for this day.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dayScans.map((scan) => {
                  const member = roster.find((item) => item.id === scan.userId);

                  return (
                    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={scan.id}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${directionStyles[scan.direction]}`}>
                              {scan.direction === "in" ? "Entry" : "Exit"}
                            </span>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                              {scan.source}
                            </span>
                          </div>
                          <p className="mt-3 text-base font-black text-slate-950">{member?.name || "Unknown staff"}</p>
                          <p className="mt-1 text-sm text-slate-500">{member?.fingerprintId || scan.userId}</p>
                        </div>
                        <p className="text-lg font-black text-slate-950">{formatTime(scan.timestamp)}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
};

export default AttendancePortal;
