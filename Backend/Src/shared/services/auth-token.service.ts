import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { AuthSessionModel } from "../persistence/auth-session.model.js";
import { TokenBlacklistModel } from "../persistence/token-blacklist.model.js";

export type AuthRole = "parent" | "provider" | "admin";
export type AuthClaims = {
  sub: string;
  email: string;
  role: AuthRole;
  sid: string;
  jti: string;
  typ: "access" | "refresh";
  iat: number;
  exp: number;
};

type SessionInput = {
  subject: string;
  email: string;
  role: AuthRole;
  accessExpiresInSeconds?: number;
};

const defaultAccessLifetime = 15 * 60;
const defaultRefreshLifetime = 30 * 24 * 60 * 60;

export class AuthTokenService {
  async issueSession(input: SessionInput) {
    const sid = randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const accessExpiresInSeconds = Math.min(
      input.accessExpiresInSeconds ?? defaultAccessLifetime,
      defaultAccessLifetime,
    );
    const refreshExpiresAt = new Date(Date.now() + defaultRefreshLifetime * 1000);
    const accessTokenId = randomUUID();
    const refreshTokenId = randomUUID();
    const accessToken = this.sign({
      sub: input.subject,
      email: input.email,
      role: input.role,
      sid,
      jti: accessTokenId,
      typ: "access",
      iat: now,
      exp: now + accessExpiresInSeconds,
    });
    const refreshToken = this.sign({
      sub: input.subject,
      email: input.email,
      role: input.role,
      sid,
      jti: refreshTokenId,
      typ: "refresh",
      iat: now,
      exp: Math.floor(refreshExpiresAt.getTime() / 1000),
    });

    await AuthSessionModel.create({
      _id: sid,
      subject: input.subject,
      email: input.email,
      role: input.role,
      refreshTokenHash: this.hash(refreshToken),
      accessTokenId,
      refreshExpiresAt,
    });

    return {
      accessToken,
      refreshToken,
      expiresInSeconds: accessExpiresInSeconds,
    };
  }

  verifyAccessToken(token: string): AuthClaims | null {
    const claims = this.verify(token);
    return claims?.typ === "access" ? claims : null;
  }

  async authenticateAccessToken(token: string): Promise<AuthClaims | null> {
    const claims = this.verifyAccessToken(token);
    if (!claims) return null;

    const [session, blacklisted] = await Promise.all([
      AuthSessionModel.exists({
        _id: claims.sid,
        subject: claims.sub,
        role: claims.role,
        accessTokenId: claims.jti,
        revokedAt: null,
      }),
      TokenBlacklistModel.exists({
        tokenId: claims.jti,
        expiresAt: { $gt: new Date() },
      }),
    ]);

    return session && !blacklisted ? claims : null;
  }

  async refreshSession(token: string) {
    const claims = this.verify(token);
    if (!claims || claims.typ !== "refresh") return null;

    const session = await AuthSessionModel.findOne({
      _id: claims.sid,
      subject: claims.sub,
      role: claims.role,
      refreshTokenHash: this.hash(token),
      refreshExpiresAt: { $gt: new Date() },
      revokedAt: null,
    });
    if (!session) return null;

    const now = Math.floor(Date.now() / 1000);
    const accessTokenId = randomUUID();
    const refreshTokenId = randomUUID();
    const refreshExpiresAt = new Date(Date.now() + defaultRefreshLifetime * 1000);
    const accessToken = this.sign({
      sub: claims.sub,
      email: claims.email,
      role: claims.role,
      sid: claims.sid,
      jti: accessTokenId,
      typ: "access",
      iat: now,
      exp: now + defaultAccessLifetime,
    });
    const refreshToken = this.sign({
      sub: claims.sub,
      email: claims.email,
      role: claims.role,
      sid: claims.sid,
      jti: refreshTokenId,
      typ: "refresh",
      iat: now,
      exp: Math.floor(refreshExpiresAt.getTime() / 1000),
    });

    const rotated = await AuthSessionModel.updateOne(
      {
        _id: claims.sid,
        refreshTokenHash: this.hash(token),
        revokedAt: null,
        refreshExpiresAt: { $gt: new Date() },
      },
      {
        $set: {
          refreshTokenHash: this.hash(refreshToken),
          accessTokenId,
          refreshExpiresAt,
        },
      },
    );
    if (rotated.modifiedCount !== 1) return null;

    await TokenBlacklistModel.create({
      tokenId: claims.jti,
      expiresAt: new Date(claims.exp * 1000),
    });
    return {
      accessToken,
      refreshToken,
      expiresInSeconds: defaultAccessLifetime,
    };
  }

  async revokeSession(claims: AuthClaims): Promise<void> {
    await Promise.all([
      AuthSessionModel.updateOne(
        { _id: claims.sid, revokedAt: null },
        { $set: { revokedAt: new Date() } },
      ),
      TokenBlacklistModel.updateOne(
        { tokenId: claims.jti },
        { $setOnInsert: { expiresAt: new Date(claims.exp * 1000) } },
        { upsert: true },
      ),
    ]);
  }

  private sign(claims: AuthClaims): string {
    const header = Buffer.from(
      JSON.stringify({ alg: "HS256", typ: "JWT" }),
    ).toString("base64url");
    const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
    const unsignedToken = `${header}.${payload}`;
    const signature = createHmac("sha256", this.secret(claims.typ))
      .update(unsignedToken)
      .digest("base64url");
    return `${unsignedToken}.${signature}`;
  }

  private verify(token: string): AuthClaims | null {
    if (token.length > 4096) return null;
    const [encodedHeader, encodedPayload, encodedSignature, ...extra] =
      token.split(".");
    if (
      !encodedHeader ||
      !encodedPayload ||
      !encodedSignature ||
      extra.length > 0 ||
      !/^[A-Za-z0-9_-]+$/.test(encodedSignature)
    ) return null;

    const unsignedToken = `${encodedHeader}.${encodedPayload}`;
    let payload: unknown;
    let header: unknown;
    try {
      header = JSON.parse(Buffer.from(encodedHeader, "base64url").toString("utf8"));
      payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    } catch {
      return null;
    }
    if (!this.isClaims(header, payload)) return null;

    const expected = createHmac("sha256", this.secret(payload.typ))
      .update(unsignedToken)
      .digest();
    const supplied = Buffer.from(encodedSignature, "base64url");
    if (supplied.length !== expected.length || !timingSafeEqual(expected, supplied)) {
      return null;
    }

    try {
      const now = Math.floor(Date.now() / 1000);
      if (
        payload.exp <= now ||
        payload.iat > now ||
        payload.exp - payload.iat > defaultRefreshLifetime
      ) return null;
      return payload;
    } catch {
      return null;
    }
  }

  private isClaims(header: unknown, payload: unknown): payload is AuthClaims {
    if (
      typeof header !== "object" ||
      header === null ||
      typeof payload !== "object" ||
      payload === null
    ) return false;
    const tokenHeader = header as Record<string, unknown>;
    const claims = payload as Record<string, unknown>;
    return tokenHeader.alg === "HS256" &&
      tokenHeader.typ === "JWT" &&
      typeof claims.sub === "string" &&
      typeof claims.email === "string" &&
      (claims.role === "parent" || claims.role === "provider" || claims.role === "admin") &&
      typeof claims.sid === "string" &&
      typeof claims.jti === "string" &&
      (claims.typ === "access" || claims.typ === "refresh") &&
      Number.isInteger(claims.iat) &&
      Number.isInteger(claims.exp);
  }

  private hash(value: string): string {
    return createHash("sha256").update(value).digest("hex");
  }

  private secret(type: AuthClaims["typ"]): string {
    const name = type === "refresh" ? "JWT_REFRESH_SECRET" : "JWT_ACCESS_SECRET";
    const secret = process.env[name];
    if (!secret || secret.length < 32) {
      throw new Error(`${name} must be set to at least 32 characters.`);
    }
    return secret;
  }
}

export const authTokenService = new AuthTokenService();