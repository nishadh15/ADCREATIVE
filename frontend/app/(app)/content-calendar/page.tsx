"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { buildContext } from "@/lib/analytics";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
export default function Calendar() {
  const { d, update, queueAction } = useStore(); const [days, setDays] = useState(7); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [del, setDel] = useState<any>(null); const [open, setOpen] = useState<any>(null);
  const cal: any[] = d.calendar;
  const dates = Array.from(new Set([...Array.from({ length: days }, (_, i) => { const x = new Date(); x.setDate(x.getDate() + i); return x.toISOString().slice(0, 10); }), ...cal.map((c) => c.date)])).sort();
  async function gen() { setBusy(true); setErr(""); try { const r = await api("/api/ai/run", { method: "POST", body: JSON.stringify({ module: "content_calendar", input: { start_date: new Date().toISOString().slice(0, 10), days }, context: buildContext(d) }) });
    update((o: any) => ({ calendar: [...o.calendar, ...(r.result.items || []).map((x: any, i: number) => ({ ...x, id: Date.now() + i, source: "ai" }))] })); } catch (e: any) { setErr(e.message); } finally { setBusy(false); } }
  const move = (id: number, date: string) => update((o: any) => ({ calendar: o.calendar.map((c: any) => (c.id === id ? { ...c, date } : c)) }));
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Content Calendar</h1><p className="text-sm text-neutral-400">Drag a card to another day to reschedule. Items are drafts: nothing is published from here.</p></div>
      <div className="flex items-center gap-3"><select className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" value={days} onChange={(e) => setDays(+e.target.value)}>{[7, 14, 30].map((n) => <option key={n} value={n}>{n} days</option>)}</select>
        <button onClick={gen} disabled={busy} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50">{busy ? "Planning…" : `Generate ${days}-day plan`}</button><Badge kind="ai" /></div>
      {err && <p className="text-sm text-red-300">{err}</p>}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{dates.map((dt) => (
        <div key={dt} onDragOver={(e) => e.preventDefault()} onDrop={(e) => move(+e.dataTransfer.getData("id"), dt)} className="min-h-[120px] rounded-xl border border-line bg-panel p-3">
          <div className="mb-2 text-xs font-semibold text-neutral-400">{new Date(dt).toDateString()}</div>
          {cal.filter((c) => c.date === dt).sort((a, b) => (a.time || "").localeCompare(b.time || "")).map((c) => (
            <div key={c.id} draggable onDragStart={(e) => e.dataTransfer.setData("id", String(c.id))} onClick={() => setOpen(c)} className="mb-2 cursor-grab rounded-lg border border-line bg-ink p-2 text-xs">
              <div className="flex justify-between"><b className="text-accent">{c.time} · {c.content_type}</b><span className="text-neutral-500">{c.objective}</span></div><div className="mt-1 text-neutral-300">{c.hook || c.idea}</div></div>))}</div>))}</div>
      {open && (<div className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4" onClick={() => setOpen(null)}><div className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-2xl border border-line bg-panel p-6 text-sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold">{open.content_type} · {open.date} {open.time}</h3>
        {["product", "hook", "idea", "caption", "cta", "audio", "objective", "ad_potential"].map((k) => <p key={k} className="mt-2"><span className="text-[11px] uppercase text-accent">{k.replace("_", " ")}</span><br />{open[k] || "—"}</p>)}
        <p className="mt-2 text-neutral-400">{(open.hashtags || []).join(" ")}</p>
        <div className="mt-4 flex gap-2"><button className="rounded-lg border border-accent px-3 py-1.5 text-xs text-accent" onClick={() => { queueAction({ action: "schedule_post", what_will_happen: `Schedule ${open.content_type} on Instagram`, cost: 0, target: "Instagram feed/Reels", schedule: `${open.date} ${open.time}`, content: open }); setOpen(null); }}>Send to approval queue</button>
          <button className="rounded-lg border border-line px-3 py-1.5 text-xs text-red-300" onClick={() => { setDel(open); setOpen(null); }}>Delete</button></div></div></div>)}
      {del && <Modal title="Delete this calendar item?" body="This permanently removes the draft." yes="Delete" onNo={() => setDel(null)} onYes={() => { update((o: any) => ({ calendar: o.calendar.filter((c: any) => c.id !== del.id) })); setDel(null); }} />}
    </div>
  );
}
