export interface ProviderEmailVerificationStore {
  assertCanSend(email: string): void;
  saveOtp(email: string, otp: string): void;
  verifyOtp(email: string, otp: string): boolean;
  isVerified(email: string): boolean;
  consumeVerified(email: string): void;
}
