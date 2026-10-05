"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { adAgg, buildContext, eng, insights, marketingScore, num, sum } from "@/lib/analytics";
import { Bars, Card, Line } from "@/components/Charts";
import Badge from "@/components/Badge";
import JsonView from "@/components/JsonView";
const B = (s: string) => (s === "none" ? null : <Badge kind={s as any} />);
export default function Dashboard() {
  const { d, ready } = useStore(); const [brief, setBrief] = useState<any>(d.brief); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const { update } = useStore();
  const daily = d.daily, posts = d.posts, ag = adAgg(d.ads), ins = insights(posts), score = marketingScore(d);
  const has = (a: any[]) => a.length > 0, fmt = (n: number) => Math.round(n).toLocaleString("en-IN");
  const spend = ag.reduce((s: number, a: any) => s + a.spend, 0), rev = ag.reduce((s: number, a: any) => s + a.revenue, 0);
  const cards: [string, string | null, string][] = [
    ["Followers", has(daily) ? fmt(num(daily[daily.length - 1].followers)) : null, d.src.daily],
    ["Follower Growth", daily.length > 1 ? "+" + fmt(num(daily[daily.length - 1].followers) - num(daily[0].followers)) : null, d.src.daily],
    ["Reach", has(daily) ? fmt(sum(daily, "reach")) : null, d.src.daily], ["Impressions", has(daily) ? fmt(sum(daily, "impressions")) : null, d.src.daily],
    ["Engagement Rate", ins ? ins.avg.toFixed(1) + "%" : null, d.src.posts], ["Profile Visits", has(daily) ? fmt(sum(daily, "profile_visits")) : null, d.src.daily],
    ["Website Clicks", has(daily) ? fmt(sum(daily, "website_clicks")) : null, d.src.daily], ["DMs", has(daily) ? fmt(sum(daily, "dms")) : null, d.src.daily],
    ["Reel Views", has(posts) ? fmt(sum(posts, "views")) : null, d.src.posts], ["Ad Spend", has(ag) ? "₹" + fmt(spend) : null, d.src.ads],
    ["Revenue", has(ag) ? "₹" + fmt(rev) : null, d.src.ads], ["ROAS", spend ? (rev / spend).toFixed(2) + "x" : null, d.src.ads]];
  async function genBrief() { setBusy(true); setErr(""); try { const r = await api("/api/ai/run", { method: "POST", body: JSON.stringify({ module: "daily_brief", input: {}, context: buildContext(d) }) }); setBrief(r.result); update({ brief: r.result }); } catch (e: any) { setErr(e.message); } finally { setBusy(false); } }
  if (!ready) return <p className="text-sm text-neutral-500">Loading workspace…</p>;
  const none = !has(daily) && !has(posts) && !has(ag);
  return (
    <div className="space-y-8">
      <div><h1 className="text-2xl font-bold">Dashboard</h1><p className="text-sm text-neutral-400">Every number is labelled by where it came from. Empty means no data loaded.</p></div>
      {none && <p className="rounded-lg border border-line bg-panel p-4 text-sm text-neutral-300">No analytics yet. Go to <b>Instagram Analytics</b> to upload a CSV, sync Instagram (once Meta is configured) or load clearly-labelled demo data.</p>}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{cards.map(([t, v, s]) => (<div key={t} className="rounded-xl border border-line bg-panel p-4"><div className="flex justify-between text-xs text-neutral-400"><span>{t}</span>{B(s)}</div><div className={`mt-2 text-2xl font-semibold ${v ? "" : "text-neutral-600"}`}>{v ?? "—"}</div></div>))}</div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Follower growth" badge={B(d.src.daily)}><Line data={daily.map((x: any) => num(x.followers))} /></Card>
        <Card title="Daily reach" badge={B(d.src.daily)}><Line data={daily.map((x: any) => num(x.reach))} color="#7dd3fc" /></Card>
        <Card title="Engagement % per post" badge={B(d.src.posts)}><Line data={posts.map((p: any) => eng(p))} color="#86efac" /></Card>
        <Card title="Content performance (avg engagement by format)" badge={B(d.src.posts)}><Bars items={(ins?.byType || []).map((x) => ({ key: `${x.key} (${x.n})`, value: x.avg }))} fmt={(v) => v.toFixed(1) + "%"} /></Card>
        <Card title="Ad performance (ROAS by campaign)" badge={B(d.src.ads)}><Bars items={ag.map((a: any) => ({ key: a.campaign, value: a.roas }))} fmt={(v) => v.toFixed(2) + "x"} /></Card>
        <Card title="Marketing Health Score" badge={score ? <span className="text-[10px] text-neutral-500">rule-based</span> : null}>
          {score ? (<div><div className="text-3xl font-bold text-accent">{score.score}<span className="text-sm text-neutral-500">/100</span></div><ul className="mt-2 space-y-1 text-xs">{score.parts.map((p: any) => <li key={p.name} className={p.score >= 60 ? "text-emerald-300" : "text-red-300"}>{p.score >= 60 ? "+" : "−"} {p.name} {p.score}: <span className="text-neutral-400">{p.note}</span></li>)}</ul></div>) : <p className="text-xs text-neutral-500">Needs data.</p>}</Card>
      </div>
      <div className="rounded-xl border border-line bg-panel p-5">
        <div className="flex items-center gap-3"><h2 className="font-semibold">Today's AI brief</h2><Badge kind="ai" /><button onClick={genBrief} disabled={busy} className="ml-auto rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50">{busy ? "Thinking…" : brief ? "Regenerate" : "Generate today's plan"}</button></div>
        {err && <p className="mt-3 text-sm text-red-300">{err}</p>}{brief && <div className="mt-4"><JsonView v={brief} /></div>}
      </div>
    </div>
  );
}
