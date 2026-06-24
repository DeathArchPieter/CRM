import { useState, useEffect } from 'react';
import { Plus, LayoutGrid, List, Trash2, TrendingUp, DollarSign, Briefcase } from 'lucide-react';

const STAGES = ['Prospect', 'Fact Finding', 'Proposal Sent', 'Case Submitted', 'Case Issued', 'Closed/Lost'];

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

export default function PipelineView() {
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
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
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
        await load();
        setIsPromptOpen(false);
        openEdit(promptCase);
      } else {
        console.error("Failed to create client from pipeline case:", res.error);
      }
    }
    setCreatingClient(false);
  };

  const handleSkipAndOpen = () => {
    setIsPromptOpen(false);
    openEdit(promptCase);
  };

  const handleCancelPrompt = () => {
    setIsPromptOpen(false);
    setPromptCase(null);
  };

  const handleChange = (e) => setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // If we are creating a new case, check if the client needs to be auto-created/ported
      if (!editingId) {
        const clientNameLower = (formData.clientName || '').toLowerCase().trim();
        
        // Find matching contact in Project 100
        const matchingProspect = project100Contacts.find(
          p => (p.fullName || '').toLowerCase().trim() === clientNameLower
        );
        
        if (matchingProspect) {
          let clientId = matchingProspect.portedClientId;
          
          // Check if they already exist in clients list to prevent duplicates
          const existingClient = clients.find(
            c => (c.fullName || '').toLowerCase().trim() === clientNameLower
          );
          
          if (existingClient) {
            clientId = existingClient.id;
          }
          
          // Auto-create client profile if not yet in database
          if (!clientId && window.electronAPI?.addClient) {
            const clientRes = await window.electronAPI.addClient({
              fullName: matchingProspect.fullName,
              preferredName: matchingProspect.fullName.split(' ')[0],
              phone: matchingProspect.phone,
              email: matchingProspect.email,
              clientStatus: 'Prospect',
              notes: `[Ported via Pipeline case creation on ${new Date().toLocaleDateString()}] N.A.S.T. priority: ${(((matchingProspect.scoreNeed || 3) + (matchingProspect.scoreAccessibility || 3) + (matchingProspect.scoreIncome || 3) + (matchingProspect.scoreTrust || 3)) / 4).toFixed(1)}/5.0.`
            });
            
            if (clientRes.success) {
              clientId = clientRes.id;
            }
          }
          
          // Update prospect in Project 100
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
    if (res.success) { setIsModalOpen(false); load(); }
  };

  // Summary stats — exclude Closed/Lost from totals
  const activeCases = cases.filter(c => c.stage !== 'Closed/Lost');
  const totalFYC = activeCases.reduce((s, c) => s + (Number(c.estimatedFYC) || 0), 0);
  const totalPremium = activeCases.reduce((s, c) => s + (Number(c.estimatedPremium) || 0), 0);

  return (
    <div className="view-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '28px', marginBottom: '4px' }}>Pipeline</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track cases from prospect to issuance.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* View Toggle */}
          <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px', gap: '4px' }}>
            <button onClick={() => setView('kanban')} className="btn" style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: view === 'kanban' ? 'rgba(255,255,255,0.1)' : 'transparent', color: view === 'kanban' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => setView('table')} className="btn" style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: view === 'table' ? 'rgba(255,255,255,0.1)' : 'transparent', color: view === 'table' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              <List size={16} />
            </button>
          </div>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => openAdd()}>
            <Plus size={18} /> Add Case
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Active Cases', value: activeCases.length, icon: <Briefcase size={18} />, color: '#60a5fa' },
          { label: 'Pipeline Premium', value: fmt(totalPremium), icon: <DollarSign size={18} />, color: '#fbbf24' },
          { label: 'Pipeline FYC', value: fmt(totalFYC), icon: <TrendingUp size={18} />, color: '#34d399' },
        ].map(stat => (
          <div key={stat.label} className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: `${stat.color}20`, color: stat.color }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{stat.label}</div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '48px' }}>Loading pipeline...</div>
      ) : view === 'kanban' ? (
        <KanbanBoard cases={cases} onEdit={handleCaseClick} onAddToStage={openAdd} />
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
                  <input type="date" name="expectedCloseDate" className="input-field" style={{ width: '100%', color: 'var(--text-primary)' }} value={formData.expectedCloseDate || ''} onChange={handleChange} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Est. Annual Premium</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }}>$</span>
                    <input type="number" name="estimatedPremium" className="input-field" style={{ width: '100%', paddingLeft: '24px' }} value={formData.estimatedPremium} onChange={handleChange} />
                  </div>
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Est. FYC</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }}>$</span>
                    <input type="number" name="estimatedFYC" className="input-field" style={{ width: '100%', paddingLeft: '24px' }} value={formData.estimatedFYC} onChange={handleChange} />
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

function KanbanBoard({ cases, onEdit, onAddToStage }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', flex: 1, overflowX: 'auto', overflowY: 'auto', paddingBottom: '8px' }}>
      {STAGES.map(stage => {
        const stageCases = cases.filter(c => c.stage === stage);
        const color = STAGE_COLORS[stage];
        return (
          <div key={stage} style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '200px' }}>
            {/* Column Header */}
            <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: color.bg, border: `1px solid ${color.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: color.text }}>{stage}</span>
              <span style={{ fontSize: '11px', backgroundColor: color.border, color: color.text, borderRadius: '10px', padding: '2px 8px' }}>{stageCases.length}</span>
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              {stageCases.map(c => (
                <div key={c.id} className="card" style={{ padding: '14px', cursor: 'pointer', borderLeft: `3px solid ${color.border}` }} onClick={() => onEdit(c)}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>{c.clientName}</div>
                  {c.policyName && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>{c.policyName}</div>}
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{c.policyType}</div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Premium</span>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{fmt(c.estimatedPremium)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>FYC</span>
                      <span style={{ color: color.text, fontWeight: '600' }}>{fmt(c.estimatedFYC)}</span>
                    </div>
                    {c.expectedCloseDate && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Close: {new Date(c.expectedCloseDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Add to stage button */}
              <button className="btn" onClick={() => onAddToStage(stage)} style={{ width: '100%', padding: '8px', fontSize: '12px', backgroundColor: 'transparent', border: '1px dashed var(--border-light)', color: 'var(--text-muted)', borderRadius: '8px', cursor: 'pointer' }}>
                + Add
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
  const [sortDir, setSortDir] = useState('desc');
  const [filterStage, setFilterStage] = useState('All');

  const toggle = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = cases
    .filter(c => filterStage === 'All' || c.stage === filterStage)
    .sort((a, b) => {
      let av = a[sortKey] ?? '', bv = b[sortKey] ?? '';
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });

  return (
    <div className="glass-panel" style={{ flex: 1, padding: 0, overflowY: 'auto' }}>
      {/* Filter bar */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {['All', ...STAGES].map(s => (
          <button key={s} onClick={() => setFilterStage(s)} className="btn" style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '20px', backgroundColor: filterStage === s ? 'rgba(255,255,255,0.1)' : 'transparent', color: filterStage === s ? 'var(--text-primary)' : 'var(--text-muted)', border: filterStage === s ? '1px solid var(--border-light)' : '1px solid transparent' }}>
            {s}
          </button>
        ))}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
        <thead>
          <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-light)' }}>
            <th onClick={() => toggle('clientName')} style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '13px', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
              Client {sortKey === 'clientName' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th onClick={() => toggle('policyName')} style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '13px', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
              Policy {sortKey === 'policyName' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th onClick={() => toggle('policyType')} style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '13px', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
              Type {sortKey === 'policyType' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th onClick={() => toggle('stage')} style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '13px', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
              Stage {sortKey === 'stage' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th onClick={() => toggle('estimatedPremium')} style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '13px', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
              Est. Premium {sortKey === 'estimatedPremium' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th onClick={() => toggle('estimatedFYC')} style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '13px', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
              Est. FYC {sortKey === 'estimatedFYC' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th onClick={() => toggle('expectedCloseDate')} style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '13px', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
              Close Date {sortKey === 'expectedCloseDate' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
            </th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>No cases found.</td></tr>
          ) : filtered.map(c => {
            const color = STAGE_COLORS[c.stage];
            return (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={() => onEdit(c)}>
                <td style={{ padding: '14px 20px', color: 'var(--text-primary)', fontWeight: '500' }}>{c.clientName}</td>
                <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{c.policyName || '-'}</td>
                <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>{c.policyType}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', backgroundColor: color.bg, color: color.text }}>{c.stage}</span>
                </td>
                <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{fmt(c.estimatedPremium)}</td>
                <td style={{ padding: '14px 20px', color: color.text, fontWeight: '600' }}>{fmt(c.estimatedFYC)}</td>
                <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>{c.expectedCloseDate ? new Date(c.expectedCloseDate).toLocaleDateString() : '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
