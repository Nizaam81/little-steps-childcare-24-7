import type { ProviderEmailVerificationStore } from "../services/provider-email-verification.store.js";

export class VerifyProviderEmailOtpUseCase {
  constructor(
    private readonly verificationStore: ProviderEmailVerificationStore,
  ) {}

  execute(input: { email: string; otp: string }): { verified: true } {
    if (!this.verificationStore.verifyOtp(input.email, input.otp)) {
      throw new Error("OTP_INVALID_OR_EXPIRED");
    }

    return { verified: true };
  }
}
