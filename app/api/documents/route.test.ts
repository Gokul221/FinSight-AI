import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session", () => ({
  getAuthenticatedUserId: vi.fn(),
}));

vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/models/Document", () => ({
  DocumentModel: { find: vi.fn(), create: vi.fn() },
}));

vi.mock("@/models/Chunk", () => ({
  Chunk: { insertMany: vi.fn() },
}));

vi.mock("@/lib/documentParsing", () => ({
  extractText: vi.fn(),
}));

vi.mock("@/lib/chunking", () => ({
  chunkText: vi.fn(),
}));

vi.mock("@/lib/embeddings", () => ({
  embedDocumentChunks: vi.fn(),
}));

vi.mock("@/lib/activity", () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
}));

import { getAuthenticatedUserId } from "@/lib/session";
import { DocumentModel } from "@/models/Document";
import { Chunk } from "@/models/Chunk";
import { extractText } from "@/lib/documentParsing";
import { chunkText } from "@/lib/chunking";
import { embedDocumentChunks } from "@/lib/embeddings";
import { logActivity } from "@/lib/activity";
import { GET, POST } from "./route";

function makeUploadRequest(file: File | null) {
  const formData = new FormData();
  if (file) formData.set("file", file);
  return new Request("http://localhost/api/documents", { method: "POST", body: formData });
}

function makeDoc(overrides: Partial<Record<string, unknown>> = {}) {
  const state: any = {
    _id: { toString: () => "doc1" },
    userId: "user-1",
    name: "report.pdf",
    type: "PDF",
    sizeBytes: 1000,
    status: "processing",
    chunkCount: 0,
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    save: vi.fn(),
    ...overrides,
  };
  return state;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/documents", () => {
  it("returns 401 when there is no session", async () => {
    (getAuthenticatedUserId as any).mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
    expect(DocumentModel.find).not.toHaveBeenCalled();
  });

  it("returns the current user's documents, newest first", async () => {
    (getAuthenticatedUserId as any).mockResolvedValue("user-1");
    const sort = vi.fn().mockResolvedValue([makeDoc({ status: "indexed", chunkCount: 5 })]);
    (DocumentModel.find as any).mockReturnValue({ sort });

    const res = await GET();
    const json = await res.json();

    expect(DocumentModel.find).toHaveBeenCalledWith({ userId: "user-1" });
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(res.status).toBe(200);
    expect(json.documents[0]).toMatchObject({ id: "doc1", name: "report.pdf", status: "indexed", chunks: 5 });
  });
});

describe("POST /api/documents", () => {
  it("returns 401 when there is no session", async () => {
    (getAuthenticatedUserId as any).mockResolvedValue(null);

    const res = await POST(makeUploadRequest(new File(["hi"], "a.pdf")));
    expect(res.status).toBe(401);
    expect(DocumentModel.create).not.toHaveBeenCalled();
  });

  it("returns 400 when no file is provided", async () => {
    (getAuthenticatedUserId as any).mockResolvedValue("user-1");

    const res = await POST(makeUploadRequest(null));
    expect(res.status).toBe(400);
  });

  it("returns 400 for an unsupported file extension", async () => {
    (getAuthenticatedUserId as any).mockResolvedValue("user-1");

    const res = await POST(makeUploadRequest(new File(["hi"], "a.docx")));
    expect(res.status).toBe(400);
    expect(DocumentModel.create).not.toHaveBeenCalled();
  });

  it("indexes a valid file end to end: parses, chunks, embeds, and logs activity", async () => {
    (getAuthenticatedUserId as any).mockResolvedValue("user-1");
    const doc = makeDoc();
    (DocumentModel.create as any).mockResolvedValue(doc);
    (extractText as any).mockResolvedValue("extracted text");
    (chunkText as any).mockReturnValue(["chunk one", "chunk two"]);
    (embedDocumentChunks as any).mockResolvedValue([[0.1], [0.2]]);

    const res = await POST(makeUploadRequest(new File(["hi"], "report.pdf")));
    const json = await res.json();

    expect(DocumentModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", name: "report.pdf", type: "PDF", status: "processing" })
    );
    expect(Chunk.insertMany).toHaveBeenCalledWith([
      expect.objectContaining({ userId: "user-1", documentId: doc._id, text: "chunk one", embedding: [0.1], order: 0 }),
      expect.objectContaining({ userId: "user-1", documentId: doc._id, text: "chunk two", embedding: [0.2], order: 1 }),
    ]);
    expect(doc.status).toBe("indexed");
    expect(doc.chunkCount).toBe(2);
    expect(doc.save).toHaveBeenCalled();
    expect(logActivity).toHaveBeenCalledWith("user-1", "document", expect.stringContaining("report.pdf"));
    expect(res.status).toBe(201);
    expect(json.document.status).toBe("indexed");
  });

  it("marks the document failed if parsing throws, without failing the request", async () => {
    (getAuthenticatedUserId as any).mockResolvedValue("user-1");
    const doc = makeDoc();
    (DocumentModel.create as any).mockResolvedValue(doc);
    (extractText as any).mockRejectedValue(new Error("corrupt file"));

    const res = await POST(makeUploadRequest(new File(["hi"], "report.pdf")));
    const json = await res.json();

    expect(doc.status).toBe("failed");
    expect(doc.errorMessage).toBe("corrupt file");
    expect(Chunk.insertMany).not.toHaveBeenCalled();
    expect(logActivity).not.toHaveBeenCalled();
    expect(res.status).toBe(201);
    expect(json.document.status).toBe("failed");
  });

  it("marks the document failed when no extractable text is found", async () => {
    (getAuthenticatedUserId as any).mockResolvedValue("user-1");
    const doc = makeDoc();
    (DocumentModel.create as any).mockResolvedValue(doc);
    (extractText as any).mockResolvedValue("");
    (chunkText as any).mockReturnValue([]);

    await POST(makeUploadRequest(new File(["hi"], "report.pdf")));

    expect(doc.status).toBe("failed");
    expect(doc.errorMessage).toContain("No extractable text");
  });
});
