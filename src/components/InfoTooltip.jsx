import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

/**
 * Universal Info Tooltip Component
 * 
 * @param {string} title - Bold header title for the tooltip
 * @param {string} content - Main explanatory text / plain English description
 * @param {string} benchmark - Optional MAS/LIA or industry benchmark (e.g. "LIA Benchmark: 6 Months")
 * @param {string} placement - 'top' | 'bottom' | 'left' | 'right' (default: 'top')
 * @param {number} size - Icon size in px (default: 14)
 * @param {object} style - Extra container inline styling
 */
export default function InfoTooltip({ 
  title, 
  content, 
  benchmark, 
  placement = 'top',
  size = 13,
  style = {} 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Position calculations
  const getPlacementStyles = () => {
    switch (placement) {
      case 'bottom':
        return {
          top: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          right: 'calc(100% + 8px)',
          top: '50%',
          transform: 'translateY(-50%)',
        };
      case 'right':
        return {
          left: 'calc(100% + 8px)',
          top: '50%',
          transform: 'translateY(-50%)',
        };
      case 'top':
      default:
        return {
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
        };
    }
  };

  return (
    <span
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        margin: '0 4px',
        cursor: 'pointer',
        ...style
      }}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen(prev => !prev);
      }}
      role="tooltip"
      aria-label={title || 'Information'}
    >
      <span
        style={{
          width: `${size + 5}px`,
          height: `${size + 5}px`,
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isOpen ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.08)',
          color: isOpen ? '#c084fc' : 'var(--text-muted)',
          border: isOpen ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.12)',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 8px rgba(139, 92, 246, 0.3)' : 'none'
        }}
      >
        <Info size={size} />
      </span>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            zIndex: 99999,
            width: '260px',
            padding: '12px 14px',
            borderRadius: '10px',
            backgroundColor: 'rgba(15, 23, 42, 0.96)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.5), 0 0 15px rgba(139, 92, 246, 0.15)',
            textAlign: 'left',
            animation: 'fadeIn 0.2s ease forwards',
            pointerEvents: 'none',
            ...getPlacementStyles()
          }}
        >
          {title && (
            <div style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#f1f5f9',
              marginBottom: '5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#a78bfa' }} />
              {title}
            </div>
          )}

          {content && (
            <div style={{
              fontSize: '11.5px',
              color: 'var(--text-secondary)',
              lineHeight: '1.45',
              marginBottom: benchmark ? '8px' : '0'
            }}>
              {content}
            </div>
          )}

          {benchmark && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#93c5fd',
              fontSize: '10px',
              fontWeight: '600'
            }}>
              ⚖️ {benchmark}
            </div>
          )}
        </div>
      )}
    </span>
  );
}
