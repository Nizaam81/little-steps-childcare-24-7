export interface RegistrationEmailService {
  sendOtp(
    email: string,
    otp: string,
    purpose?: "parent" | "childcare_owner",
  ): Promise<void>;
}
