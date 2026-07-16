import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session", () => ({
  getAuthenticatedUserId: vi.fn(),
}));

vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/models/Document", () => ({
  DocumentModel: { findOneAndDelete: vi.fn() },
}));

vi.mock("@/models/Chunk", () => ({
  Chunk: { deleteMany: vi.fn() },
}));

import { getAuthenticatedUserId } from "@/lib/session";
import { DocumentModel } from "@/models/Document";
import { Chunk } from "@/models/Chunk";
import { DELETE } from "./route";

function ctx(id = "doc1") {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DELETE /api/documents/[id]", () => {
  it("returns 401 when there is no session", async () => {
    (getAuthenticatedUserId as any).mockResolvedValue(null);

    const res = await DELETE(new Request("http://localhost/api/documents/doc1", { method: "DELETE" }), ctx());
    expect(res.status).toBe(401);
    expect(DocumentModel.findOneAndDelete).not.toHaveBeenCalled();
  });

  it("returns 404 when the document doesn't exist or isn't owned by the user", async () => {
    (getAuthenticatedUserId as any).mockResolvedValue("user-1");
    (DocumentModel.findOneAndDelete as any).mockResolvedValue(null);

    const res = await DELETE(new Request("http://localhost/api/documents/doc1", { method: "DELETE" }), ctx());

    expect(DocumentModel.findOneAndDelete).toHaveBeenCalledWith({ _id: "doc1", userId: "user-1" });
    expect(Chunk.deleteMany).not.toHaveBeenCalled();
    expect(res.status).toBe(404);
  });

  it("deletes the document and its chunks, scoped to the user", async () => {
    (getAuthenticatedUserId as any).mockResolvedValue("user-1");
    (DocumentModel.findOneAndDelete as any).mockResolvedValue({ _id: "doc1" });

    const res = await DELETE(new Request("http://localhost/api/documents/doc1", { method: "DELETE" }), ctx());
    const json = await res.json();

    expect(Chunk.deleteMany).toHaveBeenCalledWith({ documentId: "doc1", userId: "user-1" });
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });
});
