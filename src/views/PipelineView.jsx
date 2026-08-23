import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, LayoutGrid, List, Trash2, TrendingUp, DollarSign, 
  Briefcase, Percent, CheckCircle2, ArrowRight, Sparkles 
} from 'lucide-react';
import DatePicker from '../components/DatePicker';
import { useToast } from '../components/Toast';

const STAGES = ['Prospect', 'Fact Finding', 'Proposal Sent', 'Case Submitted', 'Case Issued', 'Closed/Lost'];

const STAGE_PROBABILITIES = {
  'Prospect':       0.10,
  'Fact Finding':   0.30,
  'Proposal Sent':  0.50,
  'Case Submitted': 0.80,
  'Case Issued':    1.00,
  'Closed/Lost':    0.00
};

const STAGE_COLORS = {
  'Prospect':       { bg: 'rgba(139, 92, 246, 0.1)',  border: 'rgba(139, 92, 246, 0.3)',  text: '#a78bfa' },
  'Fact Finding':   { bg: 'rgba(59, 130, 246, 0.1)',  border: 'rgba(59, 130, 246, 0.3)',  text: '#60a5fa' },
  'Proposal Sent':  { bg: 'rgba(234, 179, 8, 0.1)',   border: 'rgba(234, 179, 8, 0.3)',   text: '#fbbf24' },
  'Case Submitted': { bg: 'rgba(249, 115, 22, 0.1)',  border: 'rgba(249, 115, 22, 0.3)',  text: '#fb923c' },
  'Case Issued':    { bg: 'rgba(16, 185, 129, 0.1)',  border: 'rgba(16, 185, 129, 0.3)',  text: '#34d399' },
  'Closed/Lost':    { bg: 'rgba(239, 68, 68, 0.1)',   border: 'rgba(239, 68, 68, 0.3)',   text: '#f87171' },
};

const POLICY_TYPES = ['Life','Term','A&H','Shield','HI','ILP','Endowment','LTC','Disability Income'];

const INITIAL_FORM = {
  clientName: '', policyName: '', policyType: 'Life',
  estimatedPremium: '', estimatedFYC: '',
  expectedCloseDate: '', stage: 'Prospect', notes: ''
};

const fmt = (v) => v ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v) : '$0';

export default function PipelineView({ onSelectClient }) {
  const { addToast } = useToast();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('kanban'); // 'kanban' | 'table'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [clients, setClients] = useState([]);
  const [project100Contacts, setProject100Contacts] = useState([]);
  const [promptCase, setPromptCase] = useState(null);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);
  const [isWeightedView, setIsWeightedView] = useState(false);

  const load = async () => {
    setLoading(true);
    if (window.electronAPI) {
      const promises = [
        window.electronAPI.getPipeline ? window.electronAPI.getPipeline() : Promise.resolve({ success: true, data: [] }),
        window.electronAPI.getClients ? window.electronAPI.getClients() : Promise.resolve({ success: true, data: [] }),
        window.electronAPI.getProject100Contacts ? window.electronAPI.getProject100Contacts() : Promise.resolve({ success: true, data: [] })
      ];
      
      const [pipelineRes, clientsRes, p100Res] = await Promise.all(promises);
      
      if (pipelineRes?.success) setCases(pipelineRes.data);
      if (clientsRes?.success) setClients(clientsRes.data);
      if (p100Res?.success) setProject100Contacts(p100Res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = (defaultStage = 'Prospect') => {
    setEditingId(null);
    setFormData({ ...INITIAL_FORM, stage: defaultStage });
    setIsModalOpen(true);
  };

  const openEdit = (c) => {
    setEditingId(c.id);
    setFormData(c);
    setIsModalOpen(true);
  };

  const handleCaseClick = (c) => {
    const nameLower = (c.clientName || '').toLowerCase().trim();
    const clientExists = clients.some(cl => 
      (cl.fullName || '').toLowerCase().trim() === nameLower ||
      (cl.preferredName && (cl.preferredName || '').toLowerCase().trim() === nameLower)
    );
    
    if (!clientExists) {
      setPromptCase(c);
      setIsPromptOpen(true);
    } else {
      openEdit(c);
    }
  };

  const handleCreateClientAndOpen = async () => {
    if (!promptCase) return;
    setCreatingClient(true);
    if (window.electronAPI?.addClient) {
      const res = await window.electronAPI.addClient({
        fullName: promptCase.clientName,
        clientStatus: 'Prospect'
      });
      if (res.success) {
        addToast(`Created new client profile for "${promptCase.clientName}"`, 'success');
        await load();
        setIsPromptOpen(false);
        openEdit(promptCase);
      }
    }
    setCreatingClient(false);
  };

  const handleSkipAndOpen = () => {
    setIsPromptOpen(false);
    if (promptCase) openEdit(promptCase);
  };

  const handleCancelPrompt = () => {
    setIsPromptOpen(false);
    setPromptCase(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Drag and drop stage change handler
  const handleStageDrop = async (caseId, newStage) => {
    const targetCase = cases.find(c => c.id === caseId);
    if (!targetCase || targetCase.stage === newStage) return;

    // Optimistic UI update
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, stage: newStage } : c));

    if (window.electronAPI?.updatePipelineCase) {
      try {
        const res = await window.electronAPI.updatePipelineCase({
          ...targetCase,
          stage: newStage,
          updatedAt: new Date().toISOString()
        });
        if (res.success) {
          addToast(`Moved "${targetCase.clientName}" to ${newStage}`, 'success');
          load();
        }
      } catch (err) {
        console.error('Failed to drag-drop update case:', err);
        load();
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!editingId) {
        const nameLower = (formData.clientName || '').toLowerCase().trim();
        const matchingProspect = project100Contacts.find(p => 
          (p.fullName || '').toLowerCase().trim() === nameLower && !p.portedClientId
        );
        
        if (matchingProspect) {
          let clientId = null;
          const matchingClient = clients.find(cl => 
            (cl.fullName || '').toLowerCase().trim() === nameLower ||
            (cl.preferredName && (cl.preferredName || '').toLowerCase().trim() === nameLower)
          );
          
          if (matchingClient) {
            clientId = matchingClient.id;
          } else if (window.electronAPI?.addClient) {
            const clientRes = await window.electronAPI.addClient({
              fullName: matchingProspect.fullName,
              preferredName: matchingProspect.preferredName,
              companyName: matchingProspect.company,
              jobTitle: matchingProspect.jobTitle,
              phone: matchingProspect.phone,
              email: matchingProspect.email,
              clientStatus: 'Prospect',
              notes: `[Ported via Pipeline case creation on ${new Date().toLocaleDateString()}] N.A.S.T. priority: ${(((matchingProspect.scoreNeed || 3) + (matchingProspect.scoreAccessibility || 3) + (matchingProspect.scoreIncome || 3) + (matchingProspect.scoreTrust || 3)) / 4).toFixed(1)}/5.0.`
            });
            
            if (clientRes.success) {
              clientId = clientRes.id;
            }
          }
          
          if (clientId && window.electronAPI?.updateProject100Contact) {
            await window.electronAPI.updateProject100Contact({
              id: matchingProspect.id,
              stage: 'Ported / Converted',
              portedClientId: clientId
            });
          }
        }
      }

      const api = editingId ? window.electronAPI.updatePipelineCase : window.electronAPI.addPipelineCase;
      const res = await api({ ...formData, ...(editingId ? { id: editingId } : {}) });
      if (res.success) {
        addToast(editingId ? 'Case updated' : 'New case added to pipeline', 'success');
        setIsModalOpen(false);
        load();
      } else {
        alert("Failed to save pipeline case: " + res.error);
      }
    } catch (err) {
      console.error("Error saving pipeline case:", err);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this pipeline case? This cannot be undone.')) return;
    const res = await window.electronAPI.deletePipelineCase(editingId);
    if (res.success) { 
      addToast('Case deleted from pipeline', 'info');
      setIsModalOpen(false); 
      load(); 
    }
  };

  // Summary stats — exclude Closed/Lost from totals
  const activeCases = cases.filter(c => c.stage !== 'Closed/Lost');
  const totalNominalFYC = activeCases.reduce((s, c) => s + (Number(c.estimatedFYC) || 0), 0);
  const totalWeightedFYC = activeCases.reduce((s, c) => {
    const prob = STAGE_PROBABILITIES[c.stage] || 0.3;
    return s + ((Number(c.estimatedFYC) || 0) * prob);
  }, 0);
  const totalPremium = activeCases.reduce((s, c) => s + (Number(c.estimatedPremium) || 0), 0);

  return (
    <div className="view-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '26px', margin: 0, fontWeight: '700' }}>Sales Pipeline</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '2px 0 0 0' }}>
            Drag and drop cases across advisory stages to track conversions and forecast FYC.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* Weighted Forecast Toggle */}
          <button
            onClick={() => setIsWeightedView(prev => !prev)}
            className="btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              backgroundColor: isWeightedView ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              color: isWeightedView ? 'var(--accent-primary)' : 'var(--text-secondary)',
              border: isWeightedView ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid var(--border-light)'
            }}
            title="Toggle between full nominal FYC and probability-weighted pipeline forecast"
          >
            <Percent size={13} />
            {isWeightedView ? 'Weighted Forecast Mode' : 'Nominal FYC Mode'}
          </button>

          {/* View Toggle */}
          <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '3px', gap: '2px', border: '1px solid var(--border-light)' }}>
            <button onClick={() => setView('kanban')} className="btn" style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: view === 'kanban' ? 'rgba(255,255,255,0.12)' : 'transparent', color: view === 'kanban' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              <LayoutGrid size={15} />
            </button>
            <button onClick={() => setView('table')} className="btn" style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: view === 'table' ? 'rgba(255,255,255,0.12)' : 'transparent', color: view === 'table' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              <List size={15} />
            </button>
          </div>

          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '7px 14px' }} onClick={() => openAdd()}>
            <Plus size={16} /> Add Case
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa' }}>
            <Briefcase size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '2px' }}>Active Deals</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{activeCases.length}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24' }}>
            <DollarSign size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '2px' }}>Pipeline Premium</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{fmt(totalPremium)}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34d399' }}>
            <TrendingUp size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '2px' }}>
              {isWeightedView ? 'Weighted Expected FYC' : 'Total Pipeline FYC'}
            </div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#34d399' }}>
              {fmt(isWeightedView ? totalWeightedFYC : totalNominalFYC)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '48px' }}>Loading pipeline...</div>
      ) : view === 'kanban' ? (
        <KanbanBoard 
          cases={cases} 
          onEdit={handleCaseClick} 
          onAddToStage={openAdd}
          onStageDrop={handleStageDrop}
          isWeightedView={isWeightedView}
        />
      ) : (
        <TableView cases={cases} onEdit={handleCaseClick} />
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '560px', padding: '32px', maxHeight: '90vh', overflowY: 'auto', animation: 'fadeIn 0.2s ease-out' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '24px', color: 'var(--text-primary)' }}>
              {editingId ? 'Edit Case' : 'Add Pipeline Case'}
            </h2>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Client Name *</label>
                  <input 
                    required 
                    type="text" 
                    name="clientName" 
                    className="input-field" 
                    style={{ width: '100%' }} 
                    value={formData.clientName} 
                    onChange={handleChange} 
                    placeholder="e.g. John Tan" 
                    list="clients-and-prospects-list"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Stage</label>
                  <select name="stage" className="input-field" style={{ width: '100%' }} value={formData.stage} onChange={handleChange}>
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Policy Name</label>
                <input type="text" name="policyName" className="input-field" style={{ width: '100%' }} value={formData.policyName} onChange={handleChange} placeholder="e.g. AIA Guaranteed Protect Plus" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Policy Type</label>
                  <select name="policyType" className="input-field" style={{ width: '100%' }} value={formData.policyType} onChange={handleChange}>
                    {POLICY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Expected Close Date</label>
                  <DatePicker 
                    name="expectedCloseDate" 
                    value={formData.expectedCloseDate || ''} 
                    onChange={handleChange} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Est. Annual Premium</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }}>$</span>
                    <input type="number" step="0.01" min="0" name="estimatedPremium" className="input-field" style={{ width: '100%', paddingLeft: '24px' }} placeholder="0.00" value={formData.estimatedPremium} onChange={handleChange} />
                  </div>
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Est. FYC</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }}>$</span>
                    <input type="number" step="0.01" min="0" name="estimatedFYC" className="input-field" style={{ width: '100%', paddingLeft: '24px' }} placeholder="0.00" value={formData.estimatedFYC} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Notes</label>
                <textarea name="notes" className="input-field" style={{ width: '100%', minHeight: '72px', resize: 'vertical' }} value={formData.notes} onChange={handleChange} placeholder="Awaiting medical results, follow up on..." />
              </div>

              {/* Datalist for suggestions */}
              <datalist id="clients-and-prospects-list">
                {clients.map(c => (
                  <option key={`c-${c.id}`} value={c.fullName}>{`Client: ${c.clientStatus || 'Active'}`}</option>
                ))}
                {project100Contacts.filter(p => !p.portedClientId).map(p => (
                  <option key={`p-${p.id}`} value={p.fullName}>{`Project 100 Prospect (${p.category})`}</option>
                ))}
              </datalist>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {editingId && (
                    <button type="button" className="btn" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleDelete}>
                      <Trash2 size={16} /> Delete
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" className="btn" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingId ? 'Update Case' : 'Add Case'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Prompt Modal */}
      {isPromptOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 101, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Create Client Profile?
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              There is no client profile for <strong style={{ color: 'var(--text-primary)' }}>{promptCase?.clientName}</strong> in your database. 
              Creating one will allow you to track their policy portfolio, manage follow-up tasks, and generate AI-driven client insights.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <button 
                type="button" 
                className="btn" 
                style={{ backgroundColor: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}
                onClick={handleCancelPrompt}
                disabled={creatingClient}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleSkipAndOpen}
                disabled={creatingClient}
              >
                Skip & Open Case
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleCreateClientAndOpen}
                disabled={creatingClient}
              >
                {creatingClient ? 'Creating...' : 'Create Profile & Open'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KanbanBoard({ cases, onEdit, onAddToStage, onStageDrop, isWeightedView }) {
  const [draggedCaseId, setDraggedCaseId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', flex: 1, overflowX: 'auto', overflowY: 'auto', paddingBottom: '8px' }}>
      {STAGES.map(stage => {
        const stageCases = cases.filter(c => c.stage === stage);
        const color = STAGE_COLORS[stage];
        const prob = STAGE_PROBABILITIES[stage] || 0.3;
        
        const nominalFyc = stageCases.reduce((s, c) => s + (Number(c.estimatedFYC) || 0), 0);
        const displayFyc = isWeightedView ? nominalFyc * prob : nominalFyc;
        const totalPrem = stageCases.reduce((s, c) => s + (Number(c.estimatedPremium) || 0), 0);
        const isTargetDrop = dragOverStage === stage;

        return (
          <div 
            key={stage} 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '8px', 
              minWidth: '220px',
              backgroundColor: isTargetDrop ? 'rgba(139, 92, 246, 0.08)' : 'transparent',
              borderRadius: '10px',
              padding: '4px',
              transition: 'background-color 0.15s ease'
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (dragOverStage !== stage) setDragOverStage(stage);
            }}
            onDragLeave={() => {
              if (dragOverStage === stage) setDragOverStage(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverStage(null);
              const caseId = e.dataTransfer.getData('text/plain');
              if (caseId && onStageDrop) {
                onStageDrop(caseId, stage);
              }
            }}
          >
            {/* Column Header with Stage Metrics */}
            <div style={{ 
              padding: '10px 12px', 
              borderRadius: '8px', 
              backgroundColor: color.bg, 
              border: `1px solid ${color.border}`, 
              display: 'flex', 
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12.5px', fontWeight: '700', color: color.text }}>{stage}</span>
                <span style={{ fontSize: '11px', backgroundColor: color.border, color: color.text, borderRadius: '10px', padding: '1px 7px', fontWeight: '600' }}>
                  {stageCases.length}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', borderTop: `1px solid ${color.border}`, paddingTop: '4px', marginTop: '2px' }}>
                <span>{fmt(displayFyc)} {isWeightedView ? `(${Math.round(prob * 100)}%)` : 'FYC'}</span>
                <span>{fmt(totalPrem)} Prem</span>
              </div>
            </div>

            {/* Draggable Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minHeight: '80px' }}>
              {stageCases.map(c => {
                const isDragging = draggedCaseId === c.id;
                const cardFyc = Number(c.estimatedFYC) || 0;
                const cardDisplayFyc = isWeightedView ? cardFyc * prob : cardFyc;

                return (
                  <div 
                    key={c.id} 
                    draggable={true}
                    onDragStart={(e) => {
                      setDraggedCaseId(c.id);
                      e.dataTransfer.setData('text/plain', c.id);
                    }}
                    onDragEnd={() => {
                      setDraggedCaseId(null);
                      setDragOverStage(null);
                    }}
                    className="card" 
                    style={{ 
                      padding: '13px', 
                      cursor: 'grab', 
                      borderLeft: `3px solid ${color.border}`,
                      opacity: isDragging ? 0.4 : 1,
                      transform: isDragging ? 'scale(0.96)' : 'none',
                      transition: 'opacity 0.15s, transform 0.15s'
                    }} 
                    onClick={() => onEdit(c)}
                  >
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {c.clientName}
                    </div>
                    {c.policyName && <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '6px' }}>{c.policyName}</div>}
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                      {c.policyType}
                    </div>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Premium</span>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{fmt(c.estimatedPremium)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{isWeightedView ? 'Wt. FYC' : 'FYC'}</span>
                        <span style={{ color: color.text, fontWeight: '700' }}>{fmt(cardDisplayFyc)}</span>
                      </div>
                      {c.expectedCloseDate && (
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Close: {new Date(c.expectedCloseDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add to stage button */}
              <button 
                className="btn" 
                onClick={() => onAddToStage(stage)} 
                style={{ 
                  width: '100%', 
                  padding: '7px', 
                  fontSize: '11.5px', 
                  backgroundColor: 'transparent', 
                  border: '1px dashed var(--border-light)', 
                  color: 'var(--text-muted)', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  marginTop: 'auto'
                }}
              >
                + Add Deal
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TableView({ cases, onEdit }) {
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const sorted = [...cases].sort((a, b) => {
    let valA = a[sortKey] || '';
    let valB = b[sortKey] || '';
    if (sortKey === 'estimatedPremium' || sortKey === 'estimatedFYC') {
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
    }
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="glass-panel" style={{ flex: 1, padding: 0, overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <th style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500' }}>Client</th>
            <th style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500' }}>Policy / Plan</th>
            <th style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500' }}>Type</th>
            <th style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500' }}>Stage</th>
            <th style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500' }}>Premium</th>
            <th style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500' }}>FYC</th>
            <th style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500' }}>Close Date</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(c => {
            const color = STAGE_COLORS[c.stage] || STAGE_COLORS['Prospect'];
            return (
              <tr 
                key={c.id} 
                style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={() => onEdit(c)}
              >
                <td style={{ padding: '14px 20px', fontWeight: '600', color: 'var(--text-primary)' }}>{c.clientName}</td>
                <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{c.policyName || '—'}</td>
                <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>{c.policyType}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', backgroundColor: color.bg, color: color.text, border: `1px solid ${color.border}` }}>
                    {c.stage}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{fmt(c.estimatedPremium)}</td>
                <td style={{ padding: '14px 20px', color: color.text, fontWeight: '600' }}>{fmt(c.estimatedFYC)}</td>
                <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '12px' }}>
                  {c.expectedCloseDate ? new Date(c.expectedCloseDate).toLocaleDateString() : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
