import React, { useState, useEffect } from 'react';
import {
  User,
  Building,
  Award,
  FileText,
  Sliders,
  Database,
  Save,
  RotateCcw,
  CheckCircle2,
  Shield,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  FileCheck,
  Check,
  Plus,
  Trash2,
  Eye,
  RefreshCw,
  ArrowUpCircle,
  ExternalLink
} from 'lucide-react';

const DEFAULT_SETTINGS = {
  consultantName: 'Pieter Beetsma',
  consultantTitle: 'Senior Financial Consultant',
  repNumber: 'MAS Rep: PB-892415',
  email: 'pieter@beetsma.sg',
  phone: '+65 9123 4567',
  officeAddress: '1 Marina Boulevard, Singapore 018989',
  credentials: ['CFP®', 'ChFC®', 'AEPP®'],
  reportHeaderBranding: 'FINANCIAL PLANNING REPORT',
  reportSubtitle: '',
  defaultCurrency: 'SGD ($)',
  defaultInflationRate: 3.0,
  defaultPreRetireReturn: 6.5,
  defaultPostRetireReturn: 4.5,
  defaultLifeExpectancy: 88,
  defaultRetirementAge: 62,
  defaultEmergencyMonths: 6,
  customDisclaimer: 'This Financial Planning Report is prepared based on information and declarations provided by the client, prevailing statutory CPF policies, and stated economic return assumptions. Actual investment performance, tax treatment, and annuity payouts will depend on prevailing market conditions and regulatory frameworks at the time of execution. Periodic review is recommended upon any major life event (e.g. marriage, childbirth, property purchase, or career change).'
};

const POPULAR_CREDENTIALS = [
  'CFP®',
  'ChFC®',
  'CFA®',
  'AEPP®',
  'CLU®',
  'IBF-Advanced',
  'IBF-Qualified',
  'MDRT',
  'COT',
  'TOT',
  'Chartered Wealth Manager'
];

export default function SettingsView() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [activeSubTab, setActiveSubTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [customCredInput, setCustomCredInput] = useState('');
  const [clearingLogs, setClearingLogs] = useState(false);
  const [logsCleared, setLogsCleared] = useState(false);
  const [appVersion, setAppVersion] = useState('0.0.1');
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateResult, setUpdateResult] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      if (window.electronAPI?.getAppSettings) {
        try {
          const res = await window.electronAPI.getAppSettings();
          if (res.success && res.settings) {
            setSettings(prev => ({ ...prev, ...res.settings }));
          }
        } catch (err) {
          console.error("Failed to load app settings:", err);
        }
      }
      if (window.electronAPI?.getAppVersion) {
        try {
          const vRes = await window.electronAPI.getAppVersion();
          if (vRes.success && vRes.version) {
            setAppVersion(vRes.version);
          }
        } catch (err) {
          console.error("Failed to get app version:", err);
        }
      }
    };
    fetchSettings();
  }, []);

  const handleManualCheckUpdates = async () => {
    setIsCheckingUpdate(true);
    setUpdateResult(null);
    try {
      if (window.electronAPI?.checkForUpdates) {
        const res = await window.electronAPI.checkForUpdates();
        if (res.success) {
          if (res.updateInfo && res.updateInfo.version !== appVersion) {
            setUpdateResult({ type: 'available', version: res.updateInfo.version });
          } else {
            setUpdateResult({ type: 'latest' });
          }
        } else {
          setUpdateResult({ type: 'error', error: res.error });
        }
      }
    } catch (err) {
      setUpdateResult({ type: 'error', error: err.message });
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleCredential = (cred) => {
    setSettings(prev => {
      const current = prev.credentials || [];
      if (current.includes(cred)) {
        return { ...prev, credentials: current.filter(c => c !== cred) };
      } else {
        return { ...prev, credentials: [...current, cred] };
      }
    });
  };

  const handleAddCustomCredential = (e) => {
    e.preventDefault();
    if (!customCredInput.trim()) return;
    const trimmed = customCredInput.trim();
    if (!settings.credentials?.includes(trimmed)) {
      setSettings(prev => ({
        ...prev,
        credentials: [...(prev.credentials || []), trimmed]
      }));
    }
    setCustomCredInput('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (window.electronAPI?.saveAppSettings) {
        const res = await window.electronAPI.saveAppSettings(settings);
        if (res.success) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 4000);
        }
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm("Reset all settings to default values?")) {
      setSettings(DEFAULT_SETTINGS);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm("Are you sure you want to clear system logs?")) return;
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

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={24} color="var(--accent-primary)" />
            Practice & Advisory Settings
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Configure consultant credentials, report document titles & subtitles, default actuarial assumptions, and preferences.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)', fontSize: '13px', padding: '9px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={handleResetToDefaults}
          >
            <RotateCcw size={15} /> Reset Defaults
          </button>

          <button
            className="btn btn-primary"
            style={{ fontSize: '13px', padding: '9px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={handleSave}
            disabled={isSaving}
          >
            {saveSuccess ? <CheckCircle2 size={16} /> : <Save size={16} />}
            {saveSuccess ? 'Settings Saved!' : isSaving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div style={{
          padding: '12px 18px',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '10px',
          color: '#34d399',
          fontSize: '13px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={18} />
          Settings successfully saved. All new client blueprints, PDF exports, and AI analyses will automatically reflect your updated consultant profile.
        </div>
      )}

      {/* Sub Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--border-light)',
        paddingBottom: '12px'
      }}>
        {[
          { id: 'profile', label: 'Consultant Profile', icon: <User size={16} /> },
          { id: 'branding', label: 'Report & Document Branding', icon: <FileText size={16} /> },
          { id: 'actuarial', label: 'Actuarial Defaults', icon: <Sliders size={16} /> },
          { id: 'system', label: 'System & Logs', icon: <Database size={16} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeSubTab === tab.id ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
              color: activeSubTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: activeSubTab === tab.id ? '600' : '400',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: CONSULTANT PROFILE */}
      {activeSubTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="var(--accent-primary)" />
              Consultant Particulars
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Consultant Full Name *
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.consultantName || ''}
                  onChange={(e) => handleChange('consultantName', e.target.value)}
                  placeholder="e.g. Pieter Beetsma"
                  style={{ width: '100%' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Appears as "Prepared by [Name]" on all client reports and PDF plans.
                </span>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Professional Title / Designation
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.consultantTitle || ''}
                  onChange={(e) => handleChange('consultantTitle', e.target.value)}
                  placeholder="e.g. Senior Financial Consultant / Wealth Director"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  MAS Representative / FAR License Number
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.repNumber || ''}
                  onChange={(e) => handleChange('repNumber', e.target.value)}
                  placeholder="e.g. MAS Rep No. PB-892415"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Direct Contact Number / Mobile
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="e.g. +65 9123 4567"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Business Email Address
                </label>
                <input
                  type="email"
                  className="form-control"
                  value={settings.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="e.g. consultant@advisory.sg"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Office / Business Address
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.officeAddress || ''}
                  onChange={(e) => handleChange('officeAddress', e.target.value)}
                  placeholder="e.g. 1 Marina Boulevard, Singapore 018989"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Credentials & Accreditations */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="#f59e0b" />
              Professional Credentials & Accreditations
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
              Select your active certifications. These will appear on client PDF reports under "Professional Designations".
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {POPULAR_CREDENTIALS.map(cred => {
                const active = (settings.credentials || []).includes(cred);
                return (
                  <button
                    key={cred}
                    type="button"
                    onClick={() => handleToggleCredential(cred)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: active ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
                      backgroundColor: active ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: active ? '600' : '400',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    {active && <Check size={13} />}
                    {cred}
                  </button>
                );
              })}
            </div>

            {/* Custom Credential Addition */}
            <form onSubmit={handleAddCustomCredential} style={{ display: 'flex', gap: '10px', maxWidth: '450px' }}>
              <input
                type="text"
                className="form-control"
                value={customCredInput}
                onChange={(e) => setCustomCredInput(e.target.value)}
                placeholder="Add custom certification..."
                style={{ flex: 1, fontSize: '12px' }}
              />
              <button
                type="submit"
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 14px' }}
              >
                <Plus size={14} /> Add
              </button>
            </form>
          </div>

        </div>
      )}

      {/* TAB 2: REPORT & BRANDING */}
      {activeSubTab === 'branding' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#60a5fa" />
              Client Report Branding & Disclaimers
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Report Top Banner Title
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.reportHeaderBranding || ''}
                  onChange={(e) => handleChange('reportHeaderBranding', e.target.value)}
                  placeholder="e.g. FINANCIAL PLANNING REPORT"
                  style={{ width: '100%' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Appears at the very top of all report pages.
                </span>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Report Subtitle / Tagline (Optional)
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.reportSubtitle || ''}
                  onChange={(e) => handleChange('reportSubtitle', e.target.value)}
                  placeholder="e.g. Comprehensive Financial & Retirement Review (Leave empty for none)"
                  style={{ width: '100%' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Displayed below the top banner title on the cover page. Leave blank if no subtitle is desired.
                </span>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Preferred Report Currency
                </label>
                <select
                  className="form-control"
                  value={settings.defaultCurrency || 'SGD ($)'}
                  onChange={(e) => handleChange('defaultCurrency', e.target.value)}
                  style={{ maxWidth: '300px' }}
                >
                  <option value="SGD ($)">Singapore Dollar (SGD $)</option>
                  <option value="USD ($)">US Dollar (USD $)</option>
                  <option value="EUR (€)">Euro (EUR €)</option>
                  <option value="GBP (£)">British Pound (GBP £)</option>
                  <option value="AUD ($)">Australian Dollar (AUD $)</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Standard Fiduciary & Regulatory Compliance Disclaimer
                </label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={settings.customDisclaimer || ''}
                  onChange={(e) => handleChange('customDisclaimer', e.target.value)}
                  style={{ width: '100%', fontSize: '12px', lineHeight: '1.5' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Rendered on Page 6 of all client PDF reports.
                </span>
              </div>
            </div>
          </div>

          {/* Live Document Header Preview */}
          <div className="glass-panel" style={{ padding: '20px', backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
              Live PDF Header Preview
            </div>
            <div style={{ backgroundColor: '#FFFFFF', color: '#0F172A', padding: '16px 20px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0F172A', paddingBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {settings.reportHeaderBranding || 'FINANCIAL PLANNING REPORT'}
                  </div>
                  {settings.reportSubtitle && (
                    <div style={{ fontSize: '8.5px', color: '#475569', fontWeight: '600', textTransform: 'uppercase' }}>
                      {settings.reportSubtitle}
                    </div>
                  )}
                </div>
                <span style={{ backgroundColor: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', fontSize: '8px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px' }}>
                  CONFIDENTIAL FINANCIAL REPORT
                </span>
              </div>
              <div style={{ marginTop: '8px', fontSize: '9.5px', color: '#64748B' }}>
                Prepared by: <strong style={{ color: '#0F172A' }}>{settings.consultantName || 'Consultant Name'}</strong> ({settings.consultantTitle}) • {settings.credentials?.join(' • ')}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: ACTUARIAL DEFAULTS */}
      {activeSubTab === 'actuarial' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} color="#34d399" />
              Default Actuarial & Financial Planning Assumptions
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 20px 0' }}>
              These default values populate new client financial planning profiles automatically. You can always override them on a per-client basis.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Default Pre-Retirement Return (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control"
                  value={settings.defaultPreRetireReturn}
                  onChange={(e) => handleChange('defaultPreRetireReturn', Number(e.target.value))}
                  style={{ width: '100%' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Default growth rate on invested capital pre-retirement.
                </span>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Default Post-Retirement Return (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control"
                  value={settings.defaultPostRetireReturn}
                  onChange={(e) => handleChange('defaultPostRetireReturn', Number(e.target.value))}
                  style={{ width: '100%' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Conservative growth rate during decumulation.
                </span>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Default Long-Term Inflation (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control"
                  value={settings.defaultInflationRate}
                  onChange={(e) => handleChange('defaultInflationRate', Number(e.target.value))}
                  style={{ width: '100%' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Assumed annual living expense inflation.
                </span>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Default Target Retirement Age
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={settings.defaultRetirementAge}
                  onChange={(e) => handleChange('defaultRetirementAge', Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Default Life Expectancy Age
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={settings.defaultLifeExpectancy}
                  onChange={(e) => handleChange('defaultLifeExpectancy', Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Default Emergency Buffer (Months)
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={settings.defaultEmergencyMonths}
                  onChange={(e) => handleChange('defaultEmergencyMonths', Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: SYSTEM & LOGS */}
      {activeSubTab === 'system' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} color="#c084fc" />
              System Maintenance & Diagnostics
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <div>
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block' }}>System Log File (`app.log`)</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Contains diagnostic logs for AI generation, PDF exports, and database transactions.
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn"
                    style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', fontSize: '12px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => {
                      if (window.electronAPI?.openLogFile) {
                        window.electronAPI.openLogFile();
                      }
                    }}
                  >
                    <FileText size={14} /> Open Log File
                  </button>
                  <button
                    className="btn"
                    style={{ backgroundColor: logsCleared ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: logsCleared ? '#34d399' : '#f87171', border: logsCleared ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)', fontSize: '12px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={handleClearLogs}
                    disabled={clearingLogs}
                  >
                    {logsCleared ? <Check size={14} /> : <Trash2 size={14} />}
                    {logsCleared ? 'Logs Cleared' : 'Clear Logs'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <div>
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block' }}>PDF Blueprint Engine Status</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Standard: 6-Page Institutional A4 Dossier with Singapore CPF LIFE & Actuarial Benchmarks.
                  </span>
                </div>
                <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  ✓ Online & Compliant
                </span>
              </div>
            </div>
          </div>

          {/* Application Updates Card */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ArrowUpCircle size={18} color="var(--accent-primary)" />
                  Application Updates & Version Control
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Managed via GitHub Releases. Checks for releases and allows 1-click in-app updates.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '4px 10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                  Current Version: <strong>v{appVersion}</strong>
                </span>
                <button
                  className="btn btn-primary"
                  style={{ fontSize: '12px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={handleManualCheckUpdates}
                  disabled={isCheckingUpdate}
                >
                  <RefreshCw size={13} className={isCheckingUpdate ? 'animate-spin' : ''} />
                  {isCheckingUpdate ? 'Checking GitHub...' : 'Check for Updates'}
                </button>
              </div>
            </div>

            {updateResult && (
              <div style={{
                marginTop: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '12.5px',
                backgroundColor: updateResult.type === 'available' ? 'rgba(139, 92, 246, 0.1)' : updateResult.type === 'latest' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: updateResult.type === 'available' ? '1px solid rgba(139, 92, 246, 0.3)' : updateResult.type === 'latest' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                color: updateResult.type === 'available' ? '#c084fc' : updateResult.type === 'latest' ? '#34d399' : '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {updateResult.type === 'available' ? <ArrowUpCircle size={16} /> : updateResult.type === 'latest' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>
                    {updateResult.type === 'available' 
                      ? `New update v${updateResult.version} is available on GitHub Releases!`
                      : updateResult.type === 'latest' 
                      ? `You are on the latest version (v${appVersion}).` 
                      : `Update check note: ${updateResult.error || 'Unable to connect to GitHub releases.'}`}
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
