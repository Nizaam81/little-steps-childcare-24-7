export interface ParentRegistrationRepository {
  emailExists(email: string): Promise<boolean>;

  createPendingRegistration(data: {
    fullName: string;
    email: string;
    phoneNumber: string;
  }): Promise<{ id: string }>;
}