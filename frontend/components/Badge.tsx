const S = {
  real: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
  demo: "bg-amber-400/10 text-amber-300 ring-amber-400/20",
  user: "bg-sky-400/10 text-sky-300 ring-sky-400/20",
  ai: "bg-fuchsia-400/10 text-fuchsia-300 ring-fuchsia-400/20",
} as const;
const L = { real: "REAL", demo: "DEMO", user: "USER DATA", ai: "AI INSIGHT" } as const;
export default function Badge({ kind }: { kind: keyof typeof S }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] ring-1 ring-inset ${S[kind]}`}>{L[kind]}</span>;
}
