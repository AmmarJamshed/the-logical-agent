"use client";

import { useState } from "react";
import { API_URL } from "@/lib/utils";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@thelogicalagent.com");
  const [password, setPassword] = useState("ChangeMeAdmin123!");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Login failed");
      localStorage.setItem("tla_access_token", data.access_token);
      localStorage.setItem("tla_refresh_token", data.refresh_token);
      setMessage("Signed in. Token stored locally.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <p className="eyebrow">Authentication</p>
      <h1 className="mt-3 font-display text-4xl">Sign in</h1>
      <form onSubmit={onSubmit} className="panel mt-8 space-y-4 p-6">
        <label className="block text-sm">
          Email
          <input
            className="mt-1 w-full rounded-xl border border-[color:var(--stroke)] bg-transparent px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            className="mt-1 w-full rounded-xl border border-[color:var(--stroke)] bg-transparent px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
        </label>
        <button className="btn-primary w-full" type="submit">
          Continue
        </button>
        {message ? <p className="text-sm text-[color:var(--muted)]">{message}</p> : null}
      </form>
      <p className="mt-4 text-xs text-[color:var(--muted)]">
        OAuth providers: Google, GitHub, LinkedIn (configure client IDs in environment).
      </p>
    </div>
  );
}
