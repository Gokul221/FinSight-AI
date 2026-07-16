import type { Document as DocumentType } from "@/lib/mockData";

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

interface SerializableDocumentDoc {
  _id: { toString(): string };
  name: string;
  type: string;
  sizeBytes: number;
  status: string;
  chunkCount: number;
  updatedAt: Date;
}

export function serializeDocument(doc: SerializableDocumentDoc): DocumentType {
  return {
    id: doc._id.toString(),
    name: doc.name,
    type: doc.type as DocumentType["type"],
    size: formatFileSize(doc.sizeBytes),
    status: doc.status as DocumentType["status"],
    indexedOn:
      doc.status === "indexed"
        ? doc.updatedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : "—",
    chunks: doc.chunkCount || undefined,
  };
}
