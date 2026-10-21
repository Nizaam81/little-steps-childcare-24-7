import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { RegistrationOtpStore } from "../../application/services/registration-otp.store.js";

interface StoredOtp {
  registrationId: string;
  hash: Buffer;
  expiresAt: number;
  attempts: number;
}

export class RegistrationOtpStoreImpl implements RegistrationOtpStore {
  private readonly entries = new Map<string, StoredOtp>();
  private readonly secret = randomBytes(32);

  save(data: {
    email: string;
    registrationId: string;
    otp: string;
    expiresAt: Date;
  }): void {
    this.removeExpiredEntries();
    const email = data.email.trim().toLowerCase();

    this.entries.set(email, {
      registrationId: data.registrationId,
      hash: this.hash(email, data.otp),
      expiresAt: data.expiresAt.getTime(),
      attempts: 0,
    });
  }

  verify(email: string, otp: string): { registrationId: string } | null {
    const normalizedEmail = email.trim().toLowerCase();
    const entry = this.entries.get(normalizedEmail);

    if (!entry || entry.expiresAt <= Date.now()) {
      this.entries.delete(normalizedEmail);
      return null;
    }

    entry.attempts += 1;
    if (entry.attempts > 5) {
      this.entries.delete(normalizedEmail);
      return null;
    }

    const submittedHash = this.hash(normalizedEmail, otp);
    if (!timingSafeEqual(entry.hash, submittedHash)) {
      return null;
    }

    return { registrationId: entry.registrationId };
  }

  remove(email: string): void {
    this.entries.delete(email.trim().toLowerCase());
  }

  private hash(email: string, otp: string): Buffer {
    return createHmac("sha256", this.secret)
      .update(`${email}:${otp}`)
      .digest();
  }

  private removeExpiredEntries(): void {
    const now = Date.now();

    for (const [email, entry] of this.entries) {
      if (entry.expiresAt <= now) {
        this.entries.delete(email);
      }
    }
  }
}
