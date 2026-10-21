export interface RegistrationOtpStore {
  save(data: {
    email: string;
    registrationId: string;
    otp: string;
    expiresAt: Date;
  }): void;

  verify(email: string, otp: string): { registrationId: string } | null;

  remove(email: string): void;
}
