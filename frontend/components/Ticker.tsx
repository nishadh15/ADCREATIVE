/** Scrolling brand tape across the top of the app (desktop). */
export default function Ticker() {
  const t = "BLANK HANGER ✦ OVERSIZED TEES ✦ ACID WASH ✦ COTTON BAGGY PANTS ✦ HOODIES ✦ COMBOS ✦ ";
  const row = t.repeat(4);
  return (
    <div className="no-print hidden overflow-hidden border-b-[3px] border-ink bg-ink py-1.5 lg:block" aria-hidden>
      <div className="flex w-max animate-slide whitespace-nowrap font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-lime">
        <span>{row}</span><span>{row}</span>
      </div>
    </div>
  );
}
