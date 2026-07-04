import { Schema, model, models, type InferSchemaType, type HydratedDocument } from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    password: { type: String, required: true, select: false, minlength: 8 },
  },
  { timestamps: true, collection: "User" }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export type UserDocument = HydratedDocument<InferSchemaType<typeof userSchema>> & {
  comparePassword(candidate: string): Promise<boolean>;
};

export const User = models.User || model("User", userSchema);
