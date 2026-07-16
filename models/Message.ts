import { Schema, model, models, type InferSchemaType, type HydratedDocument } from "mongoose";

const sourceSchema = new Schema(
  {
    documentId: { type: Schema.Types.ObjectId, ref: "Document", required: true },
    documentName: { type: String, required: true },
    excerpt: { type: String, required: true },
    relevanceScore: { type: Number, required: true },
  },
  { _id: false }
);

const messageSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    sources: { type: [sourceSchema], default: [] },
  },
  { timestamps: true, collection: "Message" }
);

export type MessageDocument = HydratedDocument<InferSchemaType<typeof messageSchema>>;

export const Message = models.Message || model("Message", messageSchema);
