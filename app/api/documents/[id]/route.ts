import { connectToDatabase } from "@/lib/db/connect";
import { DocumentModel } from "@/models/Document";
import { Chunk } from "@/models/Chunk";
import { getAuthenticatedUserId } from "@/lib/session";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await connectToDatabase();
  const doc = await DocumentModel.findOneAndDelete({ _id: id, userId });

  if (!doc) {
    return Response.json({ error: "Document not found." }, { status: 404 });
  }

  await Chunk.deleteMany({ documentId: id, userId });

  return Response.json({ success: true });
}
