"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api } from "./api";
const empty: any = { daily: [], posts: [], ads: [], src: { daily: "none", posts: "none", ads: "none" }, calendar: [], actions: [], brief: null, profile: null, synced_at: null };
const Ctx = createContext<any>(null);
export const useStore = () => useContext(Ctx);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [d, setD] = useState<any>(empty); const [ready, setReady] = useState(false); const [syncing, setSyncing] = useState(false); const t = useRef<any>(null); const tried = useRef(false);
  useEffect(() => { api("/api/store/workspace").then((r) => setD({ ...empty, ...(r.value || {}) })).catch(() => {}).finally(() => setReady(true)); }, []);
  const update = useCallback((p: any) => {
    setD((o: any) => { const n = { ...o, ...(typeof p === "function" ? p(o) : p) }; clearTimeout(t.current);
      t.current = setTimeout(() => api("/api/store/workspace", { method: "PUT", body: JSON.stringify({ value: n }) }).catch(() => {}), 800); return n; });
  }, []);
  // Pull the live Instagram profile + recent posts (read-only) so every page, and the AI, works from the real account.
  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      const r = await api("/api/instagram/sync");
      update((o: any) => ({ posts: r.posts || [], profile: r.profile || null, synced_at: new Date().toISOString(), src: { ...o.src, posts: "real" } }));
      return true;
    } catch { return false; } finally { setSyncing(false); }
  }, [update]);
  useEffect(() => {
    if (!ready || tried.current) return; tried.current = true;
    const stale = !d.synced_at || Date.now() - new Date(d.synced_at).getTime() > 6 * 3600 * 1000;
    if (d.src?.posts !== "user" && (stale || !d.profile)) sync();
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps
  const queueAction = (a: any) => update((o: any) => ({ actions: [{ id: Date.now(), status: "pending", created: new Date().toISOString(), requires_approval: true, ...a }, ...o.actions] }));
  const decide = (id: number, status: string) => update((o: any) => ({ actions: o.actions.map((x: any) => (x.id === id ? { ...x, status, decided: new Date().toISOString() } : x)) }));
  return <Ctx.Provider value={{ d, ready, syncing, sync, update, queueAction, decide }}>{children}</Ctx.Provider>;
}
