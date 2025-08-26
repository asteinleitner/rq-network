export function saveToken(token: string) {
  localStorage.setItem("rq_token", token);
}
export function getToken(): string | null {
  return localStorage.getItem("rq_token");
}
export function clearToken() {
  localStorage.removeItem("rq_token");
}
export async function api(path: string, init: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(init.headers || {});
  if (token) headers.set("authorization", `Bearer ${token}`);
  if (!headers.has("content-type")) headers.set("content-type", "application/json");
  const res = await fetch(`http://127.0.0.1:8787${path}`, { ...init, headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}
