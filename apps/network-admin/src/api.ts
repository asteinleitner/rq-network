import { api } from "./auth";

export async function listNetworks() {
  return api("/my/networks");
}

export async function listPractices(networkId: string) {
  return api(`/networks/${encodeURIComponent(networkId)}/practices`);
}

export async function getPracticePublicKey(practiceId: string) {
  return api(`/practices/${encodeURIComponent(practiceId)}/public-key`);
}

export async function setPracticePublicKey(practiceId: string, publicKeyPem: string) {
  return api(`/practices/${encodeURIComponent(practiceId)}/public-key`, {
    method: "POST",
    body: JSON.stringify({ publicKeyPem }),
  });
}

export async function getNetworkCurrentBundle(networkId: string) {
  return api(`/networks/${encodeURIComponent(networkId)}/current`);
}

export async function listPracticeSubmissions(practiceId: string, limit = 20) {
  return api(`/practices/${encodeURIComponent(practiceId)}/submissions?limit=${limit}`);
}
