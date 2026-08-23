import React, { useState } from 'react';
import { 
  Shield, Plus, FileText, Sparkles, CheckCircle2, Clock, AlertTriangle, 
  DollarSign, Layers, Edit2, Trash2, ExternalLink, ChevronRight, ArrowRight,
  TrendingUp, Check, Building, FileCheck
} from 'lucide-react';
import ClaimModal from './ClaimModal';
import ClaimAiAssistantModal from './ClaimAiAssistantModal';
import CollapsibleSection from './CollapsibleSection';

export default function ClientClaimsSection({ client, policies = [], claims = [], onRefreshClaims }) {
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiClaim, setAiClaim] = useState(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const formatCurrency = (val) => {
    if (val === undefined || val === null || val === '') return '$0';
    const num = Number(val);
    if (isNaN(num)) return '$0';
    const hasCents = num % 1 !== 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: 2
    }).format(num);
  };

  const handleOpenAddClaim = () => {
    setSelectedClaim(null);
    setIsModalOpen(true);
  };

  const handleOpenEditClaim = (claim) => {
    setSelectedClaim(claim);
    setIsModalOpen(true);
  };

  const handleOpenAiAssistant = (claim) => {
    setAiClaim(claim);
    setIsAiModalOpen(true);
  };

  const handleSaveClaim = async (claimData) => {
    try {
      if (claimData.id && !claimData.id.startsWith('temp_')) {
        await window.electronAPI?.updateClaim(claimData);
      } else {
        await window.electronAPI?.addClaim(claimData);
      }
      setIsModalOpen(false);
      if (onRefreshClaims) onRefreshClaims();
    } catch (err) {
      console.error("Error saving claim:", err);
    }
  };

  const handleDeleteClaim = async (claimId) => {
    if (!window.confirm("Are you sure you want to delete this claim record?")) return;
    try {
      await window.electronAPI?.deleteClaim(claimId);
      if (onRefreshClaims) onRefreshClaims();
    } catch (err) {
      console.error("Error deleting claim:", err);
    }
  };

  const handleApplyAiReconciliation = async (auditResult) => {
    if (!aiClaim) return;
    try {
      const updatedClaim = {
        ...aiClaim,
        totalIncurredAmount: auditResult.totalIncurred || aiClaim.totalIncurredAmount,
        claimedAmount: auditResult.totalClaimed || aiClaim.claimedAmount,
        approvedAmount: auditResult.totalInsurerPaid || aiClaim.approvedAmount,
        deductibleOrCoPay: auditResult.totalCoPayDeductible || aiClaim.deductibleOrCoPay,
        medisaveOffset: auditResult.totalMedisaveOrPanel || aiClaim.medisaveOffset,
        status: auditResult.reconciliationStatus?.includes('Reconciled') ? 'Paid Out' : aiClaim.status
      };
      await window.electronAPI?.updateClaim(updatedClaim);
      setIsAiModalOpen(false);
      if (onRefreshClaims) onRefreshClaims();
    } catch (err) {
      console.error("Error applying AI reconciliation:", err);
    }
  };

  // Aggregate Metrics & Warnings
  const totalClaimsCount = claims.length;
  const activeClaims = claims.filter(c => !['Paid Out', 'Declined'].includes(c.status));
  const totalIncurredAll = claims.reduce((sum, c) => sum + (Number(c.totalIncurredAmount) || 0), 0);
  const totalReimbursedAll = claims.reduce((sum, c) => sum + (Number(c.approvedAmount) || 0), 0);

  // Detect Warnings
  const unreconciledClaims = claims.filter(c => {
    const incurred = Number(c.totalIncurredAmount) || 0;
    const paid = Number(c.approvedAmount) || 0;
    const coPay = Number(c.deductibleOrCoPay) || 0;
    const medisave = Number(c.medisaveOffset) || 0;
    const variance = incurred - (paid + coPay + medisave);
    return incurred > 0 && variance > 0;
  });

  const actionRequiredClaims = claims.filter(c => c.status === 'Information Required');

  // Status Badging
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Paid Out':
      case 'Approved':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-success)', border: 'rgba(16, 185, 129, 0.3)' };
      case 'Submitted to Insurer':
      case 'Under Review':
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
      case 'Information Required':
        return { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
      case 'Declined':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', border: 'rgba(255, 255, 255, 0.1)' };
    }
  };

  // Helper to find linked policy
  const getPolicy = (policyId) => policies.find(p => p.id === policyId);

  return (
    <>
      <CollapsibleSection
        id="claims_portfolio_section"
        title={`Claims & Service Requests (${totalClaimsCount})`}
        icon={<Shield size={18} color="var(--accent-primary)" />}
        badge={
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {activeClaims.length > 0 && (
              <span style={{
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '600',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <AlertTriangle size={11} />
                {activeClaims.length} Active
              </span>
            )}
            {totalClaimsCount > 0 && (
              <span style={{
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '600',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--accent-success)'
              }}>
                {formatCurrency(totalReimbursedAll)} Reimbursed
              </span>
            )}
          </div>
        }
        actions={
          <button
            type="button"
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '600'
            }}
            onClick={handleOpenAddClaim}
          >
            <Plus size={14} /> New Claim
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Prominent Warning Banners for Claims Requiring Attention */}
      {actionRequiredClaims.length > 0 && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertTriangle size={18} color="#f87171" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '13px', color: 'var(--text-primary)', flex: 1 }}>
            <strong style={{ color: '#f87171' }}>Urgent Action Required:</strong> {actionRequiredClaims.length} {actionRequiredClaims.length === 1 ? 'claim requires' : 'claims require'} additional information, clinical reports, or itemized bills requested by the insurer.
          </div>
        </div>
      )}

      {unreconciledClaims.length > 0 && actionRequiredClaims.length === 0 && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertTriangle size={18} color="#fbbf24" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '13px', color: 'var(--text-primary)', flex: 1 }}>
            <strong style={{ color: '#fbbf24' }}>Claims Warning:</strong> {unreconciledClaims.length} active {unreconciledClaims.length === 1 ? 'claim has' : 'claims have'} unaccounted variances between hospital bills and insurer payouts. Review tagged bills or run the AI Reconciler.
          </div>
        </div>
      )}

      {/* Claims List or Empty State */}
      {claims.length === 0 ? (
        <div className="glass-panel" style={{
          padding: '40px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield size={24} color="var(--text-muted)" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>
              No Claims on Record
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
              Keep track of hospitalization bills, Critical Illness claims, insurer submissions, and settlement reconciliations.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '12.5px', padding: '6px 14px', marginTop: '4px' }}
            onClick={handleOpenAddClaim}
          >
            + Start Claim Submission
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {claims.map(claim => {
            const policy = getPolicy(claim.policyId);
            const statusStyle = getStatusBadgeStyle(claim.status);
            
            // Reconciliation Math
            const incurred = Number(claim.totalIncurredAmount) || 0;
            const paid = Number(claim.approvedAmount) || 0;
            const coPay = Number(claim.deductibleOrCoPay) || 0;
            const medisave = Number(claim.medisaveOffset) || 0;
            const accounted = paid + coPay + medisave;
            const variance = Math.round((incurred - accounted) * 100) / 100;
            const isReconciled = incurred > 0 && variance === 0;

            const billsCount = (claim.billItems || []).length;
            const docsCount = (claim.documentChecklist || []).filter(d => d.status === 'Uploaded / Received').length;

            return (
              <div
                key={claim.id}
                className="card hover-row"
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  border: '1px solid var(--border-light)',
                  position: 'relative'
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px'
                      }}>
                        {policy ? `${policy.provider} • ${policy.policyType}` : claim.claimType}
                      </span>

                      {claim.claimNumber && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Ref: <strong style={{ color: 'var(--text-secondary)' }}>{claim.claimNumber}</strong>
                        </span>
                      )}

                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                        border: `1px solid ${statusStyle.border}`
                      }}>
                        {claim.status}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '4px' }}>
                      {claim.title || 'Untitled Claim'}
                    </h3>

                    {(claim.hospitalOrClinic || claim.doctorName) && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building size={13} />
                        <span>{claim.hospitalOrClinic || 'Hospital'}</span>
                        {claim.doctorName && <span>• Dr. {claim.doctorName}</span>}
                        {claim.incidentDate && <span>• Date: {new Date(claim.incidentDate).toLocaleDateString()}</span>}
                      </div>
                    )}
                  </div>

                  {/* Top Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        color: 'var(--accent-primary)',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        border: '1px solid rgba(139, 92, 246, 0.25)'
                      }}
                      onClick={() => handleOpenAiAssistant(claim)}
                      title="AI Settlement Reconciler & Client Message Drafter"
                    >
                      <Sparkles size={14} /> AI Copilot
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '12px' }}
                      onClick={() => handleOpenEditClaim(claim)}
                      title="Edit Claim"
                    >
                      <Edit2 size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteClaim(claim.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', opacity: 0.6 }}
                      title="Delete Claim"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Financial Breakdown & Tally Pill */}
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Incurred Bills</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {formatCurrency(incurred)}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Claimed</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#60a5fa' }}>
                        {formatCurrency(claim.claimedAmount || incurred)}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--accent-success)' }}>Insurer Paid</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-success)' }}>
                        {formatCurrency(paid)}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: '#fbbf24' }}>Client Co-Pay</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#fbbf24' }}>
                        {formatCurrency(coPay)}
                      </div>
                    </div>
                  </div>

                  {/* Reconciliation Pill */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor: isReconciled
                        ? 'rgba(16, 185, 129, 0.12)'
                        : variance !== 0 && incurred > 0
                        ? 'rgba(245, 158, 11, 0.12)'
                        : 'rgba(255,255,255,0.04)',
                      color: isReconciled
                        ? 'var(--accent-success)'
                        : variance !== 0 && incurred > 0
                        ? '#fbbf24'
                        : 'var(--text-muted)',
                      border: isReconciled
                        ? '1px solid rgba(16, 185, 129, 0.3)'
                        : '1px solid rgba(255,255,255,0.06)'
                    }}>
                      {isReconciled ? '✅ Fully Reconciled' : variance > 0 ? `⚠️ ${formatCurrency(variance)} Unaccounted` : 'Reconciliation in progress'}
                    </span>

                    <button
                      type="button"
                      className="btn"
                      style={{
                        padding: '5px 12px',
                        fontSize: '11.5px',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      onClick={() => handleOpenEditClaim(claim)}
                    >
                      <Layers size={13} /> View Breakdown
                    </button>
                  </div>
                </div>

                {/* Sub-Badges Footer: Bills & Docs counts */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <span>🧾 <strong>{billsCount}</strong> {billsCount === 1 ? 'Clinic Bill' : 'Clinic Bills'} logged</span>
                    <span>📎 <strong>{docsCount}</strong> Vault {docsCount === 1 ? 'File' : 'Files'} attached</span>
                  </div>

                  {claim.payoutDate && (
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                      Paid on: {new Date(claim.payoutDate).toLocaleDateString()} via {claim.payoutMethod || 'Bank Transfer'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
        </div>
      </CollapsibleSection>

      {/* Claim Detail / Edit Modal */}
      {isModalOpen && (
        <ClaimModal
          client={client}
          policies={policies}
          claim={selectedClaim}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveClaim}
          onOpenAiReconciler={(claimToAudit) => {
            setIsModalOpen(false);
            setAiClaim(claimToAudit);
            setIsAiModalOpen(true);
          }}
        />
      )}

      {/* Claim AI Copilot & Reconciliation Modal */}
      {isAiModalOpen && (
        <ClaimAiAssistantModal
          client={client}
          claim={aiClaim}
          policy={getPolicy(aiClaim?.policyId)}
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          onApplyReconciliation={handleApplyAiReconciliation}
        />
      )}
    </>
  );
}
