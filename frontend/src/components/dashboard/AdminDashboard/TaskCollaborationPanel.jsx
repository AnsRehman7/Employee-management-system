import { useCallback, useEffect, useState } from "react";
import { FiBell, FiBellOff, FiLink, FiMessageSquare, FiPaperclip, FiSend } from "react-icons/fi";
import Alert from "../../Alert";
import { api, formatApiError } from "../../../context/api";
import { formatDateTime, initialsFor } from "./workUtils";

const fieldClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100";

const TaskCollaborationPanel = ({ canContribute, currentUserId, members, task }) => {
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [comment, setComment] = useState({ body: "", mentionId: "" });
  const [attachment, setAttachment] = useState({ name: "", url: "" });
  const [watching, setWatching] = useState(task.watcherIds?.includes(currentUserId));
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [{ comments: nextComments }, { attachments: nextAttachments }] = await Promise.all([
        api.getTaskComments(task.id),
        api.getTaskAttachments(task.id),
      ]);
      setComments(nextComments || []);
      setAttachments(nextAttachments || []);
      setError("");
    } catch (requestError) {
      setError(formatApiError(requestError));
    }
  }, [task.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => setWatching(task.watcherIds?.includes(currentUserId)), [currentUserId, task.watcherIds]);

  const toggleWatching = async () => {
    setBusy("watch");
    try {
      const result = await api.setTaskWatching(task.id, !watching);
      setWatching(result.watching);
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      setBusy("");
    }
  };

  const submitComment = async (event) => {
    event.preventDefault();
    setBusy("comment");
    try {
      const { comment: created } = await api.createTaskComment(task.id, {
        body: comment.body,
        mentions: comment.mentionId ? [comment.mentionId] : [],
      });
      setComments((current) => [...current, created]);
      setComment({ body: "", mentionId: "" });
      setError("");
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      setBusy("");
    }
  };

  const submitAttachment = async (event) => {
    event.preventDefault();
    setBusy("attachment");
    try {
      const { attachment: created } = await api.createTaskAttachment(task.id, attachment);
      setAttachments((current) => [created, ...current]);
      setAttachment({ name: "", url: "" });
      setError("");
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      setBusy("");
    }
  };

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700"><FiMessageSquare /></span><div><h2 className="text-base font-bold text-slate-950">Discussion and files</h2><p className="text-sm text-slate-500">Decisions, handoffs, and supporting links in one record.</p></div></div>
        <button className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-bold ${watching ? "border-violet-200 bg-violet-50 text-violet-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`} disabled={busy === "watch"} onClick={toggleWatching} type="button">{watching ? <FiBell /> : <FiBellOff />}{watching ? "Watching" : "Watch task"}</button>
      </div>
      {error && <div className="px-5 pt-4"><Alert message={error} type="error" /></div>}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div className="max-h-[430px] divide-y divide-slate-100 overflow-y-auto">
            {comments.length ? comments.map((item) => <article className="flex gap-3 px-5 py-4" key={item.id}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-100 text-[10px] font-bold text-cyan-800">{initialsFor(item.author.name)}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2"><p className="text-sm font-bold text-slate-900">{item.author.name}</p><span className="text-xs text-slate-400">{formatDateTime(item.createdAt)}</span></div><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.body}</p></div></article>) : <div className="px-5 py-12 text-center"><FiMessageSquare className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-500">No discussion yet.</p></div>}
          </div>
          {canContribute && <form className="space-y-3 border-t border-slate-200 p-4" onSubmit={submitComment}><textarea className="min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-6 outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100" maxLength="5000" onChange={(event) => setComment((current) => ({ ...current, body: event.target.value }))} placeholder="Add a delivery update or decision" required value={comment.body} /><div className="flex flex-col gap-2 sm:flex-row"><select aria-label="Mention team member" className={`${fieldClass} flex-1`} onChange={(event) => setComment((current) => ({ ...current, mentionId: event.target.value }))} value={comment.mentionId}><option value="">No mention</option>{members.filter((member) => member.id !== currentUserId).map((member) => <option key={member.id} value={member.id}>Mention {member.name}</option>)}</select><button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50" disabled={busy === "comment"} type="submit"><FiSend />Comment</button></div></form>}
        </div>
        <aside>
          <div className="border-b border-slate-200 px-4 py-3"><h3 className="text-sm font-bold text-slate-900">Attachments</h3></div>
          <div className="max-h-60 divide-y divide-slate-100 overflow-y-auto">{attachments.length ? attachments.map((item) => <a className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-violet-700" href={item.url} key={item.id} rel="noreferrer" target="_blank"><FiPaperclip className="shrink-0" /><span className="min-w-0 flex-1 truncate">{item.name}</span><FiLink className="shrink-0 text-slate-400" /></a>) : <p className="px-4 py-8 text-center text-sm text-slate-400">No attachments</p>}</div>
          {canContribute && <form className="space-y-3 border-t border-slate-200 p-4" onSubmit={submitAttachment}><input className={fieldClass} maxLength="255" onChange={(event) => setAttachment((current) => ({ ...current, name: event.target.value }))} placeholder="Link name" required value={attachment.name} /><input className={fieldClass} maxLength="2048" onChange={(event) => setAttachment((current) => ({ ...current, url: event.target.value }))} placeholder="https://..." required type="url" value={attachment.url} /><button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50" disabled={busy === "attachment"} type="submit"><FiLink />Attach link</button></form>}
        </aside>
      </div>
    </section>
  );
};

export default TaskCollaborationPanel;
