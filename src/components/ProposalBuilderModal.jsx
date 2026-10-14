import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Sparkles, FileText, Download, Printer, Save, Trash2, Plus, 
  Copy, Check, Upload, Image, AlertCircle, RefreshCw, Eye, Edit3, 
  Layers, Users, Shield, Calendar, DollarSign, ExternalLink, ChevronRight
} from 'lucide-react';

export default function ProposalBuilderModal({
  isOpen,
  onClose,
  client,
  existingProposal = null,
  onSaveSuccess,
  consultantSettings = null
}) {
  const [viewMode, setViewMode] = useState('builder'); // 'builder' | 'preview'
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [analysisError, setAnalysisError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [clipboardNotice, setClipboardNotice] = useState(false);
  const [customAiInstructions, setCustomAiInstructions] = useState('');

  // Default / Active proposal state
  const [proposalData, setProposalData] = useState(() => {
    if (existingProposal) return existingProposal;
    const clientName = client?.fullName || 'Client';
    return {
      id: '',
      clientId: client?.id || '',
      clientName: clientName,
      proposalTitle: `${clientName} - Insurance Portfolio Suggestion`,
      status: 'Draft',
      currency: 'SGD',
      sections: [
        {
          id: 'sec-1',
          planningLevel: 'Risk Management - Hospitalization & Emergency Evacuation',
          remarks: 'Deductible of $1,500 and Co-Insurance of 10% applies. Emergency Evacuation does not incur the Deductible and Co-Insurance.',
          mergeRemarks: true,
          customRowNote: '',
          items: [
            {
              id: 'item-1',
              person: clientName.split(' ')[0] || 'Client',
              coverage: `Hospitalization Expenses/Emergency Evacuation - ${clientName.split(' ')[0] || 'Client'}`,
              planName: 'AIA Platinum International Health',
              sumAssured: 'As Charged up to $1,500,000/Yr',
              annualPremium: 3190.00,
              remarks: ''
            }
          ]
        },
        {
          id: 'sec-2',
          planningLevel: 'Risk Management - Humanitarian Mission Risk',
          remarks: 'Renewable term of 5 years. Conversion to Life Insurance Plan available.',
          mergeRemarks: true,
          customRowNote: '',
          items: [
            {
              id: 'item-2',
              person: clientName.split(' ')[0] || 'Client',
              coverage: `Death/TPD - ${clientName.split(' ')[0] || 'Client'}`,
              planName: 'AIA Secure Flexi Term 5Y',
              sumAssured: '$1,000,000',
              annualPremium: 420.00,
              remarks: ''
            }
          ]
        },
        {
          id: 'sec-3',
          planningLevel: 'Wealth Management',
          remarks: '',
          mergeRemarks: true,
          customRowNote: 'To be discussed at a later date',
          items: []
        }
      ],
      totalAnnualPremium: 3610.00
    };
  });

  // Re-sync when client or existingProposal changes
  useEffect(() => {
    if (existingProposal) {
      setProposalData(existingProposal);
    } else if (client) {
      const clientName = client.fullName || 'Client';
      const familyNames = [
        clientName.split(' ')[0],
        ...(client.familyMembers || []).map(f => (f.name || f.fullName || '').split(' ')[0]).filter(Boolean),
        ...(client.dependents || []).map(d => (d.name || d.fullName || '').split(' ')[0]).filter(Boolean)
      ];

      setProposalData({
        id: '',
        clientId: client.id,
        clientName: clientName,
        proposalTitle: `${clientName} - Insurance Portfolio Suggestion`,
        status: 'Draft',
        currency: 'SGD',
        sections: [
          {
            id: 'sec-1',
            planningLevel: 'Risk Management - Hospitalization & Emergency Evacuation',
            remarks: 'Deductible of $1,500 and Co-Insurance of 10% applies. Emergency Evacuation does not incur the Deductible and Co-Insurance.',
            mergeRemarks: true,
            customRowNote: '',
            items: familyNames.slice(0, 4).map((name, idx) => ({
              id: `item-seed-${idx}`,
              person: name,
              coverage: `Hospitalization Expenses/Emergency Evacuation - ${name}`,
              planName: 'AIA Platinum International Health',
              sumAssured: 'As Charged up to $1,500,000/Yr',
              annualPremium: idx === 0 ? 3190.00 : (idx === 1 ? 3463.00 : 1625.00),
              remarks: ''
            }))
          },
          {
            id: 'sec-2',
            planningLevel: 'Risk Management - Humanitarian Mission Risk',
            remarks: 'Renewable term of 5 years. Conversion to Life Insurance Plan available.',
            mergeRemarks: true,
            customRowNote: '',
            items: familyNames.slice(0, 2).map((name, idx) => ({
              id: `item-term-${idx}`,
              person: name,
              coverage: `Death/TPD - ${name}`,
              planName: 'AIA Secure Flexi Term 5Y',
              sumAssured: '$1,000,000',
              annualPremium: idx === 0 ? 420.00 : 441.00,
              remarks: ''
            }))
          },
          {
            id: 'sec-3',
            planningLevel: 'Wealth Management',
            remarks: '',
            mergeRemarks: true,
            customRowNote: 'To be discussed at a later date',
            items: []
          }
        ],
        totalAnnualPremium: 10764.00
      });
    }
  }, [client, existingProposal, isOpen]);

  // Clipboard Paste Handler (Ctrl+V anywhere in modal to paste screenshots)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const base64 = await fileToBase64(blob);
            const newFile = {
              name: `Pasted_Screenshot_${new Date().toISOString().slice(11, 19).replace(/:/g, '-')}.png`,
              size: blob.size,
              mimeType: blob.type || 'image/png',
              base64
            };
            setUploadedFiles(prev => [...prev, newFile]);
            setClipboardNotice(true);
            setTimeout(() => setClipboardNotice(false), 3500);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  // Helper to convert File or Blob to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;

    await processFiles(files);
  };

  const handleFileInputChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    await processFiles(files);
    e.target.value = '';
  };

  const processFiles = async (files) => {
    const newItems = [];
    for (const file of files) {
      try {
        const base64 = await fileToBase64(file);
        newItems.push({
          name: file.name,
          size: file.size,
          mimeType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/png'),
          base64
        });
      } catch (err) {
        console.error("Failed to read file:", file.name, err);
      }
    }
    setUploadedFiles(prev => [...prev, ...newItems]);
  };

  const handleRemoveFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  // AI Multimodal Extraction with Gemini
  const handleRunAiExtraction = async () => {
    if (uploadedFiles.length === 0) {
      setAnalysisError('Please attach or paste at least one Benefit Illustration screenshot or quotation PDF.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError('');
    setAnalysisProgress(`Transmitting ${uploadedFiles.length} file(s) to Gemini Vision...`);

    try {
      if (!window.electronAPI?.parseProposalBiDocuments) {
        throw new Error('parseProposalBiDocuments IPC API is not available.');
      }

      setAnalysisProgress('Gemini Vision is auditing benefit schedules, riders, deductibles & premiums...');

      const familyMembersList = [
        ...(client?.familyMembers || []).map(f => ({ name: f.name || f.fullName, relationship: f.relationship || 'Spouse/Family' })),
        ...(client?.dependents || []).map(d => ({ name: d.name || d.fullName, relationship: d.relationship || 'Child' }))
      ];

      const res = await window.electronAPI.parseProposalBiDocuments({
        files: uploadedFiles,
        clientContext: {
          fullName: client?.fullName || proposalData.clientName,
          familyMembers: familyMembersList
        },
        additionalInstructions: customAiInstructions
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to extract proposal from documents.');
      }

      const extracted = res.data;
      if (extracted) {
        // Merge extracted proposal into state
        setProposalData(prev => ({
          ...prev,
          clientName: extracted.clientName || prev.clientName,
          proposalTitle: extracted.proposalTitle || prev.proposalTitle,
          sections: extracted.sections && extracted.sections.length > 0 ? extracted.sections : prev.sections,
          totalAnnualPremium: extracted.totalAnnualPremium !== undefined ? extracted.totalAnnualPremium : prev.totalAnnualPremium
        }));
        setViewMode('builder');
      }
    } catch (err) {
      console.error("AI Proposal Extraction Error:", err);
      setAnalysisError(err.message || 'Error occurred during AI extraction.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress('');
    }
  };

  // Section & Item manipulation
  const handleUpdateSection = (sectionIndex, field, value) => {
    setProposalData(prev => {
      const nextSections = [...prev.sections];
      nextSections[sectionIndex] = {
        ...nextSections[sectionIndex],
        [field]: value
      };
      return { ...prev, sections: nextSections };
    });
  };

  const handleAddSection = () => {
    const newSec = {
      id: `sec-${Date.now()}`,
      planningLevel: 'Risk Management - Critical Illness & Protection',
      remarks: '',
      mergeRemarks: true,
      customRowNote: '',
      items: [
        {
          id: `item-${Date.now()}`,
          person: proposalData.clientName.split(' ')[0] || 'Client',
          coverage: 'Critical Illness Multi-Pay Cover',
          planName: 'AIA Beyond Critical Care',
          sumAssured: '$250,000',
          annualPremium: 1200.00,
          remarks: ''
        }
      ]
    };
    setProposalData(prev => ({
      ...prev,
      sections: [...prev.sections, newSec]
    }));
  };

  const handleDeleteSection = (sectionIndex) => {
    setProposalData(prev => ({
      ...prev,
      sections: prev.sections.filter((_, idx) => idx !== sectionIndex)
    }));
  };

  const handleAddItem = (sectionIndex) => {
    const clientFirstName = proposalData.clientName.split(' ')[0] || 'Client';
    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      person: clientFirstName,
      coverage: `Coverage - ${clientFirstName}`,
      planName: 'Plan Name',
      sumAssured: '$1,000,000',
      annualPremium: 500.00,
      remarks: ''
    };
    setProposalData(prev => {
      const nextSections = [...prev.sections];
      const targetSec = nextSections[sectionIndex];
      nextSections[sectionIndex] = {
        ...targetSec,
        items: [...(targetSec.items || []), newItem]
      };
      return { ...prev, sections: nextSections };
    });
  };

  const handleUpdateItem = (sectionIndex, itemIndex, field, value) => {
    setProposalData(prev => {
      const nextSections = [...prev.sections];
      const targetSec = nextSections[sectionIndex];
      const nextItems = [...(targetSec.items || [])];
      nextItems[itemIndex] = {
        ...nextItems[itemIndex],
        [field]: field === 'annualPremium' ? (value === '' ? '' : Number(value)) : value
      };
      nextSections[sectionIndex] = {
        ...targetSec,
        items: nextItems
      };
      return { ...prev, sections: nextSections };
    });
  };

  const handleDeleteItem = (sectionIndex, itemIndex) => {
    setProposalData(prev => {
      const nextSections = [...prev.sections];
      const targetSec = nextSections[sectionIndex];
      nextSections[sectionIndex] = {
        ...targetSec,
        items: (targetSec.items || []).filter((_, idx) => idx !== itemIndex)
      };
      return { ...prev, sections: nextSections };
    });
  };

  // Recalculate Live Total
  const calculatedTotal = proposalData.sections.reduce((total, sec) => {
    return total + (sec.items || []).reduce((sub, it) => sub + (Number(it.annualPremium) || 0), 0);
  }, 0);

  const monthlyEquivalent = calculatedTotal / 12;

  const formatCurrency = (val) => {
    if (val === undefined || val === null || isNaN(val) || val === '') return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(val) || 0);
  };

  // Save Proposal
  const handleSaveProposal = async () => {
    setIsSaving(true);
    try {
      if (!window.electronAPI?.saveProposal) {
        throw new Error('saveProposal IPC API is not available.');
      }
      const res = await window.electronAPI.saveProposal({
        ...proposalData,
        totalAnnualPremium: calculatedTotal
      });
      if (!res.success) {
        throw new Error(res.error || 'Failed to save proposal.');
      }
      if (res.id) {
        setProposalData(prev => ({ ...prev, id: res.id }));
      }
      if (onSaveSuccess) onSaveSuccess(res.proposal || proposalData);
    } catch (err) {
      console.error("Save Proposal Error:", err);
      alert("Failed to save proposal: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Export PDF
  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      if (!window.electronAPI?.exportProposalPdf) {
        throw new Error('exportProposalPdf IPC API is not available.');
      }
      const res = await window.electronAPI.exportProposalPdf({
        proposal: {
          ...proposalData,
          totalAnnualPremium: calculatedTotal
        },
        consultantSettings
      });
      if (res.success && res.filePath) {
        // Also auto-save to database if not saved
        handleSaveProposal();
      } else if (!res.canceled) {
        alert("Failed to export PDF: " + (res.error || 'Unknown error'));
      }
    } catch (err) {
      console.error("Export PDF Error:", err);
      alert("Failed to export PDF: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Generate WhatsApp pitch
  const handleCopyWhatsAppPitch = () => {
    const clientFirstName = proposalData.clientName.split(' ')[0] || 'Client';
    let text = `Hi ${clientFirstName},\n\nHere is the consolidated summary of the insurance portfolio suggestion we discussed for you and your family:\n\n`;

    proposalData.sections.forEach(sec => {
      text += `📌 *${sec.planningLevel}*\n`;
      if (sec.customRowNote) {
        text += `• Roadmap: _${sec.customRowNote}_\n\n`;
        return;
      }
      if (sec.remarks) {
        text += `• Note: ${sec.remarks}\n`;
      }
      (sec.items || []).forEach(it => {
        text += `• *${it.person}* — ${it.planName}: ${it.sumAssured} (${formatCurrency(it.annualPremium)}/yr)\n`;
      });
      text += `\n`;
    });

    text += `💰 *Total Combined Yearly Commitment:* ${formatCurrency(calculatedTotal)} (~${formatCurrency(monthlyEquivalent)}/month)\n\n`;
    text += `I've attached the official single-page summary PDF for your review. Let's touch base to discuss any questions!\n\nBest regards,\n${consultantSettings?.consultantName || 'Pieter Beetsma'}\nFinancial Services Consultant\nAIA Singapore Private Limited`;

    navigator.clipboard.writeText(text);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 3000);
  };

  // Available family member chips for quick insertions
  const familyQuickPicks = [
    proposalData.clientName.split(' ')[0],
    ...(client?.familyMembers || []).map(f => (f.name || f.fullName || '').split(' ')[0]).filter(Boolean),
    ...(client?.dependents || []).map(d => (d.name || d.fullName || '').split(' ')[0]).filter(Boolean)
  ].filter((v, i, a) => a.indexOf(v) === i && v.trim().length > 0);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(8px)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div 
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '1240px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          border: '1px solid var(--border-light)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)',
          backgroundColor: '#0B1120',
          overflow: 'hidden'
        }}
      >
        {/* Header Bar */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(90deg, rgba(185, 28, 28, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(220, 38, 38, 0.2)',
              border: '1px solid rgba(220, 38, 38, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444'
            }}>
              <FileText size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '17px', color: 'var(--text-primary)', fontWeight: '600' }}>
                  Client Portfolio Suggestion & Insurance Proposal
                </h2>
                <span style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  fontWeight: '600'
                }}>
                  A4 Publication Standard
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Multi-life family insurance proposal generator with multimodal Gemini Vision quotation ingestion
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* View Mode Toggle */}
            <div style={{
              display: 'flex',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid var(--border-light)'
            }}>
              <button
                type="button"
                onClick={() => setViewMode('builder')}
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '500',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: viewMode === 'builder' ? '#dc2626' : 'transparent',
                  color: viewMode === 'builder' ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Edit3 size={13} /> Builder & Ingestion
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '500',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: viewMode === 'preview' ? '#dc2626' : 'transparent',
                  color: viewMode === 'preview' ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Eye size={13} /> Document Preview
              </button>
            </div>

            <button 
              type="button"
              className="btn-icon"
              onClick={onClose}
              style={{ color: 'var(--text-muted)', padding: '6px', borderRadius: '8px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Clipboard Notification Pill */}
        {clipboardNotice && (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '8px 24px',
            fontSize: '12px',
            color: '#34d399',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Check size={14} />
            <strong>Screenshot pasted from clipboard!</strong> Attached as image snippet ready for Gemini Vision analysis.
          </div>
        )}

        {/* Main Workspace Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {viewMode === 'builder' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Multimodal AI Dropzone & File Scanner Section */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                padding: '18px 20px',
                background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.3) 0%, rgba(15, 23, 42, 0.3) 100%)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} color="#ef4444" />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      Drop Benefit Illustration Screenshots or PDFs
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      (AIA, Prudential, Great Eastern, Singlife, etc.)
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#60a5fa', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                      💡 Ctrl+V to paste screenshot
                    </span>
                  </div>
                </div>

                {/* Drag and drop target */}
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  style={{
                    border: isDragging ? '2px dashed #ef4444' : '2px dashed var(--border-light)',
                    backgroundColor: isDragging ? 'rgba(239, 68, 68, 0.08)' : 'rgba(0, 0, 0, 0.25)',
                    borderRadius: '10px',
                    padding: '20px',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                  onClick={() => document.getElementById('bi-file-input')?.click()}
                >
                  <input 
                    id="bi-file-input"
                    type="file" 
                    multiple 
                    accept="image/*,application/pdf"
                    style={{ display: 'none' }} 
                    onChange={handleFileInputChange}
                  />
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f87171'
                  }}>
                    <Upload size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>
                      Drag & Drop Benefit Illustration screenshots or PDFs here
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      or click to browse from computer (supports multiple files)
                    </div>
                  </div>
                </div>

                {/* Uploaded Files Chips */}
                {uploadedFiles.length > 0 && (
                  <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                      Attached Files Ready for Analysis ({uploadedFiles.length}):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {uploadedFiles.map((file, idx) => (
                        <div 
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid var(--border-light)',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '11.5px',
                            color: 'var(--text-primary)'
                          }}
                        >
                          <Image size={13} color="#f87171" />
                          <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {file.name}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                            ({(file.size / 1024).toFixed(0)} KB)
                          </span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 2px' }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Custom AI guidance input */}
                    <div style={{ marginTop: '6px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input 
                        type="text"
                        className="input-field"
                        placeholder="Optional AI note: e.g. 'Term for Kazu and Naomi, International health for all 4 family members, Wealth to discuss later'"
                        value={customAiInstructions}
                        onChange={(e) => setCustomAiInstructions(e.target.value)}
                        style={{ fontSize: '12px', padding: '6px 12px', flex: 1 }}
                      />
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleRunAiExtraction}
                        disabled={isAnalyzing}
                        style={{
                          backgroundColor: '#dc2626',
                          borderColor: '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 18px',
                          fontSize: '12px',
                          fontWeight: '600',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {isAnalyzing ? (
                          <>
                            <RefreshCw size={13} className="spin" />
                            Analyzing with Gemini...
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} />
                            ✨ Auto-Generate Proposal Table
                          </>
                        )}
                      </button>
                    </div>

                    {analysisProgress && (
                      <div style={{ fontSize: '11px', color: '#60a5fa', marginTop: '4px', fontStyle: 'italic' }}>
                        {analysisProgress}
                      </div>
                    )}
                  </div>
                )}

                {analysisError && (
                  <div style={{
                    marginTop: '10px',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    color: '#f87171',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertCircle size={14} />
                    {analysisError}
                  </div>
                )}
              </div>

              {/* Proposal Header Particulars */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr 140px',
                gap: '16px',
                padding: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '10px',
                border: '1px solid var(--border-light)'
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '500' }}>
                    Client Legal / Preferred Name (Document Title)
                  </label>
                  <input 
                    type="text"
                    className="input-field"
                    value={proposalData.clientName}
                    onChange={(e) => setProposalData(prev => ({ ...prev, clientName: e.target.value }))}
                    style={{ fontSize: '13px', fontWeight: '600' }}
                    placeholder="e.g. Kazu Toh"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '500' }}>
                    Proposal Internal Reference Title
                  </label>
                  <input 
                    type="text"
                    className="input-field"
                    value={proposalData.proposalTitle}
                    onChange={(e) => setProposalData(prev => ({ ...prev, proposalTitle: e.target.value }))}
                    style={{ fontSize: '13px' }}
                    placeholder="e.g. Family Protection & Mission Risk Proposal"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '500' }}>
                    Status
                  </label>
                  <select
                    className="input-field"
                    value={proposalData.status}
                    onChange={(e) => setProposalData(prev => ({ ...prev, status: e.target.value }))}
                    style={{ fontSize: '13px', padding: '6px 10px' }}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Presented">Presented</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Revised">Revised</option>
                  </select>
                </div>
              </div>

              {/* Quick Family Member Filter Chips */}
              {familyQuickPicks.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Family Members Detected:
                  </span>
                  {familyQuickPicks.map((name, idx) => (
                    <span 
                      key={idx}
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '12px',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      👤 {name}
                    </span>
                  ))}
                </div>
              )}

              {/* Sections Editor */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={15} color="#ef4444" />
                    Planning Categories & Policy Line Items
                  </h3>
                  <button
                    type="button"
                    className="btn"
                    onClick={handleAddSection}
                    style={{
                      fontSize: '11.5px',
                      padding: '4px 10px',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Plus size={12} /> Add Planning Category
                  </button>
                </div>

                {proposalData.sections.map((section, sIdx) => (
                  <div 
                    key={section.id || sIdx}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px'
                    }}
                  >
                    {/* Section Top Header Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <input 
                          type="text"
                          className="input-field"
                          value={section.planningLevel}
                          onChange={(e) => handleUpdateSection(sIdx, 'planningLevel', e.target.value)}
                          placeholder="e.g. Risk Management - Hospitalization & Emergency Evacuation"
                          style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#60a5fa',
                            backgroundColor: 'rgba(0, 0, 0, 0.3)'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Placeholder Toggle */}
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                          <input 
                            type="checkbox"
                            checked={Boolean(section.customRowNote)}
                            onChange={(e) => {
                              handleUpdateSection(sIdx, 'customRowNote', e.target.checked ? 'To be discussed at a later date' : '');
                            }}
                          />
                          Future Stage (e.g. "To be discussed")
                        </label>

                        {/* Delete Section Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteSection(sIdx)}
                          className="btn-icon"
                          style={{ color: 'var(--text-muted)', padding: '5px' }}
                          title="Delete category"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Section Remarks & Notes */}
                    {!section.customRowNote ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '12px', alignItems: 'center' }}>
                        <div>
                          <input 
                            type="text"
                            className="input-field"
                            value={section.remarks || ''}
                            onChange={(e) => handleUpdateSection(sIdx, 'remarks', e.target.value)}
                            placeholder="Common Remarks: e.g. Deductible of $1,500 and Co-Insurance of 10% applies..."
                            style={{ fontSize: '11.5px', padding: '6px 10px' }}
                          />
                        </div>
                        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input 
                            type="checkbox"
                            checked={section.mergeRemarks !== false}
                            onChange={(e) => handleUpdateSection(sIdx, 'mergeRemarks', e.target.checked)}
                          />
                          Merge Remarks Column
                        </label>
                      </div>
                    ) : (
                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: 'rgba(59, 130, 246, 0.08)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: '500' }}>Custom Roadmap Note:</span>
                        <input 
                          type="text"
                          className="input-field"
                          value={section.customRowNote}
                          onChange={(e) => handleUpdateSection(sIdx, 'customRowNote', e.target.value)}
                          placeholder="e.g. To be discussed at a later date"
                          style={{ fontSize: '12px', padding: '4px 8px', flex: 1 }}
                        />
                      </div>
                    )}

                    {/* Items Table for this section */}
                    {!section.customRowNote && (
                      <div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '130px 1.4fr 1.4fr 1.1fr 100px 30px',
                          gap: '8px',
                          padding: '6px 8px',
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          fontWeight: '600',
                          borderBottom: '1px solid var(--border-light)'
                        }}>
                          <span>Person</span>
                          <span>Coverage Description</span>
                          <span>Plan Name</span>
                          <span>Sum Assured / Limit</span>
                          <span style={{ textAlign: 'right' }}>Annual ($)</span>
                          <span></span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                          {(section.items || []).map((item, iIdx) => (
                            <div 
                              key={item.id || iIdx}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '130px 1.4fr 1.4fr 1.1fr 100px 30px',
                                gap: '8px',
                                alignItems: 'center'
                              }}
                            >
                              <input 
                                type="text"
                                className="input-field"
                                value={item.person || ''}
                                onChange={(e) => handleUpdateItem(sIdx, iIdx, 'person', e.target.value)}
                                placeholder="e.g. Kazu"
                                style={{ fontSize: '11.5px', padding: '5px 8px' }}
                              />

                              <input 
                                type="text"
                                className="input-field"
                                value={item.coverage || ''}
                                onChange={(e) => handleUpdateItem(sIdx, iIdx, 'coverage', e.target.value)}
                                placeholder="e.g. Hospitalization Expenses - Kazu"
                                style={{ fontSize: '11.5px', padding: '5px 8px' }}
                              />

                              <input 
                                type="text"
                                className="input-field"
                                value={item.planName || ''}
                                onChange={(e) => handleUpdateItem(sIdx, iIdx, 'planName', e.target.value)}
                                placeholder="e.g. AIA Platinum International Health"
                                style={{ fontSize: '11.5px', padding: '5px 8px' }}
                              />

                              <input 
                                type="text"
                                className="input-field"
                                value={item.sumAssured || ''}
                                onChange={(e) => handleUpdateItem(sIdx, iIdx, 'sumAssured', e.target.value)}
                                placeholder="e.g. As Charged up to $1,500,000/Yr"
                                style={{ fontSize: '11.5px', padding: '5px 8px' }}
                              />

                              <input 
                                type="number"
                                step="0.01"
                                className="input-field"
                                value={item.annualPremium !== undefined ? item.annualPremium : ''}
                                onChange={(e) => handleUpdateItem(sIdx, iIdx, 'annualPremium', e.target.value)}
                                placeholder="0.00"
                                style={{ fontSize: '11.5px', padding: '5px 8px', textAlign: 'right', fontWeight: '600' }}
                              />

                              <button
                                type="button"
                                onClick={() => handleDeleteItem(sIdx, iIdx)}
                                className="btn-icon"
                                style={{ color: 'var(--text-muted)', padding: '4px' }}
                                title="Remove line item"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add line item button */}
                        <div style={{ marginTop: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleAddItem(sIdx)}
                            className="btn"
                            style={{
                              fontSize: '11px',
                              padding: '3px 8px',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              color: 'var(--text-secondary)',
                              border: '1px dashed var(--border-light)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Plus size={11} /> + Add Line Item to this Category
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Document Preview View */
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
              <div 
                style={{
                  width: '794px', // A4 width proportion
                  minHeight: '1123px', // A4 height proportion
                  backgroundColor: '#FFFFFF',
                  color: '#000000',
                  boxShadow: '0 10px 35px rgba(0,0,0,0.5)',
                  borderRadius: '4px',
                  padding: '40px 35px 35px 35px',
                  fontFamily: 'Arial, sans-serif',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxSizing: 'border-box'
                }}
              >
                <div>
                  {/* Client Centered Big Title */}
                  <div style={{
                    textAlign: 'center',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#000000',
                    margin: '10px 0 25px 0',
                    letterSpacing: '-0.3px'
                  }}>
                    {proposalData.clientName || 'Client Proposal'}
                  </div>

                  {/* Main Red-Header Proposal Table */}
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    border: '1px solid #111111',
                    fontSize: '9px',
                    lineHeight: '1.35',
                    tableLayout: 'fixed'
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: '#C00000', color: '#FFFFFF' }}>
                        <th style={{ border: '1px solid #111', padding: '9px 4px', width: '17%', textAlign: 'center', fontWeight: 'bold' }}>Planning Level</th>
                        <th style={{ border: '1px solid #111', padding: '9px 4px', width: '17%', textAlign: 'center', fontWeight: 'bold' }}>Coverage</th>
                        <th style={{ border: '1px solid #111', padding: '9px 4px', width: '19%', textAlign: 'center', fontWeight: 'bold' }}>Plan Name</th>
                        <th style={{ border: '1px solid #111', padding: '9px 4px', width: '16%', textAlign: 'center', fontWeight: 'bold' }}>Sum Assured</th>
                        <th style={{ border: '1px solid #111', padding: '9px 4px', width: '12%', textAlign: 'center', fontWeight: 'bold' }}>Annual Premium</th>
                        <th style={{ border: '1px solid #111', padding: '9px 4px', width: '19%', textAlign: 'center', fontWeight: 'bold' }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposalData.sections.map((sec, sIdx) => {
                        const items = sec.items || [];
                        const mergeRemarks = sec.mergeRemarks !== false;

                        if (sec.customRowNote) {
                          return (
                            <tr key={sIdx}>
                              <td style={{ border: '1px solid #111', padding: '9px 6px', textAlign: 'center', color: '#1E3A8A' }}>
                                {sec.planningLevel}
                              </td>
                              <td colSpan={5} style={{ border: '1px solid #111', padding: '12px 6px', textAlign: 'center', fontStyle: 'italic', color: '#2563EB' }}>
                                {sec.customRowNote}
                              </td>
                            </tr>
                          );
                        }

                        if (items.length === 0) {
                          return (
                            <tr key={sIdx}>
                              <td style={{ border: '1px solid #111', padding: '8px 6px', textAlign: 'center', color: '#1E3A8A' }}>{sec.planningLevel}</td>
                              <td style={{ border: '1px solid #111', padding: '8px 6px', textAlign: 'center', color: '#1E3A8A' }}>-</td>
                              <td style={{ border: '1px solid #111', padding: '8px 6px', textAlign: 'center', color: '#1E3A8A' }}>-</td>
                              <td style={{ border: '1px solid #111', padding: '8px 6px', textAlign: 'center', color: '#1E3A8A' }}>-</td>
                              <td style={{ border: '1px solid #111', padding: '8px 6px', textAlign: 'center', color: '#1E3A8A' }}>-</td>
                              <td style={{ border: '1px solid #111', padding: '8px 6px', textAlign: 'center', color: '#1E3A8A' }}>{sec.remarks || '-'}</td>
                            </tr>
                          );
                        }

                        return items.map((it, iIdx) => {
                          const isFirst = iIdx === 0;
                          return (
                            <tr key={`${sIdx}-${iIdx}`}>
                              {isFirst && (
                                <td 
                                  rowSpan={items.length}
                                  style={{ border: '1px solid #111', padding: '8px 6px', textAlign: 'center', color: '#1E3A8A', verticalAlign: 'middle', fontWeight: '500' }}
                                >
                                  {sec.planningLevel}
                                </td>
                              )}
                              <td style={{ border: '1px solid #111', padding: '8px 6px', textAlign: 'center', color: '#1E3A8A' }}>
                                {it.coverage || ''}
                              </td>
                              <td style={{ border: '1px solid #111', padding: '8px 6px', textAlign: 'center', color: '#1E3A8A' }}>
                                {it.planName || ''}
                              </td>
                              <td style={{ border: '1px solid #111', padding: '8px 6px', textAlign: 'center', color: '#1E3A8A' }}>
                                {it.sumAssured || ''}
                              </td>
                              <td style={{ border: '1px solid #111', padding: '8px 6px', textAlign: 'center', color: '#1E3A8A' }}>
                                {formatCurrency(it.annualPremium || 0)}
                              </td>
                              {mergeRemarks ? (
                                isFirst && (
                                  <td 
                                    rowSpan={items.length}
                                    style={{ border: '1px solid #111', padding: '8px 6px', textAlign: 'center', color: '#1E3A8A', verticalAlign: 'middle', fontSize: '8px' }}
                                  >
                                    {sec.remarks || it.remarks || ''}
                                  </td>
                                )
                              ) : (
                                <td style={{ border: '1px solid #111', padding: '8px 6px', textAlign: 'center', color: '#1E3A8A', fontSize: '8px' }}>
                                  {it.remarks || ''}
                                </td>
                              )}
                            </tr>
                          );
                        });
                      })}

                      {/* Clean empty row buffer matching uploaded sample */}
                      <tr style={{ height: '36px' }}>
                        <td style={{ border: '1px solid #111' }}>&nbsp;</td>
                        <td style={{ border: '1px solid #111' }}>&nbsp;</td>
                        <td style={{ border: '1px solid #111' }}>&nbsp;</td>
                        <td style={{ border: '1px solid #111' }}>&nbsp;</td>
                        <td style={{ border: '1px solid #111' }}>&nbsp;</td>
                        <td style={{ border: '1px solid #111' }}>&nbsp;</td>
                      </tr>

                      {/* Total Yearly Row */}
                      <tr style={{ fontWeight: 'bold' }}>
                        <td colSpan={3} style={{ border: '1px solid #111', borderRight: 'none', padding: '9px 6px', textAlign: 'right', fontSize: '12px' }}>
                          Total
                        </td>
                        <td colSpan={1} style={{ border: '1px solid #111', borderLeft: 'none', borderRight: 'none', padding: '9px 6px', textAlign: 'center', fontSize: '12px' }}>
                          Yearly
                        </td>
                        <td colSpan={2} style={{ border: '1px solid #111', borderLeft: 'none', padding: '9px 6px', textAlign: 'center', fontSize: '13px' }}>
                          {formatCurrency(calculatedTotal)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Footer Section */}
                <div style={{ marginTop: '25px', textAlign: 'center' }}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: '#C00000',
                    marginBottom: '10px',
                    letterSpacing: '0.2px'
                  }}>
                    {consultantSettings?.consultantName || 'Pieter Beetsma'} &nbsp;|&nbsp; {consultantSettings?.consultantTitle || 'Financial Services Consultant'} &nbsp;|&nbsp; {consultantSettings?.agencyName || 'AIA Singapore Private Limited'} &nbsp;|&nbsp; HP: {consultantSettings?.phone || '+65 9656 7678'}
                  </div>
                  <p style={{
                    fontSize: '7.8px',
                    lineHeight: '1.45',
                    color: '#333333',
                    textAlign: 'justify',
                    fontStyle: 'italic',
                    margin: 0
                  }}>
                    <strong>Disclaimer:</strong> This portfolio suggestion acts as a reference for your potential insurance cover and is designed based on information on your financial needs provided by you. It is not and does not form any part of an insurance contract(s). You should refer to your insurance policy contract(s) or insurer for the full terms and conditions of the coverage of each insurance policy. Whilst we endeavor to ensure that the information provided in this suggested portfolio is accurate, we make no representation or warranty of any kind as to the accuracy or completeness of the information or any part of it. Further, we accept no liability or responsibility for any loss or damage suffered as a result of direct or indirect use of the information contained in this suggestion.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions & Total Footer Bar */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(15, 23, 42, 0.95)'
        }}>
          {/* Left Financial Metrics */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Total Annual Premium</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                {formatCurrency(calculatedTotal)}<span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)' }}>/yr</span>
              </span>
            </div>

            <div style={{ width: '1px', height: '28px', backgroundColor: 'var(--border-light)' }} />

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Monthly Equivalent</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                ~{formatCurrency(monthlyEquivalent)}<span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)' }}>/mo</span>
              </span>
            </div>

            <div style={{ width: '1px', height: '28px', backgroundColor: 'var(--border-light)' }} />

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Categories / Items</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {proposalData.sections.length} Sections • {proposalData.sections.reduce((acc, s) => acc + (s.items?.length || 0), 0)} Policies
              </span>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="btn"
              onClick={handleCopyWhatsAppPitch}
              style={{
                fontSize: '12px',
                padding: '7px 14px',
                backgroundColor: copiedWhatsApp ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                color: copiedWhatsApp ? '#34d399' : 'var(--text-primary)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Copy WhatsApp friendly pitch text"
            >
              {copiedWhatsApp ? <Check size={14} /> : <Copy size={14} />}
              {copiedWhatsApp ? 'Copied WhatsApp!' : 'Copy WhatsApp Pitch'}
            </button>

            <button
              type="button"
              className="btn"
              onClick={handleSaveProposal}
              disabled={isSaving}
              style={{
                fontSize: '12px',
                padding: '7px 16px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '500'
              }}
            >
              <Save size={14} />
              {isSaving ? 'Saving...' : 'Save Proposal'}
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleExportPdf}
              disabled={isExporting}
              style={{
                fontSize: '12px',
                padding: '7px 20px',
                backgroundColor: '#dc2626',
                borderColor: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '600'
              }}
            >
              <Download size={14} />
              {isExporting ? 'Exporting PDF...' : 'Export A4 PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
