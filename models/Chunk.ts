import { Schema, model, models, type InferSchemaType, type HydratedDocument } from "mongoose";

const chunkSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    documentId: { type: Schema.Types.ObjectId, ref: "Document", required: true, index: true },
    documentName: { type: String, required: true, trim: true, maxlength: 300 },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
    order: { type: Number, required: true },
    section: { type: String, trim: true, maxlength: 100 },
  },
  { timestamps: true, collection: "Chunk" }
);

export type ChunkDocument = HydratedDocument<InferSchemaType<typeof chunkSchema>>;

export const Chunk = models.Chunk || model("Chunk", chunkSchema);
