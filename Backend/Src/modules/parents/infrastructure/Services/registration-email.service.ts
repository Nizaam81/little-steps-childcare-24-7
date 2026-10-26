import { createTransport } from "nodemailer";
import type { RegistrationEmailService } from "../../application/services/registration-email.service.js";

export class RegistrationEmailServiceImpl implements RegistrationEmailService {
  async sendOtp(
    email: string,
    otp: string,
    purpose: "parent" | "childcare_owner" = "parent",
  ): Promise<void> {
    const host = process.env.SMTP_HOST;
    const from = process.env.EMAIL_FROM;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

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

    const isChildcareOwner = purpose === "childcare_owner";
    const subject = isChildcareOwner
      ? "Little Steps - Verify your childcare centre owner email"
      : "Little Steps - Verify your family account";
    const heading = isChildcareOwner
      ? "Verify your owner email"
      : "Verify your family account";
    const instruction = isChildcareOwner
      ? "Use this code to verify the email address for your Little Steps childcare centre application."
      : "Use this code to finish creating your Little Steps parent account.";

    await transporter.sendMail({
      from,
      to: email,
      subject,
      text:
        `${instruction}\n\n` +
        `Your verification code is ${otp}.\n\n` +
        "This code expires in 5 minutes. Enter it only on the Little Steps website.\n" +
        "If you did not request this code, you can ignore this email.",
      html: `
        <div style="margin:0;padding:32px 16px;background:#f4f8f6;font-family:Arial,sans-serif;color:#26384b">
          <div style="max-width:520px;margin:0 auto;padding:32px;background:#ffffff;border:1px solid #e3ebe7;border-radius:20px">
            <p style="margin:0 0 8px;color:#176b59;font-size:13px;font-weight:700;letter-spacing:1px">LITTLE STEPS</p>
            <h1 style="margin:0 0 16px;font-size:24px">${heading}</h1>
            <p style="margin:0 0 24px;color:#607080;line-height:1.6">${instruction}</p>
            <p style="margin:0 0 8px;color:#607080">Your verification code:</p>
            <p style="display:inline-block;margin:0;padding:14px 20px;background:#f1f7f4;border-radius:12px;color:#176b59;font-size:28px;font-weight:700;letter-spacing:8px">${otp}</p>
            <p style="margin:24px 0 0;color:#607080;line-height:1.6">This code expires in 5 minutes. If you did not request it, you can ignore this email.</p>
          </div>
        </div>
      `,
    });
  }
}
