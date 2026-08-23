import React, { useState } from 'react';
import {
  X, BookOpen, Shield, TrendingUp, DollarSign, Calendar,
  AlertTriangle, CheckCircle2, ChevronRight, Copy, Check,
  Info, Sparkles, Scale, HeartHandshake, Award, HelpCircle
} from 'lucide-react';

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(val) || val === '') return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(val) || 0);
};

export default function CpfLifePlaybookModal({ isOpen, onClose, onApplyPayout, currentExpectedAnnuity }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'plans' | 'sums' | 'bequest'
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  const handleApply = (amount) => {
    if (onApplyPayout) {
      onApplyPayout(amount);
    }
  };

  const handleCopySummary = () => {
    const summary = `SINGAPORE CPF LIFE ADVISOR PLAYBOOK (2025/2026):
- Scheme: National Longevity Insurance Annuity providing guaranteed monthly payouts for life.
- Plans:
  1. Standard Plan (Default): Stable, level monthly payouts for life.
  2. Escalating Plan: Starts ~20% lower, grows 2% each year for life to hedge inflation.
  3. Basic Plan: Lower payouts from RA, transfers to Lifelong Income Fund at ~age 90. Max bequest.
- 2026 Retirement Sums & Estimated Payouts (Age 65 Start):
  • Basic Retirement Sum (BRS) $110,200: ~$890 - $930/mo (Requires property pledge)
  • Full Retirement Sum (FRS) $220,400: ~$1,640 - $1,750/mo
  • Enhanced Retirement Sum (ERS = 4x BRS) $440,800: ~$3,180 - $3,410/mo
- Deferral Bonus: Payouts start between age 65 and 70; each deferred year yields +7% higher lifelong payout (+35% at 70).
- Bequest: Capital guarantee (RA premium + interest less payouts received is refunded to nominees). Requires online CPF Nomination (cannot be willed).`;

    navigator.clipboard.writeText(summary);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

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
        maxWidth: '920px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0f172a',
        border: '1px solid rgba(59, 130, 246, 0.3)',
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
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              <BookOpen size={22} color="#60a5fa" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Singapore CPF LIFE Advisor Playbook
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  2025 / 2026 Edition
                </span>
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Comprehensive strategic guide on CPF LIFE mechanics, plan selection, sum tiers, deferral incentives, and bequest rules.
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
              title="Copy Summary to Clipboard"
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
            { id: 'overview', label: '🎯 Core Mechanics & Age Milestones' },
            { id: 'plans', label: '⚖️ The 3 CPF LIFE Plans Compared' },
            { id: 'sums', label: '📊 2025–2026 Retirement Sums & Payout Tiers' },
            { id: 'bequest', label: '🛡️ Bequest & CPF Nomination Rules' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: activeTab === tab.id ? '600' : '500',
                color: activeTab === tab.id ? '#60a5fa' : 'var(--text-secondary)',
                backgroundColor: activeTab === tab.id ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #60a5fa' : '2px solid transparent',
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

        {/* Modal Body Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* TAB 1: CORE MECHANICS & AGE MILESTONES */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* What is CPF LIFE Hero Box */}
              <div style={{
                padding: '18px 20px',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                borderRadius: '12px',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontWeight: '700', fontSize: '14px' }}>
                  <Shield size={16} /> What is Singapore CPF LIFE?
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.6', margin: 0 }}>
                  <strong>CPF Lifelong Income For the Elderly (CPF LIFE)</strong> is Singapore’s national longevity insurance annuity scheme. It protects Singaporeans and PRs from outliving their retirement nest egg by guaranteeing a monthly income stream for as long as they live, regardless of how long they survive.
                </p>
              </div>

              {/* Age Milestones Timeline */}
              <div>
                <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} color="#fbbf24" /> Key CPF Life Milestones Timeline
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  
                  {/* Age 55 Milestone */}
                  <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', color: '#60a5fa', fontSize: '14px' }}>🎂 Age 55: Account Restructuring</span>
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', fontWeight: '600' }}>Creation of RA</span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: '1.5' }}>
                      <li><strong>Retirement Account (RA) Created:</strong> Savings from Special Account (SA) and Ordinary Account (OA) are combined up to the Full Retirement Sum (FRS).</li>
                      <li><strong>Closure of SA (Effective Jan 2025):</strong> For members 55+, SA is officially closed. SA savings fund RA first; excess balances transfer to OA (earning OA rates, or can be voluntarily topped up to RA up to ERS).</li>
                      <li><strong>Interest Generation:</strong> RA savings earn high risk-free interest up to <strong>6.0% p.a.</strong> (4.0% base + extra 1% on first $60k + additional 1% for age 55+ on first $30k).</li>
                      <li><strong>Withdrawal Rights:</strong> Unconditional withdrawal of up to $5,000, or any excess OA/SA savings above the FRS (or BRS if property is pledged).</li>
                    </ul>
                  </div>

                  {/* Age 65 to 70 Milestone */}
                  <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', color: '#34d399', fontSize: '14px' }}>🏖️ Age 65–70: Payout Commencement</span>
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: '600' }}>Lifelong Payouts</span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: '1.5' }}>
                      <li><strong>Annuity Enrolment:</strong> RA balance is transferred into the <em>Lifelong Income Fund</em> pool as the CPF LIFE annuity premium.</li>
                      <li><strong>Flexible Start Age:</strong> Members can choose to start payouts anytime between <strong>Age 65 and Age 70</strong>.</li>
                      <li><strong>Deferral Incentive (+7%/yr):</strong> For every year payouts are deferred beyond 65, monthly income increases by <strong>up to +7%</strong> (+35% higher lifelong income if started at age 70).</li>
                      <li><strong>Automatic Default:</strong> If no choice is made, payouts automatically start at Age 70.</li>
                    </ul>
                  </div>

                </div>
              </div>

              {/* Strategic Tip Alert */}
              <div style={{ padding: '14px 16px', backgroundColor: 'rgba(245, 158, 11, 0.08)', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Info size={18} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  <strong style={{ color: '#fbbf24' }}>Advisory Strategy Note:</strong> Clients with healthy personal savings or rental passive income should strongly consider deferring their CPF LIFE start age to 68–70. The guaranteed +7%/year step-up provides an unbeatable risk-free, inflation-beating annuity increment.
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: THE 3 CPF LIFE PLANS COMPARED */}
          {activeTab === 'plans' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                CPF LIFE offers 3 plans with different trade-offs between initial payout levels, inflation protection, and bequest amounts left to beneficiaries.
              </p>

              {/* 3 Plans Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                
                {/* Standard Plan */}
                <div style={{
                  padding: '18px',
                  backgroundColor: 'rgba(59, 130, 246, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', color: '#60a5fa', fontSize: '15px' }}>Standard Plan</span>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '6px', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>Default</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    <strong>Payout Profile:</strong> High, level, steady monthly payouts that remain flat for life.
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    <strong>Bequest to Family:</strong> Moderate. Any unused premium balance is refunded upon demise.
                  </div>
                  <div style={{ fontSize: '11px', color: '#34d399', borderTop: '1px dashed var(--border-light)', paddingTop: '8px' }}>
                    ✓ <strong>Best For:</strong> Clients who prefer high, predictable cashflow right from age 65 without worrying about payout volatility.
                  </div>
                </div>

                {/* Escalating Plan */}
                <div style={{
                  padding: '18px',
                  backgroundColor: 'rgba(236, 72, 153, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(236, 72, 153, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', color: '#f472b6', fontSize: '15px' }}>Escalating Plan</span>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '6px', backgroundColor: 'rgba(236, 72, 153, 0.2)', color: '#f472b6' }}>Inflation Hedge</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    <strong>Payout Profile:</strong> Starts ~20% lower than Standard, but <strong>increases by 2% each year</strong> for life.
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    <strong>Bequest to Family:</strong> Moderate. Unused premium returned to nominees.
                  </div>
                  <div style={{ fontSize: '11px', color: '#f472b6', borderTop: '1px dashed var(--border-light)', paddingTop: '8px' }}>
                    ✓ <strong>Best For:</strong> Clients who want their purchasing power protected against rising cost of living into their 70s, 80s, and 90s.
                  </div>
                </div>

                {/* Basic Plan */}
                <div style={{
                  padding: '18px',
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', color: '#34d399', fontSize: '15px' }}>Basic Plan</span>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>Max Bequest</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    <strong>Payout Profile:</strong> Lowest initial payout. Paid from RA first; payouts drop when combined balances fall below $60k.
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    <strong>Bequest to Family:</strong> Highest bequest in early retirement years as only ~10-20% is locked into the annuity pool initially.
                  </div>
                  <div style={{ fontSize: '11px', color: '#60a5fa', borderTop: '1px dashed var(--border-light)', paddingTop: '8px' }}>
                    ✓ <strong>Best For:</strong> Clients prioritizing leaving maximum CPF wealth to children or spouses.
                  </div>
                </div>

              </div>

              {/* Side-by-Side Comparison Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px' }}>Comparison Feature</th>
                      <th style={{ padding: '10px', color: '#60a5fa' }}>Standard Plan</th>
                      <th style={{ padding: '10px', color: '#f472b6' }}>Escalating Plan</th>
                      <th style={{ padding: '10px', color: '#34d399' }}>Basic Plan</th>
                    </tr>
                  </thead>
                  <tbody style={{ color: 'var(--text-secondary)' }}>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px', fontWeight: '600', color: 'var(--text-primary)' }}>Initial Monthly Payout</td>
                      <td style={{ padding: '10px', color: '#34d399', fontWeight: '600' }}>Highest (~$1,700/mo at FRS)</td>
                      <td style={{ padding: '10px' }}>Lower (~$1,360/mo at FRS)</td>
                      <td style={{ padding: '10px' }}>Lower (~$1,560/mo at FRS)</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px', fontWeight: '600', color: 'var(--text-primary)' }}>Payout Growth</td>
                      <td style={{ padding: '10px' }}>Flat for life</td>
                      <td style={{ padding: '10px', color: '#f472b6', fontWeight: '600' }}>+2.0% every year</td>
                      <td style={{ padding: '10px' }}>Decreases slightly past age ~80</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px', fontWeight: '600', color: 'var(--text-primary)' }}>Inflation Protection</td>
                      <td style={{ padding: '10px' }}>Moderate</td>
                      <td style={{ padding: '10px', color: '#f472b6', fontWeight: '600' }}>Exceptional</td>
                      <td style={{ padding: '10px' }}>Low</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '10px', fontWeight: '600', color: 'var(--text-primary)' }}>Bequest to Beneficiaries</td>
                      <td style={{ padding: '10px' }}>Moderate (Premium - Payouts)</td>
                      <td style={{ padding: '10px' }}>Moderate (Premium - Payouts)</td>
                      <td style={{ padding: '10px', color: '#34d399', fontWeight: '600' }}>Highest (RA balance + Premium)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 3: 2025-2026 RETIREMENT SUMS & PAYOUT TIERS */}
          {activeTab === 'sums' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', margin: 0 }}>
                    Official Retirement Sum Tiers & Monthly Payout Benchmarks (Age 65)
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                    Figures based on CPF Board 2025/2026 Standard Plan payouts starting at age 65.
                  </p>
                </div>
              </div>

              {/* 3 Retirement Sum Cards with Quick Apply Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                
                {/* BRS Card */}
                <div style={{ padding: '18px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tier 1</span>
                    <h4 style={{ fontSize: '16px', color: 'var(--text-primary)', margin: '2px 0 0 0' }}>Basic Retirement Sum (BRS)</h4>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#60a5fa' }}>
                    $110,200 <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'normal' }}>(2026)</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    <strong>Est. Monthly Payout:</strong><br />
                    <span style={{ color: '#34d399', fontWeight: '700', fontSize: '14px' }}>~$890 – $930 /mo</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    *Requires pledging a residential property with remaining lease covering up to age 95.
                  </div>
                  <button
                    className="btn"
                    style={{ marginTop: 'auto', backgroundColor: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa', border: '1px solid rgba(96, 165, 250, 0.3)', fontSize: '12px', padding: '8px 12px' }}
                    onClick={() => handleApply(910)}
                  >
                    Apply ~$910/mo to Plan
                  </button>
                </div>

                {/* FRS Card */}
                <div style={{ padding: '18px', backgroundColor: 'rgba(59, 130, 246, 0.06)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.4)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>Tier 2 (Standard Benchmark)</span>
                    <h4 style={{ fontSize: '16px', color: 'var(--text-primary)', margin: '2px 0 0 0' }}>Full Retirement Sum (FRS)</h4>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#34d399' }}>
                    $220,400 <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'normal' }}>(2x BRS)</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    <strong>Est. Monthly Payout:</strong><br />
                    <span style={{ color: '#34d399', fontWeight: '700', fontSize: '14px' }}>~$1,640 – $1,750 /mo</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Default amount set aside at age 55 without needing property pledge.
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: 'auto', fontSize: '12px', padding: '8px 12px' }}
                    onClick={() => handleApply(1700)}
                  >
                    Apply ~$1,700/mo to Plan
                  </button>
                </div>

                {/* ERS Card */}
                <div style={{ padding: '18px', backgroundColor: 'rgba(168, 85, 247, 0.06)', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.4)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>Tier 3 (Max Top-Up Cap)</span>
                    <h4 style={{ fontSize: '16px', color: 'var(--text-primary)', margin: '2px 0 0 0' }}>Enhanced Retirement Sum (ERS)</h4>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#c084fc' }}>
                    $440,800 <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'normal' }}>(4x BRS)</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    <strong>Est. Monthly Payout:</strong><br />
                    <span style={{ color: '#34d399', fontWeight: '700', fontSize: '14px' }}>~$3,180 – $3,410 /mo</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    *Cap expanded to 4x BRS (from 3x) in 2025, allowing larger voluntary top-ups for affluent clients.
                  </div>
                  <button
                    className="btn"
                    style={{ marginTop: 'auto', backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)', fontSize: '12px', padding: '8px 12px' }}
                    onClick={() => handleApply(3300)}
                  >
                    Apply ~$3,300/mo to Plan
                  </button>
                </div>

              </div>

              {/* Deferral Multiplier Bar */}
              <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  ⏳ Impact of Deferring Payout Start Age (Age 65 → Age 70)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', textAlign: 'center', fontSize: '12px' }}>
                  <div style={{ padding: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Age 65</span><br />
                    <strong style={{ color: '#60a5fa' }}>100%</strong><br />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>$1,700/mo</span>
                  </div>
                  <div style={{ padding: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Age 66</span><br />
                    <strong style={{ color: '#60a5fa' }}>+7%</strong><br />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>$1,820/mo</span>
                  </div>
                  <div style={{ padding: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Age 67</span><br />
                    <strong style={{ color: '#60a5fa' }}>+14%</strong><br />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>$1,940/mo</span>
                  </div>
                  <div style={{ padding: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Age 68</span><br />
                    <strong style={{ color: '#60a5fa' }}>+21%</strong><br />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>$2,060/mo</span>
                  </div>
                  <div style={{ padding: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Age 69</span><br />
                    <strong style={{ color: '#60a5fa' }}>+28%</strong><br />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>$2,180/mo</span>
                  </div>
                  <div style={{ padding: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <span style={{ color: '#34d399', fontWeight: '600' }}>Age 70</span><br />
                    <strong style={{ color: '#34d399' }}>+35%</strong><br />
                    <span style={{ fontSize: '10px', color: '#34d399' }}>$2,300/mo</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: BEQUEST & CPF NOMINATION RULES */}
          {activeTab === 'bequest' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Capital Guarantee Explanation */}
              <div style={{ padding: '18px', backgroundColor: 'rgba(16, 185, 129, 0.06)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: '700', fontSize: '14px' }}>
                  <Award size={16} /> Capital Guarantee for Beneficiaries
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.6', margin: 0 }}>
                  A common misconception is that if a member passes away shortly after starting CPF LIFE, the government keeps the money. This is false. <strong>CPF LIFE is capital guaranteed</strong>:
                </p>
                <div style={{ padding: '10px 14px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px', color: '#60a5fa' }}>
                  Bequest Payout = Total RA Savings Committed + Accumulated Interest - Total Payouts Received
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                  If a member passes away at age 67 after receiving only 2 years of payouts, the entire remaining balance of their committed premium plus interest is paid directly to their nominated beneficiaries in cash.
                </p>
              </div>

              {/* Critical Legal Warning: CPF Nomination vs Will */}
              <div style={{ padding: '18px', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: '700', fontSize: '14px' }}>
                  <AlertTriangle size={18} /> Vital Advisory Rule: CPF Savings CANNOT Be Willed
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.6', margin: 0 }}>
                  Under Singapore law, CPF savings (including OA, SA, RA, MediSave, and CPF LIFE remaining premiums) <strong>do not form part of the deceased's civil estate</strong> and cannot be distributed via a Last Will and Testament.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
                  <div style={{ padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <strong style={{ color: '#34d399', fontSize: '12px' }}>✓ With Valid CPF Online Nomination:</strong>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                      Distributed within 2–4 weeks directly to nominees’ bank accounts free of charge, completely private, and immune to creditor claims against the estate.
                    </p>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <strong style={{ color: '#f87171', fontSize: '12px' }}>⚠️ Without CPF Nomination:</strong>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                      Transferred to the Public Trustee’s Office (PTO) for statutory distribution under the Intestate Succession Act. Can take <strong>up to 6 months</strong> with statutory admin fees deducted from the payout.
                    </p>
                  </div>
                </div>
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
            Current Blueprint Expected CPF Life: <strong style={{ color: '#818cf8' }}>{formatCurrency(currentExpectedAnnuity)}/mo</strong>
          </div>
          <button
            className="btn btn-primary"
            style={{ fontSize: '13px', padding: '8px 20px' }}
            onClick={onClose}
          >
            Done & Return to Blueprint
          </button>
        </div>

      </div>
    </div>
  );
}
