import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft, Save, Sparkles, TrendingUp, Shield, DollarSign,
  AlertTriangle, CheckCircle2, RefreshCw, Plus, Trash2, Sliders,
  HelpCircle, Printer, Download, ChevronRight, Home, HeartPulse,
  GraduationCap, TrendingDown, UserX, Briefcase, Eye, Zap, Info,
  BookOpen, Calculator, Layers, Table, BarChart3, PieChart, Target,
  Compass, Flame, Check, Copy, Award, FileText, CheckSquare, Calendar,
  Building, Landmark, Activity, Clock, FileCheck, Bookmark, Baby
} from 'lucide-react';
import CpfLifePlaybookModal from '../components/CpfLifePlaybookModal';
import ProjectionGraphBreakdownModal from '../components/ProjectionGraphBreakdownModal';
import { useAdvisorContext } from '../context/AdvisorContext';

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(val) || val === '') return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(val) || 0);
};

const calculateAge = (dobString) => {
  if (!dobString) return null;
  const dob = new Date(dobString.includes('T') ? dobString : dobString + 'T00:00:00');
  if (isNaN(dob.getTime())) return null;
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const getInitialLifeEvents = (baseAge) => [
  {
    id: 'le_prop',
    type: 'property',
    title: '🏡 Private Property Upgrade',
    description: 'Upgrades to condominium; initial cash & CPF outlay with higher mortgage installment',
    active: false,
    triggerAge: Math.min(baseAge + 5, 60),
    lumpSumCost: 0,
    monthlyDelta: 0,
    durationYears: 20
  },
  {
    id: 'le_ci',
    type: 'critical_illness',
    title: '🩺 Major Critical Illness Shock',
    description: 'Loss of earned income during recovery + out-of-pocket medical treatments',
    active: false,
    triggerAge: Math.min(baseAge + 10, 60),
    lumpSumCost: 0,
    monthlyDelta: 0,
    durationYears: 3,
    hasInsuranceOffset: true
  },
  {
    id: 'le_child',
    type: 'child',
    title: '👶 Child Birth & University Milestone',
    description: 'Newborn delivery & childcare followed by tertiary tuition fees',
    active: false,
    triggerAge: Math.min(baseAge + 3, 50),
    lumpSumCost: 0,
    monthlyDelta: 0,
    durationYears: 18
  },
  {
    id: 'le_crash',
    type: 'market_crash',
    title: '📉 Pre-Retirement Market Shock (-30%)',
    description: 'Major recession before retirement, testing portfolio resilience',
    active: false,
    triggerAge: Math.max(baseAge, 58),
    lumpSumCost: 0,
    portfolioDropPercent: 30,
    durationYears: 1
  },
  {
    id: 'le_disability',
    type: 'disability',
    title: '♿ Total & Permanent Disability',
    description: 'Permanent loss of earned income plus ongoing long-term caregiving',
    active: false,
    triggerAge: Math.min(baseAge + 15, 60),
    lumpSumCost: 0,
    monthlyDelta: 0,
    durationYears: 10,
    hasInsuranceOffset: true
  },
  {
    id: 'le_sabbatical',
    type: 'sabbatical',
    title: '✈️ 1-Year Career Sabbatical / Upskilling',
    description: 'Takes 12 months off with 0 earned income for personal rejuvenation',
    active: false,
    triggerAge: Math.min(baseAge + 7, 55),
    lumpSumCost: 0,
    monthlyDelta: 0,
    durationYears: 1
  }
];

export default function ClientFinancialPlanView({ client, onBack, onUpdateClient }) {
  const calculatedClientAge = useMemo(() => calculateAge(client?.dob), [client?.dob]);
  const defaultBaseAge = calculatedClientAge || 30;

  // Tab State
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'retirement' | 'protection' | 'simulator' | 'ai-advisor'
  const [presentationMode, setPresentationMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [policies, setPolicies] = useState([]);

  // Modals for CPF Playbook and Projection Graph AI Breakdown
  const [isCpfModalOpen, setIsCpfModalOpen] = useState(false);
  const [isGraphBreakdownOpen, setIsGraphBreakdownOpen] = useState(false);

  const { setAdvisorContext, registerActionHandler } = useAdvisorContext();

  // Sync active blueprint tab with Archie 2.0
  useEffect(() => {
    const tabMapping = {
      'overview': 'balance-sheet',
      'retirement': 'retirement',
      'protection': 'protection',
      'simulator': 'simulator',
      'ai-advisor': 'blueprint',
      'report-preview': 'report-preview'
    };
    setAdvisorContext({
      section: 'clients',
      subSection: 'financial-plan',
      activeSubTab: tabMapping[activeTab] || 'balance-sheet',
      entityContext: {
        clientName: client?.fullName,
        clientId: client?.id
      }
    });
  }, [activeTab, client?.fullName, client?.id, setAdvisorContext]);

  // Register Archie Action Handlers
  useEffect(() => {
    const unregCpf = registerActionHandler('openCpfPlaybook', () => {
      setIsCpfModalOpen(true);
    });
    const unregGraph = registerActionHandler('openGraphBreakdown', () => {
      setIsGraphBreakdownOpen(true);
    });

    return () => {
      unregCpf();
      unregGraph();
    };
  }, [registerActionHandler]);

  // Projections Display State (Multi-Chart & Monthly/Annual View)
  const [chartType, setChartType] = useState('runway'); // 'runway' | 'income-waterfall' | 'asset-evolution'
  const [projectionTimeframe, setProjectionTimeframe] = useState('annual'); // 'annual' | 'monthly'

  // AI Focus Area & Custom Advisor Scenario Notes (CFP / ChFC / CFA Standard)
  const existingPlan = client?.financialPlan || {};
  const [focusArea, setFocusArea] = useState(existingPlan.focusArea || 'holistic');
  const [advisorCustomNotes, setAdvisorCustomNotes] = useState(existingPlan.advisorCustomNotes || '');

  // Profile / Core Assumptions
  const [profile, setProfile] = useState({
    currentAge: existingPlan.profile?.currentAge || defaultBaseAge,
    targetRetirementAge: existingPlan.profile?.targetRetirementAge || 65,
    lifeExpectancy: existingPlan.profile?.lifeExpectancy || 85,
    inflationRate: existingPlan.profile?.inflationRate ?? 3.0,
    preRetireReturn: existingPlan.profile?.preRetireReturn ?? 6.0,
    postRetireReturn: existingPlan.profile?.postRetireReturn ?? 4.0,
  });

  // Cash Flow State (Blank slate by default)
  const [cashflow, setCashflow] = useState({
    monthlyEarnedIncome: existingPlan.cashflow?.monthlyEarnedIncome !== undefined ? existingPlan.cashflow.monthlyEarnedIncome : '',
    monthlyPassiveIncome: existingPlan.cashflow?.monthlyPassiveIncome !== undefined ? existingPlan.cashflow.monthlyPassiveIncome : '',
    monthlyLivingExpenses: existingPlan.cashflow?.monthlyLivingExpenses !== undefined ? existingPlan.cashflow.monthlyLivingExpenses : '',
    monthlyCommitments: existingPlan.cashflow?.monthlyCommitments !== undefined ? existingPlan.cashflow.monthlyCommitments : '',
  });

  // Balance Sheet State (Blank slate by default)
  const [balanceSheet, setBalanceSheet] = useState({
    liquidCash: existingPlan.balanceSheet?.liquidCash !== undefined ? existingPlan.balanceSheet.liquidCash : '',
    investedAssets: existingPlan.balanceSheet?.investedAssets !== undefined ? existingPlan.balanceSheet.investedAssets : '',
    cpfOA: existingPlan.balanceSheet?.cpfOA !== undefined ? existingPlan.balanceSheet.cpfOA : '',
    cpfSA: existingPlan.balanceSheet?.cpfSA !== undefined ? existingPlan.balanceSheet.cpfSA : '',
    cpfRA: existingPlan.balanceSheet?.cpfRA !== undefined ? existingPlan.balanceSheet.cpfRA : '',
    cpfMA: existingPlan.balanceSheet?.cpfMA !== undefined ? existingPlan.balanceSheet.cpfMA : '',
    srs: existingPlan.balanceSheet?.srs !== undefined ? existingPlan.balanceSheet.srs : '',
    pensionCpf: existingPlan.balanceSheet?.pensionCpf !== undefined ? existingPlan.balanceSheet.pensionCpf : '',
    propertyValue: existingPlan.balanceSheet?.propertyValue !== undefined ? existingPlan.balanceSheet.propertyValue : '',
    outstandingMortgage: existingPlan.balanceSheet?.outstandingMortgage !== undefined ? existingPlan.balanceSheet.outstandingMortgage : '',
    otherLiabilities: existingPlan.balanceSheet?.otherLiabilities !== undefined ? existingPlan.balanceSheet.otherLiabilities : '',
  });

  // Retirement Target State (Blank slate by default)
  const [retirementTarget, setRetirementTarget] = useState({
    desiredMonthlyIncome: existingPlan.retirementTarget?.desiredMonthlyIncome !== undefined ? existingPlan.retirementTarget.desiredMonthlyIncome : '',
    expectedAnnuityPensions: existingPlan.retirementTarget?.expectedAnnuityPensions !== undefined ? existingPlan.retirementTarget.expectedAnnuityPensions : '',
  });

  // Goals List State (Starts empty if not configured)
  const [goals, setGoals] = useState(existingPlan.goals || []);

  // Life Event Stress-Testing Simulator State
  const [lifeEvents, setLifeEvents] = useState(
    existingPlan.lifeEvents && existingPlan.lifeEvents.length > 0
      ? existingPlan.lifeEvents
      : getInitialLifeEvents(defaultBaseAge)
  );

  // AI Summary State
  const [aiSummary, setAiSummary] = useState(existingPlan.aiSummary || null);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [pdfSuccessToast, setPdfSuccessToast] = useState(null);
  const [reportSection, setReportSection] = useState('all');
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [appSettings, setAppSettings] = useState(null);

  // Scenario Snapshots State
  const [snapshots, setSnapshots] = useState(existingPlan.snapshots || []);
  const [activeSnapshotId, setActiveSnapshotId] = useState('base');
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [newSnapshotName, setNewSnapshotName] = useState('');

  // Auto-Save Engine State
  const isInitialMount = useRef(true);
  const autoSaveTimerRef = useRef(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error'

  // Interactive Retirement Income Hover Inspector State
  const [hoveredIncomeData, setHoveredIncomeData] = useState(null);
  const [retirementViewMode, setRetirementViewMode] = useState('dual'); // 'dual' | 'single'

  // Load Policies & App Settings
  useEffect(() => {
    const fetchInitialData = async () => {
      if (window.electronAPI?.getPolicies && client?.id) {
        const res = await window.electronAPI.getPolicies(client.id);
        if (res.success && res.data) {
          setPolicies(res.data);
        }
      }
      if (window.electronAPI?.getAppSettings) {
        const setRes = await window.electronAPI.getAppSettings();
        if (setRes.success && setRes.settings) {
          setAppSettings(setRes.settings);
        }
      }
    };
    fetchInitialData();
  }, [client?.id]);

  // 1. Compute Cash Flow Metrics
  const totalMonthlyInflow = (Number(cashflow.monthlyEarnedIncome) || 0) + (Number(cashflow.monthlyPassiveIncome) || 0);
  const totalMonthlyOutflow = (Number(cashflow.monthlyLivingExpenses) || 0) + (Number(cashflow.monthlyCommitments) || 0);
  const monthlySurplus = totalMonthlyInflow - totalMonthlyOutflow;
  const savingsRate = totalMonthlyInflow > 0 ? Math.round((monthlySurplus / totalMonthlyInflow) * 100) : 0;
  const annualSavings = monthlySurplus * 12;

  // 2. Compute Balance Sheet & Net Worth Metrics (with CPF & SRS Breakdown)
  const totalLiquid = Number(balanceSheet.liquidCash) || 0;
  const totalInvested = Number(balanceSheet.investedAssets) || 0;
  const totalCpfOA = Number(balanceSheet.cpfOA) || 0;
  const totalCpfSA = Number(balanceSheet.cpfSA) || 0;
  const totalCpfRA = Number(balanceSheet.cpfRA) || 0;
  const totalCpfMA = Number(balanceSheet.cpfMA) || 0;
  const totalCpf = totalCpfOA + totalCpfSA + totalCpfRA + totalCpfMA;
  const totalSrs = Number(balanceSheet.srs) || 0;
  const totalPension = (totalCpf > 0 || totalSrs > 0)
    ? (totalCpf + totalSrs)
    : (Number(balanceSheet.pensionCpf) || 0);

  const totalProperty = Number(balanceSheet.propertyValue) || 0;
  const totalMortgage = Number(balanceSheet.outstandingMortgage) || 0;
  const totalOtherDebt = Number(balanceSheet.otherLiabilities) || 0;

  const totalFinancialAssets = totalLiquid + totalInvested + totalPension;
  const totalRealAssets = totalProperty;
  const totalAssets = totalFinancialAssets + totalRealAssets;
  const totalLiabilities = totalMortgage + totalOtherDebt;
  const totalNetWorth = totalAssets - totalLiabilities;
  const liquidEmergencyMonths = (Number(cashflow.monthlyLivingExpenses) || 0) > 0 
    ? (totalLiquid / Number(cashflow.monthlyLivingExpenses)).toFixed(1) 
    : '0.0';

  // 3. Compute Aggregated Insurance Coverage from In-Force Policies
  const inForceCoverage = useMemo(() => {
    let death = 0;
    let tpd = 0;
    let earlyCi = 0;
    let majorCi = 0;
    let disabilityIncome = 0;
    let hasShield = false;

    policies.forEach(p => {
      if (p.status !== 'In Force') return;
      // Dependent-insured policies must not inflate the parent's personal income-replacement protection gap matrix
      if (p.insuredType === 'Dependent') return;
      if (p.policyType === 'Shield') hasShield = true;
      if (p.coverages) {
        if (p.coverages['Death']) death += Number(p.coverages['Death']) || 0;
        if (p.coverages['TPD']) tpd += Number(p.coverages['TPD']) || 0;
        if (p.coverages['Early CI']) earlyCi += Number(p.coverages['Early CI']) || 0;
        if (p.coverages['Major CI']) majorCi += Number(p.coverages['Major CI']) || 0;
        if (p.coverages['Disability Income'] || p.coverages['Benefit per month']) {
          disabilityIncome += Number(p.coverages['Disability Income'] || p.coverages['Benefit per month']) || 0;
        }
      }
    });

    return { death, tpd, earlyCi, majorCi, disabilityIncome, hasShield };
  }, [policies]);

  // Aggregated Dependent Coverage Schedules
  const dependentsPolicies = useMemo(() => {
    return policies.filter(p => p.insuredType === 'Dependent');
  }, [policies]);

  const dependentsCoverageList = useMemo(() => {
    const map = {};
    dependentsPolicies.forEach(p => {
      const key = p.insuredPersonId || p.insuredName || 'Dependent';
      if (!map[key]) {
        map[key] = {
          id: p.insuredPersonId || key,
          name: p.insuredName || 'Dependent',
          relationship: p.insuredRelationship || 'Dependent',
          dob: p.insuredDob || '',
          gender: p.insuredGender || '',
          policies: [],
          annualPremium: 0,
          death: 0,
          tpd: 0,
          earlyCi: 0,
          majorCi: 0,
          hasShield: false
        };
      }
      map[key].policies.push(p);
      let prem = Number(p.premiumAmount) || 0;
      if (p.premiumFrequency === 'Monthly') prem *= 12;
      else if (p.premiumFrequency === 'Quarterly') prem *= 4;
      else if (p.premiumFrequency === 'Semi-Annually') prem *= 2;
      map[key].annualPremium += prem;

      if (p.policyType === 'Shield') map[key].hasShield = true;
      if (p.coverages) {
        if (p.coverages['Death']) map[key].death += Number(p.coverages['Death']) || 0;
        if (p.coverages['TPD']) map[key].tpd += Number(p.coverages['TPD']) || 0;
        if (p.coverages['Early CI']) map[key].earlyCi += Number(p.coverages['Early CI']) || 0;
        if (p.coverages['Major CI']) map[key].majorCi += Number(p.coverages['Major CI']) || 0;
      }
    });
    return Object.values(map);
  }, [dependentsPolicies]);

  // Recommended Coverage Benchmarks
  const annualEarnedIncome = (Number(cashflow.monthlyEarnedIncome) || 0) * 12;
  const recommendedDeath = (annualEarnedIncome > 0 || totalLiabilities > 0) ? (annualEarnedIncome * 10) + totalLiabilities : 0;
  const recommendedTpd = (annualEarnedIncome > 0 || totalLiabilities > 0) ? (annualEarnedIncome * 10) + totalLiabilities : 0;
  const recommendedEarlyCi = annualEarnedIncome * 2;
  const recommendedMajorCi = annualEarnedIncome * 4;
  const recommendedDisability = Math.round((Number(cashflow.monthlyEarnedIncome) || 0) * 0.75);

  // Protection Health Score (0-100)
  const protectionScore = useMemo(() => {
    if (policies.length === 0 && annualEarnedIncome === 0 && totalLiabilities === 0) return 0;
    let score = 0;
    if (inForceCoverage.hasShield) score += 20;
    if (recommendedDeath > 0) score += Math.min(25, (inForceCoverage.death / recommendedDeath) * 25);
    if (recommendedMajorCi > 0) score += Math.min(25, (inForceCoverage.majorCi / recommendedMajorCi) * 25);
    if (recommendedEarlyCi > 0) score += Math.min(15, (inForceCoverage.earlyCi / recommendedEarlyCi) * 15);
    if (recommendedDisability > 0) score += Math.min(15, (inForceCoverage.disabilityIncome / recommendedDisability) * 15);
    return Math.round(score);
  }, [inForceCoverage, recommendedDeath, recommendedMajorCi, recommendedEarlyCi, recommendedDisability, policies.length, annualEarnedIncome, totalLiabilities]);

  // Check if any baseline data has been configured
  const hasAnyData = useMemo(() => {
    return totalMonthlyInflow > 0 ||
      totalMonthlyOutflow > 0 ||
      totalAssets > 0 ||
      totalLiabilities > 0 ||
      (Number(retirementTarget.desiredMonthlyIncome) || 0) > 0 ||
      (goals && goals.length > 0) ||
      (policies && policies.length > 0);
  }, [totalMonthlyInflow, totalMonthlyOutflow, totalAssets, totalLiabilities, retirementTarget.desiredMonthlyIncome, goals, policies]);

  // 4. Lifetime Projection Simulation Engine (Baseline vs Stress-Tested)
  const projectionResults = useMemo(() => {
    const startAge = Number(profile.currentAge) || defaultBaseAge;
    const retireAge = Number(profile.targetRetirementAge) || 65;
    const maxAge = Number(profile.lifeExpectancy) || 85;
    const inflation = (Number(profile.inflationRate) || 3.0) / 100;
    const preYield = (Number(profile.preRetireReturn) || 6.0) / 100;
    const postYield = (Number(profile.postRetireReturn) || 4.0) / 100;

    const baseDesiredMonthly = Number(retirementTarget.desiredMonthlyIncome) || 0;
    const annuityMonthly = Number(retirementTarget.expectedAnnuityPensions) || 0;

    // Simulation Runners
    const runSimulation = (applyStressEvents = false) => {
      let liquidInvestable = totalLiquid + totalInvested;
      let yearlyData = [];
      let depletedAtAge = null;
      let peakCapital = liquidInvestable;

      for (let age = startAge; age <= maxAge; age++) {
        const yearsFromNow = age - startAge;
        const isAccumulation = age < retireAge;

        // Apply Stress-Test Life Events if enabled
        if (applyStressEvents) {
          lifeEvents.forEach(evt => {
            if (!evt.active) return;
            if (evt.triggerAge === age) {
              if (evt.lumpSumCost) {
                // If CI or Disability, insurance claim softens the impact
                let netLumpSum = Number(evt.lumpSumCost) || 0;
                if (evt.type === 'critical_illness' && evt.hasInsuranceOffset && inForceCoverage.majorCi > 0) {
                  netLumpSum = Math.max(0, netLumpSum - (inForceCoverage.majorCi * 0.1));
                }
                liquidInvestable -= netLumpSum;
              }
              if (evt.portfolioDropPercent) {
                liquidInvestable = liquidInvestable * (1 - (Number(evt.portfolioDropPercent) / 100));
              }
            }
          });
        }

        if (isAccumulation) {
          // Accumulation Phase
          let currentAnnualSurplus = annualSavings;

          // Adjust annual surplus if an active life event is running during this age
          if (applyStressEvents) {
            lifeEvents.forEach(evt => {
              if (evt.active && age >= evt.triggerAge && age < evt.triggerAge + (evt.durationYears || 1)) {
                let monthlyDelta = Number(evt.monthlyDelta) || 0;
                // If CI loss of income is offset by Major CI insurance payout
                if (evt.type === 'critical_illness' && evt.hasInsuranceOffset && inForceCoverage.majorCi > 0) {
                  const annualPayoutBuffer = inForceCoverage.majorCi / (evt.durationYears || 3);
                  monthlyDelta += (annualPayoutBuffer / 12);
                }
                currentAnnualSurplus += (monthlyDelta * 12);
              }
            });
          }

          // Growth + Annual Surplus injection
          liquidInvestable = (liquidInvestable * (1 + preYield)) + Math.max(0, currentAnnualSurplus);
          if (liquidInvestable > peakCapital) peakCapital = liquidInvestable;

          yearlyData.push({
            age,
            capital: Math.round(liquidInvestable),
            phase: 'Accumulation',
            surplus: currentAnnualSurplus,
            withdrawal: 0
          });
        } else {
          // Decumulation Phase (Retirement)
          const inflatedMonthlyLiving = baseDesiredMonthly * Math.pow(1 + inflation, yearsFromNow);
          const inflatedAnnuity = annuityMonthly * Math.pow(1 + (inflation * 0.5), yearsFromNow);
          const netMonthlyDrawdownNeeded = Math.max(0, inflatedMonthlyLiving - inflatedAnnuity);
          const annualDrawdown = netMonthlyDrawdownNeeded * 12;

          // Growth during retirement
          liquidInvestable = (liquidInvestable * (1 + postYield)) - annualDrawdown;

          if (liquidInvestable < 0 && depletedAtAge === null) {
            depletedAtAge = age;
          }

          yearlyData.push({
            age,
            capital: Math.max(0, Math.round(liquidInvestable)),
            phase: 'Decumulation',
            surplus: 0,
            withdrawal: Math.round(annualDrawdown),
            inflatedMonthlyLiving: Math.round(inflatedMonthlyLiving)
          });
        }
      }

      return { yearlyData, peakCapital, depletedAtAge };
    };

    const baseline = runSimulation(false);
    const stressTested = runSimulation(true);

    return { baseline, stressTested };
  }, [profile, cashflow, balanceSheet, retirementTarget, lifeEvents, inForceCoverage, annualSavings, totalLiquid, totalInvested, defaultBaseAge]);

  // Retirement Nest Egg Status
  const baselineDepletion = projectionResults.baseline.depletedAtAge;
  const stressDepletion = projectionResults.stressTested.depletedAtAge;
  const retirementNestEggAtRetire = projectionResults.baseline.peakCapital;
  const isRetirementOnTrack = !hasAnyData || baselineDepletion === null || baselineDepletion >= profile.lifeExpectancy;

  // Active stress events count
  const activeEventsCount = lifeEvents.filter(e => e.active).length;

  // Plan Payload Builder
  const buildCurrentPlanPayload = () => {
    return {
      version: 1,
      profile,
      cashflow,
      balanceSheet,
      retirementTarget,
      goals,
      lifeEvents,
      focusArea,
      advisorCustomNotes,
      chartType,
      projectionTimeframe,
      protection: {
        existingDeath: inForceCoverage.death,
        existingTpd: inForceCoverage.tpd,
        existingEarlyCi: inForceCoverage.earlyCi,
        existingMajorCi: inForceCoverage.majorCi,
        existingDisability: inForceCoverage.disabilityIncome,
        hasShield: inForceCoverage.hasShield,
        recommendedDeath,
        recommendedTpd,
        recommendedEarlyCi,
        recommendedMajorCi,
        recommendedDisability
      },
      aiSummary,
      snapshots
    };
  };

  // Debounced Real-Time Auto-Save Engine (1s debounce)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setAutoSaveStatus('saving');
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      if (window.electronAPI?.saveClientFinancialPlan && client?.id) {
        try {
          const payload = buildCurrentPlanPayload();
          const res = await window.electronAPI.saveClientFinancialPlan(client.id, payload);
          if (res?.success) {
            setAutoSaveStatus('saved');
            if (onUpdateClient && res.client) {
              onUpdateClient(res.client);
            }
          } else {
            setAutoSaveStatus('error');
          }
        } catch (err) {
          console.error("Auto-save failed:", err);
          setAutoSaveStatus('error');
        }
      }
    }, 1000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [profile, cashflow, balanceSheet, retirementTarget, goals, lifeEvents, focusArea, advisorCustomNotes]);

  // Scenario Snapshot Handlers
  const handleCreateSnapshot = (name) => {
    const snapName = (name && name.trim()) ? name.trim() : `Scenario ${snapshots.length + 1}`;
    const newSnapshot = {
      id: `snap_${Date.now()}`,
      name: snapName,
      createdAt: new Date().toISOString(),
      data: {
        profile: { ...profile },
        cashflow: { ...cashflow },
        balanceSheet: { ...balanceSheet },
        retirementTarget: { ...retirementTarget },
        goals: JSON.parse(JSON.stringify(goals)),
        lifeEvents: JSON.parse(JSON.stringify(lifeEvents)),
        focusArea,
        advisorCustomNotes
      }
    };
    const updated = [...snapshots, newSnapshot];
    setSnapshots(updated);
    setActiveSnapshotId(newSnapshot.id);
    setIsCreatingSnapshot(false);
    setNewSnapshotName('');
    if (window.electronAPI?.saveClientFinancialPlan && client?.id) {
      window.electronAPI.saveClientFinancialPlan(client.id, {
        ...buildCurrentPlanPayload(),
        snapshots: updated
      });
    }
  };

  const handleSelectSnapshot = (snapId) => {
    if (snapId === 'base') {
      setActiveSnapshotId('base');
      if (existingPlan.profile) setProfile(existingPlan.profile);
      if (existingPlan.cashflow) setCashflow(existingPlan.cashflow);
      if (existingPlan.balanceSheet) setBalanceSheet(existingPlan.balanceSheet);
      if (existingPlan.retirementTarget) setRetirementTarget(existingPlan.retirementTarget);
      if (existingPlan.goals) setGoals(existingPlan.goals);
      if (existingPlan.lifeEvents) setLifeEvents(existingPlan.lifeEvents);
      return;
    }
    const snap = snapshots.find(s => s.id === snapId);
    if (snap && snap.data) {
      setActiveSnapshotId(snap.id);
      if (snap.data.profile) setProfile(snap.data.profile);
      if (snap.data.cashflow) setCashflow(snap.data.cashflow);
      if (snap.data.balanceSheet) setBalanceSheet(snap.data.balanceSheet);
      if (snap.data.retirementTarget) setRetirementTarget(snap.data.retirementTarget);
      if (snap.data.goals) setGoals(snap.data.goals);
      if (snap.data.lifeEvents) setLifeEvents(snap.data.lifeEvents);
      if (snap.data.focusArea) setFocusArea(snap.data.focusArea);
      if (snap.data.advisorCustomNotes) setAdvisorCustomNotes(snap.data.advisorCustomNotes);
    }
  };

  const handleDeleteSnapshot = (snapId, e) => {
    if (e) e.stopPropagation();
    const updated = snapshots.filter(s => s.id !== snapId);
    setSnapshots(updated);
    if (activeSnapshotId === snapId) {
      handleSelectSnapshot('base');
    }
    if (window.electronAPI?.saveClientFinancialPlan && client?.id) {
      window.electronAPI.saveClientFinancialPlan(client.id, {
        ...buildCurrentPlanPayload(),
        snapshots: updated
      });
    }
  };

  // Handlers
  const handleSavePlan = async () => {
    setIsSaving(true);
    const planPayload = buildCurrentPlanPayload();

    if (window.electronAPI?.saveClientFinancialPlan && client?.id) {
      const res = await window.electronAPI.saveClientFinancialPlan(client.id, planPayload);
      if (res.success) {
        setSaveSuccess(true);
        if (onUpdateClient && res.client) {
          onUpdateClient(res.client);
        }
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    }
    setIsSaving(false);
  };

  const handleGenerateAiSummary = async () => {
    setAiLoading(true);
    const planPayload = {
      profile,
      cashflow: {
        ...cashflow,
        monthlySurplus,
        savingsRate
      },
      balanceSheet: {
        liquidAssets: totalLiquid,
        investedAssets: totalInvested,
        cpfOA: totalCpfOA,
        cpfSA: totalCpfSA,
        cpfRA: totalCpfRA,
        cpfMA: totalCpfMA,
        srs: totalSrs,
        pensionAssets: totalPension,
        propertyValue: totalProperty,
        outstandingMortgage: totalMortgage,
        totalNetWorth
      },
      retirement: {
        desiredMonthlyIncome: retirementTarget.desiredMonthlyIncome,
        expectedAnnuityPensions: retirementTarget.expectedAnnuityPensions,
        inflationRate: profile.inflationRate,
        preRetireReturn: profile.preRetireReturn,
        postRetireReturn: profile.postRetireReturn,
        projectedNestEgg: retirementNestEggAtRetire,
        runwayStatus: isRetirementOnTrack ? 'Sustains past life expectancy' : `Capital depleted at age ${baselineDepletion}`,
        depletionAge: baselineDepletion
      },
      protection: {
        existingDeath: inForceCoverage.death,
        existingTpd: inForceCoverage.tpd,
        existingEarlyCi: inForceCoverage.earlyCi,
        existingMajorCi: inForceCoverage.majorCi,
        existingDisability: inForceCoverage.disabilityIncome,
        hasShield: inForceCoverage.hasShield,
        recommendedDeath,
        recommendedTpd,
        recommendedEarlyCi,
        recommendedMajorCi,
        recommendedDisability
      },
      lifeEvents
    };

    if (window.electronAPI?.generateFinancialPlanAiSummary) {
      const res = await window.electronAPI.generateFinancialPlanAiSummary({
        client,
        planData: planPayload,
        policies,
        focusArea,
        advisorCustomNotes
      });

      if (res.success && res.planSummary) {
        setAiSummary(res.planSummary);
        setActiveTab('ai-advisor');
        if (window.electronAPI?.saveClientFinancialPlan && client?.id) {
          window.electronAPI.saveClientFinancialPlan(client.id, {
            ...planPayload,
            focusArea,
            advisorCustomNotes,
            aiSummary: res.planSummary
          });
        }
      }
    }
    setAiLoading(false);
  };

  // PDF Report Export Handler (Generates dedicated client-facing A4 document)
  const handleExportPdf = async () => {
    setPdfExporting(true);
    const clientCleanName = client?.fullName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Client';
    const defaultFilename = `Financial_Blueprint_${clientCleanName}_${new Date().toISOString().slice(0, 10)}.pdf`;

    if (window.electronAPI?.exportFinancialPlanPdf) {
      const res = await window.electronAPI.exportFinancialPlanPdf({
        client,
        profile,
        cashflow: {
          ...cashflow,
          monthlySurplus,
          savingsRate,
          annualSavings,
          liquidEmergencyMonths
        },
        balanceSheet: {
          ...balanceSheet,
          totalLiquid,
          totalInvested,
          totalCpfOA,
          totalCpfSA,
          totalCpfRA,
          totalCpfMA,
          totalCpf,
          totalSrs,
          totalPension,
          totalProperty,
          totalMortgage,
          totalOtherDebt,
          totalFinancialAssets,
          totalAssets,
          totalLiabilities,
          totalNetWorth,
          liquidEmergencyMonths
        },
        retirement: {
          desiredMonthlyIncome: retirementTarget.desiredMonthlyIncome,
          expectedAnnuityPensions: retirementTarget.expectedAnnuityPensions,
          inflationRate: profile.inflationRate,
          preRetireReturn: profile.preRetireReturn,
          postRetireReturn: profile.postRetireReturn,
          projectedNestEgg: retirementNestEggAtRetire,
          isRetirementOnTrack,
          baselineDepletion,
          stressDepletion,
          yearlyData: projectionResults.baseline.yearlyData,
          stressYearlyData: projectionResults.stressTested.yearlyData
        },
        policies,
        inForceCoverage,
        recommendedCoverage: {
          death: recommendedDeath,
          tpd: recommendedTpd,
          earlyCi: recommendedEarlyCi,
          majorCi: recommendedMajorCi,
          disability: recommendedDisability
        },
        protectionScore,
        goals,
        lifeEvents,
        aiSummary: aiSummary || {},
        focusArea,
        advisorCustomNotes,
        consultantSettings: appSettings,
        defaultFilename
      });

      if (res.success) {
        setPdfSuccessToast(`Client PDF Report exported successfully to: ${res.filePath}`);
        setTimeout(() => setPdfSuccessToast(null), 6000);
      } else if (res.canceled) {
        // User canceled save dialog
      } else {
        window.print();
      }
    } else {
      window.print();
    }
    setPdfExporting(false);
  };

  const toggleLifeEvent = (id) => {
    setLifeEvents(prev => prev.map(e => e.id === id ? { ...e, active: !e.active } : e));
  };

  const updateLifeEventAge = (id, newAge) => {
    setLifeEvents(prev => prev.map(e => e.id === id ? { ...e, triggerAge: Number(newAge) } : e));
  };

  const updateLifeEventField = (id, field, value) => {
    setLifeEvents(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleAddGoal = () => {
    const newG = {
      id: `g_${Date.now()}`,
      title: 'New Milestone Goal',
      targetAge: Math.max(Number(profile.currentAge) + 1, (Number(profile.targetRetirementAge) || 65) - 5),
      targetAmount: '',
      currentAllocated: '',
      monthlyContribution: ''
    };
    setGoals([...goals, newG]);
  };

  const handleDeleteGoal = (id) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  // -------------------------------------------------------------
  // MULTI-CHART PROJECTION ENGINE (Runway, Income Waterfall, Asset Evolution)
  // -------------------------------------------------------------

  // 1. Chart A: Capital Accumulation & Decumulation Runway
  const renderRunwayChart = () => {
    const baseData = projectionResults.baseline.yearlyData;
    const stressData = projectionResults.stressTested.yearlyData;
    if (!baseData || baseData.length === 0) return null;

    const width = 860;
    const height = 280;
    const padding = { top: 30, right: 30, bottom: 40, left: 75 };

    const minAge = Number(profile.currentAge) || defaultBaseAge;
    const maxAge = Number(profile.lifeExpectancy) || 85;
    const isMonthly = projectionTimeframe === 'monthly';

    const maxCap = Math.max(
      ...baseData.map(d => isMonthly ? d.capital / 12 : d.capital),
      ...stressData.map(d => isMonthly ? d.capital / 12 : d.capital),
      isMonthly ? 10000 : 100000
    );

    const getX = (age) => padding.left + ((age - minAge) / Math.max(1, maxAge - minAge)) * (width - padding.left - padding.right);
    const getY = (cap) => height - padding.bottom - (cap / Math.max(1, maxCap)) * (height - padding.top - padding.bottom);

    const basePoints = baseData.map(d => `${getX(d.age)},${getY(isMonthly ? d.capital / 12 : d.capital)}`).join(' ');
    const stressPoints = stressData.map(d => `${getX(d.age)},${getY(isMonthly ? d.capital / 12 : d.capital)}`).join(' ');
    const retireX = getX(Number(profile.targetRetirementAge) || 65);

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', minWidth: '600px' }}>
        {/* Horizontal Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const val = maxCap * pct;
          const y = getY(val);
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <text x={padding.left - 8} y={y + 4} fill="var(--text-muted)" fontSize="10" textAnchor="end">
                {formatCurrency(val)}{isMonthly ? '/mo' : ''}
              </text>
            </g>
          );
        })}

        {/* Age Grid X-Axis */}
        {baseData.filter((_, idx) => idx % 5 === 0 || idx === baseData.length - 1).map((d, i) => {
          const x = getX(d.age);
          return (
            <g key={i}>
              <line x1={x} y1={height - padding.bottom} x2={x} y2={height - padding.bottom + 5} stroke="rgba(255,255,255,0.2)" />
              <text x={x} y={height - padding.bottom + 18} fill="var(--text-muted)" fontSize="10" textAnchor="middle">
                Age {d.age}
              </text>
            </g>
          );
        })}

        {/* Vertical Retirement Line */}
        <line x1={retireX} y1={padding.top} x2={retireX} y2={height - padding.bottom} stroke="#818cf8" strokeWidth="2" strokeDasharray="4 4" />
        <text x={retireX} y={padding.top - 8} fill="#818cf8" fontSize="10" fontWeight="600" textAnchor="middle">
          Retire @ {profile.targetRetirementAge}
        </text>

        {/* Shaded Retirement Zone */}
        <rect
          x={retireX}
          y={padding.top}
          width={Math.max(0, width - padding.right - retireX)}
          height={height - padding.bottom - padding.top}
          fill="rgba(99, 102, 241, 0.05)"
        />

        {/* Baseline Area & Line */}
        <polygon
          points={`${getX(minAge)},${height - padding.bottom} ${basePoints} ${getX(maxAge)},${height - padding.bottom}`}
          fill="rgba(16, 185, 129, 0.08)"
        />
        <polyline
          points={basePoints}
          fill="none"
          stroke="#10b981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Stress-Tested Line */}
        {activeEventsCount > 0 && (
          <polyline
            points={stressPoints}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeDasharray="5 4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Depletion Alert Markers */}
        {hasAnyData && baselineDepletion && (
          <g>
            <circle cx={getX(baselineDepletion)} cy={getY(0)} r="5" fill="#ef4444" />
            <text x={getX(baselineDepletion)} y={getY(0) - 10} fill="#ef4444" fontSize="10" fontWeight="700" textAnchor="middle">
              Depleted @ {baselineDepletion}
            </text>
          </g>
        )}

        {hasAnyData && activeEventsCount > 0 && stressDepletion && stressDepletion !== baselineDepletion && (
          <g>
            <circle cx={getX(stressDepletion)} cy={getY(0)} r="5" fill="#f59e0b" />
            <text x={getX(stressDepletion)} y={getY(0) - 10} fill="#f59e0b" fontSize="10" fontWeight="700" textAnchor="middle">
              Stress Runout @ {stressDepletion}
            </text>
          </g>
        )}
      </svg>
    );
  };

  // 2. Chart B: Retirement Income Streams & Cashflow Waterfall vs Living Costs
  const renderRetirementIncomeWaterfallChart = () => {
    const startAge = Number(profile.currentAge) || defaultBaseAge;
    const retireAge = Number(profile.targetRetirementAge) || 65;
    const maxAge = Number(profile.lifeExpectancy) || 85;
    const inflation = (Number(profile.inflationRate) || 3.0) / 100;
    const isMonthly = projectionTimeframe === 'monthly';
    const mult = isMonthly ? 1 : 12;

    const baseDesired = (Number(retirementTarget.desiredMonthlyIncome) || 0) * mult;
    const annuityBase = (Number(retirementTarget.expectedAnnuityPensions) || 0) * mult;
    const passiveBase = (Number(cashflow.monthlyPassiveIncome) || 0) * mult;

    const yearlyData = projectionResults.baseline.yearlyData;

    // Generate retirement cashflow array from retireAge to maxAge
    const retireData = [];
    for (let age = retireAge; age <= maxAge; age++) {
      const yearsFromNow = age - startAge;
      const targetLiving = baseDesired * Math.pow(1 + inflation, yearsFromNow);
      const guaranteedCpf = annuityBase * Math.pow(1 + (inflation * 0.5), yearsFromNow);
      const passive = passiveBase;
      const neededDrawdown = Math.max(0, targetLiving - guaranteedCpf - passive);

      const capAtAge = yearlyData.find(d => d.age === age)?.capital || 0;
      const isDepleted = capAtAge <= 0 && age >= (baselineDepletion || 999);

      const actualDrawdown = isDepleted ? 0 : neededDrawdown;
      const totalIncome = guaranteedCpf + passive + actualDrawdown;
      const shortfall = Math.max(0, targetLiving - totalIncome);

      retireData.push({
        age,
        calendarYear: new Date().getFullYear() + (age - startAge),
        targetLiving,
        guaranteedCpf,
        passive,
        actualDrawdown,
        totalIncome,
        shortfall,
        surplus: Math.max(0, totalIncome - targetLiving),
        capitalRemaining: capAtAge,
        isDepleted
      });
    }

    if (retireData.length === 0) return null;

    // Actuarial KPIs
    const guaranteedFloorCoveragePct = Math.round(((annuityBase + passiveBase) / Math.max(1, baseDesired)) * 100);
    const preRetireAnnualEarned = ((Number(cashflow.monthlyEarnedIncome) || 0) * 12);
    const irrPct = preRetireAnnualEarned > 0 
      ? Math.round(((baseDesired * (isMonthly ? 12 : 1)) / preRetireAnnualEarned) * 100) 
      : 0;
    const inflatedAt85 = Math.round((Number(retirementTarget.desiredMonthlyIncome) || 0) * Math.pow(1 + inflation, Math.max(0, 85 - startAge)));

    const width = 860;
    const height = 290;
    const padding = { top: 35, right: 30, bottom: 45, left: 75 };

    const maxVal = Math.max(
      ...retireData.map(d => Math.max(d.targetLiving, d.guaranteedCpf + d.passive + d.actualDrawdown + d.shortfall)),
      isMonthly ? 5000 : 60000
    );

    const getX = (age) => padding.left + ((age - retireAge) / Math.max(1, maxAge - retireAge)) * (width - padding.left - padding.right);
    const getY = (val) => height - padding.bottom - (val / Math.max(1, maxVal)) * (height - padding.top - padding.bottom);

    const targetPoints = retireData.map(d => `${getX(d.age).toFixed(1)},${getY(d.targetLiving).toFixed(1)}`).join(' ');

    const activeInspectorData = hoveredIncomeData || retireData[0];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Actuarial KPI Ribbon */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
          padding: '12px 14px',
          backgroundColor: 'rgba(0, 0, 0, 0.28)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
              Guaranteed Floor Coverage
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: guaranteedFloorCoveragePct >= 70 ? '#34d399' : guaranteedFloorCoveragePct >= 40 ? '#60a5fa' : '#fbbf24' }}>
              {guaranteedFloorCoveragePct}% <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)' }}>of living costs</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
              CPF LIFE + Passive: {formatCurrency(annuityBase + passiveBase)}{isMonthly ? '/mo' : '/yr'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
              Income Replacement Ratio (IRR)
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: irrPct >= 65 && irrPct <= 85 ? '#34d399' : '#60a5fa' }}>
              {irrPct > 0 ? `${irrPct}%` : 'N/A'} <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)' }}>target (65-75%)</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
              Desired vs. Current Earned Income
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
              Inflated Living Cost @ Age 85
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#fbbf24' }}>
              {formatCurrency(inflatedAt85)}/mo
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
              {profile.inflationRate}% p.a. compounding
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
              Capital Solvency Horizon
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: isRetirementOnTrack ? '#34d399' : '#f87171' }}>
              {isRetirementOnTrack ? `Solvent to Age ${maxAge}+` : `Depleted @ Age ${baselineDepletion}`}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
              {isRetirementOnTrack ? 'Zero capital deficit' : `Longevity gap: ${maxAge - baselineDepletion} yrs`}
            </div>
          </div>
        </div>

        {/* Chart SVG with Interactive Inspection */}
        <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: '100%', height: 'auto', minWidth: '600px', cursor: 'crosshair' }}
            onMouseLeave={() => setHoveredIncomeData(null)}
          >
            {/* Horizontal Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const val = maxVal * pct;
              const y = getY(val);
              return (
                <g key={i}>
                  <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <text x={padding.left - 8} y={y + 4} fill="var(--text-muted)" fontSize="10" textAnchor="end">
                    {formatCurrency(val)}{isMonthly ? '/mo' : '/yr'}
                  </text>
                </g>
              );
            })}

            {/* Age Grid X-Axis Ticks */}
            {retireData.filter((_, idx) => idx % 4 === 0 || idx === retireData.length - 1).map((d, i) => {
              const x = getX(d.age);
              return (
                <g key={i}>
                  <line x1={x} y1={height - padding.bottom} x2={x} y2={height - padding.bottom + 5} stroke="rgba(255,255,255,0.2)" />
                  <text x={x} y={height - padding.bottom + 18} fill="var(--text-muted)" fontSize="10" textAnchor="middle">
                    Age {d.age}
                  </text>
                </g>
              );
            })}

            {/* Hovered Column Highlight */}
            {hoveredIncomeData && (
              <rect
                x={getX(hoveredIncomeData.age) - 8}
                y={padding.top}
                width={16}
                height={height - padding.top - padding.bottom}
                fill="rgba(59, 130, 246, 0.15)"
                rx="3"
                pointerEvents="none"
              />
            )}

            {/* Stacked Waterfall Bars for each retirement year */}
            {retireData.map((d, i) => {
              const x = getX(d.age) - 7;
              const barW = Math.max(9, (width - padding.left - padding.right) / retireData.length - 4);

              // Layer Heights
              const hCpf = (d.guaranteedCpf / maxVal) * (height - padding.top - padding.bottom);
              const hPassive = (d.passive / maxVal) * (height - padding.top - padding.bottom);
              const hDrawdown = (d.actualDrawdown / maxVal) * (height - padding.top - padding.bottom);
              const hShortfall = (d.shortfall / maxVal) * (height - padding.top - padding.bottom);

              let currentY = height - padding.bottom;

              return (
                <g key={i}>
                  {/* 1. Guaranteed CPF Life Base */}
                  {hCpf > 0 && (
                    <rect
                      x={x}
                      y={currentY - hCpf}
                      width={barW}
                      height={hCpf}
                      fill="#818cf8"
                      opacity="0.9"
                      rx="1"
                    />
                  )}
                  {(() => { currentY -= hCpf; return null; })()}

                  {/* 2. Passive / Rental Income */}
                  {hPassive > 0 && (
                    <rect
                      x={x}
                      y={currentY - hPassive}
                      width={barW}
                      height={hPassive}
                      fill="#06b6d4"
                      opacity="0.9"
                      rx="1"
                    />
                  )}
                  {(() => { currentY -= hPassive; return null; })()}

                  {/* 3. Portfolio Systematic Drawdown */}
                  {hDrawdown > 0 && (
                    <rect
                      x={x}
                      y={currentY - hDrawdown}
                      width={barW}
                      height={hDrawdown}
                      fill="#10b981"
                      opacity="0.9"
                      rx="1"
                    />
                  )}
                  {(() => { currentY -= hDrawdown; return null; })()}

                  {/* 4. Income Shortfall (Deficit) */}
                  {hShortfall > 0 && (
                    <rect
                      x={x}
                      y={currentY - hShortfall}
                      width={barW}
                      height={hShortfall}
                      fill="#ef4444"
                      opacity="0.8"
                      stroke="#f87171"
                      strokeDasharray="2 2"
                      rx="1"
                    />
                  )}

                  {/* Invisible Hitbox for Mouse Hover Tracking */}
                  <rect
                    x={getX(d.age) - 10}
                    y={padding.top}
                    width={20}
                    height={height - padding.top - padding.bottom}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredIncomeData(d)}
                  />
                </g>
              );
            })}

            {/* Target Inflated Living Expense Guideline */}
            <polyline
              points={targetPoints}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2.5"
              strokeDasharray="4 3"
            />

            {/* Target Living Point Marker for Hovered Age */}
            {hoveredIncomeData && (
              <circle
                cx={getX(hoveredIncomeData.age)}
                cy={getY(hoveredIncomeData.targetLiving)}
                r="4.5"
                fill="#fbbf24"
                stroke="#0F172A"
                strokeWidth="2"
              />
            )}

            {/* Legend Overlay at Top Right */}
            <g transform={`translate(${width - 370}, ${padding.top - 8})`}>
              <rect x="0" y="0" width="8" height="6" fill="#818cf8" rx="1" />
              <text x="12" y="6" fill="#818cf8" fontSize="9.5">CPF LIFE Floor</text>

              <rect x="90" y="0" width="8" height="6" fill="#06b6d4" rx="1" />
              <text x="102" y="6" fill="#06b6d4" fontSize="9.5">Passive / Rental</text>

              <rect x="180" y="0" width="8" height="6" fill="#10b981" rx="1" />
              <text x="192" y="6" fill="#10b981" fontSize="9.5">Portfolio Drawdown</text>

              <line x1="285" y1="3" x2="297" y2="3" stroke="#fbbf24" strokeWidth="2" strokeDasharray="3 2" />
              <text x="302" y="6" fill="#fbbf24" fontSize="9.5">Target Need</text>
            </g>
          </svg>
        </div>

        {/* Interactive Cash Flow Inspector Box */}
        {activeInspectorData && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            borderRadius: '8px',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', fontWeight: '700', fontSize: '13px' }}>
                Age {activeInspectorData.age} ({activeInspectorData.calendarYear})
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {hoveredIncomeData ? 'Inspecting hovered age' : 'Retirement onset snapshot (hover over bars to inspect any age)'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '11px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Target Need: </span>
                <strong style={{ color: '#fbbf24' }}>{formatCurrency(activeInspectorData.targetLiving)}{isMonthly ? '/mo' : '/yr'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>CPF LIFE Floor: </span>
                <strong style={{ color: '#818cf8' }}>{formatCurrency(activeInspectorData.guaranteedCpf)}{isMonthly ? '/mo' : '/yr'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Passive Income: </span>
                <strong style={{ color: '#06b6d4' }}>{formatCurrency(activeInspectorData.passive)}{isMonthly ? '/mo' : '/yr'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Portfolio Drawdown: </span>
                <strong style={{ color: '#10b981' }}>{formatCurrency(activeInspectorData.actualDrawdown)}{isMonthly ? '/mo' : '/yr'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Total Cash Flow: </span>
                <strong style={{ color: activeInspectorData.shortfall > 0 ? '#f87171' : '#34d399' }}>
                  {formatCurrency(activeInspectorData.totalIncome)}{isMonthly ? '/mo' : '/yr'}
                </strong>
              </div>
              {activeInspectorData.shortfall > 0 ? (
                <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', fontWeight: '700' }}>
                  Deficit: -{formatCurrency(activeInspectorData.shortfall)}
                </span>
              ) : (
                <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: '600' }}>
                  Fully Funded
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 3. Chart C: Net Worth & Asset Composition Evolution
  const renderAssetEvolutionChart = () => {
    const startAge = Number(profile.currentAge) || defaultBaseAge;
    const maxAge = Number(profile.lifeExpectancy) || 85;
    const yearlyData = projectionResults.baseline.yearlyData;
    const isMonthly = projectionTimeframe === 'monthly';
    const mult = isMonthly ? 1 / 12 : 1;

    const assetData = [];
    for (let age = startAge; age <= maxAge; age++) {
      const yearsFromNow = age - startAge;
      const investable = (yearlyData.find(d => d.age === age)?.capital || 0) * mult;
      const liquid = totalLiquid * mult;
      const pension = (totalPension * Math.pow(1 + 0.04, Math.min(55 - startAge, yearsFromNow))) * mult;
      const propEquity = Math.max(0, (totalProperty * Math.pow(1 + 0.02, yearsFromNow)) - Math.max(0, totalMortgage - (yearsFromNow * Math.max(1000, totalMortgage / 25)))) * mult;
      const netWorth = investable + liquid + pension + propEquity;

      assetData.push({
        age,
        liquid,
        investable,
        pension,
        propEquity,
        netWorth
      });
    }

    if (assetData.length === 0) return null;

    const width = 860;
    const height = 280;
    const padding = { top: 30, right: 30, bottom: 40, left: 75 };

    const maxVal = Math.max(...assetData.map(d => d.netWorth), isMonthly ? 20000 : 250000);

    const getX = (age) => padding.left + ((age - startAge) / Math.max(1, maxAge - startAge)) * (width - padding.left - padding.right);
    const getY = (val) => height - padding.bottom - (val / Math.max(1, maxVal)) * (height - padding.top - padding.bottom);

    const netWorthPoints = assetData.map(d => `${getX(d.age)},${getY(d.netWorth)}`).join(' ');

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', minWidth: '600px' }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const val = maxVal * pct;
          const y = getY(val);
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <text x={padding.left - 8} y={y + 4} fill="var(--text-muted)" fontSize="10" textAnchor="end">
                {formatCurrency(val)}{isMonthly ? '/mo' : ''}
              </text>
            </g>
          );
        })}

        {/* Age Grid X-Axis */}
        {assetData.filter((_, idx) => idx % 5 === 0 || idx === assetData.length - 1).map((d, i) => {
          const x = getX(d.age);
          return (
            <g key={i}>
              <line x1={x} y1={height - padding.bottom} x2={x} y2={height - padding.bottom + 5} stroke="rgba(255,255,255,0.2)" />
              <text x={x} y={height - padding.bottom + 18} fill="var(--text-muted)" fontSize="10" textAnchor="middle">
                Age {d.age}
              </text>
            </g>
          );
        })}

        {/* Net Worth Total Line */}
        <polyline
          points={netWorthPoints}
          fill="none"
          stroke="#34d399"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Shaded Area underneath */}
        <polygon
          points={`${getX(startAge)},${height - padding.bottom} ${netWorthPoints} ${getX(maxAge)},${height - padding.bottom}`}
          fill="rgba(52, 211, 153, 0.08)"
        />

        {/* Legend */}
        <g transform={`translate(${width - 220}, ${padding.top})`}>
          <line x1="0" y1="0" x2="16" y2="0" stroke="#34d399" strokeWidth="3" />
          <text x="22" y="3" fill="#34d399" fontSize="10">Total Net Estate Worth</text>
        </g>
      </svg>
    );
  };

  // Master Chart Container with Coordinated Dual-View & Single-View Modes
  const renderRetirementChart = () => {
    return (
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto', backgroundColor: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-light)' }}>
        
        {/* Controls Bar: Layout Selector, Chart Type Tabs & Monthly/Annual Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          
          {/* Left: View Mode (Dual vs Single) & Individual Chart Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Dual / Single Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border-light)' }}>
              <button
                type="button"
                onClick={() => setRetirementViewMode('dual')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  backgroundColor: retirementViewMode === 'dual' ? '#3b82f6' : 'transparent',
                  color: retirementViewMode === 'dual' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="View Capital Runway and Retirement Cash Flow Streams simultaneously"
              >
                <Layers size={12} /> Coordinated Dual View
              </button>
              <button
                type="button"
                onClick={() => setRetirementViewMode('single')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  backgroundColor: retirementViewMode === 'single' ? '#3b82f6' : 'transparent',
                  color: retirementViewMode === 'single' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="View one full-width chart at a time"
              >
                Single Chart View
              </button>
            </div>

            {/* If Single View, show tabs */}
            {retirementViewMode === 'single' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {[
                  { id: 'runway', label: '📈 Capital Runway', icon: TrendingUp },
                  { id: 'income-waterfall', label: '🌊 Income Streams', icon: BarChart3 },
                  { id: 'asset-evolution', label: '🏛️ Net Worth Evolution', icon: PieChart }
                ].map(c => {
                  const IconComp = c.icon;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setChartType(c.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: chartType === c.id ? '600' : '500',
                        backgroundColor: chartType === c.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                        color: chartType === c.id ? '#60a5fa' : 'var(--text-secondary)',
                        border: chartType === c.id ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <IconComp size={12} />
                      {c.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Timeframe Toggle & Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            
            {/* Annual vs Monthly Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border-light)' }}>
              <button
                type="button"
                onClick={() => setProjectionTimeframe('annual')}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '600',
                  backgroundColor: projectionTimeframe === 'annual' ? '#3b82f6' : 'transparent',
                  color: projectionTimeframe === 'annual' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Annual ($/yr)
              </button>
              <button
                type="button"
                onClick={() => setProjectionTimeframe('monthly')}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '600',
                  backgroundColor: projectionTimeframe === 'monthly' ? '#3b82f6' : 'transparent',
                  color: projectionTimeframe === 'monthly' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Monthly ($/mo)
              </button>
            </div>

            <button
              type="button"
              className="btn"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: '600'
              }}
              onClick={() => setIsGraphBreakdownOpen(true)}
              title="View detailed mathematical & AI breakdown of how this projection was calculated"
            >
              <Sparkles size={13} /> Graph Breakdown & AI Audit
            </button>
          </div>
        </div>

        {/* Render Selected Chart(s) */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {retirementViewMode === 'dual' ? (
            <>
              {/* Chart 1: Capital Runway */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={15} color="#10b981" />
                  <span>1. Capital Accumulation & Decumulation Runway (Wealth Stock)</span>
                </div>
                {renderRunwayChart()}
              </div>

              {/* Chart 2: Income Waterfall & Streams */}
              <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BarChart3 size={15} color="#818cf8" />
                  <span>2. Projected Retirement Income Streams vs. Inflated Living Expenses (Monthly Cash Flow)</span>
                </div>
                {renderRetirementIncomeWaterfallChart()}
              </div>
            </>
          ) : (
            <>
              {chartType === 'runway' && renderRunwayChart()}
              {chartType === 'income-waterfall' && renderRetirementIncomeWaterfallChart()}
              {chartType === 'asset-evolution' && renderAssetEvolutionChart()}
            </>
          )}

          {/* Blank Slate Overlay */}
          {!hasAnyData && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              backgroundColor: 'rgba(15, 23, 42, 0.88)',
              padding: '16px 24px',
              borderRadius: '10px',
              border: '1px dashed rgba(255,255,255,0.18)',
              backdropFilter: 'blur(6px)',
              pointerEvents: 'none'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                📊 Blank Blueprint Runway
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Enter monthly income, living expenses, or assets in <strong>Financial Snapshot</strong> to plot the lifetime projection curve.
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // TAB 6: LIVE 6-PAGE A4 WYSIWYG REPORT PREVIEW ENGINE
  const renderLiveReportPreview = () => {
    const consultantName = appSettings?.consultantName || 'Advisory Consultant';
    const consultantTitle = appSettings?.consultantTitle || 'Senior Financial Consultant';
    const consultantCreds = appSettings?.consultantCredentials || 'CFP® • ChFC®/S • AEPP®';
    const consultantRep = appSettings?.consultantRepCode || 'MAS-REP-102948';
    const reportBranding = appSettings?.reportHeaderBranding || 'FINANCIAL PLANNING REPORT';
    const reportSubtitle = appSettings?.reportSubtitle || 'Institutional Wealth Management & Advisory Dossier';
    const consultantPhone = appSettings?.consultantPhone || '+65 6123 4567';
    const consultantEmail = appSettings?.consultantEmail || 'advisory@beetsma.com';
    const reportDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const scrollToPage = (pageId) => {
      const el = document.getElementById(pageId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    // Shared Styles for A4 Document Pages
    const pageStyle = {
      width: '100%',
      maxWidth: '820px',
      backgroundColor: '#FFFFFF',
      color: '#1E293B',
      borderRadius: '8px',
      padding: '36px 42px',
      boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
      fontSize: '10.5px',
      lineHeight: '1.45',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '1120px',
      boxSizing: 'border-box',
      position: 'relative',
      margin: '0 auto 28px auto'
    };

    const headerStyle = {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '2px solid #0F172A',
      paddingBottom: '8px',
      marginBottom: '18px'
    };

    const footerStyle = {
      marginTop: 'auto',
      paddingTop: '10px',
      borderTop: '1px solid #E2E8F0',
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '8px',
      color: '#94A3B8'
    };

    // Page 4 Chart 1: Capital Runway SVG
    const renderPage4RunwaySvg = () => {
      const startAge = Number(profile.currentAge) || defaultBaseAge;
      const retireAge = Number(profile.targetRetirementAge) || 65;
      const maxAge = Number(profile.lifeExpectancy) || 85;
      const yearly = projectionResults.baseline.yearlyData;
      if (!yearly || yearly.length === 0) return null;

      const width = 710;
      const height = 135;
      const pad = { top: 20, right: 30, bottom: 22, left: 60 };
      const maxCap = Math.max(...yearly.map(d => d.capital), 200000);

      const getX = (age) => pad.left + ((age - startAge) / Math.max(1, maxAge - startAge)) * (width - pad.left - pad.right);
      const getY = (cap) => height - pad.bottom - (Math.max(0, cap) / maxCap) * (height - pad.top - pad.bottom);
      const formatK = (v) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${Math.round(v)}`);

      const points = yearly.map(d => `${getX(d.age).toFixed(1)},${getY(d.capital).toFixed(1)}`).join(' ');
      const xStart = getX(startAge);
      const xEnd = getX(maxAge);
      const yZero = height - pad.bottom;
      const area = `${xStart},${yZero} ${points} ${xEnd},${yZero}`;

      return (
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', background: '#FFFFFF' }}>
          {[0, 0.5, 1.0].map((pct, idx) => {
            const v = maxCap * pct;
            const y = getY(v);
            return (
              <g key={idx}>
                <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="#E2E8F0" strokeDasharray="3 3" />
                <text x={pad.left - 6} y={y + 3} fill="#64748B" fontSize="8" textAnchor="end">{formatK(v)}</text>
              </g>
            );
          })}
          {yearly.filter((_, idx) => idx % 5 === 0 || idx === yearly.length - 1).map((d, idx) => (
            <g key={idx}>
              <line x1={getX(d.age)} y1={yZero} x2={getX(d.age)} y2={yZero + 3} stroke="#94A3B8" />
              <text x={getX(d.age)} y={yZero + 12} fill="#64748B" fontSize="8" textAnchor="middle">Age {d.age}</text>
            </g>
          ))}
          <line x1={getX(retireAge)} y1={pad.top} x2={getX(retireAge)} y2={yZero} stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 2" />
          <text x={getX(retireAge)} y={pad.top - 5} fill="#D97706" fontSize="7.5" fontWeight="700" textAnchor="middle">Retire @ {retireAge}</text>

          <polygon points={area} fill="rgba(16, 185, 129, 0.12)" />
          <polyline points={points} fill="none" stroke="#10B981" strokeWidth="2.5" />

          {retirementNestEggAtRetire > 0 && (
            <g>
              <circle cx={getX(retireAge)} cy={getY(retirementNestEggAtRetire)} r="4" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
              <text x={getX(retireAge) + 6} y={getY(retirementNestEggAtRetire) - 4} fill="#047857" fontSize="7.5" fontWeight="700">Peak: {formatK(retirementNestEggAtRetire)}</text>
            </g>
          )}

          {baselineDepletion && (
            <g>
              <circle cx={getX(baselineDepletion)} cy={yZero} r="4" fill="#EF4444" />
              <text x={getX(baselineDepletion)} y={yZero - 8} fill="#DC2626" fontSize="7.5" fontWeight="700" textAnchor="middle">Depleted @ {baselineDepletion}</text>
            </g>
          )}
        </svg>
      );
    };

    // Page 4 Chart 2: Income Waterfall & Streams SVG
    const renderPage4IncomeWaterfallSvg = () => {
      const startAge = Number(profile.currentAge) || defaultBaseAge;
      const retireAge = Number(profile.targetRetirementAge) || 65;
      const maxAge = Number(profile.lifeExpectancy) || 85;
      const inflation = (Number(profile.inflationRate) || 3.0) / 100;
      const desiredMonthly = Number(retirementTarget.desiredMonthlyIncome) || 0;
      const annuityMonthly = Number(retirementTarget.expectedAnnuityPensions) || 0;
      const passiveMonthly = Number(cashflow.monthlyPassiveIncome) || 0;

      const numYears = Math.max(1, maxAge - retireAge + 1);
      const retireData = [];

      for (let age = retireAge; age <= maxAge; age++) {
        const yearsFromNow = age - startAge;
        const targetLiving = (desiredMonthly * 12) * Math.pow(1 + inflation, yearsFromNow);
        const guaranteedCpf = (annuityMonthly * 12) * Math.pow(1 + (inflation * 0.5), yearsFromNow);
        const passive = passiveMonthly * 12;
        const neededDrawdown = Math.max(0, targetLiving - guaranteedCpf - passive);

        const isDepleted = baselineDepletion && age >= baselineDepletion;
        const actualDrawdown = isDepleted ? 0 : neededDrawdown;
        const shortfall = Math.max(0, targetLiving - (guaranteedCpf + passive + actualDrawdown));

        retireData.push({ age, targetLiving, guaranteedCpf, passive, actualDrawdown, shortfall });
      }

      const width = 710;
      const height = 135;
      const pad = { top: 22, right: 30, bottom: 22, left: 60 };
      const maxVal = Math.max(...retireData.map(d => Math.max(d.targetLiving, d.guaranteedCpf + d.passive + d.actualDrawdown + d.shortfall)), 50000);

      const getX = (age) => pad.left + ((age - retireAge) / Math.max(1, maxAge - retireAge)) * (width - pad.left - pad.right);
      const getY = (val) => height - pad.bottom - (Math.max(0, val) / maxVal) * (height - pad.top - pad.bottom);
      const formatK = (v) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${Math.round(v)}`);

      const barWidth = Math.max(4, ((width - pad.left - pad.right) / numYears) - 2);
      const targetPoints = retireData.map(d => `${getX(d.age).toFixed(1)},${getY(d.targetLiving).toFixed(1)}`).join(' ');

      return (
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', background: '#FFFFFF' }}>
          {[0, 0.5, 1.0].map((pct, idx) => {
            const v = maxVal * pct;
            const y = getY(v);
            return (
              <g key={idx}>
                <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="#E2E8F0" strokeDasharray="3 3" />
                <text x={pad.left - 6} y={y + 3} fill="#64748B" fontSize="8" textAnchor="end">{formatK(v)}/yr</text>
              </g>
            );
          })}

          {retireData.filter((_, idx) => idx % 4 === 0 || idx === retireData.length - 1).map((d, idx) => (
            <g key={idx}>
              <line x1={getX(d.age)} y1={height - pad.bottom} x2={getX(d.age)} y2={height - pad.bottom + 3} stroke="#94A3B8" />
              <text x={getX(d.age)} y={height - pad.bottom + 12} fill="#64748B" fontSize="8" textAnchor="middle">Age {d.age}</text>
            </g>
          ))}

          {/* Stacked Bars */}
          {retireData.map((d, idx) => {
            const x = getX(d.age) - (barWidth / 2);
            let currentY = height - pad.bottom;
            const hCpf = (d.guaranteedCpf / maxVal) * (height - pad.top - pad.bottom);
            const hPassive = (d.passive / maxVal) * (height - pad.top - pad.bottom);
            const hDraw = (d.actualDrawdown / maxVal) * (height - pad.top - pad.bottom);
            const hShort = (d.shortfall / maxVal) * (height - pad.top - pad.bottom);

            return (
              <g key={idx}>
                {hCpf > 0 && (
                  <rect x={x} y={currentY - hCpf} width={barWidth} height={hCpf} fill="#818CF8" opacity="0.9" rx="0.5" />
                )}
                {(() => { currentY -= hCpf; return null; })()}
                {hPassive > 0 && (
                  <rect x={x} y={currentY - hPassive} width={barWidth} height={hPassive} fill="#06B6D4" opacity="0.9" rx="0.5" />
                )}
                {(() => { currentY -= hPassive; return null; })()}
                {hDraw > 0 && (
                  <rect x={x} y={currentY - hDraw} width={barWidth} height={hDraw} fill="#10B981" opacity="0.9" rx="0.5" />
                )}
                {(() => { currentY -= hDraw; return null; })()}
                {hShort > 0 && (
                  <rect x={x} y={currentY - hShort} width={barWidth} height={hShort} fill="#EF4444" opacity="0.85" rx="0.5" />
                )}
              </g>
            );
          })}

          <polyline points={targetPoints} fill="none" stroke="#D97706" strokeWidth="2" strokeDasharray="3 2" />

          {/* Legend */}
          <g transform={`translate(${width - 340}, ${pad.top - 8})`}>
            <rect x="0" y="0" width="7" height="5" fill="#818CF8" />
            <text x="10" y="5" fill="#334155" fontSize="7">CPF LIFE Floor</text>
            <rect x="75" y="0" width="7" height="5" fill="#06B6D4" />
            <text x="85" y="5" fill="#334155" fontSize="7">Passive / Rent</text>
            <rect x="155" y="0" width="7" height="5" fill="#10B981" />
            <text x="165" y="5" fill="#334155" fontSize="7">Drawdown</text>
            <line x1="225" y1="2.5" x2="235" y2="2.5" stroke="#D97706" strokeWidth="1.5" strokeDasharray="2 1" />
            <text x="239" y="5" fill="#B45309" fontSize="7">Target Need</text>
          </g>
        </svg>
      );
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        
        {/* Sticky Quick-Nav & Document Toolbar */}
        <div className="glass-panel" style={{
          position: 'sticky',
          top: '64px',
          zIndex: 90,
          width: '100%',
          maxWidth: '860px',
          padding: '12px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          {/* Quick Page Jump Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Jump to:</span>
            {[
              { id: 'report-page-1', label: '1. Cover' },
              { id: 'report-page-2', label: '2. Summary' },
              { id: 'report-page-3', label: '3. Balance Sheet' },
              { id: 'report-page-4', label: '4. Retirement' },
              { id: 'report-page-5', label: '5. Protection' },
              { id: 'report-page-6', label: '6. Action Plan' }
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => scrollToPage(p.id)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-light)',
                  cursor: 'pointer'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Action Export Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: '600',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34d399' }} />
              Real-Time Synced
            </div>

            <button
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', padding: '6px 14px' }}
              onClick={handleExportPdf}
              disabled={pdfExporting}
            >
              <Download size={13} /> {pdfExporting ? 'Exporting...' : 'Export PDF (A4)'}
            </button>

            <button
              className="btn"
              style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', padding: '6px 12px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' }}
              onClick={() => window.print()}
            >
              <Printer size={13} /> Print
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════════
            PAGE 1: COVER PAGE & CLIENT PARTICULARS
            ════════════════════════════════════════════════════════════════════════ */}
        <div id="report-page-1" style={pageStyle}>
          {/* Header Banner */}
          <div style={headerStyle}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                {reportBranding}
              </div>
              <div style={{ fontSize: '8.5px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>
                {reportSubtitle}
              </div>
            </div>
            <span style={{ backgroundColor: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', fontSize: '8px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>
              CONFIDENTIAL FINANCIAL REPORT
            </span>
          </div>

          {/* Title Area */}
          <div style={{ marginTop: '30px', marginBottom: '35px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
              Institutional Wealth Advisory • Comprehensive Review
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', margin: '0 0 10px 0', lineHeight: '1.2' }}>
              COMPREHENSIVE FINANCIAL PLAN & RETIREMENT PROJECTION
            </h1>
            <p style={{ fontSize: '11.5px', color: '#64748B', margin: 0, maxWidth: '640px', lineHeight: '1.5' }}>
              A holistic multi-discipline review covering wealth accumulation, cash flow solvency, Singapore CPF LIFE decumulation, and insurance risk mitigation.
            </p>
          </div>

          {/* Client & Consultant Particulars Schedule */}
          <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '18px 22px', backgroundColor: '#F8FAFC', marginBottom: '28px' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', marginBottom: '14px', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px' }}>
              Client & Advisory Consultant Particulars
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px', fontSize: '10.5px' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '9px', textTransform: 'uppercase' }}>Prepared For:</span>
                <strong style={{ color: '#0F172A', fontSize: '13px' }}>{client?.fullName || 'Valued Client'}</strong>
                {client?.preferredName && <span style={{ color: '#64748B', fontSize: '10px' }}> ({client.preferredName})</span>}
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '9px', textTransform: 'uppercase' }}>Prepared By:</span>
                <strong style={{ color: '#0F172A', fontSize: '13px' }}>{consultantName}</strong>
                <div style={{ fontSize: '9.5px', color: '#64748B' }}>{consultantTitle} • {consultantCreds}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '9px', textTransform: 'uppercase' }}>Client Age & Target:</span>
                <strong>Age {profile.currentAge}</strong> (Retiring @ <strong>Age {profile.targetRetirementAge}</strong> • {Math.max(0, Number(profile.targetRetirementAge) - Number(profile.currentAge))} yrs runway)
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '9px', textTransform: 'uppercase' }}>Representative Code / License:</span>
                <strong>{consultantRep}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '9px', textTransform: 'uppercase' }}>Assessment Date:</span>
                <strong>{reportDate}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '9px', textTransform: 'uppercase' }}>Advisory Contact:</span>
                <span>{consultantPhone} • {consultantEmail}</span>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#64748B', display: 'block', fontSize: '9px', textTransform: 'uppercase' }}>Advisory Focus Area:</span>
                <strong style={{ color: '#2563EB' }}>
                  {focusArea === 'fire' ? 'Early Retirement / FIRE Strategy' :
                   focusArea === 'protection' ? 'Comprehensive Risk Mitigation & Insurance Audit' :
                   focusArea === 'education' ? 'Tertiary Education Funding & Milestone Planning' :
                   focusArea === 'wealth_preservation' ? 'Estate Planning & Intergenerational Wealth Transfer' :
                   focusArea === 'cpf_maximization' ? 'Singapore CPF Accrued Interest & Decumulation Optimization' :
                   'Holistic Wealth Architecture & Longevity Solvency'}
                </strong>
              </div>
            </div>
          </div>

          {/* Table of Contents Schedule */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
            <div style={{ fontSize: '10px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', marginBottom: '10px' }}>
              Report Table of Contents
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', fontSize: '10px' }}>
              <div><strong>Section 1:</strong> Executive Summary & Key Indicators (Page 2)</div>
              <div><strong>Section 2:</strong> Net Worth Statement & Balance Sheet (Page 3)</div>
              <div><strong>Section 3:</strong> Cash Flow & Savings Capacity (Page 3)</div>
              <div><strong>Section 4:</strong> Retirement Planning & CPF LIFE (Page 4)</div>
              <div><strong>Section 5:</strong> Insurance Policies & Matrix (Page 5)</div>
              <div><strong>Section 6:</strong> Strategic Recommendations (Page 6)</div>
            </div>
          </div>

          {/* Page 1 Footer */}
          <div style={footerStyle}>
            <span>Strictly Private & Confidential • Prepared by {consultantName}</span>
            <span>Page 1 of 6</span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════════
            PAGE 2: EXECUTIVE SUMMARY & SCORECARDS
            ════════════════════════════════════════════════════════════════════════ */}
        <div id="report-page-2" style={pageStyle}>
          {/* Header Banner */}
          <div style={headerStyle}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase' }}>
                {reportBranding}
              </div>
              <div style={{ fontSize: '8.5px', color: '#64748B' }}>Section 1: Executive Summary & Performance Scorecards</div>
            </div>
            <span style={{ fontSize: '8px', color: '#94A3B8' }}>Prepared for {client?.fullName}</span>
          </div>

          <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: '0 0 14px 0' }}>
            EXECUTIVE SUMMARY & FINANCIAL HEALTH SCORECARDS
          </h2>

          {/* Scorecards Ribbon */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '18px' }}>
            <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '12px', textAlign: 'center', backgroundColor: '#F8FAFC' }}>
              <div style={{ fontSize: '8.5px', color: '#64748B', textTransform: 'uppercase', fontWeight: '700' }}>Overall Financial Health</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#7C3AED', margin: '3px 0' }}>{aiSummary?.financialHealthScore || 82} / 100</div>
              <div style={{ fontSize: '8px', color: '#64748B' }}>Liquidity, Debt & Asset Trajectory</div>
            </div>

            <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '12px', textAlign: 'center', backgroundColor: '#F8FAFC' }}>
              <div style={{ fontSize: '8.5px', color: '#64748B', textTransform: 'uppercase', fontWeight: '700' }}>Retirement Readiness</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#059669', margin: '3px 0' }}>{aiSummary?.retirementReadinessScore || (isRetirementOnTrack ? 85 : 45)} / 100</div>
              <div style={{ fontSize: '8px', color: '#64748B' }}>Longevity Solvency Horizon</div>
            </div>

            <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '12px', textAlign: 'center', backgroundColor: '#F8FAFC' }}>
              <div style={{ fontSize: '8.5px', color: '#64748B', textTransform: 'uppercase', fontWeight: '700' }}>Insurance Protection</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#2563EB', margin: '3px 0' }}>{aiSummary?.protectionHealthScore || protectionScore} / 100</div>
              <div style={{ fontSize: '8px', color: '#64748B' }}>Coverage vs. Actuarial Benchmarks</div>
            </div>
          </div>

          {/* Executive Summary Narrative */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px 18px', backgroundColor: '#FFFFFF', marginBottom: '16px' }}>
            <div style={{ fontSize: '10px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', marginBottom: '6px' }}>
              Advisory Position Narrative
            </div>
            <p style={{ margin: 0, color: '#334155', fontSize: '10px', lineHeight: '1.55' }}>
              {aiSummary?.executiveSummary ||
                `${client?.fullName || 'The client'} presents a current estimated Net Worth of ${formatCurrency(totalNetWorth)} with annual savings of ${formatCurrency(annualSavings)}/yr (savings rate: ${savingsRate}%). With target retirement at Age ${profile.targetRetirementAge}, the baseline projection indicates ${isRetirementOnTrack ? 'sustainable capital preservation through target life expectancy.' : `potential capital depletion at Age ${baselineDepletion}, requiring systematic decumulation restructuring.`}`}
            </p>
          </div>

          {/* Scenario Analysis & Focus Area Card */}
          <div style={{ border: '1px solid #E0E7FF', backgroundColor: '#F5F7FF', borderRadius: '8px', padding: '14px 18px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <strong style={{ fontSize: '10px', color: '#1E40AF', textTransform: 'uppercase' }}>
                Scenario Analysis & Client Mandate
              </strong>
              <span style={{ fontSize: '8.5px', fontWeight: '700', color: '#2563EB', backgroundColor: '#EEF2FF', padding: '2px 8px', borderRadius: '4px' }}>
                Active Scenario
              </span>
            </div>
            <p style={{ fontSize: '10px', color: '#334155', margin: '0 0 6px 0', lineHeight: '1.5' }}>
              {advisorCustomNotes ||
                `Planning assumptions benchmarked at ${profile.inflationRate}% annual inflation, with ${profile.preRetireReturn}% pre-retirement growth and ${profile.postRetireReturn}% post-retirement conservative drawdown compounding.`}
            </p>
            {aiSummary?.scenarioAnalysis && (
              <div style={{ fontSize: '9.5px', color: '#1E3A8A', borderTop: '1px dashed #CBD5E1', paddingTop: '6px', marginTop: '6px' }}>
                <strong>Impact Assessment: </strong>{aiSummary.scenarioAnalysis.impactAssessment || aiSummary.scenarioAnalysis}
              </div>
            )}
          </div>

          {/* Financial Strengths vs. Areas for Improvement */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ border: '1px solid #A7F3D0', backgroundColor: '#ECFDF5', borderRadius: '8px', padding: '12px 14px' }}>
              <strong style={{ fontSize: '10px', color: '#065F46', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                ✓ Key Financial Strengths
              </strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '9.5px', color: '#064E3B' }}>
                {(aiSummary?.keyStrengths && aiSummary.keyStrengths.length > 0) ? (
                  aiSummary.keyStrengths.map((s, i) => <div key={i}>• {s}</div>)
                ) : (
                  <>
                    <div>• Positive monthly cashflow surplus of {formatCurrency(monthlySurplus)}/mo</div>
                    <div>• Liquid emergency reserves funded for {liquidEmergencyMonths} months</div>
                    <div>• CPF OA/SA/RA balances total {formatCurrency(totalCpf)} for baseline stability</div>
                  </>
                )}
              </div>
            </div>

            <div style={{ border: '1px solid #FED7AA', backgroundColor: '#FFF7ED', borderRadius: '8px', padding: '12px 14px' }}>
              <strong style={{ fontSize: '10px', color: '#9A3412', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                ⚠️ Strategic Vulnerabilities & Trade-Offs
              </strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '9.5px', color: '#7C2D12' }}>
                {(aiSummary?.criticalVulnerabilities && aiSummary.criticalVulnerabilities.length > 0) ? (
                  aiSummary.criticalVulnerabilities.map((v, i) => <div key={i}>• {v}</div>)
                ) : (
                  <>
                    <div>• Sequence of returns vulnerability during first 5 years of decumulation</div>
                    <div>• {inForceCoverage.hasShield ? 'Shield active but rider coverage needs review' : 'Integrated Shield Plan not detected in in-force schedule'}</div>
                    <div>• Inflation erosion requires yield hedged drawdown portfolio</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Page 2 Footer */}
          <div style={footerStyle}>
            <span>Prepared for: {client?.fullName} • Prepared by: {consultantName}</span>
            <span>Page 2 of 6</span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════════
            PAGE 3: NET WORTH STATEMENT & CASH FLOW ANALYSIS
            ════════════════════════════════════════════════════════════════════════ */}
        <div id="report-page-3" style={pageStyle}>
          {/* Header Banner */}
          <div style={headerStyle}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase' }}>
                {reportBranding}
              </div>
              <div style={{ fontSize: '8.5px', color: '#64748B' }}>Section 2 & 3: Net Worth Statement, Balance Sheet & Cash Flow</div>
            </div>
            <span style={{ fontSize: '8px', color: '#94A3B8' }}>Prepared for {client?.fullName}</span>
          </div>

          <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: '0 0 14px 0' }}>
            BALANCE SHEET & MONTHLY CASH FLOW DYNAMICS
          </h2>

          {/* Net Worth Table */}
          <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', overflow: 'hidden', marginBottom: '18px' }}>
            <div style={{ backgroundColor: '#0F172A', color: '#FFFFFF', padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Net Worth Statement Schedule</span>
              <span style={{ fontSize: '12px', fontWeight: '800', color: totalNetWorth >= 0 ? '#34D399' : '#F87171' }}>Total Net Worth: {formatCurrency(totalNetWorth)}</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <tbody>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '7px 14px', fontWeight: '700', color: '#0F172A' }}>Asset Category</td>
                  <td style={{ padding: '7px 14px', textAlign: 'right', fontWeight: '700', color: '#0F172A' }}>Valuation</td>
                  <td style={{ padding: '7px 14px', color: '#64748B' }}>Actuarial Notes & Liquidity Horizon</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '7px 14px' }}>Liquid Cash & Cash Equivalents</td>
                  <td style={{ padding: '7px 14px', textAlign: 'right', fontWeight: '700' }}>{formatCurrency(totalLiquid)}</td>
                  <td style={{ padding: '7px 14px', color: '#64748B' }}>{liquidEmergencyMonths} months emergency living buffer (Target: 6-12 mos)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '7px 14px' }}>Invested Assets & Portfolios</td>
                  <td style={{ padding: '7px 14px', textAlign: 'right', fontWeight: '700' }}>{formatCurrency(totalInvested)}</td>
                  <td style={{ padding: '7px 14px', color: '#64748B' }}>Equities, fixed income, unit trusts, and alternative assets</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                  <td style={{ padding: '7px 14px', paddingLeft: '24px' }}>• CPF Ordinary Account (OA)</td>
                  <td style={{ padding: '7px 14px', textAlign: 'right' }}>{formatCurrency(totalCpfOA)}</td>
                  <td style={{ padding: '7px 14px', color: '#64748B' }}>Base 2.5% p.a. • Housing & CPFIS eligible</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                  <td style={{ padding: '7px 14px', paddingLeft: '24px' }}>• CPF Special Account (SA)</td>
                  <td style={{ padding: '7px 14px', textAlign: 'right' }}>{formatCurrency(totalCpfSA)}</td>
                  <td style={{ padding: '7px 14px', color: '#64748B' }}>Base 4.0% p.a. • Pre-55 compounder</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                  <td style={{ padding: '7px 14px', paddingLeft: '24px' }}>• CPF Retirement Account (RA)</td>
                  <td style={{ padding: '7px 14px', textAlign: 'right' }}>{formatCurrency(totalCpfRA)}</td>
                  <td style={{ padding: '7px 14px', color: '#64748B' }}>Base 4.0% p.a. • Foundation for CPF LIFE lifelong payouts</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                  <td style={{ padding: '7px 14px', paddingLeft: '24px' }}>• CPF MediSave Account (MA)</td>
                  <td style={{ padding: '7px 14px', textAlign: 'right' }}>{formatCurrency(totalCpfMA)}</td>
                  <td style={{ padding: '7px 14px', color: '#64748B' }}>Base 4.0% p.a. • MediShield Life & medical expenses</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                  <td style={{ padding: '7px 14px', paddingLeft: '24px' }}>• Supplementary Retirement Scheme (SRS)</td>
                  <td style={{ padding: '7px 14px', textAlign: 'right' }}>{formatCurrency(totalSrs)}</td>
                  <td style={{ padding: '7px 14px', color: '#64748B' }}>Tax-deferred voluntary wealth accumulation</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '7px 14px' }}>Total Combined CPF & SRS Reserves</td>
                  <td style={{ padding: '7px 14px', textAlign: 'right', fontWeight: '700', color: '#4338CA' }}>{formatCurrency(totalPension)}</td>
                  <td style={{ padding: '7px 14px', color: '#4338CA' }}>National pension foundation</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '7px 14px' }}>Primary Residence & Real Estate</td>
                  <td style={{ padding: '7px 14px', textAlign: 'right', fontWeight: '700' }}>{formatCurrency(totalProperty)}</td>
                  <td style={{ padding: '7px 14px', color: '#64748B' }}>Mortgage Debt: {formatCurrency(totalMortgage)} (Net Equity: {formatCurrency(Math.max(0, totalProperty - totalMortgage))})</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #CBD5E1', backgroundColor: '#FEF2F2' }}>
                  <td style={{ padding: '7px 14px', color: '#991B1B', fontWeight: '700' }}>Total Liabilities & Debt Obligations</td>
                  <td style={{ padding: '7px 14px', textAlign: 'right', fontWeight: '700', color: '#DC2626' }}>{formatCurrency(totalLiabilities)}</td>
                  <td style={{ padding: '7px 14px', color: '#991B1B' }}>Outstanding mortgage and other liabilities</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Cash Flow Schedule Table */}
          <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#1E293B', color: '#FFFFFF', padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly Cash Flow & Savings Capacity</span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#60A5FA' }}>Net Savings: {formatCurrency(monthlySurplus)}/mo ({savingsRate}%)</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '7px 14px' }}>Monthly Gross Earned Income</td>
                  <td style={{ padding: '7px 14px', textAlign: 'right', fontWeight: '700' }}>{formatCurrency(cashflow.monthlyEarnedIncome)}/mo</td>
                  <td style={{ padding: '7px 14px', color: '#64748B' }}>Primary salaried or business earned income</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '7px 14px' }}>Monthly Passive / Rental Income</td>
                  <td style={{ padding: '7px 14px', textAlign: 'right', fontWeight: '700' }}>{formatCurrency(cashflow.monthlyPassiveIncome)}/mo</td>
                  <td style={{ padding: '7px 14px', color: '#64748B' }}>Rental yield, dividend distributions, or business royalties</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                  <td style={{ padding: '7px 14px' }}>Monthly Living & Lifestyle Expenses</td>
                  <td style={{ padding: '7px 14px', textAlign: 'right', color: '#DC2626' }}>({formatCurrency(cashflow.monthlyLivingExpenses)}/mo)</td>
                  <td style={{ padding: '7px 14px', color: '#64748B' }}>Household, discretionary, medical & personal upkeep</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                  <td style={{ padding: '7px 14px' }}>Monthly Debt Servicing & Commitments</td>
                  <td style={{ padding: '7px 14px', textAlign: 'right', color: '#DC2626' }}>({formatCurrency(cashflow.monthlyCommitments)}/mo)</td>
                  <td style={{ padding: '7px 14px', color: '#64748B' }}>Mortgage installments, loans, and policy premiums</td>
                </tr>
                <tr style={{ backgroundColor: '#ECFDF5' }}>
                  <td style={{ padding: '8px 14px', fontWeight: '800', color: '#065F46' }}>Annualized Savings Capacity</td>
                  <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '800', color: '#059669', fontSize: '11px' }}>{formatCurrency(annualSavings)}/yr</td>
                  <td style={{ padding: '8px 14px', color: '#065F46' }}>Capital deployed into wealth accumulation</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Page 3 Footer */}
          <div style={footerStyle}>
            <span>Prepared for: {client?.fullName} • Prepared by: {consultantName}</span>
            <span>Page 3 of 6</span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════════
            PAGE 4: RETIREMENT PLANNING & CPF LIFE
            ════════════════════════════════════════════════════════════════════════ */}
        <div id="report-page-4" style={pageStyle}>
          {/* Header Banner */}
          <div style={headerStyle}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase' }}>
                {reportBranding}
              </div>
              <div style={{ fontSize: '8.5px', color: '#64748B' }}>Section 4: Retirement Planning, Projection Charts & Singapore CPF LIFE</div>
            </div>
            <span style={{ fontSize: '8px', color: '#94A3B8' }}>Prepared for {client?.fullName}</span>
          </div>

          <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: '0 0 10px 0' }}>
            RETIREMENT RUNWAY & LIFELONG DECUMULATION ARCHITECTURE
          </h2>

          {/* Target Metrics Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 12px', backgroundColor: '#F8FAFC' }}>
              <div style={{ fontSize: '8px', color: '#64748B', textTransform: 'uppercase', fontWeight: '700' }}>Desired Monthly Living</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>{formatCurrency(retirementTarget.desiredMonthlyIncome)}/mo</div>
              <div style={{ fontSize: '8px', color: '#64748B' }}>In today's purchasing power</div>
            </div>
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 12px', backgroundColor: '#F8FAFC' }}>
              <div style={{ fontSize: '8px', color: '#64748B', textTransform: 'uppercase', fontWeight: '700' }}>Peak Projected Nest Egg</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#10B981' }}>{formatCurrency(retirementNestEggAtRetire)}</div>
              <div style={{ fontSize: '8px', color: '#64748B' }}>At Target Age {profile.targetRetirementAge}</div>
            </div>
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 12px', backgroundColor: '#F8FAFC' }}>
              <div style={{ fontSize: '8px', color: '#64748B', textTransform: 'uppercase', fontWeight: '700' }}>CPF LIFE Guaranteed Floor</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#6366F1' }}>{formatCurrency(retirementTarget.expectedAnnuityPensions)}/mo</div>
              <div style={{ fontSize: '8px', color: '#64748B' }}>Lifelong monthly payout floor</div>
            </div>
          </div>

          {/* Chart 1 Container */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '6px', padding: '6px 10px', backgroundColor: '#FFFFFF', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
              <strong style={{ fontSize: '9px', color: '#0F172A', textTransform: 'uppercase' }}>
                Chart 1: Capital Accumulation & Decumulation Runway (Age {profile.currentAge} → {profile.lifeExpectancy})
              </strong>
              <span style={{ fontSize: '8px', color: isRetirementOnTrack ? '#059669' : '#DC2626', fontWeight: '700' }}>
                {isRetirementOnTrack ? '✓ Sustained Through Age ' + profile.lifeExpectancy : '⚠️ Depleted at Age ' + baselineDepletion}
              </span>
            </div>
            {renderPage4RunwaySvg()}
          </div>

          {/* Chart 2 Container */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '6px', padding: '6px 10px', backgroundColor: '#FFFFFF', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
              <strong style={{ fontSize: '9px', color: '#0F172A', textTransform: 'uppercase' }}>
                Chart 2: Projected Retirement Income vs. Inflated Living Expenses
              </strong>
              <span style={{ fontSize: '8px', color: '#64748B' }}>
                Guaranteed Floor: {formatCurrency(Number(retirementTarget.expectedAnnuityPensions || 0) + Number(cashflow.monthlyPassiveIncome || 0))}/mo
              </span>
            </div>
            {renderPage4IncomeWaterfallSvg()}
          </div>

          {/* Singapore CPF LIFE Strategy Card */}
          <div style={{ borderLeft: '3.5px solid #7C3AED', padding: '10px 14px', backgroundColor: '#FAF5FF', borderRadius: '6px' }}>
            <strong style={{ fontSize: '9.5px', color: '#6D28D9', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              Singapore CPF LIFE & Guaranteed Decumulation Strategy
            </strong>
            <p style={{ fontSize: '9.5px', color: '#334155', margin: 0, lineHeight: '1.45' }}>
              {aiSummary?.cpfAndAnnuityOptimization ||
                `CPF LIFE forms the unshakeable bedrock of retirement planning in Singapore. Maximizing the Retirement Account (RA) towards the Full Retirement Sum (FRS) or Enhanced Retirement Sum (ERS) at Age 55 locks in a lifelong guaranteed floor of ${formatCurrency(retirementTarget.expectedAnnuityPensions)}/mo. The Escalating Plan is recommended to defend purchasing power against compounding inflation.`}
            </p>
          </div>

          {/* Page 4 Footer */}
          <div style={footerStyle}>
            <span>Prepared for: {client?.fullName} • Prepared by: {consultantName}</span>
            <span>Page 4 of 6</span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════════
            PAGE 5: INSURANCE POLICIES & COVERAGE ANALYSIS
            ════════════════════════════════════════════════════════════════════════ */}
        <div id="report-page-5" style={pageStyle}>
          {/* Header Banner */}
          <div style={headerStyle}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase' }}>
                {reportBranding}
              </div>
              <div style={{ fontSize: '8.5px', color: '#64748B' }}>Section 5: Insurance Policies & Coverage Gap Matrix</div>
            </div>
            <span style={{ fontSize: '8px', color: '#94A3B8' }}>Prepared for {client?.fullName}</span>
          </div>

          <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: '0 0 14px 0' }}>
            IN-FORCE POLICY AUDIT & PROTECTION GAP ANALYSIS
          </h2>

          {/* In-Force Policies Table */}
          <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', overflow: 'hidden', marginBottom: '18px' }}>
            <div style={{ backgroundColor: '#0F172A', color: '#FFFFFF', padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>Active In-Force Insurance Policies ({policies.length})</span>
              <span style={{ fontSize: '10px', color: '#94A3B8' }}>Aggregated across all insurers</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px' }}>
              <tbody>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '6px 12px', fontWeight: '700' }}>Plan / Policy Name</td>
                  <td style={{ padding: '6px 12px', fontWeight: '700' }}>Insurer & Number</td>
                  <td style={{ padding: '6px 12px', fontWeight: '700' }}>Annual Premium</td>
                  <td style={{ padding: '6px 12px', fontWeight: '700' }}>Status</td>
                  <td style={{ padding: '6px 12px', fontWeight: '700' }}>Key Coverages</td>
                </tr>
                {policies.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: '#64748B', fontStyle: 'italic' }}>
                      No in-force policies recorded. Use the Policy Management section to input client insurance policies.
                    </td>
                  </tr>
                ) : (
                  policies.map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '6px 12px', fontWeight: '600' }}>
                        {p.planName || p.policyName || p.policyType}
                        {p.insuredType === 'Dependent' && (
                          <div style={{ fontSize: '8px', color: '#7C3AED', fontWeight: '700', marginTop: '2px' }}>
                            👶 Insured: {p.insuredName || 'Dependent'} ({p.insuredRelationship || 'Family'})
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '6px 12px', color: '#64748B' }}>{p.company || p.provider} • {p.policyNumber}</td>
                      <td style={{ padding: '6px 12px', fontWeight: '600' }}>{formatCurrency(p.premiumAmount)}/{p.premiumFrequency || 'yr'}</td>
                      <td style={{ padding: '6px 12px' }}>
                        <span style={{ fontSize: '8px', padding: '2px 6px', borderRadius: '4px', backgroundColor: p.status === 'In Force' ? '#ECFDF5' : '#FEF2F2', color: p.status === 'In Force' ? '#065F46' : '#991B1B', fontWeight: '700' }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: '6px 12px', color: '#334155' }}>
                        {p.coverages ? Object.entries(p.coverages).filter(([_, v]) => Number(v) > 0).map(([k, v]) => `${k}: ${formatCurrency(v)}`).join(' | ') : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Insurance Gap Matrix */}
          <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#1E293B', color: '#FFFFFF', padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>Insurance Coverage vs. Recommended Benchmarks</span>
              <span style={{ fontSize: '10px', fontWeight: '700', color: protectionScore >= 75 ? '#34D399' : '#FBBF24' }}>Protection Score: {protectionScore} / 100</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px' }}>
              <tbody>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '6px 12px', fontWeight: '700' }}>Risk Category</td>
                  <td style={{ padding: '6px 12px', fontWeight: '700' }}>In-Force Coverage</td>
                  <td style={{ padding: '6px 12px', fontWeight: '700' }}>Benchmark Target</td>
                  <td style={{ padding: '6px 12px', fontWeight: '700' }}>Net Gap / Surplus</td>
                  <td style={{ padding: '6px 12px', fontWeight: '700' }}>Status</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '6px 12px', fontWeight: '600' }}>Life / Death Protection</td>
                  <td style={{ padding: '6px 12px' }}>{formatCurrency(inForceCoverage.death)}</td>
                  <td style={{ padding: '6px 12px' }}>{formatCurrency(recommendedDeath)} (10x income + debt)</td>
                  <td style={{ padding: '6px 12px', fontWeight: '700', color: inForceCoverage.death >= recommendedDeath ? '#059669' : '#DC2626' }}>
                    {formatCurrency(inForceCoverage.death - recommendedDeath)}
                  </td>
                  <td style={{ padding: '6px 12px' }}>
                    <span style={{ fontSize: '8px', padding: '2px 6px', borderRadius: '4px', backgroundColor: inForceCoverage.death >= recommendedDeath ? '#ECFDF5' : '#FEF2F2', color: inForceCoverage.death >= recommendedDeath ? '#065F46' : '#991B1B', fontWeight: '700' }}>
                      {inForceCoverage.death >= recommendedDeath ? 'Adequate' : 'Underinsured'}
                    </span>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '6px 12px', fontWeight: '600' }}>Total & Permanent Disability (TPD)</td>
                  <td style={{ padding: '6px 12px' }}>{formatCurrency(inForceCoverage.tpd)}</td>
                  <td style={{ padding: '6px 12px' }}>{formatCurrency(recommendedTpd)} (10x income)</td>
                  <td style={{ padding: '6px 12px', fontWeight: '700', color: inForceCoverage.tpd >= recommendedTpd ? '#059669' : '#DC2626' }}>
                    {formatCurrency(inForceCoverage.tpd - recommendedTpd)}
                  </td>
                  <td style={{ padding: '6px 12px' }}>
                    <span style={{ fontSize: '8px', padding: '2px 6px', borderRadius: '4px', backgroundColor: inForceCoverage.tpd >= recommendedTpd ? '#ECFDF5' : '#FEF2F2', color: inForceCoverage.tpd >= recommendedTpd ? '#065F46' : '#991B1B', fontWeight: '700' }}>
                      {inForceCoverage.tpd >= recommendedTpd ? 'Adequate' : 'Gap Exists'}
                    </span>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '6px 12px', fontWeight: '600' }}>Early Stage Critical Illness</td>
                  <td style={{ padding: '6px 12px' }}>{formatCurrency(inForceCoverage.earlyCi)}</td>
                  <td style={{ padding: '6px 12px' }}>{formatCurrency(recommendedEarlyCi)} (2x annual income)</td>
                  <td style={{ padding: '6px 12px', fontWeight: '700', color: inForceCoverage.earlyCi >= recommendedEarlyCi ? '#059669' : '#DC2626' }}>
                    {formatCurrency(inForceCoverage.earlyCi - recommendedEarlyCi)}
                  </td>
                  <td style={{ padding: '6px 12px' }}>
                    <span style={{ fontSize: '8px', padding: '2px 6px', borderRadius: '4px', backgroundColor: inForceCoverage.earlyCi >= recommendedEarlyCi ? '#ECFDF5' : '#FEF2F2', color: inForceCoverage.earlyCi >= recommendedEarlyCi ? '#065F46' : '#991B1B', fontWeight: '700' }}>
                      {inForceCoverage.earlyCi >= recommendedEarlyCi ? 'Covered' : 'Gap Exists'}
                    </span>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '6px 12px', fontWeight: '600' }}>Major / Late Stage CI</td>
                  <td style={{ padding: '6px 12px' }}>{formatCurrency(inForceCoverage.majorCi)}</td>
                  <td style={{ padding: '6px 12px' }}>{formatCurrency(recommendedMajorCi)} (4x annual income)</td>
                  <td style={{ padding: '6px 12px', fontWeight: '700', color: inForceCoverage.majorCi >= recommendedMajorCi ? '#059669' : '#DC2626' }}>
                    {formatCurrency(inForceCoverage.majorCi - recommendedMajorCi)}
                  </td>
                  <td style={{ padding: '6px 12px' }}>
                    <span style={{ fontSize: '8px', padding: '2px 6px', borderRadius: '4px', backgroundColor: inForceCoverage.majorCi >= recommendedMajorCi ? '#ECFDF5' : '#FEF2F2', color: inForceCoverage.majorCi >= recommendedMajorCi ? '#065F46' : '#991B1B', fontWeight: '700' }}>
                      {inForceCoverage.majorCi >= recommendedMajorCi ? 'Adequate' : 'Priority Gap'}
                    </span>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '6px 12px', fontWeight: '600' }}>Disability Income Replacement</td>
                  <td style={{ padding: '6px 12px' }}>{formatCurrency(inForceCoverage.disabilityIncome)}/mo</td>
                  <td style={{ padding: '6px 12px' }}>{formatCurrency(recommendedDisability)}/mo (75% monthly)</td>
                  <td style={{ padding: '6px 12px', fontWeight: '700', color: inForceCoverage.disabilityIncome >= recommendedDisability ? '#059669' : '#DC2626' }}>
                    {formatCurrency(inForceCoverage.disabilityIncome - recommendedDisability)}/mo
                  </td>
                  <td style={{ padding: '6px 12px' }}>
                    <span style={{ fontSize: '8px', padding: '2px 6px', borderRadius: '4px', backgroundColor: inForceCoverage.disabilityIncome >= recommendedDisability ? '#ECFDF5' : '#FEF2F2', color: inForceCoverage.disabilityIncome >= recommendedDisability ? '#065F46' : '#991B1B', fontWeight: '700' }}>
                      {inForceCoverage.disabilityIncome >= recommendedDisability ? 'Covered' : 'Gap Exists'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 12px', fontWeight: '600' }}>Hospitalization & Shield</td>
                  <td style={{ padding: '6px 12px' }}>{inForceCoverage.hasShield ? 'Integrated Shield Active' : 'None Detected'}</td>
                  <td style={{ padding: '6px 12px' }}>MediShield Life + Private Rider</td>
                  <td style={{ padding: '6px 12px', color: '#64748B' }}>Inpatient ward & co-pay protection</td>
                  <td style={{ padding: '6px 12px' }}>
                    <span style={{ fontSize: '8px', padding: '2px 6px', borderRadius: '4px', backgroundColor: inForceCoverage.hasShield ? '#ECFDF5' : '#FEF2F2', color: inForceCoverage.hasShield ? '#065F46' : '#991B1B', fontWeight: '700' }}>
                      {inForceCoverage.hasShield ? 'Active' : 'Urgent Review'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Page 5 Children & Dependents Schedule */}
          {dependentsPolicies.length > 0 && (
            <div style={{ marginTop: '14px', border: '1px solid #E9D5FF', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#FAF5FF' }}>
              <div style={{ backgroundColor: '#6D28D9', color: '#FFFFFF', padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase' }}>
                  👶 Children & Dependents In-Force Protection Schedule ({dependentsPolicies.length} Policies)
                </span>
                <span style={{ fontSize: '9px', color: '#E9D5FF' }}>Client is Policy Owner & Payor</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F3E8FF', borderBottom: '1px solid #E9D5FF' }}>
                    <th style={{ padding: '5px 10px', textAlign: 'left', fontWeight: '700', color: '#5B21B6', width: '25%' }}>Insured Dependent</th>
                    <th style={{ padding: '5px 10px', textAlign: 'left', fontWeight: '700', color: '#5B21B6', width: '32%' }}>Plan & Insurer</th>
                    <th style={{ padding: '5px 10px', textAlign: 'left', fontWeight: '700', color: '#5B21B6', width: '18%' }}>Annual Premium</th>
                    <th style={{ padding: '5px 10px', textAlign: 'left', fontWeight: '700', color: '#5B21B6', width: '25%' }}>Benefits & Coverages</th>
                  </tr>
                </thead>
                <tbody>
                  {dependentsPolicies.map((dp, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #E9D5FF' }}>
                      <td style={{ padding: '5px 10px', verticalAlign: 'top' }}>
                        <strong style={{ color: '#0F172A' }}>{dp.insuredName || 'Dependent'}</strong>
                        <div style={{ fontSize: '8px', color: '#7C3AED' }}>{dp.insuredRelationship || 'Family'}</div>
                      </td>
                      <td style={{ padding: '5px 10px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: '600', color: '#0F172A' }}>{dp.policyName || dp.planName || dp.policyType}</div>
                        <div style={{ fontSize: '8px', color: '#64748B' }}>{dp.provider || dp.company || ''} • {dp.policyType || ''}</div>
                      </td>
                      <td style={{ padding: '5px 10px', verticalAlign: 'top', fontWeight: '600' }}>
                        {formatCurrency(dp.premiumAmount)}/{dp.premiumFrequency || 'yr'}
                      </td>
                      <td style={{ padding: '5px 10px', verticalAlign: 'top' }}>
                        {dp.coverages && Object.keys(dp.coverages).length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                            {Object.entries(dp.coverages).filter(([_, v]) => Number(v) > 0).map(([k, v]) => (
                              <span key={k} style={{ fontSize: '8px', backgroundColor: '#EDE9FE', color: '#5B21B6', padding: '1px 4px', borderRadius: '3px', fontWeight: '600' }}>
                                {k}: {formatCurrency(v)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '8px', color: '#7C3AED' }}>In Force</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Page 5 Footer */}
          <div style={footerStyle}>
            <span>Prepared for: {client?.fullName} • Prepared by: {consultantName}</span>
            <span>Page 5 of 6</span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════════
            PAGE 6: ACTION PLAN & ADVISORY NOTICE
            ════════════════════════════════════════════════════════════════════════ */}
        <div id="report-page-6" style={pageStyle}>
          {/* Header Banner */}
          <div style={headerStyle}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase' }}>
                {reportBranding}
              </div>
              <div style={{ fontSize: '8.5px', color: '#64748B' }}>Section 6: Prioritized Action Plan, Stress Testing & Advisory Notice</div>
            </div>
            <span style={{ fontSize: '8px', color: '#94A3B8' }}>Prepared for {client?.fullName}</span>
          </div>

          <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: '0 0 14px 0' }}>
            PRIORITIZED STRATEGIC ACTION ROADMAP
          </h2>

          {/* Action Recommendations Matrix */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {((aiSummary?.strategicRecommendations && aiSummary.strategicRecommendations.length > 0)
              ? aiSummary.strategicRecommendations
              : [
                  { priority: 'High', category: 'Protection', action: 'Bridge Major Critical Illness Insurance Gap', rationale: 'Current critical illness buffer is below 4x annual income benchmark. An unexpected shock could deplete investment assets during accumulation.', timeline: 'Immediate' },
                  { priority: 'High', category: 'Retirement', action: 'Structure CPF SA to RA Compounder towards ERS', rationale: 'Maximizing the Retirement Account foundation up to Enhanced Retirement Sum locks in maximum inflation-hedged guaranteed lifelong CPF LIFE payouts.', timeline: 'Next 3-6 Months' },
                  { priority: 'Medium', category: 'Wealth Accumulation', action: 'Automate Monthly Surplus Investment', rationale: `Deploy surplus savings capacity of ${formatCurrency(monthlySurplus)}/mo into diversified low-cost systematic accumulation portfolio.`, timeline: 'Within 30 Days' }
                ]
            ).slice(0, 4).map((rec, idx) => (
              <div key={idx} style={{ borderLeft: `3.5px solid ${rec.priority === 'High' ? '#DC2626' : rec.priority === 'Medium' ? '#F59E0B' : '#2563EB'}`, padding: '8px 12px', backgroundColor: '#F8FAFC', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <strong style={{ fontSize: '10.5px', color: '#0F172A' }}>{idx + 1}. {rec.action}</strong>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ fontSize: '8px', fontWeight: '700', padding: '1px 6px', borderRadius: '4px', backgroundColor: rec.priority === 'High' ? '#FEF2F2' : '#FFFBEB', color: rec.priority === 'High' ? '#DC2626' : '#D97706' }}>
                      {rec.priority} Priority
                    </span>
                    {rec.category && (
                      <span style={{ fontSize: '8px', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                        {rec.category}
                      </span>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: '9.5px', color: '#475569', margin: 0, lineHeight: '1.45' }}>{rec.rationale}</p>
              </div>
            ))}
          </div>

          {/* Stress-Testing Simulation Insights */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '6px', padding: '10px 14px', backgroundColor: '#FFFFFF', marginBottom: '14px' }}>
            <strong style={{ fontSize: '10px', color: '#0F172A', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              Stress-Testing & Life Event Simulation Insights
            </strong>
            <p style={{ fontSize: '9.5px', color: '#475569', margin: 0, lineHeight: '1.45' }}>
              {activeEventsCount > 0 ? (
                `Simulated ${activeEventsCount} active stress-test event(s). Under these shocks, capital runway sustains until Age ${stressDepletion || 'Life Expectancy'}. Insurance payouts and emergency liquidity act as first-line shock absorbers.`
              ) : (
                `Baseline longevity testing confirms solvency under ${profile.inflationRate}% annual inflation and ${profile.postRetireReturn}% post-retirement portfolio return. No immediate capital shortfall detected in baseline scenario.`
              )}
            </p>
          </div>

          {/* Consultative Discussion Points */}
          <div style={{ border: '1px solid #E0E7FF', backgroundColor: '#F5F7FF', borderRadius: '6px', padding: '10px 14px', marginBottom: '14px' }}>
            <strong style={{ fontSize: '10px', color: '#1E40AF', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              Consultative Discussion Points for Review
            </strong>
            <div style={{ fontSize: '9px', color: '#1E3A8A', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {(aiSummary?.discussionPoints && aiSummary.discussionPoints.length > 0) ? (
                aiSummary.discussionPoints.slice(0, 3).map((d, i) => <div key={i}>• {d}</div>)
              ) : (
                <>
                  <div>• Confirm preferred CPF LIFE plan type (Standard vs Escalating Plan for inflation defense).</div>
                  <div>• Review adequacy of Critical Illness waiting periods and definitions in current policies.</div>
                  <div>• Evaluate tax-sheltered contributions to Supplementary Retirement Scheme (SRS).</div>
                </>
              )}
            </div>
          </div>

          {/* Regulatory Notice */}
          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '8px', fontSize: '8px', color: '#94A3B8', lineHeight: '1.4' }}>
            <strong>Important Regulatory & Advisory Notice:</strong> This comprehensive financial plan is prepared for illustration and advisory review purposes based on information provided. Projections are mathematical simulations and not guarantees of future performance. Insurance recommendations are subject to underwriting approval and policy terms. Benchmark metrics conform to standard Singapore financial planning guidelines and CPF Board actuarial tables.
          </div>

          {/* Page 6 Footer */}
          <div style={footerStyle}>
            <span>Prepared for: {client?.fullName} • Prepared by: {consultantName}</span>
            <span>Page 6 of 6</span>
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="view-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '100%', paddingBottom: '40px' }}>
      
      {/* Top Header Bar */}
      <header className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            className="btn" 
            style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}
            onClick={onBack}
            title="Back to Client Profile"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 className="text-gradient" style={{ fontSize: '24px', margin: 0 }}>
                Financial Blueprint: {client?.fullName}
              </h1>
              <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                Age {profile.currentAge} • Target Retire {profile.targetRetirementAge}
              </span>
              <span style={{ 
                padding: '3px 10px', 
                borderRadius: '12px', 
                fontSize: '11px', 
                fontWeight: '600', 
                backgroundColor: !hasAnyData ? 'rgba(255,255,255,0.05)' : isRetirementOnTrack ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                color: !hasAnyData ? 'var(--text-muted)' : isRetirementOnTrack ? '#34d399' : '#f87171',
                border: `1px solid ${!hasAnyData ? 'rgba(255,255,255,0.1)' : isRetirementOnTrack ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}>
                {!hasAnyData ? '🆕 Blank Slate Blueprint' : isRetirementOnTrack ? '✓ Retirement Solvency: On Track' : `⚠️ Capital Depletes at Age ${baselineDepletion}`}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '4px 0 0 0' }}>
              Holistic wealth planning, retirement cashflow simulation, insurance gap analytics & live event stress testing.
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Live Auto-Save Status Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: '600',
            backgroundColor: autoSaveStatus === 'saving' ? 'rgba(234, 179, 8, 0.15)' : autoSaveStatus === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.12)',
            color: autoSaveStatus === 'saving' ? '#fbbf24' : autoSaveStatus === 'error' ? '#f87171' : '#34d399',
            border: `1px solid ${autoSaveStatus === 'saving' ? 'rgba(234, 179, 8, 0.3)' : autoSaveStatus === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.25)'}`
          }}
          title="Auto-saves modifications in real-time to persistent storage"
          >
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: autoSaveStatus === 'saving' ? '#fbbf24' : autoSaveStatus === 'error' ? '#f87171' : '#34d399',
              display: 'inline-block'
            }} />
            {autoSaveStatus === 'saving' ? 'Auto-saving...' : autoSaveStatus === 'error' ? 'Save Error' : 'Live Synced'}
          </div>

          <button
            className="btn"
            style={{ 
              backgroundColor: presentationMode ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.05)', 
              color: presentationMode ? '#c084fc' : 'var(--text-secondary)', 
              border: '1px solid var(--border-light)',
              display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px' 
            }}
            onClick={() => setPresentationMode(!presentationMode)}
            title="Toggle Clean Presentation View for Client Meetings"
          >
            <Eye size={14} /> {presentationMode ? 'Exit Presentation' : 'Presentation View'}
          </button>

          <button
            className="btn"
            style={{ 
              backgroundColor: 'rgba(168, 85, 247, 0.15)', 
              color: '#c084fc', 
              border: '1px solid rgba(168, 85, 247, 0.3)',
              display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px' 
            }}
            onClick={handleGenerateAiSummary}
            disabled={aiLoading}
          >
            <Sparkles size={14} style={{ animation: aiLoading ? 'spin 1s linear infinite' : 'none' }} />
            {aiLoading ? 'Synthesizing...' : '✨ AI Advisory Blueprint'}
          </button>

          <button
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 16px' }}
            onClick={handleSavePlan}
            disabled={isSaving}
          >
            {saveSuccess ? <CheckCircle2 size={14} /> : <Save size={14} />}
            {saveSuccess ? 'Plan Saved!' : isSaving ? 'Saving...' : 'Save Plan'}
          </button>
        </div>

        {/* Scenario Snapshots & Versioning Bar */}
        <div style={{
          width: '100%',
          padding: '10px 14px',
          backgroundColor: 'rgba(0,0,0,0.25)',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          marginTop: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Bookmark size={13} color="#60a5fa" />
              <span>Scenarios:</span>
            </div>
            
            {/* Base Scenario Button */}
            <button
              type="button"
              onClick={() => handleSelectSnapshot('base')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: activeSnapshotId === 'base' ? '700' : '500',
                backgroundColor: activeSnapshotId === 'base' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.04)',
                color: activeSnapshotId === 'base' ? '#60a5fa' : 'var(--text-secondary)',
                border: activeSnapshotId === 'base' ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              📌 Base Plan
            </button>

            {/* Custom Snapshots */}
            {snapshots.map(snap => (
              <div
                key={snap.id}
                onClick={() => handleSelectSnapshot(snap.id)}
                style={{
                  padding: '4px 8px 4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: activeSnapshotId === snap.id ? '700' : '500',
                  backgroundColor: activeSnapshotId === snap.id ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255,255,255,0.04)',
                  color: activeSnapshotId === snap.id ? '#c084fc' : 'var(--text-secondary)',
                  border: activeSnapshotId === snap.id ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title={`Created: ${new Date(snap.createdAt).toLocaleString()}`}
              >
                <span>📑 {snap.name}</span>
                <button
                  type="button"
                  onClick={(e) => handleDeleteSnapshot(snap.id, e)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    padding: '0 2px'
                  }}
                  title="Delete scenario snapshot"
                >
                  ✕
                </button>
              </div>
            ))}

            {/* Create Snapshot Inline */}
            {isCreatingSnapshot ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Scenario Name (e.g. Retire @ 58)"
                  value={newSnapshotName}
                  onChange={(e) => setNewSnapshotName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateSnapshot(newSnapshotName);
                    if (e.key === 'Escape') setIsCreatingSnapshot(false);
                  }}
                  autoFocus
                  className="input-field"
                  style={{ padding: '3px 8px', fontSize: '11px', width: '180px' }}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleCreateSnapshot(newSnapshotName)}
                  style={{ padding: '3px 8px', fontSize: '11px' }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingSnapshot(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreatingSnapshot(true)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  color: '#60a5fa',
                  border: '1px dashed rgba(59, 130, 246, 0.35)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Plus size={12} /> Snapshot Current State
              </button>
            )}
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {snapshots.length > 0 ? `${snapshots.length} saved snapshot(s)` : 'Save alternative assumptions for side-by-side client reviews'}
          </div>
        </div>
      </header>

      {/* KPI Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estimated Net Worth</span>
          <span style={{ fontSize: '22px', fontWeight: '700', color: totalNetWorth >= 0 ? '#34d399' : '#f87171' }}>
            {formatCurrency(totalNetWorth)}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Assets: {formatCurrency(totalAssets)} • Debt: {formatCurrency(totalLiabilities)}
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly Net Savings</span>
          <span style={{ fontSize: '22px', fontWeight: '700', color: monthlySurplus >= 0 ? '#60a5fa' : '#f87171' }}>
            {formatCurrency(monthlySurplus)} <span style={{ fontSize: '13px', fontWeight: 'normal', color: 'var(--text-muted)' }}>/mo</span>
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Savings Rate: <strong>{savingsRate}%</strong> ({formatCurrency(annualSavings)}/yr)
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Peak Retirement Nest Egg</span>
          <span style={{ fontSize: '22px', fontWeight: '700', color: '#818cf8' }}>
            {formatCurrency(retirementNestEggAtRetire)}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Target Age {profile.targetRetirementAge} • Desired: {formatCurrency(retirementTarget.desiredMonthlyIncome)}/mo
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Protection Health Score</span>
          <span style={{ fontSize: '22px', fontWeight: '700', color: protectionScore >= 75 ? '#34d399' : protectionScore >= 50 ? '#fbbf24' : '#f87171' }}>
            {protectionScore} <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 'normal' }}>/ 100</span>
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {policies.length} In-Force Policies • Shield: {inForceCoverage.hasShield ? '✓ Covered' : '⚠️ Missing'}
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar (Sticky with high z-index to prevent coverage) */}
      <div className="nav-tabs-bar" style={{ 
        position: 'sticky', 
        top: '0px', 
        zIndex: 100, 
        backgroundColor: 'rgba(15, 23, 42, 0.98)', 
        backdropFilter: 'blur(20px)', 
        padding: '12px 14px', 
        borderRadius: '12px', 
        border: '1px solid var(--border-light)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        display: 'flex', 
        gap: '8px', 
        overflowX: 'auto',
        flexShrink: 0
      }}>
        {[
          { id: 'overview', label: '📊 Financial Snapshot & Net Worth' },
          { id: 'retirement', label: '🏖️ Retirement Runway & Wealth Goals' },
          { id: 'protection', label: '🛡️ Insurance Gap Matrix' },
          { id: 'simulator', label: `⚡ 'What-If' Stress Testing ${activeEventsCount > 0 ? `(${activeEventsCount} Active)` : ''}` },
          { id: 'ai-advisor', label: '🤖 AI Advisory Action Plan' },
          { id: 'report-preview', label: '📑 Live Report Preview (6-Page A4)' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? '600' : '500',
              backgroundColor: activeTab === tab.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.03)',
              color: activeTab === tab.id ? '#60a5fa' : 'var(--text-secondary)',
              border: activeTab === tab.id ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: FINANCIAL SNAPSHOT & BALANCE SHEET */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          {/* Cash Flow Panel */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '17px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <DollarSign size={18} color="var(--accent-primary)" />
              Monthly Cash Flow & Savings Capacity
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Monthly Earned Income ($)</label>
                <input
                  type="number"
                  placeholder="0"
                  className="input-field"
                  value={cashflow.monthlyEarnedIncome}
                  onChange={(e) => setCashflow({ ...cashflow, monthlyEarnedIncome: e.target.value === '' ? '' : Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Monthly Passive / Rental Income ($)</label>
                <input
                  type="number"
                  placeholder="0"
                  className="input-field"
                  value={cashflow.monthlyPassiveIncome}
                  onChange={(e) => setCashflow({ ...cashflow, monthlyPassiveIncome: e.target.value === '' ? '' : Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Monthly Living & Family Expenses ($)</label>
                <input
                  type="number"
                  placeholder="0"
                  className="input-field"
                  value={cashflow.monthlyLivingExpenses}
                  onChange={(e) => setCashflow({ ...cashflow, monthlyLivingExpenses: e.target.value === '' ? '' : Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Mortgage & Fixed Commitments ($)</label>
                <input
                  type="number"
                  placeholder="0"
                  className="input-field"
                  value={cashflow.monthlyCommitments}
                  onChange={(e) => setCashflow({ ...cashflow, monthlyCommitments: e.target.value === '' ? '' : Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>
            </div>

            {/* Cash Flow Summary Box */}
            <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-light)', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Monthly Inflow:</span>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{formatCurrency(totalMonthlyInflow)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Monthly Outflow:</span>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{formatCurrency(totalMonthlyOutflow)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: '#60a5fa', fontWeight: '600' }}>Monthly Surplus Capacity:</span>
                <span style={{ fontWeight: '700', color: monthlySurplus >= 0 ? '#34d399' : '#f87171' }}>
                  {formatCurrency(monthlySurplus)} ({savingsRate}% Savings Rate)
                </span>
              </div>
            </div>
          </div>

          {/* Balance Sheet & Net Worth Panel */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '17px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <TrendingUp size={18} color="var(--accent-secondary)" />
                Assets, Liabilities & Net Worth Breakdown
              </h2>
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontWeight: '600' }}>
                Net Worth: {formatCurrency(totalNetWorth)}
              </span>
            </div>

            {/* Liquid & Invested Assets */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Liquid Cash & Emergency Fund ($)</label>
                <input
                  type="number"
                  placeholder="0"
                  className="input-field"
                  value={balanceSheet.liquidCash}
                  onChange={(e) => setBalanceSheet({ ...balanceSheet, liquidCash: e.target.value === '' ? '' : Number(e.target.value) })}
                  style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }}
                />
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                  Coverage: {liquidEmergencyMonths} months of living
                </span>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Investments & Portfolios ($)</label>
                <input
                  type="number"
                  placeholder="0"
                  className="input-field"
                  value={balanceSheet.investedAssets}
                  onChange={(e) => setBalanceSheet({ ...balanceSheet, investedAssets: e.target.value === '' ? '' : Number(e.target.value) })}
                  style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }}
                />
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                  Equities, unit trusts, ETFs & bonds
                </span>
              </div>
            </div>

            {/* Singapore CPF & SRS Detailed Breakdown Sub-Card */}
            <div style={{ padding: '14px', backgroundColor: 'rgba(99, 102, 241, 0.05)', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🇸🇬 Singapore CPF & SRS Retirement Accounts
                </span>
                <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: '600' }}>
                  Total: {formatCurrency(totalPension)}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>CPF Ordinary Account (OA)</span>
                    <span style={{ color: '#60a5fa', fontWeight: '600' }}>2.5% p.a.</span>
                  </div>
                  <input
                    type="number"
                    placeholder="0"
                    className="input-field"
                    value={balanceSheet.cpfOA}
                    onChange={(e) => setBalanceSheet({ ...balanceSheet, cpfOA: e.target.value === '' ? '' : Number(e.target.value) })}
                    style={{ width: '100%', padding: '5px 8px', fontSize: '12px' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>CPF Special Account (SA)</span>
                    <span style={{ color: '#34d399', fontWeight: '600' }}>4.0% - 5.0%</span>
                  </div>
                  <input
                    type="number"
                    placeholder="0"
                    className="input-field"
                    value={balanceSheet.cpfSA}
                    onChange={(e) => setBalanceSheet({ ...balanceSheet, cpfSA: e.target.value === '' ? '' : Number(e.target.value) })}
                    style={{ width: '100%', padding: '5px 8px', fontSize: '12px' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>CPF Retirement Account (RA)</span>
                    <span style={{ color: '#c084fc', fontWeight: '600' }}>4.0% - 6.0%</span>
                  </div>
                  <input
                    type="number"
                    placeholder="0"
                    className="input-field"
                    value={balanceSheet.cpfRA}
                    onChange={(e) => setBalanceSheet({ ...balanceSheet, cpfRA: e.target.value === '' ? '' : Number(e.target.value) })}
                    style={{ width: '100%', padding: '5px 8px', fontSize: '12px' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>CPF MediSave Account (MA)</span>
                    <span style={{ color: '#34d399', fontWeight: '600' }}>4.0% p.a.</span>
                  </div>
                  <input
                    type="number"
                    placeholder="0"
                    className="input-field"
                    value={balanceSheet.cpfMA}
                    onChange={(e) => setBalanceSheet({ ...balanceSheet, cpfMA: e.target.value === '' ? '' : Number(e.target.value) })}
                    style={{ width: '100%', padding: '5px 8px', fontSize: '12px' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Supplementary Retirement Scheme (SRS)</span>
                    <span style={{ color: '#fbbf24', fontWeight: '600' }}>Tax-Deferred Voluntary Account</span>
                  </div>
                  <input
                    type="number"
                    placeholder="0"
                    className="input-field"
                    value={balanceSheet.srs}
                    onChange={(e) => setBalanceSheet({ ...balanceSheet, srs: e.target.value === '' ? '' : Number(e.target.value) })}
                    style={{ width: '100%', padding: '5px 8px', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px dashed rgba(255,255,255,0.06)' }}>
                <span>Combined CPF: {formatCurrency(totalCpf)}</span>
                <span>SRS Balance: {formatCurrency(totalSrs)}</span>
              </div>
            </div>

            {/* Property & Liabilities */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Real Estate / Property Value ($)</label>
                <input
                  type="number"
                  placeholder="0"
                  className="input-field"
                  value={balanceSheet.propertyValue}
                  onChange={(e) => setBalanceSheet({ ...balanceSheet, propertyValue: e.target.value === '' ? '' : Number(e.target.value) })}
                  style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Outstanding Home Mortgage ($)</label>
                <input
                  type="number"
                  placeholder="0"
                  className="input-field"
                  value={balanceSheet.outstandingMortgage}
                  onChange={(e) => setBalanceSheet({ ...balanceSheet, outstandingMortgage: e.target.value === '' ? '' : Number(e.target.value) })}
                  style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Other Personal Loans / Debt ($)</label>
                <input
                  type="number"
                  placeholder="0"
                  className="input-field"
                  value={balanceSheet.otherLiabilities}
                  onChange={(e) => setBalanceSheet({ ...balanceSheet, otherLiabilities: e.target.value === '' ? '' : Number(e.target.value) })}
                  style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }}
                />
              </div>
            </div>

            {/* Net Worth Summary Pill */}
            <div style={{ padding: '14px', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Net Estate Value</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#34d399' }}>{formatCurrency(totalNetWorth)}</div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'right' }}>
                Financial Assets: {formatCurrency(totalFinancialAssets)}<br />
                Property Equity: {formatCurrency(Math.max(0, totalProperty - totalMortgage))}
              </div>
            </div>
          </div>

          {/* Step Navigation Footer */}
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
            <button
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '13px' }}
              onClick={() => {
                setActiveTab('retirement');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Next Step: 🏖️ Retirement Runway & Wealth Goals <ChevronRight size={16} />
            </button>
          </div>

        </div>
      )}

      {/* TAB 2: RETIREMENT RUNWAY & WEALTH GOALS */}
      {activeTab === 'retirement' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Retirement Parameters Sliders */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Sliders size={18} color="var(--accent-primary)" />
              Retirement Planning Assumptions & Longevity Engine
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Target Retirement Age</span>
                  <span style={{ fontWeight: '700', color: '#60a5fa' }}>Age {profile.targetRetirementAge}</span>
                </div>
                <input
                  type="range"
                  min={Number(profile.currentAge) + 1}
                  max="75"
                  value={Number(profile.targetRetirementAge) || 65}
                  onChange={(e) => setProfile({ ...profile, targetRetirementAge: Number(e.target.value) })}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Desired Monthly Income (Today's $)</span>
                  <span style={{ fontWeight: '700', color: '#34d399' }}>{formatCurrency(retirementTarget.desiredMonthlyIncome)}/mo</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20000"
                  step="100"
                  value={Number(retirementTarget.desiredMonthlyIncome) || 0}
                  onChange={(e) => setRetirementTarget({ ...retirementTarget, desiredMonthlyIncome: Number(e.target.value) })}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Expected CPF Life / Pension</span>
                  <span style={{ fontWeight: '700', color: '#818cf8' }}>{formatCurrency(retirementTarget.expectedAnnuityPensions)}/mo</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8000"
                  step="100"
                  value={Number(retirementTarget.expectedAnnuityPensions) || 0}
                  onChange={(e) => setRetirementTarget({ ...retirementTarget, expectedAnnuityPensions: Number(e.target.value) })}
                  style={{ width: '100%', cursor: 'pointer' }}
                />

                {/* CPF Life Strategy Guide & Playbook Button */}
                <div style={{
                  marginTop: '10px',
                  padding: '8px 10px',
                  backgroundColor: 'rgba(59, 130, 246, 0.06)',
                  borderRadius: '8px',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <BookOpen size={13} color="#60a5fa" />
                    <span>CPF LIFE Strategy Guide</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCpfModalOpen(true)}
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      backgroundColor: 'rgba(59, 130, 246, 0.18)',
                      color: '#60a5fa',
                      border: '1px solid rgba(59, 130, 246, 0.35)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: '600'
                    }}
                  >
                    📘 Open Playbook
                  </button>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Inflation Assumption</span>
                  <span style={{ fontWeight: '700', color: '#fbbf24' }}>{profile.inflationRate}% p.a.</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="6.0"
                  step="0.1"
                  value={Number(profile.inflationRate) || 3.0}
                  onChange={(e) => setProfile({ ...profile, inflationRate: Number(e.target.value) })}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Pre-Retirement Yield</span>
                  <span style={{ fontWeight: '700', color: '#34d399' }}>{profile.preRetireReturn}% p.a.</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="12.0"
                  step="0.5"
                  value={Number(profile.preRetireReturn) || 6.0}
                  onChange={(e) => setProfile({ ...profile, preRetireReturn: Number(e.target.value) })}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Post-Retirement Yield</span>
                  <span style={{ fontWeight: '700', color: '#60a5fa' }}>{profile.postRetireReturn}% p.a.</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="8.0"
                  step="0.5"
                  value={Number(profile.postRetireReturn) || 4.0}
                  onChange={(e) => setProfile({ ...profile, postRetireReturn: Number(e.target.value) })}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>

          {/* Interactive Lifetime Chart */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <TrendingUp size={18} color="#10b981" />
                Capital Accumulation & Decumulation Runway (Age {profile.currentAge} → {profile.lifeExpectancy})
              </h2>
            </div>

            {renderRetirementChart()}
          </div>

          {/* Wealth Goals Milestone Manager */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <GraduationCap size={18} color="#ec4899" />
                Life Milestone Goals & Target Accumulation ({goals.length})
              </h2>
              <button className="btn" style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', border: '1px solid rgba(236, 72, 153, 0.3)' }} onClick={handleAddGoal}>
                <Plus size={14} /> Add Milestone Goal
              </button>
            </div>

            {goals.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: '10px', border: '1px dashed var(--border-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <GraduationCap size={32} color="var(--border-light)" />
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No milestone goals defined yet.</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '400px' }}>
                  Add milestone goals such as children's university funds, property downpayment, or sabbatical savings to calculate target accumulation runways.
                </div>
                <button className="btn" style={{ fontSize: '12px', padding: '6px 14px', backgroundColor: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', border: '1px solid rgba(236, 72, 153, 0.3)', marginTop: '4px' }} onClick={handleAddGoal}>
                  <Plus size={14} /> Add First Milestone Goal
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {goals.map(g => {
                  const yearsToGoal = Math.max(1, (Number(g.targetAge) || profile.targetRetirementAge) - (Number(profile.currentAge) || 30));
                  const projectedAtGoal = (Number(g.currentAllocated) || 0) + ((Number(g.monthlyContribution) || 0) * 12 * yearsToGoal);
                  const shortfall = Math.max(0, (Number(g.targetAmount) || 0) - projectedAtGoal);
                  return (
                    <div key={g.id} style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={g.title}
                          onChange={(e) => setGoals(goals.map(item => item.id === g.id ? { ...item, title: e.target.value } : item))}
                          placeholder="Goal Title (e.g. University Fund)"
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: '600', fontSize: '14px', outline: 'none', width: '80%' }}
                        />
                        <button onClick={() => handleDeleteGoal(g.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Target Age:</span>
                          <input
                            type="number"
                            placeholder="e.g. 50"
                            value={g.targetAge}
                            onChange={(e) => setGoals(goals.map(item => item.id === g.id ? { ...item, targetAge: e.target.value === '' ? '' : Number(e.target.value) } : item))}
                            className="input-field"
                            style={{ width: '100%', padding: '4px 8px', fontSize: '12px', marginTop: '2px' }}
                          />
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Target Amount ($):</span>
                          <input
                            type="number"
                            placeholder="0"
                            value={g.targetAmount}
                            onChange={(e) => setGoals(goals.map(item => item.id === g.id ? { ...item, targetAmount: e.target.value === '' ? '' : Number(e.target.value) } : item))}
                            className="input-field"
                            style={{ width: '100%', padding: '4px 8px', fontSize: '12px', marginTop: '2px' }}
                          />
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Current Allocated ($):</span>
                          <input
                            type="number"
                            placeholder="0"
                            value={g.currentAllocated}
                            onChange={(e) => setGoals(goals.map(item => item.id === g.id ? { ...item, currentAllocated: e.target.value === '' ? '' : Number(e.target.value) } : item))}
                            className="input-field"
                            style={{ width: '100%', padding: '4px 8px', fontSize: '12px', marginTop: '2px' }}
                          />
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Monthly Savings ($/mo):</span>
                          <input
                            type="number"
                            placeholder="0"
                            value={g.monthlyContribution}
                            onChange={(e) => setGoals(goals.map(item => item.id === g.id ? { ...item, monthlyContribution: e.target.value === '' ? '' : Number(e.target.value) } : item))}
                            className="input-field"
                            style={{ width: '100%', padding: '4px 8px', fontSize: '12px', marginTop: '2px' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                        <span>Projected: {formatCurrency(projectedAtGoal)}</span>
                        <span style={{ color: shortfall > 0 ? '#f87171' : '#34d399', fontWeight: '600' }}>
                          {shortfall > 0 ? `Gap: ${formatCurrency(shortfall)}` : (Number(g.targetAmount) > 0 ? '✓ Fully Funded' : 'Pending Target')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step Navigation Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', flexWrap: 'wrap', gap: '12px' }}>
            <button
              className="btn"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' }}
              onClick={() => {
                setActiveTab('overview');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <ArrowLeft size={16} /> Back: 📊 Financial Snapshot
            </button>
            <button
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '13px' }}
              onClick={() => {
                setActiveTab('protection');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Next Step: 🛡️ Insurance Protection Gap <ChevronRight size={16} />
            </button>
          </div>

        </div>
      )}

      {/* TAB 3: INSURANCE GAP MATRIX */}
      {activeTab === 'protection' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Shield size={18} color="var(--accent-primary)" />
                  Comprehensive Protection Matrix & Risk Gap Heatmap
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Auto-aggregated from {policies.length} in-force policies in the CRM vs standard advisory protection benchmarks.
                </p>
              </div>
            </div>

            {/* Gap Heatmap Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              
              {/* Death / Life */}
              <div style={{ padding: '18px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>🕊️ Death & Estate Protection</span>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', backgroundColor: (inForceCoverage.death >= recommendedDeath && (inForceCoverage.death > 0 || recommendedDeath === 0)) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: (inForceCoverage.death >= recommendedDeath && (inForceCoverage.death > 0 || recommendedDeath === 0)) ? '#34d399' : '#f87171' }}>
                    {recommendedDeath === 0 && inForceCoverage.death === 0 ? 'Pending Data' : inForceCoverage.death >= recommendedDeath ? 'Adequate' : 'Shortfall'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>In-Force Coverage:</span>
                  <span style={{ fontWeight: '600', color: '#60a5fa' }}>{formatCurrency(inForceCoverage.death)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Recommended (10x + Debt):</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(recommendedDeath)}</span>
                </div>
                <div style={{ fontSize: '11px', color: (inForceCoverage.death >= recommendedDeath && (inForceCoverage.death > 0 || recommendedDeath === 0)) ? '#34d399' : '#f87171', borderTop: '1px dashed var(--border-light)', paddingTop: '8px' }}>
                  {recommendedDeath === 0 && inForceCoverage.death === 0
                    ? 'Enter earned income in Financial Snapshot to calculate protection benchmarks.'
                    : inForceCoverage.death < recommendedDeath 
                      ? `⚠️ Protection Gap of ${formatCurrency(recommendedDeath - inForceCoverage.death)} to clear liabilities & protect dependents.`
                      : '✓ Family debt protection is fully secured.'}
                </div>
              </div>

              {/* Total & Permanent Disability (TPD) */}
              <div style={{ padding: '18px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>♿ Total Permanent Disability (TPD)</span>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', backgroundColor: (inForceCoverage.tpd >= recommendedTpd && (inForceCoverage.tpd > 0 || recommendedTpd === 0)) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: (inForceCoverage.tpd >= recommendedTpd && (inForceCoverage.tpd > 0 || recommendedTpd === 0)) ? '#34d399' : '#f87171' }}>
                    {recommendedTpd === 0 && inForceCoverage.tpd === 0 ? 'Pending Data' : inForceCoverage.tpd >= recommendedTpd ? 'Adequate' : 'Shortfall'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>In-Force Coverage:</span>
                  <span style={{ fontWeight: '600', color: '#60a5fa' }}>{formatCurrency(inForceCoverage.tpd)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Recommended Need:</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(recommendedTpd)}</span>
                </div>
                <div style={{ fontSize: '11px', color: (inForceCoverage.tpd >= recommendedTpd && (inForceCoverage.tpd > 0 || recommendedTpd === 0)) ? '#34d399' : '#f87171', borderTop: '1px dashed var(--border-light)', paddingTop: '8px' }}>
                  {recommendedTpd === 0 && inForceCoverage.tpd === 0
                    ? 'Enter earned income in Financial Snapshot to calculate protection benchmarks.'
                    : inForceCoverage.tpd < recommendedTpd 
                      ? `⚠️ TPD Shortfall of ${formatCurrency(recommendedTpd - inForceCoverage.tpd)}.`
                      : '✓ Long-term disability payout is fully buffered.'}
                </div>
              </div>

              {/* Early Critical Illness */}
              <div style={{ padding: '18px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>🩺 Early Critical Illness</span>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', backgroundColor: (inForceCoverage.earlyCi >= recommendedEarlyCi && (inForceCoverage.earlyCi > 0 || recommendedEarlyCi === 0)) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: (inForceCoverage.earlyCi >= recommendedEarlyCi && (inForceCoverage.earlyCi > 0 || recommendedEarlyCi === 0)) ? '#34d399' : '#f87171' }}>
                    {recommendedEarlyCi === 0 && inForceCoverage.earlyCi === 0 ? 'Pending Data' : inForceCoverage.earlyCi >= recommendedEarlyCi ? 'Adequate' : 'Shortfall'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>In-Force Coverage:</span>
                  <span style={{ fontWeight: '600', color: '#60a5fa' }}>{formatCurrency(inForceCoverage.earlyCi)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Recommended (2x Annual):</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(recommendedEarlyCi)}</span>
                </div>
                <div style={{ fontSize: '11px', color: (inForceCoverage.earlyCi >= recommendedEarlyCi && (inForceCoverage.earlyCi > 0 || recommendedEarlyCi === 0)) ? '#34d399' : '#f87171', borderTop: '1px dashed var(--border-light)', paddingTop: '8px' }}>
                  {recommendedEarlyCi === 0 && inForceCoverage.earlyCi === 0
                    ? 'Enter earned income in Financial Snapshot to calculate protection benchmarks.'
                    : inForceCoverage.earlyCi < recommendedEarlyCi 
                      ? `⚠️ Shortfall of ${formatCurrency(recommendedEarlyCi - inForceCoverage.earlyCi)} for immediate early detection claims.`
                      : '✓ Early stage medical detection covered.'}
                </div>
              </div>

              {/* Major Critical Illness */}
              <div style={{ padding: '18px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>❤️ Major Critical Illness</span>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', backgroundColor: (inForceCoverage.majorCi >= recommendedMajorCi && (inForceCoverage.majorCi > 0 || recommendedMajorCi === 0)) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: (inForceCoverage.majorCi >= recommendedMajorCi && (inForceCoverage.majorCi > 0 || recommendedMajorCi === 0)) ? '#34d399' : '#f87171' }}>
                    {recommendedMajorCi === 0 && inForceCoverage.majorCi === 0 ? 'Pending Data' : inForceCoverage.majorCi >= recommendedMajorCi ? 'Adequate' : 'Critical Gap'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>In-Force Coverage:</span>
                  <span style={{ fontWeight: '600', color: '#60a5fa' }}>{formatCurrency(inForceCoverage.majorCi)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Recommended (4x Annual):</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(recommendedMajorCi)}</span>
                </div>
                <div style={{ fontSize: '11px', color: (inForceCoverage.majorCi >= recommendedMajorCi && (inForceCoverage.majorCi > 0 || recommendedMajorCi === 0)) ? '#34d399' : '#f87171', borderTop: '1px dashed var(--border-light)', paddingTop: '8px' }}>
                  {recommendedMajorCi === 0 && inForceCoverage.majorCi === 0
                    ? 'Enter earned income in Financial Snapshot to calculate protection benchmarks.'
                    : inForceCoverage.majorCi < recommendedMajorCi 
                      ? `⚠️ High priority: ${formatCurrency(recommendedMajorCi - inForceCoverage.majorCi)} needed to prevent retirement nest egg liquidation.`
                      : '✓ Comprehensive CI buffer in place.'}
                </div>
              </div>

              {/* Hospital Shield */}
              <div style={{ padding: '18px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>🏥 Hospitalization Shield</span>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', backgroundColor: inForceCoverage.hasShield ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: inForceCoverage.hasShield ? '#34d399' : '#f87171' }}>
                    {inForceCoverage.hasShield ? 'Active' : 'Missing'}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Status: <strong style={{ color: inForceCoverage.hasShield ? '#34d399' : '#f87171' }}>{inForceCoverage.hasShield ? 'In-Force Integrated Shield Plan' : 'No Shield Policy on Record'}</strong>
                </div>
                <div style={{ fontSize: '11px', color: inForceCoverage.hasShield ? '#34d399' : '#f87171', borderTop: '1px dashed var(--border-light)', paddingTop: '8px' }}>
                  {inForceCoverage.hasShield 
                    ? '✓ Hospital & surgical bills cushioned with private ward rider.'
                    : '⚠️ Urgent: High exposure to hospital and surgical inflation.'}
                </div>
              </div>

              {/* Disability Income */}
              <div style={{ padding: '18px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>💼 Disability Income Replacement</span>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', backgroundColor: (inForceCoverage.disabilityIncome >= recommendedDisability && (inForceCoverage.disabilityIncome > 0 || recommendedDisability === 0)) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: (inForceCoverage.disabilityIncome >= recommendedDisability && (inForceCoverage.disabilityIncome > 0 || recommendedDisability === 0)) ? '#34d399' : '#f87171' }}>
                    {recommendedDisability === 0 && inForceCoverage.disabilityIncome === 0 ? 'Pending Data' : inForceCoverage.disabilityIncome >= recommendedDisability ? 'Adequate' : 'Shortfall'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>In-Force Benefit:</span>
                  <span style={{ fontWeight: '600', color: '#60a5fa' }}>{formatCurrency(inForceCoverage.disabilityIncome)}/mo</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Recommended (75% Salary):</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(recommendedDisability)}/mo</span>
                </div>
                <div style={{ fontSize: '11px', color: (inForceCoverage.disabilityIncome >= recommendedDisability && (inForceCoverage.disabilityIncome > 0 || recommendedDisability === 0)) ? '#34d399' : '#f87171', borderTop: '1px dashed var(--border-light)', paddingTop: '8px' }}>
                  {recommendedDisability === 0 && inForceCoverage.disabilityIncome === 0
                    ? 'Enter earned income in Financial Snapshot to calculate protection benchmarks.'
                    : inForceCoverage.disabilityIncome < recommendedDisability 
                      ? `⚠️ Gap of ${formatCurrency(recommendedDisability - inForceCoverage.disabilityIncome)}/mo during inability to perform current occupation.`
                      : '✓ Monthly salary stream replacement active.'}
                </div>
              </div>

            </div>
          </div>

          {/* Children & Dependents Protection Schedule */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Baby size={18} color="#c084fc" />
                  Children & Dependents In-Force Protection Schedule
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Audited separately from personal income-replacement benchmarks. Client ({client?.fullName}) is Policy Owner & Payor.
                </p>
              </div>
              <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', backgroundColor: dependentsPolicies.length > 0 ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.06)', color: dependentsPolicies.length > 0 ? '#c084fc' : 'var(--text-muted)', fontWeight: '600' }}>
                {dependentsPolicies.length} Active Dependent {dependentsPolicies.length === 1 ? 'Policy' : 'Policies'}
              </span>
            </div>

            {dependentsCoverageList.length === 0 ? (
              <div style={{ padding: '28px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px dashed var(--border-light)' }}>
                <Baby size={32} color="var(--border-light)" style={{ marginBottom: '10px' }} />
                <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  No dependent policies attached
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto' }}>
                  When insurance policies are created with Life Insured set to <em>"Dependent"</em> in the Client Profile, their independent coverage schedule and policy details will be cataloged here without distorting your personal income replacement benchmarks.
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
                {dependentsCoverageList.map(dep => {
                  const age = calculateAge(dep.dob);
                  return (
                    <div
                      key={dep.id || dep.name}
                      style={{
                        padding: '18px',
                        backgroundColor: 'rgba(255,255,255,0.02)',
                        borderRadius: '12px',
                        border: '1px solid rgba(168, 85, 247, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
                            <Baby size={18} />
                          </div>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                              {dep.name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              <span style={{ color: '#c084fc', fontWeight: '500' }}>{dep.relationship}</span>
                              {age !== null && <span> • Age {age}</span>}
                              {dep.gender && <span> • {dep.gender}</span>}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Total Outlay</span>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#c084fc' }}>
                            {formatCurrency(dep.annualPremium)}/yr
                          </span>
                        </div>
                      </div>

                      {/* Coverages Breakdown */}
                      <div style={{ padding: '10px 12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Active In-Force Benefits</div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Hospitalization / Shield:</span>
                          <strong style={{ color: dep.hasShield ? '#34d399' : 'var(--text-muted)' }}>
                            {dep.hasShield ? '✓ In-Force Shield Active' : 'No Shield'}
                          </strong>
                        </div>
                        
                        {dep.death > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Life / Death Benefit:</span>
                            <strong style={{ color: '#60a5fa' }}>{formatCurrency(dep.death)}</strong>
                          </div>
                        )}

                        {(dep.earlyCi > 0 || dep.majorCi > 0) && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Critical Illness Cover:</span>
                            <strong style={{ color: '#ec4899' }}>
                              {dep.majorCi > 0 ? formatCurrency(dep.majorCi) : formatCurrency(dep.earlyCi)}
                              {dep.earlyCi > 0 && dep.majorCi > 0 ? ` (Early: ${formatCurrency(dep.earlyCi)})` : ''}
                            </strong>
                          </div>
                        )}

                        {dep.tpd > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Disability / TPD:</span>
                            <strong style={{ color: '#a78bfa' }}>{formatCurrency(dep.tpd)}</strong>
                          </div>
                        )}
                      </div>

                      {/* Policy Badges */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: '600' }}>Linked Policies ({dep.policies.length}):</div>
                        {dep.policies.map(p => (
                          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                            <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{p.policyName || p.policyType} ({p.provider})</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(p.premiumAmount)}/{p.premiumFrequency || 'yr'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step Navigation Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', flexWrap: 'wrap', gap: '12px' }}>
            <button
              className="btn"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' }}
              onClick={() => {
                setActiveTab('retirement');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <ArrowLeft size={16} /> Back: 🏖️ Retirement Runway
            </button>
            <button
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '13px' }}
              onClick={() => {
                setActiveTab('simulator');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Next Step: ⚡ 'What-If' Stress Testing <ChevronRight size={16} />
            </button>
          </div>

        </div>
      )}

      {/* TAB 4: 'WHAT-IF' LIFE EVENT STRESS TESTING */}
      {activeTab === 'simulator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Zap size={18} color="#fbbf24" />
                  Dynamic "What-If" Life Event Simulator
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Toggle presets to stress-test how major life events (property upgrade, critical illness, market shock) alter the lifetime retirement runway.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span>Active Simulations:</span>
                <span style={{ padding: '2px 8px', borderRadius: '10px', backgroundColor: activeEventsCount > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.05)', color: activeEventsCount > 0 ? '#fbbf24' : 'var(--text-muted)', fontWeight: '600' }}>
                  {activeEventsCount} Selected
                </span>
              </div>
            </div>

            {/* Overlaid Chart Comparison */}
            {renderRetirementChart()}

            {/* Event Preset Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px', marginTop: '8px' }}>
              {lifeEvents.map(evt => (
                <div
                  key={evt.id}
                  style={{
                    padding: '18px',
                    borderRadius: '12px',
                    backgroundColor: evt.active ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255,255,255,0.02)',
                    border: evt.active ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', margin: 0 }}>{evt.title}</h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>{evt.description}</p>
                    </div>
                    <button
                      onClick={() => toggleLifeEvent(evt.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: evt.active ? '#f59e0b' : 'rgba(255,255,255,0.05)',
                        color: evt.active ? '#000' : 'var(--text-secondary)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {evt.active ? '✓ Simulated' : '+ Test Event'}
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Occurrence Age:</span>
                      <input
                        type="number"
                        min={profile.currentAge}
                        max={profile.targetRetirementAge}
                        value={evt.triggerAge}
                        onChange={(e) => updateLifeEventAge(evt.id, e.target.value)}
                        className="input-field"
                        style={{ width: '100%', padding: '4px 8px', fontSize: '12px', marginTop: '2px' }}
                      />
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Duration:</span>
                      <span style={{ display: 'block', padding: '5px 0', fontWeight: '500', color: 'var(--text-primary)' }}>
                        {evt.durationYears} {evt.durationYears === 1 ? 'Year' : 'Years'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Lump Sum Outlay ($):</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={evt.lumpSumCost || ''}
                        onChange={(e) => updateLifeEventField(evt.id, 'lumpSumCost', e.target.value === '' ? 0 : Number(e.target.value))}
                        className="input-field"
                        style={{ width: '100%', padding: '4px 8px', fontSize: '12px', marginTop: '2px' }}
                      />
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Monthly Impact ($/mo):</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={evt.monthlyDelta || ''}
                        onChange={(e) => updateLifeEventField(evt.id, 'monthlyDelta', e.target.value === '' ? 0 : Number(e.target.value))}
                        className="input-field"
                        style={{ width: '100%', padding: '4px 8px', fontSize: '12px', marginTop: '2px' }}
                      />
                    </div>
                  </div>

                  {evt.type === 'critical_illness' && inForceCoverage.majorCi > 0 && (
                    <div style={{ padding: '8px 10px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={12} />
                      In-force CI Insurance offsets loss: {formatCurrency(inForceCoverage.majorCi)} buffer protects retirement.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Navigation Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', flexWrap: 'wrap', gap: '12px' }}>
            <button
              className="btn"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' }}
              onClick={() => {
                setActiveTab('protection');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <ArrowLeft size={16} /> Back: 🛡️ Insurance Matrix
            </button>
            <button
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '13px', backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)' }}
              onClick={() => {
                setActiveTab('ai-advisor');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Next Step: 🤖 AI Advisor Action Plan <ChevronRight size={16} />
            </button>
          </div>

        </div>
      )}

      {/* TAB 5: CFP® / ChFC® / CFA® COMPREHENSIVE FINANCIAL PLANNING BLUEPRINT & DOSSIER */}
      {activeTab === 'ai-advisor' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* PDF Export Notification Toast */}
          {pdfSuccessToast && (
            <div style={{
              padding: '12px 18px',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '10px',
              color: '#34d399',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>✓ {pdfSuccessToast}</span>
              <button onClick={() => setPdfSuccessToast(null)} style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer', fontWeight: '700' }}>✕</button>
            </div>
          )}

          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Header with Export Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Award size={20} color="#c084fc" />
                  CFP® / ChFC® / CFA® Comprehensive Financial Blueprint & Client Dossier
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Multi-page, institutional-grade financial planning report integrating national CPF LIFE architecture, in-force policy schedule, and prioritized recommendations.
                </p>
              </div>

              {/* Action Buttons: PDF Export, Preview, Print & Re-generate */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className="btn"
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: '#60a5fa',
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    padding: '8px 14px'
                  }}
                  onClick={handleExportPdf}
                  disabled={pdfExporting}
                  title="Export dedicated institutional-grade A4 client PDF document"
                >
                  <Download size={14} />
                  {pdfExporting ? 'Generating Client PDF...' : '📄 Export Client PDF Document'}
                </button>

                <button
                  className="btn"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    padding: '8px 12px'
                  }}
                  onClick={() => setIsPdfPreviewOpen(true)}
                  title="Preview the exact client-facing document"
                >
                  <Eye size={14} /> Preview Client Document
                </button>

                <button
                  className="btn"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    padding: '8px 12px'
                  }}
                  onClick={() => window.print()}
                  title="Print or Save via System Dialog"
                >
                  <Printer size={14} /> Print
                </button>

                <button
                  className="btn"
                  style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px' }}
                  onClick={handleGenerateAiSummary}
                  disabled={aiLoading}
                >
                  <RefreshCw size={13} style={{ animation: aiLoading ? 'spin 1s linear infinite' : 'none' }} />
                  {aiLoading ? 'Synthesizing CFP Plan...' : 'Generate / Refresh Blueprint'}
                </button>
              </div>
            </div>

            {/* Advisory Focus Domain & Custom Scenario Input (No-Print) */}
            <div className="no-print" style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Compass size={15} color="#c084fc" /> Select Advisory Focus Domain:
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Tailors actuarial models & talking points to this priority
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                {[
                  { id: 'holistic', label: '🌐 Holistic 360° CFP Plan', desc: 'Comprehensive wealth, protection & retirement' },
                  { id: 'retirement_fire', label: '🏖️ Early Retirement & FIRE', desc: 'Accelerated freedom & safe drawdown' },
                  { id: 'protection_risk', label: '🛡️ Comprehensive Risk & CI', desc: 'Income replacement & medical catastrophe buffer' },
                  { id: 'wealth_investing', label: '📈 Wealth & Yield Optimization', desc: 'Compounding acceleration & asset allocation' },
                  { id: 'estate_legacy', label: '🏛️ Estate Planning & CPF Legacy', desc: 'Nomination, capital guarantee & bequest' }
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFocusArea(f.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      textAlign: 'left',
                      backgroundColor: focusArea === f.id ? 'rgba(168, 85, 247, 0.18)' : 'rgba(255,255,255,0.02)',
                      border: focusArea === f.id ? '1px solid rgba(168, 85, 247, 0.45)' : '1px solid var(--border-light)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: '600', color: focusArea === f.id ? '#c084fc' : 'var(--text-primary)' }}>
                      {f.label}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {f.desc}
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom Advisor Scenario Notes & Query Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    💬 Advisor Scenario Notes & Specific Client Questions:
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Gemini AI will address this specifically in the advisory plan
                  </span>
                </div>
                <textarea
                  placeholder="e.g. Client is thinking of retiring 5 years earlier at age 58 with $5,500/mo spending — can we make this possible and what adjustments are required?"
                  className="input-field"
                  value={advisorCustomNotes}
                  onChange={(e) => setAdvisorCustomNotes(e.target.value)}
                  rows={2}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '12px', resize: 'vertical' }}
                />
                
                {/* Quick Scenario Chips */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Quick Prompts:</span>
                  {[
                    "Can the client retire 5 years earlier at age 58?",
                    "How to bridge the Critical Illness gap using surplus?",
                    "Impact of a 1.5% drop in retirement portfolio returns?",
                    "Should client choose CPF LIFE Escalating or Standard Plan?"
                  ].map((prompt, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => setAdvisorCustomNotes(prompt)}
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        color: '#c084fc',
                        border: '1px solid rgba(168, 85, 247, 0.25)',
                        cursor: 'pointer'
                      }}
                    >
                      + {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Section Navigator Pills (No-Print) */}
            <div className="no-print" style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', borderBottom: '1px solid var(--border-light)' }}>
              {[
                { id: 'all', label: '🌐 Full Comprehensive Dossier' },
                { id: 'executive', label: '📊 Executive Assessment' },
                { id: 'balance_sheet', label: '🏛️ Net Worth & Balance Sheet' },
                { id: 'cashflow', label: '🌊 Cash Flow Velocity' },
                { id: 'retirement', label: '🏖️ Retirement & CPF LIFE' },
                { id: 'policies', label: `🛡️ In-Force Policies (${policies.length})` },
                { id: 'protection_gap', label: '🎯 Protection Gap Matrix' },
                { id: 'roadmap', label: '📋 Strategic Action Roadmap' }
              ].map(sec => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setReportSection(sec.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: reportSection === sec.id ? '600' : '500',
                    backgroundColor: reportSection === sec.id ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.03)',
                    color: reportSection === sec.id ? '#c084fc' : 'var(--text-secondary)',
                    border: reportSection === sec.id ? '1px solid rgba(168, 85, 247, 0.45)' : '1px solid transparent',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {sec.label}
                </button>
              ))}
            </div>

            {aiLoading ? (
              <div style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <Sparkles size={36} color="#c084fc" style={{ animation: 'spin 2s linear infinite' }} />
                <div style={{ fontSize: '15px', color: 'var(--text-primary)' }}>Evaluating complete financial architecture under CFP/ChFC/CFA standards...</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Analyzing cashflow velocity, Singapore CPF LIFE integration, in-force policy schedule, and custom scenarios.</div>
              </div>
            ) : aiSummary ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* ══════════════════════════════════════════════════════════════════
                    COVER & EXECUTIVE PROFILE PARTICULARS (Page 1)
                ══════════════════════════════════════════════════════════════════ */}
                <div className="print-avoid-break" style={{ padding: '20px', backgroundColor: 'rgba(15, 23, 42, 0.7)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#c084fc', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {appSettings?.reportHeaderBranding || 'FINANCIAL PLANNING REPORT'}{appSettings?.reportSubtitle ? ` • ${appSettings.reportSubtitle}` : ''}
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                        Comprehensive Financial Plan: {client?.fullName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Prepared by: <strong>{appSettings?.consultantName || 'Advisory Consultant'}</strong> ({appSettings?.consultantTitle || 'Senior Financial Consultant'}) • {appSettings?.credentials?.join(' • ') || 'CFP® / ChFC® Framework'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)' }}>
                        Focus: {focusArea?.toUpperCase().replace('_', ' ') || 'HOLISTIC 360°'}
                      </span>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Assessment Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  {/* Client Particulars Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '10px', display: 'block' }}>Client Name</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{client?.fullName}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '10px', display: 'block' }}>Current Age</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{profile.currentAge} Years</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '10px', display: 'block' }}>Target Retirement</span>
                      <strong style={{ color: '#34d399' }}>Age {profile.targetRetirementAge} ({Math.max(0, profile.targetRetirementAge - profile.currentAge)} yrs horizon)</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '10px', display: 'block' }}>Life Expectancy</span>
                      <strong style={{ color: 'var(--text-primary)' }}>Age {profile.lifeExpectancy} ({Math.max(0, profile.lifeExpectancy - profile.targetRetirementAge)} yrs decumulation)</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '10px', display: 'block' }}>Net Estate Value</span>
                      <strong style={{ color: '#60a5fa' }}>{formatCurrency(totalNetWorth)}</strong>
                    </div>
                  </div>
                </div>

                {/* ══════════════════════════════════════════════════════════════════
                    SECTION 1: EXECUTIVE ASSESSMENT & 3 HEALTH SCORE GAUGES
                ══════════════════════════════════════════════════════════════════ */}
                {(reportSection === 'all' || reportSection === 'executive') && (
                  <div className="print-avoid-break" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                      <Award size={16} color="#c084fc" />
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        1. Executive Financial Assessment & Health Gauges
                      </span>
                    </div>

                    {/* 3-Score Gauge Cards Bar */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                      <div style={{ padding: '14px', backgroundColor: 'rgba(168, 85, 247, 0.08)', borderRadius: '10px', border: '1px solid rgba(168, 85, 247, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overall Financial Health</div>
                          <div style={{ fontSize: '20px', fontWeight: '700', color: '#c084fc' }}>{aiSummary.financialHealthScore || 82} <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)' }}>/ 100</span></div>
                        </div>
                        <Award size={24} color="#c084fc" />
                      </div>

                      <div style={{ padding: '14px', backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Retirement Readiness</div>
                          <div style={{ fontSize: '20px', fontWeight: '700', color: '#34d399' }}>{aiSummary.retirementReadinessScore || 79} <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)' }}>/ 100</span></div>
                        </div>
                        <TrendingUp size={24} color="#34d399" />
                      </div>

                      <div style={{ padding: '14px', backgroundColor: 'rgba(59, 130, 246, 0.08)', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Protection Matrix Score</div>
                          <div style={{ fontSize: '20px', fontWeight: '700', color: '#60a5fa' }}>{aiSummary.protectionHealthScore || 68} <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)' }}>/ 100</span></div>
                        </div>
                        <Shield size={24} color="#60a5fa" />
                      </div>
                    </div>

                    {/* Executive Summary Card */}
                    <div style={{ padding: '16px', backgroundColor: 'rgba(168, 85, 247, 0.05)', borderRadius: '10px', border: '1px solid rgba(168, 85, 247, 0.2)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Statement of Financial Position & Actuarial Summary
                        </span>
                        <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', backgroundColor: aiSummary.retirementReadinessScore >= 80 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: aiSummary.retirementReadinessScore >= 80 ? '#34d399' : '#fbbf24' }}>
                          Retirement Status: {aiSummary.retirementStatus || 'On Track'}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.6', margin: 0 }}>
                        {aiSummary.executiveSummary}
                      </p>
                    </div>

                    {/* Focus Area & Custom Scenario Evaluation Card */}
                    {aiSummary.focusAnalysis && (
                      <div style={{ padding: '16px', backgroundColor: 'rgba(59, 130, 246, 0.06)', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.35)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontWeight: '700', fontSize: '13px' }}>
                          <Compass size={16} /> {aiSummary.focusAnalysis.title || 'Strategic Focus & Scenario Analysis'}
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.5', margin: 0 }}>
                          {aiSummary.focusAnalysis.assessment}
                        </p>
                        {aiSummary.focusAnalysis.tradeOffs && aiSummary.focusAnalysis.tradeOffs.length > 0 && (
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', borderTop: '1px dashed rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                            <strong style={{ color: '#fbbf24' }}>Key Trade-Offs & Actuarial Requirements:</strong>
                            <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px' }}>
                              {aiSummary.focusAnalysis.tradeOffs.map((t, idx) => (
                                <li key={idx}>{t}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {aiSummary.focusAnalysis.actionableFix && (
                          <div style={{ padding: '8px 12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', color: '#34d399', fontSize: '11px', fontWeight: '600' }}>
                            ✓ Recommended Advisor Action: {aiSummary.focusAnalysis.actionableFix}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Strengths & Critical Risks Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div style={{ padding: '14px', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#34d399', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={14} /> Core Financial Strengths
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {(aiSummary.keyStrengths || []).map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      <div style={{ padding: '14px', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#f87171', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <AlertTriangle size={14} /> Critical Vulnerabilities & Risks
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {(aiSummary.criticalRisksAndGaps || []).map((g, idx) => (
                            <li key={idx}>{g}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    SECTION 2: STATEMENT OF NET WORTH & BALANCE SHEET SCHEDULE
                ══════════════════════════════════════════════════════════════════ */}
                {(reportSection === 'all' || reportSection === 'balance_sheet') && (
                  <div className="print-avoid-break" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Landmark size={16} color="#60a5fa" />
                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          2. Statement of Net Worth & Balance Sheet Schedule
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#34d399' }}>
                        Net Worth: {formatCurrency(totalNetWorth)}
                      </span>
                    </div>

                    <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-light)' }}>
                          <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: '600' }}>Asset / Liability Classification</th>
                          <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: '600' }}>Sub-Category / Account</th>
                          <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: '600' }}>Yield / Interest</th>
                          <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: '600' }}>Valuation ($)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '8px 12px', color: '#60a5fa', fontWeight: '600' }}>Liquid & Cash Assets</td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>Emergency Fund & Bank Deposits</td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{liquidEmergencyMonths} mos living buffer</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '600', color: 'var(--text-primary)' }}>{formatCurrency(totalLiquid)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '8px 12px', color: '#60a5fa', fontWeight: '600' }}>Investments & Portfolios</td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>Equities, Unit Trusts, ETFs & Bonds</td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>Assumed {profile.preRetireReturn}% p.a.</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '600', color: 'var(--text-primary)' }}>{formatCurrency(totalInvested)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', backgroundColor: 'rgba(99, 102, 241, 0.03)' }}>
                          <td style={{ padding: '8px 12px', color: '#818cf8', fontWeight: '600' }} rowSpan={5}>Singapore CPF & SRS Portfolio</td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>CPF Ordinary Account (OA)</td>
                          <td style={{ padding: '8px 12px', color: '#60a5fa' }}>2.5% p.a. (Housing/Investments)</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-primary)' }}>{formatCurrency(totalCpfOA)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', backgroundColor: 'rgba(99, 102, 241, 0.03)' }}>
                          <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>CPF Special Account (SA)</td>
                          <td style={{ padding: '8px 12px', color: '#34d399' }}>4.0% - 5.0% p.a. (Pre-55 Growth)</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-primary)' }}>{formatCurrency(totalCpfSA)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', backgroundColor: 'rgba(99, 102, 241, 0.03)' }}>
                          <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>CPF Retirement Account (RA)</td>
                          <td style={{ padding: '8px 12px', color: '#c084fc' }}>4.0% - 6.0% p.a. (Age 55+ Foundation)</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-primary)' }}>{formatCurrency(totalCpfRA)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', backgroundColor: 'rgba(99, 102, 241, 0.03)' }}>
                          <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>CPF MediSave Account (MA)</td>
                          <td style={{ padding: '8px 12px', color: '#34d399' }}>4.0% p.a. (Medical & Shield)</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-primary)' }}>{formatCurrency(totalCpfMA)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', backgroundColor: 'rgba(99, 102, 241, 0.03)' }}>
                          <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>Supplementary Retirement Scheme (SRS)</td>
                          <td style={{ padding: '8px 12px', color: '#fbbf24' }}>Tax-Deferred Voluntary Account</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-primary)' }}>{formatCurrency(totalSrs)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '8px 12px', color: '#60a5fa', fontWeight: '600' }}>Real Estate & Tangible Assets</td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>Primary Property Valuation</td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>Equity: {formatCurrency(Math.max(0, totalProperty - totalMortgage))}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '600', color: 'var(--text-primary)' }}>{formatCurrency(totalProperty)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', backgroundColor: 'rgba(239, 68, 68, 0.03)' }}>
                          <td style={{ padding: '8px 12px', color: '#f87171', fontWeight: '600' }}>Liabilities & Debt</td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>Mortgage ($ {formatCurrency(totalMortgage)}) + Personal Debt ($ {formatCurrency(totalOtherDebt)})</td>
                          <td style={{ padding: '8px 12px', color: '#f87171' }}>Total Commitments</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '600', color: '#f87171' }}>- {formatCurrency(totalLiabilities)}</td>
                        </tr>
                        <tr style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', fontWeight: '700' }}>
                          <td style={{ padding: '10px 12px', color: '#34d399' }} colSpan={2}>TOTAL ESTIMATED NET ESTATE WORTH</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Financial Assets: {formatCurrency(totalFinancialAssets)}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: '#34d399', fontSize: '14px' }}>{formatCurrency(totalNetWorth)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    SECTION 3: MONTHLY CASH FLOW DYNAMICS & SAVINGS CAPACITY
                ══════════════════════════════════════════════════════════════════ */}
                {(reportSection === 'all' || reportSection === 'cashflow') && (
                  <div className="print-avoid-break" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DollarSign size={16} color="#34d399" />
                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          3. Monthly Cash Flow Dynamics & Savings Velocity
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#34d399' }}>
                        Savings Rate: {savingsRate}% ({formatCurrency(monthlySurplus)}/mo)
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                      <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Monthly Earned Income</span>
                        <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{formatCurrency(cashflow.monthlyEarnedIncome)}</strong>
                      </div>
                      <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Monthly Passive Income</span>
                        <strong style={{ fontSize: '15px', color: '#60a5fa' }}>{formatCurrency(cashflow.monthlyPassiveIncome)}</strong>
                      </div>
                      <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Monthly Outflows (Living + Debt)</span>
                        <strong style={{ fontSize: '15px', color: '#f87171' }}>{formatCurrency(totalMonthlyOutflow)}</strong>
                      </div>
                      <div style={{ padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Annual Capital Accumulation</span>
                        <strong style={{ fontSize: '15px', color: '#34d399' }}>{formatCurrency(annualSavings)}/yr</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    SECTION 4: RETIREMENT RUNWAY & SINGAPORE CPF LIFE ARCHITECTURE
                ══════════════════════════════════════════════════════════════════ */}
                {(reportSection === 'all' || reportSection === 'retirement') && (
                  <div className="print-avoid-break" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Target size={16} color="#fbbf24" />
                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          4. Retirement Runway, Singapore CPF LIFE & Decumulation Strategy
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: isRetirementOnTrack ? '#34d399' : '#f87171' }}>
                        {isRetirementOnTrack ? '✓ Capital Solvency Maintained' : `⚠️ Depletion at Age ${baselineDepletion}`}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                      <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Desired Retirement Income</span>
                        <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{formatCurrency(retirementTarget.desiredMonthlyIncome)}/mo</strong>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>In today's purchasing power</span>
                      </div>

                      <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Projected Peak Capital at Age {profile.targetRetirementAge}</span>
                        <strong style={{ fontSize: '14px', color: '#34d399' }}>{formatCurrency(retirementNestEggAtRetire)}</strong>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>Assumed {profile.preRetireReturn}% pre-retire return</span>
                      </div>

                      <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Expected CPF LIFE / Annuity Floor</span>
                        <strong style={{ fontSize: '14px', color: '#818cf8' }}>{formatCurrency(retirementTarget.expectedAnnuityPensions)}/mo</strong>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>Guaranteed life payout</span>
                      </div>
                    </div>

                    {/* Singapore CPF LIFE Strategy Callout */}
                    {aiSummary.cpfAndAnnuityOptimization && (
                      <div style={{ padding: '14px 16px', backgroundColor: 'rgba(99, 102, 241, 0.06)', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.25)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <BookOpen size={16} color="#818cf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                          <strong style={{ color: '#818cf8' }}>Singapore CPF LIFE & Guaranteed Annuity Strategic Architecture:</strong><br />
                          {aiSummary.cpfAndAnnuityOptimization}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    SECTION 5: IN-FORCE INSURANCE POLICIES SCHEDULE (Full Table)
                ══════════════════════════════════════════════════════════════════ */}
                {(reportSection === 'all' || reportSection === 'policies') && (
                  <div className="print-avoid-break" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Shield size={16} color="#60a5fa" />
                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          5. In-Force Insurance Policy Portfolio Schedule ({policies.length} Policies)
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: inForceCoverage.hasShield ? '#34d399' : '#fbbf24' }}>
                        Shield Plan: {inForceCoverage.hasShield ? '✓ Active' : '⚠️ Missing'}
                      </span>
                    </div>

                    {policies.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px dashed var(--border-light)', color: 'var(--text-muted)', fontSize: '12px' }}>
                        No in-force insurance policies currently recorded under this client profile.
                      </div>
                    ) : (
                      <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-light)' }}>
                            <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-muted)', fontWeight: '600' }}>Insurer & Policy #</th>
                            <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-muted)', fontWeight: '600' }}>Plan Name & Type</th>
                            <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-muted)', fontWeight: '600' }}>Premium ($)</th>
                            <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-muted)', fontWeight: '600' }}>Status</th>
                            <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-muted)', fontWeight: '600' }}>Sum Assured / Coverage Breakdown</th>
                          </tr>
                        </thead>
                        <tbody>
                          {policies.map((p, idx) => (
                            <tr key={p.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '8px 10px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                {p.insurer || 'Insurer'}<br />
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>#{p.policyNumber || 'N/A'}</span>
                              </td>
                              <td style={{ padding: '8px 10px', color: 'var(--text-primary)' }}>
                                {p.policyName || 'Plan Name'}<br />
                                <span style={{ fontSize: '10px', color: '#60a5fa' }}>{p.policyType || 'General'}</span>
                              </td>
                              <td style={{ padding: '8px 10px', color: 'var(--text-primary)' }}>
                                {formatCurrency(p.premium)} / {p.premiumFrequency || 'yr'}
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <span style={{ padding: '2px 6px', borderRadius: '6px', fontSize: '10px', backgroundColor: p.status === 'In Force' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)', color: p.status === 'In Force' ? '#34d399' : 'var(--text-muted)' }}>
                                  {p.status || 'Active'}
                                </span>
                              </td>
                              <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                                {p.coverages && Object.keys(p.coverages).length > 0 ? (
                                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                    {Object.entries(p.coverages).map(([k, v]) => (
                                      <span key={k} style={{ padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.04)', fontSize: '10px', color: 'var(--text-primary)' }}>
                                        {k}: <strong>{formatCurrency(v)}</strong>
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>Standard Policy Benefits</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    SECTION 6: PROTECTION BENCHMARK VS IN-FORCE GAP ANALYSIS MATRIX
                ══════════════════════════════════════════════════════════════════ */}
                {(reportSection === 'all' || reportSection === 'protection_gap') && (
                  <div className="print-avoid-break" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <HeartPulse size={16} color="#f87171" />
                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          6. Protection Benchmark vs In-Force Gap Matrix
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: protectionScore >= 75 ? '#34d399' : '#fbbf24' }}>
                        Protection Score: {protectionScore}/100
                      </span>
                    </div>

                    <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-light)' }}>
                          <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-muted)', fontWeight: '600' }}>Risk & Coverage Category</th>
                          <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-muted)', fontWeight: '600' }}>CFP / MAS Benchmark Rule</th>
                          <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--text-muted)', fontWeight: '600' }}>In-Force Sum Assured</th>
                          <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--text-muted)', fontWeight: '600' }}>Recommended Target</th>
                          <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--text-muted)', fontWeight: '600' }}>Status / Gap</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          {
                            title: 'Life / Death Protection',
                            desc: '10x Annual Income + Mortgages',
                            inForce: inForceCoverage.death,
                            target: recommendedDeath,
                            isMonthly: false
                          },
                          {
                            title: 'Total & Permanent Disability (TPD)',
                            desc: '10x Annual Income',
                            inForce: inForceCoverage.tpd,
                            target: recommendedTpd,
                            isMonthly: false
                          },
                          {
                            title: 'Early Stage Critical Illness',
                            desc: '2x Annual Income (Income Bridge)',
                            inForce: inForceCoverage.earlyCi,
                            target: recommendedEarlyCi,
                            isMonthly: false
                          },
                          {
                            title: 'Major / Late Critical Illness',
                            desc: '4x - 5x Annual Income (Treatment Buffer)',
                            inForce: inForceCoverage.majorCi,
                            target: recommendedMajorCi,
                            isMonthly: false
                          },
                          {
                            title: 'Disability Income Replacement',
                            desc: '75% of Gross Monthly Earned Income',
                            inForce: inForceCoverage.disabilityIncome,
                            target: recommendedDisability,
                            isMonthly: true
                          }
                        ].map((row, rIdx) => {
                          const gap = Math.max(0, row.target - row.inForce);
                          const isCovered = row.inForce >= row.target;
                          return (
                            <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '8px 10px', fontWeight: '600', color: 'var(--text-primary)' }}>{row.title}</td>
                              <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{row.desc}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-primary)' }}>
                                {formatCurrency(row.inForce)}{row.isMonthly ? '/mo' : ''}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                                {formatCurrency(row.target)}{row.isMonthly ? '/mo' : ''}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                {isCovered ? (
                                  <span style={{ padding: '2px 6px', borderRadius: '6px', fontSize: '10px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: '600' }}>
                                    ✓ Fully Covered
                                  </span>
                                ) : (
                                  <span style={{ padding: '2px 6px', borderRadius: '6px', fontSize: '10px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', fontWeight: '600' }}>
                                    Shortfall: {formatCurrency(gap)}{row.isMonthly ? '/mo' : ''}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        <tr>
                          <td style={{ padding: '8px 10px', fontWeight: '600', color: 'var(--text-primary)' }}>Hospitalization & Shield</td>
                          <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>MediShield Life + Private Hospital Rider</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: inForceCoverage.hasShield ? '#34d399' : '#f87171' }}>
                            {inForceCoverage.hasShield ? 'Shield Active' : 'No Shield'}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-secondary)' }}>Private / Class A</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                            <span style={{ padding: '2px 6px', borderRadius: '6px', fontSize: '10px', backgroundColor: inForceCoverage.hasShield ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: inForceCoverage.hasShield ? '#34d399' : '#f87171', fontWeight: '600' }}>
                              {inForceCoverage.hasShield ? '✓ In Force' : '⚠️ Missing Rider'}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    SECTION 7: PRIORITIZED STRATEGIC ACTION ROADMAP
                ══════════════════════════════════════════════════════════════════ */}
                {(reportSection === 'all' || reportSection === 'roadmap') && (
                  <div className="print-avoid-break" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Target size={16} color="#c084fc" />
                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          7. Prioritized Strategic Recommendations Roadmap
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Ranked by actuarial urgency & ROI
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {(aiSummary.strategicRecommendations || []).map((rec, idx) => (
                        <div key={idx} style={{ padding: '14px 16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                              {idx + 1}. {rec.action}
                            </span>
                            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '8px', backgroundColor: rec.priority === 'High' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: rec.priority === 'High' ? '#f87171' : '#60a5fa', fontWeight: '600' }}>
                              {rec.priority} Priority • {rec.category}
                            </span>
                          </div>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                            {rec.rationale}
                          </p>
                          {rec.implementationSteps && (
                            <div style={{ fontSize: '11px', color: '#60a5fa', borderTop: '1px dashed rgba(255,255,255,0.04)', paddingTop: '4px' }}>
                              ⚙️ <strong>Implementation Steps:</strong> {rec.implementationSteps}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Stress Test Analysis */}
                    {aiSummary.stressTestInsights && (
                      <div style={{ padding: '12px 16px', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#fbbf24', marginBottom: '4px' }}>
                          ⚡ Capital Stress-Testing & Longevity Resilience Assessment
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                          {aiSummary.stressTestInsights}
                        </p>
                      </div>
                    )}

                    {/* Client Discussion Opener Script */}
                    {aiSummary.clientDiscussionPrompt && (
                      <div style={{ padding: '12px 16px', backgroundColor: 'rgba(99, 102, 241, 0.08)', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#818cf8', marginBottom: '4px' }}>
                          💬 Advisor Meeting Opener Script:
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-primary)', fontStyle: 'italic', margin: 0, lineHeight: '1.5' }}>
                          "{aiSummary.clientDiscussionPrompt}"
                        </p>
                      </div>
                    )}

                    {/* Professional Compliance Disclaimer */}
                    <div style={{ padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                      <strong>Professional Standards & Advisory Notice:</strong> This Comprehensive Financial Planning Blueprint is prepared in alignment with CFP® (Certified Financial Planner) / ChFC® standards and Singapore Monetary Authority guidelines. Projections are based on client-provided declarations, current CPF regulations, and stated actuarial assumptions. Actual returns and annuity payouts will depend on market conditions and prevailing CPF Board policies at payout commencement.
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div style={{ padding: '36px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px dashed var(--border-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <Sparkles size={32} color="var(--border-light)" />
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No AI Blueprint generated yet for this client.</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '440px' }}>
                  Click <strong>Generate / Refresh Blueprint</strong> above to synthesize the retirement runway, protection matrix, and stress tests into institutional CFP/ChFC talking points.
                </div>
                <button
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 16px' }}
                  onClick={handleGenerateAiSummary}
                >
                  <Sparkles size={14} /> Generate Blueprint Now
                </button>
              </div>
            )}
          </div>

          {/* Step Navigation Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', flexWrap: 'wrap', gap: '12px' }}>
            <button
              className="btn"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' }}
              onClick={() => {
                setActiveTab('simulator');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <ArrowLeft size={16} /> Back: ⚡ 'What-If' Stress Testing
            </button>
            <button
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontSize: '13px' }}
              onClick={handleSavePlan}
              disabled={isSaving}
            >
              {saveSuccess ? <CheckCircle2 size={16} /> : <Save size={16} />}
              {saveSuccess ? 'Plan Saved Successfully!' : 'Save Complete Blueprint'}
            </button>
          </div>

        </div>
      )}

      {/* TAB 6: LIVE 6-PAGE A4 WYSIWYG REPORT PREVIEW */}
      {activeTab === 'report-preview' && renderLiveReportPreview()}

      {/* CPF LIFE Advisor Playbook Modal */}
      <CpfLifePlaybookModal
        isOpen={isCpfModalOpen}
        onClose={() => setIsCpfModalOpen(false)}
        onApplyPayout={(amount) => {
          setRetirementTarget(prev => ({ ...prev, expectedAnnuityPensions: amount }));
          setIsCpfModalOpen(false);
        }}
        currentExpectedAnnuity={retirementTarget.expectedAnnuityPensions}
      />

      {/* Projection Graph Formulation & AI Breakdown Modal */}
      <ProjectionGraphBreakdownModal
        isOpen={isGraphBreakdownOpen}
        onClose={() => setIsGraphBreakdownOpen(false)}
        client={client}
        planData={{ profile, cashflow, balanceSheet, retirementTarget }}
        projectionResults={projectionResults}
        lifeEvents={lifeEvents}
      />

      {/* Client PDF Document Interactive Preview Modal */}
      {isPdfPreviewOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px'
        }}>
          <div style={{
            backgroundColor: '#0F172A',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'rgba(15, 23, 42, 0.95)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#60a5fa" />
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Client PDF Document Preview • {client?.fullName}
                </span>
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', fontWeight: '600' }}>
                  A4 Publication Format
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 14px' }}
                  onClick={() => {
                    setIsPdfPreviewOpen(false);
                    handleExportPdf();
                  }}
                >
                  <Download size={13} /> Export PDF Now
                </button>
                <button
                  onClick={() => setIsPdfPreviewOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px', fontWeight: '700' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body: Document Preview */}
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', backgroundColor: '#0B1120' }}>
              
              {/* Document Sheet Simulation */}
              <div style={{
                width: '100%',
                maxWidth: '780px',
                backgroundColor: '#FFFFFF',
                color: '#1E293B',
                borderRadius: '8px',
                padding: '36px 40px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                fontSize: '11px',
                lineHeight: '1.5'
              }}>
                {/* Header Banner */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0F172A', paddingBottom: '10px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {appSettings?.reportHeaderBranding || 'FINANCIAL PLANNING REPORT'}
                    </div>
                    {appSettings?.reportSubtitle && (
                      <div style={{ fontSize: '9px', color: '#475569', fontWeight: '600', textTransform: 'uppercase' }}>
                        {appSettings.reportSubtitle}
                      </div>
                    )}
                  </div>
                  <span style={{ backgroundColor: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', fontSize: '8px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px' }}>
                    CONFIDENTIAL FINANCIAL REPORT
                  </span>
                </div>

                {/* Title */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '9px', fontWeight: '700', color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>
                    Comprehensive Financial Plan
                  </div>
                  <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: '0 0 6px 0', lineHeight: '1.2' }}>
                    COMPREHENSIVE FINANCIAL PLAN & RETIREMENT PROJECTION
                  </h1>
                  <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>
                    Prepared for: <strong>{client?.fullName}</strong> • Age {profile.currentAge} • Prepared by: <strong>{appSettings?.consultantName || 'Advisory Consultant'}</strong> ({appSettings?.consultantTitle || 'Senior Financial Consultant'})
                  </p>
                </div>

                {/* Scorecards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
                  <div style={{ border: '1px solid #CBD5E1', borderRadius: '6px', padding: '10px', textAlign: 'center', backgroundColor: '#F8FAFC' }}>
                    <div style={{ fontSize: '8.5px', color: '#64748B', textTransform: 'uppercase', fontWeight: '700' }}>Overall Health</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#7C3AED' }}>{aiSummary?.financialHealthScore || 82} / 100</div>
                  </div>
                  <div style={{ border: '1px solid #CBD5E1', borderRadius: '6px', padding: '10px', textAlign: 'center', backgroundColor: '#F8FAFC' }}>
                    <div style={{ fontSize: '8.5px', color: '#64748B', textTransform: 'uppercase', fontWeight: '700' }}>Retirement Readiness</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#059669' }}>{aiSummary?.retirementReadinessScore || 79} / 100</div>
                  </div>
                  <div style={{ border: '1px solid #CBD5E1', borderRadius: '6px', padding: '10px', textAlign: 'center', backgroundColor: '#F8FAFC' }}>
                    <div style={{ fontSize: '8.5px', color: '#64748B', textTransform: 'uppercase', fontWeight: '700' }}>Insurance Coverage</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#2563EB' }}>{aiSummary?.protectionHealthScore || protectionScore} / 100</div>
                  </div>
                </div>

                {/* Net Worth Summary */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '6px', padding: '12px 14px', backgroundColor: '#F8FAFC', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '11px', color: '#0F172A', textTransform: 'uppercase' }}>Net Worth Statement & Balance Sheet</strong>
                    <strong style={{ fontSize: '12px', color: '#059669' }}>Total Net Worth: {formatCurrency(totalNetWorth)}</strong>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '10px' }}>
                    <div>Liquid Cash: <strong>{formatCurrency(totalLiquid)}</strong> ({liquidEmergencyMonths} mos)</div>
                    <div>Investments: <strong>{formatCurrency(totalInvested)}</strong></div>
                    <div>Combined CPF/SRS: <strong>{formatCurrency(totalPension)}</strong></div>
                    <div>Property Valuation: <strong>{formatCurrency(totalProperty)}</strong></div>
                    <div>Total Liabilities: <strong style={{ color: '#DC2626' }}>{formatCurrency(totalLiabilities)}</strong></div>
                    <div>Annual Savings: <strong>{formatCurrency(annualSavings)}/yr</strong> ({savingsRate}%)</div>
                  </div>
                </div>

                {/* CPF LIFE Strategy */}
                <div style={{ borderLeft: '3.5px solid #7C3AED', padding: '10px 12px', backgroundColor: '#FAF5FF', borderRadius: '4px', marginBottom: '16px' }}>
                  <strong style={{ fontSize: '10px', color: '#6D28D9', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
                    Singapore CPF LIFE & Guaranteed Decumulation Strategy
                  </strong>
                  <p style={{ fontSize: '10px', color: '#334155', margin: 0 }}>
                    {aiSummary?.cpfAndAnnuityOptimization || 'CPF LIFE provides a lifelong, inflation-hedged foundation. Maximizing the Retirement Account (RA) towards the Enhanced Retirement Sum (ERS) establishes a guaranteed floor for baseline retirement living expenses.'}
                  </p>
                </div>

                {/* Recommendations Roadmap Preview */}
                <div>
                  <strong style={{ fontSize: '11px', color: '#0F172A', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                    Prioritized Strategic Recommendations Roadmap
                  </strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(aiSummary?.strategicRecommendations || []).slice(0, 3).map((r, i) => (
                      <div key={i} style={{ borderLeft: `3px solid ${r.priority === 'High' ? '#DC2626' : '#2563EB'}`, padding: '6px 10px', backgroundColor: '#F8FAFC', borderRadius: '4px', fontSize: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <strong>{i + 1}. {r.action}</strong>
                          <span style={{ fontSize: '9px', fontWeight: '700', color: r.priority === 'High' ? '#DC2626' : '#2563EB' }}>{r.priority} Priority</span>
                        </div>
                        <p style={{ fontSize: '9.5px', color: '#64748B', margin: '2px 0 0 0' }}>{r.rationale}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Notice */}
                <div style={{ marginTop: '24px', paddingTop: '8px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#94A3B8' }}>
                  <span>Prepared by: {appSettings?.consultantName || 'Advisory Consultant'}</span>
                  <span>Strictly Private & Confidential</span>
                  <span>Full 6-Page Dossier Available on Export</span>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
