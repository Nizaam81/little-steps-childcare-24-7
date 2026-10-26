import type {
  ProviderRegistrationRepository,
  ProviderRegistrationStatus,
} from "../../../childcare/domain/repositories/provider-registration.repository.js";

export type ProviderReviewDecision = Exclude<
  ProviderRegistrationStatus,
  "pending_verification"
>;

export class ReviewProviderApplicationUseCase {
  constructor(
    private readonly registrations: ProviderRegistrationRepository,
  ) {}

  async execute(input: {
    applicationId: string;
    status: ProviderReviewDecision;
    reviewNotes: string;
    adminId: string;
  }): Promise<{ applicationId: string; status: ProviderReviewDecision }> {
    const result = await this.registrations.updateReview(input);
    if (!result) {
      throw new Error("APPLICATION_NOT_REVIEWABLE");
    }

    return { applicationId: result.id, status: input.status };
  }
}
