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
});
