import React, { useState } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import DashboardView from './views/DashboardView';
import ScheduleView from './views/ScheduleView';
import ClientsView from './views/ClientsView';
import PipelineView from './views/PipelineView';
import SalesTrackingView from './views/SalesTrackingView';
import RemunerationView from './views/RemunerationView';
import SpecialProjectsView from './views/SpecialProjectsView';
import SpecialReportsView from './views/SpecialReportsView';
import ProductAnalysisView from './views/ProductAnalysisView';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'schedule':
        return <ScheduleView />;
      case 'clients':
        return <ClientsView />;
      case 'pipeline':
        return <PipelineView />;
      case 'sales':
        return <SalesTrackingView />;
      case 'remuneration':
        return <RemunerationView />;
      case 'special-projects':
        return <SpecialProjectsView />;
      case 'special-reports':
        return <SpecialReportsView />;
      case 'product-analysis':
        return <ProductAnalysisView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Draggable Title Bar for Frameless Window */}
      <TitleBar />
      
      {/* Main Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Navigation Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {/* Dynamic Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px', backgroundColor: 'var(--bg-base)' }}>
          {renderView()}
        </div>
      </div>
    </div>
  );
}

export default App;
