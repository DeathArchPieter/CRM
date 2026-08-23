/* eslint-disable react-hooks/purity, react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowLeft, UserPlus, Star, Edit2, Trash2, Plus, Search, 
  Phone, Mail, Award, CheckCircle, RefreshCw, 
  Layers, AlertCircle, HelpCircle, Briefcase, UploadCloud
} from 'lucide-react';

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
  'Not Contacted': { bg: 'rgba(100, 116, 139, 0.1)', text: '#94a3b8' },
  'Contacted': { bg: 'rgba(59, 130, 246, 0.1)', text: '#60a5fa' },
  'Meeting Scheduled': { bg: 'rgba(234, 179, 8, 0.1)', text: '#fbbf24' },
  'Fact Finding': { bg: 'rgba(167, 139, 250, 0.1)', text: '#c084fc' },
  'Proposal Presented': { bg: 'rgba(249, 115, 22, 0.1)', text: '#fb923c' },
  'Ported / Converted': { bg: 'rgba(16, 185, 129, 0.1)', text: '#34d399' },
  'No Interest / Inactive': { bg: 'rgba(239, 68, 68, 0.1)', text: '#f87171' }
};

const CATEGORY_COLORS = {
  'Family': '#f43f5e', // rose
  'Close Friend': '#fb923c', // orange
  'Warm Acquaintance': '#38bdf8', // sky
  'Colleague / Classmate': '#a78bfa', // violet
  'Cold / Re-contact': '#64748b' // slate
};

export default function Project100Detail({ onBack }) {
  const [contacts, setContacts] = useState([]);
  const [pipelineCases, setPipelineCases] = useState([]);
  const [clients, setClients] = useState([]);
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
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [caseContact, setCaseContact] = useState(null);

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

  // Auto-log modal state changes for diagnostics
  useEffect(() => {
    log(`isAddModalOpen changed to: ${isAddModalOpen}`);
  }, [isAddModalOpen]);

  useEffect(() => {
    log(`isEditModalOpen changed to: ${isEditModalOpen} (selectedContact: ${selectedContact ? selectedContact.fullName : 'none'})`);
  }, [isEditModalOpen, selectedContact]);

  useEffect(() => {
    log(`isCaseModalOpen changed to: ${isCaseModalOpen} (caseContact: ${caseContact ? caseContact.fullName : 'none'})`);
  }, [isCaseModalOpen, caseContact]);
  
  // Pipeline case form state
  const [caseForm, setCaseForm] = useState({
    policyName: '',
    policyType: 'Life',
    estimatedPremium: '',
    estimatedFYC: '',
    stage: 'Prospect',
    expectedCloseDate: '',
    notes: ''
  });
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
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
        const startContacts = performance.now();
        const contactsPromise = window.electronAPI.getProject100Contacts 
          ? window.electronAPI.getProject100Contacts() 
          : Promise.resolve({ success: true, data: [] });
          
        const startPipeline = performance.now();
        const pipelinePromise = window.electronAPI.getPipeline 
          ? window.electronAPI.getPipeline() 
          : Promise.resolve({ success: true, data: [] });

        const startClients = performance.now();
        const clientsPromise = window.electronAPI.getClients 
          ? window.electronAPI.getClients() 
          : Promise.resolve({ success: true, data: [] });

        const [contactsRes, pipelineRes, clientsRes] = await Promise.all([
          contactsPromise,
          pipelinePromise,
          clientsPromise
        ]);

        log(`API calls completed: getProject100Contacts took ${(performance.now() - startContacts).toFixed(2)}ms, getPipeline took ${(performance.now() - startPipeline).toFixed(2)}ms, getClients took ${(performance.now() - startClients).toFixed(2)}ms`);

        if (contactsRes.success) {
          setContacts(contactsRes.data);
          log(`setContacts succeeded: loaded ${contactsRes.data.length} contacts`);
        } else {
          log(`getProject100Contacts failed: ${contactsRes.error}`);
        }
        
        if (pipelineRes.success) {
          setPipelineCases(pipelineRes.data);
          log(`setPipelineCases succeeded: loaded ${pipelineRes.data.length} cases`);
        } else {
          log(`getPipeline failed: ${pipelineRes.error}`);
        }
        
        if (clientsRes.success) {
          setClients(clientsRes.data);
          log(`setClients succeeded: loaded ${clientsRes.data.length} clients`);
        } else {
          log(`getClients failed: ${clientsRes.error}`);
        }
      }
    } catch (err) {
      log(`Error in loadData: ${err.message}`);
      console.error("Failed to load Project 100 workspace data:", err);
    }
    if (!silent) setLoading(false);
    log(`loadData finished in ${(performance.now() - overallStart).toFixed(2)}ms`);
  };

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    loadData();
  }, []);

  const scrollToBottom = () => {
    console.log("[scrollToBottom] Project100Detail scroll sequence started");
    const runScroll = (delay) => {
      const container = document.getElementById('main-scroll-container');
      if (container) {
        const oldScrollTop = container.scrollTop;
        container.scrollTop = container.scrollHeight + 1000;
        console.log(`[scrollToBottom][${delay}ms] main-scroll-container: scrollHeight=${container.scrollHeight}, clientHeight=${container.clientHeight}, scrollTop was ${oldScrollTop}, now ${container.scrollTop}`);
      }

      document.documentElement.scrollTop = document.documentElement.scrollHeight;
      document.body.scrollTop = document.body.scrollHeight;

      let el = document.querySelector('.view-container');
      while (el) {
        if (el.scrollHeight > el.clientHeight) {
          const oldElScrollTop = el.scrollTop;
          el.scrollTop = el.scrollHeight + 1000;
          console.log(`[scrollToBottom][${delay}ms] Parent element (${el.tagName}.${el.className}): scrollHeight=${el.scrollHeight}, clientHeight=${el.clientHeight}, scrollTop was ${oldElScrollTop}, now ${el.scrollTop}`);
        }
        el = el.parentNode;
      }
    };

    // Run at staggered delays to capture layout settling
    setTimeout(() => runScroll(50), 50);
    setTimeout(() => runScroll(150), 150);
    setTimeout(() => runScroll(300), 300);
    setTimeout(() => runScroll(600), 600);
  };

  // Auto-scroll to bottom of prospects list when a new prospect is added
  const prevContactsLength = useRef(contacts.length);
  useEffect(() => {
    if (contacts.length > prevContactsLength.current) {
      scrollToBottom();
    }
    prevContactsLength.current = contacts.length;
  }, [contacts.length]);

  // Listen for Alt + A hotkey to trigger the Add Prospect modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        log("Alt+A keyboard shortcut triggered");
        
        // Don't trigger if user is actively editing inside an input/textarea/select
        const active = document.activeElement;
        const isInput = active && (
          active.tagName === 'INPUT' || 
          active.tagName === 'TEXTAREA' || 
          active.tagName === 'SELECT' ||
          active.isContentEditable
        );
        
        log(`Alt+A isInput: ${isInput}, active element: ${active ? active.tagName : 'none'}`);
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

    log(`handleAddSubmit started for: ${formData.fullName}`);
    // Blur active elements to settle focus
    if (document.activeElement) {
      document.activeElement.blur();
    }
    
    // Close modal immediately to avoid focus restoration races
    setIsAddModalOpen(false);

    if (window.electronAPI?.addProject100Contact) {
      const formToSubmit = { ...formData };
      resetForm();
      const startAdd = performance.now();
      const res = await window.electronAPI.addProject100Contact(formToSubmit);
      log(`addProject100Contact returned in ${(performance.now() - startAdd).toFixed(2)}ms (success: ${res.success})`);
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

    log(`handleEditSubmit started for ID: ${selectedContact.id}, name: ${formData.fullName}`);
    if (window.electronAPI?.updateProject100Contact) {
      const startEdit = performance.now();
      const res = await window.electronAPI.updateProject100Contact({
        ...formData,
        id: selectedContact.id
      });
      log(`updateProject100Contact returned in ${(performance.now() - startEdit).toFixed(2)}ms (success: ${res.success})`);
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

  const handleDeleteContact = async (id) => {
    log(`handleDeleteContact triggered for contact ID: ${id}`);
    if (document.activeElement) {
      document.activeElement.blur();
    }
    showCustomConfirm(
      "Delete Prospect",
      "Are you sure you want to delete this prospect from your Project 100 list?",
      async () => {
        log(`handleDeleteContact confirmed`);
        if (window.electronAPI?.deleteProject100Contact) {
          const startDelete = performance.now();
          const res = await window.electronAPI.deleteProject100Contact(id);
          log(`deleteProject100Contact returned in ${(performance.now() - startDelete).toFixed(2)}ms (success: ${res.success})`);
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

  const handleSelectClientToImport = (e) => {
    const clientId = e.target.value;
    if (!clientId) return;

    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    setFormData(prev => ({
      ...prev,
      fullName: client.fullName,
      phone: client.phone || '',
      email: client.email || '',
      stage: client.clientStatus === 'Active' ? 'Ported / Converted' : 'Contacted',
      portedClientId: client.id,
      notes: client.notes || ''
    }));
  };

  const handleSelectPipelineToImport = (e) => {
    const clientName = e.target.value;
    if (!clientName) return;

    const cases = pipelineCases.filter(c => c.clientName === clientName);
    const latestCase = cases[cases.length - 1];
    
    const client = clients.find(c => c.fullName.toLowerCase().trim() === clientName.toLowerCase().trim());

    setFormData(prev => ({
      ...prev,
      fullName: clientName,
      phone: client ? (client.phone || '') : '',
      email: client ? (client.email || '') : '',
      stage: latestCase && latestCase.stage === 'Case Issued' ? 'Ported / Converted' : 'Contacted',
      portedClientId: client ? client.id : null,
      notes: latestCase ? latestCase.notes || '' : ''
    }));
  };

  const handleOpenCreateCaseModal = (contact) => {
    setCaseContact(contact);
    setCaseForm({
      policyName: '',
      policyType: 'Life',
      estimatedPremium: '',
      estimatedFYC: '',
      stage: 'Prospect',
      expectedCloseDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0], // default 30 days
      notes: contact.notes || ''
    });
    setIsCaseModalOpen(true);
  };

  const handleCaseSubmit = async (e) => {
    e.preventDefault();
    if (!caseContact) return;

    log(`handleCaseSubmit started for contact: ${caseContact.fullName}`);
    setLoading(true);
    try {
      let clientId = caseContact.portedClientId;
      let updatedContact = { ...caseContact };

      // Step 1: If not ported to clients yet, check for match or port first!
      if (!clientId) {
        log(`handleCaseSubmit: checking existing client by name for ${caseContact.fullName}`);
        // Look for case-insensitive exact name match in current clients list
        const existingClient = clients.find(
          c => (c.fullName || '').toLowerCase().trim() === caseContact.fullName.toLowerCase().trim()
        );

        if (existingClient) {
          clientId = existingClient.id;
          updatedContact.portedClientId = clientId;
          updatedContact.stage = 'Ported / Converted';
          log(`handleCaseSubmit: linked to existing client ID ${clientId}`);
        } else if (window.electronAPI?.addClient) {
          log(`handleCaseSubmit: creating new client for ${caseContact.fullName}`);
          const startAddClient = performance.now();
          const clientRes = await window.electronAPI.addClient({
            fullName: caseContact.fullName,
            preferredName: caseContact.fullName.split(' ')[0],
            phone: caseContact.phone,
            email: caseContact.email,
            clientStatus: 'Prospect',
            notes: `[Ported via Case Creation on ${new Date().toLocaleDateString()}] N.A.S.T. Priority Rank: ${getAverageScore(caseContact)}/5.0. Notes: ${caseContact.notes || 'None'}`
          });
          log(`addClient returned in ${(performance.now() - startAddClient).toFixed(2)}ms (success: ${clientRes.success})`);

          if (clientRes.success) {
            clientId = clientRes.id;
            updatedContact.portedClientId = clientId;
            updatedContact.stage = 'Ported / Converted';
          } else {
            showCustomAlert("Error", "Failed to auto-create client profile: " + clientRes.error);
            setLoading(false);
            return;
          }
        }
      }

      // Step 2: Create pipeline case
      if (window.electronAPI?.addPipelineCase) {
        log(`handleCaseSubmit: adding pipeline case...`);
        const startAddCase = performance.now();
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
        log(`addPipelineCase returned in ${(performance.now() - startAddCase).toFixed(2)}ms (success: ${caseRes.success})`);

        if (caseRes.success) {
          // Step 3: Update contact in Project 100
          if (window.electronAPI?.updateProject100Contact) {
            const startUpdateContact = performance.now();
            await window.electronAPI.updateProject100Contact({
              id: caseContact.id,
              stage: 'Ported / Converted',
              portedClientId: clientId
            });
            log(`updateProject100Contact took ${(performance.now() - startUpdateContact).toFixed(2)}ms`);
          }
          setIsCaseModalOpen(false);
          setCaseContact(null);
          showCustomAlert("Success", `Successfully created pipeline case for ${caseContact.fullName}!`);
          loadData(true);
        } else {
          showCustomAlert("Error", "Failed to create pipeline case: " + caseRes.error);
        }
      }
    } catch (err) {
      log(`Error in handleCaseSubmit: ${err.message}`);
      console.error("Error creating pipeline case from Project 100:", err);
    }
    setLoading(false);
  };

  // Convert Project 100 prospect to Client Profile
  const handlePortToClients = async (contact) => {
    log(`handlePortToClients triggered for contact: ${contact.fullName}`);
    if (document.activeElement) {
      document.activeElement.blur();
    }
    showCustomConfirm(
      "Port to Clients",
      `Port ${contact.fullName} to your Core Clients Database?`,
      async () => {
        log(`handlePortToClients confirmed`);
        if (window.electronAPI?.addClient) {
          // Step 1: Check if client already exists by name
          log(`handlePortToClients: checking existing client by name...`);
          const existingClient = clients.find(
            c => (c.fullName || '').toLowerCase().trim() === contact.fullName.toLowerCase().trim()
          );

          if (existingClient) {
            showCustomConfirm(
              "Client Already Exists",
              `${contact.fullName} already exists in your Clients database. Would you like to link this prospect to that existing client profile?`,
              async () => {
                log(`handlePortToClients link confirmed`);
                if (window.electronAPI?.updateProject100Contact) {
                  const startLinkUpdate = performance.now();
                  await window.electronAPI.updateProject100Contact({
                    id: contact.id,
                    stage: 'Ported / Converted',
                    portedClientId: existingClient.id
                  });
                  log(`updateProject100Contact (link) took ${(performance.now() - startLinkUpdate).toFixed(2)}ms`);
                }
                showCustomAlert("Success", `Successfully linked ${contact.fullName} to existing Client profile!`);
                loadData(true);
              },
              "Link Profile",
              "Cancel"
            );
            return;
          }

          // Step 2: Create client if not found
          log(`handlePortToClients: adding client profile...`);
          const startAdd = performance.now();
          const clientRes = await window.electronAPI.addClient({
            fullName: contact.fullName,
            preferredName: contact.fullName.split(' ')[0], // simple preferred name guess
            phone: contact.phone,
            email: contact.email,
            clientStatus: 'Prospect',
            notes: `[Ported from Project 100 on ${new Date().toLocaleDateString()}] N.A.S.T. Priority Rank: ${getAverageScore(contact)}/5.0. Category: ${contact.category}. Notes: ${contact.notes || 'None'}`
          });
          log(`addClient took ${(performance.now() - startAdd).toFixed(2)}ms (success: ${clientRes.success})`);

          if (clientRes.success) {
            const clientId = clientRes.id;
            // Step 3: Update prospect in Project 100
            if (window.electronAPI?.updateProject100Contact) {
              const startUpdate = performance.now();
              await window.electronAPI.updateProject100Contact({
                id: contact.id,
                stage: 'Ported / Converted',
                portedClientId: clientId
              });
              log(`updateProject100Contact took ${(performance.now() - startUpdate).toFixed(2)}ms`);
            }
            showCustomAlert("Success", `Successfully ported ${contact.fullName} to Client Database!`);
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

  // Generate 10 realistic demo prospects to test out rankings, pipeline integration and porting
  const handleGenerateDemoData = async () => {
    const startDemoAction = async () => {
      setLoading(true);
      const sampleProspects = [
        { fullName: "Raymond Tan (Uncle)", phone: "+65 9123 4567", email: "raymond.tan@gmail.com", category: "Family", scoreNeed: 5, scoreAccessibility: 5, scoreIncome: 4, scoreTrust: 5, stage: "Meeting Scheduled", notes: "Approaching retirement. Needs annuity and legacy planning." },
        { fullName: "Sarah Jenkins", phone: "+65 8234 5678", email: "sarah.j@hotmail.com", category: "Close Friend", scoreNeed: 4, scoreAccessibility: 5, scoreIncome: 3, scoreTrust: 5, stage: "Proposal Presented", notes: "Recently married and bought a condo. Looking at critical illness and mortgage insurance." },
        { fullName: "Lim Zi Xuan (David)", phone: "+65 9345 6789", email: "david.lim@techcorp.com", category: "Colleague / Classmate", scoreNeed: 3, scoreAccessibility: 4, scoreIncome: 5, scoreTrust: 4, stage: "Ported / Converted", notes: "Software engineer earning well. Ported to client directory. High investment capacity." },
        { fullName: "Marcus Tan", phone: "+65 8456 7890", email: "marcus.tan@u.nus.edu", category: "Colleague / Classmate", scoreNeed: 4, scoreAccessibility: 4, scoreIncome: 2, scoreTrust: 3, stage: "Contacted", notes: "Fresh grad. Good entry point for low-cost term protection." },
        { fullName: "Chua Bee Lan", phone: "+65 9567 8901", email: "beelanchua@yahoo.com.sg", category: "Family", scoreNeed: 3, scoreAccessibility: 5, scoreIncome: 3, scoreTrust: 5, stage: "Fact Finding", notes: "Aunt. Looking to compare some medical shield options." },
        { fullName: "Jonathan Teo", phone: "+65 9678 9012", email: "j.teo.estate@gmail.com", category: "Warm Acquaintance", scoreNeed: 5, scoreAccessibility: 3, scoreIncome: 5, scoreTrust: 3, stage: "Not Contacted", notes: "Real estate agent. Strong income but no insurance portfolio reviews in 5 years." },
        { fullName: "Clara Wong", phone: "+65 8789 0123", email: "clara.wong@outlook.com", category: "Close Friend", scoreNeed: 3, scoreAccessibility: 5, scoreIncome: 3, scoreTrust: 5, stage: "No Interest / Inactive", notes: "Currently working overseas in London, not looking to buy local policies right now." },
        { fullName: "Edwin Seah", phone: "+65 9890 1234", email: "edwinseah@gmail.com", category: "Warm Acquaintance", scoreNeed: 4, scoreAccessibility: 3, scoreIncome: 4, scoreTrust: 3, stage: "Contacted", notes: "Met at local gym. Interested in wealth accumulation plans (ILPs)." },
        { fullName: "Patricia Ong", phone: "+65 9901 2345", email: "patricia.ong@shiningstars.edu.sg", category: "Cold / Re-contact", scoreNeed: 4, scoreAccessibility: 2, scoreIncome: 4, scoreTrust: 2, stage: "Not Contacted", notes: "Primary school classmate. Saw she recently posted about having a newborn." },
        { fullName: "Yap Wei Kiat", phone: "+65 8012 3456", email: "weikiat.yap@outlook.com", category: "Colleague / Classmate", scoreNeed: 3, scoreAccessibility: 4, scoreIncome: 5, scoreTrust: 4, stage: "Not Contacted", notes: "Previous department manager. High earner. Good corporate networking link." }
      ];

      if (window.electronAPI?.addProject100Contact) {
        for (const prospect of sampleProspects) {
          // Add prospect
          const res = await window.electronAPI.addProject100Contact(prospect);
          
          // Special integration logic for demo: If prospect is "David Lim", we also port him and create a closed case to show the tracking system working immediately!
          if (res.success && prospect.fullName === "Lim Zi Xuan (David)" && window.electronAPI.addClient && window.electronAPI.addPipelineCase) {
            const clientRes = await window.electronAPI.addClient({
              fullName: prospect.fullName,
              preferredName: "David",
              phone: prospect.phone,
              email: prospect.email,
              clientStatus: 'Active',
              notes: `[Ported from Project 100 Demo] N.A.S.T. Priority Rank: 4.3/5.0. Tech engineer.`
            });

            if (clientRes.success) {
              const clientId = clientRes.id;
              // Update stage in Project 100
              await window.electronAPI.updateProject100Contact({
                id: res.id,
                stage: 'Ported / Converted',
                portedClientId: clientId
              });

              // Add a closed pipeline case (Closed Won / Case Issued) matching his name
              await window.electronAPI.addPipelineCase({
                clientName: prospect.fullName,
                policyName: "Great Eastern Wealth Accumulator",
                policyType: "ILP",
                estimatedPremium: 6000,
                estimatedFYC: 2400,
                stage: "Case Issued",
                expectedCloseDate: new Date().toISOString().split('T')[0],
                notes: "Issued policy. $6k annual premium wealth-builder plan."
              });
              
              // Add a pending pipeline case for Raymond Tan as well to demonstrate active deals
              await window.electronAPI.addPipelineCase({
                clientName: "Raymond Tan (Uncle)",
                policyName: "AIA Retirement Saver",
                policyType: "Endowment",
                estimatedPremium: 10000,
                estimatedFYC: 3500,
                stage: "Proposal Sent",
                expectedCloseDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
                notes: "Proposal pitched. Waiting for feedback next week."
              });
            }
          }
        }
      }
      
      await loadData();
      setLoading(false);
    };

    if (contacts.length > 0) {
      if (document.activeElement) {
        document.activeElement.blur();
      }
      showCustomConfirm(
        "Generate Demo Prospects",
        "This will add 10 sample prospects to your current list. Do you want to continue?",
        startDemoAction,
        "Continue",
        "Cancel"
      );
    } else {
      await startDemoAction();
    }
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

  // Helper function to calculate total score (out of 20)
  const getTotalScore = (contact) => {
    return (contact.scoreNeed || 0) + 
           (contact.scoreAccessibility || 0) + 
           (contact.scoreIncome || 0) + 
           (contact.scoreTrust || 0);
  };

  // Helper function to calculate average score (out of 5.0)
  const getAverageScore = (contact) => {
    const total = getTotalScore(contact);
    return (total / 4).toFixed(1);
  };

  // Case tracking functions
  const getClientCases = (fullName) => {
    const nameLower = fullName.toLowerCase().trim();
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

  // Calculate metrics
  const totalListed = contacts.length;
  const averagePotential = contacts.length 
    ? (contacts.reduce((sum, c) => sum + Number(getAverageScore(c)), 0) / contacts.length).toFixed(1)
    : '0.0';
  const totalPorted = contacts.filter(c => c.portedClientId || c.stage === 'Ported / Converted').length;
  
  // Total cases closed across the entire prospect list
  const totalClosedCasesCount = contacts.reduce((sum, c) => sum + getClientClosedCases(c.fullName).length, 0);
  const totalClosedFYC = contacts.reduce((sum, c) => sum + getClientWonFYC(c.fullName), 0);

  // Filtered and sorted contacts
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
      if (sortBy === 'score') {
        return getTotalScore(b) - getTotalScore(a); // highest score first
      } else if (sortBy === 'name') {
        return a.fullName.localeCompare(b.fullName);
      } else if (sortBy === 'stage') {
        return a.stage.localeCompare(b.stage);
      }
      return 0;
    });

  // Render Stars helper
  const renderStars = (rating) => {
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star} 
            size={12} 
            fill={star <= rating ? '#fbbf24' : 'transparent'} 
            color={star <= rating ? '#fbbf24' : 'rgba(255,255,255,0.15)'}
          />
        ))}
      </div>
    );
  };

  // Available clients & pipeline names not yet in Project 100
  const availableClients = clients
    .filter(c => {
      return !contacts.some(p => p.fullName.toLowerCase().trim() === c.fullName.toLowerCase().trim() || p.portedClientId === c.id);
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  const availablePipelineNames = Array.from(new Set(pipelineCases.map(c => c.clientName)))
    .filter(name => {
      return name && name.trim().length > 0 && !contacts.some(p => p.fullName.toLowerCase().trim() === name.toLowerCase().trim());
    })
    .sort((a, b) => a.localeCompare(b));

  return (
    <div className="view-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'auto', minHeight: '100%' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
            onClick={onBack}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="text-gradient" style={{ fontSize: '24px', margin: 0 }}>Project 100 Workspace</h1>
              <span className="glass-panel" style={{ fontSize: '11px', color: 'var(--accent-secondary)', padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(6,182,212,0.2)' }}>
                Path to Glory
              </span>
              <button 
                onClick={() => setShowWorkflowGuide(!showWorkflowGuide)}
                style={{ 
                  background: 'none', border: 'none', color: showWorkflowGuide ? 'var(--accent-primary)' : 'var(--text-muted)', 
                  cursor: 'pointer', display: 'flex', padding: '4px', borderRadius: '50%',
                  transition: 'color 0.15s', outline: 'none'
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = showWorkflowGuide ? 'var(--accent-primary)' : 'var(--text-muted)'}
                title="View workflow guide"
              >
                <HelpCircle size={16} />
              </button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
              Jumpstart your sales pipeline. List 100 people you know, score their potential, and convert them to active CRM clients.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.vcf,.txt"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
          <button 
            className="btn btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            title="Import contacts from CSV or phone .vcf file"
          >
            <UploadCloud size={14} /> Import CSV / VCF
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            onClick={handleGenerateDemoData}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Generate Demo Prospects
          </button>
          <button 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            onClick={(e) => {
              e.currentTarget.blur();
              setIsAddModalOpen(true);
            }}
          >
            <Plus size={16} /> Add Prospect <span style={{ fontSize: '10px', opacity: 0.6, marginLeft: '4px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '1px 5px', borderRadius: '3px' }}>Alt+A</span>
          </button>
        </div>
      </header>

      {/* Stepper Workflow Guide */}
      {showWorkflowGuide && (
        <div className="glass-panel animate-fade-in" style={{ padding: '20px', borderLeft: '4px solid var(--accent-primary)', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
          <button 
            onClick={() => setShowWorkflowGuide(false)}
            style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}
            title="Close Guide"
          >
            ✕
          </button>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HelpCircle size={16} color="var(--accent-primary)" /> Project 100 Campaign Workflow Guide
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
            {[
              { step: '1', title: '1. Brain Dump', desc: 'Add 100 contacts from memory or phone. Don\'t pre-judge suitability yet!' },
              { step: '2', title: '2. N.A.S.T. Score', desc: 'Rate prospects 1-5 stars on Need, Accessibility, Suitability (Income), and Trust.' },
              { step: '3', title: '3. Approach Hot Leads', desc: 'Reach out to contacts with high scores first. Update their status as you engage.' },
              { step: '4', title: '4. Convert to CRM', desc: 'Promote warm prospects into core clients by clicking "Port" to sync profiles.' },
              { step: '5', title: '5. Track Policy Sales', desc: 'Add cases in the Pipeline view. Successful deals automatically flow back to Project 100!' }
            ].map((s, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    width: '22px', height: '22px', borderRadius: '50%', 
                    backgroundColor: 'rgba(139,92,246,0.15)', color: 'var(--accent-primary)',
                    fontSize: '11px', fontWeight: '700', display: 'flex', 
                    alignItems: 'center', justifyContent: 'center' 
                  }}>{s.step}</span>
                  <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-primary)' }}>{s.title}</span>
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        
        {/* Metric 1: List Building Progress */}
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>List Building Progress</span>
            <Layers size={16} color="var(--accent-primary)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>{totalListed}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/ 100</span>
            </div>
            <div style={{ width: '100%', height: '5px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
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
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg. Priority Rating</span>
            <Star size={16} fill="#fbbf24" color="#fbbf24" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>{averagePotential}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/ 5.0 ★</span>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>Based on N.A.S.T. qualifying metrics</p>
          </div>
        </div>

        {/* Metric 3: Client Converted */}
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ported to Clients</span>
            <UserPlus size={16} color="var(--accent-success)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-success)' }}>{totalPorted}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>profiles</span>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
              {totalListed ? Math.round((totalPorted / totalListed) * 100) : 0}% Conversion Rate
            </p>
          </div>
        </div>

        {/* Metric 4: Closed Revenue / Deals */}
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Closed Pipeline Revenue</span>
            <Award size={16} color="var(--accent-warning)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
                ${totalClosedFYC.toLocaleString()}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--accent-success)', fontWeight: '600' }}>FYC</span>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
              {totalClosedCasesCount} cases closed successfully
            </p>
          </div>
        </div>

      </div>

      {/* Filter / Search Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '360px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="input-field" 
            style={{ width: '100%', paddingLeft: '38px', fontSize: '13px' }} 
            placeholder="Search prospects by name or contact..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filters and Sorting */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Category:</span>
            <select 
              className="input-field" 
              style={{ padding: '6px 12px', fontSize: '12.5px', background: 'var(--bg-base)' }}
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Stage:</span>
            <select 
              className="input-field" 
              style={{ padding: '6px 12px', fontSize: '12.5px', background: 'var(--bg-base)' }}
              value={filterStage}
              onChange={e => setFilterStage(e.target.value)}
            >
              <option value="All">All Stages</option>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sort by:</span>
            <select 
              className="input-field" 
              style={{ padding: '6px 12px', fontSize: '12.5px', background: 'var(--bg-base)' }}
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
      <div className="glass-panel" style={{ overflowX: 'auto', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading Project 100 Workspace...
          </div>
        ) : filteredContacts.length === 0 ? (
          <div style={{ padding: '60px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={36} color="var(--text-muted)" style={{ opacity: 0.5 }} />
            <h3 style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>No Prospects Found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', maxWidth: '360px', margin: '0 auto' }}>
              Get started by adding a prospect manually or click "Generate Demo Prospects" to load pre-qualified samples.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500' }}>Name & Category</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500' }}>Contact Details</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500', minWidth: '130px' }}>N.A.S.T Rating Grid</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500', textAlign: 'center' }}>Total Score</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500' }}>Stage</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500' }}>Cases Closed / Active</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map(contact => {
                const totalScore = getTotalScore(contact);
                const avgScore = getAverageScore(contact);
                const stageColor = STAGE_COLORS[contact.stage] || { bg: 'rgba(255,255,255,0.05)', text: '#fff' };
                const catColor = CATEGORY_COLORS[contact.category] || '#fff';
                
                // Case and pipeline stats
                const clientCases = getClientCases(contact.fullName);
                const activeCases = getClientActiveCases(contact.fullName);
                const closedCases = getClientClosedCases(contact.fullName);
                const closedWonFYC = getClientWonFYC(contact.fullName);

                return (
                  <tr 
                    key={contact.id} 
                    style={{ borderBottom: '1px solid var(--border-light)', transition: 'background-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    
                    {/* Name & Category */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '13.5px' }}>
                        {contact.fullName}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <span style={{ 
                          width: '6px', 
                          height: '6px', 
                          borderRadius: '50%', 
                          backgroundColor: catColor 
                        }} />
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {contact.category}
                        </span>
                      </div>
                    </td>

                    {/* Contact Details */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                        <Phone size={11} color="var(--text-muted)" /> 
                        <span>{contact.phone || '-'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                        <Mail size={11} color="var(--text-muted)" />
                        <span style={{ fontSize: '11.5px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px' }} title={contact.email}>
                          {contact.email || '-'}
                        </span>
                      </div>
                    </td>

                    {/* N.A.S.T Score Grid */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Need:</span>
                          {renderStars(contact.scoreNeed)}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Access:</span>
                          {renderStars(contact.scoreAccessibility)}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Income:</span>
                          {renderStars(contact.scoreIncome)}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Trust:</span>
                          {renderStars(contact.scoreTrust)}
                        </div>
                      </div>
                    </td>

                    {/* Total Score Column */}
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: totalScore >= 16 ? 'var(--accent-warning)' : 'var(--text-primary)' }}>
                        {totalScore}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {avgScore} ★
                      </div>
                    </td>

                    {/* Engagement Stage */}
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '12px', 
                        fontSize: '11px',
                        fontWeight: '500',
                        backgroundColor: stageColor.bg,
                        color: stageColor.text,
                        whiteSpace: 'nowrap'
                      }}>
                        {contact.stage}
                      </span>
                      {contact.notes && (
                        <div 
                          style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '6px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebKitLineClamp: 2, WebKitBoxOrient: 'vertical' }}
                          title={contact.notes}
                        >
                          {contact.notes}
                        </div>
                      )}
                    </td>

                    {/* Pipeline Tracking */}
                    <td style={{ padding: '14px 20px' }}>
                      {clientCases.length === 0 ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>No active cases</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {closedCases.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <div style={{ color: closedWonFYC > 0 ? 'var(--accent-success)' : 'var(--text-secondary)', fontWeight: '600', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>💼 {closedCases.length} closed</span>
                                {closedWonFYC > 0 && <span>(${closedWonFYC.toLocaleString()} FYC)</span>}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '6px', borderLeft: '1px solid rgba(255,255,255,0.08)', marginTop: '2px' }}>
                                {closedCases.map(c => (
                                  <div key={c.id} style={{ fontSize: '10px', color: c.stage === 'Case Issued' ? 'var(--accent-success)' : 'var(--text-muted)' }} title={c.notes}>
                                    • {c.policyName || c.policyType} ({c.stage === 'Case Issued' ? 'Won' : 'Lost'})
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {activeCases.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <div style={{ color: 'var(--accent-secondary)', fontSize: '11px', fontWeight: '500' }}>
                                ⚡ {activeCases.length} in progress
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '6px', borderLeft: '1px solid rgba(255,255,255,0.08)', marginTop: '2px' }}>
                                {activeCases.map(c => (
                                  <div key={c.id} style={{ fontSize: '10px', color: 'var(--text-secondary)' }} title={c.notes}>
                                    • {c.policyName || c.policyType} ({c.stage})
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
                        
                        {/* Port to CRM button */}
                        {(!contact.portedClientId && contact.stage !== 'Ported / Converted') ? (
                          <button 
                            className="btn btn-secondary" 
                            style={{ 
                              padding: '5px 8px', 
                              fontSize: '11px', 
                              borderColor: 'rgba(16, 185, 129, 0.3)', 
                              color: 'var(--accent-success)',
                              backgroundColor: 'rgba(16, 185, 129, 0.05)'
                            }}
                            onClick={() => handlePortToClients(contact)}
                            title="Port to Clients Database"
                          >
                            <UserPlus size={12} style={{ marginRight: '4px' }} /> Port
                          </button>
                        ) : (
                          <span 
                            style={{ 
                              fontSize: '11px', 
                              color: 'var(--accent-success)', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '4px',
                              padding: '5px 8px',
                              backgroundColor: 'rgba(16, 185, 129, 0.08)',
                              borderRadius: '4px'
                            }}
                            title="Linked to CRM Client profile"
                          >
                            <CheckCircle size={11} /> Ported
                          </span>
                        )}

                        {/* Port to Pipeline button */}
                        <button 
                          className="btn btn-secondary" 
                          style={{ 
                            padding: '5px 8px', 
                            fontSize: '11px', 
                            borderColor: 'rgba(6, 182, 212, 0.3)', 
                            color: 'var(--accent-secondary)',
                            backgroundColor: 'rgba(6, 182, 212, 0.05)'
                          }}
                          onClick={() => handleOpenCreateCaseModal(contact)}
                          title="Create Sales Pipeline Case"
                        >
                          <Briefcase size={12} style={{ marginRight: '4px' }} /> Case
                        </button>

                        <button 
                          onClick={() => openEditModal(contact)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '6px' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                          title="Edit prospect"
                        >
                          <Edit2 size={13} />
                        </button>

                        <button 
                          onClick={() => handleDeleteContact(contact.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '6px' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
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

      {/* ADD PROSPECT MODAL */}
      {isAddModalOpen && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)',
          backdropFilter: 'blur(8px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }} onClick={() => setIsAddModalOpen(false)}>
          <div 
            className="glass-panel animate-fade-in" 
            style={{ width: '100%', maxWidth: '580px', padding: '28px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}
            onClick={e => e.stopPropagation()}
          >
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>Add Prospect to Project 100</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>List a new potential client and evaluate their suitability</p>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Import Quick Selector */}
              {(availableClients.length > 0 || availablePipelineNames.length > 0) && (
                <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Quick Import from Existing Contacts
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label className="input-label" style={{ fontSize: '10.5px' }}>From Clients Database</label>
                      <select 
                        className="input-field" 
                        style={{ padding: '6px 10px', fontSize: '12px', background: 'var(--bg-base)', border: '1px solid rgba(255,255,255,0.08)' }}
                        value="" 
                        onChange={handleSelectClientToImport}
                      >
                        <option value="">-- Select Client --</option>
                        {availableClients.map(c => (
                          <option key={c.id} value={c.id}>{c.fullName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label className="input-label" style={{ fontSize: '10.5px' }}>From Pipeline Deals</label>
                      <select 
                        className="input-field" 
                        style={{ padding: '6px 10px', fontSize: '12px', background: 'var(--bg-base)', border: '1px solid rgba(255,255,255,0.08)' }}
                        value="" 
                        onChange={handleSelectPipelineToImport}
                      >
                        <option value="">-- Select Deal Contact --</option>
                        {availablePipelineNames.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Full Name *</label>
                <input 
                  type="text" name="fullName" className="input-field" 
                  value={formData.fullName} onChange={handleInputChange} 
                  required placeholder="e.g. David Lim"
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Phone Number</label>
                  <input 
                    type="text" name="phone" className="input-field" 
                    value={formData.phone} onChange={handleInputChange} 
                    placeholder="e.g. +65 9123 4567"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Email Address</label>
                  <input 
                    type="email" name="email" className="input-field" 
                    value={formData.email} onChange={handleInputChange} 
                    placeholder="e.g. david.lim@gmail.com"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Relationship Category</label>
                  <select 
                    name="category" className="input-field" 
                    style={{ background: 'var(--bg-base)' }}
                    value={formData.category} onChange={handleInputChange}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Engagement Stage</label>
                  <select 
                    name="stage" className="input-field" 
                    style={{ background: 'var(--bg-base)' }}
                    value={formData.stage} onChange={handleInputChange}
                  >
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* N.A.S.T Ratings Sliders */}
              <div style={{ border: '1px solid var(--border-light)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  N.A.S.T Potential Evaluation (Score 1 - 5)
                </span>
                
                {/* Need */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Need (N): <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>Does the prospect have clear planning needs?</span></span>
                    <span style={{ color: 'var(--accent-warning)', fontWeight: '700' }}>{formData.scoreNeed} ★</span>
                  </div>
                  <input type="range" name="scoreNeed" min="1" max="5" step="1" style={{ accentColor: 'var(--accent-primary)', width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', cursor: 'pointer' }} value={formData.scoreNeed} onChange={handleInputChange} />
                </div>

                {/* Accessibility */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Accessibility (A): <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>How easy is it to request a meeting?</span></span>
                    <span style={{ color: 'var(--accent-warning)', fontWeight: '700' }}>{formData.scoreAccessibility} ★</span>
                  </div>
                  <input type="range" name="scoreAccessibility" min="1" max="5" step="1" style={{ accentColor: 'var(--accent-primary)', width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', cursor: 'pointer' }} value={formData.scoreAccessibility} onChange={handleInputChange} />
                </div>

                {/* Income */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Suitability/Income (S): <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>Do they have budget & premium affordability?</span></span>
                    <span style={{ color: 'var(--accent-warning)', fontWeight: '700' }}>{formData.scoreIncome} ★</span>
                  </div>
                  <input type="range" name="scoreIncome" min="1" max="5" step="1" style={{ accentColor: 'var(--accent-primary)', width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', cursor: 'pointer' }} value={formData.scoreIncome} onChange={handleInputChange} />
                </div>

                {/* Trust */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Trust (T): <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>How strong is the existing personal trust?</span></span>
                    <span style={{ color: 'var(--accent-warning)', fontWeight: '700' }}>{formData.scoreTrust} ★</span>
                  </div>
                  <input type="range" name="scoreTrust" min="1" max="5" step="1" style={{ accentColor: 'var(--accent-primary)', width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', cursor: 'pointer' }} value={formData.scoreTrust} onChange={handleInputChange} />
                </div>

                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Computed Overall Score:</span>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {formData.scoreNeed + formData.scoreAccessibility + formData.scoreIncome + formData.scoreTrust} / 20 points
                  </span>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Notes & Comments</label>
                <textarea 
                  name="notes" className="input-field" 
                  style={{ minHeight: '60px', fontFamily: 'inherit', resize: 'vertical' }}
                  value={formData.notes} onChange={handleInputChange}
                  placeholder="e.g. Recently married. Keep details updated. Ask for coffee next week."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Prospect
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* EDIT PROSPECT MODAL */}
      {isEditModalOpen && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)',
          backdropFilter: 'blur(8px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }} onClick={() => setIsEditModalOpen(false)}>
          <div 
            className="glass-panel animate-fade-in" 
            style={{ width: '100%', maxWidth: '580px', padding: '28px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}
            onClick={e => e.stopPropagation()}
          >
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>Edit Prospect Information</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Update profile settings and qualifier ratings</p>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Full Name *</label>
                <input 
                  type="text" name="fullName" className="input-field" 
                  value={formData.fullName} onChange={handleInputChange} 
                  required placeholder="e.g. David Lim"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Phone Number</label>
                  <input 
                    type="text" name="phone" className="input-field" 
                    value={formData.phone} onChange={handleInputChange} 
                    placeholder="e.g. +65 9123 4567"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Email Address</label>
                  <input 
                    type="email" name="email" className="input-field" 
                    value={formData.email} onChange={handleInputChange} 
                    placeholder="e.g. david.lim@gmail.com"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Relationship Category</label>
                  <select 
                    name="category" className="input-field" 
                    style={{ background: 'var(--bg-base)' }}
                    value={formData.category} onChange={handleInputChange}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Engagement Stage</label>
                  <select 
                    name="stage" className="input-field" 
                    style={{ background: 'var(--bg-base)' }}
                    value={formData.stage} onChange={handleInputChange}
                  >
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* N.A.S.T Ratings Sliders */}
              <div style={{ border: '1px solid var(--border-light)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  N.A.S.T Potential Evaluation (Score 1 - 5)
                </span>
                
                {/* Need */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Need (N): <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>Does the prospect have clear planning needs?</span></span>
                    <span style={{ color: 'var(--accent-warning)', fontWeight: '700' }}>{formData.scoreNeed} ★</span>
                  </div>
                  <input type="range" name="scoreNeed" min="1" max="5" step="1" style={{ accentColor: 'var(--accent-primary)', width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', cursor: 'pointer' }} value={formData.scoreNeed} onChange={handleInputChange} />
                </div>

                {/* Accessibility */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Accessibility (A): <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>How easy is it to request a meeting?</span></span>
                    <span style={{ color: 'var(--accent-warning)', fontWeight: '700' }}>{formData.scoreAccessibility} ★</span>
                  </div>
                  <input type="range" name="scoreAccessibility" min="1" max="5" step="1" style={{ accentColor: 'var(--accent-primary)', width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', cursor: 'pointer' }} value={formData.scoreAccessibility} onChange={handleInputChange} />
                </div>

                {/* Income */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Suitability/Income (S): <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>Do they have budget & premium affordability?</span></span>
                    <span style={{ color: 'var(--accent-warning)', fontWeight: '700' }}>{formData.scoreIncome} ★</span>
                  </div>
                  <input type="range" name="scoreIncome" min="1" max="5" step="1" style={{ accentColor: 'var(--accent-primary)', width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', cursor: 'pointer' }} value={formData.scoreIncome} onChange={handleInputChange} />
                </div>

                {/* Trust */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Trust (T): <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>How strong is the existing personal trust?</span></span>
                    <span style={{ color: 'var(--accent-warning)', fontWeight: '700' }}>{formData.scoreTrust} ★</span>
                  </div>
                  <input type="range" name="scoreTrust" min="1" max="5" step="1" style={{ accentColor: 'var(--accent-primary)', width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', cursor: 'pointer' }} value={formData.scoreTrust} onChange={handleInputChange} />
                </div>

                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Computed Overall Score:</span>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {formData.scoreNeed + formData.scoreAccessibility + formData.scoreIncome + formData.scoreTrust} / 20 points
                  </span>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Notes & Comments</label>
                <textarea 
                  name="notes" className="input-field" 
                  style={{ minHeight: '60px', fontFamily: 'inherit', resize: 'vertical' }}
                  value={formData.notes} onChange={handleInputChange}
                  placeholder="e.g. Recently married. Keep details updated. Ask for coffee next week."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* CREATE PIPELINE CASE MODAL */}
      {isCaseModalOpen && caseContact && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)',
          backdropFilter: 'blur(8px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }} onClick={() => { setIsCaseModalOpen(false); setCaseContact(null); }}>
          <div 
            className="glass-panel animate-fade-in" 
            style={{ width: '100%', maxWidth: '540px', padding: '28px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}
            onClick={e => e.stopPropagation()}
          >
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>Create Sales Case for {caseContact.fullName}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                {!caseContact.portedClientId && "Note: This will automatically create a Client Profile in your core database as well."}
              </p>
            </div>

            <form onSubmit={handleCaseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Policy / Product Name *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={caseForm.policyName}
                  onChange={e => setCaseForm({ ...caseForm, policyName: e.target.value })}
                  required 
                  placeholder="e.g. AIA Guaranteed Protect Plus"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Policy Type</label>
                  <select 
                    className="input-field" 
                    style={{ background: 'var(--bg-base)' }}
                    value={caseForm.policyType}
                    onChange={e => setCaseForm({ ...caseForm, policyType: e.target.value })}
                  >
                    {POLICY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Initial Stage</label>
                  <select 
                    className="input-field" 
                    style={{ background: 'var(--bg-base)' }}
                    value={caseForm.stage}
                    onChange={e => setCaseForm({ ...caseForm, stage: e.target.value })}
                  >
                    {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Est. Annual Premium ($)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={caseForm.estimatedPremium}
                    onChange={e => setCaseForm({ ...caseForm, estimatedPremium: e.target.value })}
                    placeholder="e.g. 3000"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Est. FYC ($)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={caseForm.estimatedFYC}
                    onChange={e => setCaseForm({ ...caseForm, estimatedFYC: e.target.value })}
                    placeholder="e.g. 1200"
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Expected Close Date</label>
                <input 
                  type="date" 
                  className="input-field" 
                  style={{ color: 'var(--text-primary)' }}
                  value={caseForm.expectedCloseDate}
                  onChange={e => setCaseForm({ ...caseForm, expectedCloseDate: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Case Notes / Reminders</label>
                <textarea 
                  className="input-field" 
                  style={{ minHeight: '60px', fontFamily: 'inherit', resize: 'vertical' }}
                  value={caseForm.notes}
                  onChange={e => setCaseForm({ ...caseForm, notes: e.target.value })}
                  placeholder="e.g. Needs to submit medical report by end of month."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => { setIsCaseModalOpen(false); setCaseContact(null); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Sales Case'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* CUSTOM CONFIRMATION/ALERT MODAL */}
      {confirmConfig.isOpen && createPortal(
        <div 
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)',
            backdropFilter: 'blur(8px)', zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }} 
          onClick={() => !confirmConfig.isAlert && setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        >
          <div 
            className="glass-panel animate-fade-in" 
            style={{ width: '100%', maxWidth: '420px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--border-light)' }}
            onClick={e => e.stopPropagation()}
          >
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>{confirmConfig.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>{confirmConfig.message}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              {!confirmConfig.isAlert && (
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} 
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  {confirmConfig.cancelText || 'Cancel'}
                </button>
              )}
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={confirmConfig.onConfirm} 
                style={{ padding: '8px 16px', fontSize: '12px' }}
              >
                {confirmConfig.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
