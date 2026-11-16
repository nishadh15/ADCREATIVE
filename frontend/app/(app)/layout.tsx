"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getToken } from "@/lib/api";
import { StoreProvider } from "@/lib/store";
export default function AppShell({ children }: { children: React.ReactNode }) {
  const r = useRouter(); const path = usePathname(); const [ok, setOk] = useState(false);
  useEffect(() => { getToken() ? setOk(true) : r.replace("/login"); }, [r]);
  if (!ok) return null;
  return (
    <StoreProvider>
      <div className="flex min-h-[100dvh] gap-0 py-4 md:pr-4">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 pb-16 pt-24 md:px-10 md:pt-2">
          <div className="mb-8 hidden justify-end md:flex">
            <button
              className="border-[3px] border-ink bg-bone px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-ink shadow-brutsm transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-lime hover:shadow-brut active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              onClick={() => { localStorage.removeItem("bh_token"); r.replace("/login"); }}>
              Sign out ↗
            </button>
          </div>
          <div key={path} className="stagger">{children}</div>
        </main>
      </div>
    </StoreProvider>
  );
}
