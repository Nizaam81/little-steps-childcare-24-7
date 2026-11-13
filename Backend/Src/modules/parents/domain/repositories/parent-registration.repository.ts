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

  findVerifiedByEmail(email: string): Promise<{
    id: string;
    fullName: string;
    email: string;
    passwordHash: string;
  } | null>;

  listVerifiedParents(): Promise<{
    parentId: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    isActive: boolean;
    createdAt: Date;
  }[]>;

  setParentActive(parentId: string, isActive: boolean): Promise<boolean>;

  deleteParent(parentId: string): Promise<boolean>;
}