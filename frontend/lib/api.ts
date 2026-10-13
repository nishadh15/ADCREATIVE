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