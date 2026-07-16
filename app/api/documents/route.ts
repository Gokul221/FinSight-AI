import { connectToDatabase } from "@/lib/db/connect";
import { DocumentModel, type DocumentDocument } from "@/models/Document";
import { Chunk } from "@/models/Chunk";
import { getAuthenticatedUserId } from "@/lib/session";
import { extractText, type SupportedDocumentType } from "@/lib/documentParsing";
import { chunkText } from "@/lib/chunking";
import { embedDocumentChunks } from "@/lib/embeddings";
import { serializeDocument } from "@/lib/documents";
import { logActivity } from "@/lib/activity";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

const EXTENSION_TO_TYPE: Record<string, SupportedDocumentType> = {
  pdf: "PDF",
  csv: "CSV",
  xlsx: "XLSX",
  txt: "TXT",
};

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const docs = (await DocumentModel.find({ userId }).sort({ createdAt: -1 })) as DocumentDocument[];

  return Response.json({ documents: docs.map(serializeDocument) });
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return Response.json({ error: "A file is required." }, { status: 400 });
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const type = EXTENSION_TO_TYPE[extension];
  if (!type) {
    return Response.json({ error: "Unsupported file type. Use PDF, CSV, XLSX, or TXT." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return Response.json({ error: "File exceeds the 50MB limit." }, { status: 400 });
  }

  await connectToDatabase();

  const doc = (await DocumentModel.create({
    userId,
    name: file.name,
    type,
    sizeBytes: file.size,
    status: "processing",
  })) as DocumentDocument;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractText(buffer, type);
    const chunks = chunkText(text);

    if (chunks.length === 0) {
      throw new Error("No extractable text found in this file.");
    }

    const embeddings = await embedDocumentChunks(chunks);

    await Chunk.insertMany(
      chunks.map((chunkContent, index) => ({
        userId,
        documentId: doc._id,
        documentName: doc.name,
        text: chunkContent,
        embedding: embeddings[index],
        order: index,
      }))
    );

    doc.status = "indexed";
    doc.chunkCount = chunks.length;
    await doc.save();

    await logActivity(userId, "document", `Indexed "${doc.name}" — ${chunks.length} chunks`);
  } catch (error) {
    doc.status = "failed";
    doc.errorMessage = error instanceof Error ? error.message : "Failed to process document.";
    await doc.save();
  }

  return Response.json({ document: serializeDocument(doc) }, { status: 201 });
}
