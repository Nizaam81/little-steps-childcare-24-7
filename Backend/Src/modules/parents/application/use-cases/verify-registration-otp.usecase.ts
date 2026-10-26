import type { ParentRegistrationRepository } from "../../domain/repositories/parent-registration.repository.js";
import type { RegistrationOtpStore } from "../services/registration-otp.store.js";
import { hashPassword } from "../../../../shared/utils/password.js";

export class VerifyRegistrationOtpUseCase {
  constructor(
    private readonly registrations: ParentRegistrationRepository,
    private readonly otpStore: RegistrationOtpStore,
  ) {}

  async execute(input: {
    email: string;
    otp: string;
    password: string;
  }): Promise<{ registrationId: string; message: string }> {
    const email = input.email.trim().toLowerCase();
    const verification = this.otpStore.verify(email, input.otp);

    if (!verification) {
      throw new Error("OTP_INVALID_OR_EXPIRED");
    }

    const passwordHash = await hashPassword(input.password);
    const registration = await this.registrations.completeRegistration({
      registrationId: verification.registrationId,
      passwordHash,
    });

    if (!registration) {
      this.otpStore.remove(email);
      throw new Error("PENDING_REGISTRATION_NOT_FOUND");
    }

    this.otpStore.remove(email);

    return {
      registrationId: registration.id,
      message: "Email verified and password saved.",
    };
  }
}
