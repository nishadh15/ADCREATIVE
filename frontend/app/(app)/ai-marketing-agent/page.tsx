"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { buildContext } from "@/lib/analytics";
import Markdown from "@/components/Markdown";

type Msg = { role: "user" | "assistant"; content: string; error?: boolean; fresh?: boolean };

const Q = [
  ["What should I post today?", "A post idea with hook, caption and timing", "bg-lime"],
  ["Plan this week's content.", "A 7-day content plan", "bg-bone"],
  ["Why did my Reel fail?", "Diagnose weak performance", "bg-peach"],
  ["Give me a ₹500/day marketing strategy.", "Budget split and testing plan", "bg-bone"],
  ["Which Reel should I boost?", "Pick a post worth promoting", "bg-accent"],
  ["Should I run ads today?", "Scale, hold or stop", "bg-lime"],
];

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
        <div className="flex items-center gap-3"><span className="tag">AI Marketing Agent</span>
          {d.profile && <span className="border-2 border-ink bg-lime px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider">● Live · @{d.profile.username}</span>}</div>
        {!empty && <button onClick={() => { setMsgs([]); setTyping(false); }} className="border-2 border-line px-3 py-1 text-xs">New chat</button>}
      </div>

      <div ref={scroller} className="flex-1 space-y-7 overflow-y-auto pb-2 pr-3">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="relative">
              <h1 className="max-w-xl">How can I help<br /><span className="hl-orange">your brand today?</span></h1>
              <div className="sticker-wrap absolute -right-10 -top-8 rotate-12 md:-right-20 md:-top-10">
                <div className="sticker h-24 w-24 md:h-28 md:w-28"><span className="font-display text-lg uppercase leading-none">Ask<br />me!</span></div>
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
          </div>
        ) : msgs.map((m, i) => m.role === "user" ? (
          <div key={i} className="flex animate-rise justify-end">
            <div className="max-w-[85%] whitespace-pre-wrap border-[3px] border-ink bg-lime px-5 py-3 text-[15px] font-semibold leading-7 shadow-[5px_5px_0_0_#0A0A0A]">{m.content}</div>
          </div>
        ) : (
          <div key={i} className="flex animate-rise gap-3">
            <Avatar />
            <div className="min-w-0 flex-1 border-[3px] border-ink bg-bone p-5 shadow-[5px_5px_0_0_#0A0A0A]">
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

      <div className="pt-4">
        <div className="flex items-end gap-3 border-[3px] border-ink bg-bone p-2 shadow-[6px_6px_0_0_#0A0A0A]">
          <textarea ref={box} rows={1} value={t} placeholder="Ask your marketing team…"
            onChange={(e) => setT(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(t); } }}
            className="max-h-[180px] flex-1 resize-none !border-0 !bg-transparent px-2 py-2.5 text-[15px] font-semibold leading-6 focus:!shadow-none focus:!translate-x-0 focus:!translate-y-0" />
          <button onClick={() => send(t)} disabled={busy || typing || !t.trim()} aria-label="Send"
            className="grid h-11 w-11 shrink-0 place-items-center bg-accent text-ink">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square"><path d="M12 20V4M5 11l7-7 7 7" /></svg>
          </button>
        </div>
        <p className="mt-2 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500">AI can be wrong · verify numbers · Enter to send, Shift+Enter for new line</p>
      </div>
    </div>
  );
}
