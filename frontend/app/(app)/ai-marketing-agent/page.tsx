"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { buildContext } from "@/lib/analytics";
import Markdown from "@/components/Markdown";

type Msg = { role: "user" | "assistant"; content: string; error?: boolean; fresh?: boolean };

const Q = [
  ["What should I post today?", "A post idea with hook, caption and timing"],
  ["Plan this week's content.", "A 7-day content plan"],
  ["Why did my Reel fail?", "Diagnose weak performance"],
  ["Give me a ₹500/day marketing strategy.", "Budget split and testing plan"],
  ["Which Reel should I boost?", "Pick a post worth promoting"],
  ["Should I run ads today?", "Scale, hold or stop"],
];

const Avatar = () => (
  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-violet text-xs font-black text-ink">B</span>
);

/** Reveals the reply progressively, like a streamed answer. */
function Typed({ text, onTick, onDone }: { text: string; onTick: () => void; onDone: () => void }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= text.length) { onDone(); return; }
    const step = Math.max(3, Math.ceil(text.length / 160));
    const id = setTimeout(() => { setN((x) => Math.min(text.length, x + step)); onTick(); }, 14);
    return () => clearTimeout(id);
  }, [n, text]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Markdown>{text.slice(0, n)}</Markdown>;
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard?.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); }}
      className="rounded-full px-3 py-1 text-[11px] text-neutral-500 transition-colors duration-500 hover:bg-white/[0.06] hover:text-neutral-200">
      {ok ? "Copied" : "Copy"}
    </button>
  );
}

export default function Agent() {
  const { d } = useStore();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [t, setT] = useState("");
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);

  const toBottom = (smooth = false) => { const el = scroller.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" }); };
  useEffect(() => { toBottom(true); }, [msgs.length, busy]);
  useEffect(() => { const el = box.current; if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 180) + "px"; } }, [t]);

  async function send(text: string) {
    text = text.trim();
    if (!text || busy || typing) return;
    const history = msgs.filter((m) => !m.error).map(({ role, content }) => ({ role, content }));
    setMsgs((m) => [...m, { role: "user", content: text }]);
    setT(""); setBusy(true);
    try {
      const r = await api("/api/ai/chat", { method: "POST", body: JSON.stringify({ message: text, history, context: buildContext(d) }) });
      setTyping(true);
      setMsgs((m) => [...m, { role: "assistant", content: r.reply, fresh: true }]);
    } catch (e: any) {
      setMsgs((m) => [...m, { role: "assistant", content: e.message, error: true }]);
    } finally { setBusy(false); }
  }

  const noData = Object.values(d.src).every((s) => s === "none");
  const empty = msgs.length === 0;

  return (
    <div className="mx-auto flex h-[calc(100dvh-13rem)] min-h-[24rem] max-w-3xl flex-col md:h-[calc(100dvh-12.5rem)]">
      <div className="flex items-center justify-between pb-3">
        <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">AI Marketing Agent</div>
        {!empty && <button onClick={() => { setMsgs([]); setTyping(false); }} className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-400 transition-colors duration-500 hover:bg-white/[0.06] hover:text-white">New chat</button>}
      </div>

      <div ref={scroller} className="flex-1 space-y-7 overflow-y-auto pr-2">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-accent to-violet text-xl font-black text-ink shadow-glow">B</span>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight md:text-4xl">How can I help your brand today?</h1>
            <p className="mt-2 max-w-md text-sm text-neutral-500">{noData ? "No data is loaded yet, so I'll say so instead of guessing. " : "I use your loaded data, labelled by source. "}I suggest; you approve.</p>
            <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
              {Q.map(([q, sub]) => (
                <button key={q} onClick={() => send(q)} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all duration-700 ease-fluid hover:-translate-y-0.5 hover:bg-white/[0.06] active:scale-[0.98]">
                  <div className="text-sm font-medium text-neutral-100">{q}</div>
                  <div className="mt-1 text-xs text-neutral-500">{sub}</div>
                </button>
              ))}
            </div>
          </div>
        ) : msgs.map((m, i) => m.role === "user" ? (
          <div key={i} className="flex justify-end animate-rise">
            <div className="max-w-[85%] whitespace-pre-wrap rounded-3xl bg-white/[0.08] px-5 py-3 text-[15px] leading-7">{m.content}</div>
          </div>
        ) : (
          <div key={i} className="flex gap-4 animate-rise">
            <Avatar />
            <div className="min-w-0 flex-1">
              {m.error ? <p className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{m.content}</p>
                : m.fresh && i === msgs.length - 1 ? <Typed text={m.content} onTick={() => toBottom()} onDone={() => setTyping(false)} />
                : <Markdown>{m.content}</Markdown>}
              {!m.error && !(m.fresh && typing && i === msgs.length - 1) && <div className="mt-2 -ml-3"><CopyBtn text={m.content} /></div>}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-4">
            <Avatar />
            <div className="flex gap-1.5">{[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-pulse rounded-full bg-neutral-500" style={{ animationDelay: `${i * 180}ms` }} />)}</div>
          </div>
        )}
      </div>

      <div className="pt-4">
        <div className="flex items-end gap-2 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-2 pl-5 shadow-core transition-colors duration-500 focus-within:border-accent/40">
          <textarea ref={box} rows={1} value={t} placeholder="Ask your marketing team…"
            onChange={(e) => setT(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(t); } }}
            className="max-h-[180px] flex-1 resize-none !rounded-none !border-0 !bg-transparent py-2.5 text-[15px] leading-6 text-white placeholder:text-neutral-600 focus:!shadow-none" />
          <button onClick={() => send(t)} disabled={busy || typing || !t.trim()} aria-label="Send"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-ink transition-all duration-500 ease-fluid hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-30">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-neutral-600">AI can be wrong. Verify numbers before acting. Enter to send, Shift+Enter for a new line.</p>
      </div>
    </div>
  );
}
