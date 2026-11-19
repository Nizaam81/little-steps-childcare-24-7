import type { RequestHandler } from "express";
import type { AuthRole } from "../services/auth-token.service.js";
import { authTokenService } from "../services/auth-token.service.js";

export const requireRole = (...roles: AuthRole[]): RequestHandler =>
  async (request, response, next) => {
    const match = request.get("authorization")?.match(/^Bearer\s+([^\s]+)$/i);
    if (!match?.[1]) {
      return response.status(401).json({ message: "Authentication is required." });
    }

    try {
      const claims = await authTokenService.authenticateAccessToken(match[1]);
      if (!claims) {
        return response.status(401).json({ message: "The session is invalid or expired." });
      }
      if (!roles.includes(claims.role)) {
        return response.status(403).json({ message: "You are not allowed to perform this action." });
      }

      request.auth = claims;
      if (claims.role === "admin") {
        request.admin = { id: claims.sub, email: claims.email };
      }
      return next();
    } catch (error: unknown) {
      console.error("Authentication check failed:", error);
      return response.status(500).json({ message: "Authentication is temporarily unavailable." });
    }
  };
