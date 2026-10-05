import AIPage from "@/components/AIPage";
export default function P() { return <AIPage title="Trend Radar" module="trend_analyzer" cta="Scan trends" desc="Claude researches current trends for Indian streetwear and Gen-Z fashion, scored 0–100."
  note="Trends come from Claude's web search (when enabled on your API account) plus reasoning, not a live Instagram trends feed. Check the data_notes field and verify audio/trends in Instagram before using."
  fields={[{ name: "focus", label: "Focus (optional)", placeholder: "oversized tees, college fashion, Coimbatore…" }]} />; }
