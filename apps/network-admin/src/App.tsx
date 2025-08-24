import React from 'react';
import { api } from './api';
import FormBuilderPanel from './FormBuilderPanel';

export default function App() {
  const [networks, setNetworks] = React.useState([] as Awaited<ReturnType<typeof api.listNetworks>>);
  const [selectedNet, setSelectedNet] = React.useState<string | null>(null);
  const [practices, setPractices] = React.useState([] as Awaited<ReturnType<typeof api.listPractices>>);
  const [showBuilder, setShowBuilder] = React.useState(false);

  React.useEffect(() => { api.listNetworks().then(setNetworks); }, []);
  React.useEffect(() => { if (selectedNet) api.listPractices(selectedNet).then(setPractices); }, [selectedNet]);

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
              {practices.map(p => (<li key={p.id}>{p.name}</li>))}
            </ul>
            <div style={{ marginTop: 12 }}>
              <button className="button-primary" onClick={() => setShowBuilder(true)}>
                Embed Form Builder → Publish Bundle
              </button>
            </div>
          </div>
        )}
      </div>

      {showBuilder && (
        <FormBuilderPanel
          onClose={() => setShowBuilder(false)}
          onPublish={(bundleOrConfig) => {
            console.log('PUBLISHED from Builder:', bundleOrConfig);
            alert('Bundle received — check the browser console.');
            setShowBuilder(false);
          }}
        />
      )}
    </>
  );
}
