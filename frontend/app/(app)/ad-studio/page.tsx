import AIPage from "@/components/AIPage";
export default function P() { return (<div className="space-y-12">
  <AIPage title="Ad Studio" module="ad_strategist" cta="Plan campaign" desc="Meta ads plan: objective, targeting, copy, budget, placements, testing."
    action={{ type: "create_campaign", text: "Create a Meta ad campaign (spends money once run)", cost: 0, target: "Meta Ads" }}
    fields={[{ name: "type", label: "Campaign type", type: "select", options: ["Brand awareness", "Reach", "Engagement", "Traffic", "Messages", "Sales", "Retargeting"] }, { name: "product", label: "Product / offer" }, { name: "daily_budget", label: "Daily budget (₹)", placeholder: "500" }, { name: "notes", label: "Notes", type: "textarea" }]} />
  <AIPage title="Ad Creative Generator" module="ad_creative" cta="Generate 5 variations" desc="Upload a product image for Price, Problem, Curiosity, Social Proof and Urgency hooks."
    fields={[{ name: "product", label: "Product / offer" }, { name: "image", label: "Product image", type: "image" }]} /></div>); }
