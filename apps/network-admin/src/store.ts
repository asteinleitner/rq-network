const LS_BUNDLES = "rq/bundles";
const LS_ASSIGN  = "rq/assignments"; // { [practiceId]: bundleId }

export type StoredBundle = {
  id: string;
  createdAt: string;
  meta?: { title?: string; version?: string; author?: string };
  data: any;
};

function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback; }
  catch { return fallback; }
}
function save<T>(key: string, v: T) { localStorage.setItem(key, JSON.stringify(v)); }

export const store = {
  listBundles(): StoredBundle[] {
    const arr = load<StoredBundle[]>(LS_BUNDLES, []);
    // newest first
    return [...arr].sort((a,b)=> b.createdAt.localeCompare(a.createdAt));
  },
  addBundle(b: Omit<StoredBundle, "id"|"createdAt">): StoredBundle {
    const arr = load<StoredBundle[]>(LS_BUNDLES, []);
    const id = `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
    const rec: StoredBundle = { id, createdAt: new Date().toISOString(), ...b };
    arr.push(rec); save(LS_BUNDLES, arr); return rec;
  },
  listAssignments(): Record<string,string> {
    return load<Record<string,string>>(LS_ASSIGN, {});
  },
  assign(practiceId: string, bundleId: string) {
    const a = load<Record<string,string>>(LS_ASSIGN, {});
    a[practiceId] = bundleId; save(LS_ASSIGN, a);
  }
};
