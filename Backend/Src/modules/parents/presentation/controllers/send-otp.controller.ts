
import type { Request, Response } from "express";
import type { SendRegistrationOtpUseCase } from "../../application/use-cases/send-registration-otp.usecase.js";
import { sendRegistrationOtpSchema } from "../validators/parent-signup.validation.js";

export class SendOtpController {
  constructor(
    private readonly sendRegistrationOtp: SendRegistrationOtpUseCase,
  ) {}

  sendOtp = async (req: Request, res: Response) => {
    try {
      const parsed = sendRegistrationOtpSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          message: "A valid email is required.",
        });
      }

      const result = await this.sendRegistrationOtp.execute({
        email: parsed.data.email,
      });

      return res.status(200).json(result);
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message === "PENDING_REGISTRATION_NOT_FOUND"
      ) {
        return res.status(400).json({
          message: "Unable to process this registration.",
        });
      }

      if (
        error instanceof Error &&
        error.message === "SMTP_CONFIGURATION_MISSING"
      ) {
        return res.status(503).json({
          message: "Email delivery is not configured on the server.",
        });
      }

      console.error("Send OTP failed:", error);

      return res.status(500).json({
        message: "Unable to send OTP right now.",
      });
    }
  };
}
