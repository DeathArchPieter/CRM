import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Plus, Trash2, FileText, Upload, CheckCircle2, Clock, AlertTriangle, 
  ExternalLink, Folder, Layers, DollarSign, Calendar, Sparkles, Building, User,
  FileCheck, Shield, ChevronRight, Check, ArrowRight, Receipt, Scale, BookOpen,
  Edit2, Loader2
} from 'lucide-react';
import DatePicker from './DatePicker';

const CLAIM_TYPES = [
  'Hospitalisation / Shield',
  'Critical Illness',
  'Accident & Medical',
  'Death / TPD',
  'Disability Income',
  'Travel / Other'
];

const CLAIM_STATUSES = [
  'Draft / Gathering Bills',
  'Submitted to Insurer',
  'Under Review',
  'Information Required',
  'Approved',
  'Partially Approved',
  'Declined',
  'Paid Out'
];

const CHECKLIST_TEMPLATES = {
  'Hospitalisation / Shield': [
    'Final Itemised Hospital Tax Invoice',
    'Inpatient Discharge Summary',
    'Doctor Medical Report / Memo',
    'Signed Inpatient Claim Form',
    'Pre/Post-Hospitalisation Clinic Receipts'
  ],
  'Critical Illness': [
    'Attending Physician Medical Report',
    'Histology / Biopsy / Pathology Lab Report',
    'Diagnostic Radiology / MRI / CT Scans',
    'Signed Critical Illness Claim Form',
    'Specialist Clinical Summary'
  ],
  'Accident & Medical': [
    'Emergency Department Discharge Summary',
    'Itemised Clinic & Medical Receipts',
    'Accident Description & Incident Report',
    'Signed A&H Claim Form',
    'Physiotherapy / TCM Referral & Invoices'
  ],
  'Death / TPD': [
    'Certified True Copy of Death Certificate',
    'Grant of Probate / Letters of Administration',
    'Medical Report on Total Permanent Disability',
    'Claimant Identity Documents (NRIC/Passport)',
    'Original Policy Documents / Discharge Voucher'
  ]
};

export default function ClaimModal({ client, policies = [], claim, isOpen, onClose, onSave, onOpenAiReconciler }) {
  // 4-Tab Step-by-Step Workflow:
  // Step 1: 'event' (Event Details & Policy Link)
  // Step 2: 'bills' (Tag Bills & Receipts Ledger)
  // Step 3: 'reconciliation' (Settlement & Payout Reconciliation)
  // Step 4: 'vault' (Document Vault & Case Timeline)
  const [activeTab, setActiveTab] = useState('event');
  const [uploadingDocId, setUploadingDocId] = useState(null);

  // Core Form State
  const [formData, setFormData] = useState({
    id: claim?.id || '',
    clientId: client?.id || '',
    policyId: claim?.policyId || (policies[0]?.id || ''),
    additionalPolicyIds: claim?.additionalPolicyIds || [],
    claimNumber: claim?.claimNumber || '',
    claimType: claim?.claimType || 'Hospitalisation / Shield',
    title: claim?.title || '',
    incidentDate: claim?.incidentDate || '',
    admissionDate: claim?.admissionDate || '',
    dischargeDate: claim?.dischargeDate || '',
    hospitalOrClinic: claim?.hospitalOrClinic || '',
    doctorName: claim?.doctorName || '',
    status: claim?.status || 'Draft / Gathering Bills',
    
    // High level totals
    totalIncurredAmount: claim?.totalIncurredAmount || 0,
    claimedAmount: claim?.claimedAmount || 0,
    approvedAmount: claim?.approvedAmount || 0,
    deductibleOrCoPay: claim?.deductibleOrCoPay || 0,
    medisaveOffset: claim?.medisaveOffset || 0,
    payoutDate: claim?.payoutDate || '',
    payoutMethod: claim?.payoutMethod || 'Direct Bank Credit / PayNow',

    // Sub collections
    billItems: claim?.billItems || [],
    settlementEntries: claim?.settlementEntries || [],
    documentChecklist: claim?.documentChecklist || [],
    timelineNotes: claim?.timelineNotes || []
  });

  // State for adding new Bill item (Step 2)
  const [newBill, setNewBill] = useState({
    billDate: new Date().toISOString().split('T')[0],
    provider: '',
    description: '',
    billNumber: '',
    incurredAmount: '',
    claimedAmount: '',
    insurerPaidAmount: '',
    deductibleOrCoPay: '',
    medisaveOffset: '',
    status: 'Pending Insurer Payout',
    notes: ''
  });
  const [isAddingBill, setIsAddingBill] = useState(false);
  const [editingBillId, setEditingBillId] = useState(null);

  // State for Drag & Drop Bill Auto-Tagging (Step 2)
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isAutoTagging, setIsAutoTagging] = useState(false);
  const [taggingProgress, setTaggingProgress] = useState({ total: 0, current: 0, currentFileName: '', successCount: 0 });
  const [autoTagNotification, setAutoTagNotification] = useState(null);
  const fileInputRef = useRef(null);

  // State for adding new Settlement entry (Step 3)
  const [newSettlement, setNewSettlement] = useState({
    settlementDate: new Date().toISOString().split('T')[0],
    insurerRef: '',
    totalPaid: '',
    coPayDeductible: '',
    nonPayableAmount: '',
    paymentMethod: 'Direct Bank Credit / PayNow',
    notes: ''
  });
  const [isAddingSettlement, setIsAddingSettlement] = useState(false);

  // State for new timeline note
  const [newNoteText, setNewNoteText] = useState('');

  // State for custom checklist item
  const [customChecklistLabel, setCustomChecklistLabel] = useState('');

  useEffect(() => {
    if (claim) {
      setFormData({
        ...claim,
        id: claim.id || crypto.randomUUID(),
        billItems: claim.billItems || [],
        settlementEntries: claim.settlementEntries || [],
        documentChecklist: claim.documentChecklist || [],
        timelineNotes: claim.timelineNotes || []
      });
    } else {
      // New Claim defaults
      const initialTemplate = CHECKLIST_TEMPLATES['Hospitalisation / Shield'] || [];
      const newClaimId = crypto.randomUUID();
      setFormData({
        id: newClaimId,
        clientId: client?.id || '',
        policyId: policies[0]?.id || '',
        additionalPolicyIds: [],
        claimNumber: '',
        claimType: 'Hospitalisation / Shield',
        title: '',
        incidentDate: new Date().toISOString().split('T')[0],
        admissionDate: '',
        dischargeDate: '',
        hospitalOrClinic: '',
        doctorName: '',
        status: 'Draft / Gathering Bills',
        totalIncurredAmount: 0,
        claimedAmount: 0,
        approvedAmount: 0,
        deductibleOrCoPay: 0,
        medisaveOffset: 0,
        payoutDate: '',
        payoutMethod: 'Direct Bank Credit / PayNow',
        billItems: [],
        settlementEntries: [],
        documentChecklist: initialTemplate.map(label => ({
          id: crypto.randomUUID(),
          label,
          required: true,
          status: 'Pending'
        })),
        timelineNotes: [
          {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            stage: 'Draft / Gathering Bills',
            note: 'Claim event created in CRM',
            author: 'Advisor'
          }
        ]
      });
    }
  }, [claim, client, policies]);

  // Recalculate summary totals whenever billItems or settlementEntries change
  useEffect(() => {
    if (formData.billItems.length > 0) {
      const sumIncurred = formData.billItems.reduce((sum, b) => sum + (Number(b.incurredAmount) || 0), 0);
      const sumClaimed = formData.billItems.reduce((sum, b) => sum + (Number(b.claimedAmount) || 0), 0);
      const sumPaidBills = formData.billItems.reduce((sum, b) => sum + (Number(b.insurerPaidAmount) || 0), 0);
      const sumCoPayBills = formData.billItems.reduce((sum, b) => sum + (Number(b.deductibleOrCoPay) || 0), 0);
      const sumMedisave = formData.billItems.reduce((sum, b) => sum + (Number(b.medisaveOffset) || 0), 0);

      // If settlements exist, they override/complement total insurer paid
      const sumSettlementPaid = formData.settlementEntries.reduce((sum, s) => sum + (Number(s.totalPaid) || 0), 0);
      const sumSettlementCoPay = formData.settlementEntries.reduce((sum, s) => sum + (Number(s.coPayDeductible) || 0), 0);

      const finalPaid = sumSettlementPaid > 0 ? sumSettlementPaid : sumPaidBills;
      const finalCoPay = sumSettlementCoPay > 0 ? sumSettlementCoPay : sumCoPayBills;

      setFormData(prev => ({
        ...prev,
        totalIncurredAmount: sumIncurred,
        claimedAmount: sumClaimed > 0 ? sumClaimed : sumIncurred,
        approvedAmount: finalPaid,
        deductibleOrCoPay: finalCoPay,
        medisaveOffset: sumMedisave
      }));
    }
  }, [formData.billItems, formData.settlementEntries]);

  if (!isOpen) return null;

  // Formatters
  const formatCurrency = (val) => {
    if (!val) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(val);
  };

  const handleApplyTemplate = (typeKey) => {
    const list = CHECKLIST_TEMPLATES[typeKey] || [];
    const newItems = list.map(label => ({
      id: crypto.randomUUID(),
      label,
      required: true,
      status: 'Pending'
    }));
    setFormData(prev => ({
      ...prev,
      documentChecklist: [...prev.documentChecklist, ...newItems]
    }));
  };

  const handleAddCustomChecklistItem = (e) => {
    e.preventDefault();
    if (!customChecklistLabel.trim()) return;
    setFormData(prev => ({
      ...prev,
      documentChecklist: [
        ...prev.documentChecklist,
        {
          id: crypto.randomUUID(),
          label: customChecklistLabel.trim(),
          required: false,
          status: 'Pending'
        }
      ]
    }));
    setCustomChecklistLabel('');
  };

  const handleToggleDocStatus = (docId) => {
    setFormData(prev => ({
      ...prev,
      documentChecklist: prev.documentChecklist.map(d => {
        if (d.id === docId) {
          const nextStatus = d.status === 'Pending' ? 'Uploaded / Received' : d.status === 'Uploaded / Received' ? 'Waived' : 'Pending';
          return { ...d, status: nextStatus };
        }
        return d;
      })
    }));
  };

  const handleAttachDocumentFile = async (docId, customName) => {
    if (!window.electronAPI?.attachClaimDocument) return;
    setUploadingDocId(docId);
    try {
      const claimId = formData.id || 'temp_' + Date.now();
      const res = await window.electronAPI.attachClaimDocument({
        clientId: client.id,
        claimId,
        customFileName: customName || 'Claim_Doc'
      });
      if (res.success && res.file) {
        setFormData(prev => ({
          ...prev,
          documentChecklist: prev.documentChecklist.map(d => {
            if (d.id === docId) {
              return {
                ...d,
                status: 'Uploaded / Received',
                filePath: res.file.filePath,
                fileName: res.file.fileName,
                fileSize: res.file.fileSize
              };
            }
            return d;
          })
        }));
      }
    } catch (err) {
      console.error("Error attaching document:", err);
    } finally {
      setUploadingDocId(null);
    }
  };

  const handleAttachBillFile = async (billId) => {
    if (!window.electronAPI?.attachClaimDocument) return;
    try {
      const claimId = formData.id || 'temp_' + Date.now();
      const res = await window.electronAPI.attachClaimDocument({
        clientId: client.id,
        claimId,
        customFileName: 'Bill_Receipt'
      });
      if (res.success && res.file) {
        setFormData(prev => ({
          ...prev,
          billItems: prev.billItems.map(b => b.id === billId ? { ...b, receiptFilePath: res.file.filePath, receiptFileName: res.file.fileName } : b)
        }));
      }
    } catch (err) {
      console.error("Error attaching bill file:", err);
    }
  };

  const handleAttachSettlementFile = async (settlementId) => {
    if (!window.electronAPI?.attachClaimDocument) return;
    try {
      const claimId = formData.id || 'temp_' + Date.now();
      const res = await window.electronAPI.attachClaimDocument({
        clientId: client.id,
        claimId,
        customFileName: 'Settlement_Letter'
      });
      if (res.success && res.file) {
        setFormData(prev => ({
          ...prev,
          settlementEntries: prev.settlementEntries.map(s => s.id === settlementId ? { ...s, settlementLetterFilePath: res.file.filePath, settlementFileName: res.file.fileName } : s)
        }));
      }
    } catch (err) {
      console.error("Error attaching settlement letter:", err);
    }
  };

  const handleOpenFile = (filePath) => {
    if (!filePath || !window.electronAPI?.openPath) return;
    window.electronAPI.openPath(filePath);
  };

  const handleOpenClaimFolder = () => {
    if (!window.electronAPI?.openClaimFolder) return;
    window.electronAPI.openClaimFolder({
      clientId: client.id,
      claimId: formData.id || 'general'
    });
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result;
      const comma = typeof res === 'string' ? res.indexOf(',') : -1;
      resolve(comma !== -1 ? res.substring(comma + 1) : res);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleProcessBills = async (files) => {
    const allowedExts = ['pdf', 'png', 'jpg', 'jpeg', 'webp'];
    const validFiles = files.filter(f => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return allowedExts.includes(ext);
    });

    if (validFiles.length === 0) {
      alert("Please upload medical bills in PDF, PNG, JPG, or WEBP format.");
      return;
    }

    const currentClaimId = formData.id || crypto.randomUUID();
    if (!formData.id) {
      setFormData(prev => ({ ...prev, id: currentClaimId }));
    }

    setIsAutoTagging(true);
    setTaggingProgress({
      total: validFiles.length,
      current: 0,
      currentFileName: validFiles[0]?.name || '',
      successCount: 0
    });

    let successCount = 0;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      setTaggingProgress(prev => ({
        ...prev,
        current: i + 1,
        currentFileName: file.name
      }));

      try {
        const filePath = window.electronAPI?.getPathForFile ? window.electronAPI.getPathForFile(file) : (file.path || '');
        const base64 = await fileToBase64(file);

        if (window.electronAPI?.autoTagClaimBill) {
          const res = await window.electronAPI.autoTagClaimBill({
            clientId: client?.id || 'general',
            claimId: currentClaimId,
            fileName: file.name,
            fileType: file.type || file.name.split('.').pop(),
            filePath,
            fileBase64: base64
          });

          if (res?.success && res.billItem) {
            successCount++;
            setFormData(prev => ({
              ...prev,
              id: currentClaimId,
              billItems: [...prev.billItems, res.billItem]
            }));
          }
        }
      } catch (err) {
        console.error("Error auto-tagging bill:", file.name, err);
      }
    }

    setIsAutoTagging(false);
    setTaggingProgress({ total: 0, current: 0, currentFileName: '', successCount: 0 });

    if (successCount > 0) {
      setAutoTagNotification({
        message: `Successfully auto-tagged & vaulted ${successCount} ${successCount === 1 ? 'bill' : 'bills'}!`,
        count: successCount
      });
      setTimeout(() => {
        setAutoTagNotification(null);
      }, 6000);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      await handleProcessBills(files);
    }
  };

  const handleFileInputChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await handleProcessBills(files);
    }
    e.target.value = '';
  };

  const handleAddBillItem = (e) => {
    e.preventDefault();
    if (!newBill.description || !newBill.incurredAmount) return;

    if (editingBillId) {
      setFormData(prev => ({
        ...prev,
        billItems: prev.billItems.map(b => b.id === editingBillId ? {
          ...b,
          billDate: newBill.billDate,
          provider: newBill.provider || b.provider || 'Clinic / Hospital',
          description: newBill.description,
          billNumber: newBill.billNumber,
          incurredAmount: Number(newBill.incurredAmount) || 0,
          claimedAmount: Number(newBill.claimedAmount) || Number(newBill.incurredAmount) || 0,
          status: newBill.status || b.status,
          notes: newBill.notes || ''
        } : b)
      }));
      setEditingBillId(null);
    } else {
      const item = {
        id: crypto.randomUUID(),
        billDate: newBill.billDate,
        provider: newBill.provider || formData.hospitalOrClinic || 'Clinic / Hospital',
        description: newBill.description,
        billNumber: newBill.billNumber,
        incurredAmount: Number(newBill.incurredAmount) || 0,
        claimedAmount: Number(newBill.claimedAmount) || Number(newBill.incurredAmount) || 0,
        insurerPaidAmount: Number(newBill.insurerPaidAmount) || 0,
        deductibleOrCoPay: Number(newBill.deductibleOrCoPay) || 0,
        medisaveOffset: Number(newBill.medisaveOffset) || 0,
        status: newBill.status || 'Pending Insurer Payout',
        notes: newBill.notes || ''
      };
      setFormData(prev => ({
        ...prev,
        billItems: [...prev.billItems, item]
      }));
    }

    setNewBill({
      billDate: new Date().toISOString().split('T')[0],
      provider: '',
      description: '',
      billNumber: '',
      incurredAmount: '',
      claimedAmount: '',
      insurerPaidAmount: '',
      deductibleOrCoPay: '',
      medisaveOffset: '',
      status: 'Pending Insurer Payout',
      notes: ''
    });
    setIsAddingBill(false);
  };

  const handleEditBill = (item) => {
    setNewBill({
      billDate: item.billDate || new Date().toISOString().split('T')[0],
      provider: item.provider || '',
      description: item.description || '',
      billNumber: item.billNumber || '',
      incurredAmount: item.incurredAmount || '',
      claimedAmount: item.claimedAmount || '',
      insurerPaidAmount: item.insurerPaidAmount || '',
      deductibleOrCoPay: item.deductibleOrCoPay || '',
      medisaveOffset: item.medisaveOffset || '',
      status: item.status || 'Pending Insurer Payout',
      notes: item.notes || ''
    });
    setEditingBillId(item.id);
    setIsAddingBill(true);
  };

  const handleCancelBillEdit = () => {
    setEditingBillId(null);
    setIsAddingBill(false);
    setNewBill({
      billDate: new Date().toISOString().split('T')[0],
      provider: '',
      description: '',
      billNumber: '',
      incurredAmount: '',
      claimedAmount: '',
      insurerPaidAmount: '',
      deductibleOrCoPay: '',
      medisaveOffset: '',
      status: 'Pending Insurer Payout',
      notes: ''
    });
  };

  const handleDeleteBillItem = (billId) => {
    setFormData(prev => ({
      ...prev,
      billItems: prev.billItems.filter(b => b.id !== billId)
    }));
  };

  const handleAddSettlement = (e) => {
    e.preventDefault();
    if (!newSettlement.totalPaid) return;
    const entry = {
      id: crypto.randomUUID(),
      settlementDate: newSettlement.settlementDate,
      insurerRef: newSettlement.insurerRef,
      totalPaid: Number(newSettlement.totalPaid) || 0,
      coPayDeductible: Number(newSettlement.coPayDeductible) || 0,
      nonPayableAmount: Number(newSettlement.nonPayableAmount) || 0,
      paymentMethod: newSettlement.paymentMethod || 'Direct Bank Credit / PayNow',
      notes: newSettlement.notes || ''
    };
    setFormData(prev => ({
      ...prev,
      settlementEntries: [...prev.settlementEntries, entry]
    }));
    setNewSettlement({
      settlementDate: new Date().toISOString().split('T')[0],
      insurerRef: '',
      totalPaid: '',
      coPayDeductible: '',
      nonPayableAmount: '',
      paymentMethod: 'Direct Bank Credit / PayNow',
      notes: ''
    });
    setIsAddingSettlement(false);
  };

  const handleDeleteSettlement = (settlementId) => {
    setFormData(prev => ({
      ...prev,
      settlementEntries: prev.settlementEntries.filter(s => s.id !== settlementId)
    }));
  };

  const handleAddTimelineNote = (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const note = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      stage: formData.status,
      note: newNoteText.trim(),
      author: 'Advisor'
    };
    setFormData(prev => ({
      ...prev,
      timelineNotes: [note, ...(prev.timelineNotes || [])]
    }));
    setNewNoteText('');
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  // Reconciliation Calculations (Step 3)
  const totalIncurred = Number(formData.totalIncurredAmount) || 0;
  const totalClaimed = Number(formData.claimedAmount) || 0;
  const totalInsurerPaid = Number(formData.approvedAmount) || 0;
  const totalCoPay = Number(formData.deductibleOrCoPay) || 0;
  const totalMedisave = Number(formData.medisaveOffset) || 0;
  
  // Outstanding or Unaccounted Difference = Total Incurred - (Insurer Paid + CoPay + Medisave)
  const totalAccountedFor = totalInsurerPaid + totalCoPay + totalMedisave;
  const unaccountedDifference = Math.round((totalIncurred - totalAccountedFor) * 100) / 100;
  const isFullyReconciled = totalIncurred > 0 && unaccountedDifference === 0;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(6px)',
      zIndex: 150,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div 
        className="glass-panel animate-fade-in" 
        onDragOver={(e) => {
          if (activeTab === 'bills') {
            e.preventDefault();
            setIsDraggingOver(true);
          }
        }}
        onDragLeave={(e) => {
          if (activeTab === 'bills' && !e.currentTarget.contains(e.relatedTarget)) {
            setIsDraggingOver(false);
          }
        }}
        onDrop={(e) => {
          if (activeTab === 'bills') {
            handleDrop(e);
          }
        }}
        style={{
        width: '100%',
        maxWidth: '1020px',
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid var(--border-light)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.02)'
        }}>
          <div>
            <h2 style={{ fontSize: '19px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={22} color="var(--accent-primary)" />
              {claim?.id ? 'Claims Event & Payout Reconciliation' : 'Initiate New Claims Event'}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Client: <strong style={{ color: 'var(--text-primary)' }}>{client?.fullName}</strong> • Status: <span style={{ color: 'var(--accent-secondary)' }}>{formData.status}</span>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
              onClick={handleOpenClaimFolder}
              title="Open Claim Documents Folder in Windows Explorer"
            >
              <Folder size={14} /> Vault Folder
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 4-Step Tab Navigation Bar */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-light)',
          backgroundColor: 'rgba(255,255,255,0.01)',
          padding: '0 16px'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('event')}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'event' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'event' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'event' ? '600' : '400',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <BookOpen size={15} /> 1. Claim Event Details
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bills')}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'bills' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'bills' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'bills' ? '600' : '400',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Receipt size={15} /> 2. Tagged Bills Ledger
            {formData.billItems.length > 0 && (
              <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '10px', backgroundColor: 'rgba(139, 92, 246, 0.2)', color: 'var(--accent-primary)' }}>
                {formData.billItems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reconciliation')}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'reconciliation' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'reconciliation' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'reconciliation' ? '600' : '400',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Scale size={15} /> 3. Settlement & Reconciliation
            {isFullyReconciled && (
              <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-success)' }}>
                Reconciled
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vault')}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'vault' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'vault' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'vault' ? '600' : '400',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FileText size={15} /> 4. Document Vault & Notes
            <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
              {formData.documentChecklist.filter(d => d.status === 'Uploaded / Received').length}/{formData.documentChecklist.length}
            </span>
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleFormSubmit} style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* STEP 1: CLAIM EVENT & POLICY LINK */}
          {activeTab === 'event' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                padding: '14px 18px',
                borderRadius: '10px',
                backgroundColor: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: '1.5'
              }}>
                <strong style={{ color: 'var(--text-primary)' }}>Step 1 — Create Claims Event:</strong> Define the overarching incident or medical event (e.g. hospitalization, surgery, CI diagnosis, accident). After creating the event container, you can tag multiple clinic bills and settlement receipts in Step 2 & 3.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Event Title / Condition / Diagnosis *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Left Knee Arthroscopy & Meniscus Tear or Acute Appendicitis"
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
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Linked In-Force Policy *</label>
                  <select
                    className="input-field"
                    style={{ width: '100%' }}
                    value={formData.policyId}
                    onChange={(e) => setFormData({ ...formData, policyId: e.target.value })}
                  >
                    <option value="">-- Select Policy --</option>
                    {policies.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.provider} • {p.policyName} ({p.policyNumber || 'No Policy#'}) {p.insuredType === 'Dependent' ? `[👶 Insured: ${p.insuredName || 'Dependent'} (${p.insuredRelationship || 'Family'})]` : '[👤 Self]'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Claims Event Type *</label>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Date of Incident / Diagnosis</label>
                  <DatePicker
                    value={formData.incidentDate || ''}
                    onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Hospital Admission Date</label>
                  <DatePicker
                    value={formData.admissionDate || ''}
                    onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Hospital Discharge Date</label>
                  <DatePicker
                    value={formData.dischargeDate || ''}
                    onChange={(e) => setFormData({ ...formData, dischargeDate: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Hospital / Specialist Clinic</label>
                  <input
                    type="text"
                    placeholder="e.g. Mount Elizabeth Novena Hospital"
                    className="input-field"
                    style={{ width: '100%' }}
                    value={formData.hospitalOrClinic}
                    onChange={(e) => setFormData({ ...formData, hospitalOrClinic: e.target.value })}
                  />
                </div>

                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Attending Doctor / Surgeon</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Keith Tan (Orthopaedic Surgeon)"
                    className="input-field"
                    style={{ width: '100%' }}
                    value={formData.doctorName}
                    onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                  onClick={() => setActiveTab('bills')}
                >
                  Proceed to Step 2: Tag Bills <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: TAGGED BILLS & RECEIPTS LEDGER */}
          {activeTab === 'bills' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                padding: '14px 18px',
                borderRadius: '10px',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: '1.5'
              }}>
                <strong style={{ color: 'var(--text-primary)' }}>Step 2 — Tag Bills to this Event:</strong> Drag & drop medical receipts or clinic invoices directly into the workspace. The AI automatically scans each bill, tags the date, clinic provider, procedure, invoice #, and amounts, and stores the receipt in the client claim vault.
              </div>

              {/* Bills Summary KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Tagged Bills</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
                    {formData.billItems.length} {formData.billItems.length === 1 ? 'Bill' : 'Bills'}
                  </div>
                </div>

                <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Incurred Bills ($)</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
                    {formatCurrency(totalIncurred)}
                  </div>
                </div>

                <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Submitted Amount ($)</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#60a5fa', marginTop: '4px' }}>
                    {formatCurrency(totalClaimed)}
                  </div>
                </div>
              </div>

              {/* Drag & Drop Medical Bills Auto-Tag Zone */}
              <div
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: isDraggingOver ? '2px dashed var(--accent-primary)' : '2px dashed rgba(139, 92, 246, 0.35)',
                  borderRadius: '12px',
                  padding: '24px 20px',
                  textAlign: 'center',
                  backgroundColor: isDraggingOver ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.03)',
                  boxShadow: isDraggingOver ? '0 0 25px rgba(139, 92, 246, 0.3)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  style={{ display: 'none' }}
                  onChange={handleFileInputChange}
                />
                
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: isDraggingOver ? 'var(--accent-primary)' : 'rgba(139, 92, 246, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isDraggingOver ? '#fff' : 'var(--accent-primary)',
                  transition: 'all 0.2s ease'
                }}>
                  <Sparkles size={22} />
                </div>

                <div style={{ fontSize: '14.5px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {isDraggingOver ? 'Drop bills here to auto-tag with AI!' : 'Drag & Drop Medical Bills or Clinic Invoices Here'}
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '580px', margin: 0, lineHeight: '1.4' }}>
                  Drag one or a bunch of bills (PDF, PNG, JPG, WEBP). Archie AI extracts provider, procedure, invoice #, and amounts automatically.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                  <span className="btn btn-secondary" style={{ fontSize: '11.5px', padding: '5px 14px', pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Upload size={13} /> Or Click to Browse Files
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    • Multi-file batch tagging supported
                  </span>
                </div>
              </div>

              {/* Batch Processing Status Card */}
              {isAutoTagging && (
                <div className="glass-panel animate-fade-in" style={{
                  padding: '16px 20px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.35)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="animate-spin" style={{ color: 'var(--accent-primary)', display: 'flex' }}>
                        <Loader2 size={18} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        ⚡ Archie AI Auto-Tagging in Progress... ({taggingProgress.current} of {taggingProgress.total} completed)
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: '700' }}>
                      {taggingProgress.total > 0 ? Math.round((taggingProgress.current / taggingProgress.total) * 100) : 0}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${taggingProgress.total > 0 ? (taggingProgress.current / taggingProgress.total) * 100 : 0}%`,
                      height: '100%',
                      backgroundColor: 'var(--accent-primary)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>

                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Analyzing document:</span>
                    <strong style={{ color: 'var(--text-secondary)' }}>{taggingProgress.currentFileName}</strong>
                  </div>
                </div>
              )}

              {/* Success Notification Alert */}
              {autoTagNotification && (
                <div className="animate-fade-in" style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: 'var(--accent-success)',
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} />
                    <span>{autoTagNotification.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoTagNotification(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-success)', cursor: 'pointer', opacity: 0.7 }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Add Bill Button / Inline Form Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Receipt size={16} color="var(--accent-primary)" />
                  Tagged Bills & Clinic Invoices
                </h3>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ fontSize: '12px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => {
                    setEditingBillId(null);
                    setIsAddingBill(true);
                  }}
                >
                  <Plus size={14} /> Tag Manual Bill
                </button>
              </div>

              {/* Inline Add/Edit Bill Form */}
              {isAddingBill && (
                <div className="glass-panel animate-fade-in" style={{ padding: '18px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                  <h4 style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {editingBillId ? 'Edit Tagged Clinic / Hospital Bill' : 'Tag New Clinic / Hospital Bill to Event'}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="input-label" style={{ fontSize: '11px' }}>Bill / Invoice Date *</label>
                      <DatePicker
                        style={{ width: '100%', fontSize: '12px', padding: '6px 10px' }}
                        value={newBill.billDate}
                        onChange={(e) => setNewBill({ ...newBill, billDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="input-label" style={{ fontSize: '11px' }}>Description / Treatment Procedure *</label>
                      <input
                        type="text"
                        placeholder="e.g. Pre-op MRI Scan or Surgery Hospital Bill"
                        className="input-field"
                        style={{ width: '100%', fontSize: '12px' }}
                        value={newBill.description}
                        onChange={(e) => setNewBill({ ...newBill, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="input-label" style={{ fontSize: '11px' }}>Clinic / Provider</label>
                      <input
                        type="text"
                        placeholder="e.g. Novena Specialist Imaging"
                        className="input-field"
                        style={{ width: '100%', fontSize: '12px' }}
                        value={newBill.provider}
                        onChange={(e) => setNewBill({ ...newBill, provider: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                    <div>
                      <label className="input-label" style={{ fontSize: '11px' }}>Bill / Tax Invoice No.</label>
                      <input
                        type="text"
                        placeholder="INV-2026-XXXX"
                        className="input-field"
                        style={{ width: '100%', fontSize: '12px' }}
                        value={newBill.billNumber}
                        onChange={(e) => setNewBill({ ...newBill, billNumber: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="input-label" style={{ fontSize: '11px' }}>Incurred Amount ($) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="input-field"
                        style={{ width: '100%', fontSize: '12px' }}
                        value={newBill.incurredAmount}
                        onChange={(e) => setNewBill({ ...newBill, incurredAmount: e.target.value, claimedAmount: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="input-label" style={{ fontSize: '11px' }}>Amount Claimed ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="input-field"
                        style={{ width: '100%', fontSize: '12px' }}
                        value={newBill.claimedAmount}
                        onChange={(e) => setNewBill({ ...newBill, claimedAmount: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="input-label" style={{ fontSize: '11px' }}>Submission Status</label>
                      <select
                        className="input-field"
                        style={{ width: '100%', fontSize: '12px' }}
                        value={newBill.status}
                        onChange={(e) => setNewBill({ ...newBill, status: e.target.value })}
                      >
                        <option value="Pending Insurer Payout">Pending Submission</option>
                        <option value="Submitted to Insurer">Submitted to Insurer</option>
                        <option value="Fully Paid">Fully Paid / Settled</option>
                        <option value="Partially Paid">Partially Paid</option>
                        <option value="Disallowed / Non-Reimbursable">Disallowed</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                      onClick={handleCancelBillEdit}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ fontSize: '12px', padding: '6px 16px' }}
                      onClick={handleAddBillItem}
                    >
                      {editingBillId ? 'Update Bill' : 'Tag Bill'}
                    </button>
                  </div>
                </div>
              )}

              {/* Tagged Bills Table */}
              {formData.billItems.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '10px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No bills tagged to this event yet. Drag and drop bills into the box above or click "Tag Manual Bill".
                </div>
              ) : (
                <div style={{ border: '1px solid var(--border-light)', borderRadius: '10px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-light)' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-secondary)' }}>Date</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-secondary)' }}>Provider & Treatment</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-secondary)' }}>Invoice #</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>Incurred ($)</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>Claimed ($)</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-secondary)' }}>Status</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>Receipt File</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.billItems.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{item.billDate || '-'}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontWeight: '500' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{item.description}</span>
                              {item.aiTagged && (
                                <span style={{
                                  fontSize: '10px',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  backgroundColor: 'rgba(139, 92, 246, 0.2)',
                                  color: 'var(--accent-primary)',
                                  fontWeight: '600',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}>
                                  <Sparkles size={10} /> AI
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.provider}</div>
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{item.billNumber || '-'}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: '600' }}>
                            {formatCurrency(item.incurredAmount)}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: '#60a5fa' }}>
                            {formatCurrency(item.claimedAmount)}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: '500',
                              backgroundColor: item.status === 'Fully Paid' ? 'rgba(16, 185, 129, 0.15)' : item.status === 'Submitted to Insurer' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.05)',
                              color: item.status === 'Fully Paid' ? 'var(--accent-success)' : item.status === 'Submitted to Insurer' ? '#60a5fa' : 'var(--text-muted)'
                            }}>
                              {item.status}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            {item.receiptFilePath ? (
                              <button
                                type="button"
                                className="btn"
                                style={{ padding: '3px 8px', fontSize: '11px', backgroundColor: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-primary)' }}
                                onClick={() => handleOpenFile(item.receiptFilePath)}
                              >
                                📄 View
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn"
                                style={{ padding: '3px 8px', fontSize: '11px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}
                                onClick={() => handleAttachBillFile(item.id)}
                              >
                                📎 Attach
                              </button>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => handleEditBill(item)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: 0.7 }}
                                title="Edit Bill Details"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBillItem(item.id)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: 0.6 }}
                                title="Delete Bill"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                  onClick={() => setActiveTab('reconciliation')}
                >
                  Proceed to Step 3: Reconciliation <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SETTLEMENT & PAYOUT RECONCILIATION */}
          {activeTab === 'reconciliation' && (
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            </div>
          )}

          {/* STEP 4: DOCUMENT VAULT & CASE NOTES */}
          {activeTab === 'vault' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    Physical Document Vault & Medical Files
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    All attached files are stored locally in your CRM vault for instant retrieval at any time.
                  </p>
                </div>

                {/* Template Preset Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn"
                    style={{ fontSize: '11px', padding: '6px 10px', backgroundColor: 'rgba(255,255,255,0.05)' }}
                    onClick={() => handleApplyTemplate('Hospitalisation / Shield')}
                  >
                    + Shield Preset
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{ fontSize: '11px', padding: '6px 10px', backgroundColor: 'rgba(255,255,255,0.05)' }}
                    onClick={() => handleApplyTemplate('Critical Illness')}
                  >
                    + CI Preset
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{ fontSize: '11px', padding: '6px 10px', backgroundColor: 'rgba(255,255,255,0.05)' }}
                    onClick={() => handleApplyTemplate('Accident & Medical')}
                  >
                    + Accident Preset
                  </button>
                </div>
              </div>

              {/* Checklist Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {formData.documentChecklist.map(doc => (
                  <div
                    key={doc.id}
                    style={{
                      padding: '14px 18px',
                      borderRadius: '10px',
                      backgroundColor: doc.status === 'Uploaded / Received' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)',
                      border: doc.status === 'Uploaded / Received' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-light)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleDocStatus(doc.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: doc.status === 'Uploaded / Received' ? 'var(--accent-success)' : doc.status === 'Waived' ? 'var(--text-muted)' : 'var(--text-secondary)'
                        }}
                      >
                        {doc.status === 'Uploaded / Received' ? (
                          <CheckCircle2 size={20} color="var(--accent-success)" />
                        ) : (
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--text-muted)' }} />
                        )}
                      </button>

                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: '500', color: 'var(--text-primary)' }}>
                          {doc.label}
                          {doc.required && <span style={{ color: '#f87171', marginLeft: '4px' }}>*</span>}
                        </div>
                        {doc.fileName && (
                          <div style={{ fontSize: '11.5px', color: 'var(--accent-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            📎 {doc.fileName} {doc.fileSize ? `(${Math.round(doc.fileSize / 1024)} KB)` : ''}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {doc.filePath ? (
                        <button
                          type="button"
                          className="btn"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            padding: '6px 12px',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: 'var(--accent-success)'
                          }}
                          onClick={() => handleOpenFile(doc.filePath)}
                        >
                          <ExternalLink size={13} /> Open File
                        </button>
                      ) : null}

                      <button
                        type="button"
                        className="btn"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          padding: '6px 12px',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          color: 'var(--text-primary)'
                        }}
                        onClick={() => handleAttachDocumentFile(doc.id, doc.label)}
                        disabled={uploadingDocId === doc.id}
                      >
                        <Upload size={13} /> {doc.filePath ? 'Replace File' : 'Attach File'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            documentChecklist: prev.documentChecklist.filter(d => d.id !== doc.id)
                          }));
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Custom Item */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <input
                  type="text"
                  placeholder="Add custom required document item (e.g. Police Traffic Accident Report)..."
                  className="input-field"
                  style={{ flex: 1, fontSize: '13px' }}
                  value={customChecklistLabel}
                  onChange={(e) => setCustomChecklistLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomChecklistItem(e); }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                  onClick={handleAddCustomChecklistItem}
                >
                  <Plus size={14} /> Add Item
                </button>
              </div>

              {/* Case Notes & Timeline Section */}
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Case Progression & Advisor Logs
                </h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Record timeline note (e.g. 'Submitted appeal for MRI bill via Great Eastern portal')..."
                    className="input-field"
                    style={{ flex: 1, fontSize: '13px' }}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddTimelineNote(e); }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: '12px', padding: '8px 16px' }}
                    onClick={handleAddTimelineNote}
                  >
                    Add Log Note
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                  {(formData.timelineNotes || []).map(note => (
                    <div
                      key={note.id}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-light)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{note.note}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Stage: <strong style={{ color: 'var(--accent-primary)' }}>{note.stage || formData.status}</strong> • {new Date(note.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Modal Actions Footer */}
          <div style={{
            marginTop: 'auto',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Total Bills Incurred: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(totalIncurred)}</strong> • Reimbursed: <strong style={{ color: 'var(--accent-success)' }}>{formatCurrency(totalInsurerPaid)}</strong>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className="btn"
                style={{ backgroundColor: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '8px 24px', fontWeight: '600' }}
              >
                Save Claim Event
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
