import { Schema, model, models, type InferSchemaType, type HydratedDocument } from "mongoose";

const activitySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["trade", "price", "document"], required: true },
    message: { type: String, required: true, trim: true, maxlength: 300 },
  },
  { timestamps: true, collection: "Activity" }
);

export type ActivityDocument = HydratedDocument<InferSchemaType<typeof activitySchema>>;

export const Activity = models.Activity || model("Activity", activitySchema);
