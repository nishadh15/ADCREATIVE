const rawUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://adcreative-back.onrender.com";

// Strip out any accidental brackets [ ], quotes, or trailing slashes
export const BASE_URL = rawUrl
  .replace(/[\[\]"']/g, "")
  .replace(/\/$/, "");

export const getToken = () =>
  typeof window === "undefined" ? null : localStorage.getItem("bh_token");

export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  // Ensure path starts with a single slash
  let cleanPath = path.startsWith("/") ? path : `/${path}`;

  // Ensure path starts with /api
  if (!cleanPath.startsWith("/api/")) {
    cleanPath = `/api${cleanPath}`;
  }

  const fullUrl = `${BASE_URL}${cleanPath}`;
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init.headers as Record<string, string>) || {}),
  };

  const response = await fetch(fullUrl, {
    ...init,
    headers,
  });

  if (response.status === 401 && !cleanPath.includes("/auth/login") && typeof window !== "undefined") {
    localStorage.removeItem("bh_token");
    window.location.href = "/login";
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed (${response.status})`);
  }

  return response.json();
}
/** Streams /api/ai/chat/stream (server-sent events). Throws code "no-stream" if the backend predates streaming. */
export async function streamChat(body: any, o: { signal?: AbortSignal; onToken: (t: string) => void }): Promise<void> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/api/ai/chat/stream`, {
    method: "POST", signal: o.signal,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  if (res.status === 401 && typeof window !== "undefined") { localStorage.removeItem("bh_token"); window.location.href = "/login"; }
  if (res.status === 404 || res.status === 405) throw Object.assign(new Error("Streaming not available"), { code: "no-stream" });
  if (!res.ok || !res.body) throw new Error((await res.json().catch(() => ({}))).detail || `Request failed (${res.status})`);
  const reader = res.body.getReader(), dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i: number;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const frame = buf.slice(0, i).trim(); buf = buf.slice(i + 2);
      if (!frame.startsWith("data:")) continue;
      const j = JSON.parse(frame.slice(5));
      if (j.error) throw new Error(j.error);
      if (j.t) o.onToken(j.t);
    }
  }
}
