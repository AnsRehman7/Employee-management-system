import { useCallback, useEffect, useState } from "react";
import { FiCheck, FiClock, FiEdit3, FiX } from "react-icons/fi";
import Alert from "../Alert";
import { api, formatApiError } from "../../context/api";

const fieldClass =
  "mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100";
const localDateTime = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
const statusStyle = {
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
};

const AttendanceCorrections = ({ canManage }) => {
  const [corrections, setCorrections] = useState([]);
  const [form, setForm] = useState({ direction: "in", reason: "", requestedAt: localDateTime() });
  const [review, setReview] = useState({ id: "", reviewNote: "", status: "approved" });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ message: "", type: "info" });

  const load = useCallback(async () => {
    try {
      const { corrections: nextCorrections } = await api.getAttendanceCorrections();
      setCorrections(nextCorrections || []);
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submitRequest = async (event) => {
    event.preventDefault();
    setBusy(true);
    setNotice({ message: "", type: "info" });
    try {
      const { correction } = await api.createAttendanceCorrection(form);
      setCorrections((current) => [correction, ...current]);
      setForm({ direction: "in", reason: "", requestedAt: localDateTime() });
      setNotice({ message: "Correction request submitted.", type: "success" });
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const { correction } = await api.reviewAttendanceCorrection(review.id, {
        reviewNote: review.reviewNote,
        status: review.status,
      });
      setCorrections((current) => current.map((item) => item.id === correction.id ? correction : item));
      setReview({ id: "", reviewNote: "", status: "approved" });
      setNotice({ message: `Correction ${correction.status}.`, type: "success" });
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700"><FiEdit3 /></span><div><h2 className="text-base font-bold text-slate-950">Attendance corrections</h2><p className="text-sm text-slate-500">Auditable requests for missed or incorrect attendance events.</p></div></div>
      <div className="grid items-start xl:grid-cols-[380px_minmax(0,1fr)]">
        <form className="space-y-4 border-b border-slate-200 p-5 xl:border-b-0 xl:border-r" onSubmit={submitRequest}>
          <Alert message={notice.message} type={notice.type} />
          <div className="grid grid-cols-[1fr_130px] gap-3"><label><span className="text-xs font-bold text-slate-600">Date and time</span><input className={fieldClass} name="requestedAt" onChange={(event) => setForm((current) => ({ ...current, requestedAt: event.target.value }))} required type="datetime-local" value={form.requestedAt} /></label><label><span className="text-xs font-bold text-slate-600">Event</span><select className={fieldClass} name="direction" onChange={(event) => setForm((current) => ({ ...current, direction: event.target.value }))} value={form.direction}><option value="in">Check in</option><option value="out">Check out</option></select></label></div>
          <label className="block"><span className="text-xs font-bold text-slate-600">Reason</span><textarea className="mt-2 min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100" maxLength="2000" minLength="10" onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} required value={form.reason} /></label>
          <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50" disabled={busy} type="submit"><FiClock />{busy ? "Submitting..." : "Submit correction"}</button>
        </form>
        <div className="min-w-0">
          <div className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto">
            {corrections.length ? corrections.map((correction) => (
              <article className="px-5 py-4" key={correction.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyle[correction.status]}`}>{correction.status}</span><span className="text-xs font-bold text-slate-500">{correction.direction === "in" ? "Check in" : "Check out"} / {new Date(correction.requestedAt).toLocaleString()}</span></div><p className="mt-2 text-sm font-semibold text-slate-900">{correction.requester?.name || "My request"}</p><p className="mt-1 text-sm leading-6 text-slate-600">{correction.reason}</p>{correction.reviewNote && <p className="mt-2 text-xs font-semibold text-slate-500">Review: {correction.reviewNote}</p>}</div>{canManage && correction.status === "pending" && <div className="flex shrink-0 gap-2"><button aria-label="Approve correction" className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => setReview({ id: correction.id, reviewNote: "", status: "approved" })} title="Approve" type="button"><FiCheck /></button><button aria-label="Reject correction" className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => setReview({ id: correction.id, reviewNote: "", status: "rejected" })} title="Reject" type="button"><FiX /></button></div>}</div>
                {review.id === correction.id && <form className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row" onSubmit={submitReview}><input className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-violet-400" maxLength="1000" onChange={(event) => setReview((current) => ({ ...current, reviewNote: event.target.value }))} placeholder={review.status === "rejected" ? "Reason for rejection" : "Optional review note"} required={review.status === "rejected"} value={review.reviewNote} /><button className={`h-10 rounded-lg px-4 text-sm font-bold text-white ${review.status === "approved" ? "bg-emerald-600" : "bg-rose-600"}`} disabled={busy} type="submit">Confirm {review.status}</button><button className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-600" onClick={() => setReview({ id: "", reviewNote: "", status: "approved" })} type="button">Cancel</button></form>}
              </article>
            )) : <div className="py-14 text-center"><FiCheck className="mx-auto h-7 w-7 text-emerald-500" /><p className="mt-3 text-sm font-semibold text-slate-500">No correction requests.</p></div>}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AttendanceCorrections;
