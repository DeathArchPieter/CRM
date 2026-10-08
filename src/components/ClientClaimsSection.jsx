import React, { useState } from 'react';
import { 
  Shield, Plus, FileText, Sparkles, CheckCircle2, Clock, AlertTriangle, 
  DollarSign, Layers, Edit2, Trash2, ExternalLink, ChevronRight, ArrowRight,
  TrendingUp, Check, Building, FileCheck, Baby, Building2, Activity, Award
} from 'lucide-react';
import ClaimModal from './ClaimModal';
import ClaimArchetypeModal from './ClaimArchetypeModal';
import ClaimAiAssistantModal from './ClaimAiAssistantModal';
import CollapsibleSection from './CollapsibleSection';

export default function ClientClaimsSection({ client, policies = [], claims = [], onRefreshClaims }) {
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isArchetypeModalOpen, setIsArchetypeModalOpen] = useState(false);
  const [selectedArchetype, setSelectedArchetype] = useState('hospitalisation');
  const [categoryFilter, setCategoryFilter] = useState('all');
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

  const inferCategory = (claimObj) => {
    if (!claimObj) return 'hospitalisation';
    if (claimObj.claimCategory) return claimObj.claimCategory;
    const t = (claimObj.claimType || '').toLowerCase();
    const title = (claimObj.title || '').toLowerCase();
    if (t.includes('accident') || title.includes('accident') || title.includes('injury')) return 'accident';
    if (
      t.includes('critical') || 
      t.includes('disability') || 
      t.includes('death') || 
      t.includes('tpd') || 
      t.includes('terminal') || 
      claimObj.majorClaimSubtype
    ) return 'major';
    return 'hospitalisation';
  };

  const handleOpenAddClaim = () => {
    setIsArchetypeModalOpen(true);
  };

  const handleSelectArchetype = (archetype) => {
    setSelectedArchetype(archetype);
    setSelectedClaim(null);
    setIsArchetypeModalOpen(false);
    setIsModalOpen(true);
  };

  const handleOpenEditClaim = (claim) => {
    const cat = inferCategory(claim);
    setSelectedArchetype(cat);
    setSelectedClaim(claim);
    setIsModalOpen(true);
  };

  const handleOpenAiAssistant = (claim) => {
    setAiClaim(claim);
    setIsAiModalOpen(true);
  };

  const handleSaveClaim = async (claimData) => {
    try {
      let res;
      const isExisting = selectedClaim && selectedClaim.id && claims.some(c => c.id === selectedClaim.id);
      if (isExisting) {
        res = await window.electronAPI?.updateClaim(claimData);
      } else {
        res = await window.electronAPI?.addClaim(claimData);
      }

      if (res && res.success === false) {
        console.error("Error saving claim:", res.error);
        alert(`Failed to save claim: ${res.error || 'Unknown error'}`);
        return;
      }

      setIsModalOpen(false);
      setSelectedClaim(null);
      if (onRefreshClaims) await onRefreshClaims();
    } catch (err) {
      console.error("Error saving claim:", err);
      alert(`Error saving claim: ${err.message}`);
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

  // Aggregate Metrics & Archetype Groupings
  const totalClaimsCount = claims.length;
  const activeClaims = claims.filter(c => !['Paid Out', 'Declined'].includes(c.status));
  const totalReimbursedAll = claims.reduce((sum, c) => sum + (Number(c.approvedAmount) || 0), 0);

  const hospClaims = claims.filter(c => inferCategory(c) === 'hospitalisation');
  const accClaims = claims.filter(c => inferCategory(c) === 'accident');
  const majorClaims = claims.filter(c => inferCategory(c) === 'major');

  const filteredClaims = categoryFilter === 'all'
    ? claims
    : claims.filter(c => inferCategory(c) === categoryFilter);

  // Detect Warnings for Indemnity / Hospital claims
  const unreconciledClaims = claims.filter(c => {
    const cat = inferCategory(c);
    if (cat === 'major') return false; // Handled separately via MajorClaimReconciliation
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
            <Plus size={14} /> New Claim Event
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Archetype Filter Tabs & New Claim Button */}
          {totalClaimsCount > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              flexWrap: 'wrap',
              padding: '6px 10px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-light)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setCategoryFilter('all')}
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: categoryFilter === 'all' ? '600' : '400',
                    borderRadius: '7px',
                    backgroundColor: categoryFilter === 'all' ? 'var(--accent-primary)' : 'transparent',
                    color: categoryFilter === 'all' ? '#fff' : 'var(--text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  All ({claims.length})
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={() => setCategoryFilter('hospitalisation')}
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: categoryFilter === 'hospitalisation' ? '600' : '400',
                    borderRadius: '7px',
                    backgroundColor: categoryFilter === 'hospitalisation' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                    color: categoryFilter === 'hospitalisation' ? '#38bdf8' : 'var(--text-secondary)',
                    border: categoryFilter === 'hospitalisation' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Building2 size={13} /> Hospitalisation ({hospClaims.length})
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={() => setCategoryFilter('accident')}
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: categoryFilter === 'accident' ? '600' : '400',
                    borderRadius: '7px',
                    backgroundColor: categoryFilter === 'accident' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                    color: categoryFilter === 'accident' ? '#fbbf24' : 'var(--text-secondary)',
                    border: categoryFilter === 'accident' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Activity size={13} /> Personal Accident ({accClaims.length})
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={() => setCategoryFilter('major')}
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: categoryFilter === 'major' ? '600' : '400',
                    borderRadius: '7px',
                    backgroundColor: categoryFilter === 'major' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                    color: categoryFilter === 'major' ? '#c084fc' : 'var(--text-secondary)',
                    border: categoryFilter === 'major' ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Award size={13} /> Major Claims ({majorClaims.length})
                </button>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Showing <strong>{filteredClaims.length}</strong> of {totalClaimsCount} events
              </div>
            </div>
          )}

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
                <strong style={{ color: '#fbbf24' }}>Hospital Bill Variance:</strong> {unreconciledClaims.length} active {unreconciledClaims.length === 1 ? 'claim has' : 'claims have'} unaccounted variances between hospital bills and insurer payouts. Review tagged bills or run the AI Reconciler.
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
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto' }}>
                  Track Integrated Shield inpatient hospitalisations, personal accident outpatient bills, or Major Claims (Critical Illness, Disability Income, TPD).
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '12.5px', padding: '7px 16px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={handleOpenAddClaim}
              >
                <Plus size={14} /> Start Claim Submission
              </button>
            </div>
          ) : filteredClaims.length === 0 ? (
            <div className="glass-panel" style={{
              padding: '32px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                No {categoryFilter === 'hospitalisation' ? 'Hospitalisation' : categoryFilter === 'accident' ? 'Personal Accident' : 'Major Claims'} records found.
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '5px 12px' }}
                  onClick={() => setCategoryFilter('all')}
                >
                  View All Claims ({claims.length})
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ fontSize: '12px', padding: '5px 12px' }}
                  onClick={handleOpenAddClaim}
                >
                  <Plus size={12} /> Add New Claim
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredClaims.map(claim => {
                const policy = getPolicy(claim.policyId);
                const statusStyle = getStatusBadgeStyle(claim.status);
                const cat = inferCategory(claim);
                const isMajor = cat === 'major';
                const isAccident = cat === 'accident';
                const isHosp = cat === 'hospitalisation';
                const isDi = claim.majorClaimSubtype === 'Disability Income' || claim.benefitType === 'Disability Income';

                // Reconciliation Math for Indemnity Claims
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
                      border: isMajor 
                        ? '1px solid rgba(168, 85, 247, 0.25)' 
                        : isAccident 
                        ? '1px solid rgba(245, 158, 11, 0.25)' 
                        : '1px solid var(--border-light)',
                      position: 'relative',
                      background: isMajor
                        ? 'linear-gradient(180deg, rgba(168, 85, 247, 0.03) 0%, rgba(15, 23, 42, 0.4) 100%)'
                        : isAccident
                        ? 'linear-gradient(180deg, rgba(245, 158, 11, 0.02) 0%, rgba(15, 23, 42, 0.4) 100%)'
                        : undefined
                    }}
                  >
                    {/* Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          
                          {/* Archetype Badge */}
                          {isHosp && (
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              backgroundColor: 'rgba(56, 189, 248, 0.15)',
                              color: '#38bdf8',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Building2 size={11} /> Hospitalisation
                            </span>
                          )}

                          {isAccident && (
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              backgroundColor: 'rgba(245, 158, 11, 0.15)',
                              color: '#fbbf24',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Activity size={11} /> Personal Accident
                            </span>
                          )}

                          {isMajor && (
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              backgroundColor: 'rgba(168, 85, 247, 0.15)',
                              color: '#c084fc',
                              border: '1px solid rgba(168, 85, 247, 0.3)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Award size={11} /> Major Claim {claim.majorClaimSubtype ? `• ${claim.majorClaimSubtype}` : ''}
                            </span>
                          )}

                          {/* Policy Link Tag */}
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

                          {policy && policy.insuredType === 'Dependent' && (
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              backgroundColor: 'rgba(168, 85, 247, 0.15)',
                              color: '#c084fc',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Baby size={11} /> Patient: {policy.insuredName || 'Dependent'} ({policy.insuredRelationship || 'Family'})
                            </span>
                          )}

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

                        {/* Archetype Contextual Subtitle */}
                        {isHosp && (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <Building size={13} />
                            <span>{claim.hospitalOrClinic || 'Hospital'}</span>
                            {claim.wardClass && <span>• Ward {claim.wardClass}</span>}
                            {claim.logStatus && (
                              <span style={{
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontSize: '10.5px',
                                backgroundColor: claim.logStatus === 'Approved' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.06)',
                                color: claim.logStatus === 'Approved' ? 'var(--accent-success)' : 'var(--text-muted)'
                              }}>
                                LOG: {claim.logStatus}
                              </span>
                            )}
                            {claim.doctorName && <span>• Dr. {claim.doctorName}</span>}
                            {claim.incidentDate && <span>• Date: {new Date(claim.incidentDate).toLocaleDateString()}</span>}
                          </div>
                        )}

                        {isAccident && (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <Activity size={13} color="#fbbf24" />
                            {claim.accidentCause && <span>Cause: <strong style={{ color: 'var(--text-primary)' }}>{claim.accidentCause}</strong></span>}
                            {claim.injuryType && <span>• Injury: {claim.injuryType}</span>}
                            {claim.hospitalOrClinic && <span>• Clinic: {claim.hospitalOrClinic}</span>}
                            {claim.incidentDate && <span>• Date: {new Date(claim.incidentDate).toLocaleDateString()}</span>}
                          </div>
                        )}

                        {isMajor && (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <Award size={13} color="#c084fc" />
                            {claim.majorClaimSubtype && <span>{claim.majorClaimSubtype}</span>}
                            {claim.ciStage && <span>• Stage: <strong style={{ color: '#c084fc' }}>{claim.ciStage}</strong></span>}
                            {claim.doctorName && <span>• Specialist: Dr. {claim.doctorName}</span>}
                            {claim.incidentDate && <span>• Diagnosis / Event Date: {new Date(claim.incidentDate).toLocaleDateString()}</span>}
                          </div>
                        )}
                      </div>

                      {/* Top Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {!isMajor && (
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
                        )}

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
                    {isMajor ? (
                      /* Major Claim Financial Schedule (Sum Assured / Monthly Disability Income) */
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(0,0,0,0.25)',
                        border: '1px solid rgba(168, 85, 247, 0.15)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {isDi ? (
                            <>
                              <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Monthly Benefit</div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#c084fc' }}>
                                  {formatCurrency(claim.monthlyBenefitAmount)}/mo
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Deferment Period</div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                  {claim.defermentPeriodDays || 90} Days
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: '11px', color: 'var(--accent-success)' }}>Total Disbursed</div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-success)' }}>
                                  {formatCurrency(paid)}
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sum Assured Claimed</div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#c084fc' }}>
                                  {formatCurrency(claim.sumAssuredClaimed || claim.claimedAmount || claim.sumAssuredTotal || 0)}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: '11px', color: 'var(--accent-success)' }}>Insurer Disbursed</div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-success)' }}>
                                  {formatCurrency(paid)}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: '11px', color: '#fbbf24' }}>Remaining Balance</div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#fbbf24' }}>
                                  {formatCurrency(Math.max(0, (Number(claim.sumAssuredClaimed || claim.claimedAmount || 0)) - paid))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Settlement Status Pill */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: (paid > 0 && (paid >= (Number(claim.sumAssuredClaimed || claim.claimedAmount || 1))))
                              ? 'rgba(16, 185, 129, 0.12)'
                              : paid > 0
                              ? 'rgba(168, 85, 247, 0.15)'
                              : 'rgba(255,255,255,0.04)',
                            color: (paid > 0 && (paid >= (Number(claim.sumAssuredClaimed || claim.claimedAmount || 1))))
                              ? 'var(--accent-success)'
                              : paid > 0
                              ? '#c084fc'
                              : 'var(--text-muted)',
                            border: (paid > 0 && (paid >= (Number(claim.sumAssuredClaimed || claim.claimedAmount || 1))))
                              ? '1px solid rgba(16, 185, 129, 0.3)'
                              : '1px solid rgba(255,255,255,0.06)'
                          }}>
                            {isDi 
                              ? (paid > 0 ? '✅ Active Monthly Benefit' : '⏳ Awaiting Assessment')
                              : (paid > 0 && (paid >= (Number(claim.sumAssuredClaimed || claim.claimedAmount || 1))))
                              ? '✅ 100% Full Sum Assured Disbursed'
                              : paid > 0
                              ? `⚠️ Partial Tranche Disbursed (${formatCurrency(paid)})`
                              : '⏳ Pending Insurer Decision'}
                          </span>

                          <button
                            type="button"
                            className="btn"
                            style={{
                              padding: '5px 12px',
                              fontSize: '11.5px',
                              backgroundColor: 'rgba(168, 85, 247, 0.1)',
                              color: '#c084fc',
                              border: '1px solid rgba(168, 85, 247, 0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            onClick={() => handleOpenEditClaim(claim)}
                          >
                            <Layers size={13} /> View Benefit Schedule
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Reimbursement / Indemnity Breakdown (Hospitalisation & Personal Accident) */
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

                          {isAccident && claim.tcmSublimitCap && (
                            <div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TCM Cap</div>
                              <div style={{ fontSize: '13px', fontWeight: '600', color: '#fbbf24' }}>
                                ${claim.tcmSublimitCap}
                              </div>
                            </div>
                          )}
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
                    )}

                    {/* Sub-Badges Footer: Bills/Tranches & Docs counts */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                        {isMajor ? (
                          isDi ? (
                            <span>🗓️ <strong>{(claim.disabilityMonthlyPayouts || []).length}</strong> monthly payouts logged</span>
                          ) : (
                            <span>💰 <strong>{(claim.payoutTranches || []).length}</strong> payout tranches logged</span>
                          )
                        ) : (
                          <span>🧾 <strong>{billsCount}</strong> {billsCount === 1 ? 'Clinic Bill' : 'Clinic Bills'} logged</span>
                        )}
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

      {/* Step 1: Archetype Picker Modal */}
      {isArchetypeModalOpen && (
        <ClaimArchetypeModal
          isOpen={isArchetypeModalOpen}
          onClose={() => setIsArchetypeModalOpen(false)}
          onSelectArchetype={handleSelectArchetype}
          clientName={client?.name}
        />
      )}

      {/* Step 2: Tailored Claim Detail / Edit Modal */}
      {isModalOpen && (
        <ClaimModal
          client={client}
          policies={policies}
          claim={selectedClaim}
          initialCategory={selectedArchetype}
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

