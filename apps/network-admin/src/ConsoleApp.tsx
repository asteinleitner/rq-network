import React from 'react';
import { listNetworks, listPractices } from './api';
import FormBuilderPanel from './FormBuilderPanel';
import { bundlesApi } from './bundlesApi';
import PracticesPanel from "./PracticesPanel";

export default function App({ activeNetworkId }: { activeNetworkId: string }) {
  const [networks, setNetworks] = React.useState([] as Awaited<ReturnType<typeof api.listNetworks>>);
  const [selectedNet, setSelectedNet] = React.useState<string | null>(null);
  const [practices, setPractices] = React.useState([] as Awaited<ReturnType<typeof api.listPractices>>);

  const [showBuilder, setShowBuilder] = React.useState(false);
  const [bundles, setBundles] = React.useState<any[]>([]);
  const [assignments, setAssignments] = React.useState<Record<string,string>>({});
  const [selectedBundleId, setSelectedBundleId] = React.useState<string | null>(null);

  React.useEffect(() => { listNetworks().then(setNetworks); }, []);
  React.useEffect(() => { if (selectedNet) listPractices(selectedNet).then(setPractices); }, [selectedNet]);
  React.useEffect(() => { bundlesApi.listBundles().then(setBundles); bundlesApi.listAssignments().then(setAssignments); }, [showBuilder]);

  // Expose currently selected network id for panels that read window.* (temporary bridge)
  React.useEffect(() => {
    (window as any).__ACTIVE_NETWORK_ID__ = selectedNet ?? activeNetworkId ?? null;
  }, [selectedNet, activeNetworkId]);

  return (
    <>
      <div className="header">Network Admin</div>
      <div className="container">
        <div className="card">
          <h3>Networks</h3>
          <ul>
            {networks.map(n => (
              <li key={n.id}>
                <button className="button-primary" onClick={() => setSelectedNet(n.id)}>{n.name}</button>
              </li>
            ))}
          </ul>
        </div>

        {selectedNet && (
          <div className="card">
            <h3>Practices in Network</h3>
            <ul>
              {practices.map(p => (
                <li key={p.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12}}>
                  <span>{p.name}</span>
                  <span style={{fontSize:12, color:'#5A6B73'}}>
                    Assigned: {assignments[p.id] ? assignments[p.id] : '—'}
                  </span>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 12 }}>
              <button className="button-primary" onClick={() => setShowBuilder(true)}>
                Embed Form Builder → Publish Bundle
              </button>
            </div>
          </div>
        )}

        {/* NEW: Practice Details (public key, active bundle, submissions) */}
        {selectedNet && (
          <div className="card">
            <h3>Practice Details</h3>
            <PracticesPanel />
          </div>
        )}

        <div className="card">
          <h3>Published Bundles</h3>
          {bundles.length === 0 ? (
            <p className="help-text">No bundles yet. Click “Embed Form Builder → Publish Bundle”.</p>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ textAlign:'left', fontSize:14, color:'#5A6B73' }}>
                  <th style={{ padding:'6px 4px' }}>ID</th>
                  <th style={{ padding:'6px 4px' }}>Title</th>
                  <th style={{ padding:'6px 4px' }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {bundles.map(b => (
                  <tr key={b.id} style={{ borderTop:'1px dashed #E8E6E3' }}>
                    <td style={{ padding:'8px 4px', fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{b.id}</td>
                    <td style={{ padding:'8px 4px' }}>{b.meta?.title || 'Untitled'}<span style={{marginLeft:8, fontSize:12, color:'#5A6B73'}}>v{b.meta?.version || '1.0.0'}</span></td>
                    <td style={{ padding:'8px 4px' }}>{new Date(b.createdAt).toLocaleString()}<a style={{ marginLeft:12, fontSize:13 }} href={`?preview=${encodeURIComponent(b.id)}`}>Preview</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {bundles.length > 0 && (
            <div style={{ display:'flex', gap:8, marginTop:12, alignItems:'center' }}>
              <select value={selectedBundleId ?? ''} onChange={e=>setSelectedBundleId(e.target.value)} style={{ maxWidth: 360 }}>
                <option value="" disabled>Select a bundle…</option>
                {bundles.map(b => (<option key={b.id} value={b.id}>{b.meta?.title || 'Untitled'} v{b.meta?.version || '1.0.0'} — {b.id}</option>))}
              </select>
              {selectedNet && (
                <select id="assign-practice" style={{ maxWidth: 360 }}>
                  <option value="" disabled selected>Select a practice…</option>
                  {practices.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
              )}
              <button
                className="button-primary"
                onClick={async () => {
                  const sel = (document.getElementById('assign-practice') as HTMLSelectElement | null)?.value;
                  if (!selectedBundleId) { alert('Pick a bundle first.'); return; }
                  if (!sel) { alert('Pick a practice to assign.'); return; }
                  await bundlesApi.assignBundleToPractice(sel, selectedBundleId);
                  const a = await bundlesApi.listAssignments(); setAssignments(a);
                  alert('Assigned ✓');
                }}
              >
                Assign to Practice
              </button>
            </div>
          )}
        </div>
      </div>

      {showBuilder && (
        <FormBuilderPanel
          onClose={() => setShowBuilder(false)}
          onPublish={(bundleOrConfig) => {
            console.log('PUBLISHED from Builder:', bundleOrConfig);
            alert('Bundle received — check the browser console.');
            setShowBuilder(false);
            bundlesApi.listBundles().then(setBundles);
          }}
        />
      )}
    </>
  );
}