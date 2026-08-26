import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Lightbulb, 
  CheckCircle2, 
  ArrowRight, 
  HelpCircle, 
  Compass, 
  Zap,
  BookOpen
} from 'lucide-react';

// Section-specific intelligence and guides
const SECTION_GUIDES = {
  dashboard: {
    title: 'Executive Dashboard',
    tagline: 'Your Daily Advisory Command Center',
    badge: 'Morning Briefing',
    greeting: "Good day, Pieter! Here is your high-level overview. Review your morning AI briefing and track your monthly MDRT pacing.",
    steps: [
      'Read the AI Morning Briefing for key client events and market signals.',
      'Check pending tasks and sync them with your Google Calendar.',
      'Review your Monthly MDRT commission pacing and active deal pipeline.'
    ],
    proTip: 'Use Ctrl + K to instantly search clients or jump to any section in 1 second!'
  },
  schedule: {
    title: 'Schedule & Calendar Hub',
    tagline: 'Two-Way Google Calendar Sync',
    badge: 'Time-Blocking',
    greeting: "Keep your advisory schedule synchronized! Every CRM task with a due date connects directly to your Google Calendar.",
    steps: [
      'Connect Google Calendar in Settings or click "Sync with Google".',
      'Add client appointments with time blocks to automatically create Google Calendar events.',
      'Mark tasks complete to update status across both CRM and Google Calendar.'
    ],
    proTip: 'Color-coded grape/purple events in Google Calendar represent Beetsma CRM tasks!'
  },
  clients: {
    title: 'Client 360 & Blueprints',
    tagline: 'Institutional Financial Dossiers',
    badge: 'CFP® / ChFC® Standard',
    greeting: "Welcome to your core client registry. Generate institutional 6-page PDF blueprints and discover client life milestones.",
    steps: [
      'Click "+ Add Client" or search with Ctrl + K.',
      'Open a client profile to view their Balance Sheet, Cash Flow, and Policy Vault.',
      'Click "Run Social Discovery" to analyze lifestyle milestones or "Export 6-Page PDF Dossier".'
    ],
    proTip: 'The 6-Page PDF Dossier complies with Singapore MAS statutory CPF LIFE & LIA actuarial benchmarks.'
  },
  pipeline: {
    title: 'Pipeline & Deal Flow',
    tagline: 'ANP & FYC Sales Funnel',
    badge: 'Weighted Revenue',
    greeting: "Track active opportunities from initial meeting to policy issuance. Watch your weighted revenue update in real-time.",
    steps: [
      'Drag and drop or edit deal stages (Discovery, Proposal, Underwriting, Issued).',
      'Enter Estimated ANP and FYC to track pipeline health.',
      'Advancing a deal to "Issued" automatically counts toward your MDRT pacing!'
    ],
    proTip: 'ANP (Annualized New Premium) reflects insurance volume, while FYC reflects your initial commission revenue.'
  },
  sales: {
    title: 'Sales & Production Tracking',
    tagline: 'MDRT, COT & TOT Milestones',
    badge: 'Agency Benchmarks',
    greeting: "Monitor your annual production velocity, track your 13-month persistency ratio, and stay on track for MDRT honors.",
    steps: [
      'Review your current FYC vs the MDRT qualification milestone ($115,000 FYC).',
      'Monitor your 13-month Persistency Ratio to protect renewal bonuses.',
      'Examine policy distribution charts across Whole Life, ILP, CI, and Annuities.'
    ],
    proTip: 'Maintaining a 13-month persistency above 90% qualifies advisors for tier-1 persistency bonuses.'
  },
  remuneration: {
    title: 'Remuneration & Commission',
    tagline: 'Tiered Commission Matrix',
    badge: 'Earnings Engine',
    greeting: "Transparent commission breakdowns for every product category. Track your basic FYC, over-riding bonuses, and monthly net payouts.",
    steps: [
      'View tiered commission schedules for Life, CI, Savings, and General insurance.',
      'Calculate estimated monthly payout after persistency adjustments.',
      'Export detailed commission schedules for accounting review.'
    ],
    proTip: 'Commission rates automatically scale upward as your annualized production crosses agency tier thresholds.'
  },
  special_projects: {
    title: 'Special Projects & Campaign Hub',
    tagline: 'Project 100 & AI Playbook Copilot',
    badge: 'N.A.S.T. & Vision AI',
    greeting: "Supercharge your prospecting! Rank contacts with the N.A.S.T matrix, scan product brochures with Gemini Vision, and port warm leads directly to clients.",
    steps: [
      'Use Project 100 to score contacts on Need, Accessibility, Savings, and Trust.',
      'In Outreach Campaigns, upload brochure PDFs/images to auto-extract USPs & objection scripts.',
      'Click "👤 Port" or "💼 Deal" to convert targets into Core Clients and active Pipeline deals!'
    ],
    proTip: 'The AI WhatsApp Icebreaker generates 3 tailored conversational openers based on each contact\'s highest N.A.S.T. strength.'
  },
  special_reports: {
    title: 'Special Reports & Dossiers',
    tagline: 'Institutional Actuarial Dossiers',
    badge: 'CPF LIFE Simulations',
    greeting: "Access executive-level actuarial simulations, including Singapore CPF LIFE Escalating vs Standard plan projections and tax optimization.",
    steps: [
      'Select a client and simulation model (CPF LIFE, Retirement Runway, Estate Distribution).',
      'Adjust assumed inflation and pre/post-retirement investment yields.',
      'Export high-resolution institutional charts for advisory presentations.'
    ],
    proTip: 'The CPF LIFE Escalating plan increases payouts by 2% annually to protect clients from long-term inflation.'
  },
  product_analyser: {
    title: 'Product & Policy Analyser',
    tagline: 'Side-by-Side Policy Comparison',
    badge: 'Feature Matrix',
    greeting: "Compare policy features, surrender value trajectories, and critical illness multi-pay definitions across major Singapore insurers.",
    steps: [
      'Select two or more policies to compare coverage terms and exclusions side-by-side.',
      'Analyze guaranteed vs non-guaranteed illustrated investment yields (3.0% / 4.25%).',
      'Highlight key product USPs during client consultations.'
    ],
    proTip: 'Look for early-stage critical illness coverage and premium waiver riders when comparing health policies.'
  },
  settings: {
    title: 'Practice & Advisory Settings',
    tagline: 'Consultant Branding & System Controls',
    badge: 'MAS Rep & Auto-Updates',
    greeting: "Configure your MAS Representative details, firm branding, actuarial defaults, Gemini AI key, and in-app auto-updates.",
    steps: [
      'Customize your Consultant Name, Title, MAS Rep Number, and professional credentials (CFP®, ChFC®).',
      'Set default actuarial inflation (3.0%) and retirement age (62) for PDF blueprints.',
      'Click "Check for Updates" under System & Logs to verify you have the latest software build!'
    ],
    proTip: 'Your consultant particulars automatically brand all generated PDF reports and client exports.'
  }
};

const PRO_TIPS = [
  '⚡ Press Ctrl + K anywhere to open the Global Command Palette.',
  '📊 Project 100: Score contacts on N.A.S.T. (Need, Accessibility, Savings, Trust) to prioritize high-converting leads.',
  '🤖 Drag and drop product brochure PDFs into Campaign Hub to auto-generate customized WhatsApp scripts.',
  '🎯 Moving a campaign target to "Appt Booked" prompts 1-click address sync & deal creation in your Pipeline.',
  '💼 When a deal is "Case Closed", the CRM automatically records Case Issued and updates your MDRT pacing.',
  '🛡️ All client data is encrypted locally on your machine for maximum confidentiality.'
];

export default function AssistantGuide({ activeTab = 'dashboard', onNavigateTab }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [checkedSteps, setCheckedSteps] = useState({});

  const guide = SECTION_GUIDES[activeTab] || SECTION_GUIDES.dashboard;

  // Rotate tips periodically
  const nextTip = () => {
    setTipIndex((prev) => (prev + 1) % PRO_TIPS.length);
  };

  const toggleStep = (stepIdx) => {
    const key = `${activeTab}_${stepIdx}`;
    setCheckedSteps(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (isDismissed) {
    return (
      <button
        onClick={() => setIsDismissed(false)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9990,
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          borderRadius: '50px',
          padding: '8px 14px',
          color: '#c084fc',
          fontSize: '12px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 0 12px rgba(139, 92, 246, 0.2)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s ease'
        }}
        title="Open Guide Assistant"
      >
        <span style={{ fontSize: '16px' }}>🦉</span>
        <span>Guide</span>
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9990,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px'
      }}
    >
      {/* Expanded Speech Bubble / Drawer */}
      {isExpanded && (
        <div
          className="glass-panel"
          style={{
            width: '360px',
            maxHeight: '520px',
            overflowY: 'auto',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 20px 45px rgba(0,0,0,0.6), 0 0 0 1px rgba(139, 92, 246, 0.3)',
            animation: 'fadeIn 0.25s ease forwards',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            backdropFilter: 'blur(20px)',
            backgroundColor: 'rgba(15, 23, 42, 0.95)'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
              }}>
                🦉
              </div>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Archie Copilot
                  <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '8px', backgroundColor: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.4)' }}>
                    {guide.badge}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {guide.tagline}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setIsExpanded(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                title="Collapse"
              >
                <ChevronDown size={16} />
              </button>
              <button
                onClick={() => setIsDismissed(true)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                title="Dismiss Guide"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Section Greeting */}
          <div style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            lineHeight: '1.5',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            padding: '10px 12px',
            borderRadius: '10px',
            border: '1px solid var(--border-light)'
          }}>
            {guide.greeting}
          </div>

          {/* 3-Step Action Checklist */}
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#cbd5e1', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Compass size={13} color="var(--accent-primary)" />
              Key Actions in This Section:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {guide.steps.map((step, idx) => {
                const isDone = checkedSteps[`${activeTab}_${idx}`];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleStep(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      backgroundColor: isDone ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: isDone ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-light)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      border: isDone ? '1px solid #10b981' : '1px solid var(--border-light)',
                      backgroundColor: isDone ? '#10b981' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '10px',
                      marginTop: '2px',
                      flexShrink: 0
                    }}>
                      {isDone && '✓'}
                    </div>
                    <span style={{
                      fontSize: '11px',
                      color: isDone ? '#94a3b8' : 'var(--text-secondary)',
                      textDecoration: isDone ? 'line-through' : 'none',
                      lineHeight: '1.4'
                    }}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section Pro Tip */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            padding: '10px 12px',
            borderRadius: '10px'
          }}>
            <Lightbulb size={16} color="#c084fc" style={{ flexShrink: 0, marginTop: '1px' }} />
            <div style={{ fontSize: '11px', color: '#e2e8f0', lineHeight: '1.4' }}>
              <strong>Pro Tip:</strong> {guide.proTip}
            </div>
          </div>

          {/* Global Advisor Wisdom Bar */}
          <div style={{
            borderTop: '1px solid var(--border-light)',
            paddingTop: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Zap size={12} color="#f59e0b" />
              <span>{PRO_TIPS[tipIndex]}</span>
            </div>
            <button
              onClick={nextTip}
              style={{
                background: 'none',
                border: 'none',
                color: '#a78bfa',
                fontSize: '10.5px',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '2px 4px'
              }}
            >
              Next →
            </button>
          </div>

        </div>
      )}

      {/* Floating Avatar Trigger Button */}
      <button
        onClick={() => setIsExpanded(prev => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          border: isExpanded ? '1px solid #8b5cf6' : '1px solid rgba(139, 92, 246, 0.35)',
          borderRadius: '50px',
          padding: '6px 16px 6px 8px',
          color: '#f1f5f9',
          boxShadow: '0 8px 25px rgba(0,0,0,0.5), 0 0 15px rgba(139, 92, 246, 0.25)',
          cursor: 'pointer',
          backdropFilter: 'blur(12px)',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: isExpanded ? 'scale(1.02)' : 'scale(1)'
        }}
      >
        {/* Animated Avatar Icon */}
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '17px',
          boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)',
          position: 'relative'
        }}>
          🦉
          <span style={{
            position: 'absolute',
            bottom: '0px',
            right: '0px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            border: '1.5px solid #0f172a'
          }} />
        </div>

        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Archie Guide
            <Sparkles size={11} color="#c084fc" />
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>
            {guide.title}
          </div>
        </div>

        {isExpanded ? <ChevronDown size={14} color="#94a3b8" /> : <ChevronUp size={14} color="#94a3b8" />}
      </button>
    </div>
  );
}
