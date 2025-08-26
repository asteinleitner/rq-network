import React, { useState } from "react";
import { saveToken } from "./auth";

export default function Login({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [email, setEmail] = useState("alex@artisanfertility.com");
  const [password, setPassword] = useState("devpass123");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("Logging in…");
    try {
      const res = await fetch("http://127.0.0.1:8787/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      }).then(r => r.json());
      if (!res.ok || !res.token) {
        setMsg(res.error || "Login failed");
        return;
      }
      saveToken(res.token);
      onLoggedIn();
    } catch (err: any) {
      setMsg(err.message || "Login failed");
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: "10vh auto", fontFamily: "system-ui" }}>
      <h1>Network Admin Login</h1>
      <form onSubmit={submit}>
        <div style={{ margin: "12px 0" }}>
          <label>Email<br /><input value={email} onChange={e=>setEmail(e.target.value)} style={{width:"100%"}}/></label>
        </div>
        <div style={{ margin: "12px 0" }}>
          <label>Password<br /><input type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{width:"100%"}}/></label>
        </div>
        <button type="submit">Sign in</button>
      </form>
      {msg && <div style={{ marginTop: 10 }}>{msg}</div>}
    </div>
  );
}
