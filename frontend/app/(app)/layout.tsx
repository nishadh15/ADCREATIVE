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
        <main className="min-w-0 flex-1 px-4 pb-16 pt-24 md:px-10 md:pt-6">
          <div className="mb-8 hidden justify-end md:flex">
            <button
              className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-4 pr-1.5 text-xs text-neutral-400 transition-all duration-700 ease-fluid hover:text-white active:scale-[0.98]"
              onClick={() => { localStorage.removeItem("bh_token"); r.replace("/login"); }}>
              Sign out
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 transition-transform duration-700 ease-fluid group-hover:translate-x-0.5 group-hover:-translate-y-px">↗</span>
            </button>
          </div>
          <div key={path} className="stagger">{children}</div>
        </main>
      </div>
    </StoreProvider>
  );
}
