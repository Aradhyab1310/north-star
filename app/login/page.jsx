"use client";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErr(error.message);
    else router.push("/dashboard");
  }

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-2xl font-bold mb-4">Log in</h1>
      <form className="space-y-3" onSubmit={onSubmit}>
        <input className="w-full rounded border px-3 py-2" type="email" placeholder="you@email.com"
          value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="w-full rounded border px-3 py-2" type="password" placeholder="Password"
          value={password} onChange={e=>setPassword(e.target.value)} required />
        {err && <p className="text-sm text-rose-600">{err}</p>}
        <button className="w-full rounded bg-black text-white px-3 py-2">Log in</button>
      </form>
      <p className="mt-3 text-sm">
        No account? <a className="underline" href="/signup">Sign up</a>
      </p>
    </div>
  );
}
