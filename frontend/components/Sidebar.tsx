"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = ["Dashboard","Instagram Analytics","Trend Radar","Content Calendar","AI Content Studio","Reel Generator","Hashtag Lab","Ad Studio","Competitor Intelligence","Campaign Analytics","AI Marketing Agent","Reports","Settings"];
const slug = (n: string) => n.toLowerCase().replace(/ /g, "-");

const Logo = () => (
  <div className="flex items-center gap-3">
    <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-accent to-violet text-sm font-black text-ink shadow-glow">B</span>
    <span className="text-[13px] font-semibold leading-tight tracking-[0.18em]">BLANK HANGER<br /><span className="text-accent">AI MANAGER</span></span>
  </div>
);

export default function Sidebar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);

  return (
    <>
      {/* Desktop: floating glass rail, double-bezel */}
      <aside className="sticky top-4 hidden h-[calc(100dvh-2rem)] w-72 shrink-0 self-start p-0 pl-4 md:block">
        <div className="h-full rounded-[2rem] border border-white/10 bg-white/[0.03] p-1.5">
          <div className="flex h-full flex-col rounded-[calc(2rem-0.375rem)] bg-[#0a0a0a]/80 p-5 shadow-core">
            <Logo />
            <p className="mb-2 mt-8 px-3 text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">Workspace</p>
            <nav className="-mr-2 flex-1 space-y-0.5 overflow-y-auto pr-2">
              {NAV.map((n) => {
                const href = "/" + slug(n), on = path === href;
                return (
                  <Link key={n} href={href}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-all duration-700 ease-fluid active:scale-[0.98] ${on ? "bg-white/[0.07] text-white shadow-core" : "text-neutral-500 hover:bg-white/[0.04] hover:text-neutral-200"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full transition-all duration-700 ease-fluid ${on ? "scale-100 bg-accent shadow-[0_0_12px_2px_rgba(255,138,76,0.7)]" : "scale-50 bg-neutral-700 group-hover:bg-neutral-500"}`} />
                    {n}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </aside>

      {/* Mobile: floating island + morphing hamburger + full-screen glass menu */}
      <div className="fixed inset-x-0 top-4 z-40 flex justify-center px-4 md:hidden">
        <div className="flex w-full max-w-sm items-center justify-between rounded-full border border-white/10 bg-black/60 py-2 pl-5 pr-2 backdrop-blur-xl shadow-core">
          <Logo />
          <button aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}
            className="relative grid h-10 w-10 place-items-center rounded-full bg-white/10 transition-transform duration-500 ease-fluid active:scale-95">
            <span className={`absolute h-px w-4 bg-white transition-transform duration-700 ease-fluid ${open ? "rotate-45" : "-translate-y-1"}`} />
            <span className={`absolute h-px w-4 bg-white transition-transform duration-700 ease-fluid ${open ? "-rotate-45" : "translate-y-1"}`} />
          </button>
        </div>
      </div>
      <div className={`fixed inset-0 z-30 bg-black/80 backdrop-blur-3xl transition-opacity duration-700 ease-fluid md:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <nav className="flex h-full flex-col justify-center gap-1 overflow-y-auto px-8 pb-10 pt-28">
          {NAV.map((n, i) => (
            <Link key={n} href={"/" + slug(n)} style={{ transitionDelay: open ? `${80 + i * 40}ms` : "0ms" }}
              className={`text-3xl font-semibold tracking-tight transition-all duration-700 ease-fluid ${open ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"} ${path === "/" + slug(n) ? "text-accent" : "text-neutral-300"}`}>
              {n}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
