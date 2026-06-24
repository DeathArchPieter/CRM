import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Plus, Search, CheckCircle, 
  Copy, MessageSquare, Trash2, 
  HelpCircle, UserPlus, CheckCircle2, Circle
} from 'lucide-react';

const CAMPAIGN_STAGES = [
  '1. Segmented',
  '2. Opener Sent',
  '3. Info Shared',
  '4. Appt Booked',
  'Inactive'
];

const STAGE_COLORS = {
  '1. Segmented': { bg: 'rgba(100, 116, 139, 0.1)', text: '#94a3b8' },
  '2. Opener Sent': { bg: 'rgba(59, 130, 246, 0.1)', text: '#60a5fa' },
  '3. Info Shared': { bg: 'rgba(234, 179, 8, 0.1)', text: '#fbbf24' },
  '4. Appt Booked': { bg: 'rgba(16, 185, 129, 0.1)', text: '#34d399' },
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
      template: () => `Great! Here is the brochure summary for AIA Protect 3.

What I personally like about it for folks in our demographic is the Health Cashback feature—if you stay healthy and claim-free, you get 25% of your coverage amount back at age 65 (or after 15 years). Plus, it includes an extra 15% payout for gender-specific major cancers from year 3 onwards.

Essentially, it ensures you aren't just paying premiums into a black hole if you stay perfectly healthy.

You could explore a basic S$100k, S$200k, or S$300k coverage boost depending on what you already have in place. Do you happen to remember off the top of your head what your current total CI coverage amount is right now?`
    },
    {
      step: 3,
      title: 'Step 3: The Call to Action (The Appointment Close)',
      goal: 'Move from text discussion to a quick 15-minute phone/Zoom sync.',
      timeHint: 'Offer concrete time options.',
      template: () => `No worries if you don't have the exact number on hand—that's exactly what I'm here for!

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

export default function OutreachCampaignDetail({ campaign, onBack }) {
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState(campaign.contacts || []);
  const [clients, setClients] = useState([]);

  // Resolve campaign playbook resources dynamically
  const getPlaybookResources = () => {
    if (campaign.playbook && campaign.playbook.segments && campaign.playbook.scripts) {
      return {
        segments: campaign.playbook.segments,
        scripts: campaign.playbook.scripts.map(s => ({
          step: s.step,
          title: s.title,
          goal: s.goal,
          timeHint: s.timeHint,
          template: (clientName) => s.templateContent.replace(/\[Client Name\]/g, clientName).replace(/\{clientName\}/g, clientName).replace(/\$\{clientName\}/g, clientName)
        })),
        routines: campaign.playbook.routines || []
      };
    }
    return AIA_PROTECT_3_RESOURCES;
  };

  const PLAYBOOK_RESOURCES = getPlaybookResources();
  
  // Tabs & views state
  const [activeTab, setActiveTab] = useState('workspace'); // 'workspace' | 'playbook'
  const [search, setSearch] = useState('');
  const [filterSegment, setFilterSegment] = useState('All');
  const [filterStage, setFilterStage] = useState('All');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [scriptModalData, setScriptModalData] = useState(null); // { contact, stepIndex }
  const [copiedIndex, setCopiedIndex] = useState(null); // tracking copy clipboard visual transitions
  
  // Port & Convert modal state
  const [isPortModalOpen, setIsPortModalOpen] = useState(false);
  const [portTarget, setPortTarget] = useState(null);
  const [portForm, setPortForm] = useState({
    stage: '4. Appt Booked',
    createCase: true,
    policyName: '',
    policyType: 'A&H',
    estimatedPremium: '',
    estimatedFYC: '',
    expectedCloseDate: '',
    notes: ''
  });
  
  // Manual add target form state
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    segment: PLAYBOOK_RESOURCES.segments[0]?.name || '',
    stage: '1. Segmented',
    notes: ''
  });

  // Daily routine ticks state (stored locally in sessionStorage or memory for current session)
  const [routineTicks, setRoutineTicks] = useState({});

  const loadData = async () => {
    setLoading(true);
    if (window.electronAPI && window.electronAPI.getClients) {
      const res = await window.electronAPI.getClients();
      if (res.success) {
        setClients(res.data);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
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

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleManualAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) return;

    const newTarget = {
      id: `target-${Date.now()}`,
      fullName: formData.fullName,
      phone: formData.phone || '',
      email: formData.email || '',
      segment: formData.segment,
      stage: formData.stage,
      notes: formData.notes || '',
      createdAt: new Date().toISOString()
    };

    const updated = [...contacts, newTarget];
    await saveCampaignChanges(updated);
    setIsAddModalOpen(false);
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      segment: 'Young Parents (25-40)',
      stage: '1. Segmented',
      notes: ''
    });
  };

  const handleQuickImportClient = async (e) => {
    const clientId = e.target.value;
    if (!clientId) return;

    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    // Check if client is already in the campaign list
    if (contacts.some(c => c.fullName.toLowerCase().trim() === client.fullName.toLowerCase().trim())) {
      alert(`${client.fullName} is already added to this campaign.`);
      e.target.value = '';
      return;
    }

    const targetSegment = PLAYBOOK_RESOURCES.segments.find(
      s => s.name.toLowerCase().includes('client') || s.name.toLowerCase().includes('existing')
    )?.name || PLAYBOOK_RESOURCES.segments[0]?.name || 'Existing Clients';

    const newTarget = {
      id: `target-${Date.now()}`,
      fullName: client.fullName,
      phone: client.phone || '',
      email: client.email || '',
      segment: targetSegment,
      stage: '1. Segmented',
      notes: client.notes || '',
      portedClientId: client.id,
      createdAt: new Date().toISOString()
    };

    const updated = [...contacts, newTarget];
    await saveCampaignChanges(updated);
    e.target.value = '';
    setIsAddModalOpen(false);
  };

  const handleDeleteTarget = async (targetId) => {
    if (!window.confirm("Remove this target from the outreach list?")) return;
    const updated = contacts.filter(c => c.id !== targetId);
    await saveCampaignChanges(updated);
  };

  const handleUpdateTargetStage = async (targetId, newStage) => {
    const target = contacts.find(c => c.id === targetId);
    if (!target) return;

    if (newStage === '4. Appt Booked') {
      handlePortToCRM(target);
      return;
    }

    const updated = contacts.map(c => {
      if (c.id !== targetId) return c;
      return { ...c, stage: newStage, updatedAt: new Date().toISOString() };
    });
    await saveCampaignChanges(updated);
  };

  // Open Port & Convert Dialog
  const handlePortToCRM = (target) => {
    setPortTarget(target);
    setPortForm({
      stage: target.stage === '1. Segmented' ? '4. Appt Booked' : target.stage,
      createCase: true,
      policyName: campaign.productName || 'AIA Protect 3',
      policyType: 'A&H',
      estimatedPremium: '',
      estimatedFYC: '',
      expectedCloseDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      notes: target.notes || ''
    });
    setIsPortModalOpen(true);
  };

  const handlePortSubmit = async (e) => {
    e.preventDefault();
    if (!portTarget) return;

    setLoading(true);
    try {
      let clientId = portTarget.portedClientId;

      // 1. Port client if not already ported
      if (!clientId) {
        const existingClient = clients.find(
          c => (c.fullName || '').toLowerCase().trim() === portTarget.fullName.toLowerCase().trim()
        );

        if (existingClient) {
          clientId = existingClient.id;
          alert(`Linked ${portTarget.fullName} to existing Client profile!`);
        } else if (window.electronAPI?.addClient) {
          const clientRes = await window.electronAPI.addClient({
            fullName: portTarget.fullName,
            preferredName: portTarget.fullName.split(' ')[0],
            phone: portTarget.phone,
            email: portTarget.email,
            clientStatus: 'Prospect',
            notes: `[Ported via ${campaign.title || 'Outreach'} on ${new Date().toLocaleDateString()}] Campaign Segment: ${portTarget.segment}. Notes: ${portTarget.notes || 'None'}`
          });

          if (clientRes.success) {
            clientId = clientRes.id;
          } else {
            alert("Failed to create Client Profile: " + clientRes.error);
            setLoading(false);
            return;
          }
        }
      }

      // 2. Create Pipeline Case if stage is Appt Booked and checked
      if (portForm.stage === '4. Appt Booked' && portForm.createCase && clientId && window.electronAPI?.addPipelineCase) {
        const caseRes = await window.electronAPI.addPipelineCase({
          clientName: portTarget.fullName,
          policyName: portForm.policyName || campaign.productName || 'AIA Protect 3',
          policyType: portForm.policyType,
          estimatedPremium: Number(portForm.estimatedPremium) || 0,
          estimatedFYC: Number(portForm.estimatedFYC) || 0,
          stage: 'Prospect',
          expectedCloseDate: portForm.expectedCloseDate || null,
          notes: portForm.notes
        });

        if (!caseRes.success) {
          alert("Failed to create pipeline case: " + caseRes.error);
        }
      }

      // 3. Update target in campaign list
      const updated = contacts.map(c => {
        if (c.id !== portTarget.id) return c;
        return {
          ...c,
          portedClientId: clientId || c.portedClientId,
          stage: portForm.stage,
          updatedAt: new Date().toISOString()
        };
      });

      await saveCampaignChanges(updated);
      setIsPortModalOpen(false);
      setPortTarget(null);
      alert(`Successfully processed target ${portTarget.fullName}!`);
      loadData();
    } catch (err) {
      console.error("Error porting campaign target:", err);
    }
    setLoading(false);
  };

  const openScriptAssistant = (contact, stepIndex) => {
    setScriptModalData({ contact, stepIndex });
    setCopiedIndex(null);
    setIsScriptModalOpen(true);
  };

  const getReplacedScript = (contact, stepIndex) => {
    const templateObj = PLAYBOOK_RESOURCES.scripts.find(s => s.step === stepIndex + 1);
    if (!templateObj) return '';
    
    // Auto replace placeholder [Client Name]
    const preferredName = contact.fullName.split(' ')[0] || contact.fullName;
    return templateObj.template(preferredName);
  };

  const handleCopyScript = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 1500);
  };

  const handleSendWhatsApp = (contact, text) => {
    // Strip non-numbers from phone
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

  const toggleRoutineTick = (time) => {
    const today = new Date().toLocaleDateString();
    const key = `${today}-${time}`;
    setRoutineTicks({
      ...routineTicks,
      [key]: !routineTicks[key]
    });
  };

  // Metrics calculations
  const totalTargets = contacts.length;
  const segmentedCount = contacts.filter(c => c.stage === '1. Segmented').length;
  const openerSentCount = contacts.filter(c => c.stage === '2. Opener Sent').length;
  const infoSharedCount = contacts.filter(c => c.stage === '3. Info Shared').length;
  const bookedCount = contacts.filter(c => c.stage === '4. Appt Booked').length;
  const inactiveCount = contacts.filter(c => c.stage === 'Inactive').length;

  const bookingRate = totalTargets 
    ? Math.round((bookedCount / totalTargets) * 100) 
    : 0;

  // Filtered target list
  const filteredContacts = contacts.filter(c => {
    const nameMatch = c.fullName.toLowerCase().includes(search.toLowerCase()) || 
                      (c.phone && c.phone.includes(search)) ||
                      (c.email && c.email.toLowerCase().includes(search.toLowerCase()));
    
    const segmentMatch = filterSegment === 'All' || c.segment === filterSegment;
    const stageMatch = filterStage === 'All' || c.stage === filterStage;
    
    return nameMatch && segmentMatch && stageMatch;
  });

  // Clients not in current campaign list
  const availableClientsToImport = clients.filter(c => {
    return !contacts.some(t => t.fullName.toLowerCase().trim() === c.fullName.toLowerCase().trim() || t.portedClientId === c.id);
  });

  return (
    <div className="view-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
            onClick={onBack}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 className="text-gradient" style={{ fontSize: '22px', margin: 0 }}>
                {campaign.title || `${campaign.productName} Outreach`}
              </h1>
              <span className="glass-panel" style={{ fontSize: '10px', color: 'var(--accent-primary)', padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.2)' }}>
                WhatsApp Outreach
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
              Product Focus: <strong style={{ color: 'var(--text-secondary)' }}>{campaign.productName}</strong> • Target Audience: <strong style={{ color: 'var(--text-secondary)' }}>{campaign.targetAudience}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px', gap: '4px' }}>
            <button 
              className="btn" 
              style={{ 
                padding: '6px 12px', fontSize: '12px', borderRadius: '6px', 
                backgroundColor: activeTab === 'workspace' ? 'rgba(255,255,255,0.1)' : 'transparent', 
                color: activeTab === 'workspace' ? 'var(--text-primary)' : 'var(--text-muted)' 
              }}
              onClick={() => setActiveTab('workspace')}
            >
              💼 Workspace
            </button>
            <button 
              className="btn" 
              style={{ 
                padding: '6px 12px', fontSize: '12px', borderRadius: '6px', 
                backgroundColor: activeTab === 'playbook' ? 'rgba(255,255,255,0.1)' : 'transparent', 
                color: activeTab === 'playbook' ? 'var(--text-primary)' : 'var(--text-muted)' 
              }}
              onClick={() => setActiveTab('playbook')}
            >
              📖 Campaign Playbook
            </button>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={15} /> Add Target
          </button>
        </div>
      </header>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        
        {/* Metric 1: Total Targets */}
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '10.5px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Campaign Size</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>{totalTargets}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>targets listed</span>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Goal: Book {campaign.targetAppointments || 20} appointments
            </p>
          </div>
        </div>

        {/* Metric 2: Funnel Flow */}
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '10.5px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Outreach Progress</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '22px', fontWeight: '700', color: 'var(--accent-secondary)' }}>
                {totalTargets ? Math.round(((openerSentCount + infoSharedCount + bookedCount) / totalTargets) * 100) : 0}%
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>outreach initiated</span>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {openerSentCount + infoSharedCount + bookedCount} messages sent successfully
            </p>
          </div>
        </div>

        {/* Metric 3: Booking rate */}
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '10.5px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Appointments Booked</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '22px', fontWeight: '700', color: 'var(--accent-success)' }}>{bookedCount}</span>
              <span style={{ fontSize: '13px', color: 'var(--accent-success)', fontWeight: '600' }}>({bookingRate}% Booked)</span>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Towards goal of {campaign.targetAppointments || 20} bookings
            </p>
          </div>
        </div>

        {/* Metric 4: Stage Distribution */}
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '10.5px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fulfillment Funnel</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '10px', marginTop: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>1. Segmented: <strong>{segmentedCount}</strong></span>
              <span>2. Opener: <strong>{openerSentCount}</strong></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>3. Info Drop: <strong>{infoSharedCount}</strong></span>
              <span>4. Appt: <strong>{bookedCount}</strong></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-start', color: 'var(--text-muted)', fontSize: '9px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '4px', marginTop: '2px' }}>
              <span>Inactive / Paused: <strong>{inactiveCount}</strong></span>
            </div>
          </div>
        </div>

      </div>

      {activeTab === 'workspace' ? (
        <>
          {/* Workspace Filters & Table */}
          <div className="glass-panel" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '360px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="input-field" 
                style={{ width: '100%', paddingLeft: '36px', fontSize: '12.5px' }} 
                placeholder="Search targets by name or phone..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Segment:</span>
                <select 
                  className="input-field" 
                  style={{ padding: '4px 10px', fontSize: '12px', background: 'var(--bg-base)' }}
                  value={filterSegment}
                  onChange={e => setFilterSegment(e.target.value)}
                >
                  <option value="All">All Segments</option>
                  {PLAYBOOK_RESOURCES.segments.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Stage:</span>
                <select 
                  className="input-field" 
                  style={{ padding: '4px 10px', fontSize: '12px', background: 'var(--bg-base)' }}
                  value={filterStage}
                  onChange={e => setFilterStage(e.target.value)}
                >
                  <option value="All">All Stages</option>
                  {CAMPAIGN_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

          </div>

          {/* Table */}
          <div className="glass-panel" style={{ overflowX: 'auto', padding: 0 }}>
            {loading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading campaign...</div>
            ) : filteredContacts.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={28} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>No Targets Added</h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '11.5px', maxWidth: '300px' }}>
                  Click "Add Target" to import client profiles or manually register numbers to initiate the WhatsApp campaign.
                </p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-light)' }}>
                    <th style={{ padding: '12px 18px', color: 'var(--text-secondary)', fontWeight: '500' }}>Name & Contact</th>
                    <th style={{ padding: '12px 18px', color: 'var(--text-secondary)', fontWeight: '500' }}>Audience Segment</th>
                    <th style={{ padding: '12px 18px', color: 'var(--text-secondary)', fontWeight: '500' }}>Outreach Stage</th>
                    <th style={{ padding: '12px 18px', color: 'var(--text-secondary)', fontWeight: '500' }}>Script Assistant</th>
                    <th style={{ padding: '12px 18px', color: 'var(--text-secondary)', fontWeight: '500', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map(contact => {
                    const color = STAGE_COLORS[contact.stage] || { bg: 'rgba(255,255,255,0.05)', text: '#fff' };
                    return (
                      <tr 
                        key={contact.id} 
                        style={{ borderBottom: '1px solid var(--border-light)', transition: 'background-color 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        
                        {/* Name & Contact */}
                        <td style={{ padding: '12px 18px' }}>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{contact.fullName}</div>
                          <div style={{ display: 'flex', gap: '8px', color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
                            {contact.phone && <span>📞 {contact.phone}</span>}
                            {contact.email && <span>✉️ {contact.email}</span>}
                          </div>
                        </td>

                        {/* Audience Segment */}
                        <td style={{ padding: '12px 18px', color: 'var(--text-secondary)' }}>
                          {contact.segment}
                        </td>

                        {/* Outreach Stage */}
                        <td style={{ padding: '12px 18px' }}>
                          <select
                            value={contact.stage}
                            onChange={e => handleUpdateTargetStage(contact.id, e.target.value)}
                            style={{ 
                              padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', 
                              backgroundColor: color.bg, color: color.text, border: 'none', cursor: 'pointer', outline: 'none'
                            }}
                          >
                            {CAMPAIGN_STAGES.map(s => <option key={s} value={s} style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>{s}</option>)}
                          </select>
                        </td>

                        {/* Script Assistant */}
                        <td style={{ padding: '12px 18px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {[1, 2, 3].map(step => (
                              <button
                                key={step}
                                className="btn"
                                style={{ 
                                  padding: '3px 8px', fontSize: '10.5px', height: 'auto', 
                                  backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-light)',
                                  color: 'var(--text-secondary)'
                                }}
                                onClick={() => openScriptAssistant(contact, step - 1)}
                                title={`Generate Step ${step} Script`}
                              >
                                Step {step}
                              </button>
                            ))}
                          </div>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
                            
                            {/* Port to CRM Link */}
                            {!contact.portedClientId ? (
                              <button
                                className="btn btn-secondary"
                                style={{ 
                                  padding: '4px 8px', fontSize: '11px', height: 'auto', 
                                  borderColor: 'rgba(16, 185, 129, 0.3)', color: 'var(--accent-success)',
                                  backgroundColor: 'rgba(16, 185, 129, 0.04)'
                                }}
                                onClick={() => handlePortToCRM(contact)}
                                title="Port to Central CRM Clients"
                              >
                                <UserPlus size={11} style={{ marginRight: '3px' }} /> Port
                              </button>
                            ) : (
                              <span style={{ fontSize: '10.5px', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '3px', padding: '4px 8px', backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: '4px' }}>
                                <CheckCircle size={10} /> Ported
                              </span>
                            )}

                            <button
                              onClick={() => handleDeleteTarget(contact.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '5px' }}
                              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                              title="Delete target"
                            >
                              <Trash2 size={12} />
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
        </>
      ) : (
        /* Playbook (Guides) Tab */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Phase 1: Segmentation Guidelines */}
          <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              Phase 1: Segmentation & Targeting (The "Why")
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>
              Before messaging, classify targets into one of the key segments to understand their hook points.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '6px' }}>
              {PLAYBOOK_RESOURCES.segments.map(seg => (
                <div key={seg.name} style={{ border: '1px solid var(--border-light)', borderRadius: '8px', padding: '14px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ fontWeight: '700', fontSize: '12.5px', color: 'var(--accent-primary)', marginBottom: '8px' }}>
                    {seg.name}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Hook: </span>
                      <span style={{ color: 'var(--text-primary)' }}>{seg.hook}</span>
                    </div>
                    <div style={{ lineHeight: '1.4' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Why Fit: </span>
                      <span style={{ color: 'var(--text-secondary)' }}>{seg.why}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Phase 2: Sequence Script Preview */}
          <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              Phase 2: The 3-Step WhatsApp Outreach Sequence
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '6px' }}>
              {PLAYBOOK_RESOURCES.scripts.map((script, idx) => (
                <div key={idx} style={{ border: '1px solid var(--border-light)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '12px', color: 'var(--text-primary)' }}>{script.title}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{script.goal}</div>
                  </div>
                  <div style={{ 
                    flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', 
                    fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: '1.4',
                    fontFamily: 'monospace', maxHeight: '160px', overflowY: 'auto'
                  }}>
                    {script.template('[Client Name]')}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--accent-secondary)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ⏰ {script.timeHint}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Phase 3: Daily Routine Tracker */}
          <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              Phase 3: Daily Activity Workflow Routine
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>
              Stick to this batch prospecting routine daily. Checklist resets when you refresh the app.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              {PLAYBOOK_RESOURCES.routines.map(r => {
                const today = new Date().toLocaleDateString();
                const tickKey = `${today}-${r.time}`;
                const isTicked = !!routineTicks[tickKey];
                
                return (
                  <div 
                    key={r.time} 
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
                      padding: '12px 18px', border: '1px solid var(--border-light)', borderRadius: '8px',
                      backgroundColor: isTicked ? 'rgba(16,185,129,0.03)' : 'rgba(255,255,255,0.01)',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <button 
                      onClick={() => toggleRoutineTick(r.time)}
                      style={{ background: 'none', border: 'none', color: isTicked ? 'var(--accent-success)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}
                    >
                      {isTicked ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-secondary)', backgroundColor: 'rgba(6,182,212,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                          {r.time}
                        </span>
                        <strong style={{ fontSize: '12.5px', color: isTicked ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: isTicked ? 'line-through' : 'none' }}>
                          {r.task}
                        </strong>
                      </div>
                      <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                        {r.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* SCRIPT ASSISTANT MODAL (MODAL DRAWER) */}
      {isScriptModalOpen && scriptModalData && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)',
          backdropFilter: 'blur(8px)', zIndex: 1001,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }} onClick={() => { setIsScriptModalOpen(false); setScriptModalData(null); }}>
          <div 
            className="glass-panel animate-fade-in" 
            style={{ width: '100%', maxWidth: '580px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}
            onClick={e => e.stopPropagation()}
          >
            <div>
              <h2 style={{ fontSize: '16px', margin: 0, color: 'var(--text-primary)' }}>
                {PLAYBOOK_RESOURCES.scripts[scriptModalData.stepIndex].title}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '11.5px', marginTop: '2px', marginBottom: 0 }}>
                Target: <strong>{scriptModalData.contact.fullName}</strong> ({scriptModalData.contact.phone || 'No phone logged'})
              </p>
            </div>

            <div style={{ border: '1px solid var(--border-light)', borderRadius: '8px', padding: '14px', backgroundColor: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ 
                fontSize: '12px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', 
                lineHeight: '1.5', fontFamily: 'monospace', maxHeight: '300px', overflowY: 'auto' 
              }}>
                {getReplacedScript(scriptModalData.contact, scriptModalData.stepIndex)}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Goal: {PLAYBOOK_RESOURCES.scripts[scriptModalData.stepIndex].goal}
              </span>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                  onClick={() => handleCopyScript(getReplacedScript(scriptModalData.contact, scriptModalData.stepIndex), 1)}
                >
                  <Copy size={13} /> {copiedIndex === 1 ? 'Copied!' : 'Copy Script'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                  onClick={() => handleSendWhatsApp(scriptModalData.contact, getReplacedScript(scriptModalData.contact, scriptModalData.stepIndex))}
                >
                  <MessageSquare size={13} /> Send WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD TARGET MODAL */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)',
          backdropFilter: 'blur(8px)', zIndex: 1001,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }} onClick={() => setIsAddModalOpen(false)}>
          <div 
            className="glass-panel animate-fade-in" 
            style={{ width: '100%', maxWidth: '480px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}
            onClick={e => e.stopPropagation()}
          >
            <div>
              <h2 style={{ fontSize: '16px', margin: 0 }}>Add Campaign Target</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '11.5px', marginTop: '2px', marginBottom: 0 }}>
                Link an existing Client or create a manual outreach record
              </p>
            </div>

            {/* Quick Import from Database clients */}
            {availableClientsToImport.length > 0 && (
              <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '14px', marginBottom: '4px' }}>
                <label className="input-label" style={{ fontSize: '10.5px' }}>Quick Import from Clients Database</label>
                <select
                  className="input-field"
                  style={{ width: '100%', padding: '6px 10px', fontSize: '12px', background: 'var(--bg-base)', border: '1px solid rgba(255,255,255,0.08)' }}
                  value=""
                  onChange={handleQuickImportClient}
                >
                  <option value="">-- Select Client Profile --</option>
                  {availableClientsToImport.map(c => (
                    <option key={c.id} value={c.id}>{c.fullName}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Manual Form */}
            <form onSubmit={handleManualAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="input-group">
                <label className="input-label">Full Name *</label>
                <input 
                  type="text" name="fullName" className="input-field" 
                  value={formData.fullName} onChange={handleInputChange} 
                  required placeholder="e.g. Marcus Lim"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Phone Number</label>
                  <input 
                    type="text" name="phone" className="input-field" 
                    value={formData.phone} onChange={handleInputChange} 
                    placeholder="e.g. +65 9876 5432"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Email Address</label>
                  <input 
                    type="email" name="email" className="input-field" 
                    value={formData.email} onChange={handleInputChange} 
                    placeholder="e.g. marcus@gmail.com"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Campaign Segment</label>
                  <select 
                    name="segment" className="input-field" 
                    style={{ background: 'var(--bg-base)' }}
                    value={formData.segment} onChange={handleInputChange}
                  >
                    {PLAYBOOK_RESOURCES.segments.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Initial Stage</label>
                  <select 
                    name="stage" className="input-field" 
                    style={{ background: 'var(--bg-base)' }}
                    value={formData.stage} onChange={handleInputChange}
                  >
                    {CAMPAIGN_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Target Notes / Insights</label>
                <textarea 
                  name="notes" className="input-field" 
                  style={{ minHeight: '50px', fontFamily: 'inherit', resize: 'vertical' }}
                  value={formData.notes} onChange={handleInputChange}
                  placeholder="e.g. Met at seminar. Married with a 2 year old."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PORT & CONVERT TARGET MODAL */}
      {isPortModalOpen && portTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)',
          backdropFilter: 'blur(8px)', zIndex: 1001,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }} onClick={() => { setIsPortModalOpen(false); setPortTarget(null); }}>
          <div 
            className="glass-panel animate-fade-in" 
            style={{ width: '100%', maxWidth: '520px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div>
              <h2 style={{ fontSize: '16px', margin: 0, color: 'var(--text-primary)' }}>Port Target & Convert</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '11.5px', marginTop: '2px', marginBottom: 0 }}>
                Configure campaign stage and CRM sync for <strong>{portTarget.fullName}</strong>
              </p>
            </div>

            <form onSubmit={handlePortSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Select Stage */}
              <div className="input-group">
                <label className="input-label">Campaign Stage</label>
                <select
                  className="input-field"
                  style={{ background: 'var(--bg-base)' }}
                  value={portForm.stage}
                  onChange={e => setPortForm({ ...portForm, stage: e.target.value })}
                >
                  {CAMPAIGN_STAGES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Create Case Toggle */}
              {portForm.stage === '4. Appt Booked' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
                  <input
                    type="checkbox"
                    id="createCaseCheckbox"
                    checked={portForm.createCase}
                    onChange={e => setPortForm({ ...portForm, createCase: e.target.checked })}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="createCaseCheckbox" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    Create Sales Case in Pipeline (Recommended)
                  </label>
                </div>
              )}

              {/* Pipeline Case Form Fields */}
              {portForm.stage === '4. Appt Booked' && portForm.createCase && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '4px', borderLeft: '2px solid var(--accent-primary)', marginTop: '4px' }}>
                  <div className="input-group">
                    <label className="input-label">Policy / Product Name</label>
                    <input
                      type="text"
                      className="input-field"
                      value={portForm.policyName}
                      onChange={e => setPortForm({ ...portForm, policyName: e.target.value })}
                      placeholder="e.g. AIA Protect 3"
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="input-group">
                      <label className="input-label">Policy Type</label>
                      <select
                        className="input-field"
                        style={{ background: 'var(--bg-base)' }}
                        value={portForm.policyType}
                        onChange={e => setPortForm({ ...portForm, policyType: e.target.value })}
                      >
                        {['Life','Term','A&H','Shield','HI','ILP','Endowment','LTC','Disability Income'].map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Expected Close Date</label>
                      <input
                        type="date"
                        className="input-field"
                        value={portForm.expectedCloseDate}
                        onChange={e => setPortForm({ ...portForm, expectedCloseDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="input-group">
                      <label className="input-label">Est. Annual Premium ($)</label>
                      <input
                        type="number"
                        className="input-field"
                        min="0"
                        value={portForm.estimatedPremium}
                        onChange={e => setPortForm({ ...portForm, estimatedPremium: e.target.value })}
                        placeholder="e.g. 1200"
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Est. First Year Comm ($)</label>
                      <input
                        type="number"
                        className="input-field"
                        min="0"
                        value={portForm.estimatedFYC}
                        onChange={e => setPortForm({ ...portForm, estimatedFYC: e.target.value })}
                        placeholder="e.g. 450"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Notes / Next Steps</label>
                <textarea
                  className="input-field"
                  style={{ minHeight: '60px', fontFamily: 'inherit', resize: 'vertical' }}
                  value={portForm.notes}
                  onChange={e => setPortForm({ ...portForm, notes: e.target.value })}
                  placeholder="e.g. Secured meeting for this Saturday at 2pm."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setIsPortModalOpen(false); setPortTarget(null); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Processing...' : 'Confirm Port & Convert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
