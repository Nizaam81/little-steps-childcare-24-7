import { createHmac } from "node:crypto";

type ParentSessionClaims = {
  sub: string;
  email: string;
  iat: number;
  exp: number;
};

export class ParentSessionTokenService {
  issue(input: {
    parentId: string;
    email: string;
    expiresInSeconds: number;
  }): string {
    const secret =
      process.env.JWT_ACCESS_SECRET ?? process.env.PARENT_AUTH_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error(
        "JWT_ACCESS_SECRET must be at least 32 characters.",
      );
    }

    const issuedAt = Math.floor(Date.now() / 1000);
    const claims: ParentSessionClaims = {
      sub: input.parentId,
      email: input.email,
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
}
