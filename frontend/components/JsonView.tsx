"use client";
import CopyButton from "./CopyButton";

const label = (k: string) => k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const isEmpty = (v: any) => v == null || v === "" || (Array.isArray(v) && v.length === 0) || (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0);
const scalarList = (a: any[]) => a.every((x) => typeof x !== "object" || x === null);
const joinList = (a: any[]) => (a.every((x) => String(x).startsWith("#")) ? a.join(" ") : a.join("\n"));

/** Clean, paste-ready plain text for any AI result. */
export function toText(v: any, depth = 0): string {
  const pad = "  ".repeat(depth);
  if (isEmpty(v)) return "";
  if (Array.isArray(v)) {
    if (scalarList(v)) return v.every((x) => String(x).startsWith("#")) ? pad + v.join(" ") : v.map((x) => `${pad}- ${x}`).join("\n");
    return v.map((x, i) => `${pad}${i + 1}.\n${toText(x, depth + 1)}`).join("\n\n");
  }
  if (typeof v === "object") {
    return Object.entries(v).filter(([, x]) => !isEmpty(x)).map(([k, x]) => {
      const t = toText(x, depth + 1);
      return typeof x === "object" ? `${pad}${label(k)}:\n${t}` : `${pad}${label(k)}: ${x}`;
    }).join("\n");
  }
  return pad + String(v);
}

export default function JsonView({ v, depth = 0 }: { v: any; depth?: number }) {
  if (isEmpty(v)) return <span className="text-neutral-600">—</span>;
  if (Array.isArray(v)) {
    if (scalarList(v)) return (
      <div className="flex flex-wrap items-center gap-2">
        {v.map((x, i) => <span key={i} className="border-2 border-ink bg-paper px-2.5 py-0.5 text-xs font-semibold">{String(x)}</span>)}
        <CopyButton text={joinList(v)} />
      </div>
    );
    return <div className={depth === 0 ? "grid gap-5 lg:grid-cols-2" : "space-y-3"}>{v.map((x, i) => (
      <div key={i} className="border-[3px] border-ink bg-bone p-4 shadow-brutsm"><JsonView v={x} depth={depth + 1} /></div>
    ))}</div>;
  }
  if (typeof v === "object") return (
    <dl className="space-y-3 text-sm">
      {Object.entries(v).filter(([, x]) => !isEmpty(x)).map(([k, x]) => (
        <div key={k}>
          <dt className="inline-block bg-ink px-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-lime">{label(k)}</dt>
          <dd className="mt-1.5 font-medium leading-relaxed"><JsonView v={x} depth={depth + 1} /></dd>
        </div>
      ))}
    </dl>
  );
  return <span className="whitespace-pre-wrap">{String(v)}</span>;
}
