"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = ["Dashboard","Instagram Analytics","Trend Radar","Content Calendar","AI Content Studio","Reel Generator","Hashtag Lab","Ad Studio","Competitor Intelligence","Campaign Analytics","AI Marketing Agent","Reports","Settings"];
const slug = (n: string) => n.toLowerCase().replace(/ /g, "-");

const Logo = () => (
  <div className="flex items-center gap-3">
    <span className="grid h-11 w-11 shrink-0 -rotate-6 place-items-center border-[3px] border-ink bg-accent font-display text-2xl leading-none text-ink shadow-brutsm">B</span>
    <span className="flex flex-col items-start gap-1.5 font-display uppercase">
      <span className="text-[22px] leading-none tracking-wide">Blank Hanger</span>
      <span className="bg-ink px-2 py-[3px] text-[15px] leading-none tracking-[0.12em] text-lime">AI Manager</span>
    </span>
  </div>
);

export default function Sidebar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);

  return (
    <>
      {/* Desktop rail */}
      <aside className="sticky top-4 hidden h-[calc(100dvh-2rem)] w-72 shrink-0 self-start pl-4 md:block">
        <div className="flex h-full flex-col border-[3px] border-ink bg-bone p-5 shadow-[8px_8px_0_0_#0A0A0A]">
          <Logo />
          <p className="mb-2 mt-7 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">// Workspace</p>
          <nav className="no-scrollbar flex-1 space-y-1.5 overflow-y-auto pb-1">
            {NAV.map((n, i) => {
              const href = "/" + slug(n), on = path === href;
              return (
                <Link key={n} href={href}
                  className={`group flex items-center gap-3 border-2 px-3 py-2 text-[13px] font-bold uppercase tracking-wide transition-all duration-100 ${on ? "border-ink bg-ink text-lime shadow-[4px_4px_0_0_#FF5A14]" : "border-transparent text-ink hover:border-ink hover:bg-lime hover:shadow-brutsm"}`}>
                  <span className={`font-mono text-[10px] ${on ? "text-accent" : "text-neutral-600"}`}>{String(i + 1).padStart(2, "0")}</span>
                  {n}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile bar + full-screen menu */}
      <div className="fixed inset-x-0 top-0 z-40 border-b-[3px] border-ink bg-bone px-4 py-3 md:hidden">
        <div className="flex items-center justify-between">
          <Logo />
          <button aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}
            className="relative grid h-11 w-11 place-items-center border-[3px] border-ink bg-lime shadow-brutsm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
            <span className={`absolute h-[3px] w-5 bg-ink transition-transform duration-200 ${open ? "rotate-45" : "-translate-y-1.5"}`} />
            <span className={`absolute h-[3px] w-5 bg-ink transition-opacity duration-200 ${open ? "opacity-0" : "opacity-100"}`} />
            <span className={`absolute h-[3px] w-5 bg-ink transition-transform duration-200 ${open ? "-rotate-45" : "translate-y-1.5"}`} />
          </button>
        </div>
      </div>
      <div className={`fixed inset-0 z-30 bg-accent transition-transform duration-300 ease-fluid md:hidden ${open ? "translate-y-0" : "-translate-y-full"}`}>
        <nav className="flex h-full flex-col justify-center gap-0.5 overflow-y-auto px-6 pb-10 pt-24">
          {NAV.map((n) => (
            <Link key={n} href={"/" + slug(n)} className={`font-display text-4xl uppercase leading-tight ${path === "/" + slug(n) ? "text-bone [text-shadow:3px_3px_0_#0A0A0A]" : "text-ink"}`}>{n}</Link>
          ))}
        </nav>
      </div>
    </>
  );
}
