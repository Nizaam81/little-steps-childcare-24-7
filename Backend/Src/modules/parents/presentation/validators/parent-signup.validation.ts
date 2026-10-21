
import { z } from "zod";

export const parentDetailsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters"),

  email: z.string().trim().toLowerCase().pipe(
    z.email("Please enter a valid email address"),
  ),

  phoneNumber: z
    .string()
    .trim()
    .min(1, "Phone number is required"),
});

export const sendRegistrationOtpSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(
    z.email("Please enter a valid email address"),
  ),
});

export const verifyRegistrationOtpSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(
    z.email("Please enter a valid email address"),
  ),
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type ParentDetailsInput = z.infer<typeof parentDetailsSchema>;
