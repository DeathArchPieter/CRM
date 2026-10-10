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

export const CLAIM_TYPES = [
  'Hospitalisation / Shield',
  'Critical Illness',
  'Accident & Medical',
  'Death / TPD',
  'Disability Income',
  'Travel / Other'
];

export const MAJOR_CLAIM_SUBTYPES = [
  'Critical Illness',
  'Disability Income',
  'Total Permanent Disability (TPD)',
  'Death / Terminal Illness'
];

export const WARD_CLASSES = [
  'Private Hospital Single',
  'Private Hospital Deluxe / Suite',
  'Restructured Class A',
  'Restructured Class B1',
  'Restructured Class B2 / C',
  'Day Surgery / Ambulatory Centre'
];

export const LOG_STATUSES = [
  'Not Required / Direct Claim',
  'LOG Requested from Insurer',
  'LOG Issued ($0 Cash Deposit)',
  'LOG Declined / Self-Pay'
];

export const ACCIDENT_CAUSES = [
  'Sports & Recreational Activity',
  'Slip, Trip & Fall',
  'Road Traffic / Motor Accident',
  'Workplace / Occupational Incident',
  'Food Poisoning',
  'Burns & Scalds',
  'Animal / Insect Bite',
  'Other Accidental Trauma'
];

export const INJURY_TYPES = [
  'Bone Fracture / Dislocation',
  'Sprain / Ligament Strain',
  'Laceration / Deep Cut',
  'Head Injury / Concussion',
  'Dental Injury (Accidental)',
  'Soft Tissue Contusion / Bruising',
  'Burn / Scald',
  'Other'
];

export const TREATMENT_VENUE_OPTIONS = [
  'A&E / Emergency Dept',
  'GP / Polyclinic',
  'Specialist Clinic',
  'TCM Clinic (Acupuncture/Tuina)',
  'Physiotherapy / Rehab',
  'Chiropractor'
];

export const CHECKLIST_TEMPLATES = {
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
