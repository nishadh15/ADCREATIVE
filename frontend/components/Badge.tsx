const S = { real: "bg-emerald-500/15 text-emerald-300", demo: "bg-amber-500/15 text-amber-300", user: "bg-sky-500/15 text-sky-300", ai: "bg-fuchsia-500/15 text-fuchsia-300" } as const;
const L = { real: "REAL", demo: "DEMO", user: "USER DATA", ai: "AI INSIGHT" } as const;
export default function Badge({ kind }: { kind: keyof typeof S }) {
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider ${S[kind]}`}>{L[kind]}</span>;
}
