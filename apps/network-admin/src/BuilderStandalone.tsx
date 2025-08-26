import React from 'react';
// @ts-ignore — plain JSX is fine
import IndependentFormBuilder from './IndependentFormBuilder.jsx';

export default function BuilderStandalone() {
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginTop: 0 }}>Standalone Form Builder Demo</h2>
      <IndependentFormBuilder />
    </div>
  );
}
