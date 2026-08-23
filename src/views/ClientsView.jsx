import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Mail, Phone, Calendar, Clock, AlertTriangle, Shield, CheckCircle2, UserCheck } from 'lucide-react';
import ClientProfileView from './ClientProfileView';
import ClientFinancialPlanView from './ClientFinancialPlanView';
import AddressAutocomplete from '../components/AddressAutocomplete';

export function getEngagementStatus(client) {
  const lastDateStr = client.lastContactedAt || client.createdAt;
  if (!lastDateStr) return { label: 'No Contact Data', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)', days: 999, key: 'overdue' };
  
  const lastDate = new Date(lastDateStr);
  const diffTime = Math.abs(new Date() - lastDate);
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (days <= 30) {
    return { label: days === 0 ? 'Contacted today' : `${days}d ago`, color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)', days, key: 'active' };
  } else if (days <= 90) {
    return { label: `${days}d ago (Due)`, color: '#fbbf24', bg: 'rgba(234, 179, 8, 0.15)', days, key: 'due' };
  } else {
    return { label: `${days}d ago (Overdue)`, color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', days, key: 'overdue' };
  }
}

export default function ClientsView() {
  const [clients, setClients] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSubView, setClientSubView] = useState('profile'); // 'profile' | 'financial-plan'
  const [engagementFilter, setEngagementFilter] = useState('all'); // 'all' | 'active' | 'due' | 'overdue'

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    preferredName: '',
    companyName: '',
    jobTitle: '',
    email: '',
    phone: '',
    address: '',
    clientStatus: 'Active'
  });

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

  const handleAddClient = async (e) => {
    e.preventDefault();
    if (window.electronAPI && window.electronAPI.addClient) {
      const response = await window.electronAPI.addClient({
        ...formData,
        lastContactedAt: new Date().toISOString()
      });
      if (response.success) {
        setIsModalOpen(false);
        setFormData({ fullName: '', preferredName: '', companyName: '', jobTitle: '', email: '', phone: '', address: '', clientStatus: 'Active' });
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
      (c.phone && c.phone.includes(searchTerm));
    
    if (!matchesSearch) return false;

    const eng = getEngagementStatus(c);
    if (engagementFilter === 'active') return eng.key === 'active';
    if (engagementFilter === 'due') return eng.key === 'due';
    if (engagementFilter === 'overdue') return eng.key === 'overdue';
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
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '28px', marginBottom: '4px' }}>Clients & Portfolio</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage client relationships, engagement recency, and policy portfolios.</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Add Client
        </button>
      </header>

      {/* Policy Renewals & Premium Due Banner */}
      {upcomingRenewals.length > 0 && (
        <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px', borderRadius: '12px', borderLeft: '4px solid #fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(234, 179, 8, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={20} color="#fbbf24" />
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>
                {upcomingRenewals.length} Policy {upcomingRenewals.length === 1 ? 'Anniversary' : 'Anniversaries'} / Renewals Upcoming (Next 30 Days)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Check client profiles to perform annual financial reviews & premium updates.
              </div>
            </div>
          </div>
          <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '12px', backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#fbbf24', fontWeight: '500' }}>
            {upcomingRenewals.length} Action Needed
          </span>
        </div>
      )}

      {/* Search & Engagement Filter Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="input-field" 
            style={{ width: '100%', paddingLeft: '48px' }} 
            placeholder="Search clients by name, email, phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Engagement Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            className={`btn ${engagementFilter === 'all' ? 'btn-primary' : ''}`} 
            style={{ fontSize: '13px', padding: '8px 14px', backgroundColor: engagementFilter === 'all' ? undefined : 'rgba(255,255,255,0.05)', color: engagementFilter === 'all' ? undefined : 'var(--text-secondary)' }}
            onClick={() => setEngagementFilter('all')}
          >
            All ({clients.length})
          </button>
          <button 
            className={`btn ${engagementFilter === 'active' ? 'btn-primary' : ''}`} 
            style={{ fontSize: '13px', padding: '8px 14px', backgroundColor: engagementFilter === 'active' ? undefined : 'rgba(255,255,255,0.05)', color: engagementFilter === 'active' ? undefined : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setEngagementFilter('active')}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34d399' }}></span>
            Active ({counts.active})
          </button>
          <button 
            className={`btn ${engagementFilter === 'due' ? 'btn-primary' : ''}`} 
            style={{ fontSize: '13px', padding: '8px 14px', backgroundColor: engagementFilter === 'due' ? undefined : 'rgba(255,255,255,0.05)', color: engagementFilter === 'due' ? undefined : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setEngagementFilter('due')}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fbbf24' }}></span>
            Due ({counts.due})
          </button>
          <button 
            className={`btn ${engagementFilter === 'overdue' ? 'btn-primary' : ''}`} 
            style={{ fontSize: '13px', padding: '8px 14px', backgroundColor: engagementFilter === 'overdue' ? undefined : 'rgba(255,255,255,0.05)', color: engagementFilter === 'overdue' ? undefined : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setEngagementFilter('overdue')}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f87171' }}></span>
            Overdue ({counts.overdue})
          </button>
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
            <p style={{ color: 'var(--text-muted)' }}>Try adjusting your search query or engagement filter.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '500' }}>Name</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '500' }}>Contact Info</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '500' }}>Engagement Recency</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '500' }}>Status</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '500' }}>Policies</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(client => {
                const eng = getEngagementStatus(client);
                const clientPoliciesCount = policies.filter(p => p.clientId === client.id).length;
                return (
                  <tr 
                    key={client.id} 
                    style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => setSelectedClient(client)}
                  >
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{client.fullName}</div>
                      {client.preferredName && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>"{client.preferredName}"</div>}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        <Mail size={14} /> {client.email || '-'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                        <Phone size={14} /> {client.phone || '-'}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '12px', 
                        fontSize: '11px',
                        fontWeight: '500',
                        backgroundColor: eng.bg,
                        color: eng.color,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Clock size={12} />
                        {eng.label}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '12px', 
                        fontSize: '11px',
                        backgroundColor: client.clientStatus === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.1)',
                        color: client.clientStatus === 'Active' ? 'var(--accent-success)' : 'var(--text-muted)'
                      }}>
                        {client.clientStatus}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Shield size={14} color="var(--accent-blue)" />
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
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '32px', animation: 'fadeIn 0.2s ease-out' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '24px', color: 'var(--text-primary)' }}>Add New Client</h2>
            
            <form onSubmit={handleAddClient}>
              <div style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Full Name *</label>
                <input required type="text" name="fullName" className="input-field" style={{ width: '100%' }} value={formData.fullName} onChange={handleInputChange} />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Preferred Name</label>
                <input type="text" name="preferredName" className="input-field" style={{ width: '100%' }} value={formData.preferredName} onChange={handleInputChange} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Company</label>
                  <input type="text" name="companyName" className="input-field" style={{ width: '100%' }} placeholder="e.g. Acme Corp" value={formData.companyName} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Job Title</label>
                  <input type="text" name="jobTitle" className="input-field" style={{ width: '100%' }} placeholder="e.g. Managing Director" value={formData.jobTitle} onChange={handleInputChange} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Email</label>
                  <input type="email" name="email" className="input-field" style={{ width: '100%' }} value={formData.email} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Phone</label>
                  <input type="tel" name="phone" className="input-field" style={{ width: '100%' }} value={formData.phone} onChange={handleInputChange} />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Address</label>
                <AddressAutocomplete 
                  name="address" 
                  value={formData.address} 
                  onChange={handleInputChange} 
                  placeholder="Search Singapore postal code (e.g. 048581), street, or building..."
                />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Status</label>
                <select name="clientStatus" className="input-field" style={{ width: '100%' }} value={formData.clientStatus} onChange={handleInputChange}>
                  <option value="Prospect">Prospect</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
