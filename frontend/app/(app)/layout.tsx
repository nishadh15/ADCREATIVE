"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getToken } from "@/lib/api";
import { StoreProvider } from "@/lib/store";
export default function AppShell({ children }: { children: React.ReactNode }) {
  const r = useRouter(); const [ok, setOk] = useState(false);
  useEffect(() => { getToken() ? setOk(true) : r.replace("/login"); }, [r]);
  if (!ok) return null;
  return (<StoreProvider><div className="flex min-h-screen"><Sidebar /><main className="min-w-0 flex-1 p-5 md:p-10">
    <div className="mb-4 flex justify-end"><button className="text-xs text-neutral-500 hover:text-white" onClick={() => { localStorage.removeItem("bh_token"); r.replace("/login"); }}>Sign out</button></div>{children}</main></div></StoreProvider>);
}
