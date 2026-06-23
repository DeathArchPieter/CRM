import { useState } from 'react';
import { Briefcase, FolderGit2, CheckCircle2, Circle, Plus, Trash2, Users, Calendar, BarChart3 } from 'lucide-react';

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
  const [projects, setProjects] = useState([
    {
      id: 'p1',
      title: 'MDRT Acceleration 2026',
      description: 'Focused campaign to fast-track qualifying consultants for Million Dollar Round Table.',
      leader: 'Pieter Beetsma',
      status: 'In Progress', // Planning | In Progress | Completed
      targetDate: '2026-12-31',
      members: 4,
      milestones: [
        { id: 'p1-m1', label: 'Define customized target blueprints for qualifiers', completed: true },
        { id: 'p1-m2', label: 'Conduct weekly high-net-worth (HNW) masterclasses', completed: true },
        { id: 'p1-m3', label: 'Mid-year milestone reviews & pipeline gap analysis', completed: false },
        { id: 'p1-m4', label: 'Final sprints & premium closing events', completed: false },
      ]
    },
    {
      id: 'p2',
      title: 'Agency Recruitment Drive',
      description: 'Hiring drive aiming to bring on board 5 new high-caliber associate financial consultants.',
      leader: 'Jan Pang',
      status: 'In Progress',
      targetDate: '2026-09-30',
      members: 3,
      milestones: [
        { id: 'p2-m1', label: 'Prepare branding decks & university outreach schedule', completed: true },
        { id: 'p2-m2', label: 'Conduct career preview webinars', completed: false },
        { id: 'p2-m3', label: 'First round interviews & profiling assessments', completed: false },
      ]
    },
    {
      id: 'p3',
      title: 'HNW Legacy Preservation Campaign',
      description: 'Special marketing push focusing on legacy index universal life products for business owners.',
      leader: 'Yap Pei Lin',
      status: 'Planning',
      targetDate: '2026-11-15',
      members: 2,
      milestones: [
        { id: 'p3-m1', label: 'Identify target client list from current database', completed: false },
        { id: 'p3-m2', label: 'Create exclusive marketing brochure & estate planning booklets', completed: false },
        { id: 'p3-m3', label: 'Launch invitation-only legacy planning seminar', completed: false },
      ]
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    leader: '',
    status: 'Planning',
    targetDate: '',
    members: 1,
    milestones: ['', '']
  });

  const getProgress = (project) => {
    if (!project.milestones.length) return 0;
    const completedCount = project.milestones.filter(m => m.completed).length;
    return Math.round((completedCount / project.milestones.length) * 100);
  };

  const toggleMilestone = (projectId, milestoneId) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        milestones: p.milestones.map(m => m.id === milestoneId ? { ...m, completed: !m.completed } : m)
      };
    }));
  };

  const handleDeleteProject = (id) => {
    setProjects(prev => prev.filter(p => p.id !== id));
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

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!newProject.title.trim()) return;

    const formattedMilestones = newProject.milestones
      .filter(m => m.trim().length > 0)
      .map((label, idx) => ({
        id: `custom-p-${Date.now()}-m-${idx}`,
        label,
        completed: false
      }));

    const projectToAdd = {
      id: `custom-p-${Date.now()}`,
      title: newProject.title,
      description: newProject.description,
      leader: newProject.leader || 'Pieter Beetsma',
      status: newProject.status,
      targetDate: newProject.targetDate || new Date().toISOString().split('T')[0],
      members: Number(newProject.members) || 1,
      milestones: formattedMilestones
    };

    setProjects([projectToAdd, ...projects]);
    setShowAddModal(false);
    setNewProject({
      title: '',
      description: '',
      leader: '',
      status: 'Planning',
      targetDate: '',
      members: 1,
      milestones: ['', '']
    });
  };

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
                  {project.milestones.map(m => (
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
            }}
            onClick={e => e.stopPropagation()}
          >
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>Add New Initiative</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Track a new team project or marketing campaign</p>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Project Title</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newProject.title} 
                  onChange={e => setNewProject({...newProject, title: e.target.value})}
                  required
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

              {/* Form Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
