import React, { useEffect, useState } from "react";
import Login from "./Login";
import ConsoleApp from "./ConsoleAppAdapter";
import { getToken, clearToken, api } from "./auth";

export default function App() {
  const [token, setToken] = useState<string | null>(getToken());
  const [networks, setNetworks] = useState<any[] | null>(null);
  const [activeNetworkId, setActiveNetworkId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  // After login, load networks the user can access
  useEffect(() => {
    if (!token) return;
    (async () => {
      setError("");
      setNetworks(null);
      try {
        const nets = await api("/my/networks");
        setNetworks(nets);
        if (nets?.length) setActiveNetworkId(nets[0].id);
      } catch (e: any) {
        setError(e.message || "Failed to load networks");
      }
    })();
  }, [token]);

  if (!token) return <Login onLoggedIn={() => setToken(getToken())} />;

  if (error) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 8, color: "#b00" }}>Error: {error}</div>
        <button onClick={() => { clearToken(); setToken(null); }}>Sign out</button>
      </div>
    );
  }

  if (!networks) return <div style={{ padding: 16 }}>Loading your networks…</div>;
  if (!activeNetworkId) return <div style={{ padding: 16 }}>No networks in your scope.</div>;

  return (
    <div style={{ padding: 16, fontFamily: "system-ui" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>Network Admin</h1>
        <label>
          Active network:&nbsp;
          <select
            value={activeNetworkId}
            onChange={e => setActiveNetworkId(e.target.value)}
          >
            {networks.map((n: any) => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </select>
        </label>
        <div style={{ marginLeft: "auto" }}>
          <button onClick={() => { clearToken(); setToken(null); }}>Sign out</button>
        </div>
      </header>

      {/* Pass activeNetworkId into your original console UI */}
      <ConsoleApp activeNetworkId={activeNetworkId} />
    </div>
  );
}
