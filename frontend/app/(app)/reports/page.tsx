"use client";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { adAgg, buildContext, num } from "@/lib/analytics";
import { Bars, Card, Columns, Stacked } from "@/components/Charts";
import CopyButton from "@/components/CopyButton";
import Badge from "@/components/Badge";
import { toText } from "@/components/JsonView";

const PERIODS = [["7", "Last 7 days"], ["14", "Last 14 days"], ["30", "Last 30 days"], ["all", "All loaded"]] as const;
const iso = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
const daysAgo = (n: number) => { const x = new Date(); x.setDate(x.getDate() - n); return iso(x); };
const fmtType = (t: any) => (String(t || "Post").replace(/_/g, " ").replace(/\s*album/i, "").trim() || "Post");
const fmtN = (v: number) => Math.round(v).toLocaleString("en-IN");
const sumK = (a: any[], k: string) => a.reduce((s, p) => s + num(p[k]), 0);

/** AI items may be strings or {item, detail}; normalise and drop empties. */
const norm = (x: any): { title: string; detail?: string } | null => {
  if (x == null) return null;
  if (typeof x === "string") return x.trim() ? { title: x.trim() } : null;
  if (typeof x === "object") {
    const title = x.item || x.title || x.name || x.action || Object.values(x).find((v) => typeof v === "string");
    const detail = x.detail || x.description || x.reason || x.why;
    return title ? { title: String(title), detail: detail ? String(detail) : undefined } : null;
  }
  return { title: String(x) };
};
const list = (a: any) => (Array.isArray(a) ? a.map(norm).filter(Boolean) as { title: string; detail?: string }[] : []);

function groupAvg(posts: any[], key: (p: any) => string | undefined, val: (p: any) => number) {
  const m: Record<string, number[]> = {};
  posts.forEach((p) => { const k = key(p); if (k) (m[k] = m[k] || []).push(val(p)); });
  return Object.entries(m).map(([k, v]) => ({ key: k, n: v.length, value: v.reduce((s, x) => s + x, 0) / v.length }));
}

const Delta = ({ cur, prev }: { cur: number; prev: number | null }) => {
  if (prev == null || prev <= 0) return null;
  const d = ((cur - prev) / prev) * 100;
  if (!isFinite(d)) return null;
  return <span className={`border-2 border-ink px-1.5 py-0.5 font-mono text-[10px] font-bold ${d >= 0 ? "bg-lime" : "bg-peach"}`}>{d >= 0 ? "▲" : "▼"} {Math.abs(d).toFixed(0)}%</span>;
};

const Kpi = ({ label, value, cur, prev, tone = "bg-bone" }: { label: string; value: string; cur: number; prev: number | null; tone?: string }) => (
  <div className={`print-sheet border-[3px] border-ink p-4 shadow-brutsm ${tone}`}>
    <div className="flex items-start justify-between gap-2">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em]">{label}</span>
      <Delta cur={cur} prev={prev} />
    </div>
    <div className="mt-2 font-display text-4xl leading-none tabular-nums sm:text-5xl">{value}</div>
  </div>
);

const Block = ({ title, tone, children }: { title: string; tone: string; children: React.ReactNode }) => (
  <section className={`print-sheet border-[3px] border-ink p-5 shadow-brut ${tone}`}>
    <h2 className="mb-4 !text-2xl">{title}</h2>
    {children}
  </section>
);

export default function Reports() {
  const { d, ready, syncing } = useStore();
  const [period, setPeriod] = useState<(typeof PERIODS)[number][0]>("30");
  const [res, setRes] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const all: any[] = d.posts || [];
  const N = period === "all" ? 0 : +period;
  const from = N ? daysAgo(N) : "0000-00-00";
  const prevFrom = N ? daysAgo(N * 2) : "";
  const cur = useMemo(() => all.filter((p) => String(p.date) >= from).sort((a, b) => String(a.date).localeCompare(String(b.date))), [all, from]);
  const prev = useMemo(() => (N ? all.filter((p) => String(p.date) >= prevFrom && String(p.date) < from) : []), [all, from, prevFrom, N]);
  const hasPrev = prev.length > 0;

  const likes = sumK(cur, "likes"), comments = sumK(cur, "comments"), views = sumK(cur, "views"), reach = sumK(cur, "reach");
  const interactions = likes + comments + sumK(cur, "shares") + sumK(cur, "saves");
  const eng = reach > 0 ? (interactions / reach) * 100 : null;
  const pv = (k: string) => (hasPrev ? sumK(prev, k) : null);

  const timeline = cur.map((p) => ({ label: String(p.date).slice(5), value: num(p.likes) }));
  const maxLikes = Math.max(0, ...timeline.map((t) => t.value));
  const byFormat = groupAvg(cur, (p) => fmtType(p.type), (p) => num(p.likes)).sort((a, b) => b.value - a.value);
  const reels = cur.filter((p) => /reel/i.test(p.type || "") && num(p.views) > 0);
  const maxViews = Math.max(0, ...reels.map((p) => num(p.views)));
  const byHour = groupAvg(cur, (p) => (p.hour != null && p.hour !== "" ? String(p.hour).padStart(2, "0") : undefined), (p) => num(p.likes)).sort((a, b) => +a.key - +b.key);
  const bestHour = [...byHour].sort((a, b) => b.value - a.value)[0];
  const mix = Object.entries(cur.reduce((m: Record<string, number>, p) => { const k = fmtType(p.type); m[k] = (m[k] || 0) + 1; return m; }, {})).map(([label, value]) => ({ label, value }));
  const top = [...cur].sort((a, b) => num(b.likes) - num(a.likes)).slice(0, 5);
  const ads = adAgg(d.ads || []);

  async function generate() {
    setBusy(true); setErr("");
    try {
      const r = await api("/api/ai/run", { method: "POST", body: JSON.stringify({ module: "report", input: { period: PERIODS.find((x) => x[0] === period)![1] }, context: buildContext({ ...d, posts: cur }) }) });
      setRes(r.result);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  const wins = list(res?.wins), problems = list(res?.problems);
  const plan = list(res?.next_week_plan), scale = list(res?.scale), stop = list(res?.stop), test = list(res?.test_next);
  const periodLabel = N ? `${daysAgo(N)} → ${iso(new Date())}` : "all loaded posts";

  return (
    <div className="space-y-8">
      {/* header + controls */}
      <div className="no-print">
        <span className="tag">Reports</span>
        <h1 className="mt-4">Performance <span className="hl">report</span></h1>
        <p className="mt-3 max-w-xl text-sm font-semibold text-neutral-500">Charts come straight from your Instagram posts. The AI adds wins, problems and a plan on top.</p>
      </div>

      <div className="no-print flex flex-wrap items-center gap-3 border-[3px] border-ink bg-bone p-4 shadow-brut">
        <div className="flex flex-wrap gap-2">
          {PERIODS.map(([k, l]) => (
            <button key={k} onClick={() => setPeriod(k)}
              className={`border-[3px] border-ink px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider transition-all duration-100 ${period === k ? "translate-x-0.5 translate-y-0.5 bg-ink text-lime" : "bg-bone shadow-brutsm hover:-translate-x-px hover:-translate-y-px hover:bg-lime"}`}>{l}</button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {res && <CopyButton text={toText(res)} label="Copy analysis" />}
          <button onClick={() => window.print()} className="border-2 border-line px-3 py-2 text-xs">Print / PDF</button>
          <button onClick={generate} disabled={busy || !cur.length} className="bg-accent px-5 py-2 text-ink">{busy ? "Analysing…" : res ? "Regenerate analysis" : "Generate AI analysis"}</button>
        </div>
      </div>
      {err && <p className="no-print border-[3px] border-ink bg-peach p-3 text-sm font-bold shadow-brutsm">⚠ {err}</p>}

      {!ready || syncing ? (
        <p className="border-[3px] border-ink bg-bone p-5 font-mono text-sm font-bold shadow-brutsm">SYNCING YOUR INSTAGRAM DATA…</p>
      ) : !cur.length ? (
        <p className="border-[3px] border-ink bg-bone p-5 text-sm font-bold shadow-brutsm">No posts in this period. Pick a longer range, or sync Instagram from Instagram Analytics.</p>
      ) : (
        <>
          {/* title sheet */}
          <section className="print-sheet border-[3px] border-ink bg-accent p-6 shadow-[8px_8px_0_0_#0A0A0A]">
            <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] font-bold uppercase tracking-wider">
              <span className="bg-ink px-2 py-0.5 text-lime">{res?.title || "Performance report"}</span>
              <span>{res?.period || periodLabel}</span>
              {d.profile && <span>· @{d.profile.username} · {fmtN(num(d.profile.followers_count))} followers</span>}
              <Badge kind={d.src?.posts === "real" ? "real" : d.src?.posts === "demo" ? "demo" : "user"} />
            </div>
            <p className="mt-4 max-w-4xl font-display text-4xl uppercase leading-[1.05] md:text-6xl">
              {res?.headline || `${cur.length} posts · ${fmtN(likes)} likes · ${fmtN(comments)} comments${views ? ` · ${fmtN(views)} reel views` : ""}`}
            </p>
          </section>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <Kpi label="Posts" value={fmtN(cur.length)} cur={cur.length} prev={hasPrev ? prev.length : null} tone="bg-lime" />
            <Kpi label="Likes" value={fmtN(likes)} cur={likes} prev={pv("likes")} />
            <Kpi label="Comments" value={fmtN(comments)} cur={comments} prev={pv("comments")} />
            <Kpi label="Reel views" value={fmtN(views)} cur={views} prev={pv("views")} />
            <Kpi label="Avg likes / post" value={fmtN(likes / cur.length)} cur={likes / cur.length} prev={hasPrev ? sumK(prev, "likes") / prev.length : null} />
            <Kpi label="Engagement" value={eng == null ? "n/a" : eng.toFixed(1) + "%"} cur={eng ?? 0} prev={hasPrev && sumK(prev, "reach") > 0 ? ((sumK(prev, "likes") + sumK(prev, "comments") + sumK(prev, "shares") + sumK(prev, "saves")) / sumK(prev, "reach")) * 100 : null} tone="bg-peach" />
          </div>
          {hasPrev && <p className="no-print -mt-4 font-mono text-[11px] font-bold text-neutral-500">// ▲▼ compare with the previous {N} days ({prev.length} posts)</p>}

          {/* charts */}
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="print-sheet lg:col-span-2">
              <Card title="Likes per post, in order" badge={<span className="tag">{cur.length} posts</span>}>
                <Columns items={timeline.map((t) => ({ ...t, hi: t.value === maxLikes && maxLikes > 0 }))} />
                <p className="mt-3 font-mono text-[11px] font-bold text-neutral-500">// lime = best post</p>
              </Card>
            </div>
            <div className="print-sheet"><Card title="Avg likes by format">
              <Bars items={byFormat.map((x) => ({ key: `${x.key} (${x.n})`, value: x.value }))} fmt={(v) => fmtN(v)} />
            </Card></div>
            <div className="print-sheet"><Card title="Format mix">
              <Stacked items={mix} />
            </Card></div>
            <div className="print-sheet"><Card title="Reel views">
              <Columns items={reels.map((p) => ({ label: String(p.date).slice(5), value: num(p.views), hi: num(p.views) === maxViews }))} fmt={(v) => (v >= 1000 ? (v / 1000).toFixed(1) + "k" : String(Math.round(v)))} color="bg-lime" />
              {!reels.length && <p className="font-mono text-[11px] font-bold text-neutral-500">// no Reel views in this period</p>}
            </Card></div>
            <div className="print-sheet"><Card title="Avg likes by posting hour (IST)">
              <Columns items={byHour.map((h) => ({ label: h.key + "h", value: h.value, hi: bestHour?.key === h.key }))} />
              {bestHour && <p className="mt-3 text-xs font-bold">Best slot so far: <span className="hl">{bestHour.key}:00 IST</span> <span className="font-mono text-[11px] text-neutral-500">({bestHour.n} post{bestHour.n > 1 ? "s" : ""})</span></p>}
            </Card></div>
            {ads.length > 0 && (
              <div className="print-sheet lg:col-span-2"><Card title="Ad ROAS by campaign">
                <Bars items={ads.map((a: any) => ({ key: a.campaign, value: a.roas }))} fmt={(v) => v.toFixed(2) + "x"} />
              </Card></div>
            )}
          </div>

          {/* top posts */}
          <Card title="Top 5 posts by likes">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead><tr>{["#", "Date", "Format", "Likes", "Comments", "Views", "Caption"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
                <tbody>{top.map((p, i) => (
                  <tr key={i} className="align-top">
                    <td className="px-3 py-2 font-display text-2xl">{i + 1}</td><td className="px-3 py-2 font-mono text-xs">{p.date}</td>
                    <td className="px-3 py-2 font-bold">{fmtType(p.type)}</td><td className="px-3 py-2 font-bold tabular-nums">{fmtN(num(p.likes))}</td>
                    <td className="px-3 py-2 tabular-nums">{fmtN(num(p.comments))}</td><td className="px-3 py-2 tabular-nums">{num(p.views) ? fmtN(num(p.views)) : "–"}</td>
                    <td className="max-w-md px-3 py-2 text-xs text-neutral-500"><span className="line-clamp-2">{p.caption || p.hook || ""}</span></td>
                  </tr>))}</tbody>
              </table>
            </div>
          </Card>

          {/* AI analysis */}
          {!res ? (
            <section className="no-print border-[3px] border-dashed border-ink bg-bone p-6">
              <h2 className="!text-2xl">AI analysis</h2>
              <p className="mt-2 max-w-xl text-sm font-semibold text-neutral-500">Press <b>Generate AI analysis</b> for wins, problems and next week&apos;s plan, written from the numbers above.</p>
            </section>
          ) : (
            <div className="space-y-8">
              <div className="grid gap-8 lg:grid-cols-2">
                {wins.length > 0 && (
                  <Block title="✓ Wins" tone="bg-lime">
                    <ul className="space-y-3">{wins.map((w, i) => (
                      <li key={i} className="border-[3px] border-ink bg-bone p-3 shadow-brutsm"><div className="font-bold">{w.title}</div>{w.detail && <div className="mt-1 text-sm font-medium text-neutral-500">{w.detail}</div>}</li>
                    ))}</ul>
                  </Block>
                )}
                {problems.length > 0 && (
                  <Block title="✕ Problems" tone="bg-peach">
                    <ul className="space-y-3">{problems.map((w, i) => (
                      <li key={i} className="border-[3px] border-ink bg-bone p-3 shadow-brutsm"><div className="font-bold">{w.title}</div>{w.detail && <div className="mt-1 text-sm font-medium text-neutral-500">{w.detail}</div>}</li>
                    ))}</ul>
                  </Block>
                )}
              </div>

              {res.metrics_commentary && (
                <Block title="Reading the numbers" tone="bg-bone"><p className="max-w-4xl text-[15px] font-medium leading-7">{String(res.metrics_commentary)}</p></Block>
              )}

              {plan.length > 0 && (
                <Block title="Next week plan" tone="bg-bone">
                  <ol className="grid gap-3 md:grid-cols-2">{plan.map((a, i) => (
                    <li key={i} className="flex gap-3 border-[3px] border-ink bg-paper p-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center border-[3px] border-ink bg-accent font-display text-lg leading-none">{i + 1}</span>
                      <span className="text-sm font-semibold leading-snug">{a.title}{a.detail ? ` — ${a.detail}` : ""}</span>
                    </li>
                  ))}</ol>
                </Block>
              )}

              <div className="grid gap-8 lg:grid-cols-3">
                {([["▲ Scale", scale, "bg-lime"], ["■ Stop", stop, "bg-peach"], ["? Test next", test, "bg-bone"]] as const).map(([t, items, tone]) => items.length > 0 && (
                  <Block key={t} title={t} tone={tone}>
                    <ul className="space-y-2.5">{items.map((x, i) => <li key={i} className="border-l-[6px] border-ink pl-3 text-sm font-semibold leading-snug">{x.title}</li>)}</ul>
                  </Block>
                ))}
              </div>

              {res.data_notes && <p className="font-mono text-[11px] font-bold text-neutral-500">// {String(res.data_notes)}</p>}
            </div>
          )}
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500">Generated {new Date().toLocaleString("en-IN")} · based on {cur.length} posts · AI text can be wrong, verify before acting</p>
        </>
      )}
    </div>
  );
}
