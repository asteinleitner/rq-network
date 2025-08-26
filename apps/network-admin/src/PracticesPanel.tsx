import React, { useEffect, useState } from "react";
import {
  listPractices,
  getPracticePublicKey,
  setPracticePublicKey,
  getNetworkCurrentBundle,
  listPracticeSubmissions,
} from "./api";

const DEMO_PEM = `-----BEGIN PUBLIC KEY-----
MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJbq6vJzZbmiD7RVi3YbTqv1rtiQ2KJr
H5I0YQcyF8m3lgKLuVwzCkVxB7G4t3kVjvJc2mKp+q1iFq4eZrVh7IsCAwEAAQ==
-----END PUBLIC KEY-----`;

export default function PracticesPanel() {
  const activeNetworkId = (window as any).__ACTIVE_NETWORK_ID__;
  const [practices, setPractices] = useState<any[]>([]);
  const [selectedPracticeId, setSelectedPracticeId] = useState<string | null>(null);
  const [keyInfo, setKeyInfo] = useState<any | null>(null);
  const [currentBundle, setCurrentBundle] = useState<any | null>(null);
  const [submissions, setSubmissions] = useState<any[] | null>(null);
  const [error, setError] = useState<string>("");

  (window as any).__SELECTED_PRACTICE_ID__ = selectedPracticeId;

  useEffect(() => {
    if (!activeNetworkId) return;
    setError("");
    setPractices([]);
    setSelectedPracticeId(null);
    (async () => {
      try {
        const list = await listPractices(activeNetworkId);
        setPractices(list);
      } catch (e: any) {
        setError(e.message || "Failed to load practices");
      }
    })();
  }, [activeNetworkId]);

  useEffect(() => {
    if (!selectedPracticeId || !activeNetworkId) return;
    (async () => {
      try {
        const [k, c, subs] = await Promise.all([
          getPracticePublicKey(selectedPracticeId).catch(() => null),
          getNetworkCurrentBundle(activeNetworkId).catch(() => null),
          listPracticeSubmissions(selectedPracticeId, 20).catch(() => []),
        ]);
        setKeyInfo(k);
        setCurrentBundle(c);
        setSubmissions(Array.isArray(subs) ? subs : []);
      } catch {
        setKeyInfo(null);
        setCurrentBundle(null);
        setSubmissions([]);
      }
    })();
  }, [selectedPracticeId, activeNetworkId]);

  if (!activeNetworkId) {
    return <div style={{ padding: 12 }}>Pick a network above to begin.</div>;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16 }}>
      <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>Practices</h3>
        {error && <div style={{ color: "#b00", marginBottom: 8 }}>{error}</div>}
        {practices.length === 0 && <div>No practices found.</div>}
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {practices.map((p) => (
            <li key={p.id} style={{ marginBottom: 8 }}>
              <button
                onClick={() => setSelectedPracticeId(p.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #ddd",
                  background: selectedPracticeId === p.id ? "#eef6ff" : "white",
                  cursor: "pointer",
                }}
              >
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>Practice details</h3>
        {!selectedPracticeId && <div>Select a practice…</div>}
        {selectedPracticeId && (
          <>
            <div><strong>ID:</strong> {selectedPracticeId}</div>

            <div style={{ marginTop: 10 }}>
              <strong>Public key:</strong>{" "}
              {keyInfo ? "Present" : (
                <>
                  Missing{" "}
                  <button
                    onClick={async () => {
                      await setPracticePublicKey(selectedPracticeId, DEMO_PEM);
                      const k2 = await getPracticePublicKey(selectedPracticeId).catch(() => null);
                      setKeyInfo(k2);
                    }}
                    style={{ marginLeft: 8 }}
                  >
                    Seed demo key
                  </button>
                </>
              )}
            </div>

            <div style={{ marginTop: 10 }}>
              <strong>Active bundle:</strong>{" "}
              {currentBundle?.meta?.title ? `${currentBundle.meta.title} v${currentBundle.meta.version || "1.0.0"}` : "None"}
            </div>

            <div style={{ marginTop: 10 }}>
              <strong>Recent submissions:</strong>
              {submissions === null ? (
                <div>Loading…</div>
              ) : submissions.length === 0 ? (
                <div>None</div>
              ) : (
                <ul>
                  {submissions.map((s: any) => (
                    <li key={s.id}>
                      {s.id} · {new Date(s.createdAt).toLocaleString()}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
