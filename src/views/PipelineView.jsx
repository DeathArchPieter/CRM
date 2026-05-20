import React, { useState, useEffect } from 'react';
import { Plus, LayoutGrid, List, Trash2, Edit2, TrendingUp, DollarSign, Briefcase } from 'lucide-react';

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

  const load = async () => {
    setLoading(true);
    if (window.electronAPI?.getPipeline) {
      const res = await window.electronAPI.getPipeline();
      if (res.success) setCases(res.data);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

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

  const handleChange = (e) => setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    const api = editingId ? window.electronAPI.updatePipelineCase : window.electronAPI.addPipelineCase;
    const res = await api({ ...formData, ...(editingId ? { id: editingId } : {}) });
    if (res.success) { setIsModalOpen(false); load(); }
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
        <KanbanBoard cases={cases} onEdit={openEdit} onAddToStage={openAdd} />
      ) : (
        <TableView cases={cases} onEdit={openEdit} />
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
                  <input required type="text" name="clientName" className="input-field" style={{ width: '100%' }} value={formData.clientName} onChange={handleChange} placeholder="e.g. John Tan" />
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

  const Th = ({ label, k }) => (
    <th onClick={() => toggle(k)} style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '13px', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
      {label} {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

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
            <Th label="Client" k="clientName" />
            <Th label="Policy" k="policyName" />
            <Th label="Type" k="policyType" />
            <Th label="Stage" k="stage" />
            <Th label="Est. Premium" k="estimatedPremium" />
            <Th label="Est. FYC" k="estimatedFYC" />
            <Th label="Close Date" k="expectedCloseDate" />
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
