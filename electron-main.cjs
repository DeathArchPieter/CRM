const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const http = require('http');

const isDev = !app.isPackaged;

const GEMINI_API_KEY = 'AIzaSyCQ5OFJzCD2sZQD10cMQRf1xzWLN1Q3ALc';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`;

let db = { clients: [], policies: [], pipeline: [], tasks: [], project100Contacts: [], initiatives: [], aiBriefing: { text: '', generatedAt: null } };
let dbPath;
let authServer = null;

function initDatabase() {
  const userDataPath = app.getPath('userData');
  dbPath = path.join(userDataPath, 'crm_data.json');
  
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      db = JSON.parse(data);
      // Ensure arrays exist
      if (!db.clients) db.clients = [];
      if (!db.policies) db.policies = [];
      if (!db.pipeline) db.pipeline = [];
      if (!db.tasks) db.tasks = [];
      if (!db.aiBriefing) db.aiBriefing = { text: '', generatedAt: null };
      if (!db.googleCalendarSettings) db.googleCalendarSettings = { clientId: '', clientSecret: '', tokens: null, email: '' };
      if (!db.project100Contacts) db.project100Contacts = [];
      if (!db.initiatives || db.initiatives.length === 0) {
        db.initiatives = [
          {
            id: 'p1',
            title: 'MDRT Acceleration 2026',
            description: 'Focused campaign to fast-track qualifying consultants for Million Dollar Round Table.',
            leader: 'Pieter Beetsma',
            status: 'In Progress',
            targetDate: '2026-12-31',
            members: 4,
            type: 'custom',
            milestones: [
              { id: 'p1-m1', label: 'Define customized target blueprints for qualifiers', completed: true },
              { id: 'p1-m2', label: 'Conduct weekly high-net-worth (HNW) masterclasses', completed: true },
              { id: 'p1-m3', label: 'Mid-year milestone reviews & pipeline gap analysis', completed: false },
              { id: 'p1-m4', label: 'Final sprints & premium closing events', completed: false }
            ]
          },
          {
            id: 'p2',
            title: 'Agency Recruitment Drive',
            description: 'Hiring drive aiming to bring on board 5 new high-caliber associate financial consultants.',
            leader: 'Jan Pang',
            status: 'In Progress',
            targetDate: '2026-09-30',
            members: 3,
            type: 'custom',
            milestones: [
              { id: 'p2-m1', label: 'Prepare branding decks & university outreach schedule', completed: true },
              { id: 'p2-m2', label: 'Conduct career preview webinars', completed: false },
              { id: 'p2-m3', label: 'First round interviews & profiling assessments', completed: false }
            ]
          },
          {
            id: 'p3',
            title: 'HNW Legacy Preservation Campaign',
            description: 'Special marketing push focusing on legacy index universal life products for business owners.',
            leader: 'Yap Pei Lin',
            status: 'Planning',
            targetDate: '2026-11-15',
            members: 2,
            type: 'custom',
            milestones: [
              { id: 'p3-m1', label: 'Identify target client list from current database', completed: false },
              { id: 'p3-m2', label: 'Create exclusive marketing brochure & estate planning booklets', completed: false },
              { id: 'p3-m3', label: 'Launch invitation-only legacy planning seminar', completed: false }
            ]
          }
        ];
        saveDatabase();
      }
    } else {
      saveDatabase();
    }
  } catch (err) {
    console.error("Failed to load database:", err);
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error("Failed to save database:", err);
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    frame: false, // Frameless window
    icon: path.join(__dirname, 'public', 'icon.png'),
    webPreferences: {
      nodeIntegration: false, // Secure best practice
      contextIsolation: true, // Secure best practice
      preload: path.join(__dirname, 'electron-preload.cjs'),
    },
    backgroundColor: '#0f172a', // Match our dark theme background
    show: false, // Don't show until ready-to-show
    autoHideMenuBar: true, // Hides the default File/Edit menu
  });

  // IPC Handlers for custom window controls
  ipcMain.on('window-minimize', () => {
    mainWindow.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on('window-close', () => {
    mainWindow.close();
  });

  // DB IPC Handlers
  // DB IPC Handlers (JSON Store)
  ipcMain.handle('get-clients', () => {
    try {
      // Sort alphabetically by full name
      const sortedClients = [...db.clients].sort((a, b) => 
        a.fullName.localeCompare(b.fullName)
      );
      return { success: true, data: sortedClients };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('add-client', (event, clientData) => {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      
      const newClient = {
        id,
        fullName: clientData.fullName || '',
        preferredName: clientData.preferredName || '',
        dob: clientData.dob || null,
        gender: clientData.gender || '',
        phone: clientData.phone || '',
        email: clientData.email || '',
        address: clientData.address || '',
        clientStatus: clientData.clientStatus || 'Active',
        notes: clientData.notes || '',
        createdAt: now,
        updatedAt: now
      };
      
      db.clients.push(newClient);
      saveDatabase();
      
      return { success: true, id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-policies', (event, clientId) => {
    try {
      const policies = db.policies.filter(p => p.clientId === clientId);
      return { success: true, data: policies };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('add-policy', (event, policyData) => {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      
      const newPolicy = {
        id,
        clientId: policyData.clientId,
        policyName: policyData.policyName || '',
        policyNumber: policyData.policyNumber || '',
        provider: policyData.provider || '',
        policyType: policyData.policyType || '',
        status: policyData.status || 'In Force',
        premiumAmount: Number(policyData.premiumAmount) || 0,
        premiumFrequency: policyData.premiumFrequency || 'Annually',
        coverages: policyData.coverages || {},
        inceptionDate: policyData.inceptionDate || null,
        notes: policyData.notes || '',
        createdAt: now,
        updatedAt: now
      };
      
      db.policies.push(newPolicy);
      saveDatabase();
      
      return { success: true, id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-client', (event, clientData) => {
    try {
      const index = db.clients.findIndex(c => c.id === clientData.id);
      if (index === -1) throw new Error("Client not found");
      
      db.clients[index] = {
        ...db.clients[index],
        ...clientData,
        aiInsights: null,
        aiInsightsGeneratedAt: null,
        updatedAt: new Date().toISOString()
      };
      saveDatabase();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-policy', (event, policyData) => {
    try {
      const index = db.policies.findIndex(p => p.id === policyData.id);
      if (index === -1) throw new Error("Policy not found");
      
      db.policies[index] = {
        ...db.policies[index],
        ...policyData,
        policyName: policyData.policyName || db.policies[index].policyName || '',
        premiumAmount: Number(policyData.premiumAmount) || 0,
        coverages: policyData.coverages || {},
        updatedAt: new Date().toISOString()
      };
      saveDatabase();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-policy', (event, policyId) => {
    try {
      const initialLength = db.policies.length;
      db.policies = db.policies.filter(p => p.id !== policyId);
      if (db.policies.length !== initialLength) {
        saveDatabase();
        return { success: true };
      }
      throw new Error("Policy not found");
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Project 100 IPC Handlers
  ipcMain.handle('get-project-100-contacts', () => {
    try {
      if (!db.project100Contacts) db.project100Contacts = [];
      return { success: true, data: db.project100Contacts };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('add-project-100-contact', (event, contactData) => {
    try {
      if (!db.project100Contacts) db.project100Contacts = [];
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const newContact = {
        id,
        fullName: contactData.fullName || '',
        phone: contactData.phone || '',
        email: contactData.email || '',
        category: contactData.category || 'Warm Acquaintance',
        scoreNeed: Number(contactData.scoreNeed) || 3,
        scoreAccessibility: Number(contactData.scoreAccessibility) || 3,
        scoreIncome: Number(contactData.scoreIncome) || 3,
        scoreTrust: Number(contactData.scoreTrust) || 3,
        stage: contactData.stage || 'Not Contacted',
        portedClientId: contactData.portedClientId || null,
        notes: contactData.notes || '',
        createdAt: now,
        updatedAt: now
      };
      db.project100Contacts.push(newContact);
      saveDatabase();
      return { success: true, id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-project-100-contact', (event, contactData) => {
    try {
      if (!db.project100Contacts) db.project100Contacts = [];
      const index = db.project100Contacts.findIndex(c => c.id === contactData.id);
      if (index === -1) throw new Error("Contact not found");
      db.project100Contacts[index] = {
        ...db.project100Contacts[index],
        ...contactData,
        scoreNeed: contactData.scoreNeed !== undefined ? Number(contactData.scoreNeed) : db.project100Contacts[index].scoreNeed,
        scoreAccessibility: contactData.scoreAccessibility !== undefined ? Number(contactData.scoreAccessibility) : db.project100Contacts[index].scoreAccessibility,
        scoreIncome: contactData.scoreIncome !== undefined ? Number(contactData.scoreIncome) : db.project100Contacts[index].scoreIncome,
        scoreTrust: contactData.scoreTrust !== undefined ? Number(contactData.scoreTrust) : db.project100Contacts[index].scoreTrust,
        updatedAt: new Date().toISOString()
      };
      saveDatabase();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-project-100-contact', (event, contactId) => {
    try {
      if (!db.project100Contacts) db.project100Contacts = [];
      db.project100Contacts = db.project100Contacts.filter(c => c.id !== contactId);
      saveDatabase();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Initiatives IPC Handlers
  ipcMain.handle('get-initiatives', () => {
    try {
      if (!db.initiatives) db.initiatives = [];
      return { success: true, data: db.initiatives };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('add-initiative', (event, initiativeData) => {
    try {
      if (!db.initiatives) db.initiatives = [];
      const id = initiativeData.id || `initiative-${crypto.randomUUID()}`;
      const now = new Date().toISOString();
      const newInitiative = {
        id,
        title: initiativeData.title || '',
        description: initiativeData.description || '',
        leader: initiativeData.leader || 'Pieter Beetsma',
        status: initiativeData.status || 'Planning',
        targetDate: initiativeData.targetDate || now.split('T')[0],
        members: Number(initiativeData.members) || 1,
        type: initiativeData.type || 'custom',
        milestones: initiativeData.milestones || [],
        productName: initiativeData.productName || null,
        targetAudience: initiativeData.targetAudience || null,
        contacts: initiativeData.contacts || [],
        createdAt: now,
        updatedAt: now
      };
      db.initiatives.push(newInitiative);
      saveDatabase();
      return { success: true, id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-initiative', (event, initiativeData) => {
    try {
      if (!db.initiatives) db.initiatives = [];
      const index = db.initiatives.findIndex(p => p.id === initiativeData.id);
      if (index === -1) throw new Error("Initiative not found");
      
      db.initiatives[index] = {
        ...db.initiatives[index],
        ...initiativeData,
        updatedAt: new Date().toISOString()
      };
      saveDatabase();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-initiative', (event, projectId) => {
    try {
      if (!db.initiatives) db.initiatives = [];
      db.initiatives = db.initiatives.filter(p => p.id !== projectId);
      saveDatabase();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Pipeline IPC Handlers
  ipcMain.handle('get-pipeline', () => {
    try {
      return { success: true, data: db.pipeline };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('add-pipeline-case', (event, caseData) => {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const newCase = {
        id,
        clientName: caseData.clientName || '',
        policyName: caseData.policyName || '',
        policyType: caseData.policyType || 'Life',
        estimatedPremium: Number(caseData.estimatedPremium) || 0,
        estimatedFYC: Number(caseData.estimatedFYC) || 0,
        expectedCloseDate: caseData.expectedCloseDate || null,
        stage: caseData.stage || 'Prospect',
        notes: caseData.notes || '',
        createdAt: now,
        updatedAt: now
      };
      db.pipeline.push(newCase);
      saveDatabase();
      return { success: true, id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-pipeline-case', (event, caseData) => {
    try {
      const index = db.pipeline.findIndex(c => c.id === caseData.id);
      if (index === -1) throw new Error('Case not found');
      db.pipeline[index] = {
        ...db.pipeline[index],
        ...caseData,
        estimatedPremium: Number(caseData.estimatedPremium) || 0,
        estimatedFYC: Number(caseData.estimatedFYC) || 0,
        updatedAt: new Date().toISOString()
      };
      saveDatabase();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-pipeline-case', (event, caseId) => {
    try {
      const initialLength = db.pipeline.length;
      db.pipeline = db.pipeline.filter(c => c.id !== caseId);
      if (db.pipeline.length !== initialLength) {
        saveDatabase();
        return { success: true };
      }
      throw new Error('Case not found');
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Tasks IPC Handlers
  ipcMain.handle('get-tasks', (event, clientId) => {
    try {
      const tasks = db.tasks.filter(t => t.clientId === clientId);
      return { success: true, data: tasks };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('add-task', async (event, taskData) => {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const newTask = {
        id,
        clientId: taskData.clientId,
        description: taskData.description || '',
        status: taskData.status || 'Pending', // Pending | Completed
        dueDate: taskData.dueDate || null,
        dueTime: taskData.dueTime || null,
        dueEndTime: taskData.dueEndTime || null,
        location: taskData.location || '',
        createdAt: now,
        updatedAt: now
      };
      db.tasks.push(newTask);
      saveDatabase();

      // Sync in background (non-blocking)
      if (db.googleCalendarSettings?.tokens) {
        syncTaskToGoogleCalendar(newTask).catch(err => {
          console.error('Background task sync failed:', err);
        });
      }

      return { success: true, id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-task', async (event, taskData) => {
    try {
      const index = db.tasks.findIndex(t => t.id === taskData.id);
      if (index === -1) throw new Error('Task not found');
      db.tasks[index] = {
        ...db.tasks[index],
        ...taskData,
        updatedAt: new Date().toISOString()
      };
      saveDatabase();

      // Sync in background (non-blocking)
      if (db.googleCalendarSettings?.tokens) {
        syncTaskToGoogleCalendar(db.tasks[index]).catch(err => {
          console.error('Background task sync failed:', err);
        });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-task', async (event, taskId) => {
    try {
      const taskIndex = db.tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) throw new Error('Task not found');
      
      const task = db.tasks[taskIndex];
      const googleEventId = task.googleEventId;

      db.tasks.splice(taskIndex, 1);
      saveDatabase();

      // Delete Google event in background (non-blocking)
      if (googleEventId && db.googleCalendarSettings?.tokens) {
        callGoogleCalendarAPI(`/calendars/primary/events/${googleEventId}`, {
          method: 'DELETE'
        }).catch(err => {
          console.error('Background event deletion failed:', err);
        });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Get ALL pending tasks across all clients (with client name joined)
  ipcMain.handle('get-all-tasks', () => {
    try {
      const pendingTasks = db.tasks
        .filter(t => t.status === 'Pending')
        .map(t => {
          const client = db.clients.find(c => c.id === t.clientId);
          return {
            ...t,
            clientName: client ? client.fullName : 'Unknown Client'
          };
        })
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      return { success: true, data: pendingTasks };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Gemini AI – Product Analyser
  ipcMain.handle('analyse-product', async (event, { productText, client }) => {
    try {
      if (!productText || productText.trim().length < 20) {
        return { success: false, error: 'Please paste a product description of at least 20 characters.' };
      }

      const clientSection = client
        ? `\nCLIENT PROFILE (generate the illustration specifically for this person):\nName: ${client.fullName}\nCurrent Age: ${client.age}\nGender: ${client.gender || 'Not specified'}\n`
        : '\nNo specific client selected — provide a generic product analysis with sample premiums for ages 25, 30, 35, 40, 45.\n';

      const systemInstruction = `You are an expert financial product analyst specialising in insurance and investment products. Your job is to analyse a product brochure or summary and return a precise, structured JSON analysis. You must respond ONLY with valid JSON — no markdown, no explanation, no code fences. If data is not available in the brochure, use null for that field rather than guessing.`;

      const userMessage = `Analyse the following insurance/financial product and return a JSON object matching this exact schema:

{
  "productName": "string",
  "insurer": "string",
  "productType": "one of: Whole Life | Term | Endowment | ILP | Critical Illness | Medical | Annuity | Other",
  "currency": "string (e.g. SGD, USD)",
  "summary": "2-3 sentence plain English overview of what this product does",
  "keyFeatures": ["string"],
  "premiumStructure": {
    "paymentTerm": "number of years as integer, or the string 'whole life', or the string 'single'",
    "frequency": "Monthly | Quarterly | Semi-Annually | Annually",
    "minEntryAge": number or null,
    "maxEntryAge": number or null,
    "clientEntryAge": number or null,
    "clientAnnualPremium": number or null,
    "samplePremiums": [{"entryAge": number, "annualPremium": number}]
  },
  "cashbacks": [
    {"year": number, "ageAtEvent": number or null, "description": "string", "amount": number or null, "percentOfAnnualPremium": number or null}
  ],
  "cashValue": [
    {"year": number, "age": number or null, "guaranteedCV": number, "nonGuaranteedCV": number or null}
  ],
  "coverages": [{"type": "string", "description": "string"}],
  "highlights": ["string — key selling points or advantages"],
  "considerations": ["string — things a client should be aware of or potential downsides"],
  "irrEstimate": "string describing estimated IRR or returns, or null",
  "dataNote": "string if any assumptions were made, or null"
}

Rules:
- If a client profile is provided, set clientEntryAge and clientAnnualPremium to that client's specific values derived from the brochure data.
- cashValue rows must use the client's entry age to calculate age column if a client is provided.
- All monetary values must be numbers (not strings).
- paymentTerm must be an integer (years) if it is a fixed term, otherwise the string 'whole life' or 'single'.
- Return ONLY the JSON object. No markdown, no explanation.
${clientSection}
PRODUCT BROCHURE / SUMMARY:
${productText.trim()}`;

      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: userMessage }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
            thinkingConfig: {
              thinkingLevel: 'MINIMAL'
            }
          }
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Gemini API ${response.status}: ${errBody}`);
      }

      const json = await response.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

      // Strip markdown fences if Gemini wraps despite instruction
      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      const analysis = JSON.parse(cleaned);

      return { success: true, data: analysis };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('analyse-card-statement', async (event, { pdfBase64 }) => {
    try {
      if (!pdfBase64) {
        return { success: false, error: 'No PDF statement data provided.' };
      }

      const systemInstruction = `You are an expert card statement parser with Google Search capability. Your task is to extract all transactions, cardholders, and outstanding summary details from the credit card statement PDF.
You must respond with ONLY the raw JSON object conforming strictly to the requested schema. Do not enclose it in markdown blocks (like \`\`\`json ... \`\`\`), do not include explanations, intro, or outro text.

CRITICAL TRANSACTION EXTRACTION & DE-DUPLICATION INSTRUCTIONS:
- Locate each individual cardholder's detail section in the statement PDF. The statement groups and lists transactions separately under each cardholder's name and card number, and prints a total spend for each cardholder.
- Extract transactions for each cardholder STRICTLY from their own specific details section in the PDF.
- NEVER extract transactions from any consolidated listing, overall account summary list, or "All Transactions" table at the beginning of the statement, as this will lead to double-counting.
- Ensure each transaction is extracted EXACTLY ONCE.
- For each cardholder, the sum of their individual transaction amounts MUST equal the total spend printed for that specific cardholder on the statement.

CRITICAL CATEGORIZATION & SEARCH INSTRUCTIONS:
- You have Google Search grounding enabled. For EVERY single transaction, if you are not 100% certain of the merchant's business type, you MUST perform a Google Search (e.g., "what is merchant name or company name") to find out exactly what they sell. Do NOT guess or default to 'Shopping' or 'Others'.
- Pay special attention to payment gateway prefixes like 'PAYPAL *', 'SP *', 'STRIPE *', 'AYDEN *', 'SQ *', 'SUMUP *', 'IZ *', 'MYBILL *', 'GPG *', etc. You MUST extract the actual merchant name after the prefix (e.g., in 'PAYPAL *SPOTIFY' the actual merchant is 'Spotify') and search/categorize based on that actual merchant.
- Avoid lumping transaction merchants into 'Shopping' or 'Others'. Break them down strictly according to the guidelines:
  1. Dining: Restaurants, fast food, coffee shops, cafes, bars, food delivery services (GrabFood, Foodpanda, Deliveroo), bakeries, food courts, and caterers.
  2. Travel: Airlines, hotels, lodging, travel agencies, booking sites (Agoda, Expedia, Booking.com), cruise lines, train tickets, ride sharing/taxis taken during travel (if overseas), and duty-free shops.
  3. Groceries: Supermarkets (NTUC FairPrice, Cold Storage, Giant, Sheng Siong, Don Don Donki), convenience stores (7-Eleven, Cheers), local market vendors, bakeries for home baking supplies, and organic food stores.
  4. Transport: Local public transit (MRT, bus, SimplyGo, TransitLink top-ups), local taxi/ride-hailing (Grab rides, Gojek, ComfortDelGro, Tada), and road tolls. Note: GrabFood belongs to Dining, NOT Transport; Grab rides belong to Transport.
  5. Shopping: Clothing, footwear, department stores (Takashimaya, Tangs, Isetan), retail goods, electronics (Apple Store, Challenger, Harvey Norman), online marketplaces (Lazada, Shopee, Amazon, Taobao, Qoo10) ONLY for physical goods/retail purchases.
  6. Others: Subscriptions (Netflix, Spotify, Amazon Prime, Disney+), utilities (SP Group, water/electricity bills, telecom bills like Singtel/StarHub/M1), insurance premiums, medical/dental bills, tuition/educational fees, club memberships, government payments, or anything else that doesn't fit the above.
- Make sure that double quotes inside string values are properly escaped (e.g., merchant names with double quotes must be \\"escaped\\").`;

      const userPrompt = `Extract the credit card statement details into a JSON object matching this schema:
{
  "statementPeriod": "string (e.g. 01 Jun 2026 - 22 Jun 2026)",
  "dueDate": "string (e.g. 15 Jul 2026)",
  "totalOutstanding": number,
  "minimumPayment": number,
  "cardholders": [
    {
      "id": "string",
      "name": "string",
      "cardNumber": "string (showing last 4 digits, e.g. xxxx-xxxx-xxxx-1234)",
      "role": "Main Cardholder | Supplementary Cardholder",
      "totalSpend": number,
      "transactionCount": number,
      "topCategory": "string",
      "categories": [
        {"name": "Dining | Shopping | Travel | Groceries | Transport | Others", "amount": number, "percentage": number, "color": "hex color code (e.g. Dining: #8b5cf6, Travel: #06b6d4, Groceries: #10b981, Shopping: #ec4899, Transport: #f59e0b, Others: #64748b)"}
      ],
      "transactions": [
        {"date": "string (YYYY-MM-DD)", "merchant": "string", "category": "Dining | Shopping | Travel | Groceries | Transport | Others", "amount": number}
      ]
    }
  ]
}

Categorization Guidelines:
- Dining: Restaurants, fast food, coffee shops, cafes, bars, food delivery services (GrabFood, Foodpanda, Deliveroo), bakeries, food courts, and caterers.
- Travel: Airlines, hotels, lodging, travel agencies, booking sites (Agoda, Expedia, Booking.com), cruise lines, train tickets, ride sharing/taxis taken during travel (if overseas), and duty-free shops.
- Groceries: Supermarkets (NTUC FairPrice, Cold Storage, Giant, Sheng Siong, Don Don Donki), convenience stores (7-Eleven, Cheers), local market vendors, bakeries for home baking supplies, and organic food stores.
- Transport: Local public transit (MRT, bus, SimplyGo, TransitLink top-ups), local taxi/ride-hailing (Grab rides, Gojek, ComfortDelGro, Tada), and road tolls. (Note: GrabFood is Dining, Grab rides are Transport).
- Shopping: Clothing, footwear, department stores (Takashimaya, Tangs, Isetan), retail goods, electronics (Apple Store, Challenger, Harvey Norman), online marketplaces (Lazada, Shopee, Amazon, Taobao, Qoo10) ONLY for physical goods/retail purchases.
- Others: Subscriptions (Netflix, Spotify, Amazon Prime, Disney+), utilities (SP Group, water/electricity bills, telecom bills like Singtel/StarHub/M1), insurance premiums, medical/dental bills, tuition/educational fees, club memberships, government payments, or anything else that doesn't fit the above.

Rules:
- Identify all cardholders listed in the statement (e.g. the main cardholder and any supplementary cardholders).
- CRITICAL: Locate each individual cardholder's detail section in the statement PDF. Group and extract transactions strictly from their designated section.
- CRITICAL: Do NOT extract transactions from any consolidated summary list at the start of the statement. This prevents double-counting and ensures supplementary card transactions are not duplicated under the main cardholder.
- CRITICAL: For each cardholder, verify that the sum of the extracted transaction amounts matches the printed total spend for that cardholder in the statement.
- Categorize each transaction precisely. Use Google Search to look up unfamiliar or abbreviated merchant names so they are not incorrectly lumped into 'Shopping' or 'Others'.
- Pay special attention to payment gateway prefixes like 'PAYPAL *', 'SP *', 'STRIPE *', etc., to extract the actual merchant name and search/categorize based on that.
- Calculate total spend, transaction count, and category distributions per cardholder.
- Respond with ONLY the raw JSON object. Do not include markdown code block wrappers.`;

      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: pdfBase64
                }
              },
              {
                text: userPrompt
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
            thinkingConfig: {
              thinkingLevel: 'MINIMAL'
            }
          },
          tools: [{ google_search: {} }]
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Gemini API ${response.status}: ${errBody}`);
      }

      const json = await response.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

      const logPath = path.join(app.getPath('userData'), 'gemini_card_analysis_log.txt');
      let logSummary = '';
      let cleaned = '';
      let analysis = null;
      try {
        cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
        analysis = JSON.parse(cleaned);
        
        logSummary += "=== CARD STATEMENT TRANSACTIONS LOG SUMMARY ===\n";
        logSummary += `Statement Period: ${analysis.statementPeriod || 'N/A'}\n`;
        logSummary += `Total Outstanding: $${analysis.totalOutstanding || 0}\n`;
        logSummary += `Due Date: ${analysis.dueDate || 'N/A'}\n\n`;
        
        (analysis.cardholders || []).forEach(ch => {
          logSummary += `Cardholder: ${ch.name} (${ch.cardNumber || 'N/A'}) - Role: ${ch.role || 'N/A'}\n`;
          logSummary += `  Reported Total Spend: $${ch.totalSpend || 0} (${ch.transactionCount || 0} transactions)\n`;
          const actualSum = (ch.transactions || []).reduce((s, tx) => s + (tx.amount || 0), 0);
          logSummary += `  Sum of Extracted Transactions: $${actualSum.toFixed(2)}\n`;
          logSummary += "  Extracted Transactions:\n";
          (ch.transactions || []).forEach((tx, idx) => {
            logSummary += `    [${idx + 1}] Date: ${tx.date || 'N/A'} | Merchant: ${tx.merchant || 'N/A'} | Category: ${tx.category || 'N/A'} | Amount: $${(tx.amount || 0).toFixed(2)}\n`;
          });
          logSummary += "\n";
        });
      } catch (e) {
        logSummary = `=== ANALYSIS PARSE ERROR IN LOG GENERATION ===\nError: ${e.message}\n\n`;
      }

      try {
        fs.writeFileSync(logPath, `${logSummary}\n\n=======================\nFULL RESPONSE API JSON:\n=======================\n${JSON.stringify(json, null, 2)}\n\nRaw Text Returned by Gemini:\n${rawText}`);
      } catch (fsErr) {
        console.error("Failed to write success log:", fsErr);
      }

      try {
        if (!analysis) {
          throw new Error("JSON parsing failed.");
        }
        return { success: true, data: analysis, logPath };
      } catch (jsonError) {
        console.error("Failed to parse JSON from Gemini:", jsonError);
        const errLogPath = path.join(app.getPath('userData'), 'gemini_card_error_log.txt');
        try {
          fs.writeFileSync(errLogPath, `JSON Parse Error: ${jsonError.message}\n\nFull Response API JSON:\n${JSON.stringify(json, null, 2)}\n\nRaw Text:\n${rawText}\n\nCleaned Text:\n${cleaned}`);
          return { success: false, error: `JSON Parse Error: ${jsonError.message}. Details logged to ${errLogPath}` };
        } catch (fsErr) {
          return { success: false, error: `JSON Parse Error: ${jsonError.message}. Raw output: ${rawText.slice(0, 300)}...` };
        }
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Gemini AI Daily Briefing
  ipcMain.handle('get-ai-briefing', async (event, forceRefresh = false) => {
    try {
      // Check if we have a valid cached briefing from today
      const cachedText = db.aiBriefing?.text || '';
      const isCachedValid = cachedText.length > 100 && /[.!?]"?$/.test(cachedText.trim());

      if (!forceRefresh && isCachedValid && db.aiBriefing.generatedAt) {
        const generatedDate = new Date(db.aiBriefing.generatedAt).toDateString();
        const today = new Date().toDateString();
        if (generatedDate === today) {
          return { success: true, data: db.aiBriefing.text, cached: true };
        }
      }

      // Build CRM context for Gemini
      const activePipeline = db.pipeline.filter(c => c.stage !== 'Closed/Lost');
      const pendingTasks = db.tasks.filter(t => t.status === 'Pending');
      const overdueCases = activePipeline.filter(c => {
        if (!c.expectedCloseDate) return false;
        return new Date(c.expectedCloseDate) < new Date();
      });
      const issuedThisMonth = db.pipeline.filter(c => {
        if (c.stage !== 'Case Issued') return false;
        const d = new Date(c.updatedAt);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const totalFYC = activePipeline.reduce((s, c) => s + (Number(c.estimatedFYC) || 0), 0);

      const stageBreakdown = ['Prospect','Fact Finding','Proposal Sent','Case Submitted','Case Issued']
        .map(s => `${s}: ${db.pipeline.filter(c => c.stage === s).length} cases`)
        .join(', ');

      const taskList = pendingTasks.slice(0, 8).map(t => {
        const client = db.clients.find(c => c.id === t.clientId);
        return `- [${client ? client.fullName : 'Unknown'}] ${t.description}`;
      }).join('\n');

      const systemInstruction = `You are the Agency Leader and Sales Manager for Beetsma Consultancy, a financial consulting practice. Your consultant looks to you every morning for direction, motivation, and clear priorities for the day. You know their business intimately — their pipeline, their clients, their pending tasks, and their targets.

Your tone is direct, warm, and encouraging — like a seasoned mentor who genuinely wants them to win. You speak in first-person as their leader (e.g. "I want you to...", "Your focus today should be...", "Let's push..."). You give specific, actionable direction based on the actual data in front of you. You write in flowing prose — no bullet points, no lists. Keep it to 3-4 sentences maximum.`;

      const userMessage = `Here is the CRM snapshot for today, ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Give me my direction for the day.

CLIENTS: ${db.clients.length} total (${db.clients.filter(c => c.clientStatus === 'Active').length} active, ${db.clients.filter(c => c.clientStatus === 'Prospect').length} prospects)
PIPELINE: ${activePipeline.length} active cases | $${totalFYC.toLocaleString()} estimated FYC
STAGES: ${stageBreakdown}
ISSUED THIS MONTH: ${issuedThisMonth.length} cases
OVERDUE: ${overdueCases.length} cases past close date${overdueCases.length > 0 ? ' (' + overdueCases.map(c => c.clientName).join(', ') + ')' : ''}
PENDING TASKS: ${pendingTasks.length}${pendingTasks.length > 0 ? '\n' + taskList : ''}`;

      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: userMessage }] }],
          generationConfig: {
            temperature: 0.85,
            maxOutputTokens: 4096,
            thinkingConfig: {
              thinkingLevel: 'MINIMAL'
            }
          }
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Gemini API ${response.status}: ${errBody}`);
      }

      const json = await response.json();
      const parts = json.candidates?.[0]?.content?.parts || [];
      const text = parts.map(p => p.text || '').join('').trim() || 'Unable to generate briefing.';

      // Cache the result
      db.aiBriefing = { text, generatedAt: new Date().toISOString() };
      saveDatabase();

      return { success: true, data: text, cached: false };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Gemini AI Client Insights
  ipcMain.handle('get-client-ai-insights', async (event, clientId, forceRefresh = false) => {
    try {
      const clientIndex = db.clients.findIndex(c => c.id === clientId);
      if (clientIndex === -1) throw new Error("Client not found");
      const client = db.clients[clientIndex];

      // Check if we have cached insights
      if (!forceRefresh && client.aiInsights && client.aiInsightsGeneratedAt) {
        return { success: true, data: client.aiInsights, cached: true };
      }

      // Gather policies, tasks, and pipeline cases for context
      const clientPolicies = db.policies.filter(p => p.clientId === clientId);
      const clientTasks = db.tasks.filter(t => t.clientId === clientId);
      
      // Pipeline cases are matched by name
      const clientPipeline = db.pipeline.filter(c => {
        const cName = (c.clientName || '').toLowerCase().trim();
        const fName = (client.fullName || '').toLowerCase().trim();
        const pName = (client.preferredName || '').toLowerCase().trim();
        return cName === fName || (pName && cName === pName);
      });

      // Calculate age
      let ageText = 'Not specified';
      if (client.dob) {
        const birth = new Date(client.dob);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        ageText = `${age} years old`;
      }

      const systemInstruction = `You are a premier financial consultancy mentor and sales assistant at Beetsma Consultancy. Your role is to analyze a client's profile, existing policy portfolio, active sales pipeline cases, and pending tasks, and write custom, strategic advisor thoughts for the consultant.
Focus on:
1. Gaps in coverage (e.g. if they have no Critical Illness cover, high premiums but low coverage, etc.).
2. Next steps based on pending tasks and active pipeline status.
3. Personal context or relationship advice based on the user's personal remarks/notes.
Provide your response in a warm, analytical, and professional tone. Keep it to 3-4 bullet points (max 150 words total). Use formatting like bold text for key recommendations. Do not use markdown headers or code blocks.`;

      const userMessage = `Here is the client's data:
- Name: ${client.fullName} ${client.preferredName ? `(Preferred: ${client.preferredName})` : ''}
- Age / DOB: ${ageText}
- Status: ${client.clientStatus}
- User's Personal Remarks: ${client.notes || 'None recorded yet.'}

POLICIES IN PORTFOLIO:
${clientPolicies.map(p => `- ${p.policyName} (${p.policyType}) by ${p.provider}: Premium ${p.premiumAmount} ${p.premiumFrequency}, Status: ${p.status}, Coverages: ${JSON.stringify(p.coverages)}`).join('\n') || 'No policies active.'}

ACTIVE SALES PIPELINE:
${clientPipeline.map(c => `- ${c.policyName} (${c.policyType}): Stage: ${c.stage}, Est. Premium: $${c.estimatedPremium}, Est. FYC: $${c.estimatedFYC}`).join('\n') || 'No pipeline cases active.'}

PENDING TASKS:
${clientTasks.filter(t => t.status === 'Pending').map(t => `- ${t.description}`).join('\n') || 'No pending tasks.'}

Please analyze this client and provide your strategic thoughts.`;

      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: userMessage }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            thinkingConfig: {
              thinkingLevel: 'MINIMAL'
            }
          }
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Gemini API ${response.status}: ${errBody}`);
      }

      const json = await response.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate client insights.';

      // Cache the result in the client object
      db.clients[clientIndex] = {
        ...client,
        aiInsights: text,
        aiInsightsGeneratedAt: new Date().toISOString()
      };
      saveDatabase();

      return { success: true, data: text, cached: false };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('generate-outreach-playbook', async (event, payload) => {
    try {
      let productInfo = '';
      let fileData = null;

      if (typeof payload === 'string') {
        productInfo = payload;
      } else if (payload && typeof payload === 'object') {
        productInfo = payload.text || '';
        fileData = payload.fileData || null;
      }

      if ((!productInfo || !productInfo.trim()) && !fileData) {
        throw new Error("No product information or file provided");
      }

      const systemInstruction = `You are a premier financial consultancy AI at Beetsma Consultancy. Your role is to analyze a product brochure or description and generate an actionable marketing playbook for a WhatsApp outreach campaign.
You must return your response as a valid, single JSON object. Do not include markdown code block formatting (like \`\`\`json) or other conversational preamble.
The JSON structure MUST be exactly:
{
  "productFocus": "A short, clean name of the product focus determined from the text (e.g. AIA Protect 3)",
  "targetAudience": "A short description of the primary audience focus determined from the text (e.g. Young Parents & Families)",
  "segments": [
    {
      "name": "Segment Name (e.g. Young Parents (25-40))",
      "hook": "Key hook point (e.g. CI gap filling)",
      "why": "Brief explanation of why this segment fits this product"
    }
  ],
  "scripts": [
    {
      "step": 1,
      "title": "Step 1: Title (e.g. Soft Opener)",
      "goal": "Brief goal of this step",
      "timeHint": "Best time to send",
      "templateContent": "The message template. Use the exact literal text '[Client Name]' where the client's name should be substituted."
    },
    {
      "step": 2,
      "title": "Step 2: Title (e.g. Value Drop)",
      "goal": "Brief goal of this step",
      "timeHint": "Best time to send",
      "templateContent": "The follow-up template. You may use '[Client Name]' if natural, or write it as a direct message body."
    },
    {
      "step": 3,
      "title": "Step 3: Title (e.g. Appointment Close)",
      "goal": "Brief goal of this step",
      "timeHint": "Best time to send",
      "templateContent": "The call-to-action template to book a short sync."
    }
  ],
  "routines": [
    {
      "time": "09:00 AM - 09:30 AM",
      "task": "Morning batch outreach",
      "desc": "Short task description"
    },
    {
      "time": "12:00 PM - 12:30 PM",
      "task": "Mid-day check",
      "desc": "Short task description"
    },
    {
      "time": "05:00 PM - 05:30 PM",
      "task": "Evening follow-up",
      "desc": "Short task description"
    }
  ]
}
Make sure you generate exactly 3 segments, 3 script steps, and 3 routines. The scripts must be highly tailored to the specific product provided.`;

      const parts = [];
      if (fileData && fileData.base64) {
        parts.push({
          inlineData: {
            mimeType: fileData.mimeType,
            data: fileData.base64
          }
        });
      }

      let promptText = `Generate the outreach playbook JSON based on the provided product documents or details.`;
      if (productInfo && productInfo.trim()) {
        promptText += `\n\nHere is the additional product summary/description:\n${productInfo}`;
      }
      parts.push({ text: promptText });

      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: parts }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Gemini API ${response.status}: ${errBody}`);
      }

      const json = await response.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const playbook = JSON.parse(text.trim());
      
      if (!playbook.segments || !playbook.scripts || !playbook.routines) {
        throw new Error("Generated playbook is missing required fields (segments, scripts, routines)");
      }

      return { success: true, data: playbook };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-google-settings', () => {
    return {
      success: true,
      data: {
        clientId: db.googleCalendarSettings?.clientId || '',
        clientSecret: db.googleCalendarSettings?.clientSecret || '',
        email: db.googleCalendarSettings?.email || '',
        connected: !!db.googleCalendarSettings?.tokens
      }
    };
  });

  ipcMain.handle('disconnect-google-calendar', () => {
    db.googleCalendarSettings = db.googleCalendarSettings || {};
    db.googleCalendarSettings.tokens = null;
    db.googleCalendarSettings.email = '';
    saveDatabase();
    return { success: true };
  });

  ipcMain.handle('open-path', async (event, pathString) => {
    try {
      await shell.openPath(pathString);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('start-google-oauth', (event, { clientId, clientSecret }) => {
    return new Promise((resolve) => {
      db.googleCalendarSettings = db.googleCalendarSettings || {};
      db.googleCalendarSettings.clientId = clientId;
      db.googleCalendarSettings.clientSecret = clientSecret;
      saveDatabase();

      const PORT = 18430;
      const redirectUri = `http://localhost:${PORT}/auth-callback`;

      if (authServer) {
        try { authServer.close(); } catch(e){}
      }

      authServer = http.createServer(async (req, res) => {
        try {
          const urlObj = new URL(req.url, `http://${req.headers.host}`);
          if (urlObj.pathname === '/auth-callback') {
            const code = urlObj.searchParams.get('code');
            if (code) {
              const tokenRes = await exchangeCodeForTokens(clientId, clientSecret, code, redirectUri);
              if (tokenRes.success) {
                // Check if calendar scope was actually granted by the user
                const grantedScope = tokenRes.tokens.scope || '';
                if (!grantedScope.includes('https://www.googleapis.com/auth/calendar')) {
                  res.writeHead(400, { 'Content-Type': 'text/html' });
                  res.end('<h1>Authentication incomplete</h1><p>Google Calendar permissions were not granted. Please go back, authenticate again, and make sure to tick the checkbox to allow calendar access.</p>');
                  resolve({ success: false, error: 'Calendar access permission was not granted. Please re-authenticate and tick the calendar permission box.' });
                  authServer.close();
                  authServer = null;
                  return;
                }

                db.googleCalendarSettings.tokens = tokenRes.tokens;
                const userinfo = await fetchUserInfo(tokenRes.tokens.access_token);
                if (userinfo.success) {
                  db.googleCalendarSettings.email = userinfo.email;
                }
                saveDatabase();
                
                // Trigger a background sync of all active tasks to Google Calendar
                (async () => {
                  try {
                    for (const task of db.tasks) {
                      if (task.dueDate && (!task.googleEventId || task.status === 'Pending')) {
                        await syncTaskToGoogleCalendar(task);
                      }
                    }
                  } catch (syncErr) {
                    console.error('Initial bulk sync after OAuth failed:', syncErr);
                  }
                })();

                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end('<h1>Authentication successful!</h1><p>You can close this tab and return to the CRM app.</p>');
                resolve({ success: true, email: db.googleCalendarSettings.email });
              } else {
                res.writeHead(400, { 'Content-Type': 'text/html' });
                res.end(`<h1>Authentication failed</h1><p>${tokenRes.error}</p>`);
                resolve({ success: false, error: tokenRes.error });
              }
            } else {
              res.writeHead(400, { 'Content-Type': 'text/html' });
              res.end('<h1>Authentication code not found</h1>');
              resolve({ success: false, error: 'Code not found' });
            }
            authServer.close();
            authServer = null;
          } else {
            res.writeHead(404);
            res.end();
          }
        } catch(err) {
          res.writeHead(500);
          res.end(err.message);
          resolve({ success: false, error: err.message });
        }
      });

      authServer.listen(PORT, () => {
        const scopes = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email';
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent`;
        shell.openExternal(authUrl);
      });
    });
  });

  ipcMain.handle('get-google-events', async (event, { timeMin, timeMax }) => {
    try {
      const response = await callGoogleCalendarAPI(`/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=250`);
      if (!response.ok) {
        const text = await response.statusText;
        throw new Error(`Google Calendar API error: ${response.status} ${text}`);
      }
      const data = await response.json();
      return { success: true, events: data.items || [] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('create-google-event', async (event, { eventData }) => {
    try {
      const response = await callGoogleCalendarAPI('/calendars/primary/events', {
        method: 'POST',
        body: JSON.stringify(eventData)
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Google Calendar API error: ${response.status} ${text}`);
      }
      const data = await response.json();
      return { success: true, event: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-google-event', async (event, { eventId, patchData }) => {
    try {
      const response = await callGoogleCalendarAPI(`/calendars/primary/events/${eventId}`, {
        method: 'PATCH',
        body: JSON.stringify(patchData)
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Google Calendar API error: ${response.status} ${text}`);
      }
      const data = await response.json();
      return { success: true, event: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-google-event', async (event, { eventId }) => {
    try {
      const response = await callGoogleCalendarAPI(`/calendars/primary/events/${eventId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Google Calendar API error: ${response.status} ${text}`);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-calendar-tasks', () => {
    try {
      const allTasks = db.tasks.map(t => {
        const client = db.clients.find(c => c.id === t.clientId);
        return {
          ...t,
          clientName: client ? client.fullName : 'Unknown Client'
        };
      });
      return { success: true, data: allTasks };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('sync-all-tasks', async () => {
    try {
      const settings = db.googleCalendarSettings;
      if (!settings || !settings.tokens) {
        return { success: false, error: 'Not authenticated' };
      }
      
      let syncCount = 0;
      const errors = [];
      for (const task of db.tasks) {
        if (task.dueDate) {
          if (!task.googleEventId || task.status === 'Pending') {
            const res = await syncTaskToGoogleCalendar(task);
            if (res.success) {
              syncCount++;
            } else {
              errors.push(`Task "${task.description}": ${res.error}`);
            }
          }
        }
      }
      if (errors.length > 0) {
        return { success: false, error: `Sync completed with errors:\n${errors.join('\n')}` };
      }
      return { success: true, syncCount };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  if (isDev) {
    // In development, load from Vite dev server
    mainWindow.loadURL('http://localhost:18429');
    // mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built React app
    mainWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // Run a startup background sync if connected (after 5 seconds delay)
  if (db.googleCalendarSettings?.tokens) {
    setTimeout(async () => {
      try {
        console.log('Running startup Google Calendar sync...');
        for (const task of db.tasks) {
          if (task.dueDate && (!task.googleEventId || task.status === 'Pending')) {
            await syncTaskToGoogleCalendar(task);
          }
        }
        console.log('Startup Google Calendar sync completed.');
      } catch (err) {
        console.error('Startup Google Calendar sync failed:', err);
      }
    }, 5000);
  }
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

async function exchangeCodeForTokens(clientId, clientSecret, code, redirectUri) {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Token exchange failed: ${text}`);
    }
    const tokens = await response.json();
    return { success: true, tokens };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function fetchUserInfo(accessToken) {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!response.ok) throw new Error('Failed to fetch userinfo');
    const data = await response.json();
    return { success: true, email: data.email };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function refreshAccessToken(clientId, clientSecret, refreshToken) {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Token refresh failed: ${text}`);
    }
    const data = await response.json();
    return { success: true, accessToken: data.access_token, expiresIn: data.expires_in };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function callGoogleCalendarAPI(endpoint, options = {}) {
  const settings = db.googleCalendarSettings;
  if (!settings || !settings.tokens) {
    throw new Error('Google Calendar is not authenticated');
  }

  let accessToken = settings.tokens.access_token;
  const baseUrl = 'https://www.googleapis.com/calendar/v3';
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  const makeRequest = async (token) => {
    const headers = {
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {})
    };
    const reqOptions = {
      ...options,
      headers
    };
    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    return await fetch(url, reqOptions);
  };

  let response = await makeRequest(accessToken);

  if (response.status === 401) {
    if (settings.tokens.refresh_token) {
      const refreshRes = await refreshAccessToken(settings.clientId, settings.clientSecret, settings.tokens.refresh_token);
      if (refreshRes.success) {
        settings.tokens.access_token = refreshRes.accessToken;
        saveDatabase();
        accessToken = refreshRes.accessToken;
        response = await makeRequest(accessToken);
      } else {
        throw new Error(`Google authorization expired: ${refreshRes.error}`);
      }
    } else {
      throw new Error('Google authorization expired (no refresh token available)');
    }
  }

  return response;
}

async function syncTaskToGoogleCalendar(task) {
  const settings = db.googleCalendarSettings;
  if (!settings || !settings.tokens) {
    return { success: false, error: 'Google Calendar not connected' };
  }

  // If there's no due date, we can't show it on a calendar
  if (!task.dueDate) {
    // If it was previously synced, we should delete it
    if (task.googleEventId) {
      try {
        const res = await callGoogleCalendarAPI(`/calendars/primary/events/${task.googleEventId}`, {
          method: 'DELETE'
        });
        if (res.ok || res.status === 404) {
          task.googleEventId = null;
          saveDatabase();
          return { success: true };
        } else {
          const errText = await res.text();
          return { success: false, error: errText };
        }
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: true };
  }

  // Prepare event data
  const client = db.clients.find(c => c.id === task.clientId);
  const clientName = client ? client.fullName : 'Unknown Client';
  const prefix = task.status === 'Completed' ? '✓ ' : '';
  const summary = `${prefix}CRM Task: ${task.description} (${clientName})`;
  const description = `Linked to CRM Client: ${clientName}\nStatus: ${task.status}\nCreated: ${new Date(task.createdAt).toLocaleString()}`;
  
  // Handle start and end times
  let start, end;
  const systemTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  
  if (task.dueTime) {
    // Timed event
    const startDateTime = new Date(`${task.dueDate}T${task.dueTime}:00`).toISOString();
    let endDateTime;
    if (task.dueEndTime) {
      endDateTime = new Date(`${task.dueDate}T${task.dueEndTime}:00`).toISOString();
    } else {
      // Default to 1 hour duration
      endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString();
    }
    start = { dateTime: startDateTime, timeZone: systemTz };
    end = { dateTime: endDateTime, timeZone: systemTz };
  } else {
    // All-day event
    start = { date: task.dueDate };
    const nextDay = new Date(task.dueDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().split('T')[0];
    end = { date: nextDayStr };
  }

  const eventData = {
    summary,
    description,
    location: task.location || '',
    start,
    end,
    colorId: '3', // Set to Grape (violet) to match Beetsma Consultancy branding
    reminders: {
      useDefault: true
    }
  };

  try {
    if (task.googleEventId) {
      // Update existing event
      const res = await callGoogleCalendarAPI(`/calendars/primary/events/${task.googleEventId}`, {
        method: 'PUT',
        body: JSON.stringify(eventData)
      });
      if (res.ok) {
        return { success: true };
      } else if (res.status === 404) {
        task.googleEventId = null;
        return await syncTaskToGoogleCalendar(task);
      } else {
        const errText = await res.text();
        return { success: false, error: errText };
      }
    } else {
      // Create new event
      const res = await callGoogleCalendarAPI('/calendars/primary/events', {
        method: 'POST',
        body: JSON.stringify(eventData)
      });
      if (res.ok) {
        const data = await res.json();
        task.googleEventId = data.id;
        saveDatabase();
        return { success: true };
      } else {
        const errText = await res.text();
        return { success: false, error: errText };
      }
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}
