import AIPage from "@/components/AIPage";
export default function P() { return <AIPage title="Reel Generator" module="reel_generator" cta="Generate Reel plan" desc="A 15-second shot-by-shot plan with camera, overlays, transitions and audio."
  action={{ type: "schedule_reel", text: "Publish Reel to Instagram" }}
  fields={[{ name: "product", label: "Product" }, { name: "price", label: "Price (₹)" }, { name: "offer", label: "Offer" }, { name: "audience", label: "Target audience", placeholder: "College students, Tamil Nadu" },
    { name: "goal", label: "Goal", type: "select", options: ["Reach", "Engagement", "Followers", "DMs", "Sales", "Brand Awareness"] }, { name: "style", label: "Style", type: "select", options: ["Viral", "Sales", "Funny", "Premium", "College / Gen-Z"] }]} />; }
