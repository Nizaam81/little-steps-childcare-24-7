import { compare as compareBcrypt } from "bcryptjs";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

export const DUMMY_PASSWORD_HASH =
  "scrypt$00000000000000000000000000000000$" +
  "0000000000000000000000000000000000000000000000000000000000000000" +
  "0000000000000000000000000000000000000000000000000000000000000000";

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16);
  const hash = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });

  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
};

export const verifyPassword = async (
  password: string,
  encodedHash: string,
): Promise<boolean> => {
  if (encodedHash.startsWith("$2")) {
    if (!/^\$2[aby]\$(0[4-9]|[12]\d|3[01])\$[./A-Za-z0-9]{53}$/.test(encodedHash)) {
      throw new Error("INVALID_STORED_PASSWORD_HASH");
    }

    return compareBcrypt(password, encodedHash);
  }

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
