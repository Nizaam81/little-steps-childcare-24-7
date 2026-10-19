
import type { ParentRegistrationRepository } from "../../domain/repositories/parent-registration.repository.js";

export class RegisterParentDetailsUseCase {
  constructor(
    private readonly repository: ParentRegistrationRepository,
  ) {}

  async execute(input: {
    fullName: string;
    email: string;
    phoneNumber: string;
  }) {
    const email = input.email.trim().toLowerCase();

    const exists = await this.repository.emailExists(email);

    if (exists) {
      throw new Error("EMAIL_ALREADY_REGISTERED");
    }

    const registration =
      await this.repository.createPendingRegistration({
        fullName: input.fullName,
        email,
        phoneNumber: input.phoneNumber,
      });

    return {
      registrationId: registration.id,
      message: "Registration started",
    };
  }
}
