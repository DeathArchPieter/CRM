import { useState, useEffect } from 'react';
import { Briefcase, FolderGit2, CheckCircle2, Circle, Plus, Trash2, Users, Calendar, BarChart3, Play } from 'lucide-react';
import Project100Detail from './Project100Detail';
import OutreachCampaignDetail from './OutreachCampaignDetail';

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

export default function SpecialProjectsView() {
  const [activeProject, setActiveProject] = useState(null);
  const [project100Contacts, setProject100Contacts] = useState([]);
  const [projects, setProjects] = useState([]);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      const step1Count = contacts.filter(c => c.stage === 'Step 1: Opener Sent' || c.stage === 'Step 2: Info Sent' || c.stage === 'Step 3: Appt Booked').length;
      const step2Count = contacts.filter(c => c.stage === 'Step 2: Info Sent' || c.stage === 'Step 3: Appt Booked').length;
      const bookedCount = contacts.filter(c => c.stage === 'Step 3: Appt Booked').length;
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
    if (projectId === 'project-100') return; // project-100 milestones are computed dynamically
    
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    if (project.type === 'outreach') return; // outreach milestones computed dynamically too
    
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

  const handleMilestoneInputChange = (index, value) => {
    const updatedMilestones = [...newProject.milestones];
    updatedMilestones[index] = value;
    setNewProject({ ...newProject, milestones: updatedMilestones });
  };

  const addMilestoneInputField = () => {
    setNewProject({ ...newProject, milestones: [...newProject.milestones, ''] });
  };

  const removeMilestoneInputField = (index) => {
    const updated = newProject.milestones.filter((_, i) => i !== index);
    setNewProject({ ...newProject, milestones: updated });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    let projectToAdd;
    if (newProject.type === 'outreach') {
      const title = newProject.title.trim() || `${newProject.productFocus} Outreach`;
      const desc = newProject.description.trim() || `WhatsApp campaign for ${newProject.productFocus} targeting ${newProject.targetAudience}.`;
      const targetAppts = Number(newProject.targetAppointments) || 20;

      let playbook = null;
      if (newProject.productSummary && newProject.productSummary.trim()) {
        setIsGenerating(true);
        try {
          const aiRes = await window.electronAPI.generateOutreachPlaybook(newProject.productSummary);
          if (aiRes.success) {
            playbook = aiRes.data;
          } else {
            alert("AI Playbook Generation failed: " + aiRes.error + "\n\nCreating campaign with default playbook instead.");
          }
        } catch (err) {
          console.error("AI Generation error:", err);
          alert("An unexpected error occurred during AI generation. Creating campaign with default playbook instead.");
        } finally {
          setIsGenerating(false);
        }
      }

      projectToAdd = {
        title,
        description: desc,
        leader: newProject.leader || 'Pieter Beetsma',
        status: newProject.status,
        targetDate: newProject.targetDate || new Date(Date.now() + 60*24*60*60*1000).toISOString().split('T')[0], // 60 days
        members: Number(newProject.members) || 1,
        type: 'outreach',
        productName: newProject.productFocus,
        targetAudience: newProject.targetAudience,
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
        setNewProject({
          title: '',
          description: '',
          leader: '',
          status: 'Planning',
          targetDate: '',
          members: 1,
          type: 'outreach',
          productFocus: 'AIA Protect 3',
          targetAudience: 'Young Working Adults & Families',
          targetAppointments: '20',
          productSummary: '',
          milestones: ['', '']
        });
      } else {
        alert("Failed to save initiative: " + res.error);
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
          <h1 className="text-gradient" style={{ fontSize: '22px', marginBottom: '2px' }}>Special Projects</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
            Initiative tracking and strategic practice campaigns
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Add Initiative
        </button>
      </header>

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
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Tasks Completion</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {Math.round(projects.reduce((sum, p) => sum + getProgress(p), 0) / (projects.length || 1))}% Average
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
        {projects.length === 0 ? (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <FolderGit2 size={36} color="var(--text-muted)" style={{ opacity: 0.5 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No special projects tracked yet.</p>
            <button className="btn btn-secondary" onClick={() => setShowAddModal(true)}>Create the first one</button>
          </div>
        ) : (
          projects.map(project => {
            const progress = getProgress(project);
            return (
              <div 
                key={project.id} 
                className="glass-panel card" 
                style={cardStyle}
              >
                {/* Background glow decoration */}
                <div style={{ 
                  position: 'absolute', 
                  top: '-40px', 
                  right: '-40px', 
                  width: '120px', 
                  height: '120px', 
                  borderRadius: '50%', 
                  background: project.status === 'Completed' 
                    ? 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)'
                    : project.status === 'Planning'
                      ? 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', 
                  pointerEvents: 'none' 
                }} />

                {/* Card Top */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={project.title}>
                      {project.title}
                    </h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Leader: <span style={{ color: 'var(--text-secondary)' }}>{project.leader}</span>
                    </p>
                  </div>
                  
                  {/* Status Badge */}
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    backgroundColor: project.status === 'Completed'
                      ? 'rgba(16,185,129,0.15)'
                      : project.status === 'Planning'
                        ? 'rgba(245,158,11,0.15)'
                        : 'rgba(139,92,246,0.15)',
                    color: project.status === 'Completed'
                      ? '#34d399'
                      : project.status === 'Planning'
                        ? '#fbbf24'
                        : '#a78bfa',
                    flexShrink: 0
                  }}>
                    {project.status}
                  </span>
                </div>

                {/* Description */}
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0, flex: 1 }}>
                  {project.description}
                </p>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    <span>Milestones</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{progress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${progress}%`, 
                      height: '100%', 
                      background: project.status === 'Completed' ? 'var(--accent-success)' : 'var(--accent-primary)',
                      borderRadius: '3px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>

                {/* Milestones list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
                  {getProjectMilestones(project).map(m => (
                    <div 
                      key={m.id} 
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}
                      onClick={() => toggleMilestone(project.id, m.id)}
                    >
                      <span style={{ color: m.completed ? 'var(--accent-success)' : 'var(--text-muted)', marginTop: '2px', display: 'flex', flexShrink: 0 }}>
                        {m.completed ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                      </span>
                      <span style={{ 
                        fontSize: '11.5px', 
                        color: m.completed ? 'var(--text-muted)' : 'var(--text-secondary)',
                        textDecoration: m.completed ? 'line-through' : 'none',
                        lineHeight: '1.4'
                      }}>
                        {m.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Card Bottom / Footer info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '12px', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={12} /> {project.members} active
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> {project.targetDate}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {project.id === 'project-100' ? (
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '6px 12px', fontSize: '11px', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => setActiveProject(project)}
                      >
                        <Play size={10} fill="white" /> Launch Workspace
                      </button>
                    ) : project.type === 'outreach' ? (
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '6px 12px', fontSize: '11px', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => setActiveProject(project)}
                      >
                        <Play size={10} fill="white" /> Launch Campaign
                      </button>
                    ) : (
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '11px', height: 'auto', opacity: 0.6 }}
                        onClick={() => alert("Strategic practice initiative. Standard milestone tracking is active.")}
                      >
                        Open Workspace
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteProject(project.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '4px', opacity: 0.5 }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.opacity = '1'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.opacity = '0.5'; }}
                      title="Delete project"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Project Modal */}
      {showAddModal && (
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
        }} onClick={() => setShowAddModal(false)}>
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
              <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>Add New Initiative</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Track a new team project or marketing campaign</p>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Initiative Type Selector */}
              <div className="input-group">
                <label className="input-label">Initiative Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                  <button
                    type="button"
                    className="btn"
                    style={{
                      border: newProject.type === 'outreach' ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
                      backgroundColor: newProject.type === 'outreach' ? 'rgba(139,92,246,0.1)' : 'transparent',
                      color: newProject.type === 'outreach' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontSize: '12.5px'
                    }}
                    onClick={() => setNewProject({ ...newProject, type: 'outreach' })}
                  >
                    🚀 Outreach Campaign
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{
                      border: newProject.type === 'custom' ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
                      backgroundColor: newProject.type === 'custom' ? 'rgba(139,92,246,0.1)' : 'transparent',
                      color: newProject.type === 'custom' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontSize: '12.5px'
                    }}
                    onClick={() => setNewProject({ ...newProject, type: 'custom' })}
                  >
                    📋 Custom Milestones
                  </button>
                </div>
              </div>

              {/* OUTREACH CAMPAIGN SETUP FIELDS */}
              {newProject.type === 'outreach' && (
                <>
                  <div className="input-group">
                    <label className="input-label">Campaign Name (Optional)</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={newProject.title} 
                      onChange={e => setNewProject({...newProject, title: e.target.value})}
                      placeholder="e.g. AIA Protect 3 Launch Campaign"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="input-group">
                      <label className="input-label">Product Focus</label>
                      <select
                        className="input-field"
                        style={{ background: 'var(--bg-base)' }}
                        value={newProject.productFocus}
                        onChange={e => setNewProject({...newProject, productFocus: e.target.value})}
                      >
                        <option value="AIA Protect 3">AIA Protect 3 (CI Gap)</option>
                        <option value="Generic CI Boost">Generic CI Booster</option>
                        <option value="Savings Accumulator">Savings / Endowments</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Primary Audience Focus</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        value={newProject.targetAudience} 
                        onChange={e => setNewProject({...newProject, targetAudience: e.target.value})}
                        placeholder="e.g. Young Working Adults"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="input-group">
                      <label className="input-label">Target Booking Count</label>
                      <input 
                        type="number" 
                        className="input-field" 
                        min="1"
                        value={newProject.targetAppointments} 
                        onChange={e => setNewProject({...newProject, targetAppointments: e.target.value})}
                        placeholder="e.g. 20"
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Target Date</label>
                      <input 
                        type="date" 
                        className="input-field" 
                        value={newProject.targetDate} 
                        onChange={e => setNewProject({...newProject, targetDate: e.target.value})}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="input-group">
                      <label className="input-label">Campaign Leader</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        value={newProject.leader} 
                        onChange={e => setNewProject({...newProject, leader: e.target.value})}
                        placeholder="Pieter Beetsma"
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Active Members</label>
                      <input 
                        type="number" 
                        className="input-field" 
                        min="1"
                        value={newProject.members} 
                        onChange={e => setNewProject({...newProject, members: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Description (Optional)</label>
                    <textarea 
                      className="input-field" 
                      style={{ minHeight: '60px', fontFamily: 'inherit', resize: 'vertical' }}
                      value={newProject.description} 
                      onChange={e => setNewProject({...newProject, description: e.target.value})}
                      placeholder="e.g. Respectful WhatsApp campaign targeting young parents."
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>AI Playbook Generator (Optional Summary/Brochure)</span>
                      <span style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: '600' }}>⚡ Gemini AI</span>
                    </label>
                    <textarea 
                      className="input-field" 
                      style={{ minHeight: '80px', fontFamily: 'inherit', resize: 'vertical', fontSize: '12px' }}
                      value={newProject.productSummary} 
                      onChange={e => setNewProject({...newProject, productSummary: e.target.value})}
                      placeholder="Paste product brochure terms, target segments, or text notes here. Gemini will generate custom hooks, WhatsApp message scripts, and routines."
                    />
                  </div>
                </>
              )}

              {/* CUSTOM MILESTONES SETUP FIELDS */}
              {newProject.type === 'custom' && (
                <>
                  <div className="input-group">
                    <label className="input-label">Project Title *</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={newProject.title} 
                      onChange={e => setNewProject({...newProject, title: e.target.value})}
                      required={newProject.type === 'custom'}
                      placeholder="e.g. MDRT Acceleration 2026"
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Description</label>
                    <textarea 
                      className="input-field" 
                      style={{ minHeight: '60px', fontFamily: 'inherit', resize: 'vertical' }}
                      value={newProject.description} 
                      onChange={e => setNewProject({...newProject, description: e.target.value})}
                      placeholder="What is the key goal of this initiative?"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="input-group">
                      <label className="input-label">Project Leader</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        value={newProject.leader} 
                        onChange={e => setNewProject({...newProject, leader: e.target.value})}
                        placeholder="e.g. Pieter Beetsma"
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Target Completion</label>
                      <input 
                        type="date" 
                        className="input-field" 
                        value={newProject.targetDate} 
                        onChange={e => setNewProject({...newProject, targetDate: e.target.value})}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="input-group">
                      <label className="input-label">Status</label>
                      <select 
                        className="input-field"
                        style={{ background: 'var(--bg-base)' }}
                        value={newProject.status} 
                        onChange={e => setNewProject({...newProject, status: e.target.value})}
                      >
                        <option value="Planning">Planning</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Active Members</label>
                      <input 
                        type="number" 
                        className="input-field" 
                        min="1"
                        value={newProject.members} 
                        onChange={e => setNewProject({...newProject, members: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Milestones list in form */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      Milestones
                      <button 
                        type="button" 
                        className="btn" 
                        style={{ padding: '2px 6px', fontSize: '10px', height: 'auto', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}
                        onClick={addMilestoneInputField}
                      >
                        + Add
                      </button>
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '120px', overflowY: 'auto', paddingRight: '4px' }}>
                      {newProject.milestones.map((milestone, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input 
                            type="text" 
                            className="input-field" 
                            style={{ flex: 1, padding: '6px 10px', fontSize: '12px' }}
                            value={milestone}
                            placeholder={`Milestone #${idx + 1}`}
                            onChange={e => handleMilestoneInputChange(idx, e.target.value)}
                          />
                          {newProject.milestones.length > 1 && (
                            <button 
                              type="button" 
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                              onClick={() => removeMilestoneInputField(idx)}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Form Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
                {isGenerating && (
                  <span style={{ fontSize: '11.5px', color: 'var(--accent-primary)', marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="spinner-border spinner-border-sm" role="status" style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid var(--accent-primary)', borderRightColor: 'transparent', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }}></span>
                    Generating AI Playbook...
                  </span>
                )}
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)} disabled={isGenerating}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isGenerating}>
                  {isGenerating ? 'Generating...' : 'Create Initiative'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
