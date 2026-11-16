"use client";
import CopyButton, { copyText } from "./CopyButton";

const GROUPS: [string, string][] = [
  ["high_volume", "High volume"], ["medium_volume", "Medium volume"], ["low_competition", "Low competition"], ["niche", "Niche"],
  ["product", "Product"], ["location", "Location"], ["audience", "Audience"], ["campaign", "Campaign"],
];
const AVOID: [string, string][] = [["overused", "Overused"], ["irrelevant", "Irrelevant"], ["low_value", "Low value"]];
const TONES = ["bg-lime", "bg-bone", "bg-peach", "bg-paper"];

/** "#Foo Bar" / "foo" / " #foo " -> "#foobar"; drops junk and duplicates. */
export function cleanTags(a: any): string[] {
  const seen = new Set<string>(), out: string[] = [];
  for (const raw of Array.isArray(a) ? a : []) {
    const t = "#" + String(raw ?? "").replace(/^#+/, "").replace(/[^\p{L}\p{N}_]/gu, "");
    if (t.length > 1 && !seen.has(t.toLowerCase())) { seen.add(t.toLowerCase()); out.push(t); }
  }
  return out;
}

const Chip = ({ t, tone = "bg-bone" }: { t: string; tone?: string }) => (
  <button type="button" title="Click to copy" onClick={() => copyText(t)}
    className={`border-2 border-ink px-2.5 py-0.5 font-mono text-xs font-bold text-ink shadow-[2px_2px_0_0_#0A0A0A] transition-all duration-100 hover:-translate-y-px hover:bg-accent active:translate-x-px active:translate-y-px active:shadow-none ${tone}`}>{t}</button>
);

export default function HashtagView({ v }: { v: any }) {
  const mix = cleanTags(v?.recommended_mix);
  const groups = GROUPS.map(([k, l]) => [l, cleanTags(v?.sets?.[k])] as const).filter(([, t]) => t.length);
  const avoid = AVOID.map(([k, l]) => [l, cleanTags(v?.avoid?.[k])] as const).filter(([, t]) => t.length);
  const all = new Set(groups.flatMap(([, t]) => t).map((t) => t.toLowerCase())).size;

  if (!mix.length && !groups.length) return <p className="border-[3px] border-ink bg-bone p-5 text-sm font-bold shadow-brutsm">The AI returned no hashtags this time. Press the button again.</p>;

  return (
    <div className="space-y-6">
      {mix.length > 0 && (
        <div className="border-[3px] border-ink bg-accent p-5 shadow-[8px_8px_0_0_#0A0A0A]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="font-display text-3xl uppercase leading-none">Ready to paste</div>
              <div className="mt-1 font-mono text-[11px] font-bold uppercase tracking-wider">{mix.length} hashtags · recommended mix</div>
            </div>
            <CopyButton text={mix.join(" ")} label="Copy all" />
          </div>
          <p className="select-all border-[3px] border-ink bg-bone p-4 font-mono text-sm font-bold leading-7">{mix.join(" ")}</p>
        </div>
      )}

      {groups.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2">
          {groups.map(([l, tags], gi) => (
            <div key={l} className={`border-[3px] border-ink p-4 shadow-brut ${TONES[gi % TONES.length]}`}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="font-display text-xl uppercase leading-none">{l} <span className="font-mono text-xs">[{tags.length}]</span></span>
                <CopyButton text={tags.join(" ")} />
              </div>
              <div className="flex flex-wrap gap-2">{tags.map((t) => <Chip key={t} t={t} />)}</div>
            </div>
          ))}
        </div>
      )}

      {avoid.length > 0 && (
        <div className="border-[3px] border-dashed border-ink bg-bone p-4">
          <div className="mb-3 font-display text-xl uppercase leading-none text-red-300">✕ Avoid</div>
          <div className="space-y-3">{avoid.map(([l, tags]) => (
            <div key={l}><div className="mb-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-500">{l}</div>
              <div className="flex flex-wrap gap-2">{tags.map((t) => <Chip key={t} t={t} tone="bg-paper line-through decoration-2" />)}</div></div>
          ))}</div>
        </div>
      )}

      <p className="font-mono text-[11px] font-bold text-neutral-500">// {all} unique tags. Tap a tag to copy it. {v?.notes ? v.notes : "Volumes are estimates; check counts in Instagram search."}</p>
    </div>
  );
}
