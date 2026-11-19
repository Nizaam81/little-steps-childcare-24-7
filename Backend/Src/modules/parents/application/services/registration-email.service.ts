export interface RegistrationEmailService {
  sendOtp(
    email: string,
    otp: string,
    purpose?: "parent" | "childcare_owner",
  ): Promise<void>;
  sendSubscriptionExpiryReminder(email: string, expiresAt: Date): Promise<void>;
}
