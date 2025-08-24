import React from 'react';
// We host the real builder you gave me:
import IndependentFormBuilder from '../IndependentFormBuilder.jsx';

export default function FormBuilderWrapper({ securityContext }) {
  return (
    <div className="min-h-[70vh] bg-white rounded-lg shadow-lg p-6">
      <div className="flex">
        {/* Left rail / tests / tools panel */}
        <aside className="w-64 border-r pr-4 mr-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Tests / Tools</h3>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>Question Sets</li>
            <li>Scoring Rules</li>
            <li>Preview</li>
          </ul>
        </aside>

        {/* Main builder area */}
        <main className="flex-1">
          <IndependentFormBuilder />
        </main>
      </div>
    </div>
  );
}
