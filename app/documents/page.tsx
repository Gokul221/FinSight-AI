"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import DocumentUploadZone from "@/components/documents/DocumentUploadZone";
import DocumentList from "@/components/documents/DocumentList";
import { documents } from "@/lib/mockData";
import { FileText, CheckCircle2, Cpu, Database } from "lucide-react";

const statsData = [
  { label: "Total Documents", value: "5", icon: <FileText className="w-4 h-4 text-indigo-400" /> },
  { label: "Indexed", value: "3", icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
  { label: "Total Chunks", value: "1,240", icon: <Database className="w-4 h-4 text-amber-400" /> },
  { label: "Embedding Model", value: "text-embedding-3-small", icon: <Cpu className="w-4 h-4 text-slate-400" />, small: true },
];

export default function DocumentsPage() {
  return (
    <DashboardShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Documents</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your knowledge base — upload earnings reports, filings, and analyses
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {statsData.map((stat) => (
            <div key={stat.label} className="glass-card px-4 py-3 flex items-center gap-3">
              <div className="flex-shrink-0">{stat.icon}</div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className={`font-bold text-slate-100 font-num ${stat.small ? "text-xs" : "text-sm"}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Upload Zone */}
        <DocumentUploadZone />

        {/* Document List */}
        <DocumentList />
      </div>
    </DashboardShell>
  );
}
