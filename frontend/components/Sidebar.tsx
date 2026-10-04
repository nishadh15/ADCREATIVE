"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const NAV = ["Dashboard","Instagram Analytics","Trend Radar","Content Calendar","AI Content Studio","Reel Generator","Hashtag Lab","Ad Studio","Competitor Intelligence","Campaign Analytics","AI Marketing Agent","Reports","Settings"];
const slug = (n: string) => n.toLowerCase().replace(/ /g, "-");
export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="hidden w-64 shrink-0 border-r border-line bg-panel p-5 md:block">
      <div className="mb-8 text-sm font-bold tracking-[0.2em]">BLANK HANGER<span className="text-accent"> AI</span></div>
      <nav className="space-y-1">
        {NAV.map((n) => {
          const href = "/" + slug(n), on = path === href;
          return <Link key={n} href={href} className={`block rounded-lg px-3 py-2 text-sm ${on ? "bg-accent/15 text-accent" : "text-neutral-400 hover:bg-white/5"}`}>{n}</Link>;
        })}
      </nav>
    </aside>
  );
}
