const path = require('path');
const fs = require('fs');

// Robust .env discovery across development & packaged Electron builds
try {
  const possibleEnvPaths = [
    path.join(__dirname, '.env'),
    path.join(process.cwd(), '.env'),
    ...(process.resourcesPath ? [path.join(process.resourcesPath, '.env'), path.join(process.resourcesPath, 'app.asar', '.env')] : [])
  ];
  let loadedEnv = false;
  for (const p of possibleEnvPaths) {
    if (fs.existsSync(p)) {
      require('dotenv').config({ path: p });
      loadedEnv = true;
      break;
    }
  }
  if (!loadedEnv) {
    require('dotenv').config();
  }
} catch (_) {
  require('dotenv').config();
}

const { app, BrowserWindow, ipcMain, shell, session, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const crypto = require('crypto');
const http = require('http');

const isDev = !app.isPackaged;

let mainWindow = null;
let updateStatus = {
  status: 'idle', // 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
  info: null,
  progress: null,
  error: null
};

function sendUpdateStatus(statusObj) {
  updateStatus = { ...updateStatus, ...statusObj };
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('app-update-status', updateStatus);
  }
}

function initAutoUpdater() {
  autoUpdater.autoDownload = true; // Seamless inline background download
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    writeToLogFile('[AutoUpdater] Checking for updates on GitHub Releases...');
    sendUpdateStatus({ status: 'checking', error: null });
  });

  autoUpdater.on('update-available', (info) => {
    writeToLogFile(`[AutoUpdater] Update available: v${info.version} (current: v${app.getVersion()})`);
    sendUpdateStatus({ 
      status: 'available', 
      info: {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : (Array.isArray(info.releaseNotes) ? info.releaseNotes.map(n => n.note).join('\n') : '')
      },
      error: null 
    });
  });

  autoUpdater.on('update-not-available', (info) => {
    writeToLogFile(`[AutoUpdater] Update not available. Current v${app.getVersion()} is the latest.`);
    sendUpdateStatus({ 
      status: 'not-available', 
      info: { version: app.getVersion() },
      error: null 
    });
  });

  autoUpdater.on('download-progress', (progressObj) => {
    sendUpdateStatus({ 
      status: 'downloading', 
      progress: {
        percent: progressObj.percent,
        bytesPerSecond: progressObj.bytesPerSecond,
        transferred: progressObj.transferred,
        total: progressObj.total
      }
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    writeToLogFile(`[AutoUpdater] Update downloaded: v${info.version}. Ready to restart and install.`);
    sendUpdateStatus({ 
      status: 'downloaded', 
      info: { version: info.version },
      error: null 
    });
  });

  autoUpdater.on('error', (err) => {
    writeToLogFile(`[AutoUpdater] Update error: ${err.message}`);
    sendUpdateStatus({ 
      status: 'error', 
      error: err.message 
    });
  });
}

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

function getGeminiApiKey() {
  // Priority 1: User-configured API key in app settings / database
  if (db.appSettings?.geminiApiKey && typeof db.appSettings.geminiApiKey === 'string' && db.appSettings.geminiApiKey.trim()) {
    return db.appSettings.geminiApiKey.trim();
  }
  // Priority 2: Process environment variable from .env
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    return process.env.GEMINI_API_KEY.trim();
  }
  return '';
}

function getGeminiModel() {
  return db.appSettings?.geminiModel || DEFAULT_GEMINI_MODEL;
}

function getGeminiUrl() {
  const apiKey = getGeminiApiKey();
  const model = getGeminiModel();
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
}

let db = { clients: [], policies: [], claims: [], pipeline: [], tasks: [], project100Contacts: [], initiatives: [], aiBriefing: { text: '', generatedAt: null } };
let dbPath;
let logPath;
let authServer = null;

function writeToLogFile(message) {
  try {
    if (!logPath) {
      // If called before app ready/userData is available
      try {
        const userDataPath = app.getPath('userData');
        logPath = path.join(userDataPath, 'app.log');
      } catch (e) {
        // App might not be ready yet
        return;
      }
    }
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(logPath, formatted, 'utf8');
  } catch (err) {
    console.error("Failed to write to log file:", err);
  }
}


function initDatabase() {
  const userDataPath = app.getPath('userData');
  dbPath = path.join(userDataPath, 'crm_data.json');
  logPath = path.join(userDataPath, 'app.log');
  
  writeToLogFile("--- App Startup / initDatabase started ---");
  
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      db = JSON.parse(data);
      // Ensure arrays exist
      if (!db.clients) db.clients = [];
      if (!db.policies) db.policies = [];
      if (!db.claims) db.claims = [];
      if (!db.pipeline) db.pipeline = [];
      if (!db.tasks) db.tasks = [];
      if (!db.aiBriefing) db.aiBriefing = { text: '', generatedAt: null };
      if (!db.googleCalendarSettings) db.googleCalendarSettings = { clientId: '', clientSecret: '', tokens: null, email: '' };
      if (!db.project100Contacts) db.project100Contacts = [];
      if (!db.appSettings) {
        db.appSettings = {
          consultantName: 'Pieter Beetsma',
          consultantTitle: 'Senior Financial Consultant',
          repNumber: 'MAS Rep: PB-892415',
          email: 'pieter@beetsma.sg',
          phone: '+65 9123 4567',
          officeAddress: '1 Marina Boulevard, Singapore 018989',
          credentials: ['CFP®', 'ChFC®', 'AEPP®'],
          reportHeaderBranding: 'FINANCIAL ADVISORY BLUEPRINT',
          reportSubtitle: '',
          defaultCurrency: 'SGD ($)',
          defaultInflationRate: 3.0,
          defaultPreRetireReturn: 6.5,
          defaultPostRetireReturn: 4.5,
          defaultLifeExpectancy: 88,
          defaultRetirementAge: 62
        };
      }
      if (db.claims.length === 0 && db.clients.length > 0) {
        const targetClient = db.clients.find(c => c.fullName === 'Yap Pei Lin') || db.clients[0];
        const targetPolicy = targetClient ? db.policies.find(p => p.clientId === targetClient.id) : null;
        if (targetClient && targetPolicy) {
          db.claims = [
            {
              id: 'clm-seed-01',
              clientId: targetClient.id,
              policyId: targetPolicy.id,
              claimNumber: 'AIA-CLM-2026-8942',
              claimType: 'Hospitalisation / Shield',
              title: 'Knee Arthroscopy & Meniscus Repair',
              incidentDate: '2026-06-10',
              admissionDate: '2026-06-18',
              dischargeDate: '2026-06-19',
              hospitalOrClinic: 'Mount Elizabeth Novena Hospital',
              doctorName: 'Dr. Keith Tan (Orthopaedic Surgeon)',
              status: 'Approved',
              totalIncurredAmount: 15000,
              claimedAmount: 15000,
              approvedAmount: 13500,
              deductibleOrCoPay: 1500,
              medisaveOffset: 0,
              payoutDate: '2026-07-04',
              payoutMethod: 'Direct Bank Credit / PayNow',
              billItems: [
                {
                  id: 'b1',
                  billDate: '2026-06-10',
                  provider: 'Novena Specialist Imaging Centre',
                  description: 'Pre-admission Left Knee MRI Scan & Specialist Consultation',
                  billNumber: 'INV-2026-881',
                  incurredAmount: 1800,
                  claimedAmount: 1800,
                  insurerPaidAmount: 1620,
                  deductibleOrCoPay: 180,
                  medisaveOffset: 0,
                  status: 'Fully Paid',
                  notes: 'Reimbursed under pre-hospitalization benefit (90% co-insurance rider)'
                },
                {
                  id: 'b2',
                  billDate: '2026-06-18',
                  provider: 'Mount Elizabeth Novena Hospital',
                  description: 'Inpatient Day Surgery, Arthroscopic Meniscal Repair & Ward Care',
                  billNumber: 'HOSP-2026-90412',
                  incurredAmount: 12400,
                  claimedAmount: 12400,
                  insurerPaidAmount: 11160,
                  deductibleOrCoPay: 1240,
                  medisaveOffset: 0,
                  status: 'Fully Paid',
                  notes: 'Surgeon and anaesthetist fees approved in full.'
                },
                {
                  id: 'b3',
                  billDate: '2026-06-30',
                  provider: 'Novena Orthopaedic Clinic',
                  description: 'Post-discharge Consultation & Physiotherapy Sessions (Batch 1)',
                  billNumber: 'INV-2026-912',
                  incurredAmount: 800,
                  claimedAmount: 800,
                  insurerPaidAmount: 720,
                  deductibleOrCoPay: 80,
                  medisaveOffset: 0,
                  status: 'Fully Paid',
                  notes: 'Covered under post-hospitalisation 180-day window'
                }
              ],
              settlementEntries: [
                {
                  id: 's1',
                  settlementDate: '2026-07-04',
                  insurerRef: 'AIA-SETTLE-9042',
                  totalPaid: 13500,
                  coPayDeductible: 1500,
                  nonPayableAmount: 0,
                  paymentMethod: 'Direct Bank Credit / PayNow',
                  notes: 'Full settlement approved and disbursed via PayNow.'
                }
              ],
              documentChecklist: [
                { id: 'd1', label: 'Final Itemised Hospital Tax Invoice', required: true, status: 'Uploaded / Received', fileName: 'Hospital_Tax_Invoice_Novena.pdf', fileSize: 342000 },
                { id: 'd2', label: 'Inpatient Discharge Summary', required: true, status: 'Uploaded / Received', fileName: 'Discharge_Summary_DrTan.pdf', fileSize: 184000 },
                { id: 'd3', label: 'Doctor Medical Report / Memo', required: true, status: 'Uploaded / Received', fileName: 'Medical_Report_LeftKnee.pdf', fileSize: 220000 },
                { id: 'd4', label: 'Signed Inpatient Claim Form', required: true, status: 'Uploaded / Received', fileName: 'Signed_AIA_Claim_Form.pdf', fileSize: 156000 },
                { id: 'd5', label: 'Pre/Post-Hospitalisation Clinic Receipts', required: true, status: 'Uploaded / Received', fileName: 'MRI_and_Physio_Receipts.pdf', fileSize: 412000 }
              ],
              timelineNotes: [
                { id: 't1', timestamp: '2026-06-11T09:00:00.000Z', stage: 'Draft / Gathering Docs', note: 'Client notified of upcoming day surgery. Requested itemized bills and pre-op MRI report.', author: 'Advisor' },
                { id: 't2', timestamp: '2026-06-20T14:30:00.000Z', stage: 'Submitted to Insurer', note: 'Submitted complete batch to AIA Claims department with final bill and doctor memo.', author: 'Advisor' },
                { id: 't3', timestamp: '2026-07-04T11:15:00.000Z', stage: 'Approved', note: 'Claim approved by AIA. Net payout of $13,500 transferred to client. Reconciled $1,500 co-insurance with client.', author: 'Advisor' }
              ],
              createdAt: '2026-06-11T09:00:00.000Z',
              updatedAt: '2026-07-04T11:15:00.000Z'
            }
          ];
          saveDatabase();
        }
      }
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
  mainWindow = new BrowserWindow({
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

  // Application Auto-Update IPC Handlers
  ipcMain.handle('get-app-version', () => {
    return { success: true, version: app.getVersion() };
  });

  ipcMain.handle('get-update-status', () => {
    return { success: true, updateStatus };
  });

  ipcMain.handle('check-for-updates', async () => {
    try {
      writeToLogFile('[IPC] check-for-updates called by user');
      sendUpdateStatus({ status: 'checking', error: null });

      if (isDev) {
        // In dev mode, check GitHub Releases directly via REST API so it works without packaging
        try {
          const resp = await fetch('https://api.github.com/repos/DeathArchPieter/CRM/releases/latest', {
            headers: { 'User-Agent': 'Beetsma-Consultancy-CRM' }
          });
          if (resp.ok) {
            const release = await resp.json();
            const latestTag = release.tag_name ? release.tag_name.replace(/^v/, '') : app.getVersion();
            const currentVer = app.getVersion();
            if (latestTag !== currentVer) {
              const info = {
                version: latestTag,
                releaseDate: release.published_at,
                releaseNotes: release.body || ''
              };
              sendUpdateStatus({ status: 'available', info, error: null });
              return { success: true, updateInfo: info };
            } else {
              sendUpdateStatus({ status: 'not-available', info: { version: currentVer }, error: null });
              return { success: true, updateInfo: { version: currentVer } };
            }
          }
        } catch (fetchErr) {
          writeToLogFile(`[IPC] GitHub API check in dev: ${fetchErr.message}`);
        }
      }

      const result = await autoUpdater.checkForUpdates();
      return { success: true, updateInfo: result?.updateInfo };
    } catch (err) {
      writeToLogFile(`[IPC] check-for-updates failed: ${err.message}`);
      sendUpdateStatus({ status: 'error', error: err.message });
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('download-update', async () => {
    try {
      writeToLogFile('[IPC] download-update started');
      sendUpdateStatus({ status: 'downloading', error: null });
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (err) {
      writeToLogFile(`[IPC] download-update failed: ${err.message}`);
      sendUpdateStatus({ status: 'error', error: err.message });
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('quit-and-install-update', () => {
    writeToLogFile('[IPC] quit-and-install-update triggered (silent inline restart)');
    try {
      // isSilent: true, isForceRunAfter: true -> Seamless background restart without NSIS wizard
      autoUpdater.quitAndInstall(true, true);
      return { success: true };
    } catch (err) {
      writeToLogFile(`[IPC] quit-and-install-update failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  });

  // DB IPC Handlers
  // DB IPC Handlers (JSON Store)
  ipcMain.handle('get-clients', () => {
    writeToLogFile("[IPC] get-clients started");
    try {
      const start = Date.now();
      // Sort alphabetically by full name
      const sortedClients = [...db.clients].sort((a, b) => 
        a.fullName.localeCompare(b.fullName)
      );
      writeToLogFile(`[IPC] get-clients completed successfully in ${Date.now() - start}ms (returned ${sortedClients.length} clients)`);
      return { success: true, data: sortedClients };
    } catch (error) {
      writeToLogFile(`[IPC] get-clients failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('add-client', (event, clientData) => {
    writeToLogFile(`[IPC] add-client started for ${clientData.fullName}`);
    try {
      const start = Date.now();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      
      const newClient = {
        id,
        fullName: clientData.fullName || '',
        preferredName: clientData.preferredName || '',
        companyName: clientData.companyName || '',
        jobTitle: clientData.jobTitle || '',
        dob: clientData.dob || null,
        gender: clientData.gender || '',
        phone: clientData.phone || '',
        email: clientData.email || '',
        address: clientData.address || '',
        unitNumber: clientData.unitNumber || '',
        country: clientData.country || 'Singapore',
        clientStatus: clientData.clientStatus || 'Active',
        tags: clientData.tags || [],
        notes: clientData.notes || '',
        lastContactedAt: clientData.lastContactedAt || now,
        createdAt: now,
        updatedAt: now
      };
      
      db.clients.push(newClient);
      saveDatabase();
      writeToLogFile(`[IPC] add-client successfully added client ID: ${id} in ${Date.now() - start}ms`);
      return { success: true, id };
    } catch (error) {
      writeToLogFile(`[IPC] add-client failed: ${error.message}`);
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

  ipcMain.handle('get-all-policies', () => {
    try {
      return { success: true, data: db.policies || [] };
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
        medisavePremium: policyData.medisavePremium !== undefined && policyData.medisavePremium !== '' ? Number(policyData.medisavePremium) : undefined,
        cashPremium: policyData.cashPremium !== undefined && policyData.cashPremium !== '' ? Number(policyData.cashPremium) : undefined,
        premiumFrequency: policyData.premiumFrequency || 'Annually',
        coverages: policyData.coverages || {},
        inceptionDate: policyData.inceptionDate || null,
        remarks: policyData.remarks || policyData.notes || '',
        notes: policyData.remarks || policyData.notes || '',
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

  ipcMain.handle('log-client-touchpoint', (event, clientId, touchpointDate) => {
    try {
      const index = db.clients.findIndex(c => c.id === clientId);
      if (index === -1) throw new Error("Client not found");
      const dateToSave = touchpointDate || new Date().toISOString();
      db.clients[index].lastContactedAt = dateToSave;
      db.clients[index].updatedAt = new Date().toISOString();
      saveDatabase();
      return { success: true, lastContactedAt: dateToSave };
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
        remarks: policyData.remarks !== undefined ? policyData.remarks : (policyData.notes !== undefined ? policyData.notes : db.policies[index].remarks || db.policies[index].notes || ''),
        notes: policyData.remarks !== undefined ? policyData.remarks : (policyData.notes !== undefined ? policyData.notes : db.policies[index].notes || ''),
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

  // Claims & Payout Reconciliation IPC Handlers
  ipcMain.handle('get-claims', (event, clientId) => {
    try {
      if (!db.claims) db.claims = [];
      const clientClaims = clientId ? db.claims.filter(c => c.clientId === clientId) : db.claims;
      return { success: true, data: clientClaims };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-all-claims', () => {
    try {
      if (!db.claims) db.claims = [];
      return { success: true, data: db.claims };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('add-claim', (event, claimData) => {
    try {
      if (!db.claims) db.claims = [];
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      const newClaim = {
        id,
        clientId: claimData.clientId,
        policyId: claimData.policyId || '',
        additionalPolicyIds: claimData.additionalPolicyIds || [],
        claimNumber: claimData.claimNumber || '',
        claimType: claimData.claimType || 'Hospitalisation / Shield',
        title: claimData.title || '',
        incidentDate: claimData.incidentDate || null,
        admissionDate: claimData.admissionDate || null,
        dischargeDate: claimData.dischargeDate || null,
        hospitalOrClinic: claimData.hospitalOrClinic || '',
        doctorName: claimData.doctorName || '',
        status: claimData.status || 'Draft / Gathering Docs',
        
        // High-Level Financials
        totalIncurredAmount: Number(claimData.totalIncurredAmount) || 0,
        claimedAmount: Number(claimData.claimedAmount) || 0,
        approvedAmount: Number(claimData.approvedAmount) || 0,
        deductibleOrCoPay: Number(claimData.deductibleOrCoPay) || 0,
        medisaveOffset: Number(claimData.medisaveOffset) || 0,
        payoutDate: claimData.payoutDate || null,
        payoutMethod: claimData.payoutMethod || 'Direct Bank Credit / PayNow',

        // Detailed Bill & Settlement Breakdown
        billItems: Array.isArray(claimData.billItems) ? claimData.billItems : [],
        settlementEntries: Array.isArray(claimData.settlementEntries) ? claimData.settlementEntries : [],
        
        // Document Checklist
        documentChecklist: Array.isArray(claimData.documentChecklist) ? claimData.documentChecklist : [],

        // Timeline & Notes
        timelineNotes: Array.isArray(claimData.timelineNotes) && claimData.timelineNotes.length > 0 ? claimData.timelineNotes : [
          {
            id: crypto.randomUUID(),
            timestamp: now,
            stage: claimData.status || 'Draft / Gathering Docs',
            note: 'Claim initiated in CRM',
            author: 'Advisor'
          }
        ],

        createdAt: now,
        updatedAt: now
      };

      db.claims.push(newClaim);
      saveDatabase();
      return { success: true, id, data: newClaim };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-claim', (event, claimData) => {
    try {
      if (!db.claims) db.claims = [];
      const index = db.claims.findIndex(c => c.id === claimData.id);
      if (index === -1) throw new Error("Claim not found");

      db.claims[index] = {
        ...db.claims[index],
        ...claimData,
        updatedAt: new Date().toISOString()
      };

      saveDatabase();
      return { success: true, data: db.claims[index] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-claim', (event, claimId) => {
    try {
      if (!db.claims) db.claims = [];
      const initialLen = db.claims.length;
      db.claims = db.claims.filter(c => c.id !== claimId);
      if (db.claims.length !== initialLen) {
        saveDatabase();
        return { success: true };
      }
      throw new Error("Claim not found");
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Local File Attachments for Claims
  ipcMain.handle('attach-claim-document', async (event, { clientId, claimId, customFileName }) => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Select Claim Document, Receipt or Settlement Letter',
        properties: ['openFile'],
        filters: [
          { name: 'Documents & Images', extensions: ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'docx', 'xlsx', 'txt', 'csv'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
        return { success: false, canceled: true };
      }

      const sourcePath = result.filePaths[0];
      const userData = app.getPath('userData');
      const targetDir = path.join(userData, 'claims_documents', String(clientId), String(claimId));
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const origExt = path.extname(sourcePath);
      const origBase = path.basename(sourcePath, origExt);
      const cleanBase = (customFileName || origBase).replace(/[^a-zA-Z0-9_\- ]/g, '_').trim();
      const destFileName = `${cleanBase}_${Date.now()}${origExt}`;
      const destPath = path.join(targetDir, destFileName);

      fs.copyFileSync(sourcePath, destPath);
      const stat = fs.statSync(destPath);

      return {
        success: true,
        file: {
          fileName: path.basename(sourcePath),
          storedFileName: destFileName,
          filePath: destPath,
          fileSize: stat.size,
          fileType: origExt.replace('.', '').toLowerCase(),
          uploadedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('open-claim-folder', async (event, { clientId, claimId }) => {
    try {
      const userData = app.getPath('userData');
      const targetDir = path.join(userData, 'claims_documents', String(clientId), String(claimId));
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      await shell.openPath(targetDir);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-claim-file', async (event, filePath) => {
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // AI Claim Settlement Reconciliation Analyzer
  ipcMain.handle('analyse-claim-settlement-reconciliation', async (event, payload) => {
    try {
      const { client, claim, policy, billListingText, settlementLetterText, submissionSummaryText } = payload || {};
      if (!claim) throw new Error("Claim data is required");

      const systemInstruction = `You are a premier Insurance Claims Auditor & Senior Wealth Consultant at Beetsma Consultancy.
Your task is to analyze, reconcile, and cross-examine:
1. Clinic/Hospital Combined Bill Listings & Invoices
2. Claim Settlement Letters / Explanation of Benefits (EOB) from the insurer
3. Claim Submission Summaries

Identify exact line-item matches, calculate financial totals, flag any unpaid/disallowed items, explain insurer deduction codes (co-insurance, deductibles, non-reimbursable consumables), and determine if the payout is fully reconciled or if there is an unaccounted shortfall.

You MUST return your response as a valid, single JSON object without any markdown code block wrap (no \`\`\`json).
The JSON structure MUST match this exact schema:
{
  "reconciliationStatus": "Fully Reconciled / Shortfall Detected / Pending Insurer Payout / Disallowed Items",
  "totalIncurred": 14500,
  "totalClaimed": 14500,
  "totalInsurerPaid": 13050,
  "totalCoPayDeductible": 1450,
  "totalMedisaveOrPanel": 0,
  "unaccountedDifference": 0,
  "reconciledItems": [
    {
      "item": "Pre-hospitalisation MRI scan & consultation",
      "billAmount": 1500,
      "claimedAmount": 1500,
      "paidAmount": 1350,
      "coPayAmount": 150,
      "status": "Fully Paid / Partially Paid / Pending / Disallowed",
      "auditNote": "Reimbursed at 90% after 10% co-insurance rider."
    }
  ],
  "discrepancyAnalysis": "Clear 2-3 sentence explanation of discrepancies, non-payable items (e.g. surgical consumables, extra beds), or unpaid clinic follow-ups.",
  "recommendedAction": "Actionable instructions for the financial advisor (e.g. submit appeal for pre-op scan within 90 days, or inform client that shortfall is co-insurance).",
  "clientExplanationMessage": "A professional, empathetic, transparent WhatsApp/Email message draft summarizing the settlement breakdown for the client."
}`;

      const promptText = `Please analyze and audit the following insurance claim settlement reconciliation:

CLIENT: ${client?.fullName || 'Client'} (${client?.email || ''} / ${client?.phone || ''})
CLAIM: ${claim?.title || 'Medical Claim'} (${claim?.claimType || 'Hospitalisation'})
POLICY: ${policy?.provider || 'Insurer'} - ${policy?.policyName || 'Policy'} (Policy No: ${policy?.policyNumber || claim?.claimNumber || 'N/A'})
INCIDENT/HOSPITAL: ${claim?.hospitalOrClinic || 'Hospital'} | Doctor: ${claim?.doctorName || 'Attending Physician'}

CLINIC COMBINED BILL LISTING & INVOICES TEXT:
${billListingText || 'No raw clinic bill text provided. Refer to logged bill items.'}

SUBMISSION SUMMARY TEXT:
${submissionSummaryText || 'No raw submission text provided.'}

CLAIM SETTLEMENT LETTER / EOB TEXT:
${settlementLetterText || 'No raw settlement letter text provided.'}

CURRENT LOGGED BILL ITEMS IN SYSTEM:
${JSON.stringify(claim?.billItems || [], null, 2)}

CURRENT LOGGED SETTLEMENT ENTRIES:
${JSON.stringify(claim?.settlementEntries || [], null, 2)}

Provide a rigorous line-by-line financial audit and reconciliation.`;

      const response = await fetch(getGeminiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 3500
          }
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errBody}`);
      }

      const json = await response.json();
      let text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
      text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

      let auditResult = null;
      try {
        auditResult = JSON.parse(text);
      } catch (parseErr) {
        writeToLogFile(`[IPC] analyse-claim-settlement-reconciliation parse warning: ${parseErr.message}`);
        auditResult = {
          reconciliationStatus: "Analyzed",
          totalIncurred: claim?.totalIncurredAmount || 0,
          totalClaimed: claim?.claimedAmount || 0,
          totalInsurerPaid: claim?.approvedAmount || 0,
          totalCoPayDeductible: claim?.deductibleOrCoPay || 0,
          totalMedisaveOrPanel: claim?.medisaveOffset || 0,
          unaccountedDifference: 0,
          reconciledItems: [],
          discrepancyAnalysis: text,
          recommendedAction: "Review settlement breakdown against clinic bills.",
          clientExplanationMessage: `Hi ${client?.fullName || 'there'}, here is the summary of your claim payout for ${claim?.title || 'your recent treatment'}.`
        };
      }

      return { success: true, data: auditResult };
    } catch (error) {
      writeToLogFile(`[IPC] analyse-claim-settlement-reconciliation failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  // AI Claim Copilot (Client WhatsApp Update, Insurer Cover Letter, Diagnostic Checklist)
  ipcMain.handle('generate-claim-ai-assist', async (event, payload) => {
    try {
      const { client, claim, policy, actionType, customContext } = payload || {};
      if (!claim) throw new Error("Claim data is required");

      let systemInstruction = "";
      let promptText = "";

      if (actionType === 'client_whatsapp_update') {
        systemInstruction = `You are a top-tier Financial Consultant at Beetsma Consultancy. Draft a warm, reassuring, professional WhatsApp update message for your client regarding their insurance claim.
Include concise key details: Status, amount claimed/approved, what the next step is, or when payout is expected. Keep it clear, easy to read on mobile, with helpful emojis, but not overly casual.`;
        
        promptText = `Draft a WhatsApp update for:
Client: ${client?.fullName} (${client?.preferredName || ''})
Claim: ${claim?.title} (${claim?.claimType})
Status: ${claim?.status}
Insurer: ${policy?.provider || 'Insurer'} - ${policy?.policyName || 'Policy'} (Ref: ${claim?.claimNumber || 'Pending'})
Financials: Incurred $${claim?.totalIncurredAmount || 0}, Claimed $${claim?.claimedAmount || 0}, Insurer Approved/Paid $${claim?.approvedAmount || 0}, Co-pay $${claim?.deductibleOrCoPay || 0}
Next Steps / Notes: ${customContext || 'Normal processing'}`;
      } else if (actionType === 'insurer_cover_letter') {
        systemInstruction = `You are a senior Chartered Financial Consultant representing your client in submitting a formal claim or inquiry to the insurer's Claims & Underwriting Department.
Write a formal, polished, professional Cover Letter citing the policy number, claimant name, date of admission/event, attending physician, itemized attached documents, and specific request (e.g. initial submission, submission of additional pre/post-hospitalization bills, or appeal against deduction).`;

        promptText = `Draft a formal Claim Cover Letter to ${policy?.provider || 'The Insurer Claims Department'}:
Policy Holder: ${client?.fullName}
Policy Number: ${policy?.policyNumber || 'Pending'}
Claim Reference: ${claim?.claimNumber || 'New Submission'}
Claim Type: ${claim?.claimType}
Diagnosis / Treatment: ${claim?.title}
Incident / Admission Date: ${claim?.incidentDate || claim?.admissionDate || 'N/A'} (Discharge: ${claim?.dischargeDate || 'N/A'})
Hospital / Clinic: ${claim?.hospitalOrClinic || 'N/A'} | Doctor: ${claim?.doctorName || 'N/A'}
Total Amount Claimed: $${claim?.claimedAmount || claim?.totalIncurredAmount || 0}
Attached Documents: ${(claim?.documentChecklist || []).filter(d => d.status === 'Uploaded / Received').map(d => d.label).join(', ') || 'All medical bills, tax invoices, and medical report'}
Specific Request / Context: ${customContext || 'Please process this claim under the in-force hospitalization and medical rider.'}`;
      } else {
        systemInstruction = `You are an expert insurance claims specialist. Provide clear, actionable checklist requirements and advisory guidance for processing this specific insurance claim.`;
        promptText = `Provide claim guidance for:
Claim: ${claim?.title} (${claim?.claimType})
Policy: ${policy?.provider} - ${policy?.policyType}
Context: ${customContext || 'General requirements and traps to avoid'}`;
      }

      const response = await fetch(getGeminiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2500
          }
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errBody}`);
      }

      const json = await response.json();
      let text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return { success: true, text: text.trim() };
    } catch (error) {
      writeToLogFile(`[IPC] generate-claim-ai-assist failed: ${error.message}`);
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
    writeToLogFile(`[IPC] update-initiative started for initiative ID: ${initiativeData.id}`);
    try {
      const start = Date.now();
      if (!db.initiatives) db.initiatives = [];
      const index = db.initiatives.findIndex(p => p.id === initiativeData.id);
      if (index === -1) throw new Error("Initiative not found");
      
      db.initiatives[index] = {
        ...db.initiatives[index],
        ...initiativeData,
        updatedAt: new Date().toISOString()
      };
      saveDatabase();
      writeToLogFile(`[IPC] update-initiative completed successfully in ${Date.now() - start}ms`);
      return { success: true };
    } catch (error) {
      writeToLogFile(`[IPC] update-initiative failed: ${error.message}`);
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
    writeToLogFile(`[IPC] add-pipeline-case started for client: ${caseData.clientName}`);
    try {
      const start = Date.now();
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
      writeToLogFile(`[IPC] add-pipeline-case completed successfully in ${Date.now() - start}ms, ID: ${id}`);
      return { success: true, id };
    } catch (error) {
      writeToLogFile(`[IPC] add-pipeline-case failed: ${error.message}`);
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
      
      const updatedTask = {
        ...db.tasks[index],
        ...taskData,
        updatedAt: new Date().toISOString()
      };
      db.tasks[index] = updatedTask;

      if (updatedTask.status === 'Completed' && updatedTask.clientId) {
        const clientIndex = db.clients.findIndex(c => c.id === updatedTask.clientId);
        if (clientIndex !== -1) {
          db.clients[clientIndex].lastContactedAt = new Date().toISOString();
        }
      }

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

      const response = await fetch(getGeminiUrl(), {
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

      const response = await fetch(getGeminiUrl(), {
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
            maxOutputTokens: 8192
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

      const response = await fetch(getGeminiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: userMessage }] }],
          generationConfig: {
            temperature: 0.85,
            maxOutputTokens: 4096
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

      const response = await fetch(getGeminiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: userMessage }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
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

  ipcMain.handle('discover-client-socials', async (event, payload) => {
    try {
      const { clientId, customHints } = payload || {};
      if (!clientId) throw new Error("Client ID is required");

      const index = db.clients.findIndex(c => c.id === clientId);
      if (index === -1) throw new Error("Client not found");
      const client = db.clients[index];

      const systemInstruction = `You are an elite public OSINT and social media discovery assistant for Beetsma Consultancy wealth advisory.
Your task is to search the web using Search Grounding and find potential matching public social media accounts, professional profiles, video channels, and news mentions for a given client.
Search specifically across:
1. LinkedIn (site:linkedin.com/in or linkedin company)
2. Instagram (site:instagram.com)
3. Facebook (site:facebook.com)
4. TikTok (site:tiktok.com/@)
5. X / Twitter (site:twitter.com or site:x.com)
6. YouTube (site:youtube.com)
7. Threads (site:threads.net)
8. Company Website & Official Press Releases
9. Singapore / Regional Business News (Straits Times, Business Times, Tech in Asia, Google News)

You MUST return your response as a valid, single JSON object without markdown code blocks (\`\`\`json).
The JSON structure MUST be exactly:
{
  "candidates": [
    {
      "platform": "LinkedIn / Instagram / Facebook / TikTok / X / Twitter / YouTube / Threads / News / Website",
      "url": "Full direct URL to candidate profile or article",
      "title": "Account / Channel / Page Title found",
      "snippet": "Short summary or bio text from search result",
      "confidence": "High / Medium / Low",
      "matchReason": "Why this candidate is believed to match (e.g. matching employer Acme Corp, Singapore location, or exact handle)"
    }
  ]
}`;

      const promptText = `Find matching candidate social accounts, channels, websites, and news mentions for:
Name: ${client.fullName} ${client.preferredName ? `(Preferred: ${client.preferredName})` : ''}
Company: ${client.companyName || 'Not specified'}
Job Title: ${client.jobTitle || 'Not specified'}
Location / Address: ${client.address || 'Singapore'}
Known Email/Phone: ${client.email || ''} ${client.phone || ''}
Personal Notes / Context: ${client.notes || ''}
Advisor Search Hints: ${customHints || 'None'}

Execute multi-query search grounding on Google for:
- "${client.fullName}" "${client.companyName || ''}" site:linkedin.com/in
- "${client.fullName}" site:instagram.com OR site:facebook.com OR site:tiktok.com
- "${client.fullName}" "${client.companyName || ''}" site:twitter.com OR site:x.com OR site:youtube.com OR site:threads.net
- "${client.fullName}" "${client.companyName || ''}" Singapore (news OR "straits times" OR "business times" OR "tech in asia")
- "${client.companyName || ''}" official website

Return candidate profiles in the required JSON format.`;

      const response = await fetch(getGeminiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2500
          }
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errBody}`);
      }

      const json = await response.json();
      let text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
      text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

      let candidatesData = null;
      try {
        candidatesData = JSON.parse(text);
      } catch (parseErr) {
        writeToLogFile(`[IPC] discover-client-socials JSON parse warning: ${parseErr.message}`);
        candidatesData = { candidates: [] };
      }

      return { success: true, candidates: candidatesData.candidates || [] };
    } catch (error) {
      writeToLogFile(`[IPC] discover-client-socials failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('save-client-dossier', (event, payload) => {
    try {
      const { clientId, socialLinks, dossier } = payload || {};
      if (!clientId) throw new Error("Client ID is required");

      const index = db.clients.findIndex(c => c.id === clientId);
      if (index === -1) throw new Error("Client not found");

      db.clients[index] = {
        ...db.clients[index],
        linkedinUrl: socialLinks?.linkedinUrl ?? db.clients[index].linkedinUrl ?? '',
        facebookUrl: socialLinks?.facebookUrl ?? db.clients[index].facebookUrl ?? '',
        instagramUrl: socialLinks?.instagramUrl ?? db.clients[index].instagramUrl ?? '',
        tiktokUrl: socialLinks?.tiktokUrl ?? db.clients[index].tiktokUrl ?? '',
        twitterUrl: socialLinks?.twitterUrl ?? db.clients[index].twitterUrl ?? '',
        youtubeUrl: socialLinks?.youtubeUrl ?? db.clients[index].youtubeUrl ?? '',
        threadsUrl: socialLinks?.threadsUrl ?? db.clients[index].threadsUrl ?? '',
        websiteUrl: socialLinks?.websiteUrl ?? db.clients[index].websiteUrl ?? '',
        companyName: socialLinks?.companyName ?? db.clients[index].companyName ?? '',
        jobTitle: socialLinks?.jobTitle ?? db.clients[index].jobTitle ?? '',
        aiDossier: dossier || db.clients[index].aiDossier || null,
        aiDossierGeneratedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      saveDatabase();
      return { success: true, client: db.clients[index] };
    } catch (error) {
      writeToLogFile(`[IPC] save-client-dossier failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('analyze-social-post', async (event, payload) => {
    try {
      const { clientId, platform, content, date, url } = payload || {};
      if (!content || !content.trim()) throw new Error("Post content is required");

      const systemInstruction = `You are a social intelligence analyst and wealth management advisor AI at Beetsma Consultancy.
Your task is to analyze a single social media post, video caption, tweet, or news excerpt for a client and extract actionable insights.
You MUST return your response as a valid, single JSON object without markdown code blocks (\`\`\`json).

The JSON structure MUST be exactly:
{
  "topic": "Concise 2-4 word topic/milestone (e.g. Marathon Completion / Job Promotion / Family Birthday / Business Launch / Keynote Speaker)",
  "financialSignal": "Actionable financial planning implication (e.g. Higher cashflow, tax optimization, health coverage booster, keyman risk, education savings)",
  "suggestedProduct": "Recommended planning product (e.g. CI Booster / Retirement Endowment / Key Executive Cover / Education Fund)",
  "icebreaker": "A natural, warm 2-sentence WhatsApp or messaging opener referencing this specific post"
}`;

      const promptText = `Analyze this social media post snippet:
Platform: ${platform || 'Social Media'}
Post Text / Caption: "${content}"
Date / URL: ${date || 'Recent'} ${url || ''}

Extract topic milestone, financial planning signal, suggested product, and a tailored conversation starter.`;

      const response = await fetch(getGeminiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 1024
          }
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errBody}`);
      }

      const json = await response.json();
      let text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
      text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

      let aiAnalysis = null;
      try {
        aiAnalysis = JSON.parse(text);
      } catch (parseErr) {
        aiAnalysis = {
          topic: "Social Update",
          financialSignal: "Relationship touchpoint & review opportunity",
          suggestedProduct: "Holistic Review",
          icebreaker: `Saw your update on ${platform || 'social media'}! Hope all is going well.`
        };
      }

      return { success: true, aiAnalysis };
    } catch (error) {
      writeToLogFile(`[IPC] analyze-social-post failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('save-client-social-posts', (event, payload) => {
    try {
      const { clientId, posts } = payload || {};
      if (!clientId) throw new Error("Client ID is required");

      const index = db.clients.findIndex(c => c.id === clientId);
      if (index === -1) throw new Error("Client not found");

      db.clients[index] = {
        ...db.clients[index],
        socialPosts: posts || [],
        updatedAt: new Date().toISOString()
      };

      saveDatabase();
      return { success: true, client: db.clients[index] };
    } catch (error) {
      writeToLogFile(`[IPC] save-client-social-posts failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('open-social-login-window', async (event, platform) => {
    try {
      const socialSession = session.fromPartition('persist:social_accounts');
      let targetUrl = 'https://www.linkedin.com/login';
      const plat = (platform || '').toLowerCase();
      if (plat === 'linkedin') targetUrl = 'https://www.linkedin.com/login';
      else if (plat === 'facebook') targetUrl = 'https://www.facebook.com/login';
      else if (plat === 'instagram') targetUrl = 'https://www.instagram.com/accounts/login/';
      else if (plat === 'tiktok') targetUrl = 'https://www.tiktok.com/login';
      else if (plat === 'twitter' || plat === 'x') targetUrl = 'https://x.com/i/flow/login';
      else if (plat === 'youtube') targetUrl = 'https://accounts.google.com/';
      else if (plat === 'threads') targetUrl = 'https://www.threads.net/login';

      const loginWin = new BrowserWindow({
        width: 1050,
        height: 780,
        title: `Log into ${platform || 'Social Account'} - Session Saved for CRM`,
        webPreferences: {
          session: socialSession,
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      loginWin.loadURL(targetUrl);
      return { success: true };
    } catch (error) {
      writeToLogFile(`[IPC] open-social-login-window failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('run-browser-social-scan', async (event, payload) => {
    try {
      const { clientId, handle, platform, customHints } = payload || {};
      if (!clientId) throw new Error("Client ID is required");

      const index = db.clients.findIndex(c => c.id === clientId);
      if (index === -1) throw new Error("Client not found");
      const client = db.clients[index];

      const targetHandle = handle || client.instagramUrl || client.linkedinUrl || client.tiktokUrl || client.twitterUrl || client.fullName;
      writeToLogFile(`[Browser Subagent] Starting scan for ${client.fullName} (${targetHandle})`);

      const socialSession = session.fromPartition('persist:social_accounts');
      
      // Determine URL to inspect
      let targetUrl = '';
      const plat = (platform || '').toLowerCase();
      if (targetHandle.startsWith('http://') || targetHandle.startsWith('https://')) {
        targetUrl = targetHandle;
      } else if (plat === 'instagram' || targetHandle.includes('instagram.com') || targetHandle.startsWith('@')) {
        const cleanHandle = targetHandle.replace('@', '').trim();
        targetUrl = targetHandle.includes('instagram.com') ? targetHandle : `https://www.instagram.com/${cleanHandle}/`;
      } else if (plat === 'tiktok' || targetHandle.includes('tiktok.com')) {
        const cleanHandle = targetHandle.startsWith('@') ? targetHandle : `@${targetHandle}`;
        targetUrl = targetHandle.includes('tiktok.com') ? targetHandle : `https://www.tiktok.com/${cleanHandle}`;
      } else if (plat === 'twitter' || plat === 'x' || targetHandle.includes('twitter.com') || targetHandle.includes('x.com')) {
        const cleanHandle = targetHandle.replace('@', '').trim();
        targetUrl = targetHandle.includes('x.com') || targetHandle.includes('twitter.com') ? targetHandle : `https://x.com/${cleanHandle}`;
      } else {
        targetUrl = `https://www.linkedin.com/in/${encodeURIComponent(targetHandle)}`;
      }

      // Launch automated offscreen/background inspection window
      const scanWin = new BrowserWindow({
        width: 1280,
        height: 900,
        show: false, // background subagent
        webPreferences: {
          session: socialSession,
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      await scanWin.loadURL(targetUrl);
      // Wait for page rendering
      await new Promise(r => setTimeout(r, 4500));

      // Execute in-page extraction script for multiple social platforms
      const extractedData = await scanWin.webContents.executeJavaScript(`
        (() => {
          const posts = [];
          // Multi-platform selectors: Instagram, LinkedIn, TikTok, X/Twitter, Facebook
          const articles = document.querySelectorAll('article, div._aagv, a[href*="/p/"], div.feed-shared-update-v2, div[data-e2e="user-post-item"], div[data-testid="tweet"]');
          articles.forEach((art, i) => {
            if (i >= 8) return;
            const img = art.querySelector('img');
            const video = art.querySelector('video');
            const link = art.closest('a') || art.querySelector('a');
            const text = art.innerText || img?.alt || '';
            if (img || video || text) {
              posts.push({
                caption: text || 'Social Media Update / Photo',
                imgUrl: img ? img.src : (video ? video.poster || '' : ''),
                postUrl: link ? link.href : window.location.href,
                date: 'Recent'
              });
            }
          });

          // Fallback if generic page text
          if (posts.length === 0) {
            const bodyText = document.body.innerText.substring(0, 1500);
            if (bodyText && bodyText.length > 50) {
              posts.push({
                caption: bodyText,
                imgUrl: '',
                postUrl: window.location.href,
                date: 'Recent'
              });
            }
          }
          return { posts, pageTitle: document.title };
        })()
      `);

      scanWin.close();

      writeToLogFile(`[Browser Subagent] Extracted ${extractedData?.posts?.length || 0} raw posts for ${client.fullName}`);

      // Process extracted posts with Gemini to get AI insights for each authentic post
      const processedPosts = [];
      const mediaDir = path.join(app.getPath('userData'), 'client_media');
      if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });

      for (let i = 0; i < (extractedData?.posts?.length || 0); i++) {
        const item = extractedData.posts[i];
        if (!item.caption || item.caption.length < 5) continue;

        // Download authentic post image if available
        let localImagePath = '';
        if (item.imgUrl && item.imgUrl.startsWith('http')) {
          try {
            const imgFileName = `${clientId}_post_${i}_${Date.now()}.jpg`;
            const localPath = path.join(mediaDir, imgFileName);
            const imgRes = await fetch(item.imgUrl);
            if (imgRes.ok) {
              const buffer = Buffer.from(await imgRes.arrayBuffer());
              fs.writeFileSync(localPath, buffer);
              localImagePath = `file:///${localPath.replace(/\\/g, '/')}`;
            }
          } catch (imgErr) {
            writeToLogFile(`[Browser Subagent] Image download warning: ${imgErr.message}`);
          }
        }

        // Run Gemini analysis on this authentic post text
        let aiAnalysis = null;
        try {
          const aiRes = await fetch(getGeminiUrl(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: `Analyze this social post and return JSON: {"topic":"...","financialSignal":"...","suggestedProduct":"...","icebreaker":"..."}` }] },
              contents: [{ role: 'user', parts: [{ text: item.caption }] }],
              generationConfig: { maxOutputTokens: 512 }
            })
          });
          if (aiRes.ok) {
            const aiJson = await aiRes.json();
            let rawText = aiJson.candidates?.[0]?.content?.parts?.[0]?.text || '';
            rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
            aiAnalysis = JSON.parse(rawText);
          }
        } catch (e) {
          aiAnalysis = { topic: "Authentic Post", financialSignal: "Authentic activity touchpoint", icebreaker: "Saw your post!" };
        }

        const detectedPlatform = targetUrl.includes('instagram') ? 'Instagram' 
          : targetUrl.includes('tiktok') ? 'TikTok' 
          : targetUrl.includes('twitter') || targetUrl.includes('x.com') ? 'X / Twitter' 
          : targetUrl.includes('facebook') ? 'Facebook' 
          : targetUrl.includes('youtube') ? 'YouTube' 
          : targetUrl.includes('linkedin') ? 'LinkedIn' 
          : 'Social Media';

        processedPosts.push({
          id: crypto.randomUUID(),
          platform: detectedPlatform,
          content: item.caption.substring(0, 300),
          fullCaption: item.caption,
          imageUrl: localImagePath || item.imgUrl || '',
          localImagePath: localImagePath || '',
          url: item.postUrl || targetUrl,
          autoExtracted: true,
          browserSubagentExtracted: true,
          salient: true,
          aiAnalysis: aiAnalysis || { topic: "Authentic Post", financialSignal: "Life update", icebreaker: "Great update!" },
          addedAt: new Date().toISOString()
        });
      }

      // Merge into client's socialPosts with deduplication
      const existingPosts = client.socialPosts || [];
      const mergedPosts = [...existingPosts];
      for (const pp of processedPosts) {
        const isDuplicate = mergedPosts.some(p => 
          (p.url && pp.url && p.url.toLowerCase() === pp.url.toLowerCase()) ||
          (p.fullCaption && pp.fullCaption && p.fullCaption.toLowerCase().trim() === pp.fullCaption.toLowerCase().trim()) ||
          (p.content && pp.content && p.content.toLowerCase().trim() === pp.content.toLowerCase().trim())
        );
        if (!isDuplicate) {
          mergedPosts.unshift(pp);
        }
      }

      db.clients[index] = {
        ...client,
        socialPosts: mergedPosts,
        updatedAt: new Date().toISOString()
      };
      saveDatabase();

      return { success: true, posts: mergedPosts, client: db.clients[index] };
    } catch (error) {
      writeToLogFile(`[IPC] run-browser-social-scan failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('enrich-client-profile', async (event, payload) => {
    try {
      const { clientId, socialLinks, customHints } = payload || {};
      if (!clientId) throw new Error("Client ID is required");

      const index = db.clients.findIndex(c => c.id === clientId);
      if (index === -1) throw new Error("Client not found");
      const client = db.clients[index];

      // Update social links if provided
      if (socialLinks) {
        client.linkedinUrl = socialLinks.linkedinUrl ?? client.linkedinUrl ?? '';
        client.facebookUrl = socialLinks.facebookUrl ?? client.facebookUrl ?? '';
        client.instagramUrl = socialLinks.instagramUrl ?? client.instagramUrl ?? '';
        client.tiktokUrl = socialLinks.tiktokUrl ?? client.tiktokUrl ?? '';
        client.twitterUrl = socialLinks.twitterUrl ?? client.twitterUrl ?? '';
        client.youtubeUrl = socialLinks.youtubeUrl ?? client.youtubeUrl ?? '';
        client.threadsUrl = socialLinks.threadsUrl ?? client.threadsUrl ?? '';
        client.websiteUrl = socialLinks.websiteUrl ?? client.websiteUrl ?? '';
        client.companyName = socialLinks.companyName ?? client.companyName ?? '';
        client.jobTitle = socialLinks.jobTitle ?? client.jobTitle ?? '';
      }

      // Gather context
      const clientPolicies = db.policies.filter(p => p.clientId === clientId);
      const clientTasks = db.tasks.filter(t => t.clientId === clientId);

      const systemInstruction = `You are an elite wealth management advisor AI and OSINT client research intelligence assistant for Beetsma Consultancy.
Your task is to analyze a client's profile, company background, social media links, video channels, press articles, and CRM notes, and generate a comprehensive 360° Client Dossier & Behavioral Intelligence Brief.
Use Google Search Grounding to find recent public posts, LinkedIn articles, Instagram/TikTok captions, Facebook updates, X/Twitter posts, YouTube videos, and Singapore business press releases associated with the client.
You MUST extract AT LEAST 6 to 10 distinct public posts, captions, news snippets, or social activity updates.
You MUST return your response as a valid, single JSON object without markdown code blocks (\`\`\`json).

The JSON structure MUST be exactly:
{
  "executiveSummary": "2-3 sentence overview of their professional background, career trajectory, and online profile",
  "seniorityLevel": "Executive / Business Owner / Senior Management / Mid-Level / Professional / High-Net-Worth Individual",
  "companyInsight": "Short synthesis of company size, industry, funding rounds, growth stage, or recent developments",
  "patternSummary": "2-3 sentence synthesis of recurring behavioral patterns, personal/career priorities, and lifestyle trends detected across public posts",
  "topRecurringThemes": ["Theme 1", "Theme 2", "Theme 3", "Theme 4"],
  "keyInterests": ["Interest 1 (e.g. Golf / Marathon / Watches / Tech / Wine / Travel)", "Interest 2", "Interest 3", "Interest 4"],
  "lifeTriggers": [
    {
      "signal": "e.g. Promotion / Business expansion / Newborn child / New home / Speaking engagement / IPO",
      "impact": "Financial implication (e.g. Higher tax exposure, cash surplus, protection gap, keyman risk)",
      "suggestedProduct": "Recommended planning product (e.g. Key Executive Protection / Wealth Transfer / Child Education Fund / CI Booster)"
    }
  ],
  "businessRisks": [
    {
      "risk": "e.g. Key Person Dependency / Sole Director Liability / Cashflow Expansion",
      "description": "Short explanation of the business or career risk flag",
      "recommendedSafeguard": "e.g. Business Succession / Group Term / Keyman Coverage"
    }
  ],
  "icebreakers": [
    {
      "channel": "WhatsApp / Call",
      "tone": "Warm & Friendly",
      "template": "A warm, natural 2-sentence conversation starter referencing their recent update or hobby"
    },
    {
      "channel": "LinkedIn / Email",
      "tone": "Executive & Formal",
      "template": "A professional 2-sentence opener tailored to their corporate/business focus"
    },
    {
      "channel": "SMS / Quick Note",
      "tone": "Direct & Brief",
      "template": "A concise 1-2 sentence touchpoint opener"
    }
  ],
  "recent90DaysHighlights": [
    {
      "timeframe": "Last 30 Days / 30-60 Days Ago / 60-90 Days Ago",
      "event": "Short description of verified public activity, post, or business news",
      "relevance": "Advisory relevance or talking point"
    }
  ],
  "extractedPosts": [
    {
      "platform": "LinkedIn / Instagram / TikTok / Facebook / X / Twitter / YouTube / Company News",
      "content": "Short summary preview text (1-2 sentences)",
      "fullCaption": "Complete un-truncated post text, wording, hashtags, and mentions",
      "author": "Profile name or handle (e.g. @john_doe or John Doe)",
      "engagement": "Detected likes/views/comments (e.g. 142 Likes • 18 Comments or 1.2k Views)",
      "date": "Estimated post date (e.g. 2026-08-05)",
      "url": "Direct source link (e.g. https://linkedin.com/posts/... or https://instagram.com/p/... or https://tiktok.com/@...)",
      "salient": true,
      "media": [
        {
          "type": "image",
          "url": "Direct image URL or media preview link",
          "caption": "Photo/media description (e.g. Marathon Finisher Medal / Corporate Keynote / Team Photo)"
        }
      ],
      "aiAnalysis": {
        "topic": "Concise 2-4 word topic/milestone",
        "financialSignal": "Actionable financial planning implication",
        "suggestedProduct": "Recommended planning product",
        "icebreaker": "A 2-sentence conversation starter referencing this specific post"
      }
    }
  ],
  "webSourcesNote": "Brief statement of search grounding context or public profile signals found"
}`;

      const promptText = `Generate a 360° Client Dossier and extract AT LEAST 6 to 10 distinct public social posts/updates across LinkedIn, Instagram, TikTok, Facebook, X, YouTube, and Business News with direct URLs, full captions, author handles, and discovered media photos for:
Client Name: ${client.fullName} ${client.preferredName ? `(Preferred: ${client.preferredName})` : ''}
Company Name: ${client.companyName || 'Not specified'}
Job Title: ${client.jobTitle || 'Not specified'}
LinkedIn URL: ${client.linkedinUrl || 'None'}
Facebook URL: ${client.facebookUrl || 'None'}
Instagram URL: ${client.instagramUrl || 'None'}
TikTok URL: ${client.tiktokUrl || 'None'}
Twitter/X URL: ${client.twitterUrl || 'None'}
YouTube URL: ${client.youtubeUrl || 'None'}
Website URL: ${client.websiteUrl || 'None'}
Personal Remarks & Notes: ${client.notes || 'None'}
Advisor Search Hints: ${customHints || 'None'}

CRM PORTFOLIO SUMMARY:
Active Policies: ${clientPolicies.map(p => `${p.policyName} (${p.policyType})`).join(', ') || 'None'}
Pending Tasks: ${clientTasks.filter(t => t.status === 'Pending').map(t => t.description).join(', ') || 'None'}

Perform deep web search grounding across Google, LinkedIn, Instagram, TikTok, Facebook, X, YouTube, and Singapore Business News (Straits Times, Business Times, Tech in Asia) to extract 6 to 10 specific public posts/articles/announcements with full captions, direct URLs, discovered photos, synthesize the 6-pillar behavioral & advisory radar, and return the complete JSON object.`;

      const response = await fetch(getGeminiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 4096
          }
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errBody}`);
      }

      const json = await response.json();
      let text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
      text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

      let dossier = null;
      try {
        dossier = JSON.parse(text);
      } catch (parseErr) {
        writeToLogFile(`[IPC] enrich-client-profile JSON parse warning: ${parseErr.message}`);
        dossier = {
          executiveSummary: text,
          seniorityLevel: "Professional",
          companyInsight: client.companyName ? `Associated with ${client.companyName}` : "No company data",
          patternSummary: "Active online presence across professional and personal platforms.",
          topRecurringThemes: ["Career Growth", "Financial Planning"],
          keyInterests: ["Wealth Growth", "Asset Protection"],
          lifeTriggers: [
            { signal: "Profile review", impact: "Comprehensive wealth check", suggestedProduct: "Holistic Financial Review" }
          ],
          businessRisks: [],
          icebreakers: [
            { channel: "WhatsApp / Call", tone: "Warm & Friendly", template: `Hi ${client.preferredName || client.fullName}, wanted to check in and see how things are going at ${client.companyName || 'work'}!` }
          ],
          recent90DaysHighlights: [],
          extractedPosts: [],
          webSourcesNote: "Generated via Gemini analysis"
        };
      }

      // Automatically merge extracted posts into client.socialPosts with deduplication
      const existingPosts = client.socialPosts || [];
      const newExtracted = dossier?.extractedPosts || [];
      const formattedNewPosts = newExtracted.map(ep => ({
        id: crypto.randomUUID(),
        platform: ep.platform || 'Social Media',
        content: ep.content || ep.fullCaption || '',
        fullCaption: ep.fullCaption || ep.content || '',
        author: ep.author || client.fullName,
        engagement: ep.engagement || '',
        date: ep.date || new Date().toISOString().split('T')[0],
        url: ep.url || client.linkedinUrl || client.websiteUrl || '',
        autoExtracted: true,
        salient: ep.salient !== false,
        media: Array.isArray(ep.media) ? ep.media : [],
        aiAnalysis: ep.aiAnalysis || {
          topic: "Public Social Activity",
          financialSignal: "Review touchpoint",
          suggestedProduct: "Financial Checkup",
          icebreaker: `Saw your recent update! Hope all is going well.`
        },
        addedAt: new Date().toISOString()
      })).filter(ep => (ep.content || ep.fullCaption) && (ep.content.trim() || ep.fullCaption.trim()));

      // Deduplicate by URL or content text
      const mergedPosts = [...existingPosts];
      for (const np of formattedNewPosts) {
        const isDuplicate = mergedPosts.some(p => 
          (p.url && np.url && p.url.toLowerCase() === np.url.toLowerCase()) ||
          (p.fullCaption && np.fullCaption && p.fullCaption.toLowerCase().trim() === np.fullCaption.toLowerCase().trim()) ||
          (p.content && np.content && p.content.toLowerCase().trim() === np.content.toLowerCase().trim())
        );
        if (!isDuplicate) {
          mergedPosts.unshift(np);
        }
      }

      // Auto-save generated dossier and social posts into client record
      db.clients[index] = {
        ...client,
        aiDossier: dossier,
        socialPosts: mergedPosts,
        aiDossierGeneratedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveDatabase();

      return { success: true, dossier, client: db.clients[index] };
    } catch (error) {
      writeToLogFile(`[IPC] enrich-client-profile failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('generate-client-meeting-brief', async (event, payload) => {
    try {
      const { clientId, meetingContext, timeframeDays = 90 } = payload || {};
      if (!clientId) throw new Error("Client ID is required");

      const index = db.clients.findIndex(c => c.id === clientId);
      if (index === -1) throw new Error("Client not found");
      const client = db.clients[index];

      const clientPolicies = db.policies.filter(p => p.clientId === clientId);
      const clientTasks = db.tasks.filter(t => t.clientId === clientId);
      const clientPosts = (client.socialPosts || []).slice(0, 10);
      const dossier = client.aiDossier || {};

      const systemInstruction = `You are an executive private wealth advisor briefing specialist for Beetsma Consultancy.
Your task is to generate a comprehensive "90-Day Pre-Meeting Intelligence Brief" for an upcoming client review.
Synthesize the client's recent online activities, career/company updates, life triggers, active policy portfolio, and financial blueprint.

You MUST return your response as a valid, single JSON object without markdown code blocks (\`\`\`json).
The JSON structure MUST be exactly:
{
  "executiveSummary90Days": "2-3 concise sentences summarizing what has transpired in the client's career, business, and personal world over the last 90 days",
  "recentMilestones": [
    {
      "period": "e.g. Last 30 Days / 60 Days Ago",
      "milestone": "Event description (e.g. Promoted to VP / Tokyo Marathon / Company Series B)",
      "sourcePlatform": "LinkedIn / Instagram / News / TikTok",
      "financialOpportunity": "Direct financial planning connection (e.g. Tax relief, key executive insurance, wealth accumulation)"
    }
  ],
  "conversationHooks": [
    {
      "hookTitle": "Concise topic title",
      "rapportScript": "A warm, natural 2-sentence conversational opener for the consultant to use when opening the meeting",
      "transitionToAdvisory": "How to seamlessly transition from this rapport hook into reviewing their financial blueprint"
    }
  ],
  "recommendedAgenda": [
    {
      "order": 1,
      "agendaItem": "Agenda topic",
      "duration": "10 mins",
      "focus": "Key objective and what to show the client"
    }
  ],
  "planningOpportunities": [
    {
      "domain": "Protection / Wealth Accumulation / Retirement / Estate & Legacy / Tax Optimization",
      "priority": "High / Medium / Low",
      "recommendation": "Concrete planning action to propose",
      "rationale": "Why this is timely based on recent life signals or existing coverage gaps"
    }
  ],
  "meetingPrepNoteText": "A clean, multi-paragraph formatted briefing text suitable for the advisor to copy into their CRM meeting prep note"
}`;

      const promptText = `Generate a 90-Day Pre-Meeting Intelligence Brief for:
Client: ${client.fullName} ${client.preferredName ? `(${client.preferredName})` : ''}
Company: ${client.companyName || 'Not specified'} | Title: ${client.jobTitle || 'Not specified'}
Location: ${client.address || 'Singapore'}
Meeting Context / Notes: ${meetingContext || 'Annual Financial & Portfolio Review'}

EXISTING IN-FORCE POLICIES:
${clientPolicies.map(p => `- ${p.policyName} (${p.provider} ${p.policyType}): $${p.premiumAmount || 0}/${p.premiumFrequency || 'yr'}`).join('\n') || 'None recorded'}

FINANCIAL BLUEPRINT CONTEXT:
${client.financialPlan ? `Target Retirement Age: ${client.financialPlan.targetRetirementAge || 'Not set'}, Monthly Savings: $${client.financialPlan.monthlySavings || 0}, Net Worth: $${client.financialPlan.netWorth || 0}` : 'Blank Slate / Not yet configured'}

RECENT EXTRACTED POSTS & SIGNALS (LAST 90 DAYS):
${clientPosts.map(p => `[${p.platform} - ${p.date || 'Recent'}] "${p.content || p.fullCaption}" (Topic: ${p.aiAnalysis?.topic || 'N/A'})`).join('\n') || 'No posts logged yet'}

KNOWN AI DOSSIER HIGHLIGHTS:
- Executive Summary: ${dossier.executiveSummary || 'N/A'}
- Key Interests: ${(dossier.keyInterests || []).join(', ') || 'N/A'}
- Life Triggers: ${(dossier.lifeTriggers || []).map(t => t.signal).join(', ') || 'N/A'}
- Business Risks: ${(dossier.businessRisks || []).map(r => r.risk).join(', ') || 'N/A'}

Synthesize all signals into the structured 90-Day Pre-Meeting Intelligence Brief JSON object.`;

      const response = await fetch(getGeminiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 3000
          }
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errBody}`);
      }

      const json = await response.json();
      let text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
      text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

      let briefData = null;
      try {
        briefData = JSON.parse(text);
      } catch (parseErr) {
        writeToLogFile(`[IPC] generate-client-meeting-brief parse warning: ${parseErr.message}`);
        briefData = {
          executiveSummary90Days: `Recent profile review for ${client.fullName} at ${client.companyName || 'their current organization'}.`,
          recentMilestones: [],
          conversationHooks: [
            {
              hookTitle: "Career & General Check-in",
              rapportScript: `Hi ${client.preferredName || client.fullName}, great catching up! How have things been progressing at ${client.companyName || 'work'} recently?`,
              transitionToAdvisory: "Review how recent career milestones affect overall financial goals."
            }
          ],
          recommendedAgenda: [
            { order: 1, agendaItem: "Portfolio & Coverage Review", duration: "15 mins", focus: "Confirm in-force policies and adequacy" },
            { order: 2, agendaItem: "Wealth & Retirement Projections", duration: "20 mins", focus: "Evaluate lifetime capital runway" }
          ],
          planningOpportunities: [
            { domain: "Protection", priority: "High", recommendation: "Comprehensive coverage checkup", rationale: "Ensure policy coverage is up to date" }
          ],
          meetingPrepNoteText: `90-Day Meeting Prep for ${client.fullName}\n- Review career & business updates\n- Review existing in-force policies\n- Address any protection gaps`
        };
      }

      return { success: true, brief: briefData, generatedAt: new Date().toISOString() };
    } catch (error) {
      writeToLogFile(`[IPC] generate-client-meeting-brief failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  // Client Financial Planning IPC Handlers
  ipcMain.handle('save-client-financial-plan', (event, clientId, planData) => {
    writeToLogFile(`[IPC] save-client-financial-plan started for client ID: ${clientId}`);
    try {
      if (!clientId) throw new Error("Client ID is required");
      const index = db.clients.findIndex(c => c.id === clientId);
      if (index === -1) throw new Error("Client not found");

      db.clients[index] = {
        ...db.clients[index],
        financialPlan: {
          ...planData,
          updatedAt: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      };
      saveDatabase();
      writeToLogFile(`[IPC] save-client-financial-plan saved successfully for ${db.clients[index].fullName}`);
      return { success: true, client: db.clients[index] };
    } catch (error) {
      writeToLogFile(`[IPC] save-client-financial-plan failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('generate-financial-plan-ai-summary', async (event, payload) => {
    try {
      const { client, planData, policies, focusArea, advisorCustomNotes } = payload || {};
      if (!client) throw new Error("Client data is required");

      const systemInstruction = `You are a qualified Financial Planner holding CFP® / ChFC® credentials.
Your goal is to produce a comprehensive, clear, and professional financial plan.
Analyze the client's financial position, cash flow, retirement projections, asset allocation, insurance coverage, CPF LIFE options, and life event scenarios.
Keep the tone professional, objective, supportive, and clear. Avoid overly dramatic, buzzword-heavy, or exaggerated marketing language.

Address the user's selected Focus Area (${focusArea || 'Holistic Comprehensive Plan'}) and directly address any specific scenario queries or requests submitted by the advisor.

You MUST return your response as a valid, single JSON object without any markdown code block wrap (no \`\`\`json).
The JSON structure MUST match this exact schema:
{
  "executiveSummary": "2-3 clear, professional sentences summarizing their overall financial position, cash flow, and retirement readiness.",
  "financialHealthScore": 82,
  "retirementReadinessScore": 79,
  "protectionHealthScore": 68,
  "retirementStatus": "On Track / Needs Adjustment / Critical Attention",
  "focusArea": "${focusArea || 'Holistic Comprehensive Plan'}",
  "focusAnalysis": {
    "title": "Scenario Analysis & Focus Area",
    "assessment": "Detailed 2-3 sentence analysis specifically addressing the advisor's question or the chosen focus area.",
    "tradeOffs": [
      "Key consideration 1 (e.g. Retiring 5 years earlier requires an additional $1,200/month in savings or a higher investment return)",
      "Key consideration 2"
    ],
    "actionableFix": "Specific adjustment recommended to help achieve the client's objective."
  },
  "keyStrengths": [
    "Strength 1 (e.g. Consistent 35% savings rate supporting long-term wealth accumulation)",
    "Strength 2 (e.g. Emergency fund covers 6 months of living expenses)"
  ],
  "criticalRisksAndGaps": [
    "Area for improvement 1 (e.g. Critical Illness coverage is $150k below the recommended benchmark)",
    "Area for improvement 2 (e.g. High cash balance subject to inflation drag over long horizons)"
  ],
  "strategicRecommendations": [
    {
      "priority": "High / Medium / Low",
      "category": "Retirement / Protection / Wealth Accumulation / Estate Planning",
      "action": "Clear, practical recommendation title",
      "rationale": "1-2 sentences explaining the rationale and expected impact.",
      "implementationSteps": "Practical next steps for the client and advisor."
    }
  ],
  "cpfAndAnnuityOptimization": "2-3 sentences advising on the CPF LIFE plan (Standard vs Escalating vs Basic), retirement sum target (FRS vs ERS), and payout start age (65 vs 70).",
  "stressTestInsights": "2-3 sentences assessing how the client's plan withstands simulated life events and key risk mitigations.",
  "clientDiscussionPrompt": "A professional and conversational opening question for the financial advisor to use during the client review meeting."
}`;

      const promptText = `Please analyze the following client financial plan profile:

CLIENT PROFILE:
- Full Name: ${client.fullName} (${client.preferredName || ''})
- Age: ${planData?.profile?.currentAge || 35} | Target Retirement Age: ${planData?.profile?.targetRetirementAge || 62} | Life Expectancy: ${planData?.profile?.lifeExpectancy || 88}

ADVISOR FOCUS & CUSTOM SCENARIO QUERY:
- Priority Focus Area: ${focusArea || 'Holistic 360° Comprehensive'}
- Advisor Scenario Notes / Specific Client Query: ${advisorCustomNotes ? `"${advisorCustomNotes}"` : 'None provided — provide general holistic optimization.'}

CASH FLOW & BALANCE SHEET:
- Monthly Earned Income: $${planData?.cashflow?.monthlyEarnedIncome || 0}
- Monthly Passive Income: $${planData?.cashflow?.monthlyPassiveIncome || 0}
- Monthly Living Expenses: $${planData?.cashflow?.monthlyLivingExpenses || 0}
- Monthly Debt/Commitments: $${planData?.cashflow?.monthlyCommitments || 0}
- Monthly Surplus / Net Savings: $${planData?.cashflow?.monthlySurplus || 0} (${planData?.cashflow?.savingsRate || 0}% Savings Rate)
- Total Liquid Assets: $${planData?.balanceSheet?.liquidAssets || 0}
- Total Invested Assets: $${planData?.balanceSheet?.investedAssets || 0}
- Singapore CPF Breakdown:
  * CPF Ordinary Account (OA): $${planData?.balanceSheet?.cpfOA || 0} (2.5% p.a.)
  * CPF Special Account (SA): $${planData?.balanceSheet?.cpfSA || 0} (4.0% - 5.0% p.a.)
  * CPF Retirement Account (RA): $${planData?.balanceSheet?.cpfRA || 0} (4.0% - 6.0% p.a.)
  * CPF MediSave Account (MA): $${planData?.balanceSheet?.cpfMA || 0} (4.0% p.a.)
  * Supplementary Retirement Scheme (SRS): $${planData?.balanceSheet?.srs || 0} (Tax-Deferred Account)
  * Total CPF & SRS Combined: $${planData?.balanceSheet?.pensionAssets || 0}
- Property Value: $${planData?.balanceSheet?.propertyValue || 0} (Mortgage Outstanding: $${planData?.balanceSheet?.outstandingMortgage || 0})
- Estimated Net Worth: $${planData?.balanceSheet?.totalNetWorth || 0}

RETIREMENT PROJECTION PARAMETERS:
- Desired Monthly Retirement Income: $${planData?.retirement?.desiredMonthlyIncome || 4000}/mth (in today's dollars)
- Expected CPF Life / Pension: $${planData?.retirement?.expectedAnnuityPensions || 0}/mth
- Inflation Assumption: ${planData?.retirement?.inflationRate || 3.0}% p.a.
- Pre-Retirement Return: ${planData?.retirement?.preRetireReturn || 6.5}% | Post-Retirement Return: ${planData?.retirement?.postRetireReturn || 4.5}%
- Projected Capital at Retirement: $${planData?.retirement?.projectedNestEgg || 0}
- Longevity Result: ${planData?.retirement?.runwayStatus || 'Sustains past age 90'} (Depletion Age if any: ${planData?.retirement?.depletionAge || 'None'})

INSURANCE PROTECTION GAP MATRIX:
- In-Force Life/Death Cover: $${planData?.protection?.existingDeath || 0} (Recommended Need: $${planData?.protection?.recommendedDeath || 0})
- In-Force TPD Cover: $${planData?.protection?.existingTpd || 0} (Recommended Need: $${planData?.protection?.recommendedTpd || 0})
- In-Force Early CI Cover: $${planData?.protection?.existingEarlyCi || 0} (Recommended Need: $${planData?.protection?.recommendedEarlyCi || 0})
- In-Force Major CI Cover: $${planData?.protection?.existingMajorCi || 0} (Recommended Need: $${planData?.protection?.recommendedMajorCi || 0})
- In-Force Disability Income: $${planData?.protection?.existingDisability || 0}/mth (Recommended Need: $${planData?.protection?.recommendedDisability || 0}/mth)
- Hospital Shield Plan: ${planData?.protection?.hasShield ? 'In Force' : 'None / Not recorded'}

IN-FORCE INSURANCE POLICIES SCHEDULE:
${(policies || []).map((p, idx) => `${idx + 1}. [${p.status || 'In Force'}] ${p.insurer || 'Insurer'} - ${p.policyName || 'Plan'} (Type: ${p.policyType || 'General'}, Policy #: ${p.policyNumber || 'N/A'}, Premium: $${p.premium || 0}/${p.premiumFrequency || 'yr'}, Coverages: ${JSON.stringify(p.coverages || {})})`).join('\n') || 'No policies currently recorded'}

ACTIVE SIMULATED LIFE EVENTS / STRESS TESTS:
${(planData?.lifeEvents || []).filter(e => e.active).map(e => `- [ACTIVE] ${e.title} at Age ${e.triggerAge}: ${e.description} (Impact: Lump sum $${e.lumpSumCost || 0}, Monthly cashflow delta $${e.monthlyDelta || 0} for ${e.durationYears || 1} years)`).join('\n') || 'None active (baseline scenario)'}

Synthesize an institutional CFP® / ChFC® / CFA® standard advisory blueprint in the required JSON format.`;

      const response = await fetch(getGeminiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 3500
          }
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errBody}`);
      }

      const json = await response.json();
      let text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
      text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

      let planSummary = null;
      try {
        planSummary = JSON.parse(text);
      } catch (parseErr) {
        writeToLogFile(`[IPC] generate-financial-plan-ai-summary parse warning: ${parseErr.message}`);
        planSummary = {
          executiveSummary: text,
          financialHealthScore: 80,
          retirementReadinessScore: 75,
          protectionHealthScore: 70,
          retirementStatus: "Needs Adjustment",
          focusArea: focusArea || "Holistic 360° Comprehensive",
          focusAnalysis: {
            title: "Strategic Focus & Scenario Analysis",
            assessment: advisorCustomNotes ? `Evaluating client scenario: "${advisorCustomNotes}". Adjusting capital growth and savings timeline to preserve lifetime solvency.` : "Holistic review of wealth accumulation, protection, and retirement readiness.",
            tradeOffs: ["Balancing near-term lifestyle goals against long-term capital preservation", "Managing portfolio allocation to mitigate inflation drag"],
            actionableFix: "Align monthly savings and optimize CPF LIFE commencement age."
          },
          keyStrengths: ["Strong commitment to structured financial planning", "Consistent regular monthly savings habit"],
          criticalRisksAndGaps: ["Protection gap in critical illness coverage", "Inflation risk on uninvested cash reserves"],
          strategicRecommendations: [
            {
              priority: "High",
              category: "Protection",
              action: "Bridge Critical Illness Coverage Gap",
              rationale: "Shields living expenses and medical contingencies from depleting retirement capital.",
              implementationSteps: "Review multi-pay CI options to secure comprehensive coverage."
            },
            {
              priority: "High",
              category: "Retirement",
              action: "Optimize CPF LIFE & Guaranteed Annuity Floor",
              rationale: "Establishes a solid inflation-hedged foundation for retirement living.",
              implementationSteps: "Target Full Retirement Sum (FRS) or Enhanced Retirement Sum (ERS) top-ups."
            }
          ],
          cpfAndAnnuityOptimization: "Consider the Escalating Plan for inflation protection, or Standard Plan for maximum initial liquidity at Age 65.",
          stressTestInsights: "Under stress testing, proactive protection preserves capital longevity.",
          clientDiscussionPrompt: `Let's walk through how fine-tuning your savings allocation and locking in your critical illness safety net will guarantee your retirement freedom at age ${planData?.profile?.targetRetirementAge || 62}.`
        };
      }

      return { success: true, planSummary };
    } catch (error) {
      writeToLogFile(`[IPC] generate-financial-plan-ai-summary failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('generate-projection-graph-breakdown', async (event, payload) => {
    try {
      const { client, planData, projectionData, lifeEvents } = payload || {};
      if (!client) throw new Error("Client data is required");

      const systemInstruction = `You are a qualified Financial Planner.
Your task is to provide a clear, professional breakdown of how a client's retirement projection was calculated.

You MUST return your response as a valid, single JSON object without any markdown code block wrap (no \`\`\`json).
The JSON structure MUST match this exact schema:
{
  "executiveNarrative": "3-4 concise sentences summarizing the overall trajectory: starting capital, growth during working years, peak balance at retirement, and drawdown through retirement.",
  "accumulationPhaseBreakdown": {
    "summary": "Clear explanation of compound growth and regular savings contributions during the accumulation years.",
    "growthDriver": "Explanation of the assumed pre-retirement return rate and its compounding effect.",
    "savingsVelocity": "Review of the monthly savings contributions towards retirement goals."
  },
  "decumulationPhaseBreakdown": {
    "summary": "Clear explanation of retirement withdrawals, inflation adjustments, and net drawdown during retirement.",
    "inflationDrag": "Explanation of how inflation impacts living expenses over time.",
    "annuityOffset": "Explanation of how CPF Life / pensions cushion the monthly withdrawal demand.",
    "longevitySolvency": "Clear evaluation of whether the capital sustains past life expectancy or when it depletes."
  },
  "stressTestingImpact": "2-3 sentences explaining how simulated life events (if any) created capital shocks or shifted the trajectory.",
  "advisorConsultationTalkingPoints": [
    "Talking point 1 explaining a key mathematical or strategic inflection point",
    "Talking point 2 recommending an action or adjustment to optimize longevity"
  ]
}`;

      const promptText = `Please provide an actuarial and strategic breakdown of the following lifetime financial simulation:

CLIENT: ${client.fullName}
Current Age: ${planData?.profile?.currentAge || 30} | Target Retirement Age: ${planData?.profile?.targetRetirementAge || 65} | Life Expectancy: ${planData?.profile?.lifeExpectancy || 85}

STARTING CAPITAL:
- Total Liquid & Invested Assets: $${(Number(planData?.balanceSheet?.liquidCash) || 0) + (Number(planData?.balanceSheet?.investedAssets) || 0)}
- Annual Savings (Pre-Retirement): $${(Number(planData?.cashflow?.monthlySurplus) || 0) * 12}/year ($${planData?.cashflow?.monthlySurplus || 0}/mo)

RATES & ASSUMPTIONS:
- Pre-Retirement Return: ${planData?.profile?.preRetireReturn || 6.0}% p.a.
- Post-Retirement Return: ${planData?.profile?.postRetireReturn || 4.0}% p.a.
- Inflation Rate: ${planData?.profile?.inflationRate || 3.0}% p.a.

RETIREMENT WITHDRAWALS:
- Desired Living at Retirement (in today's dollars): $${planData?.retirementTarget?.desiredMonthlyIncome || 0}/mo
- Expected CPF Life / Pension: $${planData?.retirementTarget?.expectedAnnuityPensions || 0}/mo

PROJECTION METRICS:
- Peak Capital at Retirement: $${projectionData?.peakCapital || 0}
- Baseline Depletion Age: ${projectionData?.depletedAtAge ? `Age ${projectionData.depletedAtAge}` : 'Sustains past life expectancy'}
- Active Stress Events: ${(lifeEvents || []).filter(e => e.active).map(e => `${e.title} at Age ${e.triggerAge} (Lump sum: $${e.lumpSumCost || 0}, Monthly delta: $${e.monthlyDelta || 0})`).join(', ') || 'None (Baseline)'}

Generate a clear, authoritative, and educational actuarial breakdown.`;

      const response = await fetch(getGeminiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 3000
          }
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errBody}`);
      }

      const json = await response.json();
      let text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
      text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

      let breakdown = null;
      try {
        breakdown = JSON.parse(text);
      } catch (parseErr) {
        writeToLogFile(`[IPC] generate-projection-graph-breakdown parse warning: ${parseErr.message}`);
        breakdown = {
          executiveNarrative: `The projection models lifetime capital growth starting with initial assets and annual savings compounding at ${planData?.profile?.preRetireReturn || 6}%, peaking at age ${planData?.profile?.targetRetirementAge || 65}, before entering the decumulation phase to fund living expenses adjusted for ${planData?.profile?.inflationRate || 3}% inflation.`,
          accumulationPhaseBreakdown: {
            summary: `During the accumulation phase from age ${planData?.profile?.currentAge || 30} to ${planData?.profile?.targetRetirementAge || 65}, your liquid portfolio grows via regular savings and compound returns.`,
            growthDriver: `Portfolio compounding generates exponential growth over the investment horizon.`,
            savingsVelocity: `Regular surplus allocations steadily boost capital accumulation.`
          },
          decumulationPhaseBreakdown: {
            summary: `In retirement, withdrawals offset by CPF Life supply monthly income, while remaining assets continue generating moderate yields.`,
            inflationDrag: `Inflation increases living costs over time, requiring growing gross payouts.`,
            annuityOffset: `CPF Life and guaranteed pensions provide a steady foundation that cushions portfolio drawdowns.`,
            longevitySolvency: projectionData?.depletedAtAge ? `Capital sustains until age ${projectionData.depletedAtAge}.` : `Capital sustains past life expectancy.`
          },
          stressTestingImpact: (lifeEvents || []).some(e => e.active) ? "Simulated life events test portfolio resilience against unexpected cashflow disruptions." : "No active stress events applied.",
          advisorConsultationTalkingPoints: [
            `Maintain consistent pre-retirement savings to maximize compound growth.`,
            `Leverage CPF LIFE to establish an inflation-resilient floor for retirement expenses.`
          ]
        };
      }

      return { success: true, breakdown };
    } catch (error) {
      writeToLogFile(`[IPC] generate-projection-graph-breakdown failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  function generateFinancialPlanReportHtml(payload) {
    const {
      client = {},
      profile = {},
      cashflow = {},
      balanceSheet = {},
      retirement = {},
      policies = [],
      inForceCoverage = {},
      recommendedCoverage = {},
      protectionScore = 70,
      goals = [],
      lifeEvents = [],
      aiSummary = {},
      focusArea = 'holistic',
      advisorCustomNotes = '',
      consultantSettings = null
    } = payload || {};

    const consultant = consultantSettings || (db && db.appSettings) || {};
    const consultantName = consultant.consultantName || 'Advisory Consultant';
    const consultantTitle = consultant.consultantTitle || 'Senior Financial Consultant';
    const repNumber = consultant.repNumber || '';
    const consultantEmail = consultant.email || '';
    const consultantPhone = consultant.phone || '';
    const reportHeaderBranding = consultant.reportHeaderBranding || 'FINANCIAL PLANNING REPORT';
    const reportSubtitle = consultant.reportSubtitle || '';
    const credentialsList = (consultant.credentials && consultant.credentials.length > 0) ? consultant.credentials.join(' • ') : 'CFP® / ChFC® Framework';

    const formatCur = (val) => {
      if (val === undefined || val === null || isNaN(val) || val === '') return '$0';
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(val) || 0);
    };

    const clientName = client.fullName || 'Valued Client';
    const clientPreferred = client.preferredName ? ` (${client.preferredName})` : '';
    const currentAge = profile.currentAge || 35;
    const targetRetireAge = profile.targetRetirementAge || 62;
    const lifeExpectancy = profile.lifeExpectancy || 88;
    const yearsToRetire = Math.max(0, targetRetireAge - currentAge);
    const yearsInRetire = Math.max(0, lifeExpectancy - targetRetireAge);
    const reportDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const focusLabel = (focusArea || 'holistic').toUpperCase().replace(/_/g, ' ');

    const totalLiquid = Number(balanceSheet.liquidCash || balanceSheet.totalLiquid) || 0;
    const totalInvested = Number(balanceSheet.investedAssets || balanceSheet.totalInvested) || 0;
    const totalCpfOA = Number(balanceSheet.cpfOA || balanceSheet.totalCpfOA) || 0;
    const totalCpfSA = Number(balanceSheet.cpfSA || balanceSheet.totalCpfSA) || 0;
    const totalCpfRA = Number(balanceSheet.cpfRA || balanceSheet.totalCpfRA) || 0;
    const totalCpfMA = Number(balanceSheet.cpfMA || balanceSheet.totalCpfMA) || 0;
    const totalCpf = totalCpfOA + totalCpfSA + totalCpfRA + totalCpfMA;
    const totalSrs = Number(balanceSheet.srs || balanceSheet.totalSrs) || 0;
    const totalPension = totalCpf + totalSrs > 0 ? (totalCpf + totalSrs) : (Number(balanceSheet.pensionCpf || balanceSheet.pensionAssets) || 0);
    const totalProperty = Number(balanceSheet.propertyValue || balanceSheet.totalProperty) || 0;
    const totalMortgage = Number(balanceSheet.outstandingMortgage || balanceSheet.totalMortgage) || 0;
    const totalOtherDebt = Number(balanceSheet.otherLiabilities || balanceSheet.totalOtherDebt) || 0;
    const totalFinancialAssets = totalLiquid + totalInvested + totalPension;
    const totalAssets = totalFinancialAssets + totalProperty;
    const totalLiabilities = totalMortgage + totalOtherDebt;
    const totalNetWorth = Number(balanceSheet.totalNetWorth) || (totalAssets - totalLiabilities);

    const monthlyInflow = (Number(cashflow.monthlyEarnedIncome) || 0) + (Number(cashflow.monthlyPassiveIncome) || 0);
    const monthlyOutflow = (Number(cashflow.monthlyLivingExpenses) || 0) + (Number(cashflow.monthlyCommitments) || 0);
    const monthlySurplus = Number(cashflow.monthlySurplus) || (monthlyInflow - monthlyOutflow);
    const savingsRate = cashflow.savingsRate !== undefined ? cashflow.savingsRate : (monthlyInflow > 0 ? Math.round((monthlySurplus / monthlyInflow) * 100) : 0);
    const annualSavings = monthlySurplus * 12;
    const liquidEmergencyMonths = (Number(cashflow.monthlyLivingExpenses) || 0) > 0 ? (totalLiquid / Number(cashflow.monthlyLivingExpenses)).toFixed(1) : '0.0';

    const healthScore = aiSummary.financialHealthScore || 82;
    const retireScore = aiSummary.retirementReadinessScore || 79;
    const protectScore = aiSummary.protectionHealthScore || protectionScore || 72;

    const strategicRecs = aiSummary.strategicRecommendations || [];
    const strengths = aiSummary.keyStrengths || [];
    const vulnerabilities = aiSummary.criticalRisksAndGaps || [];
    const focusAnalysis = aiSummary.focusAnalysis || null;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Strategic Financial Advisory Report - ${clientName}</title>
<style>
  @page {
    size: A4 portrait;
    margin: 12mm 15mm 15mm 15mm;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1E293B;
    background-color: #FFFFFF;
    margin: 0;
    padding: 0;
    font-size: 11px;
    line-height: 1.45;
  }
  .pdf-page {
    page-break-after: always;
    min-height: 262mm;
    position: relative;
    padding-bottom: 25px;
    display: flex;
    flex-direction: column;
  }
  .pdf-page:last-child {
    page-break-after: auto;
  }
  .running-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1.5px solid #0F172A;
    padding-bottom: 5px;
    margin-bottom: 12px;
    font-size: 8.5px;
    font-weight: 700;
    color: #0F172A;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .running-header .brand {
    color: #0F172A;
  }
  .running-header .doc-type {
    color: #B45309;
  }
  .running-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #E2E8F0;
    padding-top: 5px;
    font-size: 8px;
    color: #64748B;
  }
  .cover-container {
    padding: 24px 0 10px 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    min-height: 255mm;
  }
  .section-title {
    font-size: 12.5px;
    font-weight: 700;
    color: #0F172A;
    border-left: 3.5px solid #2563EB;
    padding-left: 8px;
    margin-top: 6px;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  table.doc-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 6px;
    margin-bottom: 10px;
    font-size: 10px;
  }
  table.doc-table th {
    background-color: #0F172A;
    color: #FFFFFF;
    font-weight: 600;
    text-align: left;
    padding: 6px 8px;
    font-size: 9.5px;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }
  table.doc-table td {
    padding: 5.5px 8px;
    border-bottom: 1px solid #E2E8F0;
    color: #334155;
  }
  table.doc-table tr:nth-child(even) td {
    background-color: #F8FAFC;
  }
  .card-box {
    border: 1px solid #E2E8F0;
    border-radius: 6px;
    padding: 10px 12px;
    background-color: #FFFFFF;
    margin-bottom: 10px;
  }
  .badge-high {
    background-color: #FEE2E2;
    color: #DC2626;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 8.5px;
  }
  .badge-medium {
    background-color: #FEF3C7;
    color: #D97706;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 8.5px;
  }
  .badge-success {
    background-color: #D1FAE5;
    color: #059669;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 8.5px;
  }
  .badge-primary {
    background-color: #DBEAFE;
    color: #1E40AF;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 8.5px;
  }
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  .grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
</style>
</head>
<body>

<!-- ══════════════════════════════════════════════════════════════════
     PAGE 1: COVER PAGE
══════════════════════════════════════════════════════════════════ -->
<div class="pdf-page">
  <div class="cover-container">
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0F172A; padding-bottom: 12px; margin-bottom: 28px;">
        <div>
          <div style="font-size: 13px; font-weight: 800; color: #0F172A; letter-spacing: 1.2px; text-transform: uppercase;">
            ${reportHeaderBranding}
          </div>
          ${reportSubtitle ? `<div style="font-size: 9px; color: #475569; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 2px;">${reportSubtitle}</div>` : ''}
        </div>
        <div style="text-align: right;">
          <span style="display: inline-block; background-color: #F1F5F9; color: #334155; border: 1px solid #CBD5E1; font-size: 8px; font-weight: 700; padding: 4px 8px; border-radius: 4px; letter-spacing: 0.5px;">
            CONFIDENTIAL FINANCIAL REPORT
          </span>
        </div>
      </div>

      <div style="margin-top: 36px; margin-bottom: 30px;">
        <div style="display: inline-block; background-color: #EFF6FF; border-left: 3px solid #2563EB; padding: 4px 10px; font-size: 9px; font-weight: 700; color: #1E40AF; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 12px;">
          Comprehensive Financial Plan
        </div>
        <h1 style="font-size: 24px; font-weight: 800; color: #0F172A; line-height: 1.25; margin: 0 0 10px 0; letter-spacing: -0.3px;">
          COMPREHENSIVE FINANCIAL PLAN<br>& RETIREMENT PROJECTION
        </h1>
        <p style="font-size: 11.5px; color: #475569; margin: 0; line-height: 1.55; max-width: 580px;">
          A comprehensive financial review covering wealth accumulation, retirement planning with Singapore CPF LIFE, cash flow management, and insurance protection.
        </p>
      </div>

      <!-- Client & Advisor Particulars Card -->
      <div style="background-color: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
        <div style="font-size: 9px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 10px; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px;">
          Client Profile & Plan Details
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 10.5px;">
          <div>
            <span style="color: #64748B; font-size: 9px; display: block;">Prepared For:</span>
            <strong style="font-size: 12.5px; color: #0F172A;">${clientName}${clientPreferred}</strong>
          </div>
          <div>
            <span style="color: #64748B; font-size: 9px; display: block;">Prepared By:</span>
            <strong style="font-size: 12px; color: #0F172A;">${consultantName}</strong>
            ${consultantTitle ? `<span style="display: block; font-size: 9px; color: #64748B;">${consultantTitle}</span>` : ''}
          </div>
          <div>
            <span style="color: #64748B; font-size: 9px; display: block;">Current Age & Horizon:</span>
            <strong style="color: #0F172A;">Age ${currentAge} (Target Retirement: Age ${targetRetireAge} • ${yearsToRetire} yrs)</strong>
          </div>
          <div>
            <span style="color: #64748B; font-size: 9px; display: block;">Representative / License No:</span>
            <strong style="color: #0F172A;">${repNumber || 'Registered Representative'}</strong>
          </div>
          <div>
            <span style="color: #64748B; font-size: 9px; display: block;">Date of Assessment:</span>
            <strong style="color: #0F172A;">${reportDate}</strong>
          </div>
          <div>
            <span style="color: #64748B; font-size: 9px; display: block;">Professional Designations:</span>
            <strong style="color: #2563EB;">${credentialsList}</strong>
          </div>
          <div>
            <span style="color: #64748B; font-size: 9px; display: block;">Focus Area:</span>
            <strong style="color: #0F172A;">${focusLabel}</strong>
          </div>
          <div>
            <span style="color: #64748B; font-size: 9px; display: block;">Contact:</span>
            <span style="color: #334155; font-size: 9px;">${consultantPhone ? `Tel: ${consultantPhone}` : ''}${consultantEmail ? ` • ${consultantEmail}` : ''}</span>
          </div>
        </div>
      </div>

      <!-- Table of Contents -->
      <div style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 12px 16px; background-color: #FFFFFF;">
        <div style="font-size: 9px; font-weight: 700; color: #0F172A; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px;">
          Table of Contents
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 9.5px; color: #334155;">
          <div><strong>1.</strong> Executive Summary & Key Indicators</div>
          <div><strong>4.</strong> Retirement Planning & CPF Projections</div>
          <div><strong>2.</strong> Net Worth Statement & Balance Sheet</div>
          <div><strong>5.</strong> Insurance Policies & Coverage Analysis</div>
          <div><strong>3.</strong> Cash Flow & Savings Analysis</div>
          <div><strong>6.</strong> Action Plan & Next Steps</div>
        </div>
      </div>
    </div>

    <!-- Confidentiality Notice at bottom of cover -->
    <div style="font-size: 8px; color: #94A3B8; text-align: center; border-top: 1px solid #E2E8F0; padding-top: 8px;">
      Strictly Private & Confidential • Prepared by ${consultantName} © ${new Date().getFullYear()}
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════════════════
     PAGE 2: EXECUTIVE SUMMARY & KEY INDICATORS
══════════════════════════════════════════════════════════════════ -->
<div class="pdf-page">
  <div class="running-header">
    <span class="brand">${reportHeaderBranding}</span>
    <span class="doc-type">Financial Planning Report • Section 1</span>
  </div>

  <div class="section-title">1. Executive Summary & Key Financial Indicators</div>

  <!-- Key Indicators Bar -->
  <div class="grid-3" style="margin-bottom: 12px;">
    <div style="border: 1px solid #CBD5E1; border-radius: 6px; padding: 10px 12px; background-color: #F8FAFC; text-align: center;">
      <div style="font-size: 8.5px; font-weight: 700; color: #64748B; text-transform: uppercase;">Overall Financial Health</div>
      <div style="font-size: 20px; font-weight: 800; color: #7C3AED; margin: 2px 0;">${healthScore}<span style="font-size: 11px; color: #94A3B8; font-weight: 400;"> / 100</span></div>
      <span class="badge-primary">Good Standing</span>
    </div>

    <div style="border: 1px solid #CBD5E1; border-radius: 6px; padding: 10px 12px; background-color: #F8FAFC; text-align: center;">
      <div style="font-size: 8.5px; font-weight: 700; color: #64748B; text-transform: uppercase;">Retirement Readiness</div>
      <div style="font-size: 20px; font-weight: 800; color: #059669; margin: 2px 0;">${retireScore}<span style="font-size: 11px; color: #94A3B8; font-weight: 400;"> / 100</span></div>
      <span class="badge-success">${aiSummary.retirementStatus || 'On Track'}</span>
    </div>

    <div style="border: 1px solid #CBD5E1; border-radius: 6px; padding: 10px 12px; background-color: #F8FAFC; text-align: center;">
      <div style="font-size: 8.5px; font-weight: 700; color: #64748B; text-transform: uppercase;">Insurance Coverage</div>
      <div style="font-size: 20px; font-weight: 800; color: #2563EB; margin: 2px 0;">${protectScore}<span style="font-size: 11px; color: #94A3B8; font-weight: 400;"> / 100</span></div>
      <span class="badge-primary">${policies.length} Policies in Force</span>
    </div>
  </div>

  <!-- Executive Summary narrative -->
  <div class="card-box" style="background-color: #F8FAFC; border-left: 3.5px solid #7C3AED;">
    <div style="font-size: 10px; font-weight: 700; color: #0F172A; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.4px;">
      Executive Summary & Financial Position
    </div>
    <p style="font-size: 10px; color: #334155; margin: 0; line-height: 1.55;">
      ${aiSummary.executiveSummary || 'The client maintains a stable financial position with positive regular cash flow. Strategic CPF contributions and addressing critical illness protection shortfalls will improve overall long-term financial resilience.'}
    </p>
  </div>

  <!-- Focus Area & Scenario Analysis -->
  ${focusAnalysis ? `
  <div class="card-box" style="border-left: 3.5px solid #2563EB; background-color: #F0F9FF;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
      <strong style="font-size: 10px; color: #1E40AF; text-transform: uppercase;">
        Scenario Analysis & Focus Area: ${focusAnalysis.title || focusLabel}
      </strong>
    </div>
    ${advisorCustomNotes ? `<div style="font-size: 9px; color: #475569; font-style: italic; margin-bottom: 6px; background-color: #FFFFFF; padding: 4px 8px; border-radius: 4px; border: 1px solid #BAE6FD;">"Client Query: ${advisorCustomNotes}"</div>` : ''}
    <p style="font-size: 9.5px; color: #1E293B; margin: 0 0 6px 0; line-height: 1.5;">
      ${focusAnalysis.assessment || ''}
    </p>
    ${focusAnalysis.tradeOffs && focusAnalysis.tradeOffs.length > 0 ? `
    <div style="font-size: 9px; color: #334155; margin-bottom: 6px;">
      <strong style="color: #B45309;">Key Considerations & Trade-Offs:</strong>
      <ul style="margin: 2px 0 0 0; padding-left: 16px;">
        ${focusAnalysis.tradeOffs.map(t => `<li>${t}</li>`).join('')}
      </ul>
    </div>` : ''}
    ${focusAnalysis.actionableFix ? `
    <div style="font-size: 9px; font-weight: 600; color: #059669; background-color: #D1FAE5; padding: 4px 8px; border-radius: 4px;">
      Recommended Action: ${focusAnalysis.actionableFix}
    </div>` : ''}
  </div>` : ''}

  <!-- Strengths vs Vulnerabilities -->
  <div class="grid-2">
    <div class="card-box" style="border-top: 3px solid #059669;">
      <div style="font-size: 9.5px; font-weight: 700; color: #059669; margin-bottom: 6px; text-transform: uppercase;">
        Financial Strengths
      </div>
      <ul style="margin: 0; padding-left: 16px; font-size: 9px; color: #334155; line-height: 1.5;">
        ${strengths.length > 0 ? strengths.map(s => `<li>${s}</li>`).join('') : '<li>Consistent monthly savings surplus generation.</li><li>CPF balances providing a steady foundation for retirement.</li>'}
      </ul>
    </div>

    <div class="card-box" style="border-top: 3px solid #D97706;">
      <div style="font-size: 9.5px; font-weight: 700; color: #B45309; margin-bottom: 6px; text-transform: uppercase;">
        Key Considerations & Areas for Improvement
      </div>
      <ul style="margin: 0; padding-left: 16px; font-size: 9px; color: #334155; line-height: 1.5;">
        ${vulnerabilities.length > 0 ? vulnerabilities.map(v => `<li>${v}</li>`).join('') : '<li>Review critical illness coverage against income benchmarks.</li><li>Ensure asset allocation is appropriately diversified against inflation.</li>'}
      </ul>
    </div>
  </div>

  <div class="running-footer">
    <span>Prepared for: ${clientName}</span>
    <span>Prepared by: ${consultantName}</span>
    <span>Page 2 of 6</span>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════════════════
     PAGE 3: STATEMENT OF NET WORTH & CASH FLOW ANALYSIS
══════════════════════════════════════════════════════════════════ -->
<div class="pdf-page">
  <div class="running-header">
    <span class="brand">${reportHeaderBranding}</span>
    <span class="doc-type">Financial Planning Report • Section 2 & 3</span>
  </div>

  <div class="section-title">2. Net Worth Statement & Balance Sheet</div>

  <table class="doc-table">
    <thead>
      <tr>
        <th style="width: 32%;">Asset / Liability Class</th>
        <th style="width: 30%;">Account / Instrument</th>
        <th style="width: 22%;">Yield / Structure</th>
        <th style="width: 16%; text-align: right;">Valuation ($)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Liquid Cash & Emergency Fund</strong></td>
        <td>Bank Deposits & High-Yield Savings</td>
        <td>Coverage: ${liquidEmergencyMonths} mos living</td>
        <td style="text-align: right; font-weight: 600;">${formatCur(totalLiquid)}</td>
      </tr>
      <tr>
        <td><strong>Investments & Capital Portfolios</strong></td>
        <td>Equities, ETFs, Unit Trusts, Bonds</td>
        <td>Assumed ${profile.preRetireReturn || 6.5}% p.a. pre-retire</td>
        <td style="text-align: right; font-weight: 600;">${formatCur(totalInvested)}</td>
      </tr>
      <tr style="background-color: #F8FAFC;">
        <td rowspan="5" style="vertical-align: top; border-right: 1px solid #E2E8F0;">
          <strong>Singapore CPF & SRS Portfolio</strong><br>
          <span style="font-size: 8.5px; color: #64748B;">Total: ${formatCur(totalPension)}</span>
        </td>
        <td>CPF Ordinary Account (OA)</td>
        <td>2.5% p.a. (Housing & CPFIS)</td>
        <td style="text-align: right;">${formatCur(totalCpfOA)}</td>
      </tr>
      <tr style="background-color: #F8FAFC;">
        <td>CPF Special Account (SA)</td>
        <td>4.0% - 5.0% p.a. (Pre-55 Compounding)</td>
        <td style="text-align: right;">${formatCur(totalCpfSA)}</td>
      </tr>
      <tr style="background-color: #F8FAFC;">
        <td>CPF Retirement Account (RA)</td>
        <td>4.0% - 6.0% p.a. (Age 55+ Foundation)</td>
        <td style="text-align: right;">${formatCur(totalCpfRA)}</td>
      </tr>
      <tr style="background-color: #F8FAFC;">
        <td>CPF MediSave Account (MA)</td>
        <td>4.0% p.a. (Hospital & Shield)</td>
        <td style="text-align: right;">${formatCur(totalCpfMA)}</td>
      </tr>
      <tr style="background-color: #F8FAFC;">
        <td>Supplementary Retirement Scheme (SRS)</td>
        <td>Tax-Deferred Voluntary Account</td>
        <td style="text-align: right;">${formatCur(totalSrs)}</td>
      </tr>
      <tr>
        <td><strong>Real Estate & Property Equity</strong></td>
        <td>Primary Residential Valuation</td>
        <td>Home Equity: ${formatCur(Math.max(0, totalProperty - totalMortgage))}</td>
        <td style="text-align: right; font-weight: 600;">${formatCur(totalProperty)}</td>
      </tr>
      <tr style="background-color: #FEF2F2;">
        <td style="color: #DC2626;"><strong>Liabilities & Debt Commitments</strong></td>
        <td>Outstanding Mortgage & Personal Loans</td>
        <td>Mortgage: ${formatCur(totalMortgage)}</td>
        <td style="text-align: right; font-weight: 600; color: #DC2626;">- ${formatCur(totalLiabilities)}</td>
      </tr>
      <tr style="background-color: #ECFDF5; border-top: 2px solid #059669; font-weight: 700;">
        <td colspan="2" style="font-size: 11px; color: #065F46;">TOTAL NET WORTH</td>
        <td style="color: #065F46;">Financial Assets: ${formatCur(totalFinancialAssets)}</td>
        <td style="text-align: right; font-size: 12px; color: #065F46;">${formatCur(totalNetWorth)}</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title" style="margin-top: 16px;">3. Cash Flow & Savings Analysis</div>

  <div class="grid-4" style="margin-bottom: 10px;">
    <div style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px 10px; background-color: #F8FAFC;">
      <span style="font-size: 8px; color: #64748B; display: block; text-transform: uppercase;">Earned Monthly Income</span>
      <strong style="font-size: 12px; color: #0F172A;">${formatCur(cashflow.monthlyEarnedIncome)}</strong>
    </div>

    <div style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px 10px; background-color: #F8FAFC;">
      <span style="font-size: 8px; color: #64748B; display: block; text-transform: uppercase;">Passive Monthly Income</span>
      <strong style="font-size: 12px; color: #2563EB;">${formatCur(cashflow.monthlyPassiveIncome)}</strong>
    </div>

    <div style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px 10px; background-color: #F8FAFC;">
      <span style="font-size: 8px; color: #64748B; display: block; text-transform: uppercase;">Total Monthly Outflows</span>
      <strong style="font-size: 12px; color: #DC2626;">${formatCur(monthlyOutflow)}</strong>
    </div>

    <div style="border: 1.5px solid #A7F3D0; border-radius: 6px; padding: 8px 10px; background-color: #ECFDF5;">
      <span style="font-size: 8px; color: #065F46; display: block; text-transform: uppercase;">Net Monthly Surplus (${savingsRate}%)</span>
      <strong style="font-size: 12px; color: #059669;">${formatCur(monthlySurplus)}/mo</strong>
    </div>
  </div>

  <div class="card-box" style="font-size: 9px; color: #475569; line-height: 1.5; background-color: #F8FAFC;">
    <strong>Cash Flow Summary:</strong> The client currently maintains an estimated annual savings capacity of <strong>${formatCur(annualSavings)}/yr</strong> (${savingsRate}% savings rate). Liquid cash reserves provide approximately <strong>${liquidEmergencyMonths} months</strong> of living expense coverage (recommended guideline: 3–6 months for salaried, 6–12 months for variable income).
  </div>

  <div class="running-footer">
    <span>Prepared for: ${clientName}</span>
    <span>Prepared by: ${consultantName}</span>
    <span>Page 3 of 6</span>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════════════════
     PAGE 4: RETIREMENT PLANNING & CPF PROJECTIONS
══════════════════════════════════════════════════════════════════ -->
<div class="pdf-page">
  <div class="running-header">
    <span class="brand">${reportHeaderBranding}</span>
    <span class="doc-type">Financial Planning Report • Section 4</span>
  </div>

  <div class="section-title">4. Retirement Planning & CPF Projections</div>

  <!-- Key Metrics Bar -->
  <div class="grid-3" style="margin-bottom: 8px;">
    <div style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 6px 10px; background-color: #F8FAFC;">
      <span style="font-size: 8px; color: #64748B; text-transform: uppercase; display: block;">Target Retirement Income</span>
      <strong style="font-size: 12px; color: #0F172A;">${formatCur(retirement.desiredMonthlyIncome || 4000)}/mo</strong>
      <span style="font-size: 8px; color: #64748B; display: block;">In today's purchasing power</span>
    </div>

    <div style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 6px 10px; background-color: #F8FAFC;">
      <span style="font-size: 8px; color: #64748B; text-transform: uppercase; display: block;">Projected Nest Egg (Age ${targetRetireAge})</span>
      <strong style="font-size: 12px; color: #059669;">${formatCur(retirement.projectedNestEgg || 0)}</strong>
      <span style="font-size: 8px; color: #64748B; display: block;">${yearsToRetire} yrs compounding horizon</span>
    </div>

    <div style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 6px 10px; background-color: #F8FAFC;">
      <span style="font-size: 8px; color: #64748B; text-transform: uppercase; display: block;">Estimated CPF LIFE / Annuity Floor</span>
      <strong style="font-size: 12px; color: #2563EB;">${formatCur(retirement.expectedAnnuityPensions || 0)}/mo</strong>
      <span style="font-size: 8px; color: #64748B; display: block;">Lifelong guaranteed foundation</span>
    </div>
  </div>

  <!-- CHART 1: Net Worth & Capital Accumulation / Decumulation Runway SVG -->
  <div style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 6px 10px; background-color: #FFFFFF; margin-bottom: 8px;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
      <strong style="font-size: 9px; color: #0F172A; text-transform: uppercase;">
        Capital Accumulation & Drawdown Projection (Age ${currentAge} to ${lifeExpectancy})
      </strong>
      <span class="${retirement.isRetirementOnTrack ? 'badge-success' : 'badge-high'}">
        ${retirement.isRetirementOnTrack ? '✓ Capital Sustained Past Age ' + lifeExpectancy : '⚠️ Projected Depletion @ Age ' + (retirement.baselineDepletion || 'N/A')}
      </span>
    </div>

    ${(() => {
      const startAge = Number(currentAge) || 35;
      const retireAge = Number(targetRetireAge) || 62;
      const maxAge = Number(lifeExpectancy) || 88;
      const preYield = (Number(profile.preRetireReturn) || 6.5) / 100;
      const postYield = (Number(profile.postRetireReturn) || 4.5) / 100;
      const inflation = (Number(profile.inflationRate) || 3.0) / 100;
      const desiredMonthly = Number(retirement.desiredMonthlyIncome) || 4000;
      const annuityMonthly = Number(retirement.expectedAnnuityPensions) || 0;
      const surplus = annualSavings;

      let yearlyData = retirement.yearlyData;
      if (!yearlyData || yearlyData.length === 0) {
        let cap = totalLiquid + totalInvested;
        yearlyData = [];
        for (let a = startAge; a <= maxAge; a++) {
          const yrs = a - startAge;
          if (a < retireAge) {
            cap = (cap * (1 + preYield)) + Math.max(0, surplus);
          } else {
            const living = desiredMonthly * 12 * Math.pow(1 + inflation, yrs);
            const ann = annuityMonthly * 12 * Math.pow(1 + (inflation * 0.5), yrs);
            const drawdown = Math.max(0, living - ann);
            cap = Math.max(0, (cap * (1 + postYield)) - drawdown);
          }
          yearlyData.push({ age: a, capital: Math.round(cap) });
        }
      }

      const width = 680;
      const height = 125;
      const pad = { top: 16, right: 25, bottom: 20, left: 55 };
      const maxCap = Math.max(...yearlyData.map(d => d.capital), Number(retirement.projectedNestEgg) || 100000, 100000);

      const getX = (age) => pad.left + ((age - startAge) / Math.max(1, maxAge - startAge)) * (width - pad.left - pad.right);
      const getY = (cap) => height - pad.bottom - (Math.max(0, cap) / maxCap) * (height - pad.top - pad.bottom);
      const formatK = (v) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${Math.round(v)}`);

      const basePoints = yearlyData.map(d => `${getX(d.age).toFixed(1)},${getY(d.capital).toFixed(1)}`).join(' ');
      const retireX = getX(retireAge);
      const peakCap = Number(retirement.projectedNestEgg) || Math.max(...yearlyData.map(d => d.capital));

      const gridLines = [0, 0.5, 1.0].map(pct => {
        const v = maxCap * pct;
        const y = getY(v);
        return `<line x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="3,3" />
        <text x="${pad.left - 5}" y="${y + 3}" fill="#64748B" font-size="7.5" text-anchor="end">${formatK(v)}</text>`;
      }).join('');

      const ageStep = Math.max(5, Math.round((maxAge - startAge) / 7));
      let ageTicks = '';
      for (let a = startAge; a <= maxAge; a += ageStep) {
        const x = getX(a);
        ageTicks += `<line x1="${x}" y1="${height - pad.bottom}" x2="${x}" y2="${height - pad.bottom + 3}" stroke="#94A3B8" />
        <text x="${x}" y="${height - pad.bottom + 12}" fill="#64748B" font-size="7.5" text-anchor="middle">Age ${a}</text>`;
      }

      return `
      <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; max-height: 125px; background: #FFFFFF;" xmlns="http://www.w3.org/2000/svg">
        ${gridLines}
        ${ageTicks}
        <rect x="${retireX}" y="${pad.top}" width="${Math.max(0, width - pad.right - retireX)}" height="${height - pad.bottom - pad.top}" fill="#F8FAFC" opacity="0.7" />
        <line x1="${retireX}" y1="${pad.top}" x2="${retireX}" y2="${height - pad.bottom}" stroke="#6366F1" stroke-width="1.5" stroke-dasharray="3,3" />
        <text x="${retireX}" y="${pad.top - 4}" fill="#4F46E5" font-size="7.5" font-weight="700" text-anchor="middle">Retirement @ Age ${retireAge}</text>
        <polygon points="${getX(startAge)},${height - pad.bottom} ${basePoints} ${getX(maxAge)},${height - pad.bottom}" fill="#ECFDF5" opacity="0.6" />
        <polyline points="${basePoints}" fill="none" stroke="#059669" stroke-width="2.5" stroke-linejoin="round" />
        <circle cx="${retireX}" cy="${getY(peakCap)}" r="3" fill="#059669" stroke="#FFFFFF" stroke-width="1" />
        <text x="${Math.min(width - pad.right - 45, retireX + 6)}" y="${Math.max(pad.top + 8, getY(peakCap) - 4)}" fill="#065F46" font-size="7.5" font-weight="700">Peak: ${formatK(peakCap)}</text>
        ${retirement.baselineDepletion ? `<circle cx="${getX(retirement.baselineDepletion)}" cy="${getY(0)}" r="3.5" fill="#DC2626" />
        <text x="${getX(retirement.baselineDepletion)}" y="${getY(0) - 5}" fill="#DC2626" font-size="7.5" font-weight="700" text-anchor="middle">Depleted @ ${retirement.baselineDepletion}</text>` : ''}
      </svg>`;
    })()}

    <div style="font-size: 8.5px; color: #475569; line-height: 1.4; margin-top: 4px; padding-top: 4px; border-top: 1px dashed #E2E8F0; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
      <div>
        <strong>Accumulation Phase (Age ${currentAge} to ${targetRetireAge}):</strong> Liquid assets compounding at <strong>${profile.preRetireReturn || 6.5}% p.a.</strong> alongside annual savings of <strong>${formatCur(annualSavings)}/yr</strong> (${savingsRate}%) accumulate an estimated nest egg of <strong>${formatCur(retirement.projectedNestEgg || 0)}</strong> by age ${targetRetireAge}.
      </div>
      <div>
        <strong>Drawdown Phase (Age ${targetRetireAge} to ${lifeExpectancy}):</strong> Systematic withdrawals fund living expenses adjusted for inflation at <strong>${profile.inflationRate || 3.0}% p.a.</strong>, while remaining capital continues compounding at <strong>${profile.postRetireReturn || 4.5}% p.a.</strong>
      </div>
    </div>
  </div>

  <!-- CHART 2: Retirement Income Waterfall vs Inflated Living Costs SVG -->
  <div style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 6px 10px; background-color: #FFFFFF; margin-bottom: 8px;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
      <strong style="font-size: 9px; color: #0F172A; text-transform: uppercase;">
        Projected Retirement Income vs. Living Expenses
      </strong>
      <span style="font-size: 8px; color: #64748B;">
        Guaranteed Floor: ${formatCur(retirement.expectedAnnuityPensions || 0)}/mo
      </span>
    </div>

    ${(() => {
      const startAge = Number(currentAge) || 35;
      const retireAge = Number(targetRetireAge) || 62;
      const maxAge = Number(lifeExpectancy) || 88;
      const inflation = (Number(profile.inflationRate) || 3.0) / 100;
      const desiredMonthly = Number(retirement.desiredMonthlyIncome) || 4000;
      const annuityMonthly = Number(retirement.expectedAnnuityPensions) || 0;
      const passiveMonthly = Number(cashflow.monthlyPassiveIncome) || 0;

      const numYears = Math.max(1, maxAge - retireAge + 1);
      const retireData = [];

      for (let age = retireAge; age <= maxAge; age++) {
        const yearsFromNow = age - startAge;
        const targetLiving = (desiredMonthly * 12) * Math.pow(1 + inflation, yearsFromNow);
        const guaranteedCpf = (annuityMonthly * 12) * Math.pow(1 + (inflation * 0.5), yearsFromNow);
        const passive = passiveMonthly * 12;
        const neededDrawdown = Math.max(0, targetLiving - guaranteedCpf - passive);

        const isDepleted = retirement.baselineDepletion && age >= retirement.baselineDepletion;
        const actualDrawdown = isDepleted ? 0 : neededDrawdown;
        const shortfall = Math.max(0, targetLiving - (guaranteedCpf + passive + actualDrawdown));

        retireData.push({ age, targetLiving, guaranteedCpf, passive, actualDrawdown, shortfall });
      }

      const width = 680;
      const height = 115;
      const pad = { top: 16, right: 25, bottom: 20, left: 55 };
      const maxVal = Math.max(...retireData.map(d => Math.max(d.targetLiving, d.guaranteedCpf + d.actualDrawdown + d.shortfall)), 50000);

      const getX = (age) => pad.left + ((age - retireAge) / Math.max(1, maxAge - retireAge)) * (width - pad.left - pad.right);
      const getY = (val) => height - pad.bottom - (Math.max(0, val) / maxVal) * (height - pad.top - pad.bottom);
      const formatK = (v) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${Math.round(v)}`);

      const gridLines = [0, 0.5, 1.0].map(pct => {
        const v = maxVal * pct;
        const y = getY(v);
        return `<line x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="3,3" />
        <text x="${pad.left - 5}" y="${y + 3}" fill="#64748B" font-size="7.5" text-anchor="end">${formatK(v)}/yr</text>`;
      }).join('');

      const ageStep = Math.max(4, Math.round(numYears / 6));
      let ageTicks = '';
      for (let i = 0; i < retireData.length; i += ageStep) {
        const d = retireData[i];
        const x = getX(d.age);
        ageTicks += `<line x1="${x}" y1="${height - pad.bottom}" x2="${x}" y2="${height - pad.bottom + 3}" stroke="#94A3B8" />
        <text x="${x}" y="${height - pad.bottom + 12}" fill="#64748B" font-size="7.5" text-anchor="middle">Age ${d.age}</text>`;
      }

      const barWidth = Math.max(3.5, ((width - pad.left - pad.right) / numYears) - 2);
      let bars = '';

      retireData.forEach(d => {
        const x = getX(d.age) - (barWidth / 2);
        let currentY = height - pad.bottom;
        const hCpf = (d.guaranteedCpf / maxVal) * (height - pad.top - pad.bottom);
        const hDraw = (d.actualDrawdown / maxVal) * (height - pad.top - pad.bottom);
        const hShort = (d.shortfall / maxVal) * (height - pad.top - pad.bottom);

        if (hCpf > 0) {
          bars += `<rect x="${x}" y="${currentY - hCpf}" width="${barWidth}" height="${hCpf}" fill="#818CF8" opacity="0.9" rx="0.5" />`;
          currentY -= hCpf;
        }
        if (hDraw > 0) {
          bars += `<rect x="${x}" y="${currentY - hDraw}" width="${barWidth}" height="${hDraw}" fill="#10B981" opacity="0.9" rx="0.5" />`;
          currentY -= hDraw;
        }
        if (hShort > 0) {
          bars += `<rect x="${x}" y="${currentY - hShort}" width="${barWidth}" height="${hShort}" fill="#EF4444" opacity="0.85" rx="0.5" />`;
          currentY -= hShort;
        }
      });

      const targetPoints = retireData.map(d => `${getX(d.age).toFixed(1)},${getY(d.targetLiving).toFixed(1)}`).join(' ');

      return `
      <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; max-height: 115px; background: #FFFFFF;" xmlns="http://www.w3.org/2000/svg">
        ${gridLines}
        ${ageTicks}
        ${bars}
        <polyline points="${targetPoints}" fill="none" stroke="#D97706" stroke-width="2" stroke-dasharray="3,2" />
        <g transform="translate(${width - 260}, ${pad.top - 6})">
          <rect x="0" y="0" width="7" height="5" fill="#818CF8" />
          <text x="10" y="5" fill="#334155" font-size="7">CPF LIFE / Annuity</text>
          <rect x="80" y="0" width="7" height="5" fill="#10B981" />
          <text x="90" y="5" fill="#334155" font-size="7">Portfolio Drawdown</text>
          <line x1="165" y1="2.5" x2="175" y2="2.5" stroke="#D97706" stroke-width="1.5" stroke-dasharray="2,1" />
          <text x="179" y="5" fill="#B45309" font-size="7">Target Need</text>
        </g>
      </svg>`;
    })()}

    <div style="font-size: 8.5px; color: #475569; line-height: 1.4; margin-top: 4px; padding-top: 4px; border-top: 1px dashed #E2E8F0; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
      <div>
        <strong>Guaranteed Annuity Floor (CPF LIFE):</strong> Provides a lifelong income layer of <strong>${formatCur(retirement.expectedAnnuityPensions || 0)}/mo</strong> to cover baseline living expenses.
      </div>
      <div>
        <strong>Portfolio Drawdown & Longevity:</strong> Covers discretionary retirement expenses. Solvency Status: <strong style="color: ${retirement.isRetirementOnTrack ? '#059669' : '#DC2626'};">${retirement.isRetirementOnTrack ? '✓ Capital sustained past age ' + lifeExpectancy : '⚠️ Projected depletion at age ' + (retirement.baselineDepletion || 'N/A')}</strong>.
      </div>
    </div>
  </div>

  <!-- Singapore CPF LIFE Strategy Guidance -->
  <div class="card-box" style="border-left: 3.5px solid #7C3AED; background-color: #FAF5FF; padding: 6px 10px; margin-bottom: 0;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
      <strong style="font-size: 9px; color: #6D28D9; text-transform: uppercase;">CPF LIFE & Retirement Strategy:</strong>
      <span style="font-size: 8px; color: #7C3AED; font-weight: 600;">Escalating Plan (+2%/yr) Recommended</span>
    </div>
    <p style="font-size: 8.5px; color: #334155; margin: 0; line-height: 1.4;">
      ${aiSummary.cpfAndAnnuityOptimization || 'CPF LIFE provides a lifelong, inflation-hedged foundation. Maximizing the Retirement Account (RA) towards the Enhanced Retirement Sum (ERS) creates a secure income floor. Deferring payouts up to age 70 increases monthly payouts by ~7% per year deferred.'}
    </p>
  </div>

  <div class="running-footer">
    <span>Prepared for: ${clientName}</span>
    <span>Prepared by: ${consultantName}</span>
    <span>Page 4 of 6</span>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════════════════
     PAGE 5: INSURANCE POLICIES & COVERAGE ANALYSIS
══════════════════════════════════════════════════════════════════ -->
<div class="pdf-page">
  <div class="running-header">
    <span class="brand">${reportHeaderBranding}</span>
    <span class="doc-type">Financial Planning Report • Section 5</span>
  </div>

  <div class="section-title">5. Insurance Policies & Coverage Analysis</div>

  <div style="font-size: 9.5px; font-weight: 700; color: #0F172A; text-transform: uppercase; margin-bottom: 4px;">
    Existing Insurance Policies (${policies.length} Policies)
  </div>

  ${policies.length === 0 ? `
  <div style="padding: 12px; background-color: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 6px; text-align: center; color: #64748B; font-size: 9.5px; margin-bottom: 12px;">
    No individual insurance policies currently linked to client profile. Baseline coverage relies on national MediShield Life / CareShield Life.
  </div>` : `
  <table class="doc-table" style="margin-bottom: 14px;">
    <thead>
      <tr>
        <th style="width: 22%;">Insurer & Policy #</th>
        <th style="width: 24%;">Plan Name & Type</th>
        <th style="width: 14%;">Annual Premium</th>
        <th style="width: 10%;">Status</th>
        <th style="width: 30%;">Coverages & Sum Assured</th>
      </tr>
    </thead>
    <tbody>
      ${policies.map(p => `
      <tr>
        <td><strong>${p.insurer || 'Insurer'}</strong><br><span style="font-size: 8.5px; color: #64748B;">#${p.policyNumber || 'N/A'}</span></td>
        <td>${p.policyName || 'Plan Name'}<br><span style="font-size: 8.5px; color: #2563EB;">${p.policyType || 'General'}</span></td>
        <td>${formatCur(p.premium)} / ${p.premiumFrequency || 'yr'}</td>
        <td><span class="${p.status === 'In Force' ? 'badge-success' : 'badge-primary'}">${p.status || 'Active'}</span></td>
        <td>
          ${p.coverages && Object.keys(p.coverages).length > 0 ? Object.entries(p.coverages).map(([k, v]) => `<span style="display: inline-block; background: #EEF2F6; padding: 1px 4px; border-radius: 3px; font-size: 8.5px; margin: 1px;">${k}: <strong>${formatCur(v)}</strong></span>`).join(' ') : '<span style="color: #94A3B8;">Standard Benefits</span>'}
        </td>
      </tr>`).join('')}
    </tbody>
  </table>`}

  <div style="font-size: 9.5px; font-weight: 700; color: #0F172A; text-transform: uppercase; margin-bottom: 4px;">
    Insurance Coverage vs. Recommended Guidelines
  </div>

  <table class="doc-table">
    <thead>
      <tr>
        <th style="width: 26%;">Risk Category</th>
        <th style="width: 28%;">Recommended Benchmark</th>
        <th style="width: 15%; text-align: right;">Current Cover</th>
        <th style="width: 15%; text-align: right;">Recommended Cover</th>
        <th style="width: 16%; text-align: right;">Coverage Status</th>
      </tr>
    </thead>
    <tbody>
      ${[
        { name: 'Life / Death Protection', rule: '10x Annual Income + Mortgages', inForce: inForceCoverage.death || 0, target: recommendedCoverage.death || 0, isMo: false },
        { name: 'Total & Permanent Disability (TPD)', rule: '10x Annual Income', inForce: inForceCoverage.tpd || 0, target: recommendedCoverage.tpd || 0, isMo: false },
        { name: 'Early Stage Critical Illness', rule: '2x Annual Income (Income Bridge)', inForce: inForceCoverage.earlyCi || 0, target: recommendedCoverage.earlyCi || 0, isMo: false },
        { name: 'Major / Late Stage CI', rule: '4x - 5x Annual Income (Treatment Buffer)', inForce: inForceCoverage.majorCi || 0, target: recommendedCoverage.majorCi || 0, isMo: false },
        { name: 'Disability Income Replacement', rule: '75% of Gross Monthly Income', inForce: inForceCoverage.disabilityIncome || 0, target: recommendedCoverage.disability || 0, isMo: true }
      ].map(row => {
        const gap = Math.max(0, row.target - row.inForce);
        const isCovered = row.inForce >= row.target;
        return `
        <tr>
          <td><strong>${row.name}</strong></td>
          <td style="color: #64748B;">${row.rule}</td>
          <td style="text-align: right;">${formatCur(row.inForce)}${row.isMo ? '/mo' : ''}</td>
          <td style="text-align: right; color: #475569;">${formatCur(row.target)}${row.isMo ? '/mo' : ''}</td>
          <td style="text-align: right;">
            ${isCovered ? '<span class="badge-success">Adequate</span>' : `<span class="badge-high">Shortfall: ${formatCur(gap)}${row.isMo ? '/mo' : ''}</span>`}
          </td>
        </tr>`;
      }).join('')}
      <tr>
        <td><strong>Hospitalization & Shield</strong></td>
        <td style="color: #64748B;">MediShield Life + Private Hospital Rider</td>
        <td style="text-align: right; font-weight: 600; color: ${inForceCoverage.hasShield ? '#059669' : '#DC2626'};">${inForceCoverage.hasShield ? 'Shield Active' : 'No Shield'}</td>
        <td style="text-align: right; color: #475569;">Private / Class A</td>
        <td style="text-align: right;">
          ${inForceCoverage.hasShield ? '<span class="badge-success">Shield Active</span>' : '<span class="badge-high">⚠️ Missing Rider</span>'}
        </td>
      </tr>
    </tbody>
  </table>

  <div class="running-footer">
    <span>Prepared for: ${clientName}</span>
    <span>Prepared by: ${consultantName}</span>
    <span>Page 5 of 6</span>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════════════════
     PAGE 6: ACTION PLAN & NEXT STEPS
══════════════════════════════════════════════════════════════════ -->
<div class="pdf-page">
  <div class="running-header">
    <span class="brand">${reportHeaderBranding}</span>
    <span class="doc-type">Financial Planning Report • Section 6</span>
  </div>

  <div class="section-title">6. Action Plan & Next Steps</div>

  <div style="margin-bottom: 12px;">
    ${strategicRecs.length > 0 ? strategicRecs.map((rec, idx) => `
    <div class="card-box" style="margin-bottom: 8px; padding: 8px 12px; border-left: 3.5px solid ${rec.priority === 'High' ? '#DC2626' : rec.priority === 'Medium' ? '#D97706' : '#2563EB'};">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
        <strong style="font-size: 10px; color: #0F172A;">${idx + 1}. ${rec.action}</strong>
        <span class="${rec.priority === 'High' ? 'badge-high' : rec.priority === 'Medium' ? 'badge-medium' : 'badge-primary'}">${rec.priority} Priority • ${rec.category || 'Planning'}</span>
      </div>
      <p style="font-size: 9.5px; color: #475569; margin: 0 0 4px 0; line-height: 1.45;">
        ${rec.rationale}
      </p>
      ${rec.implementationSteps ? `
      <div style="font-size: 9px; color: #1E40AF; background-color: #EFF6FF; padding: 3px 6px; border-radius: 3px;">
        <strong>Action Steps:</strong> ${rec.implementationSteps}
      </div>` : ''}
    </div>`).join('') : `
    <div class="card-box" style="font-size: 9.5px; color: #475569;">
      1. Address Critical Illness protection gap through structured early CI cover.<br>
      2. Review CPF Retirement Account top-ups for tax relief and higher guaranteed retirement payouts.<br>
      3. Direct monthly surplus into diversified long-term investments aligned with your risk profile.
    </div>`}
  </div>

  <!-- Stress-Testing & Scenario Insights -->
  ${aiSummary.stressTestInsights ? `
  <div class="card-box" style="border-left: 3.5px solid #D97706; background-color: #FFFBEB; margin-bottom: 10px;">
    <strong style="font-size: 9.5px; color: #B45309; text-transform: uppercase;">Stress-Test & Scenario Insights:</strong>
    <p style="font-size: 9.5px; color: #451A03; margin: 2px 0 0 0; line-height: 1.45;">
      ${aiSummary.stressTestInsights}
    </p>
  </div>` : ''}

  <!-- Discussion Points for Consultation -->
  ${aiSummary.clientDiscussionPrompt ? `
  <div class="card-box" style="border-left: 3.5px solid #7C3AED; background-color: #F8FAFC; margin-bottom: 10px;">
    <strong style="font-size: 9.5px; color: #6D28D9; text-transform: uppercase;">Discussion Points for Consultation:</strong>
    <p style="font-size: 9.5px; color: #334155; font-style: italic; margin: 2px 0 0 0; line-height: 1.45;">
      "${aiSummary.clientDiscussionPrompt}"
    </p>
  </div>` : ''}

  <!-- Review & Advisory Notice -->
  <div style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px 12px; background-color: #F8FAFC; font-size: 8px; color: #64748B; line-height: 1.45; margin-top: auto;">
    <strong>Important Regulatory & Advisory Notice:</strong> This Financial Planning Report is prepared based on information and declarations provided by the client, prevailing statutory CPF policies, and stated economic return assumptions. Actual investment performance, tax treatment, and annuity payouts will depend on prevailing market conditions and regulatory frameworks at the time of execution. Periodic review is recommended upon any major life event (e.g. marriage, childbirth, property purchase, or career change).
  </div>

  <div class="running-footer">
    <span>Prepared for: ${clientName}</span>
    <span>Prepared by: ${consultantName}</span>
    <span>Page 6 of 6</span>
  </div>
</div>

</body>
</html>`;
  }

  ipcMain.handle('get-app-settings', () => {
    try {
      if (!db.appSettings) {
        db.appSettings = {
          consultantName: 'Pieter Beetsma',
          consultantTitle: 'Senior Financial Consultant',
          repNumber: 'MAS Rep: PB-892415',
          email: 'pieter@beetsma.sg',
          phone: '+65 9123 4567',
          officeAddress: '1 Marina Boulevard, Singapore 018989',
          credentials: ['CFP®', 'ChFC®', 'AEPP®'],
          reportHeaderBranding: 'FINANCIAL PLANNING REPORT',
          reportSubtitle: '',
          defaultCurrency: 'SGD ($)',
          defaultInflationRate: 3.0,
          defaultPreRetireReturn: 6.5,
          defaultPostRetireReturn: 4.5,
          defaultLifeExpectancy: 88,
          defaultRetirementAge: 62
        };
      }
      const hasBuiltIn = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
      const hasUserKey = Boolean(db.appSettings.geminiApiKey && typeof db.appSettings.geminiApiKey === 'string' && db.appSettings.geminiApiKey.trim());
      
      const responseSettings = {
        ...db.appSettings,
        hasBuiltInKey: hasBuiltIn,
        hasConfiguredKey: hasBuiltIn || hasUserKey,
        // Only return the plain-text key if it was explicitly typed by the user as a custom override
        geminiApiKey: hasUserKey ? db.appSettings.geminiApiKey : ''
      };
      return { success: true, settings: responseSettings };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('save-app-settings', (event, settingsData) => {
    try {
      db.appSettings = { ...(db.appSettings || {}), ...settingsData };
      if (settingsData.geminiApiKey !== undefined) {
        if (typeof settingsData.geminiApiKey === 'string' && settingsData.geminiApiKey.trim()) {
          db.appSettings.geminiApiKey = settingsData.geminiApiKey.trim();
          process.env.GEMINI_API_KEY = settingsData.geminiApiKey.trim();
        } else {
          // If cleared, delete user override so it reverts cleanly to built-in key
          delete db.appSettings.geminiApiKey;
        }
        db.aiBriefing = { text: '', generatedAt: null }; // clear cache so fresh key takes effect immediately
      }
      saveDatabase();
      writeToLogFile(`[IPC] Successfully updated app/consultant settings for ${db.appSettings.consultantName}`);
      return { 
        success: true, 
        settings: {
          ...db.appSettings,
          hasBuiltInKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()),
          hasConfiguredKey: Boolean((process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) || (db.appSettings.geminiApiKey && db.appSettings.geminiApiKey.trim())),
          geminiApiKey: db.appSettings.geminiApiKey || ''
        } 
      };
    } catch (error) {
      writeToLogFile(`[IPC] save-app-settings failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('test-gemini-key', async (event, customKey) => {
    try {
      const isCustomKey = Boolean(customKey && typeof customKey === 'string' && customKey.trim());
      const keyToTest = isCustomKey 
        ? customKey.trim() 
        : getGeminiApiKey();

      if (!keyToTest) {
        return { success: false, error: 'No API key configured. Please enter a valid Gemini API key or ensure organization pre-configuration is active.' };
      }

      const model = getGeminiModel();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keyToTest}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Ping test. Respond with OK.' }] }]
        })
      });

      if (!response.ok) {
        const bodyText = await response.text();
        let errMsg = `HTTP ${response.status}`;
        try {
          const json = JSON.parse(bodyText);
          if (json.error?.message) {
            errMsg = json.error.message;
          }
        } catch (_) {}
        return { success: false, error: errMsg, statusCode: response.status };
      }

      // If test succeeds with custom key, persist to database
      if (isCustomKey) {
        if (!db.appSettings) db.appSettings = {};
        db.appSettings.geminiApiKey = customKey.trim();
        process.env.GEMINI_API_KEY = customKey.trim();
        db.aiBriefing = { text: '', generatedAt: null }; // clear cache so fresh key takes effect immediately
        saveDatabase();
      }

      return { 
        success: true, 
        model, 
        isBuiltIn: !isCustomKey,
        saved: isCustomKey 
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('export-financial-plan-pdf', async (event, payload) => {
    try {
      const { client, defaultFilename } = payload || {};
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) throw new Error('No active window found for PDF export');

      const consultant = payload?.consultantSettings || (db && db.appSettings) || {};
      const clientCleanName = client?.fullName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Client';
      const fallbackFilename = `Financial_Blueprint_${clientCleanName}_${new Date().toISOString().slice(0, 10)}.pdf`;

      const saveResult = await dialog.showSaveDialog(win, {
        title: 'Export Client Financial Blueprint PDF Document',
        defaultPath: defaultFilename || fallbackFilename,
        filters: [{ name: 'PDF Documents', extensions: ['pdf'] }]
      });

      if (saveResult.canceled || !saveResult.filePath) {
        return { success: false, canceled: true };
      }

      // Generate dedicated client-facing PDF HTML with consultant settings
      const htmlContent = generateFinancialPlanReportHtml({
        ...payload,
        consultantSettings: consultant
      });

      // Create an offscreen window to render the document cleanly
      const printWin = new BrowserWindow({
        show: false,
        width: 1200,
        height: 1600,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

      const pdfBuffer = await printWin.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        landscape: false,
        preferCSSPageSize: true,
        margins: {
          marginType: 'none'
        }
      });

      printWin.close();

      fs.writeFileSync(saveResult.filePath, pdfBuffer);
      writeToLogFile(`[IPC] Successfully exported dedicated client financial plan PDF to: ${saveResult.filePath}`);
      return { success: true, filePath: saveResult.filePath };
    } catch (error) {
      writeToLogFile(`[IPC] export-financial-plan-pdf failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  });


  ipcMain.handle('generate-outreach-playbook', async (event, payload) => {
    try {
      let productInfo = '';
      let fileData = null;
      let existingPlaybook = null;
      let mode = 'refine';
      let productName = '';

      if (typeof payload === 'string') {
        productInfo = payload;
      } else if (payload && typeof payload === 'object') {
        productInfo = payload.text || '';
        fileData = payload.fileData || null;
        existingPlaybook = payload.existingPlaybook || null;
        mode = payload.mode || 'refine';
        productName = payload.productName || '';
      }

      if ((!productInfo || !productInfo.trim()) && !fileData && !existingPlaybook) {
        throw new Error("No product information, brochure file, or existing playbook provided");
      }

      const systemInstruction = `You are a premier financial consultancy AI at Beetsma Consultancy. Your role is to analyze a product brochure, description, and advisor insights to generate an actionable marketing playbook for a WhatsApp outreach campaign.
You must return your response as a valid, single JSON object. Do not include markdown code block formatting (like \`\`\`json) or other conversational preamble.
The JSON structure MUST be exactly:
{
  "productFocus": "A short, clean name of the product focus determined from the text (e.g. AIA Protect 3)",
  "targetAudience": "A short description of the primary audience focus determined from the text (e.g. Young Parents & Families)",
  "usp": "One compelling core unique selling proposition / key differentiator of this product",
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
      "title": "Step 1: The Soft Opener (Value-Led Hook)",
      "goal": "Start a warm conversation highlighting a relevant stat without being pushy",
      "timeHint": "Tuesday or Thursday morning (9:00 AM - 10:30 AM)",
      "templateContent": "The message template. Use the exact literal text '[Client Name]' where the client's name should be substituted."
    },
    {
      "step": 2,
      "title": "Step 2: The Follow-Up (Value Drop & Brochure Summary)",
      "goal": "Share brochure details and highlight a standout feature",
      "timeHint": "2-3 days after opener (12:00 PM - 2:00 PM)",
      "templateContent": "The follow-up template. You may use '[Client Name]' if natural."
    },
    {
      "step": 3,
      "title": "Step 3: The Call to Action (15-Min Sync Close)",
      "goal": "Move from text discussion to a quick 15-minute coffee chat or Zoom sync",
      "timeHint": "Offer 2 concrete time slots (e.g. Thursday 3 PM or Friday 11 AM)",
      "templateContent": "The call-to-action template to book a short sync."
    }
  ],
  "objections": [
    {
      "objection": "Common objection 1 (e.g. 'I already have enough insurance / employer coverage')",
      "counterScript": "Consultative, empathetic WhatsApp response counter-script",
      "why": "Why this response works"
    },
    {
      "objection": "Common objection 2 (e.g. 'I am busy right now / no budget')",
      "counterScript": "Consultative, empathetic WhatsApp response counter-script",
      "why": "Why this response works"
    },
    {
      "objection": "Common objection 3 (e.g. 'Just text me the PDF brochure, I will read it myself')",
      "counterScript": "Consultative, empathetic WhatsApp response counter-script",
      "why": "Why this response works"
    }
  ],
  "routines": [
    {
      "time": "09:00 AM - 09:30 AM",
      "task": "Morning batch outreach",
      "desc": "Send out 5 to 10 Step 1 Opener messages"
    },
    {
      "time": "12:00 PM - 12:30 PM",
      "task": "Mid-day check & value drop",
      "desc": "Reply to responses, send Step 2 brochure summaries, and confirm time slots"
    },
    {
      "time": "05:00 PM - 05:30 PM",
      "task": "Evening follow-up & calendar lock",
      "desc": "Check outstanding chats, send gentle follow-ups, and log booked appointments"
    }
  ]
}
Make sure you generate exactly 3 segments, 3 script steps, 3 common objections with counter-scripts, and 3 routines. The scripts must be natural, respectful, highly tailored to the specific product, and suitable for the Singapore advisory context.`;

      const parts = [];
      if (fileData && fileData.base64) {
        parts.push({
          inline_data: {
            mime_type: fileData.mimeType || 'application/pdf',
            data: fileData.base64
          }
        });
      }

      let promptText = '';
      if (existingPlaybook && mode !== 'replace') {
        promptText = `You are REFINING and ENHANCING an existing advisory outreach playbook for "${productName || existingPlaybook.productFocus || 'the financial product'}".
DO NOT discard the existing product positioning or prior knowledge. Instead, integrate the advisor's new insights, directions, or attached addendum materials into the existing playbook while elevating its quality.

--- EXISTING PLAYBOOK CONTEXT ---
${JSON.stringify(existingPlaybook, null, 2)}

--- ADVISOR'S NEW INSIGHTS / REFINEMENT INSTRUCTIONS ---
${productInfo || 'Refine the scripts and objections with higher conversational authenticity, incorporating any attached materials.'}

Task:
1. Retain the strong, accurate elements from the existing playbook (such as the core product name and foundational USP).
2. Weave the advisor's new insights, requested angles, specific limits/riders, or tone adjustments into the USP, 3-Step WhatsApp scripts, and 3 objection handlers.
3. Return the complete updated JSON.`;
      } else {
        promptText = `Generate the outreach playbook JSON based on the provided product documents or details.`;
        if (productInfo && productInfo.trim()) {
          promptText += `\n\nProduct summary/description:\n${productInfo}`;
        }
      }
      parts.push({ text: promptText });

      const response = await fetch(getGeminiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: parts }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2500,
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
      
      let playbook;
      try {
        playbook = JSON.parse(text.trim());
      } catch (err) {
        let cleanText = text.trim();
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```json\s*/i, '').replace(/```$/, '');
        }
        playbook = JSON.parse(cleanText.trim());
      }
      
      if (!playbook.segments || !playbook.scripts) {
        throw new Error("Generated playbook is missing required fields (segments, scripts)");
      }

      return { success: true, data: playbook };
    } catch (error) {
      writeToLogFile(`[IPC] generate-outreach-playbook failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('generate-project-100-icebreaker', async (event, prospect) => {
    writeToLogFile(`[IPC] generate-project-100-icebreaker started for: ${prospect.fullName}`);
    try {
      const systemInstruction = `You are a master financial advisor and client relationship mentor at Beetsma Consultancy in Singapore.
Your task is to analyze a Project 100 prospect and generate 3 highly authentic, non-pushy, personalized outreach approaches for WhatsApp.

The prospect has been scored on the N.A.S.T. framework (1 to 5 stars each):
- Need (Current urgency/vulnerability for insurance, wealth, retirement, or estate planning)
- Accessibility (How easily the advisor can get in touch or meet up)
- Suitability / Income (Financial capability to save or invest)
- Trust (Strength of relational rapport and personal connection)

Generate exactly 3 diverse outreach angles:
1. Option A: Warm & Casual Re-Connection (Focus on relationship catchup, coffee, catching up on life)
2. Option B: Consultative Life Stage Check-in (Focus on recent milestones, industry trends, CPF/tax/healthcare changes, or family protection)
3. Option C: Direct Value Hook (High-priority solution, protection gap, or wealth accumulation topic tailored to their profile)

Return ONLY a valid JSON object matching this schema:
{
  "prospectSummary": "1-2 sentence executive assessment of this prospect's priority and optimal engagement strategy",
  "recommendedAngle": "Which option (A, B, or C) is recommended and why",
  "icebreakers": [
    {
      "id": "opt-a",
      "angle": "Casual Re-Connection & Catchup",
      "tone": "Warm & Relational",
      "rationale": "Why this angle works best for this category and trust score",
      "message": "The full WhatsApp message text ready to send. Use the person's preferred/first name naturally. Keep formatting clean with friendly line breaks.",
      "talkingPoints": [
        "Key topic 1 to bring up during coffee chat",
        "Key topic 2 to listen for"
      ]
    },
    {
      "id": "opt-b",
      "angle": "Life Stage & Milestone Review",
      "tone": "Consultative & Value-Oriented",
      "rationale": "Why this angle works for their life stage and need score",
      "message": "The full WhatsApp message text ready to send.",
      "talkingPoints": [
        "Key topic 1",
        "Key topic 2"
      ]
    },
    {
      "id": "opt-c",
      "angle": "Direct Strategic Value Hook",
      "tone": "Professional & Direct",
      "rationale": "Why this direct hook fits their income and accessibility",
      "message": "The full WhatsApp message text ready to send.",
      "talkingPoints": [
        "Key topic 1",
        "Key topic 2"
      ]
    }
  ]
}`;

      const prompt = `Here is the prospect data:
Full Name: ${prospect.fullName || 'Prospect'}
Category: ${prospect.category || 'Warm Acquaintance'}
N.A.S.T Scores:
- Need: ${prospect.scoreNeed || 3}/5
- Accessibility: ${prospect.scoreAccessibility || 3}/5
- Suitability/Income: ${prospect.scoreIncome || 3}/5
- Trust: ${prospect.scoreTrust || 3}/5
Company / Organization: ${prospect.company || 'Not specified'}
Job Title: ${prospect.jobTitle || 'Not specified'}
Advisor Notes: ${prospect.notes || 'None recorded'}
Current Engagement Stage: ${prospect.stage || 'Not Contacted'}

Generate the 3 customized WhatsApp icebreakers in the specified JSON format.`;

      const response = await fetch(getGeminiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
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
      
      let parsed;
      try {
        parsed = JSON.parse(text.trim());
      } catch (err) {
        let cleanText = text.trim();
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```json\s*/i, '').replace(/```$/, '');
        }
        parsed = JSON.parse(cleanText.trim());
      }

      writeToLogFile(`[IPC] generate-project-100-icebreaker completed successfully`);
      return { success: true, data: parsed };
    } catch (error) {
      writeToLogFile(`[IPC] generate-project-100-icebreaker failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('tweak-outreach-script', async (event, { scriptText, instruction, chatHistory = [] }) => {
    try {
      const systemInstruction = `You are a premier financial consultancy AI copywriter at Beetsma Consultancy. 
Your task is to modify / tweak a WhatsApp outreach message script template according to the user's instructions.
Keep the output message highly engaging, professional, and optimized for WhatsApp. 

CRITICAL: 
1. Maintain any placeholder tags like '[Client Name]', '{clientName}', etc. in the same style in the output so they can be dynamically replaced later.
2. The user might want to adjust the tone (e.g. warmer, more formal, shorter, punchier, etc.) or add/remove details.
3. You must respond ONLY with a JSON object. Do not include markdown code block formatting (like \`\`\`json) or other conversational preamble.
The JSON structure MUST be exactly:
{
  "tweakedScript": "The complete modified WhatsApp message script template."
}`;

      const contents = [];
      
      // Add chat history if present to give context
      if (chatHistory && chatHistory.length > 0) {
        chatHistory.forEach(msg => {
          if (msg.text && (msg.role === 'user' || msg.role === 'model')) {
            contents.push({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.text }]
            });
          }
        });
      }

      // Add current user prompt
      const promptText = `Here is the current outreach message script template:
"""
${scriptText}
"""

User Instruction: Modify this script based on: "${instruction}"

Generate the tweaked outreach message script template in the specified JSON format.`;

      contents.push({
        role: 'user',
        parts: [{ text: promptText }]
      });

      const response = await fetch(getGeminiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Gemini API ${response.status}: ${errBody}`);
      }

      const json = await response.json();
      const responseText = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      let parsed;
      try {
        parsed = JSON.parse(responseText.trim());
      } catch (err) {
        let cleanText = responseText.trim();
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```json\s*/i, '').replace(/```$/, '');
        }
        parsed = JSON.parse(cleanText.trim());
      }
      
      return { success: true, tweakedScript: parsed.tweakedScript };
    } catch (error) {
      writeToLogFile(`[IPC] tweak-outreach-script failed: ${error.message}`);
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

  ipcMain.handle('write-log', (event, message) => {
    writeToLogFile(message);
    return { success: true };
  });

  ipcMain.handle('open-log-file', async () => {
    try {
      if (!fs.existsSync(logPath)) {
        fs.writeFileSync(logPath, `[${new Date().toISOString()}] Log file initialized.\n`, 'utf8');
      }
      await shell.openPath(logPath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('clear-log-file', async () => {
    try {
      if (!logPath) {
        const userDataPath = app.getPath('userData');
        logPath = path.join(userDataPath, 'app.log');
      }
      fs.writeFileSync(logPath, `[${new Date().toISOString()}] Log file cleared by user.\n`, 'utf8');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
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
  initAutoUpdater();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // Check for updates on startup (after 5 seconds)
  setTimeout(() => {
    try {
      writeToLogFile('[AutoUpdater] Checking for updates on startup...');
      autoUpdater.checkForUpdates().catch(err => {
        writeToLogFile(`[AutoUpdater] Startup update check caught: ${err.message}`);
      });
    } catch (err) {
      writeToLogFile(`[AutoUpdater] Startup update check failed: ${err.message}`);
    }
  }, 5000);

  // Start continuous, permanent background calendar sync
  startContinuousCalendarSync();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Proactive continuous background calendar sync
async function runBackgroundCalendarSync() {
  const settings = db.googleCalendarSettings;
  if (!settings || !settings.tokens) return;

  try {
    // 1. Proactively refresh access token if refresh token exists
    if (settings.tokens.refresh_token && settings.clientId && settings.clientSecret) {
      const refreshRes = await refreshAccessToken(settings.clientId, settings.clientSecret, settings.tokens.refresh_token);
      if (refreshRes.success) {
        settings.tokens.access_token = refreshRes.accessToken;
        saveDatabase();
        writeToLogFile('[Calendar Auto-Sync] Proactively refreshed Google access token.');
      }
    }

    // 2. Synchronize all CRM tasks with due dates
    let synced = 0;
    if (Array.isArray(db.tasks)) {
      for (const task of db.tasks) {
        if (task.dueDate && (!task.googleEventId || task.status === 'Pending')) {
          const res = await syncTaskToGoogleCalendar(task);
          if (res.success) synced++;
        }
      }
    }

    if (synced > 0) {
      writeToLogFile(`[Calendar Auto-Sync] Background synchronized ${synced} tasks to Google Calendar.`);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('calendar-synced');
      }
    }
  } catch (err) {
    writeToLogFile(`[Calendar Auto-Sync] Warning: ${err.message}`);
  }
}

function startContinuousCalendarSync() {
  // Initial sync after 6 seconds
  setTimeout(runBackgroundCalendarSync, 6000);
  // Continuous sync every 3 minutes
  setInterval(runBackgroundCalendarSync, 3 * 60 * 1000);
}

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
