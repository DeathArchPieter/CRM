const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  
  // Database API
  getClients: () => ipcRenderer.invoke('get-clients'),
  addClient: (clientData) => ipcRenderer.invoke('add-client', clientData),
  updateClient: (clientData) => ipcRenderer.invoke('update-client', clientData),
  getPolicies: (clientId) => ipcRenderer.invoke('get-policies', clientId),
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

  // Initiatives API
  getInitiatives: () => ipcRenderer.invoke('get-initiatives'),
  addInitiative: (initiativeData) => ipcRenderer.invoke('add-initiative', initiativeData),
  updateInitiative: (initiativeData) => ipcRenderer.invoke('update-initiative', initiativeData),
  deleteInitiative: (projectId) => ipcRenderer.invoke('delete-initiative', projectId),
  generateOutreachPlaybook: (productInfo) => ipcRenderer.invoke('generate-outreach-playbook', productInfo),
});
