"use client";
import { memo, useEffect, useRef, useState } from "react";
import { api, streamChat } from "@/lib/api";
import { useStore } from "@/lib/store";
import { buildChatContext } from "@/lib/analytics";
import Markdown from "@/components/Markdown";

type Msg = { role: "user" | "assistant"; content: string; error?: boolean };
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

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard?.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); }}
      className={`border-2 border-ink px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0_0_#0A0A0A] transition-all duration-100 hover:bg-lime active:translate-x-px active:translate-y-px active:shadow-none ${ok ? "bg-lime" : "bg-bone"}`}>
      {ok ? "Copied ✓" : "Copy"}
    </button>
  );
}

/** One chat bubble. Memoised so finished messages are not re-rendered while a new reply streams in. */
const Bubble = memo(function Bubble({ m, live, onRetry }: { m: Msg; live: boolean; onRetry?: () => void }) {
  if (m.role === "user") {
    return (
      <div className="flex animate-rise justify-end">
        <div className="max-w-[88%] whitespace-pre-wrap border-[3px] border-ink bg-lime px-4 py-3 text-[15px] font-semibold leading-7 shadow-[5px_5px_0_0_#0A0A0A] sm:px-5">{m.content}</div>
      </div>
    );
  }
  return (
    <div className="flex animate-rise gap-2 sm:gap-3">
      <Avatar />
      <div className="min-w-0 flex-1 border-[3px] border-ink bg-bone p-4 shadow-[5px_5px_0_0_#0A0A0A] sm:p-5">
        {m.error ? (
          <div className="border-[3px] border-ink bg-peach px-4 py-3 text-sm font-bold">⚠ {m.content}
            {onRetry && <button onClick={onRetry} className="ml-3 border-2 border-line px-3 py-1 text-xs">Try again</button>}
          </div>
        ) : (
          <>
            <Markdown>{m.content}</Markdown>
            {live && <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-ink align-middle" />}
            {!live && m.content && <div className="mt-4"><CopyBtn text={m.content} /></div>}
          </>
        )}
      </div>
    </div>
  );
});

export default function Agent() {
  const { d, syncing } = useStore();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [t, setT] = useState("");
  const [waiting, setWaiting] = useState(false);     // sent, first token not here yet
  const [streaming, setStreaming] = useState(false); // tokens are arriving
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const sref = useRef<Session[]>([]);
  const saveT = useRef<any>(null);
  const abort = useRef<AbortController | null>(null);
  const stick = useRef(true);                         // follow the stream only while the reader is at the bottom
  const scroller = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  const busy = waiting || streaming;

  // ---- sessions: stored in the workspace store, newest first, max 5 ----
  useEffect(() => {
    api(KEY).then((r: any) => { const s = Array.isArray(r?.value?.sessions) ? r.value.sessions.slice(0, MAX_SESSIONS) : []; sref.current = s; setSessions(s); }).catch(() => {});
  }, []);
  useEffect(() => () => abort.current?.abort(), []);
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
  const stop = () => abort.current?.abort();
  const newChat = () => { stop(); setMsgs([]); setActiveId(null); setShowList(false); };
  const openSession = (s: Session) => { stop(); setMsgs(s.messages); setActiveId(s.id); setShowList(false); stick.current = true; };
  const removeSession = (id: string) => { commit(sref.current.filter((x) => x.id !== id)); if (id === activeId) newChat(); };

  const toBottom = (smooth = false) => { const el = scroller.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" }); };
  const onScroll = () => { const el = scroller.current; if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 90; };
  useEffect(() => { if (msgs.length && stick.current) toBottom(true); }, [msgs.length, waiting]);
  useEffect(() => { const el = box.current; if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 180) + "px"; } }, [t]);

  async function send(text: string, base: Msg[] = msgs) {
    text = text.trim();
    if (!text || busy) return;
    const id = activeId ?? `${Date.now()}`;
    const history = base.filter((m) => !m.error && m.content).slice(-6).map(({ role, content }) => ({ role, content: content.slice(0, 1500) }));
    const withUser: Msg[] = [...base, { role: "user", content: text }];
    setActiveId(id); setMsgs([...withUser, { role: "assistant", content: "" }]); upsert(id, withUser);
    setT(""); setWaiting(true); stick.current = true;

    const ctl = new AbortController(); abort.current = ctl;
    const payload = { message: text, history, context: buildChatContext(d) };
    let acc = "", raf = 0;
    const flush = () => {
      raf = 0;
      setMsgs((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: acc }; return c; });
      if (stick.current) requestAnimationFrame(() => toBottom());
    };
    let failure: string | null = null;
    try {
      await streamChat(payload, { signal: ctl.signal, onToken: (tok) => { acc += tok; setWaiting(false); setStreaming(true); if (!raf) raf = requestAnimationFrame(flush); } });
    } catch (e: any) {
      if (ctl.signal.aborted) { /* user pressed Stop: keep what arrived */ }
      else if (e?.code === "no-stream") {
        try { const r = await api("/api/ai/chat", { method: "POST", body: JSON.stringify(payload), signal: ctl.signal }); acc = r.reply; } catch (e2: any) { if (!ctl.signal.aborted) failure = e2.message; }
      } else failure = e?.message || "Something went wrong";
    } finally {
      cancelAnimationFrame(raf);
      abort.current = null; setWaiting(false); setStreaming(false);
    }
    const tail: Msg = failure && !acc ? { role: "assistant", content: failure, error: true } : { role: "assistant", content: acc + (failure ? "\n\n_(reply was interrupted)_" : "") };
    const done = acc || failure ? [...withUser, tail] : withUser;   // stopped before any text: drop the empty bubble
    setMsgs(done);
    if (acc) upsert(id, done);
  }

  const retry = () => {
    const i = msgs.map((m) => m.role).lastIndexOf("user");
    if (i < 0) return;
    const text = msgs[i].content;
    const base = msgs.slice(0, i);
    setMsgs(base); send(text, base);
  };

  const noData = Object.values(d.src).every((s) => s === "none");
  const empty = msgs.length === 0;

  const SessionRow = ({ s }: { s: Session }) => (
    <li className={`flex items-stretch border-2 border-ink ${s.id === activeId ? "bg-lime" : "bg-bone"}`}>
      <button onClick={() => openSession(s)} className="min-w-0 flex-1 !border-0 !bg-transparent px-3 py-2 text-left !shadow-none">
        <div className="truncate text-sm font-bold">{s.title}</div>
        <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500">{ago(s.updated)} · {s.messages.length} msgs</div>
      </button>
      <button aria-label="Delete chat" onClick={() => removeSession(s.id)} className="shrink-0 !border-0 border-l-2 !border-l-ink !bg-transparent px-4 font-mono text-sm font-bold !shadow-none hover:!bg-peach">✕</button>
    </li>
  );

  return (
    <div className="mx-auto flex h-[calc(100dvh-12rem)] min-h-[24rem] max-w-3xl flex-col lg:h-[calc(100dvh-14.5rem)]">
      <div className="relative flex flex-wrap items-center justify-between gap-2 px-2 pb-4">
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

      <div ref={scroller} onScroll={onScroll} className="flex-1 overflow-y-auto px-2 pb-8 pt-3 [mask-image:linear-gradient(to_bottom,#000_calc(100%-28px),transparent)] [-webkit-mask-image:linear-gradient(to_bottom,#000_calc(100%-28px),transparent)]">
        <div className="flex min-h-full flex-col space-y-7">
          {empty ? (
            <div className="my-auto flex flex-col items-center pb-2 pt-10 text-center">
              <div className="relative">
                <h1 className="max-w-xl !text-4xl sm:!text-5xl">How can I help<br /><span className="hl-orange">your brand today?</span></h1>
                <div className="sticker-wrap absolute -right-6 -top-10 rotate-12 sm:-right-12 sm:-top-10 lg:-right-20">
                  <div className="sticker h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28"><span className="font-display text-base uppercase leading-none sm:text-lg">Ask<br />me!</span></div>
                </div>
              </div>
              <p className="mt-3 max-w-md text-sm font-semibold text-neutral-500">{d.profile ? <>Answers are based on your profile <b className="text-ink">@{d.profile.username}</b> ({Number(d.profile.followers_count).toLocaleString("en-IN")} followers, {d.posts.length} recent posts). </> : syncing ? "Loading your Instagram profile… " : noData ? "No data is loaded yet, so I'll say so instead of guessing. " : "I use your loaded data, labelled by source. "}I suggest; you approve.</p>
              <div className="mt-6 grid w-full gap-3 sm:grid-cols-2">
                {Q.map(([q, sub, tone], i) => (
                  <button key={q} onClick={() => send(q)} className={`brut-hover border-[3px] border-ink px-4 py-3 text-left shadow-brutsm ${tone} ${i % 2 ? "rotate-[0.6deg]" : "-rotate-[0.6deg]"}`}>
                    <div className="text-sm font-bold">{q}</div>
                    <div className="mt-1 font-mono text-[11px] font-bold text-neutral-500">{sub}</div>
                  </button>
                ))}
              </div>
              {sessions.length > 0 && !showList && (
                <div className="mt-8 w-full text-left">
                  <span className="tag">Recent chats</span>
                  <ul className="mt-3 space-y-2">{sessions.map((s) => <SessionRow key={s.id} s={s} />)}</ul>
                </div>
              )}
            </div>
          ) : msgs.map((m, i) => {
            const last = i === msgs.length - 1;
            if (last && waiting && m.role === "assistant" && !m.content) return null;   // dots shown below instead
            return <Bubble key={i} m={m} live={last && streaming && m.role === "assistant"} onRetry={last && m.error ? retry : undefined} />;
          })}
          {waiting && (
            <div className="flex items-center gap-3">
              <Avatar />
              <div className="flex gap-2">{[0, 1, 2].map((i) => <span key={i} className="h-3 w-3 animate-pulse border-2 border-ink bg-accent" style={{ animationDelay: `${i * 180}ms` }} />)}</div>
            </div>
          )}
        </div>
      </div>

      <div className="px-2 pb-1 pt-3">
        <div className="flex items-end gap-2 border-[3px] border-ink bg-bone p-2 shadow-[6px_6px_0_0_#0A0A0A] sm:gap-3">
          <textarea ref={box} rows={1} value={t} placeholder="Ask your marketing team…" enterKeyHint="send"
            onChange={(e) => setT(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(t); } }}
            className="max-h-[180px] min-w-0 flex-1 resize-none !border-0 !bg-transparent px-2 py-2.5 text-[15px] font-semibold leading-6 focus:!shadow-none focus:!translate-x-0 focus:!translate-y-0" />
          {busy ? (
            <button onClick={stop} aria-label="Stop" className="grid h-11 w-11 shrink-0 place-items-center bg-ink text-lime">
              <svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" fill="currentColor" /></svg>
            </button>
          ) : (
            <button onClick={() => send(t)} disabled={!t.trim()} aria-label="Send" className="grid h-11 w-11 shrink-0 place-items-center bg-accent text-ink">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square"><path d="M12 20V4M5 11l7-7 7 7" /></svg>
            </button>
          )}
        </div>
        <p className="mt-2 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500">AI can be wrong · verify numbers · <span className="hidden sm:inline">Enter to send, Shift+Enter for new line</span><span className="sm:hidden">tap ↑ to send</span></p>
      </div>
    </div>
  );
}
