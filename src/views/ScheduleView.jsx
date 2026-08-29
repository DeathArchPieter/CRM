import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, RefreshCw, 
  Settings, CheckCircle2, Circle, AlertCircle, Plus, Info, 
  Trash2, ExternalLink, ShieldCheck, Link2Off, Edit 
} from 'lucide-react';
import AddressAutocomplete from '../components/AddressAutocomplete';
import { useAdvisorContext } from '../context/AdvisorContext';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ScheduleView() {
  const { setAdvisorContext } = useAdvisorContext();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState(today);

  // Data states
  const [crmTasks, setCrmTasks] = useState([]);
  const [googleEvents, setGoogleEvents] = useState([]);
  const [clients, setClients] = useState([]);
  const [pipelineCases, setPipelineCases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync settings states
  const [googleSettings, setGoogleSettings] = useState({
    clientId: '',
    clientSecret: '',
    email: '',
    connected: false
  });
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncingTasks, setSyncingTasks] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [googleSyncError, setGoogleSyncError] = useState('');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  // Fast task form state
  const [newDesc, setNewDesc] = useState('');

  // Sync with Archie 2.0
  useEffect(() => {
    setAdvisorContext({
      section: 'schedule',
      subSection: null,
      activeSubTab: null,
      entityContext: {
        totalTasks: crmTasks.length,
        isGoogleConnected: googleSettings.connected
      }
    });
  }, [crmTasks.length, googleSettings.connected, setAdvisorContext]);
  const [newClientId, setNewClientId] = useState('');
  const [addingTask, setAddingTask] = useState(false);

  // Client ID & Secret credentials form states
  const [formClientId, setFormClientId] = useState('');
  const [formClientSecret, setFormClientSecret] = useState('');

  // Edit modal states
  const [editingEvent, setEditingEvent] = useState(null);
  const [editForm, setEditForm] = useState({
    id: '',
    summary: '',
    description: '',
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    clientId: '',
    dueDate: '',
    status: 'Pending'
  });
  const [editFormLoading, setEditFormLoading] = useState(false);
  const [editFormError, setEditFormError] = useState('');

  // Quick add toggles
  const [quickAddType, setQuickAddType] = useState('task');
  const [googleQuickStartTime, setGoogleQuickStartTime] = useState('09:00');
  const [googleQuickEndTime, setGoogleQuickEndTime] = useState('10:00');
  const [quickAddTaskTime, setQuickAddTaskTime] = useState('');
  const [quickAddTaskEndTime, setQuickAddTaskEndTime] = useState('');
  const [quickAddTaskLocation, setQuickAddTaskLocation] = useState('');

  const loadData = async () => {
    setLoading(true);
    setGoogleSyncError('');
    try {
      const promises = {
        tasks: window.electronAPI?.getCalendarTasks ? window.electronAPI.getCalendarTasks() : Promise.resolve({ success: false }),
        clients: window.electronAPI?.getClients ? window.electronAPI.getClients() : Promise.resolve({ success: false }),
        settings: window.electronAPI?.getGoogleSettings ? window.electronAPI.getGoogleSettings() : Promise.resolve({ success: false }),
        pipeline: window.electronAPI?.getPipeline ? window.electronAPI.getPipeline() : Promise.resolve({ success: false })
      };

      const keys = Object.keys(promises);
      const resultsArray = await Promise.all(Object.values(promises));
      const results = {};
      keys.forEach((key, idx) => {
        results[key] = resultsArray[idx];
      });

      if (results.tasks?.success) setCrmTasks(results.tasks.data);
      if (results.clients?.success) setClients(results.clients.data);
      if (results.settings?.success) {
        setGoogleSettings(results.settings.data);
        setFormClientId(results.settings.data.clientId);
        setFormClientSecret(results.settings.data.clientSecret);
      }
      if (results.pipeline?.success) setPipelineCases(results.pipeline.data);

      // Fetch Google Calendar events if connected
      if (results.settings?.success && results.settings.data.connected) {
        await loadGoogleEvents(currentYear, currentMonth);
      } else {
        setGoogleEvents([]);
        setGoogleSyncError('');
      }
    } catch (err) {
      console.error('Failed to load schedule data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadGoogleEvents = async (year, month) => {
    if (!window.electronAPI?.getGoogleEvents) return;
    setGoogleSyncError('');
    // Calculate time range for search (buffer of next/prev months)
    const timeMin = new Date(year, month - 1, 1).toISOString();
    const timeMax = new Date(year, month + 2, 0).toISOString();
    
    try {
      const res = await window.electronAPI.getGoogleEvents({ timeMin, timeMax });
      if (res.success) {
        setGoogleEvents(res.events || []);
      } else {
        console.error('Failed to load Google Calendar events:', res.error);
        setGoogleSyncError(res.error || 'Failed to sync with Google Calendar.');
      }
    } catch (err) {
      setGoogleSyncError(err.message || 'Error occurred while syncing with Google Calendar.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update Google events when active month changes
  useEffect(() => {
    if (googleSettings.connected) {
      loadGoogleEvents(currentYear, currentMonth);
    }
  }, [currentYear, currentMonth, googleSettings.connected]);

  // Continuous live background sync & auto-refresh while view is open (every 2 minutes)
  useEffect(() => {
    if (!googleSettings.connected) return;
    const interval = setInterval(() => {
      loadGoogleEvents(currentYear, currentMonth);
    }, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [googleSettings.connected, currentYear, currentMonth]);

  // Calendar Grid builder
  const calendarDays = useMemo(() => {
    const date = new Date(currentYear, currentMonth, 1);
    const days = [];
    const firstDayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const prevMonthDaysCount = new Date(currentYear, currentMonth, 0).getDate();

    // Fill previous month padding days (Monday-first calculation)
    const paddingDays = (firstDayOfWeek === 0) ? 6 : (firstDayOfWeek - 1);
    for (let i = paddingDays - 1; i >= 0; i--) {
      days.push({
        date: new Date(currentYear, currentMonth - 1, prevMonthDaysCount - i),
        isCurrentMonth: false
      });
    }

    // Fill current month days
    const currentMonthDaysCount = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let i = 1; i <= currentMonthDaysCount; i++) {
      days.push({
        date: new Date(currentYear, currentMonth, i),
        isCurrentMonth: true
      });
    }

    // Fill next month padding days
    const remaining = days.length % 7 === 0 ? 0 : 7 - (days.length % 7);
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(currentYear, currentMonth + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Next and Previous Month Traversal
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const handleToday = () => {
    const todayDate = new Date();
    setCurrentYear(todayDate.getFullYear());
    setCurrentMonth(todayDate.getMonth());
    setSelectedDate(todayDate);
  };

  // Google OAuth triggers
  const handleConnectGoogle = async (e) => {
    e.preventDefault();
    if (!formClientId.trim() || !formClientSecret.trim()) {
      setSyncError('Please fill in both Client ID and Client Secret.');
      return;
    }
    setSyncError('');
    setSyncLoading(true);

    if (window.electronAPI?.startGoogleOauth) {
      try {
        const res = await window.electronAPI.startGoogleOauth({
          clientId: formClientId.trim(),
          clientSecret: formClientSecret.trim()
        });
        if (res.success) {
          setIsSyncModalOpen(false);
          await loadData();
        } else {
          setSyncError(res.error || 'Authentication timed out or failed.');
        }
      } catch (err) {
        setSyncError(`Error launching OAuth: ${err.message}`);
      } finally {
        setSyncLoading(false);
      }
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!window.confirm('Disconnect your Google Calendar integration?')) return;
    if (window.electronAPI?.disconnectGoogleCalendar) {
      const res = await window.electronAPI.disconnectGoogleCalendar();
      if (res.success) {
        await loadData();
      }
    }
  };

  const handleSyncAllTasks = async () => {
    if (!window.electronAPI?.syncAllTasks) return;
    setSyncingTasks(true);
    try {
      const res = await window.electronAPI.syncAllTasks();
      if (res.success) {
        alert(`Successfully synced tasks to Google Calendar! (Synced ${res.syncCount} items)`);
        await loadData();
      } else {
        alert(`Failed to sync tasks: ${res.error}`);
      }
    } catch (err) {
      alert(`An error occurred while syncing: ${err.message}`);
    } finally {
      setSyncingTasks(false);
    }
  };

  // Task inline creation from calendar
  const handleAddTaskInline = async (e) => {
    e.preventDefault();
    if (!newDesc.trim() || !newClientId) return;
    setAddingTask(true);
    
    if (window.electronAPI?.addTask) {
      const dueDateString = selectedDate.toISOString().split('T')[0];
      const res = await window.electronAPI.addTask({
        clientId: newClientId,
        description: newDesc.trim(),
        dueDate: dueDateString
      });
      if (res.success) {
        setNewDesc('');
        setNewClientId('');
        // Reload tasks lists
        if (window.electronAPI?.getCalendarTasks) {
          const tasksRes = await window.electronAPI.getCalendarTasks();
          if (tasksRes.success) setCrmTasks(tasksRes.data);
        }
      }
    }
    setAddingTask(false);
  };

  const toggleTaskStatus = async (task) => {
    if (window.electronAPI?.updateTask) {
      const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
      const res = await window.electronAPI.updateTask({ id: task.id, status: newStatus });
      if (res.success) {
        if (window.electronAPI?.getCalendarTasks) {
          const tasksRes = await window.electronAPI.getCalendarTasks();
          if (tasksRes.success) setCrmTasks(tasksRes.data);
        }
      }
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    if (window.electronAPI?.deleteTask) {
      const res = await window.electronAPI.deleteTask(taskId);
      if (res.success) {
        if (window.electronAPI?.getCalendarTasks) {
          const tasksRes = await window.electronAPI.getCalendarTasks();
          if (tasksRes.success) setCrmTasks(tasksRes.data);
        }
      }
    }
  };

  // Filter tasks & events for current day select
  const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const handleScheduleTask = async (taskId, date) => {
    if (!window.electronAPI?.updateTask) return;
    const dueDateString = date.toISOString().split('T')[0];
    const res = await window.electronAPI.updateTask({ id: taskId, dueDate: dueDateString });
    if (res.success) {
      if (window.electronAPI?.getCalendarTasks) {
        const tasksRes = await window.electronAPI.getCalendarTasks();
        if (tasksRes.success) setCrmTasks(tasksRes.data);
      }
    }
  };

  const unscheduledTasks = useMemo(() => {
    return crmTasks.filter(t => !t.dueDate && t.status !== 'Completed');
  }, [crmTasks]);

  const selectedDayData = useMemo(() => {
    if (!selectedDate) return { tasks: [], events: [], pipelineCloses: [] };
    
    const dayTasks = crmTasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), selectedDate));
    
    // Filter out synced Google Calendar events to prevent duplicates
    const syncedEventIds = new Set(crmTasks.map(t => t.googleEventId).filter(Boolean));

    const dayEvents = googleEvents.filter(e => {
      if (syncedEventIds.has(e.id)) return false;
      const start = e.start?.dateTime ? new Date(e.start.dateTime) : (e.start?.date ? new Date(e.start.date) : null);
      return start && isSameDay(start, selectedDate);
    });

    const dayPipelineCloses = pipelineCases.filter(c => {
      return c.expectedCloseDate && c.stage !== 'Closed/Lost' && isSameDay(new Date(c.expectedCloseDate), selectedDate);
    });

    return { tasks: dayTasks, events: dayEvents, pipelineCloses: dayPipelineCloses };
  }, [selectedDate, crmTasks, googleEvents, pipelineCases]);

  // Aggregate stats per day for the calendar grid markers
  const getDayMarkers = (date) => {
    const markers = { pendingTasks: 0, completedTasks: 0, googleEvents: 0, pipelineCloses: 0 };
    
    crmTasks.forEach(t => {
      if (t.dueDate && isSameDay(new Date(t.dueDate), date)) {
        if (t.status === 'Completed') markers.completedTasks++;
        else markers.pendingTasks++;
      }
    });

    // Set of synced Google Event IDs to prevent duplicate count
    const syncedEventIds = new Set(crmTasks.map(t => t.googleEventId).filter(Boolean));

    googleEvents.forEach(e => {
      if (syncedEventIds.has(e.id)) return;
      const start = e.start?.dateTime ? new Date(e.start.dateTime) : (e.start?.date ? new Date(e.start.date) : null);
      if (start && isSameDay(start, date)) {
        markers.googleEvents++;
      }
    });

    pipelineCases.forEach(c => {
      if (c.expectedCloseDate && c.stage !== 'Closed/Lost' && isSameDay(new Date(c.expectedCloseDate), date)) {
        markers.pipelineCloses++;
      }
    });

    return markers;
  };

  const formatTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'All Day';
    const d = new Date(dateTimeStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDayDetails = (date) => {
    const items = [];
    
    crmTasks.forEach(t => {
      if (t.dueDate && isSameDay(new Date(t.dueDate), date)) {
        const timeRange = t.dueTime ? `${t.dueTime}${t.dueEndTime ? ` - ${t.dueEndTime}` : ''}` : null;
        items.push({
          id: `task-${t.id}`,
          type: 'task',
          time: timeRange,
          title: t.description,
          completed: t.status === 'Completed',
          color: 'var(--accent-primary)',
          bg: 'rgba(139,92,246,0.12)',
          originalData: t
        });
      }
    });

    // Set of synced Google Event IDs to prevent duplicates in grid cells
    const syncedEventIds = new Set(crmTasks.map(t => t.googleEventId).filter(Boolean));

    googleEvents.forEach(e => {
      if (syncedEventIds.has(e.id)) return;
      const start = e.start?.dateTime ? new Date(e.start.dateTime) : (e.start?.date ? new Date(e.start.date) : null);
      if (start && isSameDay(start, date)) {
        let timeStr = '';
        if (e.start?.dateTime) {
          const startStr = new Date(e.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          const endStr = e.end?.dateTime ? new Date(e.end.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
          timeStr = endStr ? `${startStr} - ${endStr}` : startStr;
        }
        items.push({
          id: `google-${e.id}`,
          type: 'google',
          time: timeStr || null,
          title: e.summary || '(No Title)',
          color: 'var(--accent-secondary)',
          bg: 'rgba(6,182,212,0.12)',
          originalData: e
        });
      }
    });

    pipelineCases.forEach(c => {
      if (c.expectedCloseDate && c.stage !== 'Closed/Lost' && isSameDay(new Date(c.expectedCloseDate), date)) {
        items.push({
          id: `pipeline-${c.id}`,
          type: 'pipeline',
          time: null,
          title: `Close: ${c.clientName} (${c.policyName})`,
          color: 'var(--accent-warning)',
          bg: 'rgba(245,158,11,0.12)',
          originalData: c
        });
      }
    });

    // Sort items: if they have time, sort by time. Otherwise sort by type.
    items.sort((a, b) => {
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return a.type.localeCompare(b.type);
    });

    return items;
  };

  const handleOpenEdit = (type, item) => {
    setEditFormError('');
    if (type === 'google') {
      const start = item.start?.dateTime ? new Date(item.start.dateTime) : (item.start?.date ? new Date(item.start.date) : new Date());
      const end = item.end?.dateTime ? new Date(item.end.dateTime) : (item.end?.date ? new Date(item.end.date) : new Date(start.getTime() + 3600000));
      
      const dateStr = start.getFullYear() + '-' + String(start.getMonth() + 1).padStart(2, '0') + '-' + String(start.getDate()).padStart(2, '0');
      const startStr = String(start.getHours()).padStart(2, '0') + ':' + String(start.getMinutes()).padStart(2, '0');
      const endStr = String(end.getHours()).padStart(2, '0') + ':' + String(end.getMinutes()).padStart(2, '0');

      setEditForm({
        id: item.id,
        summary: item.summary || '',
        description: item.description || '',
        date: dateStr,
        startTime: startStr,
        endTime: endStr,
        clientId: '',
        dueDate: '',
        status: 'Pending'
      });
    } else {
      setEditForm({
        id: item.id,
        summary: '',
        description: item.description || '',
        date: '',
        startTime: '09:00',
        endTime: '10:00',
        clientId: item.clientId || '',
        dueDate: item.dueDate || '',
        dueTime: item.dueTime || '',
        dueEndTime: item.dueEndTime || '',
        location: item.location || '',
        status: item.status || 'Pending'
      });
    }
    setEditingEvent({ type, data: item });
  };

  const handleSaveEditEvent = async (e) => {
    e.preventDefault();
    setEditFormLoading(true);
    setEditFormError('');

    try {
      if (editingEvent.type === 'google') {
        if (!window.electronAPI?.updateGoogleEvent) {
          throw new Error('Google Calendar write API not available.');
        }

        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const startISO = new Date(`${editForm.date}T${editForm.startTime}:00`).toISOString();
        const endISO = new Date(`${editForm.date}T${editForm.endTime}:00`).toISOString();

        const patchData = {
          summary: editForm.summary.trim(),
          description: editForm.description.trim(),
          start: { dateTime: startISO, timeZone: tz },
          end: { dateTime: endISO, timeZone: tz }
        };

        const res = await window.electronAPI.updateGoogleEvent({
          eventId: editForm.id,
          patchData
        });

        if (res.success) {
          setEditingEvent(null);
          await loadGoogleEvents(currentYear, currentMonth);
        } else {
          setEditFormError(res.error || 'Failed to update Google event.');
        }
      } else {
        if (!window.electronAPI?.updateTask) {
          throw new Error('Task update API not available.');
        }

        const res = await window.electronAPI.updateTask({
          id: editForm.id,
          description: editForm.description.trim(),
          clientId: editForm.clientId,
          dueDate: editForm.dueDate || null,
          dueTime: editForm.dueTime || null,
          dueEndTime: editForm.dueEndTime || null,
          location: editForm.location.trim() || '',
          status: editForm.status
        });

        if (res.success) {
          setEditingEvent(null);
          if (window.electronAPI?.getCalendarTasks) {
            const tasksRes = await window.electronAPI.getCalendarTasks();
            if (tasksRes.success) setCrmTasks(tasksRes.data);
          }
        } else {
          setEditFormError(res.error || 'Failed to update CRM task.');
        }
      }
    } catch (err) {
      setEditFormError(err.message || 'An error occurred while saving.');
    } finally {
      setEditFormLoading(false);
    }
  };

  const handleDeleteGoogleEvent = async () => {
    if (!window.confirm('Are you sure you want to delete this Google Calendar event?')) return;
    setEditFormLoading(true);
    setEditFormError('');

    try {
      if (window.electronAPI?.deleteGoogleEvent) {
        const res = await window.electronAPI.deleteGoogleEvent({ eventId: editForm.id });
        if (res.success) {
          setEditingEvent(null);
          await loadGoogleEvents(currentYear, currentMonth);
        } else {
          setEditFormError(res.error || 'Failed to delete event.');
        }
      }
    } catch (err) {
      setEditFormError(err.message || 'An error occurred while deleting.');
    } finally {
      setEditFormLoading(false);
    }
  };

  const handleQuickAddSubmit = async (e) => {
    e.preventDefault();
    if (!newDesc.trim()) return;
    setAddingTask(true);

    try {
      if (quickAddType === 'task') {
        if (!newClientId) return;
        if (window.electronAPI?.addTask) {
          const dueDateString = selectedDate.toISOString().split('T')[0];
          const res = await window.electronAPI.addTask({
            clientId: newClientId,
            description: newDesc.trim(),
            dueDate: dueDateString,
            dueTime: quickAddTaskTime || null,
            dueEndTime: quickAddTaskEndTime || null,
            location: quickAddTaskLocation.trim() || ''
          });
          if (res.success) {
            setNewDesc('');
            setNewClientId('');
            setQuickAddTaskTime('');
            setQuickAddTaskEndTime('');
            setQuickAddTaskLocation('');
            // Reload tasks lists
            if (window.electronAPI?.getCalendarTasks) {
              const tasksRes = await window.electronAPI.getCalendarTasks();
              if (tasksRes.success) setCrmTasks(tasksRes.data);
            }
          }
        }
      } else {
        if (window.electronAPI?.createGoogleEvent) {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const dateString = selectedDate.toISOString().split('T')[0];
          const startISO = new Date(`${dateString}T${googleQuickStartTime}:00`).toISOString();
          const endISO = new Date(`${dateString}T${googleQuickEndTime}:00`).toISOString();

          const res = await window.electronAPI.createGoogleEvent({
            eventData: {
              summary: newDesc.trim(),
              start: { dateTime: startISO, timeZone: tz },
              end: { dateTime: endISO, timeZone: tz }
            }
          });

          if (res.success) {
            setNewDesc('');
            await loadGoogleEvents(currentYear, currentMonth);
          } else {
            alert(res.error || 'Failed to create Google event.');
          }
        }
      }
    } catch (err) {
      alert(err.message || 'An error occurred during quick add.');
    } finally {
      setAddingTask(false);
    }
  };

  return (
    <div className="view-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Page Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '28px', marginBottom: '4px' }}>Schedule & Calendar</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track CRM actions and Google Calendar events side-by-side.</p>
        </div>
        
        {/* Google Sync Button */}
        <div>
          {googleSettings.connected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 14px', backgroundColor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '20px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-success)' }}></div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Synced: <strong style={{ color: 'var(--text-primary)' }}>{googleSettings.email}</strong>
              </span>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '4px 8px', fontSize: '11px', gap: '4px', backgroundColor: 'rgba(255,255,255,0.03)', display: 'inline-flex', alignItems: 'center' }}
                onClick={handleSyncAllTasks}
                disabled={syncingTasks}
              >
                <RefreshCw size={12} className={syncingTasks ? 'animate-spin' : ''} /> {syncingTasks ? 'Syncing...' : 'Sync Tasks'}
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '4px 8px', fontSize: '11px', gap: '4px', backgroundColor: 'rgba(255,255,255,0.03)' }}
                onClick={handleDisconnectGoogle}
                disabled={syncingTasks}
              >
                <Link2Off size={12} /> Disconnect
              </button>
            </div>
          ) : (
            <button 
              className="btn btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px' }}
              onClick={() => setIsSyncModalOpen(true)}
            >
              <RefreshCw size={14} /> Sync Google Calendar
            </button>
          )}
        </div>
      </header>

      {/* Google Sync Error Banner */}
      {googleSyncError && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '12px 20px', 
          backgroundColor: 'rgba(239,68,68,0.08)', 
          border: '1px solid rgba(239,68,68,0.2)', 
          borderRadius: '8px', 
          marginBottom: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={16} color="#f87171" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '13px', color: '#f87171' }}>
              <strong>Sync Warning:</strong> {googleSyncError}
            </span>
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ 
              padding: '6px 12px', 
              fontSize: '12px', 
              backgroundColor: 'rgba(239,68,68,0.1)', 
              borderColor: 'rgba(239,68,68,0.2)',
              color: '#f87171',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px' 
            }}
            onClick={() => loadGoogleEvents(currentYear, currentMonth)}
          >
            <RefreshCw size={12} /> Retry Sync
          </button>
        </div>
      )}

      {/* Main Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Section - Monthly Calendar Grid */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '24px', height: '100%', overflow: 'hidden' }}>
          
          {/* Calendar Month Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', fontWeight: '600' }}>
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={handleToday}>
                Today
              </button>
              <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={handlePrevMonth}>
                <ChevronLeft size={16} />
              </button>
              <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={handleNextMonth}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday Titles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
            {WEEKDAYS.map(day => (
              <div key={day} style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: '600', padding: '6px 0' }}>
                {day}
              </div>
            ))}
          </div>

          {/* Grid of Days */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '1fr', gap: '4px', flex: 1, overflowY: 'auto' }}>
            {calendarDays.map((dayItem, index) => {
              const isSelected = selectedDate && isSameDay(dayItem.date, selectedDate);
              const isToday = isSameDay(dayItem.date, today);
              const dayItems = getDayDetails(dayItem.date);
              const maxVisible = 4; // Show up to 4 items in cell to avoid overflow
              const visibleItems = dayItems.slice(0, maxVisible);
              const extraCount = dayItems.length - maxVisible;

              return (
                <div
                  key={index}
                  onClick={() => setSelectedDate(dayItem.date)}
                  style={{
                    background: isSelected 
                      ? 'rgba(139,92,246,0.1)' 
                      : (dayItem.isCurrentMonth ? 'rgba(30,41,59,0.3)' : 'rgba(30,41,59,0.1)'),
                    border: isSelected 
                      ? '1px solid var(--accent-primary)' 
                      : (isToday ? '1px solid rgba(6,182,212,0.4)' : '1px solid var(--border-light)'),
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.15s ease',
                    minHeight: '100px',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.borderColor = isToday ? 'rgba(6,182,212,0.4)' : 'var(--border-light)';
                  }}
                >
                  {/* Day number */}
                  <div style={{ 
                    fontSize: '13px', 
                    fontWeight: isToday || isSelected ? '600' : '400',
                    color: isToday 
                      ? 'var(--accent-secondary)' 
                      : (dayItem.isCurrentMonth ? 'var(--text-primary)' : 'var(--text-muted)'),
                    alignSelf: 'flex-start',
                    marginBottom: '4px'
                  }}>
                    {dayItem.date.getDate()}
                  </div>

                  {/* Day items list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflow: 'hidden', flex: 1 }}>
                    {visibleItems.map(item => (
                      <div 
                        key={item.id}
                        title={`${item.time ? `${item.time} ` : ''}${item.title}`}
                        style={{
                          fontSize: '10px',
                          padding: '1px 4px',
                          borderRadius: '4px',
                          backgroundColor: item.bg,
                          color: item.color,
                          borderLeft: `2px solid ${item.color}`,
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          fontWeight: '500',
                          lineHeight: '1.2'
                        }}
                      >
                        {item.time ? `${item.time} ` : ''}{item.title}
                      </div>
                    ))}
                    {extraCount > 0 && (
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '600', paddingLeft: '4px', marginTop: '1px' }}>
                        +{extraCount} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Section - Day Details Drawer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
          
          {/* Day Agenda Panel */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            
            {/* Selected Date Header */}
            <div>
              <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', fontWeight: '600', marginBottom: '2px' }}>
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                {selectedDayData.tasks.length} tasks • {selectedDayData.events.length} events • {selectedDayData.pipelineCloses.length} closes scheduled
              </p>
            </div>

            {/* List Agenda Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto', minHeight: '160px' }}>
              
              {/* Google Events List */}
              {selectedDayData.events.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-secondary)', fontWeight: '600', marginBottom: '10px' }}>
                    Google Events
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedDayData.events.map(event => (
                      <div 
                        key={event.id} 
                        style={{ 
                          padding: '10px 12px', 
                          backgroundColor: 'rgba(6,182,212,0.04)', 
                          borderLeft: '3px solid var(--accent-secondary)', 
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                            {event.summary || '(No Title)'}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Time: {formatTime(event.start?.dateTime || event.start?.date)}{event.end?.dateTime ? ` - ${new Date(event.end.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleOpenEdit('google', event)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', opacity: 0.5, padding: 0 }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-secondary)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                          <Edit size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expected Pipeline Closes List */}
              {selectedDayData.pipelineCloses.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-warning)', fontWeight: '600', marginBottom: '10px' }}>
                    Expected Pipeline Closes
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedDayData.pipelineCloses.map(c => (
                      <div 
                        key={c.id} 
                        style={{ 
                          padding: '10px 12px', 
                          backgroundColor: 'rgba(245,158,11,0.04)', 
                          borderLeft: '3px solid var(--accent-warning)', 
                          borderRadius: '6px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}
                      >
                        <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                          {c.clientName} — {c.policyName}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Stage: {c.stage} | Est. Premium: ${c.estimatedPremium.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CRM Tasks List */}
              {selectedDayData.tasks.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-primary)', fontWeight: '600', marginBottom: '10px' }}>
                    CRM Actions
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedDayData.tasks.map(task => {
                      const isCompleted = task.status === 'Completed';
                      return (
                        <div 
                          key={task.id} 
                          style={{ 
                            padding: '10px 12px', 
                            backgroundColor: isCompleted ? 'rgba(16,185,129,0.04)' : 'rgba(139,92,246,0.04)', 
                            borderLeft: `3px solid ${isCompleted ? 'var(--accent-success)' : 'var(--accent-primary)'}`, 
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px'
                          }}
                        >
                          <button 
                            onClick={() => toggleTaskStatus(task)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: isCompleted ? 'var(--accent-success)' : 'var(--text-muted)', marginTop: '2px', padding: 0 }}
                          >
                            {isCompleted ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                          </button>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              fontSize: '13px', 
                              color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)', 
                              textDecoration: isCompleted ? 'line-through' : 'none',
                              wordBreak: 'break-word' 
                            }}>
                              {task.description}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span>Client: {task.clientName} {task.dueTime ? `| Time: ${task.dueTime}${task.dueEndTime ? ` - ${task.dueEndTime}` : ''}` : ''} {task.location ? `| Loc: ${task.location}` : ''}</span>
                              {task.googleEventId && (
                                <span style={{ fontSize: '8px', backgroundColor: 'rgba(6,182,212,0.12)', color: 'var(--accent-secondary)', padding: '0px 4px', borderRadius: '3px' }} title="Synced to Google Calendar">
                                  Synced
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignSelf: 'center', flexShrink: 0 }}>
                            <button 
                              onClick={() => handleOpenEdit('task', task)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', opacity: 0.5, padding: 0 }}
                              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-primary)'}
                              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                            >
                              <Edit size={13} />
                            </button>
                            <button 
                              onClick={() => handleDeleteTask(task.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', opacity: 0.5, padding: 0 }}
                              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedDayData.tasks.length === 0 && selectedDayData.events.length === 0 && selectedDayData.pipelineCloses.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '24px 0', gap: '8px', opacity: 0.5 }}>
                  <CalendarIcon size={32} color="var(--text-muted)" />
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No actions or events scheduled</span>
                </div>
              )}
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleQuickAddSubmit} style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  Quick Add Calendar Item
                </h3>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button 
                    type="button" 
                    onClick={() => setQuickAddType('task')}
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      background: quickAddType === 'task' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                      color: '#ffffff'
                    }}
                  >
                    CRM Task
                  </button>
                  {googleSettings.connected && (
                    <button 
                      type="button" 
                      onClick={() => setQuickAddType('google')}
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        background: quickAddType === 'google' ? 'var(--accent-secondary)' : 'rgba(255,255,255,0.05)',
                        color: '#ffffff'
                      }}
                    >
                      Google Event
                    </button>
                  )}
                </div>
              </div>

              {quickAddType === 'task' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input 
                    required 
                    type="text" 
                    className="input-field" 
                    placeholder="What needs to be done?" 
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                  />
                  <select 
                    required 
                    className="input-field" 
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
                    value={newClientId}
                    onChange={e => setNewClientId(e.target.value)}
                  >
                    <option value="">— Select Client —</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.fullName}</option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Start Time</span>
                      <input 
                        type="time" 
                        className="input-field" 
                        style={{ width: '100%', padding: '6px 8px', fontSize: '13px' }}
                        value={quickAddTaskTime}
                        onChange={e => setQuickAddTaskTime(e.target.value)}
                      />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>End Time</span>
                      <input 
                        type="time" 
                        className="input-field" 
                        style={{ width: '100%', padding: '6px 8px', fontSize: '13px' }}
                        value={quickAddTaskEndTime}
                        onChange={e => setQuickAddTaskEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Location (Optional)</span>
                      <AddressAutocomplete 
                        value={quickAddTaskLocation} 
                        onChange={e => setQuickAddTaskLocation(e.target.value)} 
                        placeholder="Search venue or address (e.g. 048581, MBFC...)"
                        style={{ padding: '8px 12px 8px 36px', fontSize: '13px' }}
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      style={{ padding: '8px 14px', fontSize: '13px', height: '38px' }}
                      disabled={addingTask || !newClientId || !newDesc.trim()}
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <input 
                    required 
                    type="text" 
                    className="input-field" 
                    placeholder="Event Summary" 
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      required
                      type="time"
                      className="input-field"
                      style={{ flex: 1, padding: '6px 8px', fontSize: '13px' }}
                      value={googleQuickStartTime}
                      onChange={e => setGoogleQuickStartTime(e.target.value)}
                    />
                    <input 
                      required
                      type="time"
                      className="input-field"
                      style={{ flex: 1, padding: '6px 8px', fontSize: '13px' }}
                      value={googleQuickEndTime}
                      onChange={e => setGoogleQuickEndTime(e.target.value)}
                    />
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      style={{ padding: '8px 14px', fontSize: '13px', backgroundColor: 'var(--accent-secondary)', backgroundImage: 'none' }}
                      disabled={addingTask || !newDesc.trim()}
                    >
                      Add Event
                    </button>
                  </div>
                </>
              )}
            </form>

          </div>

          {/* Unscheduled Actions Panel */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '16px', color: 'var(--text-primary)', fontWeight: '600', marginBottom: '2px' }}>
                Unscheduled CRM Actions
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                {unscheduledTasks.length} pending actions require a due date
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {unscheduledTasks.map(task => (
                <div 
                  key={task.id} 
                  style={{ 
                    padding: '10px', 
                    backgroundColor: 'rgba(255,255,255,0.02)', 
                    border: '1px solid var(--border-light)', 
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                    {task.description}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', color: 'var(--accent-primary)' }}>
                      Client: {task.clientName}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button 
                        onClick={() => handleOpenEdit('task', task)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', opacity: 0.5, padding: '2px' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-primary)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        title="Schedule for selected day"
                        className="btn btn-secondary"
                        style={{ padding: '4px 6px', fontSize: '11px', backgroundColor: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.3)' }}
                        onClick={() => handleScheduleTask(task.id, selectedDate)}
                      >
                        Today
                      </button>
                      <input 
                        type="date"
                        style={{ 
                          padding: '2px 4px', 
                          fontSize: '11px', 
                          backgroundColor: 'var(--bg-base)', 
                          color: 'var(--text-primary)', 
                          border: '1px solid var(--border-light)', 
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        onChange={(e) => {
                          if (e.target.value) {
                            handleScheduleTask(task.id, new Date(e.target.value));
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {unscheduledTasks.length === 0 && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
                  No unscheduled actions
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Sync Credentials Modal */}
      {isSyncModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '32px', animation: 'fadeIn 0.2s ease-out' }}>
            
            <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={20} color="var(--accent-primary)" />
              Connect Google Calendar
            </h2>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '16px' }}>
              To sync your Google Calendar, provide your OAuth client credentials from Google Cloud. 
              <br />
              <span style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>Redirect URL: </span>
              <code>http://localhost:18430/auth-callback</code>
            </p>

            <div style={{ padding: '12px 14px', backgroundColor: 'rgba(59, 130, 246, 0.08)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#60a5fa', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ⭐ How to Keep Sync Permanent Forever (No 7-Day Expiry)
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                In your Google Cloud Console → <strong>APIs & Services</strong> → <strong>OAuth consent screen</strong>, click <strong>"Publish App"</strong> to switch status from <em>"Testing"</em> to <em>"In production"</em>. This ensures your authorization stays permanent and never expires every week!
              </div>
            </div>

            <form onSubmit={handleConnectGoogle} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Client ID</label>
                <input 
                  required 
                  type="text" 
                  className="input-field" 
                  value={formClientId}
                  onChange={e => setFormClientId(e.target.value)}
                  placeholder="e.g. 12345-abcde.apps.googleusercontent.com"
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Client Secret</label>
                <input 
                  required 
                  type="password" 
                  className="input-field" 
                  value={formClientSecret}
                  onChange={e => setFormClientSecret(e.target.value)}
                  placeholder="Paste your OAuth Client Secret here"
                />
              </div>

              {syncError && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px' }}>
                  <AlertCircle size={14} color="#f87171" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span style={{ fontSize: '12px', color: '#f87171' }}>{syncError}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button 
                  type="button" 
                  className="btn" 
                  style={{ backgroundColor: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}
                  onClick={() => setIsSyncModalOpen(false)}
                  disabled={syncLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={syncLoading}
                >
                  {syncLoading ? 'Connecting...' : 'Authorize & Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event/Task Modal */}
      {editingEvent && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '32px', animation: 'fadeIn 0.2s ease-out' }}>
            
            <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={20} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
              {editingEvent.type === 'google' ? 'Edit Google Calendar Event' : 'Edit CRM Action Item'}
            </h2>

            <form onSubmit={handleSaveEditEvent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {editingEvent.type === 'google' ? (
                <>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Event Title</label>
                    <input 
                      required 
                      type="text" 
                      className="input-field" 
                      value={editForm.summary}
                      onChange={e => setEditForm({ ...editForm, summary: e.target.value })}
                    />
                  </div>
                  
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Description</label>
                    <textarea 
                      className="input-field" 
                      style={{ minHeight: '80px', resize: 'vertical' }}
                      value={editForm.description}
                      onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label className="input-label">Date</label>
                      <input 
                        required
                        type="date" 
                        className="input-field" 
                        value={editForm.date}
                        onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label className="input-label">Start Time</label>
                      <input 
                        required
                        type="time" 
                        className="input-field" 
                        value={editForm.startTime}
                        onChange={e => setEditForm({ ...editForm, startTime: e.target.value })}
                      />
                    </div>
                    <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label className="input-label">End Time</label>
                      <input 
                        required
                        type="time" 
                        className="input-field" 
                        value={editForm.endTime}
                        onChange={e => setEditForm({ ...editForm, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Action Description</label>
                    <input 
                      required 
                      type="text" 
                      className="input-field" 
                      value={editForm.description}
                      onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Client</label>
                    <select 
                      required 
                      className="input-field" 
                      value={editForm.clientId}
                      onChange={e => setEditForm({ ...editForm, clientId: e.target.value })}
                    >
                      <option value="">— Select Client —</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.fullName}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label className="input-label">Due Date</label>
                      <input 
                        type="date" 
                        className="input-field" 
                        value={editForm.dueDate}
                        onChange={e => setEditForm({ ...editForm, dueDate: e.target.value })}
                      />
                    </div>
                    <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label className="input-label">Status</label>
                      <select 
                        required 
                        className="input-field" 
                        value={editForm.status}
                        onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label className="input-label">Start Time</label>
                      <input 
                        type="time" 
                        className="input-field" 
                        value={editForm.dueTime || ''}
                        onChange={e => setEditForm({ ...editForm, dueTime: e.target.value })}
                      />
                    </div>
                    <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label className="input-label">End Time</label>
                      <input 
                        type="time" 
                        className="input-field" 
                        value={editForm.dueEndTime || ''}
                        onChange={e => setEditForm({ ...editForm, dueEndTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Address / Location</label>
                    <AddressAutocomplete 
                      value={editForm.location || ''} 
                      onChange={e => setEditForm({ ...editForm, location: e.target.value })} 
                      placeholder="Search venue or address (e.g. 048581, MBFC...)"
                    />
                  </div>
                </>
              )}

              {editFormError && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px' }}>
                  <AlertCircle size={14} color="#f87171" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span style={{ fontSize: '12px', color: '#f87171' }}>{editFormError}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                {editingEvent.type === 'google' && (
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#f87171', backgroundColor: 'rgba(239,68,68,0.05)', padding: '8px 14px' }}
                    onClick={handleDeleteGoogleEvent}
                    disabled={editFormLoading}
                  >
                    <Trash2 size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Delete Event
                  </button>
                )}
                <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
                  <button 
                    type="button" 
                    className="btn" 
                    style={{ backgroundColor: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-secondary)', padding: '8px 14px' }}
                    onClick={() => setEditingEvent(null)}
                    disabled={editFormLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ padding: '8px 20px' }}
                    disabled={editFormLoading}
                  >
                    {editFormLoading ? 'Saving...' : 'Save Changes'}
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
