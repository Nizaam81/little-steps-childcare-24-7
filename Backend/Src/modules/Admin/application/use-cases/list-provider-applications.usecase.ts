import type {
  ProviderRegistrationRepository,
  ProviderRegistrationStatus,
} from "../../../childcare/domain/repositories/provider-registration.repository.js";

export class ListProviderApplicationsUseCase {
  constructor(
    private readonly registrations: ProviderRegistrationRepository,
  ) {}

  execute(status?: ProviderRegistrationStatus) {
    return this.registrations.listForReview(status);
  }
}
