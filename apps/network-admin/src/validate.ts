import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";

import questionsSchema from "../../../packages/contracts/questions.schema.json";
import issuesSchema from "../../../packages/contracts/issues.schema.json";
import summarySchema from "../../../packages/contracts/summary.schema.json";

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const validateQuestions = ajv.compile(questionsSchema as any);
const validateIssues = ajv.compile(issuesSchema as any);
const validateSummary = ajv.compile(summarySchema as any);

export type Bundle = {
  questions: unknown;
  issues?: unknown;
  summary?: unknown;
  meta?: { title?: string; version?: string; author?: string };
};

export function validateBundle(bundle: Bundle) {
  const errors: string[] = [];

  if (!validateQuestions(bundle.questions)) {
    errors.push(...(validateQuestions.errors ?? []).map(e => `questions: ${e.instancePath} ${e.message}`));
  }
  if (bundle.issues && !validateIssues(bundle.issues)) {
    errors.push(...(validateIssues.errors ?? []).map(e => `issues: ${e.instancePath} ${e.message}`));
  }
  if (bundle.summary && !validateSummary(bundle.summary)) {
    errors.push(...(validateSummary.errors ?? []).map(e => `summary: ${e.instancePath} ${e.message}`));
  }

  return { ok: errors.length === 0, errors };
}
