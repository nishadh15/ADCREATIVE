import AIPage from "@/components/AIPage";
export default function P() { return <AIPage title="Trend Radar" module="trend_analyzer" cta="Scan trends" desc="AI (Groq / Llama) suggests trends for Indian streetwear and Gen-Z fashion, scored 0–100."
  note="There is no live web search or Instagram trends feed. Trends come from the model's training knowledge, so they may be out of date. Verify audio and trends in Instagram before using."
  fields={[{ name: "focus", label: "Focus (optional)", placeholder: "oversized tees, college fashion, Coimbatore…" }]} />; }
