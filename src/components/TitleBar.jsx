import React from 'react';
import { Minus, Square, X } from 'lucide-react';

export default function TitleBar() {
  const handleMinimize = () => {
    window.electronAPI?.minimize();
  };

  const handleMaximize = () => {
    window.electronAPI?.maximize();
  };

  const handleClose = () => {
    window.electronAPI?.close();
  };

  return (
    <div className="title-bar" style={{
      height: '32px',
      background: 'var(--bg-base)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      WebkitAppRegion: 'drag', // Makes the bar draggable
      userSelect: 'none',
      borderBottom: '1px solid var(--border-light)',
      zIndex: 1000
    }}>
      <div style={{ paddingLeft: '16px', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }}></div>
        CRM Super App
      </div>
      
      {/* Window Controls - must not be draggable to receive clicks */}
      <div style={{ display: 'flex', height: '100%', WebkitAppRegion: 'no-drag' }}>
        <button className="window-btn" onClick={handleMinimize}>
          <Minus size={16} />
        </button>
        <button className="window-btn" onClick={handleMaximize}>
          <Square size={12} />
        </button>
        <button className="window-btn close-btn" onClick={handleClose}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
