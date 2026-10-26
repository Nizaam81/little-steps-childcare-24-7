import type { ProviderRegistrationRepository } from "../../../childcare/domain/repositories/provider-registration.repository.js";

export class GetProviderApplicationDocumentUseCase {
  constructor(
    private readonly registrations: ProviderRegistrationRepository,
  ) {}

  async execute(input: {
    applicationId: string;
    storedName: string;
  }) {
    return this.registrations.findDocument(
      input.applicationId,
      input.storedName,
    );
  }
}
