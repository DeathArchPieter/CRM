import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Trash2, X, Shield, FileText, CheckSquare, 
  Briefcase, TrendingUp, Loader2, Sparkles, Building2
} from 'lucide-react';
import { useToast } from './Toast';

export default function DeleteClientModal({ isOpen, client, onClose, onDeleted }) {
  const { addToast } = useToast();
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [stats, setStats] = useState({
    policies: 0,
    claims: 0,
    tasks: 0,
    pipeline: 0,
    proposals: 0,
    hasFinancialPlan: false
  });

  useEffect(() => {
    if (isOpen && client?.id) {
      setConfirmInput('');
      setIsDeleting(false);
      fetchClientStats(client.id);
    }
  }, [isOpen, client]);

  const fetchClientStats = async (clientId) => {
    setLoadingStats(true);
    let policiesCount = 0;
    let claimsCount = 0;
    let tasksCount = 0;
    let pipelineCount = 0;
    let proposalsCount = 0;

    try {
      if (window.electronAPI) {
        // Policies
        if (window.electronAPI.getPolicies) {
          const res = await window.electronAPI.getPolicies(clientId);
          if (res.success && Array.isArray(res.data)) {
            policiesCount = res.data.length;
          }
        }
        // Claims
        if (window.electronAPI.getClaims) {
          const res = await window.electronAPI.getClaims(clientId);
          if (res.success && Array.isArray(res.data)) {
            claimsCount = res.data.length;
          }
        }
        // Tasks
        if (window.electronAPI.getTasks) {
          const res = await window.electronAPI.getTasks(clientId);
          if (res.success && Array.isArray(res.data)) {
            tasksCount = res.data.length;
          }
        }
        // Proposals
        if (window.electronAPI.getProposals) {
          const res = await window.electronAPI.getProposals(clientId);
          if (res.success && Array.isArray(res.data)) {
            proposalsCount = res.data.length;
          }
        }
        // Pipeline
        if (window.electronAPI.getPipeline) {
          const res = await window.electronAPI.getPipeline();
          if (res.success && Array.isArray(res.data)) {
            pipelineCount = res.data.filter(p => p.clientId === clientId).length;
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch client impact stats:', err);
    }

    setStats({
      policies: policiesCount,
      claims: claimsCount,
      tasks: tasksCount,
      pipeline: pipelineCount,
      proposals: proposalsCount,
      hasFinancialPlan: Boolean(client?.financialPlan)
    });
    setLoadingStats(false);
  };

  if (!isOpen || !client) return null;

  const isConfirmed = confirmInput.trim().toUpperCase() === 'DELETE';
  const totalRecords = stats.policies + stats.claims + stats.tasks + stats.pipeline + stats.proposals;

  const handleDelete = async () => {
    if (!isConfirmed || isDeleting) return;
    setIsDeleting(true);

    try {
      if (!window.electronAPI?.deleteClient) {
        throw new Error('deleteClient IPC API is not available');
      }

      const response = await window.electronAPI.deleteClient(client.id);
      if (response.success) {
        addToast(`Client "${client.fullName}" and all associated records permanently deleted`, 'success');
        if (onDeleted) {
          onDeleted(response);
        }
        onClose();
      } else {
        addToast(response.error || 'Failed to delete client', 'error');
      }
    } catch (err) {
      console.error('Delete client failed:', err);
      addToast(err.message || 'Failed to delete client', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        backgroundColor: 'rgba(5, 8, 15, 0.8)', 
        zIndex: 2500, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backdropFilter: 'blur(8px)',
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div 
        className="glass-panel animate-scale-up" 
        style={{ 
          width: '100%', 
          maxWidth: '520px', 
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px', 
          borderRadius: '16px',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          backgroundColor: '#0f172a',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 25px rgba(239, 68, 68, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '12px', 
              backgroundColor: 'rgba(239, 68, 68, 0.15)', 
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#f87171',
              flexShrink: 0
            }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                Delete Client Profile
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px', margin: '2px 0 0 0' }}>
                Permanent removal and cascading record purge
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="btn" 
            style={{ padding: '6px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }} 
            onClick={onClose}
            disabled={isDeleting}
          >
            <X size={16} />
          </button>
        </div>

        {/* Client Identity Card */}
        <div style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.03)', 
          border: '1px solid var(--border-light)', 
          borderRadius: '10px', 
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {client.fullName}
              {client.preferredName && (
                <span style={{ fontSize: '13px', fontWeight: '400', color: 'var(--text-secondary)', marginLeft: '6px', fontStyle: 'italic' }}>
                  "{client.preferredName}"
                </span>
              )}
            </div>
            <span style={{ 
              fontSize: '11px', 
              padding: '2px 8px', 
              borderRadius: '8px', 
              backgroundColor: client.clientStatus === 'Active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.06)',
              color: client.clientStatus === 'Active' ? '#34d399' : 'var(--text-muted)',
              fontWeight: '600'
            }}>
              {client.clientStatus || 'Active'}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '2px' }}>
            {client.companyName && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Building2 size={12} color="var(--text-muted)" /> {client.companyName}
              </span>
            )}
            {client.email && <span>{client.email}</span>}
            {client.phone && <span>{client.phone}</span>}
          </div>
        </div>

        {/* Warning Callout */}
        <div style={{ 
          backgroundColor: 'rgba(239, 68, 68, 0.08)', 
          borderLeft: '4px solid #ef4444', 
          borderRadius: '8px', 
          padding: '12px 14px',
          fontSize: '12.5px',
          lineHeight: '1.5',
          color: '#fca5a5'
        }}>
          <strong>Caution:</strong> This action is <strong>irreversible</strong>. Deleting this client will permanently purge all linked records and vault files from your database.
        </div>

        {/* Cascading Purge Impact Breakdown */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Associated Records to be purged:</span>
            {loadingStats && <Loader2 size={13} className="animate-spin" color="var(--accent-primary)" />}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <Shield size={14} color="#60a5fa" /> Policies
              </span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: stats.policies > 0 ? '#f87171' : 'var(--text-muted)' }}>
                {stats.policies}
              </span>
            </div>

            <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <FileText size={14} color="#f59e0b" /> Claims & Vault Docs
              </span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: stats.claims > 0 ? '#f87171' : 'var(--text-muted)' }}>
                {stats.claims}
              </span>
            </div>

            <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <CheckSquare size={14} color="#34d399" /> Tasks & Calendar
              </span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: stats.tasks > 0 ? '#f87171' : 'var(--text-muted)' }}>
                {stats.tasks}
              </span>
            </div>

            <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <Briefcase size={14} color="#a78bfa" /> Pipeline Deals
              </span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: stats.pipeline > 0 ? '#f87171' : 'var(--text-muted)' }}>
                {stats.pipeline}
              </span>
            </div>

            <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <TrendingUp size={14} color="#38bdf8" /> Proposals & Plans
              </span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: (stats.proposals > 0 || stats.hasFinancialPlan) ? '#f87171' : 'var(--text-muted)' }}>
                {stats.proposals + (stats.hasFinancialPlan ? 1 : 0)}
              </span>
            </div>

            <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <Sparkles size={14} color="#e879f9" /> Social Dossier
              </span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: client.aiDossier ? '#f87171' : 'var(--text-muted)' }}>
                {client.aiDossier ? '1' : '0'}
              </span>
            </div>
          </div>
        </div>

        {/* Security Confirmation Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label className="input-label" style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            To confirm deletion, please type <strong style={{ color: '#f87171' }}>DELETE</strong> below:
          </label>
          <input
            type="text"
            className="input-field"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder="Type DELETE to confirm"
            disabled={isDeleting}
            autoFocus
            style={{
              borderColor: isConfirmed ? '#ef4444' : undefined,
              boxShadow: isConfirmed ? '0 0 8px rgba(239, 68, 68, 0.4)' : undefined,
              fontSize: '13px'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isConfirmed && !isDeleting) {
                e.preventDefault();
                handleDelete();
              }
            }}
          />
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={isDeleting}
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="btn" 
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
            style={{ 
              backgroundColor: isConfirmed ? '#ef4444' : 'rgba(239, 68, 68, 0.25)', 
              color: isConfirmed ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
              cursor: isConfirmed && !isDeleting ? 'pointer' : 'not-allowed',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              padding: '8px 18px',
              fontWeight: '600',
              boxShadow: isConfirmed ? '0 4px 12px rgba(239, 68, 68, 0.35)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            {isDeleting ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Deleting Client...
              </>
            ) : (
              <>
                <Trash2 size={15} /> Permanently Delete Client
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
