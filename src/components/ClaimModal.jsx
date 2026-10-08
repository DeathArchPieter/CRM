import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Plus, Trash2, FileText, Upload, CheckCircle2, Clock, AlertTriangle, 
  ExternalLink, Folder, Layers, DollarSign, Calendar, Sparkles, Building, User,
  FileCheck, Shield, ChevronRight, Check, ArrowRight, Receipt, Scale, BookOpen,
  Edit2, Loader2, Building2, Activity, Award, Bed, HeartPulse
} from 'lucide-react';
import DatePicker from './DatePicker';
import MajorClaimBenefitSchedule from './MajorClaimBenefitSchedule';
import MajorClaimReconciliation from './MajorClaimReconciliation';

export const CLAIM_CATEGORIES = {
  HOSPITALISATION: 'hospitalisation',
  ACCIDENT: 'accident',
  MAJOR: 'major'
};

export const ARCHETYPE_CONFIG = {
  hospitalisation: {
    label: 'Hospitalisation & Inpatient',
    shortLabel: 'Hospitalisation',
    defaultType: 'Hospitalisation / Shield',
    accent: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.3)',
    checklistKey: 'Hospitalisation / Shield'
  },
  accident: {
    label: 'Personal Accident',
    shortLabel: 'Personal Accident',
    defaultType: 'Accident & Medical',
    accent: '#fbbf24',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.3)',
    checklistKey: 'Accident & Medical'
  },
  major: {
    label: 'Major Claim (CI / DI / TPD / Death)',
    shortLabel: 'Major Claims',
    defaultType: 'Critical Illness',
    accent: '#c084fc',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
    border: 'rgba(168, 85, 247, 0.3)',
    checklistKey: 'Critical Illness'
  }
};

export const CLAIM_STATUSES = [
  'Draft / Gathering Bills',
  'Submitted to Insurer',
  'Under Review',
  'Information Required',
  'Approved',
  'Paid Out',
  'Declined'
];

const CLAIM_TYPES = [
  'Hospitalisation / Shield',
  'Critical Illness',
  'Accident & Medical',
  'Death / TPD',
  'Disability Income',
  'Travel / Other'
];

const MAJOR_CLAIM_SUBTYPES = [
  'Critical Illness',
  'Disability Income',
  'Total Permanent Disability (TPD)',
  'Death / Terminal Illness'
];

const WARD_CLASSES = [
  'Private Hospital Single',
  'Private Hospital Deluxe / Suite',
  'Restructured Class A',
  'Restructured Class B1',
  'Restructured Class B2 / C',
  'Day Surgery / Ambulatory Centre'
];

const LOG_STATUSES = [
  'Not Required / Direct Claim',
  'LOG Requested from Insurer',
  'LOG Issued ($0 Cash Deposit)',
  'LOG Declined / Self-Pay'
];

const ACCIDENT_CAUSES = [
  'Sports & Recreational Activity',
  'Slip, Trip & Fall',
  'Road Traffic / Motor Accident',
  'Workplace / Occupational Incident',
  'Food Poisoning',
  'Burns & Scalds',
  'Animal / Insect Bite',
  'Other Accidental Trauma'
];

const INJURY_TYPES = [
  'Bone Fracture / Dislocation',
  'Sprain / Ligament Strain',
  'Laceration / Deep Cut',
  'Head Injury / Concussion',
  'Dental Injury (Accidental)',
  'Soft Tissue Contusion / Bruising',
  'Burn / Scald',
  'Other'
];

const TREATMENT_VENUE_OPTIONS = [
  'A&E / Emergency Dept',
  'GP / Polyclinic',
  'Specialist Clinic',
  'TCM Clinic (Acupuncture/Tuina)',
  'Physiotherapy / Rehab',
  'Chiropractor'
];

const CHECKLIST_TEMPLATES = {
  'Hospitalisation / Shield': [
    'Final Itemised Hospital Tax Invoice',
    'Inpatient Discharge Summary',
    'Doctor Medical Report / Memo',
    'Signed Inpatient Claim Form',
    'Letter of Guarantee (LOG) / e-LOG Copy',
    'Pre/Post-Hospitalisation Clinic Receipts'
  ],
  'Critical Illness': [
    'Attending Physician Medical Report',
    'Histology / Biopsy / Pathology Lab Report',
    'Diagnostic Radiology / MRI / CT Scans',
    'Signed Critical Illness Claim Form',
    'Specialist Clinical Summary & Stage Memo',
    'First Diagnosis Confirmation Letter (Waiting period proof)'
  ],
  'Accident & Medical': [
    'Emergency Department Discharge Summary',
    'Itemised Clinic & Medical Receipts',
    'Accident Description & Incident Report',
    'Signed A&H Claim Form',
    'Physiotherapy / TCM Referral & Invoices',
    'Police / Traffic Incident Report (if applicable)'
  ],
  'Disability Income': [
    'Attending Doctor Occupational Disability Report',
    'Signed Disability Income Claim Form',
    'Employer Salary Slips / CPF Statements (Proof of Loss of Income)',
    'Occupational Duties & Job Description Declaration',
    'Monthly Continuing Disability Medical Certification'
  ],
  'Death / TPD': [
    'Certified True Copy of Death Certificate',
    'Grant of Probate / Letters of Administration / Nomination Form',
    'Medical Report on Total Permanent Disability',
    'Claimant Identity Documents (NRIC/Passport)',
    'Original Policy Documents / Discharge Voucher'
  ]
};

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
  // Step 1: 'event' (Event Details & Policy Link)
  // Step 2: 'bills' (Tag Bills & Receipts Ledger) or 'schedule' for Major Claims
  // Step 3: 'reconciliation' (Settlement & Payout Reconciliation)
  // Step 4: 'vault' (Document Vault & Case Timeline)
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
    additionalPolicyIds: claim?.additionalPolicyIds || [],
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
    setFormData(prev => ({
      ...prev,
      policyId,
      sumAssuredClaimed: autoSum || prev.sumAssuredClaimed,
      claimedAmount: (prev.claimCategory === 'major' && autoSum) ? Number(autoSum) : prev.claimedAmount,
      monthlyBenefitAmount: autoMonthly || prev.monthlyBenefitAmount
    }));
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

  const tcmBillsTotal = formData.claimCategory === 'accident'
    ? formData.billItems
        .filter(b => (b.description || '').toLowerCase().includes('tcm') || (b.provider || '').toLowerCase().includes('tcm') || (b.description || '').toLowerCase().includes('physio') || (b.description || '').toLowerCase().includes('acupuncture'))
        .reduce((sum, b) => sum + (Number(b.incurredAmount) || 0), 0)
    : 0;

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
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.02)',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <Shield size={20} color="var(--accent-primary)" />
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                {claim?.id ? 'Claims Event & Payout Reconciliation' : 'Initiate New Claims Event'}
              </h2>
              {/* Prominent Archetype Badge */}
              <span style={{
                padding: '3px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600',
                backgroundColor: currentArchetypeConfig.badgeBg,
                color: currentArchetypeConfig.accent,
                border: `1px solid ${currentArchetypeConfig.border}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                {formData.claimCategory === 'hospitalisation' ? '🏥 Hospitalisation & Inpatient' : formData.claimCategory === 'accident' ? '🩹 Personal Accident' : '🎗️ Major Claim'}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0 }}>
              Client: <strong style={{ color: 'var(--text-primary)' }}>{client?.fullName}</strong> • Status: <span style={{ color: 'var(--accent-secondary)' }}>{formData.status}</span>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Archetype Quick Switcher */}
            <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border-light)' }}>
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
                  ? 'Define inpatient hospital admission, ward class, hospital facility, and link to in-force Integrated Shield Plan and riders.'
                  : formData.claimCategory === 'accident'
                  ? 'Define accidental injury details, accident cause, treatment venues, and track TCM/Physiotherapy sub-limits.'
                  : 'Define the Critical Illness diagnosis, Disability Income occupational claim, or TPD/Death benefit with Sum Assured entitlements.'}
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

              {/* Policy, Type/Subtype, and Claim Ref */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Linked In-Force Policy *</label>
                  <select
                    className="input-field"
                    style={{ width: '100%' }}
                    value={formData.policyId}
                    onChange={(e) => handleSelectPolicy(e.target.value)}
                  >
                    <option value="">-- Select Policy --</option>
                    {policies.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.provider} • {p.policyName} ({p.policyNumber || 'No Policy#'}) {p.insuredType === 'Dependent' ? `[👶 ${p.insuredName || 'Dependent'}]` : '[👤 Self]'}
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

              {/* ARCHETYPE CONDITIONAL SECTION */}
              {/* CASE 1: HOSPITALISATION & INPATIENT */}
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
                      <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Date of Symptoms / Onset</label>
                      <DatePicker
                        value={formData.incidentDate || ''}
                        onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Hospital Admission Date *</label>
                      <DatePicker
                        value={formData.admissionDate || ''}
                        onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Hospital Discharge Date *</label>
                      <DatePicker
                        value={formData.dischargeDate || ''}
                        onChange={(e) => setFormData({ ...formData, dischargeDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Hospital / Specialist Medical Centre</label>
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
                      <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Attending Doctor / Surgeon</label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Keith Tan (Orthopaedic)"
                        className="input-field"
                        style={{ width: '100%' }}
                        value={formData.doctorName}
                        onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', alignItems: 'center' }}>
                    <div>
                      <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Letter of Guarantee (LOG) Status</label>
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

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      marginTop: '22px'
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.isPanelDoctor}
                        onChange={(e) => setFormData({ ...formData, isPanelDoctor: e.target.checked })}
                      />
                      <span>Doctor is on Insurer's Panel (Preferred Co-Pay / Higher Cap)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* CASE 2: PERSONAL ACCIDENT */}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Activity size={15} /> Accident Circumstances & Injury Profile
                    </span>
                    {tcmBillsTotal > 0 && (
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontWeight: '600' }}>
                        🌿 TCM/Physio Logged: {formatCurrency(tcmBillsTotal)}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Date of Accident *</label>
                      <DatePicker
                        value={formData.incidentDate || ''}
                        onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Time of Incident</label>
                      <input
                        type="text"
                        placeholder="e.g. 14:30 or 8:15 PM"
                        className="input-field"
                        style={{ width: '100%' }}
                        value={formData.accidentTime}
                        onChange={(e) => setFormData({ ...formData, accidentTime: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Cause / Circumstance of Accident *</label>
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
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Nature of Injury *</label>
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
                      <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Emergency Hospital / Clinic</label>
                      <input
                        type="text"
                        placeholder="e.g. SGH Emergency Department / Raffles Medical"
                        className="input-field"
                        style={{ width: '100%' }}
                        value={formData.hospitalOrClinic}
                        onChange={(e) => setFormData({ ...formData, hospitalOrClinic: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Attending Doctor / Physician</label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Sharon Lee"
                        className="input-field"
                        style={{ width: '100%' }}
                        value={formData.doctorName}
                        onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Treatment Venues Chips */}
                  <div>
                    <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>
                      Treatment Venues Visited (Select all that apply)
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {TREATMENT_VENUE_OPTIONS.map(venue => {
                        const isSelected = (formData.treatmentVenues || []).includes(venue);
                        return (
                          <button
                            key={venue}
                            type="button"
                            onClick={() => handleToggleTreatmentVenue(venue)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '20px',
                              fontSize: '11.5px',
                              fontWeight: isSelected ? '600' : '400',
                              border: isSelected ? '1px solid #fbbf24' : '1px solid var(--border-light)',
                              backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.03)',
                              color: isSelected ? '#fbbf24' : 'var(--text-secondary)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            {isSelected && <Check size={12} />}
                            {venue}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'center' }}>
                    <div>
                      <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>
                        TCM / Alternative Medicine Policy Sub-Limit Cap ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 500.00"
                        className="input-field"
                        style={{ width: '100%' }}
                        value={formData.tcmSublimitCap}
                        onChange={(e) => setFormData({ ...formData, tcmSublimitCap: e.target.value })}
                      />
                    </div>

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      marginTop: '22px'
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.hasIncidentReport}
                        onChange={(e) => setFormData({ ...formData, hasIncidentReport: e.target.checked })}
                      />
                      <span>Official Police / Traffic / Workplace Incident Report Filed</span>
                    </label>
                  </div>
                </div>
              )}

              {/* CASE 3: MAJOR CLAIMS (CI, DI, TPD, DEATH) */}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Award size={15} /> Major Claim & Sum Assured Entitlement Profile
                    </span>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', fontWeight: '600' }}>
                      {formData.majorClaimSubtype || 'Critical Illness'} Benefit
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>
                        Date of First Diagnosis / Demise / Disability *
                      </label>
                      <DatePicker
                        value={formData.incidentDate || ''}
                        onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Attending Medical Specialist</label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Raymond Lim (Cardiologist)"
                        className="input-field"
                        style={{ width: '100%' }}
                        value={formData.doctorName}
                        onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Hospital / Diagnostic Institution</label>
                      <input
                        type="text"
                        placeholder="e.g. National Heart Centre Singapore"
                        className="input-field"
                        style={{ width: '100%' }}
                        value={formData.hospitalOrClinic}
                        onChange={(e) => setFormData({ ...formData, hospitalOrClinic: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* SUBTYPE SPECIFIC CONFIGS */}
                  {formData.majorClaimSubtype === 'Critical Illness' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>CI Severity Stage</label>
                        <select
                          className="input-field"
                          style={{ width: '100%' }}
                          value={formData.ciStage}
                          onChange={(e) => setFormData({ ...formData, ciStage: e.target.value })}
                        >
                          <option value="Early Stage CI">Early Stage CI</option>
                          <option value="Intermediate Stage CI">Intermediate Stage CI</option>
                          <option value="Major / Advanced Stage CI">Major / Advanced Stage CI</option>
                          <option value="Multi-Pay Relapse">Multi-Pay Relapse</option>
                        </select>
                      </div>

                      <div>
                        <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Sum Assured Claimed ($) *</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 250000.00"
                          className="input-field"
                          style={{ width: '100%', fontWeight: '700', color: '#c084fc' }}
                          value={formData.sumAssuredClaimed}
                          onChange={(e) => setFormData({ ...formData, sumAssuredClaimed: e.target.value, claimedAmount: Number(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  )}

                  {formData.majorClaimSubtype === 'Disability Income' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                      <div>
                        <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Monthly Income Benefit ($/mo) *</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 5000.00"
                          className="input-field"
                          style={{ width: '100%', fontWeight: '700', color: '#c084fc' }}
                          value={formData.monthlyBenefitAmount}
                          onChange={(e) => setFormData({ ...formData, monthlyBenefitAmount: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Policy Deferment Period</label>
                        <select
                          className="input-field"
                          style={{ width: '100%' }}
                          value={formData.defermentPeriodDays}
                          onChange={(e) => setFormData({ ...formData, defermentPeriodDays: e.target.value })}
                        >
                          <option value="60 Days">60 Days</option>
                          <option value="90 Days">90 Days</option>
                          <option value="180 Days">180 Days</option>
                        </select>
                      </div>

                      <div>
                        <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Disability Effective Date</label>
                        <DatePicker
                          value={formData.benefitStartDate || formData.incidentDate || ''}
                          onChange={(e) => setFormData({ ...formData, benefitStartDate: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  {formData.majorClaimSubtype === 'Total Permanent Disability (TPD)' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                      <div>
                        <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>TPD Impairment Criteria</label>
                        <select
                          className="input-field"
                          style={{ width: '100%' }}
                          value={formData.adlCount}
                          onChange={(e) => setFormData({ ...formData, adlCount: e.target.value })}
                        >
                          <option value="3 or more ADLs">Activities of Daily Living (ADLs) Impairment (≥3 of 6)</option>
                          <option value="Presumptive TPD">Presumptive TPD (Loss of sight, limbs, speech)</option>
                          <option value="Occupational TPD">Unable to perform any occupation</option>
                        </select>
                      </div>

                      <div>
                        <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Sum Assured Claimed ($) *</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 500000.00"
                          className="input-field"
                          style={{ width: '100%', fontWeight: '700', color: '#c084fc' }}
                          value={formData.sumAssuredClaimed}
                          onChange={(e) => setFormData({ ...formData, sumAssuredClaimed: e.target.value, claimedAmount: Number(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  )}

                  {formData.majorClaimSubtype === 'Death / Terminal Illness' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                      <div>
                        <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Beneficiary / Claimant Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Sarah Tan (Spouse)"
                          className="input-field"
                          style={{ width: '100%' }}
                          value={formData.beneficiaryName}
                          onChange={(e) => setFormData({ ...formData, beneficiaryName: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Nomination Structure</label>
                        <select
                          className="input-field"
                          style={{ width: '100%' }}
                          value={formData.nominationType}
                          onChange={(e) => setFormData({ ...formData, nominationType: e.target.value })}
                        >
                          <option value="Trust Nomination (Sec 49L)">Trust Nomination (Sec 49L)</option>
                          <option value="Revocable Nomination (Sec 49M)">Revocable Nomination (Sec 49M)</option>
                          <option value="Estate / Grant of Probate">Estate / Grant of Probate</option>
                          <option value="CPF Nominee">CPF Nominee</option>
                        </select>
                      </div>

                      <div>
                        <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Sum Assured Claimed ($) *</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 1000000.00"
                          className="input-field"
                          style={{ width: '100%', fontWeight: '700', color: '#c084fc' }}
                          value={formData.sumAssuredClaimed}
                          onChange={(e) => setFormData({ ...formData, sumAssuredClaimed: e.target.value, claimedAmount: Number(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  )}

                  {/* Regulatory Checks for CI */}
                  {formData.majorClaimSubtype === 'Critical Illness' && (
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', paddingTop: '4px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', color: 'var(--text-primary)' }}>
                        <input
                          type="checkbox"
                          checked={formData.waitingPeriodVerified}
                          onChange={(e) => setFormData({ ...formData, waitingPeriodVerified: e.target.checked })}
                        />
                        <span>✓ 90-Day Waiting Period verified from policy inception</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', color: 'var(--text-primary)' }}>
                        <input
                          type="checkbox"
                          checked={formData.survivalPeriodVerified}
                          onChange={(e) => setFormData({ ...formData, survivalPeriodVerified: e.target.checked })}
                        />
                        <span>✓ Survival Period verified (e.g. 14–30 days post-diagnosis)</span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Proceed to Step 2 Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                  onClick={() => setActiveTab('bills')}
                >
                  {formData.claimCategory === 'major' ? 'Proceed to Step 2: Benefit Schedule' : 'Proceed to Step 2: Tag Bills'}{' '}
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: TAGGED BILLS & RECEIPTS LEDGER OR BENEFIT SCHEDULE */}
          {activeTab === 'bills' && (
            formData.claimCategory === 'major' ? (
              <MajorClaimBenefitSchedule
                formData={formData}
                setFormData={setFormData}
                formatCurrency={formatCurrency}
                onNext={() => setActiveTab('reconciliation')}
              />
            ) : (
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
                  {isDraggingOver ? 'Drop claim documents here to auto-triage with Archie AI!' : 'Drag & Drop Claim Documents (Bills, Memos, Settlement Letters)'}
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '580px', margin: 0, lineHeight: '1.4' }}>
                  Drop any batch of files (PDF, PNG, JPG, WEBP). Archie AI auto-classifies medical invoices, doctor clinical memos, and insurer settlement statements, routing each directly to its corresponding tab!
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                  <span className="btn btn-secondary" style={{ fontSize: '11.5px', padding: '5px 14px', pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Upload size={13} /> Or Click to Browse Files
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    • Multi-file batch triage • Bills → Tab 2 • Settlements → Tab 3 • Memos → Tab 4
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
                        ⚡ Archie AI Auto-Triage in Progress... ({taggingProgress.current} of {taggingProgress.total} completed)
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
                  padding: '14px 18px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={18} color="var(--accent-success)" />
                      <span style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--accent-success)' }}>
                        Archie AI Smart Triage Complete ({autoTagNotification.totalCount || 1} {(autoTagNotification.totalCount || 1) === 1 ? 'file' : 'files'} processed)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoTagNotification(null)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-success)', cursor: 'pointer', opacity: 0.7 }}
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}>
                    {autoTagNotification.billsCount > 0 && (
                      <span style={{ padding: '3px 10px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        🧾 <strong>{autoTagNotification.billsCount}</strong> Bills Tagged ({formatCurrency(autoTagNotification.billsTotal)})
                      </span>
                    )}
                    {autoTagNotification.settlementsCount > 0 && (
                      <span style={{ padding: '3px 10px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-success)', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                        💳 <strong>{autoTagNotification.settlementsCount}</strong> Insurer Settlement ({formatCurrency(autoTagNotification.settlementsTotal)}) → Step 3
                      </span>
                    )}
                    {autoTagNotification.memosCount > 0 && (
                      <span style={{ padding: '3px 10px', borderRadius: '6px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                        📋 <strong>{autoTagNotification.memosCount}</strong> Medical Memo/Report → Step 4 Vault
                      </span>
                    )}
                    {autoTagNotification.incidentsCount > 0 && (
                      <span style={{ padding: '3px 10px', borderRadius: '6px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                        🚔 <strong>{autoTagNotification.incidentsCount}</strong> Incident Report → Step 4 Vault
                      </span>
                    )}
                    {autoTagNotification.othersCount > 0 && (
                      <span style={{ padding: '3px 10px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                        📎 <strong>{autoTagNotification.othersCount}</strong> Other File(s) → Step 4 Vault
                      </span>
                    )}
                  </div>

                  {(autoTagNotification.settlementsCount > 0 || autoTagNotification.memosCount > 0) && (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
                      {autoTagNotification.settlementsCount > 0 && (
                        <button
                          type="button"
                          className="btn"
                          style={{ fontSize: '11.5px', padding: '4px 10px', backgroundColor: 'rgba(16, 185, 129, 0.25)', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => setActiveTab('reconciliation')}
                        >
                          Review Step 3: Reconciliation <ArrowRight size={12} />
                        </button>
                      )}
                      {autoTagNotification.memosCount > 0 && (
                        <button
                          type="button"
                          className="btn"
                          style={{ fontSize: '11.5px', padding: '4px 10px', backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => setActiveTab('vault')}
                        >
                          Review Step 4: Document Vault <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  )}
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
                                onClick={() => handleMoveBillToSettlement(item.id)}
                                style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', opacity: 0.75 }}
                                title="Re-route this bill to Step 3: Insurer Settlement Statement"
                              >
                                <DollarSign size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveBillToVault(item.id)}
                                style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', opacity: 0.75 }}
                                title="Move this document to Step 4: Document Vault"
                              >
                                <Layers size={13} />
                              </button>
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
            )
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
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn"
                    style={{ fontSize: '11px', padding: '6px 10px', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}
                    onClick={() => handleApplyTemplate('Hospitalisation / Shield')}
                  >
                    + 🏥 Shield Preset
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{ fontSize: '11px', padding: '6px 10px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24' }}
                    onClick={() => handleApplyTemplate('Accident & Medical')}
                  >
                    + 🩹 Accident Preset
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{ fontSize: '11px', padding: '6px 10px', backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#c084fc' }}
                    onClick={() => handleApplyTemplate('Critical Illness')}
                  >
                    + 🎗️ CI Preset
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{ fontSize: '11px', padding: '6px 10px', backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#c084fc' }}
                    onClick={() => handleApplyTemplate('Disability Income')}
                  >
                    + 💼 DI Preset
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{ fontSize: '11px', padding: '6px 10px', backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#c084fc' }}
                    onClick={() => handleApplyTemplate('Death / TPD')}
                  >
                    + 🕊️ Death/TPD Preset
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
