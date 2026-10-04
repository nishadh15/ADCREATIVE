"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Badge from "@/components/Badge";
const CARDS = ["Followers","Follower Growth","Reach","Impressions","Engagement Rate","Profile Visits","Website Clicks","DMs","Reel Views","Ad Spend","Revenue","ROAS"];
type Status = { instagram: string; claude: string; data_mode: string };
export default function Dashboard() {
  const [s, setS] = useState<Status | null>(null); const [err, setErr] = useState("");
  useEffect(() => { api<Status>("/api/integrations/status").then(setS).catch((e) => setErr(e.message)); }, []);
  return (
    <div className="space-y-8">
      <div><h1 className="text-2xl font-bold">Dashboard</h1><p className="text-sm text-neutral-400">No numbers are shown until real, uploaded or demo data exists.</p></div>
      <div className="rounded-xl border border-line bg-panel p-4 text-sm">
        {err ? <span className="text-red-400">Backend unreachable: {err}</span> : !s ? "Checking connections…" : (
          <div className="flex flex-wrap gap-6">
            <span>Instagram: <b className={s.instagram === "connected" ? "text-emerald-300" : "text-amber-300"}>{s.instagram.replace("_", " ")}</b></span>
            <span>Claude: <b>{s.claude.replace("_", " ")}</b></span>
            <span>Data mode: <b>{s.data_mode.replace(/_/g, " ")}</b></span>
          </div>)}
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {CARDS.map((c) => (
          <div key={c} className="rounded-xl border border-line bg-panel p-4">
            <div className="text-xs text-neutral-400">{c}</div>
            <div className="mt-2 text-2xl font-semibold text-neutral-600">—</div>
            <div className="mt-3 text-[11px] text-neutral-500">No data yet · connect Instagram or upload CSV (Phase 4)</div>
          </div>))}
      </div>
      <div className="flex items-center gap-2 text-xs text-neutral-500">Data labels: <Badge kind="real" /><Badge kind="demo" /><Badge kind="user" /><Badge kind="ai" /></div>
    </div>
  );
}
