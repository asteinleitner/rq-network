// Minimal encrypted commit → cloud uploader for PoC
// Uses WebCrypto AES-GCM for payload encryption and RSA-OAEP(SHA-256) to wrap the DEK.
// Patient "wrap" uses raw base64 for PoC (replace with real patient keys later).

type Answers = Record<string | number, unknown>;

function b64enc(buf: ArrayBuffer | Uint8Array) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function strToBuf(s: string) { return new TextEncoder().encode(s); }

// PEM → SPKI ArrayBuffer
function pemToSpki(pem: string): ArrayBuffer {
  const lines = pem.trim().split(/\r?\n/).filter(l => !l.includes('BEGIN') && !l.includes('END'));
  const raw = atob(lines.join('')); const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer;
}

async function importPracticeKey(publicKeyPem: string): Promise<CryptoKey> {
  const spki = pemToSpki(publicKeyPem);
  return crypto.subtle.importKey('spki', spki, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']);
}

async function generateDEK(): Promise<Uint8Array> {
  const key = new Uint8Array(32);
  crypto.getRandomValues(key);
  return key;
}

async function encryptSubmission(dek: Uint8Array, payload: unknown) {
  const iv = new Uint8Array(12); crypto.getRandomValues(iv);
  const key = await crypto.subtle.importKey('raw', dek, { name: 'AES-GCM' }, false, ['encrypt']);
  const pt = strToBuf(JSON.stringify(payload));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, pt);
  const out = new Uint8Array(ct); const TAG = 16;
  return {
    ciphertext_b64: b64enc(out.slice(0, out.length - TAG)),
    tag_b64: b64enc(out.slice(out.length - TAG)),
    iv_b64: b64enc(iv),
    size: out.length + iv.length
  };
}

async function wrapForPractice(practicePem: string, dek: Uint8Array): Promise<string> {
  const key = await importPracticeKey(practicePem);
  const wrapped = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, dek);
  return b64enc(wrapped);
}

// PoC: wrap to patient as raw base64 (replace with real patient key later)
function wrapForPatient(dek: Uint8Array): string { return b64enc(dek); }

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', strToBuf(input));
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface CommitOptions {
  apiBase: string;       // e.g. "http://127.0.0.1:8787"
  patientId: string;     // e.g. "patient_demo_001"
  bundleId: string;      // id of the form/bundle used
  bundleData: unknown;   // the schema used (for hashing)
  answers: Answers;      // collected answers, keyed by FormBuilder ids
  practiceId?: string | null;           // optional override
  practicePublicKeyPem?: string | null; // optional override
}

async function fetchActiveCare(apiBase: string, patientId: string): Promise<string | null> {
  const r = await fetch(`${apiBase}/patients/${encodeURIComponent(patientId)}/care-episodes/active`);
  if (!r.ok) return null; const j = await r.json(); return j?.practiceId ?? null;
}
async function fetchPracticeKey(apiBase: string, practiceId: string): Promise<string> {
  const r = await fetch(`${apiBase}/practices/${encodeURIComponent(practiceId)}/public-key`);
  if (!r.ok) throw new Error('No active practice key');
  const j = await r.json(); return j.publicKeyPem as string;
}

export async function commitAndSync(opts: CommitOptions): Promise<{ id: string; createdAt: string }> {
  const { apiBase, patientId, bundleId, bundleData, answers } = opts;

  let practiceId = opts.practiceId ?? null;
  if (!practiceId) practiceId = await fetchActiveCare(apiBase, patientId);

  const bundleHash = await sha256Hex(JSON.stringify(bundleData));
  const createdAt = new Date().toISOString();
  const submission = { bundleId, bundleHash, answers, createdAt };

  const dek = await generateDEK();
  const enc = await encryptSubmission(dek, submission);

  const keys: Array<{ recipientType: 'patient'|'practice'; recipientId: string; wrappedDEK: string }> = [];
  keys.push({ recipientType: 'patient', recipientId: patientId, wrappedDEK: wrapForPatient(dek) });

  if (practiceId) {
    const practicePem = opts.practicePublicKeyPem ?? await fetchPracticeKey(apiBase, practiceId);
    keys.push({ recipientType: 'practice', recipientId: practiceId, wrappedDEK: await wrapForPractice(practicePem, dek) });
  }

  const res = await fetch(`${apiBase}/patients/${encodeURIComponent(patientId)}/submissions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-patient-id': patientId },
    body: JSON.stringify({
      bundleId, bundleHash, size: enc.size,
      ciphertext: enc.ciphertext_b64, iv: enc.iv_b64, tag: enc.tag_b64, keys
    })
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
  return res.json();
}
