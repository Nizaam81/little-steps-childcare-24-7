import type { Request, Response } from "express";
import { authTokenService } from "../services/auth-token.service.js";

export class AuthController {
  session = async (request: Request, response: Response) => {
    if (!request.auth) {
      return response.status(401).json({ message: "Authentication is required." });
    }

    return response.status(200).json({
      user: {
        id: request.auth.sub,
        email: request.auth.email,
        role: request.auth.role,
      },
    });
  };

  refresh = async (request: Request, response: Response) => {
    const refreshToken = request.body?.refreshToken;
    if (typeof refreshToken !== "string" || !refreshToken) {
      return response.status(400).json({ message: "A refresh token is required." });
    }
    try {
      const session = await authTokenService.refreshSession(refreshToken);
      if (!session) {
        return response.status(401).json({ message: "The refresh token is invalid or expired." });
      }
      return response.status(200).json(session);
    } catch (error: unknown) {
      console.error("Token refresh failed:", error);
      return response.status(500).json({ message: "Unable to refresh the session right now." });
    }
  };

  logout = async (request: Request, response: Response) => {
    if (!request.auth) {
      return response.status(401).json({ message: "Authentication is required." });
    }
    try {
      await authTokenService.revokeSession(request.auth);
      return response.status(200).json({ message: "Logged out successfully." });
    } catch (error: unknown) {
      console.error("Session revocation failed:", error);
      return response.status(500).json({ message: "Unable to log out right now." });
    }
  };
}
