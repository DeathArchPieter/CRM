import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function CollapsibleSection({
  id,
  title,
  subtitle,
  icon,
  badge,
  actions,
  defaultOpen = true,
  isOpen: controlledIsOpen,
  onToggle,
  children,
  style = {},
  headerStyle = {},
  bodyStyle = {}
}) {
  const isControlled = controlledIsOpen !== undefined;
  
  // Persistent collapse state if id is provided
  const [internalIsOpen, setInternalIsOpen] = useState(() => {
    if (id) {
      const saved = localStorage.getItem(`crm_section_open_${id}`);
      if (saved !== null) {
        return saved === 'true';
      }
    }
    return defaultOpen;
  });

  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const toggle = (e) => {
    // If clicking a button or action inside the header, don't toggle
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input') || e.target.closest('select')) {
      return;
    }
    const next = !isOpen;
    if (!isControlled) {
      setInternalIsOpen(next);
      if (id) {
        localStorage.setItem(`crm_section_open_${id}`, String(next));
      }
    }
    if (onToggle) {
      onToggle(next);
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '0',
        borderRadius: '16px',
        overflow: isOpen ? 'visible' : 'hidden',
        border: '1px solid var(--border-light)',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        ...style
      }}
    >
      {/* Clickable Header */}
      <div
        onClick={toggle}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          cursor: 'pointer',
          userSelect: 'none',
          backgroundColor: isOpen ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.01)',
          borderBottom: isOpen ? '1px solid var(--border-light)' : 'none',
          borderTopLeftRadius: '15px',
          borderTopRightRadius: '15px',
          borderBottomLeftRadius: !isOpen ? '15px' : '0',
          borderBottomRightRadius: !isOpen ? '15px' : '0',
          transition: 'background-color 0.15s ease',
          ...headerStyle
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isOpen ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.01)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
          {icon && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {icon}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', minWidth: 0 }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              {title}
            </h2>
            {badge && (
              <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                {typeof badge === 'string' || typeof badge === 'number' ? (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-light)'
                  }}>
                    {badge}
                  </span>
                ) : (
                  badge
                )}
              </div>
            )}
          </div>
          {subtitle && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '4px' }}>
              {subtitle}
            </span>
          )}
        </div>

        {/* Right side: Actions slot + Chevron Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {actions && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {actions}
            </div>
          )}
          <button
            type="button"
            className="btn"
            style={{
              padding: '6px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-secondary)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, background-color 0.15s ease'
            }}
            title={isOpen ? 'Collapse Section' : 'Expand Section'}
            onClick={(e) => {
              e.stopPropagation();
              toggle(e);
            }}
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Collapsible Content Body */}
      {isOpen && (
        <div
          style={{
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out',
            ...bodyStyle
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
