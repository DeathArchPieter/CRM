import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Mail, Phone } from 'lucide-react';
import ClientProfileView from './ClientProfileView';

export default function ClientsView() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    preferredName: '',
    email: '',
    phone: '',
    clientStatus: 'Active'
  });

  const loadClients = async () => {
    setLoading(true);
    if (window.electronAPI && window.electronAPI.getClients) {
      const response = await window.electronAPI.getClients();
      if (response.success) {
        setClients(response.data);
      } else {
        console.error("Failed to load clients:", response.error);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    if (window.electronAPI && window.electronAPI.addClient) {
      const response = await window.electronAPI.addClient(formData);
      if (response.success) {
        setIsModalOpen(false);
        setFormData({ fullName: '', preferredName: '', email: '', phone: '', clientStatus: 'Active' });
        loadClients();
      } else {
        console.error("Failed to add client:", response.error);
      }
    }
  };

  const filteredClients = clients.filter(c => 
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (selectedClient) {
    return (
      <ClientProfileView 
        client={selectedClient} 
        onBack={() => {
          setSelectedClient(null);
          loadClients();
        }} 
      />
    );
  }

  return (
    <div className="view-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '28px', marginBottom: '4px' }}>Clients</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your database and policy holdings.</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Add Client
        </button>
      </header>

      {/* Search Bar */}
      <div style={{ marginBottom: '24px', position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          className="input-field" 
          style={{ width: '100%', paddingLeft: '48px', maxWidth: '400px' }} 
          placeholder="Search clients..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Clients List */}
      <div className="glass-panel" style={{ flex: 1, padding: '0', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading database...</div>
        ) : filteredClients.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Users size={48} color="var(--border-light)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '8px' }}>No clients found</h3>
            <p style={{ color: 'var(--text-muted)' }}>Get started by adding your first client.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '500' }}>Name</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '500' }}>Contact</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '500' }}>Status</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '500' }}>Added</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(client => (
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
                      backgroundColor: client.clientStatus === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.1)',
                      color: client.clientStatus === 'Active' ? 'var(--accent-success)' : 'var(--text-muted)'
                    }}>
                      {client.clientStatus}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>
                    {new Date(client.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
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
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Email</label>
                  <input type="email" name="email" className="input-field" style={{ width: '100%' }} value={formData.email} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Phone</label>
                  <input type="tel" name="phone" className="input-field" style={{ width: '100%' }} value={formData.phone} onChange={handleInputChange} />
                </div>
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
