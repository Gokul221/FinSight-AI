// ─── Mock Data for FinSight AI Dashboard ───────────────────────────────────

export interface Holding {
  id: string;
  name: string;
  ticker: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  weight: number;
  sector: string;
}

export interface KPI {
  label: string;
  value: string;
  delta: string;
  deltaType: "positive" | "negative" | "neutral";
  subtext?: string;
  icon: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: SourceCitation[];
  table?: { headers: string[]; rows: string[][] };
}

export interface SourceCitation {
  id: string;
  docName: string;
  section: string;
  excerpt: string;
  relevanceScore: number;
}

export interface Document {
  id: string;
  name: string;
  type: "PDF" | "CSV" | "XLSX" | "TXT";
  size: string;
  status: "indexed" | "processing" | "failed";
  indexedOn: string;
  chunks?: number;
}

export interface Alert {
  id: string;
  type: "price" | "earnings" | "risk" | "document";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface AllocationData {
  name: string;
  value: number;
  color: string;
}

export interface PerformancePoint {
  month: string;
  portfolio: number;
  nifty50: number;
  niftyNext50: number;
}

// ─── Performance History ────────────────────────────────────────────────────
// Still mock — this backs the "Monthly Returns" bar chart in
// components/portfolio/PerformanceChart.tsx (portfolio vs Nifty 50 vs Nifty
// Next 50 monthly % returns), a separate feature from the dashboard's value
// history chart. Migrating it needs its own data source decision (e.g.
// monthly-aggregated snapshots plus a Nifty Next 50 index feed) — flagged
// for follow-up rather than migrated here.
export const performanceHistory: PerformancePoint[] = [
  { month: "Aug", portfolio: 2.1, nifty50: 1.4, niftyNext50: 1.8 },
  { month: "Sep", portfolio: -0.8, nifty50: -1.2, niftyNext50: -0.5 },
  { month: "Oct", portfolio: 3.4, nifty50: 2.1, niftyNext50: 2.8 },
  { month: "Nov", portfolio: 5.2, nifty50: 3.8, niftyNext50: 4.1 },
  { month: "Dec", portfolio: 1.8, nifty50: 0.9, niftyNext50: 1.4 },
  { month: "Jan", portfolio: 4.6, nifty50: 2.7, niftyNext50: 3.2 },
];

// ─── Alerts ────────────────────────────────────────────────────────────────
export const alerts: Alert[] = [
  {
    id: "1",
    type: "price",
    title: "Price Target Hit",
    message: "INFY crossed your ₹1,600 target — up 3.2% today. Consider reviewing your position.",
    timestamp: "2 hours ago",
    read: false,
  },
  {
    id: "2",
    type: "earnings",
    title: "Earnings Report Available",
    message: "TCS Q3 earnings report is now available. Add to knowledge base for AI analysis?",
    timestamp: "5 hours ago",
    read: false,
  },
  {
    id: "3",
    type: "risk",
    title: "Risk Score Elevated",
    message: "Your portfolio risk score increased to 7.1 — high volatility detected in Banking sector.",
    timestamp: "Yesterday",
    read: true,
  },
  {
    id: "4",
    type: "document",
    title: "Document Indexed",
    message: "HDFC Annual Report 2024 has been successfully indexed — 748 chunks ready for AI querying.",
    timestamp: "2 days ago",
    read: true,
  },
];

// ─── Suggested Questions ────────────────────────────────────────────────────
export const suggestedQuestions = [
  "Summarise Q3 earnings for my holdings",
  "What are the risks in my current portfolio?",
  "Compare INFY vs TCS over the last year",
  "Which stocks in my portfolio beat Nifty this month?",
  "What is the dividend yield of my banking stocks?",
];
