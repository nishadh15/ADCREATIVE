"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import Modal from "@/components/Modal";
import JsonView from "@/components/JsonView";
export default function Settings() {
  const { d, decide } = useStore(); const [s, setS] = useState<any>(null); const [m, setM] = useState<any>(null); const [open, setOpen] = useState<any>(null);
  useEffect(() => { api("/api/integrations/status").then(setS).catch(() => setS({ error: true })); }, []);
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>
      <section className="rounded-xl border border-line bg-panel p-5 text-sm"><h2 className="mb-2 font-semibold">Connections</h2>
        {!s ? "Checking…" : s.error ? <span className="text-red-300">Backend unreachable</span> : <ul className="space-y-1"><li>Instagram (Meta Graph API): <b>{s.instagram.replace("_", " ")}</b></li><li>Claude API: <b>{s.claude.replace("_", " ")}</b></li></ul>}
        <p className="mt-3 text-xs text-neutral-500">Set CLAUDE_API_KEY, META_ACCESS_TOKEN and META_IG_USER_ID on the Render backend (never in the frontend). Rotate any secret that has been shared in chat or email.</p></section>
      <section className="rounded-xl border border-line bg-panel p-5"><h2 className="mb-1 font-semibold">Approval queue</h2>
        <p className="mb-4 text-xs text-neutral-500">Approving records your decision. Publishing and ad-spend execution adapters are NOT wired yet, so approved items are not sent to Instagram/Meta automatically; post them manually or via a later integration.</p>
        {d.actions.length === 0 && <p className="text-sm text-neutral-500">Nothing queued.</p>}
        <div className="space-y-3">{d.actions.map((a: any) => (<div key={a.id} className="rounded-lg border border-line bg-ink p-3 text-sm"><div className="flex items-center gap-3"><b>{a.action}</b><span className="text-xs text-neutral-500">{new Date(a.created).toLocaleString()}</span>
          <span className={`ml-auto text-xs ${a.status === "approved" ? "text-emerald-300" : a.status === "rejected" ? "text-red-300" : "text-amber-300"}`}>{a.status.toUpperCase()}</span></div>
          <p className="mt-1 text-xs text-neutral-400">What will happen: {a.what_will_happen} · Cost: ₹{a.cost ?? 0} · Target: {a.target} · Schedule: {a.schedule} · Requires approval: yes</p>
          <div className="mt-2 flex gap-2"><button className="text-xs underline" onClick={() => setOpen(a)}>View content</button>
            {a.status === "pending" && <><button className="rounded border border-emerald-400 px-2 py-1 text-xs text-emerald-300" onClick={() => setM({ a, s: "approved" })}>Approve</button><button className="rounded border border-red-400 px-2 py-1 text-xs text-red-300" onClick={() => setM({ a, s: "rejected" })}>Reject</button></>}</div></div>))}</div></section>
      {open && <div className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4" onClick={() => setOpen(null)}><div className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-2xl border border-line bg-panel p-6" onClick={(e) => e.stopPropagation()}><JsonView v={open.content} /></div></div>}
      {m && <Modal title={m.s === "approved" ? "Approve this action?" : "Reject this action?"} body={m.s === "approved" ? `${m.a.what_will_happen}. Cost ₹${m.a.cost ?? 0}. This marks it approved; nothing is auto-published or spent.` : "It will be marked rejected."} yes={m.s === "approved" ? "Approve" : "Reject"} onNo={() => setM(null)} onYes={() => { decide(m.a.id, m.s); setM(null); }} />}
    </div>
  );
}
