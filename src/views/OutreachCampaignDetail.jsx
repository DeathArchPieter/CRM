import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowLeft, Plus, Search, CheckCircle, 
  Copy, MessageSquare, Trash2, Edit2,
  HelpCircle, UserPlus, CheckCircle2, Circle, Sparkles, Send,
  TrendingUp, Award, DollarSign, ExternalLink, Calendar, Check, Users
} from 'lucide-react';

const CAMPAIGN_STAGES = [
  '1. Segmented',
  '2. Opener Sent',
  '3. Info Shared',
  '4. Appt Booked',
  '5. Case Closed',
  'Inactive'
];

const STAGE_COLORS = {
  '1. Segmented': { bg: 'rgba(100, 116, 139, 0.1)', text: '#94a3b8' },
  '2. Opener Sent': { bg: 'rgba(59, 130, 246, 0.1)', text: '#60a5fa' },
  '3. Info Shared': { bg: 'rgba(234, 179, 8, 0.1)', text: '#fbbf24' },
  '4. Appt Booked': { bg: 'rgba(168, 85, 247, 0.1)', text: '#c084fc' },
  '5. Case Closed': { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399' },
  'Inactive': { bg: 'rgba(239, 68, 68, 0.1)', text: '#f87171' }
};

// Preset details for AIA Protect 3 outreach
const AIA_PROTECT_3_RESOURCES = {
  segments: [
    {
      name: 'Existing Clients',
      hook: 'Gap filling & top-ups',
      why: 'No medical checks needed (4 simple questions). Great way to boost their current coverage effortlessly.'
    },
    {
      name: 'Young Parents (25-40)',
      hook: 'Balancing budget with major risks',
      why: 'Low barrier to entry (from S$0.56/day). Addresses the financial stress of managing growing children and aging parents.'
    },
    {
      name: 'Working Professionals',
      hook: 'High stress, fast-paced lifestyles',
      why: 'Focuses on the top 3 critical illnesses making up 90% of Singapore claims. Offers Teladoc Personal Case Management.'
    }
  ],
  scripts: [
    {
      step: 1,
      title: 'Step 1: The Soft Opener (Value-Led Hook)',
      goal: 'Start a conversation by highlighting a relevant stat without being pushy.',
      timeHint: 'Send mid-week (Tuesday/Thursday morning).',
      template: (clientName) => `Hey ${clientName}, hope you're having a smooth week!

I was reading through the latest industry data and a stat caught my eye: working Singaporeans actually face an average 74% critical illness protection gap. With healthcare costs creeping up, many of us are exposed without even realizing it.

AIA recently rolled out a very streamlined way to plug this specific gap focusing only on the big 3 risks—Cancer, Heart Attack, and Stroke—which actually account for about 90% of all CI claims here.

It's designed to be budget-friendly and doesn't require medical check-ups. I’ve been mapping out some quick gap-analyses for young families recently. If you’re open to it, I can text over a 1-page summary to see if it makes sense for your current setup? No pressure at all.`
    },
    {
      step: 2,
      title: 'Step 2: The Follow-Up / Fulfillment (Value Drop)',
      goal: 'Sent 2–3 days later to those who responded "Yes" or expressed interest.',
      timeHint: 'Share brochure details and highlight a standout feature.',
      template: (clientName) => `Great ${clientName}! Here is the brochure summary for AIA Protect 3.

What I personally like about it for folks in our demographic is the Health Cashback feature—if you stay healthy and claim-free, you get 25% of your coverage amount back at age 65 (or after 15 years). Plus, it includes an extra 15% payout for gender-specific major cancers from year 3 onwards.

Essentially, it ensures you aren't just paying premiums into a black hole if you stay perfectly healthy.

You could explore a basic S$100k, S$200k, or S$300k coverage boost depending on what you already have in place. Do you happen to remember off the top of your head what your current total CI coverage amount is right now?`
    },
    {
      step: 3,
      title: 'Step 3: The Call to Action (The Appointment Close)',
      goal: 'Move from text discussion to a quick 15-minute phone/Zoom sync.',
      timeHint: 'Offer concrete time options.',
      template: (clientName) => `No worries ${clientName} if you don't have the exact number on hand—that's exactly what I'm here for!

Let's do a quick 15-minute coffee chat or Zoom call. I can pull up your existing portfolio, check if you actually have a gap, and see if this plan fits into your budget (premiums can start from less than a dollar a day).

How does this Thursday at 3 PM or Friday at 11 AM sound for a quick catch-up?`
    }
  ],
  routines: [
    { time: '09:00 AM - 09:30 AM', task: 'The Batch Send', desc: 'Send out 5 to 10 Step 1 Opener messages. Keep it small to maintain authentic conversations.' },
    { time: '12:00 PM - 12:30 PM', task: 'The Mid-Day Check', desc: 'Reply to morning answers, send out the Step 2 brochure details, and lock in calendar invites.' },
    { time: '05:00 PM - 05:30 PM', task: 'The Follow-Up', desc: 'Check on outstanding chats, send gentle reminders to people on "Read", and log appointments.' }
  ]
};

export default function OutreachCampaignDetail({ campaign: campaignProp, onBack }) {
  const [currentCampaign, setCurrentCampaign] = useState(campaignProp);
  const campaign = currentCampaign;

  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState(campaign.contacts || []);
  const [clients, setClients] = useState([]);
  const [project100List, setProject100List] = useState([]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editFields, setEditFields] = useState({
    title: campaign.title || '',
    productName: campaign.productName || '',
    targetAudience: campaign.targetAudience || '',
    targetAppointments: campaign.targetAppointments || 20,
    targetDate: campaign.targetDate || '',
    leader: campaign.leader || '',
    members: campaign.members || 1,
    description: campaign.description || ''
  });

  // Resolve playbook resources
  const getPlaybookResources = () => {
    if (campaign.playbook && campaign.playbook.segments && campaign.playbook.scripts) {
      return {
        segments: campaign.playbook.segments,
        scripts: campaign.playbook.scripts.map(s => ({
          step: s.step,
          title: s.title,
          goal: s.goal,
          timeHint: s.timeHint,
          template: (clientName) => {
            const tempStr = s.templateContent || '';
            const cleanName = clientName || 'there';
            return tempStr
              .replace(/\[Client Name\]/g, cleanName)
              .replace(/\{clientName\}/g, cleanName)
              .replace(/\$\{clientName\}/g, cleanName);
          }
        })),
        routines: campaign.playbook.routines || []
      };
    }

    const product = campaign.productName || 'AIA Protect 3';
    const audience = campaign.targetAudience || 'Young Working Adults & Families';

    if (product === 'AIA Protect 3' && audience === 'Young Working Adults & Families') {
      return AIA_PROTECT_3_RESOURCES;
    }

    return {
      segments: [
        { name: 'Existing Clients', hook: `Coverage review using ${product}`, why: `Excellent touchpoint to recommend a ${product} upgrade.` },
        { name: audience, hook: `Direct solution hook for ${audience}`, why: `Directly targets key risk factors of ${audience}.` }
      ],
      scripts: [
        {
          step: 1,
          title: 'Step 1: The Soft Opener (Value-Led Hook)',
          goal: `Start a conversation highlighting key features of ${product}.`,
          timeHint: 'Send mid-week.',
          template: (clientName) => `Hey ${clientName}, hope you're having a smooth week!

AIA recently introduced a streamlined plan, ${product}, specifically tailored for ${audience}. It's budget-friendly and offers an effortless way to plug protection gaps.

If you're open to it, I can text over a 1-page summary to see if it makes sense for your current setup? No pressure at all.`
        },
        {
          step: 2,
          title: 'Step 2: The Follow-Up (Value Drop)',
          goal: 'Share brochure details.',
          timeHint: 'Sent 2–3 days later.',
          template: (clientName) => `Great ${clientName}! Here is the summary brochure for ${product}.

What I personally like about it is how cost-effective the coverage is for our demographic.

Do you happen to remember off the top of your head what your current total coverage is right now?`
        },
        {
          step: 3,
          title: 'Step 3: The Call to Action (Appt Close)',
          goal: 'Move from text discussion to a quick 15-minute sync.',
          timeHint: 'Offer concrete time options.',
          template: (clientName) => `No worries ${clientName}! Let's do a quick 15-minute coffee chat or Zoom call to check your existing portfolio.

How does this Thursday at 3 PM or Friday at 11 AM sound for a quick catch-up?`
        }
      ],
      routines: [
        { time: '09:00 AM', task: 'The Batch Send', desc: `Send Step 1 messages introducing ${product}.` },
        { time: '05:00 PM', task: 'The Follow-Up', desc: 'Check on chats and log appointments.' }
      ]
    };
  };

  const PLAYBOOK_RESOURCES = getPlaybookResources();

  // Active Tab & Filter State
  const [activeTab, setActiveTab] = useState('workspace');
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState('All');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [enrollMode, setEnrollMode] = useState('crm'); // 'crm' | 'p100' | 'manual'
  const [selectedEnrollClient, setSelectedEnrollClient] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Close Case ANP/FYC Modal State
  const [isCloseCaseModalOpen, setIsCloseCaseModalOpen] = useState(false);
  const [closeCaseTarget, setCloseCaseTarget] = useState(null);
  const [closeCaseForm, setCloseCaseForm] = useState({ anp: '', fyc: '', notes: '' });

  // Manual Add Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    segment: PLAYBOOK_RESOURCES.segments[0]?.name || 'Existing Clients',
    stage: '1. Segmented',
    notes: ''
  });

  const loadData = async () => {
    setLoading(true);
    if (window.electronAPI) {
      if (window.electronAPI.getClients) {
        const res = await window.electronAPI.getClients();
        if (res.success) setClients(res.data);
      }
      if (window.electronAPI.getProject100Contacts) {
        const pRes = await window.electronAPI.getProject100Contacts();
        if (pRes.success) setProject100List(pRes.data);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveCampaignChanges = async (updatedContacts) => {
    setContacts(updatedContacts);
    if (window.electronAPI?.updateInitiative) {
      await window.electronAPI.updateInitiative({
        id: campaign.id,
        contacts: updatedContacts
      });
    }
  };

  // Stage Advancement Handler
  const handleUpdateTargetStage = async (targetId, newStage) => {
    const target = contacts.find(c => c.id === targetId);
    if (!target) return;

    if (newStage === '5. Case Closed') {
      setCloseCaseTarget(target);
      setCloseCaseForm({ anp: target.anp || '', fyc: target.fyc || '', notes: target.notes || '' });
      setIsCloseCaseModalOpen(true);
      return;
    }

    const updated = contacts.map(c => {
      if (c.id !== targetId) return c;
      return { ...c, stage: newStage, updatedAt: new Date().toISOString() };
    });
    await saveCampaignChanges(updated);
  };

  const handleCloseCaseSubmit = async (e) => {
    e.preventDefault();
    if (!closeCaseTarget) return;

    const anpVal = Number(closeCaseForm.anp) || 0;
    const fycVal = Number(closeCaseForm.fyc) || 0;

    const updated = contacts.map(c => {
      if (c.id !== closeCaseTarget.id) return c;
      return { 
        ...c, 
        stage: '5. Case Closed', 
        anp: anpVal, 
        fyc: fycVal, 
        notes: closeCaseForm.notes,
        updatedAt: new Date().toISOString() 
      };
    });

    await saveCampaignChanges(updated);
    setIsCloseCaseModalOpen(false);
    setCloseCaseTarget(null);
  };

  // Enroll Handler
  const handleEnrollSubmit = async (e) => {
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
      if (!formData.fullName.trim()) return;
      newTarget = {
        id: `target-${Date.now()}`,
        fullName: formData.fullName,
        phone: formData.phone || '',
        email: formData.email || '',
        segment: formData.segment,
        stage: formData.stage,
        notes: formData.notes || '',
        createdAt: new Date().toISOString()
      };
    }

    if (newTarget) {
      const updated = [...contacts, newTarget];
      await saveCampaignChanges(updated);
      setIsAddModalOpen(false);
      setSelectedEnrollClient('');
      setFormData({ fullName: '', phone: '', email: '', segment: 'Existing Clients', stage: '1. Segmented', notes: '' });
    }
  };

  const handleDeleteTarget = async (targetId) => {
    if (!window.confirm("Remove this target from campaign?")) return;
    const updated = contacts.filter(c => c.id !== targetId);
    await saveCampaignChanges(updated);
  };

  // 1-Click Script Copy & WhatsApp Send
  const handleCopyPersonalizedScript = (contact, stepIndex) => {
    const preferredName = (contact.fullName || '').split(' ')[0] || contact.fullName;
    const templateObj = PLAYBOOK_RESOURCES.scripts[stepIndex];
    if (!templateObj) return;

    const text = templateObj.template(preferredName);
    navigator.clipboard.writeText(text);
    setCopiedIndex(`${contact.id}-${stepIndex}`);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleSendWhatsApp = (contact, stepIndex = 0) => {
    const preferredName = (contact.fullName || '').split(' ')[0] || contact.fullName;
    const templateObj = PLAYBOOK_RESOURCES.scripts[stepIndex];
    const text = templateObj ? templateObj.template(preferredName) : '';

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

  // Funnel & Performance Analytics Calculations
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
    const matchesSearch = c.fullName.toLowerCase().includes(search.toLowerCase()) || 
      (c.phone && c.phone.includes(search)) ||
      (c.segment && c.segment.toLowerCase().includes(search.toLowerCase()));
    
    if (!matchesSearch) return false;
    if (filterStage !== 'All' && c.stage !== filterStage) return false;
    return true;
  });

  return (
    <div className="view-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn" style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }} onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-gradient" style={{ fontSize: '24px' }}>{campaign.title}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
              Product: <strong style={{ color: 'var(--text-primary)' }}>{campaign.productName}</strong> • Audience: <span style={{ color: 'var(--text-secondary)' }}>{campaign.targetAudience}</span>
            </p>
          </div>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setIsAddModalOpen(true)}>
          <UserPlus size={16} /> Enroll Prospects
        </button>
      </header>

      {/* Financial ROI & Funnel Metrics Summary Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        
        {/* Total ANP Generated */}
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '12px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <DollarSign size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Campaign ANP Generated</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#34d399' }}>{formatCurrency(totalANP)}</div>
          </div>
        </div>

        {/* Total FYC Generated */}
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '12px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
            <Award size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Campaign FYC Generated</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#a78bfa' }}>{formatCurrency(totalFYC)}</div>
          </div>
        </div>

        {/* Appointments Funnel */}
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '12px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
            <Calendar size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Appts Booked</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {apptBookedCount} <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'normal' }}>/ {campaign.targetAppointments || 20} Target</span>
            </div>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '12px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(234, 179, 8, 0.15)', color: '#fbbf24' }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Conversion Rates</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Appt: <span style={{ color: '#fbbf24' }}>{apptRate}%</span> • Close: <span style={{ color: '#34d399' }}>{closingRate}%</span>
            </div>
          </div>
        </div>

      </div>

      {/* Visual Conversion Funnel Progress Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
          <span>Conversion Funnel Progress</span>
          <span>{casesClosedCount} Cases Closed out of {totalEnrolled} Enrolled Prospects</span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
          <div style={{ padding: '8px 12px', backgroundColor: 'rgba(100, 116, 139, 0.15)', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>1. Enrolled</div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{totalEnrolled}</div>
          </div>
          <div style={{ padding: '8px 12px', backgroundColor: 'rgba(59, 130, 246, 0.15)', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#60a5fa', textTransform: 'uppercase' }}>2. Opener Sent</div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#60a5fa' }}>{openerSentCount}</div>
          </div>
          <div style={{ padding: '8px 12px', backgroundColor: 'rgba(234, 179, 8, 0.15)', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#fbbf24', textTransform: 'uppercase' }}>3. Info Shared</div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#fbbf24' }}>{infoSharedCount}</div>
          </div>
          <div style={{ padding: '8px 12px', backgroundColor: 'rgba(168, 85, 247, 0.15)', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#c084fc', textTransform: 'uppercase' }}>4. Appt Booked</div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#c084fc' }}>{apptBookedCount}</div>
          </div>
          <div style={{ padding: '8px 12px', backgroundColor: 'rgba(16, 185, 129, 0.2)', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#34d399', textTransform: 'uppercase' }}>5. Case Closed</div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#34d399' }}>{casesClosedCount}</div>
          </div>
        </div>
      </div>

      {/* Target Prospects Table & 1-Click Messaging List */}
      <div className="glass-panel" style={{ flex: 1, padding: '0', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        {/* Table Header Filter Bar */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-field" 
              style={{ width: '100%', paddingLeft: '36px', fontSize: '13px' }} 
              placeholder="Search campaign prospects..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <select 
              className="input-field" 
              style={{ fontSize: '12px', padding: '6px 12px' }}
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

        {/* Prospects List */}
        {filteredContacts.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Users size={40} style={{ opacity: 0.4, marginBottom: '12px' }} />
            <div>No enrolled prospects found. Click <strong>Enroll Prospects</strong> to add CRM clients or Project 100 targets.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500' }}>Prospect Name</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500' }}>Segment</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500' }}>Campaign Stage</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500' }}>ANP / FYC</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500', textAlign: 'right' }}>1-Click Messaging</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map(contact => {
                const stageColor = STAGE_COLORS[contact.stage] || STAGE_COLORS['1. Segmented'];
                return (
                  <tr key={contact.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    
                    {/* Name & Contact */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{contact.fullName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{contact.phone || contact.email || 'No phone'}</div>
                    </td>

                    {/* Segment */}
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                      {contact.segment || 'General'}
                    </td>

                    {/* Stage Selector */}
                    <td style={{ padding: '14px 20px' }}>
                      <select 
                        value={contact.stage}
                        onChange={(e) => handleUpdateTargetStage(contact.id, e.target.value)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
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
                    <td style={{ padding: '14px 20px' }}>
                      {contact.stage === '5. Case Closed' ? (
                        <div>
                          <div style={{ color: '#34d399', fontWeight: '600', fontSize: '12px' }}>
                            ANP: {formatCurrency(contact.anp)}
                          </div>
                          <div style={{ color: '#a78bfa', fontSize: '11px' }}>
                            FYC: {formatCurrency(contact.fyc)}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>-</span>
                      )}
                    </td>

                    {/* 1-Click Copy & Messaging Actions */}
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn"
                          style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handleCopyPersonalizedScript(contact, 0)}
                          title="Copy Step 1 Opener Message"
                        >
                          {copiedIndex === `${contact.id}-0` ? <Check size={12} /> : <Copy size={12} />} Step 1
                        </button>

                        <button 
                          className="btn"
                          style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handleCopyPersonalizedScript(contact, 1)}
                          title="Copy Step 2 Value Drop Message"
                        >
                          {copiedIndex === `${contact.id}-1` ? <Check size={12} /> : <Copy size={12} />} Step 2
                        </button>

                        <button 
                          className="btn"
                          style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handleSendWhatsApp(contact, 0)}
                          title="Send via WhatsApp"
                        >
                          <Send size={12} /> WhatsApp
                        </button>

                        <button 
                          onClick={() => handleDeleteTarget(contact.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: 0.5, padding: '4px' }}
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

      {/* Enroll Prospects Modal */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px', color: 'var(--text-primary)' }}>Enroll Prospects to Campaign</h2>

            {/* Enroll Mode Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button className={`btn ${enrollMode === 'crm' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => setEnrollMode('crm')}>From CRM Clients</button>
              <button className={`btn ${enrollMode === 'p100' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => setEnrollMode('p100')}>From Project 100</button>
              <button className={`btn ${enrollMode === 'manual' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => setEnrollMode('manual')}>Manual Entry</button>
            </div>

            <form onSubmit={handleEnrollSubmit}>
              {enrollMode === 'crm' ? (
                <div style={{ marginBottom: '24px' }}>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Select Client from Database *</label>
                  <select required className="input-field" style={{ width: '100%' }} value={selectedEnrollClient} onChange={(e) => setSelectedEnrollClient(e.target.value)}>
                    <option value="">-- Select Client --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.fullName} ({c.phone || c.email || 'No contact'})</option>
                    ))}
                  </select>
                </div>
              ) : enrollMode === 'p100' ? (
                <div style={{ marginBottom: '24px' }}>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Select Contact from Project 100 *</label>
                  <select required className="input-field" style={{ width: '100%' }} value={selectedEnrollClient} onChange={(e) => setSelectedEnrollClient(e.target.value)}>
                    <option value="">-- Select Prospect --</option>
                    {project100List.map(p => (
                      <option key={p.id} value={p.id}>{p.fullName} ({p.category || 'Prospect'})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Full Name *</label>
                    <input required type="text" className="input-field" style={{ width: '100%' }} value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Phone</label>
                      <input type="tel" className="input-field" style={{ width: '100%' }} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    <div>
                      <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Segment</label>
                      <input type="text" className="input-field" style={{ width: '100%' }} value={formData.segment} onChange={(e) => setFormData({ ...formData, segment: e.target.value })} />
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }} onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Enroll Target</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Case Closed ANP / FYC Modal */}
      {isCloseCaseModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '32px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '12px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={20} /> Mark Case Closed
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Record financial results for <strong>{closeCaseTarget?.fullName}</strong>.
            </p>

            <form onSubmit={handleCloseCaseSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Annualised New Premium (ANP) *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }}>$</span>
                  <input required type="number" className="input-field" style={{ width: '100%', paddingLeft: '24px' }} placeholder="e.g. 12000" value={closeCaseForm.anp} onChange={(e) => setCloseCaseForm({ ...closeCaseForm, anp: e.target.value })} />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>First Year Commission (FYC)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }}>$</span>
                  <input type="number" className="input-field" style={{ width: '100%', paddingLeft: '24px' }} placeholder="e.g. 6000" value={closeCaseForm.fyc} onChange={(e) => setCloseCaseForm({ ...closeCaseForm, fyc: e.target.value })} />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Closing Notes</label>
                <input type="text" className="input-field" style={{ width: '100%' }} placeholder="Policy issued details..." value={closeCaseForm.notes} onChange={(e) => setCloseCaseForm({ ...closeCaseForm, notes: e.target.value })} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }} onClick={() => setIsCloseCaseModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#10b981' }}>Save & Record Case</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
