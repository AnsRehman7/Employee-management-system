import { useCallback, useEffect, useState } from "react";
import { FiCheck, FiClock, FiEdit3, FiX } from "react-icons/fi";
import Alert from "../Alert";
import { useToast } from "../../context/ToastContext";
import Pagination from "../Pagination";
import { PAGE_SIZE } from "../../hooks/usePagination";
import { api, formatApiError } from "../../context/api";

const fieldClass =
  "mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100";
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
  const toast = useToast();
  const [corrections, setCorrections] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({ direction: "in", reason: "", requestedAt: localDateTime() });
  const [review, setReview] = useState({ id: "", reviewNote: "", status: "approved" });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ message: "", type: "info" });

  const load = useCallback(async () => {
    try {
      const result = await api.getAttendanceCorrections({ page, pageSize: PAGE_SIZE, status: statusFilter });
      setCorrections(result.corrections || []);
      setPagination(result.pagination || null);
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
    }
  }, [page, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const submitRequest = async (event) => {
    event.preventDefault();
    setBusy(true);
    setNotice({ message: "", type: "info" });
    try {
      await api.createAttendanceCorrection(form);
      setForm({ direction: "in", reason: "", requestedAt: localDateTime() });
      toast.success("Correction submitted", "An attendance manager will review it.");
      setPage(1);
      await load();
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
      setCorrections((current) => current.map((item) => (item.id === correction.id ? correction : item)));
      setReview({ id: "", reviewNote: "", status: "approved" });
      toast.success(`Correction ${correction.status}`);
    } catch (requestError) {
      setNotice({ message: formatApiError(requestError), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <FiEdit3 className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-950">Attendance corrections</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              The sanctioned, auditable path for missed or incorrect attendance events.
            </p>
          </div>
        </div>
        <label className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Status</span>
          <select
            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            onChange={(event) => {
              setPage(1);
              setStatusFilter(event.target.value);
            }}
            value={statusFilter}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
      </div>

      <div className="grid items-start xl:grid-cols-[360px_minmax(0,1fr)]">
        <form className="space-y-4 border-b border-slate-200 p-4 xl:border-b-0 xl:border-r" onSubmit={submitRequest}>
          <Alert message={notice.message} type={notice.type} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(120px,150px)]">
            <label className="block min-w-0">
              <span className="text-xs font-bold text-slate-600">Date and time</span>
              <input
                className={fieldClass}
                name="requestedAt"
                onChange={(event) => setForm((current) => ({ ...current, requestedAt: event.target.value }))}
                required
                type="datetime-local"
                value={form.requestedAt}
              />
            </label>
            <label className="block min-w-0">
              <span className="text-xs font-bold text-slate-600">Event</span>
              <select
                className={fieldClass}
                name="direction"
                onChange={(event) => setForm((current) => ({ ...current, direction: event.target.value }))}
                value={form.direction}
              >
                <option value="in">Check in</option>
                <option value="out">Check out</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-bold text-slate-600">Reason</span>
            <textarea
              className="mt-2 min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              maxLength="2000"
              minLength="10"
              onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
              required
              value={form.reason}
            />
          </label>
          <button
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={busy}
            type="submit"
          >
            <FiClock className="h-4 w-4" />
            {busy ? "Submitting..." : "Submit correction"}
          </button>
        </form>

        <div className="min-w-0">
          {corrections.length ? (
            <>
              <div className="divide-y divide-slate-100">
                {corrections.map((correction) => (
                  <article className="px-4 py-3.5" key={correction.id}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusStyle[correction.status]}`}>
                            {correction.status}
                          </span>
                          <span className="text-xs font-bold text-slate-500">
                            {correction.direction === "in" ? "Check in" : "Check out"} /{" "}
                            {new Date(correction.requestedAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-bold text-slate-900">{correction.requester?.name || "My request"}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{correction.reason}</p>
                        {correction.reviewNote && (
                          <p className="mt-2 text-xs font-semibold text-slate-500">Review: {correction.reviewNote}</p>
                        )}
                      </div>
                      {canManage && correction.status === "pending" && (
                        <div className="flex shrink-0 gap-2">
                          <button
                            aria-label="Approve correction"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 text-emerald-700 transition hover:bg-emerald-50"
                            onClick={() => setReview({ id: correction.id, reviewNote: "", status: "approved" })}
                            title="Approve"
                            type="button"
                          >
                            <FiCheck className="h-4 w-4" />
                          </button>
                          <button
                            aria-label="Reject correction"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-700 transition hover:bg-rose-50"
                            onClick={() => setReview({ id: correction.id, reviewNote: "", status: "rejected" })}
                            title="Reject"
                            type="button"
                          >
                            <FiX className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {review.id === correction.id && (
                      <form className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row" onSubmit={submitReview}>
                        <input
                          className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-emerald-500"
                          maxLength="1000"
                          onChange={(event) => setReview((current) => ({ ...current, reviewNote: event.target.value }))}
                          placeholder={review.status === "rejected" ? "Reason for rejection" : "Optional review note"}
                          required={review.status === "rejected"}
                          value={review.reviewNote}
                        />
                        <button
                          className={`h-10 rounded-lg px-4 text-sm font-bold text-white ${review.status === "approved" ? "bg-emerald-600" : "bg-rose-600"}`}
                          disabled={busy}
                          type="submit"
                        >
                          Confirm {review.status}
                        </button>
                        <button
                          className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-600"
                          onClick={() => setReview({ id: "", reviewNote: "", status: "approved" })}
                          type="button"
                        >
                          Cancel
                        </button>
                      </form>
                    )}
                  </article>
                ))}
              </div>
              {pagination && (
                <Pagination
                  firstItem={(pagination.page - 1) * pagination.pageSize + 1}
                  itemLabel="corrections"
                  lastItem={Math.min(pagination.page * pagination.pageSize, pagination.total)}
                  onPageChange={setPage}
                  page={pagination.page}
                  total={pagination.total}
                  totalPages={pagination.totalPages}
                />
              )}
            </>
          ) : (
            <div className="py-14 text-center">
              <FiCheck className="mx-auto h-7 w-7 text-emerald-500" />
              <p className="mt-3 text-sm font-semibold text-slate-500">No correction requests.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AttendanceCorrections;
