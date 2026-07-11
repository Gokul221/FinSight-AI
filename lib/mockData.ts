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
  type: "PDF" | "CSV" | "XLSX";
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

export interface WatchlistStock {
  id: string;
  ticker: string;
  name: string;
  targetPrice: number;
  currentPrice: number;
  alertType: string;
  status: "active" | "triggered";
}

export interface MarketMover {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sparkline: number[];
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

export interface ActivityItem {
  id: string;
  type: "trade" | "ai" | "alert" | "document";
  message: string;
  timestamp: string;
}

// ─── KPI Data ──────────────────────────────────────────────────────────────
export const kpiData: KPI[] = [
  {
    label: "Total Portfolio Value",
    value: "₹28,43,750",
    delta: "+₹1,24,300 (4.6%)",
    deltaType: "positive",
    subtext: "vs last month",
    icon: "TrendingUp",
  },
  {
    label: "Today's P&L",
    value: "+₹18,240",
    delta: "+0.64%",
    deltaType: "positive",
    subtext: "vs yesterday",
    icon: "BarChart3",
  },
  {
    label: "Risk Score",
    value: "6.4 / 10",
    delta: "Moderate",
    deltaType: "neutral",
    subtext: "Updated today",
    icon: "Shield",
  },
  {
    label: "AI Insights",
    value: "12 new",
    delta: "Generated today",
    deltaType: "neutral",
    subtext: "3 require action",
    icon: "Sparkles",
  },
];

// ─── Allocation Data ────────────────────────────────────────────────────────
export const allocationData: AllocationData[] = [
  { name: "IT", value: 35, color: "#6366F1" },
  { name: "Banking", value: 25, color: "#10B981" },
  { name: "Energy", value: 15, color: "#F59E0B" },
  { name: "FMCG", value: 12, color: "#5c8df6ff" },
  { name: "Pharma", value: 8, color: "#F43F5E" },
  { name: "Others", value: 5, color: "#64748B" },
];

// ─── Performance History ────────────────────────────────────────────────────
export const performanceHistory: PerformancePoint[] = [
  { month: "Aug", portfolio: 2.1, nifty50: 1.4, niftyNext50: 1.8 },
  { month: "Sep", portfolio: -0.8, nifty50: -1.2, niftyNext50: -0.5 },
  { month: "Oct", portfolio: 3.4, nifty50: 2.1, niftyNext50: 2.8 },
  { month: "Nov", portfolio: 5.2, nifty50: 3.8, niftyNext50: 4.1 },
  { month: "Dec", portfolio: 1.8, nifty50: 0.9, niftyNext50: 1.4 },
  { month: "Jan", portfolio: 4.6, nifty50: 2.7, niftyNext50: 3.2 },
];

// ─── Portfolio Chart (6-month value history) ─────────────────────────────────
export const portfolioChartData = [
  { date: "Aug 24", portfolio: 2245000, nifty: 2210000 },
  { date: "Sep 24", portfolio: 2187000, nifty: 2185000 },
  { date: "Oct 24", portfolio: 2362000, nifty: 2231000 },
  { date: "Nov 24", portfolio: 2485000, nifty: 2316000 },
  { date: "Dec 24", portfolio: 2529000, nifty: 2337000 },
  { date: "Jan 25", portfolio: 2643750, nifty: 2401000 },
];

// ─── Chat History ──────────────────────────────────────────────────────────
export const chatHistory: ChatMessage[] = [
  {
    id: "1",
    role: "user",
    content: "What is the revenue trend for TCS over the last 4 quarters?",
    timestamp: "10:24 AM",
  },
  {
    id: "2",
    role: "assistant",
    content:
      "Based on TCS's Q3 FY2025 earnings report in your knowledge base, here is the quarterly revenue trend:\n\nTCS has shown consistent revenue growth over the last 4 quarters, with a CAGR of approximately 8.2%. The Q3 FY25 revenue came in at ₹63,973 crore — a 5.6% YoY increase — ahead of analyst estimates. CC (constant currency) growth stood at 4.5%, driven by strong momentum in BFSI and Manufacturing verticals.",
    timestamp: "10:24 AM",
    table: {
      headers: ["Quarter", "Revenue (₹ Cr)", "YoY Growth", "CC Growth"],
      rows: [
        ["Q4 FY24", "61,237", "+3.5%", "+2.8%"],
        ["Q1 FY25", "62,613", "+4.4%", "+3.2%"],
        ["Q2 FY25", "63,148", "+5.1%", "+3.9%"],
        ["Q3 FY25", "63,973", "+5.6%", "+4.5%"],
      ],
    },
  },
  {
    id: "3",
    role: "user",
    content: "Should I increase my TCS allocation?",
    timestamp: "10:26 AM",
  },
  {
    id: "4",
    role: "assistant",
    content:
      "Based on 3 documents in your knowledge base — TCS Q3 FY25 earnings, Portfolio Analysis Dec, and my current portfolio snapshot — here is my assessment:\n\n**Current Position**: You hold 25 shares at ₹3,480 avg. buy price, currently at ₹3,847 (10.5% unrealised gain). TCS represents 18.2% of your portfolio.\n\n**Recommendation**: Maintain current allocation. Adding more TCS would push IT sector weight above 40%, increasing concentration risk. Instead, consider deploying fresh capital into underweight sectors (Pharma at 7.9%).\n\n**Risks to watch**: US tech spending outlook, BFSI client discretionary spending cuts, and INR/USD movement impacting margins.",
    timestamp: "10:26 AM",
    sources: [
      {
        id: "s1",
        docName: "TCS_Q3_2024_Earnings.pdf",
        section: "Management Commentary, Pg. 12",
        excerpt: "Revenue growth momentum is expected to continue into Q4 driven by BFSI deal ramp-ups...",
        relevanceScore: 94,
      },
      {
        id: "s2",
        docName: "Portfolio_Analysis_Dec.csv",
        section: "Sector Allocation Sheet",
        excerpt: "IT sector currently at 35.4% portfolio weight as of December 2024...",
        relevanceScore: 88,
      },
      {
        id: "s3",
        docName: "HDFC_Annual_Report_2024.pdf",
        section: "Market Outlook, Pg. 34",
        excerpt: "Technology sector valuations remain elevated relative to 5-year median P/E...",
        relevanceScore: 72,
      },
    ],
  },
];

// ─── Documents ─────────────────────────────────────────────────────────────
export const documents: Document[] = [
  {
    id: "1",
    name: "TCS_Q3_2024_Earnings.pdf",
    type: "PDF",
    size: "2.4 MB",
    status: "indexed",
    indexedOn: "12 Jan 2025",
    chunks: 312,
  },
  {
    id: "2",
    name: "HDFC_Annual_Report_2024.pdf",
    type: "PDF",
    size: "8.1 MB",
    status: "indexed",
    indexedOn: "08 Jan 2025",
    chunks: 748,
  },
  {
    id: "3",
    name: "Portfolio_Analysis_Dec.csv",
    type: "CSV",
    size: "140 KB",
    status: "indexed",
    indexedOn: "05 Jan 2025",
    chunks: 180,
  },
  {
    id: "4",
    name: "Nifty_Rebalance_Jan.pdf",
    type: "PDF",
    size: "920 KB",
    status: "processing",
    indexedOn: "—",
  },
  {
    id: "5",
    name: "SEBI_Circular_2025.pdf",
    type: "PDF",
    size: "560 KB",
    status: "failed",
    indexedOn: "—",
  },
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

// ─── Watchlist ──────────────────────────────────────────────────────────────
export const watchlistStocks: WatchlistStock[] = [
  {
    id: "1",
    ticker: "RELIANCE",
    name: "Reliance Industries",
    targetPrice: 2800,
    currentPrice: 2763,
    alertType: "Price Target",
    status: "active",
  },
  {
    id: "2",
    ticker: "INFY",
    name: "Infosys",
    targetPrice: 1600,
    currentPrice: 1648,
    alertType: "+3% above target",
    status: "triggered",
  },
  {
    id: "3",
    ticker: "WIPRO",
    name: "Wipro",
    targetPrice: 480,
    currentPrice: 471,
    alertType: "Earnings Alert",
    status: "active",
  },
  {
    id: "4",
    ticker: "BAJFINANCE",
    name: "Bajaj Finance",
    targetPrice: 8000,
    currentPrice: 7580,
    alertType: "Price Target",
    status: "active",
  },
];

// ─── Market Movers ──────────────────────────────────────────────────────────
export const marketMovers: MarketMover[] = [
  {
    ticker: "RELIANCE",
    name: "Reliance Ind.",
    price: 2763,
    change: 42.5,
    changePercent: 1.56,
    sparkline: [2680, 2700, 2690, 2720, 2735, 2748, 2763],
  },
  {
    ticker: "TCS",
    name: "TCS",
    price: 3847,
    change: 68.3,
    changePercent: 1.81,
    sparkline: [3760, 3780, 3770, 3800, 3820, 3838, 3847],
  },
  {
    ticker: "INFY",
    name: "Infosys",
    price: 1648,
    change: 51.2,
    changePercent: 3.21,
    sparkline: [1580, 1595, 1590, 1610, 1628, 1641, 1648],
  },
  {
    ticker: "HDFCBANK",
    name: "HDFC Bank",
    price: 1724,
    change: -18.5,
    changePercent: -1.06,
    sparkline: [1750, 1742, 1738, 1730, 1728, 1726, 1724],
  },
  {
    ticker: "WIPRO",
    name: "Wipro",
    price: 471,
    change: -12.3,
    changePercent: -2.54,
    sparkline: [490, 485, 481, 478, 475, 473, 471],
  },
  {
    ticker: "ICICIBANK",
    name: "ICICI Bank",
    price: 978,
    change: 14.7,
    changePercent: 1.52,
    sparkline: [960, 963, 968, 970, 974, 976, 978],
  },
];

// ─── Recent Activity ────────────────────────────────────────────────────────
export const recentActivity: ActivityItem[] = [
  {
    id: "1",
    type: "trade",
    message: "Bought 10 shares of TCS at ₹3,840",
    timestamp: "Today, 2:30 PM",
  },
  {
    id: "2",
    type: "ai",
    message: "AI generated portfolio risk report — 3 action items",
    timestamp: "Today, 11:45 AM",
  },
  {
    id: "3",
    type: "alert",
    message: "HDFC Bank earnings alert triggered — Q3 results beat estimates",
    timestamp: "Today, 9:15 AM",
  },
  {
    id: "4",
    type: "document",
    message: "Document 'TCS_Q3_2024_Earnings.pdf' indexed — 312 chunks",
    timestamp: "Yesterday, 4:20 PM",
  },
  {
    id: "5",
    type: "ai",
    message: "Rebalancing suggestion generated — Pharma underweight by 4%",
    timestamp: "Yesterday, 2:00 PM",
  },
  {
    id: "6",
    type: "trade",
    message: "Sold 5 shares of WIPRO at ₹498",
    timestamp: "2 days ago",
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

// ─── AI Insights ────────────────────────────────────────────────────────────
export const aiInsights = [
  {
    id: "1",
    text: "Your HDFC Bank allocation has grown to 18% — consider rebalancing to maintain sector limits.",
    severity: "warning",
  },
  {
    id: "2",
    text: "TCS showing bullish momentum over the last 5 sessions — RSI at 62, approaching overbought zone.",
    severity: "info",
  },
  {
    id: "3",
    text: "3 of your watchlist stocks report earnings this week: WIPRO (Wed), INFY (Thu), RELIANCE (Fri).",
    severity: "alert",
  },
];

// ─── Source Citations ────────────────────────────────────────────────────────
export const sourceCitations: SourceCitation[] = [
  {
    id: "s1",
    docName: "TCS_Q3_2024_Earnings.pdf",
    section: "Management Commentary, Pg. 12",
    excerpt: "Revenue growth momentum expected to continue into Q4 driven by BFSI deal ramp-ups and manufacturing vertical expansion.",
    relevanceScore: 94,
  },
  {
    id: "s2",
    docName: "Portfolio_Analysis_Dec.csv",
    section: "Sector Allocation Sheet",
    excerpt: "IT sector currently at 35.4% portfolio weight as of December 2024, above 30% recommended ceiling.",
    relevanceScore: 88,
  },
  {
    id: "s3",
    docName: "HDFC_Annual_Report_2024.pdf",
    section: "Market Outlook, Pg. 34",
    excerpt: "Technology sector valuations remain elevated relative to 5-year median P/E of 28x vs current 34x.",
    relevanceScore: 72,
  },
  {
    id: "s4",
    docName: "Nifty_Rebalance_Jan.pdf",
    section: "Index Composition Changes",
    excerpt: "Nifty 50 rebalancing effective February 2025 adds 2 new IT constituents, increasing sector weight to 17.2%.",
    relevanceScore: 61,
  },
];
