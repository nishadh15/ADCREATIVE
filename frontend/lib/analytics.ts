export const num = (v: any) => { const n = parseFloat(String(v ?? "").replace(/[₹,%\s,]/g, "")); return isNaN(n) ? 0 : n; };
export const sum = (a: any[], k: string) => a.reduce((s, x) => s + num(x[k]), 0);
export const eng = (p: any) => ((num(p.likes) + num(p.comments) + num(p.shares) + num(p.saves)) / Math.max(num(p.reach), 1)) * 100;

export function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = []; let row: string[] = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur); cur = ""; if (row.some((x) => x.trim())) rows.push(row); row = []; }
    else cur += c;
  }
  row.push(cur); if (row.some((x) => x.trim())) rows.push(row);
  const h = (rows.shift() || []).map((x) => x.trim().toLowerCase().replace(/\s+/g, "_"));
  return rows.map((r) => Object.fromEntries(h.map((k, i) => [k, (r[i] ?? "").trim()])));
}
export function classify(rows: any[]): "ads" | "posts" | "daily" | null {
  const k = Object.keys(rows[0] || {});
  if (k.includes("spend") && k.includes("campaign")) return "ads";
  if (k.includes("likes") && k.includes("reach")) return "posts";
  if (k.includes("followers") || k.includes("impressions")) return "daily";
  return null;
}
export function hookType(h?: string) {
  const s = h || "";
  if (/₹|rs\.?\s?\d|\d{3}|under|only|price|just/i.test(s)) return "Price";
  if (/last|limited|today|hurry|ends|drop/i.test(s)) return "Urgency";
  if (/pov|when you|me when|that moment/i.test(s)) return "POV / Relatable";
  if (/\?/.test(s)) return "Question / Curiosity";
  return s ? "Statement" : "";
}
export function groupAvg(posts: any[], f: (p: any) => string | undefined) {
  const m: Record<string, number[]> = {};
  posts.forEach((p) => { const k = f(p); if (k) (m[k] = m[k] || []).push(eng(p)); });
  return Object.entries(m).map(([key, v]) => ({ key, avg: v.reduce((a, b) => a + b, 0) / v.length, n: v.length })).sort((a, b) => b.avg - a.avg);
}
export function insights(posts: any[]) {
  if (!posts.length) return null;
  const r = [...posts].sort((a, b) => eng(b) - eng(a));
  return { best: r[0], worst: r[r.length - 1], bestReel: r.find((p) => /reel/i.test(p.type)),
    avg: posts.reduce((s, p) => s + eng(p), 0) / posts.length,
    byType: groupAvg(posts, (p) => p.type), byHook: groupAvg(posts, (p) => hookType(p.hook)),
    byProduct: groupAvg(posts, (p) => p.product), byHour: groupAvg(posts, (p) => (p.hour != null && p.hour !== "" ? `${p.hour}:00` : undefined)) };
}
export function adAgg(ads: any[]) {
  const m: Record<string, any> = {};
  ads.forEach((a) => { const c = (m[a.campaign] = m[a.campaign] || { campaign: a.campaign, spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 });
    ["spend", "impressions", "clicks", "conversions", "revenue"].forEach((k) => (c[k] += num(a[k]))); });
  return Object.values(m).map((c: any) => ({ ...c, ctr: c.impressions ? (c.clicks / c.impressions) * 100 : 0, cpc: c.clicks ? c.spend / c.clicks : 0,
    cpm: c.impressions ? (c.spend / c.impressions) * 1000 : 0, cpa: c.conversions ? c.spend / c.conversions : 0, roas: c.spend ? c.revenue / c.spend : 0 }));
}
// Rule-based verdict with transparent thresholds (not AI).
export function verdict(c: any) {
  if (c.spend < 300) return { v: "Hold", why: "Not enough spend yet (under ₹300) to judge." };
  if (c.roas >= 3 && c.conversions >= 5) return { v: "Scale", why: "ROAS ≥ 3 with 5+ conversions." };
  if (c.roas < 1 && c.spend >= 500) return { v: "Stop", why: "ROAS below 1 after ₹500+ spend." };
  if (c.ctr < 0.8) return { v: "Test new creative", why: "CTR under 0.8% suggests the creative isn't earning clicks." };
  return { v: "Hold", why: "Between thresholds; keep collecting data." };
}
export function marketingScore(d: any) {
  const parts: any[] = [], daily = d.daily || [], posts = d.posts || [], ads = adAgg(d.ads || []);
  const add = (name: string, score: number, note: string) => parts.push({ name, score: Math.round(Math.max(0, Math.min(100, score))), note });
  if (posts.length) { const e = posts.reduce((s: number, p: any) => s + eng(p), 0) / posts.length; add("Engagement", e * 12.5, `Avg engagement ${e.toFixed(1)}% (8% = full marks)`);
    const days = (new Date(posts[posts.length - 1].date).getTime() - new Date(posts[0].date).getTime()) / 864e5 || 1;
    const pw = (posts.length / Math.max(days, 7)) * 7; add("Consistency", (pw / 5) * 100, `${pw.toFixed(1)} posts/week (5 = full marks)`);
    const pr = sum(posts, "reach") / posts.length; add("Content performance", Math.min(100, (insights(posts)!.avg / Math.max(1, e)) * 50 + 25), `Avg reach/post ${Math.round(pr)}`); }
  const f = daily.filter((x: any) => num(x.followers) > 0);
  if (f.length > 1) { const g = ((num(f[f.length - 1].followers) - num(f[0].followers)) / num(f[0].followers)) * 100; add("Follower growth", g * 10 + 30, `${g.toFixed(1)}% over the period`); }
  const r = daily.filter((x: any) => num(x.reach) > 0);
  if (r.length > 3) { const h = Math.floor(r.length / 2), a = sum(r.slice(0, h), "reach") / h, b = sum(r.slice(h), "reach") / (r.length - h); add("Reach", 50 + (b / Math.max(a, 1) - 1) * 100, `Recent reach ${((b / Math.max(a, 1) - 1) * 100).toFixed(0)}% vs earlier`); }
  const pv = sum(daily, "profile_visits"), wc = sum(daily, "website_clicks");
  if (pv > 0) add("Conversion", (wc / pv / 0.15) * 100, `${((wc / pv) * 100).toFixed(1)}% profile visits → website clicks (15% = full marks)`);
  if (ads.length) { const sp = ads.reduce((s: number, a: any) => s + a.spend, 0), rv = ads.reduce((s: number, a: any) => s + a.revenue, 0); if (sp) add("Ad performance", (rv / sp / 3) * 100, `ROAS ${(rv / sp).toFixed(2)} (3 = full marks)`); }
  if (!parts.length) return null;
  return { score: Math.round(parts.reduce((s, p) => s + p.score, 0) / parts.length), parts };
}
export function learnings(posts: any[]) {
  const i = insights(posts); if (!i || posts.length < 6) return { note: "Need at least 6 posts to learn patterns." };
  const top = (a: any[]) => a.find((x) => x.n >= 3);
  return { winning_hook_type: top(i.byHook), winning_format: top(i.byType), winning_product: top(i.byProduct), winning_hour: top(i.byHour),
    failed_content: { hook: i.worst.hook, type: i.worst.type, engagement_pct: +eng(i.worst).toFixed(2) } };
}
export function buildContext(d: any) {
  const posts = d.posts || [], daily = d.daily || [];
  return { data_source: d.src, today: new Date().toISOString().slice(0, 10), marketing_score: marketingScore(d),
    account: { first_day: daily[0], latest_day: daily[daily.length - 1], total_reach: sum(daily, "reach") },
    recent_posts: posts.slice(-20).map((p: any) => ({ date: p.date, type: p.type, product: p.product, hook: p.hook, hook_type: hookType(p.hook), reach: num(p.reach), engagement_pct: +eng(p).toFixed(2), views: num(p.views) })),
    insights: insights(posts) && { avg_engagement: insights(posts)!.avg, by_type: insights(posts)!.byType, by_hook: insights(posts)!.byHook, by_product: insights(posts)!.byProduct, by_hour: insights(posts)!.byHour },
    learnings: learnings(posts), ads: adAgg(d.ads || []), calendar_upcoming: (d.calendar || []).slice(0, 10).map((c: any) => ({ date: c.date, type: c.content_type, hook: c.hook })) };
}
