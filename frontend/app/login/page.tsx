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

  return (
    <div className="grid min-h-screen place-items-center p-6 bg-ink">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border border-line bg-panel p-8">
        <h1 className="text-xl font-bold tracking-wide">
          Blank Hanger <span className="text-accent">AI</span>
        </h1>
        
        <input 
          className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-white focus:outline-none focus:border-accent" 
          placeholder="Email" 
          type="email"
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required
        />
        
        <input 
          className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-white focus:outline-none focus:border-accent" 
          type="password" 
          placeholder="Password" 
          value={pw} 
          onChange={(e) => setPw(e.target.value)} 
          required
        />
        
        {err && <p className="text-sm text-red-400">{err}</p>}
        
        <button 
          type="submit" 
          disabled={busy} 
          className="w-full rounded-lg bg-accent py-2 text-sm font-semibold text-ink hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}