import { scrypt, timingSafeEqual } from "node:crypto";
import type { ParentRegistrationRepository } from "../../domain/repositories/parent-registration.repository.js";

const DUMMY_PASSWORD_HASH =
  "scrypt$00000000000000000000000000000000$" +
  "0000000000000000000000000000000000000000000000000000000000000000" +
  "0000000000000000000000000000000000000000000000000000000000000000";

const verifyPassword = async (
  password: string,
  encodedHash: string,
): Promise<boolean> => {
  const [algorithm, saltHex, hashHex] = encodedHash.split("$");
  if (
    algorithm !== "scrypt" ||
    !saltHex ||
    !/^[a-f\d]{32}$/i.test(saltHex) ||
    !hashHex ||
    !/^[a-f\d]{128}$/i.test(hashHex)
  ) {
    throw new Error("INVALID_STORED_PASSWORD_HASH");
  }

  const expectedHash = Buffer.from(hashHex, "hex");
  const actualHash = await new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password,
      Buffer.from(saltHex, "hex"),
      expectedHash.length,
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(derivedKey);
      },
    );
  });

  return timingSafeEqual(actualHash, expectedHash);
};

export class LoginParentUseCase {
  constructor(
    private readonly registrations: ParentRegistrationRepository,
  ) {}

  async execute(input: {
    email: string;
    password: string;
    rememberMe: boolean;
  }): Promise<{
    parent: { id: string; fullName: string; email: string };
    expiresInSeconds: number;
  }> {
    const email = input.email.trim().toLowerCase();
    const parent = await this.registrations.findVerifiedByEmail(email);
    const passwordMatches = await verifyPassword(
      input.password,
      parent?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!parent || !passwordMatches) {
      throw new Error("INVALID_CREDENTIALS");
    }

    return {
      parent: {
        id: parent.id,
        fullName: parent.fullName,
        email: parent.email,
      },
      expiresInSeconds: input.rememberMe ? 30 * 24 * 60 * 60 : 12 * 60 * 60,
    };
  }
}
