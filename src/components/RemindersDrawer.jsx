import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, X, CheckCircle2, Clock, Calendar, AlertTriangle, 
  MessageCircle, Phone, ArrowUpRight, ChevronDown, Sparkles, 
  ExternalLink, Check, Volume2, ShieldAlert
} from 'lucide-react';
import { useToast } from './Toast';

export default function RemindersDrawer({ isOpen, onClose, onSelectClient, onNavigateTab }) {
  const { addToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'overdue' | 'today' | 'upcoming'
  const [activeSnoozeId, setActiveSnoozeId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [testingNotif, setTestingNotif] = useState(false);
  const drawerRef = useRef(null);

  const loadTasks = async () => {
    if (!window.electronAPI?.getAllTasks) return;
    try {
      setLoading(true);
      const res = await window.electronAPI.getAllTasks();
      if (res.success && Array.isArray(res.data)) {
        setTasks(res.data);
      }
    } catch (err) {
      console.error('Failed to load reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTasks();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (isOpen && drawerRef.current && !drawerRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose]);

  // Helper to categorize task
  const categorizeTask = (task) => {
    if (!task.dueDate) return { status: 'no_date', label: 'No Deadline', isOverdue: false, isToday: false, isUpcoming: false };
    
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const taskDate = task.dueDate;

    if (taskDate < todayStr) {
      const diffDays = Math.round((now - new Date(taskDate)) / (1000 * 60 * 60 * 24));
      return {
        status: 'overdue',
        label: diffDays > 0 ? `Overdue by ${diffDays}d` : 'Overdue',
        isOverdue: true,
        isToday: false,
        isUpcoming: false,
        color: '#f87171'
      };
    }

    if (taskDate === todayStr) {
      if (task.dueTime) {
        const [h, m] = task.dueTime.split(':').map(Number);
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const taskMins = h * 60 + m;
        const diffMins = taskMins - currentMins;

        if (diffMins < 0) {
          return {
            status: 'overdue',
            label: `Overdue (${Math.abs(diffMins)}m ago)`,
            isOverdue: true,
            isToday: true,
            isUpcoming: false,
            color: '#f87171'
          };
        } else if (diffMins <= 60) {
          return {
            status: 'due_soon',
            label: `In ${diffMins} mins (${task.dueTime})`,
            isOverdue: false,
            isToday: true,
            isUpcoming: false,
            color: '#fbbf24'
          };
        } else {
          return {
            status: 'today',
            label: `Today at ${task.dueTime}`,
            isOverdue: false,
            isToday: true,
            isUpcoming: false,
            color: '#38bdf8'
          };
        }
      }
      return {
        status: 'today',
        label: 'Today',
        isOverdue: false,
        isToday: true,
        isUpcoming: false,
        color: '#38bdf8'
      };
    }

    // Future
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const in48hStr = `${in48h.getFullYear()}-${String(in48h.getMonth() + 1).padStart(2, '0')}-${String(in48h.getDate()).padStart(2, '0')}`;
    const isUpcoming = taskDate <= in48hStr;

    return {
      status: isUpcoming ? 'upcoming' : 'future',
      label: `Due ${task.dueDate}${task.dueTime ? ` at ${task.dueTime}` : ''}`,
      isOverdue: false,
      isToday: false,
      isUpcoming,
      color: isUpcoming ? '#34d399' : 'var(--text-muted)'
    };
  };

  const overdueList = tasks.filter(t => categorizeTask(t).isOverdue);
  const todayList = tasks.filter(t => categorizeTask(t).isToday && !categorizeTask(t).isOverdue);
  const upcomingList = tasks.filter(t => categorizeTask(t).isUpcoming);

  const displayedTasks = tasks.filter(t => {
    const cat = categorizeTask(t);
    if (filter === 'overdue') return cat.isOverdue;
    if (filter === 'today') return cat.isToday;
    if (filter === 'upcoming') return cat.isUpcoming;
    return true;
  }).sort((a, b) => {
    const catA = categorizeTask(a);
    const catB = categorizeTask(b);
    if (catA.isOverdue && !catB.isOverdue) return -1;
    if (!catA.isOverdue && catB.isOverdue) return 1;
    if (catA.isToday && !catB.isToday) return -1;
    if (!catA.isToday && catB.isToday) return 1;
    return new Date(a.dueDate || '9999') - new Date(b.dueDate || '9999');
  });

  const handleComplete = async (task) => {
    setActionLoadingId(task.id);
    try {
      if (window.electronAPI?.updateTask) {
        await window.electronAPI.updateTask({
          id: task.id,
          status: 'Completed'
        });
        addToast(`Completed: "${task.description.slice(0, 32)}..."`, 'success');
        await loadTasks();
      }
    } catch (err) {
      console.error('Failed to complete task:', err);
      addToast('Failed to complete task', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSnooze = async (task, option) => {
    setActionLoadingId(task.id);
    setActiveSnoozeId(null);
    try {
      if (window.electronAPI?.snoozeTask) {
        const res = await window.electronAPI.snoozeTask({
          taskId: task.id,
          option
        });
        if (res.success) {
          const optLabels = {
            '30m': '+30 Minutes',
            '2h': '+2 Hours',
            'tomorrow-9am': 'Tomorrow at 9:00 AM',
            'next-monday-9am': 'Next Monday at 9:00 AM'
          };
          addToast(`Postponed to ${optLabels[option] || 'new time'}`, 'info');
          await loadTasks();
        } else {
          addToast(res.error || 'Failed to snooze', 'error');
        }
      }
    } catch (err) {
      console.error('Failed to snooze task:', err);
      addToast('Failed to snooze task', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleWhatsApp = (task) => {
    if (!task.clientPhone) return;
    const cleanPhone = task.clientPhone.replace(/[^0-9]/g, '');
    const clientName = task.clientPreferredName || task.clientName || 'there';
    let text = `Hi ${clientName}, this is Pieter following up regarding ${task.description}. Let me know if this time works for you!`;
    if (task.type === 'meeting') {
      text = `Hi ${clientName}, looking forward to our meeting regarding ${task.description}${task.location ? ` at ${task.location}` : ''}. Let me know if you need anything beforehand!`;
    }
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCall = (task) => {
    if (!task.clientPhone) return;
    const cleanPhone = task.clientPhone.replace(/[^0-9]/g, '');
    window.open(`tel:${cleanPhone}`, '_self');
  };

  const handleOpenClientProfile = async (task) => {
    onClose();
    if (task.clientId && onSelectClient) {
      if (window.electronAPI?.getClients) {
        const res = await window.electronAPI.getClients();
        if (res.success && res.data) {
          const matched = res.data.find(c => c.id === task.clientId);
          if (matched) {
            onSelectClient(matched);
            return;
          }
        }
      }
    }
    if (onNavigateTab) {
      onNavigateTab('clients');
    }
  };

  const handleTestNotification = async () => {
    setTestingNotif(true);
    try {
      if (window.electronAPI?.testNotification) {
        const res = await window.electronAPI.testNotification();
        if (res.success) {
          addToast('Triggered Windows Desktop notification!', 'success');
        } else {
          addToast(res.error || 'Notifications not supported', 'warning');
        }
      }
    } catch (err) {
      console.error('Test notification failed:', err);
    } finally {
      setTestingNotif(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={drawerRef}
      style={{
        position: 'fixed',
        top: '38px',
        right: '16px',
        width: '440px',
        maxHeight: 'calc(100vh - 60px)',
        backgroundColor: 'rgba(18, 18, 24, 0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.7), 0 0 25px rgba(139, 92, 246, 0.15)',
        borderRadius: '14px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fadeInSlideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 18px',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.08) 0%, transparent 100%)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '8px',
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)'
          }}>
            <Bell size={16} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Reminders & Tasks
              {overdueList.length > 0 && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(239, 68, 68, 0.25)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                  {overdueList.length} Overdue
                </span>
              )}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Continuous notifications for meetings & follow-ups
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={handleTestNotification}
            disabled={testingNotif}
            title="Test Windows OS Desktop Toast Notification"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border-light)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              padding: '4px 8px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Volume2 size={12} color="var(--accent-primary)" />
            <span>Test Toast</span>
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '6px',
        padding: '10px 16px',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderBottom: '1px solid var(--border-light)',
        overflowX: 'auto'
      }}>
        {[
          { id: 'all', label: `All (${tasks.length})` },
          { id: 'overdue', label: `🔴 Overdue (${overdueList.length})`, highlight: overdueList.length > 0 },
          { id: 'today', label: `🟡 Today (${todayList.length})` },
          { id: 'upcoming', label: `🟢 Next 48h (${upcomingList.length})` }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: filter === t.id ? '600' : '500',
              border: filter === t.id ? '1px solid var(--accent-primary)' : '1px solid transparent',
              backgroundColor: filter === t.id ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
              color: filter === t.id ? 'var(--accent-primary)' : (t.highlight ? '#f87171' : 'var(--text-secondary)'),
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Reminder Items List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '9px',
        maxHeight: '440px'
      }}>
        {loading ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            Checking upcoming reminders...
          </div>
        ) : displayedTasks.length === 0 ? (
          <div style={{
            padding: '36px 16px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: 'rgba(52, 211, 153, 0.12)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={22} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
              All clear! No pending reminders
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', maxWidth: '280px', lineHeight: '1.4' }}>
              {filter === 'all'
                ? "You don't have any outstanding tasks, meetings, or follow-ups."
                : `No items matching the "${filter}" filter right now.`}
            </div>
          </div>
        ) : (
          displayedTasks.map(task => {
            const cat = categorizeTask(task);
            const isSnoozeMenuOpen = activeSnoozeId === task.id;
            const isOperating = actionLoadingId === task.id;

            return (
              <div
                key={task.id}
                style={{
                  padding: '11px 12px',
                  borderRadius: '10px',
                  backgroundColor: cat.isOverdue ? 'rgba(239, 68, 68, 0.06)' : 'rgba(255, 255, 255, 0.025)',
                  border: cat.isOverdue ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--border-light)',
                  borderLeft: `3px solid ${cat.color}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  position: 'relative',
                  transition: 'background-color 0.15s'
                }}
              >
                {/* Top Row: Badges & Relative Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {task.type === 'meeting' && (
                      <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(139, 92, 246, 0.2)', color: '#c084fc' }}>
                        📅 Meeting
                      </span>
                    )}
                    {task.type === 'followup' && (
                      <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(6, 182, 212, 0.2)', color: '#38bdf8' }}>
                        📞 Follow-up
                      </span>
                    )}
                    {(!task.type || task.type === 'task') && (
                      <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)' }}>
                        📋 Task
                      </span>
                    )}
                    {task.priority && task.priority !== 'Normal' && (
                      <span style={{
                        fontSize: '9px',
                        fontWeight: '700',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        backgroundColor: task.priority === 'Urgent' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.2)',
                        color: task.priority === 'Urgent' ? '#f87171' : '#fbbf24'
                      }}>
                        {task.priority}
                      </span>
                    )}
                    {task.channel && (
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', backgroundColor: 'rgba(255,255,255,0.04)', padding: '1px 5px', borderRadius: '4px' }}>
                        {task.channel}
                      </span>
                    )}
                  </div>

                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: cat.color,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Clock size={11} />
                    {cat.label}
                  </span>
                </div>

                {/* Main Content: Description & Client Link */}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', lineHeight: '1.4', wordBreak: 'break-word' }}>
                    {task.description}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    <button
                      onClick={() => handleOpenClientProfile(task)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-primary)',
                        padding: 0,
                        cursor: 'pointer',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        textDecoration: 'underline'
                      }}
                      title="Open client profile"
                    >
                      {task.clientName}
                      <ArrowUpRight size={11} />
                    </button>

                    {task.location && (
                      <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                        📍 {task.location}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {/* Mark Done Button */}
                    <button
                      onClick={() => handleComplete(task)}
                      disabled={isOperating}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: 'rgba(52, 211, 153, 0.15)',
                        color: '#34d399',
                        border: '1px solid rgba(52, 211, 153, 0.3)',
                        padding: '4px 9px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      title="Mark complete & auto-log touchpoint"
                    >
                      <Check size={12} />
                      Complete
                    </button>

                    {/* Snooze Trigger Button */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => setActiveSnoozeId(isSnoozeMenuOpen ? null : task.id)}
                        disabled={isOperating}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: '500',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-light)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <Clock size={11} />
                        Snooze
                        <ChevronDown size={11} />
                      </button>

                      {/* Snooze Presets Dropdown */}
                      {isSnoozeMenuOpen && (
                        <div style={{
                          position: 'absolute',
                          bottom: '100%',
                          left: 0,
                          marginBottom: '6px',
                          width: '160px',
                          backgroundColor: 'rgba(24, 24, 32, 0.98)',
                          backdropFilter: 'blur(16px)',
                          border: '1px solid var(--border-light)',
                          borderRadius: '8px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                          padding: '4px',
                          zIndex: 10,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}>
                          {[
                            { id: '30m', label: '+30 Minutes' },
                            { id: '2h', label: '+2 Hours' },
                            { id: 'tomorrow-9am', label: 'Tomorrow 9:00 AM' },
                            { id: 'next-monday-9am', label: 'Next Mon 9:00 AM' },
                          ].map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => handleSnooze(task, opt.id)}
                              style={{
                                textAlign: 'left',
                                padding: '6px 8px',
                                fontSize: '11px',
                                color: 'var(--text-primary)',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                transition: 'background-color 0.1s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.2)'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side contact links */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {task.clientPhone && (
                      <>
                        <button
                          onClick={() => handleWhatsApp(task)}
                          style={{
                            background: 'rgba(37, 211, 102, 0.12)',
                            border: '1px solid rgba(37, 211, 102, 0.25)',
                            color: '#25D366',
                            padding: '4px 7px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px'
                          }}
                          title="Open WhatsApp chat with client"
                        >
                          <MessageCircle size={12} />
                          WhatsApp
                        </button>
                        <button
                          onClick={() => handleCall(task)}
                          style={{
                            background: 'rgba(56, 189, 248, 0.12)',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            color: '#38bdf8',
                            padding: '4px 6px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Call client phone"
                        >
                          <Phone size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div style={{
        padding: '10px 16px',
        backgroundColor: 'rgba(0,0,0,0.25)',
        borderTop: '1px solid var(--border-light)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34d399' }} />
          <span>Desktop Alerts Active</span>
        </div>
        <button
          onClick={() => {
            onClose();
            if (onNavigateTab) onNavigateTab('schedule');
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent-primary)',
            cursor: 'pointer',
            padding: 0,
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px'
          }}
        >
          Open Full Calendar <ExternalLink size={11} />
        </button>
      </div>
    </div>
  );
}
