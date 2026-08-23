import React, { useState } from 'react';
import { 
  Sparkles, Copy, Check, Calendar, Clock, Target, TrendingUp, Shield, 
  MessageSquare, Briefcase, RefreshCw, X, FileText, CheckCircle2, ChevronRight
} from 'lucide-react';

export default function PreMeetingBriefModal({
  isOpen,
  onClose,
  client,
  briefData,
  isLoading,
  onRegenerate,
  meetingContext,
  setMeetingContext
}) {
  const [copiedHookIdx, setCopiedHookIdx] = useState(null);
  const [copiedNote, setCopiedNote] = useState(false);

  if (!isOpen) return null;

  const handleCopyHook = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedHookIdx(idx);
    setTimeout(() => setCopiedHookIdx(null), 2500);
  };

  const handleCopyAllNotes = () => {
    if (!briefData) return;
    const noteText = briefData.meetingPrepNoteText || `90-Day Meeting Prep for ${client?.fullName}\n\nExecutive Summary:\n${briefData.executiveSummary90Days || ''}\n\nConversation Hooks:\n${(briefData.conversationHooks || []).map(h => `- ${h.hookTitle}: "${h.rapportScript}"`).join('\n')}\n\nKey Opportunities:\n${(briefData.planningOpportunities || []).map(o => `- [${o.priority}] ${o.recommendation}: ${o.rationale}`).join('\n')}`;
    navigator.clipboard.writeText(noteText);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2500);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.82)', zIndex: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '840px', padding: '32px', maxHeight: '92vh', overflowY: 'auto', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.3)', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                <Clock size={20} />
              </div>
              <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', margin: 0, fontWeight: '700' }}>
                90-Day Pre-Meeting Intelligence Brief
              </h2>
              <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: '600', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                ⚡ Active Radar
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Consultant cheat sheet for <strong>{client?.fullName}</strong> ({client?.companyName || 'Corporate Client'}) • Cross-referenced with in-force policies & blueprint
            </p>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
            title="Close Modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Meeting Context & Re-Generate Bar */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
          <div style={{ flex: 1 }}>
            <input 
              type="text"
              className="input-field"
              style={{ width: '100%', fontSize: '12px', background: 'transparent', border: 'none', color: 'var(--text-primary)' }}
              placeholder="Meeting Context / Objective (e.g. 'Annual Financial Review', 'Discuss Promotion & Surplus Cash')"
              value={meetingContext || ''}
              onChange={(e) => setMeetingContext(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn"
            style={{ padding: '6px 14px', fontSize: '12px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={onRegenerate}
            disabled={isLoading}
          >
            <RefreshCw size={13} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
            {isLoading ? 'Synthesizing...' : 'Refresh Brief'}
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <RefreshCw size={32} color="#60a5fa" style={{ animation: 'spin 1s linear infinite' }} />
            <div style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: '600' }}>Synthesizing 90-Day Pre-Meeting Brief...</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '420px' }}>
              Scanning recent online posts, news updates, in-force policies, and financial runway to craft tailored conversation openers and advisory recommendations.
            </div>
          </div>
        ) : briefData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Section 1: Executive 90-Day Summary */}
            <div style={{ padding: '16px', backgroundColor: 'rgba(59, 130, 246, 0.06)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#60a5fa', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Briefcase size={13} /> 1. Executive 90-Day Activity Summary
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                {briefData.executiveSummary90Days || 'No 90-day activity summary available.'}
              </div>
            </div>

            {/* Section 2: Recent Milestones & Signals */}
            {briefData.recentMilestones && briefData.recentMilestones.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                  <TrendingUp size={14} color="#34d399" /> 2. Detected Milestones & Financial Triggers ({briefData.recentMilestones.length})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                  {briefData.recentMilestones.map((m, idx) => (
                    <div key={idx} style={{ padding: '12px 14px', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.15)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#34d399' }}>{m.period || 'Recent'}</span>
                        {m.sourcePlatform && (
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                            {m.sourcePlatform}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: '500' }}>{m.milestone}</div>
                      {m.financialOpportunity && (
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          💡 <em>{m.financialOpportunity}</em>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 3: 3 Consultative Conversation Starters & Rapport Hooks */}
            {briefData.conversationHooks && briefData.conversationHooks.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                  <MessageSquare size={14} color="#60a5fa" /> 3. Consultative Conversation Starters & Rapport Hooks
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {briefData.conversationHooks.map((hook, idx) => (
                    <div key={idx} style={{ padding: '14px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#60a5fa' }}>
                          Hook {idx + 1}: {hook.hookTitle || 'Meeting Opener'}
                        </div>
                        <button
                          type="button"
                          className="btn"
                          style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: copiedHookIdx === idx ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)', color: copiedHookIdx === idx ? '#34d399' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handleCopyHook(hook.rapportScript, idx)}
                        >
                          {copiedHookIdx === idx ? <Check size={12} /> : <Copy size={12} />}
                          {copiedHookIdx === idx ? 'Copied' : 'Copy Script'}
                        </button>
                      </div>

                      <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5', fontStyle: 'italic', backgroundColor: 'rgba(0,0,0,0.2)', padding: '10px 12px', borderRadius: '6px', borderLeft: '3px solid #60a5fa' }}>
                        "{hook.rapportScript}"
                      </div>

                      {hook.transitionToAdvisory && (
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ChevronRight size={12} color="#a855f7" /> <strong>Transition:</strong> {hook.transitionToAdvisory}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 4: Recommended Meeting Agenda */}
            {briefData.recommendedAgenda && briefData.recommendedAgenda.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                  <Calendar size={14} color="#f59e0b" /> 4. Recommended Meeting Agenda & Time Allocation
                </div>
                <div style={{ border: '1px solid var(--border-light)', borderRadius: '10px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', textAlign: 'left' }}>
                        <th style={{ padding: '10px 14px', width: '50px' }}>#</th>
                        <th style={{ padding: '10px 14px' }}>Agenda Topic</th>
                        <th style={{ padding: '10px 14px', width: '90px' }}>Duration</th>
                        <th style={{ padding: '10px 14px' }}>Advisory Focus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {briefData.recommendedAgenda.map((ag, idx) => (
                        <tr key={idx} style={{ borderBottom: idx < briefData.recommendedAgenda.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                          <td style={{ padding: '10px 14px', color: '#60a5fa', fontWeight: '600' }}>{ag.order || idx + 1}</td>
                          <td style={{ padding: '10px 14px', color: 'var(--text-primary)', fontWeight: '500' }}>{ag.agendaItem}</td>
                          <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{ag.duration || '15m'}</td>
                          <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{ag.focus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Section 5: High-Priority Planning Opportunities */}
            {briefData.planningOpportunities && briefData.planningOpportunities.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                  <Target size={14} color="#a855f7" /> 5. High-Priority Planning Opportunities & Proposals
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                  {briefData.planningOpportunities.map((opp, idx) => (
                    <div key={idx} style={{ padding: '12px 14px', backgroundColor: 'rgba(168, 85, 247, 0.05)', borderRadius: '10px', border: '1px solid rgba(168, 85, 247, 0.2)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#c084fc' }}>{opp.domain || 'Financial Planning'}</span>
                        {opp.priority && (
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: opp.priority === 'High' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)', color: opp.priority === 'High' ? '#f87171' : '#60a5fa', fontWeight: '600' }}>
                            {opp.priority} Priority
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: '600' }}>{opp.recommendation}</div>
                      {opp.rationale && (
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{opp.rationale}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No brief data generated yet. Click "Refresh Brief" to synthesize the 90-day intelligence cheat sheet.
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <button
            type="button"
            className="btn"
            style={{ padding: '8px 16px', fontSize: '12px', backgroundColor: copiedNote ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.15)', color: copiedNote ? '#34d399' : '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={handleCopyAllNotes}
            disabled={!briefData}
          >
            {copiedNote ? <Check size={14} /> : <Copy size={14} />}
            {copiedNote ? 'Meeting Notes Copied!' : '📋 Copy Meeting Prep Notes to Clipboard'}
          </button>

          <button 
            type="button" 
            className="btn" 
            style={{ backgroundColor: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }} 
            onClick={onClose}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
