"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { buildContext } from "@/lib/analytics";
import Markdown from "@/components/Markdown";

type Msg = { role: "user" | "assistant"; content: string; error?: boolean; fresh?: boolean };
type Session = { id: string; title: string; updated: number; messages: Msg[] };

const KEY = "/api/store/chat_sessions";
const MAX_SESSIONS = 5;   // only the 5 most recent chats are kept

const Q = [
  ["What should I post today?", "A post idea with hook, caption and timing", "bg-lime"],
  ["Plan this week's content.", "A 7-day content plan", "bg-bone"],
  ["Why did my Reel fail?", "Diagnose weak performance", "bg-peach"],
  ["Give me a ₹500/day marketing strategy.", "Budget split and testing plan", "bg-bone"],
  ["Which Reel should I boost?", "Pick a post worth promoting", "bg-accent"],
  ["Should I run ads today?", "Scale, hold or stop", "bg-lime"],
];

const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "just now"; if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60); return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
};

const Avatar = () => (
  <span className="mt-0.5 grid h-9 w-9 shrink-0 -rotate-6 place-items-center border-[3px] border-ink bg-accent font-display text-lg leading-none shadow-[3px_3px_0_0_#0A0A0A]">B</span>
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
      className={`border-2 border-ink px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0_0_#0A0A0A] transition-all duration-100 hover:bg-lime active:translate-x-px active:translate-y-px active:shadow-none ${ok ? "bg-lime" : "bg-bone"}`}>
      {ok ? "Copied ✓" : "Copy"}
    </button>
  );
}

export default function Agent() {
  const { d, syncing } = useStore();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [t, setT] = useState("");
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const sref = useRef<Session[]>([]);
  const saveT = useRef<any>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);

  // ---- sessions: stored in the workspace store, newest first, max 5 ----
  useEffect(() => {
    api(KEY).then((r: any) => { const s = Array.isArray(r?.value?.sessions) ? r.value.sessions.slice(0, MAX_SESSIONS) : []; sref.current = s; setSessions(s); }).catch(() => {});
  }, []);
  const commit = (next: Session[]) => {
    sref.current = next; setSessions(next);
    clearTimeout(saveT.current);
    saveT.current = setTimeout(() => api(KEY, { method: "PUT", body: JSON.stringify({ value: { sessions: next } }) }).catch(() => {}), 500);
  };
  const upsert = (id: string, messages: Msg[]) => {
    const first = messages.find((m) => m.role === "user")?.content || "New chat";
    const s: Session = { id, title: first.slice(0, 60), updated: Date.now(), messages: messages.slice(-40).map(({ role, content, error }) => ({ role, content: content.slice(0, 8000), ...(error ? { error } : {}) })) };
    commit([s, ...sref.current.filter((x) => x.id !== id)].slice(0, MAX_SESSIONS));
  };
  const newChat = () => { setMsgs([]); setActiveId(null); setTyping(false); setShowList(false); };
  const openSession = (s: Session) => { setMsgs(s.messages.map((m) => ({ ...m, fresh: false }))); setActiveId(s.id); setTyping(false); setShowList(false); };
  const removeSession = (id: string) => { commit(sref.current.filter((x) => x.id !== id)); if (id === activeId) newChat(); };

  const toBottom = (smooth = false) => { const el = scroller.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" }); };
  useEffect(() => { if (msgs.length) toBottom(true); }, [msgs.length, busy]);
  useEffect(() => { const el = box.current; if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 180) + "px"; } }, [t]);

  async function send(text: string) {
    text = text.trim();
    if (!text || busy || typing) return;
    const id = activeId ?? `${Date.now()}`;
    const history = msgs.filter((m) => !m.error).map(({ role, content }) => ({ role, content }));
    const withUser: Msg[] = [...msgs, { role: "user", content: text }];
    setActiveId(id); setMsgs(withUser); upsert(id, withUser);
    setT(""); setBusy(true);
    try {
      const r = await api("/api/ai/chat", { method: "POST", body: JSON.stringify({ message: text, history, context: buildContext(d) }) });
      setTyping(true);
      const done: Msg[] = [...withUser, { role: "assistant", content: r.reply, fresh: true }];
      setMsgs(done); upsert(id, done);
    } catch (e: any) {
      setMsgs([...withUser, { role: "assistant", content: e.message, error: true }]);
    } finally { setBusy(false); }
  }

  const noData = Object.values(d.src).every((s) => s === "none");
  const empty = msgs.length === 0;

  const SessionRow = ({ s }: { s: Session }) => (
    <li className={`flex items-stretch border-2 border-ink ${s.id === activeId ? "bg-lime" : "bg-bone"}`}>
      <button onClick={() => openSession(s)} className="min-w-0 flex-1 !border-0 !bg-transparent px-3 py-2 text-left !shadow-none">
        <div className="truncate text-sm font-bold">{s.title}</div>
        <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500">{ago(s.updated)} · {s.messages.length} msgs</div>
      </button>
      <button aria-label="Delete chat" onClick={() => removeSession(s.id)} className="shrink-0 !border-0 border-l-2 !border-l-ink !bg-transparent px-3 font-mono text-sm font-bold !shadow-none hover:!bg-peach">✕</button>
    </li>
  );

  return (
    <div className="mx-auto flex h-[calc(100dvh-12rem)] min-h-[24rem] max-w-3xl flex-col lg:h-[calc(100dvh-14.5rem)]">
      <div className="relative flex flex-wrap items-center justify-between gap-2 pb-3">
        <div className="flex flex-wrap items-center gap-2"><span className="tag">AI Marketing Agent</span>
          {d.profile && <span className="border-2 border-ink bg-lime px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider">● Live · @{d.profile.username}</span>}</div>
        <div className="flex gap-2">
          <button onClick={() => setShowList((v) => !v)} aria-expanded={showList} className="border-2 border-line px-3 py-1 text-xs">Sessions ({sessions.length}) {showList ? "▴" : "▾"}</button>
          {!empty && <button onClick={newChat} className="border-2 border-line px-3 py-1 text-xs">+ New chat</button>}
        </div>
        {showList && (
          <div className="absolute right-0 top-full z-20 mt-1 w-[min(24rem,calc(100vw-2rem))] border-[3px] border-ink bg-paper p-3 shadow-brut">
            <div className="mb-2 flex items-center justify-between"><span className="tag">Recent chats</span><button onClick={newChat} className="border-2 border-line px-2.5 py-0.5 text-xs">+ New</button></div>
            {sessions.length === 0 ? <p className="py-3 font-mono text-xs font-bold text-neutral-500">// no saved chats yet</p>
              : <ul className="space-y-2">{sessions.map((s) => <SessionRow key={s.id} s={s} />)}</ul>}
            <p className="mt-3 font-mono text-[10px] font-bold text-neutral-500">// only your {MAX_SESSIONS} most recent chats are kept</p>
          </div>
        )}
      </div>

      <div ref={scroller} className="flex-1 overflow-y-auto pb-2 pr-2 sm:pr-3">
        <div className="flex min-h-full flex-col space-y-7">
          {empty ? (
            <div className="my-auto flex flex-col items-center pt-8 text-center">
              <div className="relative">
                <h1 className="max-w-xl">How can I help<br /><span className="hl-orange">your brand today?</span></h1>
                <div className="sticker-wrap absolute -right-6 -top-10 rotate-12 sm:-right-12 sm:-top-10 lg:-right-20">
                  <div className="sticker h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28"><span className="font-display text-base uppercase leading-none sm:text-lg">Ask<br />me!</span></div>
                </div>
              </div>
              <p className="mt-5 max-w-md text-sm font-semibold text-neutral-500">{d.profile ? <>Answers are based on your profile <b className="text-ink">@{d.profile.username}</b> ({Number(d.profile.followers_count).toLocaleString("en-IN")} followers, {d.posts.length} recent posts). </> : syncing ? "Loading your Instagram profile… " : noData ? "No data is loaded yet, so I'll say so instead of guessing. " : "I use your loaded data, labelled by source. "}I suggest; you approve.</p>
              <div className="mt-8 grid w-full gap-4 sm:grid-cols-2">
                {Q.map(([q, sub, tone], i) => (
                  <button key={q} onClick={() => send(q)} className={`brut-hover border-[3px] border-ink p-4 text-left shadow-brutsm ${tone} ${i % 2 ? "rotate-[0.6deg]" : "-rotate-[0.6deg]"}`}>
                    <div className="text-sm font-bold">{q}</div>
                    <div className="mt-1 font-mono text-[11px] font-bold text-neutral-500">{sub}</div>
                  </button>
                ))}
              </div>
              {sessions.length > 0 && (
                <div className="mt-8 w-full text-left">
                  <span className="tag">Recent chats</span>
                  <ul className="mt-3 space-y-2">{sessions.map((s) => <SessionRow key={s.id} s={s} />)}</ul>
                </div>
              )}
            </div>
          ) : msgs.map((m, i) => m.role === "user" ? (
            <div key={i} className="flex animate-rise justify-end">
              <div className="max-w-[88%] whitespace-pre-wrap border-[3px] border-ink bg-lime px-4 py-3 text-[15px] font-semibold leading-7 shadow-[5px_5px_0_0_#0A0A0A] sm:px-5">{m.content}</div>
            </div>
          ) : (
            <div key={i} className="flex animate-rise gap-2 sm:gap-3">
              <Avatar />
              <div className="min-w-0 flex-1 border-[3px] border-ink bg-bone p-4 shadow-[5px_5px_0_0_#0A0A0A] sm:p-5">
                {m.error ? <p className="border-[3px] border-ink bg-peach px-4 py-3 text-sm font-bold">⚠ {m.content}</p>
                  : m.fresh && i === msgs.length - 1 ? <Typed text={m.content} onTick={() => toBottom()} onDone={() => setTyping(false)} />
                  : <Markdown>{m.content}</Markdown>}
                {!m.error && !(m.fresh && typing && i === msgs.length - 1) && <div className="mt-4"><CopyBtn text={m.content} /></div>}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex items-center gap-3">
              <Avatar />
              <div className="flex gap-2">{[0, 1, 2].map((i) => <span key={i} className="h-3 w-3 animate-pulse border-2 border-ink bg-accent" style={{ animationDelay: `${i * 180}ms` }} />)}</div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4">
        <div className="flex items-end gap-2 border-[3px] border-ink bg-bone p-2 shadow-[6px_6px_0_0_#0A0A0A] sm:gap-3">
          <textarea ref={box} rows={1} value={t} placeholder="Ask your marketing team…"
            onChange={(e) => setT(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(t); } }}
            className="max-h-[180px] min-w-0 flex-1 resize-none !border-0 !bg-transparent px-2 py-2.5 text-[15px] font-semibold leading-6 focus:!shadow-none focus:!translate-x-0 focus:!translate-y-0" />
          <button onClick={() => send(t)} disabled={busy || typing || !t.trim()} aria-label="Send"
            className="grid h-11 w-11 shrink-0 place-items-center bg-accent text-ink">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square"><path d="M12 20V4M5 11l7-7 7 7" /></svg>
          </button>
        </div>
        <p className="mt-2 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500">AI can be wrong · verify numbers · <span className="hidden sm:inline">Enter to send, Shift+Enter for new line</span><span className="sm:hidden">tap ↑ to send</span></p>
      </div>
    </div>
  );
}
