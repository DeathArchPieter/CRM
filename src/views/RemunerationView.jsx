import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Target, ShieldCheck, Repeat, PiggyBank,
  DollarSign, Briefcase, Clock, Award, RefreshCw, Sparkles, CheckCircle2, Calculator
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { useAdvisorContext } from '../context/AdvisorContext';

const getSpiRate = (ytdFyc, isNewConsultant) => {
  if (ytdFyc >= 80000) return 0.36;
  if (ytdFyc >= 70000) return 0.355;
  if (ytdFyc >= 60000) return 0.35;
  if (ytdFyc >= 50000) return 0.34;
  if (ytdFyc >= 45000) return 0.32;
  if (ytdFyc >= 40000) return 0.30;
  if (ytdFyc >= 35000) return 0.27;
  if (ytdFyc >= 30000) return 0.23;
  if (ytdFyc >= 25000) return 0.20;
  if (ytdFyc >= 20000) return 0.17;
  if (ytdFyc >= 15000) return 0.14;
  if (isNewConsultant && ytdFyc >= 5000) return 0.08;
  return 0;
};

const getPaBonusRate = (paFyp) => {
  if (paFyp >= 11250) return 0.15;
  if (paFyp >= 8750) return 0.12;
  if (paFyp >= 6250) return 0.08;
  if (paFyp >= 3750) return 0.05;
  if (paFyp >= 2000) return 0.02;
  return 0;
};

const getCbRate = (recvYear) => {
  if (recvYear >= 16) return 1.10;
  if (recvYear >= 11) return 1.05;
  if (recvYear >= 9) return 1.00;
  if (recvYear >= 7) return 0.95;
  if (recvYear >= 4) return 0.90;
  if (recvYear >= 1) return 0.80;
  return 0;
};

export default function RemunerationView() {
  const { addToast } = useToast();
  const { setAdvisorContext } = useAdvisorContext();
  const [activeSubTab, setActiveSubTab] = useState('forward'); // 'forward' | 'reverse'
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync with Archie 2.0
  useEffect(() => {
    setAdvisorContext({
      section: 'remuneration',
      subSection: null,
      activeSubTab: null,
      entityContext: {
        mode: activeSubTab
      }
    });
  }, [activeSubTab, setAdvisorContext]);

  // --- Input State ---
  const [fycQ1, setFycQ1] = useState(12500);
  const [fycQ2, setFycQ2] = useState(15000);
  const [fycQ3, setFycQ3] = useState(10000);
  const [fycQ4, setFycQ4] = useState(12500);

  const [casesQ1, setCasesQ1] = useState(4);
  const [casesQ2, setCasesQ2] = useState(3);
  const [casesQ3, setCasesQ3] = useState(5);
  const [casesQ4, setCasesQ4] = useState(2);
  
  const [paFypQ1, setPaFypQ1] = useState(2500);
  const [paFypQ2, setPaFypQ2] = useState(4000);
  const [paFypQ3, setPaFypQ3] = useState(7000);
  const [paFypQ4, setPaFypQ4] = useState(12000);

  const [isNewConsultant, setIsNewConsultant] = useState(false);
  const [cbReceivingYear, setCbReceivingYear] = useState(0);

  // Reverse Planner Target
  const [targetAnnualIncome, setTargetAnnualIncome] = useState(150000);
  const [assumedAvgFycPerCase, setAssumedAvgFycPerCase] = useState(3500);

  // Commission/Bonus Assumptions
  const QUARTERLY_AI_TARGET = 4; // Target cases per quarter
  const QUARTERLY_AI_RATE = 0.07; // 7% of Quarterly FYC

  // Sync actual pipeline production from database
  const handleSyncFromPipeline = async () => {
    setIsSyncing(true);
    try {
      if (window.electronAPI?.getPipeline) {
        const res = await window.electronAPI.getPipeline();
        if (res?.success) {
          const currentYear = new Date().getFullYear();
          const issued = (res.data || []).filter(c => {
            if (c.stage !== 'Case Issued') return false;
            const d = new Date(c.updatedAt || c.createdAt);
            return d.getFullYear() === currentYear;
          });

          const qFyc = [0, 0, 0, 0];
          const qCases = [0, 0, 0, 0];
          const qPaFyp = [0, 0, 0, 0];

          issued.forEach(c => {
            const d = new Date(c.updatedAt || c.createdAt);
            const m = d.getMonth();
            const q = Math.floor(m / 3); // 0, 1, 2, 3
            if (q >= 0 && q <= 3) {
              const fyc = Number(c.estimatedFYC) || 0;
              const prem = Number(c.estimatedPremium) || 0;
              qFyc[q] += fyc;
              qCases[q] += 1;
              if (c.policyType === 'A&H' || (c.policyName && c.policyName.toLowerCase().includes('accident'))) {
                qPaFyp[q] += prem;
              }
            }
          });

          setFycQ1(qFyc[0] || 0);
          setFycQ2(qFyc[1] || 0);
          setFycQ3(qFyc[2] || 0);
          setFycQ4(qFyc[3] || 0);

          setCasesQ1(qCases[0] || 0);
          setCasesQ2(qCases[1] || 0);
          setCasesQ3(qCases[2] || 0);
          setCasesQ4(qCases[3] || 0);

          if (qPaFyp.some(v => v > 0)) {
            setPaFypQ1(qPaFyp[0] || 0);
            setPaFypQ2(qPaFyp[1] || 0);
            setPaFypQ3(qPaFyp[2] || 0);
            setPaFypQ4(qPaFyp[3] || 0);
          }

          addToast(`Synced ${issued.length} issued cases for ${currentYear} from pipeline`, 'success');
        }
      }
    } catch (err) {
      console.error('Failed to sync pipeline into remuneration:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // --- Calculations ---
  const calculations = useMemo(() => {
    const f1 = Number(fycQ1) || 0;
    const f2 = Number(fycQ2) || 0;
    const f3 = Number(fycQ3) || 0;
    const f4 = Number(fycQ4) || 0;
    const totalFyc = f1 + f2 + f3 + f4;

    const c1 = Number(casesQ1) || 0;
    const c2 = Number(casesQ2) || 0;
    const c3 = Number(casesQ3) || 0;
    const c4 = Number(casesQ4) || 0;

    // Activity Incentive (AI) - Calculated quarterly
    const q1Ai = c1 >= QUARTERLY_AI_TARGET ? (f1 * QUARTERLY_AI_RATE) : 0;
    const q2Ai = c2 >= QUARTERLY_AI_TARGET ? (f2 * QUARTERLY_AI_RATE) : 0;
    const q3Ai = c3 >= QUARTERLY_AI_TARGET ? (f3 * QUARTERLY_AI_RATE) : 0;
    const q4Ai = c4 >= QUARTERLY_AI_TARGET ? (f4 * QUARTERLY_AI_RATE) : 0;
    const aiTotal = q1Ai + q2Ai + q3Ai + q4Ai;

    // Special Production Incentive (SPI) - Calculated cumulative quarterly
    const ytdQ1 = f1;
    const ytdQ2 = f1 + f2;
    const ytdQ3 = f1 + f2 + f3;
    const ytdQ4 = totalFyc;

    const rateQ1 = getSpiRate(ytdQ1, isNewConsultant);
    const rateQ2 = getSpiRate(ytdQ2, isNewConsultant);
    const rateQ3 = getSpiRate(ytdQ3, isNewConsultant);
    const rateQ4 = getSpiRate(ytdQ4, isNewConsultant);

    const spiTotalQ1 = ytdQ1 * rateQ1;
    const spiTotalQ2 = ytdQ2 * rateQ2;
    const spiTotalQ3 = ytdQ3 * rateQ3;
    const spiTotalQ4 = ytdQ4 * rateQ4;

    const q1Spi = spiTotalQ1;
    const q2Spi = Math.max(0, spiTotalQ2 - spiTotalQ1);
    const q3Spi = Math.max(0, spiTotalQ3 - spiTotalQ2);
    const q4Spi = Math.max(0, spiTotalQ4 - spiTotalQ3);
    const spiTotal = spiTotalQ4;
    
    // PA Production Bonus - Calculated strictly on quarterly PA FYP & PA Renewal
    const pf1 = Number(paFypQ1) || 0;
    const pf2 = Number(paFypQ2) || 0;
    const pf3 = Number(paFypQ3) || 0;
    const pf4 = Number(paFypQ4) || 0;
    const totalPaFyp = pf1 + pf2 + pf3 + pf4;

    const paRateQ1 = getPaBonusRate(pf1);
    const paRateQ2 = getPaBonusRate(pf2);
    const paRateQ3 = getPaBonusRate(pf3);
    const paRateQ4 = getPaBonusRate(pf4);

    const q1Pa = pf1 * paRateQ1;
    const q2Pa = pf2 * paRateQ2;
    const q3Pa = pf3 * paRateQ3;
    const q4Pa = pf4 * paRateQ4;
    const paTotal = q1Pa + q2Pa + q3Pa + q4Pa;

    // Total Variable Compensation (Base + AI + SPI + PA)
    const grandTotal = totalFyc + aiTotal + spiTotal + paTotal;

    // Career Benefit Rates & Calculations (on stacked renewals)
    const cbRate = getCbRate(Number(cbReceivingYear) || 0);

    // 5-Year Projection Model
    const RENEWAL_RATES_NON_PA = [0, 0.15, 0.10, 0.05, 0.05, 0.05];
    const PA_RENEWAL_RATE = 0.10; // Flat 10% on PA FYP
    
    const projections = [];
    let cumulativeNonPaRenewals = 0;
    let cumulativePaRenewals = 0;

    for (let yr = 1; yr <= 5; yr++) {
      if (yr > 1) {
        cumulativeNonPaRenewals = (totalFyc - (totalPaFyp * 0.4)) * RENEWAL_RATES_NON_PA[yr] * (yr - 1);
        cumulativePaRenewals = totalPaFyp * PA_RENEWAL_RATE * (yr - 1);
      }
      
      const totalRenewals = cumulativeNonPaRenewals + cumulativePaRenewals;
      const cbIncome = cumulativeNonPaRenewals * cbRate; // CB strictly on non-PA renewals
      const yrTotal = grandTotal + totalRenewals + cbIncome;

      projections.push({
        year: yr,
        fyc: totalFyc,
        ai: aiTotal,
        spi: spiTotal,
        pa: paTotal,
        bonuses: aiTotal + spiTotal + paTotal,
        renewals: totalRenewals,
        nonPaRenewals: cumulativeNonPaRenewals,
        paRenewals: cumulativePaRenewals,
        cb: cbIncome,
        cbRate: cbRate,
        total: yrTotal
      });
    }

    return {
      totalFyc,
      aiTotal,
      spiTotal,
      paTotal,
      grandTotal,
      quarterly: {
        q1: { fyc: f1, cases: c1, ai: q1Ai, spi: q1Spi, pa: q1Pa, total: f1 + q1Ai + q1Spi + q1Pa },
        q2: { fyc: f2, cases: c2, ai: q2Ai, spi: q2Spi, pa: q2Pa, total: f2 + q2Ai + q2Spi + q2Pa },
        q3: { fyc: f3, cases: c3, ai: q3Ai, spi: q3Spi, pa: q3Pa, total: f3 + q3Ai + q3Spi + q3Pa },
        q4: { fyc: f4, cases: c4, ai: q4Ai, spi: q4Spi, pa: q4Pa, total: f4 + q4Ai + q4Spi + q4Pa },
      },
      projections
    };
  }, [fycQ1, fycQ2, fycQ3, fycQ4, casesQ1, casesQ2, casesQ3, casesQ4, paFypQ1, paFypQ2, paFypQ3, paFypQ4, isNewConsultant, cbReceivingYear]);

  // Reverse Target Planner Calculations
  const reversePlan = useMemo(() => {
    const targetIncome = Number(targetAnnualIncome) || 100000;
    const avgFyc = Number(assumedAvgFycPerCase) || 3000;

    // Approximate multiplier from Base FYC to Total Income (Base + ~28% SPI + 7% AI + PA) = ~1.35x
    const estimatedMultiplier = isNewConsultant ? 1.25 : 1.35;
    const requiredFyc = targetIncome / estimatedMultiplier;
    const requiredQuarterlyFyc = requiredFyc / 4;
    const requiredMonthlyFyc = requiredFyc / 12;

    const totalCasesNeeded = Math.ceil(requiredFyc / avgFyc);
    const casesPerMonth = Math.max(Math.ceil(totalCasesNeeded / 12), 1);
    const casesPerQuarter = Math.max(Math.ceil(totalCasesNeeded / 4), 4);

    return {
      requiredFyc,
      requiredQuarterlyFyc,
      requiredMonthlyFyc,
      totalCasesNeeded,
      casesPerMonth,
      casesPerQuarter,
      mdrtPercent: Math.round((requiredFyc / 110000) * 100)
    };
  }, [targetAnnualIncome, assumedAvgFycPerCase, isNewConsultant]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="view-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '26px', margin: 0, fontWeight: '700' }}>
            Remuneration & Commission Simulator
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '2px 0 0 0' }}>
            Model quarterly agency compensation structures: Base Commission, Activity Incentive (AI), SPI, PA Bonus, and Career Benefit.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Mode Switcher */}
          <div style={{ display: 'flex', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border-light)' }}>
            <button
              onClick={() => setActiveSubTab('forward')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeSubTab === 'forward' ? 'var(--accent-primary)' : 'transparent',
                color: activeSubTab === 'forward' ? '#fff' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Forward Simulator
            </button>
            <button
              onClick={() => setActiveSubTab('reverse')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeSubTab === 'reverse' ? 'var(--accent-primary)' : 'transparent',
                color: activeSubTab === 'reverse' ? '#fff' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Target size={13} /> Reverse Goal Planner
            </button>
          </div>

          <button
            onClick={handleSyncFromPipeline}
            disabled={isSyncing}
            className="btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '7px 12px', backgroundColor: 'rgba(52, 211, 153, 0.12)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.25)' }}
            title="Sync issued cases from CRM database for current year"
          >
            <RefreshCw size={13} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
            {isSyncing ? 'Syncing...' : 'Sync from Pipeline'}
          </button>
        </div>
      </header>

      {/* Reverse Target Income Planner View */}
      {activeSubTab === 'reverse' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.3)', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(18, 18, 26, 0.8) 100%)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Target size={20} color="var(--accent-primary)" />
              Target Income Reverse Calculator
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>
                  Target Annual Net Income ($)
                </label>
                <input
                  type="number"
                  step="5000"
                  className="input-field"
                  style={{ width: '100%', fontSize: '18px', fontWeight: '700', color: '#34d399' }}
                  value={targetAnnualIncome}
                  onChange={e => setTargetAnnualIncome(e.target.value)}
                />
              </div>
              <div>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>
                  Assumed Average FYC per Case ($)
                </label>
                <input
                  type="number"
                  step="500"
                  className="input-field"
                  style={{ width: '100%', fontSize: '18px', fontWeight: '700', color: 'var(--accent-primary)' }}
                  value={assumedAvgFycPerCase}
                  onChange={e => setAssumedAvgFycPerCase(e.target.value)}
                />
              </div>
            </div>

            {/* Calculated Requirements Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Required Annual FYC</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#34d399' }}>{formatCurrency(reversePlan.requiredFyc)}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{reversePlan.mdrtPercent}% of MDRT Goal</div>
              </div>

              <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Required Monthly FYC</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>{formatCurrency(reversePlan.requiredMonthlyFyc)}/mo</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{formatCurrency(reversePlan.requiredQuarterlyFyc)}/quarter</div>
              </div>

              <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Cases Needed (Monthly)</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#60a5fa' }}>{reversePlan.casesPerMonth} Cases / Mo</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{reversePlan.totalCasesNeeded} Total Cases for Year</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Forward Simulator Main View */
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '20px' }}>
          
          {/* Left Column: Input Form */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              Quarterly Production Inputs
            </h2>

            {/* Q1-Q4 FYC */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-secondary)' }}>First Year Commission (FYC)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[['Q1', fycQ1, setFycQ1], ['Q2', fycQ2, setFycQ2], ['Q3', fycQ3, setFycQ3], ['Q4', fycQ4, setFycQ4]].map(([lbl, val, setVal]) => (
                  <div key={lbl}>
                    <label className="input-label" style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>{lbl} FYC ($)</label>
                    <input type="number" step="500" className="input-field" style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }} value={val} onChange={e => setVal(e.target.value)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Q1-Q4 Case Counts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-secondary)' }}>Quarterly Case Count (Min 4 for AI)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[['Q1 Cases', casesQ1, setCasesQ1], ['Q2 Cases', casesQ2, setCasesQ2], ['Q3 Cases', casesQ3, setCasesQ3], ['Q4 Cases', casesQ4, setCasesQ4]].map(([lbl, val, setVal]) => (
                  <div key={lbl}>
                    <label className="input-label" style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>{lbl}</label>
                    <input type="number" min="0" className="input-field" style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }} value={val} onChange={e => setVal(e.target.value)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Q1-Q4 PA FYP */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-secondary)' }}>Personal Accident (PA) FYP</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[['Q1 PA', paFypQ1, setPaFypQ1], ['Q2 PA', paFypQ2, setPaFypQ2], ['Q3 PA', paFypQ3, setPaFypQ3], ['Q4 PA', paFypQ4, setPaFypQ4]].map(([lbl, val, setVal]) => (
                  <div key={lbl}>
                    <label className="input-label" style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>{lbl} ($)</label>
                    <input type="number" step="250" className="input-field" style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }} value={val} onChange={e => setVal(e.target.value)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Consultant Profile Settings */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>
                <input type="checkbox" checked={isNewConsultant} onChange={e => setIsNewConsultant(e.target.checked)} />
                <span>First-Year New Consultant (SPI Tier Thresholds)</span>
              </label>

              <div>
                <label className="input-label" style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>Career Benefit (CB) Receiving Year</label>
                <select className="input-field" style={{ width: '100%', fontSize: '13px' }} value={cbReceivingYear} onChange={e => setCbReceivingYear(e.target.value)}>
                  <option value={0}>Not Eligible (Year 0)</option>
                  <option value={1}>Years 1 - 3 (80% on Life Renewals)</option>
                  <option value={4}>Years 4 - 6 (90%)</option>
                  <option value={7}>Years 7 - 8 (95%)</option>
                  <option value={9}>Years 9 - 10 (100%)</option>
                  <option value={11}>Years 11 - 15 (105%)</option>
                  <option value={16}>Years 16+ (110%)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Column: Output Summary & Projections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Grand Total Highlight */}
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.12) 0%, rgba(18, 18, 26, 0.8) 100%)', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                Estimated Total Year 1 Compensation
              </div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#34d399', marginBottom: '16px' }}>
                {formatCurrency(calculations.grandTotal)}
              </div>

              {/* Bonus Breakdown Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                <div style={{ padding: '10px 12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Base FYC</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{formatCurrency(calculations.totalFyc)}</div>
                </div>
                <div style={{ padding: '10px 12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Activity Inc. (AI)</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#60a5fa' }}>{formatCurrency(calculations.aiTotal)}</div>
                </div>
                <div style={{ padding: '10px 12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SPI Bonus</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#a78bfa' }}>{formatCurrency(calculations.spiTotal)}</div>
                </div>
                <div style={{ padding: '10px 12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PA Bonus</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#fbbf24' }}>{formatCurrency(calculations.paTotal)}</div>
                </div>
              </div>
            </div>

            {/* 5-Year Income Projection Table */}
            <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                5-Year Cumulative Income Projection
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                Assuming consistent annual production with stacking policy renewals and Career Benefit multipliers.
              </p>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-secondary)' }}>Year</th>
                      <th style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>FYC</th>
                      <th style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>Bonuses</th>
                      <th style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>Renewals</th>
                      <th style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>Career Benefit</th>
                      <th style={{ padding: '10px 14px', color: '#34d399', fontWeight: '700' }}>Total Income</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculations.projections.map((p) => (
                      <tr key={p.year} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>Year {p.year}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{formatCurrency(p.fyc)}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{formatCurrency(p.bonuses)}</td>
                        <td style={{ padding: '10px 14px', color: '#60a5fa' }}>{formatCurrency(p.renewals)}</td>
                        <td style={{ padding: '10px 14px', color: '#a78bfa' }}>{p.cb > 0 ? formatCurrency(p.cb) : '—'}</td>
                        <td style={{ padding: '10px 14px', color: '#34d399', fontWeight: '700' }}>{formatCurrency(p.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
