import React from 'react';
import { Scale, CheckCircle2, AlertTriangle, Sparkles, DollarSign, Award, ArrowRight } from 'lucide-react';

export default function MajorClaimReconciliation({ formData, formatCurrency, onOpenAiReconciler, onNext }) {
  const isDisabilityIncome = formData.majorClaimSubtype === 'Disability Income';
  const claimedSum = Number(formData.sumAssuredClaimed || formData.claimedAmount) || 0;
  const approvedTotal = Number(formData.approvedAmount) || 0;
  const pendingBalance = Math.max(0, claimedSum - approvedTotal);
  const isFullySettled = claimedSum > 0 && pendingBalance === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Guidance Callout */}
      <div style={{
        padding: '14px 18px',
        borderRadius: '10px',
        backgroundColor: 'rgba(168, 85, 247, 0.08)',
        border: '1px solid rgba(168, 85, 247, 0.25)',
        fontSize: '13px',
        color: 'var(--text-secondary)',
        lineHeight: '1.5'
      }}>
        <strong style={{ color: 'var(--text-primary)' }}>
          {isDisabilityIncome ? 'Step 3 — Disability Income Settlement Audit:' : 'Step 3 — Sum Assured Payout Reconciliation:'}
        </strong>{' '}
        {isDisabilityIncome
          ? 'Audits accumulated monthly income replacement disbursements against the policy benefit schedule and tracks ongoing medical eligibility.'
          : 'Verifies the total insurer payout against the in-force Sum Assured entitlement to detect underpayments or confirm full case closure.'}
      </div>

      {/* Live Reconciliation Balance Card */}
      <div style={{
        padding: '20px',
        borderRadius: '14px',
        backgroundColor: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border-light)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {isDisabilityIncome ? 'Disability Income Payout Reconciliation' : 'Sum Assured Payout Audit'}
            </span>
            <span style={{
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '11.5px',
              fontWeight: '600',
              backgroundColor: isFullySettled
                ? 'rgba(16, 185, 129, 0.15)'
                : pendingBalance > 0 && claimedSum > 0
                ? 'rgba(245, 158, 11, 0.15)'
                : 'rgba(255,255,255,0.05)',
              color: isFullySettled
                ? 'var(--accent-success)'
                : pendingBalance > 0 && claimedSum > 0
                ? '#fbbf24'
                : 'var(--text-muted)',
              border: isFullySettled
                ? '1px solid rgba(16, 185, 129, 0.3)'
                : pendingBalance > 0 && claimedSum > 0
                ? '1px solid rgba(245, 158, 11, 0.3)'
                : '1px solid rgba(255,255,255,0.08)'
            }}>
              {isDisabilityIncome
                ? `💼 Active DI Claim (${formData.settlementEntries.length} Months Disbursed)`
                : isFullySettled
                ? '✅ 100% Full Sum Assured Disbursed ($0 Variance)'
                : pendingBalance > 0
                ? `⚠️ Pending Insurer Disbursement: ${formatCurrency(pendingBalance)}`
                : 'Draft / In Progress'}
            </span>
          </div>

          {onOpenAiReconciler && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '12px', color: '#c084fc' }}
              onClick={() => onOpenAiReconciler(formData)}
            >
              <Sparkles size={14} /> Run Gemini AI Claim Copilot
            </button>
          )}
        </div>

        {/* Financial Tally Cards */}
        {isDisabilityIncome ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>1. Monthly Benefit Rate</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#c084fc', marginTop: '4px' }}>
                {formatCurrency(formData.monthlyBenefitAmount || 0)} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ mo</span>
              </div>
            </div>

            <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ fontSize: '11px', color: 'var(--accent-success)' }}>2. Total Insurer Payouts Received</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent-success)', marginTop: '4px' }}>
                {formatCurrency(approvedTotal)}
              </div>
            </div>

            <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>3. Recertification Status</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} color="var(--accent-success)" />
                Current & Active
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>1. Entitled Sum Assured</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#60a5fa', marginTop: '4px' }}>
                {formatCurrency(claimedSum)}
              </div>
            </div>

            <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ fontSize: '11px', color: 'var(--accent-success)' }}>2. Insurer Payout Disbursed</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent-success)', marginTop: '4px' }}>
                {formatCurrency(approvedTotal)}
              </div>
            </div>

            <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>3. Reconciliation Variance</div>
              <div style={{
                fontSize: '18px',
                fontWeight: '700',
                color: pendingBalance > 0 ? '#fbbf24' : 'var(--accent-success)',
                marginTop: '4px'
              }}>
                {pendingBalance > 0 ? formatCurrency(pendingBalance) : '$0 (Fully Settled)'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Case Progression Card */}
      <div style={{
        padding: '18px 20px',
        borderRadius: '12px',
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        border: '1px solid var(--border-light)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <h4 style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
          Case Adjudication Breakdown
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', fontSize: '12.5px' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Claimant / Insured:</span>{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{formData.beneficiaryName || 'Self / Policyholder'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Condition / Diagnosis:</span>{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{formData.title || 'Critical Illness'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Waiting Period:</span>{' '}
            <span style={{ color: formData.waitingPeriodVerified ? 'var(--accent-success)' : '#fbbf24', fontWeight: '600' }}>
              {formData.waitingPeriodVerified ? '✓ Verified (≥90 Days)' : 'Pending verification'}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Disbursement Method:</span>{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{formData.payoutMethod || 'Direct Bank Credit / PayNow'}</strong>
          </div>
        </div>
      </div>

      {/* Proceed Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
        <button
          type="button"
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          onClick={onNext}
        >
          Proceed to Step 4: Document Vault <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
