import AIPage from "@/components/AIPage";
export default function P() { return <AIPage title="Reports" module="report" cta="Generate weekly report" desc="A weekly report from the data currently loaded: wins, problems, scale, stop and test next."
  fields={[{ name: "period", label: "Period", placeholder: "Last 7 days" }]} />; }
