import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2, X, Building, Check } from 'lucide-react';

/**
 * Format raw OneMap SG result into a clean, human-readable Singapore address
 */
function formatOneMapAddress(item) {
  const blk = item.BLK_NO && item.BLK_NO !== 'NIL' ? item.BLK_NO : '';
  const road = item.ROAD_NAME && item.ROAD_NAME !== 'NIL' ? item.ROAD_NAME : '';
  const building = item.BUILDING && item.BUILDING !== 'NIL' ? item.BUILDING : '';
  const postal = item.POSTAL && item.POSTAL !== 'NIL' ? item.POSTAL : '';

  // Title case helper
  const toTitleCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().replace(/(^|\s|-|\/)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());
  };

  const formattedRoad = toTitleCase(road);
  const formattedBuilding = toTitleCase(building);

  let parts = [];
  if (blk && formattedRoad) {
    parts.push(`${blk} ${formattedRoad}`);
  } else if (formattedRoad) {
    parts.push(formattedRoad);
  }

  if (formattedBuilding && formattedBuilding.toLowerCase() !== formattedRoad.toLowerCase()) {
    parts.push(formattedBuilding);
  }

  if (postal) {
    parts.push(`Singapore ${postal}`);
  }

  return parts.join(', ') || item.ADDRESS || '';
}

export default function AddressAutocomplete({
  value = '',
  onChange,
  onSelect,
  name = 'address',
  placeholder = 'Search postal code (e.g. 048581), street, or building...',
  className = 'input-field',
  style = {},
  disabled = false,
  required = false,
  id
}) {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const containerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Synchronize internal value if external prop changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch OneMap SG suggestions
  const fetchAddressSuggestions = async (query) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(trimmed)}&returnGeom=N&getAddrDetails=Y`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`OneMap API error: ${response.statusText}`);
      }

      const data = await response.json();
      if (data && data.results && data.results.length > 0) {
        setSuggestions(data.results.slice(0, 8)); // Top 8 results
        setIsOpen(true);
        setHighlightedIndex(-1);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    } catch (err) {
      console.warn('Address autocomplete fetch failed, fallback to manual entry:', err);
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);

    // Bubble change event up to parent form
    if (onChange) {
      onChange(e);
    }

    // Debounce search query
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        fetchAddressSuggestions(val);
      }, 250);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelectSuggestion = (item) => {
    const formatted = formatOneMapAddress(item);
    setInputValue(formatted);
    setIsOpen(false);
    setSuggestions([]);

    // Trigger synthetic change event for React form handlers
    if (onChange) {
      const syntheticEvent = {
        target: {
          name,
          value: formatted
        }
      };
      onChange(syntheticEvent);
    }

    if (onSelect) {
      onSelect(item, formatted);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setInputValue('');
    setSuggestions([]);
    setIsOpen(false);
    if (onChange) {
      onChange({ target: { name, value: '' } });
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <MapPin 
          size={16} 
          color="var(--accent-primary, #60a5fa)" 
          style={{ position: 'absolute', left: '12px', pointerEvents: 'none', zIndex: 1 }} 
        />
        
        <input
          id={id}
          type="text"
          name={name}
          className={className}
          style={{
            width: '100%',
            paddingLeft: '36px',
            paddingRight: loading || inputValue ? '36px' : '12px',
            ...style
          }}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          disabled={disabled}
          required={required}
          autoComplete="off"
        />

        <div style={{ position: 'absolute', right: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {loading && (
            <Loader2 size={15} color="var(--text-muted)" className="animate-spin" />
          )}
          {!loading && inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px'
              }}
              title="Clear address"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: '#0f172a',
            backgroundImage: 'linear-gradient(rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.99))',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-light, rgba(255, 255, 255, 0.12))',
            borderRadius: '10px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            maxHeight: '260px',
            overflowY: 'auto',
            padding: '4px'
          }}
        >
          <div style={{ padding: '6px 10px', fontSize: '11px', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🇸🇬 Singapore OneMap Suggestions</span>
            <span style={{ fontSize: '10px', color: 'var(--accent-primary)' }}>Click or Enter to select</span>
          </div>

          {suggestions.map((item, index) => {
            const formatted = formatOneMapAddress(item);
            const isHighlighted = index === highlightedIndex;
            const hasBuilding = item.BUILDING && item.BUILDING !== 'NIL';

            return (
              <div
                key={`${item.SEARCHVAL}-${index}`}
                onClick={() => handleSelectSuggestion(item)}
                onMouseEnter={() => setHighlightedIndex(index)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: isHighlighted ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  borderLeft: isHighlighted ? '3px solid var(--accent-primary, #60a5fa)' : '3px solid transparent',
                  transition: 'background-color 0.1s ease',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}
              >
                <div style={{ marginTop: '2px', color: isHighlighted ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                  {hasBuilding ? <Building size={15} /> : <MapPin size={15} />}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: isHighlighted ? '#ffffff' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {hasBuilding ? item.BUILDING : `${item.BLK_NO ? 'Blk ' + item.BLK_NO + ' ' : ''}${item.ROAD_NAME}`}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {formatted}
                  </div>
                </div>

                {item.POSTAL && item.POSTAL !== 'NIL' && (
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--text-secondary)',
                    fontWeight: '500',
                    alignSelf: 'center',
                    flexShrink: 0
                  }}>
                    {item.POSTAL}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
