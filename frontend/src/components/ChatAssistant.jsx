import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiAlertTriangle,
  FiCheck,
  FiCheckCircle,
  FiMessageSquare,
  FiSend,
  FiX,
  FiXCircle,
} from "react-icons/fi";
import { api, formatApiError } from "../context/api";

/**
 * Workspace assistant panel.
 *
 * Deliberately two-step: a message produces a *preview* of what would change, and nothing
 * is written until the person presses Apply. The model proposes, the human decides. That
 * is what makes it safe to let a language model drive real project and task creation.
 */

const SUGGESTIONS = [
  "Create a project called Attendance Revamp due 30 September",
  "Add 3 QA tasks to Attendance Revamp due next Friday",
  "Assign the API task to Sara",
];

const ActionRow = ({ action }) => (
  <li
    className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 text-sm ${
      action.executable
        ? "border-slate-200 bg-slate-50 text-slate-700"
        : "border-amber-200 bg-amber-50 text-amber-900"
    }`}
  >
    {action.executable ? (
      <FiCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
    ) : (
      <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
    )}
    <div className="min-w-0 flex-1">
      <p className="font-semibold">{action.description}</p>
      {action.issues?.map((issue) => (
        <p className="mt-0.5 text-xs font-medium text-amber-800" key={issue}>
          {issue}
        </p>
      ))}
    </div>
  </li>
);

const ResultRow = ({ result }) => (
  <li className="flex items-start gap-2.5 text-sm">
    {result.status === "done" ? (
      <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
    ) : (
      <FiXCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
    )}
    <div className="min-w-0 flex-1">
      <p className="font-semibold text-slate-700">{result.label}</p>
      {result.reason && <p className="mt-0.5 text-xs font-medium text-rose-700">{result.reason}</p>}
    </div>
  </li>
);

const ChatAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const region = scrollRef.current;
    if (!region) return;
    // Element.scrollTo is missing in jsdom and in some older browsers, and sticking the
    // transcript to the bottom is a convenience rather than a requirement.
    if (typeof region.scrollTo === "function") {
      region.scrollTo({ behavior: "smooth", top: region.scrollHeight });
    } else {
      region.scrollTop = region.scrollHeight;
    }
  }, [messages, busy]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const send = useCallback(
    async (text) => {
      const message = text.trim();
      if (!message || busy) return;

      setDraft("");
      setMessages((current) => [...current, { role: "user", text: message }]);
      setBusy(true);

      try {
        const result = await api.assistantInterpret(message);
        setMessages((current) => [
          ...current,
          {
            actions: result.actions || [],
            planToken: result.planToken,
            role: "assistant",
            status: result.status,
            text: result.reply,
          },
        ]);
      } catch (error) {
        setMessages((current) => [
          ...current,
          { role: "assistant", status: "error", text: formatApiError(error) },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [busy],
  );

  /** Applies a previewed plan, then marks that message as spent so it cannot be re-run. */
  const apply = useCallback(async (index, planToken) => {
    setBusy(true);
    try {
      const result = await api.assistantExecute(planToken);
      setMessages((current) =>
        current.map((message, position) =>
          position === index ? { ...message, planToken: null, status: "applied" } : message,
        ),
      );
      setMessages((current) => [
        ...current,
        { results: result.results || [], role: "assistant", status: "results", text: result.summary },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: "assistant", status: "error", text: formatApiError(error) },
      ]);
    } finally {
      setBusy(false);
    }
  }, []);

  const discard = useCallback((index) => {
    setMessages((current) =>
      current.map((message, position) =>
        position === index ? { ...message, planToken: null, status: "discarded" } : message,
      ),
    );
  }, []);

  if (!open) {
    return (
      <button
        aria-label="Open the workspace assistant"
        className="fixed bottom-6 right-6 z-[80] flex h-13 w-13 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-900/25 transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        onClick={() => setOpen(true)}
        type="button"
      >
        <FiMessageSquare className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div
      aria-label="Workspace assistant"
      aria-modal="true"
      className="fixed inset-0 z-[80] flex justify-end bg-scrim/40 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
      role="dialog"
    >
      <div className="flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl shadow-slate-950/25">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-950">Assistant</p>
            <p className="truncate text-xs font-medium text-slate-500">
              Describe a change and review it before it happens
            </p>
          </div>
          <button
            aria-label="Close the assistant"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            onClick={() => setOpen(false)}
            type="button"
          >
            <FiX className="h-4 w-4" />
          </button>
        </header>

        <div
          aria-live="polite"
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4"
          ref={scrollRef}
        >
          {!messages.length && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-500">Try one of these:</p>
              {SUGGESTIONS.map((suggestion) => (
                <button
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                  key={suggestion}
                  onClick={() => send(suggestion)}
                  type="button"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {messages.map((message, index) => {
            const key = `${message.role}-${index}`;

            if (message.role === "user") {
              return (
                <p
                  className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white"
                  key={key}
                >
                  {message.text}
                </p>
              );
            }

            return (
              <div className="space-y-2" key={key}>
                <p
                  className={`w-fit max-w-[92%] rounded-2xl rounded-bl-sm px-3.5 py-2 text-sm font-medium ${
                    message.status === "error"
                      ? "bg-rose-50 text-rose-800"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {message.text}
                </p>

                {message.actions?.length > 0 && (
                  <ul className="space-y-1.5">
                    {message.actions.map((action) => (
                      <ActionRow action={action} key={`${action.index}-${action.description}`} />
                    ))}
                  </ul>
                )}

                {message.results?.length > 0 && (
                  <ul className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                    {message.results.map((result) => (
                      <ResultRow key={result.label} result={result} />
                    ))}
                  </ul>
                )}

                {message.planToken && (
                  <div className="flex gap-2">
                    <button
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                      disabled={busy}
                      onClick={() => apply(index, message.planToken)}
                      type="button"
                    >
                      Apply changes
                    </button>
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
                      disabled={busy}
                      onClick={() => discard(index)}
                      type="button"
                    >
                      Discard
                    </button>
                  </div>
                )}

                {message.status === "discarded" && (
                  <p className="text-xs font-semibold text-slate-500">Discarded. Nothing was changed.</p>
                )}
              </div>
            );
          })}

          {busy && <p className="text-sm font-medium text-slate-500">Working…</p>}
        </div>

        <form
          className="flex shrink-0 items-end gap-2 border-t border-slate-200 px-4 py-3"
          onSubmit={(event) => {
            event.preventDefault();
            send(draft);
          }}
        >
          <textarea
            aria-label="Message the assistant"
            className="max-h-28 min-h-10 flex-1 resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-emerald-400 placeholder:text-slate-400"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send(draft);
              }
            }}
            placeholder="Create a project, add tasks, assign work…"
            ref={inputRef}
            rows={1}
            value={draft}
          />
          <button
            aria-label="Send"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:opacity-60"
            disabled={busy || !draft.trim()}
            type="submit"
          >
            <FiSend className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatAssistant;
