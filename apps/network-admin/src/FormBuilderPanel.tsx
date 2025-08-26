import React from 'react';
// @ts-ignore
import * as FormBuilderModule from './IndependentFormBuilder.jsx';
import { validateBundle } from './validate';
import { bundlesApi } from './bundlesApi';

const FormBuilder =
  (FormBuilderModule as any).default ??
  (FormBuilderModule as any).IndependentFormBuilder ??
  (Object.values(FormBuilderModule || {}).find(v => typeof v === 'function')) ??
  null;

type Props = { onClose: () => void; onPublish: (bundle: any) => void; };

export default function FormBuilderPanel({ onClose, onPublish }: Props) {
  const latestFromCallback = React.useRef<any>(null);

  async function attemptExport(): Promise<any | null> {
    if (typeof (FormBuilderModule as any).exportAuthoringBundle === 'function') {
      try { return (FormBuilderModule as any).exportAuthoringBundle(); } catch {}
    }
    if (typeof (FormBuilderModule as any).getFormConfiguration === 'function') {
      try { return (FormBuilderModule as any).getFormConfiguration(); } catch {}
    }
    const w = window as any;
    if (typeof w.exportAuthoringBundle === 'function') {
      try { return w.exportAuthoringBundle(); } catch {}
    }
    if (typeof w.getFormConfiguration === 'function') {
      try { return w.getFormConfiguration(); } catch {}
    }
    if (latestFromCallback.current) return latestFromCallback.current;
    return null;
  }

  function normalize(raw: any) {
    if (!raw) return null;
    const base = (raw.questions || raw.issues || raw.summary) ? raw : { questions: raw };
    const meta = {
      title: base?.meta?.title || raw?.title || 'Untitled',
      author: base?.meta?.author || 'Network Admin',
      version: base?.meta?.version || '1.0.0'
    };
    return { ...base, meta };
  }

  async function handlePublish() {
    const raw = await attemptExport();
    if (!raw) {
      alert('Publish failed: builder did not expose an export method (tried module/window + onExport).');
      return;
    }

    const bundle = normalize(raw);
    if (!bundle) { alert('Could not normalize bundle.'); return; }

    const result = validateBundle(bundle as any);
    if (!result.ok) {
      console.error('Bundle validation errors:', result.errors);
      alert('Bundle is not valid:\n\n' + result.errors.slice(0,10).join('\n'));
      return;
    }

    try {
      const rec = await bundlesApi.publishBundle({ meta: (bundle as any).meta, data: bundle });
      onPublish(bundle);
      alert(`Published bundle ✓\nID: ${rec.id}\nVersion: ${rec.meta?.version || '1.0.0'}`);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Publish failed — see console.');
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3>Form Builder</h3>
          <button className="button-primary" onClick={onClose}>✕ Close</button>
        </div>
        <div style={{ marginTop: 12 }}>
          {FormBuilder ? (
            <FormBuilder onExport={(data: any) => { latestFromCallback.current = data; }} />
          ) : (
            <div className="help-text">Could not resolve Form Builder component export.</div>
          )}
        </div>
        <div style={{ marginTop: 16, display:'flex', gap: 8 }}>
          <button className="button-primary" onClick={handlePublish}>Publish Bundle</button>
          <button className="button-primary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
