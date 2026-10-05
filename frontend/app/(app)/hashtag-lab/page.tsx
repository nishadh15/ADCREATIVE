import AIPage from "@/components/AIPage";
export default function P() { return <AIPage title="Hashtag Lab" module="hashtag_engine" cta="Build hashtag set" desc="Balanced sets by volume tier, product, location and audience, plus what to avoid."
  note="There is no free live hashtag-volume API, so volume tiers are Claude's estimates. Check counts in Instagram's search before relying on them."
  fields={[{ name: "topic", label: "Post / product", placeholder: "Oversized tee Reel" }, { name: "location", label: "Location focus", placeholder: "Coimbatore, Tamil Nadu" }]} />; }
