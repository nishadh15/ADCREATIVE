"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api } from "./api";
const empty: any = { daily: [], posts: [], ads: [], src: { daily: "none", posts: "none", ads: "none" }, calendar: [], actions: [], brief: null };
const Ctx = createContext<any>(null);
export const useStore = () => useContext(Ctx);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [d, setD] = useState<any>(empty); const [ready, setReady] = useState(false); const t = useRef<any>(null);
  useEffect(() => { api("/api/store/workspace").then((r) => setD({ ...empty, ...(r.value || {}) })).catch(() => {}).finally(() => setReady(true)); }, []);
  const update = useCallback((p: any) => {
    setD((o: any) => { const n = { ...o, ...(typeof p === "function" ? p(o) : p) }; clearTimeout(t.current);
      t.current = setTimeout(() => api("/api/store/workspace", { method: "PUT", body: JSON.stringify({ value: n }) }).catch(() => {}), 800); return n; });
  }, []);
  const queueAction = (a: any) => update((o: any) => ({ actions: [{ id: Date.now(), status: "pending", created: new Date().toISOString(), requires_approval: true, ...a }, ...o.actions] }));
  const decide = (id: number, status: string) => update((o: any) => ({ actions: o.actions.map((x: any) => (x.id === id ? { ...x, status, decided: new Date().toISOString() } : x)) }));
  return <Ctx.Provider value={{ d, ready, update, queueAction, decide }}>{children}</Ctx.Provider>;
}
