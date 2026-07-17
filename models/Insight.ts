import { Schema, model, models, type InferSchemaType, type HydratedDocument } from "mongoose";

const insightSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, required: true, trim: true, maxlength: 500 },
    severity: { type: String, enum: ["warning", "info", "alert"], required: true },
  },
  { timestamps: true, collection: "Insight" }
);

export type InsightDocument = HydratedDocument<InferSchemaType<typeof insightSchema>>;

export const Insight = models.Insight || model("Insight", insightSchema);
