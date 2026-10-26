import { randomInt } from "node:crypto";
import type { RegistrationEmailService } from "../../../parents/application/services/registration-email.service.js";
import type { ProviderEmailVerificationStore } from "../services/provider-email-verification.store.js";

export class SendProviderEmailOtpUseCase {
  constructor(
    private readonly verificationStore: ProviderEmailVerificationStore,
    private readonly emailService: RegistrationEmailService,
  ) {}

  async execute(emailInput: string): Promise<{ message: string }> {
    const email = emailInput.trim().toLowerCase();
    this.verificationStore.assertCanSend(email);

    const otp = randomInt(100000, 1000000).toString();
    await this.emailService.sendOtp(email, otp, "childcare_owner");
    this.verificationStore.saveOtp(email, otp);

    return { message: "A verification code has been sent to your email." };
  }
}
