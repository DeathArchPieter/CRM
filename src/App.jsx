import React, { useState, useEffect } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import CommandPalette from './components/CommandPalette';
import { ToastProvider } from './components/Toast';
import DashboardView from './views/DashboardView';
import ScheduleView from './views/ScheduleView';
import ClientsView from './views/ClientsView';
import PipelineView from './views/PipelineView';
import SalesTrackingView from './views/SalesTrackingView';
import RemunerationView from './views/RemunerationView';
import SpecialProjectsView from './views/SpecialProjectsView';
import SpecialReportsView from './views/SpecialReportsView';
import ProductAnalysisView from './views/ProductAnalysisView';
import SettingsView from './views/SettingsView';
import UpdateNotificationBanner from './components/UpdateNotificationBanner';
import AssistantGuide from './components/AssistantGuide';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [selectedClientForView, setSelectedClientForView] = useState(null);

  // Global Keyboard Listener for Ctrl + K / Cmd + K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectClientFromPalette = (client) => {
    setSelectedClientForView(client);
    setActiveTab('clients');
  };

  const handleSelectPipelineDealFromPalette = (deal) => {
    setActiveTab('pipeline');
  };

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView 
            onNavigateTab={setActiveTab}
            onSelectClient={handleSelectClientFromPalette}
          />
        );
      case 'schedule':
        return <ScheduleView onSelectClient={handleSelectClientFromPalette} />;
      case 'clients':
        return (
          <ClientsView 
            initialSelectedClient={selectedClientForView}
            onClearInitialClient={() => setSelectedClientForView(null)}
          />
        );
      case 'pipeline':
        return <PipelineView onSelectClient={handleSelectClientFromPalette} />;
      case 'sales':
        return <SalesTrackingView onNavigateTab={setActiveTab} />;
      case 'remuneration':
        return <RemunerationView />;
      case 'special-projects':
        return (
          <SpecialProjectsView 
            onSelectClient={handleSelectClientFromPalette} 
            onNavigateTab={setActiveTab} 
          />
        );
      case 'special-reports':
        return <SpecialReportsView />;
      case 'product-analysis':
        return <ProductAnalysisView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView onNavigateTab={setActiveTab} />;
    }
  };

  return (
    <ToastProvider>
      <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden' }}>
        {/* Draggable Title Bar for Frameless Window */}
        <TitleBar />
        
        {/* Automatic App Update Banner / Modal */}
        <UpdateNotificationBanner />
        
        {/* Main Layout */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Navigation Sidebar */}
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          />
          
          {/* Dynamic Content Area */}
          <div id="main-scroll-container" style={{ flex: 1, overflowY: 'auto', padding: '28px', backgroundColor: 'var(--bg-base)' }}>
            {renderView()}
          </div>
        </div>

        {/* Global Command Palette Overlay */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNavigateTab={(tabId) => setActiveTab(tabId)}
          onSelectClient={handleSelectClientFromPalette}
          onSelectPipelineDeal={handleSelectPipelineDealFromPalette}
        />

        {/* Interactive Floating Advisor Guide Assistant ("Archie") */}
        <AssistantGuide 
          activeTab={activeTab} 
          onNavigateTab={setActiveTab} 
        />
      </div>
    </ToastProvider>
  );
}

export default App;
