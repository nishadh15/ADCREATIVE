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

  const field = "w-full px-4 py-3 text-sm placeholder:text-neutral-600";
  return (
    <div className="grid min-h-[100dvh] place-items-center overflow-x-clip px-4 py-14">
      <div className="relative w-full max-w-lg animate-rise">
        <div className="sticker-wrap absolute -right-4 -top-16 z-10 rotate-12 md:-right-14 md:-top-20">
          <div className="sticker h-32 w-32 p-4 md:h-40 md:w-40"><span className="font-display text-xl uppercase leading-[0.95] md:text-2xl">Welcome<br />back!</span></div>
        </div>
        <span className="tag">AI Marketing Manager</span>
        <h1 className="mb-8 mt-4">Blank Hanger<br /><span className="hl-orange">AI, on autopilot.</span></h1>
        <form onSubmit={submit} className="space-y-4 border-[3px] border-ink bg-paper p-6 shadow-[10px_10px_0_0_#0A0A0A]">
          <label className="block font-mono text-[11px] font-bold uppercase tracking-wider">Email
            <input className={field + " mt-1"} placeholder="you@brand.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="block font-mono text-[11px] font-bold uppercase tracking-wider">Password
            <input className={field + " mt-1"} type="password" placeholder="••••••••" value={pw} onChange={(e) => setPw(e.target.value)} required />
          </label>
          {err && <p className="border-[3px] border-ink bg-peach p-3 text-sm font-bold">⚠ {err}</p>}
          <button type="submit" disabled={busy} className="mt-2 flex w-full items-center justify-between bg-accent px-5 py-3 text-base">
            {busy ? "Signing in…" : "Sign in"}<span aria-hidden>→</span>
          </button>
        </form>
      </div>
    </div>
  );
}
