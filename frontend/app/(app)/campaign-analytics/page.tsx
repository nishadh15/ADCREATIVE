"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { adAgg, buildContext, parseCSV, classify, verdict } from "@/lib/analytics";
import Badge from "@/components/Badge";
import JsonView from "@/components/JsonView";
export default function Campaigns() {
  const { d, update } = useStore(); const [msg, setMsg] = useState(""); const [ai, setAi] = useState<any>(null); const [busy, setBusy] = useState(false);
  const ag = adAgg(d.ads);
  async function upload(f?: File) { if (!f) return; const rows = parseCSV(await f.text()); if (classify(rows) !== "ads") return setMsg("Expected columns: date,campaign,spend,impressions,clicks,conversions,revenue"); update({ ads: rows, src: { ...d.src, ads: "user" } }); setMsg(`Loaded ${rows.length} ad rows as USER data.`); }
  async function explain() { setBusy(true); try { const r = await api("/api/ai/run", { method: "POST", body: JSON.stringify({ module: "ad_analyst", input: {}, context: buildContext(d) }) }); setAi(r.result); } catch (e: any) { setAi({ error: e.message }); } finally { setBusy(false); } }
  const f = (n: number, p = 0) => n.toLocaleString("en-IN", { maximumFractionDigits: p });
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Campaign Analytics</h1><p className="text-sm text-neutral-400">Data: {d.src.ads === "none" ? "none loaded" : <Badge kind={d.src.ads} />}. Upload CSV columns: date,campaign,spend,impressions,clicks,conversions,revenue (Meta Ads API sync isn't wired yet).</p></div>
      <label className="inline-block cursor-pointer rounded-lg border border-line px-3 py-2 text-sm">Upload ads CSV<input hidden type="file" accept=".csv" onChange={(e) => upload(e.target.files?.[0])} /></label>{msg && <span className="ml-3 text-xs text-amber-200">{msg}</span>}
      {ag.length > 0 && (<div className="overflow-x-auto rounded-xl border border-line bg-panel"><table className="w-full text-left text-xs"><thead className="text-neutral-400"><tr>{["Campaign", "Spend ₹", "Impr.", "Clicks", "CTR %", "CPC ₹", "CPM ₹", "Conv.", "CPA ₹", "Revenue ₹", "ROAS", "Rule-based call"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
        <tbody>{ag.map((c: any) => { const v = verdict(c); return (<tr key={c.campaign} className="border-t border-line"><td className="p-3 font-medium">{c.campaign}</td><td className="p-3">{f(c.spend)}</td><td className="p-3">{f(c.impressions)}</td><td className="p-3">{f(c.clicks)}</td><td className="p-3">{c.ctr.toFixed(2)}</td><td className="p-3">{c.cpc.toFixed(1)}</td><td className="p-3">{c.cpm.toFixed(0)}</td><td className="p-3">{f(c.conversions)}</td><td className="p-3">{c.cpa ? c.cpa.toFixed(0) : "—"}</td><td className="p-3">{f(c.revenue)}</td><td className="p-3">{c.roas.toFixed(2)}x</td><td className="p-3"><b className={v.v === "Scale" ? "text-emerald-300" : v.v === "Stop" ? "text-red-300" : "text-amber-300"}>{v.v}</b><div className="text-neutral-500">{v.why}</div></td></tr>); })}</tbody></table></div>)}
      {ag.length > 0 && <div className="rounded-xl border border-line bg-panel p-5"><div className="flex items-center gap-3"><h2 className="font-semibold">AI explanation</h2><Badge kind="ai" /><button onClick={explain} disabled={busy} className="ml-auto rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50">{busy ? "Analysing…" : "What's working / failing?"}</button></div>{ai && <div className="mt-4"><JsonView v={ai} /></div>}</div>}
      <p className="text-xs text-neutral-500">Scale/Stop thresholds are simple rules (ROAS ≥ 3, ROAS &lt; 1 after ₹500, CTR &lt; 0.8%). Treat them as prompts to investigate. This tool never changes or spends on a campaign.</p>
    </div>
  );
}
