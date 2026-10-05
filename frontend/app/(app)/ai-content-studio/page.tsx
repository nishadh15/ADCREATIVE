import AIPage from "@/components/AIPage";
export default function P() { return <AIPage title="AI Content Studio" module="content_studio" cta="Create 5 versions" desc="Upload a product photo or describe it; get Viral, Sales, Funny, Premium and College versions."
  action={{ type: "schedule_post", text: "Publish generated content to Instagram" }}
  fields={[{ name: "product", label: "Product", placeholder: "Acid-wash oversized tee" }, { name: "image", label: "Product photo (optional)", type: "image" }, { name: "description", label: "Description / price / offer", type: "textarea" }]} />; }
