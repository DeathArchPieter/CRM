import React from 'react';
import { X, Building2, Activity, Award, ArrowRight, ShieldCheck, FileCheck, Stethoscope } from 'lucide-react';

export default function ClaimArchetypeModal({ isOpen, onClose, onSelectArchetype, clientName }) {
  if (!isOpen) return null;

  const ARCHETYPES = [
    {
      id: 'hospitalisation',
      title: 'Hospitalisation & Inpatient',
      badge: 'Reimbursement / Indemnity',
      icon: <Building2 size={26} color="#38bdf8" />,
      colorTheme: {
        accent: '#38bdf8',
        bgGlow: 'rgba(56, 189, 248, 0.08)',
        border: 'rgba(56, 189, 248, 0.25)',
        hoverBorder: 'rgba(56, 189, 248, 0.6)',
        badgeBg: 'rgba(56, 189, 248, 0.15)',
        btnBg: 'rgba(56, 189, 248, 0.2)',
        btnHoverBg: 'rgba(56, 189, 248, 0.35)'
      },
      description: 'Inpatient hospital stays, day surgery, and procedures covered under Integrated Shield Plans and private medical riders.',
      features: [
        'Ward Class & Panel Specialist tracking',
        'Letter of Guarantee (LOG / e-LOG) status',
        'Pre & Post-Hospitalisation bills ledger (90–365 days)',
        'Insurer payout, MediSave & cash co-pay audit'
      ],
      actionLabel: 'Select Hospitalisation'
    },
    {
      id: 'accident',
      title: 'Personal Accident',
      badge: 'Outpatient & Injury Reimbursement',
      icon: <Activity size={26} color="#fbbf24" />,
      colorTheme: {
        accent: '#fbbf24',
        bgGlow: 'rgba(245, 158, 11, 0.08)',
        border: 'rgba(245, 158, 11, 0.25)',
        hoverBorder: 'rgba(245, 158, 11, 0.6)',
        badgeBg: 'rgba(245, 158, 11, 0.15)',
        btnBg: 'rgba(245, 158, 11, 0.2)',
        btnHoverBg: 'rgba(245, 158, 11, 0.35)'
      },
      description: 'Accidental injuries, emergency A&E visits, outpatient treatments, bone fractures, and alternative medicine with sub-limits.',
      features: [
        'Accident cause, incident time & injury nature',
        'Outpatient clinic, GP & emergency A&E invoices',
        'TCM & Physiotherapy sub-limit caps monitoring',
        'Fracture allowances & incident reports'
      ],
      actionLabel: 'Select Personal Accident'
    },
    {
      id: 'major',
      title: 'Major Claims',
      badge: 'Fixed Sum Assured / Monthly Income',
      icon: <Award size={26} color="#c084fc" />,
      colorTheme: {
        accent: '#c084fc',
        bgGlow: 'rgba(168, 85, 247, 0.08)',
        border: 'rgba(168, 85, 247, 0.25)',
        hoverBorder: 'rgba(168, 85, 247, 0.6)',
        badgeBg: 'rgba(168, 85, 247, 0.15)',
        btnBg: 'rgba(168, 85, 247, 0.2)',
        btnHoverBg: 'rgba(168, 85, 247, 0.35)'
      },
      description: 'Catastrophic and income-replacement claims paying predetermined policy sums or monthly benefits rather than itemized clinic bills.',
      features: [
        'Critical Illness (Early, Intermediate & Major CI)',
        'Disability Income monthly schedule & deferment',
        'Total & Permanent Disability (ADL Impairment)',
        'Death / Terminal Illness & nomination payout'
      ],
      actionLabel: 'Select Major Claims'
    }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(8px)',
      zIndex: 160,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div 
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '1020px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '18px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '22px 28px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0) 100%)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                color: 'var(--accent-primary)',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Step 1 of 2
              </span>
              <h2 style={{ fontSize: '19px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                Select Claims Event Archetype
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              {clientName ? `Initiating new claim submission for ${clientName}. ` : ''}
              Choose the archetype to configure the corresponding claims ledger, checklists, and reconciliation math.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease'
            }}
            title="Cancel"
          >
            <X size={20} />
          </button>
        </div>

        {/* 3 Archetype Cards Grid */}
        <div style={{
          padding: '28px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '20px',
          overflowY: 'auto'
        }}>
          {ARCHETYPES.map((arch) => (
            <div
              key={arch.id}
              onClick={() => onSelectArchetype(arch.id)}
              style={{
                borderRadius: '14px',
                backgroundColor: arch.colorTheme.bgGlow,
                border: `1px solid ${arch.colorTheme.border}`,
                padding: '24px 22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '18px',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = arch.colorTheme.hoverBorder;
                e.currentTarget.style.boxShadow = `0 12px 30px -8px ${arch.colorTheme.accent}33`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = arch.colorTheme.border;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Top Badge & Icon */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(0, 0, 0, 0.35)',
                    border: `1px solid ${arch.colorTheme.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {arch.icon}
                  </div>
                  <span style={{
                    padding: '4px 9px',
                    borderRadius: '20px',
                    fontSize: '10.5px',
                    fontWeight: '600',
                    backgroundColor: arch.colorTheme.badgeBg,
                    color: arch.colorTheme.accent,
                    letterSpacing: '0.2px'
                  }}>
                    {arch.badge}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    {arch.title}
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                    {arch.description}
                  </p>
                </div>

                {/* Key Features List */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  paddingTop: '6px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  {arch.features.map((feat, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span style={{ color: arch.colorTheme.accent, fontWeight: '700', lineHeight: '1' }}>•</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                className="btn"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  backgroundColor: arch.colorTheme.btnBg,
                  color: 'var(--text-primary)',
                  border: `1px solid ${arch.colorTheme.border}`,
                  fontWeight: '600',
                  fontSize: '13px',
                  transition: 'background-color 0.2s ease',
                  marginTop: '6px'
                }}
              >
                <span>{arch.actionLabel}</span>
                <ArrowRight size={14} color={arch.colorTheme.accent} />
              </button>
            </div>
          ))}
        </div>

        {/* Footer info notice */}
        <div style={{
          padding: '16px 28px',
          borderTop: '1px solid var(--border-light)',
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          <span>
            💡 <em>Tip: You can attach multiple in-force policies or adjust claim categories inside the workspace at any time.</em>
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '12px', padding: '6px 14px' }}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
