export interface ParentRegistrationRepository {
  emailExists(email: string): Promise<boolean>;

  createPendingRegistration(data: {
    fullName: string;
    email: string;
    phoneNumber: string;
  }): Promise<{ id: string }>;

  findPendingRegistrationByEmail(
    email: string,
  ): Promise<{ id: string; email: string } | null>;

  completeRegistration(data: {
    registrationId: string;
    passwordHash: string;
  }): Promise<{ id: string } | null>;
}