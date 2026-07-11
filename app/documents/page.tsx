"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import DocumentUploadZone from "@/components/documents/DocumentUploadZone";
import DocumentList from "@/components/documents/DocumentList";
import { Skeleton } from "@/components/ui/skeleton";
import type { Document as DocumentType } from "@/lib/mockData";
import { FileText, CheckCircle2, Cpu, Database } from "lucide-react";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentType[] | null>(null);

  useEffect(() => {
    fetch("/api/documents")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load documents"))))
      .then((data) => setDocuments(data.documents))
      .catch(() => setDocuments([]));
  }, []);

  const loading = documents === null;
  const docs = documents ?? [];
  const indexedCount = docs.filter((d) => d.status === "indexed").length;
  const totalChunks = docs.reduce((sum, d) => sum + (d.chunks ?? 0), 0);

  const statsData = [
    { label: "Total Documents", value: String(docs.length), icon: <FileText className="w-4 h-4 text-indigo-400" /> },
    { label: "Indexed", value: String(indexedCount), icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
    { label: "Total Chunks", value: totalChunks.toLocaleString(), icon: <Database className="w-4 h-4 text-amber-400" /> },
    { label: "Embedding Model", value: "voyage-4", icon: <Cpu className="w-4 h-4 text-slate-400" />, small: true },
  ];

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
        <DocumentUploadZone onUploaded={(doc) => setDocuments((prev) => [doc, ...(prev ?? [])])} />

        {/* Document List */}
        {loading ? (
          <Skeleton className="h-64" />
        ) : (
          <DocumentList
            documents={docs}
            onDeleted={(id) => setDocuments((prev) => (prev ?? []).filter((d) => d.id !== id))}
          />
        )}
      </div>
    </DashboardShell>
  );
}
