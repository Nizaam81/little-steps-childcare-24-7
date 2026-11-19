import type { AuthClaims } from "../services/auth-token.service.js";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthClaims;
      admin?: {
        id: string;
        email: string;
      };
    }
  }
}

export {};
