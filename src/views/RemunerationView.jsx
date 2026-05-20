import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Target, 
  ShieldCheck, 
  Repeat, 
  PiggyBank,
  DollarSign,
  Briefcase,
  Clock,
  Award
} from 'lucide-react';

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

  // Commission/Bonus Assumptions
  const QUARTERLY_AI_TARGET = 4; // Target cases per quarter
  const QUARTERLY_AI_RATE = 0.07; // 7% of Quarterly FYC

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

    // Derived internally from PA FYP
    const pr1 = pf1;
    const pr2 = pf2;
    const pr3 = pf3;
    const pr4 = pf4;

    const ratePa1 = getPaBonusRate(pf1);
    const ratePa2 = getPaBonusRate(pf2);
    const ratePa3 = getPaBonusRate(pf3);
    const ratePa4 = getPaBonusRate(pf4);

    const q1Pa = pr1 > 0 ? pr1 * ratePa1 : 0;
    const q2Pa = pr2 > 0 ? pr2 * ratePa2 : 0;
    const q3Pa = pr3 > 0 ? pr3 * ratePa3 : 0;
    const q4Pa = pr4 > 0 ? pr4 * ratePa4 : 0;
    const paTotal = q1Pa + q2Pa + q3Pa + q4Pa;

    const fmt = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    const pct = (rate) => (rate * 100).toFixed(2) + '%';
    
    // Explainers
    const q1Explain = `YTD FYC: ${fmt(ytdQ1)}\nSPI Rate: ${pct(rateQ1)}\nYTD SPI: ${fmt(spiTotalQ1)}\nLess Prev Paid: $0\nQ1 Payout: ${fmt(q1Spi)}`;
    const q2Explain = `YTD FYC: ${fmt(ytdQ2)}\nSPI Rate: ${pct(rateQ2)}\nYTD SPI: ${fmt(spiTotalQ2)}\nLess Prev Paid: -${fmt(spiTotalQ1)}\nQ2 Payout: ${fmt(q2Spi)}`;
    const q3Explain = `YTD FYC: ${fmt(ytdQ3)}\nSPI Rate: ${pct(rateQ3)}\nYTD SPI: ${fmt(spiTotalQ3)}\nLess Prev Paid: -${fmt(spiTotalQ2)}\nQ3 Payout: ${fmt(q3Spi)}`;
    const q4Explain = `YTD FYC: ${fmt(ytdQ4)}\nSPI Rate: ${pct(rateQ4)}\nYTD SPI: ${fmt(spiTotalQ4)}\nLess Prev Paid: -${fmt(spiTotalQ3)}\nQ4 Payout: ${fmt(q4Spi)}`;

    const q1PaExplain = `PA FYP: ${fmt(pf1)}\nRate: ${pct(ratePa1)}\nPA Renewal: ${fmt(pr1)}\nQ1 Payout: ${fmt(q1Pa)}\n(Assumes >84% Persistency)`;
    const q2PaExplain = `PA FYP: ${fmt(pf2)}\nRate: ${pct(ratePa2)}\nPA Renewal: ${fmt(pr2)}\nQ2 Payout: ${fmt(q2Pa)}\n(Assumes >84% Persistency)`;
    const q3PaExplain = `PA FYP: ${fmt(pf3)}\nRate: ${pct(ratePa3)}\nPA Renewal: ${fmt(pr3)}\nQ3 Payout: ${fmt(q3Pa)}\n(Assumes >84% Persistency)`;
    const q4PaExplain = `PA FYP: ${fmt(pf4)}\nRate: ${pct(ratePa4)}\nPA Renewal: ${fmt(pr4)}\nQ4 Payout: ${fmt(q4Pa)}\n(Assumes >84% Persistency)`;

    // 5-Year Projections
    // Assuming constant production (repeating Year 1 sales and bonuses)
    const annualBonuses = aiTotal + spiTotal + paTotal;
    
    // Renewal rates as % of FYC: Y2: 50%, Y3: 20%, Y4: 5%, Y5: 5%, Y6: 5%
    // Age 1 is the year of sale (no renewals). Age 2 is Y2.
    const renewalRates = [0, 0.50, 0.20, 0.05, 0.05, 0.05];
    const cbStartYear = Number(cbReceivingYear) || 0;
    
    const projections = [];
    
    for (let i = 1; i <= 5; i++) {
      let yearNonPaRenewal = 0;
      let yearPaRenewal = 0;
      
      for (let prevYear = 1; prevYear < i; prevYear++) {
        // Non-PA Renewals (decaying rates on FYC)
        const policyAge = (i - prevYear) + 1;
        const rate = renewalRates[policyAge - 1] || 0;
        yearNonPaRenewal += totalFyc * rate;
        
        // PA Renewals (flat perpetual 30% on PA FYP)
        yearPaRenewal += totalPaFyp * 0.30;
      }
      
      const totalRenewals = yearNonPaRenewal + yearPaRenewal;
      
      // Career Benefit
      // Kicks in on Year 3 if starting fresh. If cbReceivingYear > 0, they are already receiving CB.
      let currentRecvYear = 0;
      if (cbStartYear > 0) {
        currentRecvYear = cbStartYear + (i - 1);
      } else {
        currentRecvYear = i >= 3 ? i - 2 : 0;
      }
      
      const cbRate = getCbRate(currentRecvYear);
      // CB is applied ONLY to non-PA renewals (2nd to 6th year)
      const yearCareerBenefit = yearNonPaRenewal * cbRate;
      
      projections.push({
        year: i,
        fyc: totalFyc,
        ai: aiTotal,
        spi: spiTotal,
        pa: paTotal,
        bonuses: annualBonuses,
        nonPaRenewals: yearNonPaRenewal,
        paRenewals: yearPaRenewal,
        renewals: totalRenewals,
        cb: yearCareerBenefit,
        cbRate: cbRate,
        total: totalFyc + annualBonuses + totalRenewals + yearCareerBenefit
      });
    }
    
    // Initial display for Sidebar (Current Year Total)
    let currentYearCb = 0;
    if (cbStartYear > 0) {
      // If they are already in a receiving year, they get CB on their assumed current renewals.
      // But we don't have inputs for current existing renewals, so we can't calculate current year CB accurately
      // without projecting backwards. We will leave Current Year Total as FYC + Bonuses for now.
    }
    const totalCurrentYear = totalFyc + annualBonuses;
    
    return { 
      totalFyc, 
      aiTotal, 
      q1Ai, q2Ai, q3Ai, q4Ai,
      spiTotal,
      q1Spi, q2Spi, q3Spi, q4Spi,
      q1Explain, q2Explain, q3Explain, q4Explain,
      paTotal,
      q1Pa, q2Pa, q3Pa, q4Pa,
      q1PaExplain, q2PaExplain, q3PaExplain, q4PaExplain,
      totalCurrentYear, 
      projections
    };
  }, [
    fycQ1, fycQ2, fycQ3, fycQ4, 
    casesQ1, casesQ2, casesQ3, casesQ4, 
    paFypQ1, paFypQ2, paFypQ3, paFypQ4, 
    isNewConsultant, cbReceivingYear
  ]);

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="view-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '28px', marginBottom: '4px' }}>Remuneration Tool</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Calculate commissions and project future incentives.</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', flex: 1, overflowY: 'auto', paddingBottom: '24px' }}>
        {/* Left Sidebar - Inputs */}
        <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={20} color="var(--accent-primary)" />
            Sales Inputs
          </h2>
          
          <div style={{ marginTop: '0px', marginBottom: '16px' }}>
            <label className="input-label" style={{ display: 'block', marginBottom: '12px' }}>First Year Commissions (Quarterly)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Q1</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '8px', top: '10px', color: 'var(--text-muted)' }}>$</span>
                  <input type="number" className="input-field" style={{ width: '100%', paddingLeft: '20px' }} value={fycQ1} onChange={e => setFycQ1(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Q2</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '8px', top: '10px', color: 'var(--text-muted)' }}>$</span>
                  <input type="number" className="input-field" style={{ width: '100%', paddingLeft: '20px' }} value={fycQ2} onChange={e => setFycQ2(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Q3</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '8px', top: '10px', color: 'var(--text-muted)' }}>$</span>
                  <input type="number" className="input-field" style={{ width: '100%', paddingLeft: '20px' }} value={fycQ3} onChange={e => setFycQ3(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Q4</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '8px', top: '10px', color: 'var(--text-muted)' }}>$</span>
                  <input type="number" className="input-field" style={{ width: '100%', paddingLeft: '20px' }} value={fycQ4} onChange={e => setFycQ4(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px', marginBottom: '8px' }}>
            <label className="input-label" style={{ display: 'block', marginBottom: '12px' }}>Cases (Quarterly)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Q1</label>
                <input type="number" className="input-field" style={{ width: '100%' }} value={casesQ1} onChange={e => setCasesQ1(e.target.value === '' ? '' : Number(e.target.value))} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Q2</label>
                <input type="number" className="input-field" style={{ width: '100%' }} value={casesQ2} onChange={e => setCasesQ2(e.target.value === '' ? '' : Number(e.target.value))} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Q3</label>
                <input type="number" className="input-field" style={{ width: '100%' }} value={casesQ3} onChange={e => setCasesQ3(e.target.value === '' ? '' : Number(e.target.value))} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Q4</label>
                <input type="number" className="input-field" style={{ width: '100%' }} value={casesQ4} onChange={e => setCasesQ4(e.target.value === '' ? '' : Number(e.target.value))} />
              </div>
            </div>
          </div>

          {/* PA Inputs */}
          <div style={{ marginTop: '24px', marginBottom: '16px' }}>
            <label className="input-label" style={{ display: 'block', marginBottom: '12px' }}>PA FYP (Quarterly)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Q1</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '8px', top: '10px', color: 'var(--text-muted)' }}>$</span>
                  <input type="number" className="input-field" style={{ width: '100%', paddingLeft: '20px' }} value={paFypQ1} onChange={e => setPaFypQ1(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Q2</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '8px', top: '10px', color: 'var(--text-muted)' }}>$</span>
                  <input type="number" className="input-field" style={{ width: '100%', paddingLeft: '20px' }} value={paFypQ2} onChange={e => setPaFypQ2(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Q3</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '8px', top: '10px', color: 'var(--text-muted)' }}>$</span>
                  <input type="number" className="input-field" style={{ width: '100%', paddingLeft: '20px' }} value={paFypQ3} onChange={e => setPaFypQ3(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Q4</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '8px', top: '10px', color: 'var(--text-muted)' }}>$</span>
                  <input type="number" className="input-field" style={{ width: '100%', paddingLeft: '20px' }} value={paFypQ4} onChange={e => setPaFypQ4(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ padding: '16px', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <input 
                type="checkbox" 
                id="newConsultantToggle"
                checked={isNewConsultant} 
                onChange={e => setIsNewConsultant(e.target.checked)} 
                style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="newConsultantToggle" style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                New Consultant (&lt; 2 Years)
              </label>
            </div>
            
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Career Benefit Receiving Year</label>
              <input 
                type="number" 
                min="0"
                className="input-field" 
                style={{ width: '100%', marginTop: '8px' }} 
                value={cbReceivingYear} 
                placeholder="0 if starting fresh"
                onChange={e => setCbReceivingYear(e.target.value === '' ? '' : Number(e.target.value))} 
              />
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Enter the number of years you have already qualified for Career Benefit. Enter 0 if you are newly qualifying this year.
              </p>
            </div>
          </div>

          <div style={{ marginTop: '32px', padding: '16px', backgroundColor: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Current Year Total</h3>
            <div className="text-gradient" style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {formatCurrency(calculations.totalCurrentYear)}
            </div>
          </div>
        </div>

        {/* Right Content - Output Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{ fontSize: '20px', color: 'var(--text-primary)' }}>Active Incentives</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            
            {/* FYC */}
            <div className="card" style={{ animationDelay: '0.1s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ padding: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
                  <DollarSign size={24} color="var(--accent-success)" />
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Direct</span>
              </div>
              <h3 style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '4px' }}>First Year Commissions</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {formatCurrency(calculations.totalFyc)}
              </div>
            </div>

            {/* AI */}
            <div className="card" style={{ animationDelay: '0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ padding: '10px', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px' }}>
                  <Target size={24} color="var(--accent-primary)" />
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Quarterly</span>
              </div>
              <h3 style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Activity Incentive (AI)</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: calculations.aiTotal > 0 ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                {formatCurrency(calculations.aiTotal)}
              </div>
              <div style={{ display: 'flex', gap: '4px', marginTop: '12px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '100%', height: '4px', backgroundColor: calculations.q1Ai > 0 ? 'var(--accent-primary)' : 'var(--bg-base)', borderRadius: '2px' }} title="Q1"></div>
                  <span style={{ fontSize: '10px', color: calculations.q1Ai > 0 ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{formatCurrency(calculations.q1Ai)}</span>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '100%', height: '4px', backgroundColor: calculations.q2Ai > 0 ? 'var(--accent-primary)' : 'var(--bg-base)', borderRadius: '2px' }} title="Q2"></div>
                  <span style={{ fontSize: '10px', color: calculations.q2Ai > 0 ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{formatCurrency(calculations.q2Ai)}</span>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '100%', height: '4px', backgroundColor: calculations.q3Ai > 0 ? 'var(--accent-primary)' : 'var(--bg-base)', borderRadius: '2px' }} title="Q3"></div>
                  <span style={{ fontSize: '10px', color: calculations.q3Ai > 0 ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{formatCurrency(calculations.q3Ai)}</span>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '100%', height: '4px', backgroundColor: calculations.q4Ai > 0 ? 'var(--accent-primary)' : 'var(--bg-base)', borderRadius: '2px' }} title="Q4"></div>
                  <span style={{ fontSize: '10px', color: calculations.q4Ai > 0 ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{formatCurrency(calculations.q4Ai)}</span>
                </div>
              </div>
            </div>

            {/* SPI */}
            <div className="card" style={{ animationDelay: '0.3s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ padding: '10px', backgroundColor: 'rgba(6, 182, 212, 0.1)', borderRadius: '8px' }}>
                  <TrendingUp size={24} color="var(--accent-secondary)" />
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Cumulative</span>
              </div>
              <h3 style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Special Production Incentive</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: calculations.spiTotal > 0 ? 'var(--accent-secondary)' : 'var(--text-muted)' }}>
                {formatCurrency(calculations.spiTotal)}
              </div>
              <div style={{ display: 'flex', gap: '4px', marginTop: '12px' }}>
                <div title={calculations.q1Explain} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'help' }}>
                  <div style={{ width: '100%', height: '4px', backgroundColor: calculations.q1Spi > 0 ? 'var(--accent-secondary)' : 'var(--bg-base)', borderRadius: '2px' }}></div>
                  <span style={{ fontSize: '10px', color: calculations.q1Spi > 0 ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{formatCurrency(calculations.q1Spi)}</span>
                </div>
                <div title={calculations.q2Explain} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'help' }}>
                  <div style={{ width: '100%', height: '4px', backgroundColor: calculations.q2Spi > 0 ? 'var(--accent-secondary)' : 'var(--bg-base)', borderRadius: '2px' }}></div>
                  <span style={{ fontSize: '10px', color: calculations.q2Spi > 0 ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{formatCurrency(calculations.q2Spi)}</span>
                </div>
                <div title={calculations.q3Explain} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'help' }}>
                  <div style={{ width: '100%', height: '4px', backgroundColor: calculations.q3Spi > 0 ? 'var(--accent-secondary)' : 'var(--bg-base)', borderRadius: '2px' }}></div>
                  <span style={{ fontSize: '10px', color: calculations.q3Spi > 0 ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{formatCurrency(calculations.q3Spi)}</span>
                </div>
                <div title={calculations.q4Explain} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'help' }}>
                  <div style={{ width: '100%', height: '4px', backgroundColor: calculations.q4Spi > 0 ? 'var(--accent-secondary)' : 'var(--bg-base)', borderRadius: '2px' }}></div>
                  <span style={{ fontSize: '10px', color: calculations.q4Spi > 0 ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{formatCurrency(calculations.q4Spi)}</span>
                </div>
              </div>
            </div>

            {/* PA Bonus */}
            <div className="card" style={{ animationDelay: '0.4s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ padding: '10px', backgroundColor: 'rgba(234, 179, 8, 0.1)', borderRadius: '8px' }}>
                  <ShieldCheck size={24} color="var(--accent-warning)" />
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Quarterly</span>
              </div>
              <h3 style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '4px' }}>PA Production Bonus</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: calculations.paTotal > 0 ? 'var(--accent-warning)' : 'var(--text-muted)' }}>
                {formatCurrency(calculations.paTotal)}
              </div>
              <div style={{ display: 'flex', gap: '4px', marginTop: '12px' }}>
                <div title={calculations.q1PaExplain} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'help' }}>
                  <div style={{ width: '100%', height: '4px', backgroundColor: calculations.q1Pa > 0 ? 'var(--accent-warning)' : 'var(--bg-base)', borderRadius: '2px' }}></div>
                  <span style={{ fontSize: '10px', color: calculations.q1Pa > 0 ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{formatCurrency(calculations.q1Pa)}</span>
                </div>
                <div title={calculations.q2PaExplain} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'help' }}>
                  <div style={{ width: '100%', height: '4px', backgroundColor: calculations.q2Pa > 0 ? 'var(--accent-warning)' : 'var(--bg-base)', borderRadius: '2px' }}></div>
                  <span style={{ fontSize: '10px', color: calculations.q2Pa > 0 ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{formatCurrency(calculations.q2Pa)}</span>
                </div>
                <div title={calculations.q3PaExplain} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'help' }}>
                  <div style={{ width: '100%', height: '4px', backgroundColor: calculations.q3Pa > 0 ? 'var(--accent-warning)' : 'var(--bg-base)', borderRadius: '2px' }}></div>
                  <span style={{ fontSize: '10px', color: calculations.q3Pa > 0 ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{formatCurrency(calculations.q3Pa)}</span>
                </div>
                <div title={calculations.q4PaExplain} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'help' }}>
                  <div style={{ width: '100%', height: '4px', backgroundColor: calculations.q4Pa > 0 ? 'var(--accent-warning)' : 'var(--bg-base)', borderRadius: '2px' }}></div>
                  <span style={{ fontSize: '10px', color: calculations.q4Pa > 0 ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{formatCurrency(calculations.q4Pa)}</span>
                </div>
              </div>
            </div>

          </div>

          <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} color="var(--text-muted)" />
            Upcoming Modules (In Development)
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', opacity: 0.6 }}>
            {/* APF Placeholder */}
            <div className="card" style={{ borderStyle: 'dashed' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ padding: '10px', backgroundColor: 'var(--bg-base)', borderRadius: '8px' }}>
                  <PiggyBank size={24} color="var(--text-muted)" />
                </div>
                <span style={{ fontSize: '10px', padding: '4px 8px', backgroundColor: 'var(--bg-base)', borderRadius: '12px', color: 'var(--text-muted)' }}>Pending Logic</span>
              </div>
              <h3 style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Agent Provident Fund</h3>
              <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-muted)' }}>TBD</div>
            </div>
          </div>

          <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginTop: '16px' }}>5-Year Income Projection</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Assuming constant annual production and stacking renewals. Career Benefit applied strictly to Life/Health renewals.
          </p>
          
          <div className="glass-panel" style={{ padding: '0', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '14px', minWidth: '600px' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '500' }}>Year</th>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '500' }}>FYC</th>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Bonuses</th>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Renewals</th>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Career Benefit</th>
                  <th style={{ padding: '16px', color: 'var(--text-primary)', fontWeight: '600' }}>Total Income</th>
                </tr>
              </thead>
              <tbody>
                {calculations.projections.map((proj) => (
                  <tr key={proj.year} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '16px', textAlign: 'left', color: 'var(--text-primary)', fontWeight: '500' }}>Year {proj.year}</td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{formatCurrency(proj.fyc)}</td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                      <span title={`AI: ${formatCurrency(proj.ai)}\nSPI: ${formatCurrency(proj.spi)}\nPA: ${formatCurrency(proj.pa)}`} style={{ cursor: 'help', borderBottom: '1px dotted var(--text-muted)' }}>
                        {formatCurrency(proj.bonuses)}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--accent-success)' }}>
                      <span title={`Life/Health: ${formatCurrency(proj.nonPaRenewals)}\nPA: ${formatCurrency(proj.paRenewals)}`} style={{ cursor: 'help', borderBottom: '1px dotted var(--accent-success)' }}>
                        {formatCurrency(proj.renewals)}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--accent-secondary)' }}>
                      {proj.cb > 0 ? (
                        <span title={`Rate: ${(proj.cbRate * 100).toFixed(0)}% of Life/Health Renewals`} style={{ cursor: 'help', borderBottom: '1px dotted var(--accent-secondary)' }}>
                          {formatCurrency(proj.cb)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '15px' }}>{formatCurrency(proj.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
