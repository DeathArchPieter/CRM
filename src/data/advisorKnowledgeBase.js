// Archie 2.0 Comprehensive Financial Advisory Knowledge Base & Context Engine
// Adheres strictly to Singapore MAS, CPF Board, and LIA Actuarial Frameworks

export const SINGAPORE_ACTUARIAL_BENCHMARKS = {
  cpfSums2026: {
    year: '2025–2026',
    brs: { label: 'Basic Retirement Sum (BRS)', amount: 110200, estPayout: '~S$910 – S$980 / mo', notes: 'Requires pledging property equity.' },
    frs: { label: 'Full Retirement Sum (FRS)', amount: 220400, estPayout: '~S$1,670 – S$1,790 / mo', notes: '2x BRS. Full monthly retirement income floor.' },
    ers: { label: 'Enhanced Retirement Sum (ERS)', amount: 440800, estPayout: '~S$3,300 – S$3,550 / mo', notes: 'Raised to 4x BRS in 2025 (previously 3x).' }
  },
  cpfInterestRates: [
    { account: 'Ordinary Account (OA)', baseRate: '2.50% p.a.', extraRate: '+1.0% on first $60k combined', usage: 'Housing, Education, Investment' },
    { account: 'Special Account (SA)', baseRate: '4.00% – 4.08% p.a.', extraRate: '+1.0% on first $60k combined', usage: 'Retirement (Closes at Age 55)' },
    { account: 'Retirement Account (RA)', baseRate: '4.00% – 4.08% p.a.', extraRate: '+2.0% on first $30k at age 55+', usage: 'CPF LIFE Annuity Premium' },
    { account: 'MediSave Account (MA)', baseRate: '4.00% – 4.08% p.a.', extraRate: 'Capped at BHS (S$71,500 in 2025)', usage: 'Shield Premiums, Medical bills' }
  ],
  masProtectionBenchmarks: [
    { category: 'Life & Death Cover', benchmark: '10x Gross Annual Income + Outstanding Liabilities', rationale: 'Replaces 10 years of household financial support during critical dependency years.' },
    { category: 'Total Permanent Disability (TPD)', benchmark: '10x Gross Annual Income', rationale: 'Covers long-term loss of income generation capacity plus caregiver costs.' },
    { category: 'Critical Illness (CI)', benchmark: '5x Gross Annual Income', rationale: 'LIA benchmark providing 5-year living expense replacement during recovery without working.' },
    { category: 'Early Critical Illness (ECI)', benchmark: '2x Gross Annual Income', rationale: 'Provides 2-year liquidity cushion for early-stage detection and immediate treatment leave.' },
    { category: 'Disability Income / CareShield', benchmark: '75% of Monthly Gross Income until Age 65', rationale: 'Bridges continuous monthly income shortfall if unable to perform regular occupation.' },
    { category: 'Hospitalisation (Shield Plan)', benchmark: 'Integrated Shield Plan (Private / Class A) with Co-pay Rider', rationale: 'Protects liquid savings against catastrophic inpatient, surgical, and cancer drug treatment outlays.' }
  ],
  mdrtPacingBenchmarks: {
    year: '2026',
    mdrt: { fyc: 115000, anp: 345000, title: 'Million Dollar Round Table (MDRT)', monthlyRunRate: '~S$9,583 FYC / mo' },
    cot: { fyc: 345000, anp: 1035000, title: 'Court of the Table (COT)', monthlyRunRate: '~S$28,750 FYC / mo' },
    tot: { fyc: 690000, anp: 2070000, title: 'Top of the Table (TOT)', monthlyRunRate: '~S$57,500 FYC / mo' },
    persistencyThreshold: '90.0% 13-Month Persistency Ratio required for tier-1 agency persistency bonuses.'
  }
};

// Specialized Campaign & Product Intel Benchmarks for Dynamic Archie Cheat Sheets
export const CAMPAIGN_PRODUCT_BENCHMARKS = {
  'pet': {
    id: 'pet',
    tabLabel: '🐾 Pet Healthcare Intel',
    title: 'PetCare & Veterinary Protection Intel',
    targetDemographic: 'Dog & Cat Owners, Purebred & Senior Pet Parents',
    benchmarks: [
      { category: 'Emergency Vet Consult', benchmark: 'S$150 – S$350 / visit', rationale: 'Night clinic & emergency veterinary triage fee before treatments.' },
      { category: 'Cruciate / Orthopedic Surgery', benchmark: 'S$3,500 – S$8,500 per leg', rationale: 'Common in active dogs; includes surgeon fees, implants & hospitalisation.' },
      { category: 'Foreign Body Ingestion / Torsion', benchmark: 'S$4,000 – S$7,500 emergency surgery', rationale: 'High incidence in young puppies/kittens ingesting toys or bones.' },
      { category: 'Chemotherapy & Chronic Cancer Care', benchmark: 'S$5,000 – S$12,000 / treatment cycle', rationale: 'Specialist veterinary oncology and immunotherapy protocols.' },
      { category: 'Third-Party Bite & Property Liability', benchmark: 'Up to S$500,000 coverage', rationale: 'Protects owner against legal liabilities from dog bites or public incidents.' },
      { category: 'Co-Insurance & Microchip Requirement', benchmark: '70% – 80% reimbursement with microchip', rationale: 'AVA/AVS microchipped pets qualify for standard clinical reimbursement.' }
    ],
    salesHooks: [
      'Singapore vet bill inflation runs at 15–20% p.a. A single surgical episode can erase months of liquid emergency funds.',
      'Pre-Existing Exclusion Trap: Once a pet has documented ear, skin, or joint issues, insurers permanently exclude those conditions. Enrolling early locks in full lifetime coverage.',
      'Peace of mind: Pet parents never have to make heartbreaking economic euthanasia decisions based on vet cost.'
    ],
    topObjectionRebuttal: 'Client: "My furkid is young and completely healthy." -> Advisor: "That is the single best time to lock in coverage! Pet insurance strictly excludes any pre-existing conditions. If they develop allergies or joint stiffness later, it can never be covered."'
  },
  'srs': {
    id: 'srs',
    tabLabel: '💰 SRS Tax Relief Intel',
    title: 'Supplementary Retirement Scheme (SRS) & Tax Planning',
    targetDemographic: 'Middle-to-High Income Earners (S$80k – S$250k+/yr)',
    benchmarks: [
      { category: 'Annual SRS Contribution Limit', benchmark: 'S$15,300 (Citizens/PRs) • S$35,700 (Foreigners)', rationale: 'Dollar-for-dollar personal income tax relief capped at S$80k total relief.' },
      { category: 'Tax Bracket Savings (S$120k income)', benchmark: '~S$1,760 direct cash tax reduction', rationale: 'Reduces taxable income from 11.5% marginal tax bracket down to 7%.' },
      { category: 'Tax Bracket Savings (S$200k+ income)', benchmark: '~S$2,900 – S$3,670 direct cash tax reduction', rationale: 'Saves at the top 19% to 22% marginal tax bracket.' },
      { category: '10-Year Withdrawal Concession', benchmark: '50% Tax Exemption at statutory retirement age (62/63)', rationale: 'Only 50% of annual withdrawals are subject to tax, spread over 10 years.' }
    ],
    salesHooks: [
      'Idle SRS accounts earn only 0.05% in bank interest—inflation erodes uninvested balances.',
      'Deploying SRS into guaranteed annuities or retirement endowments locks in 3.5%–4.25% compounding while securing immediate tax cuts this year.'
    ],
    topObjectionRebuttal: 'Client: "My money is locked until age 62." -> Advisor: "You get immediate 15-20% guaranteed return via tax savings this year, plus 50% tax-free withdrawals spread over 10 years at retirement."'
  },
  'cpf_sa': {
    id: 'cpf_sa',
    tabLabel: '🇸🇬 CPF Restructuring Intel',
    title: 'CPF SA Closure & Post-55 Optimization',
    targetDemographic: 'Pre-Retirees & Working Adults Aged 45–65',
    benchmarks: [
      { category: '2026 Enhanced Retirement Sum (ERS)', benchmark: 'S$440,800 (4x BRS)', rationale: 'Yields ~S$3,300 – S$3,550/month guaranteed for life under CPF LIFE.' },
      { category: 'Full Retirement Sum (FRS)', benchmark: 'S$220,400 (2x BRS)', rationale: 'Full retirement floor with ~S$1,670 – S$1,790/month guaranteed.' },
      { category: 'Retirement Account (RA) Yield', benchmark: '4.08% p.a. risk-free (+2.0% extra on first $30k)', rationale: 'Backed by Singapore Government with no market volatility.' }
    ],
    salesHooks: [
      'Post-55 SA closure flows excess funds into 2.5% OA. Top up RA to ERS to lock in 4.08% guaranteed yield.',
      'Private annuity bridges: for clients seeking liquidity before CPF LIFE payouts start at Age 65.'
    ],
    topObjectionRebuttal: 'Client: "Why not just leave money in OA at 2.5%?" -> Advisor: "RA pays 4.08% guaranteed—on S$200k, that is an extra S$3,160 risk-free income every year for life."'
  },
  'ci': {
    id: 'ci',
    tabLabel: '🛡️ CI Protection Gap Intel',
    title: 'Major & Early Critical Illness Protection',
    targetDemographic: 'Working Adults & Family Breadwinners',
    benchmarks: [
      { category: 'LIA Major CI Benchmark', benchmark: '5x Gross Annual Income', rationale: 'Replaces 5 years living expenses during full-time recovery without employment income.' },
      { category: 'Early Critical Illness (ECI)', benchmark: '2x Gross Annual Income', rationale: 'Enables 2 years immediate treatment leave without touching retirement investments.' },
      { category: 'Multi-Pay CI Claim Resets', benchmark: 'Up to 500% – 900% sum assured across life', rationale: 'Provides recurring payouts for recurrent cancer, second heart attack, or stroke.' }
    ],
    salesHooks: [
      'Singapore has a 74% CI protection gap; average coverage is under S$80k vs S$350k required.',
      'MOH Cancer Drug List (CDL) changes mean hospital plans no longer cover non-CDL treatments—lump sum CI is the vital safety net.'
    ],
    topObjectionRebuttal: 'Client: "I already have company insurance." -> Advisor: "Company coverage ends the moment you leave your job or become critically ill and cannot work. Private CI stays with you for life."'
  },
  'child_edu': {
    id: 'child_edu',
    tabLabel: '👶 Child Education Intel',
    title: 'University Tuition & Child Protection',
    targetDemographic: 'Parents with Children Aged 0–12',
    benchmarks: [
      { category: 'Singapore Local University (4-Yr)', benchmark: 'S$35,000 – S$50,000 tuition + living', rationale: 'NUS/NTU/SMU 4-year degree fees with 3% inflation.' },
      { category: 'Overseas University (UK/Australia)', benchmark: 'S$180,000 – S$260,000 total', rationale: 'Tuition, accommodation, living expenses and currency exchange cushion.' },
      { category: 'Payor Premium Waiver', benchmark: '100% of future premiums waived', rationale: 'Guarantees the child receives the full university fund even if the parent passes away or becomes disabled.' }
    ],
    salesHooks: [
      'Education inflation outpaces general CPI at 3.5%–5% annually.',
      'Dollar-cost averaging into a dedicated education plan removes stock market volatility before matriculation year.'
    ],
    topObjectionRebuttal: 'Client: "I will just invest in stocks for my child." -> Advisor: "Stocks can drop 30% right in the year your child enters university. An education plan with payor waiver guarantees the fund is 100% secure no matter what happens."'
  },
  'disability': {
    id: 'disability',
    tabLabel: '♿ Disability Income Intel',
    title: 'CareShield Life & Disability Income Booster',
    targetDemographic: 'Working Adults Aged 30+',
    benchmarks: [
      { category: 'CareShield Life Base Payout', benchmark: 'S$600 – S$650/month (Requires 3 of 6 ADLs)', rationale: 'Basic national safety net for severe, permanent disability.' },
      { category: 'Private CareShield Supplement', benchmark: 'Up to S$5,000/month (Triggers at 1 or 2 ADLs)', rationale: 'Replaces actual monthly living expenses with early benefit triggers.' },
      { category: 'MediSave Usage Cap', benchmark: 'S$600 per calendar year from MediSave', rationale: 'Pay premiums with pre-existing MediSave balance without cash outlay.' }
    ],
    salesHooks: [
      'Basic CareShield Life is not enough to cover caregiver costs (S$1,800–S$3,000/mo) or replace lost salary.',
      'Upgrading with MediSave requires S$0 out-of-pocket cash for most age tiers.'
    ],
    topObjectionRebuttal: 'Client: "Government already provides CareShield Life." -> Advisor: "Basic CareShield only pays S$600/month and requires 3 severe ADL disabilities. A supplement pays up to S$5,000/mo and triggers at just 1 ADL disability, fully payable via MediSave."'
  }
};

export const ADVISOR_SCRIPTS_AND_OBJECTIONS = [
  // Pet Insurance Scripts
  {
    category: 'Pet Healthcare & Outreach',
    question: 'How to open a warm WhatsApp conversation with a pet owner?',
    script: "Hey [Name], saw your adorable furkid [Pet Name] on your story—so cute! Quick question: with all the recent vet fee adjustments in SG, did you manage to get [Pet Name] covered for vet & surgical emergencies? A lot of pet parents don't realize insurance can reimburse up to 80% of major vet bills!",
    keywords: ['pet', 'petcare', 'happy tails', 'vet', 'dog', 'cat', 'furkid', 'pet insurance', 'veterinary']
  },
  {
    category: 'Pet Healthcare & Outreach',
    question: 'Pet owner says: "My pet is young and healthy, no need insurance yet."',
    script: "That's actually the exact right time! Once pets develop skin allergies, ear infections, or joint issues as they grow, insurers permanently exclude those conditions. Locking in clean coverage while they are young ensures 80% of all future unexpected surgeries and vet bills are covered for life.",
    keywords: ['pet healthy', 'young dog', 'pet objection', 'pre-existing pet', 'vet bills']
  },
  {
    category: 'Pet Healthcare & Outreach',
    question: 'Pet owner says: "Pet insurance is too expensive / I will just pay out of pocket."',
    script: "A single cruciate ligament surgery or emergency endoscopy in Singapore easily costs S$4,000 to S$8,000 today. For about S$1.50 to S$2.50 a day, pet insurance covers up to S$10,000/year in vet bills plus S$500,000 in third-party liability if they accidentally bite or damage property in public.",
    keywords: ['pet cost', 'vet expensive', 'pet surgery', 'third party liability pet']
  },
  // SRS & Tax Relief Scripts
  {
    category: 'Tax & SRS Planning',
    question: 'How to pitch SRS tax relief before December 31?',
    script: "Hey [Name], quick heads up on year-end tax planning! Did you know contributing up to S$15,300 to your SRS account legally cuts your personal income tax by up to S$2,000–S$3,500 this year? Instead of leaving it in 0.05% cash, we can deploy it into a guaranteed retirement annuity to compound at 4% tax-deferred.",
    keywords: ['srs', 'tax relief', 'year end tax', 'december tax', 'srs top up', 'income tax']
  },
  // Child Education Scripts
  {
    category: 'Child Education & Family',
    question: 'How to initiate an education savings conversation with young parents?',
    script: "Hey [Name], hope [Child's Name] is doing great! Was reviewing university funding benchmarks recently—a 4-year degree in Singapore is projected to hit S$45k–S$60k, and overseas is S$220k+. Have you set up a dedicated education fund with parent payor waiver so the university fund is 100% guaranteed no matter what happens?",
    keywords: ['child education', 'university fund', 'payor waiver', 'kids savings', 'tuition']
  },
  // Disability & CareShield Scripts
  {
    category: 'Disability & CareShield',
    question: 'How to explain upgrading CareShield Life with S$0 cash outlay?',
    script: "Under Singapore CareShield Life, you can use up to S$600/year from your CPF MediSave (zero cash outlay) to upgrade your monthly payout from S$600 to up to S$2,500–S$3,500/month, and trigger benefits at just 1 or 2 ADLs instead of 3 severe disabilities. Let's do a 5-minute MediSave review!",
    keywords: ['careshield', 'disability income', 'medisave srs', 'adl', 'caregiver']
  },
  // CPF LIFE & Retirement
  {
    category: 'CPF LIFE & Retirement',
    question: 'How do I explain the 2025 CPF Special Account (SA) closure to clients?',
    script: "When you turn 55, CPF transfers your SA savings up to the Full Retirement Sum (S$220,400) into your new Retirement Account (RA), earning 4.08% p.a. Any remaining SA balance now flows into your Ordinary Account (OA) earning 2.5%. To keep earning 4.08% risk-free, you can top up your RA up to the new Enhanced Retirement Sum (ERS: S$440,800), giving you up to ~S$3,300/month guaranteed for life!",
    keywords: ['cpf sa closure', 'age 55', 'ers', 'ra top up', 'retirement sum', 'cpf life']
  },
  {
    category: 'CPF LIFE & Retirement',
    question: 'What is the difference between CPF LIFE Standard, Escalating, and Basic plans?',
    script: "Standard Plan gives level, predictable payouts. Escalating Plan starts ~20% lower but grows by +2% every year for life to beat inflation. Basic Plan gives lower monthly payouts but leaves the largest bequest for children. For clients concerned about longevity and inflation, the Escalating plan is actuarially superior.",
    keywords: ['cpf life standard', 'escalating', 'basic plan', 'cpf comparison', 'inflation']
  },
  {
    category: 'Protection & CI Gaps',
    question: 'Client says: "I already have company group insurance and MediShield Life."',
    script: "Company insurance is tied to your employment—the moment you change jobs, retire, or fall critically ill and cannot work, the coverage terminates when you need it most. MediShield Life only covers hospital room and board; it does not replace your lost S$8,000/month salary or pay for living expenses when recovering from Early CI at home.",
    keywords: ['company insurance', 'medishield life', 'corporate coverage', 'why private insurance']
  },
  {
    category: 'Protection & CI Gaps',
    question: 'Client says: "I will invest the money in stocks or crypto instead of buying insurance."',
    script: "Investing creates wealth, but insurance preserves it. If a major health event or disability happens next year, liquidating investments during a market downturn can destroy 10 years of compounding. Insurance acts as your financial firewall, protecting your core investment portfolio from being wiped out by medical shocks.",
    keywords: ['buy term invest the rest', 'crypto', 'invest in stocks', 'insurance returns']
  },
  {
    category: 'Claims & Reconciliation',
    question: 'How do I explain an insurer claim deduction or co-pay variance to a client?',
    script: "Under Singapore MOH regulations, all Integrated Shield riders have a minimum 5% co-payment with an annual cap (usually S$3,000/year at panel doctors). Any variance between the clinic bill and insurer payment usually comes from this mandatory co-pay or non-claimable items like administrative fees or specialty consumables.",
    keywords: ['claim shortfall', 'co-payment', 'variance', 'hospital bill', 'deductible']
  },
  {
    category: 'Prospecting & Warm Outreach',
    question: 'How to reconnect with a warm Project 100 contact after a long time?',
    script: "Hey [Name], was just thinking of you! Saw your recent update on [Event/Milestone]—huge congratulations! It's been a while since we caught up. Let's grab coffee this week or next, would love to hear how everything is going on your side!",
    keywords: ['project 100', 'warm approach', 'icebreaker', 'reconnection', 'whatsapp opener']
  },
  {
    category: 'Referrals & Reviews',
    question: 'How to ask for referrals smoothly after presenting a 6-Page Financial Blueprint?',
    script: "I'm glad this 6-page roadmap gave you clarity on your CPF LIFE and retirement milestones, [Name]. Much of my practice is built by word of mouth. Who are 2 close friends or colleagues who are also planning for their family's future that you think would benefit from a holistic review like this?",
    keywords: ['referral script', 'ask for referrals', 'post meeting', 'review']
  }
];

export const CONTEXT_PLAYBOOKS = {
  // 1. Executive Dashboard
  'dashboard': {
    title: 'Executive Advisory Dashboard',
    tagline: 'Your Daily Practice Command Center',
    badge: 'Morning Briefing',
    greeting: "Review your morning AI briefing, upcoming client milestones, and track your monthly MDRT pace against 2026 agency targets.",
    checklist: [
      'Read the AI Morning Briefing for key client life events and market signals.',
      'Review Upcoming Client Milestones (birthdays & 30-day policy renewals).',
      'Check Month-to-Date issued FYC pacing vs monthly MDRT run-rate target (S$9,583/mo).',
      'Press Ctrl + K to instantly search clients or jump to any section.'
    ],
    proTip: 'Quickly message clients on their birthday directly via WhatsApp from the Upcoming Milestones card.',
    quickActions: [
      { id: 'goto-clients', label: '👥 View Clients Hub', tab: 'clients' },
      { id: 'goto-schedule', label: '📅 Open Schedule', tab: 'schedule' },
      { id: 'goto-pipeline', label: '💼 Pipeline Kanban', tab: 'pipeline' }
    ]
  },

  // 2. Schedule & Calendar Hub
  'schedule': {
    title: 'Schedule & Calendar Hub',
    tagline: 'Two-Way Google Calendar Synchronization',
    badge: 'Time-Blocking',
    greeting: "Keep your advisory appointments synchronized! CRM tasks with scheduled times integrate with your Google Calendar.",
    checklist: [
      'Connect Google Calendar in Settings or click "Sync with Google".',
      'Add client consultation appointments with address autocomplete to create Google Calendar events.',
      'Filter tasks by Due Today, Overdue, or Completed.',
      'Completed tasks update status across both the CRM and Google Calendar.'
    ],
    proTip: 'Color-coded grape/purple events in Google Calendar represent synchronized Beetsma CRM tasks!',
    quickActions: [
      { id: 'goto-settings-google', label: '⚙️ Google Sync Settings', tab: 'settings' }
    ]
  },

  // 3. Clients Directory Index
  'clients': {
    title: 'Client 360 & Registry',
    tagline: 'Institutional Client Management',
    badge: 'Directory View',
    greeting: "Manage your client base, filter by high-value segments (VIP, HNW, Young Family), and generate institutional 6-page PDF blueprints.",
    checklist: [
      'Use the Tag Filter chips (VIP, HNW, Doctor, Tech, Young Family) to segment campaigns.',
      'Click "+ Add Client" to onboard new clients with OneMap Singapore address autocomplete.',
      'Click on any client to open their Hybrid Tabbed Workspace or Financial Blueprint.',
      'Press Ctrl + K to fuzzy search any client instantly by name or email.'
    ],
    proTip: 'Tagging clients by life-stage allows 1-click batch audience enrollment in Outreach Campaigns!',
    quickActions: [
      { id: 'goto-campaigns', label: '🚀 Outreach Campaigns', tab: 'special-projects' }
    ]
  },

  // 4. Client Profile - Overview Tab
  'client_overview': {
    title: 'Client Profile: Overview & Activity',
    tagline: 'Demographics, Remarks & Tasks',
    badge: 'Client 360',
    greeting: "Review client demographics, net worth snapshot, AI advisory notes, and schedule upcoming meetings.",
    checklist: [
      'Verify client DOB, contact details, and registered Singapore address.',
      'Review the Financial Blueprint summary card (Net Worth, Savings Rate, Retirement Age).',
      'Read the Consultant Remarks and Gemini AI Advisor Guidance for consultative talking points.',
      'Schedule follow-up tasks and sync appointments with Google Calendar.'
    ],
    proTip: 'Click "Open Financial Blueprint" in the top header to enter the full 5-tab actuarial projections workspace.',
    quickActions: [
      { id: 'trigger-financial-plan', label: '🏛️ Open Financial Blueprint', action: 'openFinancialPlan' },
      { id: 'trigger-pre-meeting-brief', label: '📋 90-Day Pre-Meeting Brief', action: 'openPreMeetingBrief' }
    ]
  },

  // 5. Client Profile - Policies & Claims Tab
  'client_policies': {
    title: 'Client Profile: Policy Portfolio & Claims',
    tagline: 'Coverage Audit & Reconciliation Hub',
    badge: 'Vault & Audit',
    greeting: "Inspect active insurance policies, toggle between Cards and Table view, check MediSave splits, and audit claims.",
    checklist: [
      'Switch between Cards View and Horizontal Table View to inspect policy coverage pills.',
      'Check MediSave vs Cash outlay splits on Integrated Shield policies.',
      'Inspect Policy Remarks for special riders, nomination status, or exclusion clauses.',
      'Monitor active claims for outstanding hospital bills or settlement variances.'
    ],
    proTip: 'Use the Claim AI Copilot to automatically reconcile insurer settlement letters against itemized hospital receipts.',
    quickActions: [
      { id: 'trigger-add-policy', label: '+ Add Policy', action: 'addPolicy' },
      { id: 'trigger-add-claim', label: '+ File New Claim', action: 'addClaim' }
    ]
  },

  // 6. Client Profile - AI Dossier & Social Intel Tab
  'client_ai_dossier': {
    title: 'Client Profile: 360° AI Dossier & Social Intel',
    tagline: 'Multi-Platform Grounding & Icebreakers',
    badge: 'Gemini AI',
    greeting: "Synthesize public career updates, lifestyle triggers, and life events into ready-to-use WhatsApp and LinkedIn icebreakers.",
    checklist: [
      'Click "Run Social Discovery" to verify client profiles across LinkedIn, Instagram, and news.',
      'Review Life Stage Triggers (promotions, marriage, newborn, property purchase).',
      'Generate a 90-Day Pre-Meeting Intelligence Brief before consultative meetings.',
      'Copy customized 3-tone icebreaker scripts for WhatsApp or LinkedIn.'
    ],
    proTip: 'Session cookies persist in secure storage, allowing seamless offscreen browser scans without re-logging in.',
    quickActions: [
      { id: 'trigger-social-discovery', label: '🔍 Run Social Discovery', action: 'runSocialDiscovery' },
      { id: 'trigger-pre-meeting-brief', label: '✨ Generate 90-Day Brief', action: 'openPreMeetingBrief' }
    ]
  },

  // 7. Client Profile - Family & Documents Tab
  'client_family': {
    title: 'Client Profile: Household & Documents',
    tagline: 'Multi-Generational Wealth & Vault Links',
    badge: 'Family Office',
    greeting: "Link spouses and children to aggregate combined household net worth and link secure document vaults.",
    checklist: [
      'Link family members (Spouse, Child, Parent) to calculate combined household protection.',
      'Add cloud storage URLs or local file links to client wills, trust documents, or policy PDFs.',
      'Use 1-click jump to navigate directly to linked family member profiles.'
    ],
    proTip: 'Linking children highlights upcoming tertiary education funding milestones in the Financial Blueprint.'
  },

  // 8. Financial Blueprint - Balance Sheet & Net Worth (Tab 1)
  'blueprint_net_worth': {
    title: 'Financial Blueprint: Balance Sheet & Net Worth',
    tagline: 'Singapore CPF & Asset Class Breakdown',
    badge: 'Balance Sheet',
    greeting: "Enter client liquid cash, investments, CPF OA/SA/RA/MA, SRS, and liabilities. Derived runway metrics update in real-time.",
    checklist: [
      'Input Liquid Cash and Monthly Living Expenses to calculate Emergency Buffer Months (target: 6+ mos).',
      'Breakdown CPF accounts: OA (2.5%), SA (4.08%), RA (4.08%), MA (4.08%), and tax-deferred SRS.',
      'Record Property Equity and Outstanding Mortgages / Liabilities.',
      'Verify Savings Rate % and Net Monthly Cash Surplus Velocity.'
    ],
    proTip: 'The Singapore SRS limit is S$15,300/yr for citizens/PRs (S$35,700 for foreigners), providing direct income tax relief.',
    quickActions: [
      { id: 'goto-cpf-playbook', label: '📖 CPF LIFE Playbook', action: 'openCpfPlaybook' }
    ]
  },

  // 9. Financial Blueprint - CPF LIFE & Retirement Runway (Tab 2)
  'blueprint_cpf_life': {
    title: 'Financial Blueprint: Retirement & CPF LIFE',
    tagline: 'Capital Accumulation & Decumulation Runway',
    badge: 'Actuarial Projection',
    greeting: "Simulate lifetime capital growth (Ages 25–90+), project peak nest egg, and test CPF LIFE BRS/FRS/ERS payout tiers.",
    checklist: [
      'Set Current Age, Target Retirement Age, and Life Expectancy (Singapore avg: 85–88).',
      'Select CPF LIFE Sum Tier (BRS S$110.2k, FRS S$220.4k, ERS S$440.8k) to calculate guaranteed income floor.',
      'Switch between Standard (level), Escalating (+2%/yr inflation hedge), and Basic plans.',
      'Click "Graph Breakdown & AI Audit" for automated actuarial formulas and risk audits.'
    ],
    proTip: 'Deferring CPF LIFE payout commencement from Age 65 to Age 70 increases monthly payouts by up to +35% (+7%/year)!',
    quickActions: [
      { id: 'trigger-graph-breakdown', label: '✨ AI Graph Breakdown', action: 'openGraphBreakdown' },
      { id: 'trigger-cpf-playbook', label: '🇸🇬 CPF LIFE Advisor Playbook', action: 'openCpfPlaybook' }
    ]
  },

  // 10. Financial Blueprint - Protection Gap Matrix (Tab 3)
  'blueprint_protection': {
    title: 'Financial Blueprint: Protection Gap Matrix',
    tagline: 'MAS Benchmark vs In-Force Coverage Audit',
    badge: 'MAS Framework',
    greeting: "Auto-aggregates all in-force CRM policies to audit Death, TPD, Early CI, Major CI, and Disability Income against MAS benchmarks.",
    checklist: [
      'Verify 10x Annual Income Death/TPD coverage against mortgage liabilities.',
      'Check 5x Major CI and 2x Early CI benchmarks (Singapore average CI recovery window: 3–5 years).',
      'Ensure 75% Disability Income / CareShield Life booster is active.',
      'Confirm client has Integrated Shield Plan with Co-pay rider for catastrophic medical bills.'
    ],
    proTip: 'In-force policies from the client record automatically populate into this matrix without manual re-typing!'
  },

  // 11. Financial Blueprint - Life Event Stress Testing (Tab 4)
  'blueprint_simulator': {
    title: 'Financial Blueprint: Life Event Stress-Tester',
    tagline: 'Dynamic What-If Capital Shocks',
    badge: 'Stress-Testing',
    greeting: "Stress-test client capital runway against major life milestones, market downturns (-30%), and health shocks.",
    checklist: [
      'Toggle preset events: Property Upgrade, Critical Illness Shock, Child University Fund, Pre-Retirement Market Shock (-30%).',
      'Customize Lump Sum Outlay ($) and Monthly Cashflow Impact ($/mo) for each scenario.',
      'Observe the red stress-tested curve on the chart to identify capital depletion age gates.'
    ],
    proTip: 'Activating a CI shock with in-force CI coverage demonstrates how insurance payouts preserve retirement solvency.'
  },

  // 12. Financial Blueprint - 6-Page Institutional PDF Dossier (Tab 5)
  'blueprint_pdf': {
    title: 'Financial Blueprint: Institutional PDF Dossier',
    tagline: 'CFP® / ChFC® Standard White-Paper Report',
    badge: 'Publication Grade',
    greeting: "Generate an institutional, publication-grade 6-page A4 PDF client dossier branded with your credentials.",
    checklist: [
      'Select Advisory Focus Domain (Holistic 360°, FIRE Strategy, Risk Protection, CPF & Estate).',
      'Click "Generate AI Summary" for institutional diagnostic scorecards and client talking points.',
      'Click "Preview Client Document" to inspect formatting and embedded SVG charts.',
      'Click "Export Client PDF Document" to generate the final client deliverable.'
    ],
    proTip: 'All 6 pages automatically incorporate your consultant name, credentials, and MAS Rep No. configured in Settings.',
    quickActions: [
      { id: 'trigger-preview-pdf', label: '👁️ Preview PDF Dossier', action: 'previewPdf' },
      { id: 'trigger-export-pdf', label: '📄 Export PDF Dossier', action: 'exportPdf' }
    ]
  },

  // 13. Special Projects - Campaign Hub
  'special_projects_hub': {
    title: 'Special Projects & Campaign Hub',
    tagline: 'Outreach Initiatives & AI Playbook Copilot',
    badge: 'Campaign Center',
    greeting: "Launch Singapore advisory campaigns, scan insurer brochures with Gemini Multimodal Vision, and track Cross-Initiative ROI.",
    checklist: [
      'Browse pre-built templates: AIA Protect 3, SRS Tax Relief, CPF SA Closure, Child Education, CareShield Booster.',
      'Upload brochure PDFs/images into the Multimodal Scanner to auto-extract product USPs and objection scripts.',
      'Open Project 100 to prioritize prospecting contacts using the N.A.S.T matrix.',
      'Track aggregate Campaign ANP, FYC, and Appointments Booked in the top metric bar.'
    ],
    proTip: 'Uploading a product brochure auto-generates 3-step WhatsApp outreach sequences tailored to Singapore demographics.',
    quickActions: [
      { id: 'goto-project100', label: '🌟 Open Project 100', action: 'openProject100' }
    ]
  },

  // 14. Project 100 Detail
  'project_100': {
    title: 'Project 100: Contact Ranking & AI Copilot',
    tagline: 'N.A.S.T Matrix & 1-Click Porting',
    badge: 'Prospecting Engine',
    greeting: "Score contacts on Need, Accessibility, Savings, and Trust. Generate tailored WhatsApp icebreakers and port leads to Core Clients.",
    checklist: [
      'Score contacts from 1 to 5 on N (Need), A (Accessibility), S (Savings), and T (Trust).',
      'Sort by Total Score (Max 20 pts) to focus on 4★ and 5★ high-converting prospects.',
      'Click "AI Approach" to generate 3 personalized WhatsApp openers (Casual, Life Stage, Direct Value).',
      'Click "👤 Port to Client" or "💼 Deal" to convert prospects directly into active CRM pipelines.',
      'Import bulk contacts via CSV or phone .vcf files.'
    ],
    proTip: 'Contacts with high Trust (4-5★) and high Need convert 3x faster with Life Stage Review openers!',
    quickActions: [
      { id: 'trigger-add-contact', label: '+ Add Contact', action: 'addContact' },
      { id: 'trigger-bulk-import', label: '📥 Bulk Import CSV/VCF', action: 'bulkImport' }
    ]
  },

  // 15. Outreach Campaign Detail - Targets Tab
  'outreach_campaign_targets': {
    title: 'Outreach Campaign: Targets & WhatsApp Cadence',
    tagline: 'Audience Segmentation & 1-Click Messaging',
    badge: 'Execution Hub',
    greeting: "Filter smart target audiences, copy 3-step WhatsApp scripts, launch direct WhatsApp chats, and book appointments.",
    checklist: [
      'Use Smart Filters to enroll: Clients with No CI, Shield-Only Clients, High Earners ($80k+), or Project 100 leads.',
      'Progress targets through Stages: 1. Soft Opener -> 2. Brochure -> 3. Objection Handled -> 4. Appt Booked -> 5. Case Closed.',
      'Click "wa.me" to launch pre-filled WhatsApp conversations in 1 click.',
      'Advancing to "Appt Booked" prompts appointment scheduling with OneMap address & Google Calendar sync.'
    ],
    proTip: 'Advancing a deal to "Case Closed" automatically records Case Issued in your Pipeline and updates MDRT pacing!'
  },

  // 16. Outreach Campaign Detail - Playbook & Objections Tab
  'outreach_campaign_playbook': {
    title: 'Outreach Campaign: Playbook & Objections Hub',
    tagline: 'Field-Tested Singapore Scripts',
    badge: 'Scripts & Objections',
    greeting: "Review the 3-Step WhatsApp sequence, daily outreach cadence checklist, and Singapore-specific objection handling scripts.",
    checklist: [
      'Study Step 1 (Curiosity Hook), Step 2 (Brochure & USP Drop), and Step 3 (Low-Friction Meeting Close).',
      'Review objection responses for: "Already have coverage", "Need to think", and "No budget".',
      'Follow the 4-Day Outreach Cadence for optimal response rates.'
    ],
    proTip: 'Never send a heavy PDF brochure in Step 1. First secure permission with a short 2-sentence curiosity opener.'
  },

  // 17. Outreach Campaign Detail - Funnel Analytics Tab
  'outreach_campaign_analytics': {
    title: 'Outreach Campaign: Funnel Analytics & ROI',
    tagline: 'Conversion Velocity & Production Scorecard',
    badge: 'Analytics',
    greeting: "Analyze stage drop-off conversion rates, generated ANP/FYC volume, and export campaign scorecards for agency reporting.",
    checklist: [
      'Inspect stage conversion drop-offs from Contacted -> Replied -> Appt Booked -> Case Closed.',
      'Track Campaign Return on Time (Total FYC / Total Hours Invested).',
      'Click "Copy Scorecard" or "Export CSV" for management or agency meetings.'
    ]
  },

  // 18. Pipeline & Deal Flow
  'pipeline': {
    title: 'Pipeline & Deal Flow',
    tagline: 'Kanban Sales Funnel & Weighted Revenue',
    badge: 'ANP & FYC Funnel',
    greeting: "Track active insurance and wealth opportunities across stages from Initial Discovery to Case Issued.",
    checklist: [
      'Drag and drop deal cards across stages: Prospect -> Fact Finding -> Proposal Sent -> Case Submitted -> Case Issued.',
      'Toggle "Weighted Expected FYC" to view probability-discounted revenue forecasts.',
      'Moving a deal to "Case Issued" automatically updates your MDRT pacing and remuneration records.',
      'Use Ctrl + K to jump directly to any active deal.'
    ],
    proTip: 'Keep Fact Finding deals under 14 days old to maintain high conversion momentum.',
    quickActions: [
      { id: 'goto-sales', label: '🏆 Sales & MDRT Command', tab: 'sales' }
    ]
  },

  // 19. Sales & MDRT Command Center
  'sales': {
    title: 'Sales & Production Command Center',
    tagline: 'MDRT, COT & TOT Pacing Thermometer',
    badge: 'Production Metrics',
    greeting: "Track Year-to-Date issued FYC against Singapore MDRT milestones, monitor persistency bonuses, and analyze product mix.",
    checklist: [
      'Monitor your MDRT Pacing Thermometer (Target: S$115,000 FYC) and required monthly run-rate.',
      'Track 13-month Persistency Ratio (Target: >90%) to protect tier-1 persistency bonuses.',
      'Analyze Monthly Production Velocity (SVG bar chart) across Q1–Q4.',
      'Review Product Revenue Mix across Whole Life, ILP, CI, and Annuities.'
    ],
    proTip: 'Maintaining a balanced product mix (Whole Life + CI + Annuities) provides consistent multi-year renewal streams.',
    quickActions: [
      { id: 'goto-remuneration', label: '💰 Remuneration Engine', tab: 'remuneration' }
    ]
  },

  // 20. Remuneration Engine
  'remuneration': {
    title: 'Remuneration & Reverse Goal Planner',
    tagline: 'Tiered Commission Matrix & Income Planning',
    badge: 'Earnings Engine',
    greeting: "Calculate tiered commission payouts, sync live Q1-Q4 FYC from your pipeline, and reverse-engineer your target annual income.",
    checklist: [
      'Click "Sync from Pipeline" to auto-aggregate closed case FYC from the CRM database.',
      'Use the Reverse Goal Planner: input your desired net annual income (e.g. S$180,000) to calculate required monthly cases.',
      'Review tiered commission schedules across Life, CI, Savings, and General insurance.'
    ],
    proTip: 'Factor in 13th-month persistency bonuses when calculating net annual take-home income.'
  },

  // 21. Special Reports
  'special_reports': {
    title: 'Special Actuarial Reports & Simulations',
    tagline: 'CPF LIFE & Longevity Models',
    badge: 'Actuarial Lab',
    greeting: "Access executive-level actuarial simulations, including CPF LIFE Escalating vs Standard plan projections and tax models.",
    checklist: [
      'Select a client and simulation model (CPF LIFE, Retirement Runway, Estate Distribution).',
      'Adjust inflation assumptions (2.5%–4.0%) and pre/post-retirement yields.',
      'Export high-resolution charts for client presentations.'
    ]
  },

  // 22. Product Analyser
  'product_analysis': {
    title: 'Product & Policy Analyser',
    tagline: 'Side-by-Side Policy Matrix',
    badge: 'Comparison Engine',
    greeting: "Compare policy terms, surrender value trajectories, and early CI definitions across Singapore insurers.",
    checklist: [
      'Select two or more policies to compare coverage terms and exclusions side-by-side.',
      'Analyze illustrated yields at 3.00% and 4.25% MAS standardized projection rates.',
      'Highlight product USPs and riders during consultative sessions.'
    ]
  },

  // 23. Practice & Consultant Settings
  'settings': {
    title: 'Practice & Advisor Settings',
    tagline: 'Consultant Branding & Silent Auto-Updates',
    badge: 'System & Branding',
    greeting: "Configure your MAS Representative particulars, PDF blueprint branding, actuarial defaults, Gemini AI key, and auto-updates.",
    checklist: [
      'Enter your Consultant Name, Title, and MAS Rep No. to dynamically brand all client PDF blueprints.',
      'Select your Professional Designations (CFP®, ChFC®, CFA®, CLU®, MDRT).',
      'Set default actuarial inflation (3.0%) and retirement age (62).',
      'Verify Google Calendar OAuth connection and Gemini API Key.',
      'Check for updates under Application Updates (supports seamless 1-click inline background updates).'
    ],
    proTip: 'Configured credentials and disclaimers automatically brand all exported 6-page institutional dossiers.',
    quickActions: [
      { id: 'trigger-save-settings', label: '💾 Save Settings', action: 'saveSettings' }
    ]
  }
};

/**
 * Intelligent context resolver that maps active application state to the best matching playbook.
 */
export function resolveContextGuide(contextState) {
  const { section, subSection, activeSubTab, entityContext } = contextState || {};

  // 1. Client Sub-View Resolution
  if (section === 'clients') {
    if (subSection === 'financial-plan') {
      if (activeSubTab === 'balance-sheet') return CONTEXT_PLAYBOOKS.blueprint_net_worth;
      if (activeSubTab === 'retirement') return CONTEXT_PLAYBOOKS.blueprint_cpf_life;
      if (activeSubTab === 'protection') return CONTEXT_PLAYBOOKS.blueprint_protection;
      if (activeSubTab === 'simulator') return CONTEXT_PLAYBOOKS.blueprint_simulator;
      if (activeSubTab === 'blueprint') return CONTEXT_PLAYBOOKS.blueprint_pdf;
      return CONTEXT_PLAYBOOKS.blueprint_net_worth;
    }

    if (subSection === 'client-profile') {
      const clientName = entityContext?.clientName || 'Client';
      const baseGuide = activeSubTab === 'policies' ? CONTEXT_PLAYBOOKS.client_policies :
                        activeSubTab === 'ai-dossier' ? CONTEXT_PLAYBOOKS.client_ai_dossier :
                        activeSubTab === 'family' ? CONTEXT_PLAYBOOKS.client_family :
                        CONTEXT_PLAYBOOKS.client_overview;
      return {
        ...baseGuide,
        title: `${clientName} • ${baseGuide.title.split(': ')[1] || baseGuide.title}`,
        tagline: `${clientName}'s 360° Profile • ${baseGuide.tagline}`
      };
    }

    return CONTEXT_PLAYBOOKS.clients;
  }

  // 2. Special Projects & Outreach Campaign Resolution
  if (section === 'special-projects' || section === 'special_projects') {
    if (subSection === 'project-100') return CONTEXT_PLAYBOOKS.project_100;
    if (subSection === 'outreach-campaign') {
      const campaignTitle = entityContext?.campaignTitle || 'Outreach Campaign';
      const productName = entityContext?.productName || 'Advisory Plan';
      const titleLower = `${campaignTitle} ${productName}`.toLowerCase();

      // Detect specific campaign domain
      let specializedGreeting = null;
      let specializedProTip = null;
      let specializedBadge = 'Active Campaign';
      let keyAngle = 'pet';

      if (titleLower.includes('pet') || titleLower.includes('vet') || titleLower.includes('furkid') || titleLower.includes('happy tails')) {
        specializedBadge = '🐾 PetCare Playbook';
        keyAngle = 'pet';
        specializedGreeting = `Campaign: "${campaignTitle}". Target dog and cat owners with veterinary inflation angles (15-20%/yr), emergency surgery costs (S$4k-S$8k), and pre-existing exclusion urgency.`;
        specializedProTip = 'Always ask for the furkid\'s name and breed first! Pet parents respond warmly to personalized inquiries about their dog/cat\'s breed predispositions.';
      } else if (titleLower.includes('srs') || titleLower.includes('tax')) {
        specializedBadge = '💰 SRS Tax Playbook';
        keyAngle = 'srs';
        specializedGreeting = `Campaign: "${campaignTitle}". Target middle-to-high earners with immediate year-end tax deduction relief (up to S$15,300 contribution) and guaranteed retirement yield.`;
        specializedProTip = 'Frame SRS not as "locking up money", but as receiving an immediate guaranteed 11.5%–20% return via direct income tax savings this year!';
      } else if (titleLower.includes('cpf') || titleLower.includes('sa closure') || titleLower.includes('age 55')) {
        specializedBadge = '🇸🇬 CPF Restructuring';
        keyAngle = 'cpf_sa';
        specializedGreeting = `Campaign: "${campaignTitle}". Guide pre-retirees through the 2025 CPF SA closure rules, SA-to-RA ERS top-ups (4.08% p.a. guaranteed), and post-55 private annuity bridges.`;
        specializedProTip = 'Highlight that topping up RA to the Enhanced Retirement Sum (ERS S$440,800) secures ~S$3,300/month guaranteed for life backed by the Singapore Government.';
      } else if (titleLower.includes('child') || titleLower.includes('edu') || titleLower.includes('junior')) {
        specializedBadge = '👶 Child Education';
        keyAngle = 'child_edu';
        specializedGreeting = `Campaign: "${campaignTitle}". Assist parents in building guaranteed university tuition funds with payor premium waiver protection.`;
        specializedProTip = 'Emphasize the payor waiver: if the parent passes away or suffers total disability, all remaining premiums are waived and the child receives the full university fund at age 21.';
      } else if (titleLower.includes('disability') || titleLower.includes('careshield')) {
        specializedBadge = '♿ CareShield Booster';
        keyAngle = 'disability';
        specializedGreeting = `Campaign: "${campaignTitle}". Show clients how to upgrade basic CareShield Life ($600/mo) up to $5,000/mo with $0 cash outlay using S$600/yr from MediSave.`;
        specializedProTip = 'Focus on the ADL gap: CareShield requires 3 severe ADLs, whereas private supplements pay out at just 1 or 2 ADLs!';
      } else if (titleLower.includes('ci') || titleLower.includes('protect') || titleLower.includes('critical')) {
        specializedBadge = '🛡️ CI Protection';
        keyAngle = 'ci';
        specializedGreeting = `Campaign: "${campaignTitle}". Address the 74% Singapore CI protection gap with early-stage lump-sum payouts and multi-pay reset features.`;
        specializedProTip = 'Remind clients that MOH Cancer Drug List (CDL) reforms make private lump-sum CI cash essential for non-formulary cancer therapies.';
      }

      const basePlaybook = activeSubTab === 'playbook' ? CONTEXT_PLAYBOOKS.outreach_campaign_playbook :
                           activeSubTab === 'analytics' ? CONTEXT_PLAYBOOKS.outreach_campaign_analytics :
                           CONTEXT_PLAYBOOKS.outreach_campaign_targets;

      return {
        ...basePlaybook,
        title: `${campaignTitle}`,
        tagline: `${productName} • ${basePlaybook.tagline}`,
        badge: specializedBadge,
        campaignKey: keyAngle,
        greeting: specializedGreeting || `Campaign: "${campaignTitle}". ${basePlaybook.greeting}`,
        proTip: specializedProTip || basePlaybook.proTip,
        checklist: basePlaybook.checklist
      };
    }
    return CONTEXT_PLAYBOOKS.special_projects_hub;
  }

  // 3. Normalized Top-Level Section Mapping
  const normalizedSection = (section || 'dashboard').replace(/-/g, '_');
  if (CONTEXT_PLAYBOOKS[normalizedSection]) {
    return CONTEXT_PLAYBOOKS[normalizedSection];
  }
  if (CONTEXT_PLAYBOOKS[section]) {
    return CONTEXT_PLAYBOOKS[section];
  }

  return CONTEXT_PLAYBOOKS.dashboard;
}
