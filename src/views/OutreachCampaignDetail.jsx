import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, Search, Copy, Trash2, 
  UserPlus, Send, TrendingUp, Award, DollarSign, 
  Calendar, Check, Users, FileSpreadsheet, Clock, 
  ShieldAlert, BookOpen, BarChart3, X, UploadCloud, 
  Sparkles, AlertCircle, RefreshCw, Edit3, Save, RotateCcw, Briefcase
} from 'lucide-react';
import DatePicker from '../components/DatePicker';
import AddressAutocomplete from '../components/AddressAutocomplete';

const CAMPAIGN_STAGES = [
  '1. Segmented',
  '2. Opener Sent',
  '3. Info Shared',
  '4. Appt Booked',
  '5. Case Closed',
  'Inactive'
];

const STAGE_COLORS = {
  '1. Segmented': { bg: 'rgba(100, 116, 139, 0.12)', text: '#94a3b8' },
  '2. Opener Sent': { bg: 'rgba(59, 130, 246, 0.12)', text: '#60a5fa' },
  '3. Info Shared': { bg: 'rgba(234, 179, 8, 0.12)', text: '#fbbf24' },
  '4. Appt Booked': { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc' },
  '5. Case Closed': { bg: 'rgba(16, 185, 129, 0.18)', text: '#34d399' },
  'Inactive': { bg: 'rgba(239, 68, 68, 0.12)', text: '#f87171' }
};

const POLICY_TYPES = ['Life', 'Term', 'A&H', 'Shield', 'HI', 'ILP', 'Endowment', 'LTC', 'Disability Income'];
const PIPELINE_STAGES = ['Prospect', 'Fact Finding', 'Proposal Sent', 'Case Submitted', 'Case Issued', 'Closed/Lost'];

// Preset fallback details for Singapore outreach
const DEFAULT_OUTREACH_RESOURCES = {
  usp: 'Plugs Singapore protection gaps with budget-friendly, high-impact risk protection and cashback incentives.',
  segments: [
    {
      name: 'Existing Clients',
      hook: 'Gap filling & effortless coverage boost',
      why: 'No medical check-ups needed. Great way to top up existing coverage.'
    },
    {
      name: 'Young Parents (25-40)',
      hook: 'Balancing budget with major health risks',
      why: 'Low entry cost. Protects family income against major health and critical illness events.'
    },
    {
      name: 'Working Professionals',
      hook: 'High stress, fast-paced corporate lifestyle',
      why: 'Covers key risks making up majority of claims in Singapore. Includes personalized case management.'
    }
  ],
  scripts: [
    {
      step: 1,
      title: 'Step 1: The Soft Opener (Value-Led Hook)',
      goal: 'Start a warm conversation highlighting a relevant stat without being pushy.',
      timeHint: 'Send mid-week (Tuesday/Thursday morning 9:00 AM - 10:30 AM).',
      templateContent: `Hey [Client Name], hope you're having a smooth week!

I was reading through the latest industry data and a stat caught my eye: working Singaporeans actually face an average 74% critical illness protection gap. With healthcare costs creeping up, many of us are exposed without even realizing it.

AIA recently rolled out a very streamlined way to plug this specific gap focusing only on the big 3 risks—Cancer, Heart Attack, and Stroke—which actually account for about 90% of all CI claims here.

It's designed to be budget-friendly and doesn't require medical check-ups. I’ve been mapping out some quick gap-analyses for young families recently. If you’re open to it, I can text over a 1-page summary to see if it makes sense for your current setup? No pressure at all.`
    },
    {
      step: 2,
      title: 'Step 2: The Follow-Up (Value Drop & Feature Highlight)',
      goal: 'Sent 2–3 days later to those who responded "Yes" or expressed interest.',
      timeHint: 'Share brochure summary and highlight the standout features.',
      templateContent: `Great [Client Name]! Here is the summary brochure.

What I personally like about it for folks in our demographic is the Health Cashback feature—if you stay healthy and claim-free, you get 25% of your coverage amount back at age 65 (or after 15 years).

Essentially, it ensures you aren't just paying premiums into a black hole if you stay perfectly healthy.

You could explore a basic S$100k, S$200k, or S$300k coverage boost depending on what you already have in place. Do you happen to remember off the top of your head what your current total CI coverage amount is right now?`
    },
    {
      step: 3,
      title: 'Step 3: The Call to Action (15-Min Sync Close)',
      goal: 'Move from text discussion to a quick 15-minute phone/Zoom sync.',
      timeHint: 'Offer concrete time options.',
      templateContent: `No worries [Client Name] if you don't have the exact number on hand—that's exactly what I'm here for!

Let's do a quick 15-minute coffee chat or Zoom call. I can pull up your existing portfolio, check if you actually have a gap, and see if this plan fits into your budget (premiums can start from less than a dollar a day).

How does this Thursday at 3 PM or Friday at 11 AM sound for a quick catch-up?`
    }
  ],
  objections: [
    {
      objection: "I already have enough insurance from my company.",
      counterScript: "That's awesome that your company provides cover! Most company group plans only cover basic hospitalisation and cease the moment you change jobs or retire. A personal booster stays with you regardless of career changes for less than a dollar a day.",
      why: "Acknowledge existing perk, then highlight portability and retirement gaps."
    },
    {
      objection: "I am a bit tight on budget / cashflow right now.",
      counterScript: "Completely understand! That's exactly why this plan was designed—it zeroes in on top claim risks to keep premiums down to just S$0.56–S$1.20/day instead of pricey comprehensive plans. Plus, with the cash refund at age 65, it doubles as savings.",
      why: "Validates budget concerns while highlighting low dollar-a-day pricing and cashback."
    },
    {
      objection: "Just text me the PDF brochure, I'll read it myself.",
      counterScript: "Sure thing! Sending the 1-page summary right over. Take a quick look at page 2 for the benefit tables. Let's do a quick 5-min WhatsApp call on Thursday so I can answer any questions and run a quick quote for your age bracket.",
      why: "Provides materials friction-free while maintaining a tentative next touchpoint."
    }
  ],
  routines: [
    { time: '09:00 AM - 09:30 AM', task: 'The Morning Batch Send', desc: 'Send out 5 to 10 Step 1 Opener messages. Keep batch size manageable to ensure authentic conversations.' },
    { time: '12:00 PM - 12:30 PM', task: 'The Mid-Day Check', desc: 'Reply to morning responses, send out Step 2 brochure details, and lock in appointment slots.' },
    { time: '05:00 PM - 05:30 PM', task: 'The Follow-Up & Calendar Lock', desc: 'Check on outstanding chats, send gentle reminders, and log booked meetings into the CRM calendar.' }
  ]
};

export default function OutreachCampaignDetail({ campaign: campaignProp, onBack, onSelectClient, onNavigateTab }) {
  const [campaign, setCampaign] = useState(campaignProp || {});

  useEffect(() => {
    if (campaignProp) {
      setCampaign(campaignProp);
      if (campaignProp.contacts) setContacts(campaignProp.contacts);
    }
  }, [campaignProp]);

  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState(campaignProp?.contacts || []);
  const [clients, setClients] = useState([]);
  const [allPolicies, setAllPolicies] = useState([]);
  const [project100List, setProject100List] = useState([]);

  // Active Workspace Tab: 'workspace' | 'playbook' | 'analytics'
  const [activeTab, setActiveTab] = useState('workspace');
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState('All');
  const [copiedKey, setCopiedKey] = useState(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [enrollMode, setEnrollMode] = useState('smart'); // 'smart' | 'crm' | 'p100' | 'manual'
  const [selectedSmartSegment, setSelectedSmartSegment] = useState('all-unenrolled');
  const [selectedClientIds, setSelectedClientIds] = useState(new Set());
  const [selectedEnrollClient, setSelectedEnrollClient] = useState('');

  // Close Case Modal State
  const [isCloseCaseModalOpen, setIsCloseCaseModalOpen] = useState(false);
  const [closeCaseTarget, setCloseCaseTarget] = useState(null);
  const [closeCaseForm, setCloseCaseForm] = useState({ 
    anp: '', 
    fyc: '', 
    policyName: campaign.productName || campaign.productFocus || 'Campaign Policy',
    policyType: 'Life',
    notes: '' 
  });

  // Pipeline Opportunity Modal State
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
  const [pipelineTarget, setPipelineTarget] = useState(null);
  const [pipelineForm, setPipelineForm] = useState({
    policyName: campaign.productName || campaign.productFocus || 'Strategic Protection Plan',
    policyType: 'Life',
    estimatedPremium: '3600',
    estimatedFYC: '1440',
    stage: 'Prospect',
    expectedCloseDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    notes: ''
  });

  // Calendar Meeting Modal State
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetingTarget, setMeetingTarget] = useState(null);
  const [meetingForm, setMeetingForm] = useState({
    description: '',
    dueDate: new Date(Date.now() + 2*24*60*60*1000).toISOString().split('T')[0],
    dueTime: '15:00',
    dueEndTime: '16:00',
    location: 'Coffee Sync / Client Office'
  });

  // Manual Add Form State
  const [manualForm, setManualForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    segment: 'Target Prospect',
    stage: '1. Segmented',
    notes: ''
  });

  // Re-scan Brochure / Regenerate Playbook State
  const [isReScanModalOpen, setIsReScanModalOpen] = useState(false);
  const [reScanMode, setReScanMode] = useState('refine'); // 'refine' | 'replace'
  const [reScanFile, setReScanFile] = useState(null);
  const [reScanSummary, setReScanSummary] = useState('');
  const [isReScanning, setIsReScanning] = useState(false);
  const [reScanError, setReScanError] = useState('');
  const reScanFileInputRef = useRef(null);

  // Direct Inline Editing State for Playbook & Objections
  const [editingField, setEditingField] = useState(null); // 'usp' | 'script-0' | 'script-1' | 'script-2' | 'obj-0' | 'obj-1' | 'obj-2'
  const [editDraft, setEditDraft] = useState('');

  // Resolve playbook resources with defensive fallbacks
  const PLAYBOOK = useMemo(() => {
    if (campaign.playbook && Array.isArray(campaign.playbook.scripts) && campaign.playbook.scripts.length > 0) {
      return {
        usp: campaign.playbook.usp || DEFAULT_OUTREACH_RESOURCES.usp,
        segments: Array.isArray(campaign.playbook.segments) && campaign.playbook.segments.length > 0 ? campaign.playbook.segments : DEFAULT_OUTREACH_RESOURCES.segments,
        scripts: campaign.playbook.scripts.map((s, idx) => ({
          step: s.step || (idx + 1),
          title: s.title || `Step ${idx + 1}`,
          goal: s.goal || 'Engage prospect with valuable insight.',
          timeHint: s.timeHint || 'Mid-week morning',
          templateContent: s.templateContent || ''
        })),
        objections: Array.isArray(campaign.playbook.objections) && campaign.playbook.objections.length > 0 ? campaign.playbook.objections : DEFAULT_OUTREACH_RESOURCES.objections,
        routines: Array.isArray(campaign.playbook.routines) && campaign.playbook.routines.length > 0 ? campaign.playbook.routines : DEFAULT_OUTREACH_RESOURCES.routines
      };
    }
    return DEFAULT_OUTREACH_RESOURCES;
  }, [campaign]);

  const loadData = async () => {
    setLoading(true);
    if (window.electronAPI) {
      try {
        const [cRes, polRes, pRes] = await Promise.all([
          window.electronAPI.getClients ? window.electronAPI.getClients() : Promise.resolve({ success: false }),
          window.electronAPI.getAllPolicies ? window.electronAPI.getAllPolicies() : Promise.resolve({ success: false }),
          window.electronAPI.getProject100Contacts ? window.electronAPI.getProject100Contacts() : Promise.resolve({ success: false })
        ]);

        if (cRes?.success) setClients(cRes.data || []);
        if (polRes?.success) setAllPolicies(polRes.data || []);
        if (pRes?.success) setProject100List(pRes.data || []);
      } catch (err) {
        console.error("Failed to load campaign workspace references:", err);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveCampaignChanges = async (updatedContacts) => {
    setContacts(updatedContacts);
    if (window.electronAPI?.updateInitiative && campaign.id) {
      await window.electronAPI.updateInitiative({
        id: campaign.id,
        contacts: updatedContacts
      });
    }
  };

  const handleReScanFileSelect = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64Data = dataUrl.split(',')[1];
      const detectedMime = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : file.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
      setReScanFile({
        base64: base64Data,
        mimeType: detectedMime,
        name: file.name,
        size: file.size
      });
      setReScanError('');
    };
    reader.onerror = () => {
      setReScanError('Failed to read file.');
    };
    reader.readAsDataURL(file);
  };

  const handleStartEdit = (field, initialText) => {
    setEditingField(field);
    setEditDraft(initialText || '');
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditDraft('');
  };

  const handleSavePlaybookEdit = async (field) => {
    const currentPlaybook = { 
      usp: PLAYBOOK.usp,
      segments: PLAYBOOK.segments,
      scripts: [...PLAYBOOK.scripts],
      objections: [...PLAYBOOK.objections],
      routines: PLAYBOOK.routines
    };

    if (field === 'usp') {
      currentPlaybook.usp = editDraft;
    } else if (field.startsWith('script-')) {
      const idx = parseInt(field.replace('script-', ''), 10);
      if (currentPlaybook.scripts && currentPlaybook.scripts[idx]) {
        currentPlaybook.scripts[idx] = {
          ...currentPlaybook.scripts[idx],
          templateContent: editDraft
        };
      }
    } else if (field.startsWith('obj-')) {
      const idx = parseInt(field.replace('obj-', ''), 10);
      if (currentPlaybook.objections && currentPlaybook.objections[idx]) {
        currentPlaybook.objections[idx] = {
          ...currentPlaybook.objections[idx],
          counterScript: editDraft
        };
      }
    }

    const updatedCampaign = {
      ...campaign,
      playbook: currentPlaybook
    };

    setCampaign(updatedCampaign);
    setEditingField(null);
    setEditDraft('');

    if (window.electronAPI?.updateInitiative && campaign.id) {
      await window.electronAPI.updateInitiative({
        id: campaign.id,
        playbook: currentPlaybook
      });
    }
  };

  const handleReScanPlaybookSubmit = async (e) => {
    e.preventDefault();
    if (!reScanFile && !reScanSummary.trim() && reScanMode === 'replace') {
      setReScanError('Please attach a brochure file (PDF/image) or enter product summary text.');
      return;
    }

    setIsReScanning(true);
    setReScanError('');

    try {
      const payload = {
        text: reScanSummary.trim(),
        fileData: reScanFile ? {
          base64: reScanFile.base64,
          mimeType: reScanFile.mimeType
        } : null,
        existingPlaybook: campaign.playbook || PLAYBOOK,
        mode: reScanMode,
        productName: campaign.productName || campaign.productFocus || 'Strategic Advisory Plan'
      };

      const res = await window.electronAPI.generateOutreachPlaybook(payload);
      if (res.success && res.data) {
        const newPlaybook = res.data;
        const newProductName = newPlaybook.productFocus || campaign.productName;
        const newTargetAudience = newPlaybook.targetAudience || campaign.targetAudience;

        const updatedCampaign = {
          ...campaign,
          productName: newProductName,
          productFocus: newProductName,
          targetAudience: newTargetAudience,
          playbook: newPlaybook
        };

        setCampaign(updatedCampaign);

        if (window.electronAPI?.updateInitiative && campaign.id) {
          await window.electronAPI.updateInitiative({
            id: campaign.id,
            productName: newProductName,
            productFocus: newProductName,
            targetAudience: newTargetAudience,
            playbook: newPlaybook
          });
        }

        setIsReScanModalOpen(false);
        setReScanFile(null);
        setReScanSummary('');
      } else {
        setReScanError("AI Analysis failed: " + (res.error || 'Unknown error'));
      }
    } catch (err) {
      console.error("Failed to rescan playbook:", err);
      setReScanError("An error occurred during analysis: " + err.message);
    } finally {
      setIsReScanning(false);
    }
  };

  // Stage Advancement Handler
  const handleUpdateTargetStage = async (targetId, newStage) => {
    const target = contacts.find(c => c.id === targetId);
    if (!target) return;

    if (newStage === '5. Case Closed') {
      setCloseCaseTarget(target);
      setCloseCaseForm({ 
        anp: target.anp || '', 
        fyc: target.fyc || '', 
        policyName: campaign.productName || campaign.productFocus || 'Campaign Policy',
        policyType: 'Life',
        notes: target.notes || '' 
      });
      setIsCloseCaseModalOpen(true);
      return;
    }

    if (newStage === '4. Appt Booked') {
      // Prompt meeting creation
      setMeetingTarget(target);
      setMeetingForm({
        description: `Campaign Catchup (${campaign.title || 'Outreach'}): ${target.fullName}`,
        dueDate: new Date(Date.now() + 2*24*60*60*1000).toISOString().split('T')[0],
        dueTime: '15:00',
        dueEndTime: '16:00',
        location: 'Coffee Sync / Client Office'
      });
      setIsMeetingModalOpen(true);
    }

    const updated = contacts.map(c => {
      if (c.id !== targetId) return c;
      return { ...c, stage: newStage, updatedAt: new Date().toISOString() };
    });
    await saveCampaignChanges(updated);
  };

  const handleOpenClientProfile = (contact) => {
    const matchingClient = clients.find(
      c => c.id === contact.clientId || (c.fullName || '').toLowerCase().trim() === (contact.fullName || '').toLowerCase().trim()
    );
    if (matchingClient && onSelectClient) {
      onSelectClient(matchingClient);
    } else if (onNavigateTab) {
      onNavigateTab('clients');
    }
  };

  const handlePortTargetToClient = async (target) => {
    if (!target) return;
    const existing = clients.find(
      c => c.id === target.clientId || (c.fullName || '').toLowerCase().trim() === (target.fullName || '').toLowerCase().trim()
    );

    if (existing) {
      const updated = contacts.map(c => {
        if (c.id !== target.id) return c;
        return { ...c, clientId: existing.id, updatedAt: new Date().toISOString() };
      });
      await saveCampaignChanges(updated);
      await loadData();
      return;
    }

    if (window.electronAPI?.addClient) {
      const clientRes = await window.electronAPI.addClient({
        fullName: target.fullName,
        preferredName: (target.fullName || '').split(' ')[0],
        phone: target.phone || '',
        email: target.email || '',
        clientStatus: 'Prospect',
        tags: [`Campaign: ${campaign.title || 'Outreach'}`, target.segment || 'Campaign Target'],
        notes: `[Ported from Campaign: ${campaign.title || 'Outreach'}] Segment: ${target.segment || 'N/A'}. ${target.notes || ''}`
      });

      if (clientRes.success) {
        const updated = contacts.map(c => {
          if (c.id !== target.id) return c;
          return { ...c, clientId: clientRes.id, updatedAt: new Date().toISOString() };
        });
        await saveCampaignChanges(updated);
        await loadData();
      }
    }
  };

  const handleOpenCreatePipelineModal = (target) => {
    setPipelineTarget(target);
    setPipelineForm({
      policyName: campaign.productName || campaign.productFocus || 'Strategic Advisory Plan',
      policyType: 'Life',
      estimatedPremium: target.anp ? String(target.anp) : '3600',
      estimatedFYC: target.fyc ? String(target.fyc) : '1440',
      stage: target.stage === '5. Case Closed' ? 'Case Issued' : target.stage === '4. Appt Booked' ? 'Fact Finding' : 'Prospect',
      expectedCloseDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      notes: target.notes || `Campaign: ${campaign.title || 'Outreach'}`
    });
    setIsPipelineModalOpen(true);
  };

  const handlePipelineSubmit = async (e) => {
    e.preventDefault();
    if (!pipelineTarget) return;

    // Ensure client profile exists
    let clientId = pipelineTarget.clientId;
    if (!clientId) {
      const existing = clients.find(
        c => (c.fullName || '').toLowerCase().trim() === (pipelineTarget.fullName || '').toLowerCase().trim()
      );
      if (existing) {
        clientId = existing.id;
      } else if (window.electronAPI?.addClient) {
        const clientRes = await window.electronAPI.addClient({
          fullName: pipelineTarget.fullName,
          preferredName: (pipelineTarget.fullName || '').split(' ')[0],
          phone: pipelineTarget.phone || '',
          email: pipelineTarget.email || '',
          clientStatus: 'Prospect',
          tags: [`Campaign: ${campaign.title || 'Outreach'}`, pipelineTarget.segment || 'Target'],
          notes: `[Created via Pipeline Deal from Campaign: ${campaign.title || 'Outreach'}]`
        });
        if (clientRes.success) {
          clientId = clientRes.id;
        }
      }
    }

    if (window.electronAPI?.addPipelineCase) {
      await window.electronAPI.addPipelineCase({
        clientName: pipelineTarget.fullName,
        policyName: pipelineForm.policyName,
        policyType: pipelineForm.policyType,
        estimatedPremium: Number(pipelineForm.estimatedPremium) || 0,
        estimatedFYC: Number(pipelineForm.estimatedFYC) || 0,
        stage: pipelineForm.stage,
        expectedCloseDate: pipelineForm.expectedCloseDate || null,
        notes: `[Campaign: ${campaign.title || 'Outreach'}] ${pipelineForm.notes || ''}`
      });

      const updated = contacts.map(c => {
        if (c.id !== pipelineTarget.id) return c;
        return { 
          ...c, 
          clientId: clientId || c.clientId,
          anp: Number(pipelineForm.estimatedPremium) || c.anp,
          fyc: Number(pipelineForm.estimatedFYC) || c.fyc,
          updatedAt: new Date().toISOString() 
        };
      });
      await saveCampaignChanges(updated);
      await loadData();
    }

    setIsPipelineModalOpen(false);
    setPipelineTarget(null);
  };

  const handleCloseCaseSubmit = async (e) => {
    e.preventDefault();
    if (!closeCaseTarget) return;

    const anpVal = Number(closeCaseForm.anp) || 0;
    const fycVal = Number(closeCaseForm.fyc) || 0;

    // Ensure client profile exists in db.clients
    let clientId = closeCaseTarget.clientId;
    if (!clientId) {
      const existing = clients.find(
        c => (c.fullName || '').toLowerCase().trim() === (closeCaseTarget.fullName || '').toLowerCase().trim()
      );
      if (existing) {
        clientId = existing.id;
      } else if (window.electronAPI?.addClient) {
        const clientRes = await window.electronAPI.addClient({
          fullName: closeCaseTarget.fullName,
          preferredName: (closeCaseTarget.fullName || '').split(' ')[0],
          phone: closeCaseTarget.phone || '',
          email: closeCaseTarget.email || '',
          clientStatus: 'Active',
          tags: [`Campaign: ${campaign.title || 'Outreach'}`, 'Closed Policy'],
          notes: `[Client converted via Campaign: ${campaign.title || 'Outreach'}] Policy: ${closeCaseForm.policyName}. ANP: $${anpVal}. FYC: $${fycVal}.`
        });
        if (clientRes.success) {
          clientId = clientRes.id;
        }
      }
    }

    const updated = contacts.map(c => {
      if (c.id !== closeCaseTarget.id) return c;
      return { 
        ...c, 
        clientId: clientId || c.clientId,
        stage: '5. Case Closed', 
        anp: anpVal, 
        fyc: fycVal, 
        notes: closeCaseForm.notes,
        updatedAt: new Date().toISOString() 
      };
    });

    await saveCampaignChanges(updated);

    // Auto-Register Deal into Centralized Pipeline for MDRT tracking
    if (window.electronAPI?.addPipelineCase) {
      try {
        await window.electronAPI.addPipelineCase({
          clientName: closeCaseTarget.fullName,
          policyName: closeCaseForm.policyName || campaign.productName || campaign.productFocus || 'Campaign Policy',
          policyType: closeCaseForm.policyType || 'Life',
          estimatedPremium: anpVal,
          estimatedFYC: fycVal,
          stage: 'Case Issued',
          expectedCloseDate: new Date().toISOString().split('T')[0],
          notes: `[Campaign: ${campaign.title || 'Outreach'}] ${closeCaseForm.notes || 'Closed via outreach campaign.'}`
        });
      } catch (err) {
        console.error("Failed to sync pipeline case:", err);
      }
    }

    setIsCloseCaseModalOpen(false);
    setCloseCaseTarget(null);
    await loadData();
  };

  const handleScheduleMeetingSubmit = async (e) => {
    e.preventDefault();
    if (!meetingTarget) return;

    if (window.electronAPI?.addTask) {
      try {
        await window.electronAPI.addTask({
          clientId: meetingTarget.portedClientId || null,
          description: meetingForm.description,
          dueDate: meetingForm.dueDate,
          dueTime: meetingForm.dueTime,
          dueEndTime: meetingForm.dueEndTime,
          location: meetingForm.location,
          status: 'Pending'
        });
      } catch (err) {
        console.error("Failed to create calendar meeting task:", err);
      }
    }

    setIsMeetingModalOpen(false);
    setMeetingTarget(null);
  };

  // Smart Audience Segmentation Calculation
  const enrolledContactNames = useMemo(() => {
    return new Set(contacts.map(c => (c.fullName || '').toLowerCase().trim()));
  }, [contacts]);

  const smartSegmentProspects = useMemo(() => {
    if (selectedSmartSegment === 'all-unenrolled') {
      return clients
        .filter(c => !enrolledContactNames.has(c.fullName.toLowerCase().trim()))
        .map(c => ({ id: c.id, fullName: c.fullName, phone: c.phone, email: c.email, segment: 'CRM Client', reason: 'Active Client' }));
    }

    if (selectedSmartSegment === 'no-ci') {
      return clients
        .filter(c => {
          if (enrolledContactNames.has(c.fullName.toLowerCase().trim())) return false;
          const clientPols = allPolicies.filter(p => p.clientId === c.id);
          const hasCi = clientPols.some(p => p.type === 'A&H' || (p.coverages && (p.coverages.ci > 0 || p.coverages.earlyCi > 0)));
          return !hasCi;
        })
        .map(c => ({ id: c.id, fullName: c.fullName, phone: c.phone, email: c.email, segment: 'No CI Protection', reason: 'Zero in-force Critical Illness cover' }));
    }

    if (selectedSmartSegment === 'shield-only') {
      return clients
        .filter(c => {
          if (enrolledContactNames.has(c.fullName.toLowerCase().trim())) return false;
          const clientPols = allPolicies.filter(p => p.clientId === c.id);
          const hasShield = clientPols.some(p => p.type === 'Shield');
          const hasWealth = clientPols.some(p => p.type === 'Life' || p.type === 'ILP' || p.type === 'Endowment');
          return hasShield && !hasWealth;
        })
        .map(c => ({ id: c.id, fullName: c.fullName, phone: c.phone, email: c.email, segment: 'Shield Only Client', reason: 'Has Hospital plan, no wealth/life plans' }));
    }

    if (selectedSmartSegment === 'p100-high-priority') {
      return project100List
        .filter(p => {
          if (enrolledContactNames.has(p.fullName.toLowerCase().trim())) return false;
          const total = (p.scoreNeed || 3) + (p.scoreAccessibility || 3) + (p.scoreIncome || 3) + (p.scoreTrust || 3);
          return total >= 16;
        })
        .map(p => ({ id: p.id, fullName: p.fullName, phone: p.phone, email: p.email, segment: `P100 (${p.category || 'Warm'})`, reason: `High N.A.S.T. Priority (${(((p.scoreNeed||3)+(p.scoreAccessibility||3)+(p.scoreIncome||3)+(p.scoreTrust||3))/4).toFixed(1)}★)` }));
    }

    if (selectedSmartSegment === 'young-family') {
      return clients
        .filter(c => {
          if (enrolledContactNames.has(c.fullName.toLowerCase().trim())) return false;
          const tagMatch = c.tags && c.tags.some(t => t.toLowerCase().includes('family') || t.toLowerCase().includes('child') || t.toLowerCase().includes('parent'));
          const notesMatch = c.notes && (c.notes.toLowerCase().includes('kid') || c.notes.toLowerCase().includes('child') || c.notes.toLowerCase().includes('baby') || c.notes.toLowerCase().includes('son') || c.notes.toLowerCase().includes('daughter'));
          return tagMatch || notesMatch;
        })
        .map(c => ({ id: c.id, fullName: c.fullName, phone: c.phone, email: c.email, segment: 'Young Family', reason: 'Identified children / dependent needs' }));
    }

    return [];
  }, [selectedSmartSegment, clients, allPolicies, project100List, enrolledContactNames]);

  const handleToggleSelectClient = (id) => {
    setSelectedClientIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllSmartProspects = () => {
    if (selectedClientIds.size === smartSegmentProspects.length) {
      setSelectedClientIds(new Set());
    } else {
      setSelectedClientIds(new Set(smartSegmentProspects.map(p => p.id)));
    }
  };

  const handleBatchEnrollSubmit = async () => {
    if (selectedClientIds.size === 0) return;

    const toEnroll = smartSegmentProspects.filter(p => selectedClientIds.has(p.id));
    const newTargets = toEnroll.map(p => ({
      id: `target-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      fullName: p.fullName,
      phone: p.phone || '',
      email: p.email || '',
      segment: p.segment || 'Target Prospect',
      stage: '1. Segmented',
      notes: `Enrolled via Smart Filter: ${p.reason}`,
      portedClientId: String(p.id).startsWith('target') ? null : p.id,
      createdAt: new Date().toISOString()
    }));

    const updated = [...contacts, ...newTargets];
    await saveCampaignChanges(updated);
    setIsAddModalOpen(false);
    setSelectedClientIds(new Set());
  };

  // Single Contact Enroll Handler
  const handleSingleEnrollSubmit = async (e) => {
    e.preventDefault();
    let newTarget = null;

    if (enrollMode === 'crm') {
      const client = clients.find(c => c.id === selectedEnrollClient);
      if (!client) return;
      newTarget = {
        id: `target-${Date.now()}`,
        fullName: client.fullName,
        phone: client.phone || '',
        email: client.email || '',
        segment: 'Existing Clients',
        stage: '1. Segmented',
        notes: client.notes || '',
        portedClientId: client.id,
        createdAt: new Date().toISOString()
      };
    } else if (enrollMode === 'p100') {
      const p100 = project100List.find(p => p.id === selectedEnrollClient);
      if (!p100) return;
      newTarget = {
        id: `target-${Date.now()}`,
        fullName: p100.fullName,
        phone: p100.phone || '',
        email: p100.email || '',
        segment: p100.category || 'Warm Prospect',
        stage: '1. Segmented',
        notes: p100.notes || '',
        createdAt: new Date().toISOString()
      };
    } else {
      if (!manualForm.fullName.trim()) return;
      newTarget = {
        id: `target-${Date.now()}`,
        fullName: manualForm.fullName,
        phone: manualForm.phone || '',
        email: manualForm.email || '',
        segment: manualForm.segment,
        stage: manualForm.stage,
        notes: manualForm.notes || '',
        createdAt: new Date().toISOString()
      };
    }

    if (newTarget) {
      const updated = [...contacts, newTarget];
      await saveCampaignChanges(updated);
      setIsAddModalOpen(false);
      setSelectedEnrollClient('');
      setManualForm({ fullName: '', phone: '', email: '', segment: 'Target Prospect', stage: '1. Segmented', notes: '' });
    }
  };

  const handleDeleteTarget = async (targetId) => {
    if (!window.confirm("Remove this target from the campaign?")) return;
    const updated = contacts.filter(c => c.id !== targetId);
    await saveCampaignChanges(updated);
  };

  // 1-Click Script Helper
  const getPersonalizedScriptText = (contact, stepIndex) => {
    const preferredName = (contact.fullName || '').split(' ')[0] || contact.fullName || 'there';
    const scriptObj = PLAYBOOK.scripts?.[stepIndex];
    if (!scriptObj) return '';

    return (scriptObj.templateContent || '')
      .replace(/\[Client Name\]/g, preferredName)
      .replace(/\{clientName\}/g, preferredName)
      .replace(/\$\{clientName\}/g, preferredName);
  };

  const handleCopyPersonalizedScript = (contact, stepIndex) => {
    const text = getPersonalizedScriptText(contact, stepIndex);
    navigator.clipboard.writeText(text);
    setCopiedKey(`${contact.id}-${stepIndex}`);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleSendWhatsApp = (contact, stepIndex = 0) => {
    const text = getPersonalizedScriptText(contact, stepIndex);
    const cleanPhone = (contact.phone || '').replace(/[^\d+]/g, '');
    const encodedText = encodeURIComponent(text);
    const url = cleanPhone 
      ? `https://wa.me/${cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone}?text=${encodedText}`
      : `https://web.whatsapp.com/send?text=${encodedText}`;
    
    if (window.electronAPI && window.electronAPI.openPath) {
      window.electronAPI.openPath(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const formatCurrency = (val) => {
    if (!val) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  // Funnel & Performance Calculations
  const totalEnrolled = contacts.length;
  const openerSentCount = contacts.filter(c => c.stage !== '1. Segmented' && c.stage !== 'Inactive').length;
  const infoSharedCount = contacts.filter(c => c.stage === '3. Info Shared' || c.stage === '4. Appt Booked' || c.stage === '5. Case Closed').length;
  const apptBookedCount = contacts.filter(c => c.stage === '4. Appt Booked' || c.stage === '5. Case Closed').length;
  const casesClosedCount = contacts.filter(c => c.stage === '5. Case Closed').length;

  const totalANP = contacts.reduce((sum, c) => sum + (Number(c.anp) || 0), 0);
  const totalFYC = contacts.reduce((sum, c) => sum + (Number(c.fyc) || 0), 0);

  const apptRate = openerSentCount > 0 ? Math.round((apptBookedCount / openerSentCount) * 100) : 0;
  const closingRate = apptBookedCount > 0 ? Math.round((casesClosedCount / apptBookedCount) * 100) : 0;

  const filteredContacts = contacts.filter(c => {
    const nameMatch = (c.fullName || '').toLowerCase().includes(search.toLowerCase());
    const phoneMatch = c.phone && c.phone.includes(search);
    const segmentMatch = c.segment && c.segment.toLowerCase().includes(search.toLowerCase());
    
    if (!nameMatch && !phoneMatch && !segmentMatch) return false;
    if (filterStage !== 'All' && c.stage !== filterStage) return false;
    return true;
  });

  const handleCopyScorecard = () => {
    const scorecard = `📊 CAMPAIGN PERFORMANCE SCORECARD: ${campaign.title || 'Outreach Campaign'}
Product: ${campaign.productName || campaign.productFocus || 'N/A'} • Audience: ${campaign.targetAudience || 'N/A'}

- Enrolled Prospects: ${totalEnrolled}
- Openers Sent: ${openerSentCount}
- Info / Brochures Shared: ${infoSharedCount}
- Appointments Booked: ${apptBookedCount} / ${campaign.targetAppointments || 20} Target
- Cases Closed: ${casesClosedCount}
- Conversion Rates: Appt: ${apptRate}% | Closing: ${closingRate}%
- Total Campaign ANP: ${formatCurrency(totalANP)}
- Total Campaign FYC: ${formatCurrency(totalFYC)}

Generated on: ${new Date().toLocaleDateString()}`;

    navigator.clipboard.writeText(scorecard);
    setCopiedKey('scorecard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExportCsv = () => {
    const headers = ['Full Name', 'Phone', 'Email', 'Segment', 'Campaign Stage', 'ANP ($)', 'FYC ($)', 'Notes'];
    const rows = contacts.map(c => [
      `"${c.fullName || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.email || ''}"`,
      `"${c.segment || ''}"`,
      `"${c.stage || ''}"`,
      c.anp || 0,
      c.fyc || 0,
      `"${(c.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${(campaign.title || 'campaign').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_scorecard.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="view-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px', height: '100%' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button className="btn btn-secondary" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onBack}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 className="text-gradient" style={{ fontSize: '22px', margin: 0 }}>{campaign.title || 'Outreach Campaign'}</h1>
              <span className="glass-panel" style={{ fontSize: '11px', color: '#60a5fa', padding: '2px 8px', borderRadius: '10px' }}>
                {campaign.productName || campaign.productFocus || 'Advisory Playbook'}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px', marginTop: '2px' }}>
              Target Audience: <strong style={{ color: 'var(--text-primary)' }}>{campaign.targetAudience || 'General Prospects'}</strong> • Leader: <span style={{ color: 'var(--text-muted)' }}>{campaign.leader || 'Pieter Beetsma'}</span>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }} onClick={() => setIsAddModalOpen(true)}>
            <UserPlus size={15} /> Enroll Prospects
          </button>
        </div>
      </header>

      {/* Financial ROI & Funnel Metrics Summary Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        
        {/* Total ANP Generated */}
        <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', borderRadius: '12px' }}>
          <div style={{ padding: '9px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <DollarSign size={18} />
          </div>
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Campaign ANP Generated</div>
            <div style={{ fontSize: '19px', fontWeight: '700', color: '#34d399' }}>{formatCurrency(totalANP)}</div>
          </div>
        </div>

        {/* Total FYC Generated */}
        <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', borderRadius: '12px' }}>
          <div style={{ padding: '9px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
            <Award size={18} />
          </div>
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Campaign FYC Generated</div>
            <div style={{ fontSize: '19px', fontWeight: '700', color: '#a78bfa' }}>{formatCurrency(totalFYC)}</div>
          </div>
        </div>

        {/* Appointments Funnel */}
        <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', borderRadius: '12px' }}>
          <div style={{ padding: '9px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
            <Calendar size={18} />
          </div>
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Appts Booked</div>
            <div style={{ fontSize: '19px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {apptBookedCount} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>/ {campaign.targetAppointments || 20} Goal</span>
            </div>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', borderRadius: '12px' }}>
          <div style={{ padding: '9px', borderRadius: '10px', background: 'rgba(234, 179, 8, 0.15)', color: '#fbbf24' }}>
            <TrendingUp size={18} />
          </div>
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Conversion Health</div>
            <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Appt: <span style={{ color: '#fbbf24' }}>{apptRate}%</span> • Close: <span style={{ color: '#34d399' }}>{closingRate}%</span>
            </div>
          </div>
        </div>

      </div>

      {/* Navigation Tab Bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', gap: '8px' }}>
        <button 
          className={`btn ${activeTab === 'workspace' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '12.5px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => setActiveTab('workspace')}
        >
          <Users size={14} /> 🎯 Targets & 1-Click Outreach ({contacts.length})
        </button>

        <button 
          className={`btn ${activeTab === 'playbook' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '12.5px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => setActiveTab('playbook')}
        >
          <BookOpen size={14} /> 📖 Script Playbook & Objections Hub
        </button>

        <button 
          className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '12.5px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={14} /> 📊 Funnel Analytics & Scorecard
        </button>
      </div>

      {/* TAB 1: WORKSPACE & TARGET PROSPECTS LIST */}
      {activeTab === 'workspace' && (
        <div className="glass-panel" style={{ flex: 1, padding: '0', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          
          {/* Table Filter Bar */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="input-field" 
                style={{ width: '100%', paddingLeft: '34px', fontSize: '12.5px' }} 
                placeholder="Search enrolled targets..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Filter Stage:</span>
              <select 
                className="input-field" 
                style={{ fontSize: '12px', padding: '5px 10px', background: 'var(--bg-base)' }}
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
              >
                <option value="All">All Stages ({contacts.length})</option>
                {CAMPAIGN_STAGES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Prospects List Table */}
          {filteredContacts.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Users size={40} style={{ opacity: 0.35, marginBottom: '12px' }} />
              <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>No Enrolled Prospects</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Click <strong>Enroll Prospects</strong> to batch-enroll clients with protection gaps or Project 100 targets.</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '12px 18px', color: 'var(--text-secondary)', fontWeight: '500' }}>Prospect Name</th>
                  <th style={{ padding: '12px 18px', color: 'var(--text-secondary)', fontWeight: '500' }}>Segment</th>
                  <th style={{ padding: '12px 18px', color: 'var(--text-secondary)', fontWeight: '500' }}>Campaign Stage</th>
                  <th style={{ padding: '12px 18px', color: 'var(--text-secondary)', fontWeight: '500' }}>ANP / FYC</th>
                  <th style={{ padding: '12px 18px', color: 'var(--text-secondary)', fontWeight: '500', textAlign: 'right' }}>1-Click Messaging</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map(contact => {
                  const stageColor = STAGE_COLORS[contact.stage] || STAGE_COLORS['1. Segmented'];
                  return (
                    <tr key={contact.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background-color 0.15s' }}>
                      
                      {/* Name & Contact */}
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{contact.fullName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{contact.phone || contact.email || 'No phone'}</div>
                      </td>

                      {/* Segment */}
                      <td style={{ padding: '12px 18px', color: 'var(--text-secondary)' }}>
                        <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                          {contact.segment || 'General'}
                        </span>
                      </td>

                      {/* Stage Selector */}
                      <td style={{ padding: '12px 18px' }}>
                        <select 
                          value={contact.stage}
                          onChange={(e) => handleUpdateTargetStage(contact.id, e.target.value)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: stageColor.bg,
                            color: stageColor.text,
                            border: 'none',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          {CAMPAIGN_STAGES.map(st => (
                            <option key={st} value={st} style={{ backgroundColor: '#1e293b', color: '#fff' }}>{st}</option>
                          ))}
                        </select>
                      </td>

                      {/* ANP / FYC Display */}
                      <td style={{ padding: '12px 18px' }}>
                        {contact.stage === '5. Case Closed' ? (
                          <div>
                            <div style={{ color: '#34d399', fontWeight: '600', fontSize: '11.5px' }}>
                              ANP: {formatCurrency(contact.anp)}
                            </div>
                            <div style={{ color: '#a78bfa', fontSize: '10.5px' }}>
                              FYC: {formatCurrency(contact.fyc)}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>-</span>
                        )}
                      </td>

                      {/* 1-Click Copy & Messaging Actions */}
                      <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button 
                            className="btn"
                            style={{ padding: '4px 7px', fontSize: '11px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '3px' }}
                            onClick={() => handleCopyPersonalizedScript(contact, 0)}
                            title="Copy Step 1 Soft Opener"
                          >
                            {copiedKey === `${contact.id}-0` ? <Check size={11} /> : <Copy size={11} />} Step 1
                          </button>

                          <button 
                            className="btn"
                            style={{ padding: '4px 7px', fontSize: '11px', backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '3px' }}
                            onClick={() => handleCopyPersonalizedScript(contact, 1)}
                            title="Copy Step 2 Value Drop"
                          >
                            {copiedKey === `${contact.id}-1` ? <Check size={11} /> : <Copy size={11} />} Step 2
                          </button>

                          <button 
                            className="btn"
                            style={{ padding: '4px 7px', fontSize: '11px', backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '3px' }}
                            onClick={() => handleCopyPersonalizedScript(contact, 2)}
                            title="Copy Step 3 CTA Close"
                          >
                            {copiedKey === `${contact.id}-2` ? <Check size={11} /> : <Copy size={11} />} Step 3
                          </button>

                          <button 
                            className="btn"
                            style={{ padding: '4px 7px', fontSize: '11px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#34d399', display: 'flex', alignItems: 'center', gap: '3px' }}
                            onClick={() => handleSendWhatsApp(contact, 0)}
                            title="Send via WhatsApp"
                          >
                            <Send size={11} /> WhatsApp
                          </button>

                          {/* 👤 Port to CRM button or Clickable Linked Badge */}
                          {(contact.clientId || clients.some(c => (c.fullName || '').toLowerCase().trim() === (contact.fullName || '').toLowerCase().trim())) ? (
                            <button 
                              className="btn" 
                              style={{ padding: '3px 7px', fontSize: '10.5px', color: '#34d399', backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                              onClick={() => handleOpenClientProfile(contact)}
                              title="Open Client 360 Profile in CRM"
                            >
                              <Check size={10} /> Client ↗
                            </button>
                          ) : (
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 7px', fontSize: '10.5px', color: 'var(--accent-primary)', borderColor: 'rgba(139, 92, 246, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                              onClick={() => handlePortTargetToClient(contact)}
                              title="Port to Core CRM Clients database"
                            >
                              <UserPlus size={11} /> Port
                            </button>
                          )}

                          {/* 💼 Create Pipeline Deal button */}
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 7px', fontSize: '10.5px', color: 'var(--accent-secondary)', borderColor: 'rgba(6, 182, 212, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            onClick={() => handleOpenCreatePipelineModal(contact)}
                            title="Create Sales Pipeline Deal"
                          >
                            <Briefcase size={11} /> Deal
                          </button>

                          <button 
                            className="btn btn-secondary"
                            style={{ padding: '4px 7px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}
                            onClick={() => {
                              setMeetingTarget(contact);
                              setMeetingForm({
                                description: `Campaign Sync (${campaign.title || 'Outreach'}): ${contact.fullName}`,
                                dueDate: new Date(Date.now() + 2*24*60*60*1000).toISOString().split('T')[0],
                                dueTime: '15:00',
                                dueEndTime: '16:00',
                                location: 'Coffee Sync / Client Office'
                              });
                              setIsMeetingModalOpen(true);
                            }}
                            title="Schedule Calendar Meeting"
                          >
                            <Calendar size={11} />
                          </button>

                          <button 
                            onClick={() => handleDeleteTarget(contact.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: 0.5, padding: '4px' }}
                            title="Remove Target"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

        </div>
      )}

      {/* TAB 2: PLAYBOOK & OBJECTIONS HUB */}
      {activeTab === 'playbook' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto' }}>
          
          {/* Tab 2 Header Bar */}
          <div className="glass-panel" style={{ padding: '14px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                {campaign.productName || campaign.productFocus || 'Campaign'} Advisory Playbook
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '2px 0 0 0' }}>
                Tailored 3-step WhatsApp scripts, objection handling counter-scripts, and daily outreach cadence.
              </p>
            </div>

            <button 
              className="btn btn-secondary" 
              style={{ fontSize: '12px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px', borderColor: 'rgba(139, 92, 246, 0.4)', color: '#c084fc' }}
              onClick={() => {
                setIsReScanModalOpen(true);
                setReScanFile(null);
                setReScanError('');
                setReScanSummary('');
              }}
            >
              <Sparkles size={14} /> ✨ Re-scan Brochure / Regenerate Playbook
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', flex: 1 }}>
          
          {/* Left Column: 3-Step WhatsApp Sequence */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px', borderLeft: '4px solid var(--accent-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Campaign Core Value Proposition (USP)</div>
                {editingField === 'usp' ? (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-primary" style={{ padding: '2px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleSavePlaybookEdit('usp')}>
                      <Save size={11} /> Save
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '11px' }} onClick={handleCancelEdit}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.8 }} onClick={() => handleStartEdit('usp', PLAYBOOK.usp)}>
                    <Edit3 size={11} /> Edit USP
                  </button>
                )}
              </div>
              
              {editingField === 'usp' ? (
                <textarea 
                  className="input-field" 
                  style={{ width: '100%', minHeight: '60px', marginTop: '8px', fontSize: '12px' }} 
                  value={editDraft} 
                  onChange={(e) => setEditDraft(e.target.value)} 
                />
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.5' }}>
                  {PLAYBOOK.usp}
                </div>
              )}
            </div>

            {(PLAYBOOK.scripts || []).map((script, idx) => (
              <div key={idx} className="glass-panel card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>{script.title}</h3>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{script.goal} • <span style={{ color: '#fbbf24' }}>{script.timeHint}</span></div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {editingField === `script-${idx}` ? (
                      <>
                        <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleSavePlaybookEdit(`script-${idx}`)}>
                          <Save size={12} /> Save
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={handleCancelEdit}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handleStartEdit(`script-${idx}`, script.templateContent)}
                        >
                          <Edit3 size={11} /> Edit
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => {
                            navigator.clipboard.writeText(script.templateContent);
                            setCopiedKey(`playbook-${idx}`);
                            setTimeout(() => setCopiedKey(null), 1500);
                          }}
                        >
                          {copiedKey === `playbook-${idx}` ? <Check size={12} /> : <Copy size={12} />} Copy Template
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {editingField === `script-${idx}` ? (
                  <textarea 
                    className="input-field" 
                    style={{ width: '100%', minHeight: '120px', fontSize: '12px', lineHeight: '1.6' }} 
                    value={editDraft} 
                    onChange={(e) => setEditDraft(e.target.value)} 
                  />
                ) : (
                  <div style={{ 
                    backgroundColor: 'rgba(0,0,0,0.25)', 
                    border: '1px solid rgba(255,255,255,0.06)', 
                    borderRadius: '8px', 
                    padding: '12px 14px', 
                    fontSize: '12px', 
                    color: 'var(--text-secondary)', 
                    lineHeight: '1.6', 
                    whiteSpace: 'pre-wrap' 
                  }}>
                    {script.templateContent}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right Column: Objections Cheat Sheet & Daily Routines */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Top 3 Objections */}
            <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldAlert size={16} color="#fbbf24" /> Advisor Objection Handling Cheat Sheet
              </div>

              {(PLAYBOOK.objections || []).map((obj, oIdx) => (
                <div key={oIdx} style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#fb923c', marginBottom: '4px' }}>
                    ❓ "{obj.objection}"
                  </div>

                  {editingField === `obj-${oIdx}` ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                      <textarea 
                        className="input-field" 
                        style={{ width: '100%', minHeight: '80px', fontSize: '11.5px' }} 
                        value={editDraft} 
                        onChange={(e) => setEditDraft(e.target.value)} 
                      />
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-primary" style={{ padding: '2px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleSavePlaybookEdit(`obj-${oIdx}`)}>
                          <Save size={11} /> Save
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '11px' }} onClick={handleCancelEdit}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.5', fontStyle: 'italic', marginBottom: '8px' }}>
                      "{obj.counterScript}"
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>💡 {obj.why}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {editingField !== `obj-${oIdx}` && (
                        <button 
                          className="btn" 
                          style={{ padding: '3px 6px', fontSize: '10.5px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}
                          onClick={() => handleStartEdit(`obj-${oIdx}`, obj.counterScript)}
                        >
                          <Edit3 size={10} /> Edit
                        </button>
                      )}
                      <button 
                        className="btn" 
                        style={{ padding: '3px 8px', fontSize: '10.5px', backgroundColor: 'rgba(251, 146, 60, 0.1)', color: '#fb923c' }}
                        onClick={() => {
                          navigator.clipboard.writeText(obj.counterScript);
                          setCopiedKey(`obj-${oIdx}`);
                          setTimeout(() => setCopiedKey(null), 1500);
                        }}
                      >
                        {copiedKey === `obj-${oIdx}` ? <Check size={11} /> : <Copy size={11} />} Copy
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Daily Outreach Routines */}
            <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} color="var(--accent-secondary)" /> Daily Outreach Cadence
              </div>

              {(PLAYBOOK.routines || []).map((rtn, rIdx) => (
                <div key={rIdx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--accent-secondary)', backgroundColor: 'rgba(6,182,212,0.1)', padding: '3px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                    {rtn.time}
                  </span>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>{rtn.task}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{rtn.desc}</div>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      </div>
      )}

      {/* TAB 3: FUNNEL ANALYTICS & SCORECARD */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto' }}>
          
          {/* Visual Funnel Bar */}
          <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>Conversion Funnel Velocity</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>Stage-by-stage progression across {totalEnrolled} enrolled targets</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleCopyScorecard}>
                  {copiedKey === 'scorecard' ? <Check size={14} /> : <Copy size={14} />} Copy Scorecard
                </button>
                <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleExportCsv}>
                  <FileSpreadsheet size={14} /> Export CSV
                </button>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginTop: '6px' }}>
              <div style={{ padding: '12px 14px', backgroundColor: 'rgba(100, 116, 139, 0.12)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>1. Segmented</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>{totalEnrolled}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>100% Base</div>
              </div>

              <div style={{ padding: '12px 14px', backgroundColor: 'rgba(59, 130, 246, 0.12)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '10.5px', color: '#60a5fa', textTransform: 'uppercase', fontWeight: '600' }}>2. Opener Sent</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#60a5fa', marginTop: '2px' }}>{openerSentCount}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{totalEnrolled ? Math.round((openerSentCount/totalEnrolled)*100) : 0}% Reach</div>
              </div>

              <div style={{ padding: '12px 14px', backgroundColor: 'rgba(234, 179, 8, 0.12)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '10.5px', color: '#fbbf24', textTransform: 'uppercase', fontWeight: '600' }}>3. Info Shared</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#fbbf24', marginTop: '2px' }}>{infoSharedCount}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{openerSentCount ? Math.round((infoSharedCount/openerSentCount)*100) : 0}% Response</div>
              </div>

              <div style={{ padding: '12px 14px', backgroundColor: 'rgba(168, 85, 247, 0.15)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '10.5px', color: '#c084fc', textTransform: 'uppercase', fontWeight: '600' }}>4. Appt Booked</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#c084fc', marginTop: '2px' }}>{apptBookedCount}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{apptRate}% Booking Rate</div>
              </div>

              <div style={{ padding: '12px 14px', backgroundColor: 'rgba(16, 185, 129, 0.18)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '10.5px', color: '#34d399', textTransform: 'uppercase', fontWeight: '600' }}>5. Case Closed</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#34d399', marginTop: '2px' }}>{casesClosedCount}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{closingRate}% Win Rate</div>
              </div>
            </div>
          </div>

          {/* Attribution & MDRT Contribution Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>Production & Financial Summary</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: '12.5px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Annualised Premium (ANP):</span>
                <strong style={{ color: '#34d399' }}>{formatCurrency(totalANP)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: '12.5px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total First Year Commission (FYC):</span>
                <strong style={{ color: '#a78bfa' }}>{formatCurrency(totalFYC)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: '12.5px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Average FYC per Closed Deal:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{casesClosedCount > 0 ? formatCurrency(totalFYC / casesClosedCount) : '$0'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '12.5px' }}>
                <span style={{ color: 'var(--text-muted)' }}>MDRT Goal Contribution (S$110k target):</span>
                <strong style={{ color: '#60a5fa' }}>{((totalFYC / 110000) * 100).toFixed(1)}% of MDRT</strong>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>Campaign Health Diagnostic</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {closingRate >= 30 
                  ? '🔥 Outstanding conversion rate! Prospects are resonating strongly with this product value proposition.' 
                  : apptRate >= 20 
                  ? '⚡ Strong appointment booking rate. Focus on closing objections during the 15-minute consultation.' 
                  : '💡 Consider adjusting Step 1 Opener timing (Tuesday/Thursday 9:30 AM) or testing the alternate segmentation angle.'}
              </div>
              <div style={{ marginTop: 'auto', padding: '10px 12px', backgroundColor: 'rgba(59,130,246,0.08)', borderRadius: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                Closed cases are automatically linked to the <strong>Sales Pipeline</strong> and contribute to the <strong>MDRT Pacing Thermometer</strong>.
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ENROLL PROSPECTS MODAL (Smart Batch & Single Modes) */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '680px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '19px', color: 'var(--text-primary)', margin: 0 }}>Enroll Prospects to Campaign</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
                  Target: <strong>{campaign.title || 'Outreach'}</strong>
                </p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
              <button className={`btn ${enrollMode === 'smart' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => setEnrollMode('smart')}>
                ⚡ Smart Batch Filter
              </button>
              <button className={`btn ${enrollMode === 'crm' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => setEnrollMode('crm')}>
                From CRM Clients
              </button>
              <button className={`btn ${enrollMode === 'p100' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => setEnrollMode('p100')}>
                From Project 100
              </button>
              <button className={`btn ${enrollMode === 'manual' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => setEnrollMode('manual')}>
                Manual Entry
              </button>
            </div>

            {/* Smart Batch Mode */}
            {enrollMode === 'smart' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Select Target Audience Query Preset</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[
                      { id: 'all-unenrolled', label: 'All Un-enrolled Clients' },
                      { id: 'no-ci', label: '🛡️ Clients with No CI Cover' },
                      { id: 'shield-only', label: '🏥 Shield Only (No Life/Wealth)' },
                      { id: 'p100-high-priority', label: '⭐ P100 High Priority (≥4.0★)' },
                      { id: 'young-family', label: '👨‍👩‍👧 Young Families & Parents' }
                    ].map(seg => (
                      <button
                        key={seg.id}
                        type="button"
                        className={`btn ${selectedSmartSegment === seg.id ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '11px', padding: '5px 10px' }}
                        onClick={() => {
                          setSelectedSmartSegment(seg.id);
                          setSelectedClientIds(new Set());
                        }}
                      >
                        {seg.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Batch Selection Table */}
                <div style={{ border: '1px solid var(--border-light)', borderRadius: '8px', maxHeight: '260px', overflowY: 'auto' }}>
                  <div style={{ padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: '600' }}>
                      <input 
                        type="checkbox" 
                        checked={smartSegmentProspects.length > 0 && selectedClientIds.size === smartSegmentProspects.length}
                        onChange={handleSelectAllSmartProspects}
                      />
                      Select All ({smartSegmentProspects.length} Matches)
                    </label>
                    <span style={{ color: '#60a5fa' }}>{selectedClientIds.size} Selected</span>
                  </div>

                  {smartSegmentProspects.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                      No matching prospects found for this filter.
                    </div>
                  ) : (
                    smartSegmentProspects.map(p => (
                      <div 
                        key={p.id} 
                        style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}
                        onClick={() => handleToggleSelectClient(p.id)}
                      >
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1 }}>
                          <input 
                            type="checkbox" 
                            checked={selectedClientIds.has(p.id)}
                            onChange={() => handleToggleSelectClient(p.id)}
                            onClick={e => e.stopPropagation()}
                          />
                          <div>
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{p.fullName}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>{p.phone || p.email || 'No contact'}</span>
                          </div>
                        </label>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', padding: '2px 6px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '4px' }}>
                          {p.reason}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    Selected prospects will be added in stage <strong>1. Segmented</strong>.
                  </span>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      disabled={selectedClientIds.size === 0}
                      onClick={handleBatchEnrollSubmit}
                    >
                      Enroll Selected ({selectedClientIds.size})
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Single Mode Form */
              <form onSubmit={handleSingleEnrollSubmit}>
                {enrollMode === 'crm' ? (
                  <div style={{ marginBottom: '20px' }}>
                    <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Select Client from Database *</label>
                    <select required className="input-field" style={{ width: '100%', background: 'var(--bg-base)' }} value={selectedEnrollClient} onChange={(e) => setSelectedEnrollClient(e.target.value)}>
                      <option value="">-- Select Client --</option>
                      {clients
                        .filter(c => !enrolledContactNames.has(c.fullName.toLowerCase().trim()))
                        .map(c => (
                          <option key={c.id} value={c.id}>{c.fullName} ({c.phone || c.email || 'No contact'})</option>
                        ))}
                    </select>
                  </div>
                ) : enrollMode === 'p100' ? (
                  <div style={{ marginBottom: '20px' }}>
                    <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Select Contact from Project 100 *</label>
                    <select required className="input-field" style={{ width: '100%', background: 'var(--bg-base)' }} value={selectedEnrollClient} onChange={(e) => setSelectedEnrollClient(e.target.value)}>
                      <option value="">-- Select Prospect --</option>
                      {project100List
                        .filter(p => !enrolledContactNames.has(p.fullName.toLowerCase().trim()))
                        .map(p => (
                          <option key={p.id} value={p.id}>{p.fullName} ({p.category || 'Prospect'} • {((((p.scoreNeed||3)+(p.scoreAccessibility||3)+(p.scoreIncome||3)+(p.scoreTrust||3))/4)).toFixed(1)}★)</option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '14px' }}>
                      <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Full Name *</label>
                      <input required type="text" className="input-field" style={{ width: '100%' }} value={manualForm.fullName} onChange={(e) => setManualForm({ ...manualForm, fullName: e.target.value })} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                      <div>
                        <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Phone</label>
                        <input type="tel" className="input-field" style={{ width: '100%' }} value={manualForm.phone} onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })} />
                      </div>
                      <div>
                        <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Segment / Tag</label>
                        <input type="text" className="input-field" style={{ width: '100%' }} value={manualForm.segment} onChange={(e) => setManualForm({ ...manualForm, segment: e.target.value })} />
                      </div>
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Enroll Target</button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* CASE CLOSED ANP / FYC MODAL */}
      {isCloseCaseModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '28px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '8px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={20} /> Mark Case Closed
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Record financial production for <strong>{closeCaseTarget?.fullName}</strong>. This deal will automatically sync with the <strong>Sales Pipeline</strong> and <strong>MDRT Tracker</strong>.
            </p>

            <form onSubmit={handleCloseCaseSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Annualised New Premium (ANP) *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }}>$</span>
                  <input required type="number" className="input-field" style={{ width: '100%', paddingLeft: '24px' }} placeholder="e.g. 12000" value={closeCaseForm.anp} onChange={(e) => setCloseCaseForm({ ...closeCaseForm, anp: e.target.value })} />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>First Year Commission (FYC)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }}>$</span>
                  <input type="number" className="input-field" style={{ width: '100%', paddingLeft: '24px' }} placeholder="e.g. 6000" value={closeCaseForm.fyc} onChange={(e) => setCloseCaseForm({ ...closeCaseForm, fyc: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Policy / Plan Name</label>
                  <input type="text" className="input-field" style={{ width: '100%' }} value={closeCaseForm.policyName} onChange={(e) => setCloseCaseForm({ ...closeCaseForm, policyName: e.target.value })} />
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Policy Type</label>
                  <select className="input-field" style={{ width: '100%', background: 'var(--bg-base)' }} value={closeCaseForm.policyType} onChange={(e) => setCloseCaseForm({ ...closeCaseForm, policyType: e.target.value })}>
                    {['Life','Term','A&H','Shield','HI','ILP','Endowment','LTC','Disability Income'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Closing Notes</label>
                <input type="text" className="input-field" style={{ width: '100%' }} placeholder="Policy issued details..." value={closeCaseForm.notes} onChange={(e) => setCloseCaseForm({ ...closeCaseForm, notes: e.target.value })} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCloseCaseModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#10b981' }}>Save & Record Deal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CALENDAR MEETING CREATION MODAL */}
      {isMeetingModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '28px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '6px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#60a5fa" /> Schedule Appointment
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Lock in appointment details for <strong>{meetingTarget?.fullName}</strong>. Automatically syncs with Google Calendar.
            </p>

            <form onSubmit={handleScheduleMeetingSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Meeting Topic / Title *</label>
                <input required type="text" className="input-field" style={{ width: '100%' }} value={meetingForm.description} onChange={(e) => setMeetingForm({ ...meetingForm, description: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Meeting Date</label>
                  <DatePicker value={meetingForm.dueDate} onChange={(e) => setMeetingForm({ ...meetingForm, dueDate: e.target.value })} />
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Start Time</label>
                  <input type="time" className="input-field" style={{ width: '100%' }} value={meetingForm.dueTime} onChange={(e) => setMeetingForm({ ...meetingForm, dueTime: e.target.value })} />
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>End Time</label>
                  <input type="time" className="input-field" style={{ width: '100%' }} value={meetingForm.dueEndTime} onChange={(e) => setMeetingForm({ ...meetingForm, dueEndTime: e.target.value })} />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Location (Singapore Address / Zoom)</label>
                <AddressAutocomplete 
                  value={meetingForm.location}
                  onChange={(val) => setMeetingForm({ ...meetingForm, location: val })}
                  placeholder="e.g. Raffles Place / Coffee Bean / Online Zoom"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsMeetingModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule & Sync</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RE-SCAN BROCHURE / REGENERATE PLAYBOOK MODAL */}
      {isReScanModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '620px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="#c084fc" /> AI Playbook Copilot
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
                  Enhance your outreach strategy, weave in new advisor insights, or scan an updated product brochure.
                </p>
              </div>
              <button onClick={() => setIsReScanModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            {/* Mode Switcher */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', backgroundColor: 'rgba(0,0,0,0.25)', padding: '4px', borderRadius: '8px', marginBottom: '16px' }}>
              <button
                type="button"
                className="btn"
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  backgroundColor: reScanMode === 'refine' ? 'var(--accent-primary)' : 'transparent',
                  color: reScanMode === 'refine' ? '#fff' : 'var(--text-secondary)'
                }}
                onClick={() => setReScanMode('refine')}
              >
                <Sparkles size={13} /> 🔄 Refine & Add Insights
              </button>

              <button
                type="button"
                className="btn"
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  backgroundColor: reScanMode === 'replace' ? 'var(--accent-primary)' : 'transparent',
                  color: reScanMode === 'replace' ? '#fff' : 'var(--text-secondary)'
                }}
                onClick={() => setReScanMode('replace')}
              >
                <RefreshCw size={13} /> ⚡ Fresh Overhaul / Replace
              </button>
            </div>

            {/* Current Context Card (when in Refine Mode) */}
            {reScanMode === 'refine' && (
              <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: '600', color: '#818cf8', marginBottom: '4px' }}>
                  📌 Retained Product Context:
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: '600' }}>
                  {campaign.productName || campaign.productFocus || 'Strategic Advisory Product'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.4' }}>
                  <strong>Current USP:</strong> {PLAYBOOK.usp}
                </div>
              </div>
            )}

            <form onSubmit={handleReScanPlaybookSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Product Notes / Insights */}
              <div>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>
                  {reScanMode === 'refine' 
                    ? 'Advisor Insights & Angles to Weave In *' 
                    : 'Product Summary / Strategic Description'}
                </label>
                <textarea 
                  className="input-field" 
                  style={{ width: '100%', minHeight: '90px', fontSize: '12px', lineHeight: '1.5' }} 
                  placeholder={reScanMode === 'refine'
                    ? "e.g. Highlight $10,000 annual surgical limit, mention breed hereditary coverage for french bulldogs, make Step 1 more empathetic to rescue pet parents, and add an objection for waiting periods..."
                    : "e.g. Focus on 25% Health Cashback at age 65, gender cancer boost, and young family budget affordability..."} 
                  value={reScanSummary}
                  onChange={(e) => setReScanSummary(e.target.value)}
                />
              </div>

              {/* File Attachment Box */}
              <div style={{ backgroundColor: 'rgba(139,92,246,0.06)', border: '1px dashed rgba(139,92,246,0.3)', borderRadius: '8px', padding: '14px' }}>
                <input 
                  ref={reScanFileInputRef} 
                  type="file" 
                  accept=".pdf,image/png,image/jpeg,image/jpg" 
                  style={{ display: 'none' }} 
                  onChange={(e) => handleReScanFileSelect(e.target.files?.[0])}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => reScanFileInputRef.current?.click()}
                  >
                    <UploadCloud size={14} /> {reScanFile ? 'Change Attached File' : (reScanMode === 'refine' ? 'Attach Addendum / New PDF (Optional)' : 'Attach Product Brochure (PDF/Image)')}
                  </button>

                  {reScanFile && (
                    <span style={{ fontSize: '11.5px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={13} /> {reScanFile.name} ({(reScanFile.size / 1024).toFixed(0)} KB)
                    </span>
                  )}
                </div>
              </div>

              {reScanError && (
                <div style={{ color: '#f87171', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={13} /> {reScanError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsReScanModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isReScanning} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} className={isReScanning ? 'animate-spin' : ''} />
                  {isReScanning ? 'Synthesizing with Gemini 3.7 Flash...' : (reScanMode === 'refine' ? '✨ Refine Playbook' : '⚡ Overhaul Playbook')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PIPELINE CASE MODAL */}
      {isPipelineModalOpen && pipelineTarget && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', margin: 0 }}>Create Pipeline Deal for {pipelineTarget.fullName}</h2>
              <button onClick={() => { setIsPipelineModalOpen(false); setPipelineTarget(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px' }}>Auto-links to Core Clients Database and syncs directly into Sales Pipeline & MDRT tracking.</p>

            <form onSubmit={handlePipelineSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Policy / Product Name *</label>
                <input type="text" className="input-field" value={pipelineForm.policyName} onChange={e => setPipelineForm({ ...pipelineForm, policyName: e.target.value })} required placeholder="e.g. Chubb Pawsome Protect" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Policy Type</label>
                  <select className="input-field" style={{ background: 'var(--bg-base)' }} value={pipelineForm.policyType} onChange={e => setPipelineForm({ ...pipelineForm, policyType: e.target.value })}>
                    {POLICY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Pipeline Stage</label>
                  <select className="input-field" style={{ background: 'var(--bg-base)' }} value={pipelineForm.stage} onChange={e => setPipelineForm({ ...pipelineForm, stage: e.target.value })}>
                    {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Est. Annual Premium ($)</label>
                  <input type="number" className="input-field" value={pipelineForm.estimatedPremium} onChange={e => setPipelineForm({ ...pipelineForm, estimatedPremium: e.target.value })} placeholder="3600" />
                </div>
                <div className="input-group">
                  <label className="input-label">Est. FYC ($)</label>
                  <input type="number" className="input-field" value={pipelineForm.estimatedFYC} onChange={e => setPipelineForm({ ...pipelineForm, estimatedFYC: e.target.value })} placeholder="1440" />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Case Notes / Pitch Context</label>
                <input type="text" className="input-field" value={pipelineForm.notes} onChange={e => setPipelineForm({ ...pipelineForm, notes: e.target.value })} placeholder="Outreach pitching notes..." />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setIsPipelineModalOpen(false); setPipelineTarget(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  Create Pipeline Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
