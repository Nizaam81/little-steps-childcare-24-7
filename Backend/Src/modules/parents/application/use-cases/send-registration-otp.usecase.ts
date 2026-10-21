
import { randomInt } from "node:crypto";
import type { ParentRegistrationRepository } from "../../domain/repositories/parent-registration.repository.js";
import type { RegistrationEmailService } from "../services/registration-email.service.js";
import type { RegistrationOtpStore } from "../services/registration-otp.store.js";

export class SendRegistrationOtpUseCase {
  constructor(
    private readonly registrations: ParentRegistrationRepository,
    private readonly otpStore: RegistrationOtpStore,
    private readonly emailService: RegistrationEmailService,
  ) {}

  async execute(input: { email: string }): Promise<{ message: string }> {
    const email = input.email.trim().toLowerCase();

    if (!email) {
      throw new Error("EMAIL_REQUIRED");
    }

    const registration =
      await this.registrations.findPendingRegistrationByEmail(email);

    if (!registration) {
      throw new Error("PENDING_REGISTRATION_NOT_FOUND");
    }

    const otp = randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.emailService.sendOtp(email, otp);

    this.otpStore.save({
      email,
      registrationId: registration.id,
      otp,
      expiresAt,
    });

    return {
      message: "A verification code has been sent to your email.",
    };
  }
}
