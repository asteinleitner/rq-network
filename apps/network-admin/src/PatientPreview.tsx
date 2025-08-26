import React from 'react';
import { bundlesApi } from './bundlesApi';

export default function PatientPreview() {
  const params = new URLSearchParams(location.search);
  const bundleId = params.get('preview') || '';
  const [state, setState] = React.useState<{loading:boolean; err?:string; bundle:any|null}>({loading:true, bundle:null});

  React.useEffect(() => {
    (async () => {
      try {
        const b = await bundlesApi.getBundle(bundleId);
        if (!b) { setState({loading:false, err:'Bundle not found', bundle:null}); return; }
        setState({loading:false, bundle:b});
      } catch (e:any) {
        setState({loading:false, err:e?.message || 'Failed to load bundle', bundle:null});
      }
    })();
  }, [bundleId]);

  if (!bundleId) return <div style={{padding:20}}>❗ Add <code>?preview=&lt;bundleId&gt;</code> to the URL.</div>;
  if (state.loading) return <div style={{padding:20}}>Loading preview…</div>;
  if (state.err) return <div style={{padding:20, color:'#b00020'}}>Error: {state.err}</div>;

  const { bundle } = state;
  const questions = bundle?.data?.questions ?? bundle?.questions ?? {};

  // Minimal generic renderer—shows title and raw question JSON structure.
  return (
    <div style={{ minHeight:'100vh', background:'#F9F7F4' }}>
      <div style={{background:'white', borderBottom:'1px solid #eee', padding:'12px 20px'}}>
        <strong>Patient Preview</strong>
        <span style={{marginLeft:10, color:'#5A6B73'}}>
          {bundle?.meta?.title || 'Untitled'} — v{bundle?.meta?.version || '1.0.0'} — {bundle?.id}
        </span>
      </div>
      <div style={{ maxWidth:760, margin:'20px auto', background:'white', padding:20, borderRadius:16, boxShadow:'0 6px 20px rgba(0,0,0,0.06)' }}>
        <h3 style={{marginTop:0}}>Questions</h3>
        <p style={{color:'#5A6B73'}}>This is a generic preview. When you confirm your question format, we’ll render proper fields.</p>
        <pre style={{whiteSpace:'pre-wrap', background:'#f7f7f7', padding:12, borderRadius:8, overflow:'auto', fontSize:13}}>
{JSON.stringify(questions, null, 2)}
        </pre>
      </div>
    </div>
  );
}
