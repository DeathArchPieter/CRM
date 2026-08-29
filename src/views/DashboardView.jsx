import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, GitBranch, TrendingUp, DollarSign, CheckCircle2, Clock, 
  AlertCircle, Sparkles, RefreshCw, Circle, Trash2, Calendar, 
  Cake, Shield, ChevronRight, Plus, ArrowUpRight, MessageCircle, AlertTriangle 
} from 'lucide-react';
import { useToast } from '../components/Toast';

const fmt = (v) => v ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v) : '$0';

const STAGE_COLORS = {
  'Prospect':       '#a78bfa',
  'Fact Finding':   '#60a5fa',
  'Proposal Sent':  '#fbbf24',
  'Case Submitted': '#fb923c',
  'Case Issued':    '#34d399',
  'Closed/Lost':    '#f87171',
};

const cardStyle = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-light)',
  borderRadius: '14px',
  padding: '20px 24px',
};

const sectionHeadingStyle = {
  fontSize: '13px',
  fontWeight: '600',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '16px',
};

export default function DashboardView({ onNavigateTab, onSelectClient }) {
  const { addToast } = useToast();
  const [clients, setClients] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [calendarTasks, setCalendarTasks] = useState([]);
  const [googleEvents, setGoogleEvents] = useState([]);
  const [googleSettings, setGoogleSettings] = useState(null);
  const [briefing, setBriefing] = useState('');
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [briefingTime, setBriefingTime] = useState(null);
  const [loading, setLoading] = useState(true);

  const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const loadData = async () => {
    if (!window.electronAPI) { setLoading(false); return; }
    try {
      const [cRes, pRes, polRes, tRes, ctRes, gsRes] = await Promise.all([
        window.electronAPI.getClients ? window.electronAPI.getClients() : Promise.resolve({ success: false }),
        window.electronAPI.getPipeline ? window.electronAPI.getPipeline() : Promise.resolve({ success: false }),
        window.electronAPI.getAllPolicies ? window.electronAPI.getAllPolicies() : Promise.resolve({ success: false }),
        window.electronAPI.getAllTasks ? window.electronAPI.getAllTasks() : Promise.resolve({ success: false }),
        window.electronAPI.getCalendarTasks ? window.electronAPI.getCalendarTasks() : Promise.resolve({ success: false }),
        window.electronAPI.getGoogleSettings ? window.electronAPI.getGoogleSettings() : Promise.resolve({ success: false }),
      ]);
      
      if (cRes?.success) setClients(cRes.data || []);
      if (pRes?.success) setPipeline(pRes.data || []);
      if (polRes?.success) setPolicies(polRes.data || []);
      if (tRes?.success) setPendingTasks(tRes.data || []);
      if (ctRes?.success) setCalendarTasks(ctRes.data || []);
      
      if (gsRes?.success && gsRes.data?.connected) {
        setGoogleSettings(gsRes.data);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const timeMin = todayStart.toISOString();
        const timeMax = todayEnd.toISOString();
        
        const geRes = await window.electronAPI.getGoogleEvents({ timeMin, timeMax });
        if (geRes?.success) {
          setGoogleEvents(geRes.events || []);
        }
      } else {
        setGoogleSettings(null);
        setGoogleEvents([]);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadBriefing = async (force = false) => {
    if (!window.electronAPI?.getAiBriefing) return;
    setBriefingLoading(true);
    const res = await window.electronAPI.getAiBriefing(force);
    if (res.success) {
      setBriefing(res.data);
      setBriefingTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } else {
      setBriefing(`Error: ${res.error}`);
    }
    setBriefingLoading(false);
  };

  useEffect(() => {
    loadData();
    loadBriefing(false);
  }, []);

  const handleCompleteTask = async (task) => {
    if (window.electronAPI?.updateTask) {
      await window.electronAPI.updateTask({ id: task.id, status: 'Completed' });
      addToast(`Completed task: "${task.description.slice(0, 30)}..."`, 'success');
      loadData();
    }
  };

  const toggleTaskStatus = async (task) => {
    if (window.electronAPI?.updateTask) {
      const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
      await window.electronAPI.updateTask({ id: task.id, status: newStatus });
      addToast(`Task marked ${newStatus.toLowerCase()}`, 'info');
      loadData();
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.electronAPI?.deleteTask) {
      await window.electronAPI.deleteTask(taskId);
      addToast('Task removed', 'info');
      loadData();
    }
  };

  const getTodayScheduleItems = () => {
    const items = [];
    const today = new Date();
    const todayCrmTasks = calendarTasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), today));
    const syncedEventIds = new Set(calendarTasks.map(t => t.googleEventId).filter(Boolean));

    const todayGoogleEvents = googleEvents.filter(e => {
      if (syncedEventIds.has(e.id)) return false;
      const start = e.start?.dateTime ? new Date(e.start.dateTime) : (e.start?.date ? new Date(e.start.date) : null);
      return start && isSameDay(start, today);
    });

    const todayPipelineCloses = pipeline.filter(c => {
      return c.expectedCloseDate && c.stage !== 'Closed/Lost' && isSameDay(new Date(c.expectedCloseDate), today);
    });

    todayCrmTasks.forEach(t => {
      items.push({
        id: `task-${t.id}`,
        type: 'task',
        time: t.dueTime || null,
        title: t.description,
        completed: t.status === 'Completed',
        color: 'var(--accent-primary)',
        bg: 'rgba(139,92,246,0.12)',
        clientId: t.clientId,
        originalData: t
      });
    });

    todayGoogleEvents.forEach(e => {
      const timeStr = e.start?.dateTime ? new Date(e.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
      items.push({
        id: `google-${e.id}`,
        type: 'google',
        time: timeStr || null,
        title: e.summary || '(No Title)',
        color: 'var(--accent-secondary)',
        bg: 'rgba(6,182,212,0.12)',
        originalData: e
      });
    });

    todayPipelineCloses.forEach(c => {
      items.push({
        id: `pipeline-${c.id}`,
        type: 'pipeline',
        time: null,
        title: `Close: ${c.clientName} (${c.policyName || 'Deal'})`,
        color: 'var(--accent-warning)',
        bg: 'rgba(245,158,11,0.12)',
        clientId: c.clientId,
        originalData: c
      });
    });

    items.sort((a, b) => {
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return a.type.localeCompare(b.type);
    });

    return items;
  };

  /* ── Upcoming Client Milestones (Birthdays & Policy Anniversaries) ── */
  const upcomingMilestones = useMemo(() => {
    const items = [];
    const now = new Date();

    // 1. Birthdays in Next 14 Days
    clients.forEach(c => {
      if (c.dob) {
        const birth = new Date(c.dob);
        if (!isNaN(birth.getTime())) {
          let nextBday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
          if (nextBday < now) {
            nextBday = new Date(now.getFullYear() + 1, birth.getMonth(), birth.getDate());
          }
          const diffDays = Math.ceil((nextBday - now) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 14) {
            const turningAge = nextBday.getFullYear() - birth.getFullYear();
            items.push({
              id: `bday-${c.id}`,
              type: 'birthday',
              title: `${c.fullName}${c.preferredName ? ` ("${c.preferredName}")` : ''}`,
              sub: `Turning ${turningAge} on ${nextBday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (${diffDays === 0 ? 'Today! 🎂' : `in ${diffDays}d`})`,
              date: nextBday,
              diffDays,
              client: c,
              icon: <Cake size={15} color="#ec4899" />,
              badgeColor: '#ec4899',
              badgeBg: 'rgba(236, 72, 153, 0.15)'
            });
          }
        }
      }
    });

    // 2. Policy Inception Anniversaries in Next 30 Days
    policies.forEach(pol => {
      if (pol.inceptionDate) {
        const inc = new Date(pol.inceptionDate);
        if (!isNaN(inc.getTime())) {
          let nextAnniv = new Date(now.getFullYear(), inc.getMonth(), inc.getDate());
          if (nextAnniv < now) {
            nextAnniv = new Date(now.getFullYear() + 1, inc.getMonth(), inc.getDate());
          }
          const diffDays = Math.ceil((nextAnniv - now) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 30) {
            const matchedClient = clients.find(cl => cl.id === pol.clientId);
            items.push({
              id: `anniv-${pol.id}`,
              type: 'anniversary',
              title: `${matchedClient ? matchedClient.fullName + ' — ' : ''}${pol.policyName}`,
              sub: `${pol.provider} • Premium: $${Number(pol.premiumAmount || 0).toLocaleString()} (Due ${nextAnniv.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
              date: nextAnniv,
              diffDays,
              client: matchedClient,
              icon: <Shield size={15} color="#38bdf8" />,
              badgeColor: '#38bdf8',
              badgeBg: 'rgba(56, 189, 248, 0.15)'
            });
          }
        }
      }
    });

    items.sort((a, b) => a.diffDays - b.diffDays);
    return items;
  }, [clients, policies]);

  /* ── Derived Metrics ─────────────────────────────────────── */
  const activeClients      = clients.filter(c => c.clientStatus === 'Active');
  const prospectClients    = clients.filter(c => c.clientStatus === 'Prospect');
  const activePipeline     = pipeline.filter(c => c.stage !== 'Closed/Lost');
  const issuedThisMonth    = pipeline.filter(c => {
    if (c.stage !== 'Case Issued') return false;
    const updated = new Date(c.updatedAt || c.createdAt);
    const now     = new Date();
    return updated.getMonth() === now.getMonth() && updated.getFullYear() === now.getFullYear();
  });
  const totalPipelineFYC     = activePipeline.reduce((s, c) => s + (Number(c.estimatedFYC) || 0), 0);
  const totalPipelinePremium = activePipeline.reduce((s, c) => s + (Number(c.estimatedPremium) || 0), 0);
  const issuedFYCThisMonth   = issuedThisMonth.reduce((s, c) => s + (Number(c.estimatedFYC) || 0), 0);

  const recentCases = [...pipeline].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const overdueCases = activePipeline.filter(c => c.expectedCloseDate && new Date(c.expectedCloseDate) < new Date());

  const handleOpenClient = (client) => {
    if (client && onSelectClient) {
      onSelectClient(client);
    } else if (onNavigateTab) {
      onNavigateTab('clients');
    }
  };

  const handleWhatsApp = (phone, name) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(`Hi ${name || 'there'}, wishing you a fantastic day ahead!`);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="view-container animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="view-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Page Header ──────────────────────────────────────── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '24px', margin: 0, fontWeight: '700' }}>Executive Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '2px 0 0 0' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Quick Action Triggers */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn"
            onClick={() => onNavigateTab && onNavigateTab('clients')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}
          >
            <Plus size={13} /> Add Client
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onNavigateTab && onNavigateTab('pipeline')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 14px' }}
          >
            <Plus size={13} /> New Deal
          </button>
        </div>
      </header>

      {/* ── Row 1: 4 Clickable KPI Cards ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <StatCard
          icon={<Users size={18} />} iconColor="#60a5fa"
          label="Active Clients" value={activeClients.length}
          sub={`${prospectClients.length} prospects`}
          onClick={() => onNavigateTab && onNavigateTab('clients')}
        />
        <StatCard
          icon={<GitBranch size={18} />} iconColor="#a78bfa"
          label="Active Pipeline" value={activePipeline.length}
          sub={`${issuedThisMonth.length} issued this month`} subColor="#34d399"
          onClick={() => onNavigateTab && onNavigateTab('pipeline')}
        />
        <StatCard
          icon={<DollarSign size={18} />} iconColor="#fbbf24"
          label="Pipeline FYC" value={fmt(totalPipelineFYC)}
          sub={`${fmt(totalPipelinePremium)} premium`}
          onClick={() => onNavigateTab && onNavigateTab('pipeline')}
        />
        <StatCard
          icon={<TrendingUp size={18} />} iconColor="#34d399"
          label="FYC This Month" value={fmt(issuedFYCThisMonth)}
          sub={`${issuedThisMonth.length} case${issuedThisMonth.length !== 1 ? 's' : ''} issued`} subColor="#34d399"
          onClick={() => onNavigateTab && onNavigateTab('sales')}
        />
      </div>

      {/* ── Row 2: AI Briefing (span 2) + Today's Schedule + Overdue ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>

        {/* AI Briefing */}
        <div style={{
          ...cardStyle,
          background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(6,182,212,0.07) 100%)',
          border: '1px solid rgba(139,92,246,0.25)',
          position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '7px', borderRadius: '9px', background: 'rgba(139,92,246,0.2)', color: '#a78bfa', display: 'flex' }}>
                <Sparkles size={15} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Direction for the Day</div>
                {briefingTime && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Generated at {briefingTime}</div>}
              </div>
            </div>
            <button
              onClick={() => loadBriefing(true)}
              disabled={briefingLoading}
              className="btn"
              style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)', backgroundColor: 'rgba(255,255,255,0.05)', padding: '5px 10px' }}
            >
              <RefreshCw size={11} style={{ animation: briefingLoading ? 'spin 1s linear infinite' : 'none' }} />
              {briefingLoading ? 'Generating…' : 'Refresh'}
            </button>
          </div>
          {briefingLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              {[100, 82, 55].map((w, i) => (
                <div key={i} style={{ height: '12px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', width: `${w}%` }} />
              ))}
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
              {briefing && (briefing.toLowerCase().includes('403') || briefing.toLowerCase().includes('permission_denied') || briefing.toLowerCase().includes('unregistered') || briefing.toLowerCase().includes('leaked') || briefing.startsWith('Error:')) ? (
                <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontSize: '12.5px', fontWeight: '600' }}>
                    <AlertTriangle size={15} /> Gemini API Key Required or Revoked
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Google Gemini returned a permission error (the key was reported leaked or is not configured). Please obtain a free key from Google AI Studio and configure it in Settings.
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => onNavigateTab && onNavigateTab('settings')}
                      className="btn btn-primary"
                      style={{ fontSize: '11px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      ⚙️ Open Settings to Add Key
                    </button>
                    <button
                      onClick={() => loadBriefing(true)}
                      className="btn btn-secondary"
                      style={{ fontSize: '11px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      <RefreshCw size={11} /> Retry Generation
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '13px', lineHeight: '1.75', color: 'var(--text-secondary)', margin: 0 }}>
                  {briefing || 'Click Refresh to generate your daily briefing.'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Today's Schedule */}
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', height: '100%', minHeight: '220px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ ...sectionHeadingStyle, marginBottom: 0 }}>
              <Calendar size={14} color="var(--accent-secondary)" /> Today's Schedule
            </div>
            <button
              onClick={() => onNavigateTab && onNavigateTab('schedule')}
              style={{ background: 'none', border: 'none', color: 'var(--accent-secondary)', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', padding: 0 }}
            >
              View <ChevronRight size={12} />
            </button>
          </div>
          {getTodayScheduleItems().length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '20px 0', gap: '8px' }}>
              <Calendar size={24} color="var(--text-muted)" style={{ opacity: 0.5 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', margin: 0 }}>No events scheduled for today.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '220px', paddingRight: '4px' }}>
              {getTodayScheduleItems().map(item => {
                const isTask = item.type === 'task';
                const isGoogle = item.type === 'google';
                
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-light)',
                      borderLeft: `3px solid ${item.color}`,
                      borderRadius: '8px',
                      transition: 'all 0.15s ease',
                      cursor: item.clientId ? 'pointer' : 'default'
                    }}
                    onClick={() => {
                      if (item.clientId) {
                        const cl = clients.find(c => c.id === item.clientId);
                        if (cl) handleOpenClient(cl);
                      }
                    }}
                  >
                    {isTask && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskStatus(item.originalData);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: item.completed ? 'var(--accent-success)' : 'var(--text-muted)',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          flexShrink: 0
                        }}
                        title={item.completed ? "Mark incomplete" : "Mark complete"}
                      >
                        {item.completed ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                      </button>
                    )}
                    
                    {!isTask && (
                      <div style={{ color: item.color, display: 'flex', flexShrink: 0 }}>
                        {isGoogle ? <Calendar size={14} /> : <GitBranch size={14} />}
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-primary)',
                          fontWeight: '500',
                          textDecoration: item.completed ? 'line-through' : 'none',
                          opacity: item.completed ? 0.6 : 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={item.title}
                      >
                        {item.title}
                      </div>
                      {isTask && item.originalData.clientName && (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {item.originalData.clientName}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: '500',
                        color: 'var(--text-muted)',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        flexShrink: 0
                      }}
                    >
                      {item.time || 'All Day'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Overdue / Needs Attention */}
        <div style={cardStyle}>
          <div style={sectionHeadingStyle}>
            <AlertCircle size={14} color="#fb923c" /> Needs Attention
          </div>
          {overdueCases.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '20px', gap: '10px' }}>
              <CheckCircle2 size={28} color="#34d399" />
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>All cases on track!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '220px' }}>
              {overdueCases.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', backgroundColor: 'rgba(251,146,60,0.05)', border: '1px solid rgba(251,146,60,0.15)', borderRadius: '8px' }}>
                  <AlertCircle size={14} color="#fb923c" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.clientName}</div>
                    <div style={{ fontSize: '11px', color: '#fb923c' }}>{c.stage} · {new Date(c.expectedCloseDate).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Upcoming Milestones (Birthdays & Renewals) + Pending Tasks ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

        {/* Upcoming Client Milestones Widget */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ ...sectionHeadingStyle, marginBottom: 0 }}>
              <Cake size={14} color="#ec4899" /> Upcoming Client Milestones (Next 14 Days)
            </div>
            {upcomingMilestones.length > 0 && (
              <span style={{ fontSize: '11px', backgroundColor: 'rgba(236,72,153,0.15)', color: '#ec4899', borderRadius: '10px', padding: '2px 8px', fontWeight: '600' }}>
                {upcomingMilestones.length} Trigger{upcomingMilestones.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {upcomingMilestones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
              No client birthdays or policy anniversaries in the next 14 days.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '230px', overflowY: 'auto', paddingRight: '4px' }}>
              {upcomingMilestones.map(m => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: m.badgeBg, color: m.badgeColor, display: 'flex', flexShrink: 0 }}>
                      {m.icon}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div 
                        style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', cursor: m.client ? 'pointer' : 'default', textDecoration: m.client ? 'underline' : 'none', textDecorationColor: 'transparent', transition: 'text-decoration-color 0.15s' }}
                        onClick={() => m.client && handleOpenClient(m.client)}
                        onMouseEnter={e => { if (m.client) e.currentTarget.style.textDecorationColor = 'var(--accent-primary)'; }}
                        onMouseLeave={e => { if (m.client) e.currentTarget.style.textDecorationColor = 'transparent'; }}
                      >
                        {m.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {m.sub}
                      </div>
                    </div>
                  </div>

                  {m.client?.phone && (
                    <button
                      onClick={() => handleWhatsApp(m.client.phone, m.client.preferredName || m.client.fullName)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#25D366',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        backgroundColor: 'rgba(37, 211, 102, 0.1)'
                      }}
                      title="Send WhatsApp Greeting"
                    >
                      <MessageCircle size={13} /> Touchpoint
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Tasks */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ ...sectionHeadingStyle, marginBottom: 0 }}>
              <CheckCircle2 size={14} color="#34d399" />
              Pending Tasks
            </div>
            {pendingTasks.length > 0 && (
              <span style={{ fontSize: '11px', backgroundColor: 'rgba(239,68,68,0.15)', color: '#f87171', borderRadius: '10px', padding: '2px 8px', fontWeight: '600' }}>
                {pendingTasks.length} open
              </span>
            )}
          </div>
          {pendingTasks.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '20px', gap: '10px' }}>
              <CheckCircle2 size={28} color="#34d399" />
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>All tasks completed!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '230px', overflowY: 'auto' }}>
              {pendingTasks.map(task => (
                <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '9px 10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <button
                    onClick={() => handleCompleteTask(task)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginTop: '1px', flexShrink: 0, padding: 0 }}
                    title="Mark complete"
                  >
                    <Circle size={15} />
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', wordBreak: 'break-word' }}>{task.description}</div>
                    <div style={{ fontSize: '11px', color: '#a78bfa', marginTop: '2px' }}>{task.clientName}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', opacity: 0.4, flexShrink: 0, padding: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.opacity = '1'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.opacity = '0.4'; }}
                    title="Delete task"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

/* ─── Stat Card ─────────────────────────────────────────────── */
function StatCard({ icon, iconColor, label, value, sub, subColor = 'var(--text-muted)', onClick }) {
  return (
    <div 
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-light)',
        borderRadius: '14px',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.2s, transform 0.2s',
      }}
      onClick={onClick}
      onMouseEnter={e => { 
        if (onClick) {
          e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; 
          e.currentTarget.style.transform = 'translateY(-2px)'; 
        }
      }}
      onMouseLeave={e => { 
        if (onClick) {
          e.currentTarget.style.borderColor = 'var(--border-light)'; 
          e.currentTarget.style.transform = 'translateY(0)'; 
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ padding: '8px', backgroundColor: `${iconColor}1a`, borderRadius: '9px', color: iconColor, display: 'inline-flex' }}>
          {icon}
        </div>
        {onClick && (
          <ArrowUpRight size={14} color="var(--text-muted)" />
        )}
      </div>
      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: '1.1', marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '11.5px', color: subColor }}>{sub}</div>
    </div>
  );
}
