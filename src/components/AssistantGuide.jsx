import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Lightbulb, 
  CheckCircle2, 
  ArrowRight, 
  Compass, 
  Zap,
  BookOpen,
  Search,
  Copy,
  Check,
  Shield,
  DollarSign,
  Award,
  Layers,
  HelpCircle
} from 'lucide-react';
import { useAdvisorContext } from '../context/AdvisorContext';
import { 
  resolveContextGuide, 
  SINGAPORE_ACTUARIAL_BENCHMARKS, 
  CAMPAIGN_PRODUCT_BENCHMARKS,
  ADVISOR_SCRIPTS_AND_OBJECTIONS 
} from '../data/advisorKnowledgeBase';

export default function AssistantGuide({ onNavigateTab }) {
  const advisorContext = useAdvisorContext();
  const { 
    section, 
    subSection, 
    activeSubTab, 
    entityContext, 
    isArchieOpen, 
    toggleArchie, 
    triggerAction 
  } = advisorContext;

  const [activeDrawerTab, setActiveDrawerTab] = useState('guide'); // 'guide' | 'cheatsheet' | 'scripts'
  const [cheatSheetCategory, setCheatSheetCategory] = useState('cpf'); // 'campaign' | 'cpf' | 'mas' | 'mdrt'
  const [scriptSearchQuery, setScriptSearchQuery] = useState('');
  const [copiedScriptIdx, setCopiedScriptIdx] = useState(null);
  const [checkedSteps, setCheckedSteps] = useState({});
  const [isDismissed, setIsDismissed] = useState(false);

  // Resolve current active guide based on deep context state
  const currentGuide = useMemo(() => {
    return resolveContextGuide({ section, subSection, activeSubTab, entityContext });
  }, [section, subSection, activeSubTab, entityContext]);

  // Resolve matching campaign benchmarks if in an outreach campaign or special project
  const campaignIntel = useMemo(() => {
    if (currentGuide?.campaignKey && CAMPAIGN_PRODUCT_BENCHMARKS[currentGuide.campaignKey]) {
      return CAMPAIGN_PRODUCT_BENCHMARKS[currentGuide.campaignKey];
    }
    return null;
  }, [currentGuide?.campaignKey]);

  // Auto-switch cheat sheet category based on active workspace section
  useEffect(() => {
    if (campaignIntel) {
      setCheatSheetCategory('campaign');
    } else if (section === 'sales' || section === 'remuneration' || section === 'pipeline') {
      setCheatSheetCategory('mdrt');
    } else if (subSection === 'financial-plan' && activeSubTab === 'protection') {
      setCheatSheetCategory('mas');
    } else if (subSection === 'financial-plan' && (activeSubTab === 'retirement' || activeSubTab === 'balance-sheet')) {
      setCheatSheetCategory('cpf');
    }
  }, [campaignIntel, section, subSection, activeSubTab]);

  // Handle step checkbox toggle
  const toggleStep = (stepIdx) => {
    const key = `${section}_${subSection || 'main'}_${activeSubTab || 'root'}_${stepIdx}`;
    setCheckedSteps(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Handle 1-click script copy
  const handleCopyScript = (scriptText, idx) => {
    navigator.clipboard.writeText(scriptText);
    setCopiedScriptIdx(idx);
    setTimeout(() => setCopiedScriptIdx(null), 2000);
  };

  // Filter & prioritize scripts based on search query and active section context
  const filteredScripts = useMemo(() => {
    let list = [...ADVISOR_SCRIPTS_AND_OBJECTIONS];

    if (scriptSearchQuery.trim()) {
      const q = scriptSearchQuery.toLowerCase();
      return list.filter(item => 
        item.question.toLowerCase().includes(q) ||
        item.script.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.keywords && item.keywords.some(k => k.toLowerCase().includes(q)))
      );
    }

    // If viewing a campaign (e.g. Pet, SRS, CI, Child, etc.), prioritize matching scripts to top
    if (currentGuide?.campaignKey) {
      const k = currentGuide.campaignKey.toLowerCase();
      list.sort((a, b) => {
        const aMatch = (a.keywords || []).some(kw => kw.includes(k)) || a.category.toLowerCase().includes(k);
        const bMatch = (b.keywords || []).some(kw => kw.includes(k)) || b.category.toLowerCase().includes(k);
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return 0;
      });
    }

    return list;
  }, [scriptSearchQuery, currentGuide?.campaignKey]);

  // Handle Quick Action button clicks
  const handleQuickAction = (actionItem) => {
    if (actionItem.tab && typeof onNavigateTab === 'function') {
      onNavigateTab(actionItem.tab);
    } else if (actionItem.action) {
      triggerAction(actionItem.action);
    }
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
        title="Open Archie Copilot (Ctrl + /)"
      >
        <span style={{ fontSize: '16px' }}>🦉</span>
        <span>Archie</span>
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
      {/* Expanded Archie 2.0 Assistant Drawer */}
      {isArchieOpen && (
        <div
          className="glass-panel"
          style={{
            width: '410px',
            maxHeight: '580px',
            height: '580px',
            borderRadius: '18px',
            padding: '18px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(139, 92, 246, 0.35)',
            animation: 'fadeIn 0.25s ease forwards',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backdropFilter: 'blur(24px)',
            backgroundColor: 'rgba(15, 23, 42, 0.96)',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
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
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)'
              }}>
                🦉
              </div>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Archie Copilot
                  <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '8px', backgroundColor: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.4)' }}>
                    {currentGuide.badge}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {currentGuide.tagline}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => toggleArchie(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}
                title="Minimize (Ctrl + /)"
              >
                <ChevronDown size={16} />
              </button>
              <button
                onClick={() => setIsDismissed(true)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}
                title="Dismiss"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* 3-Tab Selector Bar */}
          <div style={{
            display: 'flex',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '10px',
            padding: '3px',
            gap: '3px',
            border: '1px solid var(--border-light)'
          }}>
            <button
              onClick={() => setActiveDrawerTab('guide')}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: activeDrawerTab === 'guide' ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
                color: activeDrawerTab === 'guide' ? '#f1f5f9' : 'var(--text-muted)',
                fontSize: '11px',
                fontWeight: activeDrawerTab === 'guide' ? '700' : '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <Compass size={13} color={activeDrawerTab === 'guide' ? '#c084fc' : 'currentColor'} />
              Guidance
            </button>

            <button
              onClick={() => setActiveDrawerTab('cheatsheet')}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: activeDrawerTab === 'cheatsheet' ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
                color: activeDrawerTab === 'cheatsheet' ? '#f1f5f9' : 'var(--text-muted)',
                fontSize: '11px',
                fontWeight: activeDrawerTab === 'cheatsheet' ? '700' : '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <BookOpen size={13} color={activeDrawerTab === 'cheatsheet' ? '#c084fc' : 'currentColor'} />
              Cheat Sheet
            </button>

            <button
              onClick={() => setActiveDrawerTab('scripts')}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: activeDrawerTab === 'scripts' ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
                color: activeDrawerTab === 'scripts' ? '#f1f5f9' : 'var(--text-muted)',
                fontSize: '11px',
                fontWeight: activeDrawerTab === 'scripts' ? '700' : '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <Zap size={13} color={activeDrawerTab === 'scripts' ? '#f59e0b' : 'currentColor'} />
              Ask & Scripts
            </button>
          </div>

          {/* Drawer Body Area */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '2px' }}>
            
            {/* TAB 1: GUIDANCE & ACTIONS */}
            {activeDrawerTab === 'guide' && (
              <>
                {/* Dynamic Context Greeting */}
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.5',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)'
                }}>
                  {currentGuide.greeting}
                </div>

                {/* Quick Action Triggers (if available for this context) */}
                {currentGuide.quickActions && currentGuide.quickActions.length > 0 && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#a78bfa', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Sparkles size={12} color="#c084fc" />
                      Quick Action Triggers:
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {currentGuide.quickActions.map(action => (
                        <button
                          key={action.id}
                          onClick={() => handleQuickAction(action)}
                          className="btn btn-secondary"
                          style={{
                            fontSize: '11px',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(139, 92, 246, 0.12)',
                            borderColor: 'rgba(139, 92, 246, 0.3)',
                            color: '#e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Checklist */}
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#cbd5e1', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Compass size={13} color="var(--accent-primary)" />
                    Recommended Steps:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {currentGuide.checklist.map((step, idx) => {
                      const stepKey = `${section}_${subSection || 'main'}_${activeSubTab || 'root'}_${idx}`;
                      const isDone = checkedSteps[stepKey];
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
                            fontSize: '11.5px',
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

                {/* Pro Tip */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  backgroundColor: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  marginTop: 'auto'
                }}>
                  <Lightbulb size={16} color="#c084fc" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <div style={{ fontSize: '11px', color: '#e2e8f0', lineHeight: '1.4' }}>
                    <strong>Pro Tip:</strong> {currentGuide.proTip}
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: ACTUARIAL CHEAT SHEET */}
            {activeDrawerTab === 'cheatsheet' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Category Pills */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {campaignIntel && (
                    <button
                      onClick={() => setCheatSheetCategory('campaign')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '10.5px',
                        fontWeight: '600',
                        border: 'none',
                        backgroundColor: cheatSheetCategory === 'campaign' ? 'rgba(168, 85, 247, 0.35)' : 'rgba(255,255,255,0.05)',
                        color: cheatSheetCategory === 'campaign' ? '#c084fc' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {campaignIntel.tabLabel || '🚀 Campaign Intel'}
                    </button>
                  )}
                  <button
                    onClick={() => setCheatSheetCategory('cpf')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '10.5px',
                      fontWeight: '600',
                      border: 'none',
                      backgroundColor: cheatSheetCategory === 'cpf' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.05)',
                      color: cheatSheetCategory === 'cpf' ? '#60a5fa' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    🇸🇬 CPF & Retirement
                  </button>
                  <button
                    onClick={() => setCheatSheetCategory('mas')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '10.5px',
                      fontWeight: '600',
                      border: 'none',
                      backgroundColor: cheatSheetCategory === 'mas' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.05)',
                      color: cheatSheetCategory === 'mas' ? '#34d399' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    🛡️ MAS Benchmarks
                  </button>
                  <button
                    onClick={() => setCheatSheetCategory('mdrt')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '10.5px',
                      fontWeight: '600',
                      border: 'none',
                      backgroundColor: cheatSheetCategory === 'mdrt' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255,255,255,0.05)',
                      color: cheatSheetCategory === 'mdrt' ? '#fbbf24' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    🏆 MDRT 2026
                  </button>
                </div>

                {/* Campaign Intel Category Content */}
                {cheatSheetCategory === 'campaign' && campaignIntel && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ padding: '8px 10px', backgroundColor: 'rgba(168, 85, 247, 0.1)', borderRadius: '8px', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
                      <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#c084fc' }}>
                        {campaignIntel.title}
                      </div>
                      <div style={{ fontSize: '10px', color: '#e2e8f0', marginTop: '2px' }}>
                        🎯 Target: <strong>{campaignIntel.targetDemographic}</strong>
                      </div>
                    </div>

                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#c084fc', marginTop: '2px' }}>
                      Key Market & Actuarial Benchmarks:
                    </div>
                    {campaignIntel.benchmarks.map((b, idx) => (
                      <div key={idx} style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '8px 10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', color: '#e2e8f0' }}>
                          <span>{b.category}</span>
                          <span style={{ color: '#a78bfa', fontWeight: '700' }}>{b.benchmark}</span>
                        </div>
                        <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.35' }}>
                          {b.rationale}
                        </div>
                      </div>
                    ))}

                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#c084fc', marginTop: '4px' }}>
                      Key Sales Hooks & Advisor Angles:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {campaignIntel.salesHooks.map((hook, idx) => (
                        <div key={idx} style={{ fontSize: '10.5px', color: 'var(--text-secondary)', padding: '6px 8px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px', borderLeft: '2px solid #8b5cf6', lineHeight: '1.4' }}>
                          💡 {hook}
                        </div>
                      ))}
                    </div>

                    {campaignIntel.topObjectionRebuttal && (
                      <div style={{ marginTop: '4px', padding: '8px 10px', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                        <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#f87171', marginBottom: '2px' }}>
                          🛡️ Top Objection Rebuttal:
                        </div>
                        <div style={{ fontSize: '10px', color: '#e2e8f0', lineHeight: '1.4' }}>
                          {campaignIntel.topObjectionRebuttal}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* CPF Category Content */}
                {cheatSheetCategory === 'cpf' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#93c5fd' }}>
                      2025–2026 CPF LIFE Sums & Payouts:
                    </div>
                    {Object.values(SINGAPORE_ACTUARIAL_BENCHMARKS.cpfSums2026).filter(v => typeof v === 'object').map((tier, idx) => (
                      <div key={idx} style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '8px 10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)' }}>
                          <span>{tier.label}</span>
                          <span style={{ color: '#60a5fa' }}>S${tier.amount.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#34d399', marginTop: '2px' }}>
                          <span>Est. Payout:</span>
                          <strong>{tier.estPayout}</strong>
                        </div>
                        <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {tier.notes}
                        </div>
                      </div>
                    ))}

                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#93c5fd', marginTop: '4px' }}>
                      CPF Interest Rates:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {SINGAPORE_ACTUARIAL_BENCHMARKS.cpfInterestRates.map((r, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', padding: '4px 8px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{r.account}</span>
                          <span style={{ color: '#38bdf8', fontWeight: '600' }}>{r.baseRate}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* MAS Benchmarks Content */}
                {cheatSheetCategory === 'mas' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#6ee7b7' }}>
                      Singapore Protection Benchmark Guidelines:
                    </div>
                    {SINGAPORE_ACTUARIAL_BENCHMARKS.masProtectionBenchmarks.map((b, idx) => (
                      <div key={idx} style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '8px 10px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#34d399' }}>
                          {b.category}
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                          {b.benchmark}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.3' }}>
                          {b.rationale}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* MDRT 2026 Content */}
                {cheatSheetCategory === 'mdrt' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#fcd34d' }}>
                      2026 Production & Commission Milestones:
                    </div>
                    {['mdrt', 'cot', 'tot'].map(key => {
                      const tier = SINGAPORE_ACTUARIAL_BENCHMARKS.mdrtPacingBenchmarks[key];
                      return (
                        <div key={key} style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '8px 10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: '700', color: 'var(--text-primary)' }}>
                            <span>{tier.title}</span>
                            <span style={{ color: '#fbbf24' }}>S${tier.fyc.toLocaleString()} FYC</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            <span>Monthly Run-rate:</span>
                            <span style={{ color: '#34d399', fontWeight: '600' }}>{tier.monthlyRunRate}</span>
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ fontSize: '10.5px', color: '#cbd5e1', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.25)', marginTop: '4px' }}>
                      🛡️ {SINGAPORE_ACTUARIAL_BENCHMARKS.mdrtPacingBenchmarks.persistencyThreshold}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB 3: ASK ARCHIE & SCRIPTS */}
            {activeDrawerTab === 'scripts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Search Bar */}
                <div style={{ position: 'relative' }}>
                  <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="text"
                    value={scriptSearchQuery}
                    onChange={(e) => setScriptSearchQuery(e.target.value)}
                    placeholder="Search objection, script, CPF rule..."
                    style={{
                      width: '100%',
                      padding: '7px 10px 7px 30px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-light)',
                      color: 'var(--text-primary)',
                      fontSize: '11.5px',
                      outline: 'none'
                    }}
                  />
                  {scriptSearchQuery && (
                    <button
                      onClick={() => setScriptSearchQuery('')}
                      style={{ position: 'absolute', right: '8px', top: '8px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Quick Search Chips */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {['CPF SA', 'CI vs Stocks', 'Claim Shortfall', 'Warm Opener', 'Referrals'].map(chip => (
                    <button
                      key={chip}
                      onClick={() => setScriptSearchQuery(chip)}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        border: '1px solid var(--border-light)',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        color: 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Filtered Scripts List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredScripts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '11.5px' }}>
                      No matching scripts found. Try a different query.
                    </div>
                  ) : (
                    filteredScripts.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-light)',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                          <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: '1.3' }}>
                            {item.question}
                          </span>
                          <button
                            onClick={() => handleCopyScript(item.script, idx)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: copiedScriptIdx === idx ? '#34d399' : '#a78bfa',
                              cursor: 'pointer',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              flexShrink: 0,
                              backgroundColor: 'rgba(139, 92, 246, 0.15)'
                            }}
                            title="Copy script to clipboard"
                          >
                            {copiedScriptIdx === idx ? <Check size={11} /> : <Copy size={11} />}
                            {copiedScriptIdx === idx ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.45', backgroundColor: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px', borderLeft: '2px solid #8b5cf6' }}>
                          "{item.script}"
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            )}

          </div>

          {/* Footer Bar */}
          <div style={{
            borderTop: '1px solid var(--border-light)',
            paddingTop: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '10px',
            color: 'var(--text-muted)'
          }}>
            <span>🇸🇬 Singapore Financial Standards</span>
            <span style={{ color: '#a78bfa', fontWeight: '600' }}>Shortcut: Ctrl + /</span>
          </div>

        </div>
      )}

      {/* Floating Avatar Trigger Button */}
      <button
        onClick={() => toggleArchie()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          border: isArchieOpen ? '1px solid #8b5cf6' : '1px solid rgba(139, 92, 246, 0.35)',
          borderRadius: '50px',
          padding: '6px 16px 6px 8px',
          color: '#f1f5f9',
          boxShadow: '0 8px 25px rgba(0,0,0,0.5), 0 0 15px rgba(139, 92, 246, 0.25)',
          cursor: 'pointer',
          backdropFilter: 'blur(12px)',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: isArchieOpen ? 'scale(1.02)' : 'scale(1)'
        }}
        title="Toggle Archie Copilot (Ctrl + /)"
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
            Archie Copilot
            <Sparkles size={11} color="#c084fc" />
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8', maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentGuide.badge}
          </div>
        </div>

        {isArchieOpen ? <ChevronDown size={14} color="#94a3b8" /> : <ChevronUp size={14} color="#94a3b8" />}
      </button>
    </div>
  );
}
