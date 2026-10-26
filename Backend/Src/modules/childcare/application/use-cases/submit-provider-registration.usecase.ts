import { readFile } from "node:fs/promises";
import type {
  ProviderRegistrationData,
  ProviderRegistrationDocument,
  ProviderRegistrationRepository,
} from "../../domain/repositories/provider-registration.repository.js";
import type { ProviderEmailVerificationStore } from "../services/provider-email-verification.store.js";
import { hashPassword } from "../../../../shared/utils/password.js";

const isValidDocumentContent = async (
  document: Express.Multer.File,
): Promise<boolean> => {
  const header = await readFile(document.path);

  if (document.mimetype === "application/pdf") {
    return header.subarray(0, 5).toString("ascii") === "%PDF-";
  }

  if (document.mimetype === "image/png") {
    return header.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  }

  if (document.mimetype === "image/jpeg") {
    return (
      header.length >= 3 &&
      header[0] === 0xff &&
      header[1] === 0xd8 &&
      header[2] === 0xff
    );
  }

  return false;
};

const toDocument = (
  document: Express.Multer.File,
): ProviderRegistrationDocument => ({
  storedName: document.filename,
  originalName: document.originalname,
  mimeType: document.mimetype,
  size: document.size,
  path: document.path,
});

export class SubmitProviderRegistrationUseCase {
  constructor(
    private readonly registrations: ProviderRegistrationRepository,
    private readonly verificationStore: ProviderEmailVerificationStore,
  ) {}

  async execute(input: {
    application: Omit<ProviderRegistrationData, "passwordHash"> & {
      password: string;
    };
    tradeLicense: Express.Multer.File;
    supportingDocuments: Express.Multer.File[];
  }): Promise<{ applicationId: string; status: "pending_verification" }> {
    const email = input.application.ownerEmail.trim().toLowerCase();
    if (!this.verificationStore.isVerified(email)) {
      throw new Error("EMAIL_NOT_VERIFIED");
    }

    const documents = [input.tradeLicense, ...input.supportingDocuments];
    for (const document of documents) {
      if (!(await isValidDocumentContent(document))) {
        throw new Error("INVALID_DOCUMENT_CONTENT");
      }
    }

    const { password, ...application } = input.application;
    const registration = await this.registrations.create({
      application: {
        ...application,
        ownerEmail: email,
        passwordHash: await hashPassword(password),
      },
      tradeLicense: toDocument(input.tradeLicense),
      supportingDocuments: input.supportingDocuments.map(toDocument),
    });

    this.verificationStore.consumeVerified(email);

    return {
      applicationId: registration.id,
      status: "pending_verification",
    };
  }
}
