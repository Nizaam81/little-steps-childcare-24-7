import { Schema, model } from "mongoose";

const parentFeedbackSchema = new Schema(
  {
    parentId: { type: Schema.Types.ObjectId, ref: "ParentRegistration", required: true },
    targetType: { type: String, enum: ["daycare", "caregiver"], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true, maxlength: 2000, default: "" },
  },
  { timestamps: true },
);

parentFeedbackSchema.index(
  { parentId: 1, targetType: 1, targetId: 1 },
  { unique: true },
);
parentFeedbackSchema.index({ targetType: 1, targetId: 1 });

export const ParentFeedbackModel = model(
  "ParentFeedback",
  parentFeedbackSchema,
);