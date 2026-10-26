import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { ProviderEmailVerificationStore } from "../../application/services/provider-email-verification.store.js";

interface VerificationEntry {
  otpHash: Buffer | null;
  otpExpiresAt: number;
  verifiedUntil: number | null;
  attempts: number;
}

const otpLifetimeMs = 5 * 60 * 1000;
const verifiedLifetimeMs = 30 * 60 * 1000;
const resendDelayMs = 60 * 1000;
const maxAttempts = 5;

export class ProviderEmailVerificationStoreImpl
  implements ProviderEmailVerificationStore
{
  private readonly entries = new Map<string, VerificationEntry>();
  private readonly sentAt = new Map<string, number>();
  private readonly secret = randomBytes(32);

  assertCanSend(email: string): void {
    this.removeExpiredEntries();
    const normalizedEmail = this.normalize(email);
    const entry = this.entries.get(normalizedEmail);

    if (entry?.verifiedUntil && entry.verifiedUntil > Date.now()) {
      throw new Error("EMAIL_ALREADY_VERIFIED");
    }

    const lastSentAt = this.sentAt.get(normalizedEmail);
    if (lastSentAt !== undefined && Date.now() - lastSentAt < resendDelayMs) {
      throw new Error("OTP_SEND_RATE_LIMITED");
    }
  }

  saveOtp(email: string, otp: string): void {
    this.removeExpiredEntries();
    const normalizedEmail = this.normalize(email);
    const now = Date.now();
    this.entries.set(normalizedEmail, {
      otpHash: this.hash(normalizedEmail, otp),
      otpExpiresAt: now + otpLifetimeMs,
      verifiedUntil: null,
      attempts: 0,
    });
    this.sentAt.set(normalizedEmail, now);
  }

  verifyOtp(email: string, otp: string): boolean {
    this.removeExpiredEntries();
    const normalizedEmail = this.normalize(email);
    const entry = this.entries.get(normalizedEmail);

    if (!entry) {
      return false;
    }
    if (entry.verifiedUntil && entry.verifiedUntil > Date.now()) {
      return false;
    }
    if (!entry.otpHash || entry.otpExpiresAt <= Date.now() || entry.attempts >= maxAttempts) {
      this.entries.delete(normalizedEmail);
      return false;
    }

    entry.attempts += 1;
    const submittedHash = this.hash(normalizedEmail, otp);
    if (!timingSafeEqual(entry.otpHash, submittedHash)) {
      if (entry.attempts >= maxAttempts) {
        this.entries.delete(normalizedEmail);
      }
      return false;
    }

    entry.otpHash = null;
    entry.verifiedUntil = Date.now() + verifiedLifetimeMs;
    return true;
  }

  isVerified(email: string): boolean {
    this.removeExpiredEntries();
    const normalizedEmail = this.normalize(email);
    const entry = this.entries.get(normalizedEmail);

    if (!entry || !entry.verifiedUntil) {
      return false;
    }
    if (entry.verifiedUntil <= Date.now()) {
      this.entries.delete(normalizedEmail);
      return false;
    }

    return true;
  }

  consumeVerified(email: string): void {
    const normalizedEmail = this.normalize(email);
    this.entries.delete(normalizedEmail);
    this.sentAt.delete(normalizedEmail);
  }

  private hash(email: string, otp: string): Buffer {
    return createHmac("sha256", this.secret)
      .update(`${email}:${otp}`)
      .digest();
  }

  private normalize(email: string): string {
    return email.trim().toLowerCase();
  }

  private removeExpiredEntries(): void {
    const now = Date.now();
    for (const [email, entry] of this.entries) {
      const otpIsActive = entry.otpHash !== null && entry.otpExpiresAt > now;
      const verificationIsActive =
        entry.verifiedUntil !== null && entry.verifiedUntil > now;
      if (!otpIsActive && !verificationIsActive) {
        this.entries.delete(email);
      }
    }
    for (const [email, sentAt] of this.sentAt) {
      if (now - sentAt >= resendDelayMs) {
        this.sentAt.delete(email);
      }
    }
  }
}
