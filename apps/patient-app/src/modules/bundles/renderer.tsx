// apps/patient-app/src/modules/bundles/renderer.tsx
import React from "react";

type Q = {
  id: string | number;
  type: "radio" | "checkbox" | "textarea";
  label?: string;
  required?: boolean;
  minLength?: number;
  options?: Array<{ value: string; label: string }>;
};

export type Values = Record<string | number, any>;

function validateQuestion(q: Q, v: any): string | null {
  if (q.required) {
    if (q.type === "checkbox") {
      if (!Array.isArray(v) || v.length === 0) return "Required";
    } else {
      if (v === undefined || v === null || v === "") return "Required";
    }
  }
  if (q.type === "radio") {
    if (v && q.options && !q.options.some(o => o.value === v)) return "Invalid option";
  }
  if (q.type === "checkbox") {
    if (!Array.isArray(v)) return "Invalid";
    if (q.options && v.some((x: any) => !q.options!.some(o => o.value === x))) return "Invalid option";
  }
  if (q.type === "textarea") {
    if (typeof v !== "string") return q.required ? "Required" : null;
    if (q.minLength && v.length < q.minLength) return `Min length ${q.minLength}`;
  }
  return null;
}

export function validateAll(questions: Q[], values: Values): Record<string | number, string> {
  const errors: Record<string | number, string> = {};
  for (const q of questions) {
    const e = validateQuestion(q, values[q.id]);
    if (e) errors[q.id] = e;
  }
  return errors;
}

export function BundleFormRenderer({
  questions,
  values,
  setValues,
}: {
  questions: Q[];
  values: Values;
  setValues: (v: Values) => void;
}) {
  return (
    <div className="space-y-6">
      {questions.map((q) => {
        return (
          <div key={String(q.id)} className="p-4 rounded-xl bg-white shadow-sm border border-slate-200">
            <div className="font-medium">{q.label ?? `Question ${String(q.id)}`}</div>

            {q.type === "radio" && (
              <div className="mt-3 space-y-2">
                {q.options?.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={String(q.id)}
                      value={opt.value}
                      checked={values[q.id] === opt.value}
                      onChange={(e) => setValues({ ...values, [q.id]: e.target.value })}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === "checkbox" && (
              <div className="mt-3 space-y-2">
                {q.options?.map((opt) => {
                  const arr: string[] = Array.isArray(values[q.id]) ? values[q.id] : [];
                  const checked = arr.includes(opt.value);
                  return (
                    <label key={opt.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        value={opt.value}
                        checked={checked}
                        onChange={(e) => {
                          const next = new Set(arr);
                          if (e.target.checked) next.add(opt.value);
                          else next.delete(opt.value);
                          setValues({ ...values, [q.id]: Array.from(next) });
                        }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {q.type === "textarea" && (
              <textarea
                className="mt-3 w-full rounded border border-slate-300 p-2"
                rows={4}
                value={values[q.id] ?? ""}
                onChange={(e) => setValues({ ...values, [q.id]: e.target.value })}
                placeholder="Type your answer…"
              />
            )}

            {q.required && <div className="mt-2 text-xs text-slate-500">Required</div>}
          </div>
        );
      })}
    </div>
  );
}
