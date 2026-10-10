import React from 'react';
import { 
  Building2, Activity, Award, Shield, User, Baby, Plus, X, Clock, Calendar, 
  MapPin, CheckCircle2, ChevronRight, Stethoscope, AlertTriangle, FileText
} from 'lucide-react';
import DatePicker from '../DatePicker';
import { 
  ARCHETYPE_CONFIG, CLAIM_STATUSES, CLAIM_TYPES, MAJOR_CLAIM_SUBTYPES, 
  WARD_CLASSES, LOG_STATUSES, ACCIDENT_CAUSES, INJURY_TYPES, TREATMENT_VENUE_OPTIONS 
} from './claimConstants';

export default function ClaimEventStep({ 
  formData, 
  setFormData, 
  policies = [], 
  client, 
  onNext 
}) {
  const currentArchetypeConfig = ARCHETYPE_CONFIG[formData.claimCategory] || ARCHETYPE_CONFIG.hospitalisation;
  const dependents = client?.dependents || [];

  const handleSelectPolicy = (policyId) => {
    const selected = policies.find(p => p.id === policyId);
    let autoSum = formData.sumAssuredClaimed;
    let autoMonthly = formData.monthlyBenefitAmount;
    if (selected && formData.claimCategory === 'major') {
      if (!autoSum) {
        autoSum = selected.ciCoverage || selected.deathCoverage || selected.tpdCoverage || selected.sumAssured || selected.coverageAmount || '';
      }
      if (!autoMonthly && selected.disabilityIncome) {
        autoMonthly = selected.disabilityIncome;
      }
    }

    // Auto-sync insured person if linked policy has dependent details
    const updates = {
      policyId,
      sumAssuredClaimed: autoSum || formData.sumAssuredClaimed,
      claimedAmount: (formData.claimCategory === 'major' && autoSum) ? Number(autoSum) : formData.claimedAmount,
      monthlyBenefitAmount: autoMonthly || formData.monthlyBenefitAmount
    };

    if (selected) {
      if (selected.insuredType === 'Dependent') {
        updates.insuredType = 'Dependent';
        updates.insuredName = selected.insuredName || 'Dependent';
        updates.insuredPersonId = selected.insuredPersonId || '';
      } else {
        updates.insuredType = 'Self';
        updates.insuredName = client?.fullName || client?.name || 'Self';
        updates.insuredPersonId = '';
      }
    }

    // Remove from additionalPolicyIds if present
    if (formData.additionalPolicyIds?.includes(policyId)) {
      updates.additionalPolicyIds = formData.additionalPolicyIds.filter(id => id !== policyId);
    }

    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

  const handleAddAdditionalPolicy = (policyId) => {
    if (!policyId || formData.additionalPolicyIds?.includes(policyId) || policyId === formData.policyId) return;
    setFormData(prev => ({
      ...prev,
      additionalPolicyIds: [...(prev.additionalPolicyIds || []), policyId]
    }));
  };

  const handleRemoveAdditionalPolicy = (policyId) => {
    setFormData(prev => ({
      ...prev,
      additionalPolicyIds: (prev.additionalPolicyIds || []).filter(id => id !== policyId)
    }));
  };

  const handleSelectInsuredPerson = (type, dep = null) => {
    if (type === 'Self') {
      setFormData(prev => ({
        ...prev,
        insuredType: 'Self',
        insuredPersonId: '',
        insuredName: client?.fullName || client?.name || 'Self'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        insuredType: 'Dependent',
        insuredPersonId: dep ? dep.id : '',
        insuredName: dep ? dep.fullName : 'Dependent'
      }));
    }
  };

  const handleToggleTreatmentVenue = (venue) => {
    setFormData(prev => {
      const current = Array.isArray(prev.treatmentVenues) ? prev.treatmentVenues : [];
      const updated = current.includes(venue)
        ? current.filter(v => v !== venue)
        : [...current, venue];
      return { ...prev, treatmentVenues: updated };
    });
  };

  const getStayDuration = (admission, discharge) => {
    if (!admission || !discharge) return null;
    const d1 = new Date(admission);
    const d2 = new Date(discharge);
    const diffTime = d2.getTime() - d1.getTime();
    if (isNaN(diffTime) || diffTime < 0) return null;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} ${diffDays === 1 ? 'Day' : 'Days'} Inpatient Stay`;
  };

  const availableAdditionalPolicies = policies.filter(
    p => p.id !== formData.policyId && !(formData.additionalPolicyIds || []).includes(p.id)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Archetype Guidance Banner */}
      <div style={{
        padding: '14px 18px',
        borderRadius: '10px',
        backgroundColor: currentArchetypeConfig.badgeBg,
        border: `1px solid ${currentArchetypeConfig.border}`,
        fontSize: '13px',
        color: 'var(--text-secondary)',
        lineHeight: '1.5'
      }}>
        <strong style={{ color: 'var(--text-primary)' }}>
          Step 1 — {formData.claimCategory === 'hospitalisation' ? 'Create Hospitalisation Claim:' : formData.claimCategory === 'accident' ? 'Create Personal Accident Claim:' : 'Create Major Claim Event:'}
        </strong>{' '}
        {formData.claimCategory === 'hospitalisation'
          ? 'Define inpatient hospital admission, ward class, hospital facility, and link in-force Integrated Shield Plans and medical riders.'
          : formData.claimCategory === 'accident'
          ? 'Define accidental injury details, accident cause, treatment venues, and track TCM/Physiotherapy sub-limits.'
          : 'Define the Critical Illness diagnosis, Disability Income occupational claim, or TPD/Death benefit with Sum Assured entitlements.'}
      </div>

      {/* Patient / Insured Person Selector */}
      <div style={{
        padding: '16px',
        borderRadius: '12px',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-light)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className="input-label" style={{ fontWeight: '600', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={15} color="var(--accent-primary)" />
            Patient / Insured Person for this Claim
          </label>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Attribution: <strong style={{ color: formData.insuredType === 'Dependent' ? '#c084fc' : 'var(--accent-primary)' }}>{formData.insuredName || 'Primary Client'}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn"
            onClick={() => handleSelectInsuredPerson('Self')}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: formData.insuredType !== 'Dependent' ? '600' : '400',
              borderRadius: '8px',
              backgroundColor: formData.insuredType !== 'Dependent' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.03)',
              color: formData.insuredType !== 'Dependent' ? '#60a5fa' : 'var(--text-secondary)',
              border: formData.insuredType !== 'Dependent' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <User size={13} /> {client?.fullName || client?.name || 'Primary Client'} (Self)
          </button>

          {dependents.map(dep => {
            const isSelected = formData.insuredType === 'Dependent' && (formData.insuredPersonId === dep.id || formData.insuredName === dep.fullName);
            return (
              <button
                key={dep.id}
                type="button"
                className="btn"
                onClick={() => handleSelectInsuredPerson('Dependent', dep)}
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: isSelected ? '600' : '400',
                  borderRadius: '8px',
                  backgroundColor: isSelected ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.03)',
                  color: isSelected ? '#c084fc' : 'var(--text-secondary)',
                  border: isSelected ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Baby size={13} /> {dep.fullName} ({dep.relationship || 'Child'})
              </button>
            );
          })}

          {dependents.length === 0 && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              (No dependents registered on profile. Managed under Primary Client.)
            </span>
          )}
        </div>
      </div>

      {/* Title & Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        <div>
          <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>
            {formData.claimCategory === 'hospitalisation' ? 'Hospitalisation Diagnosis / Condition / Surgery *' : formData.claimCategory === 'accident' ? 'Accident Injury / Trauma Description *' : 'Clinical Diagnosis / Condition *'}
          </label>
          <input
            type="text"
            placeholder={
              formData.claimCategory === 'hospitalisation' 
                ? 'e.g. Left Knee Arthroscopy & Meniscus Tear or Acute Appendicitis' 
                : formData.claimCategory === 'accident' 
                ? 'e.g. Left Ankle Grade 2 Sprain from Football Match' 
                : 'e.g. Stage 3 Colorectal Adenocarcinoma or Acute Coronary Syndrome'
            }
            className="input-field"
            style={{ width: '100%', fontSize: '14px', fontWeight: '500' }}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
        <div>
          <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Claim Status *</label>
          <select
            className="input-field"
            style={{ width: '100%', fontWeight: '600' }}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            {CLAIM_STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
            {formData.status && !CLAIM_STATUSES.includes(formData.status) && (
              <option value={formData.status}>{formData.status}</option>
            )}
          </select>
        </div>
      </div>

      {/* Policy Linkage & Claim Type */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '16px' }}>
        <div>
          <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Primary Linked In-Force Policy *</label>
          <select
            className="input-field"
            style={{ width: '100%' }}
            value={formData.policyId}
            onChange={(e) => handleSelectPolicy(e.target.value)}
          >
            <option value="">-- Select Primary Policy --</option>
            {policies.map(p => (
              <option key={p.id} value={p.id}>
                {p.provider} • {p.policyName || p.policyType} ({p.policyNumber || 'No Policy#'}) {p.insuredType === 'Dependent' ? `[👶 ${p.insuredName || 'Dependent'}]` : '[👤 Self]'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>
            {formData.claimCategory === 'major' ? 'Major Claim Subtype *' : 'Claims Event Type *'}
          </label>
          {formData.claimCategory === 'major' ? (
            <select
              className="input-field"
              style={{ width: '100%', fontWeight: '600', color: '#c084fc' }}
              value={formData.majorClaimSubtype}
              onChange={(e) => setFormData({ ...formData, majorClaimSubtype: e.target.value, claimType: e.target.value })}
            >
              {MAJOR_CLAIM_SUBTYPES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          ) : (
            <select
              className="input-field"
              style={{ width: '100%' }}
              value={formData.claimType}
              onChange={(e) => setFormData({ ...formData, claimType: e.target.value })}
            >
              {CLAIM_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Insurer Claim Reference No</label>
          <input
            type="text"
            placeholder="e.g. AIA-CLM-2026-8942"
            className="input-field"
            style={{ width: '100%' }}
            value={formData.claimNumber}
            onChange={(e) => setFormData({ ...formData, claimNumber: e.target.value })}
          />
        </div>
      </div>

      {/* Multi-Policy Linking Workspace */}
      <div style={{
        padding: '14px 16px',
        borderRadius: '10px',
        backgroundColor: 'rgba(255,255,255,0.015)',
        border: '1px solid var(--border-light)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={14} color="var(--accent-primary)" />
            Additional In-Force Policies Linked to Event (Dual/Rider Coverage)
          </div>
          {availableAdditionalPolicies.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                id="add-secondary-policy-select"
                className="input-field"
                style={{ fontSize: '11.5px', padding: '4px 8px' }}
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddAdditionalPolicy(e.target.value);
                    e.target.value = '';
                  }
                }}
              >
                <option value="">+ Link Another Policy...</option>
                {availableAdditionalPolicies.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.provider} • {p.policyName || p.policyType} ({p.policyNumber || 'No#'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Linked Additional Policies Badges */}
        {(formData.additionalPolicyIds || []).length === 0 ? (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Single policy claim. If this event also claims from a secondary rider, company GHS, or standalone accident/CI policy, link it above.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(formData.additionalPolicyIds || []).map(polId => {
              const p = policies.find(item => item.id === polId);
              return (
                <div
                  key={polId}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    backgroundColor: 'rgba(139, 92, 246, 0.15)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Shield size={12} color="var(--accent-primary)" />
                  <span>{p ? `${p.provider} • ${p.policyName || p.policyType} (${p.policyNumber || 'No#'})` : polId}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAdditionalPolicy(polId)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex' }}
                    title="Remove linked policy"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ARCHETYPE CONDITIONAL SECTION */}
      {/* 1. HOSPITALISATION & INPATIENT */}
      {formData.claimCategory === 'hospitalisation' && (
        <div style={{
          padding: '18px',
          borderRadius: '12px',
          backgroundColor: 'rgba(56, 189, 248, 0.04)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={15} /> Hospital Inpatient & Admission Details
            </span>
            {getStayDuration(formData.admissionDate, formData.dischargeDate) && (
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: '600' }}>
                ⏱️ {getStayDuration(formData.admissionDate, formData.dischargeDate)}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Hospital / Medical Center</label>
              <input
                type="text"
                placeholder="e.g. Mount Elizabeth Novena, SGH, Raffles Hospital"
                className="input-field"
                style={{ width: '100%' }}
                value={formData.hospitalOrClinic}
                onChange={(e) => setFormData({ ...formData, hospitalOrClinic: e.target.value })}
              />
            </div>
            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Ward Class</label>
              <select
                className="input-field"
                style={{ width: '100%' }}
                value={formData.wardClass}
                onChange={(e) => setFormData({ ...formData, wardClass: e.target.value })}
              >
                {WARD_CLASSES.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Attending Specialist / Surgeon</label>
              <input
                type="text"
                placeholder="e.g. Dr. Raymond Lim (Orthopaedics)"
                className="input-field"
                style={{ width: '100%' }}
                value={formData.doctorName}
                onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Admission Date</label>
              <DatePicker
                style={{ width: '100%' }}
                value={formData.admissionDate}
                onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
              />
            </div>
            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Discharge Date</label>
              <DatePicker
                style={{ width: '100%' }}
                value={formData.dischargeDate}
                onChange={(e) => setFormData({ ...formData, dischargeDate: e.target.value })}
              />
            </div>
            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Letter of Guarantee (LOG)</label>
              <select
                className="input-field"
                style={{ width: '100%' }}
                value={formData.logStatus}
                onChange={(e) => setFormData({ ...formData, logStatus: e.target.value })}
              >
                {LOG_STATUSES.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Panel Doctor Status</label>
              <select
                className="input-field"
                style={{ width: '100%' }}
                value={formData.isPanelDoctor ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, isPanelDoctor: e.target.value === 'true' })}
              >
                <option value="true">Panel Doctor / Preferred Provider</option>
                <option value="false">Non-Panel Specialist</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 2. PERSONAL ACCIDENT */}
      {formData.claimCategory === 'accident' && (
        <div style={{
          padding: '18px',
          borderRadius: '12px',
          backgroundColor: 'rgba(245, 158, 11, 0.04)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={15} /> Personal Accident & Outpatient Details
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Accident Date</label>
              <DatePicker
                style={{ width: '100%' }}
                value={formData.incidentDate}
                onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
              />
            </div>
            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Accident Cause</label>
              <select
                className="input-field"
                style={{ width: '100%' }}
                value={formData.accidentCause}
                onChange={(e) => setFormData({ ...formData, accidentCause: e.target.value })}
              >
                {ACCIDENT_CAUSES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Injury Classification</label>
              <select
                className="input-field"
                style={{ width: '100%' }}
                value={formData.injuryType}
                onChange={(e) => setFormData({ ...formData, injuryType: e.target.value })}
              >
                {INJURY_TYPES.map(i => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>TCM / Physio Cap ($)</label>
              <input
                type="number"
                placeholder="e.g. 500 or 1000"
                className="input-field"
                style={{ width: '100%' }}
                value={formData.tcmSublimitCap}
                onChange={(e) => setFormData({ ...formData, tcmSublimitCap: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Treatment Venues Visited</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {TREATMENT_VENUE_OPTIONS.map(venue => {
                const isSelected = (formData.treatmentVenues || []).includes(venue);
                return (
                  <button
                    key={venue}
                    type="button"
                    onClick={() => handleToggleTreatmentVenue(venue)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      border: isSelected ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid var(--border-light)',
                      backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.02)',
                      color: isSelected ? '#fbbf24' : 'var(--text-secondary)'
                    }}
                  >
                    {isSelected ? '✓ ' : '+ '}{venue}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. MAJOR CLAIMS (CI, DI, TPD, DEATH) */}
      {formData.claimCategory === 'major' && (
        <div style={{
          padding: '18px',
          borderRadius: '12px',
          backgroundColor: 'rgba(168, 85, 247, 0.04)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={15} /> Major Claim & Sum Assured Entitlement Details
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Diagnosis / Event Date</label>
              <DatePicker
                style={{ width: '100%' }}
                value={formData.incidentDate}
                onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
              />
            </div>
            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Critical Illness Stage</label>
              <select
                className="input-field"
                style={{ width: '100%' }}
                value={formData.ciStage}
                onChange={(e) => setFormData({ ...formData, ciStage: e.target.value })}
              >
                <option value="Early Stage CI">Early Stage CI (e.g. Carcinoma-in-situ)</option>
                <option value="Intermediate Stage CI">Intermediate Stage CI</option>
                <option value="Major / Advanced Stage CI">Major / Advanced Stage CI</option>
                <option value="Total Permanent Disability">Total Permanent Disability</option>
                <option value="Disability Income Monthly">Disability Income Monthly</option>
                <option value="Death / Terminal Illness">Death / Terminal Illness</option>
              </select>
            </div>
            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Attending Specialist Doctor</label>
              <input
                type="text"
                placeholder="e.g. Dr. Winston Ho (Oncology)"
                className="input-field"
                style={{ width: '100%' }}
                value={formData.doctorName}
                onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
              />
            </div>
          </div>

          {formData.majorClaimSubtype === 'Disability Income' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Monthly Benefit Rate ($/mo)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  className="input-field"
                  style={{ width: '100%', fontWeight: '700', color: '#c084fc' }}
                  value={formData.monthlyBenefitAmount}
                  onChange={(e) => setFormData({ ...formData, monthlyBenefitAmount: e.target.value })}
                />
              </div>
              <div>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Elimination / Deferment Period</label>
                <select
                  className="input-field"
                  style={{ width: '100%' }}
                  value={formData.defermentPeriodDays}
                  onChange={(e) => setFormData({ ...formData, defermentPeriodDays: e.target.value })}
                >
                  <option value="30 Days">30 Days</option>
                  <option value="60 Days">60 Days</option>
                  <option value="90 Days">90 Days</option>
                  <option value="180 Days">180 Days</option>
                </select>
              </div>
              <div>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Benefit Start Date</label>
                <DatePicker
                  style={{ width: '100%' }}
                  value={formData.benefitStartDate}
                  onChange={(e) => setFormData({ ...formData, benefitStartDate: e.target.value })}
                />
              </div>
              <div>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Benefit Duration (Months)</label>
                <input
                  type="number"
                  placeholder="e.g. 12 or 24"
                  className="input-field"
                  style={{ width: '100%' }}
                  value={formData.benefitDurationMonths}
                  onChange={(e) => setFormData({ ...formData, benefitDurationMonths: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Sum Assured Claimed ($) *</label>
                <input
                  type="number"
                  placeholder="e.g. 250000"
                  className="input-field"
                  style={{ width: '100%', fontWeight: '700', color: '#c084fc' }}
                  value={formData.sumAssuredClaimed}
                  onChange={(e) => setFormData({ ...formData, sumAssuredClaimed: e.target.value, claimedAmount: Number(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Total In-Force Sum Assured ($)</label>
                <input
                  type="number"
                  placeholder="e.g. 500000"
                  className="input-field"
                  style={{ width: '100%' }}
                  value={formData.sumAssuredTotal}
                  onChange={(e) => setFormData({ ...formData, sumAssuredTotal: e.target.value })}
                />
              </div>
              <div>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Nomination / Beneficiary</label>
                <input
                  type="text"
                  placeholder="e.g. Trust Sec 49L / Revocable Sec 49M"
                  className="input-field"
                  style={{ width: '100%' }}
                  value={formData.nominationType}
                  onChange={(e) => setFormData({ ...formData, nominationType: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Proceed Navigation Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
        <button
          type="button"
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 18px' }}
          onClick={onNext}
        >
          {formData.claimCategory === 'major' ? 'Proceed to Benefit Schedule' : 'Proceed to Tagged Bills'} <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
