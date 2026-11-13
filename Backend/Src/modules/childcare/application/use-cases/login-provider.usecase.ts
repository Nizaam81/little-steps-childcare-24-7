import type {
  ProviderRegistrationRepository,
  ProviderRegistrationStatus,
} from "../../domain/repositories/provider-registration.repository.js";
import {
  DUMMY_PASSWORD_HASH,
  verifyPassword,
} from "../../../../shared/utils/password.js";

export class LoginProviderUseCase {
  constructor(
    private readonly registrations: ProviderRegistrationRepository,
  ) {}

  async execute(input: {
    email: string;
    password: string;
  }): Promise<{
    provider: {
      id: string;
      ownerName: string;
      ownerEmail: string;
      centreName: string;
      status: ProviderRegistrationStatus;
      reviewNotes: string;
    };
    dashboardAccess: boolean;
  }> {
    const email = input.email.trim().toLowerCase();
    const application = await this.registrations.findForLogin(email);
    const passwordMatches = await verifyPassword(
      input.password,
      application?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!application || !passwordMatches) {
      throw new Error("INVALID_PROVIDER_CREDENTIALS");
    }

    return {
      provider: {
        id: application.id,
        ownerName: application.ownerName,
        ownerEmail: application.ownerEmail,
        centreName: application.centreName,
        status: application.status,
        reviewNotes: application.reviewNotes,
      },
      dashboardAccess: application.status === "approved" && application.isActive,
    };
  }
}
