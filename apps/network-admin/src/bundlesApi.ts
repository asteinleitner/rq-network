import { store } from "./store";

export const bundlesApi = {
  async listBundles() {
    return store.listBundles();
  },
  async getBundle(id: string) {
    const all = store.listBundles();
    return all.find(b => b.id === id) || null;
  },
  async publishBundle(rec: { meta?: any; data: any }) {
    // immutable: always create a new record
    return store.addBundle({ meta: rec.meta, data: rec.data });
  },
  async listAssignments() {
    return store.listAssignments();
  },
  async assignBundleToPractice(practiceId: string, bundleId: string) {
    store.assign(practiceId, bundleId);
    return { ok: true };
  }
};
