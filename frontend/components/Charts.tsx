export function Line({ data, color = "#D97745" }: { data: number[]; color?: string }) {
  if (data.length < 2) return <div className="py-6 text-xs text-neutral-500">Not enough data</div>;
  const w = 300, h = 90, mn = Math.min(...data), mx = Math.max(...data), r = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - 6 - ((v - mn) / r) * (h - 12)}`).join(" ");
  return <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full"><polyline fill="none" stroke={color} strokeWidth="2" points={pts} /></svg>;
}
export function Bars({ items, fmt = (v: number) => v.toFixed(1) }: { items: { key: string; value: number }[]; fmt?: (v: number) => string }) {
  if (!items.length) return <div className="py-6 text-xs text-neutral-500">No data</div>;
  const mx = Math.max(...items.map((i) => i.value), 0.0001);
  return <div className="space-y-2">{items.map((i) => (<div key={i.key} className="text-xs"><div className="mb-1 flex justify-between text-neutral-400"><span>{i.key}</span><span>{fmt(i.value)}</span></div><div className="h-2 rounded bg-white/5"><div className="h-2 rounded bg-accent" style={{ width: `${(i.value / mx) * 100}%` }} /></div></div>))}</div>;
}
export const Card = ({ title, badge, children }: { title: string; badge?: React.ReactNode; children: React.ReactNode }) => (
  <div className="rounded-xl border border-line bg-panel p-4"><div className="mb-3 flex items-center justify-between text-xs text-neutral-400"><span>{title}</span>{badge}</div>{children}</div>);
