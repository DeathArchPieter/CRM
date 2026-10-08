import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, GitBranch, TrendingUp, DollarSign, CheckCircle2, Clock, 
  AlertCircle, Sparkles, RefreshCw, Circle, Trash2, Calendar, 
  Cake, Shield, ChevronRight, Plus, ArrowUpRight, MessageCircle, AlertTriangle,
  Bell, ChevronDown, ChevronUp, Check, Target, Flame, Coffee, Briefcase, MapPin, Edit3, X, Info
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
  const [activeDashboardSnoozeId, setActiveDashboardSnoozeId] = useState(null);
  const [isActionCenterCollapsed, setIsActionCenterCollapsed] = useState(false);

  // Weekly Activity Pacemaker state (Target pace default: 15)
  const [paceTarget, setPaceTarget] = useState(() => {
    try {
      const saved = localStorage.getItem('crm_weekly_meeting_pace_target');
      return saved ? Math.max(1, parseInt(saved, 10)) : 15;
    } catch (e) {
      return 15;
    }
  });
  const [isEditingPaceTarget, setIsEditingPaceTarget] = useState(false);
  const [tempPaceTarget, setTempPaceTarget] = useState(15);
  const [paceTimeframe, setPaceTimeframe] = useState('following'); // 'following' | 'next-7' | 'current'
  const [selectedPaceDay, setSelectedPaceDay] = useState(null); // null = all days in range
  const [isPacemakerExpanded, setIsPacemakerExpanded] = useState(false);
  const [aiReconciliation, setAiReconciliation] = useState(null); // { weekKey, items, archieInsight, isAiVerified }
  const [isAiReconciling, setIsAiReconciling] = useState(false);

  // Quick Arrange Meeting Modal state
  const [isAddMeetingModalOpen, setIsAddMeetingModalOpen] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    category: 'social', // 'social' | 'client' | 'prospect' | 'networking' | 'meeting'
    clientId: '',
    date: '',
    startTime: '10:00',
    endTime: '11:00',
    location: '',
    channel: 'Coffee'
  });
  const [isSubmittingMeeting, setIsSubmittingMeeting] = useState(false);

  const todayDateStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const overduePendingTasks = useMemo(() => {
    return pendingTasks.filter(t => t.dueDate && t.dueDate < todayDateStr);
  }, [pendingTasks, todayDateStr]);

  const todayPendingTasks = useMemo(() => {
    return pendingTasks.filter(t => t.dueDate && t.dueDate === todayDateStr);
  }, [pendingTasks, todayDateStr]);

  const urgentActionItems = useMemo(() => {
    return [...overduePendingTasks, ...todayPendingTasks].sort((a, b) => {
      if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueTime && b.dueTime) return a.dueTime.localeCompare(b.dueTime);
      return 0;
    });
  }, [overduePendingTasks, todayPendingTasks]);

  const handleSnoozeTask = async (taskId, option) => {
    if (window.electronAPI?.snoozeTask) {
      const res = await window.electronAPI.snoozeTask({ taskId, option });
      if (res.success) {
        addToast('Task postponed successfully', 'info');
        loadData();
      }
    }
  };

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
        // Extend timeMax to 21 days so the following week is completely fetched
        const rangeEnd = new Date();
        rangeEnd.setDate(rangeEnd.getDate() + 21);
        rangeEnd.setHours(23, 59, 59, 999);
        const timeMin = todayStart.toISOString();
        const timeMax = rangeEnd.toISOString();
        
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

  /* ── Weekly Activity Pacemaker Logic (Pace for 15 People to Meet) ── */
  const weekRange = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
    const distToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const currentMonday = new Date(now);
    currentMonday.setDate(now.getDate() + distToMonday);
    currentMonday.setHours(0, 0, 0, 0);

    if (paceTimeframe === 'current') {
      const start = new Date(currentMonday);
      const end = new Date(currentMonday);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { 
        start, 
        end, 
        label: `This Week (${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
        shortLabel: 'This Week'
      };
    } else if (paceTimeframe === 'next-7') {
      const start = new Date(now);
      start.setDate(now.getDate() + 1); // Tomorrow
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setDate(now.getDate() + 7);
      end.setHours(23, 59, 59, 999);
      return { 
        start, 
        end, 
        label: `Next 7 Days (${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
        shortLabel: 'Next 7 Days'
      };
    } else {
      // 'following' (default)
      const start = new Date(currentMonday);
      start.setDate(start.getDate() + 7); // Next Monday
      const end = new Date(start);
      end.setDate(start.getDate() + 6); // Next Sunday
      end.setHours(23, 59, 59, 999);
      return { 
        start, 
        end, 
        label: `Following Week (${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
        shortLabel: 'Following Week'
      };
    }
  }, [paceTimeframe]);

  // ── Smart Algorithmic + AI Hybrid Reconciliation Engine ──
  const pacemakerData = useMemo(() => {
    const { start, end } = weekRange;
    const startTime = start.getTime();
    const endTime = end.getTime();

    // 1. Collect candidate Google Events in range
    const rawGoogleEvents = [];
    googleEvents.forEach(e => {
      const eventStart = e.start?.dateTime ? new Date(e.start.dateTime) : (e.start?.date ? new Date(e.start.date) : null);
      if (!eventStart) return;
      const eventTime = eventStart.getTime();
      if (eventTime < startTime || eventTime > endTime) return;

      const summaryLower = (e.summary || '').toLowerCase();
      const descLower = (e.description || '').toLowerCase();
      const locLower = (e.location || '').toLowerCase();
      const fullGoogleText = `${summaryLower} ${descLower} ${locLower}`.trim();

      const isAllDay = !e.start?.dateTime;
      if (isAllDay && (summaryLower.includes('holiday') || summaryLower.includes('leave') || summaryLower.includes('flight') || summaryLower.includes('birthday'))) {
        return;
      }

      // Early detection for Medical & Personal/Maintenance: NEVER match a sales client or prospect!
      const isMedEvent = 
        /\b(medical|medicine|doctor|dr\b|dentist|dental|clinic|clinics|hospital|hospitals|checkup|check-up|health screening|physio|physiotherapy|blood test|vaccin|vaccine|vaccination|surgery|surgical|pharmacy|med appt|specialist appt|polyclinic|cardio|cardiovascular|cardiology|oncology|radiology|imaging|orthopaedic|orthopedic|dermatology|dermatologist|ophthalmology|optometrist|optical|pediatric|paediatric|ent clinic|mri|ct scan|x-ray|ultrasound|laboratory|pathology|consultant clinic|specialist centre|specialist center|ward|inpatient|outpatient)\b/i.test(`${summaryLower} ${descLower}`) ||
        /\b(heart centre|heart center|national heart centre|nhcs|mount elizabeth|gleneagles|raffles medical|raffles hospital|tan tock seng|ttsh|sgh|singapore general hospital|national university hospital|nuh|kkh|cgh|ktph|skh|ntfgh|singhealth|nucohs|polyclinic|novena specialist|camden medical|paragon medical|farrer park)\b/i.test(fullGoogleText);

      const isPersonalOrMaintenance = 
        /\b(air-con|aircon|air conditioning|air-conditioning|aircond|air condition|servicing|aircon servicing|chemical wash|compressor|blower)\b/i.test(`${summaryLower} ${descLower}`) ||
        /\b(plumber|plumbing|electrician|electrical|handyman|contractor|renovation|cleaning|cleaner|housekeeping|laundry|delivery|parcel|inspection|maintenance|pest control|locksmith|repair|repairs|carpenter|painting|water heater)\b/i.test(`${summaryLower} ${descLower}`) ||
        /\b(car servicing|car inspection|road tax|car wash|workshop|tyre|tire|battery|mechanic|vehicle inspection|vicom|sta inspection)\b/i.test(`${summaryLower} ${descLower}`) ||
        /\b(leave|flight|gym|workout|fitness|exercise|jog|jogging|run|running|walk|walking|stroll|dog walk|dog walking|hike|hiking|swim|swimming|cycle|cycling|yoga|pilates|badminton|tennis|golf session|driving range|holiday|vacation|birthday|personal block|off day|family day|parent|kids|haircut|salon|barber|errand|errands|grocery|groceries|supermarket|shopping)\b/i.test(fullGoogleText);

      // Match client / prospect (supports preferredName, surname tokens, and punctuation cleanup)
      // Strictly disabled for medical appointments and personal/maintenance events!
      const summaryTokens = summaryLower.split(/[\s\-:,/()]+/).filter(t => t.length >= 3 && !['appt', 'appts', 'meeting', 'catchup', 'catch', 'coffee', 'lunch', 'dinner', 'sync', 'chat', 'call', 'with', 'over'].includes(t));
      const matchedClient = (isMedEvent || isPersonalOrMaintenance) ? null : (Array.isArray(clients) ? clients.find(c => {
        if (!c || !c.fullName) return false;
        const fn = String(c.fullName).toLowerCase().trim();
        const cleanPn = String(c.preferredName || '').replace(/[^a-zA-Z0-9\s]/g, '').trim().toLowerCase();
        if (summaryLower.includes(fn)) return true;
        if (cleanPn && cleanPn.length >= 3 && (summaryLower.includes(cleanPn) || summaryTokens.includes(cleanPn))) return true;

        // Match primary name tokens (e.g. "Poh" from "Poh Tze Sen")
        const fnTokens = fn.split(/\s+/).filter(t => t.length >= 3 && !['mr', 'mrs', 'ms', 'mdm', 'dr'].includes(t));
        if (fnTokens.some(t => summaryTokens.includes(t))) return true;

        if (Array.isArray(e.attendees) && c.email) {
          return e.attendees.some(a => a && typeof a.email === 'string' && typeof c.email === 'string' && a.email.toLowerCase() === c.email.toLowerCase());
        }
        return false;
      }) : null);

      const gYear = eventStart.getFullYear();
      const gMonth = String(eventStart.getMonth() + 1).padStart(2, '0');
      const gDay = String(eventStart.getDate()).padStart(2, '0');
      const gDateStr = e.start?.date || `${gYear}-${gMonth}-${gDay}`;

      rawGoogleEvents.push({
        id: `google-${e.id}`,
        rawId: e.id,
        source: 'google',
        title: e.summary || '(No Title)',
        description: e.description || '',
        date: eventStart,
        dateStr: gDateStr,
        timeStr: e.start?.dateTime ? eventStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'All Day',
        rawTimeMinutes: e.start?.dateTime ? (eventStart.getHours() * 60 + eventStart.getMinutes()) : null,
        location: e.location || '',
        attendees: e.attendees || [],
        client: matchedClient || null,
        isMedical: isMedEvent,
        isPersonalOrMaintenance: isPersonalOrMaintenance,
        originalData: e
      });
    });

    // 2. Collect candidate CRM Tasks in range
    const rawCrmTasks = [];
    calendarTasks.forEach(t => {
      if (!t.dueDate) return;
      const taskDate = new Date(`${t.dueDate}T${t.dueTime || '12:00'}:00`);
      const taskTime = taskDate.getTime();
      if (taskTime < startTime || taskTime > endTime) return;

      let taskMinutes = null;
      if (t.dueTime && t.dueTime.includes(':')) {
        const [h, m] = t.dueTime.split(':').map(Number);
        taskMinutes = h * 60 + (m || 0);
      }

      const matchedClient = clients.find(c => c.id === t.clientId);
      const isProspectTask = !!(t.isProspect || t.prospectName || t.prospectId);
      const prospectObj = isProspectTask ? {
        fullName: t.prospectName || t.clientName || 'Prospect',
        preferredName: (t.prospectName || t.clientName || '').split(' ')[0],
        phone: t.clientPhone || t.phone || null,
        clientStatus: 'Prospect',
        isProspect: true
      } : null;

      rawCrmTasks.push({
        id: `task-${t.id}`,
        rawId: t.id,
        googleEventId: t.googleEventId || null,
        source: 'crm',
        type: t.type || 'task',
        title: t.title || t.description || 'CRM Meeting',
        description: t.title && t.description ? t.description : (t.notes || t.remarks || ''),
        notes: t.notes || t.remarks || '',
        date: taskDate,
        dateStr: t.dueDate,
        timeStr: t.dueTime || 'Scheduled',
        rawTimeMinutes: taskMinutes,
        location: t.location || '',
        attendees: [],
        client: matchedClient || prospectObj,
        isProspect: isProspectTask,
        prospectName: t.prospectName || (t.isProspect ? t.clientName : null),
        originalData: t
      });
    });

    // 3. Smart De-duplication across Google Events & CRM Tasks
    const mergedList = [];
    const consumedGoogleIds = new Set();
    const consumedTaskIds = new Set();

    // Pass 3a: Explicit googleEventId sync link
    rawCrmTasks.forEach(task => {
      if (task.googleEventId) {
        const matchedG = rawGoogleEvents.find(g => g.rawId === task.googleEventId);
        if (matchedG) {
          consumedGoogleIds.add(matchedG.id);
          consumedTaskIds.add(task.id);
          mergedList.push({
            ...task,
            id: `merged-${task.rawId}-${matchedG.rawId}`,
            title: task.title.length > matchedG.title.length ? task.title : matchedG.title,
            description: [matchedG.description, task.description].filter(Boolean).join('\n'),
            location: task.location || matchedG.location,
            attendees: matchedG.attendees || [],
            client: task.client || matchedG.client,
            isProspect: task.isProspect || matchedG.client?.clientStatus === 'Prospect',
            isMerged: true,
            mergedSources: ['google', 'crm']
          });
        }
      }
    });

    // Pass 3b: Fuzzy time + client/name matching on same date
    rawCrmTasks.forEach(task => {
      if (consumedTaskIds.has(task.id)) return;
      const taskTitleLower = task.title.toLowerCase();
      const clientNameLower = task.client?.fullName?.toLowerCase() || '';
      const clientPrefLower = task.client?.preferredName?.toLowerCase() || '';

      const matchedG = rawGoogleEvents.find(g => {
        if (consumedGoogleIds.has(g.id)) return false;
        if (g.dateStr !== task.dateStr) return false;
        // Never merge a medical or personal/maintenance event with a CRM sales task!
        if (g.isMedical || g.isPersonalOrMaintenance) return false;

        // Check time proximity (within 45 minutes)
        if (task.rawTimeMinutes !== null && g.rawTimeMinutes !== null) {
          if (Math.abs(task.rawTimeMinutes - g.rawTimeMinutes) > 45) return false;
        }

        const gTitleLower = g.title.toLowerCase();

        // Match if client is identical
        if (task.client && g.client && task.client.id === g.client.id) return true;

        // Match if client name appears in Google title
        if (clientNameLower && gTitleLower.includes(clientNameLower)) return true;
        if (clientPrefLower && clientPrefLower.length > 2 && gTitleLower.includes(clientPrefLower)) return true;

        // Match if Google title appears in task title or vice versa
        if (gTitleLower.length > 4 && taskTitleLower.includes(gTitleLower)) return true;
        if (taskTitleLower.length > 4 && gTitleLower.includes(taskTitleLower)) return true;

        // Match common name token in both (e.g. Jacelyn Lee, Steven, Janice)
        const nameTokens = gTitleLower.split(/[\s,@-]+/).filter(t => t.length >= 3 && !['with', 'over', 'lunch', 'coffee', 'meeting', 'catch', 'breakfast', 'huddle', 'office', 'project', 'consultation'].includes(t));
        for (const token of nameTokens) {
          if (taskTitleLower.includes(token)) return true;
        }

        return false;
      });

      if (matchedG) {
        consumedGoogleIds.add(matchedG.id);
        consumedTaskIds.add(task.id);
        const resolvedTitle = task.title.includes(matchedG.title) 
          ? task.title 
          : (task.client ? `${task.title} (${task.client.fullName})` : `${task.title} / ${matchedG.title}`);
        mergedList.push({
          ...task,
          id: `merged-${task.rawId}-${matchedG.rawId}`,
          title: resolvedTitle,
          description: [matchedG.description, task.description].filter(Boolean).join('\n'),
          location: task.location || matchedG.location,
          attendees: matchedG.attendees || [],
          client: task.client || matchedG.client,
          isProspect: task.isProspect || matchedG.client?.clientStatus === 'Prospect',
          isMerged: true,
          mergedSources: ['google', 'crm']
        });
      }
    });

    // Pass 3c: Add remaining un-merged Google Events
    rawGoogleEvents.forEach(g => {
      if (!consumedGoogleIds.has(g.id)) {
        mergedList.push(g);
      }
    });

    // Pass 3d: Add remaining un-merged CRM Tasks
    rawCrmTasks.forEach(t => {
      if (!consumedTaskIds.has(t.id)) {
        mergedList.push(t);
      }
    });

    // Pass 3e: Same-Day Same-Contact / Title Deduplication across all candidates
    const dedupedList = [];
    const consumedSecondaryIds = new Set();

    for (let i = 0; i < mergedList.length; i++) {
      const itemA = mergedList[i];
      if (consumedSecondaryIds.has(itemA.id)) continue;

      let combinedItem = { ...itemA };

      for (let j = i + 1; j < mergedList.length; j++) {
        const itemB = mergedList[j];
        if (consumedSecondaryIds.has(itemB.id)) continue;
        if (itemA.dateStr !== itemB.dateStr) continue;

        // Don't merge internal agency meetings with client meetings
        const aTitleLower = (itemA.title || '').toLowerCase();
        const bTitleLower = (itemB.title || '').toLowerCase();
        const isAgencyA = /huddle|district|agency|sprint|convention|expo|office|townhall/i.test(aTitleLower);
        const isAgencyB = /huddle|district|agency|sprint|convention|expo|office|townhall/i.test(bTitleLower);
        if (isAgencyA !== isAgencyB) continue;

        // Never merge medical appointments or personal/maintenance events with other meetings
        if (itemA.isMedical || itemB.isMedical || itemA.isPersonalOrMaintenance || itemB.isPersonalOrMaintenance) continue;

        // Check if both relate to the same client or same person name
        let isSameContact = false;
        if (itemA.client && itemB.client && itemA.client.id === itemB.client.id) {
          isSameContact = true;
        } else {
          const nameA = itemA.client?.fullName?.toLowerCase();
          const nameB = itemB.client?.fullName?.toLowerCase();
          if (nameA && (bTitleLower.includes(nameA) || (itemB.client && itemB.client.fullName.toLowerCase().includes(nameA)))) isSameContact = true;
          if (nameB && (aTitleLower.includes(nameB) || (itemA.client && itemA.client.fullName.toLowerCase().includes(nameB)))) isSameContact = true;

          // Check token overlap for names (e.g. "Jacelyn Lee", "Janice")
          const extractNames = str => str.toLowerCase().split(/[\s,@\-:()[\]]+/).filter(t => t.length >= 3 && !['with', 'over', 'lunch', 'coffee', 'meeting', 'task', 'project', 'catch', 'breakfast', 'huddle', 'consultation', 'district', 'sprint', 'check', 'sync'].includes(t));
          const tokensA = extractNames(itemA.title);
          const tokensB = extractNames(itemB.title);
          const common = tokensA.filter(t => tokensB.includes(t));
          if (common.length > 0) isSameContact = true;
        }

        if (isSameContact) {
          consumedSecondaryIds.add(itemB.id);
          combinedItem.isMerged = true;
          combinedItem.mergedIds = [...(combinedItem.mergedIds || [itemA.rawId || itemA.id]), itemB.rawId || itemB.id];
          combinedItem.client = combinedItem.client || itemB.client;
          combinedItem.description = [combinedItem.description, itemB.description].filter(Boolean).join('\n');
          combinedItem.location = combinedItem.location || itemB.location;
          combinedItem.attendees = (combinedItem.attendees && combinedItem.attendees.length > 0) ? combinedItem.attendees : (itemB.attendees || []);
          combinedItem.isProspect = combinedItem.isProspect || itemB.isProspect;
          // Prefer cleaner or combined title
          if (combinedItem.title.toLowerCase().includes(itemB.title.toLowerCase())) {
            // keep combinedItem.title
          } else if (itemB.title.toLowerCase().includes(combinedItem.title.toLowerCase())) {
            combinedItem.title = itemB.title;
          } else {
            combinedItem.title = `${combinedItem.title} · ${itemB.title}`;
          }
        }
      }

      dedupedList.push(combinedItem);
    }

    // 4. Classify and compute Pace Eligibility (Deterministic Pass)
    const classifiedItems = dedupedList.map(item => {
      const titleLower = (item.title || '').toLowerCase();
      const descLower = (item.description || '').toLowerCase();
      const locLower = (item.location || '').toLowerCase();
      const fullText = `${titleLower} ${descLower} ${locLower}`.trim();

      // Check training strictly in title & description (NEVER check location to avoid false positives from venues like "Golf Course", "The Concourse", "Racecourse")
      const activityText = `${titleLower} ${descLower}`.replace(/\b(golf|race|main)\s+course\b/gi, '').replace(/\bconcourse\b/gi, '');

      // A. Training & Professional Education (CRITICAL: EXCLUDED FROM SALES PACE)
      const isTrainingOrAgency = 
        /\b(training|workshop|seminar|webinar|exam|exams|cpd|lecture|masterclass|study group|onboarding)\b/i.test(activityText) ||
        /\b(cpd course|training course|certification course|online course|e-learning)\b/i.test(activityText) ||
        /\b(agency meeting|unit meeting|district meeting|district huddle|huddle|sprint|convention|expo|townhall|assembly|meeting @ office|weekly meeting|cluster meeting|branch meeting)\b/i.test(activityText) ||
        /\b(gravitas|acacia|aia sprint)\b/i.test(activityText);

      if (isTrainingOrAgency) {
        const isEdu = /\b(training|webinar|seminar|workshop|course|exam|cpd|lecture|masterclass|briefing|study group)\b/i.test(activityText);
        return {
          ...item,
          category: 'internal_agency',
          categoryLabel: isEdu ? 'Training' : 'Agency Internal',
          categoryColor: '#94a3b8',
          categoryBg: 'rgba(148, 163, 184, 0.15)',
          peopleCount: 0,
          isExternalPace: false,
          pacingTag: `${isEdu ? 'Training' : 'Agency'} Session (Excluded from Pace)`
        };
      }

      // B. Medical & Healthcare Appointments (CRITICAL: EXCLUDED FROM SALES PACE)
      const isMedical = item.isMedical ||
        /\b(medical|medicine|doctor|dr\b|dentist|dental|clinic|clinics|hospital|hospitals|checkup|check-up|health screening|physio|physiotherapy|blood test|vaccin|vaccine|vaccination|surgery|surgical|pharmacy|med appt|specialist appt|polyclinic|cardio|cardiovascular|cardiology|oncology|radiology|imaging|orthopaedic|orthopedic|dermatology|dermatologist|ophthalmology|optometrist|optical|pediatric|paediatric|ent clinic|mri|ct scan|x-ray|ultrasound|laboratory|pathology|consultant clinic|specialist centre|specialist center|ward|inpatient|outpatient)\b/i.test(`${titleLower} ${descLower}`) ||
        /\b(heart centre|heart center|national heart centre|nhcs|mount elizabeth|gleneagles|raffles medical|raffles hospital|tan tock seng|ttsh|sgh|singapore general hospital|national university hospital|nuh|kkh|cgh|ktph|skh|ntfgh|singhealth|nucohs|polyclinic|novena specialist|camden medical|paragon medical|farrer park)\b/i.test(fullText);

      if (isMedical) {
        return {
          ...item,
          client: null, // Personal medical appointment: strictly never a sales client
          category: 'personal',
          categoryLabel: 'Medical',
          categoryColor: '#f43f5e',
          categoryBg: 'rgba(244, 63, 94, 0.15)',
          peopleCount: 0,
          isExternalPace: false,
          pacingTag: 'Medical Appointment (Excluded from Pace)'
        };
      }

      // C. Personal Errands, Home Maintenance, Domestic Servicing & Workouts (CRITICAL: EXCLUDED FROM SALES PACE)
      const isPersonalOrMaintenance = item.isPersonalOrMaintenance ||
        /\b(air-con|aircon|air conditioning|air-conditioning|aircond|air condition|servicing|aircon servicing|chemical wash|compressor|blower)\b/i.test(fullText) ||
        /\b(plumber|plumbing|electrician|electrical|handyman|contractor|renovation|cleaning|cleaner|housekeeping|laundry|delivery|parcel|inspection|maintenance|pest control|locksmith|repair|repairs|carpenter|painting|water heater)\b/i.test(fullText) ||
        /\b(car servicing|car inspection|road tax|car wash|workshop|tyre|tire|battery|mechanic|vehicle inspection|vicom|sta inspection)\b/i.test(fullText) ||
        /\b(leave|flight|gym|workout|fitness|exercise|jog|jogging|run|running|walk|walking|stroll|dog walk|dog walking|hike|hiking|swim|swimming|cycle|cycling|yoga|pilates|badminton|tennis|golf session|driving range|holiday|vacation|birthday|personal block|off day|family day|parent|kids|haircut|salon|barber|errand|errands|grocery|groceries|supermarket|shopping)\b/i.test(fullText);

      if (isPersonalOrMaintenance) {
        const isMaintenance = /\b(air-con|aircon|air conditioning|servicing|plumb|electric|handyman|contractor|renov|clean|repair|mechanic|vicom|sta inspection|car servicing|tyre|battery|parcel|delivery)\b/i.test(fullText);
        return {
          ...item,
          client: null, // Domestic maintenance / personal errand: never a sales client
          category: 'personal',
          categoryLabel: isMaintenance ? 'Home & Maintenance' : 'Personal',
          categoryColor: '#64748b',
          categoryBg: 'rgba(100, 116, 139, 0.15)',
          peopleCount: 0,
          isExternalPace: false,
          pacingTag: isMaintenance ? 'Home / Maintenance (Excluded from Pace)' : 'Personal Block (Excluded from Pace)'
        };
      }

      // D. Social catch-up (check explicit type, channel, or keywords)
      const isSocialType = item.type === 'social' || 
        item.originalData?.type === 'social' || 
        item.originalData?.channel === 'Coffee' || 
        item.originalData?.channel === 'Coffee / Social' ||
        titleLower.includes('coffee') ||
        titleLower.includes('lunch') ||
        titleLower.includes('dinner') ||
        titleLower.includes('drinks') ||
        titleLower.includes('catch up') ||
        titleLower.includes('catchup') ||
        titleLower.includes('chat') ||
        titleLower.includes('social') ||
        titleLower.includes('tea') ||
        titleLower.includes('breakfast');

      if (isSocialType) {
        return {
          ...item,
          category: 'social',
          categoryLabel: 'Social Catch-up',
          categoryColor: '#fb923c',
          categoryBg: 'rgba(251, 146, 60, 0.15)',
          peopleCount: 1,
          isExternalPace: true
        };
      }

      // E. Client or Prospect Meeting
      if (item.client || item.isProspect) {
        const isProspectStatus = item.isProspect || item.client?.clientStatus === 'Prospect' || item.client?.isProspect;
        if (isProspectStatus) {
          return {
            ...item,
            category: 'prospect',
            categoryLabel: 'Prospect',
            categoryColor: '#c084fc',
            categoryBg: 'rgba(192, 132, 252, 0.15)',
            peopleCount: 1,
            isExternalPace: true
          };
        }
        return {
          ...item,
          category: 'client',
          categoryLabel: 'Client',
          categoryColor: '#34d399',
          categoryBg: 'rgba(52, 211, 153, 0.15)',
          peopleCount: 1,
          isExternalPace: true
        };
      }

      // F. Networking
      if (titleLower.includes('network') || titleLower.includes('bni') || titleLower.includes('mixer') || titleLower.includes('summit') || titleLower.includes('chamber') || titleLower.includes('referral')) {
        return {
          ...item,
          category: 'networking',
          categoryLabel: 'Networking',
          categoryColor: '#38bdf8',
          categoryBg: 'rgba(56, 189, 248, 0.15)',
          peopleCount: 1,
          isExternalPace: true
        };
      }

      // G. Solo Admin / Paperwork check
      const isSoloAdmin = /admin|paperwork|desk work|prep slides|emailing|internal review|invoicing/i.test(fullText);
      if (isSoloAdmin) {
        return {
          ...item,
          category: 'internal_agency',
          categoryLabel: 'Admin / Desk',
          categoryColor: '#94a3b8',
          categoryBg: 'rgba(148, 163, 184, 0.15)',
          peopleCount: 0,
          isExternalPace: false,
          pacingTag: 'Desk Work (Excluded from Pace)'
        };
      }

      // Default Work Session (Internal / Solo Focus Session)
      // Check if external attendees exist (excluding self)
      const hasExternalAttendees = Array.isArray(item.attendees) && item.attendees.some(a => {
        if (!a || !a.email) return false;
        if (a.self) return false;
        return true;
      });

      return {
        ...item,
        category: 'meeting',
        categoryLabel: hasExternalAttendees ? 'Work Meeting' : 'Work Session',
        categoryColor: '#60a5fa',
        categoryBg: 'rgba(96, 165, 250, 0.15)',
        peopleCount: hasExternalAttendees ? 1 : 0,
        isExternalPace: hasExternalAttendees,
        pacingTag: hasExternalAttendees ? 'Work Meeting' : 'Internal Session (Excluded from Pace)'
      };
    });

    // Chronological Sort
    classifiedItems.sort((a, b) => a.date - b.date);

    // Apply AI verified enhancements if available for this timeframe
    let finalItems = classifiedItems;
    let isAiVerified = false;

    const candidateHash = classifiedItems.map(c => `${c.id}:${c.dateStr}`).sort().join(',');
    const currentWeekKey = `${paceTimeframe}-${weekRange.label}-${candidateHash}`;

    if (aiReconciliation && aiReconciliation.weekKey === currentWeekKey && Array.isArray(aiReconciliation.items) && aiReconciliation.items.length > 0) {
      isAiVerified = true;

      const categoryColors = {
        client: '#34d399',
        prospect: '#c084fc',
        social: '#fb923c',
        networking: '#38bdf8',
        internal_agency: '#94a3b8',
        personal: '#f43f5e',
        meeting: '#60a5fa'
      };
      const categoryBgs = {
        client: 'rgba(52, 211, 153, 0.15)',
        prospect: 'rgba(192, 132, 252, 0.15)',
        social: 'rgba(251, 146, 60, 0.15)',
        networking: 'rgba(56, 189, 248, 0.15)',
        internal_agency: 'rgba(148, 163, 184, 0.15)',
        personal: 'rgba(244, 63, 94, 0.15)',
        meeting: 'rgba(96, 165, 250, 0.15)'
      };

      // Set of candidate IDs merged into other items by AI
      const consumedByAi = new Set();
      aiReconciliation.items.forEach(ai => {
        if (Array.isArray(ai.mergedIds) && ai.mergedIds.length > 1) {
          ai.mergedIds.slice(1).forEach(mId => consumedByAi.add(mId));
        }
      });

      // Enrich the canonical classifiedItems directly without appending duplicate lists
      finalItems = classifiedItems
        .filter(item => !consumedByAi.has(item.id) && !consumedByAi.has(item.rawId))
        .map(item => {
          const aiMatch = aiReconciliation.items.find(ai => 
            ai.id === item.id || 
            (Array.isArray(ai.mergedIds) && (ai.mergedIds.includes(item.id) || ai.mergedIds.includes(item.rawId))) ||
            (item.client && ai.clientName && item.client.fullName.toLowerCase().includes(ai.clientName.toLowerCase())) ||
            (item.title && ai.title && (item.title.toLowerCase().includes(ai.title.toLowerCase()) || ai.title.toLowerCase().includes(item.title.toLowerCase())))
          );

          if (aiMatch) {
            const effectiveCat = aiMatch.category || item.category;
            const isMedicalOrPersonal = effectiveCat === 'personal';
            const catColor = isMedicalOrPersonal && (aiMatch.categoryLabel === 'Personal' ? '#64748b' : '#f43f5e') || categoryColors[effectiveCat] || item.categoryColor;
            const catBg = isMedicalOrPersonal && (aiMatch.categoryLabel === 'Personal' ? 'rgba(100, 116, 139, 0.15)' : 'rgba(244, 63, 94, 0.15)') || categoryBgs[effectiveCat] || item.categoryBg;

            return {
              ...item,
              category: effectiveCat,
              categoryLabel: aiMatch.categoryLabel || item.categoryLabel,
              categoryColor: catColor,
              categoryBg: catBg,
              peopleCount: typeof aiMatch.peopleCount === 'number' ? aiMatch.peopleCount : item.peopleCount,
              isExternalPace: typeof aiMatch.isExternalPace === 'boolean' ? aiMatch.isExternalPace : item.isExternalPace,
              isAiClassified: true,
              aiReason: aiMatch.reason || null
            };
          }
          return item;
        });
    }

    // Totals calculation (Single Source of Truth)
    const externalItems = finalItems.filter(i => i.isExternalPace);
    const totalPeople = externalItems.reduce((sum, item) => sum + (item.peopleCount || 0), 0);
    const clientsCount = finalItems.filter(i => i.category === 'client' && i.isExternalPace).reduce((s, i) => s + i.peopleCount, 0);
    const prospectsCount = finalItems.filter(i => i.category === 'prospect' && i.isExternalPace).reduce((s, i) => s + i.peopleCount, 0);
    const socialCount = finalItems.filter(i => i.category === 'social' && i.isExternalPace).reduce((s, i) => s + i.peopleCount, 0);
    const networkingCount = finalItems.filter(i => i.category === 'networking' && i.isExternalPace).reduce((s, i) => s + i.peopleCount, 0);
    const workCount = finalItems.filter(i => i.category === 'meeting' && i.isExternalPace).reduce((s, i) => s + i.peopleCount, 0);
    const internalCount = finalItems.filter(i => i.category === 'internal_agency').length;
    const personalCount = finalItems.filter(i => i.category === 'personal').length;
    const mergedCount = finalItems.filter(i => i.isMerged).length;

    // Archie Insight - ALWAYS 100% mathematically aligned with totalPeople
    const remaining = Math.max(0, paceTarget - totalPeople);
    const activeContacts = externalItems.map(i => i.client?.preferredName || i.client?.fullName || i.title.split(/[\s,]+/)[0]).filter(Boolean);
    const uniqueContacts = [...new Set(activeContacts)].slice(0, 4);
    const contactSummary = uniqueContacts.length > 0 ? ` (${uniqueContacts.join(', ')})` : '';

    let archieInsight = '';
    if (isAiVerified && aiReconciliation?.archieInsight) {
      // Reconcile Gemini's coaching narrative with actual live count so there is zero mismatch
      const baseInsight = aiReconciliation.archieInsight
        .replace(/^\d+\s+genuine.*?\.\s*/i, '')
        .replace(/^great start.*?confirmed.*?\.\s*/i, '')
        .replace(/you need \d+ more.*?pace!/i, '')
        .trim();
      archieInsight = `${totalPeople} confirmed engagement${totalPeople !== 1 ? 's' : ''}${contactSummary} towards your weekly pace. ${baseInsight ? `${baseInsight} ` : ''}${remaining > 0 ? `Aim to book ${remaining} more to hit your ${paceTarget}-person target!` : 'Target achieved! 🔥'}`;
    } else {
      const exclusions = [];
      if (internalCount > 0) exclusions.push(`${internalCount} internal agency`);
      if (personalCount > 0) exclusions.push(`${personalCount} medical/personal`);
      const exclusionStr = exclusions.length > 0 ? ` and excluded ${exclusions.join(' & ')}` : '';
      archieInsight = `${totalPeople} genuine client/prospect catch-up${totalPeople !== 1 ? 's' : ''} confirmed${contactSummary}. De-duplicated ${mergedCount} overlapping entries${exclusionStr}. ${remaining > 0 ? `${remaining} more to book to hit your ${paceTarget}-person weekly pace!` : 'Target achieved! 🚀'}`;
    }

    // Days strip for 7 days
    const daysStrip = [];
    const curDay = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const year = curDay.getFullYear();
      const month = String(curDay.getMonth() + 1).padStart(2, '0');
      const day = String(curDay.getDate()).padStart(2, '0');
      const dStr = `${year}-${month}-${day}`;

      const dayItems = finalItems.filter(item => item.dateStr === dStr);
      const dayPeople = dayItems.filter(item => item.isExternalPace).reduce((s, item) => s + (item.peopleCount || 0), 0);
      daysStrip.push({
        date: new Date(curDay),
        dateStr: dStr,
        dayName: curDay.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: curDay.getDate(),
        monthName: curDay.toLocaleDateString('en-US', { month: 'short' }),
        peopleCount: dayPeople,
        meetingsCount: dayItems.length,
        items: dayItems
      });
      curDay.setDate(curDay.getDate() + 1);
    }

    return {
      items: finalItems,
      rawCandidates: classifiedItems,
      totalMeetings: finalItems.length,
      totalPeople,
      clientsCount,
      prospectsCount,
      socialCount,
      networkingCount,
      workCount,
      internalCount,
      personalCount,
      mergedCount,
      daysStrip,
      archieInsight,
      isAiVerified
    };
  }, [weekRange, googleEvents, calendarTasks, clients, aiReconciliation, paceTimeframe, paceTarget]);

  // AI Reconciliation Execution Hook
  const runAiReconciliation = useCallback(async (force = false) => {
    if (!window.electronAPI?.reconcilePacemakerWithAi) return;
    const candidates = pacemakerData.rawCandidates || [];
    if (candidates.length === 0) return;

    const candidateHash = candidates.map(c => `${c.id}:${c.dateStr}`).sort().join(',');
    const weekKey = `${paceTimeframe}-${weekRange.label}-${candidateHash}`;
    if (!force && aiReconciliation?.weekKey === weekKey) return;

    setIsAiReconciling(true);
    try {
      const payload = {
        weekLabel: weekRange.label,
        paceTarget,
        items: candidates.map(c => {
          const attendeesList = Array.isArray(c.attendees)
            ? c.attendees.map(a => typeof a === 'string' ? a : (a.displayName ? `${a.displayName} (${a.email || ''})` : (a.email || ''))).filter(Boolean)
            : [];
          return {
            id: c.id,
            rawId: c.rawId,
            source: c.source,
            title: c.title,
            description: c.description || c.notes || '',
            location: c.location || '',
            attendees: attendeesList,
            clientName: c.client ? (c.client.preferredName || c.client.fullName) : (c.prospectName || null),
            isClient: !!(c.client && !c.client.isProspect && c.client.clientStatus !== 'Prospect'),
            isProspect: !!(c.isProspect || c.client?.clientStatus === 'Prospect' || c.client?.isProspect),
            dateStr: c.dateStr,
            timeStr: c.timeStr,
            attendeesCount: attendeesList.length || 1,
            isTask: c.source === 'crm'
          };
        })
      };

      const res = await window.electronAPI.reconcilePacemakerWithAi(payload);
      if (res && res.success && res.data) {
        setAiReconciliation({
          weekKey,
          items: res.data.items || [],
          archieInsight: res.data.archieInsight || '',
          isAiVerified: true
        });
      }
    } catch (err) {
      console.warn('AI schedule reconciliation error:', err);
    } finally {
      setIsAiReconciling(false);
    }
  }, [paceTimeframe, weekRange.label, paceTarget, pacemakerData.rawCandidates, aiReconciliation]);

  // Background trigger on week change or calendar load
  useEffect(() => {
    const timer = setTimeout(() => {
      runAiReconciliation();
    }, 600);
    return () => clearTimeout(timer);
  }, [paceTimeframe, googleEvents.length, calendarTasks.length]);

  const handleSavePaceTarget = (newVal) => {
    const parsed = Math.max(1, parseInt(newVal, 10) || 15);
    setPaceTarget(parsed);
    localStorage.setItem('crm_weekly_meeting_pace_target', String(parsed));
    setIsEditingPaceTarget(false);
    addToast(`Weekly pace target updated to ${parsed} people`, 'info');
  };

  const handleOpenAddMeeting = (preferredDateStr = null) => {
    let targetDateStr = preferredDateStr;
    if (!targetDateStr) {
      if (selectedPaceDay?.dateStr) {
        targetDateStr = selectedPaceDay.dateStr;
      } else {
        const nextMon = new Date(weekRange.start);
        targetDateStr = `${nextMon.getFullYear()}-${String(nextMon.getMonth() + 1).padStart(2, '0')}-${String(nextMon.getDate()).padStart(2, '0')}`;
      }
    }
    setMeetingForm({
      title: '',
      category: 'social',
      clientId: '',
      date: targetDateStr,
      startTime: '10:00',
      endTime: '11:00',
      location: '',
      channel: 'Coffee'
    });
    setIsAddMeetingModalOpen(true);
  };

  const handleAddMeetingSubmit = async (e) => {
    e.preventDefault();
    if (!meetingForm.title.trim() || !meetingForm.date) {
      addToast('Please enter a meeting title and date', 'error');
      return;
    }
    setIsSubmittingMeeting(true);
    try {
      if (window.electronAPI?.addTask) {
        const res = await window.electronAPI.addTask({
          clientId: meetingForm.clientId || null,
          description: meetingForm.title.trim(),
          dueDate: meetingForm.date,
          dueTime: meetingForm.startTime || null,
          dueEndTime: meetingForm.endTime || null,
          location: meetingForm.location.trim() || '',
          channel: meetingForm.channel || 'Coffee',
          type: 'meeting',
          priority: 'Normal'
        });
        if (res.success) {
          addToast(`Meeting scheduled: "${meetingForm.title.trim()}"`, 'success');
          setIsAddMeetingModalOpen(false);
          await loadData();
        } else {
          addToast(res.error || 'Failed to schedule meeting', 'error');
        }
      }
    } catch (err) {
      addToast(err.message || 'Error creating meeting', 'error');
    } finally {
      setIsSubmittingMeeting(false);
    }
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
    if (client?.isProspect) {
      if (onNavigateTab) onNavigateTab('projects');
      return;
    }
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
    <div className="view-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '100%', height: 'auto', flexShrink: 0, paddingBottom: '32px' }}>

      {/* ── Page Header ──────────────────────────────────────── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px', flexShrink: 0 }}>
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

      {/* ── Row 1: 5 Clickable KPI Cards ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', flexShrink: 0 }}>
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
        <StatCard
          icon={<Target size={18} />} iconColor="#c084fc"
          label={`${weekRange.shortLabel} Pace`}
          value={`${pacemakerData.totalPeople} / ${paceTarget}`}
          sub={`${Math.round((pacemakerData.totalPeople / paceTarget) * 100)}% pace · ${pacemakerData.totalPeople >= paceTarget ? 'Target Hit! 🔥' : `${Math.max(0, paceTarget - pacemakerData.totalPeople)} more to book`}`}
          subColor={pacemakerData.totalPeople >= paceTarget ? '#34d399' : pacemakerData.totalPeople >= Math.ceil(paceTarget * 0.6) ? '#fbbf24' : 'var(--text-muted)'}
          onClick={() => {
            setIsPacemakerExpanded(true);
            const el = document.getElementById('weekly-pacemaker-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      </div>

      {/* ── Action Center: High-Priority Reminders & Follow-ups Banner ── */}
      {urgentActionItems.length > 0 && (
        <div style={{
          background: overduePendingTasks.length > 0
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)'
            : 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
          border: overduePendingTasks.length > 0
            ? '1px solid rgba(239, 68, 68, 0.3)'
            : '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '14px',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          flexShrink: 0
        }}>
          {/* Banner Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div style={{
                padding: '6px',
                borderRadius: '8px',
                backgroundColor: overduePendingTasks.length > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                color: overduePendingTasks.length > 0 ? '#f87171' : '#fbbf24',
                display: 'flex'
              }}>
                <Bell size={16} style={{ animation: overduePendingTasks.length > 0 ? 'pulse 2s infinite' : 'none' }} />
              </div>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Action Center: Priorities & Due Items</span>
                  {overduePendingTasks.length > 0 && (
                    <span style={{ fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.25)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                      {overduePendingTasks.length} Overdue
                    </span>
                  )}
                  {todayPendingTasks.length > 0 && (
                    <span style={{ fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.25)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                      {todayPendingTasks.length} Due Today
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Complete or postpone follow-ups to maintain prompt client engagement
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => onNavigateTab && onNavigateTab('schedule')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                Full Calendar <ChevronRight size={12} />
              </button>
              <button
                onClick={() => setIsActionCenterCollapsed(prev => !prev)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '6px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {isActionCenterCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                <span>{isActionCenterCollapsed ? 'Expand' : 'Collapse'}</span>
              </button>
            </div>
          </div>

          {/* Banner Item Cards Grid */}
          {!isActionCenterCollapsed && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '10px'
            }}>
              {urgentActionItems.slice(0, 4).map(task => {
                const isOverdue = task.dueDate < todayDateStr;
                const isSnoozeOpen = activeDashboardSnoozeId === task.id;
                const matchedClient = clients.find(c => c.id === task.clientId);
                const isProspect = task.isProspect || (!matchedClient && task.clientName && task.clientName !== 'Unknown Client' && task.clientName !== 'Client');
                const clientName = matchedClient ? (matchedClient.preferredName || matchedClient.fullName) : (task.clientName || 'Client');
                const clientPhone = matchedClient ? matchedClient.phone : task.clientPhone;

                return (
                  <div
                    key={task.id}
                    style={{
                      background: 'rgba(18, 18, 24, 0.7)',
                      border: isOverdue ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-light)',
                      borderLeft: `3px solid ${isOverdue ? '#f87171' : '#fbbf24'}`,
                      borderRadius: '10px',
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '7px',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {task.type === 'meeting' && (
                          <span style={{ fontSize: '9.5px', fontWeight: '700', padding: '1px 5px', borderRadius: '3px', backgroundColor: 'rgba(139, 92, 246, 0.2)', color: '#c084fc' }}>
                            📅 Meeting
                          </span>
                        )}
                        {task.type === 'followup' && (
                          <span style={{ fontSize: '9.5px', fontWeight: '700', padding: '1px 5px', borderRadius: '3px', backgroundColor: 'rgba(6, 182, 212, 0.2)', color: '#38bdf8' }}>
                            📞 Follow-up
                          </span>
                        )}
                        {(!task.type || task.type === 'task') && (
                          <span style={{ fontSize: '9.5px', fontWeight: '700', padding: '1px 5px', borderRadius: '3px', backgroundColor: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)' }}>
                            📋 Task
                          </span>
                        )}
                        {task.priority && task.priority !== 'Normal' && (
                          <span style={{
                            fontSize: '8.5px',
                            fontWeight: '700',
                            padding: '1px 4px',
                            borderRadius: '3px',
                            backgroundColor: task.priority === 'Urgent' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.2)',
                            color: task.priority === 'Urgent' ? '#f87171' : '#fbbf24'
                          }}>
                            {task.priority}
                          </span>
                        )}
                      </div>

                      <span style={{ fontSize: '10.5px', fontWeight: '600', color: isOverdue ? '#f87171' : '#fbbf24', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={10} />
                        {isOverdue ? `Overdue (${task.dueDate})` : (task.dueTime ? `Today at ${task.dueTime}` : 'Due Today')}
                      </span>
                    </div>

                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: '500', color: 'var(--text-primary)', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={task.description}>
                        {task.description}
                      </div>
                      <div
                        style={{ 
                          fontSize: '11px', 
                          color: isProspect ? '#c084fc' : 'var(--accent-primary)', 
                          fontWeight: '600', 
                          marginTop: '2px', 
                          cursor: 'pointer', 
                          textDecoration: 'underline',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        onClick={() => {
                          if (matchedClient) handleOpenClient(matchedClient);
                          else if (isProspect && onNavigateTab) onNavigateTab('special-projects');
                        }}
                        title={isProspect ? "Project 100 Prospect (Click to view Special Projects)" : "Click to view client file"}
                      >
                        {isProspect && (
                          <span style={{ 
                            fontSize: '8.5px', 
                            fontWeight: '700', 
                            padding: '1px 4px', 
                            borderRadius: '3px', 
                            backgroundColor: 'rgba(192, 132, 252, 0.2)', 
                            color: '#c084fc', 
                            textDecoration: 'none' 
                          }}>
                            🎯 Prospect
                          </span>
                        )}
                        {clientName}
                      </div>
                    </div>

                    {/* Action Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => handleCompleteTask(task)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '10.5px',
                            fontWeight: '600',
                            backgroundColor: 'rgba(52, 211, 153, 0.15)',
                            color: '#34d399',
                            border: '1px solid rgba(52, 211, 153, 0.3)',
                            padding: '3px 7px',
                            borderRadius: '5px',
                            cursor: 'pointer'
                          }}
                          title="Complete and log touchpoint"
                        >
                          <Check size={11} /> Done
                        </button>

                        <div style={{ position: 'relative' }}>
                          <button
                            onClick={() => setActiveDashboardSnoozeId(isSnoozeOpen ? null : task.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '10.5px',
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border-light)',
                              padding: '3px 7px',
                              borderRadius: '5px',
                              cursor: 'pointer'
                            }}
                          >
                            <Clock size={10} /> Snooze
                          </button>

                          {isSnoozeOpen && (
                            <div style={{
                              position: 'absolute',
                              bottom: '100%',
                              left: 0,
                              marginBottom: '5px',
                              width: '140px',
                              backgroundColor: 'rgba(24, 24, 32, 0.98)',
                              backdropFilter: 'blur(16px)',
                              border: '1px solid var(--border-light)',
                              borderRadius: '7px',
                              boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
                              padding: '3px',
                              zIndex: 20,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px'
                            }}>
                              {[
                                { id: '30m', label: '+30 Minutes' },
                                { id: '2h', label: '+2 Hours' },
                                { id: 'tomorrow-9am', label: 'Tomorrow 9am' },
                                { id: 'next-monday-9am', label: 'Next Mon 9am' },
                              ].map(opt => (
                                <button
                                  key={opt.id}
                                  onClick={() => {
                                    handleSnoozeTask(task.id, opt.id);
                                    setActiveDashboardSnoozeId(null);
                                  }}
                                  style={{
                                    textAlign: 'left',
                                    padding: '5px 7px',
                                    fontSize: '10.5px',
                                    color: 'var(--text-primary)',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
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

                      {clientPhone && (
                        <button
                          onClick={() => handleWhatsApp(clientPhone, clientName)}
                          style={{
                            background: 'rgba(37, 211, 102, 0.12)',
                            border: '1px solid rgba(37, 211, 102, 0.25)',
                            color: '#25D366',
                            padding: '3px 6px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '10.5px'
                          }}
                          title="WhatsApp client"
                        >
                          <MessageCircle size={11} /> WhatsApp
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Weekly Activity Pacemaker Hero Widget (Pace for 15 People to Meet) ── */}
      <div 
        id="weekly-pacemaker-section"
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(6, 182, 212, 0.04) 50%, rgba(16, 185, 129, 0.06) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          borderRadius: '12px',
          padding: '12px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          position: 'relative',
          flexShrink: 0
        }}
      >
        {/* Glow Accent */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Top Control & Metric Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', zIndex: 1 }}>
          {/* Left Title & Target */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              padding: '6px',
              borderRadius: '8px',
              background: pacemakerData.totalPeople >= paceTarget ? 'rgba(16, 185, 129, 0.2)' : 'rgba(139, 92, 246, 0.2)',
              color: pacemakerData.totalPeople >= paceTarget ? '#34d399' : '#a78bfa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Flame size={16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Weekly Activity Pacemaker
                </span>
                {isEditingPaceTarget ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: '5px', border: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Target:</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={tempPaceTarget}
                      onChange={e => setTempPaceTarget(e.target.value)}
                      style={{ width: '40px', padding: '1px 3px', fontSize: '10.5px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-light)', borderRadius: '4px', color: '#fff', textAlign: 'center' }}
                    />
                    <button
                      onClick={() => handleSavePaceTarget(tempPaceTarget)}
                      style={{ background: 'var(--accent-primary)', border: 'none', color: '#fff', borderRadius: '3px', padding: '1px 5px', fontSize: '9.5px', cursor: 'pointer' }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingPaceTarget(false)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', borderRadius: '3px', padding: '1px 3px', fontSize: '9.5px', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <span
                    onClick={() => {
                      setTempPaceTarget(paceTarget);
                      setIsEditingPaceTarget(true);
                    }}
                    style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: pacemakerData.totalPeople >= paceTarget ? 'rgba(16, 185, 129, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                      color: pacemakerData.totalPeople >= paceTarget ? '#34d399' : '#c084fc',
                      border: `1px solid ${pacemakerData.totalPeople >= paceTarget ? 'rgba(16, 185, 129, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Click to edit pace target"
                  >
                    🎯 Target: {paceTarget} People / Week <Edit3 size={9} style={{ opacity: 0.7 }} />
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                {weekRange.label} · Pace for clients, prospects, social catch-ups & networking
              </div>
            </div>
          </div>

          {/* Center Progress Metric at a Glance */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
              <span style={{
                fontSize: '20px',
                fontWeight: '800',
                color: pacemakerData.totalPeople >= paceTarget ? '#34d399' : '#ffffff',
                lineHeight: '1'
              }}>
                {pacemakerData.totalPeople}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>
                / {paceTarget} People
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '130px' }}>
              <div style={{
                width: '100%',
                height: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '999px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, Math.round((pacemakerData.totalPeople / paceTarget) * 100))}%`,
                  background: pacemakerData.totalPeople >= paceTarget
                    ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                    : 'linear-gradient(90deg, #8b5cf8 0%, #06b6d4 50%, #10b981 100%)',
                  borderRadius: '999px',
                  boxShadow: pacemakerData.totalPeople >= paceTarget
                    ? '0 0 8px rgba(16, 185, 129, 0.5)'
                    : '0 0 8px rgba(139, 92, 246, 0.4)'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-muted)' }}>
                <span>{Math.round((pacemakerData.totalPeople / paceTarget) * 100)}% pace</span>
                <span>{pacemakerData.totalPeople >= paceTarget ? 'Met! 🔥' : `${Math.max(0, paceTarget - pacemakerData.totalPeople)} left`}</span>
              </div>
            </div>
          </div>

          {/* Right Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Timeframe Selector Pills */}
            <div style={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border-light)' }}>
              {[
                { id: 'following', label: 'Following Wk' },
                { id: 'next-7', label: 'Next 7 Days' },
                { id: 'current', label: 'This Week' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setPaceTimeframe(opt.id);
                    setSelectedPaceDay(null);
                  }}
                  style={{
                    background: paceTimeframe === opt.id ? 'var(--accent-primary)' : 'transparent',
                    color: paceTimeframe === opt.id ? '#ffffff' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '10.5px',
                    fontWeight: paceTimeframe === opt.id ? '600' : 'normal',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* + Arrange Meeting Action */}
            <button
              onClick={() => handleOpenAddMeeting()}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                padding: '4px 10px',
                background: 'linear-gradient(135deg, #8b5cf8 0%, #06b6d4 100%)',
                border: 'none',
                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.25)'
              }}
            >
              <Plus size={12} /> <span>Arrange Meeting</span>
            </button>

            {/* Collapse / Expand Toggle */}
            <button
              onClick={() => setIsPacemakerExpanded(prev => !prev)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-light)',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                padding: '4px 8px',
                fontSize: '10.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {isPacemakerExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              <span>{isPacemakerExpanded ? 'Hide Schedule' : 'View Schedule'}</span>
            </button>
          </div>
        </div>

        {/* Archie Copilot Pacing Insight & AI Verification Status Banner */}
        <div style={{
          backgroundColor: pacemakerData.isAiVerified ? 'rgba(139, 92, 246, 0.12)' : 'rgba(255, 255, 255, 0.03)',
          border: `1px solid ${pacemakerData.isAiVerified ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
          borderRadius: '8px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: pacemakerData.isAiVerified ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.08)',
              color: pacemakerData.isAiVerified ? '#c084fc' : 'var(--text-muted)',
              flexShrink: 0
            }}>
              <Sparkles size={14} />
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
              <span style={{ fontWeight: '700', color: pacemakerData.isAiVerified ? '#c084fc' : '#a78bfa', marginRight: '6px' }}>
                Archie Copilot:
              </span>
              <span>{pacemakerData.archieInsight}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '10px',
              fontWeight: '600',
              padding: '2px 7px',
              borderRadius: '10px',
              backgroundColor: pacemakerData.isAiVerified ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
              color: pacemakerData.isAiVerified ? '#34d399' : '#38bdf8',
              border: `1px solid ${pacemakerData.isAiVerified ? 'rgba(16, 185, 129, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {pacemakerData.isAiVerified ? '✨ Archie AI Verified' : '⚡ Smart Reconciled'}
            </span>

            {window.electronAPI?.reconcilePacemakerWithAi && (
              <button
                onClick={() => runAiReconciliation(true)}
                disabled={isAiReconciling}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '6px',
                  color: isAiReconciling ? 'var(--text-muted)' : 'var(--text-secondary)',
                  padding: '3px 8px',
                  fontSize: '10.5px',
                  cursor: isAiReconciling ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
                title="Force AI re-analysis and de-duplication with Gemini"
              >
                <RefreshCw size={11} className={isAiReconciling ? 'animate-spin' : ''} />
                <span>{isAiReconciling ? 'Analyzing with AI...' : 'Re-analyze with AI'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Breakdown Chips Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingTop: '2px' }}>
          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginRight: '2px' }}>Breakdown:</span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.25)', fontSize: '11px' }}>
            <span style={{ color: 'var(--text-muted)' }}>💼 Clients</span>
            <span style={{ fontWeight: '700', color: '#34d399' }}>{pacemakerData.clientsCount}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(192, 132, 252, 0.1)', border: '1px solid rgba(192, 132, 252, 0.25)', fontSize: '11px' }}>
            <span style={{ color: 'var(--text-muted)' }}>🎯 Prospects</span>
            <span style={{ fontWeight: '700', color: '#c084fc' }}>{pacemakerData.prospectsCount}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(251, 146, 60, 0.1)', border: '1px solid rgba(251, 146, 60, 0.25)', fontSize: '11px' }}>
            <span style={{ color: 'var(--text-muted)' }}>☕ Social</span>
            <span style={{ fontWeight: '700', color: '#fb923c' }}>{pacemakerData.socialCount}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', fontSize: '11px' }}>
            <span style={{ color: 'var(--text-muted)' }}>🤝 Networking</span>
            <span style={{ fontWeight: '700', color: '#38bdf8' }}>{pacemakerData.networkingCount}</span>
          </div>

          {pacemakerData.workCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(96, 165, 250, 0.1)', border: '1px solid rgba(96, 165, 250, 0.25)', fontSize: '11px' }} title="External business meetings with invited participants">
              <span style={{ color: 'var(--text-muted)' }}>🏢 Work Meetings</span>
              <span style={{ fontWeight: '700', color: '#60a5fa' }}>{pacemakerData.workCount}</span>
            </div>
          )}

          {pacemakerData.internalCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(148, 163, 184, 0.1)', border: '1px solid rgba(148, 163, 184, 0.25)', fontSize: '11px' }} title="Internal agency meetings & training sessions are excluded from external sales pace target">
              <span style={{ color: 'var(--text-muted)' }}>🎓 Training / Agency</span>
              <span style={{ fontWeight: '700', color: '#94a3b8' }}>{pacemakerData.internalCount}</span>
              <span style={{ fontSize: '9.5px', color: '#64748b' }}>(Excluded)</span>
            </div>
          )}

          {pacemakerData.personalCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)', fontSize: '11px' }} title="Medical appointments, domestic servicing & personal errands are excluded from external sales pace target">
              <span style={{ color: 'var(--text-muted)' }}>🏥 Medical & Personal</span>
              <span style={{ fontWeight: '700', color: '#f43f5e' }}>{pacemakerData.personalCount}</span>
              <span style={{ fontSize: '9.5px', color: '#64748b' }}>(Excluded)</span>
            </div>
          )}

          {pacemakerData.mergedCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.25)', fontSize: '11px' }} title="Calendar events and CRM tasks deduplicated together">
              <span style={{ color: 'var(--text-muted)' }}>🔗 Merged Duplicates</span>
              <span style={{ fontWeight: '700', color: '#c084fc' }}>{pacemakerData.mergedCount}</span>
            </div>
          )}
        </div>

        {/* Expanded 7-Day Strip & Meeting Roster */}
        {isPacemakerExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {/* 7-Day Activity Distribution Strip */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  7-Day Activity Distribution · Click day to filter meetings
                </span>
                {selectedPaceDay && (
                  <button
                    onClick={() => setSelectedPaceDay(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-secondary)', fontSize: '10.5px', cursor: 'pointer', padding: 0 }}
                  >
                    Clear Day Filter (Show All {pacemakerData.items.length})
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                {pacemakerData.daysStrip.map(day => {
                  const isSelected = selectedPaceDay?.dateStr === day.dateStr;
                  const hasActivity = day.peopleCount > 0;
                  return (
                    <div
                      key={day.dateStr}
                      onClick={() => setSelectedPaceDay(isSelected ? null : day)}
                      style={{
                        backgroundColor: isSelected
                          ? 'rgba(139, 92, 246, 0.2)'
                          : hasActivity
                            ? 'rgba(255, 255, 255, 0.03)'
                            : 'rgba(255, 255, 255, 0.01)',
                        border: isSelected
                          ? '1px solid #a78bfa'
                          : hasActivity
                            ? '1px solid rgba(139, 92, 246, 0.3)'
                            : '1px solid var(--border-light)',
                        borderRadius: '8px',
                        padding: '6px 4px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '3px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 0 10px rgba(139, 92, 246, 0.3)' : 'none'
                      }}
                    >
                      <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{day.dayName}</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: hasActivity ? '#ffffff' : 'var(--text-secondary)' }}>{day.dayNum}</span>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: '600',
                        padding: '1px 4px',
                        borderRadius: '4px',
                        backgroundColor: hasActivity ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                        color: hasActivity ? '#34d399' : 'var(--text-muted)'
                      }}>
                        {hasActivity ? `${day.peopleCount} ${day.peopleCount === 1 ? 'person' : 'people'}` : 'Open'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Collapsible Scheduled Meetings Roster */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  {selectedPaceDay
                    ? `Meetings for ${selectedPaceDay.dayName}, ${selectedPaceDay.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (${(selectedPaceDay.items || []).length})`
                    : `All Arranged Engagements (${pacemakerData.items.length})`}
                </span>
                <button
                  onClick={() => handleOpenAddMeeting(selectedPaceDay?.dateStr)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                >
                  <Plus size={12} /> Book for this week
                </button>
              </div>

              {(() => {
                const activeList = selectedPaceDay ? (selectedPaceDay.items || []) : pacemakerData.items;

                if (activeList.length === 0) {
                  return (
                    <div style={{
                      padding: '20px 16px',
                      textAlign: 'center',
                      backgroundColor: 'rgba(0,0,0,0.15)',
                      borderRadius: '8px',
                      border: '1px dashed var(--border-light)',
                      color: 'var(--text-muted)',
                      fontSize: '11.5px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <Coffee size={20} style={{ opacity: 0.4 }} />
                      <span>No meetings arranged {selectedPaceDay ? 'for this day' : 'for this period'} yet.</span>
                      <button
                        onClick={() => handleOpenAddMeeting(selectedPaceDay?.dateStr)}
                        className="btn"
                        style={{ fontSize: '10.5px', padding: '3px 8px', backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)', marginTop: '2px' }}
                      >
                        <Plus size={11} /> Schedule Catch-up or Meeting
                      </button>
                    </div>
                  );
                }

                return (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '8px',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    paddingRight: '4px'
                  }}>
                    {activeList.map(item => {
                      const isClient = item.client;
                      const phone = item.client?.phone;
                      const displayName = item.client ? (item.client.preferredName || item.client.fullName) : null;

                      return (
                        <div
                          key={item.id}
                          style={{
                            backgroundColor: 'rgba(18, 18, 24, 0.75)',
                            border: '1px solid var(--border-light)',
                            borderLeft: `3px solid ${item.categoryColor}`,
                            borderRadius: '8px',
                            padding: '8px 10px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '5px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', marginBottom: '2px' }}>
                                <span style={{
                                  fontSize: '9.5px',
                                  fontWeight: '700',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  backgroundColor: item.categoryBg,
                                  color: item.categoryColor
                                }}>
                                  {item.categoryLabel}
                                </span>

                                {item.isMerged ? (
                                  <span style={{ fontSize: '9px', color: '#a78bfa', backgroundColor: 'rgba(167, 139, 250, 0.15)', border: '1px solid rgba(167, 139, 250, 0.3)', padding: '1px 5px', borderRadius: '3px', fontWeight: '600' }} title="Calendar event deduplicated with CRM task">
                                    🔗 Cal + Task Synced
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', backgroundColor: 'rgba(255,255,255,0.04)', padding: '1px 4px', borderRadius: '3px' }}>
                                    {item.source === 'google' ? 'Google Cal' : 'CRM Schedule'}
                                  </span>
                                )}

                                {!item.isExternalPace && (
                                  <span style={{ fontSize: '9px', color: item.category === 'personal' ? '#f43f5e' : '#94a3b8', backgroundColor: item.category === 'personal' ? 'rgba(244, 63, 94, 0.12)' : 'rgba(148, 163, 184, 0.12)', border: `1px solid ${item.category === 'personal' ? 'rgba(244, 63, 94, 0.25)' : 'rgba(148, 163, 184, 0.25)'}`, padding: '1px 5px', borderRadius: '3px' }} title={item.aiReason || item.pacingTag || "Internal, training, or medical session, excluded from sales pace"}>
                                    Excluded from Pace
                                  </span>
                                )}

                                {item.isExternalPace && item.peopleCount > 1 && (
                                  <span style={{ fontSize: '9px', color: '#c084fc', fontWeight: '600' }}>
                                    👥 {item.peopleCount} people
                                  </span>
                                )}

                                {item.aiReason && (
                                  <span style={{ fontSize: '9px', color: item.isExternalPace ? '#34d399' : '#94a3b8', backgroundColor: item.isExternalPace ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.04)', padding: '1px 4px', borderRadius: '3px' }} title={item.aiReason}>
                                    ✨ AI Reconciled
                                  </span>
                                )}
                              </div>
                              <div
                                style={{
                                  fontSize: '12.5px',
                                  fontWeight: '600',
                                  color: 'var(--text-primary)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                                title={item.title}
                              >
                                {item.title}
                              </div>
                              {item.aiReason && (
                                <div style={{ fontSize: '10px', color: item.isExternalPace ? '#34d399' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }} title={item.aiReason}>
                                  <Info size={10} style={{ color: item.isExternalPace ? '#34d399' : (item.category === 'personal' ? '#f43f5e' : '#94a3b8'), flexShrink: 0 }} />
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.aiReason}</span>
                                </div>
                              )}
                            </div>

                            <span style={{
                              fontSize: '10.5px',
                              color: 'var(--text-muted)',
                              fontFamily: 'monospace',
                              backgroundColor: 'rgba(255,255,255,0.03)',
                              padding: '2px 5px',
                              borderRadius: '4px',
                              whiteSpace: 'nowrap'
                            }}>
                              {item.timeStr}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', color: 'var(--text-muted)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                              <span>📅 {item.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                              {item.location && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  <MapPin size={9} /> {item.location}
                                </span>
                              )}
                            </div>

                            {isClient && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <button
                                  onClick={() => handleOpenClient(item.client)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: item.client?.isProspect ? '#c084fc' : 'var(--accent-primary)',
                                    fontSize: '10.5px',
                                    cursor: 'pointer',
                                    padding: 0,
                                    textDecoration: 'underline'
                                  }}
                                  title={item.client?.isProspect ? 'View in Project 100 Prospects' : 'View Client Profile'}
                                >
                                  {item.client?.isProspect ? `🎯 ${displayName}` : displayName}
                                </button>
                                {phone && (
                                  <button
                                    onClick={() => handleWhatsApp(phone, displayName)}
                                    style={{
                                      background: 'rgba(37, 211, 102, 0.12)',
                                      border: '1px solid rgba(37, 211, 102, 0.25)',
                                      color: '#25D366',
                                      padding: '2px 5px',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '2px',
                                      fontSize: '9.5px'
                                    }}
                                    title="WhatsApp"
                                  >
                                    <MessageCircle size={9} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* ── Row 2: AI Briefing (span 2) + Today's Schedule + Overdue ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', flexShrink: 0 }}>

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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flexShrink: 0 }}>

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      {task.type === 'meeting' && (
                        <span style={{ fontSize: '9px', fontWeight: '600', padding: '1px 5px', borderRadius: '3px', backgroundColor: 'rgba(139,92,246,0.15)', color: '#c084fc' }}>
                          📅 Meeting
                        </span>
                      )}
                      {task.type === 'followup' && (
                        <span style={{ fontSize: '9px', fontWeight: '600', padding: '1px 5px', borderRadius: '3px', backgroundColor: 'rgba(6,182,212,0.15)', color: '#38bdf8' }}>
                          📞 Follow-up
                        </span>
                      )}
                      {task.priority && task.priority !== 'Normal' && (
                        <span style={{
                          fontSize: '8.5px',
                          fontWeight: '600',
                          padding: '0px 4px',
                          borderRadius: '3px',
                          backgroundColor: task.priority === 'Urgent' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: task.priority === 'Urgent' ? '#f87171' : '#fbbf24'
                        }}>
                          {task.priority}
                        </span>
                      )}
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)', wordBreak: 'break-word' }}>{task.description}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#a78bfa', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{task.clientName}</span>
                      {task.dueDate && <span style={{ color: 'var(--text-muted)' }}>• Due {task.dueDate}</span>}
                      {task.dueTime && <span style={{ color: 'var(--text-muted)' }}>• {task.dueTime}</span>}
                    </div>
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

      {/* ── Modal: Arrange Meeting / Add to Pace ───────────────────────── */}
      {isAddMeetingModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, transparent 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc' }}>
                  <Calendar size={16} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)', fontWeight: '700' }}>
                    Arrange Meeting / Add to Weekly Pace
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Log an engagement towards your weekly goal of {paceTarget} people
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsAddMeetingModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddMeetingSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Meeting Category Selector */}
              <div>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>
                  Engagement Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {[
                    { id: 'social', label: '☕ Social Catch-up', color: '#fb923c' },
                    { id: 'client', label: '👥 Client Meeting', color: '#34d399' },
                    { id: 'prospect', label: '🎯 Prospect Fact-Find', color: '#c084fc' },
                    { id: 'networking', label: '🤝 Networking', color: '#38bdf8' },
                    { id: 'meeting', label: '💼 Work Session', color: '#60a5fa' },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setMeetingForm({ ...meetingForm, category: cat.id })}
                      style={{
                        padding: '6px 8px',
                        fontSize: '11px',
                        fontWeight: '600',
                        borderRadius: '6px',
                        border: meetingForm.category === cat.id ? `1px solid ${cat.color}` : '1px solid var(--border-light)',
                        backgroundColor: meetingForm.category === cat.id ? `${cat.color}22` : 'rgba(255,255,255,0.02)',
                        color: meetingForm.category === cat.id ? cat.color : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title / Description */}
              <div>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>
                  Meeting Title / Purpose *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Coffee catch-up with Kevin / Annual Portfolio Review"
                  className="input-field"
                  style={{ width: '100%' }}
                  value={meetingForm.title}
                  onChange={e => setMeetingForm({ ...meetingForm, title: e.target.value })}
                />
              </div>

              {/* Link CRM Client / Prospect (Optional) */}
              <div>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>
                  Link to Client / Prospect (Optional)
                </label>
                <select
                  className="input-field"
                  style={{ width: '100%' }}
                  value={meetingForm.clientId}
                  onChange={e => {
                    const cid = e.target.value;
                    const matched = clients.find(c => c.id === cid);
                    setMeetingForm({
                      ...meetingForm,
                      clientId: cid,
                      title: meetingForm.title || (matched ? `Meeting with ${matched.fullName}` : '')
                    });
                  }}
                >
                  <option value="">-- No linked CRM record (Social / External / New Contact) --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} {c.preferredName ? `("${c.preferredName}")` : ''} ({c.clientStatus})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    style={{ width: '100%' }}
                    value={meetingForm.date}
                    onChange={e => setMeetingForm({ ...meetingForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    className="input-field"
                    style={{ width: '100%' }}
                    value={meetingForm.startTime}
                    onChange={e => setMeetingForm({ ...meetingForm, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    className="input-field"
                    style={{ width: '100%' }}
                    value={meetingForm.endTime}
                    onChange={e => setMeetingForm({ ...meetingForm, endTime: e.target.value })}
                  />
                </div>
              </div>

              {/* Location & Channel */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Venue / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Starbucks Raffles City / Zoom"
                    className="input-field"
                    style={{ width: '100%' }}
                    value={meetingForm.location}
                    onChange={e => setMeetingForm({ ...meetingForm, location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Channel
                  </label>
                  <select
                    className="input-field"
                    style={{ width: '100%' }}
                    value={meetingForm.channel}
                    onChange={e => setMeetingForm({ ...meetingForm, channel: e.target.value })}
                  >
                    <option value="Coffee">☕ Coffee / Casual</option>
                    <option value="Lunch">🍽️ Lunch / Dinner</option>
                    <option value="In-Person">🏢 Office / In-Person</option>
                    <option value="Video">💻 Zoom / Video Call</option>
                    <option value="Phone Call">📞 Phone Discussion</option>
                  </select>
                </div>
              </div>

              {/* Footer Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid var(--border-light)' }}>
                <button
                  type="button"
                  onClick={() => setIsAddMeetingModalOpen(false)}
                  className="btn"
                  style={{ backgroundColor: 'transparent', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMeeting}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf8 0%, #06b6d4 100%)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 18px',
                    fontWeight: '600'
                  }}
                >
                  {isSubmittingMeeting ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />}
                  <span>Save & Add to Pace</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
