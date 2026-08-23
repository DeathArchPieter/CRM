# Client Financial Planning Report Specification & Standard

> **Document Classification**: Standard Operating Procedure & Architecture Specification  
> **Target Output**: Institutional-grade, 6-page A4 Client Financial Report (PDF & On-Screen Plan)  
> **Advisory Framework**: CFP® (Certified Financial Planner) / ChFC® Multi-Discipline Standard & MAS Guidance

---

## 1. Executive Purpose & Governance

This specification defines the canonical structure, data contracts, actuarial benchmarks, and design guidelines for all client-facing financial planning deliverables produced by the CRM.

Every financial report generated across all clients must strictly adhere to this standardized layout to ensure consistent quality, fiduciary rigor, and clear, professional presentation across all advisory cases.

---

## 2. Standard 6-Page A4 Report Taxonomy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        6-PAGE FINANCIAL PLAN TAXONOMY                       │
├───────────────┬─────────────────────────────────────────────────────────────┤
│ Page 1        │ Cover Page, Client Particulars & Table of Contents          │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ Page 2        │ Executive Summary, Key Indicators & Scenario Analysis       │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ Page 3        │ Net Worth Statement, Balance Sheet & Cash Flow Analysis     │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ Page 4        │ Retirement Planning, Projection Charts & CPF LIFE Strategy  │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ Page 5        │ Insurance Policies & Coverage Benchmark Analysis            │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ Page 6        │ Action Plan, Scenario Insights & Advisory Notice            │
└───────────────┴─────────────────────────────────────────────────────────────┘
```

---

### Page 1: Cover Page & Particulars

- **Header Banner**: `[Report Header Title]` (Configured in Settings, default: `FINANCIAL PLANNING REPORT`) with optional `[Report Subtitle]`.
- **Classification Badge**: `CONFIDENTIAL FINANCIAL REPORT`
- **Document Title**: `COMPREHENSIVE FINANCIAL PLAN & RETIREMENT PROJECTION`
- **Subtitle**: `A comprehensive financial review covering wealth accumulation, retirement planning with Singapore CPF LIFE, cash flow management, and insurance protection.`
- **Client & Consultant Particulars Card**:
  - Prepared For: Full Legal Name & Preferred Name
  - Prepared By: `[Consultant Name], [Consultant Title]` (configured in Settings)
  - Representative / License Number: `[Rep Number]`
  - Professional Designations: `[Credentials List]` (e.g., `CFP® • ChFC® • AEPP®`)
  - Current Age, Target Retirement Age, and Horizon (Years to Retirement)
  - Date of Assessment
  - Focus Area (e.g., *Holistic Plan, Early Retirement / FIRE, Protection Gap Review, Wealth Accumulation*)
  - Consultant Direct Contact: Phone & Email
- **Table of Contents**:
  1. Executive Summary & Key Indicators
  2. Net Worth Statement & Balance Sheet
  3. Cash Flow & Savings Analysis
  4. Retirement Planning & CPF Projections
  5. Insurance Policies & Coverage Analysis
  6. Action Plan & Next Steps
- **Running Footer**: `Strictly Private & Confidential • Prepared by [Consultant Name]`

---

### Page 2: Executive Summary, Key Indicators & Scenario Analysis

- **Running Header**: `[Report Header Title] | Financial Planning Report • Section 1`
- **Key Indicators Scorecards**:
  - **Overall Financial Health Score** (`0–100`): Weighted composite of liquidity, savings rate, debt-to-asset ratio, and net worth trajectory.
  - **Retirement Readiness Score** (`0–100`): Probability of capital sustaining through target life expectancy under projected inflation.
  - **Insurance Coverage Score** (`0–100`): In-force coverage vs. recommended benchmarks.
- **Executive Summary & Financial Position**:
  - Narrative summarizing client's baseline position, cashflow dynamics, and key opportunities.
- **Scenario Analysis & Focus Area Card**:
  - Addressed custom client query / advisor note (e.g., *"Client is considering retiring at age 55 instead of 62"*).
  - Assessment & Impact.
  - Key Considerations & Trade-Offs.
  - Recommended Action.
- **Financial Strengths vs. Key Considerations & Areas for Improvement**:
  - 2-column comparative layout with green (`✓`) and amber (`⚠️`) bulleted items.
- **Running Footer**: `Prepared for: [Client Name] | Prepared by: [Consultant Name] | Page 2 of 6`

---

### Page 3: Net Worth Statement & Cash Flow Analysis

- **Running Header**: `[Report Header Title] | Financial Planning Report • Section 2 & 3`
- **Net Worth Statement & Balance Sheet Schedule**:
  - **Liquid Cash & Emergency Reserves**: Cash, High-Yield Savings, and Emergency Runway in months of living expenses.
  - **Invested Capital & Portfolios**: Equities, ETFs, Unit Trusts, and Fixed Income.
  - **Singapore CPF & SRS Portfolio Breakdown**:
    - **CPF Ordinary Account (OA)**: 2.5% p.a. (Housing, CPFIS)
    - **CPF Special Account (SA)**: 4.0%–5.0% p.a. (Pre-55 Compounding)
    - **CPF Retirement Account (RA)**: 4.0%–6.0% p.a. (Age 55+ CPF LIFE Foundation)
    - **CPF MediSave Account (MA)**: 4.0% p.a. (Hospitalization & MediShield Life)
    - **Supplementary Retirement Scheme (SRS)**: Tax-deferred voluntary wealth accumulation
    - **Total Combined CPF & SRS Reserves**
  - **Real Estate & Property Equity**: Primary Residence Market Valuation, Outstanding Mortgage, and Net Home Equity.
  - **Liabilities & Debt**: Outstanding Mortgages, Personal Loans, Car Loans, and Credit Lines.
  - **Total Net Worth**: Financial Assets + Property − Liabilities.
- **Cash Flow & Savings Analysis**:
  - Monthly Earned Income vs. Monthly Passive Income.
  - Total Monthly Outflows (Living Expenses + Debt Servicing).
  - Net Monthly Surplus ($/mo) and Savings Rate % of gross income.
  - Annualized Savings Capacity ($/yr).
  - Cash Flow Summary Commentary.
- **Running Footer**: `Prepared for: [Client Name] | Prepared by: [Consultant Name] | Page 3 of 6`

---

### Page 4: Retirement Planning, Projection Charts & Singapore CPF LIFE

- **Running Header**: `[Report Header Title] | Financial Planning Report • Section 4`
- **Retirement Horizon & Target Metrics**:
  - Target Monthly Retirement Income (today's purchasing power vs. future inflated dollars).
  - Projected Nest Egg at Target Retirement Age.
  - Estimated CPF LIFE / Guaranteed Annuity Income Floor.
- **Chart 1: Capital Accumulation & Drawdown Projection (Vector SVG)**:
  - Visual trajectory curve from current age to life expectancy with peak capital at retirement and depletion markers.
  - Formulations and descriptions for Accumulation Phase vs. Drawdown Phase.
- **Chart 2: Projected Retirement Income vs. Living Expenses (Vector SVG)**:
  - Stacked waterfall visualization comparing CPF LIFE Guaranteed Floor, Portfolio Drawdowns, and Inflated Living Expense curve.
  - Explanatory description of guaranteed income layer and sequence-of-returns protection.
- **Singapore CPF LIFE & Retirement Strategy Card**:
  - Age 55 Restructuring (SA transfer to RA up to FRS/ERS).
  - Plan Recommendation (Escalating Plan for inflation defense).
  - Payout Deferral Incentives (+7%/yr per deferred year from 65 to 70).
- **Running Footer**: `Prepared for: [Client Name] | Prepared by: [Consultant Name] | Page 4 of 6`

---

### Page 5: Insurance Policies & Coverage Analysis

- **Running Header**: `[Report Header Title] | Financial Planning Report • Section 5`
- **Existing Insurance Policies Table**:
  - Insurer & Policy Number (e.g., AIA, Prudential, Great Eastern, Singlife, Manulife, Income).
  - Plan Name & Category (Whole Life, Term, Critical Illness, Integrated Shield, Disability, Endowment).
  - Annual / Monthly Premium & Payment Frequency.
  - Policy Status Badge (*In Force / Paid-Up / Lapsed*).
  - Detailed Coverages & Sum Assured Breakdown (Death, TPD, Early CI, Major CI, Disability, Hospital).
- **Insurance Coverage vs. Recommended Guidelines Matrix Table**:
  - **Life / Death Protection**: In-Force vs. Recommended (10x Annual Income + Mortgages) → Shortfall / Surplus.
  - **Total & Permanent Disability (TPD)**: In-Force vs. Recommended (10x Annual Income) → Shortfall / Surplus.
  - **Early Stage Critical Illness**: In-Force vs. Recommended (2x Annual Income) → Shortfall / Surplus.
  - **Major / Late Stage Critical Illness**: In-Force vs. Recommended (4x–5x Annual Income) → Shortfall / Surplus.
  - **Disability Income Replacement**: In-Force vs. Recommended (75% Monthly Income) → Shortfall / Surplus.
  - **Hospitalization & Integrated Shield**: In-Force vs. Recommended (MediShield Life + Private Rider) → Active Status.
- **Running Footer**: `Prepared for: [Client Name] | Prepared by: [Consultant Name] | Page 5 of 6`

---

### Page 6: Action Plan, Scenario Insights & Advisory Notice

- **Running Header**: `[Report Header Title] | Financial Planning Report • Section 6`
- **Action Plan Matrix**:
  - Ranked by urgency with Priority Badges (**High**, **Medium**, **Low**) and Category tags (*Protection, Retirement, Wealth Accumulation, Estate Planning*).
  - Recommendation Action Title.
  - Rationale & Expected Impact.
  - Action Steps for Advisor and Client.
- **Stress-Testing & Scenario Insights**:
  - Analysis of simulated life events (property purchase, education funding, medical shock) against plan sustainability.
- **Discussion Points for Consultation**:
  - Consultative discussion points for review meetings.
- **Important Regulatory & Advisory Notice**:
  - Regulatory notice on estimates, assumptions, and periodic review triggers.
- **Running Footer**: `Prepared for: [Client Name] | Prepared by: [Consultant Name] | Page 6 of 6`

---

## 3. Data Schema Interface Contract

When calling `export-financial-plan-pdf` or `generateFinancialPlanAiSummary`, the payload must conform to the following JSON structure:

```json
{
  "client": {
    "id": "uuid",
    "fullName": "string",
    "preferredName": "string",
    "nric": "string",
    "dob": "YYYY-MM-DD",
    "occupation": "string",
    "maritalStatus": "string"
  },
  "profile": {
    "currentAge": 35,
    "targetRetirementAge": 62,
    "lifeExpectancy": 88,
    "inflationRate": 3.0,
    "preRetireReturn": 6.5,
    "postRetireReturn": 4.5
  },
  "cashflow": {
    "monthlyEarnedIncome": 8500,
    "monthlyPassiveIncome": 300,
    "monthlyLivingExpenses": 3800,
    "monthlyCommitments": 1200,
    "monthlySurplus": 3800,
    "savingsRate": 43,
    "annualSavings": 45600,
    "liquidEmergencyMonths": "6.2"
  },
  "balanceSheet": {
    "liquidCash": 25000,
    "investedAssets": 95000,
    "cpfOA": 80000,
    "cpfSA": 45000,
    "cpfRA": 0,
    "cpfMA": 35000,
    "srs": 15000,
    "propertyValue": 750000,
    "outstandingMortgage": 380000,
    "otherLiabilities": 0,
    "totalLiquid": 25000,
    "totalInvested": 95000,
    "totalCpfOA": 80000,
    "totalCpfSA": 45000,
    "totalCpfRA": 0,
    "totalCpfMA": 35000,
    "totalCpf": 160000,
    "totalSrs": 15000,
    "totalPension": 175000,
    "totalProperty": 750000,
    "totalMortgage": 380000,
    "totalOtherDebt": 0,
    "totalFinancialAssets": 295000,
    "totalAssets": 1045000,
    "totalLiabilities": 380000,
    "totalNetWorth": 665000
  },
  "retirement": {
    "desiredMonthlyIncome": 4500,
    "expectedAnnuityPensions": 1850,
    "inflationRate": 3.0,
    "preRetireReturn": 6.5,
    "postRetireReturn": 4.5,
    "projectedNestEgg": 1420000,
    "isRetirementOnTrack": true,
    "baselineDepletion": null
  },
  "policies": [
    {
      "id": "uuid",
      "policyNumber": "POL-100234",
      "insurer": "AIA Singapore",
      "policyName": "AIA Guaranteed Protect Plus III",
      "policyType": "Whole Life",
      "premium": 3600,
      "premiumFrequency": "Annually",
      "status": "In Force",
      "coverages": {
        "Death": 300000,
        "TPD": 300000,
        "Early CI": 100000,
        "Major CI": 200000
      }
    }
  ],
  "inForceCoverage": {
    "death": 300000,
    "tpd": 300000,
    "earlyCi": 100000,
    "majorCi": 200000,
    "disabilityIncome": 0,
    "hasShield": true
  },
  "recommendedCoverage": {
    "death": 1220000,
    "tpd": 850000,
    "earlyCi": 170000,
    "majorCi": 425000,
    "disability": 6375
  },
  "protectionScore": 68,
  "aiSummary": {
    "financialHealthScore": 84,
    "retirementReadinessScore": 81,
    "protectionHealthScore": 68,
    "retirementStatus": "On Track",
    "executiveSummary": "string",
    "focusAnalysis": {
      "title": "string",
      "assessment": "string",
      "tradeOffs": ["string"],
      "actionableFix": "string"
    },
    "cpfAndAnnuityOptimization": "string",
    "keyStrengths": ["string"],
    "criticalRisksAndGaps": ["string"],
    "strategicRecommendations": [
      {
        "priority": "High",
        "category": "Protection",
        "action": "string",
        "rationale": "string",
        "implementationSteps": "string"
      }
    ],
    "stressTestInsights": "string",
    "clientDiscussionPrompt": "string"
  },
  "focusArea": "holistic",
  "advisorCustomNotes": "string"
}
```

---

## 4. Actuarial Benchmarks & Calculation Rules

| Category | Benchmark Rule | Rationale |
| :--- | :--- | :--- |
| **Emergency Cash Runway** | 3–6 months (salaried)<br>6–12 months (self-employed/variable) | Protects against income disruption without liquidating invested capital. |
| **Life / Death Protection** | 10x Annual Gross Income + Outstanding Mortgages | Replaces economic human life value and extinguishes debt for surviving dependents. |
| **TPD Protection** | 10x Annual Gross Income | Covers lifetime living costs and caregiver expenses in the event of permanent incapacity. |
| **Early Stage Critical Illness** | 2x Annual Gross Income | Income replacement buffer during early treatment and recovery (1–2 years). |
| **Major / Late Critical Illness** | 4x–5x Annual Gross Income | Covers alternative medical treatments, loss of earning capacity, and prolonged recovery. |
| **Disability Income** | 75% of Gross Monthly Income | Replaces regular monthly income up to age 65 if unable to perform own/any occupation. |
| **Hospitalization** | MediShield Life + Integrated Shield Plan (IP) + Rider | Caps catastrophic private/restructured hospital co-pays and deductibles. |
| **CPF LIFE Tier Selection** | BRS ($106.5k), FRS ($213k), ERS ($426k) [2026/2027 standards] | Provides guaranteed inflation-resilient foundation for baseline retirement decumulation. |

---

## 5. Visual Styling & Typographical Standards

- **Paper Standard**: A4 Portrait (`210mm × 297mm`), `12mm–15mm` margins.
- **Color Palette**:
  - Primary Corporate Navy: `#0F172A` (Headings, Main Borders, Primary Badges)
  - Secondary Slate Navy: `#1E293B`, `#334155` (Subheadings, Body Text)
  - Gold / Warm Bronze: `#B45309`, `#D97706`, `#F59E0B` (Advisory Accents, Confidentiality Badges)
  - Royal Blue: `#2563EB`, `#1E40AF` (Strategic Focus, Action Links)
  - Emerald Green: `#059669`, `#10B981` (Surplus, Strengths, On-Track Status)
  - Crimson Red: `#DC2626`, `#FEE2E2` (Gaps, Liabilities, High-Priority Actions)
  - Surface Tints: `#F8FAFC` (Card Backgrounds), `#EFF6FF` (Focus Panels), `#FFFFFF` (Document Paper Stock)
- **Typography**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`.
- **Contrast**: Complies with WCAG AAA for print legibility on high-resolution displays and physical printouts.

---

## 6. Maintenance & Versioning

- When modifying prompt templates in `electron-main.cjs`, verify that returned JSON matches the keys defined in Section 3.
- When adding new financial metrics or CPF account types, update both `ClientFinancialPlanView.jsx` and `generateFinancialPlanReportHtml` in `electron-main.cjs`.
- Keep this specification synchronized with any regulatory changes issued by the CPF Board or MAS.
