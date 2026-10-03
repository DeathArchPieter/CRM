import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, GitBranch, TrendingUp, DollarSign, 
  FlaskConical, Calendar, FolderKanban, FileText, Settings, 
  Trash2, Check, Search, Command, Smartphone, RefreshCw
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onOpenCommandPalette }) {
  const [clearingLogs, setClearingLogs] = useState(false);
  const [logsCleared, setLogsCleared] = useState(false);
  const [syncingMobile, setSyncingMobile] = useState(false);
  const [mobileSyncResult, setMobileSyncResult] = useState(null);
  const [monthlyProgress, setMonthlyProgress] = useState({
    issuedFyc: 0,
    targetFyc: 9167, // Default MDRT monthly run-rate (110k/12)
    percent: 0
  });

  // Calculate live monthly target progress
  useEffect(() => {
    const calculateProgress = async () => {
      if (window.electronAPI?.getPipeline) {
        try {
          const res = await window.electronAPI.getPipeline();
          if (res?.success) {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            const issuedThisMonth = (res.data || []).filter(c => {
              if (c.stage !== 'Case Issued') return false;
              const d = new Date(c.updatedAt || c.createdAt);
              return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            });

            const issuedTotal = issuedThisMonth.reduce((sum, c) => sum + (Number(c.estimatedFYC) || 0), 0);
            const target = 9167;
            const pct = Math.min(Math.round((issuedTotal / target) * 100), 100);

            setMonthlyProgress({
              issuedFyc: issuedTotal,
              targetFyc: target,
              percent: pct
            });
          }
        } catch (err) {
          console.error("Failed to calculate sidebar monthly target:", err);
        }
      }
    };
    calculateProgress();
  }, [activeTab]);

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

  const handleSyncMobile = async () => {
    if (!window.electronAPI?.syncMobileCompanion) return;
    setSyncingMobile(true);
    try {
      const res = await window.electronAPI.syncMobileCompanion();
      if (res?.success) {
        const parts = [];
        if (res.pulledAppts > 0) parts.push(`+${res.pulledAppts} appt`);
        if (res.pulledDebriefs > 0) parts.push(`+${res.pulledDebriefs} debrief`);
        setMobileSyncResult(parts.length > 0 ? parts.join(', ') : 'Synced');
        setTimeout(() => setMobileSyncResult(null), 3500);
      } else {
        setMobileSyncResult('Sync Error');
        setTimeout(() => setMobileSyncResult(null), 3000);
      }
    } catch (err) {
      setMobileSyncResult('Failed');
      setTimeout(() => setMobileSyncResult(null), 3000);
    } finally {
      setSyncingMobile(false);
    }
  };

  const tabs = [
    { id: 'dashboard',        label: 'Dashboard',         icon: <LayoutDashboard size={18} /> },
    { id: 'schedule',         label: 'Schedule',          icon: <Calendar size={18} /> },
    { id: 'clients',          label: 'Clients',            icon: <Users size={18} /> },
    { id: 'pipeline',         label: 'Pipeline',           icon: <GitBranch size={18} /> },
    { id: 'sales',            label: 'Sales Tracking',     icon: <TrendingUp size={18} /> },
    { id: 'remuneration',     label: 'Remuneration',       icon: <DollarSign size={18} /> },
    { id: 'special-projects', label: 'Special Projects',   icon: <FolderKanban size={18} /> },
    { id: 'special-reports',  label: 'Special Reports',    icon: <FileText size={18} /> },
    { id: 'product-analysis', label: 'Product Analyser',   icon: <FlaskConical size={18} /> },
    { id: 'settings',         label: 'Settings',          icon: <Settings size={18} /> },
  ];

  return (
    <div style={{
      width: '240px',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-light)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 14px',
    }}>
      {/* Brand Header */}
      <div style={{ marginBottom: '16px', padding: '0 8px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.3px', margin: 0 }}>
          Beetsma CRM
        </h2>
        <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
          Wealth Advisory Suite
        </p>
      </div>

      {/* Quick Search / Command Palette Button */}
      <button
        onClick={onOpenCommandPalette}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderRadius: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-light)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          marginBottom: '16px',
          fontSize: '12.5px',
          transition: 'all 0.15s ease'
        }}
        className="sidebar-btn"
        title="Open Command Palette (Ctrl+K)"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={14} color="var(--accent-primary)" />
          <span>Quick Search...</span>
        </div>
        <span style={{
          fontSize: '10.5px',
          padding: '1px 5px',
          borderRadius: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          color: 'var(--text-muted)',
          border: '1px solid var(--border-light)'
        }}>
          Ctrl+K
        </span>
      </button>

      {/* Navigation Tabs */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, overflowY: 'auto' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '9px 12px',
              borderRadius: '8px',
              border: activeTab === tab.id ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
              background: activeTab === tab.id ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              textAlign: 'left',
              fontWeight: activeTab === tab.id ? '600' : '400',
              fontSize: '13.5px'
            }}
            className={activeTab !== tab.id ? 'sidebar-btn' : ''}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
      
      {/* Bottom Monthly Target Widget */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '14px' }}>
        <div
          onClick={() => setActiveTab('sales')}
          style={{
            padding: '12px 14px',
            background: 'var(--bg-base)',
            borderRadius: '10px',
            border: '1px solid var(--border-light)',
            cursor: 'pointer',
            transition: 'border-color 0.15s ease'
          }}
          title="Click to view full Sales Performance & MDRT Hub"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: '500' }}>Month Pacing</span>
            <span style={{ fontSize: '11.5px', fontWeight: '700', color: monthlyProgress.percent >= 100 ? '#34d399' : 'var(--accent-primary)' }}>
              {monthlyProgress.percent}%
            </span>
          </div>
          <div style={{ width: '100%', height: '5px', background: 'var(--bg-surface-hover)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              width: `${monthlyProgress.percent}%`,
              height: '100%',
              background: monthlyProgress.percent >= 100 ? 'var(--accent-success)' : 'linear-gradient(90deg, #8b5cf6, #3b82f6)',
              transition: 'width 0.5s ease'
            }} />
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'right' }}>
            ${monthlyProgress.issuedFyc.toLocaleString()} / ${monthlyProgress.targetFyc.toLocaleString()} FYC
          </div>
        </div>

        {/* Mobile Companion Sync Button */}
        <button
          onClick={handleSyncMobile}
          disabled={syncingMobile}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '7px 10px',
            borderRadius: '6px',
            border: mobileSyncResult ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(59, 130, 246, 0.3)',
            background: mobileSyncResult ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.08)',
            color: mobileSyncResult ? '#34d399' : '#60a5fa',
            cursor: syncingMobile ? 'wait' : 'pointer',
            fontSize: '11px',
            fontWeight: '600',
            transition: 'all var(--transition-fast)',
            marginBottom: '8px'
          }}
          className="sidebar-btn"
          title="Sync with Mobile Companion Android App via Firebase"
        >
          {syncingMobile ? <RefreshCw size={12} className="animate-spin" /> : <Smartphone size={12} />}
          {syncingMobile ? 'Syncing...' : (mobileSyncResult ? `✓ ${mobileSyncResult}` : 'Sync Mobile App')}
        </button>

        {/* System Logs Controls */}
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
              padding: '6px 8px',
              borderRadius: '6px',
              border: '1px dashed var(--border-light)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '11px',
              transition: 'all var(--transition-fast)'
            }}
            className="sidebar-btn"
            title="Open System Logs"
          >
            <FileText size={12} /> View Logs
          </button>

          <button
            onClick={handleClearLogs}
            disabled={clearingLogs}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '6px 8px',
              borderRadius: '6px',
              border: logsCleared ? '1px solid rgba(16, 185, 129, 0.4)' : '1px dashed var(--border-light)',
              background: logsCleared ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
              color: logsCleared ? '#34d399' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '11px',
              transition: 'all var(--transition-fast)'
            }}
            className="sidebar-btn"
            title="Clear System Logs"
          >
            {logsCleared ? <Check size={12} /> : <Trash2 size={12} />}
            {logsCleared ? 'Cleared' : 'Clear'}
          </button>
        </div>
      </div>
    </div>
  );
}
