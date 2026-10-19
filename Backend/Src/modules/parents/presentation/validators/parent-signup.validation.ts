
import { z } from "zod";

export const parentDetailsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters"),

  email: z.email("Please enter a valid email address"),

  phoneNumber: z
    .string()
    .trim()
    .min(1, "Phone number is required"),
});

export type ParentDetailsInput = z.infer<typeof parentDetailsSchema>;
