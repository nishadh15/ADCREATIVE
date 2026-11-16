import { useId } from "react";

export function Line({ data }: { data: number[]; color?: string }) {
  const id = useId().replace(/:/g, "");
  if (data.length < 2) return <div className="py-6 font-mono text-xs text-neutral-500">// not enough data</div>;
  const w = 300, h = 96, mn = Math.min(...data), mx = Math.max(...data), r = mx - mn || 1;
  const xy = data.map((v, i) => [(i / (data.length - 1)) * w, h - 8 - ((v - mn) / r) * (h - 18)] as const);
  const d = xy.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");   // hard angles, no smoothing
  const last = xy[xy.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full overflow-visible" preserveAspectRatio="none">
      <defs><pattern id={`h${id}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="6" fill="#FF5A14" /></pattern></defs>
      <path d={`${d} L${w},${h} L0,${h} Z`} fill={`url(#h${id})`} opacity="0.55" />
      <path d={d} fill="none" stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="miter" vectorEffect="non-scaling-stroke" />
      <rect x={last[0] - 5} y={last[1] - 5} width="10" height="10" fill="#C6FF00" stroke="#0A0A0A" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function Bars({ items, fmt = (v: number) => v.toFixed(1) }: { items: { key: string; value: number }[]; fmt?: (v: number) => string }) {
  if (!items.length) return <div className="py-6 font-mono text-xs text-neutral-500">// no data</div>;
  const mx = Math.max(...items.map((i) => i.value), 0.0001);
  return (
    <div className="space-y-3.5">
      {items.map((i, n) => (
        <div key={i.key} className="text-xs">
          <div className="mb-1 flex justify-between font-bold uppercase tracking-wide"><span>{i.key}</span><span className="font-mono tabular-nums">{fmt(i.value)}</span></div>
          <div className="h-5 border-[3px] border-ink bg-bone">
            <div className="h-full origin-left animate-grow border-r-[3px] border-ink bg-accent" style={{ width: `${(i.value / mx) * 100}%`, animationDelay: `${n * 80}ms` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Brutalist card: hard border + offset shadow, with a black title tab. */
export const Card = ({ title, badge, children }: { title: string; badge?: React.ReactNode; children: React.ReactNode }) => (
  <div className="relative border-[3px] border-ink bg-bone p-5 pt-7 shadow-brut">
    <span className="tag absolute -top-3 left-4">{title}</span>
    {badge && <span className="absolute -top-3 right-4">{badge}</span>}
    {children}
  </div>
);

/** Vertical column chart with hard borders. `hi` highlights a column in lime. */
export function Columns({ items, fmt = (v: number) => String(Math.round(v)), color = "bg-accent" }: { items: { label: string; value: number; hi?: boolean }[]; fmt?: (v: number) => string; color?: string }) {
  if (!items.length) return <div className="py-6 font-mono text-xs text-neutral-500">// no data</div>;
  const mx = Math.max(...items.map((i) => i.value), 0.0001);
  const vals = items.length <= 14;
  const every = Math.ceil(items.length / 14);
  return (
    <div>
      <div className="flex h-44 items-stretch gap-1.5 border-b-[3px] border-ink px-1 pt-5">
        {items.map((i, n) => {
          const pct = Math.max(3, (i.value / mx) * 100);
          return (
            <div key={n} className="relative min-w-0 flex-1" title={`${i.label}: ${fmt(i.value)}`}>
              <div className={`absolute inset-x-0 bottom-0 origin-bottom animate-growy border-[2px] border-ink ${i.hi ? "bg-lime" : color}`} style={{ height: `${pct}%`, animationDelay: `${n * 40}ms` }} />
              {vals && <span className="absolute inset-x-0 text-center font-mono text-[9px] font-bold" style={{ bottom: `calc(${pct}% + 3px)` }}>{fmt(i.value)}</span>}
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-1.5 px-1">
        {items.map((i, n) => <div key={n} className="min-w-0 flex-1 truncate text-center font-mono text-[9px] font-bold uppercase text-neutral-500">{n % every === 0 ? i.label : ""}</div>)}
      </div>
    </div>
  );
}

const SEG = ["bg-accent", "bg-lime", "bg-ink", "bg-peach", "bg-paper"];
/** 100% stacked bar with a legend. */
export function Stacked({ items }: { items: { label: string; value: number }[] }) {
  const tot = items.reduce((s, i) => s + i.value, 0);
  if (!tot) return <div className="py-6 font-mono text-xs text-neutral-500">// no data</div>;
  return (
    <div>
      <div className="flex h-10 border-[3px] border-ink">
        {items.map((i, n) => <div key={i.label} className={`${SEG[n % SEG.length]} ${n ? "border-l-[3px] border-ink" : ""}`} style={{ width: `${(i.value / tot) * 100}%` }} />)}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {items.map((i, n) => (
          <li key={i.label} className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase">
            <span className={`h-3 w-3 border-2 border-ink ${SEG[n % SEG.length]}`} />{i.label} · {i.value} ({Math.round((i.value / tot) * 100)}%)
          </li>
        ))}
      </ul>
    </div>
  );
}
