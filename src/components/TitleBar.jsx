import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Bell } from 'lucide-react';
import RemindersDrawer from './RemindersDrawer';

export default function TitleBar({ onSelectClient, onNavigateTab }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [hasOverdue, setHasOverdue] = useState(false);

  const fetchReminderCounts = async () => {
    if (!window.electronAPI?.getAllTasks) return;
    try {
      const res = await window.electronAPI.getAllTasks();
      if (res.success && Array.isArray(res.data)) {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        let overdue = 0;
        let todayCount = 0;

        res.data.forEach(task => {
          if (!task.dueDate) return;
          if (task.dueDate < todayStr) {
            overdue++;
          } else if (task.dueDate === todayStr) {
            todayCount++;
          }
        });

        setAlertCount(overdue + todayCount);
        setHasOverdue(overdue > 0);
      }
    } catch (err) {
      console.error('Failed to fetch reminder counts:', err);
    }
  };

  useEffect(() => {
    fetchReminderCounts();
    const interval = setInterval(fetchReminderCounts, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

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
    <>
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
        
        {/* Right Section: Notification Bell + Window Controls */}
        <div style={{ display: 'flex', height: '100%', WebkitAppRegion: 'no-drag', alignItems: 'center' }}>
          {/* Global Notification Bell */}
          <button
            onClick={() => {
              setIsDrawerOpen(prev => !prev);
              fetchReminderCounts();
            }}
            style={{
              background: isDrawerOpen ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
              border: 'none',
              color: alertCount > 0 ? (hasOverdue ? '#f87171' : '#fbbf24') : 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0 10px',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              position: 'relative',
              transition: 'all 0.15s ease'
            }}
            title={alertCount > 0 ? `${alertCount} reminders due or overdue` : "View upcoming reminders"}
          >
            <Bell size={13} style={{ animation: hasOverdue ? 'pulse 2s infinite' : 'none' }} />
            {alertCount > 0 && (
              <span style={{
                fontSize: '9.5px',
                fontWeight: '700',
                padding: '0px 5px',
                borderRadius: '8px',
                backgroundColor: hasOverdue ? '#ef4444' : '#f59e0b',
                color: '#ffffff',
                lineHeight: '14px',
                display: 'inline-block'
              }}>
                {alertCount}
              </span>
            )}
          </button>

          <button className="window-btn" onClick={handleMinimize} title="Minimize">
            <Minus size={16} />
          </button>
          <button className="window-btn" onClick={handleMaximize} title="Maximize">
            <Square size={12} />
          </button>
          <button className="window-btn close-btn" onClick={handleClose} title="Close">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Global Reminders Flyout Popover */}
      <RemindersDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          fetchReminderCounts();
        }}
        onSelectClient={onSelectClient}
        onNavigateTab={onNavigateTab}
      />
    </>
  );
}
