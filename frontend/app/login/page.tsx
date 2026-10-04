"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
export default function Login() {
  const r = useRouter(); const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true); setErr("");
    try { const d = await api<{ access_token: string }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password: pw }) }); localStorage.setItem("bh_token", d.access_token); r.push("/dashboard"); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-line bg-panel p-8">
        <h1 className="text-xl font-bold tracking-wide">Blank Hanger <span className="text-accent">AI</span></h1>
        <input className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm" type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} />
        {err && <p className="text-sm text-red-400">{err}</p>}
        <button onClick={submit} disabled={busy} className="w-full rounded-lg bg-accent py-2 text-sm font-semibold text-ink disabled:opacity-50">{busy ? "Signing in…" : "Sign in"}</button>
      </div>
    </div>
  );
}
