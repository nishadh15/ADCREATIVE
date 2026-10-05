"use client";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { buildContext } from "@/lib/analytics";
const Q = ["What should I post today?", "Plan this week's content.", "Why did my Reel fail?", "What product should I promote?", "Give me a ₹500/day marketing strategy.", "Which Reel should I boost?", "Should I run ads today?", "How can I increase sales?"];
export default function Agent() {
  const { d } = useStore(); const [msgs, setMsgs] = useState<any[]>([]); const [t, setT] = useState(""); const [busy, setBusy] = useState(false); const end = useRef<any>(null);
  async function send(text: string) {
    if (!text.trim() || busy) return; const h = [...msgs]; setMsgs([...h, { role: "user", content: text }]); setT(""); setBusy(true);
    try { const r = await api("/api/ai/chat", { method: "POST", body: JSON.stringify({ message: text, history: h, context: buildContext(d) }) }); setMsgs((m) => [...m, { role: "assistant", content: r.reply }]); }
    catch (e: any) { setMsgs((m) => [...m, { role: "assistant", content: "⚠ " + e.message }]); } finally { setBusy(false); setTimeout(() => end.current?.scrollIntoView({ behavior: "smooth" }), 50); }
  }
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div><h1 className="text-2xl font-bold">AI Marketing Agent</h1><p className="text-sm text-neutral-400">Ask anything. Answers use your loaded data ({Object.values(d.src).every((s) => s === "none") ? "none loaded yet, so it will say so" : "labelled by source"}). It suggests; you approve.</p></div>
      {msgs.length === 0 && <div className="flex flex-wrap gap-2">{Q.map((q) => <button key={q} onClick={() => send(q)} className="rounded-full border border-line px-3 py-1.5 text-xs hover:bg-white/5">{q}</button>)}</div>}
      <div className="space-y-3">{msgs.map((m, i) => <div key={i} className={`whitespace-pre-wrap rounded-xl p-4 text-sm ${m.role === "user" ? "ml-10 bg-accent/15" : "mr-10 border border-line bg-panel"}`}>{m.content}</div>)}{busy && <div className="text-xs text-neutral-500">Thinking…</div>}<div ref={end} /></div>
      <div className="flex gap-2"><input className="flex-1 rounded-lg border border-line bg-ink px-3 py-2 text-sm" value={t} placeholder="Ask your marketing team…" onChange={(e) => setT(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(t)} /><button onClick={() => send(t)} disabled={busy} className="rounded-lg bg-accent px-5 text-sm font-semibold text-ink disabled:opacity-50">Send</button></div>
    </div>
  );
}
