import { createHmac, timingSafeEqual } from "node:crypto";

interface AdminTokenClaims {
  sub: string;
  email: string;
  role: "admin";
  isAdmin: true;
  iat: number;
  exp: number;
}

export class AdminSessionTokenService {
  issue(input: {
    adminId: string;
    email: string;
    expiresInSeconds: number;
  }): string {
    const secret = this.getSecret();
    const issuedAt = Math.floor(Date.now() / 1000);
    const claims: AdminTokenClaims = {
      sub: input.adminId,
      email: input.email,
      role: "admin",
      isAdmin: true,
      iat: issuedAt,
      exp: issuedAt + input.expiresInSeconds,
    };
    const header = Buffer.from(
      JSON.stringify({ alg: "HS256", typ: "JWT" }),
    ).toString("base64url");
    const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
    const unsignedToken = `${header}.${payload}`;
    const signature = createHmac("sha256", secret)
      .update(unsignedToken)
      .digest("base64url");

    return `${unsignedToken}.${signature}`;
  }

  verify(token: string): AdminTokenClaims | null {
    if (token.length > 4096) {
      return null;
    }

    const [encodedHeader, encodedPayload, encodedSignature, ...extra] =
      token.split(".");
    if (
      !encodedHeader ||
      !encodedPayload ||
      !encodedSignature ||
      extra.length > 0 ||
      !/^[A-Za-z0-9_-]+$/.test(encodedSignature)
    ) {
      return null;
    }

    const unsignedToken = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = createHmac("sha256", this.getSecret())
      .update(unsignedToken)
      .digest();
    const submittedSignature = Buffer.from(encodedSignature, "base64url");
    if (
      submittedSignature.length !== expectedSignature.length ||
      !timingSafeEqual(expectedSignature, submittedSignature)
    ) {
      return null;
    }

    try {
      const header: unknown = JSON.parse(
        Buffer.from(encodedHeader, "base64url").toString("utf8"),
      );
      const claims: unknown = JSON.parse(
        Buffer.from(encodedPayload, "base64url").toString("utf8"),
      );
      const now = Math.floor(Date.now() / 1000);
      if (
        !this.isJwtHeader(header) ||
        !this.isAdminClaims(claims) ||
        claims.exp <= now ||
        claims.iat > now ||
        claims.exp - claims.iat > 12 * 60 * 60
      ) {
        return null;
      }

      return claims;
    } catch {
      return null;
    }
  }

  private getSecret(): string {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error("JWT_ACCESS_SECRET must be at least 32 characters.");
    }

    return secret;
  }

  private isJwtHeader(value: unknown): boolean {
    if (typeof value !== "object" || value === null) {
      return false;
    }

    const header = value as Record<string, unknown>;
    return header.alg === "HS256" && header.typ === "JWT";
  }

  private isAdminClaims(value: unknown): value is AdminTokenClaims {
    if (typeof value !== "object" || value === null) {
      return false;
    }

    const claims = value as Record<string, unknown>;
    return (
      typeof claims.sub === "string" &&
      claims.sub.length > 0 &&
      typeof claims.email === "string" &&
      claims.role === "admin" &&
      claims.isAdmin === true &&
      Number.isInteger(claims.iat) &&
      Number.isInteger(claims.exp)
    );
  }
}
