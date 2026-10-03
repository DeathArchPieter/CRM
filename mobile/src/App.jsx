import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, Coffee, Users, CheckCircle2, Circle, 
  Plus, MessageSquare, Flame, ChevronRight, Phone, Send, Search,
  RefreshCw, Award, ArrowRight, ShieldCheck, Check, Sparkles, X,
  Maximize2, Smartphone, LayoutGrid, CheckSquare, ChevronDown, UserCheck
} from 'lucide-react';
import { db } from './firebase';
import { 
  collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy, serverTimestamp 
} from 'firebase/firestore';
import initialClients from './data/initialClients.json';

const PROJECT_ID = 'beetsma-crm-companion';
const BASE_FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

export default function App() {
  // Foldable Detection (Samsung Fold inner screen >= 600px viewport)
  const [isFoldable, setIsFoldable] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 600;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsFoldable(window.innerWidth >= 600);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Standard Mobile State
  const [activeTab, setActiveTab] = useState('pacemaker'); // 'pacemaker' | 'book' | 'debrief' | 'directory'
  const [appointments, setAppointments] = useState([]);
  const [debriefs, setDebriefs] = useState([]);
  const [syncStatus, setSyncStatus] = useState('online');

  // Client Aliases: Initialized with pre-bundled initialClients so all 34 clients are ready immediately!
  const [clientAliases, setClientAliases] = useState(() => {
    try {
      const cached = localStorage.getItem('crm_mobile_aliases');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return Array.isArray(initialClients) ? initialClients : [];
  });

  // Client Picker Modal State
  const [isClientPickerOpen, setIsClientPickerOpen] = useState(false);
  const [clientPickerSearch, setClientPickerSearch] = useState('');
  const [clientPickerMode, setClientPickerMode] = useState('book'); // 'book' | 'debrief'

  // Foldable Dual-Pane State
  const [foldableLeftTab, setFoldableLeftTab] = useState('appointments'); // 'appointments' | 'directory'
  const [foldableRightMode, setFoldableRightMode] = useState('book'); // 'book' | 'debrief' | 'history' | 'clientDetails'
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [selectedClientForView, setSelectedClientForView] = useState(null);
  const [selectedDayFilter, setSelectedDayFilter] = useState('all');

  // Debrief Form State
  const [debriefOutcome, setDebriefOutcome] = useState('Great Progress');
  const [debriefNotes, setDebriefNotes] = useState('');
  const [nextActionDate, setNextActionDate] = useState('');
  const [nextActionTask, setNextActionTask] = useState('');
  const [isSubmittingDebrief, setIsSubmittingDebrief] = useState(false);
  const [debriefSuccessToast, setDebriefSuccessToast] = useState(false);

  // Quick Book Form State
  const [bookAlias, setBookAlias] = useState('');
  const [bookType, setBookType] = useState('social');
  const [bookTitle, setBookTitle] = useState('');
  const [bookDate, setBookDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [bookTime, setBookTime] = useState('14:30');
  const [bookDuration, setBookDuration] = useState('60');
  const [bookVenue, setBookVenue] = useState('Cafe / Coffee Shop');
  const [isSubmittingBook, setIsSubmittingBook] = useState(false);
  const [bookSuccessToast, setBookSuccessToast] = useState(false);

  // Directory Search
  const [directorySearch, setDirectorySearch] = useState('');
  const [isAddAliasOpen, setIsAddAliasOpen] = useState(false);
  const [newAliasName, setNewAliasName] = useState('');
  const [newAliasPhone, setNewAliasPhone] = useState('');
  const [newAliasTag, setNewAliasTag] = useState('Prospect');

  // Pacemaker Target (15 people / week)
  const weeklyTarget = 15;

  // Direct REST API Sync on mount (Guarantees data loading regardless of WebSocket / WebView status)
  const fetchRestData = async () => {
    try {
      // 1. Fetch Client Aliases via REST
      const aliasRes = await fetch(`${BASE_FIRESTORE_URL}/client_aliases?pageSize=100`);
      if (aliasRes.ok) {
        const aliasData = await aliasRes.json();
        if (Array.isArray(aliasData.documents) && aliasData.documents.length > 0) {
          const fetchedList = aliasData.documents.map(d => {
            const f = d.fields || {};
            return {
              id: d.name.split('/').pop(),
              alias: f.alias?.stringValue || '',
              tag: f.tag?.stringValue || 'Client',
              phone: f.phone?.stringValue || '',
              syncId: f.syncId?.stringValue || ''
            };
          }).filter(c => c.alias);

          if (fetchedList.length > 0) {
            fetchedList.sort((a, b) => a.alias.localeCompare(b.alias));
            setClientAliases(fetchedList);
            try {
              localStorage.setItem('crm_mobile_aliases', JSON.stringify(fetchedList));
            } catch (_) {}
            setSyncStatus('online');
          }
        }
      }

      // 2. Fetch Appointments via REST
      const apptRes = await fetch(`${BASE_FIRESTORE_URL}/appointments?pageSize=100`);
      if (apptRes.ok) {
        const apptData = await apptRes.json();
        if (Array.isArray(apptData.documents)) {
          const apptList = apptData.documents.map(d => {
            const f = d.fields || {};
            return {
              id: d.name.split('/').pop(),
              clientAlias: f.clientAlias?.stringValue || '',
              type: f.type?.stringValue || 'meeting',
              title: f.title?.stringValue || '',
              date: f.date?.stringValue || '',
              time: f.time?.stringValue || '',
              durationMinutes: f.durationMinutes?.integerValue ? parseInt(f.durationMinutes.integerValue, 10) : 60,
              venue: f.venue?.stringValue || '',
              status: f.status?.stringValue || 'Scheduled',
              debriefLogged: f.debriefLogged?.booleanValue || false
            };
          });
          apptList.sort((a, b) => (a.date + ' ' + (a.time || '')).localeCompare(b.date + ' ' + (b.time || '')));
          setAppointments(apptList);
        }
      }

      // 3. Fetch Debriefs via REST
      const debRes = await fetch(`${BASE_FIRESTORE_URL}/debrief_notes?pageSize=100`);
      if (debRes.ok) {
        const debData = await debRes.json();
        if (Array.isArray(debData.documents)) {
          const debList = debData.documents.map(d => {
            const f = d.fields || {};
            return {
              id: d.name.split('/').pop(),
              clientAlias: f.clientAlias?.stringValue || '',
              meetingDate: f.meetingDate?.stringValue || '',
              outcome: f.outcome?.stringValue || '',
              discussionSummary: f.discussionSummary?.stringValue || '',
              nextActionTask: f.nextActionTask?.stringValue || '',
              nextActionDate: f.nextActionDate?.stringValue || '',
              createdAt: f.createdAt?.stringValue || ''
            };
          });
          debList.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          setDebriefs(debList);
        }
      }
    } catch (restErr) {
      console.warn("Direct REST fetch error:", restErr);
    }
  };

  // Realtime Firestore Subscriptions + REST Fallback
  useEffect(() => {
    // Initial direct fetch
    fetchRestData();

    // Firestore Realtime listeners
    let unsubAppts = () => {};
    let unsubAliases = () => {};
    let unsubDebriefs = () => {};

    try {
      // 1. Appointments
      const apptQuery = query(collection(db, 'appointments'));
      unsubAppts = onSnapshot(apptQuery, (snapshot) => {
        const list = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.date + ' ' + (a.time || '')).localeCompare(b.date + ' ' + (b.time || '')));
        setAppointments(list);
        setSyncStatus('online');
      }, (err) => {
        console.warn("Firestore error for appts, using REST:", err);
      });

      // 2. Client Aliases
      const aliasQuery = query(collection(db, 'client_aliases'));
      unsubAliases = onSnapshot(aliasQuery, (snapshot) => {
        const list = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
        if (list.length > 0) {
          list.sort((a, b) => (a.alias || '').localeCompare(b.alias || ''));
          setClientAliases(list);
          try {
            localStorage.setItem('crm_mobile_aliases', JSON.stringify(list));
          } catch (_) {}
        }
      }, (err) => {
        console.warn("Firestore error for aliases, using REST:", err);
      });

      // 3. Debrief Notes
      const debriefQuery = query(collection(db, 'debrief_notes'));
      unsubDebriefs = onSnapshot(debriefQuery, (snapshot) => {
        const list = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setDebriefs(list);
      }, (err) => {
        console.warn("Firestore error for debriefs:", err);
      });
    } catch (e) {
      console.warn("Firebase listener setup exception:", e);
    }

    return () => {
      unsubAppts();
      unsubAliases();
      unsubDebriefs();
    };
  }, []);

  // Filter appointments for this week
  const todayStr = new Date().toISOString().split('T')[0];
  const meetingsThisWeek = appointments.filter(a => {
    if (!a.date) return false;
    const d = new Date(a.date);
    const now = new Date();
    const diffDays = Math.abs(d - now) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  });
  const weeklyPaceCount = meetingsThisWeek.length;
  const pacePercentage = Math.min(Math.round((weeklyPaceCount / weeklyTarget) * 100), 100);

  // Today's appointments
  const todayAppts = appointments.filter(a => a.date === todayStr);

  // Next 7 Days calculation for interactive strip
  const next7Days = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() + idx);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = idx === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const count = appointments.filter(a => a.date === dateStr).length;
    return { dateStr, dayLabel, dayNum: d.getDate(), count };
  });

  // Filtered Appointments based on Day Filter
  const displayedAppointments = appointments.filter(a => {
    if (selectedDayFilter === 'all') return true;
    return a.date === selectedDayFilter;
  });

  // Select an appointment for Debrief
  const handleSelectApptForDebrief = (appt) => {
    setSelectedAppt(appt);
    setDebriefNotes('');
    setNextActionDate('');
    setNextActionTask('');
    if (isFoldable) {
      setFoldableRightMode('debrief');
    }
  };

  // Quick Book Handler
  const handleQuickBook = async (e) => {
    e.preventDefault();
    if (!bookAlias.trim()) {
      alert("Please select or enter a client alias.");
      return;
    }
    setIsSubmittingBook(true);
    try {
      const newAppt = {
        clientAlias: bookAlias.trim(),
        type: bookType,
        title: bookTitle.trim() || `${bookType === 'social' ? '☕ Coffee Catch-Up' : 'Advisory Meeting'} with ${bookAlias.trim()}`,
        date: bookDate,
        time: bookTime,
        durationMinutes: Number(bookDuration) || 60,
        venue: bookVenue.trim() || 'Cafe',
        status: 'Scheduled',
        createdAt: new Date().toISOString(),
        deviceSource: 'android-fold-companion'
      };

      // Add to Firestore
      await addDoc(collection(db, 'appointments'), newAppt);
      
      const existing = clientAliases.find(c => c.alias?.toLowerCase() === bookAlias.trim().toLowerCase());
      if (!existing) {
        await addDoc(collection(db, 'client_aliases'), {
          alias: bookAlias.trim(),
          tag: 'Prospect',
          createdAt: new Date().toISOString()
        });
      }

      setBookSuccessToast(true);
      setTimeout(() => setBookSuccessToast(false), 3000);
      setBookTitle('');
      if (!isFoldable) {
        setActiveTab('pacemaker');
      }
      fetchRestData();
    } catch (err) {
      alert("Error booking: " + err.message);
    } finally {
      setIsSubmittingBook(false);
    }
  };

  // Submit Post-Meeting Debrief
  const handleSubmitDebrief = async (e) => {
    e.preventDefault();
    if (!debriefNotes.trim()) {
      alert("Please enter a short discussion note.");
      return;
    }
    setIsSubmittingDebrief(true);
    try {
      const debriefPayload = {
        appointmentId: selectedAppt?.id || null,
        clientAlias: selectedAppt?.clientAlias || bookAlias || 'Client',
        meetingDate: selectedAppt?.date || todayStr,
        outcome: debriefOutcome,
        discussionSummary: debriefNotes.trim(),
        nextActionDate: nextActionDate || null,
        nextActionTask: nextActionTask.trim() || null,
        createdAt: new Date().toISOString(),
        deviceSource: 'android-fold-companion'
      };

      await addDoc(collection(db, 'debrief_notes'), debriefPayload);

      if (selectedAppt?.id) {
        await updateDoc(doc(db, 'appointments', selectedAppt.id), {
          status: 'Completed',
          debriefLogged: true
        });
      }

      if (nextActionDate && nextActionTask.trim()) {
        await addDoc(collection(db, 'appointments'), {
          clientAlias: selectedAppt?.clientAlias || 'Client',
          type: 'followup',
          title: `Follow-up: ${nextActionTask.trim()}`,
          date: nextActionDate,
          time: '10:00',
          durationMinutes: 30,
          venue: 'WhatsApp / Call',
          status: 'Scheduled',
          createdAt: new Date().toISOString(),
          deviceSource: 'android-fold-companion'
        });
      }

      setDebriefSuccessToast(true);
      setTimeout(() => setDebriefSuccessToast(false), 3000);
      setSelectedAppt(null);
      setDebriefNotes('');
      setNextActionDate('');
      setNextActionTask('');
      if (isFoldable) {
        setFoldableRightMode('history');
      } else {
        setActiveTab('debrief');
      }
      fetchRestData();
    } catch (err) {
      alert("Error saving debrief: " + err.message);
    } finally {
      setIsSubmittingDebrief(false);
    }
  };

  // Add New Alias
  const handleAddNewAlias = async (e) => {
    e.preventDefault();
    if (!newAliasName.trim()) return;
    try {
      await addDoc(collection(db, 'client_aliases'), {
        alias: newAliasName.trim(),
        phone: newAliasPhone.trim() || '',
        tag: newAliasTag,
        createdAt: new Date().toISOString()
      });
      setNewAliasName('');
      setNewAliasPhone('');
      setIsAddAliasOpen(false);
      fetchRestData();
    } catch (err) {
      alert("Error adding alias: " + err.message);
    }
  };

  // Filtered Client Aliases for Dropdown / Picker
  const pickerFilteredAliases = clientAliases.filter(c => 
    (c.alias || '').toLowerCase().includes(clientPickerSearch.toLowerCase()) ||
    (c.tag || '').toLowerCase().includes(clientPickerSearch.toLowerCase()) ||
    (c.phone || '').includes(clientPickerSearch)
  );

  const filteredAliases = clientAliases.filter(c => 
    (c.alias || '').toLowerCase().includes(directorySearch.toLowerCase()) ||
    (c.tag || '').toLowerCase().includes(directorySearch.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      
      {/* Top Header */}
      <header style={{ 
        paddingTop: 'calc(var(--safe-top) + 10px)', 
        paddingBottom: '10px', 
        paddingLeft: '16px', 
        paddingRight: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(15, 23, 42, 0.96)',
        borderBottom: '1px solid var(--border-light)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '10px', 
            background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)'
          }}>
            <ShieldCheck size={18} color="#f8fafc" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '15px', fontWeight: '700', lineHeight: 1.2 }}>Beetsma Companion</h1>
              
              {isFoldable ? (
                <span style={{ 
                  fontSize: '10px', 
                  fontWeight: '700', 
                  backgroundColor: 'rgba(59, 130, 246, 0.2)', 
                  color: '#60a5fa', 
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  padding: '1px 7px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Maximize2 size={10} /> Foldable Dual-Pane
                </span>
              ) : (
                <span style={{ 
                  fontSize: '9.5px', 
                  fontWeight: '600', 
                  backgroundColor: 'rgba(255,255,255,0.06)', 
                  color: 'var(--text-muted)', 
                  padding: '1px 6px',
                  borderRadius: '10px'
                }}>
                  Cover Screen
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ 
                width: '6px', 
                height: '6px', 
                borderRadius: '50%', 
                backgroundColor: syncStatus === 'online' ? '#10b981' : '#f59e0b' 
              }} />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {syncStatus === 'online' ? `${clientAliases.length} Clients Synced` : 'Offline Cache'}
              </span>
            </div>
          </div>
        </div>

        {/* Top Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isFoldable ? (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button 
                onClick={() => {
                  setSelectedAppt(null);
                  setFoldableRightMode('book');
                }}
                className="btn-primary"
                style={{ padding: '7px 12px', fontSize: '12px', borderRadius: '8px' }}
              >
                <Plus size={14} /> + New Appt
              </button>
            </div>
          ) : (
            <button 
              onClick={() => {
                setBookAlias('');
                setActiveTab('book');
              }}
              className="btn-primary"
              style={{ padding: '7px 12px', fontSize: '12px', borderRadius: '8px' }}
            >
              <Plus size={14} /> Book
            </button>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 📐 FOLDABLE EXPANDED DUAL-PANE LAYOUT (Inner Screen >= 600px)             */}
      {/* ========================================================================= */}
      {isFoldable ? (
        <div className="foldable-container" style={{ padding: '16px', height: 'calc(100vh - 60px)' }}>
          
          {/* LEFT PANE: COMMAND & ROSTER */}
          <div className="foldable-left-pane">
            
            {/* Weekly Pacemaker Hero Card */}
            <div className="glass-panel" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fb923c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Flame size={13} /> Weekly Activity Pacemaker
                  </span>
                  <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '2px' }}>
                    {weeklyPaceCount} <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-muted)' }}>/ {weeklyTarget} met</span>
                  </div>
                </div>
                <div style={{ 
                  backgroundColor: pacePercentage >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(251, 146, 60, 0.15)',
                  color: pacePercentage >= 80 ? '#34d399' : '#fb923c',
                  padding: '3px 8px',
                  borderRadius: '16px',
                  fontSize: '11px',
                  fontWeight: '700'
                }}>
                  {pacePercentage}% Pace
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${pacePercentage}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #fb923c, #f59e0b, #10b981)',
                  borderRadius: '3px',
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>

            {/* Interactive 7-Day Day Selector Strip */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
              <button
                onClick={() => setSelectedDayFilter('all')}
                style={{
                  padding: '6px 10px',
                  borderRadius: '10px',
                  border: `1px solid ${selectedDayFilter === 'all' ? '#3b82f6' : 'var(--border-light)'}`,
                  background: selectedDayFilter === 'all' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                  color: selectedDayFilter === 'all' ? '#60a5fa' : 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
              >
                All 7 Days
              </button>

              {next7Days.map(day => (
                <button
                  key={day.dateStr}
                  onClick={() => setSelectedDayFilter(day.dateStr)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '10px',
                    border: `1px solid ${selectedDayFilter === day.dateStr ? '#3b82f6' : 'var(--border-light)'}`,
                    background: selectedDayFilter === day.dateStr ? 'rgba(59, 130, 246, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                    color: selectedDayFilter === day.dateStr ? '#60a5fa' : 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: '600',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: '44px',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '9px', opacity: 0.7 }}>{day.dayLabel}</span>
                  <span style={{ fontSize: '13px', fontWeight: '700' }}>{day.dayNum}</span>
                  {day.count > 0 && (
                    <span style={{ fontSize: '8px', backgroundColor: '#3b82f6', color: '#fff', borderRadius: '10px', padding: '0 4px', marginTop: '1px' }}>
                      {day.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Left Sub-Tab Navigation */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
              <button
                onClick={() => setFoldableLeftTab('appointments')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: foldableLeftTab === 'appointments' ? '#60a5fa' : 'var(--text-muted)',
                  borderBottom: foldableLeftTab === 'appointments' ? '2px solid #3b82f6' : 'none',
                  paddingBottom: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Calendar size={13} /> Appointments ({displayedAppointments.length})
              </button>

              <button
                onClick={() => setFoldableLeftTab('directory')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: foldableLeftTab === 'directory' ? '#60a5fa' : 'var(--text-muted)',
                  borderBottom: foldableLeftTab === 'directory' ? '2px solid #3b82f6' : 'none',
                  paddingBottom: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Users size={13} /> Directory ({clientAliases.length})
              </button>
            </div>

            {/* Content: Appointments Roster */}
            {foldableLeftTab === 'appointments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {displayedAppointments.length === 0 ? (
                  <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: '12px' }}>No appointments for this selection.</p>
                  </div>
                ) : (
                  displayedAppointments.map(appt => {
                    const isSelected = selectedAppt?.id === appt.id;
                    return (
                      <div 
                        key={appt.id}
                        onClick={() => handleSelectApptForDebrief(appt)}
                        className={`glass-panel clickable-card ${isSelected ? 'active-selected' : ''}`}
                        style={{ 
                          padding: '12px', 
                          borderLeft: `4px solid ${appt.type === 'social' ? 'var(--accent-social)' : (appt.type === 'meeting' ? 'var(--accent-meeting)' : 'var(--accent-followup)')}` 
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                          <span style={{ 
                            fontSize: '9.5px', 
                            fontWeight: '700', 
                            padding: '1px 5px', 
                            borderRadius: '4px',
                            backgroundColor: appt.type === 'social' ? 'rgba(251, 146, 60, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                            color: appt.type === 'social' ? '#fb923c' : '#c084fc'
                          }}>
                            {appt.type === 'social' ? '☕ Social' : 'Meeting'}
                          </span>

                          {appt.status === 'Completed' ? (
                            <span style={{ fontSize: '10px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <CheckCircle2 size={11} /> Completed
                            </span>
                          ) : (
                            <span style={{ fontSize: '10px', color: '#60a5fa', fontWeight: '600' }}>
                              Select ➡️
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {appt.clientAlias}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                          {appt.title}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10.5px', color: 'var(--text-muted)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Clock size={11} /> {appt.date} {appt.time}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <MapPin size={11} /> {appt.venue || 'Cafe'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Content: Directory List */}
            {foldableLeftTab === 'directory' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input 
                  type="text" 
                  className="mobile-input" 
                  placeholder="Filter 34 aliases..."
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  style={{ padding: '8px 12px', fontSize: '12px' }}
                />

                {filteredAliases.map(c => (
                  <div 
                    key={c.id || c.syncId || c.alias} 
                    onClick={() => {
                      setSelectedClientForView(c);
                      setBookAlias(c.alias);
                      setFoldableRightMode('clientDetails');
                    }}
                    className="glass-panel clickable-card"
                    style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <strong style={{ fontSize: '13px' }}>{c.alias}</strong>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{c.tag || 'Client'}</div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setBookAlias(c.alias);
                        setFoldableRightMode('book');
                      }}
                      className="btn-secondary"
                      style={{ fontSize: '10.5px', padding: '4px 8px' }}
                    >
                      Book
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* RIGHT PANE: EXECUTIVE ACTION & DEBRIEF WORKSPACE */}
          <div className="foldable-right-pane glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
            
            {/* Top Mode Selector Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setFoldableRightMode('book')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: foldableRightMode === 'book' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                    color: foldableRightMode === 'book' ? '#60a5fa' : 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Plus size={13} /> Quick Booker
                </button>

                <button
                  onClick={() => setFoldableRightMode('debrief')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: foldableRightMode === 'debrief' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                    color: foldableRightMode === 'debrief' ? '#60a5fa' : 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Sparkles size={13} /> Post-Meeting Debrief
                </button>

                <button
                  onClick={() => setFoldableRightMode('history')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: foldableRightMode === 'history' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                    color: foldableRightMode === 'history' ? '#60a5fa' : 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <MessageSquare size={13} /> Debrief Ledger ({debriefs.length})
                </button>
              </div>

              {selectedAppt && (
                <span style={{ fontSize: '11px', color: '#38bdf8', backgroundColor: 'rgba(6, 182, 212, 0.12)', padding: '2px 8px', borderRadius: '12px' }}>
                  Target: {selectedAppt.clientAlias}
                </span>
              )}
            </div>

            {/* WORKSPACE 1: QUICK BOOK APPOINTMENT */}
            {foldableRightMode === 'book' && (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Calendar size={18} color="#3b82f6" />
                  <h2 style={{ fontSize: '15px', fontWeight: '700' }}>⚡ Speed Arrange Appointment</h2>
                </div>

                {bookSuccessToast && (
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '10px', borderRadius: '10px', fontSize: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} /> Appointment synced to cloud & desktop!
                  </div>
                )}

                <form onSubmit={handleQuickBook} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* Client Picker Trigger & Input */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                        Client Alias *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setClientPickerMode('book');
                          setClientPickerSearch('');
                          setIsClientPickerOpen(true);
                        }}
                        style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '11.5px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Users size={12} /> Choose from {clientAliases.length} Clients ▼
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        list="client-aliases-datalist"
                        className="mobile-input" 
                        placeholder="Pick or type alias (e.g. Jacelyn L.)"
                        value={bookAlias}
                        onChange={(e) => setBookAlias(e.target.value)}
                        required
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setClientPickerMode('book');
                          setClientPickerSearch('');
                          setIsClientPickerOpen(true);
                        }}
                        className="btn-secondary"
                        style={{ padding: '0 14px', fontSize: '12px' }}
                      >
                        Select ▼
                      </button>
                    </div>

                    {/* Native Dropdown Selector for Instant Choice */}
                    <select
                      className="mobile-input"
                      value={bookAlias}
                      onChange={(e) => setBookAlias(e.target.value)}
                      style={{ marginTop: '6px', fontSize: '12.5px', backgroundColor: 'rgba(25, 33, 50, 0.9)', borderColor: 'rgba(59, 130, 246, 0.35)' }}
                    >
                      <option value="">-- Or choose from list ({clientAliases.length} clients) --</option>
                      {clientAliases.map(c => (
                        <option key={c.id || c.syncId || c.alias} value={c.alias}>
                          {c.alias} {c.tag ? `(${c.tag})` : ''} {c.phone ? `• ${c.phone}` : ''}
                        </option>
                      ))}
                    </select>

                    <datalist id="client-aliases-datalist">
                      {clientAliases.map(c => (
                        <option key={c.id || c.syncId || c.alias} value={c.alias}>
                          {c.alias} ({c.tag || 'Client'})
                        </option>
                      ))}
                    </datalist>

                    {/* Quick Alias Chips: Wrapped list so all are accessible */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', padding: '8px 0', maxHeight: '100px', overflowY: 'auto' }}>
                      {clientAliases.map(c => (
                        <button
                          key={c.id || c.syncId || c.alias}
                          type="button"
                          onClick={() => setBookAlias(c.alias)}
                          style={{
                            fontSize: '11px',
                            background: bookAlias === c.alias ? 'rgba(59, 130, 246, 0.35)' : 'rgba(255,255,255,0.05)',
                            color: bookAlias === c.alias ? '#60a5fa' : 'var(--text-secondary)',
                            border: `1px solid ${bookAlias === c.alias ? '#3b82f6' : 'var(--border-light)'}`,
                            borderRadius: '14px',
                            padding: '3px 9px',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer'
                          }}
                        >
                          {c.alias}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category Selector */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Meeting Type
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {[
                        { id: 'social', label: '☕ Social Catch-Up', color: '#fb923c' },
                        { id: 'meeting', label: '📊 Meeting / Review', color: '#a855f7' },
                        { id: 'followup', label: '📞 Follow-up', color: '#06b6d4' }
                      ].map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setBookType(cat.id)}
                          style={{
                            padding: '10px 6px',
                            borderRadius: '10px',
                            border: `1px solid ${bookType === cat.id ? cat.color : 'var(--border-light)'}`,
                            background: bookType === cat.id ? `${cat.color}20` : 'rgba(15,23,42,0.6)',
                            color: bookType === cat.id ? '#f8fafc' : 'var(--text-secondary)',
                            fontSize: '11px',
                            fontWeight: '600',
                            textAlign: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                        Date
                      </label>
                      <input 
                        type="date" 
                        className="mobile-input" 
                        value={bookDate}
                        onChange={(e) => setBookDate(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                        Time
                      </label>
                      <input 
                        type="time" 
                        className="mobile-input" 
                        value={bookTime}
                        onChange={(e) => setBookTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Venue */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Venue / Location
                    </label>
                    <input 
                      type="text" 
                      className="mobile-input" 
                      placeholder="e.g. Starbucks Raffles Place"
                      value={bookVenue}
                      onChange={(e) => setBookVenue(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '6px 0', marginTop: '4px' }}>
                      {['Cafe / Coffee', "Client's Office", 'Restaurant', 'Virtual / Zoom', 'Advisory Suite'].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setBookVenue(v)}
                          style={{
                            fontSize: '11px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border-light)',
                            color: 'var(--text-secondary)',
                            borderRadius: '12px',
                            padding: '3px 8px',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer'
                          }}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmittingBook}
                    className="btn-primary" 
                    style={{ height: '46px', fontSize: '14px', marginTop: '8px' }}
                  >
                    {isSubmittingBook ? 'Saving...' : 'Save & Sync Appointment'}
                  </button>
                </form>
              </div>
            )}

            {/* WORKSPACE 2: POST-MEETING DEBRIEF */}
            {foldableRightMode === 'debrief' && (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Sparkles size={18} color="#60a5fa" />
                  <h2 style={{ fontSize: '15px', fontWeight: '700' }}>30-Sec Post-Meeting Debrief</h2>
                </div>

                {debriefSuccessToast && (
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '10px', borderRadius: '10px', fontSize: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} /> Debrief saved and added to client touchpoint history!
                  </div>
                )}

                <div style={{ marginBottom: '14px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target Client:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setClientPickerMode('debrief');
                        setClientPickerSearch('');
                        setIsClientPickerOpen(true);
                      }}
                      style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '11.5px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Choose Client ({clientAliases.length}) ▼
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '14px', color: '#60a5fa' }}>
                      {selectedAppt?.clientAlias || bookAlias || 'Select an appointment or choose client'}
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      ({selectedAppt?.date || todayStr})
                    </span>
                  </div>
                  <select
                    className="mobile-input"
                    value={selectedAppt?.clientAlias || bookAlias || ''}
                    onChange={(e) => {
                      const aliasVal = e.target.value;
                      setSelectedAppt(prev => ({ ...(prev || {}), clientAlias: aliasVal, date: prev?.date || todayStr }));
                    }}
                    style={{ marginTop: '8px', fontSize: '12px', backgroundColor: 'rgba(25, 33, 50, 0.9)' }}
                  >
                    <option value="">-- Or choose client from dropdown ({clientAliases.length}) --</option>
                    {clientAliases.map(c => (
                      <option key={c.id || c.syncId || c.alias} value={c.alias}>
                        {c.alias} {c.tag ? `(${c.tag})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <form onSubmit={handleSubmitDebrief} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Meeting Outcome
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                      {['Great Progress', 'Follow-up Needed', 'Social Catch-Up'].map(out => (
                        <button
                          key={out}
                          type="button"
                          onClick={() => setDebriefOutcome(out)}
                          style={{
                            padding: '8px 4px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '600',
                            border: `1px solid ${debriefOutcome === out ? '#3b82f6' : 'var(--border-light)'}`,
                            background: debriefOutcome === out ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                            color: debriefOutcome === out ? '#f8fafc' : 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          {out}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Key Discussion & Decisions * (Tap mic on keyboard to dictate)
                    </label>
                    <textarea 
                      className="mobile-input" 
                      rows={3}
                      placeholder="e.g. Discussed SRS top-up, review CI coverage on 20th..."
                      value={debriefNotes}
                      onChange={(e) => setDebriefNotes(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#60a5fa', display: 'block', marginBottom: '8px' }}>
                      🗓️ Schedule Next Action (Optional)
                    </span>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '8px' }}>
                      <input 
                        type="text" 
                        className="mobile-input" 
                        placeholder="Next task (e.g. Send CI comparison deck)"
                        value={nextActionTask}
                        onChange={(e) => setNextActionTask(e.target.value)}
                      />
                      <input 
                        type="date" 
                        className="mobile-input" 
                        value={nextActionDate}
                        onChange={(e) => setNextActionDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmittingDebrief}
                    className="btn-primary" 
                    style={{ height: '46px', fontSize: '14px' }}
                  >
                    {isSubmittingDebrief ? 'Saving...' : 'Save & Sync Debrief'}
                  </button>
                </form>
              </div>
            )}

            {/* WORKSPACE 3: DEBRIEF LEDGER / HISTORY */}
            {foldableRightMode === 'history' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700' }}>Recent Debrief Notes ({debriefs.length})</h3>

                {debriefs.length === 0 ? (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No debriefs logged yet.</p>
                ) : (
                  debriefs.map(deb => (
                    <div key={deb.id} className="glass-panel" style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '13px' }}>{deb.clientAlias}</strong>
                        <span style={{ fontSize: '10px', color: '#34d399', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '1px 6px', borderRadius: '8px' }}>
                          {deb.outcome}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-primary)', margin: '4px 0' }}>
                        "{deb.discussionSummary}"
                      </p>
                      {deb.nextActionTask && (
                        <div style={{ fontSize: '11px', color: '#60a5fa', marginTop: '4px' }}>
                          ➡️ {deb.nextActionTask} ({deb.nextActionDate})
                        </div>
                      )}
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {deb.meetingDate}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* WORKSPACE 4: CLIENT DETAILS (FROM DIRECTORY) */}
            {foldableRightMode === 'clientDetails' && selectedClientForView && (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <h2 style={{ fontSize: '17px', fontWeight: '700' }}>{selectedClientForView.alias}</h2>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tag: {selectedClientForView.tag || 'Client'}</span>
                  </div>

                  {selectedClientForView.phone && (
                    <a 
                      href={`https://wa.me/${selectedClientForView.phone.replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="btn-primary"
                      style={{ backgroundColor: '#25D366', fontSize: '12px', padding: '6px 12px' }}
                    >
                      <MessageSquare size={14} /> WhatsApp
                    </a>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <button 
                    onClick={() => {
                      setBookAlias(selectedClientForView.alias);
                      setFoldableRightMode('book');
                    }}
                    className="btn-secondary"
                    style={{ flex: 1, fontSize: '12px', padding: '8px' }}
                  >
                    + Book Appt
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedAppt({ clientAlias: selectedClientForView.alias, date: todayStr });
                      setFoldableRightMode('debrief');
                    }}
                    className="btn-secondary"
                    style={{ flex: 1, fontSize: '12px', padding: '8px' }}
                  >
                    + Log Debrief
                  </button>
                </div>

                <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>Client Appointments</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {appointments.filter(a => (a.clientAlias || '').toLowerCase() === (selectedClientForView.alias || '').toLowerCase()).map(a => (
                    <div key={a.id} className="glass-panel" style={{ padding: '8px 10px', fontSize: '11.5px' }}>
                      <strong>{a.date} at {a.time}</strong> • {a.title} ({a.status})
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      ) : (
        /* ========================================================================= */
        /* 📱 COMPACT MOBILE LAYOUT (Cover Screen or Standard Phone < 600px)         */
        /* ========================================================================= */
        <>
          <main style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '90px' }}>
            
            {/* TAB 1: PACEMAKER & TODAY */}
            {activeTab === 'pacemaker' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Weekly Pacemaker Hero Card */}
                <div className="glass-panel" style={{ padding: '18px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fb923c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Flame size={14} /> Weekly Activity Pacemaker
                      </span>
                      <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '4px' }}>
                        {weeklyPaceCount} <span style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-muted)' }}>/ {weeklyTarget} met</span>
                      </div>
                    </div>
                    <div style={{ 
                      backgroundColor: pacePercentage >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(251, 146, 60, 0.15)',
                      color: pacePercentage >= 80 ? '#34d399' : '#fb923c',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '700'
                    }}>
                      {pacePercentage}% Pace
                    </div>
                  </div>

                  <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div style={{ 
                      width: `${pacePercentage}%`, 
                      height: '100%', 
                      background: 'linear-gradient(90deg, #fb923c, #f59e0b, #10b981)',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Target: 15 consultative engagements / week (Reviews, Coffee catch-ups, Fact finds).
                  </p>
                </div>

                {/* Today's Schedule */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h2 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                      Today's Engagements ({todayAppts.length})
                    </h2>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{todayStr}</span>
                  </div>

                  {todayAppts.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Calendar size={28} style={{ opacity: 0.3, margin: '0 auto 8px auto' }} />
                      <p style={{ fontSize: '13px' }}>No appointments scheduled for today.</p>
                      <button 
                        onClick={() => setActiveTab('book')}
                        className="btn-secondary" 
                        style={{ margin: '12px auto 0 auto', fontSize: '12px', padding: '6px 14px' }}
                      >
                        + Quick Arrange
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {todayAppts.map(appt => (
                        <div 
                          key={appt.id} 
                          className="glass-panel" 
                          style={{ 
                            padding: '14px', 
                            borderLeft: `4px solid ${appt.type === 'social' ? 'var(--accent-social)' : (appt.type === 'meeting' ? 'var(--accent-meeting)' : 'var(--accent-followup)')}` 
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                            <div>
                              <span style={{ 
                                fontSize: '10px', 
                                fontWeight: '700', 
                                padding: '2px 6px', 
                                borderRadius: '4px',
                                backgroundColor: appt.type === 'social' ? 'rgba(251, 146, 60, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                                color: appt.type === 'social' ? '#fb923c' : '#c084fc',
                                marginRight: '6px'
                              }}>
                                {appt.type === 'social' ? '☕ Social' : 'Meeting'}
                              </span>
                              <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{appt.clientAlias}</strong>
                            </div>

                            {appt.status === 'Completed' ? (
                              <span style={{ fontSize: '11px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <CheckCircle2 size={13} /> Done
                              </span>
                            ) : (
                              <button 
                                onClick={() => handleSelectApptForDebrief(appt)}
                                style={{ 
                                  background: 'rgba(59, 130, 246, 0.15)', 
                                  border: '1px solid rgba(59, 130, 246, 0.3)', 
                                  color: '#60a5fa', 
                                  borderRadius: '8px', 
                                  padding: '4px 10px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                📝 Debrief
                              </button>
                            )}
                          </div>

                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            {appt.title}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', color: 'var(--text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} /> {appt.time || 'TBD'}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={12} /> {appt.venue || 'Cafe'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upcoming Next 7 Days */}
                <div>
                  <h2 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    Upcoming Appointments ({appointments.filter(a => a.date > todayStr).length})
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {appointments
                      .filter(a => a.date > todayStr)
                      .slice(0, 5)
                      .map(appt => (
                        <div key={appt.id} className="glass-panel" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong style={{ fontSize: '13px' }}>{appt.clientAlias}</strong>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>• {appt.type}</span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              {appt.date} at {appt.time} • {appt.venue}
                            </div>
                          </div>
                          <button 
                            onClick={() => handleSelectApptForDebrief(appt)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: 3-TAP QUICK APPOINTMENT BOOKER */}
            {activeTab === 'book' && (
              <div className="animate-fade-in">
                <div className="glass-panel" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Calendar size={18} color="#3b82f6" />
                    <h2 style={{ fontSize: '16px', fontWeight: '700' }}>⚡ Quick Appointment Booker</h2>
                  </div>

                  {bookSuccessToast && (
                    <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '10px', borderRadius: '10px', fontSize: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Check size={14} /> Appointment synced to cloud & desktop!
                    </div>
                  )}

                  <form onSubmit={handleQuickBook} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    
                    {/* Client Alias Dropdown / Freeform */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                          Client Alias *
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setClientPickerMode('book');
                            setClientPickerSearch('');
                            setIsClientPickerOpen(true);
                          }}
                          style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '11.5px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Users size={12} /> Choose from {clientAliases.length} Clients ▼
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="text" 
                          list="client-aliases-datalist-mobile"
                          className="mobile-input" 
                          placeholder="Pick or type alias (e.g. Jacelyn L.)"
                          value={bookAlias}
                          onChange={(e) => setBookAlias(e.target.value)}
                          required
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setClientPickerMode('book');
                            setClientPickerSearch('');
                            setIsClientPickerOpen(true);
                          }}
                          className="btn-secondary"
                          style={{ padding: '0 14px', fontSize: '12px' }}
                        >
                          Select ▼
                        </button>
                      </div>

                      {/* Native Dropdown Selector for Instant Choice */}
                      <select
                        className="mobile-input"
                        value={bookAlias}
                        onChange={(e) => setBookAlias(e.target.value)}
                        style={{ marginTop: '6px', fontSize: '12.5px', backgroundColor: 'rgba(25, 33, 50, 0.9)', borderColor: 'rgba(59, 130, 246, 0.35)' }}
                      >
                        <option value="">-- Or choose from list ({clientAliases.length} clients) --</option>
                        {clientAliases.map(c => (
                          <option key={c.id || c.syncId || c.alias} value={c.alias}>
                            {c.alias} {c.tag ? `(${c.tag})` : ''} {c.phone ? `• ${c.phone}` : ''}
                          </option>
                        ))}
                      </select>

                      <datalist id="client-aliases-datalist-mobile">
                        {clientAliases.map(c => (
                          <option key={c.id || c.syncId || c.alias} value={c.alias}>
                            {c.alias} ({c.tag || 'Client'})
                          </option>
                        ))}
                      </datalist>

                      {/* Quick Alias Chips */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', padding: '8px 0', maxHeight: '110px', overflowY: 'auto' }}>
                        {clientAliases.map(c => (
                          <button
                            key={c.id || c.syncId || c.alias}
                            type="button"
                            onClick={() => setBookAlias(c.alias)}
                            style={{
                              fontSize: '11px',
                              background: bookAlias === c.alias ? 'rgba(59, 130, 246, 0.35)' : 'rgba(255,255,255,0.05)',
                              color: bookAlias === c.alias ? '#60a5fa' : 'var(--text-secondary)',
                              border: `1px solid ${bookAlias === c.alias ? '#3b82f6' : 'var(--border-light)'}`,
                              borderRadius: '14px',
                              padding: '3px 9px',
                              whiteSpace: 'nowrap',
                              cursor: 'pointer'
                            }}
                          >
                            {c.alias}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category Selector */}
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                        Meeting Type
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        {[
                          { id: 'social', label: '☕ Social Catch-Up', color: '#fb923c' },
                          { id: 'meeting', label: '📊 Meeting / Review', color: '#a855f7' },
                          { id: 'followup', label: '📞 Follow-up', color: '#06b6d4' }
                        ].map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setBookType(cat.id)}
                            style={{
                              padding: '10px 6px',
                              borderRadius: '10px',
                              border: `1px solid ${bookType === cat.id ? cat.color : 'var(--border-light)'}`,
                              background: bookType === cat.id ? `${cat.color}20` : 'rgba(15,23,42,0.6)',
                              color: bookType === cat.id ? '#f8fafc' : 'var(--text-secondary)',
                              fontSize: '11px',
                              fontWeight: '600',
                              textAlign: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                          Date
                        </label>
                        <input 
                          type="date" 
                          className="mobile-input" 
                          value={bookDate}
                          onChange={(e) => setBookDate(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                          Time
                        </label>
                        <input 
                          type="time" 
                          className="mobile-input" 
                          value={bookTime}
                          onChange={(e) => setBookTime(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Venue */}
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                        Venue / Location
                      </label>
                      <input 
                        type="text" 
                        className="mobile-input" 
                        placeholder="e.g. Starbucks Raffles Place"
                        value={bookVenue}
                        onChange={(e) => setBookVenue(e.target.value)}
                      />
                      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '6px 0', marginTop: '4px' }}>
                        {['Cafe / Coffee', "Client's Office", 'Restaurant', 'Virtual / Zoom', 'Advisory Suite'].map(v => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setBookVenue(v)}
                            style={{
                              fontSize: '11px',
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid var(--border-light)',
                              color: 'var(--text-secondary)',
                              borderRadius: '12px',
                              padding: '3px 8px',
                              whiteSpace: 'nowrap',
                              cursor: 'pointer'
                            }}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmittingBook}
                      className="btn-primary" 
                      style={{ marginTop: '10px', height: '48px', fontSize: '15px' }}
                    >
                      {isSubmittingBook ? 'Syncing...' : 'Save & Sync Appointment'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 3: POST-MEETING DEBRIEF NOTES */}
            {activeTab === 'debrief' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: '700' }}>📝 Post-Meeting Debriefs</h2>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>30-second recaps synced to client profile</p>
                  </div>

                  <button 
                    onClick={() => {
                      setSelectedAppt({ clientAlias: '', date: todayStr });
                      setDebriefNotes('');
                    }}
                    className="btn-primary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    + Freeform
                  </button>
                </div>

                {debriefs.length === 0 ? (
                  <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <MessageSquare size={28} style={{ opacity: 0.3, margin: '0 auto 8px auto' }} />
                    <p style={{ fontSize: '13px' }}>No post-meeting debriefs logged yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {debriefs.map(deb => (
                      <div key={deb.id} className="glass-panel" style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <strong style={{ fontSize: '14px' }}>{deb.clientAlias}</strong>
                          <span style={{ 
                            fontSize: '10px', 
                            fontWeight: '700',
                            padding: '2px 8px', 
                            borderRadius: '10px',
                            backgroundColor: deb.outcome === 'Great Progress' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: deb.outcome === 'Great Progress' ? '#34d399' : '#fbbf24'
                          }}>
                            {deb.outcome}
                          </span>
                        </div>

                        <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4, margin: '6px 0' }}>
                          "{deb.discussionSummary}"
                        </p>

                        {deb.nextActionTask && (
                          <div style={{ fontSize: '11px', color: '#60a5fa', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '6px 8px', borderRadius: '6px', marginTop: '6px' }}>
                            ➡️ Next: {deb.nextActionTask} {deb.nextActionDate ? `(${deb.nextActionDate})` : ''}
                          </div>
                        )}

                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>
                          Meeting Date: {deb.meetingDate}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: CLIENT ALIAS DIRECTORY */}
            {activeTab === 'directory' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: '700' }}>👥 Alias Directory</h2>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{clientAliases.length} clients & prospects</p>
                  </div>

                  <button 
                    onClick={() => setIsAddAliasOpen(true)}
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    + New Alias
                  </button>
                </div>

                <div style={{ position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="mobile-input" 
                    style={{ paddingLeft: '36px' }}
                    placeholder="Search 34 aliases or tags..."
                    value={directorySearch}
                    onChange={(e) => setDirectorySearch(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredAliases.map(c => (
                    <div key={c.id || c.syncId || c.alias} className="glass-panel" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ fontSize: '14px' }}>{c.alias}</strong>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '1px 5px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                            {c.tag || 'Client'}
                          </span>
                        </div>
                        {c.phone && (
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {c.phone}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {c.phone && (
                          <a 
                            href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{ 
                              backgroundColor: 'rgba(37, 211, 102, 0.15)', 
                              color: '#25D366', 
                              padding: '8px', 
                              borderRadius: '8px', 
                              display: 'flex', 
                              alignItems: 'center' 
                            }}
                          >
                            <MessageSquare size={14} />
                          </a>
                        )}
                        <button 
                          onClick={() => {
                            setSelectedAppt({ clientAlias: c.alias, date: todayStr });
                            setDebriefNotes('');
                            setActiveTab('debrief');
                          }}
                          style={{ 
                            backgroundColor: 'rgba(168, 85, 247, 0.15)', 
                            color: '#c084fc', 
                            border: 'none', 
                            padding: '8px 10px', 
                            borderRadius: '8px', 
                            fontSize: '11px', 
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Debrief
                        </button>
                        <button 
                          onClick={() => {
                            setBookAlias(c.alias);
                            setActiveTab('book');
                          }}
                          style={{ 
                            backgroundColor: 'rgba(59, 130, 246, 0.15)', 
                            color: '#60a5fa', 
                            border: 'none', 
                            padding: '8px 10px', 
                            borderRadius: '8px', 
                            fontSize: '11px', 
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Book
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </main>

          {/* Bottom Glass Navigation Bar */}
          <nav className="glass-nav" style={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            height: 'calc(64px + var(--safe-bottom))', 
            paddingBottom: 'var(--safe-bottom)',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            alignItems: 'center',
            zIndex: 50
          }}>
            {[
              { id: 'pacemaker', label: 'Pacemaker', icon: Flame },
              { id: 'book', label: 'Quick Book', icon: Calendar },
              { id: 'debrief', label: 'Debriefs', icon: MessageSquare },
              { id: 'directory', label: 'Directory', icon: Users }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    background: 'none',
                    border: 'none',
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  <Icon size={20} color={isActive ? '#3b82f6' : '#64748b'} />
                  <span style={{ fontSize: '11px', fontWeight: isActive ? '700' : '500' }}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </>
      )}

      {/* ========================================================================= */}
      {/* 👤 CLIENT SELECTOR MODAL (Available in Both Modes)                         */}
      {/* ========================================================================= */}
      {isClientPickerOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.88)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '440px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '20px', borderRadius: '18px', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="#60a5fa" />
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Select Client ({clientAliases.length})</h3>
              </div>
              <button 
                onClick={() => setIsClientPickerOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Search within picker */}
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="mobile-input" 
                placeholder="Search by name, tag, or phone..."
                value={clientPickerSearch}
                onChange={(e) => setClientPickerSearch(e.target.value)}
                autoFocus
                style={{ paddingLeft: '36px' }}
              />
            </div>

            {/* Client List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px' }}>
              {pickerFilteredAliases.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '12px' }}>
                  No matching clients found.
                </div>
              ) : (
                pickerFilteredAliases.map(c => {
                  const isSelected = (clientPickerMode === 'debrief' ? (selectedAppt?.clientAlias === c.alias) : (bookAlias === c.alias));
                  return (
                    <div 
                      key={c.id || c.syncId || c.alias}
                      onClick={() => {
                        if (clientPickerMode === 'debrief') {
                          setSelectedAppt(prev => ({ ...(prev || {}), clientAlias: c.alias, date: prev?.date || todayStr }));
                        } else {
                          setBookAlias(c.alias);
                        }
                        setIsClientPickerOpen(false);
                      }}
                      className={`glass-panel clickable-card ${isSelected ? 'active-selected' : ''}`}
                      style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ fontSize: '13.5px', color: isSelected ? '#60a5fa' : 'var(--text-primary)' }}>
                            {c.alias}
                          </strong>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '1px 5px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.06)' }}>
                            {c.tag || 'Client'}
                          </span>
                        </div>
                        {c.phone && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {c.phone}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        style={{
                          backgroundColor: isSelected ? '#3b82f6' : 'rgba(255,255,255,0.06)',
                          color: isSelected ? '#fff' : 'var(--text-secondary)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '5px 10px',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}
                      >
                        {isSelected ? '✓ Picked' : 'Select'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}

      {/* POPUP MODAL: POST-MEETING QUICK DEBRIEF (When in single-pane mobile mode) */}
      {!isFoldable && selectedAppt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(6px)' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxHeight: '90vh', overflowY: 'auto', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '20px', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#60a5fa" />
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>30-Sec Post-Meeting Debrief</h3>
              </div>
              <button 
                onClick={() => setSelectedAppt(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '14px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target Client:</span>
                <button
                  type="button"
                  onClick={() => {
                    setClientPickerMode('debrief');
                    setClientPickerSearch('');
                    setIsClientPickerOpen(true);
                  }}
                  style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '11.5px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Choose Client ({clientAliases.length}) ▼
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '14px', color: '#60a5fa' }}>
                  {selectedAppt.clientAlias || 'Tap "Choose Client" above'}
                </strong>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  ({selectedAppt.date || todayStr})
                </span>
              </div>
              <select
                className="mobile-input"
                value={selectedAppt.clientAlias || ''}
                onChange={(e) => {
                  const aliasVal = e.target.value;
                  setSelectedAppt(prev => ({ ...(prev || {}), clientAlias: aliasVal, date: prev?.date || todayStr }));
                }}
                style={{ marginTop: '8px', fontSize: '12px', backgroundColor: 'rgba(25, 33, 50, 0.9)' }}
              >
                <option value="">-- Or choose client from dropdown ({clientAliases.length}) --</option>
                {clientAliases.map(c => (
                  <option key={c.id || c.syncId || c.alias} value={c.alias}>
                    {c.alias} {c.tag ? `(${c.tag})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={handleSubmitDebrief} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Meeting Outcome
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {['Great Progress', 'Follow-up Needed', 'Social Catch-Up'].map(out => (
                    <button
                      key={out}
                      type="button"
                      onClick={() => setDebriefOutcome(out)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '600',
                        border: `1px solid ${debriefOutcome === out ? '#3b82f6' : 'var(--border-light)'}`,
                        background: debriefOutcome === out ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                        color: debriefOutcome === out ? '#f8fafc' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      {out}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Key Discussion & Next Steps *
                </label>
                <textarea 
                  className="mobile-input" 
                  rows={3}
                  placeholder="Tap microphone on your keyboard to dictate..."
                  value={debriefNotes}
                  onChange={(e) => setDebriefNotes(e.target.value)}
                  required
                />
              </div>

              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#60a5fa', display: 'block', marginBottom: '8px' }}>
                  🗓️ Schedule Next Action (Optional)
                </span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input 
                    type="text" 
                    className="mobile-input" 
                    placeholder="Next action (e.g. Send CI comparison deck)"
                    value={nextActionTask}
                    onChange={(e) => setNextActionTask(e.target.value)}
                  />
                  <input 
                    type="date" 
                    className="mobile-input" 
                    value={nextActionDate}
                    onChange={(e) => setNextActionDate(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmittingDebrief}
                className="btn-primary" 
                style={{ height: '48px', fontSize: '15px' }}
              >
                {isSubmittingDebrief ? 'Saving...' : 'Save & Sync Debrief'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW ALIAS */}
      {isAddAliasOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '360px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Add Client Alias</h3>
              <button onClick={() => setIsAddAliasOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddNewAlias} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input 
                type="text" 
                className="mobile-input" 
                placeholder="Alias (e.g. Kenneth L. / Tech PM)"
                value={newAliasName}
                onChange={(e) => setNewAliasName(e.target.value)}
                required
              />
              <input 
                type="tel" 
                className="mobile-input" 
                placeholder="Mobile # (optional, for WhatsApp)"
                value={newAliasPhone}
                onChange={(e) => setNewAliasPhone(e.target.value)}
              />
              <select 
                className="mobile-input"
                value={newAliasTag}
                onChange={(e) => setNewAliasTag(e.target.value)}
              >
                <option value="Client">Client</option>
                <option value="Prospect">Prospect</option>
                <option value="VIP">VIP</option>
                <option value="Warm Referral">Warm Referral</option>
              </select>

              <button type="submit" className="btn-primary" style={{ marginTop: '6px' }}>
                Save Alias
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
