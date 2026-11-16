import { useId } from "react";

export function Line({ data, color = "#FF8A4C" }: { data: number[]; color?: string }) {
  const id = useId().replace(/:/g, "");
  if (data.length < 2) return <div className="py-6 text-xs text-neutral-500">Not enough data</div>;
  const w = 300, h = 96, mn = Math.min(...data), mx = Math.max(...data), r = mx - mn || 1;
  const xy = data.map((v, i) => [(i / (data.length - 1)) * w, h - 8 - ((v - mn) / r) * (h - 18)] as const);
  // smooth path (midpoint quadratic curves)
  let d = `M${xy[0][0]},${xy[0][1]}`;
  for (let i = 1; i < xy.length; i++) { const [px, py] = xy[i - 1], [cx, cy] = xy[i]; d += ` Q${px},${py} ${(px + cx) / 2},${(py + cy) / 2}`; }
  d += ` T${xy[xy.length - 1][0]},${xy[xy.length - 1][1]}`;
  const last = xy[xy.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full overflow-visible" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`a${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.35" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient>
      </defs>
      <path d={`${d} L${w},${h} L0,${h} Z`} fill={`url(#a${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ filter: `drop-shadow(0 0 6px ${color}99)` }} />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill={color} />
    </svg>
  );
}

export function Bars({ items, fmt = (v: number) => v.toFixed(1) }: { items: { key: string; value: number }[]; fmt?: (v: number) => string }) {
  if (!items.length) return <div className="py-6 text-xs text-neutral-500">No data</div>;
  const mx = Math.max(...items.map((i) => i.value), 0.0001);
  return (
    <div className="space-y-3.5">
      {items.map((i, n) => (
        <div key={i.key} className="text-xs">
          <div className="mb-1.5 flex justify-between text-neutral-400"><span>{i.key}</span><span className="tabular-nums text-neutral-200">{fmt(i.value)}</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full origin-left animate-grow rounded-full bg-gradient-to-r from-accent to-violet" style={{ width: `${(i.value / mx) * 100}%`, animationDelay: `${n * 90}ms` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Double-bezel card: machined outer shell + inner glass core. */
export const Card = ({ title, badge, children }: { title: string; badge?: React.ReactNode; children: React.ReactNode }) => (
  <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-1.5 transition-transform duration-700 ease-fluid hover:-translate-y-0.5">
    <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#0a0a0a]/80 p-5 shadow-core">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">{title}</span>{badge}
      </div>
      {children}
    </div>
  </div>
);
