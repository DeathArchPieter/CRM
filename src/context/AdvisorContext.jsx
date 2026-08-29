import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const AdvisorContext = createContext(null);

export function AdvisorContextProvider({ children, activeMainTab = 'dashboard' }) {
  const [contextState, setContextState] = useState({
    section: activeMainTab,
    subSection: null, // 'client-profile' | 'financial-plan' | 'project-100' | 'outreach-campaign' | 'template-library'
    activeSubTab: null, // 'overview' | 'policies' | 'claims' | 'ai-dossier' | 'family' | 'balance-sheet' | 'retirement' | 'protection' | 'simulator' | 'blueprint' | 'targets' | 'playbook' | 'analytics'
    entityContext: null, // e.g. { clientName, clientId, policyCount, campaignName, dealTitle }
    activeModal: null // 'claim-modal' | 'claim-ai' | 'social-discovery' | 'pre-meeting-brief' | 'cpf-playbook' | 'graph-breakdown' | 'brochure-scanner'
  });

  const [isArchieOpen, setIsArchieOpen] = useState(false);
  const actionHandlersRef = useRef({});

  // Register an action handler that Archie or components can invoke
  const registerActionHandler = useCallback((actionName, handler) => {
    actionHandlersRef.current[actionName] = handler;
    return () => {
      delete actionHandlersRef.current[actionName];
    };
  }, []);

  // Trigger an action by name
  const triggerAction = useCallback((actionName, payload) => {
    const handler = actionHandlersRef.current[actionName];
    if (typeof handler === 'function') {
      handler(payload);
      return true;
    }
    return false;
  }, []);

  // Update advisor context state
  const setAdvisorContext = useCallback((updates) => {
    setContextState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const toggleArchie = useCallback((forceState) => {
    setIsArchieOpen(prev => (typeof forceState === 'boolean' ? forceState : !prev));
  }, []);

  const value = {
    ...contextState,
    isArchieOpen,
    toggleArchie,
    setAdvisorContext,
    registerActionHandler,
    triggerAction
  };

  return (
    <AdvisorContext.Provider value={value}>
      {children}
    </AdvisorContext.Provider>
  );
}

export function useAdvisorContext() {
  const ctx = useContext(AdvisorContext);
  if (!ctx) {
    // Return safe fallback if used outside provider
    return {
      section: 'dashboard',
      subSection: null,
      activeSubTab: null,
      entityContext: null,
      activeModal: null,
      isArchieOpen: false,
      toggleArchie: () => {},
      setAdvisorContext: () => {},
      registerActionHandler: () => () => {},
      triggerAction: () => false
    };
  }
  return ctx;
}
