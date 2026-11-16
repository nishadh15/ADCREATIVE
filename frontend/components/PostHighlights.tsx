"use client";
import { useState } from "react";
import { latest, topBy, likesOf, viewsOf, whyPerformed, type Post } from "@/lib/postInsights";

const TABS = [
  { id: "latest", label: "Latest 3" },
  { id: "views", label: "Top viewed" },
  { id: "likes", label: "Top liked" },
] as const;
const DRIVER_STYLE: Record<string, string> = {
  Content: "bg-sky-400/10 text-sky-300 ring-sky-400/20",
  Description: "bg-amber-400/10 text-amber-300 ring-amber-400/20",
  Hashtags: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
  Mixed: "bg-white/5 text-neutral-300 ring-white/10",
};
const fmt = (v: any) => Math.round(Number(v) || 0).toLocaleString("en-IN");

export default function PostHighlights({ posts }: { posts: Post[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("latest");
  if (!posts.length) return null;
  const list = tab === "latest" ? latest(posts) : tab === "views" ? topBy(posts, viewsOf) : topBy(posts, likesOf);

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-1.5">
      <div className="rounded-[calc(2rem-0.375rem)] bg-[#0a0a0a]/80 p-5 shadow-core">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">Post performance</span>
          <div className="flex gap-1 rounded-full bg-white/[0.05] p-1">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`rounded-full px-4 py-1.5 text-xs transition-all duration-500 ease-fluid ${tab === t.id ? "bg-white/[0.12] text-white shadow-core" : "text-neutral-500 hover:text-neutral-200"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {list.length === 0 ? (
          <p className="py-6 text-sm text-neutral-500">
            {tab === "views" ? "No view counts yet. Instagram only reports views for Reels." : "No data for this view."}
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {list.map((p, i) => {
              const why = whyPerformed(p, posts);
              const Wrap: any = p.permalink ? "a" : "div";
              return (
                <div key={i} className="flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 animate-rise" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                    <span>{tab !== "latest" && <b className="mr-2 text-accent">#{i + 1}</b>}{p.type || "Post"}</span>
                    <span>{p.date}</span>
                  </div>
                  <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-sm tabular-nums">
                    <span className="text-accent">♥ {fmt(p.likes)}</span>
                    <span className="text-violet">● {fmt(p.comments)}</span>
                    {viewsOf(p) > 0 && <span className="text-sky-300">▶ {fmt(p.views)}</span>}
                  </div>
                  <p className="line-clamp-3 text-xs leading-relaxed text-neutral-400">{p.caption || p.hook || "No caption."}</p>

                  <div className="mt-4 border-t border-white/[0.06] pt-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] ring-1 ring-inset ${DRIVER_STYLE[why.driver]}`}>{why.driver}</span>
                    <p className="mt-2 text-xs font-medium leading-snug text-neutral-200">{why.headline}</p>
                    <ul className="mt-2 space-y-1 text-[11px] leading-snug text-neutral-500">
                      {why.points.slice(0, 3).map((pt) => <li key={pt}>· {pt}</li>)}
                    </ul>
                  </div>
                  {p.permalink && (
                    <Wrap href={p.permalink} target="_blank" rel="noopener noreferrer" className="mt-4 self-start text-[11px] text-neutral-500 underline-offset-4 transition-colors duration-500 hover:text-accent hover:underline">
                      Open on Instagram ↗
                    </Wrap>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-4 text-[11px] text-neutral-600">Reasons are inferred from the caption, hashtags and format. They are signals, not proof; Instagram doesn't say why a post performed.</p>
      </div>
    </div>
  );
}
