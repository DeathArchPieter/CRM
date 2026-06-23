import { useState } from 'react';
import { FileText, UploadCloud, Calculator, DollarSign, AlertCircle, Trash2, FileSpreadsheet, RefreshCw, BarChart3, CreditCard, Calendar, User } from 'lucide-react';

const cardStyle = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-light)',
  borderRadius: '14px',
  padding: '28px',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  boxShadow: 'var(--shadow-md)',
};

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const selectStyle = {
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  background: 'var(--bg-base)',
  border: '1px solid var(--border-light)',
  color: 'var(--text-primary)',
  padding: '12px 40px 12px 16px',
  borderRadius: '8px',
  fontSize: '14px',
  outline: 'none',
  fontFamily: 'inherit',
  cursor: 'pointer',
  transition: 'border-color var(--transition-fast)',
  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 16px center',
  backgroundSize: '16px',
};

const ALL_CATEGORIES = ['Dining', 'Shopping', 'Travel', 'Groceries', 'Transport', 'Others'];
const CATEGORY_COLORS = {
  Dining: '#8b5cf6',
  Shopping: '#ec4899',
  Travel: '#06b6d4',
  Groceries: '#10b981',
  Transport: '#f59e0b',
  Others: '#64748b'
};

const getCategoryStyle = (cat) => {
  const color = CATEGORY_COLORS[cat] || '#64748b';
  return {
    backgroundColor: `${color}1a`, // 10% opacity in hex
    color: color
  };
};

const MOCK_CARD_STATEMENT_DATA = {
  statementPeriod: '01 Jun 2026 - 22 Jun 2026',
  dueDate: '15 Jul 2026',
  totalOutstanding: 2555.70,
  minimumPayment: 127.79,
  cardholders: [
    {
      id: 'ch-pieter',
      name: 'Pieter Beetsma',
      cardNumber: 'xxxx-xxxx-xxxx-4281',
      role: 'Main Cardholder',
      totalSpend: 1620.50,
      transactionCount: 6,
      topCategory: 'Travel',
      categories: [
        { name: 'Travel', amount: 1100.00, percentage: 68, color: '#06b6d4' },
        { name: 'Dining', amount: 320.00, percentage: 20, color: '#8b5cf6' },
        { name: 'Groceries', amount: 125.50, percentage: 8, color: '#10b981' },
        { name: 'Transport', amount: 75.00, percentage: 4, color: '#f59e0b' }
      ],
      transactions: [
        { date: '2026-06-20', merchant: 'Singapore Airlines', category: 'Travel', amount: 650.00 },
        { date: '2026-06-12', merchant: 'Grand Hyatt Singapore', category: 'Travel', amount: 450.00 },
        { date: '2026-06-18', merchant: 'Cut by Wolfgang Puck', category: 'Dining', amount: 320.00 },
        { date: '2026-06-15', merchant: 'Cold Storage Supermarket', category: 'Groceries', amount: 125.50 },
        { date: '2026-06-21', merchant: 'Grab Ride-Hailing', category: 'Transport', amount: 35.00 },
        { date: '2026-06-22', merchant: 'SimplyGo MRT', category: 'Transport', amount: 40.00 }
      ]
    },
    {
      id: 'ch-sarah',
      name: 'Sarah Beetsma',
      cardNumber: 'xxxx-xxxx-xxxx-9014',
      role: 'Supplementary Cardholder',
      totalSpend: 935.20,
      transactionCount: 8,
      topCategory: 'Shopping',
      categories: [
        { name: 'Shopping', amount: 520.00, percentage: 56, color: '#ec4899' },
        { name: 'Others', amount: 135.00, percentage: 14, color: '#64748b' },
        { name: 'Dining', amount: 130.20, percentage: 14, color: '#8b5cf6' },
        { name: 'Groceries', amount: 95.00, percentage: 10, color: '#10b981' },
        { name: 'Transport', amount: 55.00, percentage: 6, color: '#f59e0b' }
      ],
      transactions: [
        { date: '2026-06-19', merchant: 'Apple Store Plaza', category: 'Shopping', amount: 280.00 },
        { date: '2026-06-10', merchant: 'Zara Orchard Road', category: 'Shopping', amount: 240.00 },
        { date: '2026-06-15', merchant: 'Amazon Prime', category: 'Others', amount: 135.00 },
        { date: '2026-06-16', merchant: 'Din Tai Fung', category: 'Dining', amount: 115.20 },
        { date: '2026-06-14', merchant: 'FairPrice Finest', category: 'Groceries', amount: 95.00 },
        { date: '2026-06-22', merchant: 'Starbucks Coffee', category: 'Dining', amount: 15.00 },
        { date: '2026-06-18', merchant: 'GrabTaxi Singapore', category: 'Transport', amount: 40.00 },
        { date: '2026-06-21', merchant: 'Bus/MRT SimplyGo', category: 'Transport', amount: 15.00 }
      ]
    }
  ]
};

export default function SpecialReportsView() {
  const [selectedReportType, setSelectedReportType] = useState('pa-bonus');
  const [activeCardholderTab, setActiveCardholderTab] = useState('all');
  
  // Card Statement Analyzer states
  const [parsedStatementData, setParsedStatementData] = useState(null);
  const [error, setError] = useState('');
  const [searchMerchant, setSearchMerchant] = useState('');
  const [minAmountFilter, setMinAmountFilter] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(ALL_CATEGORIES);
  const [analysisLogPath, setAnalysisLogPath] = useState('');

  // Quarterly PA Bonus Calculator states
  const [selectedQuarter, setSelectedQuarter] = useState('Q2');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Drag & drop state
  const [dragActive, setDragActive] = useState(false);

  const handleCategoryClick = (cardholderId, categoryName) => {
    setActiveCardholderTab(cardholderId);
    setSelectedCategories(prev => {
      if (prev.length === 1 && prev[0] === categoryName) {
        return ALL_CATEGORIES;
      } else {
        return [categoryName];
      }
    });
  };

  const handleToggleCategory = (categoryName) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryName)) {
        return prev.filter(c => c !== categoryName);
      } else {
        return [...prev, categoryName];
      }
    });
  };

  // File upload handlers
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setUploadedFile(file);
        setShowResults(false);
      } else {
        alert('Please upload a PDF file only.');
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setUploadedFile(file);
        setShowResults(false);
      } else {
        alert('Please upload a PDF file only.');
      }
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    setShowResults(false);
  };

  const handleCalculateBonus = (e) => {
    e.preventDefault();
    if (!uploadedFile) return;

    setCalculating(true);
    
    // Simulate parsing and calculation delay
    setTimeout(() => {
      setCalculating(false);
      setShowResults(true);
    }, 1500);
  };

  const handleAnalyzeStatement = (e) => {
    e.preventDefault();
    if (!uploadedFile) return;

    setCalculating(true);
    setError('');
    setParsedStatementData(null);
    setAnalysisLogPath('');
 
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result;
        const base64Data = dataUrl.split(',')[1];
        
        const res = await window.electronAPI.analyseCardStatement({ pdfBase64: base64Data });
        setCalculating(false);
        if (res.success) {
          setParsedStatementData(res.data);
          setAnalysisLogPath(res.logPath || '');
          setShowResults(true);
        } else {
          setError(res.error || 'Failed to parse card statement. Please try again.');
        }
      } catch (err) {
        setCalculating(false);
        setError(err.message || 'An error occurred during file reading.');
      }
    };
    reader.onerror = () => {
      setCalculating(false);
      setError('Failed to read statement file.');
    };
    reader.readAsDataURL(uploadedFile);
  };

  // Enriched cardholders with dynamic calculations from transactions list for math consistency
  const cardholders = parsedStatementData ? (parsedStatementData.cardholders || []).map(ch => {
    const txs = ch.transactions || [];
    const totalSpend = txs.reduce((sum, t) => sum + (t.amount || 0), 0);
    const transactionCount = txs.length;
    
    const categoryMap = {};
    ALL_CATEGORIES.forEach(catName => {
      categoryMap[catName] = {
        name: catName,
        amount: 0,
        percentage: 0,
        color: CATEGORY_COLORS[catName] || '#64748b'
      };
    });

    txs.forEach(t => {
      const catName = t.category || 'Others';
      if (categoryMap[catName]) {
        categoryMap[catName].amount += (t.amount || 0);
      } else {
        categoryMap['Others'].amount += (t.amount || 0);
      }
    });

    const categories = ALL_CATEGORIES.map(catName => {
      const cat = categoryMap[catName];
      cat.percentage = totalSpend > 0 ? Math.round((cat.amount / totalSpend) * 100) : 0;
      return cat;
    }).filter(cat => cat.amount > 0);
    
    categories.sort((a, b) => b.amount - a.amount);
    const topCategory = categories.length > 0 ? categories[0].name : '—';

    return {
      ...ch,
      totalSpend,
      transactionCount,
      topCategory,
      categories
    };
  }) : [];

  // Filtered transactions calculation
  const getFilteredMergedTransactions = () => {
    if (cardholders.length === 0) return [];
    const merged = cardholders.reduce((acc, ch) => {
      const txs = (ch.transactions || []).map(t => ({ ...t, cardholder: ch.name, cardholderId: ch.id }));
      return [...acc, ...txs];
    }, []);

    return merged.filter(tx => {
      if (searchMerchant && !tx.merchant?.toLowerCase().includes(searchMerchant.toLowerCase())) {
        return false;
      }
      if (!selectedCategories.includes(tx.category)) {
        return false;
      }
      if (minAmountFilter && tx.amount < parseFloat(minAmountFilter)) {
        return false;
      }
      return true;
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  };

  const getFilteredCardholderTransactions = (cardholder) => {
    if (!cardholder) return [];
    return (cardholder.transactions || []).filter(tx => {
      if (searchMerchant && !tx.merchant?.toLowerCase().includes(searchMerchant.toLowerCase())) {
        return false;
      }
      if (!selectedCategories.includes(tx.category)) {
        return false;
      }
      if (minAmountFilter && tx.amount < parseFloat(minAmountFilter)) {
        return false;
      }
      return true;
    });
  };

  const filteredMergedTransactions = getFilteredMergedTransactions();

  const renderFilterBar = () => {
    const isCategoriesFiltered = selectedCategories.length !== ALL_CATEGORIES.length;
    return (
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        {/* Search Merchant */}
        <div style={{ flex: '1', minWidth: '180px' }}>
          <input 
            type="text"
            placeholder="Search merchant name..."
            value={searchMerchant}
            onChange={(e) => setSearchMerchant(e.target.value)}
            className="input-field"
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '13px',
              background: 'var(--bg-base)',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        </div>

        {/* Min Amount */}
        <div style={{ width: '120px' }}>
          <input 
            type="number"
            placeholder="Min Amount ($)"
            value={minAmountFilter}
            onChange={(e) => setMinAmountFilter(e.target.value)}
            className="input-field"
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '13px',
              background: 'var(--bg-base)',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        </div>

        {/* Reset button */}
        {(searchMerchant || isCategoriesFiltered || minAmountFilter) && (
          <button
            type="button"
            onClick={() => {
              setSearchMerchant('');
              setMinAmountFilter('');
              setSelectedCategories(ALL_CATEGORIES);
            }}
            className="btn"
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.08)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              height: '34px',
              display: 'inline-flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            Reset Filters
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="view-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Header */}
      <header>
        <h1 className="text-gradient" style={{ fontSize: '24px', marginBottom: '4px' }}>Special Reports</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Select and configure business intelligence reports and incentive calculators
        </p>
      </header>

      {/* Report Selector Card */}
      <div className="glass-panel" style={cardStyle}>
        <div style={inputGroupStyle}>
          <label className="input-label" style={{ fontSize: '13px', fontWeight: '600' }}>Choose Report Type</label>
          <select 
            value={selectedReportType} 
            onChange={(e) => {
              setSelectedReportType(e.target.value);
              setShowResults(false);
              setUploadedFile(null);
              setActiveCardholderTab('all');
              setError('');
              setParsedStatementData(null);
              setSearchMerchant('');
              setMinAmountFilter('');
              setSelectedCategories(ALL_CATEGORIES);
              setAnalysisLogPath('');
            }}
            style={selectStyle}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
          >
            <option value="pa-bonus">Quarterly PA Bonus Calculator</option>
            <option value="card-statement">Card Statement Analysis</option>
            <option value="product-distribution">Product Distribution Analysis (Upcoming)</option>
            <option value="client-demographics">Client Demographics Audit (Upcoming)</option>
          </select>
        </div>
      </div>

      {/* Dynamic Report Content Section */}
      {selectedReportType === 'pa-bonus' && (
        <div className="glass-panel animate-fade-in" style={cardStyle}>
          <div>
            <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', marginBottom: '4px' }}>
              <Calculator size={20} color="var(--accent-primary)" /> Quarterly PA Bonus Calculator
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              Estimate your personal accident commission bonus by uploading your PDF statement for the quarter.
            </p>
          </div>

          <form onSubmit={handleCalculateBonus} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Year & Quarter Selectors */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={inputGroupStyle}>
                <label className="input-label">Select Year</label>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value)} 
                  style={{ ...selectStyle, padding: '10px 36px 10px 14px', backgroundPosition: 'right 14px center' }}
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>

              <div style={inputGroupStyle}>
                <label className="input-label">Select Quarter</label>
                <select 
                  value={selectedQuarter} 
                  onChange={(e) => setSelectedQuarter(e.target.value)} 
                  style={{ ...selectStyle, padding: '10px 36px 10px 14px', backgroundPosition: 'right 14px center' }}
                >
                  <option value="Q1">Q1 (Jan - Mar)</option>
                  <option value="Q2">Q2 (Apr - Jun)</option>
                  <option value="Q3">Q3 (Jul - Sep)</option>
                  <option value="Q4">Q4 (Oct - Dec)</option>
                </select>
              </div>
            </div>

            {/* Drag & Drop PDF upload area */}
            <div style={inputGroupStyle}>
              <label className="input-label">Upload PDF Commission Statement</label>
              
              {!uploadedFile ? (
                <div 
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  style={{
                    border: dragActive ? '2px dashed var(--accent-primary)' : '2px dashed var(--border-light)',
                    background: dragActive ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.01)',
                    borderRadius: '10px',
                    padding: '36px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all var(--transition-fast) ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}
                >
                  <input 
                    type="file" 
                    id="pdf-upload" 
                    accept=".pdf"
                    onChange={handleFileChange}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer',
                    }}
                  />
                  <UploadCloud size={32} color="var(--text-secondary)" style={{ opacity: 0.7 }} />
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>
                      Drag and drop your PDF statement here, or <span style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>browse files</span>
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Only PDF format is supported
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{
                  border: '1px solid rgba(16,185,129,0.3)',
                  background: 'rgba(16,185,129,0.04)',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{ padding: '8px', background: 'rgba(16,185,129,0.12)', color: 'var(--accent-success)', borderRadius: '8px', display: 'flex' }}>
                      <FileText size={18} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {uploadedFile.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {(uploadedFile.size / 1024).toFixed(1)} KB · PDF Document
                      </div>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={clearFile}
                    className="btn" 
                    style={{ padding: '6px', background: 'none', color: 'var(--text-muted)', display: 'flex' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Calculate Button */}
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '12px', fontSize: '14px', marginTop: '4px' }}
              disabled={calculating || !uploadedFile}
            >
              {calculating ? (
                <><RefreshCw size={15} className="animate-spin" /> Analyzing Statement PDF...</>
              ) : (
                <><Calculator size={15} /> Calculate Estimated Bonus</>
              )}
            </button>

          </form>

          {/* Simulated Results Section */}
          {showResults && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border-light)', paddingTop: '24px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>Estimated Bonus Results</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Based on calculations for {selectedQuarter} {selectedYear}</p>
              </div>

              {/* Bonus Highlight Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(6,182,212,0.07) 100%)',
                border: '1px solid rgba(139,92,246,0.25)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Estimated PA Bonus</div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px', textShadow: '0 0 10px rgba(139,92,246,0.2)' }}>$0.00</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Bonus calculation rules pending configuration</div>
                </div>
                <div style={{ padding: '12px', borderRadius: '50%', background: 'rgba(139,92,246,0.15)', color: 'var(--accent-primary)', display: 'flex' }}>
                  <DollarSign size={24} />
                </div>
              </div>

              {/* Status Alert */}
              <div style={{ display: 'flex', gap: '10px', backgroundColor: 'rgba(245,158,11,0.06)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.2)' }}>
                <AlertCircle size={16} color="var(--accent-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  <strong>Rules Pending Setup</strong>: The interface is fully ready. The specific logic and arithmetic criteria for the PA bonus will be wired here once defined.
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Placeholder: Product Distribution Analysis */}
      {selectedReportType === 'product-distribution' && (
        <div className="glass-panel animate-fade-in" style={{ ...cardStyle, padding: '40px', alignItems: 'center', justifyContent: 'center', minHeight: '220px', textLight: 'center' }}>
          <BarChart3 size={32} color="var(--text-muted)" style={{ opacity: 0.5, marginBottom: '12px' }} />
          <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>Product Distribution Analysis</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', maxWidth: '320px', textAlign: 'center', lineHeight: '1.6', margin: 0 }}>
            This report will detail policy product metrics across Whole Life, Term, Shield, and Investment accounts. Currently scheduled for upcoming implementation.
          </p>
        </div>
      )}

      {/* Placeholder: Client Demographics Audit */}
      {selectedReportType === 'client-demographics' && (
        <div className="glass-panel animate-fade-in" style={{ ...cardStyle, padding: '40px', alignItems: 'center', justifyContent: 'center', minHeight: '220px', textLight: 'center' }}>
          <FileSpreadsheet size={32} color="var(--text-muted)" style={{ opacity: 0.5, marginBottom: '12px' }} />
          <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>Client Demographics Audit</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', maxWidth: '320px', textAlign: 'center', lineHeight: '1.6', margin: 0 }}>
            This audit report will break down advisor clients by age spreads, geographical locations, and average sum assured. Currently scheduled for upcoming implementation.
          </p>
        </div>
      )}

      {/* Card Statement Analysis Form View */}
      {selectedReportType === 'card-statement' && !showResults && (
        <div className="glass-panel animate-fade-in" style={cardStyle}>
          <div>
            <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', marginBottom: '4px' }}>
              <CreditCard size={20} color="var(--accent-primary)" /> Card Statement Analysis
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              Upload a PDF credit card statement to analyze monthly spend, category allocations, and track transaction details across main and supplementary cardholders.
            </p>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px' }}>
              <AlertCircle size={14} color="#f87171" style={{ flexShrink: 0, marginTop: '1px' }} />
              <span style={{ fontSize: '13px', color: '#f87171' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleAnalyzeStatement} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Drag & Drop PDF upload area */}
            <div style={inputGroupStyle}>
              <label className="input-label">Upload PDF Card Statement</label>
              
              {!uploadedFile ? (
                <div 
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  style={{
                    border: dragActive ? '2px dashed var(--accent-primary)' : '2px dashed var(--border-light)',
                    background: dragActive ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.01)',
                    borderRadius: '10px',
                    padding: '36px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all var(--transition-fast) ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}
                >
                  <input 
                    type="file" 
                    id="card-pdf-upload" 
                    accept=".pdf"
                    onChange={handleFileChange}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer',
                    }}
                  />
                  <UploadCloud size={32} color="var(--text-secondary)" style={{ opacity: 0.7 }} />
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>
                      Drag and drop your PDF card statement here, or <span style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>browse files</span>
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Only PDF format is supported
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{
                  border: '1px solid rgba(16,185,129,0.3)',
                  background: 'rgba(16,185,129,0.04)',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{ padding: '8px', background: 'rgba(16,185,129,0.12)', color: 'var(--accent-success)', borderRadius: '8px', display: 'flex' }}>
                      <FileText size={18} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {uploadedFile.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {(uploadedFile.size / 1024).toFixed(1)} KB · PDF Document
                      </div>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={clearFile}
                    className="btn" 
                    style={{ padding: '6px', background: 'none', color: 'var(--text-muted)', display: 'flex' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Analyze Button */}
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '12px', fontSize: '14px', marginTop: '4px' }}
              disabled={calculating || !uploadedFile}
            >
              {calculating ? (
                <><RefreshCw size={15} className="animate-spin" /> Analyzing Card Statement PDF...</>
              ) : (
                <><CreditCard size={15} /> Analyze Card Statement</>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Card Statement Analysis Results View */}
      {selectedReportType === 'card-statement' && showResults && parsedStatementData && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Header Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Statement Analysis Results</h3>
            <button 
              onClick={() => {
                setShowResults(false);
                setUploadedFile(null);
                setParsedStatementData(null);
                setSearchMerchant('');
                setMinAmountFilter('');
                setSelectedCategories(ALL_CATEGORIES);
              }}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Upload Another Statement
            </button>
          </div>

          {/* Statement Summary Banner */}
          <div className="glass-panel" style={{
            ...cardStyle, 
            padding: '20px 24px', 
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(139, 92, 246, 0.05) 100%)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Statement Spend</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--accent-primary)', marginTop: '4px' }}>
                  ${(parsedStatementData.totalOutstanding || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statement Period</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={13} color="var(--text-muted)" /> {parsedStatementData.statementPeriod || '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Due Date</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#fb923c', marginTop: '8px' }}>
                  {parsedStatementData.dueDate || '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Minimum Payment Due</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '8px' }}>
                  ${(parsedStatementData.minimumPayment || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Log File Alert */}
          {analysisLogPath && (
            <div className="glass-panel animate-fade-in" style={{
              ...cardStyle,
              padding: '14px 20px',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'rgba(139, 92, 246, 0.04)',
              border: '1px solid rgba(139, 92, 246, 0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                <FileText size={16} color="var(--accent-primary)" />
                <span>
                  Dynamic transaction analysis log saved to: <code style={{ color: 'var(--text-primary)', background: 'rgba(0,0,0,0.15)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '11.5px' }}>gemini_card_analysis_log.txt</code>
                </span>
              </div>
              <button 
                onClick={() => window.electronAPI.openPath(analysisLogPath)}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px', height: '30px' }}
              >
                Open Log File
              </button>
            </div>
          )}

          {/* Interactive Cardholder Switcher Tab Bar */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
            <button 
              onClick={() => setActiveCardholderTab('all')}
              className="sidebar-btn"
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '12.5px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                background: activeCardholderTab === 'all' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                color: activeCardholderTab === 'all' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                transition: 'all var(--transition-fast)'
              }}
            >
              Overview (All Holders)
            </button>
            {cardholders.map(ch => (
              <button 
                key={ch.id}
                onClick={() => setActiveCardholderTab(ch.id)}
                className="sidebar-btn"
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '12.5px',
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeCardholderTab === ch.id ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                  color: activeCardholderTab === ch.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {ch.name} ({ch.role === 'Main Cardholder' ? 'Main' : 'Suppl'})
              </button>
            ))}
          </div>

          {/* Dashboard Panel: Overview Tab */}
          {activeCardholderTab === 'all' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Stacked Holders */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {cardholders.map(ch => (
                  <div key={ch.id} className="glass-panel" style={{ ...cardStyle, padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{ch.name}</h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{ch.cardNumber}</span>
                      </div>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        backgroundColor: ch.role === 'Main Cardholder' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                        color: ch.role === 'Main Cardholder' ? '#34d399' : '#22d3ee'
                      }}>
                        {ch.role === 'Main Cardholder' ? 'Main' : 'Supplementary'}
                      </span>
                    </div>

                    {/* Metrics Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '10px' }}>
                      <div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Spent</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                          ${(ch.totalSpend || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Transactions</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                          {ch.transactionCount || 0} items
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Top Category</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--accent-primary)', marginTop: '2px' }}>
                          {ch.topCategory || '—'}
                        </div>
                      </div>
                    </div>

                    {/* Spend distribution progress bars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>Spend Categories</div>
                      {(ch.categories || []).map((cat, idx) => {
                        const isActive = selectedCategories.length === 1 && selectedCategories[0] === cat.name;
                        const isChecked = selectedCategories.includes(cat.name);
                        return (
                          <div 
                            key={idx} 
                            onClick={() => handleCategoryClick(ch.id, cat.name)}
                            style={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              gap: '4px',
                              cursor: 'pointer',
                              padding: '4px 8px',
                              margin: '0 -8px',
                              borderRadius: '6px',
                              background: isActive ? 'rgba(255,255,255,0.03)' : 'transparent',
                              borderLeft: isActive ? `3px solid ${cat.color || 'var(--accent-primary)'}` : '3px solid transparent',
                              opacity: isChecked ? 1 : 0.35,
                              transition: 'all 0.2s ease',
                            }}
                            title={isActive ? "Click to reset categories" : `Click to view ONLY ${cat.name} transactions`}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                            onMouseLeave={e => e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.03)' : 'transparent'}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={() => handleToggleCategory(cat.name)}
                                  style={{ cursor: 'pointer' }}
                                />
                                {cat.name}
                              </span>
                              <span>${(cat.amount || 0).toFixed(2)} ({cat.percentage || 0}%)</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ 
                                width: `${cat.percentage || 0}%`, 
                                height: '100%', 
                                background: cat.color || 'var(--accent-primary)',
                                borderRadius: '3px',
                                transition: 'width 0.4s ease'
                              }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Merged Transactions list */}
              <div className="glass-panel" style={{ ...cardStyle, padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>Merged Statement Transactions</h4>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    Filtered Total: <strong style={{ color: 'var(--accent-primary)', fontSize: '14px' }}>${filteredMergedTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> ({filteredMergedTransactions.length} items)
                  </span>
                </div>
                
                {renderFilterBar()}
                
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cardholder</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Merchant</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMergedTransactions.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No transactions found matching your filters.
                          </td>
                        </tr>
                      ) : (
                        filteredMergedTransactions.map((tx, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{tx.date || '—'}</td>
                            <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                                <User size={11} color="var(--text-muted)" /> {tx.cardholder}
                              </span>
                            </td>
                            <td style={{ padding: '8px 10px', color: 'var(--text-primary)', fontWeight: '500' }}>{tx.merchant || '—'}</td>
                            <td style={{ padding: '8px 10px' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '10.5px',
                                fontWeight: '500',
                                ...getCategoryStyle(tx.category)
                              }}>
                                {tx.category || 'Others'}
                              </span>
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: '600' }}>
                              ${(tx.amount || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Dashboard Panel: Specific Cardholder Tabs */}
          {activeCardholderTab !== 'all' && (() => {
            const ch = cardholders.find(c => c.id === activeCardholderTab);
            if (!ch) return null;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px' }}>
                  
                  {/* Detailed cardholder transactions */}
                  <div className="glass-panel" style={{ ...cardStyle, padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                          Transactions for {ch.name}
                        </h4>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Card ending {ch.cardNumber ? ch.cardNumber.slice(-4) : '—'}
                        </div>
                      </div>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                        Filtered Total: <strong style={{ color: 'var(--accent-primary)', fontSize: '14px' }}>${getFilteredCardholderTransactions(ch).reduce((sum, tx) => sum + (tx.amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> ({getFilteredCardholderTransactions(ch).length} items)
                      </span>
                    </div>

                    {renderFilterBar()}

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Merchant</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredCardholderTransactions(ch).length === 0 ? (
                            <tr>
                              <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No transactions found matching your filters.
                              </td>
                            </tr>
                          ) : (
                            getFilteredCardholderTransactions(ch).map((tx, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{tx.date || '—'}</td>
                                <td style={{ padding: '8px 10px', color: 'var(--text-primary)', fontWeight: '500' }}>{tx.merchant || '—'}</td>
                                <td style={{ padding: '8px 10px' }}>
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '10.5px',
                                    fontWeight: '500',
                                    ...getCategoryStyle(tx.category)
                                  }}>
                                    {tx.category || 'Others'}
                                  </span>
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: '600' }}>
                                  ${(tx.amount || 0).toFixed(2)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Summary & Charts */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="glass-panel" style={{ ...cardStyle, padding: '24px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                        Spend Summary
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Spending</span>
                          <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                            ${(ch.totalSpend || 0).toFixed(2)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Transaction Count</span>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {ch.transactionCount || 0} transactions
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Highest category</span>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-primary)' }}>
                            {ch.topCategory || '—'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Card Ownership</span>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            backgroundColor: ch.role === 'Main Cardholder' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                            color: ch.role === 'Main Cardholder' ? '#34d399' : '#22d3ee'
                          }}>
                            {ch.role === 'Main Cardholder' ? 'Main' : 'Suppl'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="glass-panel" style={{ ...cardStyle, padding: '24px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                        Category Distribution
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(ch.categories || []).map((cat, idx) => {
                          const isActive = selectedCategories.length === 1 && selectedCategories[0] === cat.name;
                          const isChecked = selectedCategories.includes(cat.name);
                          return (
                            <div 
                              key={idx} 
                              onClick={() => handleCategoryClick(ch.id, cat.name)}
                              style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '4px',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                margin: '0 -8px',
                                borderRadius: '6px',
                                background: isActive ? 'rgba(255,255,255,0.03)' : 'transparent',
                                borderLeft: isActive ? `3px solid ${cat.color || 'var(--accent-primary)'}` : '3px solid transparent',
                                opacity: isChecked ? 1 : 0.35,
                                transition: 'all 0.2s ease',
                              }}
                              title={isActive ? "Click to reset categories" : `Click to view ONLY ${cat.name} transactions`}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                              onMouseLeave={e => e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.03)' : 'transparent'}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <input 
                                    type="checkbox"
                                    checked={isChecked}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={() => handleToggleCategory(cat.name)}
                                    style={{ cursor: 'pointer' }}
                                  />
                                  {cat.name}
                                </span>
                                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>${(cat.amount || 0).toFixed(2)} ({cat.percentage || 0}%)</span>
                              </div>
                              <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ 
                                  width: `${cat.percentage || 0}%`, 
                                  height: '100%', 
                                  background: cat.color || 'var(--accent-primary)',
                                  borderRadius: '3px',
                                  transition: 'width 0.4s ease'
                                }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })()}

        </div>
      )}

    </div>
  );
}
