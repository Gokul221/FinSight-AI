import { Schema, model, models, type InferSchemaType, type HydratedDocument } from "mongoose";

const watchlistSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    ticker: { type: String, required: true, trim: true, uppercase: true, maxlength: 20 },
    targetPrice: { type: Number, required: true, min: 0 },
    currentPrice: { type: Number, required: true, min: 0 },
    direction: { type: String, required: true, enum: ["above", "below"] },
  },
  { timestamps: true, collection: "Watchlist" }
);

export type WatchlistDocument = HydratedDocument<InferSchemaType<typeof watchlistSchema>>;

export const Watchlist = models.Watchlist || model("Watchlist", watchlistSchema);
