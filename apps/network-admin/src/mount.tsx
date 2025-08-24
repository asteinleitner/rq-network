import "./tailwind.css";
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

function main() {
  const params = new URLSearchParams(window.location.search);
  const showBuilder = params.get('builder') === '1';

  const el = document.getElementById('root')!;
  const root = createRoot(el);

  if (showBuilder) {
    // Lazy-load the standalone builder to keep normal app lean
    import('./BuilderStandalone').then(({ default: mountBuilderStandalone }) => {
      mountBuilderStandalone();
    });
  } else {
    root.render(<App />);
  }
}

main();
