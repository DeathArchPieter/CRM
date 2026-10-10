import React from 'react';
import { 
  Receipt, Plus, Sparkles, Upload, Loader2, DollarSign, Layers, 
  Edit2, Trash2, ArrowRight, ExternalLink, Activity
} from 'lucide-react';
import DatePicker from '../DatePicker';

export default function IndemnityBillsLedger({
  formData,
  setFormData,
  formatCurrency,
  isDraggingOver,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  fileInputRef,
  handleFileInputChange,
  isAutoTagging,
  taggingProgress,
  autoTagNotification,
  newBill,
  setNewBill,
  isAddingBill,
  setIsAddingBill,
  editingBillId,
  setEditingBillId,
  handleAddBillItem,
  handleEditBill,
  handleCancelBillEdit,
  handleDeleteBillItem,
  handleAttachBillFile,
  handleMoveBillToSettlement,
  handleMoveBillToVault,
  handleOpenFile,
  onNext
}) {
  const totalIncurred = formData.billItems.reduce((sum, b) => sum + (Number(b.incurredAmount) || 0), 0);
  const totalClaimed = formData.billItems.reduce((sum, b) => sum + (Number(b.claimedAmount) || 0), 0);

  const tcmBillsTotal = formData.claimCategory === 'accident'
    ? formData.billItems
        .filter(b => (b.description || '').toLowerCase().includes('tcm') || (b.provider || '').toLowerCase().includes('tcm') || (b.description || '').toLowerCase().includes('physio') || (b.description || '').toLowerCase().includes('acupuncture'))
        .reduce((sum, b) => sum + (Number(b.incurredAmount) || 0), 0)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        padding: '14px 18px',
        borderRadius: '10px',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        fontSize: '13px',
        color: 'var(--text-secondary)',
        lineHeight: '1.5'
      }}>
        <strong style={{ color: 'var(--text-primary)' }}>Step 2 — Tag Bills to this Event:</strong> Drag & drop medical receipts or clinic invoices directly into the workspace. The AI automatically scans each bill, tags the date, clinic provider, procedure, invoice #, and amounts, and stores the receipt in the client claim vault.
      </div>

      {/* Bills Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: formData.claimCategory === 'accident' && formData.tcmSublimitCap ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: '12px' }}>
        <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Tagged Bills</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
            {formData.billItems.length} {formData.billItems.length === 1 ? 'Bill' : 'Bills'}
          </div>
        </div>

        <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Incurred Bills ($)</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
            {formatCurrency(totalIncurred)}
          </div>
        </div>

        <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Submitted Amount ($)</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#60a5fa', marginTop: '4px' }}>
            {formatCurrency(totalClaimed)}
          </div>
        </div>

        {formData.claimCategory === 'accident' && formData.tcmSublimitCap ? (
          <div style={{
            padding: '14px',
            borderRadius: '10px',
            backgroundColor: tcmBillsTotal > Number(formData.tcmSublimitCap) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            border: tcmBillsTotal > Number(formData.tcmSublimitCap) ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.25)'
          }}>
            <div style={{ fontSize: '11px', color: '#fbbf24' }}>TCM / Physio Sublimit</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: tcmBillsTotal > Number(formData.tcmSublimitCap) ? '#f87171' : '#fbbf24', marginTop: '4px' }}>
              {formatCurrency(tcmBillsTotal)} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ ${formData.tcmSublimitCap}</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Drag & Drop Medical Bills Auto-Tag Zone */}
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: isDraggingOver ? '2px dashed var(--accent-primary)' : '2px dashed rgba(139, 92, 246, 0.35)',
          borderRadius: '12px',
          padding: '24px 20px',
          textAlign: 'center',
          backgroundColor: isDraggingOver ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.03)',
          boxShadow: isDraggingOver ? '0 0 25px rgba(139, 92, 246, 0.3)' : 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />
        
        <div style={{
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          backgroundColor: isDraggingOver ? 'var(--accent-primary)' : 'rgba(139, 92, 246, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isDraggingOver ? '#fff' : 'var(--accent-primary)',
          transition: 'all 0.2s ease'
        }}>
          <Sparkles size={22} />
        </div>

        <div style={{ fontSize: '14.5px', fontWeight: '600', color: 'var(--text-primary)' }}>
          {isDraggingOver ? 'Drop claim documents here to auto-triage with Archie AI!' : 'Drag & Drop Claim Documents (Bills, Memos, Settlement Letters)'}
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '580px', margin: 0, lineHeight: '1.4' }}>
          Drop any batch of files (PDF, PNG, JPG, WEBP). Archie AI auto-classifies medical invoices, doctor clinical memos, and insurer settlement statements, routing each directly to its corresponding tab!
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
          <span className="btn btn-secondary" style={{ fontSize: '11.5px', padding: '5px 14px', pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Upload size={13} /> Or Click to Browse Files
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            • Multi-file batch triage • Bills → Tab 2 • Settlements → Tab 3 • Memos → Tab 4
          </span>
        </div>
      </div>

      {/* Batch Processing Status Card */}
      {isAutoTagging && (
        <div className="glass-panel animate-fade-in" style={{
          padding: '16px 20px',
          borderRadius: '12px',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="animate-spin" style={{ color: 'var(--accent-primary)', display: 'flex' }}>
                <Loader2 size={18} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                ⚡ Archie AI Auto-Triage in Progress... ({taggingProgress.current} of {taggingProgress.total} completed)
              </span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: '700' }}>
              {taggingProgress.total > 0 ? Math.round((taggingProgress.current / taggingProgress.total) * 100) : 0}%
            </span>
          </div>

          <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <div style={{
              width: `${taggingProgress.total > 0 ? (taggingProgress.current / taggingProgress.total) * 100 : 0}%`,
              height: '100%',
              backgroundColor: 'var(--accent-primary)',
              transition: 'width 0.25s ease'
            }} />
          </div>

          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            Analyzing: <code style={{ color: 'var(--text-primary)', backgroundColor: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>{taggingProgress.currentFileName}</code>
          </div>
        </div>
      )}

      {/* Auto-Tag Complete Feedback Banner */}
      {autoTagNotification && (
        <div className="glass-panel animate-fade-in" style={{
          padding: '14px 18px',
          borderRadius: '12px',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-success)' }}>
              🎉 Archie AI Auto-Triage Complete: Ingested {autoTagNotification.totalCount} {autoTagNotification.totalCount === 1 ? 'document' : 'documents'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '2px' }}>
              {autoTagNotification.billsCount > 0 && `• Tagged ${autoTagNotification.billsCount} clinic bills (${formatCurrency(autoTagNotification.billsTotal)}) `}
              {autoTagNotification.settlementsCount > 0 && `• Routed ${autoTagNotification.settlementsCount} settlement statements (${formatCurrency(autoTagNotification.settlementsTotal)}) to Step 3 `}
              {autoTagNotification.memosCount > 0 && `• Vaulted ${autoTagNotification.memosCount} doctor clinical memos to Step 4 `}
              {autoTagNotification.incidentsCount > 0 && `• Vaulted ${autoTagNotification.incidentsCount} incident reports `}
            </div>
          </div>
        </div>
      )}

      {/* Tagged Bills Header & Manual Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '14.5px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Receipt size={16} color="var(--accent-primary)" />
          Tagged Bills & Clinic Invoices
        </h3>
        <button
          type="button"
          className="btn btn-primary"
          style={{ fontSize: '12px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => {
            setEditingBillId(null);
            setIsAddingBill(true);
          }}
        >
          <Plus size={14} /> Tag Manual Bill
        </button>
      </div>

      {/* Inline Add/Edit Bill Form */}
      {isAddingBill && (
        <div className="glass-panel animate-fade-in" style={{ padding: '18px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
          <h4 style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {editingBillId ? 'Edit Tagged Clinic / Hospital Bill' : 'Tag New Clinic / Hospital Bill to Event'}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '12px' }}>
            <div>
              <label className="input-label" style={{ fontSize: '11px' }}>Bill / Invoice Date *</label>
              <DatePicker
                style={{ width: '100%', fontSize: '12px', padding: '6px 10px' }}
                value={newBill.billDate}
                onChange={(e) => setNewBill({ ...newBill, billDate: e.target.value })}
              />
            </div>
            <div>
              <label className="input-label" style={{ fontSize: '11px' }}>Description / Treatment Procedure *</label>
              <input
                type="text"
                placeholder="e.g. Pre-op MRI Scan or Surgery Hospital Bill"
                className="input-field"
                style={{ width: '100%', fontSize: '12px' }}
                value={newBill.description}
                onChange={(e) => setNewBill({ ...newBill, description: e.target.value })}
              />
            </div>
            <div>
              <label className="input-label" style={{ fontSize: '11px' }}>Clinic / Provider</label>
              <input
                type="text"
                placeholder="e.g. Novena Specialist Imaging"
                className="input-field"
                style={{ width: '100%', fontSize: '12px' }}
                value={newBill.provider}
                onChange={(e) => setNewBill({ ...newBill, provider: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <div>
              <label className="input-label" style={{ fontSize: '11px' }}>Bill / Tax Invoice No.</label>
              <input
                type="text"
                placeholder="INV-2026-XXXX"
                className="input-field"
                style={{ width: '100%', fontSize: '12px' }}
                value={newBill.billNumber}
                onChange={(e) => setNewBill({ ...newBill, billNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="input-label" style={{ fontSize: '11px' }}>Incurred Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="input-field"
                style={{ width: '100%', fontSize: '12px' }}
                value={newBill.incurredAmount}
                onChange={(e) => setNewBill({ ...newBill, incurredAmount: e.target.value, claimedAmount: e.target.value })}
              />
            </div>
            <div>
              <label className="input-label" style={{ fontSize: '11px' }}>Amount Claimed ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="input-field"
                style={{ width: '100%', fontSize: '12px' }}
                value={newBill.claimedAmount}
                onChange={(e) => setNewBill({ ...newBill, claimedAmount: e.target.value })}
              />
            </div>
            <div>
              <label className="input-label" style={{ fontSize: '11px' }}>Submission Status</label>
              <select
                className="input-field"
                style={{ width: '100%', fontSize: '12px' }}
                value={newBill.status}
                onChange={(e) => setNewBill({ ...newBill, status: e.target.value })}
              >
                <option value="Pending Insurer Payout">Pending Submission</option>
                <option value="Submitted to Insurer">Submitted to Insurer</option>
                <option value="Fully Paid">Fully Paid / Settled</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Disallowed / Non-Reimbursable">Disallowed</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              className="btn"
              style={{ fontSize: '12px', padding: '6px 12px' }}
              onClick={handleCancelBillEdit}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: '12px', padding: '6px 16px' }}
              onClick={handleAddBillItem}
            >
              {editingBillId ? 'Update Bill' : 'Tag Bill'}
            </button>
          </div>
        </div>
      )}

      {/* Tagged Bills Table */}
      {formData.billItems.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '10px', color: 'var(--text-muted)', fontSize: '13px' }}>
          No bills tagged to this event yet. Drag and drop bills into the box above or click "Tag Manual Bill".
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border-light)', borderRadius: '10px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-secondary)' }}>Date</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-secondary)' }}>Provider & Treatment</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-secondary)' }}>Invoice #</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>Incurred ($)</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>Claimed ($)</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-secondary)' }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>Receipt File</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {formData.billItems.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{item.billDate || '-'}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontWeight: '500' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{item.description}</span>
                      {item.aiTagged && (
                        <span style={{
                          fontSize: '10px',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(139, 92, 246, 0.2)',
                          color: 'var(--accent-primary)',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <Sparkles size={10} /> AI
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.provider}</div>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{item.billNumber || '-'}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: '600' }}>
                    {formatCurrency(item.incurredAmount)}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#60a5fa' }}>
                    {formatCurrency(item.claimedAmount)}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '500',
                      backgroundColor: item.status === 'Fully Paid' ? 'rgba(16, 185, 129, 0.15)' : item.status === 'Submitted to Insurer' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.05)',
                      color: item.status === 'Fully Paid' ? 'var(--accent-success)' : item.status === 'Submitted to Insurer' ? '#60a5fa' : 'var(--text-muted)'
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    {item.receiptFilePath ? (
                      <button
                        type="button"
                        className="btn"
                        style={{ padding: '3px 8px', fontSize: '11px', backgroundColor: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-primary)' }}
                        onClick={() => handleOpenFile(item.receiptFilePath)}
                      >
                        📄 View
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn"
                        style={{ padding: '3px 8px', fontSize: '11px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}
                        onClick={() => handleAttachBillFile(item.id)}
                      >
                        📎 Attach
                      </button>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleMoveBillToSettlement(item.id)}
                        style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', opacity: 0.75 }}
                        title="Re-route this bill to Step 3: Insurer Settlement Statement"
                      >
                        <DollarSign size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveBillToVault(item.id)}
                        style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', opacity: 0.75 }}
                        title="Move this document to Step 4: Document Vault"
                      >
                        <Layers size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditBill(item)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: 0.7 }}
                        title="Edit Bill Details"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBillItem(item.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: 0.6 }}
                        title="Delete Bill"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
        <button
          type="button"
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          onClick={onNext}
        >
          Proceed to Step 3: Reconciliation <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
