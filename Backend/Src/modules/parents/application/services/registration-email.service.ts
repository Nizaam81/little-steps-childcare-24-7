export interface RegistrationEmailService {
  sendOtp(email: string, otp: string): Promise<void>;
}
