import React from 'react';
import { createRoot } from 'react-dom/client';
// @ts-ignore — plain JSX is fine
import IndependentFormBuilder from './IndependentFormBuilder.jsx';

export default function mountBuilderStandalone() {
  const el = document.getElementById('root')!;
  const root = createRoot(el);
  root.render(
    <div style={{ padding: 20 }}>
      <h2 style={{ marginTop: 0 }}>Standalone Form Builder Demo</h2>
      <IndependentFormBuilder />
    </div>
  );
}
