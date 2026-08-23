import { useState, useEffect } from 'react';
import { Briefcase, FolderGit2, CheckCircle2, Circle, Plus, Trash2, Edit2, Users, Calendar, BarChart3, Play, UploadCloud, FileText, Sparkles, AlertCircle, X, Bookmark, Zap, ArrowRight } from 'lucide-react';
import Project100Detail from './Project100Detail';
import OutreachCampaignDetail from './OutreachCampaignDetail';
import DatePicker from '../components/DatePicker';

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

// Pre-built Advisory Campaign Playbook Templates
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
    targetAudience: 'Middle-to-High Earners ($80k+)',
    description: 'Help clients legally reduce personal income tax by up to S$15,300/yr while building guaranteed retirement income.',
    productSummary: 'Supplementary Retirement Scheme (SRS) tax deduction strategy combined with guaranteed single/regular premium annuity plans.'
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
    id: 'tpl-hnw-legacy',
    title: 'HNW Legacy Planning & IUL Campaign',
    category: 'Wealth & Legacy',
    productName: 'Indexed Universal Life (IUL)',
    targetAudience: 'Business Owners & HNW Executives',
    description: 'Multi-generational wealth preservation, estate liquidity, and market upside participation with downside protection.',
    productSummary: 'Indexed Universal Life structure allowing S&P 500 growth linkage, 0% floor protection, and high-value legacy payouts.'
  },
  {
    id: 'tpl-shield-upgrade',
    title: 'Shield Healthcare & Rider Upgrade',
    category: 'Healthcare',
    productName: 'AIA HealthShield Gold Max + Rider',
    targetAudience: 'Existing Clients with Outdated Shield Plans',
    description: 'Review existing hospital coverage to protect against medical inflation and cap out-of-pocket co-payments.',
    productSummary: 'Private hospital shield plan with rider covering 95% of hospital bills and annual deductible capping.'
  }
];

export default function SpecialProjectsView() {
  const [activeProject, setActiveProject] = useState(null);
  const [project100Contacts, setProject100Contacts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('initiatives'); // 'initiatives' | 'templates'

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
        description: 'The foundation for new financial consultants. List 100 prospects from memory or phone contacts, evaluate their potential, and convert them to active CRM clients.',
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

  useEffect(() => {
    loadProject100Contacts();
    load();
  }, []);

  const [isGenerating, setIsGenerating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    leader: '',
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);

  const handleFileSelect = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64Data = dataUrl.split(',')[1];
      setUploadedFile({
        base64: base64Data,
        mimeType: file.type,
        name: file.name,
        size: file.size
      });
      setAnalysisError('');
      setAnalysisSuccess(false);
    };
    reader.onerror = () => {
      setAnalysisError('Failed to read file.');
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeWithAI = async () => {
    if (!newProject.productSummary.trim() && !uploadedFile) return;

    setIsAnalyzing(true);
    setAnalysisError('');
    setAnalysisSuccess(false);

    try {
      const payload = {
        text: newProject.productSummary,
        fileData: uploadedFile ? {
          base64: uploadedFile.base64,
          mimeType: uploadedFile.mimeType
        } : null
      };

      const res = await window.electronAPI.generateOutreachPlaybook(payload);
      if (res.success) {
        const playbook = res.data;
        setGeneratedPlaybook(playbook);

        const resolvedProduct = playbook.productFocus || newProject.productFocus || 'AIA Protect 3';
        const resolvedAudience = playbook.targetAudience || newProject.targetAudience || 'Young Working Adults & Families';

        setNewProject(prev => ({
          ...prev,
          productFocus: resolvedProduct,
          targetAudience: resolvedAudience,
          title: prev.title.trim() || `${resolvedProduct} Outreach`,
          description: prev.description.trim() || `WhatsApp campaign for ${resolvedProduct} targeting ${resolvedAudience}.`
        }));

        setAnalysisSuccess(true);
      } else {
        setAnalysisError("AI Analysis failed: " + res.error);
      }
    } catch (err) {
      console.error("AI Analysis error:", err);
      setAnalysisError("An unexpected error occurred during AI analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUseTemplate = (template) => {
    setNewProject({
      title: `${template.productName} Outreach`,
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

  const toggleMilestone = async (projectId, milestoneId) => {
    if (projectId === 'project-100') return;
    const project = projects.find(p => p.id === projectId);
    if (!project || project.type === 'outreach') return;
    
    const updatedMilestones = project.milestones.map(m => 
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    
    if (window.electronAPI && window.electronAPI.updateInitiative) {
      const res = await window.electronAPI.updateInitiative({
        id: projectId,
        milestones: updatedMilestones
      });
      if (res.success) {
        load();
      }
    }
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

      const title = newProject.title.trim() || `${resolvedProduct} Outreach`;
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

  if (activeProject) {
    if (activeProject.id === 'project-100' || activeProject === 'project-100') {
      return <Project100Detail onBack={() => { setActiveProject(null); loadProject100Contacts(); }} />;
    } else if (activeProject.type === 'outreach') {
      return <OutreachCampaignDetail campaign={activeProject} onBack={() => { setActiveProject(null); load(); }} />;
    }
  }

  return (
    <div className="view-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '24px', marginBottom: '2px' }}>Special Projects & Campaigns</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Manage agency initiatives, client outreach playbooks, and strategic campaigns.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
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
            <Bookmark size={14} /> Template Library ({CAMPAIGN_TEMPLATES.length})
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> New Campaign
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {activeTab === 'initiatives' ? (
        <>
          {/* Metrics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{ ...cardStyle, padding: '16px 20px', flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(139,92,246,0.12)', color: 'var(--accent-primary)' }}>
                <Briefcase size={20} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Projects</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{projects.length} Initiatives</div>
              </div>
            </div>

            <div style={{ ...cardStyle, padding: '16px 20px', flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(6,182,212,0.12)', color: 'var(--accent-secondary)' }}>
                <BarChart3 size={20} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Average Progress</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {Math.round(projects.reduce((sum, p) => sum + getProgress(p), 0) / (projects.length || 1))}% Completion
                </div>
              </div>
            </div>

            <div style={{ ...cardStyle, padding: '16px 20px', flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(16,185,129,0.12)', color: 'var(--accent-success)' }}>
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Completed Campaigns</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {projects.filter(p => p.status === 'Completed').length} Done
                </div>
              </div>
            </div>
          </div>

          {/* Grid of Projects */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
            {projects.map(project => {
              const progress = getProgress(project);
              return (
                <div key={project.id} className="glass-panel card" style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {project.title}
                      </h3>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Leader: <span style={{ color: 'var(--text-secondary)' }}>{project.leader}</span>
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
                      <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: '3px' }} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
                    <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setActiveProject(project)}>
                      <Play size={13} /> Open Workspace
                    </button>
                    {project.id !== 'project-100' && (
                      <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => handleDeleteProject(project.id)}>
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
              <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>Financial Advisory Campaign Playbook Library</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Launch pre-built strategy templates equipped with value hooks, brochure messaging, and appointment scripts.
              </div>
            </div>
            <Sparkles size={20} color="#60a5fa" />
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

      {/* Add Project Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '550px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '24px', color: 'var(--text-primary)' }}>Create New Campaign / Initiative</h2>
            
            <form onSubmit={handleFormSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Campaign Title *</label>
                <input required type="text" className="input-field" style={{ width: '100%' }} value={newProject.title} onChange={e => setNewProject({ ...newProject, title: e.target.value })} placeholder="e.g. AIA Protect 3 Q3 Campaign" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Product Focus</label>
                  <input type="text" className="input-field" style={{ width: '100%' }} value={newProject.productFocus} onChange={e => setNewProject({ ...newProject, productFocus: e.target.value })} />
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Target Audience</label>
                  <input type="text" className="input-field" style={{ width: '100%' }} value={newProject.targetAudience} onChange={e => setNewProject({ ...newProject, targetAudience: e.target.value })} />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Description / Strategy</label>
                <textarea className="input-field" style={{ width: '100%', minHeight: '80px' }} value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} placeholder="Describe campaign goal and value proposition..." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Target Appointments Goal</label>
                  <input type="number" className="input-field" style={{ width: '100%' }} value={newProject.targetAppointments} onChange={e => setNewProject({ ...newProject, targetAppointments: e.target.value })} />
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Target Completion Date</label>
                  <DatePicker 
                    value={newProject.targetDate} 
                    onChange={e => setNewProject({ ...newProject, targetDate: e.target.value })} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }} onClick={handleCloseAddModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isGenerating}>
                  {isGenerating ? 'Generating Playbook...' : 'Launch Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
