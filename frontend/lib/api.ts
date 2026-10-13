export const API = (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

export const getToken = () => (typeof window === "undefined" ? null : localStorage.getItem("bh_token"));

export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL / NEXT_PUBLIC_API_URL is not set");
  }

  // Ensure path always starts with a slash
  let cleanPath = path.startsWith("/") ? path : `/${path}`;

  // Normalize route to avoid 404s if /api/ prefix is omitted by mistake
  if (!cleanPath.startsWith("/api/")) {
    cleanPath = `/api${cleanPath}`;
  }

  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API}${cleanPath}`, {
    ...init,
    headers,
  });

  // Handle session expiration
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