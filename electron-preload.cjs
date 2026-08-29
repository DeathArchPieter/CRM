const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  
  // Database API
  getClients: () => ipcRenderer.invoke('get-clients'),
  addClient: (clientData) => ipcRenderer.invoke('add-client', clientData),
  updateClient: (clientData) => ipcRenderer.invoke('update-client', clientData),
  logClientTouchpoint: (clientId, touchpointDate) => ipcRenderer.invoke('log-client-touchpoint', clientId, touchpointDate),
  getPolicies: (clientId) => ipcRenderer.invoke('get-policies', clientId),
  getAllPolicies: () => ipcRenderer.invoke('get-all-policies'),
  addPolicy: (policyData) => ipcRenderer.invoke('add-policy', policyData),
  updatePolicy: (policyData) => ipcRenderer.invoke('update-policy', policyData),
  deletePolicy: (policyId) => ipcRenderer.invoke('delete-policy', policyId),
  // Pipeline API
  getPipeline: () => ipcRenderer.invoke('get-pipeline'),
  addPipelineCase: (caseData) => ipcRenderer.invoke('add-pipeline-case', caseData),
  updatePipelineCase: (caseData) => ipcRenderer.invoke('update-pipeline-case', caseData),
  deletePipelineCase: (caseId) => ipcRenderer.invoke('delete-pipeline-case', caseId),
  // Tasks API
  getTasks: (clientId) => ipcRenderer.invoke('get-tasks', clientId),
  addTask: (taskData) => ipcRenderer.invoke('add-task', taskData),
  updateTask: (taskData) => ipcRenderer.invoke('update-task', taskData),
  deleteTask: (taskId) => ipcRenderer.invoke('delete-task', taskId),
  getAllTasks: () => ipcRenderer.invoke('get-all-tasks'),
  getAiBriefing: (forceRefresh) => ipcRenderer.invoke('get-ai-briefing', forceRefresh),
  analyseProduct: (payload) => ipcRenderer.invoke('analyse-product', payload),
  analyseCardStatement: (payload) => ipcRenderer.invoke('analyse-card-statement', payload),
  getClientAiInsights: (clientId, forceRefresh) => ipcRenderer.invoke('get-client-ai-insights', clientId, forceRefresh),
  startGoogleOauth: (credentials) => ipcRenderer.invoke('start-google-oauth', credentials),
  getGoogleEvents: (range) => ipcRenderer.invoke('get-google-events', range),
  disconnectGoogleCalendar: () => ipcRenderer.invoke('disconnect-google-calendar'),
  getGoogleSettings: () => ipcRenderer.invoke('get-google-settings'),
  getCalendarTasks: () => ipcRenderer.invoke('get-calendar-tasks'),
  createGoogleEvent: (payload) => ipcRenderer.invoke('create-google-event', payload),
  updateGoogleEvent: (payload) => ipcRenderer.invoke('update-google-event', payload),
  deleteGoogleEvent: (payload) => ipcRenderer.invoke('delete-google-event', payload),
  syncAllTasks: () => ipcRenderer.invoke('sync-all-tasks'),
  openPath: (pathString) => ipcRenderer.invoke('open-path', pathString),
  
  // Project 100 API
  getProject100Contacts: () => ipcRenderer.invoke('get-project-100-contacts'),
  addProject100Contact: (contactData) => ipcRenderer.invoke('add-project-100-contact', contactData),
  updateProject100Contact: (contactData) => ipcRenderer.invoke('update-project-100-contact', contactData),
  deleteProject100Contact: (contactId) => ipcRenderer.invoke('delete-project-100-contact', contactId),
  generateProject100Icebreaker: (prospect) => ipcRenderer.invoke('generate-project-100-icebreaker', prospect),

  // Initiatives API
  getInitiatives: () => ipcRenderer.invoke('get-initiatives'),
  addInitiative: (initiativeData) => ipcRenderer.invoke('add-initiative', initiativeData),
  updateInitiative: (initiativeData) => ipcRenderer.invoke('update-initiative', initiativeData),
  deleteInitiative: (projectId) => ipcRenderer.invoke('delete-initiative', projectId),
  generateOutreachPlaybook: (productInfo) => ipcRenderer.invoke('generate-outreach-playbook', productInfo),
  tweakOutreachScript: (payload) => ipcRenderer.invoke('tweak-outreach-script', payload),

  // Client Profile AI Dossier & Social Enrichment
  discoverClientSocials: (payload) => ipcRenderer.invoke('discover-client-socials', payload),
  enrichClientProfile: (payload) => ipcRenderer.invoke('enrich-client-profile', payload),
  saveClientDossier: (payload) => ipcRenderer.invoke('save-client-dossier', payload),
  analyzeSocialPost: (payload) => ipcRenderer.invoke('analyze-social-post', payload),
  saveClientSocialPosts: (payload) => ipcRenderer.invoke('save-client-social-posts', payload),
  openSocialLoginWindow: (platform) => ipcRenderer.invoke('open-social-login-window', platform),
  runBrowserSocialScan: (payload) => ipcRenderer.invoke('run-browser-social-scan', payload),
  generateClientMeetingBrief: (payload) => ipcRenderer.invoke('generate-client-meeting-brief', payload),

  // Client Financial Planning API
  saveClientFinancialPlan: (clientId, planData) => ipcRenderer.invoke('save-client-financial-plan', clientId, planData),
  generateFinancialPlanAiSummary: (payload) => ipcRenderer.invoke('generate-financial-plan-ai-summary', payload),
  generateProjectionGraphBreakdown: (payload) => ipcRenderer.invoke('generate-projection-graph-breakdown', payload),
  exportFinancialPlanPdf: (payload) => ipcRenderer.invoke('export-financial-plan-pdf', payload),

  // Claims & Payout Reconciliation API
  getClaims: (clientId) => ipcRenderer.invoke('get-claims', clientId),
  getAllClaims: () => ipcRenderer.invoke('get-all-claims'),
  addClaim: (claimData) => ipcRenderer.invoke('add-claim', claimData),
  updateClaim: (claimData) => ipcRenderer.invoke('update-claim', claimData),
  deleteClaim: (claimId) => ipcRenderer.invoke('delete-claim', claimId),
  attachClaimDocument: (payload) => ipcRenderer.invoke('attach-claim-document', payload),
  openClaimFolder: (payload) => ipcRenderer.invoke('open-claim-folder', payload),
  deleteClaimFile: (filePath) => ipcRenderer.invoke('delete-claim-file', filePath),
  analyseClaimSettlementReconciliation: (payload) => ipcRenderer.invoke('analyse-claim-settlement-reconciliation', payload),
  generateClaimAiAssist: (payload) => ipcRenderer.invoke('generate-claim-ai-assist', payload),

  // Logging API
  writeLog: (message) => ipcRenderer.invoke('write-log', message),
  openLogFile: () => ipcRenderer.invoke('open-log-file'),
  clearLogFile: () => ipcRenderer.invoke('clear-log-file'),

  // App & Consultant Settings API
  getAppSettings: () => ipcRenderer.invoke('get-app-settings'),
  saveAppSettings: (settings) => ipcRenderer.invoke('save-app-settings', settings),
  testGeminiKey: (apiKey) => ipcRenderer.invoke('test-gemini-key', apiKey),

  // Application Auto-Update & Version Control API
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getUpdateStatus: () => ipcRenderer.invoke('get-update-status'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  quitAndInstallUpdate: () => ipcRenderer.invoke('quit-and-install-update'),
  onUpdateStatus: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('app-update-status', subscription);
    return () => ipcRenderer.removeListener('app-update-status', subscription);
  }
});
