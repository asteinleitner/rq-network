import React from 'react';
// @ts-ignore plain JSX
import IndependentFormBuilder from './IndependentFormBuilder.jsx';

type Props = { onClose: () => void; onPublish: (bundle: any) => void; };

export default function FormBuilderPanel({ onClose, onPublish }: Props) {
  const builderRef = React.useRef<any>(null);

  function handlePublish() {
    const cfg =
      builderRef.current?.exportAuthoringBundle?.() ??
      builderRef.current?.getFormConfiguration?.() ?? null;
    if (!cfg) { alert('Could not read bundle from the builder yet.'); return; }
    onPublish(cfg);
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3>Form Builder</h3>
          <button className="button-primary" onClick={onClose}>✕ Close</button>
        </div>
        <div style={{ marginTop: 12 }}>
          <IndependentFormBuilder ref={builderRef} />
        </div>
        <div style={{ marginTop: 16, display:'flex', gap: 8 }}>
          <button className="button-primary" onClick={handlePublish}>Publish Bundle</button>
          <button className="button-primary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
