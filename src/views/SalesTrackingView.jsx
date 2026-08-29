import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Target, Award, DollarSign, Shield, Briefcase, 
  BarChart3, PieChart, Calendar, RefreshCw, ArrowUpRight, ArrowDownRight, 
  CheckCircle2, AlertTriangle, Layers, Users, Clock, Compass
} from 'lucide-react';
import { useAdvisorContext } from '../context/AdvisorContext';

const MDRT_TIERS = {
  mdrt: { label: 'MDRT (Million Dollar Round Table)', target: 110000, color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)', name: 'MDRT' },
  cot:  { label: 'COT (Court of the Table — 3x)',    target: 330000, color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)', name: 'COT' },
  tot:  { label: 'TOT (Top of the Table — 6x)',      target: 660000, color: '#c084fc', bg: 'rgba(168, 85, 247, 0.15)', name: 'TOT' }
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function SalesTrackingView() {
  const { setAdvisorContext } = useAdvisorContext();
  const [pipeline, setPipeline] = useState([]);
  const [clients, setClients] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedTierKey, setSelectedTierKey] = useState('mdrt'); // 'mdrt' | 'cot' | 'tot'

  // Sync with Archie 2.0
  useEffect(() => {
    setAdvisorContext({
      section: 'sales',
      subSection: null,
      activeSubTab: null,
      entityContext: {
        activeTier: selectedTierKey
      }
    });
  }, [selectedTierKey, setAdvisorContext]);

  const loadData = async () => {
    setLoading(true);
    if (window.electronAPI) {
      try {
        const [pRes, cRes, polRes] = await Promise.all([
          window.electronAPI.getPipeline ? window.electronAPI.getPipeline() : Promise.resolve({ success: false }),
          window.electronAPI.getClients ? window.electronAPI.getClients() : Promise.resolve({ success: false }),
          window.electronAPI.getAllPolicies ? window.electronAPI.getAllPolicies() : Promise.resolve({ success: false })
        ]);
        if (pRes?.success) setPipeline(pRes.data || []);
        if (cRes?.success) setClients(cRes.data || []);
        if (polRes?.success) setPolicies(polRes.data || []);
      } catch (err) {
        console.error('Failed to load sales tracking data:', err);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Filter cases by year
  const yearCases = useMemo(() => {
    return pipeline.filter(c => {
      const caseDate = c.updatedAt || c.createdAt || c.expectedCloseDate;
      if (!caseDate) return true;
      const d = new Date(caseDate);
      return d.getFullYear() === selectedYear;
    });
  }, [pipeline, selectedYear]);

  // Issued cases in selected year
  const issuedCases = useMemo(() => {
    return yearCases.filter(c => c.stage === 'Case Issued');
  }, [yearCases]);

  // Aggregate Metrics
  const totalYtdFyc = useMemo(() => {
    return issuedCases.reduce((sum, c) => sum + (Number(c.estimatedFYC) || 0), 0);
  }, [issuedCases]);

  const totalYtdPremium = useMemo(() => {
    return issuedCases.reduce((sum, c) => sum + (Number(c.estimatedPremium) || 0), 0);
  }, [issuedCases]);

  const issuedCount = issuedCases.length;
  const avgCaseFyc = issuedCount > 0 ? totalYtdFyc / issuedCount : 0;
  const avgCasePremium = issuedCount > 0 ? totalYtdPremium / issuedCount : 0;

  // MDRT Calculations
  const currentTier = MDRT_TIERS[selectedTierKey];
  const targetFyc = currentTier.target;
  const progressPercent = Math.min(Math.round((totalYtdFyc / targetFyc) * 100), 100);
  const remainingFyc = Math.max(targetFyc - totalYtdFyc, 0);

  const currentMonthIndex = new Date().getMonth(); // 0-11
  const remainingMonths = Math.max(12 - currentMonthIndex, 1);
  const requiredMonthlyRunRate = remainingFyc > 0 ? remainingFyc / remainingMonths : 0;
  const standardExpectedPace = (targetFyc / 12) * (currentMonthIndex + 1);
  const isAheadOfPace = totalYtdFyc >= standardExpectedPace;
  const paceVariance = totalYtdFyc - standardExpectedPace;

  // Monthly Velocity Distribution (Jan - Dec)
  const monthlyData = useMemo(() => {
    const months = Array(12).fill(0).map((_, i) => ({
      month: MONTH_NAMES[i],
      monthIndex: i,
      fyc: 0,
      premium: 0,
      cases: 0
    }));

    issuedCases.forEach(c => {
      const d = new Date(c.updatedAt || c.createdAt);
      const mIdx = d.getMonth();
      if (mIdx >= 0 && mIdx < 12) {
        months[mIdx].fyc += Number(c.estimatedFYC) || 0;
        months[mIdx].premium += Number(c.estimatedPremium) || 0;
        months[mIdx].cases += 1;
      }
    });

    return months;
  }, [issuedCases]);

  const maxMonthlyFyc = Math.max(...monthlyData.map(m => m.fyc), (targetFyc / 12) * 1.5, 10000);

  // Quarterly Breakdowns
  const quarterlyData = useMemo(() => {
    return [
      { name: 'Q1 (Jan - Mar)', fyc: monthlyData.slice(0, 3).reduce((s, m) => s + m.fyc, 0), cases: monthlyData.slice(0, 3).reduce((s, m) => s + m.cases, 0) },
      { name: 'Q2 (Apr - Jun)', fyc: monthlyData.slice(3, 6).reduce((s, m) => s + m.fyc, 0), cases: monthlyData.slice(3, 6).reduce((s, m) => s + m.cases, 0) },
      { name: 'Q3 (Jul - Sep)', fyc: monthlyData.slice(6, 9).reduce((s, m) => s + m.fyc, 0), cases: monthlyData.slice(6, 9).reduce((s, m) => s + m.cases, 0) },
      { name: 'Q4 (Oct - Dec)', fyc: monthlyData.slice(9, 12).reduce((s, m) => s + m.fyc, 0), cases: monthlyData.slice(9, 12).reduce((s, m) => s + m.cases, 0) }
    ];
  }, [monthlyData]);

  // Product Mix Breakdown
  const productMix = useMemo(() => {
    const types = {};
    issuedCases.forEach(c => {
      const type = c.policyType || 'Life';
      if (!types[type]) {
        types[type] = { type, fyc: 0, premium: 0, count: 0 };
      }
      types[type].fyc += Number(c.estimatedFYC) || 0;
      types[type].premium += Number(c.estimatedPremium) || 0;
      types[type].count += 1;
    });

    return Object.values(types).sort((a, b) => b.fyc - a.fyc);
  }, [issuedCases]);

  // Funnel Analytics
  const funnelStages = [
    { stage: 'Prospect', label: 'Prospects Identified', count: yearCases.filter(c => ['Prospect', 'Fact Finding', 'Proposal Sent', 'Case Submitted', 'Case Issued'].includes(c.stage)).length, color: '#a78bfa' },
    { stage: 'Fact Finding', label: 'Fact Finding Conducted', count: yearCases.filter(c => ['Fact Finding', 'Proposal Sent', 'Case Submitted', 'Case Issued'].includes(c.stage)).length, color: '#60a5fa' },
    { stage: 'Proposal Sent', label: 'Proposals Presented', count: yearCases.filter(c => ['Proposal Sent', 'Case Submitted', 'Case Issued'].includes(c.stage)).length, color: '#fbbf24' },
    { stage: 'Case Submitted', label: 'Cases Submitted', count: yearCases.filter(c => ['Case Submitted', 'Case Issued'].includes(c.stage)).length, color: '#fb923c' },
    { stage: 'Case Issued', label: 'Policies In-Force (Won)', count: yearCases.filter(c => c.stage === 'Case Issued').length, color: '#34d399' }
  ];

  const initialFunnelCount = Math.max(funnelStages[0].count, 1);
  const overallConversionRate = funnelStages[0].count > 0 
    ? Math.round((funnelStages[4].count / funnelStages[0].count) * 100) 
    : 0;

  return (
    <div className="view-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto' }}>
      
      {/* Header & Controls Bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex' }}>
              <TrendingUp size={22} />
            </div>
            <div>
              <h1 className="text-gradient" style={{ fontSize: '24px', margin: 0, fontWeight: '700' }}>
                Sales Performance & MDRT Command Center
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '2px 0 0 0' }}>
                Annual production velocity, qualification pacing, product distribution, and deal conversion metrics.
              </p>
            </div>
          </div>
        </div>

        {/* Action & Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Year Switcher */}
          <div style={{ display: 'flex', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border-light)' }}>
            {[2026, 2025].map(yr => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: selectedYear === yr ? 'var(--accent-primary)' : 'transparent',
                  color: selectedYear === yr ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {yr}
              </button>
            ))}
          </div>

          {/* MDRT Tier Switcher */}
          <div style={{ display: 'flex', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border-light)' }}>
            {Object.entries(MDRT_TIERS).map(([k, t]) => (
              <button
                key={k}
                onClick={() => setSelectedTierKey(k)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: selectedTierKey === k ? t.bg : 'transparent',
                  color: selectedTierKey === k ? t.color : 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {t.name}
              </button>
            ))}
          </div>

          <button
            className="btn"
            style={{ padding: '7px 12px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            onClick={loadData}
          >
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </header>

      {/* Row 1: Executive KPI Cards (4 Tiles) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div className="glass-panel" style={{ padding: '18px 20px', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>YTD Issued FYC</span>
            <DollarSign size={16} color="#34d399" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#34d399' }}>
            {formatCurrency(totalYtdFyc)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {progressPercent}% of {currentTier.name} Goal ({formatCurrency(targetFyc)})
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Annualized Premium</span>
            <Shield size={16} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
            {formatCurrency(totalYtdPremium)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Across {issuedCount} in-force policies
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Avg. Case Size (FYC)</span>
            <Briefcase size={16} color="#60a5fa" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#60a5fa' }}>
            {formatCurrency(avgCaseFyc)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Avg. Premium: {formatCurrency(avgCasePremium)}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Conversion Rate</span>
            <Award size={16} color="#fbbf24" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#fbbf24' }}>
            {overallConversionRate}%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {issuedCount} of {funnelStages[0].count} prospects converted
          </div>
        </div>
      </div>

      {/* Row 2: MDRT Qualification Pacing Thermometer */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: `1px solid ${currentTier.color}33`, background: `linear-gradient(135deg, ${currentTier.bg} 0%, rgba(18,18,26,0.7) 100%)` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={22} color={currentTier.color} />
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                {currentTier.label} Tracking ({selectedYear})
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Benchmark Target: <strong>{formatCurrency(targetFyc)} FYC</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              padding: '4px 12px',
              borderRadius: '12px',
              backgroundColor: isAheadOfPace ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: isAheadOfPace ? '#34d399' : '#fbbf24',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {isAheadOfPace ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
              {isAheadOfPace ? `Ahead of Pace (+${formatCurrency(Math.abs(paceVariance))})` : `Pace Required (${formatCurrency(Math.abs(paceVariance))} gap)`}
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div style={{ width: '100%', height: '14px', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '7px', overflow: 'hidden', position: 'relative', marginBottom: '16px', border: '1px solid var(--border-light)' }}>
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: `linear-gradient(90deg, ${currentTier.color}88 0%, ${currentTier.color} 100%)`,
              borderRadius: '7px',
              transition: 'width 0.6s ease'
            }}
          />
        </div>

        {/* Pacing Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', fontSize: '13px' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '2px' }}>Current Achievement</div>
            <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '15px' }}>
              {formatCurrency(totalYtdFyc)} ({progressPercent}%)
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '2px' }}>Remaining to Goal</div>
            <div style={{ fontWeight: '700', color: remainingFyc === 0 ? '#34d399' : 'var(--text-secondary)', fontSize: '15px' }}>
              {remainingFyc === 0 ? 'Goal Achieved! 🎉' : formatCurrency(remainingFyc)}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '2px' }}>Remaining Timeline</div>
            <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '15px' }}>
              {remainingMonths} Month{remainingMonths > 1 ? 's' : ''} (until Dec 31)
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '2px' }}>Required Monthly Run-Rate</div>
            <div style={{ fontWeight: '700', color: currentTier.color, fontSize: '15px' }}>
              {formatCurrency(requiredMonthlyRunRate)}/mo
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Monthly Production Velocity (Bar Chart) & Quarterly Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        
        {/* Monthly Production Chart */}
        <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <BarChart3 size={16} color="var(--accent-primary)" />
              Monthly Sales Velocity (FYC in {selectedYear})
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Target benchmark: {formatCurrency(targetFyc / 12)}/mth
            </span>
          </div>

          {/* SVG Bar Chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '10px', height: '180px', paddingTop: '20px' }}>
            {monthlyData.map((m, idx) => {
              const barHeight = maxMonthlyFyc > 0 ? (m.fyc / maxMonthlyFyc) * 130 : 0;
              const isPastOrCurrent = idx <= currentMonthIndex;
              return (
                <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: '10px', color: m.fyc > 0 ? 'var(--text-primary)' : 'transparent', fontWeight: '600' }}>
                    {m.fyc > 0 ? `$${Math.round(m.fyc / 1000)}k` : ''}
                  </div>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '28px',
                      height: `${Math.max(barHeight, 4)}px`,
                      borderRadius: '4px',
                      backgroundColor: m.fyc > 0 ? 'var(--accent-primary)' : (isPastOrCurrent ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)'),
                      border: m.fyc > 0 ? '1px solid rgba(139, 92, 246, 0.4)' : 'none',
                      transition: 'height 0.4s ease'
                    }}
                    title={`${m.month}: ${formatCurrency(m.fyc)} (${m.cases} cases)`}
                  />
                  <span style={{ fontSize: '11px', color: idx === currentMonthIndex ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: idx === currentMonthIndex ? '700' : '400' }}>
                    {m.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quarterly Production Summary */}
        <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Calendar size={16} color="#60a5fa" />
            Quarterly Production
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'space-around' }}>
            {quarterlyData.map(q => (
              <div key={q.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{q.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{q.cases} Issued Cases</div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: q.fyc > 0 ? 'var(--accent-success)' : 'var(--text-muted)' }}>
                  {formatCurrency(q.fyc)}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row 4: Product Mix Distribution & Conversion Funnel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        
        {/* Product Mix */}
        <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <PieChart size={16} color="var(--accent-secondary)" />
            Product Portfolio Revenue Mix
          </h3>

          {productMix.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              No issued policies in {selectedYear} yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {productMix.map(p => {
                const share = totalYtdFyc > 0 ? Math.round((p.fyc / totalYtdFyc) * 100) : 0;
                return (
                  <div key={p.type} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{p.type}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        <strong>{formatCurrency(p.fyc)}</strong> ({share}%) • {p.count} case{p.count > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${share}%`, backgroundColor: 'var(--accent-secondary)', borderRadius: '3px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sales Conversion Funnel */}
        <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Compass size={16} color="#fbbf24" />
              Pipeline Conversion Funnel
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--accent-success)', fontWeight: '600' }}>
              {overallConversionRate}% Win Rate
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {funnelStages.map((st, i) => {
              const pct = initialFunnelCount > 0 ? Math.round((st.count / initialFunnelCount) * 100) : 0;
              return (
                <div key={st.stage} style={{ padding: '10px 14px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: st.color }} />
                    <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{st.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{st.count}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '40px', textAlign: 'right' }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
