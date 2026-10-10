import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Folder, BookOpen, Receipt, Scale, FileText, Award, Building2, Activity
} from 'lucide-react';
import MajorClaimBenefitSchedule from './MajorClaimBenefitSchedule';
import MajorClaimReconciliation from './MajorClaimReconciliation';
import ClaimEventStep from './claims/ClaimEventStep';
import IndemnityBillsLedger from './claims/IndemnityBillsLedger';
import IndemnityReconciliation from './claims/IndemnityReconciliation';
import ClaimVaultStep from './claims/ClaimVaultStep';

export { 
  CLAIM_CATEGORIES, 
  ARCHETYPE_CONFIG, 
  CLAIM_STATUSES, 
  CLAIM_TYPES, 
  MAJOR_CLAIM_SUBTYPES, 
  WARD_CLASSES, 
  LOG_STATUSES, 
  ACCIDENT_CAUSES, 
  INJURY_TYPES, 
  TREATMENT_VENUE_OPTIONS, 
  CHECKLIST_TEMPLATES 
} from './claims/claimConstants';

import { ARCHETYPE_CONFIG, CHECKLIST_TEMPLATES } from './claims/claimConstants';

export default function ClaimModal({ 
  client, 
  policies = [], 
  claim, 
  initialCategory = 'hospitalisation', 
  isOpen, 
  onClose, 
  onSave, 
  onOpenAiReconciler 
}) {
  // 4-Tab Step-by-Step Workflow:
  // Step 1: 'event' (Event Details, Insured Person & Policy Links)
  // Step 2: 'bills' (Tag Bills & Receipts Ledger or Major Claims Benefit Schedule)
  // Step 3: 'reconciliation' (Settlement & Payout Reconciliation Audit)
  // Step 4: 'vault' (Document Vault & Case Timeline Notes)
  const [activeTab, setActiveTab] = useState('event');
  const [uploadingDocId, setUploadingDocId] = useState(null);

  const inferCategory = (claimObj, fallback = 'hospitalisation') => {
    if (claimObj?.claimCategory) return claimObj.claimCategory;
    if (claimObj?.claimType === 'Accident & Medical') return 'accident';
    if (['Critical Illness', 'Disability Income', 'Death / TPD', 'Death / Terminal Illness', 'Total Permanent Disability (TPD)'].includes(claimObj?.claimType)) return 'major';
    return fallback;
  };

  const initialCat = claim ? inferCategory(claim, initialCategory) : (initialCategory || 'hospitalisation');

  // Core Form State
  const [formData, setFormData] = useState({
    id: claim?.id || '',
    clientId: client?.id || '',
    policyId: claim?.policyId || (policies[0]?.id || ''),
    additionalPolicyIds: Array.isArray(claim?.additionalPolicyIds) ? claim.additionalPolicyIds : [],
    insuredType: claim?.insuredType || 'Self',
    insuredPersonId: claim?.insuredPersonId || '',
    insuredName: claim?.insuredName || (client?.fullName || client?.name || 'Self'),
    claimNumber: claim?.claimNumber || '',
    claimCategory: initialCat,
    claimType: claim?.claimType || (initialCat === 'accident' ? 'Accident & Medical' : initialCat === 'major' ? 'Critical Illness' : 'Hospitalisation / Shield'),
    title: claim?.title || '',
    incidentDate: claim?.incidentDate || '',
    admissionDate: claim?.admissionDate || '',
    dischargeDate: claim?.dischargeDate || '',
    hospitalOrClinic: claim?.hospitalOrClinic || '',
    doctorName: claim?.doctorName || '',
    status: claim?.status || 'Draft / Gathering Bills',
    
    // Archetype Specific: Hospitalisation
    wardClass: claim?.wardClass || 'Private Hospital Single',
    logStatus: claim?.logStatus || 'Not Required / Direct Claim',
    isPanelDoctor: claim?.isPanelDoctor !== undefined ? claim.isPanelDoctor : true,

    // Archetype Specific: Personal Accident
    accidentTime: claim?.accidentTime || '',
    accidentCause: claim?.accidentCause || 'Sports & Recreational Activity',
    injuryType: claim?.injuryType || 'Sprain / Ligament Strain',
    treatmentVenues: Array.isArray(claim?.treatmentVenues) ? claim.treatmentVenues : ['A&E / Emergency Dept', 'GP Clinic'],
    tcmSublimitCap: claim?.tcmSublimitCap || '',
    hasIncidentReport: !!claim?.hasIncidentReport,

    // Archetype Specific: Major Claims
    majorClaimSubtype: claim?.majorClaimSubtype || (claim?.claimType === 'Disability Income' ? 'Disability Income' : claim?.claimType === 'Death / TPD' ? 'Total Permanent Disability (TPD)' : 'Critical Illness'),
    ciStage: claim?.ciStage || 'Major / Advanced Stage CI',
    benefitType: claim?.benefitType || 'Lump Sum',
    sumAssuredClaimed: claim?.sumAssuredClaimed || (claim?.claimedAmount || ''),
    sumAssuredTotal: claim?.sumAssuredTotal || '',
    monthlyBenefitAmount: claim?.monthlyBenefitAmount || '',
    defermentPeriodDays: claim?.defermentPeriodDays || '60 Days',
    benefitStartDate: claim?.benefitStartDate || '',
    benefitDurationMonths: claim?.benefitDurationMonths || 12,
    waitingPeriodVerified: claim?.waitingPeriodVerified !== undefined ? claim.waitingPeriodVerified : true,
    survivalPeriodVerified: claim?.survivalPeriodVerified !== undefined ? claim.survivalPeriodVerified : true,
    adlCount: claim?.adlCount || '3 or more ADLs',
    nominationType: claim?.nominationType || 'Trust Nomination (Sec 49L)',
    beneficiaryName: claim?.beneficiaryName || '',

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
      const cat = inferCategory(claim, initialCategory);
      setFormData({
        ...claim,
        id: claim.id || crypto.randomUUID(),
        claimCategory: cat,
        claimType: claim.claimType || (cat === 'accident' ? 'Accident & Medical' : cat === 'major' ? 'Critical Illness' : 'Hospitalisation / Shield'),
        additionalPolicyIds: Array.isArray(claim.additionalPolicyIds) ? claim.additionalPolicyIds : [],
        insuredType: claim.insuredType || 'Self',
        insuredPersonId: claim.insuredPersonId || '',
        insuredName: claim.insuredName || (client?.fullName || client?.name || 'Self'),
        wardClass: claim.wardClass || 'Private Hospital Single',
        logStatus: claim.logStatus || 'Not Required / Direct Claim',
        isPanelDoctor: claim.isPanelDoctor !== undefined ? claim.isPanelDoctor : true,
        accidentTime: claim.accidentTime || '',
        accidentCause: claim.accidentCause || 'Sports & Recreational Activity',
        injuryType: claim.injuryType || 'Sprain / Ligament Strain',
        treatmentVenues: Array.isArray(claim.treatmentVenues) ? claim.treatmentVenues : ['A&E / Emergency Dept', 'GP Clinic'],
        tcmSublimitCap: claim.tcmSublimitCap || '',
        hasIncidentReport: !!claim.hasIncidentReport,
        majorClaimSubtype: claim.majorClaimSubtype || (claim.claimType === 'Disability Income' ? 'Disability Income' : claim.claimType === 'Death / TPD' ? 'Total Permanent Disability (TPD)' : 'Critical Illness'),
        ciStage: claim.ciStage || 'Major / Advanced Stage CI',
        benefitType: claim.benefitType || 'Lump Sum',
        sumAssuredClaimed: claim.sumAssuredClaimed || (claim.claimedAmount || ''),
        sumAssuredTotal: claim.sumAssuredTotal || '',
        monthlyBenefitAmount: claim.monthlyBenefitAmount || '',
        defermentPeriodDays: claim.defermentPeriodDays || '60 Days',
        benefitStartDate: claim.benefitStartDate || '',
        benefitDurationMonths: claim.benefitDurationMonths || 12,
        waitingPeriodVerified: claim.waitingPeriodVerified !== undefined ? claim.waitingPeriodVerified : true,
        survivalPeriodVerified: claim.survivalPeriodVerified !== undefined ? claim.survivalPeriodVerified : true,
        adlCount: claim.adlCount || '3 or more ADLs',
        nominationType: claim.nominationType || 'Trust Nomination (Sec 49L)',
        beneficiaryName: claim.beneficiaryName || '',
        billItems: claim.billItems || [],
        settlementEntries: claim.settlementEntries || [],
        documentChecklist: claim.documentChecklist || [],
        timelineNotes: claim.timelineNotes || []
      });
    } else {
      // New Claim defaults
      const cat = initialCategory || 'hospitalisation';
      const templateKey = cat === 'accident'
        ? 'Accident & Medical'
        : cat === 'major'
        ? 'Critical Illness'
        : 'Hospitalisation / Shield';
      const initialTemplate = CHECKLIST_TEMPLATES[templateKey] || [];
      const newClaimId = crypto.randomUUID();

      setFormData({
        id: newClaimId,
        clientId: client?.id || '',
        policyId: policies[0]?.id || '',
        additionalPolicyIds: [],
        insuredType: policies[0]?.insuredType === 'Dependent' ? 'Dependent' : 'Self',
        insuredPersonId: policies[0]?.insuredPersonId || '',
        insuredName: policies[0]?.insuredType === 'Dependent' ? (policies[0]?.insuredName || 'Dependent') : (client?.fullName || client?.name || 'Self'),
        claimNumber: '',
        claimCategory: cat,
        claimType: cat === 'accident' ? 'Accident & Medical' : cat === 'major' ? 'Critical Illness' : 'Hospitalisation / Shield',
        title: '',
        incidentDate: new Date().toISOString().split('T')[0],
        admissionDate: '',
        dischargeDate: '',
        hospitalOrClinic: '',
        doctorName: '',
        status: 'Draft / Gathering Bills',
        wardClass: 'Private Hospital Single',
        logStatus: 'Not Required / Direct Claim',
        isPanelDoctor: true,
        accidentTime: '',
        accidentCause: 'Sports & Recreational Activity',
        injuryType: 'Sprain / Ligament Strain',
        treatmentVenues: ['A&E / Emergency Dept', 'GP Clinic'],
        tcmSublimitCap: cat === 'accident' ? 500 : '',
        hasIncidentReport: false,
        majorClaimSubtype: 'Critical Illness',
        ciStage: 'Major / Advanced Stage CI',
        benefitType: 'Lump Sum',
        sumAssuredClaimed: '',
        sumAssuredTotal: '',
        monthlyBenefitAmount: '',
        defermentPeriodDays: '60 Days',
        benefitStartDate: '',
        benefitDurationMonths: 12,
        waitingPeriodVerified: true,
        survivalPeriodVerified: true,
        adlCount: '3 or more ADLs',
        nominationType: 'Trust Nomination (Sec 49L)',
        beneficiaryName: '',
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
            note: `${cat === 'hospitalisation' ? 'Hospitalisation' : cat === 'accident' ? 'Personal Accident' : 'Major claim'} event initiated in CRM`,
            author: 'Advisor'
          }
        ]
      });
    }
  }, [claim, client, policies, initialCategory]);

  // Recalculate summary totals whenever billItems or settlementEntries change
  // Robust fix: avoids the stale state bug by updating unconditionally when items are cleared or modified
  useEffect(() => {
    if (formData.claimCategory === 'major') {
      const sumSettlementPaid = (formData.settlementEntries || []).reduce((sum, s) => sum + (Number(s.totalPaid) || 0), 0);
      setFormData(prev => ({
        ...prev,
        approvedAmount: sumSettlementPaid
      }));
    } else {
      const sumIncurred = (formData.billItems || []).reduce((sum, b) => sum + (Number(b.incurredAmount) || 0), 0);
      const sumClaimed = (formData.billItems || []).reduce((sum, b) => sum + (Number(b.claimedAmount) || 0), 0);
      const sumPaidBills = (formData.billItems || []).reduce((sum, b) => sum + (Number(b.insurerPaidAmount) || 0), 0);
      const sumCoPayBills = (formData.billItems || []).reduce((sum, b) => sum + (Number(b.deductibleOrCoPay) || 0), 0);
      const sumMedisave = (formData.billItems || []).reduce((sum, b) => sum + (Number(b.medisaveOffset) || 0), 0);

      // If settlements exist, they override/complement total insurer paid
      const sumSettlementPaid = (formData.settlementEntries || []).reduce((sum, s) => sum + (Number(s.totalPaid) || 0), 0);
      const sumSettlementCoPay = (formData.settlementEntries || []).reduce((sum, s) => sum + (Number(s.coPayDeductible) || 0), 0);

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
  }, [formData.billItems, formData.settlementEntries, formData.claimCategory]);

  if (!isOpen) return null;

  // Currency Formatter
  const formatCurrency = (val) => {
    if (!val) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(val);
  };

  const currentArchetypeConfig = ARCHETYPE_CONFIG[formData.claimCategory] || ARCHETYPE_CONFIG.hospitalisation;

  const handleSwitchCategory = (newCat) => {
    let newType = 'Hospitalisation / Shield';
    if (newCat === 'accident') {
      newType = 'Accident & Medical';
    } else if (newCat === 'major') {
      newType = formData.majorClaimSubtype || 'Critical Illness';
    }
    setFormData(prev => ({
      ...prev,
      claimCategory: newCat,
      claimType: newType
    }));
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
      alert("Please upload claim documents in PDF, PNG, JPG, or WEBP format.");
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

    const triageResults = {
      bills: [],
      settlements: [],
      memos: [],
      incidents: [],
      others: []
    };

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

          if (res?.success) {
            const cat = res.category || (res.billItem ? 'medical_bill' : 'other');

            if (cat === 'medical_bill' && res.billItem) {
              triageResults.bills.push(res.billItem);
              setFormData(prev => ({
                ...prev,
                id: currentClaimId,
                billItems: [...prev.billItems, res.billItem]
              }));
            } else if (cat === 'settlement_letter' && res.settlementEntry) {
              triageResults.settlements.push(res.settlementEntry);
              setFormData(prev => {
                const hasSettlementDoc = prev.documentChecklist.some(d => /settlement|eob|voucher/i.test(d.label));
                let updatedChecklist = prev.documentChecklist;
                if (!hasSettlementDoc) {
                  updatedChecklist = [
                    ...prev.documentChecklist,
                    {
                      id: crypto.randomUUID(),
                      label: 'Insurer Settlement Statement / EOB Letter',
                      required: false,
                      status: 'Uploaded / Received',
                      filePath: res.settlementEntry.settlementLetterFilePath,
                      fileName: res.settlementEntry.settlementFileName,
                      fileSize: res.settlementEntry.fileSize
                    }
                  ];
                }
                const newApproved = (Number(prev.approvedAmount) || 0) + (Number(res.settlementEntry.totalPaid) || 0);
                const newClaimNumber = (!prev.claimNumber && res.settlementEntry.insurerRef) ? res.settlementEntry.insurerRef : prev.claimNumber;
                return {
                  ...prev,
                  id: currentClaimId,
                  settlementEntries: [...prev.settlementEntries, res.settlementEntry],
                  approvedAmount: newApproved,
                  claimNumber: newClaimNumber,
                  documentChecklist: updatedChecklist
                };
              });
            } else if (cat === 'medical_memo' && res.memoItem) {
              triageResults.memos.push(res.memoItem);
              setFormData(prev => {
                let docUpdated = false;
                const updatedChecklist = prev.documentChecklist.map(d => {
                  if (!docUpdated && !d.filePath && /doctor|medical report|memo|discharge|clinical/i.test(d.label)) {
                    docUpdated = true;
                    return {
                      ...d,
                      status: 'Uploaded / Received',
                      filePath: res.memoItem.filePath,
                      fileName: res.memoItem.fileName,
                      fileSize: res.memoItem.fileSize
                    };
                  }
                  return d;
                });
                if (!docUpdated) {
                  updatedChecklist.push({
                    id: crypto.randomUUID(),
                    label: res.memoItem.documentTypeTag || 'Doctor Medical Report / Clinical Memo',
                    required: true,
                    status: 'Uploaded / Received',
                    filePath: res.memoItem.filePath,
                    fileName: res.memoItem.fileName,
                    fileSize: res.memoItem.fileSize
                  });
                }

                const updates = {
                  ...prev,
                  id: currentClaimId,
                  documentChecklist: updatedChecklist
                };
                if (!prev.doctorName && res.memoItem.doctorName) updates.doctorName = res.memoItem.doctorName;
                if (!prev.hospitalOrClinic && res.memoItem.hospitalOrClinic) updates.hospitalOrClinic = res.memoItem.hospitalOrClinic;
                if (!prev.title && res.memoItem.diagnosis) updates.title = res.memoItem.diagnosis;
                if (!prev.admissionDate && res.memoItem.admissionDate) updates.admissionDate = res.memoItem.admissionDate;
                if (!prev.dischargeDate && res.memoItem.dischargeDate) updates.dischargeDate = res.memoItem.dischargeDate;
                if (!prev.incidentDate && res.memoItem.memoDate) updates.incidentDate = res.memoItem.memoDate;
                return updates;
              });
            } else if (cat === 'incident_report' && res.incidentItem) {
              triageResults.incidents.push(res.incidentItem);
              setFormData(prev => {
                const hasIncidentDoc = prev.documentChecklist.some(d => /incident|police/i.test(d.label));
                let updatedChecklist = prev.documentChecklist;
                if (!hasIncidentDoc) {
                  updatedChecklist = [
                    ...prev.documentChecklist,
                    {
                      id: crypto.randomUUID(),
                      label: 'Official Police / Accident Incident Report',
                      required: false,
                      status: 'Uploaded / Received',
                      filePath: res.incidentItem.filePath,
                      fileName: res.incidentItem.fileName,
                      fileSize: res.incidentItem.fileSize
                    }
                  ];
                }
                const updates = {
                  ...prev,
                  id: currentClaimId,
                  hasIncidentReport: true,
                  documentChecklist: updatedChecklist
                };
                if (!prev.incidentDate && res.incidentItem.incidentDate) updates.incidentDate = res.incidentItem.incidentDate;
                return updates;
              });
            } else {
              if (res.file) {
                triageResults.others.push(res.file);
                setFormData(prev => ({
                  ...prev,
                  id: currentClaimId,
                  documentChecklist: [
                    ...prev.documentChecklist,
                    {
                      id: crypto.randomUUID(),
                      label: res.summary || res.file.fileName,
                      required: false,
                      status: 'Uploaded / Received',
                      filePath: res.file.filePath,
                      fileName: res.file.fileName,
                      fileSize: res.file.fileSize
                    }
                  ]
                }));
              }
            }
          }
        }
      } catch (err) {
        console.error("Error auto-tagging document:", file.name, err);
      }
    }

    setIsAutoTagging(false);
    setTaggingProgress({ total: 0, current: 0, currentFileName: '', successCount: 0 });

    const totalIngested = triageResults.bills.length + triageResults.settlements.length + triageResults.memos.length + triageResults.incidents.length + triageResults.others.length;
    if (totalIngested > 0) {
      setAutoTagNotification({
        totalCount: totalIngested,
        billsCount: triageResults.bills.length,
        billsTotal: triageResults.bills.reduce((sum, b) => sum + (Number(b.incurredAmount) || 0), 0),
        settlementsCount: triageResults.settlements.length,
        settlementsTotal: triageResults.settlements.reduce((sum, s) => sum + (Number(s.totalPaid) || 0), 0),
        memosCount: triageResults.memos.length,
        incidentsCount: triageResults.incidents.length,
        othersCount: triageResults.others.length
      });
      setTimeout(() => {
        setAutoTagNotification(null);
      }, 12000);
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

  const handleMoveBillToSettlement = (billId) => {
    const bill = formData.billItems.find(b => b.id === billId);
    if (!bill) return;
    const newSettlementEntry = {
      id: crypto.randomUUID(),
      settlementDate: bill.billDate || new Date().toISOString().split('T')[0],
      insurerRef: bill.billNumber || '',
      totalPaid: Number(bill.incurredAmount) || 0,
      coPayDeductible: 0,
      nonPayableAmount: 0,
      paymentMethod: 'Direct Bank Credit / PayNow',
      notes: `Re-routed from bill: ${bill.provider || 'Provider'} - ${bill.description || 'Treatment'}`,
      settlementLetterFilePath: bill.receiptFilePath || '',
      settlementFileName: bill.receiptFileName || '',
      fileSize: bill.fileSize || 0,
      uploadedAt: new Date().toISOString()
    };
    setFormData(prev => ({
      ...prev,
      billItems: prev.billItems.filter(b => b.id !== billId),
      settlementEntries: [...prev.settlementEntries, newSettlementEntry],
      approvedAmount: (Number(prev.approvedAmount) || 0) + (Number(bill.incurredAmount) || 0)
    }));
  };

  const handleMoveBillToVault = (billId) => {
    const bill = formData.billItems.find(b => b.id === billId);
    if (!bill) return;
    const newDocItem = {
      id: crypto.randomUUID(),
      label: bill.description || `${bill.provider || 'Medical'} Document`,
      required: false,
      status: 'Uploaded / Received',
      filePath: bill.receiptFilePath || '',
      fileName: bill.receiptFileName || '',
      fileSize: bill.fileSize || 0
    };
    setFormData(prev => ({
      ...prev,
      billItems: prev.billItems.filter(b => b.id !== billId),
      documentChecklist: [...prev.documentChecklist, newDocItem]
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
    const noteObj = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      stage: formData.status,
      note: newNoteText.trim(),
      author: 'Advisor'
    };
    setFormData(prev => ({
      ...prev,
      timelineNotes: [noteObj, ...(prev.timelineNotes || [])]
    }));
    setNewNoteText('');
  };

  const handleSaveClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    let finalTitle = (formData.title || '').trim();
    if (!finalTitle) {
      if (formData.claimCategory === 'accident') {
        finalTitle = formData.injuryType || formData.accidentCause || 'Personal Accident Claim';
      } else if (formData.claimCategory === 'major') {
        finalTitle = `${formData.majorClaimSubtype || 'Major Claim'} (${formData.ciStage || 'Benefit Claim'})`;
      } else {
        finalTitle = formData.hospitalOrClinic 
          ? `Hospitalisation at ${formData.hospitalOrClinic}` 
          : 'Hospitalisation & Inpatient Claim';
      }
    }

    const payload = {
      ...formData,
      title: finalTitle
    };

    onSave(payload);
  };

  // Calculations for Step 3 Indemnity
  const totalIncurred = (formData.billItems || []).reduce((sum, b) => sum + (Number(b.incurredAmount) || 0), 0);
  const totalClaimed = (formData.billItems || []).reduce((sum, b) => sum + (Number(b.claimedAmount) || 0), 0) || totalIncurred;
  const sumSettlementPaid = (formData.settlementEntries || []).reduce((sum, s) => sum + (Number(s.totalPaid) || 0), 0);
  const sumBillsPaid = (formData.billItems || []).reduce((sum, b) => sum + (Number(b.insurerPaidAmount) || 0), 0);
  const totalInsurerPaid = sumSettlementPaid > 0 ? sumSettlementPaid : (Number(formData.approvedAmount) || sumBillsPaid);
  const sumSettlementCoPay = (formData.settlementEntries || []).reduce((sum, s) => sum + (Number(s.coPayDeductible) || 0), 0);
  const sumBillsCoPay = (formData.billItems || []).reduce((sum, b) => sum + (Number(b.deductibleOrCoPay) || 0), 0);
  const totalCoPay = sumSettlementCoPay > 0 ? sumSettlementCoPay : (Number(formData.deductibleOrCoPay) || sumBillsCoPay);
  const totalMedisave = (formData.billItems || []).reduce((sum, b) => sum + (Number(b.medisaveOffset) || 0), 0) || (Number(formData.medisaveOffset) || 0);
  const accountedDifference = Math.round((totalIncurred - (totalInsurerPaid + totalCoPay + totalMedisave)) * 100) / 100;
  const isFullyReconciled = totalIncurred > 0 && accountedDifference === 0;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(8px)',
      zIndex: 150,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div 
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '960px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          border: '1px solid var(--border-light)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0) 100%)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: currentArchetypeConfig.badgeBg,
                color: currentArchetypeConfig.accent,
                border: `1px solid ${currentArchetypeConfig.border}`
              }}>
                {currentArchetypeConfig.label}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                • {client?.fullName || client?.name}
              </span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              {claim ? 'Edit Insurance Claim Event' : 'Initiate New Insurance Claim Event'}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Quick Archetype Switcher */}
            <div style={{
              display: 'flex',
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderRadius: '8px',
              padding: '2px',
              border: '1px solid var(--border-light)'
            }}>
              <button
                type="button"
                onClick={() => handleSwitchCategory('hospitalisation')}
                style={{
                  padding: '4px 9px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: formData.claimCategory === 'hospitalisation' ? '#38bdf8' : 'transparent',
                  color: formData.claimCategory === 'hospitalisation' ? '#0f172a' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
                title="Switch to Hospitalisation archetype"
              >
                🏥 Hosp
              </button>
              <button
                type="button"
                onClick={() => handleSwitchCategory('accident')}
                style={{
                  padding: '4px 9px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: formData.claimCategory === 'accident' ? '#fbbf24' : 'transparent',
                  color: formData.claimCategory === 'accident' ? '#0f172a' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
                title="Switch to Personal Accident archetype"
              >
                🩹 Accident
              </button>
              <button
                type="button"
                onClick={() => handleSwitchCategory('major')}
                style={{
                  padding: '4px 9px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: formData.claimCategory === 'major' ? '#c084fc' : 'transparent',
                  color: formData.claimCategory === 'major' ? '#0f172a' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
                title="Switch to Major Claims archetype"
              >
                🎗️ Major
              </button>
            </div>

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
            {formData.claimCategory === 'major' ? (
              <>
                <Award size={15} /> 2. Benefit & Payout Schedule
                {formData.settlementEntries.length > 0 && (
                  <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '10px', backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}>
                    {formData.settlementEntries.length}
                  </span>
                )}
              </>
            ) : (
              <>
                <Receipt size={15} /> 2. Tagged Bills Ledger
                {formData.billItems.length > 0 && (
                  <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '10px', backgroundColor: 'rgba(139, 92, 246, 0.2)', color: 'var(--accent-primary)' }}>
                    {formData.billItems.length}
                  </span>
                )}
              </>
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
            <Scale size={15} /> {formData.claimCategory === 'major' ? '3. Settlement & Payout Audit' : '3. Settlement & Reconciliation'}
            {((formData.claimCategory !== 'major' && isFullyReconciled) || (formData.claimCategory === 'major' && Number(formData.approvedAmount) >= Number(formData.sumAssuredClaimed || formData.claimedAmount) && Number(formData.approvedAmount) > 0)) && (
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
        <form onSubmit={handleSaveClick} style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* STEP 1: CLAIM EVENT & POLICY LINK */}
          {activeTab === 'event' && (
            <ClaimEventStep
              formData={formData}
              setFormData={setFormData}
              policies={policies}
              client={client}
              onNext={() => setActiveTab('bills')}
            />
          )}

          {/* STEP 2: TAG BILLS OR MAJOR CLAIM SCHEDULE */}
          {activeTab === 'bills' && (
            formData.claimCategory === 'major' ? (
              <MajorClaimBenefitSchedule
                formData={formData}
                setFormData={setFormData}
                formatCurrency={formatCurrency}
                onNext={() => setActiveTab('reconciliation')}
              />
            ) : (
              <IndemnityBillsLedger
                formData={formData}
                setFormData={setFormData}
                formatCurrency={formatCurrency}
                isDraggingOver={isDraggingOver}
                handleDragOver={handleDragOver}
                handleDragLeave={handleDragLeave}
                handleDrop={handleDrop}
                fileInputRef={fileInputRef}
                handleFileInputChange={handleFileInputChange}
                isAutoTagging={isAutoTagging}
                taggingProgress={taggingProgress}
                autoTagNotification={autoTagNotification}
                newBill={newBill}
                setNewBill={setNewBill}
                isAddingBill={isAddingBill}
                setIsAddingBill={setIsAddingBill}
                editingBillId={editingBillId}
                setEditingBillId={setEditingBillId}
                handleAddBillItem={handleAddBillItem}
                handleEditBill={handleEditBill}
                handleCancelBillEdit={handleCancelBillEdit}
                handleDeleteBillItem={handleDeleteBillItem}
                handleAttachBillFile={handleAttachBillFile}
                handleMoveBillToSettlement={handleMoveBillToSettlement}
                handleMoveBillToVault={handleMoveBillToVault}
                handleOpenFile={handleOpenFile}
                onNext={() => setActiveTab('reconciliation')}
              />
            )
          )}

          {/* STEP 3: SETTLEMENT & PAYOUT RECONCILIATION */}
          {activeTab === 'reconciliation' && (
            formData.claimCategory === 'major' ? (
              <MajorClaimReconciliation
                formData={formData}
                formatCurrency={formatCurrency}
                onOpenAiReconciler={onOpenAiReconciler}
                onNext={() => setActiveTab('vault')}
              />
            ) : (
              <IndemnityReconciliation
                formData={formData}
                setFormData={setFormData}
                formatCurrency={formatCurrency}
                onOpenAiReconciler={onOpenAiReconciler}
                isAddingSettlement={isAddingSettlement}
                setIsAddingSettlement={setIsAddingSettlement}
                newSettlement={newSettlement}
                setNewSettlement={setNewSettlement}
                handleAddSettlement={handleAddSettlement}
                handleDeleteSettlement={handleDeleteSettlement}
                handleAttachSettlementFile={handleAttachSettlementFile}
                handleOpenFile={handleOpenFile}
                onNext={() => setActiveTab('vault')}
              />
            )
          )}

          {/* STEP 4: DOCUMENT VAULT & CASE NOTES */}
          {activeTab === 'vault' && (
            <ClaimVaultStep
              formData={formData}
              setFormData={setFormData}
              handleApplyTemplate={handleApplyTemplate}
              handleToggleDocStatus={handleToggleDocStatus}
              handleAttachDocumentFile={handleAttachDocumentFile}
              handleOpenFile={handleOpenFile}
              uploadingDocId={uploadingDocId}
              customChecklistLabel={customChecklistLabel}
              setCustomChecklistLabel={setCustomChecklistLabel}
              handleAddCustomChecklistItem={handleAddCustomChecklistItem}
              newNoteText={newNoteText}
              setNewNoteText={setNewNoteText}
              handleAddTimelineNote={handleAddTimelineNote}
            />
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
              {formData.claimCategory === 'major' ? (
                <span>
                  Sum Assured Claimed: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(formData.sumAssuredClaimed || formData.claimedAmount || 0)}</strong> • Disbursed: <strong style={{ color: 'var(--accent-success)' }}>{formatCurrency(formData.approvedAmount || 0)}</strong>
                </span>
              ) : (
                <span>
                  Total Bills Incurred: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(totalIncurred)}</strong> • Reimbursed: <strong style={{ color: 'var(--accent-success)' }}>{formatCurrency(totalInsurerPaid)}</strong>
                </span>
              )}
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
                type="button"
                className="btn btn-primary"
                style={{ padding: '8px 24px', fontWeight: '600' }}
                onClick={handleSaveClick}
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
