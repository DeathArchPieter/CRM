import React from 'react';
import { DollarSign, Sparkles, Plus, Trash2, ArrowRight, Scale, CheckCircle2, AlertTriangle } from 'lucide-react';
import DatePicker from '../DatePicker';

export default function IndemnityReconciliation({
  formData,
  setFormData,
  formatCurrency,
  onOpenAiReconciler,
  isAddingSettlement,
  setIsAddingSettlement,
  newSettlement,
  setNewSettlement,
  handleAddSettlement,
  handleDeleteSettlement,
  handleAttachSettlementFile,
  handleOpenFile,
  onNext
}) {
  const totalIncurred = formData.billItems.reduce((sum, b) => sum + (Number(b.incurredAmount) || 0), 0);
  const totalClaimed = formData.billItems.reduce((sum, b) => sum + (Number(b.claimedAmount) || 0), 0) || totalIncurred;
  
  // Insurer Paid & Co-Pay reconciliation from settlements or bills
  const sumSettlementPaid = formData.settlementEntries.reduce((sum, s) => sum + (Number(s.totalPaid) || 0), 0);
  const sumBillsPaid = formData.billItems.reduce((sum, b) => sum + (Number(b.insurerPaidAmount) || 0), 0);
  const totalInsurerPaid = sumSettlementPaid > 0 ? sumSettlementPaid : (Number(formData.approvedAmount) || sumBillsPaid);

  const sumSettlementCoPay = formData.settlementEntries.reduce((sum, s) => sum + (Number(s.coPayDeductible) || 0), 0);
  const sumBillsCoPay = formData.billItems.reduce((sum, b) => sum + (Number(b.deductibleOrCoPay) || 0), 0);
  const totalCoPay = sumSettlementCoPay > 0 ? sumSettlementCoPay : (Number(formData.deductibleOrCoPay) || sumBillsCoPay);

  const totalMedisave = formData.billItems.reduce((sum, b) => sum + (Number(b.medisaveOffset) || 0), 0) || (Number(formData.medisaveOffset) || 0);

  const accountedTotal = totalInsurerPaid + totalCoPay + totalMedisave;
  const unaccountedDifference = Math.round((totalIncurred - accountedTotal) * 100) / 100;
  const isFullyReconciled = totalIncurred > 0 && unaccountedDifference === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        padding: '14px 18px',
        borderRadius: '10px',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        fontSize: '13px',
        color: 'var(--text-secondary)',
        lineHeight: '1.5'
      }}>
        <strong style={{ color: 'var(--text-primary)' }}>Step 3 — Settlement & Reconciliation:</strong> Log Insurer Settlement Statements and EOB letters. The system automatically cross-tallies the total tagged bills against the insurer payout, deductibles, and co-pay to verify if everything has been paid or if an appeal is needed.
      </div>

      {/* Live Reconciliation Balance Card */}
      <div style={{
        padding: '18px 20px',
        borderRadius: '12px',
        backgroundColor: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border-light)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Live Reconciliation Audit Balance
            </span>
            <span style={{
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '600',
              backgroundColor: isFullyReconciled
                ? 'rgba(16, 185, 129, 0.15)'
                : unaccountedDifference !== 0 && totalIncurred > 0
                ? 'rgba(245, 158, 11, 0.15)'
                : 'rgba(255,255,255,0.05)',
              color: isFullyReconciled
                ? 'var(--accent-success)'
                : unaccountedDifference !== 0 && totalIncurred > 0
                ? '#fbbf24'
                : 'var(--text-muted)'
            }}>
              {isFullyReconciled
                ? '✅ Fully Reconciled ($0 Variance)'
                : unaccountedDifference > 0
                ? `⚠️ Discrepancy / Shortfall: ${formatCurrency(unaccountedDifference)} Unaccounted`
                : unaccountedDifference < 0
                ? `ℹ️ Excess Payout: ${formatCurrency(Math.abs(unaccountedDifference))}`
                : 'Draft / Pending Settlement'}
            </span>
          </div>

          {onOpenAiReconciler && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '12px', color: 'var(--accent-primary)' }}
              onClick={() => onOpenAiReconciler(formData)}
            >
              <Sparkles size={14} /> Run Gemini AI Reconciler
            </button>
          )}
        </div>

        {/* 5 Financial Tally Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>1. Total Incurred Bills</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
              {formatCurrency(totalIncurred)}
            </div>
          </div>

          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>2. Total Submitted</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#60a5fa', marginTop: '4px' }}>
              {formatCurrency(totalClaimed)}
            </div>
          </div>

          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ fontSize: '11px', color: 'var(--accent-success)' }}>3. Insurer Reimbursed</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--accent-success)', marginTop: '4px' }}>
              {formatCurrency(totalInsurerPaid)}
            </div>
          </div>

          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <div style={{ fontSize: '11px', color: '#fbbf24' }}>4. Client Co-Pay / Deductible</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#fbbf24', marginTop: '4px' }}>
              {formatCurrency(totalCoPay)}
            </div>
          </div>

          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>5. Medisave / CPF Offset</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {formatCurrency(totalMedisave)}
            </div>
          </div>
        </div>
      </div>

      {/* Insurer Settlement Statements Log */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={16} color="var(--accent-success)" />
            Insurer Settlement Statements & Letters ({formData.settlementEntries.length})
          </h3>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setIsAddingSettlement(true)}
          >
            <Plus size={14} /> Log Settlement Statement
          </button>
        </div>

        {/* Inline Add Settlement Form */}
        {isAddingSettlement && (
          <div className="glass-panel animate-fade-in" style={{ padding: '16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Log Insurer Settlement Statement</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label className="input-label" style={{ fontSize: '11px' }}>Settlement Date *</label>
                <DatePicker
                  style={{ width: '100%', fontSize: '12px', padding: '6px 10px' }}
                  value={newSettlement.settlementDate}
                  onChange={(e) => setNewSettlement({ ...newSettlement, settlementDate: e.target.value })}
                />
              </div>
              <div>
                <label className="input-label" style={{ fontSize: '11px' }}>Net Paid Out ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="input-field"
                  style={{ width: '100%', fontSize: '12px' }}
                  value={newSettlement.totalPaid}
                  onChange={(e) => setNewSettlement({ ...newSettlement, totalPaid: e.target.value })}
                />
              </div>
              <div>
                <label className="input-label" style={{ fontSize: '11px' }}>Deductible / Co-Pay Stated ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="input-field"
                  style={{ width: '100%', fontSize: '12px' }}
                  value={newSettlement.coPayDeductible}
                  onChange={(e) => setNewSettlement({ ...newSettlement, coPayDeductible: e.target.value })}
                />
              </div>
              <div>
                <label className="input-label" style={{ fontSize: '11px' }}>Disbursement Method</label>
                <select
                  className="input-field"
                  style={{ width: '100%', fontSize: '12px' }}
                  value={newSettlement.paymentMethod}
                  onChange={(e) => setNewSettlement({ ...newSettlement, paymentMethod: e.target.value })}
                >
                  <option value="Direct Bank Credit / PayNow">PayNow / Bank Credit</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Direct Hospital Offset">Direct Hospital Offset</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn"
                style={{ fontSize: '12px', padding: '6px 12px' }}
                onClick={() => setIsAddingSettlement(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ fontSize: '12px', padding: '6px 14px' }}
                onClick={handleAddSettlement}
              >
                Save Settlement
              </button>
            </div>
          </div>
        )}

        {/* Settlement Entries Table */}
        {formData.settlementEntries.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
            No settlement statements logged yet. Click "Log Settlement Statement" to record insurer disbursements.
          </div>
        ) : (
          <div style={{ border: '1px solid var(--border-light)', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-secondary)' }}>Date</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>Net Payout</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>Deductible</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-secondary)' }}>Payment Method</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>Settlement PDF</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}></th>
                </tr>
              </thead>
              <tbody>
                {formData.settlementEntries.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>{s.settlementDate}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--accent-success)', fontWeight: '700' }}>
                      {formatCurrency(s.totalPaid)}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: '#fbbf24' }}>
                      {formatCurrency(s.coPayDeductible)}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{s.paymentMethod}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      {s.settlementLetterFilePath ? (
                        <button
                          type="button"
                          className="btn"
                          style={{ padding: '3px 8px', fontSize: '11px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-success)' }}
                          onClick={() => handleOpenFile(s.settlementLetterFilePath)}
                        >
                          📄 View PDF
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn"
                          style={{ padding: '3px 8px', fontSize: '11px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}
                          onClick={() => handleAttachSettlementFile(s.id)}
                        >
                          📎 Attach PDF
                        </button>
                      )}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteSettlement(s.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: 0.6 }}
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
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
