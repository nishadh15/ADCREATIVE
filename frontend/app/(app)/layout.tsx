"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Ticker from "@/components/Ticker";
import { getToken } from "@/lib/api";
import { StoreProvider } from "@/lib/store";
export default function AppShell({ children }: { children: React.ReactNode }) {
  const r = useRouter(); const path = usePathname(); const [ok, setOk] = useState(false);
  useEffect(() => { getToken() ? setOk(true) : r.replace("/login"); }, [r]);
  if (!ok) return null;
  return (
    <StoreProvider>
      <Ticker />
      <div className="flex min-h-[100dvh] gap-0 py-4 lg:pr-4">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 pb-[max(4rem,env(safe-area-inset-bottom))] pt-24 sm:px-6 lg:px-10 lg:pt-2">
          <div className="mb-8 hidden justify-end lg:flex">
            <button
              className="border-[3px] border-ink bg-bone px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-ink shadow-brutsm transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-lime hover:shadow-brut active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              onClick={() => { localStorage.removeItem("bh_token"); r.replace("/login"); }}>
              Sign out ↗
            </button>
          </div>
          <div key={path} className="stagger mx-auto w-full max-w-[1500px]">{children}</div>
        </main>
      </div>
    </StoreProvider>
  );
}
