import React, { useState } from 'react';
import { LayoutDashboard, Users, GitBranch, TrendingUp, DollarSign, FlaskConical, Calendar, FolderKanban, FileText, Settings, Trash2, Check } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const [clearingLogs, setClearingLogs] = useState(false);
  const [logsCleared, setLogsCleared] = useState(false);

  const handleClearLogs = async () => {
    if (!window.confirm("Are you sure you want to clear the system log file? This cannot be undone.")) return;
    setClearingLogs(true);
    try {
      if (window.electronAPI?.clearLogFile) {
        const res = await window.electronAPI.clearLogFile();
        if (res.success) {
          setLogsCleared(true);
          setTimeout(() => setLogsCleared(false), 3000);
        }
      }
    } catch (err) {
      console.error("Failed to clear logs:", err);
    } finally {
      setClearingLogs(false);
    }
  };

  const tabs = [
    { id: 'dashboard',        label: 'Dashboard',         icon: <LayoutDashboard size={20} /> },
    { id: 'schedule',         label: 'Schedule',          icon: <Calendar size={20} /> },
    { id: 'clients',          label: 'Clients',            icon: <Users size={20} /> },
    { id: 'pipeline',         label: 'Pipeline',           icon: <GitBranch size={20} /> },
    { id: 'sales',            label: 'Sales Tracking',     icon: <TrendingUp size={20} /> },
    { id: 'remuneration',     label: 'Remuneration',       icon: <DollarSign size={20} /> },
    { id: 'special-projects', label: 'Special Projects',   icon: <FolderKanban size={20} /> },
    { id: 'special-reports',  label: 'Special Reports',    icon: <FileText size={20} /> },
    { id: 'product-analysis', label: 'Product Analyser',   icon: <FlaskConical size={20} /> },
    { id: 'settings',         label: 'Settings',          icon: <Settings size={20} /> },
  ];

  return (
    <div style={{
      width: '240px',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-light)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
    }}>
      <div style={{ marginBottom: '32px', padding: '0 12px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Beetsma Consultancy</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Consultant CRM</p>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab.id ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              textAlign: 'left',
              fontWeight: activeTab === tab.id ? '500' : '400',
            }}
            className={activeTab !== tab.id ? 'sidebar-btn' : ''}
          >
            {tab.icon}
            <span style={{ fontSize: '14px' }}>{tab.label}</span>
          </button>
        ))}
      </nav>
      
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ padding: '16px', background: 'var(--bg-base)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Monthly Target</p>
          <div style={{ width: '100%', height: '6px', background: 'var(--bg-surface-hover)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: '75%', height: '100%', background: 'var(--accent-primary)' }}></div>
          </div>
          <p style={{ fontSize: '12px', fontWeight: '500', marginTop: '8px', textAlign: 'right' }}>75%</p>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => {
              if (window.electronAPI?.openLogFile) {
                window.electronAPI.openLogFile();
              }
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 10px',
              borderRadius: '8px',
              border: '1px dashed var(--border-light)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all var(--transition-fast)'
            }}
            className="sidebar-btn"
            title="Open System Logs"
          >
            <FileText size={14} /> View Logs
          </button>

          <button
            onClick={handleClearLogs}
            disabled={clearingLogs}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '8px 10px',
              borderRadius: '8px',
              border: logsCleared ? '1px solid rgba(16, 185, 129, 0.4)' : '1px dashed var(--border-light)',
              background: logsCleared ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
              color: logsCleared ? '#34d399' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all var(--transition-fast)'
            }}
            className="sidebar-btn"
            title="Clear System Logs"
          >
            {logsCleared ? <Check size={14} /> : <Trash2 size={14} />}
            {logsCleared ? 'Cleared' : 'Clear'}
          </button>
        </div>
      </div>
    </div>
  );
}
