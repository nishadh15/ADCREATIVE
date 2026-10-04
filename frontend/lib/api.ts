export const API = process.env.NEXT_PUBLIC_API_URL ?? "";
export const getToken = () => (typeof window === "undefined" ? null : localStorage.getItem("bh_token"));
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API) throw new Error("NEXT_PUBLIC_API_URL is not set");
  const t = getToken();
  const r = await fetch(API + path, { ...init, headers: { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}), ...init.headers } });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail ?? `Request failed (${r.status})`);
  return r.json();
}
