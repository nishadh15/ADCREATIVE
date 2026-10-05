const label = (k: string) => k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
export default function JsonView({ v, depth = 0 }: { v: any; depth?: number }) {
  if (v == null || v === "") return <span className="text-neutral-600">—</span>;
  if (Array.isArray(v)) {
    if (v.every((x) => typeof x !== "object")) return <div className="flex flex-wrap gap-1.5">{v.map((x, i) => <span key={i} className="rounded-full bg-white/5 px-2.5 py-1 text-xs">{String(x)}</span>)}</div>;
    return <div className={depth === 0 ? "grid gap-3 lg:grid-cols-2" : "space-y-2"}>{v.map((x, i) => <div key={i} className="rounded-lg border border-line bg-ink/60 p-3"><JsonView v={x} depth={depth + 1} /></div>)}</div>;
  }
  if (typeof v === "object") return <dl className="space-y-2 text-sm">{Object.entries(v).map(([k, x]) => <div key={k}><dt className="text-[11px] font-semibold uppercase tracking-wider text-accent">{label(k)}</dt><dd className="mt-0.5 text-neutral-200"><JsonView v={x} depth={depth + 1} /></dd></div>)}</dl>;
  return <span className="whitespace-pre-wrap">{String(v)}</span>;
}
