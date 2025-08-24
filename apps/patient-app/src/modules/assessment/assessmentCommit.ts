import { commitAndSync } from "../sync/patientSync";
// Adjust import path/name to match your file location/case:
import Assessment from "./AssessmentDataModule.js";

type AnyQ = { id: string | number; type: string };

export async function commitAssessment(options: {
  apiBase: string;
  patientId: string;
  bundleId?: string;              // default below
  bundleDataOverride?: unknown;   // pass real FormBuilder bundle later
  values: Record<string | number, any>; // raw UI answers keyed by question.id
}) {
  const bundleData = options.bundleDataOverride ?? { questions: (Assessment as any).questions };
  const bundleId = options.bundleId ?? "assessment_v1";

  // Build { [id]: { value, result } }
  const answers: Record<string | number, any> = {};
  for (const q of (Assessment as any).questions as AnyQ[]) {
    const value = options.values[q.id];
    const valid = (Assessment as any).validateAnswer(q, value);
    if (!valid) throw new Error(`Invalid answer for question ${String(q.id)}`);
    const result = (Assessment as any).calculateResult(q, value);
    answers[q.id] = { value, result };
  }

  return commitAndSync({
    apiBase: options.apiBase,
    patientId: options.patientId,
    bundleId,
    bundleData,
    answers
  });
}
