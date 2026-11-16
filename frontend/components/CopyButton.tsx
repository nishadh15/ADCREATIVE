"use client";
import { useState } from "react";

export async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    // fallback for non-secure contexts / older browsers
    const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); document.body.removeChild(ta); return ok;
  }
}

export default function CopyButton({ text, label = "Copy", primary = false }: { text: string; label?: string; primary?: boolean }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" onClick={async () => { if (await copyText(text)) { setOk(true); setTimeout(() => setOk(false), 1500); } }}
      className={`shrink-0 border-2 border-ink px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-ink shadow-brutsm transition-all duration-100 hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_#0A0A0A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${ok ? "bg-lime" : primary ? "bg-accent" : "bg-bone hover:bg-lime"}`}>
      {ok ? "Copied ✓" : label}
    </button>
  );
}
