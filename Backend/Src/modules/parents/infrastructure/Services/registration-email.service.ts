import { createTransport } from "nodemailer";
import type { RegistrationEmailService } from "../../application/services/registration-email.service.js";

export class RegistrationEmailServiceImpl implements RegistrationEmailService {
  async sendOtp(email: string, otp: string): Promise<void> {
    const host = process.env.SMTP_HOST;
    console.log("SMTP_HOST:", host);
    const from = process.env.EMAIL_FROM;
    console.log("EMAIL_FROM:", from);
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    console.log("SMTP_USER:", user);

    if (
      !host ||
      !from ||
      !Number.isInteger(port) ||
      port <= 0 ||
      Boolean(user) !== Boolean(pass)
    ) {
      throw new Error("SMTP_CONFIGURATION_MISSING");
    }

    const transporter = createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === "true",
      ...(user && pass ? { auth: { user, pass } } : {}),
    });

    await transporter.sendMail({
      from,
      to: email,
      subject: "Little Steps - Email Verification",
      text:
        `Your Little Steps verification code is ${otp}.\n\n` +
        "This code expires in 5 minutes.\n" +
        "If you did not request this code, you can ignore this email.",
    });
  }
}
