import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowLeft, Plus, Search, CheckCircle, 
  Copy, MessageSquare, Trash2, Edit2,
  HelpCircle, UserPlus, CheckCircle2, Circle, Sparkles, Send
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

export default function OutreachCampaignDetail({ campaign: campaignProp, onBack }) {
  const [currentCampaign, setCurrentCampaign] = useState(campaignProp);
  const campaign = currentCampaign;

  // Unified logging helper
  const log = (msg) => {
    console.log(msg);
    if (window.electronAPI?.writeLog) {
      window.electronAPI.writeLog(msg);
    }
  };

  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState(campaign.contacts || []);
  const [clients, setClients] = useState([]);

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
          template: (clientName) => {
            const tempStr = s.templateContent || '';
            return tempStr
              .replace(/\[Client Name\]/g, clientName)
              .replace(/\{clientName\}/g, clientName)
              .replace(/\$\{clientName\}/g, clientName);
          }
        })),
        routines: campaign.playbook.routines || []
      };
    }

    // Default template using dynamic productName & targetAudience if no custom playbook was parsed by AI
    const product = campaign.productName || 'AIA Protect 3';
    const audience = campaign.targetAudience || 'Young Working Adults & Families';

    if (product === 'AIA Protect 3' && audience === 'Young Working Adults & Families') {
      return AIA_PROTECT_3_RESOURCES;
    }

    return {
      segments: [
        {
          name: 'Existing Clients',
          hook: `Coverage review using ${product}`,
          why: `Excellent touchpoint to recommend a ${product} upgrade to existing portfolios.`
        },
        {
          name: audience,
          hook: `Direct solution hook for ${audience}`,
          why: `Directly targets key risk factors and budget preferences of ${audience}.`
        },
        {
          name: 'Warm Referrals',
          hook: `Introduce ${product} benefits`,
          why: `An easy value drop of ${product} when introduced through mutual connections.`
        }
      ],
      scripts: [
        {
          step: 1,
          title: 'Step 1: The Soft Opener (Value-Led Hook)',
          goal: `Start a conversation highlighting key features of ${product}.`,
          timeHint: 'Send mid-week (Tuesday/Thursday morning).',
          template: (clientName) => `Hey ${clientName}, hope you're having a smooth week!
          
I was reading through the latest industry reports and noticed a significant protection gap that many people in our demographic are exposed to.

AIA recently introduced a streamlined plan, ${product}, specifically tailored for ${audience}. It's budget-friendly and offers an effortless way to upgrade.

I've been preparing quick summaries for some families recently. If you're open to it, I can text over a 1-page summary to see if it makes sense for your current setup? No pressure at all.`
        },
        {
          step: 2,
          title: 'Step 2: The Follow-Up / Fulfillment (Value Drop)',
          goal: 'Share brochure details and highlight a standout feature.',
          timeHint: 'Sent 2–3 days later to those who responded with interest.',
          template: () => `Great! Here is the summary brochure for ${product}.
          
What I personally like about it is how cost-effective the coverage is for our age group. It provides solid protection without premium waste.

You can explore a basic cover boost depending on what you already have in place. Do you happen to remember off the top of your head what your current total coverage is right now?`
        },
        {
          step: 3,
          title: 'Step 3: The Call to Action (The Appointment Close)',
          goal: 'Move from text discussion to a quick 15-minute sync.',
          timeHint: 'Offer concrete time options.',
          template: () => `No worries if you don't have the exact number on hand—that's exactly what I'm here for!
          
Let's do a quick 15-minute coffee chat or Zoom call. We can check your existing portfolio, see if you have a gap, and check how ${product} fits your budget.

How does this Thursday at 3 PM or Friday at 11 AM sound for a quick catch-up?`
        }
      ],
      routines: [
        { time: '09:00 AM - 09:30 AM', task: 'The Batch Send', desc: `Send out 5 to 10 Step 1 Opener messages introducing ${product}.` },
        { time: '12:00 PM - 12:30 PM', task: 'The Mid-Day Check', desc: 'Reply to morning answers, share brochure details, and lock in calendar invites.' },
        { time: '05:00 PM - 05:30 PM', task: 'The Follow-Up', desc: 'Check on outstanding chats, send gentle reminders, and log appointments.' }
      ]
    };
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
  
  // AI Script Tweaking Chat State
  const [activeChats, setActiveChats] = useState({ 0: false, 1: false, 2: false });
  const [chatHistories, setChatHistories] = useState({
    0: [{ role: 'model', text: "Hi! I can help you tweak this Soft Opener script. Tell me what changes you'd like to make (e.g. \"make it warmer\", \"keep it short\", or \"mention cashback\")." }],
    1: [{ role: 'model', text: "Hi! I can help you tweak this Follow-Up script. Tell me what changes you'd like to make." }],
    2: [{ role: 'model', text: "Hi! I can help you tweak this CTA/Appointment script. Tell me what changes you'd like to make." }]
  });
  const [chatInputs, setChatInputs] = useState({ 0: '', 1: '', 2: '' });
  const [isTweaking, setIsTweaking] = useState({ 0: false, 1: false, 2: false });
  
  // Notification Toast State
  const [notification, setNotification] = useState(null); // { message: '', type: 'success' | 'error' | 'info' }
  const showNotification = (message, type = 'info') => {
    log(`[OutreachCampaignDetail] showNotification: "${message}" [${type}]`);
    setNotification({ message, type });
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Auto-scroll to bottom of targets list when a new target is added
  const prevContactsLength = useRef(contacts.length);
  useEffect(() => {
    if (contacts.length > prevContactsLength.current) {
      scrollToBottom();
    }
    prevContactsLength.current = contacts.length;
  }, [contacts.length]);

  // Listen for Alt + A hotkey to trigger the Add Target modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        
        // Don't trigger if user is actively editing inside an input/textarea/select
        const active = document.activeElement;
        const isInput = active && (
          active.tagName === 'INPUT' || 
          active.tagName === 'TEXTAREA' || 
          active.tagName === 'SELECT' ||
          active.isContentEditable
        );
        
        if (!isInput) {
          setIsAddModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Temporary Highlight for Just Ported Target
  const [justPortedTargetId, setJustPortedTargetId] = useState(null);
  const [isPorting, setIsPorting] = useState(false);
  
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

  useEffect(() => {
    log(`[OutreachCampaignDetail] Mounted campaign: "${campaign.title}" (ID: ${campaign.id})`);
  }, [campaign.id, campaign.title]);

  useEffect(() => {
    log(`[OutreachCampaignDetail] isPortModalOpen changed to: ${isPortModalOpen}`);
  }, [isPortModalOpen]);

  useEffect(() => {
    log(`[OutreachCampaignDetail] isAddModalOpen changed to: ${isAddModalOpen}`);
  }, [isAddModalOpen]);

  useEffect(() => {
    log(`[OutreachCampaignDetail] showEditModal changed to: ${showEditModal}`);
  }, [showEditModal]);

  console.log(`[OutreachCampaignDetail] Rendering component:`, {
    loading,
    isPortModalOpen: typeof isPortModalOpen !== 'undefined' ? isPortModalOpen : false,
    isAddModalOpen: typeof isAddModalOpen !== 'undefined' ? isAddModalOpen : false,
    contactsCount: contacts.length,
    clientsCount: clients.length
  });

  const loadData = async (showPlaceholder = false) => {
    log("[OutreachCampaignDetail] loadData started, showPlaceholder: " + showPlaceholder);
    if (showPlaceholder) {
      setLoading(true);
    }
    if (window.electronAPI && window.electronAPI.getClients) {
      log("[OutreachCampaignDetail] calling electronAPI.getClients...");
      const res = await window.electronAPI.getClients();
      log("[OutreachCampaignDetail] getClients response success: " + res.success);
      if (res.success) {
        setClients(res.data);
      }
    }
    setLoading(false);
    log("[OutreachCampaignDetail] loadData finished");
  };

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
    loadData(true);
  }, []);

  const saveCampaignChanges = async (updatedContacts) => {
    log("[OutreachCampaignDetail] saveCampaignChanges started with count: " + updatedContacts.length);
    setContacts(updatedContacts);
    if (window.electronAPI?.updateInitiative) {
      log("[OutreachCampaignDetail] calling electronAPI.updateInitiative...");
      /* eslint-disable-next-line react-hooks/purity */
      const start = performance.now();
      await window.electronAPI.updateInitiative({
        id: campaign.id,
        contacts: updatedContacts
      });
      /* eslint-disable-next-line react-hooks/purity */
      log("[OutreachCampaignDetail] updateInitiative took: " + (performance.now() - start).toFixed(2) + " ms");
    }
    log("[OutreachCampaignDetail] saveCampaignChanges finished");
  };

  const handleDeleteCampaign = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this campaign? All target contacts and progress data will be lost.")) return;

    if (window.electronAPI && window.electronAPI.deleteInitiative) {
      const res = await window.electronAPI.deleteInitiative(campaign.id);
      if (res.success) {
        onBack();
      } else {
        showNotification("Failed to delete campaign: " + res.error, "error");
      }
    }
  };

  const handleEditCampaignSubmit = async (e) => {
    e.preventDefault();
    if (window.electronAPI?.updateInitiative) {
      let updatedPlaybook = campaign.playbook;
      if (updatedPlaybook) {
        updatedPlaybook = {
          ...updatedPlaybook,
          productFocus: editFields.productName,
          targetAudience: editFields.targetAudience
        };
      }

      const updatedFields = {
        id: campaign.id,
        title: editFields.title.trim(),
        productName: editFields.productName.trim(),
        targetAudience: editFields.targetAudience.trim(),
        targetAppointments: Number(editFields.targetAppointments) || 20,
        targetDate: editFields.targetDate,
        leader: editFields.leader.trim(),
        members: Number(editFields.members) || 1,
        description: editFields.description.trim(),
        playbook: updatedPlaybook
      };

      const res = await window.electronAPI.updateInitiative(updatedFields);
      if (res.success) {
        setCurrentCampaign(prev => ({
          ...prev,
          ...updatedFields
        }));
        setShowEditModal(false);
      } else {
        showNotification("Failed to update campaign: " + res.error, "error");
      }
    }
  };

  const scrollChatToBottom = (stepIndex) => {
    setTimeout(() => {
      const container = document.getElementById(`chat-container-${stepIndex}`);
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  };

  const ensurePlaybookInitialized = () => {
    if (campaign.playbook && campaign.playbook.segments && campaign.playbook.scripts) {
      return campaign.playbook;
    }
    
    const product = campaign.productName || 'AIA Protect 3';
    const audience = campaign.targetAudience || 'Young Working Adults & Families';
    
    return {
      productFocus: product,
      targetAudience: audience,
      segments: PLAYBOOK_RESOURCES.segments,
      scripts: PLAYBOOK_RESOURCES.scripts.map(s => {
        const templateContent = s.template('[Client Name]');
        return {
          step: s.step,
          title: s.title,
          goal: s.goal,
          timeHint: s.timeHint,
          templateContent: templateContent
        };
      }),
      routines: PLAYBOOK_RESOURCES.routines
    };
  };

  const handleSaveModifiedScript = async (stepIndex, newTemplateContent) => {
    try {
      const initializedPlaybook = ensurePlaybookInitialized();
      
      const updatedScripts = initializedPlaybook.scripts.map(s => {
        if (s.step === stepIndex + 1) {
          return { ...s, templateContent: newTemplateContent };
        }
        return s;
      });

      const updatedPlaybook = {
        ...initializedPlaybook,
        scripts: updatedScripts
      };

      if (window.electronAPI?.updateInitiative) {
        const res = await window.electronAPI.updateInitiative({
          id: campaign.id,
          playbook: updatedPlaybook
        });
        
        if (res.success) {
          setCurrentCampaign(prev => ({
            ...prev,
            playbook: updatedPlaybook
          }));
          showNotification("Script updated and saved successfully!", "success");
          return true;
        } else {
          showNotification("Failed to save updated script: " + res.error, "error");
          return false;
        }
      }
    } catch (err) {
      console.error("Error saving script:", err);
      showNotification("Error saving script: " + err.message, "error");
      return false;
    }
  };

  const handleTweakScriptWithAI = async (stepIndex) => {
    const input = chatInputs[stepIndex]?.trim();
    if (!input) return;

    setChatInputs(prev => ({ ...prev, [stepIndex]: '' }));

    const userMsg = { role: 'user', text: input };
    setChatHistories(prev => ({
      ...prev,
      [stepIndex]: [...(prev[stepIndex] || []), userMsg]
    }));
    scrollChatToBottom(stepIndex);

    setIsTweaking(prev => ({ ...prev, [stepIndex]: true }));

    try {
      const currentScriptObj = PLAYBOOK_RESOURCES.scripts.find(s => s.step === stepIndex + 1);
      const currentTemplate = currentScriptObj ? currentScriptObj.template('[Client Name]') : '';

      const history = chatHistories[stepIndex] || [];

      if (window.electronAPI?.tweakOutreachScript) {
        const res = await window.electronAPI.tweakOutreachScript({
          scriptText: currentTemplate,
          instruction: input,
          chatHistory: history
        });

        if (res.success && res.tweakedScript) {
          const aiMsg = { 
            role: 'model', 
            text: "I've tweaked the script based on your request. You can check the preview below. Click 'Apply & Save' if you'd like to use this version.",
            proposedScript: res.tweakedScript
          };
          setChatHistories(prev => ({
            ...prev,
            [stepIndex]: [...(prev[stepIndex] || []), aiMsg]
          }));
          scrollChatToBottom(stepIndex);
        } else {
          setChatHistories(prev => ({
            ...prev,
            [stepIndex]: [
              ...(prev[stepIndex] || []),
              { role: 'model', text: `Sorry, I ran into an error tweaking the script: ${res.error || 'Unknown error'}` }
            ]
          }));
          scrollChatToBottom(stepIndex);
        }
      } else {
        throw new Error("tweakOutreachScript is not available on window.electronAPI");
      }
    } catch (err) {
      console.error(err);
      setChatHistories(prev => ({
        ...prev,
        [stepIndex]: [
          ...(prev[stepIndex] || []),
          { role: 'model', text: `Failed to communicate with AI: ${err.message}` }
        ]
      }));
      scrollChatToBottom(stepIndex);
    } finally {
      setIsTweaking(prev => ({ ...prev, [stepIndex]: false }));
    }
  };

  const handleInputChange = (e) => {
    log(`[OutreachCampaignDetail] handleInputChange for "${e.target.name}": "${e.target.value}"`);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const scrollToBottom = () => {
    log("[scrollToBottom] OutreachCampaignDetail scroll sequence triggered.");
    const runScroll = (delay) => {
      const container = document.getElementById('main-scroll-container');
      let containerLog = 'not found';
      if (container) {
        const oldScrollTop = container.scrollTop;
        container.scrollTop = container.scrollHeight + 1000;
        containerLog = `scrollHeight=${container.scrollHeight}, clientHeight=${container.clientHeight}, scrollTop: was ${oldScrollTop} => now ${container.scrollTop}`;
      }

      const activeEl = document.activeElement;
      const activeElLog = activeEl ? `${activeEl.tagName}.${activeEl.className} (id: ${activeEl.id})` : 'none';

      // Check documentElement and body scrolls
      const oldDocScroll = document.documentElement.scrollTop;
      document.documentElement.scrollTop = document.documentElement.scrollHeight;
      const docLog = `documentElement.scrollHeight=${document.documentElement.scrollHeight}, scrollTop: was ${oldDocScroll} => now ${document.documentElement.scrollTop}`;

      // Log parent elements scroll checks
      let parentsLog = [];
      let el = document.querySelector('.view-container');
      while (el) {
        const isScrollable = el.scrollHeight > el.clientHeight;
        const oldScroll = el.scrollTop;
        if (isScrollable) {
          el.scrollTop = el.scrollHeight + 1000;
        }
        parentsLog.push(`${el.tagName}.${el.className} [scrollable=${isScrollable}, scrollHeight=${el.scrollHeight}, clientHeight=${el.clientHeight}, scrollTop: was ${oldScroll} => now ${el.scrollTop}]`);
        el = el.parentNode;
      }

      log(`[scrollToBottom Diagnostic][${delay}ms]\n` +
          `  - Container: ${containerLog}\n` +
          `  - Active Element: ${activeElLog}\n` +
          `  - Document: ${docLog}\n` +
          `  - Parents: ${parentsLog.join(' -> ')}`
      );
    };

    // Staggered execution
    setTimeout(() => runScroll(0), 0);
    setTimeout(() => runScroll(50), 50);
    setTimeout(() => runScroll(150), 150);
    setTimeout(() => runScroll(300), 300);
    setTimeout(() => runScroll(600), 600);
    setTimeout(() => runScroll(1200), 1200);
  };

  const handleManualAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) return;

    log(`[OutreachCampaignDetail] handleManualAddSubmit for ${formData.fullName}`);
    
    // Blur any active element in the modal to prevent browser focus restore issues
    if (document.activeElement) {
      document.activeElement.blur();
    }
    
    // Close modal immediately for instant UI feedback and focus settling
    setIsAddModalOpen(false);

    /* eslint-disable-next-line react-hooks/purity */
    const targetId = `target-${Date.now()}`;
    const newTarget = {
      id: targetId,
      fullName: formData.fullName,
      phone: formData.phone || '',
      email: formData.email || '',
      segment: formData.segment,
      stage: formData.stage,
      notes: formData.notes || '',
      createdAt: new Date().toISOString()
    };

    const updated = [...contacts, newTarget];
    
    // Reset form fields
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      segment: 'Young Parents (25-40)',
      stage: '1. Segmented',
      notes: ''
    });

    // Save changes to database and trigger scrolling
    await saveCampaignChanges(updated);
    scrollToBottom();
  };

  const handleQuickImportClient = async (e) => {
    const clientId = e.target.value;
    if (!clientId) return;

    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    // Check if client is already in the campaign list
    if (contacts.some(c => (c.fullName || '').toLowerCase().trim() === (client.fullName || '').toLowerCase().trim())) {
      showNotification(`${client.fullName} is already added to this campaign.`, "info");
      e.target.value = '';
      return;
    }

    const targetSegment = PLAYBOOK_RESOURCES.segments.find(
      s => s.name.toLowerCase().includes('client') || s.name.toLowerCase().includes('existing')
    )?.name || PLAYBOOK_RESOURCES.segments[0]?.name || 'Existing Clients';

    const newTarget = {
      // eslint-disable-next-line react-hooks/purity
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
    
    // Blur to prevent focus restore issues
    if (document.activeElement) {
      document.activeElement.blur();
    }
    
    setIsAddModalOpen(false);
    e.target.value = '';
    
    await saveCampaignChanges(updated);
    scrollToBottom();
  };

  const handleDeleteTarget = async (targetId) => {
    if (!window.confirm("Remove this target from the outreach list?")) return;
    const updated = contacts.filter(c => c.id !== targetId);
    await saveCampaignChanges(updated);
  };

  const handleUpdateTargetStage = async (targetId, newStage) => {
    log(`[OutreachCampaignDetail] handleUpdateTargetStage triggered for target ID: ${targetId} to stage: ${newStage}`);
    const target = contacts.find(c => c.id === targetId);
    if (!target) {
      log(`[OutreachCampaignDetail] Target not found for ID: ${targetId}`);
      return;
    }

    if (newStage === '4. Appt Booked') {
      log("[OutreachCampaignDetail] Redirecting to Port flow...");
      handlePortToCRM(target);
      return;
    }

    const updated = contacts.map(c => {
      if (c.id !== targetId) return c;
      return { ...c, stage: newStage, updatedAt: new Date().toISOString() };
    });
    await saveCampaignChanges(updated);
    log(`[OutreachCampaignDetail] handleUpdateTargetStage completed for ${target.fullName}`);
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
      /* eslint-disable-next-line react-hooks/purity */
      expectedCloseDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      notes: target.notes || ''
    });
    setIsPortModalOpen(true);
  };

  const handlePortSubmit = async (e) => {
    e.preventDefault();
    if (!portTarget) {
      log("[OutreachCampaignDetail] handlePortSubmit called without portTarget!");
      return;
    }

    log(`[OutreachCampaignDetail] handlePortSubmit started for: ${portTarget.fullName}, stage: ${portForm.stage}`);
    setIsPorting(true);
    try {
      let clientId = portTarget.portedClientId;

      // 1. Port client if not already ported
      if (!clientId) {
        log("[OutreachCampaignDetail] porting target to new Client Profile...");
        const existingClient = clients.find(
          c => (c.fullName || '').toLowerCase().trim() === (portTarget.fullName || '').toLowerCase().trim()
        );

        if (existingClient) {
          clientId = existingClient.id;
          log(`[OutreachCampaignDetail] Linked to existing client ID: ${clientId}`);
        } else if (window.electronAPI?.addClient) {
          log("[OutreachCampaignDetail] Calling electronAPI.addClient...");
          /* eslint-disable-next-line react-hooks/purity */
          const startAdd = performance.now();
          const clientRes = await window.electronAPI.addClient({
            fullName: portTarget.fullName,
            preferredName: portTarget.fullName.split(' ')[0],
            phone: portTarget.phone,
            email: portTarget.email,
            clientStatus: 'Prospect',
            notes: `[Ported via ${campaign.title || 'Outreach'} on ${new Date().toLocaleDateString()}] Campaign Segment: ${portTarget.segment}. Notes: ${portTarget.notes || 'None'}`
          });
          /* eslint-disable-next-line react-hooks/purity */
          log(`[OutreachCampaignDetail] addClient took: ${(performance.now() - startAdd).toFixed(2)} ms, success: ${clientRes.success}`);

          if (clientRes.success) {
            clientId = clientRes.id;
          } else {
            showNotification("Failed to create Client Profile: " + clientRes.error, "error");
            setIsPorting(false);
            return;
          }
        }
      }

      // 2. Create Pipeline Case if stage is Appt Booked and checked
      if (portForm.stage === '4. Appt Booked' && portForm.createCase && clientId && window.electronAPI?.addPipelineCase) {
        log("[OutreachCampaignDetail] Creating pipeline case...");
        /* eslint-disable-next-line react-hooks/purity */
        const startCase = performance.now();
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
        /* eslint-disable-next-line react-hooks/purity */
        log(`[OutreachCampaignDetail] addPipelineCase took: ${(performance.now() - startCase).toFixed(2)} ms, success: ${caseRes.success}`);

        if (!caseRes.success) {
          showNotification("Failed to create pipeline case: " + caseRes.error, "error");
        }
      }

      // 3. Update target in campaign list
      log("[OutreachCampaignDetail] Updating target list locally...");
      const updated = contacts.map(c => {
        if (c.id !== portTarget.id) return c;
        return {
          ...c,
          portedClientId: clientId || c.portedClientId,
          stage: portForm.stage,
          updatedAt: new Date().toISOString()
        };
      });

      log("[OutreachCampaignDetail] Saving campaign changes and loading data...");
      await saveCampaignChanges(updated);
      await loadData();
      log("[OutreachCampaignDetail] Closing modals and resetting port targets...");
      setIsPortModalOpen(false);
      setPortTarget(null);
      log(`[OutreachCampaignDetail] Showing success alert for: ${portTarget.fullName}`);
      setJustPortedTargetId(portTarget.id);
      setTimeout(() => {
        setJustPortedTargetId(null);
      }, 5000);
    } catch (err) {
      log(`[OutreachCampaignDetail] Error in handlePortSubmit: ${err.message}`);
    }
    setIsPorting(false);
    log("[OutreachCampaignDetail] handlePortSubmit finished");
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
    const nameMatch = (c.fullName || '').toLowerCase().includes(search.toLowerCase()) || 
                      (c.phone && c.phone.includes(search)) ||
                      (c.email && (c.email || '').toLowerCase().includes(search.toLowerCase()));
    
    const segmentMatch = filterSegment === 'All' || c.segment === filterSegment;
    const stageMatch = filterStage === 'All' || c.stage === filterStage;
    
    return nameMatch && segmentMatch && stageMatch;
  });

  // Clients not in current campaign list
  const availableClientsToImport = clients.filter(c => {
    const cName = (c.fullName || '').toLowerCase().trim();
    if (!cName) return false;
    return !contacts.some(t => {
      const tName = (t.fullName || '').toLowerCase().trim();
      return (tName === cName) || (t.portedClientId && t.portedClientId === c.id);
    });
  });

  return (
    <div className="view-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'auto', minHeight: '100%' }}>
      
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
            className="btn btn-secondary" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '12.5px', 
              color: '#ef4444', 
              borderColor: 'rgba(239,68,68,0.2)',
              backgroundColor: 'rgba(239,68,68,0.05)'
            }}
            onClick={handleDeleteCampaign}
          >
            <Trash2 size={15} /> Delete Campaign
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '12.5px'
            }}
            onClick={() => {
              setEditFields({
                title: campaign.title || '',
                productName: campaign.productName || '',
                targetAudience: campaign.targetAudience || '',
                targetAppointments: campaign.targetAppointments || 20,
                targetDate: campaign.targetDate || '',
                leader: campaign.leader || '',
                members: campaign.members || 1,
                description: campaign.description || ''
              });
              setShowEditModal(true);
            }}
          >
            <Edit2 size={15} /> Edit Campaign
          </button>
          <button 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
            onClick={(e) => {
              e.currentTarget.blur();
              setIsAddModalOpen(true);
            }}
          >
            <Plus size={15} /> Add Target <span style={{ fontSize: '10px', opacity: 0.6, marginLeft: '4px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '1px 5px', borderRadius: '3px' }}>Alt+A</span>
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
                    const isJustProcessed = contact.id === justPortedTargetId;
                    const color = STAGE_COLORS[contact.stage] || { bg: 'rgba(255,255,255,0.05)', text: '#fff' };
                    return (
                      <tr 
                        key={contact.id} 
                        style={{ 
                          borderBottom: '1px solid var(--border-light)', 
                          transition: 'background-color 0.5s ease',
                          backgroundColor: isJustProcessed ? 'rgba(16, 185, 129, 0.12)' : 'transparent'
                        }}
                        onMouseEnter={e => {
                          if (!isJustProcessed) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)';
                        }}
                        onMouseLeave={e => {
                          if (!isJustProcessed) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        
                        {/* Name & Contact */}
                        <td style={{ padding: '12px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{contact.fullName}</span>
                            {isJustProcessed && (
                              <span 
                                className="animate-fade-in"
                                style={{ 
                                  fontSize: '10px', 
                                  fontWeight: '600', 
                                  color: '#10b981', 
                                  backgroundColor: 'rgba(16, 185, 129, 0.15)', 
                                  padding: '1px 6px', 
                                  borderRadius: '10px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                              >
                                ✓ Successfully Processed!
                              </span>
                            )}
                          </div>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '6px', alignItems: 'start' }}>
              {PLAYBOOK_RESOURCES.scripts.map((script, idx) => (
                <div key={idx} style={{ border: '1px solid var(--border-light)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'rgba(255,255,255,0.01)', minWidth: 0 }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '12px', color: 'var(--text-primary)' }}>{script.title}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{script.goal}</div>
                  </div>
                  <div style={{ 
                    backgroundColor: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', 
                    fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: '1.4',
                    fontFamily: 'monospace', maxHeight: '160px', overflowY: 'auto'
                  }}>
                    {script.template('[Client Name]')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--accent-secondary)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      ⏰ {script.timeHint}
                    </div>
                    <button
                      type="button"
                      style={{
                        background: activeChats[idx] ? 'var(--accent-primary)' : 'rgba(139, 92, 246, 0.1)',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        color: activeChats[idx] ? '#ffffff' : 'var(--text-primary)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all var(--transition-fast)'
                      }}
                      onClick={() => {
                        setActiveChats(prev => {
                          const updated = { ...prev, [idx]: !prev[idx] };
                          if (updated[idx]) scrollChatToBottom(idx);
                          return updated;
                        });
                      }}
                    >
                      <Sparkles size={11} style={{ color: activeChats[idx] ? '#ffffff' : 'var(--accent-primary)' }} />
                      {activeChats[idx] ? 'Close AI' : 'Tweak with AI'}
                    </button>
                  </div>

                  {activeChats[idx] && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '8px' }}>
                      <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Sparkles size={10} style={{ color: 'var(--accent-primary)' }} /> AI WRITING ASSISTANT
                      </div>
                      
                      {/* Chat Messages */}
                      <div 
                        id={`chat-container-${idx}`}
                        style={{
                          maxHeight: '180px',
                          overflowY: 'auto',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          padding: '6px',
                          backgroundColor: 'rgba(0,0,0,0.25)',
                          borderRadius: '6px',
                          border: '1px solid var(--border-light)'
                        }}
                      >
                        {(chatHistories[idx] || []).map((msg, mIdx) => (
                          <div 
                            key={mIdx} 
                            style={{
                              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                              maxWidth: '90%',
                              backgroundColor: msg.role === 'user' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(139, 92, 246, 0.12)',
                              border: msg.role === 'user' ? '1px solid rgba(6, 182, 212, 0.25)' : '1px solid rgba(139, 92, 246, 0.2)',
                              borderRadius: '8px',
                              padding: '6px 10px',
                              fontSize: '10.5px',
                              lineHeight: '1.4'
                            }}
                          >
                            <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                              {msg.text}
                            </div>
                            
                            {/* Proposed Script Preview & Apply Button */}
                            {msg.proposedScript && (
                              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{
                                  backgroundColor: 'rgba(15,23,42,0.95)',
                                  padding: '8px',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontFamily: 'monospace',
                                  whiteSpace: 'pre-wrap',
                                  border: '1px solid var(--border-light)',
                                  color: 'var(--text-secondary)',
                                  maxHeight: '100px',
                                  overflowY: 'auto'
                                }}>
                                  {msg.proposedScript}
                                </div>
                                <button
                                  type="button"
                                  className="btn"
                                  style={{ 
                                    padding: '4px 8px', 
                                    fontSize: '10px', 
                                    alignSelf: 'flex-start',
                                    backgroundColor: 'var(--accent-success)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  onClick={() => handleSaveModifiedScript(idx, msg.proposedScript)}
                                >
                                  <CheckCircle size={10} /> Apply & Save
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {isTweaking[idx] && (
                          <div style={{
                            alignSelf: 'flex-start',
                            backgroundColor: 'rgba(139, 92, 246, 0.08)',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            fontSize: '10.5px',
                            color: 'var(--text-muted)',
                            fontStyle: 'italic'
                          }}>
                            Gemini is tweaking script...
                          </div>
                        )}
                      </div>

                      {/* Quick Instruction Tags */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {['Make it shorter', 'More professional', 'Softer hook', 'Add health cashback details', 'Translate to Mandarin'].map(tag => (
                          <button
                            key={tag}
                            type="button"
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid var(--border-light)',
                              color: 'var(--text-secondary)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '9.5px',
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                            onClick={() => {
                              setChatInputs(prev => ({ ...prev, [idx]: tag }));
                            }}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>

                      {/* Chat Input */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          value={chatInputs[idx] || ''}
                          placeholder="Type changes (e.g. make it warm)..."
                          style={{
                            flex: 1,
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid var(--border-light)',
                            borderRadius: '4px',
                            color: 'var(--text-primary)',
                            padding: '4px 8px',
                            fontSize: '11px',
                            outline: 'none'
                          }}
                          onChange={e => {
                            setChatInputs(prev => ({ ...prev, [idx]: e.target.value }));
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              handleTweakScriptWithAI(idx);
                            }
                          }}
                        />
                        <button
                          type="button"
                          disabled={isTweaking[idx] || !(chatInputs[idx] || '').trim()}
                          style={{
                            background: 'var(--accent-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 10px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: (isTweaking[idx] || !(chatInputs[idx] || '').trim()) ? 0.5 : 1
                          }}
                          onClick={() => handleTweakScriptWithAI(idx)}
                        >
                          <Send size={11} />
                        </button>
                      </div>
                    </div>
                  )}
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
      {isScriptModalOpen && scriptModalData && createPortal(
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
        </div>,
        document.body
      )}

      {/* ADD TARGET MODAL */}
      {isAddModalOpen && createPortal(
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
                  autoFocus
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
        </div>,
        document.body
      )}

      {/* PORT & CONVERT TARGET MODAL */}
      {isPortModalOpen && portTarget && createPortal(
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
                <button type="submit" className="btn btn-primary" disabled={isPorting}>
                  {isPorting ? 'Processing...' : 'Confirm Port & Convert'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Campaign Modal */}
      {showEditModal && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15,23,42,0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }} onClick={() => setShowEditModal(false)}>
          <div 
            className="glass-panel animate-fade-in" 
            style={{
              width: '100%',
              maxWidth: '540px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '4px', color: 'var(--text-primary)' }}>Edit Campaign Details</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Update metadata for this outreach campaign</p>
            </div>

            <form onSubmit={handleEditCampaignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div className="input-group">
                <label className="input-label">Campaign Name *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editFields.title} 
                  onChange={e => setEditFields({...editFields, title: e.target.value})}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Product Focus *</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    list="productFocusSuggestions"
                    autoComplete="off"
                    value={editFields.productName} 
                    onChange={e => setEditFields({...editFields, productName: e.target.value})}
                    required
                  />
                  <datalist id="productFocusSuggestions">
                    <option value="AIA Protect 3" />
                    <option value="Generic CI Booster" />
                    <option value="Savings / Endowments" />
                  </datalist>
                </div>
                <div className="input-group">
                  <label className="input-label">Primary Audience Focus *</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    list="audienceSuggestions"
                    autoComplete="off"
                    value={editFields.targetAudience} 
                    onChange={e => setEditFields({...editFields, targetAudience: e.target.value})}
                    required
                  />
                  <datalist id="audienceSuggestions">
                    <option value="Young Working Adults & Families" />
                    <option value="HNW Legacy Clients" />
                    <option value="Young Parents (25-40)" />
                    <option value="Working Professionals" />
                  </datalist>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Target Booking Count *</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    min="1"
                    value={editFields.targetAppointments} 
                    onChange={e => setEditFields({...editFields, targetAppointments: e.target.value})}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Target Date</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={editFields.targetDate} 
                    onChange={e => setEditFields({...editFields, targetDate: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Campaign Leader *</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={editFields.leader} 
                    onChange={e => setEditFields({...editFields, leader: e.target.value})}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Active Members *</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    min="1"
                    value={editFields.members} 
                    onChange={e => setEditFields({...editFields, members: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea 
                  className="input-field" 
                  style={{ minHeight: '60px', fontFamily: 'inherit', resize: 'vertical' }}
                  value={editFields.description} 
                  onChange={e => setEditFields({...editFields, description: e.target.value})}
                />
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Toast Notification */}
      {notification && (
        <div 
          className="animate-slide-in-right"
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            background: notification.type === 'error' ? 'rgba(239, 68, 68, 0.25)' : notification.type === 'success' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(30, 41, 59, 0.85)',
            backdropFilter: 'blur(12px)',
            border: notification.type === 'error' ? '1px solid rgba(239, 68, 68, 0.4)' : notification.type === 'success' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-light)',
            borderRadius: '12px',
            padding: '14px 20px',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '280px',
            maxWidth: '420px',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: notification.type === 'error' ? '#ef4444' : notification.type === 'success' ? '#10b981' : '#3b82f6',
            flexShrink: 0
          }} />
          <div style={{ flex: 1, fontSize: '13px', fontWeight: '500', lineHeight: '1.4' }}>
            {notification.message}
          </div>
          <button 
            type="button"
            onClick={() => setNotification(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '0 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>
      )}

    </div>
  );
}
