import { useState, useEffect, useRef } from 'react';
import { 
  Briefcase, CheckCircle2, Plus, Trash2, Edit2, Users, Calendar, 
  BarChart3, Play, UploadCloud, FileText, Sparkles, AlertCircle, 
  X, Bookmark, Zap, ArrowRight, DollarSign, Award, Target, HelpCircle, Check
} from 'lucide-react';
import Project100Detail from './Project100Detail';
import OutreachCampaignDetail from './OutreachCampaignDetail';
import DatePicker from '../components/DatePicker';
import { useAdvisorContext } from '../context/AdvisorContext';

const cardStyle = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-light)',
  borderRadius: '14px',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  transition: 'border-color var(--transition-normal), transform var(--transition-normal), box-shadow var(--transition-normal)',
  position: 'relative',
  overflow: 'hidden',
};

// Pre-built Singapore Advisory Campaign Playbook Templates
const CAMPAIGN_TEMPLATES = [
  {
    id: 'tpl-ci-protect',
    title: 'AIA Protect 3 / Major CI Protection Gap',
    category: 'Protection',
    productName: 'AIA Protect 3',
    targetAudience: 'Young Working Adults & Families',
    description: 'Target working Singaporeans facing a 74% CI protection gap with budget-friendly coverage & Health Cashback feature.',
    productSummary: 'AIA Protect 3 focuses on Cancer, Heart Attack, and Stroke with 25% Health Cashback at age 65 and 15% extra payout for gender-specific cancers.'
  },
  {
    id: 'tpl-srs-tax',
    title: 'SRS & Year-End Tax Relief Top-Up',
    category: 'Tax & Retirement',
    productName: 'SRS Retirement Annuity',
    targetAudience: 'Middle-to-High Earners ($80k+/yr)',
    description: 'Help clients legally reduce personal income tax by up to S$15,300/yr while building guaranteed retirement income.',
    productSummary: 'Supplementary Retirement Scheme (SRS) tax deduction strategy combined with guaranteed single/regular premium annuity plans.'
  },
  {
    id: 'tpl-cpf-sa-closure',
    title: 'CPF SA Closure & Age 55 Restructuring',
    category: 'Retirement & CPF',
    productName: 'CPF LIFE & Private Annuity Strategy',
    targetAudience: 'Pre-Retirees & Working Adults Aged 45-65',
    description: 'Guide clients through the 2025 CPF SA closure rules, SA-to-RA transfer options, and private annuity yield optimization.',
    productSummary: 'Singapore CPF restructuring playbook helping clients maximize retirement sums (BRS/FRS/ERS) and bridge post-55 liquidity gaps.'
  },
  {
    id: 'tpl-child-edu',
    title: 'Child Education & Protection Campaign',
    category: 'Education Savings',
    productName: 'AIA Smart Growth / Smart Junior',
    targetAudience: 'Parents with Young Children (Ages 0-10)',
    description: 'Secure future university tuition funds and total medical protection for growing children.',
    productSummary: 'Guaranteed endowment savings paired with premium waiver on parent total disability or death, ensuring education funds are safe.'
  },
  {
    id: 'tpl-shield-upgrade',
    title: 'MediShield Life & Private Shield Upgrade',
    category: 'Healthcare',
    productName: 'AIA HealthShield Gold Max + Rider',
    targetAudience: 'Existing Clients with Outdated Hospital Plans',
    description: 'Review hospital coverage against MOH revised claim limits, co-insurance caps, and claim-based pricing riders.',
    productSummary: 'Private hospital shield plan with rider covering 95% of hospital bills and annual deductible capping.'
  },
  {
    id: 'tpl-hnw-legacy',
    title: 'HNW Legacy Planning & Indexed Universal Life',
    category: 'Wealth & Legacy',
    productName: 'Indexed Universal Life (IUL)',
    targetAudience: 'Business Owners & HNW Executives',
    description: 'Multi-generational wealth preservation, estate liquidity, and market upside participation with downside protection.',
    productSummary: 'Indexed Universal Life structure allowing S&P 500 growth linkage, 0% floor protection, and high-value legacy payouts.'
  },
  {
    id: 'tpl-early-ci-kickstart',
    title: 'Early CI Kickstarter for Young Professionals',
    category: 'Protection',
    productName: 'Multi-Pay Early Critical Illness',
    targetAudience: 'Young Graduates & First-Jobbers (Ages 23-32)',
    description: 'Low-cost multi-pay Early CI protection locking in clean health underwriting and low age-based premiums.',
    productSummary: 'Covers 150+ early, intermediate, and major CI conditions with multiple claim resets, tailored for fresh graduates.'
  },
  {
    id: 'tpl-pet-insurance',
    title: 'PetCare & Veterinary Protection Campaign',
    category: 'Pet Healthcare',
    productName: 'AIA / MSIG Happy Tails & PetCare',
    targetAudience: 'Dog & Cat Owners, Purebred Pet Parents',
    description: 'Target pet parents with veterinary surgical inflation angles, third-party liability, and emergency clinical reimbursement.',
    productSummary: 'Comprehensive pet healthcare covering up to 80% of accidental/surgical vet bills, cancer chemotherapy, and S$500k third-party bite liability.'
  },
  {
    id: 'tpl-disability-income',
    title: 'CareShield Life & Disability Income Booster',
    category: 'Income Protection',
    productName: 'CareShield Life Supplement & Disability Income',
    targetAudience: 'Working Adults & Family Breadwinners',
    description: 'Upgrade basic S$600/mo CareShield Life to up to S$5,000/mo payout for inability to perform core occupation.',
    productSummary: 'Disability income replacement protecting 75% of monthly salary against severe illness or long-term disability.'
  }
];

export default function SpecialProjectsView({ onSelectClient, onNavigateTab }) {
  const [activeProject, setActiveProject] = useState(null);
  const [project100Contacts, setProject100Contacts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('initiatives'); // 'initiatives' | 'templates'

  const fileInputRef = useRef(null);

  const loadProject100Contacts = async () => {
    if (window.electronAPI && window.electronAPI.getProject100Contacts) {
      const res = await window.electronAPI.getProject100Contacts();
      if (res.success) {
        setProject100Contacts(res.data);
      }
    }
  };

  const load = async () => {
    try {
      let dbInitiatives = [];
      if (window.electronAPI && window.electronAPI.getInitiatives) {
        const res = await window.electronAPI.getInitiatives();
        if (res.success) {
          dbInitiatives = res.data;
        }
      }
      
      const project100 = {
        id: 'project-100',
        title: 'Project 100',
        description: 'The foundation for financial consultants. List 100 prospects from memory or phone contacts, evaluate their potential with N.A.S.T. scoring, and convert them to active CRM clients.',
        leader: 'Pieter Beetsma',
        status: 'In Progress',
        targetDate: '2026-08-31',
        members: 1,
        type: 'project-100',
        milestones: [
          { id: 'p100-m1', label: 'Build target list of 100 prospects', completed: false },
          { id: 'p100-m2', label: 'Evaluate & score prospects by need, accessibility, income, and trust', completed: false },
          { id: 'p100-m3', label: 'Initiate contact and secure first 10 meetings', completed: false },
          { id: 'p100-m4', label: 'Convert opportunities to active CRM clients', completed: false }
        ]
      };

      setProjects([project100, ...dbInitiatives]);
    } catch (err) {
      console.error("Failed to load initiatives:", err);
    }
  };

  const { setAdvisorContext, registerActionHandler } = useAdvisorContext();

  useEffect(() => {
    loadProject100Contacts();
    load();
  }, []);

  // Sync with Archie 2.0
  useEffect(() => {
    if (!activeProject) {
      setAdvisorContext({
        section: 'special-projects',
        subSection: activeTab === 'templates' ? 'template-library' : 'initiatives',
        activeSubTab: null,
        entityContext: { projectsCount: projects.length }
      });
    }
  }, [activeProject, activeTab, projects.length, setAdvisorContext]);

  // Register Archie Action Handlers
  useEffect(() => {
    const unregP100 = registerActionHandler('openProject100', () => {
      setActiveProject('project-100');
    });
    return () => unregP100();
  }, [registerActionHandler]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    leader: 'Pieter Beetsma',
    status: 'Planning',
    targetDate: '',
    members: 1,
    type: 'outreach', // 'outreach' | 'custom'
    productFocus: 'AIA Protect 3',
    targetAudience: 'Young Working Adults & Families',
    targetAppointments: '20',
    productSummary: '',
    milestones: ['', '']
  });

  const [uploadedFile, setUploadedFile] = useState(null);
  const [generatedPlaybook, setGeneratedPlaybook] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [analysisSuccess, setAnalysisSuccess] = useState(false);

  const triggerAiScan = async (fileObj = uploadedFile, summaryText = newProject.productSummary) => {
    if (!summaryText.trim() && !fileObj) {
      setAnalysisError('Please enter product details or attach a product brochure PDF/image first.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError('');
    setAnalysisSuccess(false);

    try {
      const payload = {
        text: summaryText || newProject.description || newProject.productFocus,
        fileData: fileObj ? {
          base64: fileObj.base64,
          mimeType: fileObj.mimeType
        } : null
      };

      const res = await window.electronAPI.generateOutreachPlaybook(payload);
      if (res.success && res.data) {
        const playbook = res.data;
        setGeneratedPlaybook(playbook);

        const resolvedProduct = playbook.productFocus || newProject.productFocus || 'Strategic Advisory Plan';
        const resolvedAudience = playbook.targetAudience || newProject.targetAudience || 'Target Singapore Demographic';

        setNewProject(prev => ({
          ...prev,
          productFocus: resolvedProduct,
          targetAudience: resolvedAudience,
          title: prev.title.trim() && prev.title !== 'Strategic Advisory Plan Campaign' ? prev.title : `${resolvedProduct} Campaign`,
          description: playbook.usp || prev.description || `Outreach campaign for ${resolvedProduct} targeting ${resolvedAudience}.`
        }));

        setAnalysisSuccess(true);
      } else {
        setAnalysisError("AI Analysis failed: " + (res.error || 'Unknown error. Please check Gemini API key or file format.'));
      }
    } catch (err) {
      console.error("AI Analysis error:", err);
      setAnalysisError("An unexpected error occurred during AI analysis: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64Data = dataUrl.split(',')[1];
      const detectedMime = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : file.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
      
      const fileObj = {
        base64: base64Data,
        mimeType: detectedMime,
        name: file.name,
        size: file.size
      };

      setUploadedFile(fileObj);
      setAnalysisError('');
      setAnalysisSuccess(false);

      // Auto-trigger Gemini Multimodal AI Scan immediately upon upload
      triggerAiScan(fileObj, newProject.productSummary);
    };
    reader.onerror = () => {
      setAnalysisError('Failed to read file.');
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeWithAI = () => {
    triggerAiScan(uploadedFile, newProject.productSummary);
  };

  const handleUseTemplate = (template) => {
    setNewProject({
      title: `${template.productName} Campaign`,
      description: template.description,
      leader: 'Pieter Beetsma',
      status: 'Planning',
      targetDate: new Date(Date.now() + 60*24*60*60*1000).toISOString().split('T')[0],
      members: 1,
      type: 'outreach',
      productFocus: template.productName,
      targetAudience: template.targetAudience,
      targetAppointments: '20',
      productSummary: template.productSummary,
      milestones: ['', '']
    });
    setUploadedFile(null);
    setGeneratedPlaybook(null);
    setAnalysisError('');
    setAnalysisSuccess(false);
    setShowAddModal(true);
  };

  const getProjectMilestones = (project) => {
    if (project.id === 'project-100') {
      const count = project100Contacts.length;
      const ratedCount = project100Contacts.filter(c => (c.scoreNeed + c.scoreAccessibility + c.scoreIncome + c.scoreTrust) > 0).length;
      const contactedCount = project100Contacts.filter(c => c.stage !== 'Not Contacted').length;
      const portedCount = project100Contacts.filter(c => c.portedClientId || c.stage === 'Ported / Converted').length;
      
      return [
        { id: 'p100-m1', label: `Build target list of 100 prospects (${count}/100)`, completed: count >= 100 },
        { id: 'p100-m2', label: `Evaluate & score prospects (${ratedCount} rated)`, completed: count > 0 && ratedCount >= Math.min(count, 50) },
        { id: 'p100-m3', label: `Initiate contact and outreach (${contactedCount} contacted)`, completed: contactedCount >= 10 },
        { id: 'p100-m4', label: `Convert opportunities to active CRM clients (${portedCount} ported)`, completed: portedCount >= 1 }
      ];
    }

    if (project.type === 'outreach') {
      const contacts = project.contacts || [];
      const total = contacts.length;
      const step1Count = contacts.filter(c => c.stage === '2. Opener Sent' || c.stage === '3. Info Shared' || c.stage === '4. Appt Booked' || c.stage === '5. Case Closed').length;
      const step2Count = contacts.filter(c => c.stage === '3. Info Shared' || c.stage === '4. Appt Booked' || c.stage === '5. Case Closed').length;
      const bookedCount = contacts.filter(c => c.stage === '4. Appt Booked' || c.stage === '5. Case Closed').length;
      const targetAppts = project.targetAppointments || 20;

      return [
        { id: `${project.id}-m1`, label: `Identify and segment campaign targets (${total} listed)`, completed: total >= 1 },
        { id: `${project.id}-m2`, label: `Send soft openers (Step 1 WhatsApp) (${step1Count} sent)`, completed: total > 0 && step1Count >= Math.min(total, 5) },
        { id: `${project.id}-m3`, label: `Drop brochure details (Step 2 WhatsApp) (${step2Count} shared)`, completed: total > 0 && step2Count >= Math.min(total, 3) },
        { id: `${project.id}-m4`, label: `Secure appointments (${bookedCount} / ${targetAppts} booked)`, completed: bookedCount >= targetAppts }
      ];
    }

    return project.milestones || [];
  };

  const getProgress = (project) => {
    const milestones = getProjectMilestones(project);
    if (!milestones.length) return 0;
    const completedCount = milestones.filter(m => m.completed).length;
    return Math.round((completedCount / milestones.length) * 100);
  };

  const handleDeleteProject = async (id) => {
    if (document.activeElement) document.activeElement.blur();
    if (id === 'project-100') {
      alert("Project 100 is a core training module and cannot be deleted.");
      return;
    }
    if (!window.confirm("Are you sure you want to permanently delete this initiative?")) return;
    
    if (window.electronAPI && window.electronAPI.deleteInitiative) {
      const res = await window.electronAPI.deleteInitiative(id);
      if (res.success) {
        load();
      }
    }
  };

  const handleOpenAddModal = () => {
    setUploadedFile(null);
    setGeneratedPlaybook(null);
    setAnalysisError('');
    setAnalysisSuccess(false);
    setNewProject({
      title: '',
      description: '',
      leader: 'Pieter Beetsma',
      status: 'Planning',
      targetDate: new Date(Date.now() + 60*24*60*60*1000).toISOString().split('T')[0],
      members: 1,
      type: 'outreach',
      productFocus: '',
      targetAudience: '',
      targetAppointments: '20',
      productSummary: '',
      milestones: ['', '']
    });
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setUploadedFile(null);
    setGeneratedPlaybook(null);
    setAnalysisError('');
    setAnalysisSuccess(false);
    setShowAddModal(false);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    let projectToAdd;

    if (newProject.type === 'outreach') {
      const targetAppts = Number(newProject.targetAppointments) || 20;
      let playbook = generatedPlaybook;
      let resolvedProduct = newProject.productFocus || 'AIA Protect 3';
      let resolvedAudience = newProject.targetAudience || 'Young Working Adults & Families';

      if (!playbook && ((newProject.productSummary && newProject.productSummary.trim()) || uploadedFile)) {
        setIsGenerating(true);
        try {
          const payload = {
            text: newProject.productSummary,
            fileData: uploadedFile ? {
              base64: uploadedFile.base64,
              mimeType: uploadedFile.mimeType
            } : null
          };
          const aiRes = await window.electronAPI.generateOutreachPlaybook(payload);
          if (aiRes.success) {
            playbook = aiRes.data;
            if (playbook.productFocus) resolvedProduct = playbook.productFocus;
            if (playbook.targetAudience) resolvedAudience = playbook.targetAudience;
          }
        } catch (err) {
          console.error("AI Generation error:", err);
        } finally {
          setIsGenerating(false);
        }
      }

      if (playbook) {
        playbook = {
          ...playbook,
          productFocus: resolvedProduct,
          targetAudience: resolvedAudience
        };
      }

      const title = newProject.title.trim() || `${resolvedProduct} Campaign`;
      const desc = newProject.description.trim() || `WhatsApp campaign for ${resolvedProduct} targeting ${resolvedAudience}.`;

      projectToAdd = {
        title,
        description: desc,
        leader: newProject.leader || 'Pieter Beetsma',
        status: newProject.status,
        targetDate: newProject.targetDate || new Date(Date.now() + 60*24*60*60*1000).toISOString().split('T')[0],
        members: Number(newProject.members) || 1,
        type: 'outreach',
        productName: resolvedProduct,
        targetAudience: resolvedAudience,
        targetAppointments: targetAppts,
        contacts: [],
        playbook
      };
    } else {
      if (!newProject.title.trim()) return;
      const formattedMilestones = newProject.milestones
        .filter(m => m.trim().length > 0)
        .map((label, idx) => ({
          id: `custom-p-${Date.now()}-m-${idx}`,
          label,
          completed: false
        }));

      projectToAdd = {
        title: newProject.title,
        description: newProject.description,
        leader: newProject.leader || 'Pieter Beetsma',
        status: newProject.status,
        targetDate: newProject.targetDate || new Date().toISOString().split('T')[0],
        members: Number(newProject.members) || 1,
        type: 'custom',
        milestones: formattedMilestones
      };
    }

    if (window.electronAPI && window.electronAPI.addInitiative) {
      const res = await window.electronAPI.addInitiative(projectToAdd);
      if (res.success) {
        setShowAddModal(false);
        load();
        setUploadedFile(null);
        setGeneratedPlaybook(null);
        setAnalysisError('');
        setAnalysisSuccess(false);
      }
    }
  };

  // Aggregate Cross-Campaign Financial ROI Metrics
  const totalCampaignsAnp = projects
    .filter(p => p.type === 'outreach' && p.contacts)
    .reduce((sum, p) => sum + p.contacts.reduce((cSum, c) => cSum + (Number(c.anp) || 0), 0), 0);

  const totalCampaignsFyc = projects
    .filter(p => p.type === 'outreach' && p.contacts)
    .reduce((sum, p) => sum + p.contacts.reduce((cSum, c) => cSum + (Number(c.fyc) || 0), 0), 0);

  const totalApptsBooked = projects
    .filter(p => p.type === 'outreach' && p.contacts)
    .reduce((sum, p) => sum + p.contacts.filter(c => c.stage === '4. Appt Booked' || c.stage === '5. Case Closed').length, 0);

  const formatCurrency = (val) => {
    if (!val) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  if (activeProject) {
    if (activeProject.id === 'project-100' || activeProject === 'project-100') {
      return (
        <Project100Detail 
          onBack={() => { setActiveProject(null); loadProject100Contacts(); }} 
          onSelectClient={onSelectClient}
          onNavigateTab={onNavigateTab}
        />
      );
    } else if (activeProject.type === 'outreach') {
      return (
        <OutreachCampaignDetail 
          campaign={activeProject} 
          onBack={() => { setActiveProject(null); load(); }} 
          onSelectClient={onSelectClient}
          onNavigateTab={onNavigateTab}
        />
      );
    }
  }

  return (
    <div className="view-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="text-gradient" style={{ fontSize: '24px', margin: 0 }}>Special Projects & Campaigns</h1>
            <span className="glass-panel" style={{ fontSize: '11px', color: '#60a5fa', padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.2)' }}>
              Outreach Command Center
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
            Manage agency initiatives, client outreach playbooks, and strategic marketing campaigns.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            className={`btn ${activeTab === 'initiatives' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '13px', padding: '8px 14px' }}
            onClick={() => setActiveTab('initiatives')}
          >
            Active Projects ({projects.length})
          </button>
          <button 
            className={`btn ${activeTab === 'templates' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '13px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setActiveTab('templates')}
          >
            <Bookmark size={14} /> Playbook Library ({CAMPAIGN_TEMPLATES.length})
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> New Campaign
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {activeTab === 'initiatives' ? (
        <>
          {/* Aggregate Financial Metrics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            
            {/* Metric 1: Total Initiatives */}
            <div style={{ ...cardStyle, padding: '16px 20px', flexDirection: 'row', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(139,92,246,0.12)', color: 'var(--accent-primary)' }}>
                <Briefcase size={20} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Initiatives</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{projects.length} Total</div>
              </div>
            </div>

            {/* Metric 2: Total Campaign ANP */}
            <div style={{ ...cardStyle, padding: '16px 20px', flexDirection: 'row', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(16,185,129,0.12)', color: '#34d399' }}>
                <DollarSign size={20} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Campaign ANP</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#34d399' }}>{formatCurrency(totalCampaignsAnp)}</div>
              </div>
            </div>

            {/* Metric 3: Total Campaign FYC */}
            <div style={{ ...cardStyle, padding: '16px 20px', flexDirection: 'row', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(234,179,8,0.12)', color: '#fbbf24' }}>
                <Award size={20} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Campaign FYC</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#fbbf24' }}>{formatCurrency(totalCampaignsFyc)}</div>
              </div>
            </div>

            {/* Metric 4: Booked Appointments */}
            <div style={{ ...cardStyle, padding: '16px 20px', flexDirection: 'row', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(6,182,212,0.12)', color: 'var(--accent-secondary)' }}>
                <Target size={20} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Appointments Secured</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{totalApptsBooked} Booked</div>
              </div>
            </div>

          </div>

          {/* Grid of Projects */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
            {projects.map(project => {
              const progress = getProgress(project);
              const isP100 = project.id === 'project-100';
              const isOutreach = project.type === 'outreach';
              const contactsCount = project.contacts ? project.contacts.length : (isP100 ? project100Contacts.length : 0);
              const campaignAnp = project.contacts ? project.contacts.reduce((sum, c) => sum + (Number(c.anp) || 0), 0) : 0;

              return (
                <div key={project.id} className="glass-panel card" style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isP100 && <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(6,182,212,0.15)', color: 'var(--accent-secondary)', fontWeight: '600' }}>CORE</span>}
                        {isOutreach && <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(59,130,246,0.15)', color: '#60a5fa', fontWeight: '600' }}>CAMPAIGN</span>}
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {project.title}
                        </h3>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Leader: <span style={{ color: 'var(--text-secondary)' }}>{project.leader}</span> • Targets: <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{contactsCount}</span>
                        {campaignAnp > 0 && <span> • ANP: <strong style={{ color: '#34d399' }}>{formatCurrency(campaignAnp)}</strong></span>}
                      </p>
                    </div>
                    
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      backgroundColor: project.status === 'Completed' ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.15)',
                      color: project.status === 'Completed' ? '#34d399' : '#a78bfa'
                    }}>
                      {project.status}
                    </span>
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0, flex: 1 }}>
                    {project.description}
                  </p>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      <span>Progress</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{progress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
                    <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setActiveProject(project)}>
                      <Play size={13} /> Open Workspace
                    </button>
                    {!isP100 && (
                      <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: 0.6 }} onClick={() => handleDeleteProject(project.id)} title="Delete initiative">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Campaign Template Library Tab */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ padding: '16px 20px', backgroundColor: 'rgba(59, 130, 246, 0.08)', borderRadius: '12px', borderLeft: '4px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>Singapore Financial Advisory Campaign Playbook Library</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Launch pre-built strategic campaigns equipped with value hooks, Singapore regulatory angles, brochure messaging, and appointment scripts.
              </div>
            </div>
            <Sparkles size={22} color="#60a5fa" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
            {CAMPAIGN_TEMPLATES.map(tpl => (
              <div key={tpl.id} className="glass-panel card" style={{ ...cardStyle, gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' }}>
                    {tpl.category}
                  </span>
                  <Zap size={16} color="var(--accent-secondary)" />
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>{tpl.title}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{tpl.description}</p>
                
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                  Target: <strong style={{ color: 'var(--text-primary)' }}>{tpl.targetAudience}</strong>
                </div>

                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: 'auto' }}
                  onClick={() => handleUseTemplate(tpl)}
                >
                  Use Playbook Template <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Project / Campaign Modal with Multimodal AI Brochure Scanner */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', margin: 0 }}>Create Strategic Campaign</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '3px' }}>
                  Set up a product outreach campaign or upload an insurer PDF brochure for AI script synthesis.
                </p>
              </div>
              <button 
                onClick={handleCloseAddModal}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Multimodal AI Brochure Scanner Box */}
            <div style={{ 
              backgroundColor: 'rgba(59, 130, 246, 0.05)', 
              border: '1px dashed rgba(59, 130, 246, 0.3)', 
              borderRadius: '10px', 
              padding: '16px', 
              marginBottom: '20px' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={15} /> AI Multimodal Brochure Scanner
                </span>
                {uploadedFile && (
                  <span style={{ fontSize: '11px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={13} /> {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(0)} KB)
                  </span>
                )}
              </div>

              <input 
                ref={fileInputRef} 
                type="file" 
                accept=".pdf,image/png,image/jpeg,image/jpg" 
                style={{ display: 'none' }} 
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud size={14} /> {uploadedFile ? 'Change Brochure (PDF/Image)' : 'Attach Product Brochure (PDF/Image)'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  style={{ fontSize: '12px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={handleAnalyzeWithAI}
                  disabled={isAnalyzing}
                >
                  <Sparkles size={14} className={isAnalyzing ? 'animate-spin' : ''} />
                  {isAnalyzing ? 'Scanning Brochure with Gemini...' : '✨ Analyze & Generate Playbook'}
                </button>
              </div>

              {isAnalyzing && (
                <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sparkles size={16} className="animate-spin" style={{ color: '#60a5fa' }} />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#60a5fa' }}>Scanning Brochure with Gemini 3.7 Flash...</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Extracting product USPs, target Singapore demographics, 3-step scripts & objections...</div>
                  </div>
                </div>
              )}

              {analysisError && (
                <div style={{ color: '#f87171', fontSize: '11.5px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={13} /> {analysisError}
                </div>
              )}

              {analysisSuccess && generatedPlaybook && (
                <div style={{ marginTop: '12px', padding: '12px 14px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#34d399', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Check size={14} /> Custom Playbook Synthesized from Upload!
                    </span>
                    <span style={{ fontSize: '10.5px', padding: '2px 6px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderRadius: '4px' }}>
                      3 Scripts & 3 Objections Ready
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    <strong>USP:</strong> {generatedPlaybook.usp || 'Tailored Singapore protection strategy.'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Form fields have been pre-filled with the extracted product details. Click <strong>Launch Campaign</strong> below to enter the workspace.
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleFormSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Campaign Title *</label>
                <input required type="text" className="input-field" style={{ width: '100%' }} value={newProject.title} onChange={e => setNewProject({ ...newProject, title: e.target.value })} placeholder="e.g. AIA Protect 3 Q3 Campaign" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Product Focus</label>
                  <input type="text" className="input-field" style={{ width: '100%' }} value={newProject.productFocus} onChange={e => setNewProject({ ...newProject, productFocus: e.target.value })} placeholder="e.g. AIA Protect 3" />
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Target Audience</label>
                  <input type="text" className="input-field" style={{ width: '100%' }} value={newProject.targetAudience} onChange={e => setNewProject({ ...newProject, targetAudience: e.target.value })} placeholder="e.g. Young Working Adults (25-38)" />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Campaign Strategy & Value Hook</label>
                <textarea className="input-field" style={{ width: '100%', minHeight: '70px' }} value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} placeholder="Describe the campaign value proposition and consultative angle..." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Target Appointments Goal</label>
                  <input type="number" className="input-field" style={{ width: '100%' }} value={newProject.targetAppointments} onChange={e => setNewProject({ ...newProject, targetAppointments: e.target.value })} />
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Target Completion Date</label>
                  <DatePicker 
                    value={newProject.targetDate} 
                    onChange={e => setNewProject({ ...newProject, targetDate: e.target.value })} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseAddModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isGenerating}>
                  {isGenerating ? 'Synthesizing Playbook...' : 'Launch Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
