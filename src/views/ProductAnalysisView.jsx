import React, { useState, useEffect, useMemo } from 'react';
import {
  FlaskConical, Users, Sparkles, ChevronDown, AlertCircle,
  ShieldCheck, DollarSign, TrendingUp, Gift, Info, CheckCircle2,
  BarChart3, BookOpen, RefreshCw
} from 'lucide-react';

/* ─── helpers ───────────────────────────────────────────────── */
const fmt = (v, currency = 'USD') => {
  if (v == null || isNaN(v)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v);
};

const calcAge = (dob) => {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

/* ─── sub-components ────────────────────────────────────────── */
const Section = ({ icon, title, color = '#a78bfa', children }) => (
  <div style={{
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-light)',
    borderRadius: '14px',
    padding: '20px 24px',
    marginBottom: '12px',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)',
      textTransform: 'uppercase', letterSpacing: '0.07em',
      marginBottom: '16px',
    }}>
      {React.cloneElement(icon, { size: 14, color })}
      {title}
    </div>
    {children}
  </div>
);

const Chip = ({ label, color = 'rgba(139,92,246,0.15)', textColor = '#a78bfa' }) => (
  <span style={{
    display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
    fontSize: '12px', fontWeight: '500', background: color, color: textColor,
    marginRight: '6px', marginBottom: '6px',
  }}>{label}</span>
);

const Tag = ({ text, variant = 'highlight' }) => {
  const styles = {
    highlight: { bg: 'rgba(52,211,153,0.1)', color: '#34d399', border: 'rgba(52,211,153,0.2)' },
    consideration: { bg: 'rgba(251,146,60,0.1)', color: '#fb923c', border: 'rgba(251,146,60,0.2)' },
  };
  const s = styles[variant];
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '8px',
      padding: '8px 12px', borderRadius: '8px', marginBottom: '6px',
      background: s.bg, border: `1px solid ${s.border}`,
    }}>
      <div style={{ marginTop: '2px', flexShrink: 0 }}>
        {variant === 'highlight'
          ? <CheckCircle2 size={13} color={s.color} />
          : <AlertCircle size={13} color={s.color} />}
      </div>
      <span style={{ fontSize: '13px', color: s.color, lineHeight: '1.5' }}>{text}</span>
    </div>
  );
};

/* ─── Premium Calculator ────────────────────────────────────── */
function PremiumCalculator({ analysis, clientAge, currency }) {
  const ps = analysis.premiumStructure;

  const defaultEntry = clientAge ?? ps?.clientEntryAge ?? (ps?.samplePremiums?.[0]?.entryAge ?? 30);
  const [entryAge, setEntryAge] = useState(String(defaultEntry));
  const [targetAge, setTargetAge] = useState('65');

  // Derive annual premium for entryAge
  const annualPremium = useMemo(() => {
    if (ps?.clientEntryAge != null && Number(entryAge) === ps.clientEntryAge && ps.clientAnnualPremium) {
      return ps.clientAnnualPremium;
    }
    const samples = ps?.samplePremiums ?? [];
    if (!samples.length) return null;
    // Find nearest age
    const nearest = samples.reduce((best, s) =>
      Math.abs(s.entryAge - Number(entryAge)) < Math.abs(best.entryAge - Number(entryAge)) ? s : best
    );
    return nearest.annualPremium;
  }, [entryAge, ps]);

  // Resolve payment stop age
  const paymentStopAge = useMemo(() => {
    const pt = ps?.paymentTerm;
    if (!pt || pt === 'whole life') return Number(targetAge);
    if (pt === 'single') return Number(entryAge);
    return Number(entryAge) + Number(pt);
  }, [entryAge, targetAge, ps]);

  // Build year-by-year table
  const rows = useMemo(() => {
    const ea = Number(entryAge);
    const ta = Number(targetAge);
    if (!ea || !ta || ta <= ea || !annualPremium) return [];

    const cashbackMap = {};
    (analysis.cashbacks ?? []).forEach(cb => {
      if (cb.year != null) cashbackMap[cb.year] = cb;
    });

    let cumulative = 0;
    let totalCashback = 0;
    return Array.from({ length: ta - ea }, (_, i) => {
      const year = i + 1;
      const age = ea + year;
      const paying = age <= paymentStopAge;
      const premium = paying ? annualPremium : 0;
      cumulative += premium;
      const cb = cashbackMap[year];
      const cbAmount = cb
        ? (cb.amount ?? (cb.percentOfAnnualPremium ? (cb.percentOfAnnualPremium / 100) * annualPremium : null))
        : null;
      if (cbAmount) totalCashback += cbAmount;
      return { year, age, premium, cumulative, cb, cbAmount, netCost: cumulative - totalCashback };
    });
  }, [entryAge, targetAge, annualPremium, paymentStopAge, analysis.cashbacks]);

  const isValidInput = Number(entryAge) >= 1 && Number(targetAge) > Number(entryAge);

  return (
    <Section icon={<BarChart3 />} title="Premium Calculator" color="#fbbf24">
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>Entry Age</span>
          <input
            type="number" min="1" max="99" value={entryAge}
            onChange={e => setEntryAge(e.target.value)}
            className="input-field"
            style={{ width: '90px', padding: '7px 10px', fontSize: '14px' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>Project to Age</span>
          <input
            type="number" min="1" max="120" value={targetAge}
            onChange={e => setTargetAge(e.target.value)}
            className="input-field"
            style={{ width: '90px', padding: '7px 10px', fontSize: '14px' }}
          />
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>Annual Premium</span>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#fbbf24', padding: '7px 0' }}>
            {annualPremium ? fmt(annualPremium, currency) : '—'}
            {ps?.frequency && ps.frequency !== 'Annually' && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                ({fmt(annualPremium / (ps.frequency === 'Monthly' ? 12 : ps.frequency === 'Quarterly' ? 4 : 2), currency)}/{ps.frequency === 'Monthly' ? 'mo' : ps.frequency === 'Quarterly' ? 'qtr' : 'semi'})
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>Payment Term</span>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', padding: '7px 0' }}>
            {ps?.paymentTerm === 'whole life' ? 'Whole Life' : ps?.paymentTerm === 'single' ? 'Single Premium' : ps?.paymentTerm ? `${ps.paymentTerm} years` : '—'}
          </div>
        </div>
      </div>

      {!isValidInput ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Enter a valid entry age and target age to see projections.</p>
      ) : !annualPremium ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No premium data available for this entry age.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                {['Year', 'Age', 'Annual Premium', 'Cumulative Paid', 'Cashback', 'Net Cost'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Year' || h === 'Age' ? 'center' : 'right', color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.year} style={{
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: row.cbAmount ? 'rgba(52,211,153,0.04)' : 'transparent',
                  transition: 'background 0.15s',
                }}>
                  <td style={{ padding: '7px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>{row.year}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'center', color: 'var(--text-primary)', fontWeight: '500' }}>{row.age}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: row.premium === 0 ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                    {row.premium === 0 ? <span style={{ fontStyle: 'italic' }}>—</span> : fmt(row.premium, currency)}
                  </td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: '600' }}>{fmt(row.cumulative, currency)}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: '#34d399', fontWeight: '600' }}>
                    {row.cbAmount ? (
                      <span title={row.cb?.description}>
                        {fmt(row.cbAmount, currency)}
                        {row.cb?.description && <Info size={11} style={{ marginLeft: '4px', verticalAlign: 'middle', opacity: 0.6 }} />}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: '#60a5fa', fontWeight: '600' }}>{fmt(row.netCost, currency)}</td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border-light)', background: 'rgba(255,255,255,0.02)' }}>
                  <td colSpan="3" style={{ padding: '8px 10px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '12px' }}>TOTAL at age {targetAge}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: '700' }}>{fmt(rows[rows.length - 1]?.cumulative, currency)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#34d399', fontWeight: '700' }}>{fmt(rows.reduce((s, r) => s + (r.cbAmount ?? 0), 0), currency)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#60a5fa', fontWeight: '700' }}>{fmt(rows[rows.length - 1]?.netCost, currency)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </Section>
  );
}

/* ─── Cash Value Table ──────────────────────────────────────── */
function CashValueTable({ cashValue, currency }) {
  if (!cashValue?.length) return null;
  const hasNonGuaranteed = cashValue.some(r => r.nonGuaranteedCV != null);
  return (
    <Section icon={<TrendingUp />} title="Cash / Surrender Value Projection" color="#34d399">
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
              {['Year', 'Age', 'Guaranteed CV', hasNonGuaranteed ? 'Non-Guaranteed CV' : null].filter(Boolean).map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Year' || h === 'Age' ? 'center' : 'right', color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cashValue.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '7px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>{row.year}</td>
                <td style={{ padding: '7px 10px', textAlign: 'center', color: 'var(--text-primary)', fontWeight: '500' }}>{row.age ?? '—'}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', color: '#34d399', fontWeight: '600' }}>{fmt(row.guaranteedCV, currency)}</td>
                {hasNonGuaranteed && (
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: '#60a5fa', fontWeight: '600' }}>{row.nonGuaranteedCV != null ? fmt(row.nonGuaranteedCV, currency) : '—'}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

/* ─── Main View ─────────────────────────────────────────────── */
export default function ProductAnalysisView() {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [productText, setProductText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getClients().then(res => {
        if (res.success) setClients(res.data);
      });
    }
  }, []);

  const selectedClient = clients.find(c => c.id === selectedClientId) || null;
  const clientAge = selectedClient ? calcAge(selectedClient.dob) : null;

  const handleAnalyse = async () => {
    if (!productText.trim()) { setError('Please paste a product description.'); return; }
    setError('');
    setAnalysis(null);
    setLoading(true);
    const payload = {
      productText,
      client: selectedClient ? {
        fullName: selectedClient.fullName,
        age: clientAge,
        gender: selectedClient.gender,
      } : null,
    };
    const res = await window.electronAPI.analyseProduct(payload);
    setLoading(false);
    if (res.success) {
      setAnalysis(res.data);
    } else {
      setError(res.error || 'Analysis failed. Please try again.');
    }
  };

  const currency = analysis?.currency || 'USD';
  const hasCashback = analysis?.cashbacks?.length > 0;
  const hasCashValue = analysis?.cashValue?.length > 0;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', gap: '16px', height: '100%', overflow: 'hidden' }}>

      {/* ── LEFT PANEL ──────────────────────────────────────── */}
      <div style={{
        width: '360px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px',
        overflowY: 'auto', paddingBottom: '16px',
      }}>
        {/* Header */}
        <div>
          <h1 className="text-gradient" style={{ fontSize: '22px', marginBottom: '2px' }}>Product Analyser</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>AI-powered product illustration & breakdown</p>
        </div>

        {/* Client Selector */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
          borderRadius: '14px', padding: '16px 18px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={12} color="#60a5fa" /> Client (optional)
          </div>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              className="input-field"
              style={{ width: '100%', appearance: 'none', paddingRight: '32px', cursor: 'pointer' }}
            >
              <option value="">— Generic analysis —</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.fullName}</option>
              ))}
            </select>
            <ChevronDown size={14} color="var(--text-muted)" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>

          {selectedClient && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
              {clientAge != null && <Chip label={`Age ${clientAge}`} color="rgba(96,165,250,0.12)" textColor="#60a5fa" />}
              {selectedClient.gender && <Chip label={selectedClient.gender} color="rgba(167,139,250,0.12)" textColor="#a78bfa" />}
              {selectedClient.dob && <Chip label={`DOB ${new Date(selectedClient.dob).toLocaleDateString()}`} color="rgba(100,116,139,0.15)" textColor="var(--text-secondary)" />}
            </div>
          )}
        </div>

        {/* Product Text */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
          borderRadius: '14px', padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BookOpen size={12} color="#a78bfa" /> Product Description
          </div>
          <textarea
            value={productText}
            onChange={e => setProductText(e.target.value)}
            placeholder="Paste the product brochure, illustration notes, or any product summary here…&#10;&#10;Include details like premiums, payment term, coverage amounts, cashback schedules, cash value tables, etc."
            style={{
              flex: 1, minHeight: '240px', resize: 'vertical',
              background: 'var(--bg-base)', border: '1px solid var(--border-light)',
              borderRadius: '8px', color: 'var(--text-primary)',
              padding: '12px', fontSize: '13px', lineHeight: '1.6',
              fontFamily: 'Inter, sans-serif', outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-light)'}
          />
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            {productText.length} chars · {productText.trim().split(/\s+/).filter(Boolean).length} words
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px' }}>
            <AlertCircle size={14} color="#f87171" style={{ flexShrink: 0, marginTop: '1px' }} />
            <span style={{ fontSize: '13px', color: '#f87171' }}>{error}</span>
          </div>
        )}

        {/* Analyse Button */}
        <button
          onClick={handleAnalyse}
          disabled={loading}
          className="btn btn-primary"
          style={{ width: '100%', padding: '12px', fontSize: '14px', gap: '8px', justifyContent: 'center', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading
            ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Analysing…</>
            : <><Sparkles size={15} /> Analyse Product</>}
        </button>

        {analysis && (
          <button
            onClick={() => { setAnalysis(null); setProductText(''); setSelectedClientId(''); setError(''); }}
            className="btn btn-secondary"
            style={{ width: '100%', padding: '10px', fontSize: '13px' }}
          >
            Clear & Start Over
          </button>
        )}
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '16px' }}>

        {/* Empty state */}
        {!analysis && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', opacity: 0.5 }}>
            <FlaskConical size={48} color="var(--text-muted)" />
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '4px' }}>No analysis yet</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Paste a product description and click Analyse</p>
            </div>
          </div>
        )}

        {/* Loading shimmer */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '14px', padding: '20px 24px' }}>
                <div style={{ height: '12px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', width: '30%', marginBottom: '16px' }} />
                {[100, 80, 60, 90].map((w, j) => (
                  <div key={j} style={{ height: '10px', borderRadius: '5px', background: 'rgba(255,255,255,0.04)', width: `${w}%`, marginBottom: '8px' }} />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {analysis && (
          <>
            {/* Product Overview */}
            <Section icon={<ShieldCheck />} title="Product Overview" color="#60a5fa">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{analysis.productName || 'Unknown Product'}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{analysis.insurer}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <Chip label={analysis.productType || 'Unknown'} color="rgba(96,165,250,0.12)" textColor="#60a5fa" />
                  <Chip label={analysis.currency || 'USD'} color="rgba(251,191,36,0.12)" textColor="#fbbf24" />
                </div>
              </div>
              <p style={{ fontSize: '13px', lineHeight: '1.75', color: 'var(--text-secondary)', marginBottom: '14px' }}>{analysis.summary}</p>
              {analysis.keyFeatures?.length > 0 && (
                <div>
                  {analysis.keyFeatures.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ color: '#a78bfa', flexShrink: 0 }}>•</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{f}</span>
                    </div>
                  ))}
                </div>
              )}
              {analysis.irrEstimate && (
                <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#34d399' }}>IRR / Returns: </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{analysis.irrEstimate}</span>
                </div>
              )}
            </Section>

            {/* Coverage Summary */}
            {analysis.coverages?.length > 0 && (
              <Section icon={<ShieldCheck />} title="Coverage Summary" color="#a78bfa">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                  {analysis.coverages.map((cov, i) => (
                    <div key={i} style={{ padding: '12px 14px', background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.12)', borderRadius: '10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#a78bfa', marginBottom: '4px' }}>{cov.type}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{cov.description}</div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Premium Calculator */}
            <PremiumCalculator analysis={analysis} clientAge={clientAge} currency={currency} />

            {/* Cashback Schedule */}
            {hasCashback && (
              <Section icon={<Gift />} title="Cashback Schedule" color="#34d399">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {analysis.cashbacks.map((cb, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '12px 0', borderBottom: i < analysis.cashbacks.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div style={{ minWidth: '48px', textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#34d399' }}>Yr {cb.year}</div>
                        {cb.ageAtEvent && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Age {cb.ageAtEvent}</div>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{cb.description}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {cb.amount != null && <div style={{ fontSize: '15px', fontWeight: '700', color: '#34d399' }}>{fmt(cb.amount, currency)}</div>}
                        {cb.percentOfAnnualPremium != null && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{cb.percentOfAnnualPremium}% of annual premium</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Cash Value Table */}
            {hasCashValue && <CashValueTable cashValue={analysis.cashValue} currency={currency} />}

            {/* Highlights & Considerations */}
            {(analysis.highlights?.length > 0 || analysis.considerations?.length > 0) && (
              <Section icon={<Info />} title="Highlights & Considerations" color="#fb923c">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#34d399', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <CheckCircle2 size={12} /> Key Highlights
                    </div>
                    {analysis.highlights?.map((h, i) => <Tag key={i} text={h} variant="highlight" />)}
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#fb923c', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <AlertCircle size={12} /> To Consider
                    </div>
                    {analysis.considerations?.map((c, i) => <Tag key={i} text={c} variant="consideration" />)}
                  </div>
                </div>
                {analysis.dataNote && (
                  <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)', borderRadius: '8px', display: 'flex', gap: '8px' }}>
                    <Info size={13} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{analysis.dataNote}</span>
                  </div>
                )}
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
