const S = {
  real: "bg-lime",
  demo: "bg-peach",
  user: "bg-paper",
  ai: "bg-accent",
} as const;
const L = { real: "REAL", demo: "DEMO", user: "USER DATA", ai: "AI INSIGHT" } as const;
export default function Badge({ kind }: { kind: keyof typeof S }) {
  return <span className={`inline-block border-2 border-ink px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-ink shadow-[2px_2px_0_0_#0A0A0A] ${S[kind]}`}>{L[kind]}</span>;
}
