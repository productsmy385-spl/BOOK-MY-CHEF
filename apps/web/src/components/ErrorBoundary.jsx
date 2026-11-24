import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm text-center flex flex-col gap-3">
          <h1 className="t-h2">Something went wrong</h1>
          <p className="t-body text-muted">Please reload the page. If this keeps happening, contact support.</p>
          <button className="btn btn-primary mt-2" onClick={() => window.location.reload()}>Reload</button>
        </div>
      </div>
    );
  }
}
