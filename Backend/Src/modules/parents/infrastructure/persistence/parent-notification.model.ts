import { Schema, model } from "mongoose";

const parentNotificationSchema = new Schema(
  {
    parentId: { type: Schema.Types.ObjectId, ref: "ParentRegistration", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    type: { type: String, enum: ["booking", "account", "camera_access", "general"], default: "general" },
    relatedId: { type: String },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const ParentNotificationModel = model(
  "ParentNotification",
  parentNotificationSchema,
);