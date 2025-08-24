import React from "react";
import { loadActiveBundleForPatient } from "./modules/bundles/api";
import { BundleFormRenderer, validateAll, Values } from "./modules/bundles/renderer";
import { commitAndSync } from "./modules/sync/patientSync";

const API_BASE = "http://127.0.0.1:8787";
const PATIENT_ID = "patient_demo_001";

export default function App() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [bundleId, setBundleId] = React.useState<string | null>(null);
  const [bundleData, setBundleData] = React.useState<any | null>(null);
  const [practiceId, setPracticeId] = React.useState<string | null>(null);
  const [values, setValues] = React.useState<Values>({});
  const [errors, setErrors] = React.useState<Record<string | number, string>>({});
  const [okMsg, setOkMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { practiceId, bundleId, bundleData } = await loadActiveBundleForPatient(API_BASE, PATIENT_ID);
        if (!bundleId || !bundleData) {
          setError("No active assessment bundle found for your network.");
        } else {
          setBundleId(bundleId);
          setBundleData(bundleData);
          setPracticeId(practiceId ?? null);
        }
      } catch (e: any) {
        setError(e.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function onCommit() {
    if (!bundleId || !bundleData) return;
    setOkMsg(null);
    const errs = validateAll(bundleData.questions ?? [], values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      setError("Please fix the highlighted fields.");
      return;
    }
    setError(null);
    try {
      const res = await commitAndSync({
        apiBase: API_BASE,
        patientId: PATIENT_ID,
        bundleId,
        bundleData,
        answers: Object.fromEntries(
          (bundleData.questions ?? []).map((q: any) => [q.id, { value: values[q.id] }])
        ),
        practiceId
      });
      setOkMsg(`Synced ✓ id=${res.id}`);
    } catch (e: any) {
      setError(e.message ?? String(e));
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold">Patient App (Live Bundle PoC)</h1>
        <p className="mt-2 text-sm text-slate-600">
          Loads the current network bundle, validates locally, encrypts, and syncs.
        </p>

        {loading && <div className="mt-6">Loading…</div>}
        {!loading && error && (
          <div className="mt-6 p-3 rounded bg-rose-50 border border-rose-200 text-rose-800">
            {error}
          </div>
        )}

        {!loading && !error && bundleData && (
          <>
            <div className="mt-6 text-sm text-slate-600">
              <div><b>Bundle:</b> {bundleId}</div>
              {practiceId && <div><b>Active practice:</b> {practiceId}</div>}
            </div>

            <div className="mt-6">
              <BundleFormRenderer questions={bundleData.questions ?? []} values={values} setValues={setValues} />
            </div>

            {Object.keys(errors).length > 0 && (
              <div className="mt-4 p-3 rounded bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                {Object.entries(errors).map(([k, v]) => (
                  <div key={k}>Question {k}: {v}</div>
                ))}
              </div>
            )}

            <div className="mt-6">
              <button
                className="px-3 py-2 rounded bg-slate-900 text-white"
                onClick={onCommit}
              >
                Commit securely
              </button>
            </div>

            {okMsg && (
              <div className="mt-4 p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800">
                {okMsg}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
