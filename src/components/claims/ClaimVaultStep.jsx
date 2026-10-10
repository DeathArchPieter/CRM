import React from 'react';
import { 
  FileText, CheckCircle2, Upload, ExternalLink, Trash2, Plus, Clock, FileCheck 
} from 'lucide-react';

export default function ClaimVaultStep({
  formData,
  setFormData,
  handleApplyTemplate,
  handleToggleDocStatus,
  handleAttachDocumentFile,
  handleOpenFile,
  uploadingDocId,
  customChecklistLabel,
  setCustomChecklistLabel,
  handleAddCustomChecklistItem,
  newNoteText,
  setNewNoteText,
  handleAddTimelineNote
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Physical Document Vault & Medical Files
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            All attached files are stored locally in your CRM vault for instant retrieval at any time.
          </p>
        </div>

        {/* Template Preset Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn"
            style={{ fontSize: '11px', padding: '6px 10px', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}
            onClick={() => handleApplyTemplate('Hospitalisation / Shield')}
          >
            + 🏥 Shield Preset
          </button>
          <button
            type="button"
            className="btn"
            style={{ fontSize: '11px', padding: '6px 10px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24' }}
            onClick={() => handleApplyTemplate('Accident & Medical')}
          >
            + 🩹 Accident Preset
          </button>
          <button
            type="button"
            className="btn"
            style={{ fontSize: '11px', padding: '6px 10px', backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#c084fc' }}
            onClick={() => handleApplyTemplate('Critical Illness')}
          >
            + 🎗️ CI Preset
          </button>
          <button
            type="button"
            className="btn"
            style={{ fontSize: '11px', padding: '6px 10px', backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#c084fc' }}
            onClick={() => handleApplyTemplate('Disability Income')}
          >
            + 💼 DI Preset
          </button>
          <button
            type="button"
            className="btn"
            style={{ fontSize: '11px', padding: '6px 10px', backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#c084fc' }}
            onClick={() => handleApplyTemplate('Death / TPD')}
          >
            + 🕊️ Death/TPD Preset
          </button>
        </div>
      </div>

      {/* Checklist Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {formData.documentChecklist.map(doc => (
          <div
            key={doc.id}
            style={{
              padding: '14px 18px',
              borderRadius: '10px',
              backgroundColor: doc.status === 'Uploaded / Received' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)',
              border: doc.status === 'Uploaded / Received' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => handleToggleDocStatus(doc.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: doc.status === 'Uploaded / Received' ? 'var(--accent-success)' : doc.status === 'Waived' ? 'var(--text-muted)' : 'var(--text-secondary)'
                }}
              >
                {doc.status === 'Uploaded / Received' ? (
                  <CheckCircle2 size={20} color="var(--accent-success)" />
                ) : (
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--text-muted)' }} />
                )}
              </button>

              <div>
                <div style={{ fontSize: '13.5px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  {doc.label}
                  {doc.required && <span style={{ color: '#f87171', marginLeft: '4px' }}>*</span>}
                </div>
                {doc.fileName && (
                  <div style={{ fontSize: '11.5px', color: 'var(--accent-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    📎 {doc.fileName} {doc.fileSize ? `(${Math.round(doc.fileSize / 1024)} KB)` : ''}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {doc.filePath ? (
                <button
                  type="button"
                  className="btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    padding: '6px 12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--accent-success)'
                  }}
                  onClick={() => handleOpenFile(doc.filePath)}
                >
                  <ExternalLink size={13} /> Open File
                </button>
              ) : null}

              <button
                type="button"
                className="btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  padding: '6px 12px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: 'var(--text-primary)'
                }}
                onClick={() => handleAttachDocumentFile(doc.id, doc.label)}
                disabled={uploadingDocId === doc.id}
              >
                <Upload size={13} /> {doc.filePath ? 'Replace File' : 'Attach File'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    documentChecklist: prev.documentChecklist.filter(d => d.id !== doc.id)
                  }));
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                title="Remove checklist item"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Item */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
        <input
          type="text"
          placeholder="Add custom required document item (e.g. Police Traffic Accident Report)..."
          className="input-field"
          style={{ flex: 1, fontSize: '13px' }}
          value={customChecklistLabel}
          onChange={(e) => setCustomChecklistLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomChecklistItem(e); }}
        />
        <button
          type="button"
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          onClick={handleAddCustomChecklistItem}
        >
          <Plus size={14} /> Add Item
        </button>
      </div>

      {/* Case Notes & Timeline Section */}
      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
          Case Progression & Advisor Logs
        </h4>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Record timeline note (e.g. 'Submitted appeal for MRI bill via Great Eastern portal')..."
            className="input-field"
            style={{ flex: 1, fontSize: '13px' }}
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddTimelineNote(e); }}
          />
          <button
            type="button"
            className="btn btn-primary"
            style={{ fontSize: '12px', padding: '8px 16px' }}
            onClick={handleAddTimelineNote}
          >
            Add Log Note
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
          {(formData.timelineNotes || []).map(note => (
            <div
              key={note.id}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}
            >
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{note.note}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Stage: <strong style={{ color: 'var(--accent-primary)' }}>{note.stage || formData.status}</strong> • {new Date(note.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
