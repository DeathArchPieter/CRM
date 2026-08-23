import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Users, GitBranch, Shield, LayoutDashboard, Calendar, 
  TrendingUp, DollarSign, FolderKanban, FileText, FlaskConical, 
  Settings, Plus, ArrowRight, CornerDownLeft, Sparkles, X
} from 'lucide-react';

export default function CommandPalette({
  isOpen,
  onClose,
  onNavigateTab,
  onSelectClient,
  onSelectPipelineDeal
}) {
  const [query, setQuery] = useState('');
  const [clients, setClients] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [policies, setAllPolicies] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Load data when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);

      const load = async () => {
        if (window.electronAPI) {
          try {
            const [cRes, pRes, polRes] = await Promise.all([
              window.electronAPI.getClients ? window.electronAPI.getClients() : Promise.resolve({ success: false }),
              window.electronAPI.getPipeline ? window.electronAPI.getPipeline() : Promise.resolve({ success: false }),
              window.electronAPI.getAllPolicies ? window.electronAPI.getAllPolicies() : Promise.resolve({ success: false })
            ]);
            if (cRes?.success) setClients(cRes.data || []);
            if (pRes?.success) setPipeline(pRes.data || []);
            if (polRes?.success) setAllPolicies(polRes.data || []);
          } catch (err) {
            console.error('Failed to load command palette data:', err);
          }
        }
      };
      load();
    }
  }, [isOpen]);

  // App navigation actions
  const navItems = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} />, category: 'Navigation', shortcut: 'View' },
    { id: 'schedule', label: 'Schedule & Calendar', icon: <Calendar size={16} />, category: 'Navigation', shortcut: 'View' },
    { id: 'clients', label: 'Clients & Portfolio', icon: <Users size={16} />, category: 'Navigation', shortcut: 'View' },
    { id: 'pipeline', label: 'Sales Pipeline (Kanban)', icon: <GitBranch size={16} />, category: 'Navigation', shortcut: 'View' },
    { id: 'sales', label: 'Sales Tracking & MDRT Hub', icon: <TrendingUp size={16} />, category: 'Navigation', shortcut: 'View' },
    { id: 'remuneration', label: 'Remuneration & Commission', icon: <DollarSign size={16} />, category: 'Navigation', shortcut: 'View' },
    { id: 'special-projects', label: 'Special Projects & Project 100', icon: <FolderKanban size={16} />, category: 'Navigation', shortcut: 'View' },
    { id: 'special-reports', label: 'Special Reports', icon: <FileText size={16} />, category: 'Navigation', shortcut: 'View' },
    { id: 'product-analysis', label: 'Product Analyser', icon: <FlaskConical size={16} />, category: 'Navigation', shortcut: 'View' },
    { id: 'settings', label: 'Settings & Agency Profile', icon: <Settings size={16} />, category: 'Navigation', shortcut: 'View' }
  ], []);

  // Filtered results
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      // Return top navigation items + quick actions
      return [
        ...navItems.map(item => ({
          ...item,
          action: () => {
            onNavigateTab(item.id);
            onClose();
          }
        }))
      ];
    }

    const matches = [];

    // 1. Match Clients
    clients.forEach(c => {
      const matchScore = 
        (c.fullName && c.fullName.toLowerCase().includes(q)) ||
        (c.preferredName && c.preferredName.toLowerCase().includes(q)) ||
        (c.companyName && c.companyName.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q));

      if (matchScore) {
        matches.push({
          id: `client-${c.id}`,
          title: c.fullName + (c.preferredName ? ` ("${c.preferredName}")` : ''),
          subtitle: `${c.jobTitle ? c.jobTitle + ' • ' : ''}${c.companyName || c.clientStatus || 'Client'}`,
          category: 'Clients',
          icon: <Users size={16} color="var(--accent-primary)" />,
          action: () => {
            if (onSelectClient) onSelectClient(c);
            onClose();
          }
        });
      }
    });

    // 2. Match Pipeline Deals
    pipeline.forEach(p => {
      const matchScore = 
        (p.clientName && p.clientName.toLowerCase().includes(q)) ||
        (p.policyName && p.policyName.toLowerCase().includes(q)) ||
        (p.stage && p.stage.toLowerCase().includes(q));

      if (matchScore) {
        matches.push({
          id: `deal-${p.id}`,
          title: `${p.clientName} — ${p.policyName || 'Deal'}`,
          subtitle: `Stage: ${p.stage} • FYC: $${Number(p.estimatedFYC || 0).toLocaleString()}`,
          category: 'Pipeline Deals',
          icon: <GitBranch size={16} color="#fbbf24" />,
          action: () => {
            if (onSelectPipelineDeal) onSelectPipelineDeal(p);
            else onNavigateTab('pipeline');
            onClose();
          }
        });
      }
    });

    // 3. Match Policies
    policies.forEach(pol => {
      const matchScore = 
        (pol.policyName && pol.policyName.toLowerCase().includes(q)) ||
        (pol.policyNumber && pol.policyNumber.toLowerCase().includes(q)) ||
        (pol.provider && pol.provider.toLowerCase().includes(q));

      if (matchScore) {
        matches.push({
          id: `policy-${pol.id}`,
          title: `${pol.policyName} (${pol.provider})`,
          subtitle: `Policy #${pol.policyNumber || 'N/A'} • Premium: $${Number(pol.premiumAmount || 0).toLocaleString()}`,
          category: 'Policies',
          icon: <Shield size={16} color="var(--accent-secondary)" />,
          action: () => {
            const matchedClient = clients.find(c => c.id === pol.clientId);
            if (matchedClient && onSelectClient) {
              onSelectClient(matchedClient);
            } else {
              onNavigateTab('clients');
            }
            onClose();
          }
        });
      }
    });

    // 4. Match Navigation
    navItems.forEach(n => {
      if (n.label.toLowerCase().includes(q)) {
        matches.push({
          id: `nav-${n.id}`,
          title: n.label,
          subtitle: 'Go to workspace tab',
          category: 'Navigation',
          icon: n.icon,
          action: () => {
            onNavigateTab(n.id);
            onClose();
          }
        });
      }
    });

    return matches.slice(0, 15);
  }, [query, clients, pipeline, policies, navItems, onNavigateTab, onSelectClient, onSelectPipelineDeal, onClose]);

  // Handle Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(results.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(results.length, 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          results[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '620px',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'rgba(18, 18, 28, 0.95)',
          padding: 0
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-light)'
        }}>
          <Search size={20} color="var(--accent-primary)" />
          <input
            ref={inputRef}
            type="text"
            className="input-field"
            style={{
              flex: 1,
              border: 'none',
              backgroundColor: 'transparent',
              padding: '4px 0',
              fontSize: '16px',
              outline: 'none',
              boxShadow: 'none',
              color: 'var(--text-primary)'
            }}
            placeholder="Type a command or search clients, deals, policies..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <span style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--border-light)'
          }}>
            ESC
          </span>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '8px' }}>
          {results.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              No matches found for "{query}"
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                    border: isSelected ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
                    transition: 'all 0.1s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.title || item.label}
                      </div>
                      {item.subtitle && (
                        <div style={{
                          fontSize: '11.5px',
                          color: 'var(--text-muted)',
                          marginTop: '2px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span style={{
                      fontSize: '10.5px',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-muted)'
                    }}>
                      {item.category}
                    </span>
                    {isSelected && (
                      <CornerDownLeft size={14} color="var(--accent-primary)" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 16px',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderTop: '1px solid var(--border-light)',
          fontSize: '11px',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span><strong style={{ color: 'var(--text-secondary)' }}>↑↓</strong> to navigate</span>
            <span><strong style={{ color: 'var(--text-secondary)' }}>↵</strong> to select</span>
            <span><strong style={{ color: 'var(--text-secondary)' }}>esc</strong> to dismiss</span>
          </div>
          <span>Beetsma CRM Quick Search</span>
        </div>
      </div>
    </div>
  );
}
