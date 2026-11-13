export interface ProviderRegistrationDocument {
  url: string;
  publicId: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface ProviderRegistrationData {
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  passwordHash: string;
  centreName: string;
  address: string;
  district: string;
  centreEmail: string;
  centrePhone: string;
  ageGroups: string[];
  careTypes: string[];
  capacity: number;
  openingTime: string;
  closingTime: string;
  dailyPrice: number | "";
  monthlyPrice: number | "";
}

export type ProviderRegistrationStatus =
  | "pending_verification"
  | "approved"
  | "rejected"
  | "corrections_requested";

export interface ProviderRegistrationReview {
  applicationId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  centreName: string;
  address: string;
  district: string;
  centreEmail: string;
  centrePhone: string;
  ageGroups: string[];
  careTypes: string[];
  capacity: number;
  openingTime: string;
  closingTime: string;
  dailyPrice: number | "";
  monthlyPrice: number | "";
  status: ProviderRegistrationStatus;
  reviewNotes: string;
  createdAt: Date;
  updatedAt: Date;
  tradeLicense: ProviderRegistrationDocument;
  supportingDocuments: ProviderRegistrationDocument[];
}

export interface ApprovedProviderCentre {
  applicationId: string;
  centreName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  address: string;
  district: string;
  centrePhone: string;
  capacity: number;
  isActive: boolean;
  approvedAt: Date;
}

export interface ProviderRegistrationRepository {
  create(data: {
    application: ProviderRegistrationData;
    tradeLicense: ProviderRegistrationDocument;
    supportingDocuments: ProviderRegistrationDocument[];
  }): Promise<{ id: string }>;
  listForReview(
    status?: ProviderRegistrationStatus,
  ): Promise<ProviderRegistrationReview[]>;
  updateReview(data: {
    applicationId: string;
    status: Exclude<ProviderRegistrationStatus, "pending_verification">;
    reviewNotes: string;
    adminId: string;
  }): Promise<{ id: string; status: ProviderRegistrationStatus } | null>;
  findDocument(
    applicationId: string,
    publicId: string,
  ): Promise<ProviderRegistrationDocument | null>;
  findForLogin(email: string): Promise<{
    id: string;
    ownerName: string;
    ownerEmail: string;
    centreName: string;
    passwordHash: string;
    status: ProviderRegistrationStatus;
    reviewNotes: string;
    isActive: boolean;
  } | null>;
  listApprovedCentres(): Promise<ApprovedProviderCentre[]>;
  setCentreActive(applicationId: string, isActive: boolean): Promise<boolean>;
  deleteApprovedCentre(applicationId: string): Promise<boolean>;
}
