import React, { useState } from 'react';
import { Award, DollarSign, Plus, Trash2, ArrowRight, CheckCircle2, AlertTriangle, Calendar, Layers } from 'lucide-react';
import DatePicker from './DatePicker';

export default function MajorClaimBenefitSchedule({ formData, setFormData, formatCurrency, onNext }) {
  const isDisabilityIncome = formData.majorClaimSubtype === 'Disability Income';
  const claimedSum = Number(formData.sumAssuredClaimed || formData.claimedAmount) || 0;
  const approvedTotal = Number(formData.approvedAmount) || 0;
  const pendingBalance = Math.max(0, claimedSum - approvedTotal);

  const [isAddingTranche, setIsAddingTranche] = useState(false);
  const [newTranche, setNewTranche] = useState({
    settlementDate: new Date().toISOString().split('T')[0],
    insurerRef: '',
    totalPaid: isDisabilityIncome ? (formData.monthlyBenefitAmount || '') : '',
    paymentMethod: 'Direct Bank Credit / PayNow',
    notes: isDisabilityIncome ? `Monthly benefit disbursement for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : 'Lump sum tranche payout'
  });

  const handleAddTranche = (e) => {
    e.preventDefault();
    if (!newTranche.totalPaid) return;

    const amount = Number(newTranche.totalPaid) || 0;
    const entry = {
      id: crypto.randomUUID(),
      settlementDate: newTranche.settlementDate,
      insurerRef: newTranche.insurerRef || (isDisabilityIncome ? 'Monthly DI Benefit' : 'Insurer Voucher'),
      totalPaid: amount,
      coPayDeductible: 0,
      nonPayableAmount: 0,
      paymentMethod: newTranche.paymentMethod || 'Direct Bank Credit / PayNow',
      notes: newTranche.notes || ''
    };

    const updatedEntries = [...formData.settlementEntries, entry];
    const newTotalApproved = updatedEntries.reduce((sum, s) => sum + (Number(s.totalPaid) || 0), 0);

    setFormData(prev => ({
      ...prev,
      settlementEntries: updatedEntries,
      approvedAmount: newTotalApproved,
      payoutDate: newTranche.settlementDate,
      payoutMethod: newTranche.paymentMethod
    }));

    setNewTranche({
      settlementDate: new Date().toISOString().split('T')[0],
      insurerRef: '',
      totalPaid: isDisabilityIncome ? (formData.monthlyBenefitAmount || '') : '',
      paymentMethod: 'Direct Bank Credit / PayNow',
      notes: ''
    });
    setIsAddingTranche(false);
  };

  const handleQuickAddMonthlyDi = () => {
    const monthlyAmt = Number(formData.monthlyBenefitAmount) || 0;
    const currentMonthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const entry = {
      id: crypto.randomUUID(),
      settlementDate: new Date().toISOString().split('T')[0],
      insurerRef: `DI-${new Date().toISOString().slice(0, 7)}`,
      totalPaid: monthlyAmt,
      coPayDeductible: 0,
      nonPayableAmount: 0,
      paymentMethod: 'Direct Bank Credit / PayNow',
      notes: `Monthly income replacement disbursement (${currentMonthLabel})`
    };

    const updatedEntries = [...formData.settlementEntries, entry];
    const newTotalApproved = updatedEntries.reduce((sum, s) => sum + (Number(s.totalPaid) || 0), 0);

    setFormData(prev => ({
      ...prev,
      settlementEntries: updatedEntries,
      approvedAmount: newTotalApproved,
      payoutDate: entry.settlementDate,
      payoutMethod: entry.paymentMethod
    }));
  };

  const handleDeleteTranche = (entryId) => {
    const updatedEntries = formData.settlementEntries.filter(s => s.id !== entryId);
    const newTotalApproved = updatedEntries.reduce((sum, s) => sum + (Number(s.totalPaid) || 0), 0);

    setFormData(prev => ({
      ...prev,
      settlementEntries: updatedEntries,
      approvedAmount: newTotalApproved
    }));
  };

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
          {isDisabilityIncome ? 'Step 2 — Monthly Disability Income Schedule:' : 'Step 2 — Benefit & Payout Schedule:'}
        </strong>{' '}
        {isDisabilityIncome
          ? 'Track periodic monthly income replacement payouts and medical recertifications. Log each monthly payment voucher directly below.'
          : 'Major claims pay a predetermined Sum Assured rather than reimbursing hospital receipts. Log insurer approval tranches, vouchers, and disbursement vouchers below.'}
      </div>

      {/* Top Financial KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        {isDisabilityIncome ? (
          <>
            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.35)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Monthly Benefit Rate</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#c084fc', marginTop: '4px' }}>
                {formatCurrency(formData.monthlyBenefitAmount || 0)} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ month</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Deferment: {formData.defermentPeriodDays || '60 Days'}
              </div>
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--accent-success)' }}>Total Income Disbursed</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-success)', marginTop: '4px' }}>
                {formatCurrency(approvedTotal)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {formData.settlementEntries.length} Monthly {formData.settlementEntries.length === 1 ? 'Payout' : 'Payouts'} Logged
              </div>
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.35)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Recertification Status</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} color="var(--accent-success)" />
                Current & Active
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Next review in 6 months
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.35)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Sum Assured Claimed</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#60a5fa', marginTop: '4px' }}>
                {formatCurrency(claimedSum)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {formData.majorClaimSubtype || 'Critical Illness'} Benefit
              </div>
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--accent-success)' }}>Insurer Disbursed / Paid</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-success)', marginTop: '4px' }}>
                {formatCurrency(approvedTotal)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {formData.settlementEntries.length} Payout {formData.settlementEntries.length === 1 ? 'Tranche' : 'Tranches'} Recorded
              </div>
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.35)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Remaining Pending Balance</div>
              <div style={{
                fontSize: '20px',
                fontWeight: '700',
                color: pendingBalance > 0 ? '#fbbf24' : 'var(--accent-success)',
                marginTop: '4px'
              }}>
                {pendingBalance > 0 ? formatCurrency(pendingBalance) : '$0 (100% Paid)'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {pendingBalance === 0 && claimedSum > 0 ? 'Full Sum Assured settled' : 'Awaiting insurer tranche'}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Payout Disbursements Ledger */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '14.5px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={17} color="#c084fc" />
            {isDisabilityIncome ? 'Monthly Disbursements Log' : 'Insurer Payout Tranches & Vouchers'} ({formData.settlementEntries.length})
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isDisabilityIncome && Number(formData.monthlyBenefitAmount) > 0 && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', color: '#c084fc' }}
                onClick={handleQuickAddMonthlyDi}
              >
                <Plus size={14} /> Quick Log 1 Month ({formatCurrency(formData.monthlyBenefitAmount)})
              </button>
            )}

            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setIsAddingTranche(true)}
            >
              <Plus size={14} /> {isDisabilityIncome ? 'Log Custom Month Payout' : 'Log Payout Tranche'}
            </button>
          </div>
        </div>

        {/* Inline Add Tranche Form */}
        {isAddingTranche && (
          <div className="glass-panel animate-fade-in" style={{
            padding: '18px',
            borderRadius: '12px',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            backgroundColor: 'rgba(168, 85, 247, 0.05)'
          }}>
            <h4 style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>
              {isDisabilityIncome ? 'Record Monthly Benefit Disbursement' : 'Record Insurer Benefit Tranche'}
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div>
                <label className="input-label" style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Disbursement Date *</label>
                <DatePicker
                  value={newTranche.settlementDate}
                  onChange={(e) => setNewTranche({ ...newTranche, settlementDate: e.target.value })}
                />
              </div>

              <div>
                <label className="input-label" style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Insurer Voucher / Ref No</label>
                <input
                  type="text"
                  placeholder="e.g. PRU-DISB-2026-09"
                  className="input-field"
                  style={{ width: '100%', fontSize: '12px' }}
                  value={newTranche.insurerRef}
                  onChange={(e) => setNewTranche({ ...newTranche, insurerRef: e.target.value })}
                />
              </div>

              <div>
                <label className="input-label" style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Amount Disbursed ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="input-field"
                  style={{ width: '100%', fontSize: '12px', fontWeight: '600' }}
                  value={newTranche.totalPaid}
                  onChange={(e) => setNewTranche({ ...newTranche, totalPaid: e.target.value })}
                />
              </div>

              <div>
                <label className="input-label" style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Payment Method</label>
                <select
                  className="input-field"
                  style={{ width: '100%', fontSize: '12px' }}
                  value={newTranche.paymentMethod}
                  onChange={(e) => setNewTranche({ ...newTranche, paymentMethod: e.target.value })}
                >
                  <option value="Direct Bank Credit / PayNow">PayNow / Direct Bank Credit</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Telegraphic Transfer">Telegraphic Transfer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="input-label" style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Disbursement Notes / Period</label>
              <input
                type="text"
                placeholder={isDisabilityIncome ? "e.g. October 2026 Monthly Income Replacement" : "e.g. Full Critical Illness Sum Assured settlement"}
                className="input-field"
                style={{ width: '100%', fontSize: '12px' }}
                value={newTranche.notes}
                onChange={(e) => setNewTranche({ ...newTranche, notes: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px' }}
                onClick={() => setIsAddingTranche(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ fontSize: '12px', padding: '6px 16px' }}
                onClick={handleAddTranche}
              >
                Save Disbursement
              </button>
            </div>
          </div>
        )}

        {/* Disbursements Table */}
        {formData.settlementEntries.length === 0 ? (
          <div style={{
            padding: '30px 20px',
            textAlign: 'center',
            backgroundColor: 'rgba(0,0,0,0.25)',
            borderRadius: '12px',
            border: '1px dashed var(--border-light)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <DollarSign size={24} color="var(--text-muted)" />
            <div style={{ fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: '600' }}>
              No Payout Disbursements Logged Yet
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, maxWidth: '420px' }}>
              {isDisabilityIncome
                ? 'Click "Quick Log 1 Month" or "Log Custom Month Payout" as monthly income benefit cheques/credits arrive from the insurer.'
                : 'Click "Log Payout Tranche" to record the settlement voucher when the insurer approves and pays out the sum assured.'}
            </p>
          </div>
        ) : (
          <div style={{ border: '1px solid var(--border-light)', borderRadius: '10px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-secondary)' }}>Date</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-secondary)' }}>Voucher / Reference</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-secondary)' }}>Disbursed Amount</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-secondary)' }}>Method</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-secondary)' }}>Notes</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {formData.settlementEntries.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '10px 14px', color: 'var(--text-primary)', fontWeight: '500' }}>
                      {s.settlementDate}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                      {s.insurerRef || 'Insurer Disbursement'}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--accent-success)', fontWeight: '700' }}>
                      {formatCurrency(s.totalPaid)}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                      {s.paymentMethod || 'Bank Transfer'}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                      {s.notes || '—'}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteTranche(s.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                        title="Delete Entry"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Proceed Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
        <button
          type="button"
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          onClick={onNext}
        >
          Proceed to Step 3: Payout Audit <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
