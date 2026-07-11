import { Schema, model, models, type InferSchemaType, type HydratedDocument } from "mongoose";

// Named DocumentModel (not Document) to avoid colliding with the DOM global.
const documentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 300 },
    type: { type: String, enum: ["PDF", "CSV", "XLSX", "TXT"], required: true },
    sizeBytes: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["processing", "indexed", "failed"], required: true, default: "processing" },
    chunkCount: { type: Number, required: true, default: 0 },
    errorMessage: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true, collection: "Document" }
);

export type DocumentDocument = HydratedDocument<InferSchemaType<typeof documentSchema>>;

export const DocumentModel = models.Document || model("Document", documentSchema);
