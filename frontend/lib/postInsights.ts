// Rule-based "why did this post do well/badly" notes. Pure functions, no AI calls.
// These are signals read from the caption and format, not proof: Instagram does not say why a post performed.

export type Post = {
  date?: string; type?: string; caption?: string; hook?: string; permalink?: string;
  likes?: any; comments?: any; views?: any; reach?: any; shares?: any; saves?: any;
};
const n = (v: any) => { const x = parseFloat(String(v ?? "").replace(/[,\s]/g, "")); return isNaN(x) ? 0 : x; };
const avg = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

export const likesOf = (p: Post) => n(p.likes);
export const viewsOf = (p: Post) => n(p.views);

const CTA = /\b(dm|comment|link in bio|order|contact|shop|tag|save|share|follow|whatsapp|call|book|grab|buy|DM)\b/i;
const URGENT = /\b(only|limited|last|hurry|sale|offer|drop|season|today|now|sold out|new arrival|deal|off)\b/i;
const emojiCount = (s: string) => (s.match(/\p{Extended_Pictographic}/gu) || []).length;

export type Why = { driver: "Content" | "Description" | "Hashtags" | "Mixed"; headline: string; points: string[] };

export function whyPerformed(p: Post, all: Post[]): Why {
  const cap = (p.caption || p.hook || "").trim();
  const tags = cap.match(/#\w+/g) || [];
  const text = cap.replace(/#\w+/g, "").trim();
  const isReel = /reel/i.test(p.type || "");
  const peers = all.filter((x) => x !== p);

  const avgLikes = avg(peers.map(likesOf));
  const reelViews = peers.filter((x) => /reel/i.test(x.type || "") && viewsOf(x) > 0).map(viewsOf);
  const likeRatio = avgLikes ? likesOf(p) / avgLikes : 0;
  const viewRatio = reelViews.length && viewsOf(p) ? viewsOf(p) / avg(reelViews) : 0;

  const content: string[] = [], desc: string[] = [], hash: string[] = [];

  // content: format + hook
  if (isReel) content.push(viewsOf(p) ? "Reel format, which gets pushed to non-followers" : "Reel format");
  else if (/carousel|album/i.test(p.type || "")) content.push("Carousel format, which encourages saves and swipes");
  const hook = text.split(/\n/)[0].slice(0, 90);
  if (hook && /[?!]/.test(hook)) content.push(`Attention hook: "${hook.length > 60 ? hook.slice(0, 60) + "…" : hook}"`);

  // description: offer, CTA, urgency, length
  if (/₹\s?\d+|\brs\.?\s?\d+|\b\d+\s?(rs|inr)\b/i.test(text)) desc.push("clear price in the caption");
  if (CTA.test(text)) desc.push("direct call to action (DM / comment / contact)");
  if (URGENT.test(text)) desc.push("urgency or seasonal hook (offer, drop, limited)");
  if (/\?/.test(text)) desc.push("asks the audience a question");
  if (emojiCount(text) >= 2) desc.push("emoji-led, casual tone");
  if (text.length > 0 && text.length < 90) desc.push("short, easy-to-scan caption");

  // hashtags
  if (tags.length >= 3 && tags.length <= 12) hash.push(`${tags.length} focused hashtags (${tags.slice(0, 3).join(" ")})`);
  else if (tags.length > 15) hash.push(`${tags.length} hashtags, which is a lot and can dilute reach`);
  else if (tags.length === 0) hash.push("no hashtags, so reach came from the content itself, not tags");
  else hash.push(`${tags.length} hashtag${tags.length > 1 ? "s" : ""}`);

  // which bucket explains it most (hashtag "no tags" counts as a weak signal)
  const score = { Content: content.length * 1.2 + (viewRatio > 1.5 ? 1.5 : 0), Description: desc.length, Hashtags: tags.length >= 3 && tags.length <= 12 ? 1.5 : 0 };
  const top = (Object.entries(score) as [Why["driver"], number][]).sort((a, b) => b[1] - a[1]);
  const driver: Why["driver"] = top[0][1] === 0 || top[0][1] - top[1][1] < 0.3 ? "Mixed" : top[0][0];

  const points: string[] = [];
  if (likeRatio >= 1.25) points.push(`Likes are ${likeRatio.toFixed(1)}× your average`);
  else if (likeRatio > 0 && likeRatio <= 0.75) points.push(`Likes are only ${likeRatio.toFixed(1)}× your average`);
  if (viewRatio >= 1.25) points.push(`Views are ${viewRatio.toFixed(1)}× your average Reel`);
  if (content.length) points.push("Content: " + content.join("; "));
  if (desc.length) points.push("Description: " + desc.slice(0, 3).join(", "));
  if (hash.length) points.push("Hashtags: " + hash[0]);

  const headline =
    driver === "Mixed" ? "No single clear driver; several small signals"
    : driver === "Content" ? `Mostly the content: ${content[0]?.toLowerCase()}`
    : driver === "Description" ? `Mostly the caption: ${desc.slice(0, 2).join(" + ")}`
    : "Mostly the hashtags";
  return { driver, headline, points };
}

export const latest = (posts: Post[], k = 3) =>
  [...posts].sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0, k);
export const topBy = (posts: Post[], f: (p: Post) => number, k = 3) =>
  [...posts].filter((p) => f(p) > 0).sort((a, b) => f(b) - f(a)).slice(0, k);
