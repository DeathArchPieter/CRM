const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const isDev = !app.isPackaged;

const GEMINI_API_KEY = 'AIzaSyCQ5OFJzCD2sZQD10cMQRf1xzWLN1Q3ALc';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`;

let db = { clients: [], policies: [], pipeline: [], tasks: [], aiBriefing: { text: '', generatedAt: null } };
let dbPath;

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

  ipcMain.handle('add-task', (event, taskData) => {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const newTask = {
        id,
        clientId: taskData.clientId,
        description: taskData.description || '',
        status: taskData.status || 'Pending', // Pending | Completed
        createdAt: now,
        updatedAt: now
      };
      db.tasks.push(newTask);
      saveDatabase();
      return { success: true, id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-task', (event, taskData) => {
    try {
      const index = db.tasks.findIndex(t => t.id === taskData.id);
      if (index === -1) throw new Error('Task not found');
      db.tasks[index] = {
        ...db.tasks[index],
        ...taskData,
        updatedAt: new Date().toISOString()
      };
      saveDatabase();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-task', (event, taskId) => {
    try {
      const initialLength = db.tasks.length;
      db.tasks = db.tasks.filter(t => t.id !== taskId);
      if (db.tasks.length !== initialLength) {
        saveDatabase();
        return { success: true };
      }
      throw new Error('Task not found');
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
            responseMimeType: 'application/json'
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

  // Gemini AI Daily Briefing
  ipcMain.handle('get-ai-briefing', async (event, forceRefresh = false) => {
    try {
      // Check if we have a valid cached briefing from today
      if (!forceRefresh && db.aiBriefing.text && db.aiBriefing.generatedAt) {
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
          generationConfig: { temperature: 0.85, maxOutputTokens: 4096 }
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Gemini API ${response.status}: ${errBody}`);
      }

      const json = await response.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate briefing.';

      // Cache the result
      db.aiBriefing = { text, generatedAt: new Date().toISOString() };
      saveDatabase();

      return { success: true, data: text, cached: false };
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
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
