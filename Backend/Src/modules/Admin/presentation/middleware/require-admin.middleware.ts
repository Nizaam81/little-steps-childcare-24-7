import type { RequestHandler } from "express";
import type { AdminSessionTokenService } from "../../application/services/admin-session-token.service.js";

export const requireAdmin = (
  tokens: AdminSessionTokenService,
): RequestHandler => (request, response, next) => {
  const authorization = request.get("authorization");
  const match = authorization?.match(/^Bearer ([^\s]+)$/i);
  if (!match?.[1]) {
    return response.status(401).json({ message: "Admin authentication is required." });
  }

  try {
    const claims = tokens.verify(match[1]);
    if (!claims) {
      return response.status(401).json({ message: "The admin session is invalid or expired." });
    }

    request.admin = { id: claims.sub, email: claims.email };
    return next();
  } catch (error: unknown) {
    console.error("Admin token verification is unavailable:", error);
    return response.status(500).json({
      message: "Admin authentication is not configured on the server.",
    });
  }
};
