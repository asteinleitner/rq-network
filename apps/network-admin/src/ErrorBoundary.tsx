import React from 'react';

export default class ErrorBoundary extends React.Component<{children: React.ReactNode}, {error: any}> {
  constructor(props:any){ super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error:any){ return { error }; }
  componentDidCatch(error:any, info:any){ console.error('Builder crashed:', error, info); }
  render(){
    if (this.state.error){
      return (
        <div className="card" style={{background:'#fff3f3', borderColor:'#f3b6b6'}}>
          <h3 style={{marginTop:0}}>Form Builder Error</h3>
          <pre style={{whiteSpace:'pre-wrap'}}>{String(this.state.error)}</pre>
          <p>Check the browser console for stack details.</p>
        </div>
      );
    }
    return this.props.children as any;
  }
}
