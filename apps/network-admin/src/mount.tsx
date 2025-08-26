import "./tailwind.css";
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = createRoot(document.getElementById('root')!);
const params = new URLSearchParams(window.location.search);

(async () => {
  try {
    if (params.get('test') === '1') {
      const mod = await import('./Smoke.tsx');
      const Cmp = (mod as any).default ?? Object.values(mod)[0];
      root.render(React.createElement(Cmp));
      return;
    }
    if (params.get('builder') === '1') {
      const mod = await import('./BuilderStandalone.tsx');
      const Cmp = (mod as any).default ?? Object.values(mod)[0];
      root.render(React.createElement(Cmp));
      return;
    }
    if (params.get('shell') === '1') {
      const mod = await import('./AppShellDemo.tsx');
      const Cmp = (mod as any).default ?? Object.values(mod)[0];
      root.render(React.createElement(Cmp));
      return;
    }
  } catch (e) {
    console.error('Dynamic import failed, falling back to App:', e);
  }
  root.render(<App />);
})();
