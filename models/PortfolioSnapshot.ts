import { Schema, model, models, type InferSchemaType, type HydratedDocument } from "mongoose";

const portfolioSnapshotSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true, trim: true, maxlength: 10 },
    portfolioValue: { type: Number, required: true, min: 0 },
    niftyValue: { type: Number, min: 0 },
  },
  { timestamps: true, collection: "PortfolioSnapshot" }
);

// One snapshot per user per day — re-recording the same day upserts in place.
portfolioSnapshotSchema.index({ userId: 1, date: 1 }, { unique: true });

export type PortfolioSnapshotDocument = HydratedDocument<InferSchemaType<typeof portfolioSnapshotSchema>>;

export const PortfolioSnapshot = models.PortfolioSnapshot || model("PortfolioSnapshot", portfolioSnapshotSchema);
