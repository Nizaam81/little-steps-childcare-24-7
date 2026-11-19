import { Schema, model } from "mongoose";

const parentWishlistSchema = new Schema(
  {
    parentId: { type: Schema.Types.ObjectId, ref: "ParentRegistration", required: true },
    targetType: { type: String, enum: ["daycare", "caregiver"], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true },
);

parentWishlistSchema.index(
  { parentId: 1, targetType: 1, targetId: 1 },
  { unique: true },
);

export const ParentWishlistModel = model(
  "ParentWishlist",
  parentWishlistSchema,
);
