import React, { useState, useEffect } from 'react';
import { Sparkles, Download, RefreshCw, X, CheckCircle, AlertCircle, ArrowUpCircle } from 'lucide-react';

export default function UpdateNotificationBanner() {
  const [updateStatus, setUpdateStatus] = useState({
    status: 'idle', // 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
    info: null,
    progress: null,
    error: null
  });
  const [isDismissed, setIsDismissed] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Initial fetch of update status
    if (window.electronAPI?.getUpdateStatus) {
      window.electronAPI.getUpdateStatus().then(res => {
        if (res.success && res.updateStatus) {
          setUpdateStatus(res.updateStatus);
        }
      });
    }

    // Subscribe to live update status events from main process
    if (window.electronAPI?.onUpdateStatus) {
      const unsubscribe = window.electronAPI.onUpdateStatus((statusObj) => {
        setUpdateStatus(statusObj);
        if (statusObj.status === 'available' || statusObj.status === 'downloaded') {
          setIsDismissed(false); // Pop open if new update arrives
        }
        if (statusObj.status === 'downloading') {
          setIsDownloading(true);
        }
      });
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, []);

  const handleDownload = async () => {
    setIsDownloading(true);
    if (window.electronAPI?.downloadUpdate) {
      await window.electronAPI.downloadUpdate();
    }
  };

  const handleRestart = async () => {
    if (window.electronAPI?.quitAndInstallUpdate) {
      await window.electronAPI.quitAndInstallUpdate();
    }
  };

  // Only render banner if there is an active update available, downloading, or downloaded
  if (isDismissed || !['available', 'downloading', 'downloaded'].includes(updateStatus.status)) {
    return null;
  }

  const { info, progress } = updateStatus;
  const newVersion = info?.version || 'New Version';
  const percent = progress?.percent ? Math.round(progress.percent) : 0;
  const transferredMB = progress?.transferred ? (progress.transferred / 1024 / 1024).toFixed(1) : '0';
  const totalMB = progress?.total ? (progress.total / 1024 / 1024).toFixed(1) : '0';

  return (
    <div style={{
      position: 'fixed',
      top: '42px', // Right below title bar
      right: '24px',
      zIndex: 9999,
      maxWidth: '440px',
      width: 'calc(100vw - 48px)',
      animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      boxShadow: '0 20px 40px -15px rgba(0,0,0,0.6), 0 0 0 1px rgba(139, 92, 246, 0.3)'
    }} className="glass-panel">
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: updateStatus.status === 'downloaded' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(139, 92, 246, 0.2)',
              color: updateStatus.status === 'downloaded' ? '#34d399' : '#a78bfa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {updateStatus.status === 'downloaded' ? <CheckCircle size={16} /> : <ArrowUpCircle size={16} />}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {updateStatus.status === 'downloaded' 
                  ? 'Update Ready to Install' 
                  : `Update Available (v${newVersion})`}
                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px', backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                  GitHub Release
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                {updateStatus.status === 'downloaded'
                  ? 'Update downloaded. Instant 2s restart with zero setup wizards.'
                  : updateStatus.status === 'downloading'
                  ? `Downloading update package in background (${percent}%)...`
                  : 'A new version of Beetsma Consultancy CRM is ready to download.'}
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsDismissed(true)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', opacity: 0.7 }}
            title="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>

        {/* Progress Bar (when downloading) */}
        {updateStatus.status === 'downloading' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                width: `${percent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)',
                borderRadius: '3px',
                transition: 'width 0.2s ease'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)' }}>
              <span>{transferredMB} MB / {totalMB} MB</span>
              <span style={{ color: '#a78bfa', fontWeight: '600' }}>{percent}%</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '2px' }}>
          {updateStatus.status === 'available' && (
            <>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '11.5px', padding: '5px 12px' }}
                onClick={() => setIsDismissed(true)}
              >
                Remind Me Later
              </button>
              <button
                className="btn btn-primary"
                style={{ fontSize: '11.5px', padding: '5px 14px', display: 'flex', alignItems: 'center', gap: '5px' }}
                onClick={handleDownload}
                disabled={isDownloading}
              >
                <Download size={13} /> {isDownloading ? 'Downloading in Background...' : 'Download Update'}
              </button>
            </>
          )}

          {updateStatus.status === 'downloaded' && (
            <>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '11.5px', padding: '5px 12px' }}
                onClick={() => setIsDismissed(true)}
              >
                Apply on Next Quit
              </button>
              <button
                className="btn btn-primary"
                style={{ fontSize: '11.5px', padding: '5px 14px', display: 'flex', alignItems: 'center', gap: '5px', background: 'linear-gradient(135deg, #10b981, #059669)' }}
                onClick={handleRestart}
              >
                <RefreshCw size={13} /> Restart & Apply Now
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
