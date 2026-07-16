import { Schema, model, models, type InferSchemaType, type HydratedDocument } from "mongoose";

const holdingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    ticker: { type: String, required: true, trim: true, uppercase: true, maxlength: 20 },
    quantity: { type: Number, required: true, min: 0 },
    avgBuyPrice: { type: Number, required: true, min: 0 },
    currentPrice: { type: Number, required: true, min: 0 },
    sector: { type: String, required: true, trim: true, maxlength: 100 },
  },
  { timestamps: true, collection: "Holding" }
);

export type HoldingDocument = HydratedDocument<InferSchemaType<typeof holdingSchema>>;

export const Holding = models.Holding || model("Holding", holdingSchema);
