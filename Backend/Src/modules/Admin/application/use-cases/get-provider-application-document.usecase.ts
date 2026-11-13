import type { ProviderRegistrationRepository } from "../../../childcare/domain/repositories/provider-registration.repository.js";

export class GetProviderApplicationDocumentUseCase {
  constructor(
    private readonly registrations: ProviderRegistrationRepository,
  ) {}

  async execute(input: {
    applicationId: string;
    publicId: string;
  }) {
    return this.registrations.findDocument(
      input.applicationId,
      input.publicId,
    );
  }
}
