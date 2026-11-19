import { Schema, model } from "mongoose";

const tokenBlacklistSchema = new Schema(
  {
    tokenId: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

export const TokenBlacklistModel = model(
  "TokenBlacklist",
  tokenBlacklistSchema,
);
