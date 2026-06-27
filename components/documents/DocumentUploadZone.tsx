"use client";

import { useState } from "react";
import { CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DocumentUploadZone() {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); }}
      className={cn(
        "border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200",
        dragging
          ? "border-indigo-500 bg-indigo-600/10"
          : "border-white/[0.1] hover:border-white/[0.2] hover:bg-white/[0.02]"
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
            dragging ? "bg-indigo-600/20 text-indigo-400" : "bg-white/[0.04] text-slate-500"
          )}
        >
          <CloudUpload className="w-7 h-7" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-200 mb-1">
            Drop PDFs, CSVs, or earnings reports here
          </p>
          <p className="text-xs text-slate-500">
            Supports PDF, CSV, XLSX up to 50MB
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-px w-16 bg-white/[0.06]" />
          <span className="text-xs text-slate-600">or</span>
          <div className="h-px w-16 bg-white/[0.06]" />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-white/[0.1] text-slate-300 hover:bg-white/[0.05] hover:text-white hover:border-indigo-500/40 text-xs"
          id="upload-browse-files"
        >
          Browse Files
        </Button>
      </div>
    </div>
  );
}
