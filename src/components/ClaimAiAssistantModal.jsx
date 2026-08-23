import React, { useState } from 'react';
import { Sparkles, Copy, Check, X, FileText, MessageSquare, AlertTriangle, ShieldCheck, ArrowRight, RefreshCw, Layers } from 'lucide-react';

export default function ClaimAiAssistantModal({ client, claim, policy, isOpen, onClose, onApplyReconciliation }) {
  const [activeMode, setActiveMode] = useState('reconciliation'); // 'reconciliation' | 'whatsapp' | 'cover_letter' | 'guidance'
  
  // Inputs for Reconciliation Audit
  const [billListingText, setBillListingText] = useState('');
  const [settlementLetterText, setSettlementLetterText] = useState('');
  const [submissionSummaryText, setSubmissionSummaryText] = useState('');
  
  // General Custom Context Input
  const [customContext, setCustomContext] = useState('');
  
  // Output States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reconciliationResult, setReconciliationResult] = useState(null);
  const [generatedText, setGeneratedText] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !claim) return null;

  const handleRunReconciliation = async () => {
    if (!window.electronAPI?.analyseClaimSettlementReconciliation) return;
    setLoading(true);
    setError(null);
    try {
      const res = await window.electronAPI.analyseClaimSettlementReconciliation({
        client,
        claim,
        policy,
        billListingText,
        settlementLetterText,
        submissionSummaryText
      });
      if (res.success && res.data) {
        setReconciliationResult(res.data);
      } else {
        setError(res.error || 'Failed to analyze claim settlement reconciliation.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during AI analysis.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTextAssist = async (modeType) => {
    if (!window.electronAPI?.generateClaimAiAssist) return;
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const res = await window.electronAPI.generateClaimAiAssist({
        client,
        claim,
        policy,
        actionType: modeType,
        customContext
      });
      if (res.success && res.text) {
        setGeneratedText(res.text);
      } else {
        setError(res.error || 'Failed to generate content.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during generation.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (textToCopy) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(val);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(8px)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '920px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.1) 0%, rgba(0,0,0,0) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(139, 92, 246, 0.4)'
            }}>
              <Sparkles size={20} color="var(--accent-primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Gemini AI Claim Copilot
                <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#c084fc' }}>
                  {claim.title || 'Claim Assistant'}
                </span>
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Client: {client?.fullName} • {policy?.provider || 'Insurer'} ({policy?.policyNumber || 'No Ref'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-light)',
          backgroundColor: 'rgba(255,255,255,0.02)',
          padding: '0 24px'
        }}>
          <button
            onClick={() => { setActiveMode('reconciliation'); setError(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeMode === 'reconciliation' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeMode === 'reconciliation' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: activeMode === 'reconciliation' ? '600' : '400',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <Layers size={16} /> Bill & Settlement Reconciler
          </button>
          <button
            onClick={() => { setActiveMode('whatsapp'); setError(null); if (!generatedText) handleGenerateTextAssist('client_whatsapp_update'); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeMode === 'whatsapp' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeMode === 'whatsapp' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: activeMode === 'whatsapp' ? '600' : '400',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <MessageSquare size={16} /> Client WhatsApp Update
          </button>
          <button
            onClick={() => { setActiveMode('cover_letter'); setError(null); if (!generatedText) handleGenerateTextAssist('insurer_cover_letter'); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeMode === 'cover_letter' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeMode === 'cover_letter' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: activeMode === 'cover_letter' ? '600' : '400',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <FileText size={16} /> Insurer Cover Letter / Query Appeal
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* MODE 1: RECONCILIATION & BILL TALLY AUDIT */}
          {activeMode === 'reconciliation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                padding: '16px',
                backgroundColor: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '10px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: '1.5'
              }}>
                <strong style={{ color: 'var(--text-primary)' }}>💡 Payout Reconciliation Audit:</strong> Paste the text or breakdown from the <strong>Clinic Combined Bill</strong>, <strong>Claim Settlement Letter</strong>, and <strong>Submission Summary</strong> below. Gemini will match every line-item, calculate the true payout vs. co-pay, and detect any un-reimbursed bills or shortfalls.
              </div>

              {/* 3 Raw Input Areas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="input-label" style={{ fontSize: '12px' }}>
                    1. Clinic Combined Bill Listing
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Paste itemized clinic invoices, doctor fees, MRI/scans, hospital bill..."
                    className="input-field"
                    style={{ fontSize: '12px', resize: 'vertical' }}
                    value={billListingText}
                    onChange={(e) => setBillListingText(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="input-label" style={{ fontSize: '12px' }}>
                    2. Claim Submission Summary
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Paste submission batch notes, claimed amounts, submission reference numbers..."
                    className="input-field"
                    style={{ fontSize: '12px', resize: 'vertical' }}
                    value={submissionSummaryText}
                    onChange={(e) => setSubmissionSummaryText(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="input-label" style={{ fontSize: '12px' }}>
                    3. Claim Settlement Letter / EOB
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Paste insurer settlement letter text, approved amount, co-pay/deductible, payment ref..."
                    className="input-field"
                    style={{ fontSize: '12px', resize: 'vertical' }}
                    value={settlementLetterText}
                    onChange={(e) => setSettlementLetterText(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                  onClick={handleRunReconciliation}
                  disabled={loading}
                >
                  <Sparkles size={16} />
                  {loading ? 'Auditing & Reconciling Bills...' : 'Run AI Reconciliation Audit'}
                </button>
              </div>

              {/* Reconciliation Results Display */}
              {reconciliationResult && (
                <div className="glass-panel animate-fade-in" style={{
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  {/* Status Banner */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 18px',
                    borderRadius: '10px',
                    backgroundColor: reconciliationResult.unaccountedDifference === 0 || (reconciliationResult.reconciliationStatus || '').includes('Reconciled')
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(245, 158, 11, 0.15)',
                    border: reconciliationResult.unaccountedDifference === 0 || (reconciliationResult.reconciliationStatus || '').includes('Reconciled')
                      ? '1px solid rgba(16, 185, 129, 0.4)'
                      : '1px solid rgba(245, 158, 11, 0.4)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {reconciliationResult.unaccountedDifference === 0 || (reconciliationResult.reconciliationStatus || '').includes('Reconciled') ? (
                        <ShieldCheck size={22} color="var(--accent-success)" />
                      ) : (
                        <AlertTriangle size={22} color="#fbbf24" />
                      )}
                      <div>
                        <div style={{
                          fontWeight: '700',
                          fontSize: '14px',
                          color: reconciliationResult.unaccountedDifference === 0 || (reconciliationResult.reconciliationStatus || '').includes('Reconciled')
                            ? 'var(--accent-success)'
                            : '#fbbf24'
                        }}>
                          {reconciliationResult.reconciliationStatus || 'Reconciliation Complete'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {reconciliationResult.unaccountedDifference === 0
                            ? 'All clinic invoices match settlement statements with $0 unaccounted variance.'
                            : `Unaccounted shortfall / variance of ${formatCurrency(reconciliationResult.unaccountedDifference)} identified.`}
                        </div>
                      </div>
                    </div>

                    {onApplyReconciliation && (
                      <button
                        className="btn"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          color: 'var(--text-primary)',
                          fontSize: '12px',
                          padding: '6px 14px'
                        }}
                        onClick={() => onApplyReconciliation(reconciliationResult)}
                      >
                        Apply Totals to Claim Form
                      </button>
                    )}
                  </div>

                  {/* Financial KPIs Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                    <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Incurred</div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
                        {formatCurrency(reconciliationResult.totalIncurred)}
                      </div>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Claimed</div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#60a5fa', marginTop: '4px' }}>
                        {formatCurrency(reconciliationResult.totalClaimed)}
                      </div>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.08)', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--accent-success)' }}>Insurer Paid</div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--accent-success)', marginTop: '4px' }}>
                        {formatCurrency(reconciliationResult.totalInsurerPaid)}
                      </div>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.08)', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#fbbf24' }}>Co-Pay / Deductible</div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#fbbf24', marginTop: '4px' }}>
                        {formatCurrency(reconciliationResult.totalCoPayDeductible)}
                      </div>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Medisave / Panel</div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {formatCurrency(reconciliationResult.totalMedisaveOrPanel)}
                      </div>
                    </div>
                  </div>

                  {/* Reconciled Line Items Breakdown Table */}
                  {Array.isArray(reconciliationResult.reconciledItems) && reconciliationResult.reconciledItems.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: '600' }}>
                        Audit Breakdown by Item:
                      </h4>
                      <div style={{ border: '1px solid var(--border-light)', borderRadius: '8px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                          <thead>
                            <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-light)' }}>
                              <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-secondary)' }}>Item / Procedure</th>
                              <th style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>Incurred</th>
                              <th style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>Paid</th>
                              <th style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>Co-Pay</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-secondary)' }}>Status / Audit Note</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reconciliationResult.reconciledItems.map((item, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <td style={{ padding: '8px 12px', color: 'var(--text-primary)', fontWeight: '500' }}>{item.item}</td>
                                <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>{formatCurrency(item.billAmount)}</td>
                                <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--accent-success)', fontWeight: '600' }}>{formatCurrency(item.paidAmount)}</td>
                                <td style={{ padding: '8px 12px', textAlign: 'right', color: '#fbbf24' }}>{formatCurrency(item.coPayAmount)}</td>
                                <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    marginRight: '6px',
                                    backgroundColor: (item.status || '').includes('Paid') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                    color: (item.status || '').includes('Paid') ? 'var(--accent-success)' : '#fbbf24'
                                  }}>
                                    {item.status || 'Audited'}
                                  </span>
                                  {item.auditNote}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Discrepancy Analysis & Strategic Action */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-light)' }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                        🔍 Discrepancy & Deduction Analysis
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        {reconciliationResult.discrepancyAnalysis || 'No discrepancies identified.'}
                      </p>
                    </div>

                    <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent-primary)', marginBottom: '6px' }}>
                        🎯 Recommended Advisor Next Steps
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        {reconciliationResult.recommendedAction || 'Inform client that payout is completed.'}
                      </p>
                    </div>
                  </div>

                  {/* Client Explanation Draft */}
                  {reconciliationResult.clientExplanationMessage && (
                    <div style={{
                      padding: '16px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(16, 185, 129, 0.05)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent-success)' }}>
                          💬 Client WhatsApp / Settlement Message Draft
                        </span>
                        <button
                          className="btn"
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                            color: 'var(--accent-success)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          onClick={() => handleCopy(reconciliationResult.clientExplanationMessage)}
                        >
                          {copied ? <Check size={12} /> : <Copy size={12} />}
                          {copied ? 'Copied' : 'Copy Message'}
                        </button>
                      </div>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.6', margin: 0 }}>
                        {reconciliationResult.clientExplanationMessage}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MODE 2 & 3: TEXT GENERATION (WHATSAPP UPDATE OR COVER LETTER) */}
          {(activeMode === 'whatsapp' || activeMode === 'cover_letter') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Optional custom context (e.g. 'Emphasize that 2 follow-up physio bills are pending' or 'Ask for appeal on deductibles')"
                  className="input-field"
                  style={{ flex: 1, fontSize: '13px' }}
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px', whiteSpace: 'nowrap' }}
                  onClick={() => handleGenerateTextAssist(activeMode === 'whatsapp' ? 'client_whatsapp_update' : 'insurer_cover_letter')}
                  disabled={loading}
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  {loading ? 'Generating...' : 'Regenerate Draft'}
                </button>
              </div>

              {generatedText ? (
                <div style={{
                  padding: '20px',
                  backgroundColor: 'var(--bg-base)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {activeMode === 'whatsapp' ? '📱 Mobile WhatsApp Format' : '📄 Official Formal Letter Format'}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onClick={() => handleCopy(generatedText)}
                    >
                      {copied ? <Check size={14} color="var(--accent-success)" /> : <Copy size={14} />}
                      {copied ? 'Copied to Clipboard!' : 'Copy Text'}
                    </button>
                  </div>

                  <div style={{
                    fontSize: '13.5px',
                    color: 'var(--text-primary)',
                    lineHeight: '1.7',
                    whiteSpace: 'pre-wrap',
                    fontFamily: activeMode === 'cover_letter' ? 'inherit' : 'sans-serif'
                  }}>
                    {generatedText}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  {loading ? 'Gemini is drafting your message...' : 'Click Generate to create a customized draft.'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.2)'
        }}>
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
