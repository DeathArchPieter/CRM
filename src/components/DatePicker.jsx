import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Clock, Check } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Generates an extensive year list from 1920 to 2060
const YEAR_OPTIONS = [];
for (let y = 1920; y <= 2060; y++) {
  YEAR_OPTIONS.push(y);
}

export default function DatePicker({
  value,
  onChange,
  name,
  placeholder = 'Select date...',
  disabled = false,
  style = {},
  className = 'input-field',
  min,
  max,
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse initial date or default to current date
  const parseValueToDate = (val) => {
    if (!val) return null;
    const parts = String(val).split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return new Date(y, m, d);
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  const selectedDate = parseValueToDate(value);
  const initialView = selectedDate || new Date();

  const [viewYear, setViewYear] = useState(initialView.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialView.getMonth());

  // Keep view year & month synced when value changes from outside
  useEffect(() => {
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatDateToString = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDisplayDate = (val) => {
    const d = parseValueToDate(val);
    if (!d) return '';
    const day = d.getDate();
    const month = MONTH_SHORT[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const handleSelectDate = (date) => {
    const strVal = formatDateToString(date);
    if (onChange) {
      onChange({
        target: {
          name: name || '',
          value: strVal
        }
      });
    }
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange({
        target: {
          name: name || '',
          value: ''
        }
      });
    }
  };

  // Month & Year Navigation Handlers
  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handlePrevYear = (e) => {
    e.stopPropagation();
    setViewYear(viewYear - 1);
  };

  const handleNextYear = (e) => {
    e.stopPropagation();
    setViewYear(viewYear + 1);
  };

  const handleYearChange = (e) => {
    e.stopPropagation();
    setViewYear(parseInt(e.target.value, 10));
  };

  const handleMonthChange = (e) => {
    e.stopPropagation();
    setViewMonth(parseInt(e.target.value, 10));
  };

  // Generate calendar days for current view
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const daysGrid = [];

  // Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    daysGrid.push({
      day: prevMonthDays - i,
      month: viewMonth - 1,
      year: viewMonth === 0 ? viewYear - 1 : viewYear,
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    daysGrid.push({
      day: d,
      month: viewMonth,
      year: viewYear,
      isCurrentMonth: true
    });
  }

  // Next month leading days to complete grid (42 cells max)
  const remainingCells = 42 - daysGrid.length;
  for (let d = 1; d <= remainingCells; d++) {
    daysGrid.push({
      day: d,
      month: viewMonth + 1,
      year: viewMonth === 11 ? viewYear + 1 : viewYear,
      isCurrentMonth: false
    });
  }

  const today = new Date();
  const isToday = (d, m, y) => {
    return today.getDate() === d && today.getMonth() === m && today.getFullYear() === y;
  };

  const isSelected = (d, m, y) => {
    if (!selectedDate) return false;
    return selectedDate.getDate() === d && selectedDate.getMonth() === m && selectedDate.getFullYear() === y;
  };

  // Preset Handlers
  const handleQuickPreset = (offsetDays) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    handleSelectDate(target);
  };

  const handleQuickPresetMonth = (offsetMonths) => {
    const target = new Date();
    target.setMonth(target.getMonth() + offsetMonths);
    handleSelectDate(target);
  };

  const handleQuickPresetYear = (offsetYears) => {
    const target = new Date();
    target.setFullYear(target.getFullYear() + offsetYears);
    handleSelectDate(target);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: style.width || '100%', display: 'inline-block' }}>
      {/* Hidden input to fulfill form requirements if needed */}
      <input
        type="hidden"
        name={name}
        value={value || ''}
        required={required}
      />

      {/* Input Trigger Box */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: '8px 12px',
          borderRadius: '8px',
          userSelect: 'none',
          backgroundColor: isOpen ? 'rgba(139, 92, 246, 0.08)' : undefined,
          borderColor: isOpen ? 'var(--accent-primary)' : undefined,
          boxShadow: isOpen ? '0 0 0 2px rgba(139, 92, 246, 0.2)' : undefined,
          transition: 'all 0.15s ease',
          ...style
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <Calendar size={14} color={value ? 'var(--accent-primary)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
          <span style={{
            fontSize: '13px',
            color: value ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: value ? '500' : '400',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {value ? formatDisplayDate(value) : placeholder}
          </span>
        </div>

        {value && !disabled ? (
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: 'none',
              border: 'none',
              padding: '2px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '4px',
              transition: 'color 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            title="Clear Date"
          >
            <X size={13} />
          </button>
        ) : null}
      </div>

      {/* Dropdown Calendar Popup */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 9999,
            width: '320px',
            backgroundColor: '#1e293b',
            backgroundImage: 'linear-gradient(180deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5), 0 0 15px rgba(139, 92, 246, 0.15)',
            backdropFilter: 'blur(16px)',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          {/* Header with Fast Year Navigation & Direct Month/Year Selectors */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '4px' }}>
            
            {/* Left Fast Chevrons (-1 Yr, -1 Mo) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <button
                type="button"
                onClick={handlePrevYear}
                title="Previous Year (-1 Yr)"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '5px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.12s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.2)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
              >
                <ChevronsLeft size={13} />
              </button>

              <button
                type="button"
                onClick={handlePrevMonth}
                title="Previous Month (-1 Mo)"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '5px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.12s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.2)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
              >
                <ChevronLeft size={13} />
              </button>
            </div>

            {/* Direct Month & Year Dropdown Selectors */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'center' }}>
              <select
                value={viewMonth}
                onChange={handleMonthChange}
                onClick={e => e.stopPropagation()}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  padding: '3px 6px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx} style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={handleYearChange}
                onClick={e => e.stopPropagation()}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  padding: '3px 6px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {YEAR_OPTIONS.map(y => (
                  <option key={y} value={y} style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Right Fast Chevrons (+1 Mo, +1 Yr) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <button
                type="button"
                onClick={handleNextMonth}
                title="Next Month (+1 Mo)"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '5px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.12s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.2)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
              >
                <ChevronRight size={13} />
              </button>

              <button
                type="button"
                onClick={handleNextYear}
                title="Next Year (+1 Yr)"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '5px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.12s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.2)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
              >
                <ChevronsRight size={13} />
              </button>
            </div>

          </div>

          {/* Day Names Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '6px' }}>
            {DAY_NAMES.map((d, idx) => (
              <div key={idx} style={{ textAlign: 'center', fontSize: '11px', fontWeight: '600', color: idx === 0 || idx === 6 ? '#94a3b8' : 'var(--text-muted)', padding: '2px 0' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', marginBottom: '14px' }}>
            {daysGrid.map((item, index) => {
              const selected = isSelected(item.day, item.month, item.year);
              const currentToday = isToday(item.day, item.month, item.year);

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectDate(new Date(item.year, item.month, item.day))}
                  style={{
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    border: currentToday && !selected ? '1px solid rgba(139, 92, 246, 0.6)' : '1px solid transparent',
                    background: selected
                      ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
                      : 'transparent',
                    color: selected
                      ? '#ffffff'
                      : item.isCurrentMonth
                      ? 'var(--text-primary)'
                      : 'rgba(255, 255, 255, 0.25)',
                    fontSize: '12px',
                    fontWeight: selected || currentToday ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {item.day}
                </button>
              );
            })}
          </div>

          {/* Quick Presets Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '4px',
            paddingTop: '10px',
            borderTop: '1px solid var(--border-light)'
          }}>
            <button
              type="button"
              onClick={() => handleQuickPreset(0)}
              style={{
                flex: 1,
                padding: '4px 6px',
                fontSize: '11px',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.03)',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset(1)}
              style={{
                flex: 1,
                padding: '4px 6px',
                fontSize: '11px',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.03)',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset(7)}
              style={{
                flex: 1,
                padding: '4px 6px',
                fontSize: '11px',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.03)',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              +1 Wk
            </button>
            <button
              type="button"
              onClick={() => handleQuickPresetMonth(1)}
              style={{
                flex: 1,
                padding: '4px 6px',
                fontSize: '11px',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.03)',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              +1 Mo
            </button>
            <button
              type="button"
              onClick={() => handleQuickPresetYear(1)}
              style={{
                flex: 1,
                padding: '4px 6px',
                fontSize: '11px',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.03)',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              +1 Yr
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
