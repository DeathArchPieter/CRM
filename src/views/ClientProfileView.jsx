import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Shield, User, Briefcase, Edit2, Trash2, CheckCircle2, Circle, RefreshCw } from 'lucide-react';

const COVERAGE_MAP = {
  'Life': ['Death', 'TPD', 'Early CI', 'Major CI'],
  'Term': ['Death', 'TPD', 'Early CI', 'Major CI'],
  'A&H': ['ADD', 'AMR', 'WI', "Women's CI"],
  'Shield': ['Hospital Expenses'],
  'HI': ['Income benefit per day'],
  'ILP': ['Death', 'TPD', 'Early CI', 'Major CI'],
  'Endowment': ['Death', 'TPD'],
  'LTC': ['Disability Income'],
  'Disability Income': ['Benefit per month']
};

export default function ClientProfileView({ client, onBack }) {
  const [currentClient, setCurrentClient] = useState(client);
  const [policies, setPolicies] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskDueTime, setNewTaskDueTime] = useState('');
  const [newTaskDueEndTime, setNewTaskDueEndTime] = useState('');
  const [newTaskLocation, setNewTaskLocation] = useState('');
  const [remarksText, setRemarksText] = useState(client.notes || '');
  const [isSavingRemarks, setIsSavingRemarks] = useState(false);
  const [aiInsights, setAiInsights] = useState('');
  const [insightsLoading, setInsightsLoading] = useState(false);
  
  // Modal states
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  
  // Track if we are editing an existing item
  const [editingPolicyId, setEditingPolicyId] = useState(null);

  const initialPolicyState = {
    policyName: '',
    policyNumber: '',
    provider: 'AIA',
    policyType: 'Life',
    status: 'In Force',
    premiumAmount: '',
    premiumFrequency: 'Annually',
    coverages: {},
    inceptionDate: '',
    notes: ''
  };

  const [policyData, setPolicyData] = useState(initialPolicyState);
  const [clientData, setClientData] = useState({ ...currentClient });

  const loadData = async () => {
    setLoading(true);
    if (window.electronAPI) {
      if (window.electronAPI.getPolicies) {
        const pRes = await window.electronAPI.getPolicies(currentClient.id);
        if (pRes.success) setPolicies(pRes.data);
      }
      if (window.electronAPI.getTasks) {
        const tRes = await window.electronAPI.getTasks(currentClient.id);
        if (tRes.success) setTasks(tRes.data);
      }
    }
    setLoading(false);
  };

  const loadAiInsights = async (force = false) => {
    console.log("loadAiInsights called, force:", force);
    if (!window.electronAPI) {
      console.warn("window.electronAPI is not available (running in browser?)");
      setAiInsights("Running in browser environment. Electron API is not available.");
      return;
    }
    if (!window.electronAPI.getClientAiInsights) {
      console.warn("electronAPI.getClientAiInsights is undefined. Did you restart Electron?");
      setAiInsights("getClientAiInsights API is undefined. Please stop and restart the Electron application.");
      return;
    }
    setInsightsLoading(true);
    try {
      console.log("Invoking getClientAiInsights IPC for client ID:", currentClient.id);
      const res = await window.electronAPI.getClientAiInsights(currentClient.id, force);
      console.log("IPC Response received:", res);
      if (res.success) {
        setAiInsights(res.data);
      } else {
        setAiInsights(`Error generating insights: ${res.error}`);
      }
    } catch (err) {
      console.error("IPC call failed:", err);
      setAiInsights(`Error invoking AI: ${err.message}`);
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleSaveRemarks = async () => {
    console.log("handleSaveRemarks called, remarksText:", remarksText);
    if (!window.electronAPI?.updateClient) {
      console.warn("window.electronAPI.updateClient is not available");
      return;
    }
    setIsSavingRemarks(true);
    try {
      const res = await window.electronAPI.updateClient({
        ...currentClient,
        notes: remarksText
      });
      console.log("updateClient response:", res);
      if (res.success) {
        setCurrentClient(prev => ({ ...prev, notes: remarksText }));
        await loadAiInsights(false);
      } else {
        console.error("Failed to save remarks:", res.error);
      }
    } catch (err) {
      console.error("Error saving remarks:", err);
    } finally {
      setIsSavingRemarks(false);
    }
  };

  useEffect(() => {
    loadData();
    loadAiInsights(false);
  }, [currentClient.id]);

  useEffect(() => {
    setRemarksText(currentClient.notes || '');
  }, [currentClient.notes]);

  // Task Handlers
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    if (window.electronAPI?.addTask) {
      const res = await window.electronAPI.addTask({ 
        clientId: currentClient.id, 
        description: newTaskText,
        dueDate: newTaskDueDate || null,
        dueTime: newTaskDueTime || null,
        dueEndTime: newTaskDueEndTime || null,
        location: newTaskLocation.trim() || ''
      });
      if (res.success) {
        setNewTaskText('');
        setNewTaskDueDate('');
        setNewTaskDueTime('');
        setNewTaskDueEndTime('');
        setNewTaskLocation('');
        loadData();
      }
    }
  };

  const toggleTaskStatus = async (task) => {
    if (window.electronAPI?.updateTask) {
      const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
      await window.electronAPI.updateTask({ id: task.id, status: newStatus });
      loadData();
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.electronAPI?.deleteTask) {
      await window.electronAPI.deleteTask(taskId);
      loadData();
    }
  };

  // Policy Handlers
  const handlePolicyInputChange = (e) => {
    setPolicyData({ ...policyData, [e.target.name]: e.target.value });
  };

  const handleCoverageChange = (coverageName, value) => {
    setPolicyData({
      ...policyData,
      coverages: {
        ...policyData.coverages,
        [coverageName]: value
      }
    });
  };

  const handleClientInputChange = (e) => {
    setClientData({ ...clientData, [e.target.name]: e.target.value });
  };

  const openAddPolicy = () => {
    setEditingPolicyId(null);
    setPolicyData(initialPolicyState);
    setIsPolicyModalOpen(true);
  };

  const openEditPolicy = (policy) => {
    setEditingPolicyId(policy.id);
    setPolicyData({
      ...policy,
      coverages: policy.coverages || {}
    });
    setIsPolicyModalOpen(true);
  };

  const handleSavePolicy = async (e) => {
    e.preventDefault();
    if (window.electronAPI) {
      const isEditing = !!editingPolicyId;
      const apiCall = isEditing ? window.electronAPI.updatePolicy : window.electronAPI.addPolicy;
      const payload = isEditing ? { ...policyData } : { ...policyData, clientId: currentClient.id };
      
      const response = await apiCall(payload);
      if (response.success) {
        setIsPolicyModalOpen(false);
        setPolicyData(initialPolicyState);
        setEditingPolicyId(null);
        loadData();
      } else {
        console.error("Failed to save policy:", response.error);
      }
    }
  };

  const handleDeletePolicy = async () => {
    if (window.confirm("Are you sure you want to delete this policy? This action cannot be undone.")) {
      if (window.electronAPI?.deletePolicy) {
        const response = await window.electronAPI.deletePolicy(editingPolicyId);
        if (response.success) {
          setIsPolicyModalOpen(false);
          setEditingPolicyId(null);
          loadData();
        } else {
          console.error("Failed to delete policy:", response.error);
        }
      }
    }
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    if (window.electronAPI?.updateClient) {
      const response = await window.electronAPI.updateClient(clientData);
      if (response.success) {
        setIsClientModalOpen(false);
        setCurrentClient({ ...clientData });
      } else {
        console.error("Failed to update client:", response.error);
      }
    }
  };

  const formatCurrency = (val) => {
    if (!val) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const getFreqLabel = (freq) => {
    if (freq === 'Monthly') return '/Mth';
    if (freq === 'Annually') return '/Yr';
    return '/' + freq.substring(0, 3);
  };

  const expectedCoverages = COVERAGE_MAP[policyData.policyType] || [];

  return (
    <div className="view-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn" style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }} onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-gradient" style={{ fontSize: '28px', marginBottom: '4px' }}>{currentClient.fullName}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {currentClient.clientStatus} Client • Added {new Date(currentClient.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', flex: 1, overflowY: 'auto' }}>
        {/* Left Column - Demographics & Tasks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="var(--accent-primary)" />
              Profile Details
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>Preferred Name</div>
                <div style={{ color: 'var(--text-primary)' }}>{currentClient.preferredName || '-'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>Email</div>
                <div style={{ color: 'var(--text-primary)' }}>{currentClient.email || '-'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>Phone</div>
                <div style={{ color: 'var(--text-primary)' }}>{currentClient.phone || '-'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>Date of Birth</div>
                <div style={{ color: 'var(--text-primary)' }}>{currentClient.dob || '-'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>Address</div>
                <div style={{ color: 'var(--text-primary)' }}>{currentClient.address || '-'}</div>
              </div>
            </div>
            
            <button 
              className="btn" 
              style={{ width: '100%', marginTop: '24px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              onClick={() => {
                setClientData({ ...currentClient });
                setIsClientModalOpen(true);
              }}
            >
              <Edit2 size={16} /> Edit Details
            </button>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="var(--accent-success)" />
              Tasks & Follow-ups
            </h2>

            <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <input 
                type="text" 
                className="input-field" 
                style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }} 
                placeholder="New task description..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                required
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="date" 
                  className="input-field" 
                  style={{ flex: 1, padding: '6px 10px', fontSize: '12px', color: 'var(--text-primary)' }}
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  title="Due Date"
                />
                <input 
                  type="time" 
                  className="input-field" 
                  style={{ width: '70px', padding: '6px 6px', fontSize: '11px', color: 'var(--text-primary)' }}
                  value={newTaskDueTime}
                  onChange={(e) => setNewTaskDueTime(e.target.value)}
                  title="Start Time"
                />
                <input 
                  type="time" 
                  className="input-field" 
                  style={{ width: '70px', padding: '6px 6px', fontSize: '11px', color: 'var(--text-primary)' }}
                  value={newTaskDueEndTime}
                  onChange={(e) => setNewTaskDueEndTime(e.target.value)}
                  title="End Time"
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }} 
                  placeholder="Location / Address (Optional)"
                  value={newTaskLocation}
                  onChange={(e) => setNewTaskLocation(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  <Plus size={14} /> Add
                </button>
              </div>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {tasks.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>No active tasks</div>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className="card hover-row" style={{ padding: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <button 
                      onClick={() => toggleTaskStatus(task)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: task.status === 'Completed' ? 'var(--accent-success)' : 'var(--text-muted)', marginTop: '2px' }}
                    >
                      {task.status === 'Completed' ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                    </button>
                    <div style={{ flex: 1, fontSize: '13px', color: task.status === 'Completed' ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: task.status === 'Completed' ? 'line-through' : 'none', wordBreak: 'break-word' }}>
                      <div>{task.description}</div>
                      {(task.dueDate || task.dueTime || task.location) && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {task.dueDate && `Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                          {task.dueTime && ` at ${task.dueTime}${task.dueEndTime ? ` - ${task.dueEndTime}` : ''}`}
                          {task.location && ` | Loc: ${task.location}`}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => handleDeleteTask(task.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', opacity: 0.5 }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column - Policies */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Remarks & AI Thoughts Panel */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              
              {/* User Remarks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Edit2 size={16} color="var(--accent-primary)" />
                  Your Remarks & Thoughts
                </h3>
                <textarea
                  value={remarksText}
                  onChange={(e) => setRemarksText(e.target.value)}
                  placeholder="Record your own notes or observations about this client here..."
                  style={{
                    flex: 1,
                    minHeight: '120px',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    padding: '12px',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                    resize: 'none'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-light)'}
                />
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ padding: '8px 16px', fontSize: '12px', alignSelf: 'flex-end' }}
                  onClick={handleSaveRemarks}
                  disabled={isSavingRemarks}
                >
                  {isSavingRemarks ? 'Saving...' : 'Save Remarks'}
                </button>
              </div>

              {/* AI Guidance */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '1px solid var(--border-light)', paddingLeft: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={16} color="var(--accent-secondary)" />
                    AI Insights & Guidance
                  </h3>
                  <button
                    type="button"
                    className="btn"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px 8px' }}
                    onClick={() => loadAiInsights(true)}
                    disabled={insightsLoading}
                  >
                    <RefreshCw size={11} style={{ animation: insightsLoading ? 'spin 1s linear infinite' : 'none' }} />
                    {insightsLoading ? 'Analyzing...' : 'Refresh'}
                  </button>
                </div>

                {insightsLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, justifyContent: 'center' }}>
                    {[100, 85, 95, 60].map((w, i) => (
                      <div key={i} style={{ height: '10px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', width: `${w}%` }} />
                    ))}
                  </div>
                ) : aiInsights ? (
                  <div 
                    style={{ 
                      fontSize: '13px', 
                      color: 'var(--text-secondary)', 
                      lineHeight: '1.6', 
                      overflowY: 'auto', 
                      maxHeight: '180px',
                      whiteSpace: 'pre-line' 
                    }}
                  >
                    {aiInsights}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', flex: 1, opacity: 0.5 }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', margin: 0 }}>No AI insights generated yet.</p>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '11px' }}
                      onClick={() => loadAiInsights(false)}
                    >
                      Generate AI Thoughts
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={20} color="var(--accent-secondary)" />
              Policy Portfolio
            </h2>
            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px' }} onClick={openAddPolicy}>
              <Plus size={16} /> Add Policy
            </button>
          </div>

          {loading ? (
            <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading portfolio...</div>
          ) : policies.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Shield size={48} color="var(--border-light)" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '8px' }}>No active policies</h3>
              <p style={{ color: 'var(--text-muted)' }}>Attach an insurance policy to build their portfolio.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {policies.map(policy => (
                <div 
                  key={policy.id} 
                  className="card hover-row" 
                  style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer', position: 'relative' }}
                  onClick={() => openEditPolicy(policy)}
                  title="Click to Edit"
                >
                  <div style={{ position: 'absolute', right: '20px', top: '20px', opacity: 0.5 }}>
                    <Edit2 size={14} color="var(--text-muted)" />
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingRight: '20px' }}>
                    <div>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '10px', 
                        backgroundColor: 'rgba(255,255,255,0.05)', 
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {policy.provider} • {policy.policyType}
                      </span>
                      <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginTop: '8px' }}>
                        {policy.policyName || 'Unnamed Policy'}
                      </h3>
                    </div>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '12px', 
                      fontSize: '11px',
                      backgroundColor: policy.status === 'In Force' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.1)',
                      color: policy.status === 'In Force' ? 'var(--accent-success)' : 'var(--text-muted)'
                    }}>
                      {policy.status}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Policy No: <span style={{ color: 'var(--text-secondary)' }}>{policy.policyNumber || 'Pending'}</span>
                  </div>
                  
                  <div style={{ marginTop: '8px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Premium</div>
                        <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>
                          {formatCurrency(policy.premiumAmount)} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>{getFreqLabel(policy.premiumFrequency)}</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Inception</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                          {policy.inceptionDate ? new Date(policy.inceptionDate).toLocaleDateString() : '-'}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Coverages</div>
                      {(!policy.coverages || Object.keys(policy.coverages).length === 0) ? (
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>None listed</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {Object.entries(policy.coverages).map(([covType, amt]) => {
                            if (!amt) return null; // hide empty coverages
                            return (
                              <div key={covType} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{covType}</span>
                                <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{formatCurrency(amt)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Client Modal */}
      {isClientModalOpen && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '32px', animation: 'fadeIn 0.2s ease-out' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '24px', color: 'var(--text-primary)' }}>Edit Client Profile</h2>
            
            <form onSubmit={handleSaveClient}>
              <div style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Full Name *</label>
                <input required type="text" name="fullName" className="input-field" style={{ width: '100%' }} value={clientData.fullName} onChange={handleClientInputChange} />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Preferred Name</label>
                <input type="text" name="preferredName" className="input-field" style={{ width: '100%' }} value={clientData.preferredName} onChange={handleClientInputChange} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Email</label>
                  <input type="email" name="email" className="input-field" style={{ width: '100%' }} value={clientData.email} onChange={handleClientInputChange} />
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Phone</label>
                  <input type="tel" name="phone" className="input-field" style={{ width: '100%' }} value={clientData.phone} onChange={handleClientInputChange} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Date of Birth</label>
                  <input type="date" name="dob" className="input-field" style={{ width: '100%', color: 'var(--text-primary)' }} value={clientData.dob || ''} onChange={handleClientInputChange} />
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Status</label>
                  <select name="clientStatus" className="input-field" style={{ width: '100%' }} value={clientData.clientStatus} onChange={handleClientInputChange}>
                    <option value="Prospect">Prospect</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              <div style={{ marginBottom: '32px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Address</label>
                <input type="text" name="address" className="input-field" style={{ width: '100%' }} value={clientData.address || ''} onChange={handleClientInputChange} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }} onClick={() => setIsClientModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Policy Modal */}
      {isPolicyModalOpen && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '32px', animation: 'fadeIn 0.2s ease-out', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '24px', color: 'var(--text-primary)' }}>
              {editingPolicyId ? 'Edit Policy' : `Add Policy for ${currentClient.preferredName || currentClient.fullName}`}
            </h2>
            
            <form onSubmit={handleSavePolicy}>
              
              <div style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Policy Name *</label>
                <input required type="text" name="policyName" className="input-field" style={{ width: '100%' }} value={policyData.policyName} onChange={handlePolicyInputChange} placeholder="e.g. AIA Guaranteed Protect Plus" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Provider *</label>
                  <input required type="text" name="provider" className="input-field" style={{ width: '100%' }} value={policyData.provider} onChange={handlePolicyInputChange} placeholder="e.g. AIA" />
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Policy Type *</label>
                  <select name="policyType" className="input-field" style={{ width: '100%' }} value={policyData.policyType} onChange={handlePolicyInputChange}>
                    <option value="Life">Life</option>
                    <option value="Term">Term</option>
                    <option value="A&H">A&H</option>
                    <option value="Shield">Shield</option>
                    <option value="HI">HI</option>
                    <option value="ILP">ILP</option>
                    <option value="Endowment">Endowment</option>
                    <option value="LTC">LTC</option>
                    <option value="Disability Income">Disability Income</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Policy Number</label>
                  <input type="text" name="policyNumber" className="input-field" style={{ width: '100%' }} value={policyData.policyNumber} onChange={handlePolicyInputChange} />
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Status</label>
                  <select name="status" className="input-field" style={{ width: '100%' }} value={policyData.status} onChange={handlePolicyInputChange}>
                    <option value="In Force">In Force</option>
                    <option value="Pending">Pending</option>
                    <option value="Lapsed">Lapsed</option>
                    <option value="Surrendered">Surrendered</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Premium Amount</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }}>$</span>
                    <input type="number" name="premiumAmount" className="input-field" style={{ width: '100%', paddingLeft: '24px' }} value={policyData.premiumAmount} onChange={handlePolicyInputChange} />
                  </div>
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Premium Frequency</label>
                  <select name="premiumFrequency" className="input-field" style={{ width: '100%' }} value={policyData.premiumFrequency} onChange={handlePolicyInputChange}>
                    <option value="Annually">Annually</option>
                    <option value="Semi-Annually">Semi-Annually</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Coverages Section */}
              <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Policy Coverages</h3>
                
                {expectedCoverages.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No specific coverages defined for this plan type.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {expectedCoverages.map(coverageName => (
                      <div key={coverageName}>
                        <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>{coverageName}</label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }}>$</span>
                          <input 
                            type="number" 
                            className="input-field" 
                            style={{ width: '100%', paddingLeft: '24px' }} 
                            value={policyData.coverages[coverageName] || ''} 
                            onChange={(e) => handleCoverageChange(coverageName, e.target.value)} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Inception Date</label>
                <input type="date" name="inceptionDate" className="input-field" style={{ width: '100%', color: 'var(--text-primary)' }} value={policyData.inceptionDate || ''} onChange={handlePolicyInputChange} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {editingPolicyId && (
                    <button type="button" className="btn" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleDeletePolicy}>
                      <Trash2 size={16} /> Delete
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" className="btn" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }} onClick={() => setIsPolicyModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingPolicyId ? 'Update Policy' : 'Save Policy'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
