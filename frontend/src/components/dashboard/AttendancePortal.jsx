import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiClock,
  FiLogIn,
  FiLogOut,
  FiRefreshCw,
  FiShield,
  FiSliders,
  FiUserCheck,
} from "react-icons/fi";
import AppShell from "../AppShell";
import Alert from "../Alert";
import CustomFieldsForm from "../CustomFieldsForm";
import AttendanceCorrections from "./AttendanceCorrections";
import { api, formatApiError } from "../../context/api";
import { useUser } from "../../context/UserContext";

const toLocalDateInput = (date = new Date()) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const minutesFromTime = (time = "00:00") => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const combineDateTime = (date, time) => `${date}T${time}:00`;

const getCurrentLocation = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) {
    reject(new Error("This browser cannot access device location."));
    return;
  }
  navigator.geolocation.getCurrentPosition(resolve, (error) => {
    const messages = {
      1: "Location permission is required for verified attendance.",
      2: "Your device could not determine a location. Turn on Location Services and try again.",
      3: "Location verification timed out. Move near a window or outdoors and try again.",
    };
    reject(new Error(messages[error.code] || "Location verification failed."));
  }, { enableHighAccuracy: true, maximumAge: 0, timeout: 30_000 });
});

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

const toSourceLabel = (source = "") =>
  source
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ") || "Fingerprint";

const mapApiScan = (scan) => ({
  accepted: scan.accepted !== false,
  accuracyMeters: scan.accuracyMeters,
  direction: scan.direction,
  distanceMeters: scan.distanceMeters,
  id: scan.id,
  rejectionReason: scan.rejectionReason || "",
  source: toSourceLabel(scan.source),
  timestamp: scan.scannedAt,
  user: scan.user || null,
  userId: scan.userId,
});

const formatDistance = (meters) => {
  if (!Number.isFinite(Number(meters))) return "";
  if (Number(meters) >= 1000) return `${(Number(meters) / 1000).toFixed(2)} km`;
  return `${Math.round(Number(meters))} m`;
};

const statusStyles = {
  absent: "bg-slate-200 text-slate-700",
  checked_out: "bg-emerald-100 text-emerald-800",
  in_office: "bg-sky-100 text-sky-700",
  late: "bg-amber-100 text-amber-800",
};

const directionStyles = {
  in: "bg-emerald-100 text-emerald-800",
  out: "bg-slate-200 text-slate-700",
};

const acceptanceStyles = {
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-700",
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
  const { user } = useUser();
  const today = useMemo(() => toLocalDateInput(), []);
  const [date, setDate] = useState(today);
  const [loadingRoster, setLoadingRoster] = useState(true);
  const [loadingScans, setLoadingScans] = useState(false);
  const [notice, setNotice] = useState({ message: "", type: "info" });
  const [roster, setRoster] = useState([]);
  const [savingScan, setSavingScan] = useState(false);
  const [scans, setScans] = useState([]);
  const [moduleDefinition, setModuleDefinition] = useState(null);
  const [schedule, setSchedule] = useState({
    checkInGraceMinutes: 60,
    checkoutEnd: "18:00",
    checkoutStart: "16:00",
    officeEnd: "17:00",
    officeStart: "08:00",
  });
  const [scanForm, setScanForm] = useState({
    customFields: {},
    direction: "in",
    scanTime: "08:10",
    source: "Door fingerprint",
    userId: "",
  });
  const canViewAllAttendance = ["super_admin", "admin", "hr", "accounts"].includes(user?.role);
  const canManageAttendance = ["super_admin", "admin", "hr"].includes(user?.role);
  const canRecordAttendance = canManageAttendance || !canViewAllAttendance;
  const fieldVisible = (key) =>
    !moduleDefinition?.fields.find((field) => field.systemFieldKey === key)?.archived &&
    moduleDefinition?.fields.find((field) => field.systemFieldKey === key)?.isVisible !== false;
  const fieldRequired = (key) =>
    Boolean(moduleDefinition?.fields.find((field) => field.systemFieldKey === key)?.isRequired);

  useEffect(() => {
    let active = true;
    api
      .getCustomModule("attendance")
      .then(({ module }) => {
        if (active) setModuleDefinition(module);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const currentUserRoster = useMemo(
    () => [
      {
        department: user?.department || "Team",
        designation: user?.designation || user?.role || "Team member",
        fingerprintId: "MY-ATTENDANCE",
        id: user?.id || "",
        name: user?.name || "My attendance",
        role: user?.role || "employee",
      },
    ],
    [user]
  );

  const loadRoster = useCallback(async () => {
    setLoadingRoster(true);

    if (!canViewAllAttendance) {
      setRoster(currentUserRoster);
      setScanForm((current) => ({ ...current, userId: currentUserRoster[0].id }));
      setNotice({ message: "", type: "info" });
      setLoadingRoster(false);
      return;
    }

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
      }
      setNotice({ message: "", type: "info" });
    } catch (error) {
      setRoster([]);
      setNotice({
        message: `The attendance roster could not be loaded. ${formatApiError(error)}`,
        type: "error",
      });
    } finally {
      setLoadingRoster(false);
    }
  }, [canViewAllAttendance, currentUserRoster]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  const loadScans = useCallback(async () => {
    setLoadingScans(true);

    try {
      const { scans: apiScans = [] } = await api.getAttendanceScans(date);
      setScans(apiScans.map(mapApiScan));
    } catch (error) {
      setScans([]);
      setNotice({
        message: `Attendance records could not be loaded. ${formatApiError(error)}`,
        type: "error",
      });
    } finally {
      setLoadingScans(false);
    }
  }, [date]);

  useEffect(() => {
    loadScans();
  }, [loadScans]);

  const dayScans = useMemo(
    () => scans.filter((scan) => getScanDay(scan) === date).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
    [date, scans]
  );

  const acceptedDayScans = useMemo(() => dayScans.filter((scan) => scan.accepted !== false), [dayScans]);

  const attendanceRows = useMemo(
    () => roster.map((member) => buildAttendanceRow(member, acceptedDayScans, schedule)),
    [acceptedDayScans, roster, schedule]
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

  const handleAddScan = async (event) => {
    event.preventDefault();
    const member = roster.find((item) => item.id === scanForm.userId);
    if (!member) return;

    setSavingScan(true);

    try {
      let payload;
      if (canManageAttendance) {
        payload = {
          customFields: scanForm.customFields,
          direction: scanForm.direction,
          scannedAt: combineDateTime(date, scanForm.scanTime),
          source: scanForm.source,
          userId: scanForm.userId,
        };
      } else {
        const [{ challenge }, position] = await Promise.all([
          api.createAttendanceChallenge(),
          getCurrentLocation(),
        ]);
        payload = {
          accuracyMeters: position.coords.accuracy,
          challengeToken: challenge.token,
          customFields: scanForm.customFields,
          direction: scanForm.direction,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      }
      const { scan } = await api.createAttendanceScan(payload);
      const mappedScan = mapApiScan(scan);

      setScans((current) => [...current.filter((item) => item.id !== mappedScan.id), mappedScan]);
      setScanForm((current) => ({ ...current, customFields: {} }));
      setNotice({
        message:
          mappedScan.accepted === false
            ? `${member.name}'s scan was recorded for audit but rejected. ${mappedScan.rejectionReason}`
            : `${member.name} ${scanForm.direction === "in" ? "entry" : "exit"} recorded at ${formatTime(mappedScan.timestamp)}.`,
        type: mappedScan.accepted === false ? "error" : "success",
      });
    } catch (error) {
      setNotice({
        message: `Scan was not saved. ${formatApiError(error)}`,
        type: "error",
      });
    } finally {
      setSavingScan(false);
    }
  };

  return (
    <AppShell
        title="Attendance portal"
        subtitle="Review verified attendance, exceptions, and total working time."
      >
      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <section className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start gap-3 border-b border-slate-200 pb-5">
              <span className="rounded-lg bg-emerald-100 p-3 text-emerald-800">
                <FiSliders className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Attendance rules</h2>
                <p className="mt-1 text-sm text-slate-500">
                  First scan is check-in. Latest exit scan inside checkout window is checkout.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Alert message={notice.message} type={notice.type} />
              {loadingScans && <p className="text-sm font-semibold text-slate-500">Refreshing attendance scans...</p>}

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Attendance date</span>
                <input
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                  onChange={(event) => setDate(event.target.value)}
                  type="date"
                  value={date}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Office start</span>
                  <input
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                    name="officeStart"
                    onChange={handleScheduleChange}
                    type="time"
                    value={schedule.officeStart}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Grace minutes</span>
                  <input
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
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
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                    name="officeEnd"
                    onChange={handleScheduleChange}
                    type="time"
                    value={schedule.officeEnd}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Checkout from</span>
                  <input
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                    name="checkoutStart"
                    onChange={handleScheduleChange}
                    type="time"
                    value={schedule.checkoutStart}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Checkout until</span>
                  <input
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                    name="checkoutEnd"
                    onChange={handleScheduleChange}
                    type="time"
                    value={schedule.checkoutEnd}
                  />
                </label>
              </div>
            </div>
          </section>

          {canRecordAttendance ? (
            <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleAddScan}>
              <div className="mb-5 flex items-start gap-3 border-b border-slate-200 pb-5">
                <span className="rounded-lg bg-emerald-700 p-3 text-white">
                  <FiShield className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-slate-950">{canManageAttendance ? "Manual attendance entry" : "Verified attendance"}</h2>
                  <p className="mt-1 text-sm text-slate-500">{canManageAttendance ? "Record an authorized attendance event for a workspace member." : "Check in or out using your current office location."}</p>
                </div>
              </div>

            <div className="space-y-4">
              {canManageAttendance && <label className="block">
                <span className="text-sm font-semibold text-slate-700">Team member</span>
                <select
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
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
              </label>}

              <div className="grid gap-4 sm:grid-cols-2">
                {canManageAttendance && <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Scan time</span>
                  <input
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                    name="scanTime"
                    onChange={handleScanFormChange}
                    required
                    type="time"
                    value={scanForm.scanTime}
                  />
                </label>}

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Scan direction</span>
                  <select
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                    name="direction"
                    onChange={handleScanFormChange}
                    value={scanForm.direction}
                  >
                    <option value="in">Entry scan</option>
                    <option value="out">Exit scan</option>
                  </select>
                </label>
              </div>

              {canManageAttendance && fieldVisible("source") && <label className="block">
                <span className="text-sm font-semibold text-slate-700">Source</span>
                <select
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                  name="source"
                  onChange={handleScanFormChange}
                  required={fieldRequired("source")}
                  value={scanForm.source}
                >
                  <option value="Door fingerprint">Door fingerprint</option>
                  <option value="Mobile fingerprint">Mobile fingerprint</option>
                  <option value="Manual admin correction">Manual admin correction</option>
                </select>
              </label>}

              <CustomFieldsForm
                embedded
                fields={moduleDefinition?.fields}
                members={roster}
                onChange={(customFields) => setScanForm((current) => ({ ...current, customFields }))}
                title="Attendance details"
                values={scanForm.customFields}
              />

              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={loadingRoster || savingScan}
                type="submit"
              >
                {scanForm.direction === "in" ? <FiLogIn className="h-4 w-4" /> : <FiLogOut className="h-4 w-4" />}
                {savingScan ? (canManageAttendance ? "Saving..." : "Verifying location...") : scanForm.direction === "in" ? "Check in" : "Check out"}
              </button>

              <div>
                <button
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                  disabled={loadingScans}
                  onClick={loadScans}
                  type="button"
                >
                  <FiRefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
            </div>
            </form>
          ) : (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="rounded-lg bg-emerald-50 p-3 text-emerald-800">
                  <FiShield className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-2xl font-bold text-slate-950">Attendance review</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Accounts can review organization attendance. Recording scans is available to admins and HR.
                  </p>
                </div>
              </div>
            </section>
          )}
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
                    <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
                  </div>
                  <span className="rounded-lg bg-slate-100 p-3 text-slate-700">{icon}</span>
                </div>
              </article>
            ))}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 border-b border-slate-200 pb-5">
              <h2 className="text-2xl font-bold text-slate-950">Daily attendance</h2>
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
                        <p className="font-bold text-slate-950">{row.member.name}</p>
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
                        <p className="font-bold text-slate-950">{formatDuration(row.netMinutes)}</p>
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
              <h2 className="text-2xl font-bold text-slate-950">Scan timeline</h2>
              <p className="mt-1 text-sm text-slate-500">Every accepted and rejected event is retained with its verification source.</p>
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
                  const scanUser = member || scan.user || {};
                  const acceptedKey = scan.accepted === false ? "rejected" : "accepted";

                  return (
                    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={scan.id}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${directionStyles[scan.direction] || directionStyles.in}`}>
                              {scan.direction === "in" ? "Entry" : "Exit"}
                            </span>
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${acceptanceStyles[acceptedKey]}`}>
                              {scan.accepted === false ? "Rejected" : "Accepted"}
                            </span>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                              {scan.source}
                            </span>
                            {formatDistance(scan.distanceMeters) && (
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                                {formatDistance(scan.distanceMeters)} from office
                              </span>
                            )}
                          </div>
                          <p className="mt-3 text-base font-bold text-slate-950">{scanUser.name || "Unknown staff"}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {member?.fingerprintId || scanUser.designation || scan.userId}
                          </p>
                          {scan.rejectionReason && <p className="mt-2 text-sm font-semibold text-rose-700">{scan.rejectionReason}</p>}
                        </div>
                        <p className="text-lg font-bold text-slate-950">{formatTime(scan.timestamp)}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </div>
      <div className="mt-6"><AttendanceCorrections canManage={canManageAttendance} /></div>
    </AppShell>
  );
};

export default AttendancePortal;
