// apps/patient-app/src/modules/bundles/api.ts
export type Bundle = { id: string; meta: any; data: any };

export async function fetchActiveCare(apiBase: string, patientId: string): Promise<string | null> {
  const r = await fetch(`${apiBase}/patients/${encodeURIComponent(patientId)}/care-episodes/active`);
  if (!r.ok) return null;
  const j = await r.json();
  return j?.practiceId ?? null;
}

export async function fetchNetworks(apiBase: string): Promise<Array<{id:string; name:string}>> {
  const r = await fetch(`${apiBase}/networks`);
  if (!r.ok) throw new Error(`networks: ${r.status}`);
  return r.json();
}

export async function fetchNetworkCurrentBundleId(apiBase: string, networkId: string): Promise<string | null> {
  const r = await fetch(`${apiBase}/networks/${encodeURIComponent(networkId)}/current`);
  if (!r.ok) throw new Error(`network current: ${r.status}`);
  const j = await r.json();
  return j?.currentBundleId ?? null;
}

export async function fetchBundle(apiBase: string, bundleId: string): Promise<Bundle> {
  const r = await fetch(`${apiBase}/bundles/${encodeURIComponent(bundleId)}`);
  if (!r.ok) throw new Error(`bundle: ${r.status}`);
  return r.json();
}

// Convenience: find the first network and load its current bundle
export async function loadActiveBundleForPatient(apiBase: string, patientId: string): Promise<{
  practiceId: string | null;
  networkId: string | null;
  bundleId: string | null;
  bundleData: any | null;
}> {
  const practiceId = await fetchActiveCare(apiBase, patientId);

  const nets = await fetchNetworks(apiBase);
  const networkId = nets[0]?.id ?? null;

  if (!networkId) return { practiceId, networkId: null, bundleId: null, bundleData: null };

  const currentId = await fetchNetworkCurrentBundleId(apiBase, networkId);
  if (!currentId) return { practiceId, networkId, bundleId: null, bundleData: null };

  const bundle = await fetchBundle(apiBase, currentId);
  return { practiceId, networkId, bundleId: bundle.id, bundleData: bundle.data };
}
