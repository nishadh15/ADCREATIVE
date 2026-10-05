import AIPage from "@/components/AIPage";
export default function P() { return <AIPage title="Competitor Intelligence" module="competitor_analyzer" cta="Analyse" desc="Find content gaps and opportunities, not things to copy."
  note="Claude can't log into Instagram. It uses public web information and anything you paste below, and flags what's unverified. Paste real observations for the best results."
  fields={[{ name: "usernames", label: "Competitor usernames (comma-separated)" }, { name: "observations", label: "Your observations (optional): posting rhythm, formats, offers you've seen", type: "textarea" }]} />; }
