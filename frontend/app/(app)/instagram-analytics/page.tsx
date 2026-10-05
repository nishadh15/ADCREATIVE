"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { buildContext, classify, eng, insights, num, parseCSV } from "@/lib/analytics";
import { makeDemo } from "@/lib/demo";
import { Bars, Card, Line } from "@/components/Charts";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import JsonView from "@/components/JsonView";
const T = { daily: "date,followers,reach,impressions,profile_visits,website_clicks,dms,reel_views\n2026-10-01,1500,1800,2500,110,14,3,3200", posts: "date,hour,type,product,hook,caption,reach,likes,comments,shares,saves,views\n2026-10-01,19,Reel,Oversized Tee,₹749 for the whole fit?,caption here,2400,180,12,30,45,5200" };
const dl = (k: "daily" | "posts") => "data:text/csv;charset=utf-8," + encodeURIComponent(T[k]);
export default function IGAnalytics() {
  const { d, update } = useStore(); const [msg, setMsg] = useState(""); const [confirm, setConfirm] = useState<string | null>(null); const [why, setWhy] = useState<any>(null); const [busy, setBusy] = useState(false);
  const ins = insights(d.posts);
  async function upload(f?: File) {
    if (!f) return; const rows = parseCSV(await f.text()), k = classify(rows);
    if (!k) return setMsg("Couldn't recognise this CSV. Use the templates below (daily, posts or ads columns).");
    update({ [k]: rows, src: { ...d.src, [k]: "user" } }); setMsg(`Loaded ${rows.length} ${k} rows as USER data.`);
  }
  async function sync() {
    setMsg("Syncing…");
    try { const r = await api("/api/instagram/sync"); update({ posts: r.posts, src: { ...d.src, posts: "real" } }); setMsg(`Synced ${r.posts.length} posts from Instagram (@${r.profile.username}, ${r.profile.followers_count} followers). Follower history needs daily snapshots, not yet automated.`); }
    catch (e: any) { setMsg(e.message); }
  }
  async function explain() { setBusy(true); try { const r = await api("/api/ai/run", { method: "POST", body: JSON.stringify({ module: "performance_analyzer", input: { focus: "why best and worst content performed" }, context: buildContext(d) }) }); setWhy(r.result); } catch (e: any) { setWhy({ error: e.message }); } finally { setBusy(false); } }
  const btn = "rounded-lg border border-line px-3 py-2 text-sm hover:bg-white/5";
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Instagram Analytics</h1><p className="text-sm text-neutral-400">Sources: <Badge kind="real" /> Meta API · <Badge kind="user" /> your CSV · <Badge kind="demo" /> sample data.</p></div>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-panel p-4">
        <label className={btn + " cursor-pointer"}>Upload CSV<input type="file" accept=".csv" hidden onChange={(e) => upload(e.target.files?.[0])} /></label>
        <button className={btn} onClick={sync}>Sync from Instagram</button>
        <button className={btn} onClick={() => setConfirm("demo")}>Load demo data</button>
        <button className={btn + " text-red-300"} onClick={() => setConfirm("clear")}>Clear all data</button>
        <span className="ml-auto text-xs text-neutral-500">Templates: <a className="underline" download="daily.csv" href={dl("daily")}>daily</a> · <a className="underline" download="posts.csv" href={dl("posts")}>posts</a></span>
        {msg && <p className="w-full text-xs text-amber-200">{msg}</p>}
      </div>
      {!ins && <p className="text-sm text-neutral-500">No post data loaded.</p>}
      {ins && (<>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title="Best post" badge={<Badge kind={d.src.posts} />}><p className="text-sm">{ins.best.hook || ins.best.caption}</p><p className="mt-1 text-xs text-neutral-400">{ins.best.type} · {ins.best.product} · {eng(ins.best).toFixed(1)}% engagement</p></Card>
          <Card title="Worst post" badge={<Badge kind={d.src.posts} />}><p className="text-sm">{ins.worst.hook || ins.worst.caption}</p><p className="mt-1 text-xs text-neutral-400">{ins.worst.type} · {ins.worst.product} · {eng(ins.worst).toFixed(1)}% engagement</p></Card>
          <Card title="Best Reel" badge={<Badge kind={d.src.posts} />}>{ins.bestReel ? <><p className="text-sm">{ins.bestReel.hook}</p><p className="mt-1 text-xs text-neutral-400">{eng(ins.bestReel).toFixed(1)}% · {num(ins.bestReel.views).toLocaleString()} views</p></> : <p className="text-xs text-neutral-500">No Reels in data</p>}</Card>
          <Card title="By hook type"><Bars items={ins.byHook.map((x) => ({ key: `${x.key} (${x.n})`, value: x.avg }))} fmt={(v) => v.toFixed(1) + "%"} /></Card>
          <Card title="By format"><Bars items={ins.byType.map((x) => ({ key: `${x.key} (${x.n})`, value: x.avg }))} fmt={(v) => v.toFixed(1) + "%"} /></Card>
          <Card title="By product"><Bars items={ins.byProduct.map((x) => ({ key: `${x.key} (${x.n})`, value: x.avg }))} fmt={(v) => v.toFixed(1) + "%"} /></Card>
          <Card title="By posting hour"><Bars items={ins.byHour.map((x) => ({ key: `${x.key} (${x.n})`, value: x.avg }))} fmt={(v) => v.toFixed(1) + "%"} /></Card>
          <Card title="Followers"><Line data={d.daily.map((x: any) => num(x.followers))} /></Card>
          <Card title="Reach"><Line data={d.daily.map((x: any) => num(x.reach))} color="#7dd3fc" /></Card>
        </div>
        <p className="text-xs text-neutral-500">Best/worst are by engagement rate = (likes+comments+shares+saves)/reach. Averages with only 1–2 posts are weak evidence. Best CTA, offer and audience demographics need caption text / Meta insights; ask the AI below.</p>
        <div className="rounded-xl border border-line bg-panel p-5"><div className="flex items-center gap-3"><h2 className="font-semibold">Why did it perform this way?</h2><Badge kind="ai" /><button onClick={explain} disabled={busy} className="ml-auto rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50">{busy ? "Analysing…" : "Explain with AI"}</button></div>{why && <div className="mt-4"><JsonView v={why} /></div>}</div>
      </>)}
      {confirm && <Modal title={confirm === "demo" ? "Replace data with DEMO data?" : "Delete all analytics, calendar and brief?"} body={confirm === "demo" ? "This replaces your current analytics with generated sample data (labelled DEMO). Nothing here is real." : "This permanently deletes uploaded analytics, calendar items and the saved brief. Approval history is kept."} yes={confirm === "demo" ? "Load demo" : "Delete"}
        onNo={() => setConfirm(null)} onYes={() => { if (confirm === "demo") { const x = makeDemo(); update({ ...x, src: { daily: "demo", posts: "demo", ads: "demo" } }); } else update({ daily: [], posts: [], ads: [], calendar: [], brief: null, src: { daily: "none", posts: "none", ads: "none" } }); setConfirm(null); }} />}
    </div>
  );
}
