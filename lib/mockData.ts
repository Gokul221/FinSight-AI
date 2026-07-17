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
