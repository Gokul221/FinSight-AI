"use client";

import { useState } from "react";
import type { Document as DocumentType } from "@/lib/mockData";
import EmbeddingStatusBadge from "./EmbeddingStatusBadge";
import { FileText, Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const typeColors: Record<string, string> = {
  PDF: "text-rose-400 bg-rose-400/10",
  CSV: "text-emerald-400 bg-emerald-400/10",
  XLSX: "text-amber-400 bg-amber-400/10",
  TXT: "text-slate-400 bg-slate-400/10",
};

export default function DocumentList({
  documents,
  onDeleted,
}: {
  documents: DocumentType[];
  onDeleted: (id: string) => void;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) onDeleted(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="glass-card p-10 text-center">
        <p className="text-sm text-slate-400">No documents in your knowledge base yet.</p>
        <p className="text-xs text-slate-600 mt-1">Upload a PDF, CSV, XLSX, or TXT file above to get started.</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-slate-200">
          Knowledge Base Documents
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {["Document", "Type", "Size", "Status", "Indexed On", "Chunks", "Actions"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-slate-500 font-medium whitespace-nowrap"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr
                key={doc.id}
                className="border-b border-white/[0.03] table-row-hover transition-colors"
              >
                {/* Document Name */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <span className="text-xs text-slate-200 font-medium truncate max-w-[180px]">
                      {doc.name}
                    </span>
                  </div>
                </td>

                {/* Type */}
                <td className="px-4 py-3">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${typeColors[doc.type] ?? "text-slate-400 bg-slate-400/10"}`}
                  >
                    {doc.type}
                  </span>
                </td>

                {/* Size */}
                <td className="px-4 py-3 text-xs text-slate-400 font-num">
                  {doc.size}
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <EmbeddingStatusBadge status={doc.status} />
                </td>

                {/* Indexed On */}
                <td className="px-4 py-3 text-xs text-slate-400">
                  {doc.indexedOn}
                </td>

                {/* Chunks */}
                <td className="px-4 py-3 text-xs font-num text-slate-400">
                  {doc.chunks ? doc.chunks.toLocaleString() : "—"}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {doc.status === "indexed" && (
                      <Link href="/chat">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px] text-indigo-400 hover:text-indigo-300 hover:bg-indigo-400/10"
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Chat
                        </Button>
                      </Link>
                    )}
                    {doc.status !== "processing" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deletingId === doc.id}
                        onClick={() => handleDelete(doc.id)}
                        className="h-6 px-2 text-[10px] text-slate-500 hover:text-rose-400 hover:bg-rose-400/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
