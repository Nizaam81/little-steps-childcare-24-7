import { Schema, model } from "mongoose";

const parentRegistrationSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    passwordHash: {
      type: String,
      select: false,
    },

    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

parentRegistrationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 },
);

export const ParentRegistrationModel = model(
  "ParentRegistration",
  parentRegistrationSchema,
);