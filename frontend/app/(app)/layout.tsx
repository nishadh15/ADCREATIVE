"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getToken } from "@/lib/api";
export default function AppShell({ children }: { children: React.ReactNode }) {
  const r = useRouter(); const [ok, setOk] = useState(false);
  useEffect(() => { getToken() ? setOk(true) : r.replace("/login"); }, [r]);
  if (!ok) return null;
  return <div className="flex min-h-screen"><Sidebar /><main className="flex-1 p-6 md:p-10">{children}</main></div>;
}
