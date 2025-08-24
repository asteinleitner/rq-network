import React from 'react';
import { createRoot } from 'react-dom/client';
import { FileText } from 'lucide-react';
import FormBuilderWrapper from './wrappers/FormBuilderWrapper.jsx';

export default function mountAppShellDemo() {
  const el = document.getElementById('root')!;
  const root = createRoot(el);

  function Header() {
    return (
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Opifex Platform</h1>
          <div className="text-sm text-gray-600">demo@opifex.local</div>
        </div>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-0">
            <button className="flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 border-blue-500 text-blue-600 bg-blue-50">
              <FileText className="w-4 h-4" />
              Form Builder
            </button>
          </div>
        </div>
      </div>
    );
  }

  function Page() {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <FormBuilderWrapper securityContext={{ user: { email: 'demo@opifex.local' } }} />
        </div>
      </div>
    );
  }

  root.render(<Page />);
}
