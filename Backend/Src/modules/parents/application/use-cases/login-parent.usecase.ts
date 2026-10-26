import type { ParentRegistrationRepository } from "../../domain/repositories/parent-registration.repository.js";
import {
  DUMMY_PASSWORD_HASH,
  verifyPassword,
} from "../../../../shared/utils/password.js";

export class LoginParentUseCase {
  constructor(
    private readonly registrations: ParentRegistrationRepository,
  ) {}

  async execute(input: {
    email: string;
    password: string;
    rememberMe: boolean;
  }): Promise<{
    parent: { id: string; fullName: string; email: string };
    expiresInSeconds: number;
  }> {
    const email = input.email.trim().toLowerCase();
    const parent = await this.registrations.findVerifiedByEmail(email);
    const passwordMatches = await verifyPassword(
      input.password,
      parent?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!parent || !passwordMatches) {
      throw new Error("INVALID_CREDENTIALS");
    }

    return {
      parent: {
        id: parent.id,
        fullName: parent.fullName,
        email: parent.email,
      },
      expiresInSeconds: input.rememberMe ? 30 * 24 * 60 * 60 : 12 * 60 * 60,
    };
  }
}
