import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Plus, Mail, Phone, Clock, AlertTriangle, 
  Shield, Tag, Check, Filter, Calendar, Sparkles, X 
} from 'lucide-react';
import ClientProfileView from './ClientProfileView';
import ClientFinancialPlanView from './ClientFinancialPlanView';
import AddressAutocomplete from '../components/AddressAutocomplete';
import { useToast } from '../components/Toast';

const PRESET_TAGS = ['VIP', 'HNW', 'Doctor', 'Tech', 'Business Owner', 'Young Family', 'Retiree', 'Referral Partner'];

// Engagement recency helper
export function getEngagementStatus(client) {
  const lastContact = client.lastContactedAt ? new Date(client.lastContactedAt) : (client.createdAt ? new Date(client.createdAt) : null);
  if (!lastContact) {
    return { label: 'No Contact', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', days: null, key: 'none' };
  }
  const now = new Date();
  const days = Math.floor((now - lastContact) / (1000 * 60 * 60 * 24));
  
  if (days <= 30) {
    return { label: `${days}d ago (Active)`, color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', days, key: 'active' };
  } else if (days <= 90) {
    return { label: `${days}d ago (Due)`, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', days, key: 'due' };
  } else {
    return { label: `${days}d ago (Overdue)`, color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', days, key: 'overdue' };
  }
}

export default function ClientsView({ initialSelectedClient, onClearInitialClient }) {
  const { addToast } = useToast();
  const [clients, setClients] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(initialSelectedClient || null);
  const [clientSubView, setClientSubView] = useState('profile'); // 'profile' | 'financial-plan'
  const [engagementFilter, setEngagementFilter] = useState('all'); // 'all' | 'active' | 'due' | 'overdue'
  const [selectedTagFilter, setSelectedTagFilter] = useState('all'); // 'all' | tag string

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    preferredName: '',
    companyName: '',
    jobTitle: '',
    email: '',
    phone: '',
    address: '',
    unitNumber: '',
    country: 'Singapore',
    clientStatus: 'Active',
    tags: []
  });

  useEffect(() => {
    if (initialSelectedClient) {
      setSelectedClient(initialSelectedClient);
      if (onClearInitialClient) onClearInitialClient();
    }
  }, [initialSelectedClient, onClearInitialClient]);

  const loadData = async () => {
    setLoading(true);
    if (window.electronAPI) {
      if (window.electronAPI.getClients) {
        const response = await window.electronAPI.getClients();
        if (response.success) {
          setClients(response.data);
        }
      }
      if (window.electronAPI.getAllPolicies) {
        const pResponse = await window.electronAPI.getAllPolicies();
        if (pResponse.success) {
          setPolicies(pResponse.data);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleToggleTagInForm = (tag) => {
    setFormData(prev => {
      const current = prev.tags || [];
      if (current.includes(tag)) {
        return { ...prev, tags: current.filter(t => t !== tag) };
      } else {
        return { ...prev, tags: [...current, tag] };
      }
    });
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    if (window.electronAPI && window.electronAPI.addClient) {
      const response = await window.electronAPI.addClient({
        ...formData,
        lastContactedAt: new Date().toISOString()
      });
      if (response.success) {
        addToast(`Client "${formData.fullName}" added successfully`, 'success');
        setIsModalOpen(false);
        setFormData({ fullName: '', preferredName: '', companyName: '', jobTitle: '', email: '', phone: '', address: '', clientStatus: 'Active', tags: [] });
        loadData();
      } else {
        console.error("Failed to add client:", response.error);
      }
    }
  };

  // Find upcoming policy renewals in the next 30 days
  const now = new Date();
  const upcomingRenewals = policies.filter(p => {
    if (!p.inceptionDate) return false;
    const incDate = new Date(p.inceptionDate);
    const thisYearAnniv = new Date(now.getFullYear(), incDate.getMonth(), incDate.getDate());
    const daysDiff = (thisYearAnniv - now) / (1000 * 60 * 60 * 24);
    return daysDiff >= 0 && daysDiff <= 30;
  });

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.preferredName && c.preferredName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.phone && c.phone.includes(searchTerm));
    
    if (!matchesSearch) return false;

    // Engagement filter
    const eng = getEngagementStatus(c);
    if (engagementFilter === 'active' && eng.key !== 'active') return false;
    if (engagementFilter === 'due' && eng.key !== 'due') return false;
    if (engagementFilter === 'overdue' && eng.key !== 'overdue') return false;

    // Tag filter
    if (selectedTagFilter !== 'all') {
      const cTags = c.tags || [];
      if (!cTags.includes(selectedTagFilter)) return false;
    }

    return true;
  });

  // Calculate engagement counts
  const counts = clients.reduce((acc, c) => {
    const st = getEngagementStatus(c).key;
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, { active: 0, due: 0, overdue: 0 });

  if (selectedClient) {
    if (clientSubView === 'financial-plan') {
      return (
        <ClientFinancialPlanView
          client={selectedClient}
          onBack={() => setClientSubView('profile')}
          onUpdateClient={(updated) => {
            setSelectedClient(updated);
            loadData();
          }}
        />
      );
    }

    return (
      <ClientProfileView 
        client={selectedClient} 
        onBack={() => {
          setSelectedClient(null);
          setClientSubView('profile');
          loadData();
        }}
        onOpenFinancialPlan={(c) => {
          setSelectedClient(c);
          setClientSubView('financial-plan');
        }}
        onUpdateClient={(updated) => {
          setSelectedClient(updated);
          loadData();
        }}
      />
    );
  }

  return (
    <div className="view-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '26px', margin: 0, fontWeight: '700' }}>Clients & Portfolio</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '2px 0 0 0' }}>
            Manage client profiles, policy portfolios, touchpoint frequency, and segmented outreach.
          </p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '7px 14px' }} onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Add Client
        </button>
      </header>

      {/* Policy Renewals & Premium Due Banner */}
      {upcomingRenewals.length > 0 && (
        <div className="glass-panel" style={{ padding: '14px 18px', marginBottom: '20px', borderRadius: '12px', borderLeft: '4px solid #fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(234, 179, 8, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={18} color="#fbbf24" />
            <div>
              <div style={{ fontWeight: '600', fontSize: '13.5px', color: 'var(--text-primary)' }}>
                {upcomingRenewals.length} Policy {upcomingRenewals.length === 1 ? 'Anniversary' : 'Anniversaries'} / Renewals Upcoming (Next 30 Days)
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Open client profiles to conduct annual policy reviews and verify coverage adequacy.
              </div>
            </div>
          </div>
          <span style={{ fontSize: '11.5px', padding: '3px 10px', borderRadius: '12px', backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#fbbf24', fontWeight: '600' }}>
            {upcomingRenewals.length} Action Needed
          </span>
        </div>
      )}

      {/* Search, Engagement & Tag Filter Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '420px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-field" 
              style={{ width: '100%', paddingLeft: '40px', fontSize: '13px' }} 
              placeholder="Search clients by name, preferred name, phone, email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Engagement Filters */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button 
              className={`btn ${engagementFilter === 'all' ? 'btn-primary' : ''}`} 
              style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: engagementFilter === 'all' ? undefined : 'rgba(255,255,255,0.04)', color: engagementFilter === 'all' ? undefined : 'var(--text-secondary)' }}
              onClick={() => setEngagementFilter('all')}
            >
              All ({clients.length})
            </button>
            <button 
              className={`btn ${engagementFilter === 'active' ? 'btn-primary' : ''}`} 
              style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: engagementFilter === 'active' ? undefined : 'rgba(255,255,255,0.04)', color: engagementFilter === 'active' ? undefined : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}
              onClick={() => setEngagementFilter('active')}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#34d399' }}></span>
              Active ({counts.active})
            </button>
            <button 
              className={`btn ${engagementFilter === 'due' ? 'btn-primary' : ''}`} 
              style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: engagementFilter === 'due' ? undefined : 'rgba(255,255,255,0.04)', color: engagementFilter === 'due' ? undefined : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}
              onClick={() => setEngagementFilter('due')}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#fbbf24' }}></span>
              Due ({counts.due})
            </button>
            <button 
              className={`btn ${engagementFilter === 'overdue' ? 'btn-primary' : ''}`} 
              style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: engagementFilter === 'overdue' ? undefined : 'rgba(255,255,255,0.04)', color: engagementFilter === 'overdue' ? undefined : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}
              onClick={() => setEngagementFilter('overdue')}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#f87171' }}></span>
              Overdue ({counts.overdue})
            </button>
          </div>
        </div>

        {/* Tag Segmentation Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
            <Tag size={12} /> Tags:
          </span>
          <button
            onClick={() => setSelectedTagFilter('all')}
            style={{
              padding: '3px 9px',
              borderRadius: '12px',
              border: selectedTagFilter === 'all' ? '1px solid rgba(139,92,246,0.4)' : '1px solid var(--border-light)',
              backgroundColor: selectedTagFilter === 'all' ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
              color: selectedTagFilter === 'all' ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontSize: '11px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            All Tags
          </button>
          {PRESET_TAGS.map(t => {
            const isSelected = selectedTagFilter === t;
            return (
              <button
                key={t}
                onClick={() => setSelectedTagFilter(isSelected ? 'all' : t)}
                style={{
                  padding: '3px 9px',
                  borderRadius: '12px',
                  border: isSelected ? '1px solid rgba(139,92,246,0.4)' : '1px solid var(--border-light)',
                  backgroundColor: isSelected ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                  color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontSize: '11px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clients List Table */}
      <div className="glass-panel" style={{ flex: 1, padding: '0', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading client database...</div>
        ) : filteredClients.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Users size={48} color="var(--border-light)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '8px' }}>No clients match filter</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Try adjusting your search query, engagement status, or tag filter.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500' }}>Name & Tags</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500' }}>Contact Info</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500' }}>Address & Unit</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500' }}>Engagement Recency</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500' }}>Status</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500' }}>Policies</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(client => {
                const eng = getEngagementStatus(client);
                const clientPoliciesCount = policies.filter(p => p.clientId === client.id).length;
                const clientTags = client.tags || [];

                return (
                  <tr 
                    key={client.id} 
                    style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => setSelectedClient(client)}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{client.fullName}</div>
                      {client.preferredName && <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>"{client.preferredName}"</div>}
                      {clientTags.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                          {clientTags.map(tag => (
                            <span key={tag} style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', marginBottom: '3px', fontSize: '12.5px' }}>
                        <Mail size={13} /> {client.email || '-'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                        <Phone size={13} /> {client.phone || '-'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ color: 'var(--text-primary)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '12.5px' }} title={`${client.address || ''} ${client.unitNumber || ''} ${client.country || ''}`}>
                        {client.address || '-'}
                      </div>
                      {(client.unitNumber || (client.country && client.country !== 'Singapore')) && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {client.unitNumber && `${client.unitNumber}, `}{client.country || 'Singapore'}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ 
                        padding: '3px 8px', 
                        borderRadius: '10px', 
                        fontSize: '11px',
                        fontWeight: '500',
                        backgroundColor: eng.bg,
                        color: eng.color,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <Clock size={11} />
                        {eng.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ 
                        padding: '3px 8px', 
                        borderRadius: '10px', 
                        fontSize: '11px',
                        backgroundColor: client.clientStatus === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.06)',
                        color: client.clientStatus === 'Active' ? 'var(--accent-success)' : 'var(--text-muted)'
                      }}>
                        {client.clientStatus}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}>
                        <Shield size={13} color="var(--accent-blue)" />
                        {clientPoliciesCount} {clientPoliciesCount === 1 ? 'Policy' : 'Policies'}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Client Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '560px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '32px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '24px', color: 'var(--text-primary)' }}>Add New Client</h2>
            
            <form onSubmit={handleAddClient} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Full Name *</label>
                  <input type="text" name="fullName" required className="input-field" style={{ width: '100%' }} value={formData.fullName} onChange={handleInputChange} placeholder="e.g. Tan Ah Kow" />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Preferred Name</label>
                  <input type="text" name="preferredName" className="input-field" style={{ width: '100%' }} value={formData.preferredName} onChange={handleInputChange} placeholder="e.g. John" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Company</label>
                  <input type="text" name="companyName" className="input-field" style={{ width: '100%' }} value={formData.companyName} onChange={handleInputChange} placeholder="e.g. DBS Bank" />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Job Title</label>
                  <input type="text" name="jobTitle" className="input-field" style={{ width: '100%' }} value={formData.jobTitle} onChange={handleInputChange} placeholder="e.g. VP, Engineering" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Email</label>
                  <input type="email" name="email" className="input-field" style={{ width: '100%' }} value={formData.email} onChange={handleInputChange} placeholder="john.tan@example.com" />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Phone</label>
                  <input type="text" name="phone" className="input-field" style={{ width: '100%' }} value={formData.phone} onChange={handleInputChange} placeholder="+65 9123 4567" />
                </div>
              </div>

              <div>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Residential / Street Address</label>
                <AddressAutocomplete 
                  name="address" 
                  value={formData.address} 
                  onChange={handleInputChange} 
                  placeholder="Search Singapore postal code (e.g. 048581), street, or building..." 
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Unit Number / Floor</label>
                  <input 
                    type="text" 
                    name="unitNumber" 
                    className="input-field" 
                    style={{ width: '100%' }} 
                    value={formData.unitNumber} 
                    onChange={handleInputChange} 
                    placeholder="e.g. #08-12" 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Country</label>
                  <input 
                    type="text" 
                    name="country" 
                    className="input-field" 
                    style={{ width: '100%' }} 
                    value={formData.country} 
                    onChange={handleInputChange} 
                    placeholder="Singapore" 
                  />
                </div>
              </div>

              {/* Tags Selector */}
              <div>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Client Tags / Segments</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {PRESET_TAGS.map(t => {
                    const isSelected = (formData.tags || []).includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleToggleTagInForm(t)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: isSelected ? '1px solid rgba(139,92,246,0.5)' : '1px solid var(--border-light)',
                          backgroundColor: isSelected ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.03)',
                          color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        {isSelected ? '✓ ' : ''}{t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Client</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
