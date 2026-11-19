import { Schema, model } from "mongoose";

const authSessionSchema = new Schema(
  {
    _id: { type: String, required: true },
    subject: { type: String, required: true, index: true },
    email: { type: String, required: true },
    role: { type: String, enum: ["parent", "provider", "admin"], required: true },
    refreshTokenHash: { type: String, required: true },
    accessTokenId: { type: String, required: true },
    refreshExpiresAt: { type: Date, required: true, index: { expires: 0 } },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const AuthSessionModel = model("AuthSession", authSessionSchema);
