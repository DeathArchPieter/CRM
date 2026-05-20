import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function SalesTrackingView() {
  return (
    <div className="view-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ padding: '24px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', marginBottom: '24px' }}>
        <TrendingUp size={64} color="var(--accent-success)" />
      </div>
      <h1 className="text-gradient" style={{ fontSize: '32px', marginBottom: '16px' }}>Sales Tracking</h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', textAlign: 'center', lineHeight: '1.6' }}>
        View historical sales data, generate performance reports, and analyze your year-over-year growth metrics.
      </p>
      <button className="btn btn-primary" style={{ marginTop: '32px' }}>Generate Report</button>
    </div>
  );
}
