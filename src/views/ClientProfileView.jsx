import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Plus, Shield, User, Briefcase, Edit2, Trash2, CheckCircle2, Circle, RefreshCw, 
  Clock, AlertTriangle, Link, FileText, Users, Heart, ExternalLink, Calendar, Check,
  Globe, Sparkles, Copy, Compass, TrendingUp, Target, MessageSquare, Share2, Search, Newspaper,
  ChevronDown, ChevronUp, Image, LayoutGrid, List, LayoutDashboard, Layers, Folder, Phone, Mail,
  Maximize2, Minimize2, Eye, Coffee, MapPin, Flag, CalendarDays, CheckSquare, MessageCircle, Baby
} from 'lucide-react';
import DatePicker from '../components/DatePicker';
import AddressAutocomplete from '../components/AddressAutocomplete';
import ClientSocialIntelligenceSection from '../components/ClientSocialIntelligenceSection';
import ClientClaimsSection from '../components/ClientClaimsSection';
import CollapsibleSection from '../components/CollapsibleSection';
import { getEngagementStatus } from './ClientsView';
import { useAdvisorContext } from '../context/AdvisorContext';

const LinkedinIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const FacebookIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const TikTokIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const TwitterIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
  </svg>
);

const YouTubeIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);

const COVERAGE_MAP = {
  'Life': ['Death', 'TPD', 'Early CI', 'Major CI', 'Others'],
  'Term': ['Death', 'TPD', 'Early CI', 'Major CI', 'Others'],
  'A&H': ['ADD', 'AMR', 'WI', "Women's CI", 'Others'],
  'Shield': ['Hospital Expenses', 'Others'],
  'HI': ['Income benefit per day', 'Others'],
  'ILP': ['Death', 'TPD', 'Early CI', 'Major CI', 'Others'],
  'Endowment': ['Death', 'TPD', 'Others'],
  'LTC': ['Disability Income', 'Others'],
  'Disability Income': ['Benefit per month', 'Others']
};

const formatDateDDMMYYYY = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const calculateAge = (dobString) => {
  if (!dobString) return null;
  const birth = new Date(dobString.includes('T') ? dobString : dobString + 'T00:00:00');
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
};

export default function ClientProfileView({ client, onBack, onOpenFinancialPlan, onUpdateClient }) {
  const [currentClient, setCurrentClient] = useState(client);
  const [policies, setPolicies] = useState([]);
  const [allPolicies, setAllPolicies] = useState([]);
  const [claims, setClaims] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventType, setEventType] = useState('task'); // 'task' | 'meeting' | 'followup'
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskDueTime, setNewTaskDueTime] = useState('');
  const [newTaskDueEndTime, setNewTaskDueEndTime] = useState('');
  const [newTaskLocation, setNewTaskLocation] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Normal'); // 'Normal' | 'High' | 'Urgent'
  const [newTaskChannel, setNewTaskChannel] = useState('WhatsApp'); // 'WhatsApp' | 'Phone Call' | 'Email' | 'Coffee' | 'Office' | 'In-Person'
  const [newTaskLogTouchpoint, setNewTaskLogTouchpoint] = useState(true);
  const [taskFilterType, setTaskFilterType] = useState('all'); // 'all' | 'task' | 'meeting' | 'followup'
  const [remarksText, setRemarksText] = useState(client.notes || '');
  const [isSavingRemarks, setIsSavingRemarks] = useState(false);
  const [aiInsights, setAiInsights] = useState('');
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [touchpointSuccess, setTouchpointSuccess] = useState(false);

  // Edit Task modal state
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [editTaskForm, setEditTaskForm] = useState({
    id: '',
    type: 'task',
    description: '',
    dueDate: '',
    dueTime: '',
    dueEndTime: '',
    location: '',
    priority: 'Normal',
    channel: 'WhatsApp',
    logTouchpointOnComplete: false,
    status: 'Pending'
  });
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);

  const { setAdvisorContext, registerActionHandler } = useAdvisorContext();

  // Sub-Tab Workspace Navigation & View Mode State
  const [activeProfileTab, setActiveProfileTab] = useState(() => {
    return localStorage.getItem('crm_client_active_tab') || 'overview';
  });

  // Synchronize active subtab and client data with Archie 2.0
  useEffect(() => {
    setAdvisorContext({
      section: 'clients',
      subSection: 'client-profile',
      activeSubTab: activeProfileTab,
      entityContext: {
        clientName: currentClient.fullName,
        clientId: currentClient.id,
        policiesCount: policies.length,
        claimsCount: claims.length
      }
    });
  }, [activeProfileTab, currentClient.fullName, currentClient.id, policies.length, claims.length, setAdvisorContext]);

  // Register Archie Action Handlers
  useEffect(() => {
    const unregPlan = registerActionHandler('openFinancialPlan', () => {
      if (typeof onOpenFinancialPlan === 'function') onOpenFinancialPlan(currentClient);
    });
    const unregPolicy = registerActionHandler('addPolicy', () => {
      setPolicyData(initialPolicyState);
      setEditingPolicyId(null);
      setIsPolicyModalOpen(true);
    });

    return () => {
      unregPlan();
      unregPolicy();
    };
  }, [registerActionHandler, onOpenFinancialPlan, currentClient]);
  const [viewLayoutMode, setViewLayoutMode] = useState(() => {
    return localStorage.getItem('crm_client_layout_mode') || 'tabs'; // 'tabs' | 'accordion'
  });
  const [accordionExpandAll, setAccordionExpandAll] = useState(true);

  // Social Profile & AI Dossier State
  const [socialLinks, setSocialLinks] = useState({
    companyName: currentClient.companyName || '',
    jobTitle: currentClient.jobTitle || '',
    linkedinUrl: currentClient.linkedinUrl || '',
    facebookUrl: currentClient.facebookUrl || '',
    instagramUrl: currentClient.instagramUrl || '',
    tiktokUrl: currentClient.tiktokUrl || '',
    twitterUrl: currentClient.twitterUrl || '',
    youtubeUrl: currentClient.youtubeUrl || '',
    threadsUrl: currentClient.threadsUrl || '',
    websiteUrl: currentClient.websiteUrl || ''
  });
  const [aiDossier, setAiDossier] = useState(currentClient.aiDossier || null);
  const [socialPosts, setSocialPosts] = useState(currentClient.socialPosts || []);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);

  // Modals & View Modes
  const [policyViewMode, setPolicyViewMode] = useState('cards'); // 'cards' | 'table'
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  // Form states
  const [editingPolicyId, setEditingPolicyId] = useState(null);
  const [policyInsuredFilter, setPolicyInsuredFilter] = useState('all'); // 'all' | 'self' | 'dependents' | depId
  const [isDependentModalOpen, setIsDependentModalOpen] = useState(false);
  const [editingDependentId, setEditingDependentId] = useState(null);
  const initialDependentState = {
    fullName: '',
    relationship: 'Child',
    dob: '',
    gender: 'Female',
    notes: ''
  };
  const [dependentForm, setDependentForm] = useState(initialDependentState);

  const initialPolicyState = {
    policyName: '',
    policyNumber: '',
    provider: 'AIA',
    policyType: 'Life',
    status: 'In Force',
    insuredType: 'Self', // 'Self' | 'Dependent'
    insuredPersonId: '',
    insuredName: '',
    insuredRelationship: 'Self',
    insuredDob: '',
    insuredGender: '',
    premiumAmount: '',
    medisavePremium: '',
    cashPremium: '',
    premiumFrequency: 'Annually',
    coverages: {},
    inceptionDate: '',
    remarks: '',
    notes: ''
  };

  const [policyData, setPolicyData] = useState(initialPolicyState);
  const [clientData, setClientData] = useState({
    fullName: currentClient.fullName || '',
    preferredName: currentClient.preferredName || '',
    companyName: currentClient.companyName || '',
    jobTitle: currentClient.jobTitle || '',
    email: currentClient.email || '',
    phone: currentClient.phone || '',
    dob: currentClient.dob || '',
    clientStatus: currentClient.clientStatus || 'Active',
    address: currentClient.address || '',
    unitNumber: currentClient.unitNumber || '',
    country: currentClient.country || 'Singapore'
  });
  
  // Family Link Form State
  const [familyForm, setFamilyForm] = useState({ relatedClientId: '', relationship: 'Spouse' });

  // Document Link Form State
  const [docForm, setDocForm] = useState({ title: '', urlOrPath: '', notes: '' });

  const handleTabChange = (tabId) => {
    setActiveProfileTab(tabId);
    localStorage.setItem('crm_client_active_tab', tabId);
  };

  const handleLayoutModeChange = (mode) => {
    setViewLayoutMode(mode);
    localStorage.setItem('crm_client_layout_mode', mode);
  };

  const loadData = async () => {
    setLoading(true);
    if (window.electronAPI) {
      if (window.electronAPI.getPolicies) {
        const pRes = await window.electronAPI.getPolicies(currentClient.id);
        if (pRes.success) setPolicies(pRes.data);
      }
      if (window.electronAPI.getAllPolicies) {
        const apRes = await window.electronAPI.getAllPolicies();
        if (apRes.success) setAllPolicies(apRes.data);
      }
      if (window.electronAPI.getClaims) {
        const clRes = await window.electronAPI.getClaims(currentClient.id);
        if (clRes.success) setClaims(clRes.data || []);
      }
      if (window.electronAPI.getClients) {
        const cRes = await window.electronAPI.getClients();
        if (cRes.success) setAllClients(cRes.data);
      }
      if (window.electronAPI.getTasks) {
        const tRes = await window.electronAPI.getTasks(currentClient.id);
        if (tRes.success) setTasks(tRes.data);
      }
    }
    setLoading(false);
  };

  const loadAiInsights = async (force = false) => {
    if (!window.electronAPI?.getClientAiInsights) return;
    setInsightsLoading(true);
    try {
      const res = await window.electronAPI.getClientAiInsights(currentClient.id, force);
      if (res.success) {
        setAiInsights(res.data);
      } else {
        setAiInsights(`Error generating insights: ${res.error}`);
      }
    } catch (err) {
      setAiInsights(`Error invoking AI: ${err.message}`);
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleSaveRemarks = async () => {
    if (!window.electronAPI?.updateClient) return;
    setIsSavingRemarks(true);
    try {
      const res = await window.electronAPI.updateClient({
        ...currentClient,
        notes: remarksText
      });
      if (res.success) {
        setCurrentClient(prev => ({ ...prev, notes: remarksText }));
        await loadAiInsights(false);
      }
    } catch (err) {
      console.error("Error saving remarks:", err);
    } finally {
      setIsSavingRemarks(false);
    }
  };

  const handleLogTouchpoint = async () => {
    const nowIso = new Date().toISOString();
    if (window.electronAPI?.logClientTouchpoint) {
      const res = await window.electronAPI.logClientTouchpoint(currentClient.id, nowIso);
      if (res.success) {
        setCurrentClient(prev => ({ ...prev, lastContactedAt: nowIso }));
        setTouchpointSuccess(true);
        setTimeout(() => setTouchpointSuccess(false), 3000);
      }
    }
  };

  const handleSaveSocialLinks = async (e) => {
    if (e) e.preventDefault();
    if (!window.electronAPI?.saveClientDossier) return;
    try {
      const res = await window.electronAPI.saveClientDossier({
        clientId: currentClient.id,
        socialLinks,
        dossier: aiDossier
      });
      if (res.success && res.client) {
        setCurrentClient(res.client);
        setIsSocialModalOpen(false);
      }
    } catch (err) {
      console.error("Error saving social profiles:", err);
    }
  };

  useEffect(() => {
    loadData();
    loadAiInsights(false);
  }, [currentClient.id]);

  useEffect(() => {
    setRemarksText(currentClient.notes || '');
  }, [currentClient.notes]);

  // Task & Event Handlers
  const handleSetMeetingDuration = (minutes) => {
    const baseTime = newTaskDueTime || '10:00';
    if (!newTaskDueTime) setNewTaskDueTime('10:00');
    const [h, m] = baseTime.split(':').map(Number);
    const totalMinutes = h * 60 + m + minutes;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    setNewTaskDueEndTime(`${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
  };

  const handleSetQuickDate = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setNewTaskDueDate(d.toISOString().split('T')[0]);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    if (window.electronAPI?.addTask) {
      const res = await window.electronAPI.addTask({ 
        clientId: currentClient.id, 
        type: eventType,
        description: newTaskText.trim(),
        dueDate: newTaskDueDate || null,
        dueTime: newTaskDueTime || null,
        dueEndTime: eventType === 'meeting' ? (newTaskDueEndTime || null) : null,
        location: newTaskLocation.trim() || '',
        priority: eventType === 'task' ? newTaskPriority : 'Normal',
        channel: eventType === 'followup' ? newTaskChannel : null,
        logTouchpointOnComplete: eventType === 'followup' ? newTaskLogTouchpoint : false
      });
      if (res.success) {
        setNewTaskText('');
        setNewTaskDueDate('');
        setNewTaskDueTime('');
        setNewTaskDueEndTime('');
        setNewTaskLocation('');
        setNewTaskPriority('Normal');
        setNewTaskChannel('WhatsApp');
        await loadData();
        loadAiInsights(false);
      }
    }
  };

  const handleOpenEditTask = (task) => {
    setEditTaskForm({
      id: task.id,
      type: task.type || 'task',
      description: task.description || '',
      dueDate: task.dueDate || '',
      dueTime: task.dueTime || '',
      dueEndTime: task.dueEndTime || '',
      location: task.location || '',
      priority: task.priority || 'Normal',
      channel: task.channel || 'WhatsApp',
      logTouchpointOnComplete: !!task.logTouchpointOnComplete,
      status: task.status || 'Pending'
    });
    setIsEditTaskModalOpen(true);
  };

  const handleSaveEditTask = async (e) => {
    e.preventDefault();
    if (!editTaskForm.description.trim()) return;
    setIsUpdatingTask(true);
    try {
      if (window.electronAPI?.updateTask) {
        const res = await window.electronAPI.updateTask({
          id: editTaskForm.id,
          type: editTaskForm.type || 'task',
          description: editTaskForm.description.trim(),
          dueDate: editTaskForm.dueDate || null,
          dueTime: editTaskForm.dueTime || null,
          dueEndTime: editTaskForm.dueEndTime || null,
          location: editTaskForm.location.trim() || '',
          priority: editTaskForm.priority || 'Normal',
          channel: editTaskForm.channel || null,
          logTouchpointOnComplete: editTaskForm.logTouchpointOnComplete,
          status: editTaskForm.status
        });
        if (res.success) {
          setIsEditTaskModalOpen(false);
          await loadData();
          loadAiInsights(false);
        }
      }
    } catch (err) {
      console.error("Failed to update task:", err);
    } finally {
      setIsUpdatingTask(false);
    }
  };

  const toggleTaskStatus = async (task) => {
    if (window.electronAPI?.updateTask) {
      const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
      await window.electronAPI.updateTask({ id: task.id, status: newStatus });
      await loadData();
      loadAiInsights(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.electronAPI?.deleteTask) {
      await window.electronAPI.deleteTask(taskId);
      await loadData();
      loadAiInsights(false);
    }
  };

  // Policy Handlers
  const handlePolicyInputChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...policyData, [name]: value };

    // Automatically recalculate total premium for Shield plans when MediSave or Cash portion is updated
    if (name === 'medisavePremium' || name === 'cashPremium') {
      const medisave = name === 'medisavePremium' ? (parseFloat(value) || 0) : (parseFloat(policyData.medisavePremium) || 0);
      const cash = name === 'cashPremium' ? (parseFloat(value) || 0) : (parseFloat(policyData.cashPremium) || 0);
      const total = Math.round((medisave + cash) * 100) / 100;
      if (total > 0 || (name === 'medisavePremium' && value !== '') || (name === 'cashPremium' && value !== '')) {
        updated.premiumAmount = total % 1 !== 0 ? total.toFixed(2) : total;
      }
    }

    setPolicyData(updated);
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
    setPolicyData({
      ...initialPolicyState,
      insuredType: 'Self',
      insuredPersonId: '',
      insuredName: currentClient.fullName,
      insuredRelationship: 'Self',
      insuredDob: currentClient.dob || ''
    });
    setIsPolicyModalOpen(true);
  };

  const openAddPolicyForDependent = (dep) => {
    setEditingPolicyId(null);
    setPolicyData({
      ...initialPolicyState,
      insuredType: 'Dependent',
      insuredPersonId: dep.id,
      insuredName: dep.fullName,
      insuredRelationship: dep.relationship || 'Child',
      insuredDob: dep.dob || '',
      insuredGender: dep.gender || ''
    });
    setIsPolicyModalOpen(true);
  };

  const openEditPolicy = (policy) => {
    setEditingPolicyId(policy.id);
    setPolicyData({
      ...initialPolicyState,
      ...policy,
      insuredType: policy.insuredType || 'Self',
      insuredPersonId: policy.insuredPersonId || '',
      insuredName: policy.insuredName || (policy.insuredType === 'Dependent' ? '' : currentClient.fullName),
      insuredRelationship: policy.insuredRelationship || (policy.insuredType === 'Dependent' ? 'Child' : 'Self'),
      insuredDob: policy.insuredDob || '',
      insuredGender: policy.insuredGender || '',
      remarks: policy.remarks !== undefined ? policy.remarks : (policy.notes || ''),
      notes: policy.remarks !== undefined ? policy.remarks : (policy.notes || ''),
      medisavePremium: policy.medisavePremium !== undefined ? policy.medisavePremium : '',
      cashPremium: policy.cashPremium !== undefined ? policy.cashPremium : '',
      coverages: policy.coverages || {}
    });
    setIsPolicyModalOpen(true);
  };

  const handleSavePolicy = async (e) => {
    e.preventDefault();
    if (!window.electronAPI) return;

    let updatedPolicyData = { ...policyData };

    // Auto-register dependent if user entered a new dependent name
    if (updatedPolicyData.insuredType === 'Dependent' && updatedPolicyData.insuredName?.trim()) {
      const existingDeps = currentClient.dependents || [];
      const matchDep = existingDeps.find(d => 
        (updatedPolicyData.insuredPersonId && d.id === updatedPolicyData.insuredPersonId) ||
        (d.fullName && d.fullName.toLowerCase() === updatedPolicyData.insuredName.trim().toLowerCase())
      );

      if (!matchDep) {
        const newDep = {
          id: updatedPolicyData.insuredPersonId && updatedPolicyData.insuredPersonId !== 'NEW' ? updatedPolicyData.insuredPersonId : crypto.randomUUID(),
          fullName: updatedPolicyData.insuredName.trim(),
          relationship: updatedPolicyData.insuredRelationship || 'Child',
          dob: updatedPolicyData.insuredDob || '',
          gender: updatedPolicyData.insuredGender || '',
          notes: ''
        };
        const updatedDeps = [...existingDeps, newDep];
        updatedPolicyData.insuredPersonId = newDep.id;

        if (window.electronAPI.updateClient) {
          const clientRes = await window.electronAPI.updateClient({
            ...currentClient,
            dependents: updatedDeps
          });
          if (clientRes.success) {
            setCurrentClient(prev => ({ ...prev, dependents: updatedDeps }));
            if (onUpdateClient) onUpdateClient({ ...currentClient, dependents: updatedDeps });
          }
        }
      } else {
        updatedPolicyData.insuredPersonId = matchDep.id;
        if (!updatedPolicyData.insuredDob && matchDep.dob) updatedPolicyData.insuredDob = matchDep.dob;
        if (!updatedPolicyData.insuredGender && matchDep.gender) updatedPolicyData.insuredGender = matchDep.gender;
      }
    }

    const isEditing = !!editingPolicyId;
    const apiCall = isEditing ? window.electronAPI.updatePolicy : window.electronAPI.addPolicy;
    const payload = isEditing ? { ...updatedPolicyData } : { ...updatedPolicyData, clientId: currentClient.id };
    
    const response = await apiCall(payload);
    if (response.success) {
      setIsPolicyModalOpen(false);
      setPolicyData(initialPolicyState);
      setEditingPolicyId(null);
      loadData();
    }
  };

  // Dependent Handlers
  const handleOpenAddDependent = () => {
    setEditingDependentId(null);
    setDependentForm(initialDependentState);
    setIsDependentModalOpen(true);
  };

  const handleOpenEditDependent = (dep) => {
    setEditingDependentId(dep.id);
    setDependentForm({
      fullName: dep.fullName || '',
      relationship: dep.relationship || 'Child',
      dob: dep.dob || '',
      gender: dep.gender || 'Female',
      notes: dep.notes || ''
    });
    setIsDependentModalOpen(true);
  };

  const handleSaveDependent = async (e) => {
    e.preventDefault();
    if (!dependentForm.fullName.trim()) return;

    const existingDeps = currentClient.dependents || [];
    let updatedDeps;
    if (editingDependentId) {
      updatedDeps = existingDeps.map(d => d.id === editingDependentId ? { ...d, ...dependentForm, fullName: dependentForm.fullName.trim() } : d);
    } else {
      const newDep = {
        id: crypto.randomUUID(),
        ...dependentForm,
        fullName: dependentForm.fullName.trim()
      };
      updatedDeps = [...existingDeps, newDep];
    }

    if (window.electronAPI?.updateClient) {
      const res = await window.electronAPI.updateClient({
        ...currentClient,
        dependents: updatedDeps
      });
      if (res.success) {
        setCurrentClient(prev => ({ ...prev, dependents: updatedDeps }));
        if (onUpdateClient) onUpdateClient({ ...currentClient, dependents: updatedDeps });
        setIsDependentModalOpen(false);
        setEditingDependentId(null);
        setDependentForm(initialDependentState);
      }
    }
  };

  const handleDeleteDependent = async (depId) => {
    if (!window.confirm("Remove this dependent from the client profile? Policies insured under them will remain in the CRM.")) return;
    const updatedDeps = (currentClient.dependents || []).filter(d => d.id !== depId);
    if (window.electronAPI?.updateClient) {
      const res = await window.electronAPI.updateClient({
        ...currentClient,
        dependents: updatedDeps
      });
      if (res.success) {
        setCurrentClient(prev => ({ ...prev, dependents: updatedDeps }));
        if (onUpdateClient) onUpdateClient({ ...currentClient, dependents: updatedDeps });
      }
    }
  };

  const handleDeletePolicy = async () => {
    if (window.confirm("Are you sure you want to delete this policy?")) {
      if (window.electronAPI?.deletePolicy) {
        const response = await window.electronAPI.deletePolicy(editingPolicyId);
        if (response.success) {
          setIsPolicyModalOpen(false);
          setEditingPolicyId(null);
          loadData();
        }
      }
    }
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    if (window.electronAPI?.updateClient) {
      const payload = {
        ...currentClient,
        ...clientData
      };
      const response = await window.electronAPI.updateClient(payload);
      if (response.success) {
        setIsClientModalOpen(false);
        setCurrentClient(payload);
        if (onUpdateClient) onUpdateClient(payload);
      }
    }
  };

  // Family Handlers
  const handleAddFamilyMember = async (e) => {
    e.preventDefault();
    if (!familyForm.relatedClientId) return;
    const existingFamily = currentClient.familyMembers || [];
    const updatedFamily = [...existingFamily.filter(f => f.relatedClientId !== familyForm.relatedClientId), familyForm];
    
    if (window.electronAPI?.updateClient) {
      const res = await window.electronAPI.updateClient({
        ...currentClient,
        familyMembers: updatedFamily
      });
      if (res.success) {
        setCurrentClient(prev => ({ ...prev, familyMembers: updatedFamily }));
        setIsFamilyModalOpen(false);
        setFamilyForm({ relatedClientId: '', relationship: 'Spouse' });
      }
    }
  };

  const handleRemoveFamilyMember = async (relatedClientId) => {
    const updatedFamily = (currentClient.familyMembers || []).filter(f => f.relatedClientId !== relatedClientId);
    if (window.electronAPI?.updateClient) {
      const res = await window.electronAPI.updateClient({
        ...currentClient,
        familyMembers: updatedFamily
      });
      if (res.success) {
        setCurrentClient(prev => ({ ...prev, familyMembers: updatedFamily }));
      }
    }
  };

  // Document Handlers
  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!docForm.title.trim()) return;
    const newDoc = {
      id: crypto.randomUUID(),
      title: docForm.title.trim(),
      urlOrPath: docForm.urlOrPath.trim(),
      notes: docForm.notes.trim(),
      addedAt: new Date().toISOString()
    };
    const existingDocs = currentClient.documents || [];
    const updatedDocs = [...existingDocs, newDoc];

    if (window.electronAPI?.updateClient) {
      const res = await window.electronAPI.updateClient({
        ...currentClient,
        documents: updatedDocs
      });
      if (res.success) {
        setCurrentClient(prev => ({ ...prev, documents: updatedDocs }));
        setIsDocModalOpen(false);
        setDocForm({ title: '', urlOrPath: '', notes: '' });
      }
    }
  };

  const handleDeleteDocument = async (docId) => {
    const updatedDocs = (currentClient.documents || []).filter(d => d.id !== docId);
    if (window.electronAPI?.updateClient) {
      const res = await window.electronAPI.updateClient({
        ...currentClient,
        documents: updatedDocs
      });
      if (res.success) {
        setCurrentClient(prev => ({ ...prev, documents: updatedDocs }));
      }
    }
  };

  const handleOpenDocLink = (urlOrPath) => {
    if (!urlOrPath) return;
    if (window.electronAPI?.openPath && (urlOrPath.includes(':\\') || urlOrPath.startsWith('/'))) {
      window.electronAPI.openPath(urlOrPath);
    } else {
      const target = urlOrPath.startsWith('http') ? urlOrPath : `https://${urlOrPath}`;
      window.open(target, '_blank');
    }
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null || val === '') return '$0';
    const num = Number(val);
    if (isNaN(num)) return '$0';
    const hasCents = num % 1 !== 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: 2
    }).format(num);
  };

  const getFreqLabel = (freq) => {
    if (freq === 'Monthly') return '/Mth';
    if (freq === 'Annually') return '/Yr';
    return '/' + (freq || '').substring(0, 3);
  };

  const engagement = getEngagementStatus(currentClient);
  const expectedCoverages = COVERAGE_MAP[policyData.policyType] || ['Others'];

  // Calculate Family Portfolio Totals
  const familyMemberIds = (currentClient.familyMembers || []).map(f => f.relatedClientId);
  const householdClientIds = [currentClient.id, ...familyMemberIds];
  const householdPolicies = allPolicies.filter(p => householdClientIds.includes(p.clientId));
  const householdAnnualPremium = householdPolicies.reduce((sum, p) => {
    let amt = Number(p.premiumAmount) || 0;
    if (p.premiumFrequency === 'Monthly') amt *= 12;
    if (p.premiumFrequency === 'Quarterly') amt *= 4;
    if (p.premiumFrequency === 'Semi-Annually') amt *= 2;
    return sum + amt;
  }, 0);

  // Policy renewal anniversary in next 30 days
  const isPolicyRenewalUpcoming = (inceptionDate) => {
    if (!inceptionDate) return false;
    const now = new Date();
    const incDate = new Date(inceptionDate);
    const thisYearAnniv = new Date(now.getFullYear(), incDate.getMonth(), incDate.getDate());
    const daysDiff = (thisYearAnniv - now) / (1000 * 60 * 60 * 24);
    return daysDiff >= 0 && daysDiff <= 30;
  };

  // Metrics
  const totalAnnualPremium = policies.reduce((sum, p) => {
    let amt = Number(p.premiumAmount) || 0;
    if (p.premiumFrequency === 'Monthly') amt *= 12;
    if (p.premiumFrequency === 'Quarterly') amt *= 4;
    if (p.premiumFrequency === 'Semi-Annually') amt *= 2;
    return sum + amt;
  }, 0);

  const pendingTasksCount = tasks.filter(t => t.status !== 'Completed').length;
  const completedTasksCount = tasks.filter(t => t.status === 'Completed').length;
  const activeClaimsCount = claims.filter(c => !['Paid Out', 'Declined'].includes(c.status)).length;
  const upcomingRenewalsCount = policies.filter(p => isPolicyRenewalUpcoming(p.inceptionDate)).length;

  // Tab Definitions
  const profileTabs = [
    {
      id: 'overview',
      label: 'Overview & Activity',
      icon: <LayoutDashboard size={15} />,
      badge: pendingTasksCount > 0 ? `${pendingTasksCount} tasks` : null,
      badgeColor: pendingTasksCount > 0 ? 'rgba(59, 130, 246, 0.15)' : undefined,
      badgeTextColor: pendingTasksCount > 0 ? '#60a5fa' : undefined
    },
    {
      id: 'policies-claims',
      label: 'Policies & Claims',
      icon: <Shield size={15} />,
      badge: `${policies.length} Policies`,
      extraBadge: activeClaimsCount > 0 ? `${activeClaimsCount} Claim${activeClaimsCount > 1 ? 's' : ''}` : null
    },
    {
      id: 'ai-social',
      label: 'AI Dossier & Social Intel',
      icon: <Sparkles size={15} />,
      badge: currentClient.aiDossier ? 'Dossier Ready' : (socialPosts.length ? `${socialPosts.length} Posts` : '360° AI'),
      badgeColor: currentClient.aiDossier ? 'rgba(168, 85, 247, 0.15)' : undefined,
      badgeTextColor: currentClient.aiDossier ? '#c084fc' : undefined
    },
    {
      id: 'family-docs',
      label: 'Family & Documents',
      icon: <Users size={15} />,
      badge: `${(currentClient.dependents?.length || 0) + (currentClient.familyMembers?.length || 0) + (currentClient.documents?.length || 0)} items`
    }
  ];

  // Helper renderer for Profile Card
  const renderProfileDetailsCard = () => (
    <CollapsibleSection
      id="profile_details"
      title="Profile & Contact Details"
      icon={<User size={18} color="var(--accent-primary)" />}
      badge={currentClient.jobTitle ? `${currentClient.jobTitle} • ${currentClient.companyName || currentClient.clientStatus || 'Active'}` : (currentClient.companyName || currentClient.clientStatus || 'Active')}
      actions={
        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            className="btn" 
            style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            onClick={() => {
              setClientData({
                fullName: currentClient.fullName || '',
                preferredName: currentClient.preferredName || '',
                companyName: currentClient.companyName || '',
                jobTitle: currentClient.jobTitle || '',
                email: currentClient.email || '',
                phone: currentClient.phone || '',
                dob: currentClient.dob || '',
                clientStatus: currentClient.clientStatus || 'Active',
                address: currentClient.address || '',
                unitNumber: currentClient.unitNumber || '',
                country: currentClient.country || 'Singapore'
              });
              setIsClientModalOpen(true);
            }}
          >
            <Edit2 size={12} /> Edit Profile
          </button>
          <button 
            className="btn" 
            style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            onClick={() => {
              setSocialLinks({
                companyName: currentClient.companyName || '',
                jobTitle: currentClient.jobTitle || '',
                linkedinUrl: currentClient.linkedinUrl || '',
                facebookUrl: currentClient.facebookUrl || '',
                instagramUrl: currentClient.instagramUrl || '',
                tiktokUrl: currentClient.tiktokUrl || '',
                twitterUrl: currentClient.twitterUrl || '',
                youtubeUrl: currentClient.youtubeUrl || '',
                threadsUrl: currentClient.threadsUrl || '',
                websiteUrl: currentClient.websiteUrl || ''
              });
              setIsSocialModalOpen(true);
            }}
          >
            <Share2 size={12} /> Social Links
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>Preferred Name</div>
            <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{currentClient.preferredName || '-'}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>Company & Designation</div>
            <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
              {currentClient.companyName || '-'}{currentClient.jobTitle ? ` • ${currentClient.jobTitle}` : ''}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>Email Address</div>
            <div style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={13} color="var(--text-muted)" /> {currentClient.email || '-'}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>Phone Number</div>
            <div style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Phone size={13} color="var(--text-muted)" /> {currentClient.phone || '-'}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>Date of Birth</div>
            <div style={{ color: 'var(--text-primary)' }}>{currentClient.dob ? formatDateDDMMYYYY(currentClient.dob) : '-'}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>Residential / Office Address</div>
            <div style={{ color: 'var(--text-primary)' }}>
              {currentClient.address ? (
                <div>
                  <div>{currentClient.address}</div>
                  {(currentClient.unitNumber || (currentClient.country && currentClient.country !== 'Singapore')) && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {currentClient.unitNumber && `${currentClient.unitNumber}, `}{currentClient.country || 'Singapore'}
                    </div>
                  )}
                </div>
              ) : '-'}
            </div>
          </div>
        </div>

        {/* Online & Social Profiles Bar */}
        <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '8px', fontWeight: '500' }}>Connected Social Channels</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {currentClient.linkedinUrl ? (
              <a href={currentClient.linkedinUrl.startsWith('http') ? currentClient.linkedinUrl : `https://${currentClient.linkedinUrl}`} target="_blank" rel="noreferrer" className="btn" style={{ padding: '6px 10px', fontSize: '11px', backgroundColor: 'rgba(10, 102, 194, 0.15)', color: '#60a5fa', border: '1px solid rgba(10, 102, 194, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <LinkedinIcon size={12} /> LinkedIn
              </a>
            ) : null}
            {currentClient.facebookUrl ? (
              <a href={currentClient.facebookUrl.startsWith('http') ? currentClient.facebookUrl : `https://${currentClient.facebookUrl}`} target="_blank" rel="noreferrer" className="btn" style={{ padding: '6px 10px', fontSize: '11px', backgroundColor: 'rgba(24, 119, 242, 0.15)', color: '#93c5fd', border: '1px solid rgba(24, 119, 242, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <FacebookIcon size={12} /> Facebook
              </a>
            ) : null}
            {currentClient.instagramUrl ? (
              <a href={currentClient.instagramUrl.startsWith('http') ? currentClient.instagramUrl : `https://${currentClient.instagramUrl}`} target="_blank" rel="noreferrer" className="btn" style={{ padding: '6px 10px', fontSize: '11px', backgroundColor: 'rgba(225, 48, 108, 0.15)', color: '#f472b6', border: '1px solid rgba(225, 48, 108, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <InstagramIcon size={12} /> Instagram
              </a>
            ) : null}
            {currentClient.tiktokUrl ? (
              <a href={currentClient.tiktokUrl.startsWith('http') ? currentClient.tiktokUrl : `https://${currentClient.tiktokUrl}`} target="_blank" rel="noreferrer" className="btn" style={{ padding: '6px 10px', fontSize: '11px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <TikTokIcon size={12} /> TikTok
              </a>
            ) : null}
            {currentClient.twitterUrl ? (
              <a href={currentClient.twitterUrl.startsWith('http') ? currentClient.twitterUrl : `https://${currentClient.twitterUrl}`} target="_blank" rel="noreferrer" className="btn" style={{ padding: '6px 10px', fontSize: '11px', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#cbd5e1', border: '1px solid var(--border-light)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <TwitterIcon size={12} /> X (Twitter)
              </a>
            ) : null}
            {currentClient.youtubeUrl ? (
              <a href={currentClient.youtubeUrl.startsWith('http') ? currentClient.youtubeUrl : `https://${currentClient.youtubeUrl}`} target="_blank" rel="noreferrer" className="btn" style={{ padding: '6px 10px', fontSize: '11px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <YouTubeIcon size={12} /> YouTube
              </a>
            ) : null}
            {currentClient.websiteUrl ? (
              <a href={currentClient.websiteUrl.startsWith('http') ? currentClient.websiteUrl : `https://${currentClient.websiteUrl}`} target="_blank" rel="noreferrer" className="btn" style={{ padding: '6px 10px', fontSize: '11px', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)', border: '1px solid var(--border-light)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Globe size={12} /> Web
              </a>
            ) : null}
            {(!currentClient.linkedinUrl && !currentClient.facebookUrl && !currentClient.instagramUrl && !currentClient.websiteUrl && !currentClient.tiktokUrl && !currentClient.twitterUrl && !currentClient.youtubeUrl) && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No social profiles linked yet. Click "Social Links" to configure.</span>
            )}
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );

  // Helper renderer for Financial Blueprint Card
  const renderFinancialBlueprintCard = () => (
    <CollapsibleSection
      id="blueprint_kpi"
      title="Financial Planning Blueprint"
      icon={<TrendingUp size={18} color="#60a5fa" />}
      badge={
        <span style={{
          fontSize: '11px',
          padding: '3px 8px',
          borderRadius: '10px',
          backgroundColor: currentClient.financialPlan ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
          color: currentClient.financialPlan ? '#34d399' : 'var(--text-muted)',
          fontWeight: '600'
        }}>
          {currentClient.financialPlan ? 'Active Blueprint' : 'Not Configured'}
        </span>
      }
      actions={
        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: '5px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
          onClick={() => onOpenFinancialPlan && onOpenFinancialPlan(currentClient)}
        >
          <TrendingUp size={12} /> Open Full Blueprint →
        </button>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>Target Retirement Age</div>
          <div style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '15px' }}>
            {currentClient.financialPlan?.profile?.targetRetirementAge 
              ? `Age ${currentClient.financialPlan.profile.targetRetirementAge}` 
              : 'Not Set'}
          </div>
        </div>
        <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>Monthly Savings Surplus</div>
          <div style={{ color: currentClient.financialPlan?.cashflow?.monthlySurplus !== undefined ? '#34d399' : 'var(--text-muted)', fontWeight: '600', fontSize: '15px' }}>
            {currentClient.financialPlan?.cashflow?.monthlySurplus !== undefined 
              ? formatCurrency(currentClient.financialPlan.cashflow.monthlySurplus) + '/mo' 
              : 'Not Set'}
          </div>
        </div>
        <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>Total Net Worth</div>
          <div style={{ color: currentClient.financialPlan?.balanceSheet?.totalNetWorth !== undefined ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: '600', fontSize: '15px' }}>
            {currentClient.financialPlan?.balanceSheet?.totalNetWorth !== undefined 
              ? formatCurrency(currentClient.financialPlan.balanceSheet.totalNetWorth) 
              : 'Not Set'}
          </div>
        </div>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
        Interactive lifetime net worth projection engine with retirement gate, decumulation runway, CPF Life integration, dynamic life-event shock testing, and Gemini AI actuarial advisory.
      </p>
    </CollapsibleSection>
  );

  // Helper renderer for Remarks & AI Guidance Card
  const renderRemarksAndAiCard = () => (
    <CollapsibleSection
      id="remarks_ai"
      title="Consultant Remarks & AI Guidance"
      icon={<Sparkles size={18} color="#a855f7" />}
      badge={aiInsights ? 'AI Guidance Active' : (remarksText ? 'Notes Saved' : 'Empty')}
      actions={
        <button
          type="button"
          className="btn"
          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px 8px' }}
          onClick={() => loadAiInsights(true)}
          disabled={insightsLoading}
        >
          <RefreshCw size={11} style={{ animation: insightsLoading ? 'spin 1s linear infinite' : 'none' }} />
          {insightsLoading ? 'Analyzing...' : 'Refresh AI'}
        </button>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* User Remarks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
              <Edit2 size={14} color="var(--accent-primary)" />
              Your Private Remarks & Observations
            </h3>
          </div>
          <textarea
            value={remarksText}
            onChange={(e) => setRemarksText(e.target.value)}
            placeholder="Record consultant notes, client personal preferences, meeting discussion items..."
            style={{
              width: '100%',
              minHeight: '120px',
              background: 'var(--bg-base)',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              padding: '12px',
              fontSize: '13px',
              lineHeight: '1.6',
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ padding: '6px 14px', fontSize: '12px', alignSelf: 'flex-end' }}
            onClick={handleSaveRemarks}
            disabled={isSavingRemarks}
          >
            {isSavingRemarks ? 'Saving...' : 'Save Remarks'}
          </button>
        </div>

        {/* AI Guidance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: '1px solid var(--border-light)', paddingLeft: '20px' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
            <Shield size={14} color="var(--accent-secondary)" />
            Gemini AI Advisor Insights
          </h3>

          {insightsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, justifyContent: 'center' }}>
              {[100, 85, 95, 60].map((w, i) => (
                <div key={i} style={{ height: '10px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', width: `${w}%` }} />
              ))}
            </div>
          ) : aiInsights ? (
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', overflowY: 'auto', maxHeight: '140px', whiteSpace: 'pre-line', paddingRight: '8px' }}>
              {aiInsights}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', flex: 1, padding: '16px 0', opacity: 0.7 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', margin: 0 }}>No AI insights generated yet.</p>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ padding: '5px 12px', fontSize: '11px' }}
                onClick={() => loadAiInsights(false)}
              >
                Generate AI Thoughts
              </button>
            </div>
          )}
        </div>
      </div>
    </CollapsibleSection>
  );

  // Helper renderer for Tasks Card
  // Helper renderer for Tasks, Meetings & Follow-ups Card
  const renderTasksCard = () => {
    const tasksCount = tasks.filter(t => (t.type || 'task') === 'task').length;
    const meetingsCount = tasks.filter(t => t.type === 'meeting').length;
    const followupsCount = tasks.filter(t => t.type === 'followup').length;

    const filteredTasks = tasks.filter(t => {
      if (taskFilterType === 'all') return true;
      return (t.type || 'task') === taskFilterType;
    });

    return (
      <CollapsibleSection
        id="tasks_list"
        title="Schedule, Meetings & Tasks"
        icon={<CheckCircle2 size={18} color="var(--accent-success)" />}
        badge={
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: '600',
              padding: '2px 8px',
              borderRadius: '10px',
              backgroundColor: 'rgba(139, 92, 246, 0.15)',
              color: '#c084fc'
            }}>
              {meetingsCount} Meetings
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: '600',
              padding: '2px 8px',
              borderRadius: '10px',
              backgroundColor: 'rgba(6, 182, 212, 0.15)',
              color: '#38bdf8'
            }}>
              {followupsCount} Follow-ups
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: '600',
              padding: '2px 8px',
              borderRadius: '10px',
              backgroundColor: pendingTasksCount > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
              color: pendingTasksCount > 0 ? '#34d399' : 'var(--text-muted)'
            }}>
              {tasksCount} Tasks ({pendingTasksCount} Pending)
            </span>
          </div>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '22px' }}>
          
          {/* Creator Form */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Event Type Switcher Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '14px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
              <button
                type="button"
                onClick={() => setEventType('task')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 10px',
                  borderRadius: '7px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: eventType === 'task' ? '600' : '500',
                  backgroundColor: eventType === 'task' ? 'var(--accent-primary)' : 'transparent',
                  color: eventType === 'task' ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                <CheckSquare size={13} /> Task / To-Do
              </button>
              <button
                type="button"
                onClick={() => setEventType('meeting')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 10px',
                  borderRadius: '7px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: eventType === 'meeting' ? '600' : '500',
                  backgroundColor: eventType === 'meeting' ? '#8b5cf6' : 'transparent',
                  color: eventType === 'meeting' ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                <CalendarDays size={13} /> Meeting
              </button>
              <button
                type="button"
                onClick={() => setEventType('followup')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 10px',
                  borderRadius: '7px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: eventType === 'followup' ? '600' : '500',
                  backgroundColor: eventType === 'followup' ? '#06b6d4' : 'transparent',
                  color: eventType === 'followup' ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Phone size={13} /> Follow-up
              </button>
            </div>

            {/* Dynamic Form */}
            <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Description & Quick Presets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    {eventType === 'meeting' ? 'Meeting Agenda / Subject' : (eventType === 'followup' ? 'Follow-up Topic / Context' : 'Action Item Description')}
                  </span>
                </div>
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }} 
                  placeholder={
                    eventType === 'meeting' 
                      ? "e.g. Annual Policy Portfolio Review & Needs Analysis..." 
                      : (eventType === 'followup' 
                          ? "e.g. Check on post-surgery claim reimbursement & recovery..." 
                          : "e.g. Prepare Term vs Whole Life comparison illustration...")
                  }
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  required
                />
                
                {/* Quick Subject Presets */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {eventType === 'meeting' && [
                    'Annual Policy Review',
                    'Initial Fact-Find & FNA',
                    'Policy Signing & Submission',
                    'Retirement Blueprint'
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewTaskText(preset)}
                      style={{
                        fontSize: '10.5px',
                        padding: '2px 7px',
                        backgroundColor: 'rgba(139, 92, 246, 0.08)',
                        border: '1px solid rgba(139, 92, 246, 0.25)',
                        color: '#c084fc',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      + {preset}
                    </button>
                  ))}

                  {eventType === 'followup' && [
                    'Post-claims payout check',
                    'Policy anniversary check-in',
                    'Premium payment reminder',
                    'Birthday greeting'
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewTaskText(preset)}
                      style={{
                        fontSize: '10.5px',
                        padding: '2px 7px',
                        backgroundColor: 'rgba(6, 182, 212, 0.08)',
                        border: '1px solid rgba(6, 182, 212, 0.25)',
                        color: '#38bdf8',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      + {preset}
                    </button>
                  ))}

                  {eventType === 'task' && [
                    'Compare Term vs Whole Life',
                    'Prepare CPF nomination form',
                    'Request hospital medical memo',
                    'Fund switch request'
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewTaskText(preset)}
                      style={{
                        fontSize: '10.5px',
                        padding: '2px 7px',
                        backgroundColor: 'rgba(59, 130, 246, 0.08)',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                        color: '#93c5fd',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specific Fields by Event Type */}
              {eventType === 'task' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>
                        <Calendar size={12} color="var(--text-muted)" /> Deadline (Due Date)
                      </label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button type="button" onClick={() => handleSetQuickDate(0)} style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', border: '1px solid var(--border-light)', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>Today</button>
                        <button type="button" onClick={() => handleSetQuickDate(1)} style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', border: '1px solid var(--border-light)', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>Tomorrow</button>
                        <button type="button" onClick={() => handleSetQuickDate(7)} style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', border: '1px solid var(--border-light)', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>+1 Week</button>
                      </div>
                    </div>
                    <DatePicker 
                      style={{ width: '100%', padding: '6px 10px', fontSize: '12px' }}
                      placeholder="Select deadline date..."
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '500' }}>
                      <Flag size={12} color="var(--text-muted)" /> Priority Level
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[
                        { label: 'Normal', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' },
                        { label: 'High', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
                        { label: 'Urgent', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' }
                      ].map(p => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => setNewTaskPriority(p.label)}
                          style={{
                            flex: 1,
                            padding: '5px 8px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: newTaskPriority === p.label ? '600' : '500',
                            border: `1px solid ${newTaskPriority === p.label ? p.color : 'var(--border-light)'}`,
                            backgroundColor: newTaskPriority === p.label ? p.bg : 'transparent',
                            color: newTaskPriority === p.label ? p.color : 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: p.color }}></span>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {eventType === 'meeting' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', backgroundColor: 'rgba(139, 92, 246, 0.03)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#c084fc', marginBottom: '5px', fontWeight: '500' }}>
                      <CalendarDays size={12} /> Meeting Date
                    </label>
                    <DatePicker 
                      style={{ width: '100%', padding: '6px 10px', fontSize: '12px' }}
                      placeholder="Select meeting date..."
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '500' }}>
                        <Clock size={12} color="var(--text-muted)" /> Start Time
                      </label>
                      <input 
                        type="time" 
                        className="input-field" 
                        style={{ width: '100%', padding: '6px 8px', fontSize: '12px', color: 'var(--text-primary)' }}
                        value={newTaskDueTime}
                        onChange={(e) => setNewTaskDueTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '500' }}>
                        <Clock size={12} color="var(--text-muted)" /> End Time
                      </label>
                      <input 
                        type="time" 
                        className="input-field" 
                        style={{ width: '100%', padding: '6px 8px', fontSize: '12px', color: 'var(--text-primary)' }}
                        value={newTaskDueEndTime}
                        onChange={(e) => setNewTaskDueEndTime(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Quick Duration Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Duration:</span>
                    {[30, 45, 60, 90].map(mins => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => handleSetMeetingDuration(mins)}
                        style={{
                          fontSize: '10.5px',
                          padding: '2px 7px',
                          backgroundColor: 'rgba(255,255,255,0.04)',
                          border: '1px solid var(--border-light)',
                          borderRadius: '4px',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        +{mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '500' }}>
                      <MapPin size={12} color="var(--text-muted)" /> Venue / Location
                    </label>
                    <AddressAutocomplete 
                      value={newTaskLocation}
                      onChange={(e) => setNewTaskLocation(e.target.value)}
                      placeholder="Search venue, office, or video link"
                      style={{ padding: '7px 12px 7px 34px', fontSize: '12px' }}
                    />
                    {/* Quick Venue Presets */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {['Office (MBFC)', 'Zoom / Video Call', "Client's Residence", 'Cafe / Coffee'].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setNewTaskLocation(v)}
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border-light)',
                            borderRadius: '4px',
                            color: 'var(--text-muted)',
                            cursor: 'pointer'
                          }}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {eventType === 'followup' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', backgroundColor: 'rgba(6, 182, 212, 0.03)', borderRadius: '8px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#38bdf8', marginBottom: '5px', fontWeight: '500' }}>
                      <Calendar size={12} /> Target Follow-up Date
                    </label>
                    <DatePicker 
                      style={{ width: '100%', padding: '6px 10px', fontSize: '12px' }}
                      placeholder="Select target check-in date..."
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '500' }}>
                      <MessageCircle size={12} color="var(--text-muted)" /> Communication Channel
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                      {['WhatsApp', 'Phone Call', 'Email', 'Coffee', 'In-Person'].map(ch => (
                        <button
                          key={ch}
                          type="button"
                          onClick={() => setNewTaskChannel(ch)}
                          style={{
                            padding: '5px 6px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: newTaskChannel === ch ? '600' : '500',
                            border: `1px solid ${newTaskChannel === ch ? '#06b6d4' : 'var(--border-light)'}`,
                            backgroundColor: newTaskChannel === ch ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                            color: newTaskChannel === ch ? '#38bdf8' : 'var(--text-muted)',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          {ch}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    <input 
                      type="checkbox"
                      checked={newTaskLogTouchpoint}
                      onChange={(e) => setNewTaskLogTouchpoint(e.target.checked)}
                      style={{ accentColor: '#06b6d4' }}
                    />
                    <span>Automatically log into Client Touchpoint Timeline when marked complete</span>
                  </label>
                </div>
              )}

              <button 
                type="submit" 
                className="btn" 
                style={{ 
                  padding: '9px 16px', 
                  fontSize: '13px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '6px',
                  backgroundColor: eventType === 'meeting' ? '#8b5cf6' : (eventType === 'followup' ? '#06b6d4' : 'var(--accent-primary)'),
                  color: '#ffffff',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Plus size={15} /> 
                {eventType === 'meeting' ? 'Schedule Meeting' : (eventType === 'followup' ? 'Add Follow-up' : 'Add Task')}
              </button>
            </form>
          </div>

          {/* Active Schedule & Tasks List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                Active Schedule & Actions ({tasks.length})
              </span>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: '3px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                {[
                  { key: 'all', label: 'All' },
                  { key: 'task', label: 'Tasks' },
                  { key: 'meeting', label: 'Meetings' },
                  { key: 'followup', label: 'Follow-ups' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setTaskFilterType(tab.key)}
                    style={{
                      padding: '2px 7px',
                      fontSize: '10.5px',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: taskFilterType === tab.key ? 'rgba(255,255,255,0.1)' : 'transparent',
                      color: taskFilterType === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontWeight: taskFilterType === tab.key ? '600' : '400'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List Container */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
              {filteredTasks.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '36px 0', border: '1px dashed var(--border-light)', borderRadius: '8px' }}>
                  No {taskFilterType === 'all' ? 'active tasks, meetings, or follow-ups' : taskFilterType} scheduled
                </div>
              ) : (
                filteredTasks.map(task => {
                  const tType = task.type || 'task';
                  const isCompleted = task.status === 'Completed';
                  const borderCol = tType === 'meeting' ? '#8b5cf6' : (tType === 'followup' ? '#06b6d4' : (task.priority === 'Urgent' ? '#ef4444' : (task.priority === 'High' ? '#f59e0b' : 'var(--accent-primary)')));

                  return (
                    <div 
                      key={task.id} 
                      className="card hover-row" 
                      style={{ 
                        padding: '10px 12px', 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: '10px',
                        borderLeft: `3px solid ${isCompleted ? 'var(--accent-success)' : borderCol}`,
                        backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.02)' : 'rgba(255,255,255,0.02)'
                      }}
                    >
                      <button 
                        onClick={() => toggleTaskStatus(task)} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: isCompleted ? 'var(--accent-success)' : 'var(--text-muted)', marginTop: '2px' }}
                        title={isCompleted ? "Mark incomplete" : "Mark complete"}
                      >
                        {isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                      </button>

                      <div style={{ flex: 1, fontSize: '13px', color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: isCompleted ? 'line-through' : 'none', wordBreak: 'break-word' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '3px' }}>
                          {/* Type Pill */}
                          {tType === 'meeting' && (
                            <span style={{ fontSize: '10px', fontWeight: '600', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <CalendarDays size={10} /> Meeting
                            </span>
                          )}
                          {tType === 'followup' && (
                            <span style={{ fontSize: '10px', fontWeight: '600', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <Phone size={10} /> Follow-up {task.channel ? `(${task.channel})` : ''}
                            </span>
                          )}
                          {tType === 'task' && (
                            <span style={{ fontSize: '10px', fontWeight: '600', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#93c5fd', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <CheckSquare size={10} /> Task
                            </span>
                          )}

                          {/* Priority Pill for Tasks */}
                          {tType === 'task' && task.priority && task.priority !== 'Normal' && (
                            <span style={{
                              fontSize: '9.5px',
                              fontWeight: '600',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              backgroundColor: task.priority === 'Urgent' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                              color: task.priority === 'Urgent' ? '#f87171' : '#fbbf24'
                            }}>
                              {task.priority}
                            </span>
                          )}

                          <span style={{ fontWeight: '500' }}>{task.description}</span>
                        </div>

                        {/* Metadata row */}
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {task.dueDate && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <Calendar size={11} /> {tType === 'meeting' ? 'Date:' : (tType === 'task' ? 'Due:' : 'Target:')} {formatDateDDMMYYYY(task.dueDate)}
                            </span>
                          )}
                          {task.dueTime && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <Clock size={11} /> {task.dueTime}{task.dueEndTime ? ` – ${task.dueEndTime}` : ''}
                            </span>
                          )}
                          {task.location && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--text-secondary)' }}>
                              <MapPin size={11} /> {task.location}
                            </span>
                          )}
                          {task.googleEventId && (
                            <span style={{ fontSize: '9px', backgroundColor: 'rgba(6,182,212,0.12)', color: 'var(--accent-secondary)', padding: '1px 5px', borderRadius: '3px' }} title="Synced to Google Calendar">
                              Synced
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <button 
                          onClick={() => handleOpenEditTask(task)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', opacity: 0.8, padding: '4px' }}
                          title="Edit item & schedule"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', opacity: 0.5, padding: '4px' }}
                          title="Delete item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </CollapsibleSection>
    );
  };

  // Helper renderer for Policy Portfolio Card
  const renderPolicyPortfolioCard = () => {
    const selfPolicies = policies.filter(p => !p.insuredType || p.insuredType === 'Self');
    const depPolicies = policies.filter(p => p.insuredType === 'Dependent');
    const filteredPolicies = policies.filter(p => {
      if (policyInsuredFilter === 'all') return true;
      if (policyInsuredFilter === 'self') return !p.insuredType || p.insuredType === 'Self';
      if (policyInsuredFilter === 'dependents') return p.insuredType === 'Dependent';
      return p.insuredPersonId === policyInsuredFilter || (p.insuredType === 'Dependent' && p.insuredName?.toLowerCase() === (currentClient.dependents || []).find(d => d.id === policyInsuredFilter)?.fullName?.toLowerCase());
    });

    return (
      <CollapsibleSection
        id="policy_portfolio"
        title={`Policy Portfolio (${policies.length})`}
        icon={<Briefcase size={18} color="var(--accent-secondary)" />}
        badge={`${formatCurrency(totalAnnualPremium)}/yr`}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* View Toggle */}
            <div style={{ display: 'flex', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border-light)' }}>
              <button
                type="button"
                onClick={() => setPolicyViewMode('cards')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: policyViewMode === 'cards' ? 'var(--accent-primary)' : 'transparent',
                  color: policyViewMode === 'cards' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Card View"
              >
                <LayoutGrid size={13} /> Cards
              </button>
              <button
                type="button"
                onClick={() => setPolicyViewMode('table')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: policyViewMode === 'table' ? 'var(--accent-primary)' : 'transparent',
                  color: policyViewMode === 'table' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Horizontal List Table View"
              >
                <List size={13} /> Table
              </button>
            </div>

            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '12px' }} onClick={openAddPolicy}>
              <Plus size={14} /> Add Policy
            </button>
          </div>
        }
      >
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading portfolio...</div>
        ) : policies.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Shield size={48} color="var(--border-light)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '8px' }}>No active policies</h3>
            <p style={{ color: 'var(--text-muted)' }}>Attach an insurance policy to build their portfolio.</p>
          </div>
        ) : (
          <div>
            {/* Insured Person Filter Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginRight: '4px' }}>Filter:</span>
              <button
                type="button"
                onClick={() => setPolicyInsuredFilter('all')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  border: policyInsuredFilter === 'all' ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
                  backgroundColor: policyInsuredFilter === 'all' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                  color: policyInsuredFilter === 'all' ? '#60a5fa' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: policyInsuredFilter === 'all' ? '600' : 'normal'
                }}
              >
                All Policies ({policies.length})
              </button>
              <button
                type="button"
                onClick={() => setPolicyInsuredFilter('self')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  border: policyInsuredFilter === 'self' ? '1px solid #3b82f6' : '1px solid var(--border-light)',
                  backgroundColor: policyInsuredFilter === 'self' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                  color: policyInsuredFilter === 'self' ? '#60a5fa' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: policyInsuredFilter === 'self' ? '600' : 'normal',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <User size={12} /> Self ({selfPolicies.length})
              </button>
              <button
                type="button"
                onClick={() => setPolicyInsuredFilter('dependents')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  border: policyInsuredFilter === 'dependents' ? '1px solid #c084fc' : '1px solid var(--border-light)',
                  backgroundColor: policyInsuredFilter === 'dependents' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.03)',
                  color: policyInsuredFilter === 'dependents' ? '#c084fc' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: policyInsuredFilter === 'dependents' ? '600' : 'normal',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Baby size={12} /> All Dependents ({depPolicies.length})
              </button>
              {(currentClient.dependents || []).map(dep => {
                const count = policies.filter(p => p.insuredPersonId === dep.id || (p.insuredType === 'Dependent' && p.insuredName?.toLowerCase() === dep.fullName?.toLowerCase())).length;
                return (
                  <button
                    key={dep.id}
                    type="button"
                    onClick={() => setPolicyInsuredFilter(dep.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      border: policyInsuredFilter === dep.id ? '1px solid #ec4899' : '1px solid var(--border-light)',
                      backgroundColor: policyInsuredFilter === dep.id ? 'rgba(236, 72, 153, 0.15)' : 'rgba(255,255,255,0.03)',
                      color: policyInsuredFilter === dep.id ? '#f472b6' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: policyInsuredFilter === dep.id ? '600' : 'normal',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    👶 {dep.fullName} ({count})
                  </button>
                );
              })}
            </div>

            {filteredPolicies.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', border: '1px dashed var(--border-light)', borderRadius: '8px' }}>
                No policies found under this insured filter.
              </div>
            ) : policyViewMode === 'table' ? (
              /* Horizontal Table View */
              <div style={{ overflowX: 'auto', padding: '0', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                      <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Status</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Policy Name & Provider</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Type</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Policy No.</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Premium & Split</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Inception</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Coverages</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPolicies.map(policy => {
                      const renewalAlert = isPolicyRenewalUpcoming(policy.inceptionDate);
                      const hasShieldSplit = (policy.medisavePremium || policy.cashPremium) && policy.policyType === 'Shield';
                      
                      return (
                        <tr 
                          key={policy.id}
                          style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer', transition: 'background 0.12s' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          onClick={() => openEditPolicy(policy)}
                        >
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ 
                              padding: '3px 8px', 
                              borderRadius: '10px', 
                              fontSize: '11px',
                              fontWeight: '600',
                              backgroundColor: policy.status === 'In Force' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.08)',
                              color: policy.status === 'In Force' ? 'var(--accent-success)' : 'var(--text-muted)'
                            }}>
                              {policy.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                              {policy.policyName || 'Unnamed Policy'}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {policy.provider}
                            </div>
                            {policy.insuredType === 'Dependent' ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', padding: '2px 7px', borderRadius: '4px', fontSize: '10.5px', backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', fontWeight: '600' }}>
                                <Baby size={11} /> Insured: {policy.insuredName || 'Dependent'} ({policy.insuredRelationship || 'Child'})
                              </div>
                            ) : (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '4px', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', backgroundColor: 'rgba(255, 255, 255, 0.04)', color: 'var(--text-muted)' }}>
                                <User size={10} /> Insured: Self (Owner)
                              </div>
                            )}
                            {(policy.remarks || policy.notes) && (
                              <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '4px', fontStyle: 'italic', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={policy.remarks || policy.notes}>
                                💬 {policy.remarks || policy.notes}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              fontSize: '11px', 
                              backgroundColor: 'rgba(255,255,255,0.05)', 
                              color: 'var(--text-secondary)',
                              fontWeight: '500'
                            }}>
                              {policy.policyType}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                            {policy.policyNumber || '-'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                              {formatCurrency(policy.premiumAmount)} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>{getFreqLabel(policy.premiumFrequency)}</span>
                            </div>
                            {hasShieldSplit && (
                              <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '2px', display: 'flex', gap: '6px' }}>
                                <span>CPF: {formatCurrency(policy.medisavePremium)}</span>
                                <span>•</span>
                                <span>Cash: {formatCurrency(policy.cashPremium)}</span>
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                              {policy.inceptionDate ? formatDateDDMMYYYY(policy.inceptionDate) : '-'}
                            </div>
                            {renewalAlert && (
                              <div style={{ fontSize: '10px', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                                <AlertTriangle size={10} /> Renewal Due
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {(!policy.coverages || Object.keys(policy.coverages).length === 0) ? (
                              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>-</span>
                            ) : (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '280px' }}>
                                {Object.entries(policy.coverages).map(([covType, amt]) => {
                                  if (!amt) return null;
                                  return (
                                    <span key={covType} style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)' }}>
                                      {covType}: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(amt)}</strong>
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditPolicy(policy);
                              }}
                              title="Edit Policy"
                            >
                              <Edit2 size={12} /> Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Cards View */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {filteredPolicies.map(policy => {
                  const renewalAlert = isPolicyRenewalUpcoming(policy.inceptionDate);
                  const hasShieldSplit = (policy.medisavePremium || policy.cashPremium) && policy.policyType === 'Shield';

                  return (
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
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
                            {policy.insuredType === 'Dependent' ? (
                              <span style={{ 
                                padding: '3px 8px', 
                                borderRadius: '4px', 
                                fontSize: '10.5px', 
                                backgroundColor: 'rgba(168, 85, 247, 0.18)', 
                                color: '#c084fc',
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <Baby size={11} /> Insured: {policy.insuredName || 'Dependent'} ({policy.insuredRelationship || 'Child'})
                              </span>
                            ) : (
                              <span style={{ 
                                padding: '3px 6px', 
                                borderRadius: '4px', 
                                fontSize: '10px', 
                                backgroundColor: 'rgba(255, 255, 255, 0.04)', 
                                color: 'var(--text-muted)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}>
                                <User size={10} /> Insured: Self
                              </span>
                            )}
                          </div>
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

                      {/* Policy Renewal Alert Pill */}
                      {renewalAlert && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', padding: '4px 8px', borderRadius: '6px', backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#fbbf24', fontWeight: '500' }}>
                          <AlertTriangle size={12} />
                          Anniversary / Renewal Due Soon
                        </div>
                      )}
                      
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Policy No: <span style={{ color: 'var(--text-secondary)' }}>{policy.policyNumber || 'Pending'}</span>
                      </div>
                      
                      <div style={{ marginTop: '4px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Premium</div>
                            <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>
                              {formatCurrency(policy.premiumAmount)} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>{getFreqLabel(policy.premiumFrequency)}</span>
                            </div>
                            {hasShieldSplit && (
                              <div style={{ fontSize: '10.5px', color: 'var(--accent-primary)', marginTop: '3px' }}>
                                MediSave: {formatCurrency(policy.medisavePremium)} | Cash: {formatCurrency(policy.cashPremium)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Inception Date</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                              {policy.inceptionDate ? formatDateDDMMYYYY(policy.inceptionDate) : '-'}
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
                                if (!amt) return null;
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

                        {(policy.remarks || policy.notes) && (
                          <div style={{ marginTop: '10px', padding: '8px 10px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px', borderLeft: '2px solid var(--accent-primary)', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '600' }}>Remarks / Special Notes:</span>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{policy.remarks || policy.notes}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CollapsibleSection>
    );
  };

  // Helper renderer for Children & Dependents Card
  const renderDependentsCard = () => {
    const deps = currentClient.dependents || [];
    const depPolicies = policies.filter(p => p.insuredType === 'Dependent');

    return (
      <CollapsibleSection
        id="client_dependents"
        title={`Registered Children & Dependents (${deps.length})`}
        icon={<Baby size={18} color="#c084fc" />}
        badge={`${depPolicies.length} Active Dependent Policies`}
        actions={
          <button 
            className="btn" 
            style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(168, 85, 247, 0.3)' }}
            onClick={handleOpenAddDependent}
          >
            <Plus size={12} /> Add Dependent
          </button>
        }
      >
        <div style={{ padding: '12px 14px', backgroundColor: 'rgba(168, 85, 247, 0.05)', borderRadius: '10px', border: '1px solid rgba(168, 85, 247, 0.15)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px', fontWeight: '600', textTransform: 'uppercase' }}>Life Insured Family Protection</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Policies insured under children or dependents are owned and funded by <strong style={{ color: 'var(--text-primary)' }}>{currentClient.preferredName || currentClient.fullName}</strong>. Their coverage is tracked in a dedicated schedule and separated from personal earned-income replacement benchmarks.
            </div>
          </div>
        </div>

        {deps.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '24px 0', border: '1px dashed var(--border-light)', borderRadius: '8px' }}>
            No dependents registered yet. Click <strong style={{ color: '#c084fc' }}>"+ Add Dependent"</strong> or attach an insurance policy with Life Insured set to <em>"Dependent"</em>.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
            {deps.map(dep => {
              const age = calculateAge(dep.dob);
              const childPolicies = policies.filter(p => p.insuredPersonId === dep.id || (p.insuredType === 'Dependent' && p.insuredName?.toLowerCase() === dep.fullName?.toLowerCase()));
              const childAnnualPrem = childPolicies.reduce((sum, p) => {
                let amt = Number(p.premiumAmount) || 0;
                if (p.premiumFrequency === 'Monthly') amt *= 12;
                if (p.premiumFrequency === 'Quarterly') amt *= 4;
                if (p.premiumFrequency === 'Semi-Annually') amt *= 2;
                return sum + amt;
              }, 0);

              return (
                <div 
                  key={dep.id} 
                  style={{ 
                    padding: '16px', 
                    backgroundColor: 'rgba(255,255,255,0.02)', 
                    borderRadius: '10px', 
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
                        <Baby size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {dep.fullName}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span style={{ color: '#c084fc', fontWeight: '500' }}>{dep.relationship || 'Child'}</span>
                          {age !== null && <span>• Age {age}</span>}
                          {dep.dob && <span>(DOB: {formatDateDDMMYYYY(dep.dob)})</span>}
                          {dep.gender && <span>• {dep.gender}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditDependent(dep)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                        title="Edit Dependent"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDependent(dep.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                        title="Delete Dependent"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {dep.notes && (
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', padding: '6px 10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontStyle: 'italic' }}>
                      "{dep.notes}"
                    </div>
                  )}

                  {/* Child Policies Overview */}
                  <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                        In-Force Policies ({childPolicies.length})
                      </span>
                      <span style={{ fontSize: '11.5px', fontWeight: '600', color: '#c084fc' }}>
                        {formatCurrency(childAnnualPrem)}/yr
                      </span>
                    </div>

                    {childPolicies.length === 0 ? (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        No insurance policies attached yet for {dep.fullName}.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                        {childPolicies.map(cp => (
                          <div 
                            key={cp.id}
                            onClick={() => openEditPolicy(cp)}
                            style={{ 
                              padding: '6px 10px', 
                              borderRadius: '6px', 
                              backgroundColor: 'rgba(255,255,255,0.03)', 
                              border: '1px solid var(--border-light)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                            title="Click to Edit Policy"
                          >
                            <div>
                              <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{cp.policyName || cp.policyType}</span>
                              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginLeft: '6px' }}>({cp.provider})</span>
                            </div>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                              {formatCurrency(cp.premiumAmount)} {getFreqLabel(cp.premiumFrequency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn"
                      style={{ 
                        width: '100%', 
                        padding: '6px 10px', 
                        fontSize: '11px', 
                        backgroundColor: 'rgba(168, 85, 247, 0.1)', 
                        color: '#c084fc', 
                        border: '1px dashed rgba(168, 85, 247, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                      onClick={() => openAddPolicyForDependent(dep)}
                    >
                      <Plus size={12} /> Add Policy for {dep.fullName}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CollapsibleSection>
    );
  };

  // Helper renderer for Family & Household Grouping Card
  const renderFamilyCard = () => (
    <CollapsibleSection
      id="family_household"
      title="Family & Household Grouping"
      icon={<Users size={18} color="#ec4899" />}
      badge={`${householdPolicies.length} Combined Policies • ${formatCurrency(householdAnnualPremium)}/yr`}
      actions={
        <button 
          className="btn" 
          style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          onClick={() => setIsFamilyModalOpen(true)}
        >
          <Plus size={12} /> Link Member
        </button>
      }
    >
      {/* Household Summary Stats */}
      <div style={{ padding: '14px 16px', backgroundColor: 'rgba(236, 72, 153, 0.05)', borderRadius: '10px', border: '1px solid rgba(236, 72, 153, 0.15)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Household Combined Portfolio</div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {householdPolicies.length} Total Policies Across Family
          </div>
        </div>
        <div style={{ fontSize: '16px', fontWeight: '700', color: '#ec4899' }}>
          {formatCurrency(householdAnnualPremium)}/yr
        </div>
      </div>

      {/* Family Members List */}
      {(!currentClient.familyMembers || currentClient.familyMembers.length === 0) ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
          No family members linked yet. Click "+ Link Member" to connect spouses, children, or dependents.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
          {currentClient.familyMembers.map(member => {
            const relClient = allClients.find(c => c.id === member.relatedClientId);
            if (!relClient) return null;
            return (
              <div key={member.relatedClientId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{relClient.fullName}</div>
                  <div style={{ fontSize: '11px', color: '#ec4899', marginTop: '2px' }}>{member.relationship}</div>
                </div>
                <button 
                  onClick={() => handleRemoveFamilyMember(member.relatedClientId)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: 0.5, padding: '4px' }}
                  title="Remove relationship"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </CollapsibleSection>
  );

  // Helper renderer for Documents Card
  const renderDocumentsCard = () => (
    <CollapsibleSection
      id="client_docs"
      title="Documents & Cloud Storage Links"
      icon={<FileText size={18} color="var(--accent-blue)" />}
      badge={`${(currentClient.documents || []).length} Document Links`}
      actions={
        <button 
          className="btn" 
          style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          onClick={() => setIsDocModalOpen(true)}
        >
          <Plus size={12} /> Add Link
        </button>
      }
    >
      {(!currentClient.documents || currentClient.documents.length === 0) ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
          No document links saved yet. Attach Google Drive, OneDrive, or local folder paths.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
          {currentClient.documents.map(doc => (
            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <div style={{ flex: 1, overflow: 'hidden', paddingRight: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Link size={13} color="var(--accent-blue)" />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.title}</span>
                </div>
                {doc.notes && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.notes}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {doc.urlOrPath && (
                  <button 
                    className="btn"
                    style={{ padding: '5px 8px', fontSize: '11px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' }}
                    onClick={() => handleOpenDocLink(doc.urlOrPath)}
                    title="Open Link/Path"
                  >
                    <ExternalLink size={12} />
                  </button>
                )}
                <button 
                  onClick={() => handleDeleteDocument(doc.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: 0.5, padding: '4px' }}
                  title="Delete Document Link"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </CollapsibleSection>
  );

  return (
    <div className="view-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Header & Action Toolbar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Left Client Identification */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            className="btn" 
            style={{ padding: '10px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
            onClick={onBack}
            title="Back to Clients"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h1 className="text-gradient" style={{ fontSize: '26px', margin: 0, fontWeight: '700' }}>
                {currentClient.fullName}
              </h1>
              {currentClient.preferredName && (
                <span style={{ fontSize: '15px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  "{currentClient.preferredName}"
                </span>
              )}
              <span style={{ 
                padding: '4px 10px', 
                borderRadius: '12px', 
                fontSize: '11px',
                fontWeight: '600',
                backgroundColor: engagement.bg,
                color: engagement.color,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <Clock size={12} />
                {engagement.label}
              </span>
              <span style={{ 
                padding: '4px 10px', 
                borderRadius: '12px', 
                fontSize: '11px',
                fontWeight: '600',
                backgroundColor: currentClient.clientStatus === 'Active' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.08)',
                color: currentClient.clientStatus === 'Active' ? '#34d399' : 'var(--text-muted)'
              }}>
                {currentClient.clientStatus || 'Active'}
              </span>
            </div>

            {/* Quick Contact Chips Sub-row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', color: 'var(--text-secondary)', fontSize: '13px', flexWrap: 'wrap' }}>
              {currentClient.companyName && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Briefcase size={13} color="var(--text-muted)" /> {currentClient.companyName} {currentClient.jobTitle ? `(${currentClient.jobTitle})` : ''}
                </span>
              )}
              {currentClient.email && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Mail size={13} color="var(--text-muted)" /> {currentClient.email}
                </span>
              )}
              {currentClient.phone && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={13} color="var(--text-muted)" /> {currentClient.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Primary Actions & View Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* Financial Planning Blueprint Button */}
          <button 
            className="btn" 
            style={{ 
              backgroundColor: 'rgba(59, 130, 246, 0.15)', 
              color: '#60a5fa', 
              border: '1px solid rgba(59, 130, 246, 0.35)',
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600'
            }}
            onClick={() => onOpenFinancialPlan && onOpenFinancialPlan(currentClient)}
          >
            <TrendingUp size={16} color="#60a5fa" />
            Financial Planning Blueprint
          </button>

          {/* Quick Log Touchpoint Action */}
          <button 
            className="btn" 
            style={{ 
              backgroundColor: touchpointSuccess ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.08)', 
              color: touchpointSuccess ? '#34d399' : 'var(--text-primary)', 
              border: '1px solid var(--border-light)',
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '8px 14px',
              fontSize: '13px'
            }}
            onClick={handleLogTouchpoint}
          >
            {touchpointSuccess ? <Check size={16} /> : <Calendar size={16} color="var(--accent-primary)" />}
            {touchpointSuccess ? 'Touchpoint Logged!' : 'Log Touchpoint'}
          </button>

          {/* Layout Mode Switcher */}
          <div style={{ display: 'flex', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border-light)' }}>
            <button
              type="button"
              onClick={() => handleLayoutModeChange('tabs')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: viewLayoutMode === 'tabs' ? 'var(--accent-primary)' : 'transparent',
                color: viewLayoutMode === 'tabs' ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
              title="Tabbed Workspace View"
            >
              <LayoutDashboard size={13} /> Tabs
            </button>
            <button
              type="button"
              onClick={() => handleLayoutModeChange('accordion')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: viewLayoutMode === 'accordion' ? 'var(--accent-primary)' : 'transparent',
                color: viewLayoutMode === 'accordion' ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
              title="Single-Page Collapsible Accordion View"
            >
              <Layers size={13} /> All-in-One
            </button>
          </div>

        </div>
      </header>

      {/* Sub-Tab Navigation Bar (When in Tabbed Mode) */}
      {viewLayoutMode === 'tabs' && (
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '20px', overflowX: 'auto' }}>
          {profileTabs.map(tab => {
            const isActive = activeProfileTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  border: isActive ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid transparent',
                  backgroundColor: isActive ? 'rgba(139, 92, 246, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontSize: '13.5px',
                  fontWeight: isActive ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '2px 7px',
                    borderRadius: '8px',
                    backgroundColor: tab.badgeColor || (isActive ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.06)'),
                    color: tab.badgeTextColor || (isActive ? 'var(--accent-primary)' : 'var(--text-muted)')
                  }}>
                    {tab.badge}
                  </span>
                )}
                {tab.extraBadge && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '2px 7px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    color: '#fbbf24'
                  }}>
                    {tab.extraBadge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content Body */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', paddingBottom: '80px' }}>
        
        {/* ================= TAB 1: OVERVIEW & ACTIVITY ================= */}
        {(viewLayoutMode === 'tabs' && activeProfileTab === 'overview') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
              {renderProfileDetailsCard()}
              {renderFinancialBlueprintCard()}
            </div>
            {renderRemarksAndAiCard()}
            {renderTasksCard()}
          </div>
        )}

        {/* ================= TAB 2: POLICIES & CLAIMS ================= */}
        {(viewLayoutMode === 'tabs' && activeProfileTab === 'policies-claims') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.2s ease-out' }}>
            {/* Quick KPI Bar for Policies & Claims */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '2px' }}>Total Active Policies</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {policies.length} Policies
                </div>
              </div>
              <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '2px' }}>Annual Portfolio Premium</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#34d399' }}>
                  {formatCurrency(totalAnnualPremium)}/yr
                </div>
              </div>
              <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '2px' }}>Claims Status</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: activeClaimsCount > 0 ? '#fbbf24' : 'var(--text-primary)' }}>
                  {activeClaimsCount} Active / {claims.length} Total
                </div>
              </div>
              {upcomingRenewalsCount > 0 && (
                <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', borderLeft: '4px solid #fbbf24', backgroundColor: 'rgba(234, 179, 8, 0.05)' }}>
                  <div style={{ color: '#fbbf24', fontSize: '11px', marginBottom: '2px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={12} /> Renewal Alert
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {upcomingRenewalsCount} Upcoming in 30d
                  </div>
                </div>
              )}
            </div>

            {renderPolicyPortfolioCard()}

            {/* Claims Section */}
            <ClientClaimsSection 
              client={currentClient}
              policies={policies}
              claims={claims}
              onRefreshClaims={loadData}
            />
          </div>
        )}

        {/* ================= TAB 3: AI DOSSIER & SOCIAL INTEL ================= */}
        {(viewLayoutMode === 'tabs' && activeProfileTab === 'ai-social') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.2s ease-out' }}>
            <ClientSocialIntelligenceSection
              currentClient={currentClient}
              setCurrentClient={setCurrentClient}
              socialLinks={socialLinks}
              setSocialLinks={setSocialLinks}
              aiDossier={aiDossier}
              setAiDossier={setAiDossier}
              socialPosts={socialPosts}
              setSocialPosts={setSocialPosts}
              setIsSocialModalOpen={setIsSocialModalOpen}
            />
          </div>
        )}

        {/* ================= TAB 4: FAMILY & DOCUMENTS ================= */}
        {(viewLayoutMode === 'tabs' && activeProfileTab === 'family-docs') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.2s ease-out' }}>
            {renderDependentsCard()}
            {renderFamilyCard()}
            {renderDocumentsCard()}
          </div>
        )}

        {/* ================= ALL-IN-ONE ACCORDION MODE ================= */}
        {viewLayoutMode === 'accordion' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
              {renderProfileDetailsCard()}
              {renderFinancialBlueprintCard()}
            </div>
            {renderRemarksAndAiCard()}
            {renderTasksCard()}
            {renderPolicyPortfolioCard()}
            <ClientClaimsSection 
              client={currentClient}
              policies={policies}
              claims={claims}
              onRefreshClaims={loadData}
            />
            <ClientSocialIntelligenceSection
              currentClient={currentClient}
              setCurrentClient={setCurrentClient}
              socialLinks={socialLinks}
              setSocialLinks={setSocialLinks}
              aiDossier={aiDossier}
              setAiDossier={setAiDossier}
              socialPosts={socialPosts}
              setSocialPosts={setSocialPosts}
              setIsSocialModalOpen={setIsSocialModalOpen}
            />
            {renderDependentsCard()}
            {renderFamilyCard()}
            {renderDocumentsCard()}
          </div>
        )}

      </div>

      {/* Edit Client Modal */}
      {isClientModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
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
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Company</label>
                  <input type="text" name="companyName" className="input-field" style={{ width: '100%' }} placeholder="e.g. Acme Corp" value={clientData.companyName || ''} onChange={handleClientInputChange} />
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Job Title</label>
                  <input type="text" name="jobTitle" className="input-field" style={{ width: '100%' }} placeholder="e.g. Managing Director" value={clientData.jobTitle || ''} onChange={handleClientInputChange} />
                </div>
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
                  <DatePicker 
                    name="dob" 
                    value={clientData.dob || ''} 
                    onChange={handleClientInputChange} 
                  />
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
              <div style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Street / Building Address</label>
                <AddressAutocomplete 
                  name="address" 
                  value={clientData.address || ''} 
                  onChange={handleClientInputChange} 
                  placeholder="Search Singapore postal code (e.g. 048581), street, or building..."
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Unit Number / Floor</label>
                  <input 
                    type="text" 
                    name="unitNumber" 
                    className="input-field" 
                    style={{ width: '100%' }} 
                    value={clientData.unitNumber || ''} 
                    onChange={handleClientInputChange} 
                    placeholder="e.g. #08-12" 
                  />
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Country</label>
                  <input 
                    type="text" 
                    name="country" 
                    className="input-field" 
                    style={{ width: '100%' }} 
                    value={clientData.country || 'Singapore'} 
                    onChange={handleClientInputChange} 
                    placeholder="Singapore" 
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }} onClick={() => setIsClientModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Family Link Modal */}
      {isFamilyModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '32px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '24px', color: 'var(--text-primary)' }}>Link Family Member</h2>
            <form onSubmit={handleAddFamilyMember}>
              <div style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Select Client *</label>
                <select 
                  required 
                  className="input-field" 
                  style={{ width: '100%' }}
                  value={familyForm.relatedClientId} 
                  onChange={(e) => setFamilyForm({ ...familyForm, relatedClientId: e.target.value })}
                >
                  <option value="">-- Choose Client --</option>
                  {allClients.filter(c => c.id !== currentClient.id).map(c => (
                    <option key={c.id} value={c.id}>{c.fullName} ({c.email || c.phone || 'No contact'})</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Relationship *</label>
                <select 
                  className="input-field" 
                  style={{ width: '100%' }}
                  value={familyForm.relationship} 
                  onChange={(e) => setFamilyForm({ ...familyForm, relationship: e.target.value })}
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child / Dependent</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Partner">Partner</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }} onClick={() => setIsFamilyModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Link Relationship</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Document Link Modal */}
      {isDocModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '32px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '24px', color: 'var(--text-primary)' }}>Add Document / Storage Link</h2>
            <form onSubmit={handleAddDocument}>
              <div style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Document Title *</label>
                <input required type="text" className="input-field" style={{ width: '100%' }} placeholder="e.g. 2026 Financial Review PDF or Drive Link" value={docForm.title} onChange={(e) => setDocForm({ ...docForm, title: e.target.value })} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>URL / File Path</label>
                <input type="text" className="input-field" style={{ width: '100%' }} placeholder="https://drive.google.com/... or C:\Documents\..." value={docForm.urlOrPath} onChange={(e) => setDocForm({ ...docForm, urlOrPath: e.target.value })} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Notes / Description</label>
                <input type="text" className="input-field" style={{ width: '100%' }} placeholder="Optional notes about this document..." value={docForm.notes} onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }} onClick={() => setIsDocModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Document Link</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Policy Modal */}
      {isPolicyModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '24px', color: 'var(--text-primary)' }}>
              {editingPolicyId ? 'Edit Policy' : `Add Policy for ${currentClient.preferredName || currentClient.fullName}`}
            </h2>
            <form onSubmit={handleSavePolicy}>
              <div style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Policy Name *</label>
                <input required type="text" name="policyName" className="input-field" style={{ width: '100%' }} value={policyData.policyName} onChange={handlePolicyInputChange} placeholder="e.g. AIA Guaranteed Protect Plus" />
              </div>

              {/* Life Insured Person Toggle: Self (Client) vs Dependent */}
              <div style={{ marginBottom: '18px', padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="input-label" style={{ fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                    Life Insured Person *
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Owner & Payor: <strong style={{ color: 'var(--text-secondary)' }}>{currentClient.preferredName || currentClient.fullName}</strong>
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: policyData.insuredType === 'Dependent' ? '12px' : '0' }}>
                  <button
                    type="button"
                    onClick={() => setPolicyData({
                      ...policyData,
                      insuredType: 'Self',
                      insuredPersonId: '',
                      insuredName: currentClient.fullName,
                      insuredRelationship: 'Self',
                      insuredDob: currentClient.dob || '',
                      insuredGender: ''
                    })}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: policyData.insuredType === 'Self' ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
                      backgroundColor: policyData.insuredType === 'Self' ? 'rgba(59, 130, 246, 0.18)' : 'rgba(255,255,255,0.02)',
                      color: policyData.insuredType === 'Self' ? '#60a5fa' : 'var(--text-secondary)',
                      fontWeight: policyData.insuredType === 'Self' ? '600' : 'normal',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '12.5px'
                    }}
                  >
                    <User size={14} /> 👤 Self (Owner)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const firstDep = (currentClient.dependents || [])[0];
                      setPolicyData({
                        ...policyData,
                        insuredType: 'Dependent',
                        insuredPersonId: firstDep ? firstDep.id : 'NEW',
                        insuredName: firstDep ? firstDep.fullName : (policyData.insuredType === 'Dependent' ? policyData.insuredName : ''),
                        insuredRelationship: firstDep ? firstDep.relationship : (policyData.insuredType === 'Dependent' ? policyData.insuredRelationship : 'Child'),
                        insuredDob: firstDep ? firstDep.dob : (policyData.insuredType === 'Dependent' ? policyData.insuredDob : ''),
                        insuredGender: firstDep ? firstDep.gender : (policyData.insuredType === 'Dependent' ? policyData.insuredGender : 'Female')
                      });
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: policyData.insuredType === 'Dependent' ? '1px solid #c084fc' : '1px solid var(--border-light)',
                      backgroundColor: policyData.insuredType === 'Dependent' ? 'rgba(168, 85, 247, 0.18)' : 'rgba(255,255,255,0.02)',
                      color: policyData.insuredType === 'Dependent' ? '#c084fc' : 'var(--text-secondary)',
                      fontWeight: policyData.insuredType === 'Dependent' ? '600' : 'normal',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '12.5px'
                    }}
                  >
                    <Baby size={14} /> 👶 Dependent / Child
                  </button>
                </div>

                {policyData.insuredType === 'Dependent' && (
                  <div style={{ marginTop: '10px', padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.25)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: (currentClient.dependents || []).length > 0 ? '1fr 1fr' : '1fr', gap: '12px' }}>
                      {(currentClient.dependents || []).length > 0 && (
                        <div>
                          <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Select Registered Dependent</label>
                          <select
                            className="input-field"
                            style={{ width: '100%' }}
                            value={policyData.insuredPersonId || 'NEW'}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'NEW') {
                                setPolicyData({
                                  ...policyData,
                                  insuredPersonId: 'NEW',
                                  insuredName: '',
                                  insuredRelationship: 'Child',
                                  insuredDob: '',
                                  insuredGender: 'Female'
                                });
                              } else {
                                const selDep = (currentClient.dependents || []).find(d => d.id === val);
                                if (selDep) {
                                  setPolicyData({
                                    ...policyData,
                                    insuredPersonId: selDep.id,
                                    insuredName: selDep.fullName,
                                    insuredRelationship: selDep.relationship || 'Child',
                                    insuredDob: selDep.dob || '',
                                    insuredGender: selDep.gender || ''
                                  });
                                }
                              }
                            }}
                          >
                            {(currentClient.dependents || []).map(d => (
                              <option key={d.id} value={d.id}>👶 {d.fullName} ({d.relationship || 'Child'})</option>
                            ))}
                            <option value="NEW">+ Quick Register New Dependent...</option>
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Insured Dependent Name *</label>
                        <input
                          required={policyData.insuredType === 'Dependent'}
                          type="text"
                          className="input-field"
                          style={{ width: '100%' }}
                          placeholder="e.g. Emma Tan"
                          value={policyData.insuredName || ''}
                          onChange={(e) => setPolicyData({ ...policyData, insuredName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div>
                        <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Relationship</label>
                        <select
                          className="input-field"
                          style={{ width: '100%' }}
                          value={policyData.insuredRelationship || 'Child'}
                          onChange={(e) => setPolicyData({ ...policyData, insuredRelationship: e.target.value })}
                        >
                          <option value="Child">Child</option>
                          <option value="Daughter">Daughter</option>
                          <option value="Son">Son</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Parent">Parent</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Date of Birth</label>
                        <DatePicker
                          name="insuredDob"
                          value={policyData.insuredDob || ''}
                          onChange={(e) => setPolicyData({ ...policyData, insuredDob: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Gender</label>
                        <select
                          className="input-field"
                          style={{ width: '100%' }}
                          value={policyData.insuredGender || 'Female'}
                          onChange={(e) => setPolicyData({ ...policyData, insuredGender: e.target.value })}
                        >
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ fontSize: '11px', color: '#c084fc', fontStyle: 'italic' }}>
                      💡 {currentClient.preferredName || currentClient.fullName} is the Policy Owner & Payor. Saving this policy will automatically catalog and register this dependent in the client profile.
                    </div>
                  </div>
                )}
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
              {/* Shield Plan Specific: MediSave & Cash Outlay Premium Breakdown */}
              {policyData.policyType === 'Shield' && (
                <div style={{ marginBottom: '16px', padding: '16px', borderRadius: '10px', backgroundColor: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shield size={14} /> Shield Plan Premium Breakdown (MediSave & Cash)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>MediSave (CPF Portion)</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }}>$</span>
                        <input 
                          type="number" 
                          step="0.01"
                          min="0"
                          name="medisavePremium" 
                          className="input-field" 
                          style={{ width: '100%', paddingLeft: '24px' }} 
                          placeholder="e.g. 300.00"
                          value={policyData.medisavePremium} 
                          onChange={handlePolicyInputChange} 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Cash Outlay Portion</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }}>$</span>
                        <input 
                          type="number" 
                          step="0.01"
                          min="0"
                          name="cashPremium" 
                          className="input-field" 
                          style={{ width: '100%', paddingLeft: '24px' }} 
                          placeholder="e.g. 280.50"
                          value={policyData.cashPremium} 
                          onChange={handlePolicyInputChange} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>
                    {policyData.policyType === 'Shield' ? 'Total Premium (Calculated)' : 'Premium Amount'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }}>$</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      name="premiumAmount" 
                      className="input-field" 
                      style={{ width: '100%', paddingLeft: '24px' }} 
                      placeholder="0.00"
                      value={policyData.premiumAmount} 
                      onChange={handlePolicyInputChange} 
                    />
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
                            step="0.01" 
                            min="0"
                            className="input-field" 
                            style={{ width: '100%', paddingLeft: '24px' }} 
                            placeholder="0.00"
                            value={policyData.coverages[coverageName] || ''} 
                            onChange={(e) => handleCoverageChange(coverageName, e.target.value)} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Inception Date</label>
                <DatePicker 
                  name="inceptionDate" 
                  value={policyData.inceptionDate || ''} 
                  onChange={handlePolicyInputChange} 
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>
                  Remarks / Special Notes
                </label>
                <textarea
                  name="remarks"
                  className="input-field"
                  rows={3}
                  style={{ width: '100%', resize: 'vertical' }}
                  placeholder="e.g. Special rider exclusions, nomination status, subset coverage clauses, cash value bonus notes..."
                  value={policyData.remarks || policyData.notes || ''}
                  onChange={handlePolicyInputChange}
                />
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
                  <button type="button" className="btn" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }} onClick={() => setIsPolicyModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingPolicyId ? 'Update Policy' : 'Save Policy'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Dependent Modal */}
      {isDependentModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Baby size={22} color="#c084fc" />
              <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', margin: 0 }}>
                {editingDependentId ? 'Edit Dependent / Child' : 'Register Child or Dependent'}
              </h2>
            </div>
            <form onSubmit={handleSaveDependent}>
              <div style={{ marginBottom: '14px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Full Legal Name *</label>
                <input
                  required
                  type="text"
                  className="input-field"
                  style={{ width: '100%' }}
                  placeholder="e.g. Emma Tan"
                  value={dependentForm.fullName}
                  onChange={(e) => setDependentForm({ ...dependentForm, fullName: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Relationship</label>
                  <select
                    className="input-field"
                    style={{ width: '100%' }}
                    value={dependentForm.relationship}
                    onChange={(e) => setDependentForm({ ...dependentForm, relationship: e.target.value })}
                  >
                    <option value="Child">Child</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Son">Son</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Gender</label>
                  <select
                    className="input-field"
                    style={{ width: '100%' }}
                    value={dependentForm.gender}
                    onChange={(e) => setDependentForm({ ...dependentForm, gender: e.target.value })}
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Date of Birth</label>
                <DatePicker
                  name="dob"
                  value={dependentForm.dob || ''}
                  onChange={(e) => setDependentForm({ ...dependentForm, dob: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Remarks / Notes (Optional)</label>
                <textarea
                  className="input-field"
                  rows={2}
                  style={{ width: '100%', resize: 'vertical' }}
                  placeholder="e.g. Primary school student, pre-existing asthma clause..."
                  value={dependentForm.notes}
                  onChange={(e) => setDependentForm({ ...dependentForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="btn"
                  style={{ backgroundColor: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}
                  onClick={() => setIsDependentModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#9333ea', borderColor: '#9333ea' }}>
                  {editingDependentId ? 'Update Dependent' : 'Register Dependent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Social Links & Company Profile Modal */}
      {isSocialModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '560px', padding: '32px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Share2 size={20} color="var(--accent-blue)" />
              Edit Social Profiles & Company Links
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Configure direct links and handles to ground Gemini AI deep search and synthesize a 360° client dossier.
            </p>

            <form onSubmit={handleSaveSocialLinks}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Company Name</label>
                  <input type="text" className="input-field" style={{ width: '100%' }} placeholder="e.g. Acme Corp" value={socialLinks.companyName || ''} onChange={(e) => setSocialLinks({ ...socialLinks, companyName: e.target.value })} />
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Job Title</label>
                  <input type="text" className="input-field" style={{ width: '100%' }} placeholder="e.g. Managing Director" value={socialLinks.jobTitle || ''} onChange={(e) => setSocialLinks({ ...socialLinks, jobTitle: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <LinkedinIcon size={14} color="#60a5fa" /> LinkedIn Profile URL
                  </label>
                  <input type="text" className="input-field" style={{ width: '100%' }} placeholder="https://linkedin.com/in/..." value={socialLinks.linkedinUrl || ''} onChange={(e) => setSocialLinks({ ...socialLinks, linkedinUrl: e.target.value })} />
                </div>

                <div>
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <InstagramIcon size={14} color="#f472b6" /> Instagram Handle / Link
                  </label>
                  <input type="text" className="input-field" style={{ width: '100%' }} placeholder="https://instagram.com/... or @handle" value={socialLinks.instagramUrl || ''} onChange={(e) => setSocialLinks({ ...socialLinks, instagramUrl: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <TikTokIcon size={14} color="#38bdf8" /> TikTok Handle / Link
                  </label>
                  <input type="text" className="input-field" style={{ width: '100%' }} placeholder="https://tiktok.com/@... or @handle" value={socialLinks.tiktokUrl || ''} onChange={(e) => setSocialLinks({ ...socialLinks, tiktokUrl: e.target.value })} />
                </div>

                <div>
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <TwitterIcon size={14} color="#cbd5e1" /> X / Twitter Handle / Link
                  </label>
                  <input type="text" className="input-field" style={{ width: '100%' }} placeholder="https://x.com/... or @handle" value={socialLinks.twitterUrl || ''} onChange={(e) => setSocialLinks({ ...socialLinks, twitterUrl: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <YouTubeIcon size={14} color="#f87171" /> YouTube Channel Link
                  </label>
                  <input type="text" className="input-field" style={{ width: '100%' }} placeholder="https://youtube.com/@..." value={socialLinks.youtubeUrl || ''} onChange={(e) => setSocialLinks({ ...socialLinks, youtubeUrl: e.target.value })} />
                </div>

                <div>
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <FacebookIcon size={14} color="#93c5fd" /> Facebook Profile URL
                  </label>
                  <input type="text" className="input-field" style={{ width: '100%' }} placeholder="https://facebook.com/..." value={socialLinks.facebookUrl || ''} onChange={(e) => setSocialLinks({ ...socialLinks, facebookUrl: e.target.value })} />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Globe size={14} color="var(--text-muted)" /> Company / Personal Website
                </label>
                <input type="text" className="input-field" style={{ width: '100%' }} placeholder="https://example.com" value={socialLinks.websiteUrl || ''} onChange={(e) => setSocialLinks({ ...socialLinks, websiteUrl: e.target.value })} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }} onClick={() => setIsSocialModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Social Profiles</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {isEditTaskModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '28px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '6px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit2 size={18} color="var(--accent-primary)" />
              Edit Action Item, Meeting or Follow-up
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Changes to event type, due date, timeslot, and venue will automatically synchronize with your CRM Schedule and Google Calendar.
            </p>

            {/* Type Switcher */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              {[
                { type: 'task', label: 'Task / To-Do', icon: <CheckSquare size={12} />, color: 'var(--accent-primary)' },
                { type: 'meeting', label: 'Meeting', icon: <CalendarDays size={12} />, color: '#8b5cf6' },
                { type: 'followup', label: 'Follow-up', icon: <Phone size={12} />, color: '#06b6d4' }
              ].map(t => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => setEditTaskForm({ ...editTaskForm, type: t.type })}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11.5px',
                    fontWeight: (editTaskForm.type || 'task') === t.type ? '600' : '500',
                    backgroundColor: (editTaskForm.type || 'task') === t.type ? t.color : 'transparent',
                    color: (editTaskForm.type || 'task') === t.type ? '#ffffff' : 'var(--text-secondary)'
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveEditTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '5px' }}>
                  {(editTaskForm.type || 'task') === 'meeting' ? 'Meeting Agenda / Title' : ((editTaskForm.type || 'task') === 'followup' ? 'Follow-up Topic / Notes' : 'Task Description')}
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ width: '100%', fontSize: '13px' }} 
                  placeholder="Description..."
                  value={editTaskForm.description}
                  onChange={(e) => setEditTaskForm({ ...editTaskForm, description: e.target.value })}
                  required
                />
              </div>

              {/* Type-Specific Options */}
              {(editTaskForm.type || 'task') === 'task' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="input-label" style={{ display: 'block', marginBottom: '4px' }}>Priority Level</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['Normal', 'High', 'Urgent'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setEditTaskForm({ ...editTaskForm, priority: p })}
                        style={{
                          flex: 1,
                          padding: '5px 8px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: (editTaskForm.priority || 'Normal') === p ? '600' : '400',
                          border: `1px solid ${(editTaskForm.priority || 'Normal') === p ? (p === 'Urgent' ? '#ef4444' : (p === 'High' ? '#f59e0b' : 'var(--accent-primary)')) : 'var(--border-light)'}`,
                          backgroundColor: (editTaskForm.priority || 'Normal') === p ? (p === 'Urgent' ? 'rgba(239, 68, 68, 0.15)' : (p === 'High' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)')) : 'transparent',
                          color: (editTaskForm.priority || 'Normal') === p ? '#fff' : 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(editTaskForm.type || 'task') === 'followup' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="input-label" style={{ display: 'block', marginBottom: '4px' }}>Communication Channel</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {['WhatsApp', 'Phone Call', 'Email', 'Coffee', 'In-Person'].map(ch => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => setEditTaskForm({ ...editTaskForm, channel: ch })}
                        style={{
                          padding: '5px 6px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: (editTaskForm.channel || 'WhatsApp') === ch ? '600' : '400',
                          border: `1px solid ${(editTaskForm.channel || 'WhatsApp') === ch ? '#06b6d4' : 'var(--border-light)'}`,
                          backgroundColor: (editTaskForm.channel || 'WhatsApp') === ch ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                          color: (editTaskForm.channel || 'WhatsApp') === ch ? '#38bdf8' : 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    <input 
                      type="checkbox"
                      checked={!!editTaskForm.logTouchpointOnComplete}
                      onChange={(e) => setEditTaskForm({ ...editTaskForm, logTouchpointOnComplete: e.target.checked })}
                      style={{ accentColor: '#06b6d4' }}
                    />
                    <span>Log to Client Touchpoint History when completed</span>
                  </label>
                </div>
              )}

              {/* Date & Time Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '500' }}>
                    <Calendar size={13} color="var(--text-muted)" /> {(editTaskForm.type || 'task') === 'meeting' ? 'Meeting Date' : ((editTaskForm.type || 'task') === 'task' ? 'Deadline (Due Date)' : 'Target Follow-up Date')}
                  </label>
                  <DatePicker 
                    style={{ width: '100%', padding: '6px 10px', fontSize: '12px' }}
                    placeholder="Select date..."
                    value={editTaskForm.dueDate}
                    onChange={(e) => setEditTaskForm({ ...editTaskForm, dueDate: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '500' }}>
                      <Clock size={13} color="var(--text-muted)" /> Start Time
                    </label>
                    <input 
                      type="time" 
                      className="input-field" 
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', color: 'var(--text-primary)' }}
                      value={editTaskForm.dueTime || ''}
                      onChange={(e) => setEditTaskForm({ ...editTaskForm, dueTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '500' }}>
                      <Clock size={13} color="var(--text-muted)" /> End Time
                    </label>
                    <input 
                      type="time" 
                      className="input-field" 
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', color: 'var(--text-primary)' }}
                      value={editTaskForm.dueEndTime || ''}
                      onChange={(e) => setEditTaskForm({ ...editTaskForm, dueEndTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Venue */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '5px' }}>Venue / Address / Video Link</label>
                <AddressAutocomplete 
                  value={editTaskForm.location}
                  onChange={(e) => setEditTaskForm({ ...editTaskForm, location: e.target.value })}
                  placeholder="Search venue or enter video call URL"
                  style={{ padding: '8px 12px 8px 36px', fontSize: '13px' }}
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '5px' }}>Status</label>
                <select 
                  className="input-field"
                  style={{ width: '100%', fontSize: '13px' }}
                  value={editTaskForm.status}
                  onChange={(e) => setEditTaskForm({ ...editTaskForm, status: e.target.value })}
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button 
                  type="button" 
                  className="btn" 
                  style={{ backgroundColor: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }} 
                  onClick={() => setIsEditTaskModalOpen(false)}
                  disabled={isUpdatingTask}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isUpdatingTask}
                >
                  {isUpdatingTask ? 'Updating & Syncing...' : 'Save & Sync'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
