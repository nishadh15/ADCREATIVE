"use client";
import { useState } from "react";
import { latest, topBy, likesOf, viewsOf, whyPerformed, type Post } from "@/lib/postInsights";

const TABS = [
  { id: "latest", label: "Latest 3" },
  { id: "views", label: "Top viewed" },
  { id: "likes", label: "Top liked" },
] as const;
const DRIVER_STYLE: Record<string, string> = {
  Content: "bg-lime",
  Description: "bg-accent",
  Hashtags: "bg-peach",
  Mixed: "bg-paper",
};
const fmt = (v: any) => Math.round(Number(v) || 0).toLocaleString("en-IN");

export default function PostHighlights({ posts }: { posts: Post[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("latest");
  if (!posts.length) return null;
  const list = tab === "latest" ? latest(posts) : tab === "views" ? topBy(posts, viewsOf) : topBy(posts, likesOf);

  return (
    <div className="relative border-[3px] border-ink bg-bone p-5 pt-8 shadow-brut">
      <span className="tag absolute -top-3 left-4">Post performance</span>
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`border-[3px] border-ink px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-100 ${tab === t.id ? "translate-x-0.5 translate-y-0.5 bg-ink text-lime shadow-none" : "bg-bone text-ink shadow-brutsm hover:-translate-x-px hover:-translate-y-px hover:bg-lime"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="py-6 font-mono text-sm font-bold text-neutral-500">
          // {tab === "views" ? "No view counts yet. Instagram only reports views for Reels." : "No data for this view."}
        </p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          {list.map((p, i) => {
            const why = whyPerformed(p, posts);
            return (
              <div key={i} className="flex animate-rise flex-col border-[3px] border-ink bg-bone shadow-brutsm" style={{ animationDelay: `${i * 70}ms` }}>
                <div className="flex items-center justify-between border-b-[3px] border-ink bg-paper px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider">
                  <span>{tab !== "latest" && <b className="mr-2 bg-accent px-1.5">#{i + 1}</b>}{p.type || "Post"}</span>
                  <span>{p.date}</span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1 font-display text-3xl leading-none tabular-nums">
                    <span>♥ {fmt(p.likes)}</span>
                    <span className="text-neutral-500">● {fmt(p.comments)}</span>
                    {viewsOf(p) > 0 && <span className="bg-lime px-1">▶ {fmt(p.views)}</span>}
                  </div>
                  <p className="line-clamp-3 text-xs font-medium leading-relaxed text-neutral-500">{p.caption || p.hook || "No caption."}</p>

                  <div className="mt-4 border-t-[3px] border-ink pt-3">
                    <span className={`inline-block border-2 border-ink px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] ${DRIVER_STYLE[why.driver]}`}>Driver: {why.driver}</span>
                    <p className="mt-2 text-xs font-bold leading-snug">{why.headline}</p>
                    <ul className="mt-2 space-y-1 text-[11px] font-medium leading-snug text-neutral-500">
                      {why.points.slice(0, 3).map((pt) => <li key={pt}>■ {pt}</li>)}
                    </ul>
                  </div>
                  {p.permalink && (
                    <a href={p.permalink} target="_blank" rel="noopener noreferrer" className="tap mt-4 self-start border-2 border-ink bg-bone px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0_0_#0A0A0A] transition-all duration-100 hover:bg-lime active:translate-x-px active:translate-y-px active:shadow-none">
                      Open on Instagram ↗
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-5 font-mono text-[11px] font-bold text-neutral-500">// Reasons are inferred from caption, hashtags and format. Signals, not proof: Instagram doesn't say why a post performed.</p>
    </div>
  );
}
