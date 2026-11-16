/** Scrolling brand tape across the top of the app (desktop). */
const ITEMS = ["Blank Hanger", "Oversized Tees", "Acid Wash", "Cotton Baggy Pants", "Hoodies", "Combos"];
function Row() {
  return (
    <div className="flex shrink-0 items-center">
      {Array.from({ length: 3 }).flatMap((_, k) => ITEMS.map((t) => (
        <span key={`${k}-${t}`} className="flex items-center">
          <span className="px-5">{t}</span><span className="text-accent">✦</span>
        </span>
      )))}
    </div>
  );
}
export default function Ticker() {
  return (
    <div className="no-print hidden overflow-hidden border-b-[3px] border-ink bg-ink py-1.5 lg:block" aria-hidden>
      <div className="flex w-max animate-slide whitespace-nowrap font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-lime">
        <Row /><Row />
      </div>
    </div>
  );
}
