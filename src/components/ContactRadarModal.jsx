import React, { useState } from 'react';
import { 
  Sparkles, X, UserPlus, Users, Briefcase, TrendingUp, 
  Calendar, MapPin, Mail, CheckCircle2, EyeOff, Search, 
  ArrowRight, ShieldCheck, HelpCircle, Edit2, AlertCircle 
} from 'lucide-react';

export default function ContactRadarModal({
  isOpen,
  onClose,
  unmatchedContacts = [],
  onAddToProject100,
  onAddToClients,
  onAddToPipeline,
  onIgnoreContact,
  onIgnoreAll
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNames, setEditingNames] = useState({});
  const [actionLoadingId, setActionLoadingId] = useState(null);

  if (!isOpen) return null;

  const filteredContacts = unmatchedContacts.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = (editingNames[c.id] || c.name || '').toLowerCase().includes(q);
    const emailMatch = (c.email || '').toLowerCase().includes(q);
    const eventMatch = (c.events || []).some(e => (e.summary || '').toLowerCase().includes(q) || (e.location || '').toLowerCase().includes(q));
    return nameMatch || emailMatch || eventMatch;
  });

  const handleNameChange = (id, val) => {
    setEditingNames(prev => ({ ...prev, [id]: val }));
  };

  const getEffectiveName = (contact) => {
    return (editingNames[contact.id] !== undefined ? editingNames[contact.id] : contact.name).trim();
  };

  const handleProject100Click = async (contact) => {
    const finalName = getEffectiveName(contact);
    if (!finalName) return;
    setActionLoadingId(`${contact.id}-p100`);
    try {
      await onAddToProject100({ ...contact, name: finalName });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleClientClick = async (contact) => {
    const finalName = getEffectiveName(contact);
    if (!finalName) return;
    setActionLoadingId(`${contact.id}-client`);
    try {
      await onAddToClients({ ...contact, name: finalName });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePipelineClick = async (contact) => {
    const finalName = getEffectiveName(contact);
    if (!finalName) return;
    setActionLoadingId(`${contact.id}-pipeline`);
    try {
      await onAddToPipeline({ ...contact, name: finalName });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleIgnoreClick = async (contact) => {
    setActionLoadingId(`${contact.id}-ignore`);
    try {
      await onIgnoreContact(contact);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        backgroundColor: 'rgba(0,0,0,0.75)', 
        zIndex: 99999, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backdropFilter: 'blur(6px)',
        padding: '20px'
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="glass-panel animate-fade-in" 
        style={{ 
          width: '100%', 
          maxWidth: '820px', 
          maxHeight: '88vh', 
          display: 'flex', 
          flexDirection: 'column', 
          borderRadius: '16px',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(139, 92, 246, 0.15)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div style={{ 
          padding: '24px 28px', 
          borderBottom: '1px solid var(--border-light)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.6) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.35)'
            }}>
              <Sparkles size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '19px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                  Contact Radar
                </h2>
                <span style={{ 
                  fontSize: '11px', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  backgroundColor: 'rgba(139, 92, 246, 0.2)', 
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  color: '#c084fc', 
                  fontWeight: '600' 
                }}>
                  {unmatchedContacts.length} Unmatched
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Discover contacts from your Google Calendar not yet tracked in your Clients, Project 100, or Pipeline.
              </p>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            style={{ 
              background: 'rgba(255, 255, 255, 0.05)', 
              border: '1px solid var(--border-light)', 
              borderRadius: '8px', 
              color: 'var(--text-muted)', 
              cursor: 'pointer', 
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.color = '#f87171';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div style={{ 
          padding: '14px 28px', 
          borderBottom: '1px solid var(--border-light)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: '16px',
          backgroundColor: 'rgba(15, 23, 42, 0.4)'
        }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Filter by contact name, email, or meeting..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ width: '100%', paddingLeft: '34px', fontSize: '12.5px' }}
            />
          </div>

          {unmatchedContacts.length > 0 && (
            <button 
              type="button"
              className="btn btn-secondary"
              style={{ 
                fontSize: '11.5px', 
                padding: '6px 12px', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px',
                color: 'var(--text-muted)'
              }}
              onClick={() => {
                if (window.confirm(`Ignore and whitelist all ${unmatchedContacts.length} detected contacts? You will not be prompted for them again.`)) {
                  onIgnoreAll();
                }
              }}
            >
              <EyeOff size={13} /> Ignore All Remaining
            </button>
          )}
        </div>

        {/* Contact Cards List */}
        <div style={{ padding: '20px 28px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredContacts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={36} color="var(--accent-success)" style={{ margin: '0 auto 12px auto', opacity: 0.8 }} />
              <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', fontWeight: '600', marginBottom: '6px' }}>
                All Meeting Contacts Identified!
              </h3>
              <p style={{ fontSize: '13px', margin: 0 }}>
                {searchQuery ? 'No contacts matched your search query.' : 'Every person in your active calendar appointments is linked to your CRM portfolio.'}
              </p>
            </div>
          ) : (
            filteredContacts.map(contact => {
              const currentName = editingNames[contact.id] !== undefined ? editingNames[contact.id] : contact.name;
              const primaryEvent = (contact.events && contact.events[0]) || {};
              const eventCount = contact.events ? contact.events.length : 1;

              return (
                <div 
                  key={contact.id} 
                  style={{
                    backgroundColor: 'rgba(30, 41, 59, 0.45)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '12px',
                    padding: '16px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '20px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.35)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
                >
                  {/* Left: Avatar & Contact Details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                    {/* Avatar Badge */}
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(6, 182, 212, 0.25) 100%)',
                      border: '1px solid rgba(139, 92, 246, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '15px',
                      fontWeight: '700',
                      color: '#c084fc',
                      flexShrink: 0
                    }}>
                      {(currentName || 'U').charAt(0).toUpperCase()}
                    </div>

                    {/* Metadata & Inline Editable Name */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="text"
                          value={currentName}
                          onChange={e => handleNameChange(contact.id, e.target.value)}
                          className="input-field"
                          style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            maxWidth: '240px'
                          }}
                          placeholder="Contact Name"
                          title="Click to edit name before adding"
                        />
                        {contact.source === 'attendee' ? (
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', fontWeight: '600' }}>
                            Attendee
                          </span>
                        ) : (
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontWeight: '600' }}>
                            From Title
                          </span>
                        )}
                        {eventCount > 1 && (
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', fontWeight: '600' }}>
                            {eventCount} meetings
                          </span>
                        )}
                      </div>

                      {/* Sub-line: Email & Meeting Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {contact.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                            <Mail size={12} color="var(--accent-secondary)" />
                            <span>{contact.email}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} color="var(--accent-primary)" />
                          <span>
                            {primaryEvent.date ? new Date(primaryEvent.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Scheduled'}
                            {primaryEvent.time ? ` @ ${primaryEvent.time}` : ''}
                          </span>
                        </div>
                        {primaryEvent.summary && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <span>"{primaryEvent.summary}"</span>
                          </div>
                        )}
                        {primaryEvent.location && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <MapPin size={11} />
                            <span>{primaryEvent.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {/* Add to Project 100 */}
                    <button 
                      type="button"
                      className="btn"
                      style={{ 
                        padding: '6px 12px', 
                        fontSize: '11.5px', 
                        backgroundColor: 'rgba(139, 92, 246, 0.12)', 
                        borderColor: 'rgba(139, 92, 246, 0.3)',
                        color: '#c084fc',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                      onClick={() => handleProject100Click(contact)}
                      disabled={actionLoadingId === `${contact.id}-p100`}
                      title="Add as warm prospect into Project 100 with stage 'Meeting Scheduled'"
                    >
                      <Users size={13} />
                      {actionLoadingId === `${contact.id}-p100` ? 'Adding...' : '+ Project 100'}
                    </button>

                    {/* Add to Clients */}
                    <button 
                      type="button"
                      className="btn"
                      style={{ 
                        padding: '6px 12px', 
                        fontSize: '11.5px', 
                        backgroundColor: 'rgba(16, 185, 129, 0.12)', 
                        borderColor: 'rgba(16, 185, 129, 0.3)',
                        color: '#34d399',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                      onClick={() => handleClientClick(contact)}
                      disabled={actionLoadingId === `${contact.id}-client`}
                      title="Create formal Client profile with status 'Prospect'"
                    >
                      <UserPlus size={13} />
                      {actionLoadingId === `${contact.id}-client` ? 'Creating...' : '+ Client'}
                    </button>

                    {/* Add to Pipeline */}
                    <button 
                      type="button"
                      className="btn"
                      style={{ 
                        padding: '6px 12px', 
                        fontSize: '11.5px', 
                        backgroundColor: 'rgba(245, 158, 11, 0.12)', 
                        borderColor: 'rgba(245, 158, 11, 0.3)',
                        color: '#fbbf24',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                      onClick={() => handlePipelineClick(contact)}
                      disabled={actionLoadingId === `${contact.id}-pipeline`}
                      title="Create new deal in Sales Pipeline at 'Prospect' stage"
                    >
                      <TrendingUp size={13} />
                      {actionLoadingId === `${contact.id}-pipeline` ? 'Adding...' : '+ Pipeline'}
                    </button>

                    {/* Ignore / Whitelist */}
                    <button 
                      type="button"
                      className="btn"
                      style={{ 
                        padding: '6px 8px', 
                        fontSize: '11.5px', 
                        backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                        borderColor: 'var(--border-light)',
                        color: 'var(--text-muted)',
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}
                      onClick={() => handleIgnoreClick(contact)}
                      disabled={actionLoadingId === `${contact.id}-ignore`}
                      title="Ignore / Whitelist contact so it never prompts again"
                    >
                      <EyeOff size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div style={{ 
          padding: '16px 28px', 
          borderTop: '1px solid var(--border-light)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          backgroundColor: 'rgba(15, 23, 42, 0.6)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <ShieldCheck size={14} color="var(--accent-secondary)" />
            <span>Ignored contacts are saved to your permanent whitelist and will never prompt again.</span>
          </div>

          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: '6px 16px', fontSize: '13px' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
