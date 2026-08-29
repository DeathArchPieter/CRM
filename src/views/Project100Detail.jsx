/* eslint-disable react-hooks/purity, react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowLeft, UserPlus, Star, Edit2, Trash2, Plus, Search, 
  Phone, Mail, Award, CheckCircle, RefreshCw, 
  Layers, AlertCircle, HelpCircle, Briefcase, UploadCloud,
  Sparkles, Send, Copy, Check, Calendar, FileSpreadsheet,
  Rocket, X, ExternalLink, MapPin
} from 'lucide-react';
import DatePicker from '../components/DatePicker';
import AddressAutocomplete from '../components/AddressAutocomplete';
import InfoTooltip from '../components/InfoTooltip';
import { useAdvisorContext } from '../context/AdvisorContext';

const CATEGORIES = [
  'Family',
  'Close Friend',
  'Warm Acquaintance',
  'Colleague / Classmate',
  'Cold / Re-contact'
];

const STAGES = [
  'Not Contacted',
  'Contacted',
  'Meeting Scheduled',
  'Fact Finding',
  'Proposal Presented',
  'Ported / Converted',
  'No Interest / Inactive'
];

const POLICY_TYPES = ['Life','Term','A&H','Shield','HI','ILP','Endowment','LTC','Disability Income'];
const PIPELINE_STAGES = ['Prospect', 'Fact Finding', 'Proposal Sent', 'Case Submitted', 'Case Issued', 'Closed/Lost'];

const STAGE_COLORS = {
  'Not Contacted': { bg: 'rgba(100, 116, 139, 0.12)', text: '#94a3b8' },
  'Contacted': { bg: 'rgba(59, 130, 246, 0.12)', text: '#60a5fa' },
  'Meeting Scheduled': { bg: 'rgba(234, 179, 8, 0.12)', text: '#fbbf24' },
  'Fact Finding': { bg: 'rgba(167, 139, 250, 0.12)', text: '#c084fc' },
  'Proposal Presented': { bg: 'rgba(249, 115, 22, 0.12)', text: '#fb923c' },
  'Ported / Converted': { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399' },
  'No Interest / Inactive': { bg: 'rgba(239, 68, 68, 0.12)', text: '#f87171' }
};

const CATEGORY_COLORS = {
  'Family': '#f43f5e', // rose
  'Close Friend': '#fb923c', // orange
  'Warm Acquaintance': '#38bdf8', // sky
  'Colleague / Classmate': '#a78bfa', // violet
  'Cold / Re-contact': '#64748b' // slate
};

export default function Project100Detail({ onBack, onSelectClient, onNavigateTab }) {
  const [contacts, setContacts] = useState([]);
  const [pipelineCases, setPipelineCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [initiatives, setInitiatives] = useState([]);
  const [loading, setLoading] = useState(true);

  // Unified logging helper
  const log = (msg) => {
    console.log(`[Project 100] ${msg}`);
    if (window.electronAPI?.writeLog) {
      window.electronAPI.writeLog(`[Project 100] ${msg}`);
    }
  };
  
  // Search & Filter State
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStage, setFilterStage] = useState('All');
  const [sortBy, setSortBy] = useState('score'); // 'score' | 'name' | 'stage'
  const [showWorkflowGuide, setShowWorkflowGuide] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { setAdvisorContext, registerActionHandler } = useAdvisorContext();

  // Sync with Archie 2.0
  useEffect(() => {
    setAdvisorContext({
      section: 'special-projects',
      subSection: 'project-100',
      activeSubTab: null,
      entityContext: {
        totalContacts: contacts.length
      }
    });
  }, [contacts.length, setAdvisorContext]);

  // Register Archie Action Handlers
  useEffect(() => {
    const unregAdd = registerActionHandler('addContact', () => {
      setIsAddModalOpen(true);
    });
    return () => unregAdd();
  }, [registerActionHandler]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [caseContact, setCaseContact] = useState(null);
  const [caseForm, setCaseForm] = useState({
    policyName: 'Comprehensive Protection Plan',
    policyType: 'Life',
    estimatedPremium: '3000',
    estimatedFYC: '1200',
    stage: 'Prospect',
    expectedCloseDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    notes: ''
  });

  // AI Icebreaker Modal State
  const [isIcebreakerModalOpen, setIsIcebreakerModalOpen] = useState(false);
  const [icebreakerContact, setIcebreakerContact] = useState(null);
  const [icebreakerData, setIcebreakerData] = useState(null);
  const [isIcebreakerLoading, setIsIcebreakerLoading] = useState(false);
  const [activeIcebreakerTab, setActiveIcebreakerTab] = useState('opt-a');

  // Calendar Meeting Modal State
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetingTarget, setMeetingTarget] = useState(null);
  const [meetingForm, setMeetingForm] = useState({
    description: '',
    dueDate: new Date(Date.now() + 2*24*60*60*1000).toISOString().split('T')[0],
    dueTime: '14:00',
    dueEndTime: '15:00',
    location: 'Coffee Sync / Client Office'
  });

  // Campaign Enrollment Modal State
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignTarget, setCampaignTarget] = useState(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: null,
    isAlert: false
  });

  const showCustomConfirm = (title, message, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel') => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm: () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      isAlert: false
    });
  };

  const showCustomAlert = (title, message, onClose = null) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      confirmText: 'OK',
      cancelText: '',
      onConfirm: () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        if (onClose) onClose();
      },
      isAlert: true
    });
  };

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    company: '',
    jobTitle: '',
    category: 'Warm Acquaintance',
    scoreNeed: 3,
    scoreAccessibility: 3,
    scoreIncome: 3,
    scoreTrust: 3,
    stage: 'Not Contacted',
    portedClientId: null,
    notes: ''
  });

  const loadData = async (silent = false) => {
    log(`loadData started (silent: ${silent})`);
    if (!silent) setLoading(true);
    const overallStart = performance.now();
    try {
      if (window.electronAPI) {
        const [contactsRes, pipelineRes, clientsRes, initRes] = await Promise.all([
          window.electronAPI.getProject100Contacts ? window.electronAPI.getProject100Contacts() : Promise.resolve({ success: true, data: [] }),
          window.electronAPI.getPipeline ? window.electronAPI.getPipeline() : Promise.resolve({ success: true, data: [] }),
          window.electronAPI.getClients ? window.electronAPI.getClients() : Promise.resolve({ success: true, data: [] }),
          window.electronAPI.getInitiatives ? window.electronAPI.getInitiatives() : Promise.resolve({ success: true, data: [] })
        ]);

        if (contactsRes.success) setContacts(contactsRes.data);
        if (pipelineRes.success) setPipelineCases(pipelineRes.data);
        if (clientsRes.success) setClients(clientsRes.data);
        if (initRes.success) setInitiatives(initRes.data);
      }
    } catch (err) {
      log(`Error in loadData: ${err.message}`);
      console.error("Failed to load Project 100 workspace data:", err);
    }
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Listen for Alt + A hotkey
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        const active = document.activeElement;
        const isInput = active && (
          active.tagName === 'INPUT' || 
          active.tagName === 'TEXTAREA' || 
          active.tagName === 'SELECT' ||
          active.isContentEditable
        );
        if (!isInput) {
          setIsAddModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.startsWith('score') ? Number(value) : value
    }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) return;

    setIsAddModalOpen(false);

    if (window.electronAPI?.addProject100Contact) {
      const formToSubmit = { ...formData };
      resetForm();
      const res = await window.electronAPI.addProject100Contact(formToSubmit);
      if (res.success) {
        loadData(true);
      } else {
        showCustomAlert("Error", "Failed to add prospect: " + res.error);
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedContact || !formData.fullName.trim()) return;

    if (window.electronAPI?.updateProject100Contact) {
      const res = await window.electronAPI.updateProject100Contact({
        ...formData,
        id: selectedContact.id
      });
      if (res.success) {
        setIsEditModalOpen(false);
        setSelectedContact(null);
        resetForm();
        loadData(true);
      } else {
        showCustomAlert("Error", "Failed to update prospect: " + res.error);
      }
    }
  };

  const handleOpenClientProfile = (contact) => {
    const matchingClient = clients.find(
      c => c.id === contact.portedClientId || (c.fullName || '').toLowerCase().trim() === (contact.fullName || '').toLowerCase().trim()
    );
    if (matchingClient && onSelectClient) {
      onSelectClient(matchingClient);
    } else if (onNavigateTab) {
      onNavigateTab('clients');
    }
  };

  const handleQuickStageChange = async (contact, newStage) => {
    if (newStage === 'Meeting Scheduled') {
      setMeetingTarget(contact);
      setMeetingForm({
        description: `Project 100 Consultation: ${contact.fullName}`,
        dueDate: new Date(Date.now() + 2*24*60*60*1000).toISOString().split('T')[0],
        dueTime: '14:00',
        dueEndTime: '15:00',
        location: 'Coffee Sync / Client Office'
      });
      setIsMeetingModalOpen(true);
    }

    if (newStage === 'Fact Finding' || newStage === 'Proposal Presented') {
      const existingCases = getClientCases(contact.fullName);
      if (existingCases.length === 0) {
        showCustomConfirm(
          "Open Sales Pipeline Deal?",
          `${contact.fullName} is now in ${newStage}. Would you like to create an active case in the Sales Pipeline?`,
          () => {
            handleOpenCreateCaseModal(contact);
          },
          "Create Pipeline Deal",
          "Skip for now"
        );
      }
    }

    if (newStage === 'Ported / Converted') {
      await handlePortToClients(contact);
      return;
    }

    if (window.electronAPI?.updateProject100Contact) {
      await window.electronAPI.updateProject100Contact({
        id: contact.id,
        stage: newStage
      });
      loadData(true);
    }
  };

  const handleDeleteContact = async (id) => {
    if (document.activeElement) document.activeElement.blur();
    showCustomConfirm(
      "Delete Prospect",
      "Are you sure you want to delete this prospect from your Project 100 list?",
      async () => {
        if (window.electronAPI?.deleteProject100Contact) {
          const res = await window.electronAPI.deleteProject100Contact(id);
          if (res.success) {
            loadData(true);
          } else {
            showCustomAlert("Error", "Failed to delete prospect: " + res.error);
          }
        }
      },
      "Delete",
      "Cancel"
    );
  };

  const openEditModal = (contact) => {
    setSelectedContact(contact);
    setFormData({
      fullName: contact.fullName,
      phone: contact.phone || '',
      email: contact.email || '',
      company: contact.company || '',
      jobTitle: contact.jobTitle || '',
      category: contact.category || 'Warm Acquaintance',
      scoreNeed: contact.scoreNeed || 3,
      scoreAccessibility: contact.scoreAccessibility || 3,
      scoreIncome: contact.scoreIncome || 3,
      scoreTrust: contact.scoreTrust || 3,
      stage: contact.stage || 'Not Contacted',
      notes: contact.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      company: '',
      jobTitle: '',
      category: 'Warm Acquaintance',
      scoreNeed: 3,
      scoreAccessibility: 3,
      scoreIncome: 3,
      scoreTrust: 3,
      stage: 'Not Contacted',
      portedClientId: null,
      notes: ''
    });
  };

  // AI Icebreaker Generation Handler
  const handleOpenAiIcebreaker = async (contact) => {
    setIcebreakerContact(contact);
    setIcebreakerData(null);
    setIsIcebreakerLoading(true);
    setIsIcebreakerModalOpen(true);
    setActiveIcebreakerTab('opt-a');

    try {
      if (window.electronAPI?.generateProject100Icebreaker) {
        const res = await window.electronAPI.generateProject100Icebreaker(contact);
        if (res.success && res.data) {
          setIcebreakerData(res.data);
          if (res.data.icebreakers && res.data.icebreakers.length > 0) {
            setActiveIcebreakerTab(res.data.icebreakers[0].id || 'opt-a');
          }
        }
      }
    } catch (err) {
      console.error("Failed to generate AI icebreaker:", err);
    } finally {
      setIsIcebreakerLoading(false);
    }
  };

  const handleSendIcebreakerWhatsApp = (messageText) => {
    if (!icebreakerContact) return;
    const cleanPhone = (icebreakerContact.phone || '').replace(/[^\d+]/g, '');
    const encoded = encodeURIComponent(messageText);
    const url = cleanPhone 
      ? `https://wa.me/${cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone}?text=${encoded}`
      : `https://web.whatsapp.com/send?text=${encoded}`;
    
    if (window.electronAPI?.openPath) {
      window.electronAPI.openPath(url);
    } else {
      window.open(url, '_blank');
    }
  };

  // Quick Calendar Meeting Save
  const handleScheduleMeetingSubmit = async (e) => {
    e.preventDefault();
    if (!meetingTarget) return;

    if (window.electronAPI?.addTask) {
      try {
        await window.electronAPI.addTask({
          clientId: meetingTarget.portedClientId || null,
          description: meetingForm.description,
          dueDate: meetingForm.dueDate,
          dueTime: meetingForm.dueTime,
          dueEndTime: meetingForm.dueEndTime,
          location: meetingForm.location,
          status: 'Pending'
        });
        showCustomAlert("Meeting Scheduled", `Appointment successfully booked and synced to calendar for ${meetingTarget.fullName}!`);
      } catch (err) {
        console.error("Failed to add meeting task:", err);
      }
    }

    setIsMeetingModalOpen(false);
    setMeetingTarget(null);
  };

  // 1-Click Campaign Enrollment Handler
  const handleEnrollInCampaignSubmit = async (e) => {
    e.preventDefault();
    if (!campaignTarget || !selectedCampaignId) return;

    const targetInitiative = initiatives.find(i => i.id === selectedCampaignId);
    if (!targetInitiative) return;

    const existingContacts = targetInitiative.contacts || [];
    const alreadyEnrolled = existingContacts.some(c => (c.fullName || '').toLowerCase().trim() === campaignTarget.fullName.toLowerCase().trim());

    if (alreadyEnrolled) {
      showCustomAlert("Already Enrolled", `${campaignTarget.fullName} is already enrolled in "${targetInitiative.title}".`);
      setIsCampaignModalOpen(false);
      return;
    }

    const newCampaignContact = {
      id: `target-${Date.now()}`,
      fullName: campaignTarget.fullName,
      phone: campaignTarget.phone || '',
      email: campaignTarget.email || '',
      segment: campaignTarget.category || 'P100 Prospect',
      stage: '1. Segmented',
      notes: `Enrolled from Project 100 (Score: ${getAverageScore(campaignTarget)}★)`,
      createdAt: new Date().toISOString()
    };

    if (window.electronAPI?.updateInitiative) {
      const res = await window.electronAPI.updateInitiative({
        id: targetInitiative.id,
        contacts: [...existingContacts, newCampaignContact]
      });

      if (res.success) {
        showCustomAlert("Campaign Enrolled", `Successfully enrolled ${campaignTarget.fullName} into "${targetInitiative.title}"!`);
        loadData(true);
      } else {
        showCustomAlert("Error", "Failed to enroll in campaign: " + res.error);
      }
    }

    setIsCampaignModalOpen(false);
    setCampaignTarget(null);
    setSelectedCampaignId('');
  };

  // Port to Clients Handler
  const handlePortToClients = async (contact) => {
    if (document.activeElement) document.activeElement.blur();
    showCustomConfirm(
      "Port to Clients",
      `Port ${contact.fullName} to your Core Clients Database?`,
      async () => {
        if (window.electronAPI?.addClient) {
          const existingClient = clients.find(
            c => (c.fullName || '').toLowerCase().trim() === contact.fullName.toLowerCase().trim()
          );

          if (existingClient) {
            showCustomConfirm(
              "Client Already Exists",
              `${contact.fullName} already exists in your Clients database. Link this prospect to that existing client profile?`,
              async () => {
                if (window.electronAPI?.updateProject100Contact) {
                  await window.electronAPI.updateProject100Contact({
                    id: contact.id,
                    stage: 'Ported / Converted',
                    portedClientId: existingClient.id
                  });
                }
                showCustomAlert("Success", `Linked ${contact.fullName} to existing Client profile!`);
                loadData(true);
              },
              "Link Profile",
              "Cancel"
            );
            return;
          }

          const clientRes = await window.electronAPI.addClient({
            fullName: contact.fullName,
            preferredName: contact.fullName.split(' ')[0],
            phone: contact.phone,
            email: contact.email,
            clientStatus: 'Prospect',
            notes: `[Ported from Project 100 on ${new Date().toLocaleDateString()}] N.A.S.T. Score: ${getAverageScore(contact)}/5.0. Category: ${contact.category}. Notes: ${contact.notes || 'None'}`
          });

          if (clientRes.success) {
            const clientId = clientRes.id;
            if (window.electronAPI?.updateProject100Contact) {
              await window.electronAPI.updateProject100Contact({
                id: contact.id,
                stage: 'Ported / Converted',
                portedClientId: clientId
              });
            }
            showCustomAlert("Success", `Ported ${contact.fullName} to Core Clients Database!`);
            loadData(true);
          } else {
            showCustomAlert("Error", "Failed to create client profile: " + clientRes.error);
          }
        }
      },
      "Port",
      "Cancel"
    );
  };

  // Create Case Handler
  const handleOpenCreateCaseModal = (contact) => {
    setCaseContact(contact);
    setCaseForm({
      policyName: '',
      policyType: 'Life',
      estimatedPremium: '',
      estimatedFYC: '',
      stage: 'Prospect',
      expectedCloseDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      notes: contact.notes || ''
    });
    setIsCaseModalOpen(true);
  };

  const handleCaseSubmit = async (e) => {
    e.preventDefault();
    if (!caseContact) return;

    setLoading(true);
    try {
      let clientId = caseContact.portedClientId;

      if (!clientId) {
        const existingClient = clients.find(
          c => (c.fullName || '').toLowerCase().trim() === caseContact.fullName.toLowerCase().trim()
        );

        if (existingClient) {
          clientId = existingClient.id;
        } else if (window.electronAPI?.addClient) {
          const clientRes = await window.electronAPI.addClient({
            fullName: caseContact.fullName,
            preferredName: caseContact.fullName.split(' ')[0],
            phone: caseContact.phone,
            email: caseContact.email,
            clientStatus: 'Prospect',
            notes: `[Ported via Pipeline Case on ${new Date().toLocaleDateString()}] N.A.S.T.: ${getAverageScore(caseContact)}/5.0.`
          });
          if (clientRes.success) {
            clientId = clientRes.id;
          }
        }
      }

      if (window.electronAPI?.addPipelineCase) {
        const caseRes = await window.electronAPI.addPipelineCase({
          clientName: caseContact.fullName,
          policyName: caseForm.policyName,
          policyType: caseForm.policyType,
          estimatedPremium: Number(caseForm.estimatedPremium) || 0,
          estimatedFYC: Number(caseForm.estimatedFYC) || 0,
          stage: caseForm.stage,
          expectedCloseDate: caseForm.expectedCloseDate || null,
          notes: caseForm.notes
        });

        if (caseRes.success) {
          if (window.electronAPI?.updateProject100Contact) {
            await window.electronAPI.updateProject100Contact({
              id: caseContact.id,
              stage: 'Ported / Converted',
              portedClientId: clientId
            });
          }
          setIsCaseModalOpen(false);
          setCaseContact(null);
          showCustomAlert("Success", `Created sales pipeline case for ${caseContact.fullName}!`);
          loadData(true);
        } else {
          showCustomAlert("Error", "Failed to create pipeline case: " + caseRes.error);
        }
      }
    } catch (err) {
      console.error("Error creating pipeline case:", err);
    }
    setLoading(false);
  };

  const handleExportCsv = () => {
    const headers = ['Full Name', 'Phone', 'Email', 'Company', 'Category', 'Need (1-5)', 'Accessibility (1-5)', 'Income (1-5)', 'Trust (1-5)', 'Total Score (/20)', 'Avg Rating (/5.0)', 'Stage', 'Notes'];
    const rows = contacts.map(c => [
      `"${c.fullName || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.email || ''}"`,
      `"${c.company || ''}"`,
      `"${c.category || ''}"`,
      c.scoreNeed || 0,
      c.scoreAccessibility || 0,
      c.scoreIncome || 0,
      c.scoreTrust || 0,
      getTotalScore(c),
      getAverageScore(c),
      `"${c.stage || ''}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `project_100_prospects_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fileInputRef = useRef(null);

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target.result;
      setLoading(true);
      try {
        let importedCount = 0;
        if (file.name.endsWith('.vcf')) {
          const cards = content.split('BEGIN:VCARD');
          for (const card of cards) {
            if (!card.trim()) continue;
            const fnMatch = card.match(/FN:(.+)/i);
            const telMatch = card.match(/TEL.*:(.+)/i);
            const emailMatch = card.match(/EMAIL.*:(.+)/i);
            const orgMatch = card.match(/ORG:(.+)/i);
            const titleMatch = card.match(/TITLE:(.+)/i);

            const fullName = fnMatch ? fnMatch[1].trim() : '';
            if (fullName) {
              await window.electronAPI?.addProject100Contact({
                fullName,
                phone: telMatch ? telMatch[1].trim() : '',
                email: emailMatch ? emailMatch[1].trim() : '',
                company: orgMatch ? orgMatch[1].trim() : '',
                jobTitle: titleMatch ? titleMatch[1].trim() : '',
                category: 'Warm Acquaintance',
                scoreNeed: 3,
                scoreAccessibility: 3,
                scoreIncome: 3,
                scoreTrust: 3,
                stage: 'Not Contacted'
              });
              importedCount++;
            }
          }
        } else {
          const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          if (lines.length > 0) {
            const isHeader = lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('phone');
            const dataLines = isHeader ? lines.slice(1) : lines;

            for (const line of dataLines) {
              const parts = line.split(',').map(p => p.replace(/^["']|["']$/g, '').trim());
              const fullName = parts[0];
              if (fullName) {
                await window.electronAPI?.addProject100Contact({
                  fullName,
                  phone: parts[1] || '',
                  email: parts[2] || '',
                  company: parts[3] || '',
                  category: CATEGORIES.includes(parts[4]) ? parts[4] : 'Warm Acquaintance',
                  scoreNeed: 3,
                  scoreAccessibility: 3,
                  scoreIncome: 3,
                  scoreTrust: 3,
                  stage: 'Not Contacted'
                });
                importedCount++;
              }
            }
          }
        }
        await loadData();
        showCustomAlert("Import Complete", `Successfully imported ${importedCount} contacts into Project 100!`);
      } catch (err) {
        showCustomAlert("Import Error", "Failed to parse file: " + err.message);
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleGenerateDemoData = async () => {
    setLoading(true);
    const sampleProspects = [
      { fullName: "Raymond Tan (Uncle)", phone: "+65 9123 4567", email: "raymond.tan@gmail.com", category: "Family", scoreNeed: 5, scoreAccessibility: 5, scoreIncome: 4, scoreTrust: 5, stage: "Meeting Scheduled", notes: "Approaching retirement. Needs annuity and legacy planning." },
      { fullName: "Sarah Jenkins", phone: "+65 8234 5678", email: "sarah.j@hotmail.com", category: "Close Friend", scoreNeed: 4, scoreAccessibility: 5, scoreIncome: 3, scoreTrust: 5, stage: "Proposal Presented", notes: "Recently married and bought a condo. Looking at CI and mortgage cover." },
      { fullName: "Lim Zi Xuan (David)", phone: "+65 9345 6789", email: "david.lim@techcorp.com", category: "Colleague / Classmate", scoreNeed: 3, scoreAccessibility: 4, scoreIncome: 5, scoreTrust: 4, stage: "Ported / Converted", notes: "Software engineer earning well. High investment capacity." },
      { fullName: "Marcus Tan", phone: "+65 8456 7890", email: "marcus.tan@u.nus.edu", category: "Colleague / Classmate", scoreNeed: 4, scoreAccessibility: 4, scoreIncome: 2, scoreTrust: 3, stage: "Contacted", notes: "Fresh grad. Good entry point for low-cost term protection." },
      { fullName: "Chua Bee Lan", phone: "+65 9567 8901", email: "beelanchua@yahoo.com.sg", category: "Family", scoreNeed: 3, scoreAccessibility: 5, scoreIncome: 3, scoreTrust: 5, stage: "Fact Finding", notes: "Aunt. Looking to compare medical shield options." },
      { fullName: "Jonathan Teo", phone: "+65 9678 9012", email: "j.teo.estate@gmail.com", category: "Warm Acquaintance", scoreNeed: 5, scoreAccessibility: 3, scoreIncome: 5, scoreTrust: 3, stage: "Not Contacted", notes: "Real estate agent. Strong income, no reviews in 5 years." },
      { fullName: "Clara Wong", phone: "+65 8789 0123", email: "clara.wong@outlook.com", category: "Close Friend", scoreNeed: 3, scoreAccessibility: 5, scoreIncome: 3, scoreTrust: 5, stage: "No Interest / Inactive", notes: "Currently working overseas in London." },
      { fullName: "Edwin Seah", phone: "+65 9890 1234", email: "edwinseah@gmail.com", category: "Warm Acquaintance", scoreNeed: 4, scoreAccessibility: 3, scoreIncome: 4, scoreTrust: 3, stage: "Contacted", notes: "Met at gym. Interested in wealth accumulation plans." },
      { fullName: "Patricia Ong", phone: "+65 9901 2345", email: "patricia.ong@school.edu.sg", category: "Cold / Re-contact", scoreNeed: 4, scoreAccessibility: 2, scoreIncome: 4, scoreTrust: 2, stage: "Not Contacted", notes: "Primary school classmate. Recently had newborn." },
      { fullName: "Yap Wei Kiat", phone: "+65 8012 3456", email: "weikiat.yap@outlook.com", category: "Colleague / Classmate", scoreNeed: 3, scoreAccessibility: 4, scoreIncome: 5, scoreTrust: 4, stage: "Not Contacted", notes: "Previous department manager. High earner." }
    ];

    if (window.electronAPI?.addProject100Contact) {
      for (const prospect of sampleProspects) {
        await window.electronAPI.addProject100Contact(prospect);
      }
    }
    await loadData();
    setLoading(false);
  };

  // Score helpers
  const getTotalScore = (contact) => {
    return (contact.scoreNeed || 0) + 
           (contact.scoreAccessibility || 0) + 
           (contact.scoreIncome || 0) + 
           (contact.scoreTrust || 0);
  };

  const getAverageScore = (contact) => {
    const total = getTotalScore(contact);
    return (total / 4).toFixed(1);
  };

  // Pipeline cases stats
  const getClientCases = (fullName) => {
    const nameLower = (fullName || '').toLowerCase().trim();
    return pipelineCases.filter(c => {
      const cName = (c.clientName || '').toLowerCase().trim();
      return cName === nameLower || nameLower.includes(cName) || cName.includes(nameLower);
    });
  };

  const getClientClosedCases = (fullName) => {
    const cases = getClientCases(fullName);
    return cases.filter(c => c.stage === 'Case Issued' || c.stage === 'Closed/Lost');
  };

  const getClientWonFYC = (fullName) => {
    const cases = getClientCases(fullName);
    return cases
      .filter(c => c.stage === 'Case Issued')
      .reduce((sum, c) => sum + (Number(c.estimatedFYC) || 0), 0);
  };

  const getClientActiveCases = (fullName) => {
    const cases = getClientCases(fullName);
    return cases.filter(c => c.stage !== 'Case Issued' && c.stage !== 'Closed/Lost');
  };

  // Aggregate Metrics
  const totalListed = contacts.length;
  const averagePotential = contacts.length 
    ? (contacts.reduce((sum, c) => sum + Number(getAverageScore(c)), 0) / contacts.length).toFixed(1)
    : '0.0';
  const totalPorted = contacts.filter(c => c.portedClientId || c.stage === 'Ported / Converted').length;
  const totalClosedCasesCount = contacts.reduce((sum, c) => sum + getClientClosedCases(c.fullName).length, 0);
  const totalClosedFYC = contacts.reduce((sum, c) => sum + getClientWonFYC(c.fullName), 0);

  // Filtered contacts
  const filteredContacts = contacts
    .filter(c => {
      const nameMatch = c.fullName.toLowerCase().includes(search.toLowerCase()) ||
                        (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
                        (c.phone && c.phone.includes(search));
      const categoryMatch = filterCategory === 'All' || c.category === filterCategory;
      const stageMatch = filterStage === 'All' || c.stage === filterStage;
      return nameMatch && categoryMatch && stageMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return getTotalScore(b) - getTotalScore(a);
      if (sortBy === 'name') return a.fullName.localeCompare(b.fullName);
      if (sortBy === 'stage') return a.stage.localeCompare(b.stage);
      return 0;
    });

  const renderStars = (rating) => (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <Star 
          key={star} 
          size={11} 
          fill={star <= rating ? '#fbbf24' : 'transparent'} 
          color={star <= rating ? '#fbbf24' : 'rgba(255,255,255,0.15)'}
        />
      ))}
    </div>
  );

  const availableCampaigns = initiatives.filter(i => i.id !== 'project-100' && i.type === 'outreach');

  return (
    <div className="view-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px', minHeight: '100%' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button className="btn btn-secondary" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onBack}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 className="text-gradient" style={{ fontSize: '22px', margin: 0 }}>Project 100 Workspace</h1>
              <span className="glass-panel" style={{ fontSize: '11px', color: 'var(--accent-secondary)', padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(6,182,212,0.2)' }}>
                Prospecting Foundation
              </span>
              <button 
                onClick={() => setShowWorkflowGuide(!showWorkflowGuide)}
                style={{ background: 'none', border: 'none', color: showWorkflowGuide ? 'var(--accent-primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '4px' }}
                title="View workflow guide"
              >
                <HelpCircle size={15} />
              </button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
              List 100 contacts, score their potential with N.A.S.T., generate AI icebreakers, and convert to active clients.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input ref={fileInputRef} type="file" accept=".csv,.vcf,.txt" style={{ display: 'none' }} onChange={handleImportFile} />
          
          <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }} onClick={handleExportCsv} title="Export full list to CSV">
            <FileSpreadsheet size={13} /> Export CSV
          </button>

          <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }} onClick={() => fileInputRef.current?.click()} disabled={loading}>
            <UploadCloud size={13} /> Import CSV / VCF
          </button>

          <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }} onClick={handleGenerateDemoData} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Demo Data
          </button>

          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }} onClick={() => setIsAddModalOpen(true)}>
            <Plus size={15} /> Add Prospect <span style={{ fontSize: '10px', opacity: 0.6, marginLeft: '2px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '1px 4px', borderRadius: '3px' }}>Alt+A</span>
          </button>
        </div>
      </header>

      {/* Stepper Workflow Guide */}
      {showWorkflowGuide && (
        <div className="glass-panel animate-fade-in" style={{ padding: '18px', borderLeft: '4px solid var(--accent-primary)', display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
          <button onClick={() => setShowWorkflowGuide(false)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
          <h3 style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
            <HelpCircle size={15} color="var(--accent-primary)" /> Project 100 Campaign Workflow Guide
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            {[
              { step: '1', title: '1. Brain Dump', desc: 'Add 100 contacts from memory or phone import. Don\'t pre-judge suitability.' },
              { step: '2', title: '2. N.A.S.T. Score', desc: 'Rate prospects 1-5 stars on Need, Accessibility, Suitability (Income), and Trust.' },
              { step: '3', title: '3. ✨ AI Icebreakers', desc: 'Generate 3 customized WhatsApp openers tailored to their score & relationship category.' },
              { step: '4', title: '4. Push to Campaign', desc: 'Enroll warm prospects into targeted product campaigns (e.g. CI Gap / SRS Tax).' },
              { step: '5', title: '5. Port & Track Deals', desc: 'Convert prospects to CRM clients and log pipeline deals toward your MDRT goal.' }
            ].map((s, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(139,92,246,0.15)', color: 'var(--accent-primary)', fontSize: '10.5px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.step}</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>{s.title}</span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        
        {/* Metric 1: List Building Progress */}
        <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10.5px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>List Building Progress</span>
            <Layers size={15} color="var(--accent-primary)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>{totalListed}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ 100</span>
            </div>
            <div style={{ width: '100%', height: '5px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${Math.min(100, (totalListed / 100) * 100)}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                borderRadius: '3px',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>
        </div>

        {/* Metric 2: Avg Qualification Rank */}
        <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10.5px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg. Priority Rating</span>
            <Star size={15} fill="#fbbf24" color="#fbbf24" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>{averagePotential}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ 5.0 ★</span>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>N.A.S.T. qualifying matrix</p>
          </div>
        </div>

        {/* Metric 3: Client Converted */}
        <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10.5px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ported to Clients</span>
            <UserPlus size={15} color="var(--accent-success)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '22px', fontWeight: '700', color: 'var(--accent-success)' }}>{totalPorted}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>profiles</span>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
              {totalListed ? Math.round((totalPorted / totalListed) * 100) : 0}% Conversion Rate
            </p>
          </div>
        </div>

        {/* Metric 4: Closed Revenue / Deals */}
        <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10.5px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pipeline FYC Won</span>
            <Award size={15} color="var(--accent-warning)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>
                ${totalClosedFYC.toLocaleString()}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--accent-success)', fontWeight: '600' }}>FYC</span>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
              {totalClosedCasesCount} cases closed
            </p>
          </div>
        </div>

      </div>

      {/* Filter / Search Bar */}
      <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '340px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="input-field" 
            style={{ width: '100%', paddingLeft: '36px', fontSize: '12.5px' }} 
            placeholder="Search prospects..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filters and Sorting */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Category:</span>
            <select 
              className="input-field" 
              style={{ padding: '5px 10px', fontSize: '12px', background: 'var(--bg-base)' }}
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Stage:</span>
            <select 
              className="input-field" 
              style={{ padding: '5px 10px', fontSize: '12px', background: 'var(--bg-base)' }}
              value={filterStage}
              onChange={e => setFilterStage(e.target.value)}
            >
              <option value="All">All Stages</option>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Sort by:</span>
            <select 
              className="input-field" 
              style={{ padding: '5px 10px', fontSize: '12px', background: 'var(--bg-base)' }}
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="score">Highest Priority Score</option>
              <option value="name">Alphabetical (Name)</option>
              <option value="stage">Engagement Stage</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Prospect Table */}
      <div className="glass-panel" style={{ overflowX: 'auto', padding: 0, flex: 1 }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading Project 100 Workspace...
          </div>
        ) : filteredContacts.length === 0 ? (
          <div style={{ padding: '48px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={32} color="var(--text-muted)" style={{ opacity: 0.5 }} />
            <h3 style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0 }}>No Prospects Found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', maxWidth: '340px', margin: 0 }}>
              Get started by adding a prospect or click "Demo Data" to populate pre-qualified samples.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '12px 18px', color: 'var(--text-secondary)', fontWeight: '500' }}>Name & Category</th>
                <th style={{ padding: '12px 18px', color: 'var(--text-secondary)', fontWeight: '500' }}>Contact Details</th>
                <th style={{ padding: '12px 18px', color: 'var(--text-secondary)', fontWeight: '500', minWidth: '130px' }}>
                  N.A.S.T Rating Grid
                  <InfoTooltip 
                    title="N.A.S.T. Framework" 
                    content="Need (Protection/Savings gaps), Accessibility (Ease of reaching), Savings/Income (Financial capacity), and Trust (Personal relationship strength)." 
                    benchmark="Target Score: ≥14/20"
                  />
                </th>
                <th style={{ padding: '12px 18px', color: 'var(--text-secondary)', fontWeight: '500', textAlign: 'center' }}>
                  Total Score
                  <InfoTooltip 
                    title="Priority Ranking Score" 
                    content="Composite score out of 20. Prospects with 16+ are Tier-1 high-conversion priorities." 
                  />
                </th>
                <th style={{ padding: '12px 18px', color: 'var(--text-secondary)', fontWeight: '500' }}>Stage</th>
                <th style={{ padding: '12px 18px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                  Pipeline Deals
                  <InfoTooltip 
                    title="Sales Pipeline Integration" 
                    content="Active sales opportunities and issued policies linked to your central advisory pipeline." 
                  />
                </th>
                <th style={{ padding: '12px 18px', color: 'var(--text-secondary)', fontWeight: '500', textAlign: 'right' }}>Actions & Copilot</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map(contact => {
                const totalScore = getTotalScore(contact);
                const avgScore = getAverageScore(contact);
                const stageColor = STAGE_COLORS[contact.stage] || { bg: 'rgba(255,255,255,0.05)', text: '#fff' };
                const catColor = CATEGORY_COLORS[contact.category] || '#fff';
                
                const clientCases = getClientCases(contact.fullName);
                const activeCases = getClientActiveCases(contact.fullName);
                const closedCases = getClientClosedCases(contact.fullName);
                const closedWonFYC = getClientWonFYC(contact.fullName);

                return (
                  <tr 
                    key={contact.id} 
                    style={{ borderBottom: '1px solid var(--border-light)', transition: 'background-color 0.15s' }}
                  >
                    {/* Name & Category */}
                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '13px' }}>
                        {contact.fullName}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: catColor }} />
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {contact.category} {contact.company ? `• ${contact.company}` : ''}
                        </span>
                      </div>
                    </td>

                    {/* Contact Details */}
                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                        <Phone size={11} color="var(--text-muted)" /> 
                        <span>{contact.phone || '-'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
                        <Mail size={11} color="var(--text-muted)" />
                        <span style={{ fontSize: '11px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '130px' }} title={contact.email}>
                          {contact.email || '-'}
                        </span>
                      </div>
                    </td>

                    {/* N.A.S.T Score Grid */}
                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', fontSize: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Need:</span>
                          {renderStars(contact.scoreNeed)}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Access:</span>
                          {renderStars(contact.scoreAccessibility)}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Income:</span>
                          {renderStars(contact.scoreIncome)}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Trust:</span>
                          {renderStars(contact.scoreTrust)}
                        </div>
                      </div>
                    </td>

                    {/* Total Score Column */}
                    <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                      <div style={{ fontSize: '14.5px', fontWeight: '700', color: totalScore >= 16 ? '#fbbf24' : 'var(--text-primary)' }}>
                        {totalScore}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>
                        {avgScore} ★
                      </div>
                    </td>

                    {/* Interactive Stage Selector */}
                    <td style={{ padding: '12px 18px' }}>
                      <select 
                        value={contact.stage}
                        onChange={(e) => handleQuickStageChange(contact, e.target.value)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: stageColor.bg,
                          color: stageColor.text,
                          border: 'none',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {STAGES.map(st => (
                          <option key={st} value={st} style={{ backgroundColor: '#1e293b', color: '#fff' }}>{st}</option>
                        ))}
                      </select>
                      {contact.notes && (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={contact.notes}>
                          {contact.notes}
                        </div>
                      )}
                    </td>

                    {/* Pipeline Deals */}
                    <td style={{ padding: '12px 18px' }}>
                      {clientCases.length === 0 ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>No active cases</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {closedCases.length > 0 && (
                            <div style={{ color: closedWonFYC > 0 ? '#34d399' : 'var(--text-secondary)', fontWeight: '600', fontSize: '11px' }}>
                              💼 {closedCases.length} won (${closedWonFYC.toLocaleString()} FYC)
                            </div>
                          )}
                          {activeCases.length > 0 && (
                            <div style={{ color: 'var(--accent-secondary)', fontSize: '10.5px' }}>
                              ⚡ {activeCases.length} in progress
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions & Copilot */}
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', alignItems: 'center' }}>
                        
                        {/* ✨ AI Icebreaker Button */}
                        <button 
                          className="btn btn-primary"
                          style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}
                          onClick={() => handleOpenAiIcebreaker(contact)}
                          title="Generate AI WhatsApp Icebreakers tailored to N.A.S.T. rating"
                        >
                          <Sparkles size={12} /> AI Opener
                        </button>

                        {/* 🚀 Enroll in Campaign Button */}
                        {availableCampaigns.length > 0 && (
                          <button 
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: '#60a5fa', borderColor: 'rgba(59,130,246,0.3)' }}
                            onClick={() => {
                              setCampaignTarget(contact);
                              setSelectedCampaignId(availableCampaigns[0]?.id || '');
                              setIsCampaignModalOpen(true);
                            }}
                            title="Enroll into an active Strategic Campaign"
                          >
                            <Rocket size={12} /> Campaign
                          </button>
                        )}

                        {/* 👤 Port to CRM button or Clickable Linked Badge */}
                        {(contact.portedClientId || clients.some(c => (c.fullName || '').toLowerCase().trim() === (contact.fullName || '').toLowerCase().trim())) ? (
                          <button 
                            className="btn" 
                            style={{ padding: '3px 8px', fontSize: '10.5px', color: '#34d399', backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleOpenClientProfile(contact)}
                            title="Open Client 360 Profile in CRM"
                          >
                            <CheckCircle size={11} /> Client ↗
                          </button>
                        ) : (
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 7px', fontSize: '11px', color: 'var(--accent-success)', borderColor: 'rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handlePortToClients(contact)}
                            title="Port to Core CRM Clients database"
                          >
                            <UserPlus size={11} /> Port
                          </button>
                        )}

                        {/* 💼 Create Pipeline Deal button */}
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '4px 7px', fontSize: '11px', color: 'var(--accent-secondary)', borderColor: 'rgba(6, 182, 212, 0.3)' }}
                          onClick={() => handleOpenCreateCaseModal(contact)}
                          title="Create Sales Pipeline Case"
                        >
                          <Briefcase size={11} /> Case
                        </button>

                        <button 
                          onClick={() => openEditModal(contact)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                          title="Edit prospect"
                        >
                          <Edit2 size={13} />
                        </button>

                        <button 
                          onClick={() => handleDeleteContact(contact.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: 0.6, padding: '4px' }}
                          title="Delete prospect"
                        >
                          <Trash2 size={13} />
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* AI ICEBREAKER COPILOT MODAL */}
      {isIcebreakerModalOpen && icebreakerContact && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '19px', color: 'var(--text-primary)', margin: 0 }}>
                    AI Outreach Copilot
                  </h2>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'rgba(139,92,246,0.15)', color: '#a78bfa', fontWeight: '600' }}>
                    {icebreakerContact.fullName} ({icebreakerContact.category})
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
                  N.A.S.T. Score: <strong style={{ color: '#fbbf24' }}>{getTotalScore(icebreakerContact)}/20 ({getAverageScore(icebreakerContact)}★)</strong> • Urgency: Need {icebreakerContact.scoreNeed}/5, Trust {icebreakerContact.scoreTrust}/5
                </p>
              </div>
              <button onClick={() => setIsIcebreakerModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {isIcebreakerLoading ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Sparkles size={32} className="animate-spin" style={{ color: 'var(--accent-primary)', margin: '0 auto 12px' }} />
                <div style={{ fontSize: '14px', fontWeight: '600' }}>Synthesizing Personalized WhatsApp Approaches...</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Analyzing relationship rapport, career signals, and Singapore advisory angles...
                </div>
              </div>
            ) : icebreakerData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Executive Assessment Card */}
                <div style={{ padding: '12px 16px', backgroundColor: 'rgba(139,92,246,0.08)', borderRadius: '8px', borderLeft: '4px solid var(--accent-primary)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#c084fc' }}>Advisory Strategy Assessment</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: '1.5' }}>
                    {icebreakerData.prospectSummary}
                  </div>
                  {icebreakerData.recommendedAngle && (
                    <div style={{ fontSize: '11px', color: '#fbbf24', marginTop: '4px', fontWeight: '500' }}>
                      ⚡ Recommendation: {icebreakerData.recommendedAngle}
                    </div>
                  )}
                </div>

                {/* Angle Selector Tabs */}
                <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
                  {(icebreakerData.icebreakers || []).map((ib, idx) => (
                    <button
                      key={ib.id || idx}
                      className={`btn ${activeIcebreakerTab === (ib.id || `opt-${idx}`) ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '11.5px', padding: '6px 12px' }}
                      onClick={() => setActiveIcebreakerTab(ib.id || `opt-${idx}`)}
                    >
                      {ib.angle || `Option ${idx + 1}`}
                    </button>
                  ))}
                </div>

                {/* Selected Angle Details */}
                {(() => {
                  const activeObj = (icebreakerData.icebreakers || []).find(ib => (ib.id || 'opt-a') === activeIcebreakerTab) || icebreakerData.icebreakers?.[0];
                  if (!activeObj) return null;

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(59,130,246,0.12)', color: '#60a5fa', fontWeight: '600' }}>
                            Tone: {activeObj.tone}
                          </span>
                          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                            {activeObj.rationale}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => {
                              navigator.clipboard.writeText(activeObj.message);
                              setCopiedKey(activeObj.id);
                              setTimeout(() => setCopiedKey(null), 1500);
                            }}
                          >
                            {copiedKey === activeObj.id ? <Check size={12} /> : <Copy size={12} />} Copy Message
                          </button>

                          <button 
                            className="btn btn-primary"
                            style={{ padding: '4px 10px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#10b981' }}
                            onClick={() => handleSendIcebreakerWhatsApp(activeObj.message)}
                          >
                            <Send size={12} /> WhatsApp
                          </button>
                        </div>
                      </div>

                      {/* WhatsApp Message Canvas */}
                      <div style={{ 
                        backgroundColor: 'rgba(0,0,0,0.3)', 
                        border: '1px solid rgba(255,255,255,0.08)', 
                        borderRadius: '8px', 
                        padding: '14px 16px', 
                        fontSize: '12.5px', 
                        color: 'var(--text-primary)', 
                        lineHeight: '1.6', 
                        whiteSpace: 'pre-wrap' 
                      }}>
                        {activeObj.message}
                      </div>

                      {/* In-Meeting Talking Points */}
                      {activeObj.talkingPoints && activeObj.talkingPoints.length > 0 && (
                        <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '10px 14px' }}>
                          <div style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            💬 Key Meeting Talking Points & Listening Cues:
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                            {activeObj.talkingPoints.map((tp, tIdx) => (
                              <li key={tIdx}>{tp}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                    </div>
                  );
                })()}

              </div>
            ) : (
              <div style={{ padding: '30px', textAlign: 'center', color: '#f87171' }}>
                Failed to generate AI icebreaker. Please check API settings or try again.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1-CLICK CAMPAIGN ENROLLMENT MODAL */}
      {isCampaignModalOpen && campaignTarget && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '28px' }}>
            <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Rocket size={18} color="#60a5fa" /> Enroll in Strategic Campaign
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '18px' }}>
              Add <strong>{campaignTarget.fullName}</strong> ({campaignTarget.category}) directly to an active outreach campaign.
            </p>

            <form onSubmit={handleEnrollInCampaignSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Select Active Campaign *</label>
                <select 
                  required 
                  className="input-field" 
                  style={{ width: '100%', background: 'var(--bg-base)' }}
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                >
                  <option value="">-- Select Campaign --</option>
                  {availableCampaigns.map(camp => (
                    <option key={camp.id} value={camp.id}>
                      {camp.title} ({camp.productName || 'Campaign'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCampaignModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!selectedCampaignId}>Enroll Prospect</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK CALENDAR APPOINTMENT MODAL */}
      {isMeetingModalOpen && meetingTarget && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '28px' }}>
            <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#fbbf24" /> Schedule Prospect Meeting
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '18px' }}>
              Booking sync for <strong>{meetingTarget.fullName}</strong>. Syncs automatically to Google Calendar.
            </p>

            <form onSubmit={handleScheduleMeetingSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Meeting Topic *</label>
                <input required type="text" className="input-field" style={{ width: '100%' }} value={meetingForm.description} onChange={(e) => setMeetingForm({ ...meetingForm, description: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Date</label>
                  <DatePicker value={meetingForm.dueDate} onChange={(e) => setMeetingForm({ ...meetingForm, dueDate: e.target.value })} />
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Start Time</label>
                  <input type="time" className="input-field" style={{ width: '100%' }} value={meetingForm.dueTime} onChange={(e) => setMeetingForm({ ...meetingForm, dueTime: e.target.value })} />
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>End Time</label>
                  <input type="time" className="input-field" style={{ width: '100%' }} value={meetingForm.dueEndTime} onChange={(e) => setMeetingForm({ ...meetingForm, dueEndTime: e.target.value })} />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Location (Address / Zoom)</label>
                <AddressAutocomplete 
                  value={meetingForm.location}
                  onChange={(val) => setMeetingForm({ ...meetingForm, location: val })}
                  placeholder="e.g. Raffles Place / Coffee Bean / Online Zoom"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsMeetingModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule & Sync</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PROSPECT MODAL */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '560px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>Add Prospect to Project 100</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px' }}>List a new potential client and evaluate their suitability</p>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Full Name *</label>
                <input type="text" name="fullName" className="input-field" value={formData.fullName} onChange={handleInputChange} required placeholder="e.g. David Lim" autoFocus />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Phone Number</label>
                  <input type="text" name="phone" className="input-field" value={formData.phone} onChange={handleInputChange} placeholder="+65 9123 4567" />
                </div>
                <div className="input-group">
                  <label className="input-label">Email Address</label>
                  <input type="email" name="email" className="input-field" value={formData.email} onChange={handleInputChange} placeholder="david.lim@gmail.com" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Company / Workplace</label>
                  <input type="text" name="company" className="input-field" value={formData.company} onChange={handleInputChange} placeholder="e.g. DBS Bank" />
                </div>
                <div className="input-group">
                  <label className="input-label">Relationship Category</label>
                  <select name="category" className="input-field" style={{ background: 'var(--bg-base)' }} value={formData.category} onChange={handleInputChange}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* N.A.S.T Ratings Sliders */}
              <div style={{ border: '1px solid var(--border-light)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  N.A.S.T Potential Evaluation (Score 1 - 5)
                </span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                    <span>Need (N)</span>
                    <span style={{ color: '#fbbf24', fontWeight: '700' }}>{formData.scoreNeed} ★</span>
                  </div>
                  <input type="range" name="scoreNeed" min="1" max="5" step="1" style={{ accentColor: 'var(--accent-primary)', width: '100%' }} value={formData.scoreNeed} onChange={handleInputChange} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                    <span>Accessibility (A)</span>
                    <span style={{ color: '#fbbf24', fontWeight: '700' }}>{formData.scoreAccessibility} ★</span>
                  </div>
                  <input type="range" name="scoreAccessibility" min="1" max="5" step="1" style={{ accentColor: 'var(--accent-primary)', width: '100%' }} value={formData.scoreAccessibility} onChange={handleInputChange} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                    <span>Suitability / Income (S)</span>
                    <span style={{ color: '#fbbf24', fontWeight: '700' }}>{formData.scoreIncome} ★</span>
                  </div>
                  <input type="range" name="scoreIncome" min="1" max="5" step="1" style={{ accentColor: 'var(--accent-primary)', width: '100%' }} value={formData.scoreIncome} onChange={handleInputChange} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                    <span>Trust (T)</span>
                    <span style={{ color: '#fbbf24', fontWeight: '700' }}>{formData.scoreTrust} ★</span>
                  </div>
                  <input type="range" name="scoreTrust" min="1" max="5" step="1" style={{ accentColor: 'var(--accent-primary)', width: '100%' }} value={formData.scoreTrust} onChange={handleInputChange} />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Notes & Remarks</label>
                <textarea name="notes" className="input-field" style={{ minHeight: '50px' }} value={formData.notes} onChange={handleInputChange} placeholder="Key notes on planning priorities..." />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add to List</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROSPECT MODAL */}
      {isEditModalOpen && selectedContact && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '560px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>Edit Prospect: {selectedContact.fullName}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px' }}>Update prospect particulars, stage, and N.A.S.T score</p>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Full Name *</label>
                <input type="text" name="fullName" className="input-field" value={formData.fullName} onChange={handleInputChange} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Phone Number</label>
                  <input type="text" name="phone" className="input-field" value={formData.phone} onChange={handleInputChange} />
                </div>
                <div className="input-group">
                  <label className="input-label">Email Address</label>
                  <input type="email" name="email" className="input-field" value={formData.email} onChange={handleInputChange} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Category</label>
                  <select name="category" className="input-field" style={{ background: 'var(--bg-base)' }} value={formData.category} onChange={handleInputChange}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Engagement Stage</label>
                  <select name="stage" className="input-field" style={{ background: 'var(--bg-base)' }} value={formData.stage} onChange={handleInputChange}>
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* N.A.S.T Ratings Sliders */}
              <div style={{ border: '1px solid var(--border-light)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                    <span>Need (N)</span>
                    <span style={{ color: '#fbbf24', fontWeight: '700' }}>{formData.scoreNeed} ★</span>
                  </div>
                  <input type="range" name="scoreNeed" min="1" max="5" step="1" style={{ accentColor: 'var(--accent-primary)', width: '100%' }} value={formData.scoreNeed} onChange={handleInputChange} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                    <span>Accessibility (A)</span>
                    <span style={{ color: '#fbbf24', fontWeight: '700' }}>{formData.scoreAccessibility} ★</span>
                  </div>
                  <input type="range" name="scoreAccessibility" min="1" max="5" step="1" style={{ accentColor: 'var(--accent-primary)', width: '100%' }} value={formData.scoreAccessibility} onChange={handleInputChange} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                    <span>Suitability / Income (S)</span>
                    <span style={{ color: '#fbbf24', fontWeight: '700' }}>{formData.scoreIncome} ★</span>
                  </div>
                  <input type="range" name="scoreIncome" min="1" max="5" step="1" style={{ accentColor: 'var(--accent-primary)', width: '100%' }} value={formData.scoreIncome} onChange={handleInputChange} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                    <span>Trust (T)</span>
                    <span style={{ color: '#fbbf24', fontWeight: '700' }}>{formData.scoreTrust} ★</span>
                  </div>
                  <input type="range" name="scoreTrust" min="1" max="5" step="1" style={{ accentColor: 'var(--accent-primary)', width: '100%' }} value={formData.scoreTrust} onChange={handleInputChange} />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Notes & Remarks</label>
                <textarea name="notes" className="input-field" style={{ minHeight: '50px' }} value={formData.notes} onChange={handleInputChange} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PIPELINE CASE MODAL */}
      {isCaseModalOpen && caseContact && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '28px' }}>
            <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>Create Sales Case for {caseContact.fullName}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px' }}>Auto-links to Core Clients and updates MDRT tracking.</p>

            <form onSubmit={handleCaseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Policy / Product Name *</label>
                <input type="text" className="input-field" value={caseForm.policyName} onChange={e => setCaseForm({ ...caseForm, policyName: e.target.value })} required placeholder="e.g. AIA Guaranteed Protect Plus" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Policy Type</label>
                  <select className="input-field" style={{ background: 'var(--bg-base)' }} value={caseForm.policyType} onChange={e => setCaseForm({ ...caseForm, policyType: e.target.value })}>
                    {POLICY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Pipeline Stage</label>
                  <select className="input-field" style={{ background: 'var(--bg-base)' }} value={caseForm.stage} onChange={e => setCaseForm({ ...caseForm, stage: e.target.value })}>
                    {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Est. Annual Premium ($)</label>
                  <input type="number" className="input-field" value={caseForm.estimatedPremium} onChange={e => setCaseForm({ ...caseForm, estimatedPremium: e.target.value })} placeholder="3000" />
                </div>
                <div className="input-group">
                  <label className="input-label">Est. FYC ($)</label>
                  <input type="number" className="input-field" value={caseForm.estimatedFYC} onChange={e => setCaseForm({ ...caseForm, estimatedFYC: e.target.value })} placeholder="1200" />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Case Notes / Timeline</label>
                <input type="text" className="input-field" value={caseForm.notes} onChange={e => setCaseForm({ ...caseForm, notes: e.target.value })} placeholder="Proposal pitching details..." />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setIsCaseModalOpen(false); setCaseContact(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {confirmConfig.isOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>{confirmConfig.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>{confirmConfig.message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {!confirmConfig.isAlert && (
                <button type="button" className="btn btn-secondary" onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}>
                  {confirmConfig.cancelText || 'Cancel'}
                </button>
              )}
              <button type="button" className="btn btn-primary" onClick={confirmConfig.onConfirm}>
                {confirmConfig.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
