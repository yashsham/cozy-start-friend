// DEMO DATA ONLY. Illustrative records used to demonstrate layouts and interactions.
// None of this is verified research. Replace via the services layer when the backend is connected.
import type {
  AgentDefinition, AgentRun, BusinessProfile, BuyingSignal, Conversation, ICP, InferenceRecord,
  LocalModel, OutreachDraft, Product, Prospect,
} from "@/types";

export const demoProducts: Product[] = [
  {
    id: "p1", name: "LedgerFlow", category: "Finance automation", status: "active", updatedAt: "2026-11-12",
    description: "Automated accounts-payable reconciliation for mid-market finance teams.",
    features: ["Invoice OCR & matching", "3-way PO reconciliation", "ERP sync (NetSuite, SAP B1)", "Approval workflows"],
    valueProposition: "Close the books 4 days faster with fewer manual matching errors.",
    customerProblem: "Finance teams spend days manually matching invoices to POs across disconnected systems.",
    differentiators: ["Runs on-premise", "Line-level matching", "Audit trail per decision"],
    pricing: "From ₹1.2L / year per entity", targetIndustries: ["Manufacturing", "Distribution", "Retail"],
    useCases: ["Month-end close", "Vendor dispute resolution", "Audit preparation"],
  },
  {
    id: "p2", name: "ShiftPilot", category: "Workforce management", status: "active", updatedAt: "2026-11-04",
    description: "Demand-based shift scheduling for multi-site operations.",
    features: ["Forecast-driven rosters", "Compliance rules engine", "Mobile shift swaps"],
    valueProposition: "Reduce overtime cost 12–18% while keeping coverage compliant.",
    customerProblem: "Multi-site operators over-staff quiet hours and scramble during peaks.",
    differentiators: ["Works offline on site", "Labour-law templates by state"],
    pricing: "₹180 / employee / month", targetIndustries: ["Logistics", "Healthcare", "Retail"],
    useCases: ["Warehouse rostering", "Clinic staffing"],
  },
  {
    id: "p3", name: "VendorIQ", category: "Procurement", status: "draft", updatedAt: "2026-10-28",
    description: "Supplier risk scoring and onboarding (in development).",
    features: ["Supplier onboarding portal"], valueProposition: "", customerProblem: "",
    differentiators: [], pricing: "TBD", targetIndustries: ["Manufacturing"], useCases: [],
  },
];

export const demoProfile: BusinessProfile = {
  updatedAt: "2026-11-10",
  sections: [
    { id: "identity", title: "Company identity", fields: [
      { label: "Company name", value: "Northwind Systems Pvt. Ltd.", origin: "user" },
      { label: "Website", value: "northwind.example", origin: "user" },
      { label: "Industry", value: "B2B software", origin: "user" },
      { label: "Company size", value: "51–200 employees", origin: "researched" },
      { label: "Location", value: "Pune, India", origin: "user" },
    ]},
    { id: "description", title: "Description", fields: [
      { label: "Summary", value: "Builds operations software for mid-market manufacturers and distributors.", origin: "user" },
      { label: "Founded", value: "2017", origin: "researched" },
    ]},
    { id: "model", title: "Business model", fields: [
      { label: "Model", value: "Annual SaaS subscriptions, on-prem option", origin: "user" },
      { label: "Products / services", value: "LedgerFlow, ShiftPilot, implementation services", origin: "user" },
      { label: "Value proposition", value: "Practical automation that runs inside the customer's network.", origin: "user" },
      { label: "Target markets", value: "India, UAE, Singapore", origin: "assumption" },
      { label: "Average deal size", value: "₹8–15L ARR", origin: "assumption" },
    ]},
  ],
};

export const demoICPs: ICP[] = [
  {
    id: "i1", productId: "p1", name: "Mid-market manufacturers — Finance", status: "confirmed", updatedAt: "2026-11-11",
    industries: ["Manufacturing", "Distribution"], companySize: "200–2,000 employees", geography: ["India", "UAE"],
    revenueRange: "₹100–1,000 Cr", characteristics: ["Uses NetSuite or SAP B1", "Multiple legal entities"],
    personas: [
      { title: "CFO", seniority: "C-level", department: "Finance", painPoints: ["Slow month-end close", "Audit findings"] },
      { title: "AP Manager", seniority: "Manager", department: "Finance", painPoints: ["Manual invoice matching"] },
    ],
    triggers: ["Hiring AP staff", "ERP migration", "New entity / plant"],
    positiveCriteria: ["> 2,000 invoices / month", "Multi-entity"], exclusionCriteria: ["Already uses a dedicated AP automation tool"],
    customRequirements: "Prefer companies with on-prem data policies.",
  },
  {
    id: "i2", productId: "p2", name: "Multi-site logistics operators", status: "draft", updatedAt: "2026-11-02",
    industries: ["Logistics"], companySize: "500+ employees", geography: ["India"], revenueRange: "₹200 Cr+",
    characteristics: ["5+ warehouses"], personas: [{ title: "Head of Operations", seniority: "VP", department: "Operations", painPoints: ["Overtime cost"] }],
    triggers: ["Opening new warehouse"], positiveCriteria: ["Shift-based workforce"], exclusionCriteria: [], customRequirements: "",
  },
];

const ev = (claim: string, source: string, verified: boolean, capturedAt = "2026-11-14"): Prospect["research"][number] =>
  ({ claim, source, url: `https://${source}`, capturedAt, verified });

export const demoProspects: Prospect[] = [
  {
    id: "c1", company: "Kesar Precision Castings", website: "kesarcastings.example", industry: "Manufacturing", location: "Rajkot, India",
    size: "850 employees", productId: "p1", icpId: "i1", productFit: 86, icpMatch: 82, priority: "high", status: "qualified",
    lastResearched: "2026-11-14", description: "Ferrous and non-ferrous casting supplier with three plants.",
    research: [ev("Operates three plants in Gujarat", "kesarcastings.example/about", true), ev("Running SAP Business One", "careers page job listing", true), ev("Likely high invoice volume from raw-material suppliers", "AI inference", false)],
    criteria: [
      { criterion: "Manufacturing industry", matched: true, explanation: "Company describes itself as a casting manufacturer." },
      { criterion: "200–2,000 employees", matched: true, explanation: "LinkedIn page lists 850 employees." },
      { criterion: "Multi-entity", matched: true, explanation: "Annual report lists 2 subsidiaries." },
      { criterion: "Not using AP automation", matched: false, explanation: "Unknown — no evidence either way." },
    ],
    problems: [
      { problem: "Manual AP processing across plants", evidence: "Hiring 2 AP executives with 'invoice matching' in JD", confidence: "medium" },
      { problem: "Month-end close delays", evidence: "No direct evidence — inferred from plant count", confidence: "low" },
    ],
    scoring: [
      { factor: "ICP match", weight: 35, score: 82, explanation: "3 of 4 criteria matched with evidence." },
      { factor: "Buying signals", weight: 30, score: 90, explanation: "Recent AP hiring and plant expansion." },
      { factor: "Problem evidence", weight: 20, score: 70, explanation: "One medium-confidence problem." },
      { factor: "Data completeness", weight: 15, score: 80, explanation: "Most firmographics verified." },
    ],
  },
  {
    id: "c2", company: "Alpine Distributors", website: "alpinedist.example", industry: "Distribution", location: "Dubai, UAE",
    size: "420 employees", productId: "p1", icpId: "i1", productFit: 74, icpMatch: 78, priority: "medium", status: "researched",
    lastResearched: "2026-11-13", description: "FMCG distributor across the GCC.",
    research: [ev("Migrating to NetSuite in 2026", "press release", true)],
    criteria: [{ criterion: "Distribution industry", matched: true, explanation: "Self-described FMCG distributor." }, { criterion: "Geography UAE", matched: true, explanation: "HQ in Dubai." }],
    problems: [{ problem: "ERP migration disruption to AP", evidence: "NetSuite migration announced", confidence: "medium" }],
    scoring: [{ factor: "ICP match", weight: 35, score: 78, explanation: "Core criteria matched." }, { factor: "Buying signals", weight: 30, score: 75, explanation: "ERP migration." }, { factor: "Problem evidence", weight: 20, score: 60, explanation: "Inferred." }, { factor: "Data completeness", weight: 15, score: 65, explanation: "Revenue unknown." }],
  },
  {
    id: "c3", company: "Trident Auto Components", website: "tridentauto.example", industry: "Manufacturing", location: "Chennai, India",
    size: "1,600 employees", productId: "p1", icpId: "i1", productFit: 81, icpMatch: 85, priority: "high", status: "qualified",
    lastResearched: "2026-11-12", description: "Tier-2 automotive components supplier.",
    research: [ev("New plant announced in Sriperumbudur", "news article", true)],
    criteria: [{ criterion: "Manufacturing", matched: true, explanation: "Auto components." }, { criterion: "Size", matched: true, explanation: "1,600 employees." }],
    problems: [{ problem: "Scaling AP for new plant", evidence: "New plant + finance hiring", confidence: "high" }],
    scoring: [{ factor: "ICP match", weight: 35, score: 85, explanation: "Strong match." }, { factor: "Buying signals", weight: 30, score: 80, explanation: "Expansion." }, { factor: "Problem evidence", weight: 20, score: 80, explanation: "High confidence." }, { factor: "Data completeness", weight: 15, score: 75, explanation: "Good." }],
  },
  {
    id: "c4", company: "Harbor Freight Logistics", website: "harborfl.example", industry: "Logistics", location: "Mumbai, India",
    size: "2,300 employees", productId: "p2", icpId: "i2", productFit: 69, icpMatch: 72, priority: "medium", status: "researched",
    lastResearched: "2026-11-09", description: "3PL with 11 warehouses.", research: [ev("Operates 11 warehouses", "harborfl.example", true)],
    criteria: [{ criterion: "5+ warehouses", matched: true, explanation: "11 listed on site." }], problems: [],
    scoring: [{ factor: "ICP match", weight: 35, score: 72, explanation: "Matched." }, { factor: "Buying signals", weight: 30, score: 60, explanation: "Weak." }, { factor: "Problem evidence", weight: 20, score: 40, explanation: "None found." }, { factor: "Data completeness", weight: 15, score: 70, explanation: "OK." }],
  },
  {
    id: "c5", company: "Meridian Textiles", website: "meridiantex.example", industry: "Manufacturing", location: "Coimbatore, India",
    size: "300 employees", productId: "p1", icpId: "i1", productFit: 0, icpMatch: 0, priority: "low", status: "unresearched",
    lastResearched: null, description: "Not yet researched.", research: [], criteria: [], problems: [], scoring: [],
  },
  {
    id: "c6", company: "Sapphire Retail Group", website: "sapphireretail.example", industry: "Retail", location: "Bengaluru, India",
    size: "5,000 employees", productId: "p1", icpId: "i1", productFit: 38, icpMatch: 30, priority: "low", status: "rejected",
    lastResearched: "2026-11-08", description: "Retail chain; outside size range and uses competitor tool.",
    research: [ev("Uses a competing AP automation product", "case study on vendor site", true)],
    criteria: [{ criterion: "Not using AP automation", matched: false, explanation: "Published case study with competitor." }], problems: [],
    scoring: [{ factor: "ICP match", weight: 35, score: 30, explanation: "Exclusion criterion hit." }],
  },
  {
    id: "c7", company: "CareFirst Clinics", website: "carefirst.example", industry: "Healthcare", location: "Hyderabad, India",
    size: "900 employees", productId: "p2", icpId: "i2", productFit: 0, icpMatch: 0, priority: "low", status: "unresearched",
    lastResearched: null, description: "Not yet researched.", research: [], criteria: [], problems: [], scoring: [],
  },
];

export const demoSignals: BuyingSignal[] = [
  { id: "s1", prospectId: "c1", category: "hiring", title: "Hiring 2 AP executives", description: "Job posts mention 'manual invoice matching' and 'SAP B1'.", evidence: "\"Responsible for 3-way matching of 2,500+ invoices monthly\"", source: "Company careers page", url: "https://kesarcastings.example/careers", date: "2026-11-10", relevance: 88, priority: "high", status: "new", rationale: "Hiring for manual matching suggests volume is outgrowing the current process." },
  { id: "s2", prospectId: "c1", category: "expansion", title: "Fourth plant under construction", description: "Local news reports a new foundry in Morbi.", evidence: "Article quoting MD on ₹120 Cr investment", source: "Regional business news", url: "https://news.example/kesar", date: "2026-10-30", relevance: 72, priority: "medium", status: "reviewed", rationale: "New plants add vendors and invoice volume." },
  { id: "s3", prospectId: "c2", category: "technology", title: "NetSuite migration", description: "Press release announcing ERP move.", evidence: "\"Go-live planned for Q2 2026\"", source: "Press release", url: "https://alpinedist.example/news", date: "2026-09-18", relevance: 80, priority: "high", status: "relevant", rationale: "ERP migrations are a natural window to add AP automation." },
  { id: "s4", prospectId: "c3", category: "expansion", title: "New plant in Sriperumbudur", description: "Capacity expansion announced.", evidence: "Exchange filing", source: "Stock exchange filing", url: "https://filings.example/trident", date: "2026-11-02", relevance: 76, priority: "high", status: "new", rationale: "Expansion increases finance workload." },
  { id: "s5", prospectId: "c3", category: "leadership", title: "New CFO appointed", description: "Former Big-4 partner joins as CFO.", evidence: "LinkedIn announcement", source: "LinkedIn", url: "https://linkedin.example/trident", date: "2026-10-12", relevance: 70, priority: "medium", status: "acted", rationale: "New finance leaders often review tooling in first 6 months." },
  { id: "s6", prospectId: "c4", category: "funding", title: "Series C ₹400 Cr", description: "Funding to expand warehouse network.", evidence: "Funding announcement", source: "Startup news", url: "https://news.example/harbor", date: "2026-08-21", relevance: 55, priority: "low", status: "irrelevant", rationale: "Capital for growth; staffing pressure likely." },
];

export const demoDrafts: OutreachDraft[] = [
  { id: "d1", prospectId: "c1", productId: "p1", subject: "Invoice matching across your three plants", objective: "Book discovery call", tone: "Consultative", createdAt: "2026-11-14", reviewState: "draft",
    body: "Hi Rakesh,\n\nI noticed Kesar is hiring two AP executives focused on invoice matching in SAP B1. With a fourth plant on the way, that volume usually keeps growing.\n\nLedgerFlow automates line-level 3-way matching and runs inside your own network.\n\nWould a 20-minute call next week be useful?\n\nBest,\nAnika",
    inputs: ["Signal: Hiring 2 AP executives", "Signal: Fourth plant", "Fact: Uses SAP B1"] },
];

export const demoConversations: Conversation[] = [
  { id: "v1", prospectId: "c3", subject: "Re: Scaling AP for the new plant", isSample: true, messages: [
    { from: "Anika (you)", date: "2026-11-05", body: "Hi Priya, congratulations on the new plant…" },
    { from: "Priya Raman, CFO", date: "2026-11-07", body: "Thanks Anika. Timing is interesting — we're reviewing finance tools this quarter. Our concern is that we already invested in SAP customisation and can't afford a long implementation. Can you share pricing and typical timelines before we talk?" },
  ]},
  { id: "v2", prospectId: "c2", subject: "Re: NetSuite + AP automation", isSample: true, messages: [
    { from: "Anika (you)", date: "2026-11-01", body: "Hi Omar, saw the NetSuite announcement…" },
    { from: "Omar Haddad, Finance Director", date: "2026-11-03", body: "Not a priority right now, we're heads-down on migration until mid next year. Maybe reach out after go-live." },
  ]},
  { id: "v3", prospectId: "c4", subject: "Re: Shift planning", isSample: true, messages: [
    { from: "Anika (you)", date: "2026-10-20", body: "Hi team, …" },
    { from: "ops@harborfl.example", date: "2026-10-22", body: "Please remove me from your list." },
  ]},
];

export const demoAgents: AgentDefinition[] = [
  { name: "Planner", responsibility: "Breaks a task into steps and routes them to specialist agents." },
  { name: "Researcher", responsibility: "Collects public company facts and stores sources." },
  { name: "Qualifier", responsibility: "Compares research against ICP criteria." },
  { name: "Signal Analyst", responsibility: "Detects and classifies buying signals." },
  { name: "Writer", responsibility: "Drafts outreach grounded in evidence." },
];

export const demoRuns: AgentRun[] = [
  { id: "r1", task: "Research & qualify prospect", productId: "p1", prospectId: "c1", status: "completed", startedAt: "2026-11-14T10:02:00", durationMs: 184000, result: "Qualified — score 84", retries: 0, steps: [
    { name: "Plan", agent: "Planner", status: "completed", durationMs: 3000, log: ["Planned 4 steps"] },
    { name: "Collect sources", agent: "Researcher", status: "completed", durationMs: 120000, log: ["Fetched 6 pages", "Stored 3 evidence items"] },
    { name: "Match ICP", agent: "Qualifier", status: "completed", durationMs: 41000, log: ["3/4 criteria matched"] },
    { name: "Detect signals", agent: "Signal Analyst", status: "completed", durationMs: 20000, log: ["2 signals found"] },
  ]},
  { id: "r2", task: "Draft outreach", productId: "p1", prospectId: "c3", status: "failed", startedAt: "2026-11-13T16:40:00", durationMs: 12000, result: "Model timeout", retries: 1, steps: [
    { name: "Plan", agent: "Planner", status: "completed", durationMs: 2000 },
    { name: "Write draft", agent: "Writer", status: "failed", durationMs: 10000, error: "Ollama request timed out after 10s", log: ["Prompt 1,840 tokens", "Timeout"] },
  ]},
  { id: "r3", task: "Discover prospects", productId: "p2", status: "cancelled", startedAt: "2026-11-09T09:15:00", durationMs: 54000, result: "Cancelled by user", retries: 0, steps: [
    { name: "Plan", agent: "Planner", status: "completed", durationMs: 2500 },
    { name: "Search candidates", agent: "Researcher", status: "cancelled", durationMs: 51500 },
  ]},
];

export const demoModels: LocalModel[] = [
  { name: "llama3.1:8b", family: "Llama", size: "4.7 GB", installed: false, recommended: true, contextLength: 128000 },
  { name: "qwen2.5:7b", family: "Qwen", size: "4.4 GB", installed: false, recommended: true, contextLength: 32000 },
  { name: "mistral:7b", family: "Mistral", size: "4.1 GB", installed: false, recommended: false, contextLength: 32000 },
  { name: "llama3.1:70b", family: "Llama", size: "40 GB", installed: false, recommended: false, contextLength: 128000 },
  { name: "nomic-embed-text", family: "Embedding", size: "274 MB", installed: false, recommended: true, contextLength: 8192 },
];

export const demoInference: InferenceRecord[] = [
  { id: "n1", task: "Qualify Kesar Precision", model: "llama3.1:8b", durationMs: 41000, status: "completed", tokens: 2310, memGb: 5.8, at: "2026-11-14T10:04" },
  { id: "n2", task: "Draft Trident outreach", model: "llama3.1:8b", durationMs: 10000, status: "failed", tokens: 1840, at: "2026-11-13T16:40" },
];
