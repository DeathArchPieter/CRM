import React, { useState, useEffect } from 'react';
import {
  X, Sparkles, TrendingUp, DollarSign, Calculator, RefreshCw,
  AlertTriangle, CheckCircle2, Copy, Check, Table, HelpCircle,
  ArrowRight, Shield, Zap, Layers, FileText
} from 'lucide-react';

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(val) || val === '') return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(val) || 0);
};

export default function ProjectionGraphBreakdownModal({
  isOpen,
  onClose,
  client,
  planData,
  projectionResults,
  lifeEvents
}) {
  const [activeTab, setActiveTab] = useState('ai-audit'); // 'ai-audit' | 'formulas' | 'ledger'
  const [aiLoading, setAiLoading] = useState(false);
  const [aiBreakdown, setAiBreakdown] = useState(null);
  const [ledgerFilter, setLedgerFilter] = useState('all'); // 'all' | 'accumulation' | 'decumulation'
  const [ledgerMode, setLedgerMode] = useState('baseline'); // 'baseline' | 'stress'
  const [copiedText, setCopiedText] = useState(false);

  // Auto-generate AI breakdown when modal opens if not already loaded
  useEffect(() => {
    if (isOpen && !aiBreakdown && !aiLoading) {
      handleGenerateBreakdown();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const baselineData = projectionResults?.baseline?.yearlyData || [];
  const stressData = projectionResults?.stressTested?.yearlyData || [];
  const activeEventsCount = (lifeEvents || []).filter(e => e.active).length;

  const handleGenerateBreakdown = async () => {
    setAiLoading(true);
    if (window.electronAPI?.generateProjectionGraphBreakdown && client) {
      try {
        const res = await window.electronAPI.generateProjectionGraphBreakdown({
          client,
          planData,
          projectionData: projectionResults?.baseline || {},
          lifeEvents
        });
        if (res.success && res.breakdown) {
          setAiBreakdown(res.breakdown);
        }
      } catch (err) {
        console.error("Error generating graph breakdown:", err);
      }
    }
    setAiLoading(false);
  };

  const handleCopySummary = () => {
    const startAge = planData?.profile?.currentAge || 30;
    const retireAge = planData?.profile?.targetRetirementAge || 65;
    const lifeExp = planData?.profile?.lifeExpectancy || 85;
    const peakCap = projectionResults?.baseline?.peakCapital || 0;
    const depletion = projectionResults?.baseline?.depletedAtAge;

    const summary = `LIFETIME PROJECTION GRAPH BREAKDOWN FOR ${client?.fullName}:
- Working Horizon: Age ${startAge} to ${retireAge} (${retireAge - startAge} years)
- Retirement Horizon: Age ${retireAge} to ${lifeExp} (${lifeExp - retireAge} years)
- Peak Capital at Retirement: ${formatCurrency(peakCap)}
- Longevity Solvency: ${depletion ? `Capital depleted at Age ${depletion}` : `Sustains past Life Expectancy (Age ${lifeExp})`}
- Pre-Retirement Yield: ${planData?.profile?.preRetireReturn || 6}% p.a. | Post-Retirement: ${planData?.profile?.postRetireReturn || 4}% p.a.
- Inflation Rate: ${planData?.profile?.inflationRate || 3}% p.a.
- Desired Living in Retirement: ${formatCurrency(planData?.retirementTarget?.desiredMonthlyIncome || 0)}/mo
- CPF Life / Guaranteed Pension Offset: ${formatCurrency(planData?.retirementTarget?.expectedAnnuityPensions || 0)}/mo
${aiBreakdown?.executiveNarrative ? `\nEXECUTIVE ACTUARIAL SUMMARY:\n${aiBreakdown.executiveNarrative}` : ''}`;

    navigator.clipboard.writeText(summary);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const activeLedgerData = (ledgerMode === 'stress' ? stressData : baselineData).filter(row => {
    if (ledgerFilter === 'accumulation') return row.phase === 'Accumulation';
    if (ledgerFilter === 'decumulation') return row.phase === 'Decumulation';
    return true;
  });

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel animate-scale-up" style={{
        width: '100%',
        maxWidth: '960px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0f172a',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        overflow: 'hidden'
      }}>
        
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(15, 23, 42, 0.8)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <TrendingUp size={22} color="#10b981" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Lifetime Projection Curve: Deep Mathematical & AI Audit
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Algorithmic formulation, compounding sequence, inflation drag, and year-by-year cashflow ledger for <strong>{client?.fullName}</strong>.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleCopySummary}
              className="btn"
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {copiedText ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
              {copiedText ? 'Copied!' : 'Copy Summary'}
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 24px 0 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          overflowX: 'auto'
        }}>
          {[
            { id: 'ai-audit', label: '🤖 AI Actuarial & Quantitative Narrative' },
            { id: 'formulas', label: '📐 Mathematical Formulas & Methodology' },
            { id: 'ledger', label: '📊 Year-by-Year Simulation Ledger' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: activeTab === tab.id ? '600' : '500',
                color: activeTab === tab.id ? '#10b981' : 'var(--text-secondary)',
                backgroundColor: activeTab === tab.id ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #10b981' : '2px solid transparent',
                borderRadius: '6px 6px 0 0',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* TAB 1: AI ACTUARIAL NARRATIVE AUDIT */}
          {activeTab === 'ai-audit' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Actuarial audit synthesized with <strong>Gemini AI</strong> based on client portfolio growth, savings velocity, and decumulation drawdown.
                </span>
                <button
                  className="btn"
                  style={{
                    fontSize: '12px',
                    padding: '6px 12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onClick={handleGenerateBreakdown}
                  disabled={aiLoading}
                >
                  <RefreshCw size={13} style={{ animation: aiLoading ? 'spin 1s linear infinite' : 'none' }} />
                  {aiLoading ? 'Synthesizing...' : 'Re-Analyze with AI'}
                </button>
              </div>

              {aiLoading ? (
                <div style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <Sparkles size={36} color="#10b981" style={{ animation: 'spin 2s linear infinite' }} />
                  <div style={{ fontSize: '15px', color: 'var(--text-primary)' }}>Formulating actuarial graph breakdown with Gemini AI...</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Analyzing sequence of returns, inflation drag, and longevity solvency.</div>
                </div>
              ) : aiBreakdown ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  
                  {/* Executive Macro Trajectory */}
                  <div style={{ padding: '18px', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Executive Macro Trajectory
                      </span>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: projectionResults?.baseline?.depletedAtAge ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: projectionResults?.baseline?.depletedAtAge ? '#f87171' : '#34d399', fontWeight: '600' }}>
                        {projectionResults?.baseline?.depletedAtAge ? `⚠️ Depletes at Age ${projectionResults.baseline.depletedAtAge}` : '✓ Fully Solvent to Age 85+'}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.6', margin: 0 }}>
                      {aiBreakdown.executiveNarrative}
                    </p>
                  </div>

                  {/* 2-Column: Accumulation vs Decumulation */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    
                    {/* Accumulation Phase */}
                    <div style={{ padding: '16px', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <TrendingUp size={15} /> 1. Accumulation Phase (Age {planData?.profile?.currentAge || 30} → {planData?.profile?.targetRetirementAge || 65})
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                        {aiBreakdown.accumulationPhaseBreakdown?.summary}
                      </p>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px dashed rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                        • <strong>Growth Driver:</strong> {aiBreakdown.accumulationPhaseBreakdown?.growthDriver}<br />
                        • <strong>Savings Velocity:</strong> {aiBreakdown.accumulationPhaseBreakdown?.savingsVelocity}
                      </div>
                    </div>

                    {/* Decumulation Phase */}
                    <div style={{ padding: '16px', backgroundColor: 'rgba(236, 72, 153, 0.05)', borderRadius: '10px', border: '1px solid rgba(236, 72, 153, 0.2)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#f472b6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <DollarSign size={15} /> 2. Decumulation Phase (Age {planData?.profile?.targetRetirementAge || 65} → {planData?.profile?.lifeExpectancy || 85})
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                        {aiBreakdown.decumulationPhaseBreakdown?.summary}
                      </p>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px dashed rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                        • <strong>Inflation Drag:</strong> {aiBreakdown.decumulationPhaseBreakdown?.inflationDrag}<br />
                        • <strong>Annuity Cushion:</strong> {aiBreakdown.decumulationPhaseBreakdown?.annuityOffset}<br />
                        • <strong>Solvency:</strong> {aiBreakdown.decumulationPhaseBreakdown?.longevitySolvency}
                      </div>
                    </div>

                  </div>

                  {/* Stress Testing Impact */}
                  {aiBreakdown.stressTestingImpact && (
                    <div style={{ padding: '14px 16px', backgroundColor: 'rgba(245, 158, 11, 0.06)', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#fbbf24', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Zap size={14} /> Stress Testing & Shock Sensitivity ({activeEventsCount} Active Events)
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                        {aiBreakdown.stressTestingImpact}
                      </p>
                    </div>
                  )}

                  {/* Advisor Consultation Talking Points */}
                  {aiBreakdown.advisorConsultationTalkingPoints && (
                    <div style={{ padding: '14px 16px', backgroundColor: 'rgba(99, 102, 241, 0.06)', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#818cf8', marginBottom: '6px' }}>
                        💬 Advisor Consultation Talking Points for Review Meeting:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {aiBreakdown.advisorConsultationTalkingPoints.map((tp, idx) => (
                          <li key={idx}>{tp}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>
              ) : (
                <div style={{ padding: '36px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px dashed var(--border-light)' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Click "Re-Analyze with AI" above to generate a custom quantitative breakdown.</div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: MATHEMATICAL FORMULAS & METHODOLOGY */}
          {activeTab === 'formulas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calculator size={16} color="#60a5fa" /> Simulation Algorithm & Compound Recursion
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                  The projection curve executes an annual recursive simulation across each age from the client's current age (Age {planData?.profile?.currentAge || 30}) through their life expectancy (Age {planData?.profile?.lifeExpectancy || 85}).
                </p>
              </div>

              {/* Accumulation Formula Card */}
              <div style={{ padding: '16px', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.25)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#60a5fa' }}>
                  Phase 1: Pre-Retirement Accumulation Formula (Age &lt; Target Retirement Age)
                </span>
                <div style={{ padding: '12px 16px', backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', color: '#34d399', lineHeight: '1.6' }}>
                  K(t+1) = [ K(t) × (1 + r_pre) ] + Annual Savings(t) - Event Outlays(t)
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  • <strong>K(t):</strong> Liquid & Invested Capital at age t.<br />
                  • <strong>r_pre:</strong> Pre-retirement investment yield ({planData?.profile?.preRetireReturn || 6.0}% p.a.).<br />
                  • <strong>Annual Savings:</strong> Monthly Surplus ({formatCurrency(planData?.cashflow?.monthlySurplus || 0)}) × 12.<br />
                  • <strong>Event Outlays:</strong> Lump sums or income adjustments from active simulated life events.
                </div>
              </div>

              {/* Decumulation Formula Card */}
              <div style={{ padding: '16px', backgroundColor: 'rgba(236, 72, 153, 0.05)', borderRadius: '10px', border: '1px solid rgba(236, 72, 153, 0.25)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#f472b6' }}>
                  Phase 2: Post-Retirement Decumulation Formula (Age &ge; Target Retirement Age)
                </span>
                <div style={{ padding: '12px 16px', backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', color: '#f472b6', lineHeight: '1.6' }}>
                  K(t+1) = [ K(t) × (1 + r_post) ] - Net Annual Drawdown(t)
                </div>
                <div style={{ padding: '10px 14px', backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '12px', color: '#60a5fa' }}>
                  Net Monthly Drawdown = Desired Living × (1 + i)^(t - t_start) - CPF Life Annuity × (1 + i/2)^(t - t_start)
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  • <strong>r_post:</strong> Post-retirement defensive yield ({planData?.profile?.postRetireReturn || 4.0}% p.a.).<br />
                  • <strong>i:</strong> Inflation assumption ({planData?.profile?.inflationRate || 3.0}% p.a.).<br />
                  • <strong>CPF Life Annuity:</strong> Lifelong guaranteed payout cushion ({formatCurrency(planData?.retirementTarget?.expectedAnnuityPensions || 0)}/mo).
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: YEAR-BY-YEAR SIMULATION LEDGER */}
          {activeTab === 'ledger' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Ledger Controls Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Scenario:</span>
                  <button
                    onClick={() => setLedgerMode('baseline')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor: ledgerMode === 'baseline' ? '#10b981' : 'rgba(255,255,255,0.05)',
                      color: ledgerMode === 'baseline' ? '#000' : 'var(--text-secondary)',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Baseline Plan
                  </button>
                  {activeEventsCount > 0 && (
                    <button
                      onClick={() => setLedgerMode('stress')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: ledgerMode === 'stress' ? '#f59e0b' : 'rgba(255,255,255,0.05)',
                        color: ledgerMode === 'stress' ? '#000' : 'var(--text-secondary)',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Stress-Tested ({activeEventsCount} Events)
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Filter Phase:</span>
                  {['all', 'accumulation', 'decumulation'].map(f => (
                    <button
                      key={f}
                      onClick={() => setLedgerFilter(f)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        backgroundColor: ledgerFilter === f ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                        color: ledgerFilter === f ? '#60a5fa' : 'var(--text-muted)',
                        border: ledgerFilter === f ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                        cursor: 'pointer',
                        textTransform: 'capitalize'
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Table */}
              <div style={{ maxHeight: '420px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: '#1e293b', zIndex: 10 }}>
                    <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '8px 12px' }}>Age</th>
                      <th style={{ padding: '8px 12px' }}>Phase</th>
                      <th style={{ padding: '8px 12px' }}>Annual Cashflow</th>
                      <th style={{ padding: '8px 12px' }}>Ending Capital</th>
                      <th style={{ padding: '8px 12px' }}>Milestone / Status</th>
                    </tr>
                  </thead>
                  <tbody style={{ color: 'var(--text-secondary)' }}>
                    {activeLedgerData.map((row, idx) => {
                      const isRetireGate = row.age === (Number(planData?.profile?.targetRetirementAge) || 65);
                      const isPeak = row.capital === (projectionResults?.baseline?.peakCapital || 0);
                      const isDepleted = row.capital === 0;

                      return (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            backgroundColor: isRetireGate ? 'rgba(99, 102, 241, 0.08)' : isDepleted ? 'rgba(239, 68, 68, 0.08)' : 'transparent'
                          }}
                        >
                          <td style={{ padding: '8px 12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                            Age {row.age}
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '6px',
                              backgroundColor: row.phase === 'Accumulation' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(236, 72, 153, 0.15)',
                              color: row.phase === 'Accumulation' ? '#60a5fa' : '#f472b6'
                            }}>
                              {row.phase}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            {row.phase === 'Accumulation' ? (
                              <span style={{ color: '#34d399' }}>+{formatCurrency(row.surplus)}/yr</span>
                            ) : (
                              <span style={{ color: '#f87171' }}>-{formatCurrency(row.withdrawal)}/yr</span>
                            )}
                          </td>
                          <td style={{ padding: '8px 12px', fontWeight: '600', color: row.capital > 0 ? 'var(--text-primary)' : '#f87171' }}>
                            {formatCurrency(row.capital)}
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            {isRetireGate ? (
                              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontWeight: '600' }}>
                                🏖️ Retirement Gate
                              </span>
                            ) : isPeak ? (
                              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: '600' }}>
                                👑 Peak Nest Egg
                              </span>
                            ) : isDepleted ? (
                              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', fontWeight: '600' }}>
                                ⚠️ Depleted
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(15, 23, 42, 0.8)'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Baseline Peak Capital: <strong style={{ color: '#10b981' }}>{formatCurrency(projectionResults?.baseline?.peakCapital)}</strong> • Depletion Age: <strong style={{ color: projectionResults?.baseline?.depletedAtAge ? '#f87171' : '#34d399' }}>{projectionResults?.baseline?.depletedAtAge ? `Age ${projectionResults.baseline.depletedAtAge}` : 'None (Solvent)'}</strong>
          </div>
          <button
            className="btn btn-primary"
            style={{ fontSize: '13px', padding: '8px 20px' }}
            onClick={onClose}
          >
            Close Breakdown
          </button>
        </div>

      </div>
    </div>
  );
}
