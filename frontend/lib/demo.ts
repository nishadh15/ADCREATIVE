// DEMO DATA ONLY: generated sample numbers so the UI can be explored. Not real Instagram data.
function rng(seed: number) { return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296); }
const iso = (d: Date) => d.toISOString().slice(0, 10);
export function makeDemo() {
  const r = rng(42), end = new Date(), daily: any[] = [], posts: any[] = [], ads: any[] = []; let f = 1200;
  for (let i = 59; i >= 0; i--) { const d = new Date(end); d.setDate(d.getDate() - i); f += Math.round(r() * 14 + 2);
    const reach = Math.round(900 + r() * 1800 + (60 - i) * 15); daily.push({ date: iso(d), followers: f, reach, impressions: Math.round(reach * 1.4), profile_visits: Math.round(reach * 0.06), website_clicks: Math.round(reach * 0.008), dms: Math.round(r() * 6), reel_views: Math.round(reach * 1.8) }); }
  const prods = ["Oversized Tee", "Acid-wash Tee", "Baggy Pants", "Hoodie", "Tee + Pants Combo"];
  const hooks = ["₹749 for the whole fit?", "POV: your college fit just got cheaper", "Only 20 pieces left today", "Why is everyone wearing this?", "New drop: acid-wash tees", "Behind the print"];
  const types = ["Reel", "Reel", "Carousel", "Post", "Reel"];
  for (let i = 0; i < 30; i++) { const d = new Date(end); d.setDate(d.getDate() - 58 + i * 2); const h = hooks[Math.floor(r() * hooks.length)], t = types[Math.floor(r() * types.length)];
    const boost = (/₹/.test(h) ? 1.6 : 1) * (t === "Reel" ? 1.5 : 1), reach = Math.round((600 + r() * 1500) * boost);
    posts.push({ date: iso(d), hour: [12, 18, 19, 21][Math.floor(r() * 4)], type: t, product: prods[Math.floor(r() * prods.length)], hook: h, caption: h, reach, likes: Math.round(reach * (0.05 + r() * 0.05)), comments: Math.round(reach * 0.006), shares: Math.round(reach * 0.01), saves: Math.round(reach * 0.015), views: t === "Reel" ? Math.round(reach * 2) : 0 }); }
  ["Combo Reel boost", "Hoodie traffic", "Retarget cart"].forEach((c, ci) => { for (let i = 13; i >= 0; i--) { const d = new Date(end); d.setDate(d.getDate() - i); const spend = Math.round(150 + r() * 250), impressions = Math.round(spend * (40 + r() * 30)), clicks = Math.round(impressions * (0.006 + ci * 0.004 + r() * 0.01)), conversions = Math.round(clicks * (0.01 + ci * 0.015)), revenue = conversions * (700 + Math.round(r() * 200)); ads.push({ date: iso(d), campaign: c, spend, impressions, clicks, conversions, revenue }); } });
  return { daily, posts, ads };
}
