"use client";

import { useRef, useState } from "react";
import { CloudUpload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Document as DocumentType } from "@/lib/mockData";

export default function DocumentUploadZone({ onUploaded }: { onUploaded: (doc: DocumentType) => void }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/documents", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        return;
      }

      onUploaded(data.document);
      if (data.document.status === "failed") {
        setError("Failed to process this document. Try a different file.");
      }
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200",
        dragging
          ? "border-indigo-500 bg-indigo-600/10"
          : "border-white/[0.1] hover:border-white/[0.2] hover:bg-white/[0.02]"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.csv,.xlsx,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />
      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
            dragging ? "bg-indigo-600/20 text-indigo-400" : "bg-white/[0.04] text-slate-500"
          )}
        >
          {uploading ? <Loader2 className="w-7 h-7 animate-spin" /> : <CloudUpload className="w-7 h-7" />}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-200 mb-1">
            {uploading ? "Uploading and indexing..." : "Drop PDFs, CSVs, or earnings reports here"}
          </p>
          <p className="text-xs text-slate-500">Supports PDF, CSV, XLSX, TXT up to 50MB</p>
        </div>
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <div className="flex items-center gap-3">
          <div className="h-px w-16 bg-white/[0.06]" />
          <span className="text-xs text-slate-600">or</span>
          <div className="h-px w-16 bg-white/[0.06]" />
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="border-white/[0.1] text-slate-300 hover:bg-white/[0.05] hover:text-white hover:border-indigo-500/40 text-xs"
          id="upload-browse-files"
        >
          Browse Files
        </Button>
      </div>
    </div>
  );
}
