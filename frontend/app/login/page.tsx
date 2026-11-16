"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function Login() {
  const router = useRouter(); 
  const [email, setEmail] = useState(""); 
  const [pw, setPw] = useState(""); 
  const [err, setErr] = useState(""); 
  const [busy, setBusy] = useState(false);

  async function submit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setBusy(true); 
    setErr("");

    try { 
      const data = await api<{ access_token: string }>("/api/auth/login", { 
        method: "POST", 
        body: JSON.stringify({ email, password: pw }) 
      }); 
      
      localStorage.setItem("bh_token", data.access_token); 
      router.push("/dashboard"); 
    } catch (error) { 
      setErr((error as Error).message); 
    } finally { 
      setBusy(false); 
    }
  }

  const field = "w-full rounded-2xl border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:border-accent/60";
  return (
    <div className="grid min-h-[100dvh] place-items-center px-4 py-12">
      <div className="w-full max-w-md animate-rise">
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400">AI Marketing Manager</span>
        <h1 className="mb-8 mt-5 text-5xl font-semibold leading-[1.05] tracking-tight">
          Blank Hanger<br /><span className="bg-gradient-to-r from-accent to-violet bg-clip-text text-transparent">AI, on autopilot.</span>
        </h1>
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-1.5">
          <form onSubmit={submit} className="space-y-3 rounded-[calc(2rem-0.375rem)] bg-[#0a0a0a]/90 p-7 shadow-core">
            <input className={field} placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className={field} type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} required />
            {err && <p className="text-sm text-red-400">{err}</p>}
            <button type="submit" disabled={busy}
              className="group mt-2 flex w-full items-center justify-between bg-accent py-2 pl-6 pr-2 text-sm font-semibold text-ink disabled:opacity-50">
              {busy ? "Signing in…" : "Sign in"}
              <span className="grid h-9 w-9 place-items-center rounded-full bg-black/15 transition-transform duration-700 ease-fluid group-hover:-translate-y-px group-hover:translate-x-1 group-hover:scale-105">↗</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
